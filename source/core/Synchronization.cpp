/**
 
 Copyright (c) 2014 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

/*! \file
 \brief Native Vireo clump synchronizations and communication functions
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"

using namespace Vireo;

//------------------------------------------------------------
// Based on the underlying array, queues may be growable or bounded.
//
class QueueCore : public ObservableObject
{
private:
    TypedArrayCoreRef _elements;
    
    //! Index where the next element will be stored (may be one past end if full)
    IntIndex   _insert;
    
    //! How many elements are in the queue
    IntIndex   _count;
    
    IntIndex RemoveIndex();
public:
    void InitWaitableQueueState(WaitableState* pWS, Int64 elementsAvailable);
    Boolean Compress();
    Boolean TryMakeRoom(IntIndex length);
    Boolean Enqueue(void* pData);
    Boolean Dequeue(void* pData);
    Boolean HasRoom(IntIndex count);
    void ChangeCount(IntIndex count);
};

typedef Int32 CallSiteQueueState;
typedef TypedObject<QueueCore> QueueObject, *QueueRef;

//------------------------------------------------------------
void QueueCore::InitWaitableQueueState(WaitableState* pWS, Int64 elementsAvailable)
{
    // in MT, lock object
    pWS->_object = this;
    pWS->_info = elementsAvailable;
    pWS->_next = _waitingList;
    _waitingList = pWS;
}
//------------------------------------------------------------
IntIndex QueueCore::RemoveIndex()
{
    if (_count <= _insert) {
        return _insert - _count;
    } else {
        return _elements->Length() - (_count - _insert);
    }
}
//------------------------------------------------------------
Boolean QueueCore::TryMakeRoom(IntIndex additionalCount)
{
    IntIndex length = _elements->Length();
    IntIndex space = length - _count;
    
    if (space >= additionalCount) {
        // There is enough room, wrap the insert location as needed.
        if (_insert >= length) {
            _insert = 0;
        }
        return true;
    } else {
        // Not enough room, grow (if possible)
        NIError err = _elements->Insert1D(_insert, additionalCount);
        return (err == kNIError_Success);
    }
}
//------------------------------------------------------------
void QueueCore::ChangeCount(Int32 amount)
{
    WaitableState *pNext = null;
    WaitableState ** ppPrevious = &_waitingList;
    
    for (WaitableState* pWS = _waitingList; pWS; pWS = pNext) {
        pNext = pWS->_next;
        if (amount == pWS->_info) {
            THREAD_EXEC()->EnqueueRunQueue(pWS->_clump);
            // Remove the waiter from the list and enqueue it.
            *ppPrevious = pNext;
            pWS->_next = null;
        } else {
            ppPrevious = &pWS->_next;
        }
    }
}
//------------------------------------------------------------
Boolean QueueCore::Enqueue(void* pData)
{
    if (!TryMakeRoom(1))
        return false;

    TypeRef eltType = _elements->ElementType();
    void* pTarget = _elements->BeginAt(_insert);
    eltType->CopyData(pData, pTarget);
    _count++;
    _insert++;
    ChangeCount(1);
    return true;
}
//------------------------------------------------------------
Boolean QueueCore::Dequeue(void* pData)
{
    TypeRef eltType = _elements->ElementType();
    if (_count < 1) {
        eltType->InitData(pData);
        return false;
    } else {
        void* pSource = _elements->BeginAt(RemoveIndex());
        eltType->CopyData(pSource, pData);
        _count--;
        ChangeCount(-1);
        return true;
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(Queue_Obtain, void, StringRef)
{
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(Queue_EnqueueElement, QueueRef, void, Int32, Boolean)
{
    QueueCore *pQV = _Param(0)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();

    // If the instruction needs to retry it will use two WaitableState records
    // [0] is for the timer and
    // [1] is for the queue
    // These records are reserved if necessary in below. If none are reserved
    // then this is the primary execution of the instruction

    // First time or retry either way, attempt to enqueue value
    Boolean done = pQV->Enqueue(_ParamPointer(1));
    _Param(3) = !done;

    // If is succeeded or timed out then its time to move to the next instruction.
    WaitableState* pWS = clump->GetWaitStates(2);
    if (done || (pWS && pWS[0]._info == null)) {
        clump->ClearWaitStates();
        return _NextInstruction();
    }

    Int32 timeOut = _Param(2);
    if (pWS) {
        // This is a retry and another clump got the element but
        // there is still time to wait, continue waiting.
        return clump->WaitOnWaitStates(_this);
    } else if (timeOut != 0) {
        // This is the initial call and a timeout has been supplied.
        // Wait on the queue and the timeout. -1 will wait forever.
        pWS = clump->ReserveWaitStatesWithTimeout(2, PlatformTime::MillisecondsFromNowToTickCount(timeOut));
        pQV->InitWaitableQueueState(pWS+1, -1);
        return clump->WaitOnWaitStates(_this);
    } else {
        // With timeout == 0 just continue immediately.
        return _NextInstruction();
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(Queue_DequeueElement, QueueRef, void, Int32, Boolean)
{
    QueueCore *pQV = _Param(0)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    
    // If the instruction needs to retry it will use two WaitableState records
    // [0] is for the timer and
    // [1] is for the queue
    // These records are reserved if necessary in below. If none are reserved
    // then this is the primary execution of the instruction
    
    // First time or retry either way, attempt to dequeue value
    Boolean done = pQV->Dequeue(_ParamPointer(1));
    _Param(3) = !done;
    
    // If is succeeded or timed out then its time to move to the next instruction.
    WaitableState* pWS = clump->GetWaitStates(2);
    if (done || (pWS && pWS[0]._info == null)) {
        clump->ClearWaitStates();
        return _NextInstruction();
    }
    
    Int32 timeOut = _Param(2);
    if (pWS) {
        // This is a retry and another clump got the element but
        // there is still time to wait, continue waiting.
        return clump->WaitOnWaitStates(_this);
    } else if (timeOut != 0) {
        // This is the initial call and a timeout has been supplied.
        // Wait on the queue and the timeout. -1 will wait forever.
        pWS = clump->ReserveWaitStatesWithTimeout(2, PlatformTime::MillisecondsFromNowToTickCount(timeOut));
        pQV->InitWaitableQueueState(pWS+1, 1);
        return clump->WaitOnWaitStates(_this);
    } else {
        // With timeout == 0 just continue immediately.
        return _NextInstruction();
    }
}

DEFINE_VIREO_BEGIN(Synchronization)

//TODO type should be able to derive from observable state base class
DEFINE_VIREO_TYPE(QueueValue, "c(e(.DataPointer firstState)e(a(.$1 *)elements)e(.Int32 insert)e(.Int32 count))")
DEFINE_VIREO_TYPE(Queue, "a(.QueueValue)")

DEFINE_VIREO_FUNCTION_CUSTOM(Obtain, Queue_Obtain, "p(o(.Queue queue)i(.String name))")

DEFINE_VIREO_FUNCTION_CUSTOM(EnqueueElement, Queue_EnqueueElement, "p(io(.Queue queue)i(.* element)i(.Int32 timeOut)o(.Boolean timedOut))")
DEFINE_VIREO_FUNCTION_CUSTOM(DequeueElement, Queue_DequeueElement, "p(io(.Queue queue)o(.* element)i(.Int32 timeOut)o(.Boolean timedOut))")

//DEFINE_VIREO_FUNCTION_CUSTOM(EnqueueElement, Queue_EnqueueElement, "p(io(.Queue<.$1> queue)i(.$1 element)i(.Int32 timeOut)o(.Boolean timedOut))")
//DEFINE_VIREO_FUNCTION_CUSTOM(DequeueElement, Queue_DequeueElement, "p(io(.Queue<.$1> queue)o(.$1 element)i(.Int32 timeOut)o(.Boolean timedOut))")

//DEFINE_VIREO_FUNCTION_CUSTOM(EnqueueElementAtOppositeEnd, Queue_EnqueueElement,  "p(io(.Queue queue)i(.Double element))")
//DEFINE_VIREO_FUNCTION(LossyEnqueueElement, "")

#if 0
DEFINE_VIREO_FUNCTION(PreviewElement, "")
DEFINE_VIREO_FUNCTION(Status, "")
DEFINE_VIREO_FUNCTION(Release, "")
DEFINE_VIREO_FUNCTION(Flush, "")
#endif

DEFINE_VIREO_END()
