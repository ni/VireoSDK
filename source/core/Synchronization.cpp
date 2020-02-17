// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief Native Vireo clump synchronizations and communication functions
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "RefNum.h"
#include <map>
#include <deque>

namespace Vireo {

//------------------------------------------------------------
//! Insert an observer into the ObservableObject's list
void ObservableCore::InsertObserver(Observer* pObserver, IntMax info)
{
    // clump should be set up by now.
    VIREO_ASSERT(pObserver->_clump != nullptr)
    // in MT, lock object
    if (_observerList) {  // add to end for scheduling fairness
        Observer* pVisitor = _observerList;
        while (pVisitor->_next) {  // O(n), but observerList should be short
            pVisitor = pVisitor->_next;
        }
        pVisitor->_next = pObserver;
        pObserver->_next = nullptr;
    } else {
        pObserver->_next = _observerList;
        _observerList = pObserver;
    }
    pObserver->_object = this;
    pObserver->_info = info;
}
//------------------------------------------------------------
//! Remove an observer from the ObservableObject's list
void ObservableCore::RemoveObserver(Observer* pObserver)
{
    VIREO_ASSERT(pObserver != nullptr);
    VIREO_ASSERT(pObserver->_object == this);

    Observer* pTemp;
    Observer** pFix = &(_observerList);  // previous next pointer to patch when removing element.
    Observer* pVisitor = *pFix;

    while (pVisitor) {
        VIREO_ASSERT(pVisitor->_clump != nullptr)

        pTemp = pVisitor;
        if (pTemp == pObserver) {
            *pFix = pTemp->_next;
        } else {
            pFix = &pVisitor->_next;
        }
        pVisitor = *pFix;
    }

    pObserver->_info = 0;
    pObserver->_object = nullptr;
    pObserver->_next = nullptr;
}
//------------------------------------------------------------
//! Look in the waiting list for waiters that have a matching info.
void ObservableCore::ObserveStateChange(IntMax info, Boolean wakeAll)
{
    Observer *pNext = nullptr;
    Observer ** ppPrevious = &_observerList;

    for (Observer* pObserver = _observerList; pObserver; pObserver = pNext) {
        pNext = pObserver->_next;
        if (info == pObserver->_info) {
            // Remove the waiter from the list and enqueue it.
            *ppPrevious = pNext;
            pObserver->_next = nullptr;
            pObserver->_clump->EnqueueRunQueue();
            // Every Observable that can trigger state changes has an associated timer owned by the clump.
            // Cancel it so it doesn't race with this and possibly Enqueue the clump a second time.
            VIREO_ASSERT((pObserver->_clump->_observationCount == 2 && pObserver == &pObserver->_clump->_observationStates[1]))
            pObserver->_clump->TheExecutionContext()->_timer.RemoveObserver(&pObserver->_clump->_observationStates[0]);
            if (!wakeAll)
                break;  // only enqueue first one found
        } else {
            ppPrevious = &pObserver->_next;
        }
    }
}

IntIndex ObservableCore::ObserverCount(IntMax info) const {
    IntIndex count = 0;
    for (Observer* pObserver = _observerList; pObserver; pObserver = pObserver->_next) {
        if (pObserver->_info == info)
            ++count;
    }
    return count;
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
            pTemp->_next = nullptr;
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
            pClump->_next = nullptr;
            pClump->_wakeUpInfo = 0;    // Put in known state.
            _runQueue.Enqueue(pClump);
        }
        _triggeredIsrList = nullptr;
        VIREO_ISR_ENABLE
    }
#endif
}
//------------------------------------------------------------
void Timer::InitObservableTimerState(Observer* pObserver, PlatformTickType tickCount)
{
    pObserver->_object = this;
    pObserver->_info =  tickCount;
    if (_observerList == nullptr) {
        VIREO_ASSERT(pObserver->_next == nullptr)
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

enum TimerValueResolutionEnum {
    kTimerValueResolution_UInt32 = 0,
    kTimerValueResolution_UInt16,
    kTimerValueResolution_UInt8
};

//------------------------------------------------------------
bool SetTimerValueWithResolution(void *timerValue, TimerValueResolutionEnum timerValueResolution, PlatformTickType value)
{
    bool success = true;
    if (timerValue) {
        switch (timerValueResolution) {
            case kTimerValueResolution_UInt32:
                *(UInt32*)timerValue = (UInt32)value;
                break;
            case kTimerValueResolution_UInt16:
                *(UInt16*)timerValue = (UInt16)value;
                break;
            case kTimerValueResolution_UInt8:
                *(UInt8*)timerValue = (UInt8)value;
                break;
            default:
                success = false;
        }
    }
    return success;
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE WaitTickCountImplementation(UInt32 wait, void *timerValue,
    TimerValueResolutionEnum timerValueResolution, InstructionCore* nextInstruction)
{
    PlatformTickType future = gPlatform.Timer.TickCount() + wait;
    if (!SetTimerValueWithResolution(timerValue, timerValueResolution, future)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Unable to set Timer Value on WaitTickCountImplementation.");
        return THREAD_EXEC()->Stop();
    }
    return THREAD_CLUMP()->WaitUntilTickCount(future, nextInstruction);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitTickCount, UInt32)
{
    return WaitTickCountImplementation(_Param(0), nullptr, kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitTickCountUInt32, UInt32, UInt32)
{
    return WaitTickCountImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitTickCountUInt16, UInt16, UInt16)
{
    return WaitTickCountImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt16, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitTickCountUInt8, UInt8, UInt8)
{
    return WaitTickCountImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt8, _NextInstruction());
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE WaitMicrosecondsImplementation(UInt32 wait, void *timerValue,
    TimerValueResolutionEnum timerValueResolution, InstructionCore* nextInstruction)
{
    PlatformTickType future = gPlatform.Timer.MicrosecondsFromNowToTickCount(wait);
    if (!SetTimerValueWithResolution(timerValue, timerValueResolution, gPlatform.Timer.TickCountToMicroseconds(future))) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Unable to set Timer Value on WaitMicrosecondsImplementation.");
        return THREAD_EXEC()->Stop();
    }
    return THREAD_CLUMP()->WaitUntilTickCount(future, nextInstruction);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitMicroseconds, UInt32)
{
    return WaitMicrosecondsImplementation(_Param(0), nullptr, kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitMicrosecondsUInt32, UInt32, UInt32)
{
    return WaitMicrosecondsImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitMicrosecondsUInt16, UInt16, UInt16)
{
    return WaitMicrosecondsImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt16, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitMicrosecondsUInt8, UInt8, UInt8)
{
    return WaitMicrosecondsImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt8, _NextInstruction());
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE WaitMillisecondsImplementation(UInt32 wait, void *timerValue,
    TimerValueResolutionEnum timerValueResolution, InstructionCore* nextInstruction)
{
    PlatformTickType future = gPlatform.Timer.MillisecondsFromNowToTickCount(wait);
    if (!SetTimerValueWithResolution(timerValue, timerValueResolution, gPlatform.Timer.TickCountToMilliseconds(future))) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Unable to set Timer Value on WaitMillisecondsImplementation.");
        return THREAD_EXEC()->Stop();
    }
    return THREAD_CLUMP()->WaitUntilTickCount(future, nextInstruction);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitMilliseconds, UInt32)
{
    return WaitMillisecondsImplementation(_Param(0), nullptr, kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitMillisecondsUInt32, UInt32, UInt32)
{
    return WaitMillisecondsImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitMillisecondsUInt16, UInt16, UInt16)
{
    return WaitMillisecondsImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt16, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitMillisecondsUInt8, UInt8, UInt8)
{
    return WaitMillisecondsImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt8, _NextInstruction());
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitUntilMicroseconds, Int64)
{
    return THREAD_CLUMP()->WaitUntilTickCount(gPlatform.Timer.MicrosecondsToTickCount(_Param(0)), _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE WaitUntilTickCountMultipleImplementation(UInt32 tickMultiple, void *timerValue,
    TimerValueResolutionEnum timerValueResolution, InstructionCore* nextInstruction)
{
    if (tickMultiple == 0) {
        // This is supposed to yield immediately, but the unrolling in the execloop defeats this
        THREAD_EXEC()->ClearBreakout();
        return nextInstruction;
    }
    PlatformTickType nowTick = gPlatform.Timer.TickCount();
    PlatformTickType future = ((nowTick + tickMultiple) / tickMultiple) * tickMultiple;
    if (!SetTimerValueWithResolution(timerValue, timerValueResolution, future)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Unable to set Timer Value on WaitUntilTickCountMultipleImplementation.");
        return THREAD_EXEC()->Stop();
    }
    return THREAD_CLUMP()->WaitUntilTickCount(future, nextInstruction);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilTickCountMultiple, UInt32, UInt32)
{
    return WaitUntilTickCountMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilTickCountMultipleUInt16, UInt16, UInt16)
{
    return WaitUntilTickCountMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt16, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilTickCountMultipleUInt8, UInt8, UInt8)
{
    return WaitUntilTickCountMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt8, _NextInstruction());
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE WaitUntilMicrosecondsMultipleImplementation(UInt32 usMultiple, void *timerValue,
    TimerValueResolutionEnum timerValueResolution, InstructionCore* nextInstruction)
{
    if (usMultiple == 0) {
        // This is supposed to yield immediately, but the unrolling in the execloop defeats this
        THREAD_EXEC()->ClearBreakout();
        return nextInstruction;
    }
    Int64 nowUS = gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
    Int64 nextUS = ((nowUS + usMultiple) / usMultiple) * usMultiple;
    PlatformTickType future = gPlatform.Timer.MicrosecondsToTickCount(nextUS);
    if (!SetTimerValueWithResolution(timerValue, timerValueResolution, nextUS)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Unable to set Timer Value on WaitUntilMicrosecondsMultipleImplementation.");
        return THREAD_EXEC()->Stop();
    }
    return THREAD_CLUMP()->WaitUntilTickCount(future, nextInstruction);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilMicrosecondsMultiple, UInt32, UInt32)
{
    return WaitUntilMicrosecondsMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilMicrosecondsMultipleUInt16, UInt16, UInt16)
{
    return WaitUntilMicrosecondsMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt16, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilMicrosecondsMultipleUInt8, UInt8, UInt8)
{
    return WaitUntilMicrosecondsMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt8, _NextInstruction());
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE WaitUntilMillisecondsMultipleImplementation(UInt32 msMultiple, void *timerValue,
    TimerValueResolutionEnum timerValueResolution, InstructionCore* nextInstruction)
{
    if (msMultiple == 0) {
        // This is supposed to yield immediately, but the unrolling in the execloop defeats this
        THREAD_EXEC()->ClearBreakout();
        return nextInstruction;
    }
    Int64 nowMS = gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
    Int64 nextMS = ((nowMS + msMultiple) / msMultiple) * msMultiple;
    PlatformTickType future = gPlatform.Timer.MicrosecondsToTickCount(nextMS * 1000);
    if (!SetTimerValueWithResolution(timerValue, timerValueResolution, nextMS)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Unable to set Timer Value on WaitUntilMillisecondsMultipleImplementation.");
        return THREAD_EXEC()->Stop();
    }
    return THREAD_CLUMP()->WaitUntilTickCount(future, nextInstruction);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilMillisecondsMultiple, UInt32, UInt32)
{
    return WaitUntilMillisecondsMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt32, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilMillisecondsMultipleUInt16, UInt16, UInt16)
{
    return WaitUntilMillisecondsMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt16, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(WaitUntilMillisecondsMultipleUInt8, UInt8, UInt8)
{
    return WaitUntilMillisecondsMultipleImplementation(_Param(0), _ParamPointer(1), kTimerValueResolution_UInt8, _NextInstruction());
}

//------------------------------------------------------------
void OccurrenceCore::SetOccurrence()
{
    _setCount++;
    ObserveStateChange(_setCount, true);
}
//------------------------------------------------------------
Boolean OccurrenceCore::HasOccurred(Int32 count, Boolean ignorePrevious) const
{
    if ((_setCount - count) > 0) {
        return true;
    } else if (ignorePrevious && count != _setCount) {
        return true;
    } else {
        return false;
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(WaitOnOccurrence, OccurrenceRef, Boolean, Int32, Boolean, Int32)
{
    OccurrenceRef *ref = _ParamPointer(0);
    Boolean bIgnorePrevious = _Param(1);
    UInt32 msTimeout = _ParamPointer(2) ? _Param(2) : -1;
    Boolean *pTimedOut = _ParamPointer(3);
    Int32 *pStaticCount = _ParamPointer(4);
    OccurrenceCore *pOcc = (*ref)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);

    if (!bIgnorePrevious && pOcc->HasOccurred(*pStaticCount, bIgnorePrevious)) {
        // We don't need to allocate an observer if the occurrence already went off (and we care)
    } else if (!pObserver) {
        PlatformTickType future = msTimeout > 0 ? gPlatform.Timer.MillisecondsFromNowToTickCount(msTimeout) : 0;
        pObserver = clump->ReserveObservationStatesWithTimeout(2, future);
        pOcc->InsertObserver(pObserver+1, pOcc->Count()+1);
        return clump->WaitOnObservableObject(_this);
    }
    // If it woke up because of timeout or occurrence..
    *pStaticCount = pOcc->Count();
    if (pTimedOut)
        *pTimedOut = (pOcc->_observerList != nullptr);  // observer has been cleared if occurrence actually went off
    clump->ClearObservationStates();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(SetOccurrence, OccurrenceRef)
{
    OccurrenceCore *pOcc = _Param(0)->ObjBegin();
    pOcc->SetOccurrence();
    return _NextInstruction();
}

enum QueueObserverInfoSentinel { kQueueEnqueueObserverInfo = -1, kQueueDequeueObserverInfo = 1 };

//------------------------------------------------------------
Boolean QueueCore::HasRoom(IntIndex additionalCount) const {
    IntIndex length = _elements->Length();

    return (_maxSize > 0 && length + additionalCount <= _maxSize);
}

void QueueCore::CopyDataToQueueElement(IntIndex position, void *pData)
{
    TypeRef eltType = _elements->ElementType();
    VIREO_ASSERT(position < _elements->Length());
    void* pTarget = _elements->BeginAt(position);
    eltType->CopyData(pData, pTarget);
    _count++;
    VIREO_ASSERT(_count <= _elements->Length());
    VIREO_ASSERT(_maxSize < 0 || _count <= _maxSize);
}

Boolean QueueCore::ResizeInternalBufferIfEmpty() const
{
    VIREO_ASSERT(_front == -1 && _back == -1 && _count == 0);
    if (_elements->Length() == 0) {  // _maxSize must be at least 1 or negative, so grow
        NIError err = _elements->Insert1D(0, 1);
        if (err != kNIError_Success) {
            return false;
        }
    }
    return true;
}

//------------------------------------------------------------
// Insert at the back of queue
Boolean QueueCore::Enqueue(void* pData)
{
    VIREO_ASSERT(_maxSize > 0 || _maxSize == -1);
    if (_back == -1) {
        if (!ResizeInternalBufferIfEmpty()) {
            return false;
        }
        _back = _front = 0;

    } else {
        IntIndex insert = (_back + 1) % _elements->Length();
        if (insert != _front) {
            _back = insert;
        } else {  // Array full
            VIREO_ASSERT(_count == _elements->Length());
            if (_maxSize > 0 && _count == _maxSize)
                return false;
            if (insert == 0) {
                // Just an optimization to grow the underlying array at the end than shifting all the elements by 1
                insert = _elements->Length();
            }
            NIError err = _elements->Insert1D(insert, 1);
            if (err != kNIError_Success) {
                return false;
            }
            _back = insert;
            if (_front >= _back) {
                ++_front;
            }
        }
        VIREO_ASSERT(_back != _front);
    }

    CopyDataToQueueElement(_back, pData);
    ObserveStateChange(kQueueDequeueObserverInfo, false);  // wake waiting dequeues
    return true;
}

//------------------------------------------------------------
// Insert at front of queue instead of end
Boolean QueueCore::PushFront(void* pData)
{
    VIREO_ASSERT(_maxSize > 0 || _maxSize == -1);
    if (_front == -1) {
        if (!ResizeInternalBufferIfEmpty()) {
            return false;
        }
        _back = _front = 0;
    } else {
        IntIndex insert;
        if (_front == 0)
            insert = _elements->Length() - 1;
        else
            insert = _front - 1;
        if (insert != _back) {
            _front = insert;
        } else {  // Array full
            VIREO_ASSERT(_count == _elements->Length());
            if (_maxSize > 0 && _count == _maxSize)
                return false;
            IntIndex actualInsertPos = (insert + 1) % _elements->Length();
            NIError err = _elements->Insert1D(actualInsertPos, 1);
            if (err != kNIError_Success) {
                return false;
            }

            if (_front == _back) {
                _front = insert;
            } else {
                _front = actualInsertPos;
            }
            if (_back >= _front) {
                ++_back;
            }
        }
        VIREO_ASSERT(_back != _front);
    }
    CopyDataToQueueElement(_front, pData);
    ObserveStateChange(kQueueDequeueObserverInfo, false);  // wake waiting dequeues
    return true;
}

//------------------------------------------------------------
// Remove at the front of the queue
Boolean QueueCore::Dequeue(void* pData, bool skipObserver)
{
    VIREO_ASSERT(_maxSize > 0 || _maxSize == -1);
    TypeRef eltType = _elements->ElementType();
    if (_front == -1) {
        VIREO_ASSERT(_back == -1 && _count == 0);
        if (pData)
            eltType->InitData(pData);
        return false;
    }
    VIREO_ASSERT(_front < _elements->Length());
    void* pSource = _elements->BeginAt(_front);
    if (pData)
        eltType->CopyData(pSource, pData);
    if (_front == _back) {
        _front = _back = -1;
        VIREO_ASSERT(_count == 1);
    } else {
        _front = (_front + 1) % _elements->Length();
    }
    _count--;
    VIREO_ASSERT(_count <= _elements->Length());
    VIREO_ASSERT(_maxSize < 0 || _count <= _maxSize);
    if (!skipObserver)
        ObserveStateChange(kQueueEnqueueObserverInfo, false);
    return true;
}

//------------------------------------------------------------
Boolean QueueCore::Peek(void* pData, IntIndex index) const
{
    VIREO_ASSERT(_maxSize > 0 || _maxSize == -1);
    VIREO_ASSERT(index <= _count);
    TypeRef eltType = _elements->ElementType();
    if (_front == -1) {
        VIREO_ASSERT(_back == -1);
        VIREO_ASSERT(_count == 0);
        if (pData)
            eltType->InitData(pData);
        return false;
    }
    if (index >= _count) {
        if (pData)
            eltType->InitData(pData);
        return false;
    }
    IntIndex peekPos = (_front + index) % _elements->Length();
    void* pSource = _elements->BeginAt(peekPos);
    if (pData)
        eltType->CopyData(pSource, pData);
    return true;
}

class QueueRefNumManager : public RefNumManager {
 private:
    typedef TypedRefNum<QueueRef, true> QueueRefNumType;
    QueueRefNumType _QueueRefNumTypeStorage;  // manages refnum storage
    static QueueRefNumManager _s_singleton;

 public:
    typedef std::map<StringRef, RefNum, StringRefCmp> NamedRefNumMapType;

 private:
    typedef std::map<RefNum, RefNum> RefnumAliasMapType;
    NamedRefNumMapType _namedRefMap;
    RefnumAliasMapType _refAliasMap;

 public:
    static QueueRefNumManager &QueueRefManager() { return _s_singleton; }
    static QueueRefNumType &RefNumStorage() { return _s_singleton.RefNumManager(); }

    QueueRefNumType &RefNumManager() { return _QueueRefNumTypeStorage; }
    NamedRefNumMapType &NamedRefNumMap() { return _namedRefMap; }
    RefNum NewRefnumAlias(RefNum refnum);
    RefNum LookupAlias(RefNum refnum);
    bool DisposeAlias(RefNum refnum, StringRef *rQueueName);  // returns name string if alias was a named queue
    NIError LookupQueueRef(RefNum refnum, QueueRef *queueRefPtr);
};

QueueRefNumManager QueueRefNumManager::_s_singleton;
static void GetQueueRefName(RefNum refnum, StringRef *stringRef, bool deleting);

RefNum QueueRefNumManager::NewRefnumAlias(RefNum refnum)
{
    if (_QueueRefNumTypeStorage.AcquireRefNumRights(refnum, nullptr)) {  // increase ref count
        RefNum newRefnum = _QueueRefNumTypeStorage.CloneRefNum(refnum);
        while (_refAliasMap.find(newRefnum) != _refAliasMap.end())  // make sure unique
            newRefnum = _QueueRefNumTypeStorage.CloneRefNum(newRefnum);
        _refAliasMap[newRefnum] = refnum;
        return newRefnum;
    }
    return kNotARefNum;
}
RefNum QueueRefNumManager::LookupAlias(RefNum refnum) {
    RefnumAliasMapType::iterator it = _refAliasMap.find(refnum);
    if (it != _refAliasMap.end()) {
        return it->second;
    }
    return refnum;
}
// If refnum is an alias, delete its refcount and if it reaches 1, dispose it. Optionally return its name.
// Return false if refnum was not an alias
bool QueueRefNumManager::DisposeAlias(RefNum refnum, StringRef *rQueueName)
{
    RefnumAliasMapType::iterator it = _refAliasMap.find(refnum);
    if (it != _refAliasMap.end()) {
        RefNum realRefnum = it->second;
        if (_QueueRefNumTypeStorage.ReleaseRefNumRights(realRefnum) <= 2) {  // decrease ref count
            QueueRef queueRef = nullptr;
            GetQueueRefName(refnum, rQueueName, true);
            if (_QueueRefNumTypeStorage.DisposeRefNum(realRefnum, &queueRef) == kNIError_Success) {
                QueueCore *pQV = queueRef->ObjBegin();
                if (pQV)
                    pQV->Type()->ClearData(&queueRef);
            }
        } else if (rQueueName) {
            GetQueueRefName(refnum, rQueueName, false);
        }
        _refAliasMap.erase(refnum);
        return true;
    }
    return false;
}
NIError QueueRefNumManager::LookupQueueRef(RefNum refnum, QueueRef *queueRefPtr)
{
    RefnumAliasMapType::iterator it = _refAliasMap.find(refnum);
    if (it != _refAliasMap.end())
        refnum = it->second;
    NIError err = RefNumManager().GetRefNumData(refnum, queueRefPtr);
    return err;
}

// Get the underlying array type from the RefNum Queue template type
static inline TypeRef GetQueueArrayTypeRef(TypeRef type) {
    TypeRef clustType = type ? type->GetSubElement(0) : nullptr;
    TypeRef queueType = clustType ? clustType->GetSubElement(1) : nullptr;
    return queueType;
}

// Get the underlying base element type from the RefNum Queue template type
static inline TypeRef GetQueueElemTypeRef(TypeRef type) {
    TypeRef qtype = GetQueueArrayTypeRef(type);
    return qtype ? qtype->GetSubElement(0) : nullptr;
}

// Cleanup Proc for disposing queue refnums when top-level VI finishes
static void CleanUpQueueRefNum(intptr_t arg) {
    RefNum refnum = RefNum(arg);
    QueueRef queueRef = nullptr;
    if (QueueRefNumManager::QueueRefManager().DisposeAlias(refnum, nullptr)) {
        // was a named clone
    } else if (QueueRefNumManager::RefNumStorage().DisposeRefNum(refnum, &queueRef) == kNIError_Success) {
        QueueCore *pQV = queueRef->ObjBegin();
        if (pQV)
            pQV->Type()->ClearData(&queueRef);
    }
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE7(QueueRef_Obtain, TypeCommon, RefNumVal, Int32, StringRef, Boolean, Boolean, ErrorCluster)
{
    Int32 maxSize = _ParamPointer(2) && _Param(2) >= 0 ? _Param(2) : -1;
    Int32 errCode = 0;
    Boolean create = _ParamPointer(4) ? _Param(4) : true;
    Boolean *createdPtr = _ParamPointer(5);
    StringRef name = _ParamPointer(3) ? _Param(3) : nullptr;
    RefNumVal* refnumPtr = _ParamPointer(1);
    RefNum refnumVal = 0;
    QueueRef queueRef = nullptr;

    if (name && name->Length() == 0)
        name = nullptr;
    ErrorCluster *errPtr = _ParamPointer(6);
    if (errPtr && errPtr->status) {
        if (refnumPtr)
            refnumPtr->SetRefNum(0);
        if (createdPtr)
            *createdPtr = false;
        return _NextInstruction();
    }
    TypeRef type = refnumPtr ? _ParamPointer(0)->GetSubElement(0) : nullptr;
    TypeRef queueType = refnumPtr ? GetQueueArrayTypeRef(type) : nullptr;

    if (!refnumPtr) {
        errCode = kQueueArgErr;
    } else if (name) {
        // see if named queue already exists
        QueueRefNumManager::NamedRefNumMapType::iterator it = QueueRefNumManager::QueueRefManager().NamedRefNumMap().find(name);
        if (it != QueueRefNumManager::QueueRefManager().NamedRefNumMap().end()) {
            if (QueueRefNumManager::RefNumStorage().GetRefNumData(it->second, &queueRef) == kNIError_Success) {
                TypeRef namedQueueType = queueRef->ObjBegin()->EltType();
                TypeRef newQueueType = queueType->GetSubElement(0);
                if (newQueueType->CompareType(namedQueueType))
                    refnumVal = it->second;
                else
                    errCode = kQueueNameTypeMismatch;
            }
        }
    }
    if (!errCode && name && !refnumVal && !create)
        errCode = kQueueNoSuchName;
    else if (maxSize == 0)
        errCode = kQueueZeroSize;

    if (!errCode) {
        NIError status = type->InitData((void*)&queueRef, (TypeRef)nullptr);
        if (status == kNIError_Success) {
            if (!refnumVal) {
                refnumVal = QueueRefNumManager::RefNumStorage().NewRefNum(&queueRef);
                if (!refnumVal) {
                    errCode = kQueueMemFull;
                } else {
                    QueueCore *pQV = queueRef->ObjBegin();
                    pQV->SetMaxSize(maxSize);  // maxSize non-zero, checked above
                    pQV->Initialize();

                    if (createdPtr)
                        *createdPtr = true;
                    if (name) {
                        // Make a copy of the given name by detaching from a stack variable, so we own it
                        // It will be freed by DisposeAlias/GetQueueRefName when the refnum is released or cleaned up.
                        STACK_VAR(String, tempReturn);
                        StringRef nameCopy = tempReturn.DetachValue();
                        nameCopy->Append(name->Length(), name->Begin());
                        QueueRefNumManager::QueueRefManager().NamedRefNumMap()[nameCopy] = refnumVal;
                        refnumVal = QueueRefNumManager::QueueRefManager().NewRefnumAlias(refnumVal);
                    }
                }
            } else {  // must be named to already have refnumVal defined, create alias
                refnumVal = QueueRefNumManager::QueueRefManager().NewRefnumAlias(refnumVal);
            }
            if (refnumPtr)
                refnumPtr->SetRefNum(refnumVal);
            VirtualInstrument* vi = THREAD_CLUMP()->TopVI();
            QueueRefNumManager::AddCleanupProc(vi, CleanUpQueueRefNum, refnumVal);
        } else {
            errCode = kQueueMemFull;
        }
    }
    if (errCode) {
        if (refnumPtr)
            refnumPtr->SetRefNum(0);
        if (createdPtr)
            *createdPtr = false;
        if (errPtr)
            errPtr->SetErrorAndAppendCallChain(true, errCode, "ObtainQueue");
    }
    return _NextInstruction();
}
static void GetQueueRefName(RefNum refnum, StringRef *stringRef, bool deleting) {
    if (refnum) {
        RefNum realRefnum = QueueRefNumManager::QueueRefManager().LookupAlias(refnum);
        QueueRefNumManager::NamedRefNumMapType::iterator it = QueueRefNumManager::QueueRefManager().NamedRefNumMap().begin(),
            ite = QueueRefNumManager::QueueRefManager().NamedRefNumMap().end();
        while (it != ite) {
            if (it->second == realRefnum)
                break;
            ++it;
        }
        if (stringRef && *stringRef) {
            if (it != ite)
                (*stringRef)->Type()->CopyData(&it->first, stringRef);
            else
                (*stringRef)->Resize1D(0);
        }
        if (deleting && it != ite) {
            StringRef key = it->first;
            QueueRefNumManager::QueueRefManager().NamedRefNumMap().erase(it);
            key->Type()->ClearData(&key);
        }
    } else if (stringRef && *stringRef) {
        (*stringRef)->Resize1D(0);
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(QueueRef_Release, TypeCommon, RefNumVal, StringRef, TypedArrayCoreRef, ErrorCluster)
{
    RefNumVal* refnumPtr = _ParamPointer(1);
    ErrorCluster *errPtr = _ParamPointer(4);
    QueueRef queueRef = nullptr;

    VIREO_ASSERT(refnumPtr != nullptr);
    bool isValidRefnum = (QueueRefNumManager::QueueRefManager().LookupQueueRef(refnumPtr->GetRefNum(), &queueRef) == kNIError_Success) && queueRef;
    bool isInputError = errPtr && errPtr->status;
    if (isInputError || !isValidRefnum) {
        if (_ParamPointer(3) != nullptr) {
            _Param(3)->Resize1D(0);
        }
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, kQueueArgErr, "ReleaseQueue");
        return _NextInstruction();
    }

    TypeRef type = _ParamPointer(0)->GetSubElement(0);
    QueueCore *pQV = nullptr;
    if (isValidRefnum) {
        pQV = queueRef->ObjBegin();
    }
    if (_ParamPointer(3)) {  // elements array
        if (pQV) {
            IntIndex count = pQV->Count();
            _Param(3)->Resize1D(count);
            AQBlock1 *pData = _Param(3)->BeginAt(0);
            Int32 eltSize = pQV->EltType()->TopAQSize();
            for (IntIndex i = 0; i < count; ++i) {
                pQV->Peek(pData, i);
                pData = (AQBlock1*)pData + eltSize;
            }
        } else {
            _Param(3)->Resize1D(0);
        }
    }
    if (QueueRefNumManager::QueueRefManager().DisposeAlias(refnumPtr->GetRefNum(), _ParamPointer(2))) {
        // was a named queue alias
    } else if (QueueRefNumManager::RefNumStorage().DisposeRefNum(refnumPtr->GetRefNum(), &queueRef) != kNIError_Success) {
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, kQueueArgErr, "ReleaseQueue");
    } else {
        type->ClearData(&queueRef);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(QueueRef_FlushQueue, RefNumVal, TypedArrayCoreRef, ErrorCluster) {
    RefNumVal* refnumPtr = _ParamPointer(0);
    TypedArrayCoreRef remainingElts = _ParamPointer(1) ? _Param(1) : nullptr;
    ErrorCluster *errPtr = _ParamPointer(2);
    QueueRef queueRef = nullptr;
    VIREO_ASSERT(refnumPtr != nullptr);
    bool isValidRefnum = (QueueRefNumManager::QueueRefManager().LookupQueueRef(refnumPtr->GetRefNum(), &queueRef) == kNIError_Success) && queueRef;
    bool isInputError = errPtr && errPtr->status;
    if (isInputError || !isValidRefnum) {
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, kQueueArgErr, "FlushQueue");
        if (remainingElts)
            remainingElts->Resize1D(0);
        return _NextInstruction();
    }
    QueueCore *pQV = queueRef->ObjBegin();

    IntIndex count = pQV->Count();
    AQBlock1 *pData = nullptr;
    if (remainingElts) {
        remainingElts->Resize1D(count);
        pData = remainingElts->BeginAt(0);
    }
    Int32 eltSize = pQV->EltType()->TopAQSize();
    for (IntIndex i = 0; i < count; ++i) {
        pQV->Dequeue(pData);
        if (remainingElts)
            pData = (AQBlock1*)pData + eltSize;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE9(QueueRef_GetQueueStatus, RefNumVal, Boolean, Int32, StringRef, Int32,
    Int32, Int32, TypedArrayCoreRef, ErrorCluster) {
    // p(i(QueueRefNum queue)i(Boolean returnElems)o(Int32 maxSize)o(String name)o(Int32 pendingRemove)
    //   o(Int32 pendingInsert)o(numElems)o(Array elements) io(ErrorCluster err))
    Boolean returnElems = _ParamPointer(1) ? _Param(1) : false;
    RefNumVal* refnumPtr = _ParamPointer(0);
    ErrorCluster *errPtr = _ParamPointer(8);
    IntIndex count = 0;
    Int32 maxSize = 0;
    QueueRef queueRef = nullptr;
    QueueCore *pQV = nullptr;

    VIREO_ASSERT(refnumPtr != nullptr);
    bool isValidRefnum = (QueueRefNumManager::QueueRefManager().LookupQueueRef(refnumPtr->GetRefNum(), &queueRef) == kNIError_Success) && queueRef;
    bool isInputError = errPtr && errPtr->status;
    if (isInputError || !isValidRefnum) {
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, kQueueArgErr, "GetQueueStatus");
    } else {
        pQV = queueRef->ObjBegin();
        maxSize = pQV->MaxSize();
        count = pQV->Count();
    }
    if (_ParamPointer(2))
        _Param(2) = maxSize;
    if (_ParamPointer(3))  // name
        GetQueueRefName(refnumPtr ? refnumPtr->GetRefNum() : 0, _ParamPointer(3), false);
    if (_ParamPointer(4))  // pendingRemove
        _Param(4) = pQV ? pQV->ObserverCount(kQueueDequeueObserverInfo) : 0;
    if (_ParamPointer(5))  // pendingInsert
        _Param(5) = pQV ? pQV->ObserverCount(kQueueEnqueueObserverInfo) : 0;
    if (_ParamPointer(6))  // numElems
        _Param(6) = count;
    if (_ParamPointer(7)) {  // elements array
        if (returnElems && pQV) {
            _Param(7)->Resize1D(count);
            AQBlock1 *pData = _Param(7)->BeginAt(0);
            Int32 eltSize = pQV->EltType()->TopAQSize();
            for (IntIndex i = 0; i < count; ++i) {
                pQV->Peek(pData, i);
                pData = (AQBlock1*)pData + eltSize;
            }
        } else {
            _Param(7)->Resize1D(0);
        }
    }
    return _NextInstruction();
}

// Common routine used to retry Enqueue and Dequeue if they block
static InstructionCore* HandleQueueReschedule(IntMax info, Boolean done, QueueCore *pQV, Int32 timeOut, InstructionCore *_this, InstructionCore *_next) {
    // If it succeeded or timed out then its time to move to the next instruction.
    VIClump* clump = THREAD_CLUMP();

    // If the instruction needs to retry it will use two Observer records
    // [0] is for the timer and
    // [1] is for the queue
    // These records are reserved if necessary in below. If none are reserved
    // then this is the primary execution of the instruction

    Observer* pObserver = clump->GetObservationStates(2);
    if (done || (pObserver && pObserver[0]._info == 0)) {
        clump->ClearObservationStates();
        return  _next;
    }
    if (pObserver) {
        // This is a retry and another clump got the element but
        // there is still time to wait, continue waiting.
        return clump->WaitOnObservableObject(_this);
    } else if (timeOut != 0) {
        // This is the initial call and a timeout has been supplied.
        // Wait on the queue and the timeout. -1 will wait forever.
        pObserver = clump->ReserveObservationStatesWithTimeout(2, timeOut > 0 ? gPlatform.Timer.MillisecondsFromNowToTickCount(timeOut) : 0);
        pQV->InsertObserver(pObserver+1, info);  // info identifies enqueue vs. dequeue
        return clump->WaitOnObservableObject(_this);
    }  // else with timeout == 0 just continue immediately.

    return _next;
}

//------------------------------------------------------------
// Helper function shared by Enqueue, EnqueueFront, and LossyEnqueue
static InstructionCore* QueueRef_EnqueueCore(Instruction6<TypeCommon, RefNumVal, void, void, Boolean,
    ErrorCluster>* _this, Boolean lossy, Boolean front, ConstCStr primName) {
    RefNumVal* refnumPtr = _ParamPointer(1);
    ErrorCluster *errPtr = _ParamPointer(5);
    Int32 timeOut = lossy ? 0 : (_ParamPointer(3) ? *(Int32*)_ParamPointer(3) : -1);
    Boolean *boolOut = _ParamPointer(4);
    void *overflowElem = lossy ? _ParamPointer(3) : nullptr;
    QueueRef queueRef = nullptr;

    VIREO_ASSERT(refnumPtr != nullptr);
    bool isValidRefnum = (QueueRefNumManager::QueueRefManager().LookupQueueRef(refnumPtr->GetRefNum(), &queueRef) == kNIError_Success) && queueRef;
    bool isInputError = errPtr && errPtr->status;
    if (isInputError || !isValidRefnum) {
        Observer* pObserver = THREAD_CLUMP()->GetObservationStates(2);
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, pObserver ? kQueueDestroyedWhileWaiting : kQueueArgErr, primName);
        if (boolOut)
            *boolOut = isInputError ? false : !lossy;
        if (overflowElem) {
            TypeRef eltType = GetQueueElemTypeRef(_ParamPointer(0));
            if (eltType)
                eltType->InitData(overflowElem);
        }
        return _NextInstruction();
    }

    QueueCore *pQV = queueRef->ObjBegin();
    Int32 maxSize = pQV->MaxSize();

    if (lossy) {
        TypeRef eltType = pQV->EltType();
        Boolean overflowed = false;
        if (maxSize > 0 && !pQV->HasRoom(1)) {
            pQV->Dequeue(overflowElem, true);
            overflowed = true;
        } else if (overflowElem) {
            eltType->InitData(overflowElem);
        }
        if (boolOut)  // overflowed?
            *boolOut = overflowed;
    }

    // First time or retry either way, attempt to enqueue value
    Boolean done = front ? pQV->PushFront(_ParamPointer(2)) :  pQV->Enqueue(_ParamPointer(2));
    if (!lossy && boolOut)  // timedOut?
        *boolOut = !done;

    return HandleQueueReschedule(kQueueEnqueueObserverInfo, done, pQV, timeOut, _this, _NextInstruction());
}

VIREO_FUNCTION_SIGNATURE6(QueueRef_Enqueue, TypeCommon, RefNumVal, void, void, Boolean, ErrorCluster)
{
    return QueueRef_EnqueueCore(_this, false, false, "Enqueue");
}
VIREO_FUNCTION_SIGNATURE6(QueueRef_EnqueueFront, TypeCommon, RefNumVal, void, void, Boolean, ErrorCluster)
{
    return QueueRef_EnqueueCore(_this, false, true, "EnqueueFront");
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(QueueRef_LossyEnqueue, TypeCommon, RefNumVal, void, void, Boolean, ErrorCluster)
{
    return QueueRef_EnqueueCore(_this, true, false, "LossyEnqueue");
}

static InstructionCore* QueueRef_DequeueCore(Instruction6<TypeCommon, RefNumVal, void, Int32, Boolean, ErrorCluster>* _this, Boolean preview)
{
    RefNumVal* refnumPtr = _ParamPointer(1);
    Boolean* timedOutPtr = _ParamPointer(4);
    ErrorCluster *errPtr = _ParamPointer(5);
    QueueRef queueRef = nullptr;
    VIREO_ASSERT(refnumPtr != nullptr);
    bool isValidRefnum = (QueueRefNumManager::QueueRefManager().LookupQueueRef(refnumPtr->GetRefNum(), &queueRef) == kNIError_Success) && queueRef;
    bool isInputError = errPtr && errPtr->status;
    if (isInputError || !isValidRefnum) {
        Observer* pObserver = THREAD_CLUMP()->GetObservationStates(2);
        if (errPtr && !errPtr->status)
            errPtr->SetErrorAndAppendCallChain(true, pObserver ? kQueueDestroyedWhileWaiting : kQueueArgErr, preview ? "Preview Queue":"Dequeue");
        if (timedOutPtr) {
            *timedOutPtr = !isInputError;
        }
        if (_ParamPointer(2)) {
            TypeRef eltType = GetQueueElemTypeRef(_ParamPointer(0));
            if (eltType)
                eltType->InitData(_ParamPointer(2));
        }
        return _NextInstruction();
    }
    QueueCore *pQV = queueRef->ObjBegin();

    // First time or retry either way, attempt to dequeue value
    Boolean done = preview ? pQV->Peek(_ParamPointer(2)) : pQV->Dequeue(_ParamPointer(2));
    if (_ParamPointer(4))
        _Param(4) = !done;

    Int32 timeOut = _ParamPointer(3) ? _Param(3) : -1;
    return HandleQueueReschedule(kQueueDequeueObserverInfo, done, pQV, timeOut, _this, _NextInstruction());
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(QueueRef_Dequeue, TypeCommon, RefNumVal, void, Int32, Boolean, ErrorCluster)
{
    return QueueRef_DequeueCore(_this, false);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE6(QueueRef_PeekQueue, TypeCommon, RefNumVal, void, Int32, Boolean, ErrorCluster)
{
    return QueueRef_DequeueCore(_this, true);
}

VIREO_FUNCTION_SIGNATURE3(IsEQRefnum, RefNumVal, RefNumVal, Boolean) {
    RefNumVal* refnumPtrA = _ParamPointer(0);
    RefNumVal* refnumPtrB = _ParamPointer(1);
    UInt32 refA = refnumPtrA->GetRefNum();
    UInt32 refB = refnumPtrB->GetRefNum();
    _Param(2) = refA == refB;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(IsNERefnum, RefNumVal, RefNumVal, Boolean) {
    RefNumVal* refnumPtrA = _ParamPointer(0);
    RefNumVal* refnumPtrB = _ParamPointer(1);
    UInt32 refA = refnumPtrA->GetRefNum();
    UInt32 refB = refnumPtrB->GetRefNum();
    _Param(2) = refA != refB;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsNotAQueueRefnum, RefNumVal, Boolean)
{
    RefNumVal* refnumPtr = _ParamPointer(0);
    QueueRef queueRef = nullptr;
    VIREO_ASSERT(refnumPtr != nullptr);
    bool isValidRefnum = (QueueRefNumManager::QueueRefManager().LookupQueueRef(refnumPtr->GetRefNum(), &queueRef) == kNIError_Success) && queueRef;

    if (!isValidRefnum)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(Synchronization)

    // Wait Timers
    DEFINE_VIREO_FUNCTION(WaitTickCount, "p(i(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitTickCount, WaitTickCountUInt32, "p(i(UInt32) o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitTickCount, WaitTickCountUInt16, "p(i(UInt16) o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitTickCount, WaitTickCountUInt8, "p(i(UInt8) o(UInt8))")
    DEFINE_VIREO_FUNCTION(WaitMicroseconds, "p(i(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitMicroseconds, WaitMicrosecondsUInt32, "p(i(UInt32) o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitMicroseconds, WaitMicrosecondsUInt16, "p(i(UInt16) o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitMicroseconds, WaitMicrosecondsUInt8, "p(i(UInt8) o(UInt8))")
    DEFINE_VIREO_FUNCTION(WaitMilliseconds, "p(i(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitMilliseconds, WaitMillisecondsUInt32, "p(i(UInt32) o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitMilliseconds, WaitMillisecondsUInt16, "p(i(UInt16) o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitMilliseconds, WaitMillisecondsUInt8, "p(i(UInt8) o(UInt8))")

    // Wait Until Multiple Timers
    DEFINE_VIREO_FUNCTION(WaitUntilMicroseconds, "p(i(Int64))")
    DEFINE_VIREO_FUNCTION(WaitUntilTickCountMultiple, "p(i(UInt32) o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitUntilTickCountMultiple, WaitUntilTickCountMultipleUInt16, "p(i(UInt16) o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitUntilTickCountMultiple, WaitUntilTickCountMultipleUInt8, "p(i(UInt8) o(UInt8))")
    DEFINE_VIREO_FUNCTION(WaitUntilMicrosecondsMultiple, "p(i(UInt32) o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitUntilMicrosecondsMultiple, WaitUntilMicrosecondsMultipleUInt16, "p(i(UInt16) o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitUntilMicrosecondsMultiple, WaitUntilMicrosecondsMultipleUInt8, "p(i(UInt8) o(UInt8))")
    DEFINE_VIREO_FUNCTION(WaitUntilMillisecondsMultiple, "p(i(UInt32) o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitUntilMillisecondsMultiple, WaitUntilMillisecondsMultipleUInt16, "p(i(UInt16) o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(WaitUntilMillisecondsMultiple, WaitUntilMillisecondsMultipleUInt8, "p(i(UInt8) o(UInt8))")

    // Base ObservableObject
    DEFINE_VIREO_TYPE(Observer, "c(e(DataPointer object)e(DataPointer next)e(DataPointer clump)e(Int64 info))");

    // Occurrences
    DEFINE_VIREO_TYPE(OccurrenceValue, "c(e(DataPointer firstState)e(Int32 setCount))")
    DEFINE_VIREO_TYPE(Occurrence, "a(OccurrenceValue)")
    DEFINE_VIREO_FUNCTION(WaitOnOccurrence, "p(i(Occurrence)i(Boolean ignorePrevious)i(Int32 timeout)o(Boolean timedout)s(Int32 staticCount))")
    DEFINE_VIREO_FUNCTION(SetOccurrence, "p(i(Occurrence))")

    // Queues
    DEFINE_VIREO_TYPE(QueueValue, "c(e(DataPointer firstState)e(a($0 $1)elements)"
        "e(Int32 front)e(Int32 back)e(Int32 count)e(Int32 maxSize))")  // Queue internal rep QueueCore
    DEFINE_VIREO_TYPE(Queue, "a(QueueValue)")  // ZDA

    // Dynamic, refnum-based queues
    DEFINE_VIREO_TYPE(QueueRefNum, "refnum(Queue)")
    DEFINE_VIREO_FUNCTION_CUSTOM(ObtainQueue, QueueRef_Obtain,
        "p(i(StaticTypeExplicitData) o(QueueRefNum queue) i(Int32 maxsize) i(String name) i(Boolean create)"
                                 "o(Boolean created) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(ReleaseQueue, QueueRef_Release, "p(i(StaticTypeExplicitData) i(QueueRefNum queue) o(String name)"
                                 "o(Array remainingElems) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Enqueue, QueueRef_Enqueue,
        "p(i(StaticTypeExplicitData)io(QueueRefNum queue) i(* element) i(Int32 timeOut) o(Boolean timedOut) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(EnqueueFront, QueueRef_EnqueueFront,
        "p(i(StaticTypeExplicitData)io(QueueRefNum queue) i(* element) i(Int32 timeOut) o(Boolean timedOut) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(LossyEnqueue, QueueRef_LossyEnqueue,
        "p(i(StaticTypeExplicitData)io(QueueRefNum queue) i(* element) o(* overflowElem) o(Boolean overflowed) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Dequeue, QueueRef_Dequeue, "p(i(StaticTypeExplicitData) io(QueueRefNum queue) o(* element)"
                                 "i(Int32 timeOut) o(Boolean timedOut) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(PeekQueue, QueueRef_PeekQueue, "p(i(StaticTypeExplicitData) io(QueueRefNum queue) o(* element)"
                                 "i(Int32 timeOut) o(Boolean timedOut) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(FlushQueue, QueueRef_FlushQueue, "p(i(QueueRefNum queue) o(Array remainingElems)io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetQueueStatus, QueueRef_GetQueueStatus, "p(i(QueueRefNum queue) i(Boolean returnElems) o(Int32 maxSize)"
        "o(String name) o(Int32 pendingRemove) o(Int32 pendingInsert) o(Int32 numElems) o(Array elements) io(ErrorCluster err))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAQueueRefnum, "p(i(QueueRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(QueueRefNum) i(QueueRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(QueueRefNum) i(QueueRefNum) o(Boolean))")
DEFINE_VIREO_END()

}  // namespace Vireo
