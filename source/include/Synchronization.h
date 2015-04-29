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
    
    //! State the observed object is in. Iniitally only simple state
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
    void InsertObserver(Observer* pObserver, IntMax info);
    void RemoveObserver(Observer* pObserver);
    void ObserveStateChange(IntMax info);
};
typedef TypedObject<ObservableCore> ObservableObject, *ObservableRef;

//------------------------------------------------------------
//! Occurrence object.
class OccurrenceCore : public ObservableCore
{
private:
    Int32 _setCount;
public:
    Int32 Count() {return _setCount;}
    void SetOccurrence();
    Boolean HasOccurred(Int32 count, Boolean ignorePrevious);
};
typedef TypedObject<OccurrenceCore> OccurrenceObject, *OccurrenceRef;

//------------------------------------------------------------
//! Timer object that clumps can wait on.
class Timer : public ObservableCore
{
public:
    Boolean AnythingWaiting()                   { return _observerList != null; }
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
    
    IntIndex RemoveIndex();
public:
    Boolean Compress();
    Boolean TryMakeRoom(IntIndex length);
    Boolean Enqueue(void* pData);
    Boolean Dequeue(void* pData);
    Boolean HasRoom(IntIndex count);
};
typedef TypedObject<QueueCore> QueueObject, *QueueRef;

} // namespace Vireo

#endif //Synchronization_h
