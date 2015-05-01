/**

 Copyright (c) 2014-2015 National Instruments Corp.

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
//! Insert an observer into the ObservableObject's list
void ObservableCore::InsertObserver(Observer* pObserver, IntMax info)
{
    // clump should be set up by now.
    VIREO_ASSERT(pObserver->_clump != null)

    // in MT, lock object
    pObserver->_object = this;
    pObserver->_info = info;
    pObserver->_next = _observerList;
    _observerList = pObserver;
}
//------------------------------------------------------------
//! Remove an observer from the ObservableObject's list
void ObservableCore::RemoveObserver(Observer* pObserver)
{
    VIREO_ASSERT(pObserver != null);
    VIREO_ASSERT(pObserver->_object == this);

    Observer* pTemp;
    Observer** pFix = &(_observerList); // previous next pointer to patch when removing element.
    Observer* pVisitor = *pFix;

    while(pVisitor) {
        VIREO_ASSERT(pVisitor->_clump != null)

        pTemp = pVisitor;
        if (pTemp == pObserver) {
            *pFix = pTemp->_next;
        } else {
            pFix = &pVisitor->_next;
        }
        pVisitor = *pFix;
    }

    pObserver->_info = 0;
    pObserver->_object = null;
    pObserver->_next = null;
}
//------------------------------------------------------------
//! Look in the waiting list for waiters that have a matching info.
void ObservableCore::ObserveStateChange(IntMax info)
{
    Observer *pNext = null;
    Observer ** ppPrevious = &_observerList;

    for (Observer* pObserver = _observerList; pObserver; pObserver = pNext) {
        pNext = pObserver->_next;
        if (info == pObserver->_info) {
            // Remove the waiter from the list and enqueue it.
            *ppPrevious = pNext;
            pObserver->_next = null;
            pObserver->_clump->EnqueueRunQueue();
        } else {
            ppPrevious = &pObserver->_next;
        }
    }
}
//------------------------------------------------------------
void Timer::CheckTimers(PlatformTickType t)
{
    Observer* pTemp;
    Observer* elt = _observerList;
    // pFix is previous next pointer to patch when removing element.
    Observer** pFix = &(_observerList);

    // Enqueue all elements that are ready to run
    while (elt) {
        pTemp = elt;
        if (pTemp->_info <= t) {
            // Remove
            *pFix = pTemp->_next;
            pTemp->_next = null;
            pTemp->_info = 0;
            pTemp->_clump->EnqueueRunQueue();
        } else {
            // Items are sorted at insertion, so once a time in the future
            // is found quit the loop.
            break;
        }
        elt = *pFix;
    }

#ifdef VIREO_SUPPORTS_ISR
    if (_triggeredIsrList) {
        VIREO_ISR_DISABLE
        elt = _triggeredIsrList;
        while (elt) {
            pClump = elt;
            elt = elt->_next;
            pClump->_next = null;
            pClump->_wakeUpInfo = 0;    // Put in known state.
            _runQueue.Enqueue(pClump);
        }
        _triggeredIsrList = null;
        VIREO_ISR_ENABLE
    }
#endif
}
//------------------------------------------------------------
void Timer::InitObservableTimerState(Observer* pObserver, PlatformTickType tickCount)
{
    pObserver->_object = this;
    pObserver->_info =  tickCount;
    if (_observerList == null) {
        VIREO_ASSERT(pObserver->_next == null)
        // No list, now there is one.
        _observerList = pObserver;
    } else {
        // Insert into the list based on wake-up time.
        Observer** pFix = &_observerList;
        Observer* pVisitor = *pFix;
        while (pVisitor && (tickCount > pVisitor->_info)) {
            pFix = &(pVisitor->_next);
            pVisitor = *pFix;
        }
        pObserver->_next = pVisitor;
        *pFix = pObserver;
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitMicroseconds, UInt32)
{
    PlatformTickType future = PlatformTime::MicrosecondsFromNowToTickCount(_Param(0));
    return THREAD_CLUMP()->WaitUntilTickCount(future, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitMilliseconds, UInt32)
{
    PlatformTickType future = PlatformTime::MillisecondsFromNowToTickCount(_Param(0));
    return THREAD_CLUMP()->WaitUntilTickCount(future, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitUntilMicroseconds, Int64)
{
    return THREAD_CLUMP()->WaitUntilTickCount(PlatformTime::MicrosecondsToTickCount(_Param(0)), _NextInstruction());
}
//------------------------------------------------------------
void OccurrenceCore::SetOccurrence()
{
    _setCount++;
    ObserveStateChange(_setCount);
}
//------------------------------------------------------------
Boolean OccurrenceCore::HasOccurred(Int32 count, Boolean ignorePrevious)
{
    if ((count - _setCount) > 0) {
        return true;
    } else if (ignorePrevious && count != _setCount) {
        return true;
    } else {
        return false;
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(WaitOnOccurrence, OccurrenceRef, Boolean, Int32, Int32)
{
    OccurrenceCore *pOcc = _Param(0)->ObjBegin();
    Boolean bIgnorePrevious = _Param(1);
    UInt32 msTimeout = _Param(2);

    if (!bIgnorePrevious && pOcc->HasOccurred(_Param(3), bIgnorePrevious)) {
        _Param(3) = pOcc->Count();
        return _NextInstruction();
    }

    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        PlatformTickType future = PlatformTime::MillisecondsFromNowToTickCount(msTimeout);
        pObserver = clump->ReserveObservationStatesWithTimeout(2, future);
        pOcc->InsertObserver(pObserver+1, pOcc->Count()+1);
        return clump->WaitOnObservableObject(_this);
    } else {
        // If it woke up because of timeout or occerrence..
        clump->ClearObservationStates();
        return _NextInstruction();
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(SetOccurrence, OccurrenceRef)
{
    OccurrenceCore *pOcc = _Param(0)->ObjBegin();
    pOcc->SetOccurrence();
    return _NextInstruction();
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
Boolean QueueCore::Enqueue(void* pData)
{
    if (!TryMakeRoom(1))
        return false;

    TypeRef eltType = _elements->ElementType();
    void* pTarget = _elements->BeginAt(_insert);
    eltType->CopyData(pData, pTarget);
    _count++;
    _insert++;
    ObserveStateChange(1);
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
        ObserveStateChange(-1);
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

    // If the instruction needs to retry it will use two Observer records
    // [0] is for the timer and
    // [1] is for the queue
    // These records are reserved if necessary in below. If none are reserved
    // then this is the primary execution of the instruction

    // First time or retry either way, attempt to enqueue value
    Boolean done = pQV->Enqueue(_ParamPointer(1));
    _Param(3) = !done;

    // If is succeeded or timed out then its time to move to the next instruction.
    Observer* pObserver = clump->GetObservationStates(2);
    if (done || (pObserver && pObserver[0]._info == null)) {
        clump->ClearObservationStates();
        return _NextInstruction();
    }

    Int32 timeOut = _Param(2);
    if (pObserver) {
        // This is a retry and another clump got the element but
        // there is still time to wait, continue waiting.
        return clump->WaitOnObservableObject(_this);
    } else if (timeOut != 0) {
        // This is the initial call and a timeout has been supplied.
        // Wait on the queue and the timeout. -1 will wait forever.
        pObserver = clump->ReserveObservationStatesWithTimeout(2, PlatformTime::MillisecondsFromNowToTickCount(timeOut));
        pQV->InsertObserver(pObserver+1, -1);
        return clump->WaitOnObservableObject(_this);
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

    // If the instruction needs to retry it will use two Observer records
    // [0] is for the timer and
    // [1] is for the queue
    // These records are reserved if necessary in below. If none are reserved
    // then this is the primary execution of the instruction

    // First time or retry either way, attempt to dequeue value
    Boolean done = pQV->Dequeue(_ParamPointer(1));
    _Param(3) = !done;

    // If is succeeded or timed out then its time to move to the next instruction.
    Observer* pObserver = clump->GetObservationStates(2);
    if (done || (pObserver && pObserver[0]._info == null)) {
        clump->ClearObservationStates();
        return _NextInstruction();
    }

    Int32 timeOut = _Param(2);
    if (pObserver) {
        // This is a retry and another clump got the element but
        // there is still time to wait, continue waiting.
        return clump->WaitOnObservableObject(_this);
    } else if (timeOut != 0) {
        // This is the initial call and a timeout has been supplied.
        // Wait on the queue and the timeout. -1 will wait forever.
        pObserver = clump->ReserveObservationStatesWithTimeout(2, PlatformTime::MillisecondsFromNowToTickCount(timeOut));
        pQV->InsertObserver(pObserver+1, 1);
        return clump->WaitOnObservableObject(_this);
    } else {
        // With timeout == 0 just continue immediately.
        return _NextInstruction();
    }
}

DEFINE_VIREO_BEGIN(Synchronization)

    // Timers
    DEFINE_VIREO_FUNCTION(WaitMilliseconds, "p(i(.UInt32))")
    DEFINE_VIREO_FUNCTION(WaitUntilMicroseconds, "p(i(.Int64))")
    DEFINE_VIREO_FUNCTION(WaitMicroseconds, "p(i(.UInt32))")

#if 0
    // Occurrences
    DEFINE_VIREO_TYPE(OccurrenceValue, "c(e(.DataPointer firstState)e(.Int32 setCount)")
    DEFINE_VIREO_TYPE(Occurrence, "a(.OccurrenceValue)")
#endif
    DEFINE_VIREO_FUNCTION(WaitOnOccurrence, "p(i(.Occurrence)i(.Boolean ignorePrevious)i(.Int32 timeout)s(.Int32 staticCount))")
    DEFINE_VIREO_FUNCTION(SetOccurrence, "p(i(.Occurrence))")

    // Queues
    DEFINE_VIREO_TYPE(QueueValue, "c(e(.DataPointer firstState)e(a(.$0 $1)elements)e(.Int32 insert)e(.Int32 count))")
    DEFINE_VIREO_TYPE(Queue, "a(.QueueValue)")

    DEFINE_VIREO_FUNCTION_CUSTOM(Obtain, Queue_Obtain, "p(o(.Queue queue)i(.String name))")

    DEFINE_VIREO_FUNCTION_CUSTOM(EnqueueElement, Queue_EnqueueElement, "p(io(.Queue queue)i(.* element)i(.Int32 timeOut)o(.Boolean timedOut))")
    DEFINE_VIREO_FUNCTION_CUSTOM(DequeueElement, Queue_DequeueElement, "p(io(.Queue queue)o(.* element)i(.Int32 timeOut)o(.Boolean timedOut))")

    // DEFINE_VIREO_FUNCTION_CUSTOM(EnqueueElement, Queue_EnqueueElement, "p(io(.Queue<.$1> queue)i(.$1 element)i(.Int32 timeOut)o(.Boolean timedOut))")
    // DEFINE_VIREO_FUNCTION_CUSTOM(DequeueElement, Queue_DequeueElement, "p(io(.Queue<.$1> queue)o(.$1 element)i(.Int32 timeOut)o(.Boolean timedOut))")

    // DEFINE_VIREO_FUNCTION_CUSTOM(EnqueueElementAtOppositeEnd, Queue_EnqueueElement,  "p(io(.Queue queue)i(.Double element))")
    // DEFINE_VIREO_FUNCTION(LossyEnqueueElement, "")

    #if 0
    DEFINE_VIREO_FUNCTION(PreviewElement, "")
    DEFINE_VIREO_FUNCTION(Status, "")
    DEFINE_VIREO_FUNCTION(Release, "")
    DEFINE_VIREO_FUNCTION(Flush, "")
    #endif

DEFINE_VIREO_END()
