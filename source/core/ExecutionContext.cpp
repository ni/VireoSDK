// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Native Vireo execution methods
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "DebuggingToggles.h"

#if kVireoOS_emscripten
#include <emscripten.h>
#endif

namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    extern void jsExecutionContextFPSync(StringRef);
}
#endif

//------------------------------------------------------------
Boolean ExecutionContext::_classInited;
_PROGMEM InstructionCore ExecutionContext::_culDeSac;

#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
TypeManagerRef  ExecutionContext::_theTypeManager;
VIClumpQueue    ExecutionContext::_runQueue;            // Elts ready To run
VIClump*        ExecutionContext::_sleepingList;        // Elts waiting for something external to wake them up
VIClump*        ExecutionContext::_runningQueueElt;     // Elt actually running
Int32           ExecutionContext::_breakoutCount;
#endif


//------------------------------------------------------------
// CulDeSac returns itself allowing an unrolled execution loop to complete.
InstructionCore* VIVM_FASTCALL CulDeSac(InstructionCore* _this _PROGMEM)
{
    return _this;
}
//------------------------------------------------------------
// When the Done instruction is hit the clump is done.
InstructionCore* VIVM_FASTCALL Done(InstructionCore* _this _PROGMEM)
{
    ExecutionContextRef exec = THREAD_EXEC();

    VIClump* runningQueueElt = exec->_runningQueueElt;
    VIREO_ASSERT(runningQueueElt != nullptr)

    // If there was a caller it was a subVI call, restart the caller. If not, a topVI finished.
    VIClump *callerClump = runningQueueElt->_caller;
    if (callerClump) {
        // The return instruction will be the CallInstruction.
        CallVIInstruction *pCallInstruction = static_cast<CallVIInstruction*>(callerClump->_savePc);
        VIREO_ASSERT(pCallInstruction != nullptr)

        InstructionCore* pCopyOut = pCallInstruction->_piCopyOutSnippet;
        while (ExecutionContext::IsNotCulDeSac(pCopyOut)) {
            pCopyOut = _PROGMEM_PTR(pCopyOut, _function)(pCopyOut);
        }

        // Now that copy out has been done, move caller to next instruction.
        callerClump->_savePc = pCallInstruction->Next();

        // Now let the Caller proceed
        runningQueueElt->_caller = nullptr;
        callerClump->EnqueueRunQueue();
    } else {
        // Since there is no caller its a top VI
#ifndef VIREO_MICRO
        VirtualInstrument* vi = runningQueueElt->OwningVI();
        if (runningQueueElt == vi->Clumps()->Begin())
            vi->GoIsDone();
#endif
    }

    // Now that any caller that needs to hoist data from the clump has been
    // taken care of, see if there are other clumps that are waiting in line.
    // What they are waiting for is unimportant here, only that they have been added the
    // waiting list for this clump.  (TODO(PaulAustin): allow prioritization)

    // Disconnect the list
    VIClump* waitingClump = runningQueueElt->_waitingClumps;
    runningQueueElt->_waitingClumps = nullptr;

    while (nullptr != waitingClump) {
        VIClump* clumpToEnqueue = waitingClump;
        waitingClump = waitingClump->_next;

        // nullptr out next so it doesn't look like it is in a list.
        clumpToEnqueue->_next = nullptr;
        clumpToEnqueue->EnqueueRunQueue();
        exec->ClearBreakout();
    }

    // Since the clump is done, reset the short count back to
    // its initial value.
    runningQueueElt->_shortCount = runningQueueElt->_fireCount;
    return exec->SuspendRunningQueueElt(runningQueueElt->_codeStart);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(Stop, Boolean)
{
    if (_ParamPointer(0) && !_Param(0))
        return _NextInstruction();
    else
        return THREAD_EXEC()->Stop();
}
//------------------------------------------------------------
InstructionCore* ExecutionContext::Stop()
{
    _runningQueueElt = nullptr;
    _breakoutCount = 0;

    return &_culDeSac;
}
//------------------------------------------------------------
// Trigger - Decrement target fire count (may cause target to be activated)
VIREO_FUNCTION_SIGNATURE1(Trigger, VIClump)
{
    _ParamPointer(0)->Trigger();
    return _NextInstruction();
}
//------------------------------------------------------------
// FPSync - Synchronously triggers a function on the JS module called fpSync and passes a string as the first parameter.
// Useful for performing an action and immediately notifying JS about it
VIREO_FUNCTION_SIGNATURE1(FPSync, StringRef)
{
#if kVireoOS_emscripten
    jsExecutionContextFPSync(_Param(0));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
//

struct SetValueNeedsUpdateParamBlock : InstructionCore
{
    _ParamDef(StaticType, ValueType);
    _ParamDef(void, ValueData);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(SetValueNeedsUpdateForTopLevelVI, SetValueNeedsUpdateParamBlock)
{
    VirtualInstrument* vi = THREAD_EXEC()->_runningQueueElt->OwningVI();
    if (vi->IsTopLevelVI())
        _ParamPointer(ValueType)->SetNeedsUpdate(true);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURET(SetValueNeedsUpdate, SetValueNeedsUpdateParamBlock)
{
    _ParamPointer(ValueType)->SetNeedsUpdate(true);
    return _NextInstruction();
}

Boolean TestNeedsUpdate(TypeRef typeRef, Boolean reset) {
    Boolean needsUpdate = typeRef->NeedsUpdate();
    if (needsUpdate && reset)
        typeRef->SetNeedsUpdate(false);
    return needsUpdate;
}

struct CheckValueNeedsUpdateParamBlock : InstructionCore
{
    _ParamDef(StaticType, ValueType);
    _ParamDef(void, ValueData);
    _ParamDef(Boolean, NeedsUpdate);
    NEXT_INSTRUCTION_METHOD()
};
VIREO_FUNCTION_SIGNATURET(CheckValueNeedsUpdate, CheckValueNeedsUpdateParamBlock)
{
    if (_ParamPointer(NeedsUpdate))
        _Param(NeedsUpdate) = TestNeedsUpdate(_ParamPointer(ValueType), true);
    return _NextInstruction();
}

//------------------------------------------------------------
// Wait - it target clump is active then it waits for it to complete.
// if target clump is complete then there is nothing to wait on.
VIREO_FUNCTION_SIGNATURE1(Wait, VIClump)
{
    // If the target is running or is waiting for additional triggers
    // wait until it has completed. If shortcount == firecount it is considered done.
    if (_ParamPointer(0)->_shortCount == _ParamPointer(0)->_fireCount) {
        // Target clump has finished and trigger count been reset.
        return _NextInstruction();
    } else {
        _ParamPointer(0)->InsertIntoWaitList(THREAD_EXEC()->_runningQueueElt);
        return THREAD_EXEC()->SuspendRunningQueueElt(_NextInstruction());
    }
}
//------------------------------------------------------------
// CallVI - If target clump is active then it waits for it to complete.
VIREO_FUNCTION_SIGNATURET(CallVI, CallVIInstruction)
{
    VIClump *qe = _ParamImmediate(viRootClump);
    // TODO(PaulAustin): move this to an Execution Context method?
    if (qe->_shortCount > 0) {
        // If the callee clump has a positive short count
        // it is not running there fore it is ok to run.
        // Make this current clump the caller.
        // Triggers left goes to 0; ( indicates we are active
        // Execute copy in code ( might hang from instruction, or from VI)
        // Instruction returned will be first in sub VI.
        VIREO_ASSERT(qe->_shortCount == 1)
        VIREO_ASSERT(qe->_caller == nullptr)
        qe->_caller = THREAD_EXEC()->_runningQueueElt;

        // Copy in parameters
        InstructionCore* currentInstruction = _this->CopyInSnippet();
        while (ExecutionContext::IsNotCulDeSac(currentInstruction)) {
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
        }

        // Use Trigger to decrement the target SubVI fire count to 0.
        qe->Trigger();

        // The CallVI Instruction is marked as the place to return to.
        // This return location will be found by the "Done" instruction in the callee's code.
        // That instruction will execute the copy-out code. After that, the execution will continue with
        // instruction following this one. That means this instruction is not actually rescheduled.
        return THREAD_EXEC()->SuspendRunningQueueElt(_this);
    } else {
        // The VI is active so add this caller to the waiting list
        // and set it up to retry later.
        qe->AppendToWaitList(THREAD_EXEC()->_runningQueueElt);
        return THREAD_EXEC()->SuspendRunningQueueElt(_this);
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(Branch, InstructionCore)
{
    return _ParamPointer(0);
}
//------------------------------------------------------------
void GetCallChainArray(StringRefArray1D* callChain)
{
    ExecutionContextRef exec = THREAD_EXEC();

    VIClump* runningQueueElt = exec->_runningQueueElt;
    VirtualInstrument* vi = runningQueueElt->OwningVI();
    VIClump *caller = runningQueueElt;
    Int32 count = 0;

    if (callChain) {
        do {  // preflight caller chain to count subVI depth
            caller = vi->Clumps()->Begin()->_caller;  // caller only set on entry clump
            if (caller)
                vi = caller->OwningVI();
            ++count;
        } while (caller);

        callChain->Resize1D(count);

        count = 0;
        vi = runningQueueElt->OwningVI();
        do {  // ! This loop must match the preflight in terms of assigning and testing caller
            SubString s = vi->VIName();
            callChain->At(count)->CopyFromSubString(&s);
            caller = vi->Clumps()->Begin()->_caller;
            if (caller)
                vi = caller->OwningVI();
            ++count;
        } while (caller);
    }
}
//------------------------------------------------------------
void AppendCallChainString(StringRef stringRef)
{
    ExecutionContextRef exec = THREAD_EXEC();
    VIClump* runningQueueElt = exec->_runningQueueElt;
    VirtualInstrument* vi = runningQueueElt->OwningVI();
    TypeManagerRef typeManager = vi->TheTypeManager();
    TypeRef itemType = typeManager->FindType(tsStringArrayType);
    StringRefArray1D* callChain = static_cast<StringRefArray1D*>(StringRefArray1D::New(itemType));
    GetCallChainArray(callChain);
    for (int i = 0; i < callChain->Length() - 1; i++) {
        stringRef->AppendStringRef(*callChain->BeginAt(i));
        stringRef->AppendCStr("->");
    }
    if (callChain->Length() > 0) {
        stringRef->AppendStringRef(*callChain->BeginAt(callChain->Length() - 1));
    }
    itemType->ClearData(&callChain);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(CallChain, StringRefArray1D*)
{
    GetCallChainArray(_Param(0));
    return _NextInstruction();
}
//------------------------------------------------------------
ExecutionContext::ExecutionContext()
{
    if (!_classInited) {
        _classInited = true;
        _culDeSac._function = (InstructionFunction) CulDeSac;
    }
    _breakoutCount = 0;
    _runningQueueElt = static_cast<VIClump*>(nullptr);
    _timer._observerList = nullptr;
}
//------------------------------------------------------------
#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // For smaller targets there may only one for the entire process, or processor
    ExecutionContext gSingleExecutionContext;
#endif
//------------------------------------------------------------
InstructionCore* ExecutionContext::SuspendRunningQueueElt(InstructionCore* nextInClump)
{
    VIREO_ASSERT(nullptr != _runningQueueElt)

    _runningQueueElt->_savePc = nextInClump;

    // Is there something else to run?
    _runningQueueElt = _runQueue.Dequeue();
    if (_runningQueueElt == nullptr) {
        // No, quit the exec loop as soon as possible
        _breakoutCount = 0;
        return &_culDeSac;
    } else {
        // Yes, pick up where it left off.
        return _runningQueueElt->_savePc;
    }
}


//------------------------------------------------------------
// ExecuteSlices - execute instructions in run queue repeatedly (numSlices at a time before breaking out and checking
// timers), until all clumps are finished or tickCount time is reached.
// See enum ExecSlicesResult for explanation of return values, or comments below where result is set.
Int32 /*ExecSlicesResult*/ ExecutionContext::ExecuteSlices(Int32 numSlices, Int32 millisecondsToRun)
{
    VIREO_ASSERT((_runningQueueElt == nullptr))
    PlatformTickType currentTime = gPlatform.Timer.TickCount();
    PlatformTickType breakOutTime = currentTime + gPlatform.Timer.MicrosecondsToTickCount(millisecondsToRun * 1000);

    _timer.QuickCheckTimers(currentTime);

    _runningQueueElt = _runQueue.Dequeue();
    InstructionCore* currentInstruction = _runningQueueElt ? _runningQueueElt->_savePc : nullptr;

    while (_runningQueueElt) {
        _breakoutCount = numSlices;

        VIREO_ASSERT((currentInstruction != nullptr))
        VIREO_ASSERT((nullptr == _runningQueueElt->_next))     // Should not be on queue
        VIREO_ASSERT((0 == _runningQueueElt->_shortCount))  // Should not be running if triggers > 0
        do {
#if VIREO_DEBUG_EXEC_PRINT_INSTRS
            SubString cName;
            THREAD_TADM()->FindCustomPointerTypeFromValue(static_cast<void*>(currentInstruction->_function), &cName);
            gPlatform.IO.Printf("Exec: %s\n", cName.Begin());
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
#else
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
#if VIVM_UNROLL_EXEC
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction, _function)(currentInstruction);
#endif
#endif
        } while (_breakoutCount-- > 0);

        currentTime = gPlatform.Timer.TickCount();
        _timer.QuickCheckTimers(currentTime);

        if (currentTime < breakOutTime) {
            if (_runningQueueElt) {
                if (!_runQueue.IsEmpty()) {
                    // Time left, still working, something else to do, rotate tasks
                    VIREO_ASSERT(currentInstruction != nullptr)
                    VIREO_ASSERT(_runningQueueElt != nullptr)

                    _runningQueueElt->_savePc = currentInstruction;
                    VIClump *eltToReQueue = _runningQueueElt;
                    _runningQueueElt = nullptr;
                    _runQueue.Enqueue(eltToReQueue);
                    _runningQueueElt = _runQueue.Dequeue();
                    currentInstruction = _runningQueueElt->_savePc;
                } else {
                    // Time left, still working, nothing else to do, continue as is.
                    VIREO_ASSERT(currentInstruction != nullptr)
                    VIREO_ASSERT(_runningQueueElt != nullptr)
                }
            } else {
                // Time left, nothing running, see if something woke up.
                _runningQueueElt = _runQueue.Dequeue();
                currentInstruction = _runningQueueElt ? _runningQueueElt->_savePc : nullptr;
                VIREO_ASSERT(currentInstruction != &_culDeSac)
            }
        } else if (_runningQueueElt) {
            // No time left, still working, save current state.
            VIREO_ASSERT(currentInstruction != &_culDeSac)
            _runningQueueElt->_savePc = currentInstruction;
            VIClump *eltToReQueue = _runningQueueElt;
            _runningQueueElt = nullptr;
            _runQueue.Enqueue(eltToReQueue);
        } else {
            // No time left, nothing running, fine, loop will exit.
        }
    }

    Int32 reply = kExecSlices_ClumpsFinished;
    if (!_runQueue.IsEmpty()) {
        reply = kExecSlices_ClumpsInRunQueue;
    }
    if (_timer.AnythingWaiting()) {
        if (reply != kExecSlices_ClumpsInRunQueue) {
            reply = kExecSlices_ClumpsWaiting;  // clumps waiting, but for less than 1 ms, we should be called again ASAP
            Int64 timeToWait = gPlatform.Timer.TickCountToMilliseconds(_timer.NextWakeUpTime()-currentTime);
            // This is the time of earliest scheduled clump to wake up; we return this time to allow the caller to sleep.
            // Callers are allowed to call us earlier, say, if they set an occurrence to give us something to do.
            // If we're called with nothing to run, we'll do nothing and return the remaining waiting time.
            if (timeToWait < 0)
                timeToWait = 0;
            else if (timeToWait > kMaxExecWakeUpTime)
                timeToWait = kMaxExecWakeUpTime;
            // Negative return value (kExecSlices_ClumpsInRunQueue or kExecSlices_ClumpsWaiting) means we should be
            // called again immediately/ASAP because there are clumps ready to run or will be in <1ms.
            // Zero return (kExecSlices_ClumpsFinished) means the VI is completely finished
            // and nothing is waiting to be scheduled.
            if (timeToWait > 0)
                reply = Int32(timeToWait);  // okay to truncate since kMaxExecWakeUpTime already checked range
            // else time is < 1ms (after rounding from platform tick type), keep kExecSlices_ClumpsWaiting return value
        }
    }
#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // TODO(PaulAustin): check global memory manager for allocation errors
#else
    if (THREAD_TADM()->_totalAllocationFailures > 0) {
        reply = kExecSlices_ClumpsFinished;
    }
#endif
    if (reply == kExecSlices_ClumpsFinished) {
        RunCleanupProcs(nullptr);  // Cleans up all control refs when top VI finishes (refs not associated with the completion of the VI they are linked to).
    }

    return reply;
}
//------------------------------------------------------------
void ExecutionContext::EnqueueRunQueue(VIClump* elt)
{
    VIREO_ASSERT((nullptr == elt->_next))
    VIREO_ASSERT((0 == elt->_shortCount))
    _runQueue.Enqueue(elt);
}
//------------------------------------------------------------
void ExecutionContext::LogEvent(EventLog::EventSeverity severity, ConstCStr message, ...) const
{
    EventLog tempLog(EventLog::StdOut);
    va_list args;
    va_start(args, message);
    tempLog.LogEventV(severity, -1, message, args);
    va_end(args);
}
//------------------------------------------------------------
#ifdef VIVM_SUPPORTS_ISR
// Interrupts should already be disabled when this is called
// so there is no need to add guards inside.
void ExecutionContext::IsrEnqueue(QueueElt* elt)
{
    VIVM_ASSERT((nullptr == elt->_next))
    if (elt->_wakeUpInfo == 0) {
        QueueElt* temp = _triggeredIsrList;
        elt->_next = temp;
        // Mark as triggered
        elt->_wakeUpInfo = 1;
        _triggeredIsrList = elt;
    }
}
#endif
DEFINE_VIREO_BEGIN(Execution)
    DEFINE_VIREO_REQUIRE(VirtualInstrument)
    DEFINE_VIREO_FUNCTION(FPSync, "p(i(String))")
    DEFINE_VIREO_FUNCTION(SetValueNeedsUpdateForTopLevelVI, "p(i(StaticTypeAndData value))")
    DEFINE_VIREO_FUNCTION(SetValueNeedsUpdate, "p(i(StaticTypeAndData value))")
    DEFINE_VIREO_FUNCTION(CheckValueNeedsUpdate, "p(i(StaticTypeAndData value) o(Boolean))")
    DEFINE_VIREO_FUNCTION(Trigger, "p(i(Clump))")
    DEFINE_VIREO_FUNCTION(Wait, "p(i(Clump))")
    DEFINE_VIREO_FUNCTION(Branch, "p(i(BranchTarget))")
    DEFINE_VIREO_FUNCTION(CallVI, "p(i(Clump) i(Instruction copyInProc) i(Instruction copyOutProc))")
    DEFINE_VIREO_FUNCTION(Done, "p()")
    DEFINE_VIREO_FUNCTION(Stop, "p(i(Boolean))")
    DEFINE_VIREO_FUNCTION(CallChain, "p(o(a(String *)))")
    DEFINE_VIREO_FUNCTION(CulDeSac, "p(i(Boolean))")
DEFINE_VIREO_END()
}  // namespace Vireo
