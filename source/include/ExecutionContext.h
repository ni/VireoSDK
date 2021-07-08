// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Tools to implement a ExecutionContext that can run/evaluate VIs
 */

#ifndef ExecutionContext_h
#define ExecutionContext_h

#include "TypeAndDataManager.h"
#include "Instruction.h"
#include "Timestamp.h"
#include "Date.h"
#include "EventLog.h"
#include "Synchronization.h"

namespace Vireo
{
//------------------------------------------------------------
class VIClump;
class FunctionClump;
class EventLog;
class ObservableCore;

//------------------------------------------------------------
//! Queue of clumps.
/** The Queue is made by linking clumps directly using their next field,
    thus clumps can only be in one queue (or list) at a time.
~~~

            -----------------------------------
    Queue:  |  head                     tail  |
            -----------------------------------
                |                        |
                v                        v
            ----------              ------------
    Clumps  |   |  * |--->-->------>|     |nullptr|
            ----------              ------------
~~~
*/
class VIClumpQueue
{
 public:
    VIClump* _head;
    VIClump* _tail;
 public:
    VIClumpQueue();
    //! True when the VIClumpQueue is empty.
    Boolean IsEmpty() const { return (this->_head == nullptr); }
    VIClump* Dequeue();
    void Enqueue(VIClump* elt);
};

enum ExecSlicesResult {
    kExecSlices_ClumpsWaiting = -2,     // Clumps waiting, but for less than 1 ms; call executeSlices again ASAP
    kExecSlices_ClumpsInRunQueue = -1,  // Clumps ready to run in run queue; call executeSlices again ASAP
    kExecSlices_ClumpsFinished = 0,     // All clumps done executing, nothing waiting on timers.  VI done.
    // ... or positive value indicating clumps waiting for specific time (in ms);call executeSlices again no later than this time delay later
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
// CulDeSac prototype is visible ( e.g. not static) so the
// IsNotCulDeSac method on ExecutionContext can inline it better.
InstructionCore* VIVM_FASTCALL CulDeSac(InstructionCore* _this _PROGMEM);
InstructionCore* VIVM_FASTCALL Done(InstructionCore* _this _PROGMEM);

//------------------------------------------------------------
//! System state necessary for executing VI Clumps.
typedef ExecutionContext* ExecutionContextRef;
class ExecutionContext
{
 public:
    ExecutionContext();

 private:
    ECONTEXT    VIClumpQueue    _runQueue;         // Clumps ready to run
    ECONTEXT    Int32           _breakoutCount;   // Inner execution loop "breaks out" when this gets to 0

 public:
    ECONTEXT    Timer           _timer;           // TODO(PaulAustin): can be moved out of the execcontext once
                                                 // instruction can take injected parameters.
#ifdef VIREO_SUPPORTS_ISR
    ECONTEXT    VIClump*        _triggeredIsrList;  // Elts waiting for something external to wake them up
    ECONTEXT    void            IsrEnqueue(QueueElt* elt);
#endif
    ECONTEXT    VIClump*        CurrentClump() const { return _runningQueueElt; }
    ECONTEXT    void            CheckOccurrences(PlatformTickType t);    // Will put items on the run queue
                                                                       // if it is time. or ready bit is set.

    // Run a string of instructions to completion, no concurrency.
    ECONTEXT    void            ExecuteFunction(FunctionClump* fclump);  // Run a simple function to completion.

    // Run the concurrent execution system for a short period of time
    ECONTEXT    Int32 /*ExecSlicesResult*/ ExecuteSlices(Int32 numSlices, Int32 millisecondsToRun);
    ECONTEXT    InstructionCore* SuspendRunningQueueElt(InstructionCore* nextInClump);
    ECONTEXT    InstructionCore* Stop();
    ECONTEXT    void            ClearBreakout() { _breakoutCount = 0; }
    ECONTEXT    void            EnqueueRunQueue(VIClump* elt);
    ECONTEXT    VIClump*        _runningQueueElt;    // Element actually running

 public:
    // Method for runtime errors to be routed through.
    ECONTEXT    void            LogEvent(EventLog::EventSeverity severity, ConstCStr message, ...) const;

 private:
    static Boolean _classInited;
    static InstructionCore _culDeSac;

 public:
    static inline Boolean IsNotCulDeSac(InstructionCore* pInstruction) {
        return pInstruction->_function != (InstructionFunction)CulDeSac;
    }
    static inline Boolean IsDone(InstructionCore* pInstruction) {
        return pInstruction->_function == (InstructionFunction)Done;
    }
};

#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // A single global instance allows all field references
    // to resolve to a fixed global address. This avoids pointer+offset
    // instructions that are costly on small MCUs
    extern ExecutionContext gSingleExecutionContext;
    #define THREAD_EXEC()    (&gSingleExecutionContext)
    #define THREAD_CLUMP() gSingleExecutionContext.CurrentClump();
#else
    #define THREAD_EXEC() (THREAD_TADM()->TheExecutionContext())
    #define THREAD_CLUMP() (THREAD_EXEC()->CurrentClump())
#endif

void AppendCallChainString(StringRef stringRef);
Boolean TestNeedsUpdate(TypeRef typeRef, Boolean reset);

}  // namespace Vireo

#endif  // ExecutionContext_h
