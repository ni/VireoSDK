/**

Copyright (c) 2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Tools for synchronization and communication between clumps.
 */

#ifndef Synchronization_h
#define Synchronization_h

#include "TypeAndDataManager.h"
#include "Instruction.h"
#include "Timestamp.h"
#include "EventLog.h"

namespace Vireo
{
//------------------------------------------------------------
class VIClump;
class ObservableCore;
class Observer
{
 public:
    //! What object is the clump waiting on?
    ObservableCore* _object;

    //! Pointer to the next WS describing a clump waiting on _object.
    Observer* _next;

    //! Which clump owns this WS object.
    VIClump* _clump;

    //! State the observed object is in. Initially only simple state
    //! changes can be observed.
    IntMax _info;
};

//------------------------------------------------------------
//! Base class for objects that clump can 'observe/wait on'.
class ObservableCore
{
 public:
    Observer* _observerList;

 public:
    ObservableCore() : _observerList(nullptr) { }
    void InsertObserver(Observer* pObserver, IntMax info);
    void RemoveObserver(Observer* pObserver);
    void ObserveStateChange(IntMax info, Boolean wakeAll);
    IntIndex ObserverCount(IntMax info);
};
typedef TypedObject<ObservableCore> ObservableObject, *ObservableRef;

//------------------------------------------------------------
//! Occurrence object.
class OccurrenceCore : public ObservableCore
{
 private:
    Int32 _setCount;
 public:
    OccurrenceCore() : _setCount(0) { }
    Int32 Count() {return _setCount;}
    void SetOccurrence();
    Boolean HasOccurred(Int32 count, Boolean ignorePrevious);
};
typedef TypedObject<OccurrenceCore> OccurrenceObject, *OccurrenceRef;

const Int32 kMaxExecWakeUpTime = 200;  // (milliseconds) TODO spathiwa - increase after HTTP JS refactor

//------------------------------------------------------------
//! Timer object that clumps can wait on.
class Timer : public ObservableCore
{
 public:
    Boolean AnythingWaiting()                   { return _observerList != nullptr; }
    IntMax NextWakeUpTime()                     { return _observerList != nullptr ? _observerList->_info : 0; }
    void QuickCheckTimers(PlatformTickType t)   { if (_observerList) { CheckTimers(t); } }
    void CheckTimers(PlatformTickType t);
    void InitObservableTimerState(Observer* pObserver, PlatformTickType tickCount);
};

//------------------------------------------------------------
// Based on the underlying array, queues may be growable or bounded.
//
class QueueCore : public ObservableCore
{
 private:
    TypedArrayCoreRef _elements;

    //! Index where the next element will be stored (may be one past end if full)
    IntIndex   _insert;

    //! How many elements are in the queue
    IntIndex   _count;

    IntIndex   _maxSize;

    IntIndex RemoveIndex();
 public:
    Boolean Compress();
    Boolean TryMakeRoom(IntIndex length, IntIndex insert);
    Boolean Enqueue(void* pData);
    Boolean PushFront(void* pData);
    Boolean Dequeue(void* pData, bool skipObserver = false);
    Boolean Peek(void* pData, IntIndex skipCount = 0);
    Boolean HasRoom(IntIndex count);
    IntIndex Count() const { return _count; }
    TypeRef EltType() const { return _elements->ElementType(); }
    IntDim MaxSize() const {
        if (_maxSize)  // if dynamic (refnum-based queue), return dynamic maxSize
            return _maxSize > 0 ? _maxSize : -1;
        IntDim maxSize = _elements->Type()->DimensionLengths()[0];
        return maxSize > 0 ? maxSize : -1;
    }
    void SetMaxSize(IntDim maxSize) {
        _maxSize = maxSize >= 0 ? maxSize : -1;  // (setting to zero would revert to static size, checked in caller QueueRef_Obtain to prevent)
    }
    TypeRef Type() const { return _elements->Type(); }
};
typedef TypedObject<QueueCore> QueueObject, *QueueRef;

// Queue prim LV error return codes
enum { kQueueArgErr = 1, kQueueMemFull = 2, kQueueNameTypeMismatch = 1094, kQueueNoSuchName = 1100,
    kQueueDestroyedWhileWaiting = 1122, kQueueWrongContext = 1491, kQueueZeroSize = 1548 };

}  // namespace Vireo

#endif  // Synchronization_h
