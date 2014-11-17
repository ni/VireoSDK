/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Tools to imliment a ExecutionContext that can run/evaluate VIs
 */

#ifndef ExecutionContext_h
#define ExecutionContext_h

#include "TypeAndDataManager.h"
#include "Instruction.h"
#include "TimeTypes.h"
#include "EventLog.h"

namespace Vireo
{
//------------------------------------------------------------
class VIClump;
class FunctionClump;
class EventLog;
class ObservableObject;

//------------------------------------------------------------
class WaitableState
{
public:
    //! What object is the clump waiting on?
    ObservableObject* _object;

    //! Any async operations waiting on this queue
    WaitableState* _next;

    //! Any async operations waiting on this queue
    VIClump* _clump;
    
    //! What it is waiting for: > 1, elts in the queus, <1 room in the queue
    Int64 _info;
};
//------------------------------------------------------------
class ObservableObject
{
public:
    WaitableState* _waitingList;
    
public:
    
    void Remove(WaitableState* pWSEltToRemove)
    {
        VIREO_ASSERT(pWSEltToRemove != null);
        VIREO_ASSERT(pWSEltToRemove->_object == this);
        
        WaitableState* pTemp;
        WaitableState** pFix = &(_waitingList); // previous next pointer to patch when removing element.
        WaitableState* pVisitor = *pFix;
        
        while(pVisitor) {
            pTemp = pVisitor;
            if (pTemp == pWSEltToRemove) {
                *pFix = pTemp->_next;
            } else {
                pFix = &pVisitor->_next;
            }
            pVisitor = *pFix;
        }

        pWSEltToRemove->_info = 0;
        pWSEltToRemove->_object = null;
        pWSEltToRemove->_next = null;
    }
};
//------------------------------------------------------------
class Timer : public ObservableObject
{
public:
    Boolean AnythingWaiting()                   { return _waitingList != null; }
    void QuickCheckTimers(PlatformTickType t)   { if (_waitingList) { CheckTimers(t); } }
    void CheckTimers(PlatformTickType t);
    void InitWaitableTimerState(WaitableState* pWS, PlatformTickType tickCount);
};
//------------------------------------------------------------
//! Queue of clumps.
/** The Queue is made by linking clumps directly using their next field,
    thus clumps can only be in one queue (or list) at a time.
~~~

            -----------------------------------
    Queue:  |  head                     tail  |
            -----------------------------------
                |						 |
                v                        v
            ----------              ------------
    Clumps  |   |  * |--->-->------>|     |null|
            ----------              ------------
~~~
*/
class VIClumpQueue
{
public :
    VIClump* _head;
    VIClump* _tail;
public:
    VIClumpQueue();
    //! True when the VIClumpQueue is empty.
    Boolean IsEmpty() { return (this->_head == null); }
    VIClump* Dequeue();
    void Enqueue(VIClump*);
};

enum ExecutionState
{
    kExecutionState_None = 0,
    kExecutionState_ClumpsInRunQueue = 0x01,
    kExecutionState_ClumpsWaitingOnTime = 0x02,
    kExecutionState_ClumpsWaitingOnQueues = 0x04,
    kExecutionState_ClumpsWaitingOnISRs = 0x08,
};
    
// Each thread can have at most one ExecutionContext (ECs). ExecutionContexts can work
// cooperatively with other thread operations much like a message pump does. ECs
// may be the only tasks a thread has. 
//
// All access to the outside , graphics, time, IO
// needs to be derived from an object connected to the context.

#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    #define ECONTEXT static
#else
    #define ECONTEXT 
#endif

//------------------------------------------------------------
// CulDeSac prototype is visable ( e.g. not static) so the
// IsNotCulDeSac method on ExecutionContext can inline it better.
InstructionCore* VIVM_FASTCALL CulDeSac (Instruction0* _this _PROGMEM);

//------------------------------------------------------------
//! System state necessary for executing VI Clumps.
typedef ExecutionContext* ExecutionContextRef;
class ExecutionContext
{
public:
#ifndef VIREO_SINGLE_GLOBAL_CONTEXT
    ExecutionContext(TypeManagerRef typeManager);
#endif

private:
    ECONTEXT    TypeManagerRef _theTypeManager;
public:
    ECONTEXT    TypeManagerRef TheTypeManager()    { return _theTypeManager; }

private:
    ECONTEXT    VIClumpQueue    _runQueue;			//! Clumps ready to run
    ECONTEXT    IntSmall        _breakoutCount;     //! Inner execution loop "breaks out" when this gets to 0

public:
    ECONTEXT    Timer           _timer;

#ifdef VIREO_SUPPORTS_ISR
    ECONTEXT    VIClump*        _triggeredIsrList;               // Elts waiting for something external to wake them up
    ECONTEXT    void            IsrEnqueue(QueueElt* elt);
#endif
	ECONTEXT    VIClump*        CurrentClump() { return _runningQueueElt; }
    ECONTEXT    void            CheckOccurrences(PlatformTickType t);		// Will put items on the run queue if it is time. or ready bit is set.

    // Run a string of instructions to completion, no concurrency. 
    ECONTEXT    void            ExecuteFunction(FunctionClump* fclump);  // Run a simple function to completion.
    
    // Run the concurrent execution system for a short period of time
    ECONTEXT    ExecutionState  ExecuteSlices(Int32 numSlices, PlatformTickType tickCount);
    ECONTEXT    InstructionCore* SuspendRunningQueueElt(InstructionCore* whereToWakeUp);
    ECONTEXT    InstructionCore* Stop();
    ECONTEXT    void            ClearBreakout() { _breakoutCount = 0; }

    ECONTEXT    void            EnqueueRunQueue(VIClump* elt);
    ECONTEXT    VIClump*        _runningQueueElt;		// Element actually running
  
public:
    // Method for runtime errors to be routined through.
    ECONTEXT    void            LogEvent(EventLog::EventSeverity severity, const char* message, ...);

private:
    static Boolean _classInited;
    static Instruction0 _culDeSac;
    
public:
    static inline Boolean IsNotCulDeSac(InstructionCore* pInstruciton) {return pInstruciton->_function != (InstructionFunction)CulDeSac;};

    static void ClassInit();
};

#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // A single global instance allows allows all field references
    // to resolver to a fixed global address. This avoid pointer+offset
    // instructions that are costly on small MCUs
    extern ExecutionContext gSingleExecutionContext;
    #define THREAD_EXEC()	(&gSingleExecutionContext)
    #define THREAD_CLUMP() gSingleExecutionContext.CurrentClump();
#else
    #define THREAD_EXEC() ExecutionContextScope::Current()
    #define THREAD_CLUMP() ExecutionContextScope::Current()->CurrentClump()
#endif

#ifndef VIREO_SINGLE_GLOBAL_CONTEXT
//------------------------------------------------------------
//! Stack based class to manage a threads active TypeManager and ExecutionContext.
class ExecutionContextScope
{
    ExecutionContextRef _saveExec;
    TypeManagerScope  _typeManagerScope;
    VIVM_THREAD_LOCAL static ExecutionContextRef _threadsExecutionContext;

public:
    //! Constructor saves the currect context (if it exists) and begins a new one.
    ExecutionContextScope(ExecutionContextRef context)
    : _typeManagerScope(context->TheTypeManager())
    {
        _saveExec = _threadsExecutionContext;
        _threadsExecutionContext = context;
    }
    //! Destructor restores previous context
    ~ExecutionContextScope()
    {
        _threadsExecutionContext = _saveExec;
    }
    //! Static method returns the current active ExecutionContext
    static ExecutionContextRef Current()
    {
        return (ExecutionContextRef) _threadsExecutionContext;
    }
};
#endif
    
//------------------------------------------------------------
//! Template class to dynamically create instances of a Vireo typed variable.
template <class T>
class StackVar
{
public:
    T *Value;
    StackVar(const char* tName)
    {
        SubString stringTypeName(tName);
        TypeRef type = THREAD_EXEC()->TheTypeManager()->FindType(&stringTypeName);
        VIREO_ASSERT(type->IsArray() && !type->IsFlat());
        Value = null;
        if (type) {
            type->InitData(&Value);
        }
    }
    ~StackVar()
    {
        if (Value) {
            Value->Type()->ClearData(&Value);
        }
    };
};

//! Declare a variable using a Vireo type.
#define STACK_VAR(_t_, _v_) StackVar<_t_> _v_(#_t_)
    
} // namespace Vireo

#endif //ExecutionContext_h
