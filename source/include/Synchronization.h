// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
    IntIndex ObserverCount(IntMax info) const;
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
    Int32 Count() const {return _setCount;}
    void SetOccurrence();
    Boolean HasOccurred(Int32 count, Boolean ignorePrevious) const;
};
typedef TypedObject<OccurrenceCore> OccurrenceObject, *OccurrenceRef;

const Int32 kMaxExecWakeUpTime = 200;  // (milliseconds) TODO spathiwa - increase after HTTP JS refactor

//------------------------------------------------------------
//! Timer object that clumps can wait on.
class Timer : public ObservableCore
{
 public:
    Boolean AnythingWaiting() const { return _observerList != nullptr; }
    IntMax NextWakeUpTime() const { return _observerList != nullptr ? _observerList->_info : 0; }
    void QuickCheckTimers(PlatformTickType t)   { if (_observerList) { CheckTimers(t); } }
    void CheckTimers(PlatformTickType t);
    void InitObservableTimerState(Observer* pObserver, PlatformTickType tickCount);
};

//------------------------------------------------------------
// Based on the underlying array, queues may be growable or bounded.
// In both cases, the array is treated as circular buffer.

// _front, _back = both point to the element stored in the queue (that can be used to pop directly as-is.
//                They have a value of -1 if the queue is empty.
// _count = number of elements in the queue
// _elements->Length = size of the underlying array used to store queue elements
// _maxSize > 0 , if user supplied the size for a bounded queue
//          = -1, growable queue, size not specified by the user.
//
class QueueCore : public ObservableCore
{
 private:
    TypedArrayCoreRef _elements = nullptr;

    IntIndex   _front = -1;
    IntIndex   _back = -1;

    //! How many elements are in the queue
    IntIndex   _count = 0;

    IntIndex   _maxSize = 0;

 public:
    Boolean Enqueue(void* pData);
    Boolean PushFront(void* pData);
    Boolean Dequeue(void* pData, bool skipObserver = false);
    Boolean Peek(void* pData, IntIndex index = 0) const;
    Boolean ResizeInternalBufferIfEmpty() const;
    void CopyDataToQueueElement(IntIndex position, void *pData);
    Boolean HasRoom(IntIndex additionalCount) const;
    IntIndex Count() const { return _count; }
    TypeRef EltType() const { return _elements->ElementType(); }
    IntDim MaxSize() const {
        return _maxSize;
    }
    void SetMaxSize(IntDim maxSize) {
        _maxSize = maxSize >= 0 ? maxSize : -1;
    }
    void Initialize() {
        _front = _back = -1;
    }
    TypeRef Type() const { return _elements->Type(); }
};
typedef TypedObject<QueueCore> QueueObject, *QueueRef;

// Queue prim LV error return codes
enum { kQueueArgErr = 1, kQueueMemFull = 2, kQueueNameTypeMismatch = 1094, kQueueNoSuchName = 1100,
    kQueueDestroyedWhileWaiting = 1122, kQueueWrongContext = 1491, kQueueZeroSize = 1548 };

}  // namespace Vireo

#endif  // Synchronization_h
