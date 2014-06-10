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

namespace Vireo
{
//------------------------------------------------------------
class VIClump;
class FunctionClump;

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
class Queue
{
public :
	VIClump* _head;
	VIClump* _tail;
public:
	Queue();
    //! True when the Queue is empty.
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

#ifdef VIVM_SINGLE_EXECUTION_CONTEXT
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
class ExecutionContext
{

private:
    TypeManager* _theTypeManager;
public:
    TypeManager* TheTypeManager()    { return _theTypeManager; }

private:
    ECONTEXT    Queue           _runQueue;			//! Clumps ready to run
	ECONTEXT    VIClump*        _sleepingList;		//! Clumps waiting for a point in time wake them up
	ECONTEXT    IntSmall        _breakoutCount;       //! Inner execution loop "breaks out" when this gets to 0

public:
	ExecutionContext(TypeManager* typeManager);
    ECONTEXT    PlatformTickType PlatformTickCount();

#ifdef VIREO_SUPPORTS_ISR
    ECONTEXT    VIClump*        _triggeredIsrList;               // Elts waiting for something external to wake them up
    ECONTEXT    void            IsrEnqueue(QueueElt* elt);
#endif
	ECONTEXT    VIClump*        RunngQueueElt() {return _runningQueueElt;}
    ECONTEXT    void            CheckOccurrences(PlatformTickType t);		// Will put items on the run queue if it is time. or ready bit is set.

    // Run a string of instructions to completion, no concurrency. 
    ECONTEXT    void            ExecuteFunction(FunctionClump* fclump);  // Run a simple function to completion.
    
    // Run the concurrent execution system for a short period of time
	ECONTEXT    ExecutionState  ExecuteSlices(Int32 numSlices, PlatformTickType tickCount);
	ECONTEXT    InstructionCore* SuspendRunningQueueElt(InstructionCore* whereToWakeUp);
	ECONTEXT    InstructionCore* Stop();
    ECONTEXT    void            ClearBreakout() { _breakoutCount = 0; }
	ECONTEXT    InstructionCore* WaitUntilTickCount(PlatformTickType count, InstructionCore* next);
	ECONTEXT    void            EnqueueRunQueue(VIClump* elt);
	ECONTEXT    VIClump*        _runningQueueElt;		// Element actually running
    
private:
    static Boolean _classInited;
    static Instruction0 _culDeSac;
public:

    static inline Boolean IsNotCulDeSac(InstructionCore* pInstruciton) {return pInstruciton->_function != (InstructionFunction)CulDeSac;};

    static void ClassInit();
};

#ifdef VIVM_SINGLE_EXECUTION_CONTEXT
    // A single global instance allows allows all field references
    // to resolver to a fixed global address. This avoid pointer+offset
    // instructions that are costly on small MCUs
    extern ExecutionContext gSingleExecutionContext;
    #define THREAD_EXEC()	(&gSingleExecutionContext)
#else
//    extern VIVM_THREAD_LOCAL ExecutionContext* gpExec;
#endif

//------------------------------------------------------------
//! Stack based class to manage a threads active TypeManager and ExecutionContext.
class ExecutionContextScope
{
#ifndef VIVM_SINGLE_EXECUTION_CONTEXT
    ExecutionContext* _saveExec;
    TypeManagerScope  _typeManagerScope;
    VIVM_THREAD_LOCAL static ExecutionContext* _threadsExecutionContext;

public:
    //! Constructor saves the currect context (if it exists) and begins a new one.
    ExecutionContextScope(ExecutionContext* context)
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
    static ExecutionContext* Current()
    {
        return (ExecutionContext*) _threadsExecutionContext;
    }
#else
    ExecutionContextScope(ExecutionContext* context) {}
    ~ExecutionContextScope() {}
#endif
    
    #define THREAD_EXEC() ExecutionContextScope::Current()
};
    
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
