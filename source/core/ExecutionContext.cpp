/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Native Vireo exection methods
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"

namespace Vireo
{

//------------------------------------------------------------
Boolean ExecutionContext::_classInited;
_PROGMEM Instruction0 ExecutionContext::_culDeSac;

#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
TypeManagerRef  ExecutionContext::_theTypeManager;
//VIClump*      ExecutionContext::_triggeredIsrList;    // Elts waiting for something external to wake them up
Queue           ExecutionContext::_runQueue;			// Elts ready To run
VIClump*        ExecutionContext::_sleepingList;		// Elts waiting for something external to wake them up
VIClump*        ExecutionContext::_runningQueueElt;		// Elt actually running
IntSmall        ExecutionContext::_breakoutCount;
#endif


//------------------------------------------------------------
// When the CulDeSac function is hit there is nothing to do.
InstructionCore* VIVM_FASTCALL CulDeSac (Instruction0* _this _PROGMEM)
{
    return _this;
}
//------------------------------------------------------------
//For halt will cause exec to break out of its inner loop. The instruction should also have a null next field.
//This will prevent the QueueElt from being requeued.
// When the Done instruction is hit the clump is done, and will not
// run again until it is refired, (different from suspended)

VIREO_FUNCTION_SIGNATURE0(Done)
{
    ExecutionContext *exec = THREAD_EXEC();

    VIClump* runningQueueElt = exec->_runningQueueElt;
    VIREO_ASSERT( runningQueueElt != null )
    
    // If there was a caller it was a subVI call, restart the caller. If not, a topVI finished.
    VIClump *callerClump = runningQueueElt->_caller;
    if (callerClump) {
        
        // The return instruction will be the CallInstruction.
        CallVIInstruction *pCallInstruction = (CallVIInstruction*)callerClump->_savePc;
        VIREO_ASSERT( (pCallInstruction != null) )
        
        InstructionCore* pCopyOut = pCallInstruction->_piCopyOutSnippet;
        while (ExecutionContext::IsNotCulDeSac(pCopyOut)) {
            pCopyOut = _PROGMEM_PTR(pCopyOut,_function)(pCopyOut);
        }
        
        // Now that copy out has been done, move caller to next instruction.
        callerClump->_savePc = pCallInstruction->Next();
        
        // Now let the Caller proceed
        runningQueueElt->_caller = null;
        exec->EnqueueRunQueue(callerClump);
    } else {
        // Since there is no caller its a top VI
#ifndef VIREO_MICRO
        VirtualInstrument* vi = runningQueueElt->OwningVI();
        vi->GoIsDone();
#endif
    }
    
    // Now that any caller that needs to hoist data from the clump has been
    // taken care of, see if there are other clumps that are waiting in line.
    // What they are waiting for is unimportant here, only that they have been added the
    // waiting list for this clump.  (TODO allow prioritization)
    
    // Disconnect the list
    VIClump* waitingClump = runningQueueElt->_waitingClumps;
    runningQueueElt->_waitingClumps = null;
    
    while (null != waitingClump) {
        VIClump* clumpToEnqueue = waitingClump;
        waitingClump = waitingClump->_next;
        
        // null out next so it doesn't look like it is in a list.
        clumpToEnqueue->_next = null;
        exec->EnqueueRunQueue(clumpToEnqueue);
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
    _runningQueueElt = null;
    _breakoutCount = 0;

    return &_culDeSac;
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitMicroseconds, UInt32)
{
    PlatformTickType future = PlatformTime::TickCount() + PlatformTime::MicrosecondsToTickCount(_Param(0));
    return THREAD_EXEC()->WaitUntilTickCount(future, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitMilliseconds, UInt32)
{
    PlatformTickType future = PlatformTime::TickCount() + PlatformTime::MicrosecondsToTickCount((Int64)_Param(0) * 1000);
    return THREAD_EXEC()->WaitUntilTickCount(future, _NextInstruction());
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(WaitUntilMicroseconds, Int64)
{
    return THREAD_EXEC()->WaitUntilTickCount(PlatformTime::MicrosecondsToTickCount(_Param(0)), _NextInstruction());
}
//------------------------------------------------------------
InstructionCore* ExecutionContext::WaitUntilTickCount(PlatformTickType tickCount, InstructionCore* nextInClump)
{
	VIClump* current = _runningQueueElt;
	InstructionCore* next = SuspendRunningQueueElt(nextInClump);

	VIREO_ASSERT( (current->_next == null) )
	VIREO_ASSERT( (current->_shortCount == 0) )

	current->_wakeUpInfo =  tickCount;
    
    if (_sleepingList == null) {
        // No list, now there is one.
        current->_next = null;
        _sleepingList = current;
    } else {
        // Insert into the list based on wake-up time.
        VIClump** pFix = &_sleepingList;
        VIClump* node = *pFix;
        while (node && (tickCount > node->_wakeUpInfo)) {
            pFix = &(node->_next);
            node = *pFix;
        }
        current->_next = node;
        *pFix = current;
    }
    return next;
}
//------------------------------------------------------------
// Trigger - Decrement target fire count (may cause target to be activated)
// Trigger never wait.
VIREO_FUNCTION_SIGNATURE1(Trigger, VIClump)
{
    _ParamPointer(0)->Trigger();
    return _NextInstruction();
}

//------------------------------------------------------------
// Wait - it target clump is active then it waits for it to complete.
// if target clump is complete then there is nothing to wait on.
VIREO_FUNCTION_SIGNATURE1(Wait, VIClump)
{
    // If the target is running or is waiting for additional triggers
    // wait until it has completed. If shortcount == firecount it is considred done.
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
    // TODO move this to an Execution Context method?
    if (qe->_shortCount > 0) {
        // If the callee clump has a positive short count
        // it is not running there fore it is ok to run.
        // Make this current clump the caller.
        // Triggers left goes to 0; ( indicates we are active
        // Execute copy in code ( might hang from instruction, or from VI)
        // Instruction returned will be first in sub VI.
        VIREO_ASSERT( (qe->_shortCount == 1) )
        VIREO_ASSERT( (qe->_caller == null) )
        qe->_caller = THREAD_EXEC()->_runningQueueElt;

        // Copy in parameters
        InstructionCore* currentInstruction = _this->CopyInSnippet();
        while (ExecutionContext::IsNotCulDeSac(currentInstruction)) {
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
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
VIREO_FUNCTION_SIGNATURE3(ForLoopTail, InstructionCore, Int32, Int32)
{
    Int32 i = _Param(1) + 1;
    if (i < _Param(2)) {
        _Param(1) = i;
        return _ParamPointer(0);
    } else {
        // fall out of loop, don't update i
        return _NextInstruction();
    }
}
//------------------------------------------------------------
#ifndef VIREO_SINGLE_GLOBAL_CONTEXT
ExecutionContext::ExecutionContext(TypeManagerRef typeManager)
{
    ExecutionContext::ClassInit();
    
    _theTypeManager = typeManager;
    _breakoutCount = 0;
	_runningQueueElt = (VIClump*) null;
	_sleepingList = null;
}
#endif
//------------------------------------------------------------
void ExecutionContext::ClassInit()
{
	if (!_classInited)
    {
        _classInited = true;
        _culDeSac._function = (InstructionFunction) CulDeSac;
    }
}
//------------------------------------------------------------
#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // For smaller targets there may only one for the entire process, or processor
    ExecutionContext gSingleExecutionContext;
#else
    // Typically there might be just one exec system per thread, however in the case of
    // UI controls using an exec system,there may be several. It that case they should never be 
    // nested. When ExecuteSice is called from a thread this will be set up.
    VIVM_THREAD_LOCAL ExecutionContext* ExecutionContextScope::_threadsExecutionContext;
#endif
//------------------------------------------------------------
InstructionCore* ExecutionContext::SuspendRunningQueueElt(InstructionCore* nextInClump)
{
	VIREO_ASSERT(null != _runningQueueElt)
 
    _runningQueueElt->_savePc = nextInClump;
    
    // Is there something else to run?
    _runningQueueElt = _runQueue.Dequeue();
    if (_runningQueueElt == null) {
        // No, quit the exec loop as soon as possible
        _breakoutCount = 0;
        return &_culDeSac;
    } else {
        // Yes, pick up where it left off.
        return _runningQueueElt->_savePc;
    }
}
//------------------------------------------------------------
ExecutionState ExecutionContext::ExecuteSlices(Int32 numSlices, PlatformTickType tickCount)
{
#ifndef VIREO_SINGLE_GLOBAL_CONTEXT
    ExecutionContextScope scope(this);
#endif

    VIREO_ASSERT( (_runningQueueElt == null) )
    
    PlatformTickType currentTime  = PlatformTime::TickCount();
    PlatformTickType breakOutTime = currentTime + tickCount;
    
    if (_sleepingList != null) {
        CheckOccurrences(currentTime);
    }
    _runningQueueElt = _runQueue.Dequeue();
    InstructionCore* currentInstruction = _runningQueueElt ? _runningQueueElt->_savePc : null;
    
    while (_runningQueueElt)
    {
        _breakoutCount = numSlices;

        VIREO_ASSERT( (currentInstruction != null) )
        VIREO_ASSERT( (null == _runningQueueElt->_next) )		// Should not be on queue
        VIREO_ASSERT( (0 == _runningQueueElt->_shortCount) ) // Should not be running if triggers > 0
        do {
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
#ifdef VIVM_UNROLL_EXEC            
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
            currentInstruction = _PROGMEM_PTR(currentInstruction,_function)(currentInstruction);
#endif
        } while (_breakoutCount-- > 0);

        currentTime  = PlatformTime::TickCount();
        if (_sleepingList != null) {
            // Are any sleeping clumps ready to wake up.
            CheckOccurrences(currentTime);
        }

        if (currentTime < breakOutTime) {
            if (_runningQueueElt) {
                if (!_runQueue.IsEmpty()) {
                    // Time left, still working, something else to do, rotate tasks
                    VIREO_ASSERT(currentInstruction != null)
                    VIREO_ASSERT(_runningQueueElt != null)
                    
                    _runningQueueElt->_savePc = currentInstruction;
                    VIClump *eltToReQueue = _runningQueueElt;
                    _runningQueueElt = null;
                    _runQueue.Enqueue(eltToReQueue);
                    _runningQueueElt = _runQueue.Dequeue();
                    currentInstruction = _runningQueueElt->_savePc;
                } else {
                    // Time left, still working, nothing else to do, continue as is.
                    VIREO_ASSERT(currentInstruction != null)
                    VIREO_ASSERT(_runningQueueElt != null)
                }
            } else {
                // Time left, nothing running, see if something woke up.
                _runningQueueElt = _runQueue.Dequeue();
                currentInstruction = _runningQueueElt ? _runningQueueElt->_savePc : null;
                VIREO_ASSERT(currentInstruction != &_culDeSac)
            }
        } else if (_runningQueueElt) {
            // No time left, still working, save current state.
            VIREO_ASSERT(currentInstruction != &_culDeSac)
            _runningQueueElt->_savePc = currentInstruction;
            VIClump *eltToReQueue = _runningQueueElt;
            _runningQueueElt = null;
            _runQueue.Enqueue(eltToReQueue);
        } else {
            // No time left, nothing running, fine, loop will exit.
        }
    }
    
    ExecutionState reply = kExecutionState_None;
    if (!_runQueue.IsEmpty()) {
        reply = (ExecutionState) (reply | kExecutionState_ClumpsInRunQueue);
    }
    if (_sleepingList != null) {
        reply = (ExecutionState) (reply | kExecutionState_ClumpsWaitingOnTime);
    }
#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // TODO check global memory manager for allocation errors
#else
    if (TheTypeManager()->_totalAllocationFailures > 0) {
        reply = kExecutionState_None;
    }
#endif
	return reply;
}
//------------------------------------------------------------
void ExecutionContext::EnqueueRunQueue(VIClump* elt)
{
	VIREO_ASSERT((0 == elt->_shortCount))
	_runQueue.Enqueue(elt);
}
//------------------------------------------------------------
#ifdef VIVM_SUPPORTS_ISR
// Interrupts should already be disabled when this is called
// so there is no need to add guards inside.
void ExecutionContext::IsrEnqueue(QueueElt* elt)
{
	VIVM_ASSERT((null == elt->_next))
    if (elt->_wakeUpInfo == 0)
    {
        QueueElt* temp = _triggeredIsrList;
        elt->_next = temp;
        elt->_wakeUpInfo = 1; // Mark as triggered
        _triggeredIsrList = elt;
    }
}
#endif
//------------------------------------------------------------
void ExecutionContext::CheckOccurrences(PlatformTickType t)
{
	VIClump* pClump;
	VIClump* elt = _sleepingList;
	VIClump** pFix = &(_sleepingList); // previous next pointer to patch when removing element.

	// Enqueue all elements that are ready to run
	while(elt) {
		pClump = elt;
		if (pClump->_wakeUpInfo <= t) {
			// Remove
			*pFix = pClump->_next;
			pClump->_next = null;
			pClump->_wakeUpInfo = 0;  //Put in known state.
			_runQueue.Enqueue(elt);
		} else {
            // Items are sorted at insertion, so once a time in the future
            // is found quit the loop.
            break;
		}
		elt = *pFix; 
	}

#ifdef VIREO_SUPPORTS_ISR
    if (_triggeredIsrList)
    {
        VIREO_ISR_DISABLE
        elt = _triggeredIsrList;
        while(elt) {
            pClump = elt;
            elt = elt->_next;
            pClump->_next = null;
            pClump->_wakeUpInfo = 0;    //Put in known state.
			_runQueue.Enqueue(pClump);
        }
        _triggeredIsrList = null;
        VIREO_ISR_ENABLE
    }    
#endif
}
//------------------------------------------------------------
void ExecutionContext::LogEvent(EventLog::EventSeverity severity, const char* message, SubString *extra)
{
    EventLog tempLog(EventLog::StdOut);
    tempLog.LogEvent(severity, -1, message, extra);
}

DEFINE_VIREO_BEGIN(LabVIEW_Execution1)
    DEFINE_VIREO_FUNCTION(Trigger, "p(i(.Clump))")
    DEFINE_VIREO_FUNCTION(Wait, "p(i(.Clump))")
    DEFINE_VIREO_FUNCTION(ForLoopTail, "p(i(.BranchTarget) i(.Int32) o(.Int32))")
    DEFINE_VIREO_FUNCTION(Branch, "p(i(.BranchTarget))")
    DEFINE_VIREO_FUNCTION(CallVI, "p(i(.VI) i(.InstructionSnippet copyInProc) i(.InstructionSnippet copyOutProc))")
    DEFINE_VIREO_FUNCTION(WaitMilliseconds, "p(i(.UInt32))")
    DEFINE_VIREO_FUNCTION(WaitUntilMicroseconds, "p(i(.Int64))")
    DEFINE_VIREO_FUNCTION(WaitMicroseconds, "p(i(.UInt32))")
    DEFINE_VIREO_FUNCTION(Done, "p()")
    DEFINE_VIREO_FUNCTION(Stop, "p(i(.Boolean))")
    DEFINE_VIREO_FUNCTION(CulDeSac, "p(i(.Boolean))")
DEFINE_VIREO_END()
} // namespace Vireo
