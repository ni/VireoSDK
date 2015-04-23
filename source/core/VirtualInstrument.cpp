/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Native Vireo VI functions
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"

namespace Vireo
{
#ifndef VIREO_MICRO
//------------------------------------------------------------
// VirtualInstrument
//------------------------------------------------------------
NIError VirtualInstrument::Init(ExecutionContextRef context, Int32 clumpCount, TypeRef paramsType, TypeRef localsType, Int32 lineNumberBase, SubString* clumpSource)
{
    VIREO_ASSERT(_executionContext == null)
    VIREO_ASSERT( sizeof(VIClump) == _clumps->ElementType()->TopAQSize() )

    // The preliminary initialization defines a generic VI
    // finish it out by defining its type.
    _executionContext = context;
    _params->SetElementType(paramsType, false);
    _locals->SetElementType(localsType, false);
    _clumps->Resize1D(clumpCount);
    _lineNumberBase = lineNumberBase;
    _clumpSource = clumpSource;
    
    VIClump *pElt = _clumps->Begin();
    for (IntIndex i= 0; i < clumpCount; i++)
    {
        pElt->_fireCount = 1; // clumps default to 1  (0 would run instantly)
        pElt->_shortCount = 1;
        pElt->_owningVI = this;
        pElt++;
    }
    return kNIError_Success;
}
//------------------------------------------------------------
void VirtualInstrument::InitParamBlock()
{
    // Since there is no caller, the param block needs to be filled out
    // as if there is one.
    TypedObjectRef viParamBlock = this->Params();
    TypeRef viParamType = viParamBlock->ElementType();
    AQBlock1* pParamData = viParamBlock->RawBegin();
    
    Int32 count = viParamType->SubElementCount();
    // Make sure VI is in its initial state
    for (Int32 i = 0; i < count; i++) {
        TypeRef eltType = viParamType->GetSubElement(i);
        eltType->InitData(((AQBlock1*)pParamData) + eltType->ElementOffset());
    }
}
//------------------------------------------------------------
void VirtualInstrument::ClearTopVIParamBlock()
{
    // Since there is no caller, elements param block needs to be cleared out.
    TypedObjectRef viParamBlock = this->Params();
    TypeRef viParamType = viParamBlock->ElementType();
    AQBlock1* pParamData = viParamBlock->RawBegin();
    
    Int32 count = viParamType->SubElementCount();
    // Reset value to their default values
    // this will clear out any non flat data.
    for (Int32 i = 0; i < count; i++) {
        TypeRef eltType = viParamType->GetSubElement(i);
        
        if (!eltType->IsFlat() &&  (eltType->IsInputParam() || eltType->IsOutputParam())) {
            eltType->ClearData(((AQBlock1*)pParamData) + eltType->ElementOffset());
        }
    }
}
//------------------------------------------------------------
TypeRef VirtualInstrument::GetVIElementAddressFromPath(SubString* eltPath, void* pStart, void** ppData, Boolean allowDynamic)
{
    // Search the locals and paramBlock for the desired element
    TypedObjectRef locals = this->Locals();
    TypedObjectRef paramBlock = this->Params();
    
    TypeRef actualType = locals->ElementType()->GetSubElementAddressFromPath(eltPath, locals->RawBegin(), ppData, allowDynamic);
    if (actualType == null && paramBlock) {
        actualType = paramBlock->ElementType()->GetSubElementAddressFromPath(eltPath, paramBlock->RawBegin(), ppData, allowDynamic);
    }
    return actualType;
}
//------------------------------------------------------------
void VirtualInstrument::PressGo()
{
    VIClump  *rootClump = Clumps()->Begin();
    
    // If there is no code, or its running there is nothing to do.
    if ( rootClump == null || rootClump->ShortCount() < 1)
        return;
        
    InitParamBlock();
        
    VIREO_ASSERT( rootClump->FireCount() == 1 )
    rootClump->Trigger();
}
//------------------------------------------------------------
void VirtualInstrument::GoIsDone()
{
    // If the results are cleared out when done,
    // there is nothing for the the debugger to read.
    // So this is postponed until the VI the cleared
    // ClearParamBlock();
}
#endif
//------------------------------------------------------------
// If the QE is running, then suspend current QE and add it to this QE's list
// if the QE is idle, then no need to wait, it has finished running.
// Semantically clumps should only wait on clumps they have a known relationship to
// for example a clump they started. That means the clump it is waiting on finishes
// the target clump can not be restarted. Thus no race conditions exits.
// from

// Clump0:  B-------T--------------W----------H
//                  \              /
// Clump1:           B------------H
//
//
// Clump0:  B-------T----------------W-W-------H
//                  \               / /
// Clump1:           B---TTH       / /
//                       \\       / /
// Clump3:                \B-----H /
//                         \      /
// Clump4:                  B----H
//
// TODO Wait Many?, right way to wait till first, or allow for one that is a time out.
// Easy enough to do as a var arg function.
//
void VIClump::Trigger()
{
    // TODO Make sure there is a MT version of this (or all are MT safe)
    VIREO_ASSERT(_shortCount > 0)
    
    if (--_shortCount == 0) {
        THREAD_EXEC()->EnqueueRunQueue(this);
    }
}
//------------------------------------------------------------
void VIClump::InsertIntoWaitList(VIClump* elt)
{
    // The clump being added to this list should not be in another list.
    VIREO_ASSERT(null == elt->_next)
    
    elt->_next = _waitingClumps;
    _waitingClumps = elt;
}
//------------------------------------------------------------
void VIClump::AppendToWaitList(VIClump* elt)
{
    // The clump being added to this list should not be in another list.
    VIREO_ASSERT (null == elt->_next )

    // Add to the end of the list.
    if (_waitingClumps == null) {
        _waitingClumps = elt;
    } else {
        VIClump* waiting = _waitingClumps;
        while (waiting-> _next != null) {
            waiting = waiting-> _next;
        }
        waiting->_next = elt;
    }
}
//------------------------------------------------------------
WaitableState* VIClump::ReserveWaitStatesWithTimeout(Int32 count, PlatformTickType tickCount)
{
    VIREO_ASSERT(_waitCount == 0);
    if (count <= 2) {
        _waitCount = count;
        _waitStates[0]._clump = this;
        _waitStates[1]._clump = this;
        OwningContext()->_timer.InitWaitableTimerState(_waitStates, tickCount);
        return _waitStates;
    } else {
        return null;
    }
}
//------------------------------------------------------------
void VIClump::ClearWaitStates()
{
    // When an instruction retries and decides its time to continue for any reason
    // the instruction function need to clear all WS that might wake the clump up.
    if (_waitCount) {
        for (WaitableState* pWS = _waitStates; _waitCount; pWS++) {
            if (pWS->_object) {
                pWS->_object->RemoveWaitableState(pWS);
                VIREO_ASSERT(pWS->_object == null);
            }
            _waitCount -= 1;
        }
    }
}
//------------------------------------------------------------
InstructionCore* VIClump::WaitUntilTickCount(PlatformTickType tickCount, InstructionCore* nextInstruction)
{
    VIREO_ASSERT( _next == null )
    VIREO_ASSERT( _shortCount == 0 )

    ReserveWaitStatesWithTimeout(1, tickCount);
    return this->WaitOnWaitStates(nextInstruction);
}
//------------------------------------------------------------
InstructionCore* VIClump::WaitOnWaitStates(InstructionCore* nextInstruction)
{
    if (_waitCount) {
        // Hack, single one is a timer so it doesn't retry. There will be nothing to clear.
        if (_waitCount == 1)
            _waitCount = 0;
        return OwningContext()->SuspendRunningQueueElt(nextInstruction);
    } else {
        return nextInstruction;
    }
}
#ifndef VIREO_MICRO
//------------------------------------------------------------
// InstructionAllocator
//------------------------------------------------------------
void InstructionAllocator::AddRequest(size_t count)
{
    // Can't add requests in pass two.
    VIREO_ASSERT(_next == null);
    _size += count;
}
//------------------------------------------------------------
void InstructionAllocator::Allocate (TypeManagerRef tm)
{
    VIREO_ASSERT(_next == null);
    if (_size) {
        _next = (AQBlock1*) tm->Malloc(_size);
    }
}
//------------------------------------------------------------
void* InstructionAllocator::AllocateSlice(size_t count)
{
    if (count <= _size) {
        _size -= count;
        AQBlock1* r = _next;
        _next += count;
        return r;
    } else {
        VIREO_ASSERT(false);
        return null;
    }
}
//------------------------------------------------------------
// ClumpParseState
//------------------------------------------------------------
ClumpParseState::ClumpParseState(ClumpParseState* cps)
{
    Construct(cps->_clump, cps->_cia, cps->_approximateLineNumber, cps->_pLog);
}
//------------------------------------------------------------
ClumpParseState::ClumpParseState(VIClump* clump, InstructionAllocator *cia, EventLog *pLog)
{
    Construct(clump, cia, 0, pLog);
}
//------------------------------------------------------------
void ClumpParseState::Construct(VIClump* clump, InstructionAllocator *cia, Int32 lineNumber, EventLog *pLog)
{
    _pWhereToPatch = null;

    _totalInstructionCount = 0;
    _totalInstructionPointerCount = 0;
    
    _argCount = 0;
    _argPatchCount = 0;
    _patchInfoCount = 0;
    _pVarArgCount = null;
    _clump = clump;
    _vi = clump->OwningVI();
    _pLog = pLog;
    _approximateLineNumber = lineNumber;
    _cia = cia;
    _bIsVI = false;
        
    _perchCount = 0;
    _recordNextInstructionAddress = -1;
    for (Int32 i = 0; i < kMaxPerches; i ++) {
        _perches[i] = kPerchUndefined;
    }
    
    _baseViType = _clump->TheTypeManager()->FindType(VI_TypeName);
    _baseReentrantViType = _clump->TheTypeManager()->FindType(ReentrantVI_TypeName);
    
    memset(&_patchInfos, 0, sizeof (_patchInfos));
}
//------------------------------------------------------------
void ClumpParseState::StartSnippet(InstructionCore** pWhereToPatch)
{
    _pWhereToPatch = pWhereToPatch;
}
//------------------------------------------------------------
void ClumpParseState::RecordNextHere(InstructionCore** where)
{
    if (!_cia->IsCalculatePass()) {
        VIREO_ASSERT(_pWhereToPatch == null)
        _pWhereToPatch = where;
    }
}
//------------------------------------------------------------
InstructionCore* ClumpParseState::AllocInstructionCore(Int32 argumentCount)
{
    InstructionCore* instruction = null;
    Int32 size = sizeof(InstructionCore) + (sizeof(void*) * argumentCount);
    
    // Allocate the instruction
    if (_cia->IsCalculatePass()) {
        _cia->AddRequest(size);
        return kFakedInstruction;
    } else {
        instruction = (InstructionCore*)_cia->AllocateSlice(size);
    }
    
    instruction->_function = null;
    
    // Patch up the previous jump point as necessary
    // For the first instruction in a block there will be a address to patch to jump
    // to this block. In packed mode, once it is set no more "next" patches will be done for the block
    if (_pWhereToPatch) {
        *_pWhereToPatch = instruction;
        _pWhereToPatch = null;
    }
    
    return instruction;
}
//------------------------------------------------------------
InstructionCore* ClumpParseState::CreateInstruction(TypeRef instructionType, Int32 argCount, void* args[])
{
    InstructionCore* instruction = null;
    
    VIREO_ASSERT(instructionType->TopAQSize() == sizeof(void*))
    
    if (instructionType->TopAQSize() == sizeof(void*) && instructionType->HasCustomDefault()) {
        
        // Alloc the memory and set the pointer to the runtime function
        instruction = this->AllocInstructionCore(argCount);        
        if (!_cia->IsCalculatePass()) {
            instructionType->InitData(&instruction->_function);
            
            GenericInstruction *ginstruction = (GenericInstruction*)instruction;
            for (Int32 i=0; i<argCount; i++) {
                ginstruction->_args[i] = args[i];
            }
        }
    }
    return instruction;
}
//------------------------------------------------------------
TypeRef ClumpParseState::ReadFormalParameterType()
{
    _argumentState = kArgumentNotResolved;
    if (!_instructionType)
        return null;
    
    TypeRef type = _instructionType->GetSubElement(_formalParameterIndex++);
    
    if (type) {
        _formalParameterType = type;
    } else if (_pVarArgCount) {
        // Reading past the end is OK for VarArg functions, the last parameter type will be re-used.
    } else {
        // read past end, and no var arg
        _formalParameterType = null;
        _argumentState = kArgumentTooMany;
    }
    return _formalParameterType;
}
//------------------------------------------------------------
void ClumpParseState::SetClumpFireCount(Int32 fireCount)
{
    // TODO some bootstrap that could be a bit cleaner.
    // If the short count is less than the fire count then the clump was enqueued
    // before it has been fully loaded. Don't stomp that
    // This should only be true for root clumps
    if (_clump->_fireCount == _clump->_shortCount) {
        _clump->_shortCount = fireCount;
    }
    _clump->_fireCount = fireCount;
}
//------------------------------------------------------------
TypeRef ClumpParseState::ReresolveInstruction(SubString* opName, Boolean allowErrors)
{
    // A new instruction function is being substituted for the
    // on original map (used for generics and SubVI calling)
    VIREO_ASSERT(_instructionType != null)
    TypeRef foundType = _clump->TheTypeManager()->FindType(opName);
    if (foundType == null && allowErrors)
        return null;
    _instructionPointerType = foundType;
    // For now reresolving should map to a native function. In time that will change
    // when it does this will look more like StartInstruction.
    VIREO_ASSERT(_instructionPointerType != null);
    VIREO_ASSERT(_instructionPointerType->BitEncoding() == kEncoding_Pointer);
    _instructionType = _instructionPointerType->GetSubElement(0);
    VIREO_ASSERT(_instructionType != null);

    return _instructionType;
}
//------------------------------------------------------------
TypeRef ClumpParseState::StartNextOverload()
{
    _instructionType = null;
    _formalParameterIndex = 0;
    _formalParameterType = null;
    _instructionPointerType = null;
    _argCount = 0;
    if (_argPatchCount > 0) {
        _patchInfoCount -= _argPatchCount;
        _argPatchCount = 0;
    }
    _bIsVI = false;
    
    NamedTypeRef t = _nextFuncitonDefinition;
    if (t) {
        if (t == _genericFuncitonDefinition) {
            t = t->NextOverload();
        }
        _nextFuncitonDefinition = t ? t->NextOverload() : null;
    }
    if (!t) {
        // Got to the end of the list. If there is generic loader use it last
        t = _genericFuncitonDefinition;
        _genericFuncitonDefinition = null;
    }
    
    if (t && t->BitEncoding() == kEncoding_Pointer) {
        // Looks like it resolved to a native function
        _instructionPointerType = t;
        _instructionType = _instructionPointerType->GetSubElement(0);
    } else if (t && (t->IsA(_baseViType))) {
        // Also covers reentrant VIs since reentrant VIs inherit from simple VIs
        _bIsVI = true;
        VirtualInstrument* vi = AddSubVITargetArgument(t);
        _instructionPointerType = t;
        _instructionType = vi->Params()->ElementType();
    }
    return _instructionType;
}
//------------------------------------------------------------
TypeRef ClumpParseState::StartInstruction(SubString* opName)
{
    _nextFuncitonDefinition = _clump->TheTypeManager()->FindTypeCore(opName);
    _genericFuncitonDefinition = null;

    // Look for a generic loader.
    for (NamedTypeRef overload = _nextFuncitonDefinition; overload; overload = overload->NextOverload()) {
        if (overload->PointerType() == kPTGenericFunctionCodeGen) {
            _genericFuncitonDefinition = overload;
            break;
        }
    }
    _hasMultipleDefinitions = _nextFuncitonDefinition ? _nextFuncitonDefinition->NextOverload() != null : false;
    return StartNextOverload();
}
//------------------------------------------------------------
void ClumpParseState::ResolveActualArgumentAddress(SubString* argument, AQBlock1** ppData)
{
    _actualArgumentType = null;
    *ppData = null;
    
    // "." prefixed symbols are type symbols from the TypeManager
    if (argument->ComparePrefixCStr(".")) {
        _actualArgumentType = _clump->TheTypeManager()->FindType("Type");
        
        Utf8Char dot;
        argument->ReadRawChar(&dot);
        TypeRef type = _clump->TheTypeManager()->FindType(argument);
        if (type != null) {
            _argumentState = kArgumentResolvedToGlobal;
            // If it is to be passed as an input then that is OK.
            // Literals cannot be used as outputs.
            UsageTypeEnum usageType = _formalParameterType->ElementUsageType();
            if (usageType != kUsageTypeInput) {
                _argumentState = kArgumentNotMutable;
                return;
            }
        
            // Create an anonymous type const for the type resolved.
            DefaultValueType *cdt = DefaultValueType::New(_clump->TheTypeManager(), _actualArgumentType, false);
            TypeRef* pDef = (TypeRef*)cdt->Begin(kPAInit);
            if (pDef) {
                *pDef = type;
            }
            cdt = cdt->FinalizeConstant();
            *ppData = (AQBlock1*)cdt->Begin(kPARead);
        }
        return;
    }
    
    // See if actual argument is '*' meaning use the default/unwired behaviour.
    if (argument->CompareCStr(tsWildCard)) {
        _actualArgumentType = FormalParameterType();
        if (!_actualArgumentType->IsFlat()) {
            // Define a DefaultValue type. As a DV it will never merge to another instance.
            // Since it has no name it cannot be looked up, but it will be freed once the TADM/ExecutionContext is freed up.
            DefaultValueType *cdt = DefaultValueType::New(_clump->TheTypeManager(), _actualArgumentType, false);
            cdt = cdt->FinalizeConstant();
            *ppData = (AQBlock1*)cdt->Begin(kPARead); // * passed as a param means null
        } else {
            // For flat data, the call instruction logic for VIs will initialize the callee parameter
            // to the default value. For native instructions a null parameter value is passed.
        }
        _argumentState = kArgumentResolvedToDefault;
        return;
    }

    // If its not a symbol name then it should be a value.
    if (argument->ClassifyNextToken() != TokenTraits_SymbolName) {
        // Set the resolved argument type to what the constant should be so
        // the parameter is recognized as being there.
        _actualArgumentType = FormalParameterType();
        UsageTypeEnum usageType = _formalParameterType->ElementUsageType();
        if (usageType != kUsageTypeInput) {
            _argumentState = kArgumentNotMutable;
            return;
        }
        
        _argumentState = kArgumentResolvedToDefault;
        DefaultValueType *cdt = DefaultValueType::New(_clump->TheTypeManager(), _actualArgumentType, false);
        TypeDefiner::ParseValue(_clump->TheTypeManager(), cdt, _pLog, _approximateLineNumber, argument);
        cdt = cdt->FinalizeConstant();
        *ppData = (AQBlock1*)cdt->Begin(kPARead); // * passed as a param means null
        return;
    }
    
    // See if it is in the VI's locals or paramblock
    _actualArgumentType = _vi->GetVIElementAddressFromPath(argument, _vi, (void**)ppData, false);
    if (_actualArgumentType) {
        _argumentState = kArgumentResolvedToVIElement;
        return;
    }
    
    // See if it is a global value.
    // the first part of the path is the symbol. Beyond that it drills into the variable.
    SubString pathHead, pathTail;
    argument->SplitString(&pathHead, &pathTail, '.');
    _actualArgumentType = _clump->TheTypeManager()->FindType(&pathHead);
    if (_actualArgumentType != null) {
        // The symbol was found in the TypeManager chain. Get a pointer to the value.
        
        UsageTypeEnum usageType = _formalParameterType->ElementUsageType();
        AQBlock1* pData = null;

        // TODO access-option based on parameter direction;
        if (usageType == kUsageTypeInput) {
            pData = (AQBlock1*)_actualArgumentType->Begin(kPARead);
        } else if (usageType == kUsageTypeOutput) {
            pData = (AQBlock1*)_actualArgumentType->Begin(kPAWrite);
        } else if (usageType == kUsageTypeInputOutput) {
            pData = (AQBlock1*)_actualArgumentType->Begin(kPAReadWrite);
        } else {
            pData = null;
        }

        if (!pData) {
            _argumentState = kArgumentNotMutable;
            return;
        }

        // If there is a dot after the head, then there is more to parse.
        if (pathTail.Length()) {
            // If the top type is a cluster then the remainder is field name qualifier path.
            void* pDataStart = pData;
            _actualArgumentType = _actualArgumentType->GetSubElementAddressFromPath(&pathTail, pDataStart, (void**)&pData, false);
        }
        if (_actualArgumentType) {
            *ppData = pData;
            _argumentState = kArgumentResolvedToGlobal;
            return;
        }
    }
}
//------------------------------------------------------------
void ClumpParseState::AddDataTargetArgument(SubString* argument, Boolean prependType)
{
    AQBlock1* pData = null;
    ResolveActualArgumentAddress(argument, &pData);
    
    if (ActualArgumentType() == null) {
        return;
    }
    
    SubString dsTypeName = ActualArgumentType()->Name();
    
    if (prependType) {
        // StaticTypeAndData formal parameters get passed the type and pointer to the data.
        // they are fully polymorphic.
        InternalAddArg(null, ActualArgumentType());
	} else if (dsTypeName.CompareCStr(tsWildCard) && FormalParameterType()->IsOptionalParam()) {
        // '*' as an argument means no value is passed. If its marks as options this is OK
        // the '*' is not the generic type in this case.
	} else {
        if (!ActualArgumentType()->IsA(FormalParameterType())) {
            _argumentState = kArgumentTypeMismatch;
        }
    }
    
    InternalAddArg(ActualArgumentType(), pData);
}
//------------------------------------------------------------
void ClumpParseState::InternalAddArg(TypeRef actualType, void* arg)
{
    _argTypes[_argCount] = actualType;
    _argPointers[_argCount++] = arg;
    
    if (_pVarArgCount) {
        *_pVarArgCount += 1;
    }
}
//------------------------------------------------------------
void ClumpParseState::InternalAddArgNeedingPatch(PatchInfo::PatchType patchType, void** whereToPeek)
{
    // Note which argument needs patching.
    // WhereToPeek is the location that will have the resolved value later.
    // it should point to null when checked if not yet resolved.
    _argPatches[_argPatchCount++] = _argCount;
    if (_patchInfoCount < kMaxPatchInfos) {
        PatchInfo *pPatch = &_patchInfos[_patchInfoCount++];
        pPatch->_patchType = patchType;
        pPatch->_whereToPeek = whereToPeek;
        InternalAddArg(null, pPatch);
    } else {
        LogEvent(EventLog::kSoftDataError, 0, "(Error \"Too many forward patches\")\n");
    }
}
//------------------------------------------------------------
void ClumpParseState::AddVarArgCount()
{
    // The VarArg count is a constant passed by value to the instruction.
    // It indicates how many pointers arguments are passed after the VarArg
    // normal Parameter token.
    _pVarArgCount = (size_t*) &_argPointers[_argCount++];
    *_pVarArgCount = 0;
}
//------------------------------------------------------------
void ClumpParseState::MarkPerch(SubString* perchToken)
{
    if (_cia->IsCalculatePass())
        return;
    
    // For a perch(n) instruction make sure it has not been defined before
    // and flag the emitter to record the address of the next instruction
    // as the target location to jump to for branches to this perch.

    IntMax perchIndex;
    if (perchToken->ReadInt(&perchIndex)) {
        if (perchIndex<kMaxPerches) {
            if (_perches[perchIndex]<0) {
                LogEvent(EventLog::kSoftDataError, 0, "Perch '%d' duplicated in clump", perchIndex);
            }
            if (_recordNextInstructionAddress<0) {
                // Reserve the perch till the next instruction is emitted
                // null will never be a valid instruction address.
                _perches[perchIndex] = kPerchBeingAlocated;
                _recordNextInstructionAddress = (Int32)perchIndex;
            } else {
                LogEvent(EventLog::kSoftDataError, 0, "Double Perch '%d' not supported", perchIndex);
            }
        } else {
            LogEvent(EventLog::kSoftDataError, 0, "Perch '%d' exceeds limits", perchIndex);
        }
    } else {
        LogEvent(EventLog::kSoftDataError, 0, "Perch label syntax error '%.*s'", FMT_LEN_BEGIN(perchToken));
    }
}
//------------------------------------------------------------
void ClumpParseState::AddBranchTargetArgument(SubString* branchTargetToken)
{
    IntMax perchIndex;
    if (branchTargetToken->ReadInt(&perchIndex)) {
        if (perchIndex<kMaxPerches) {
            if ((_perches[perchIndex] != kPerchUndefined) && (_perches[perchIndex] != kPerchBeingAlocated)) {
                // The perch address is already known, use it.
                _argumentState = kArgumentResolvedToPerch;
                InternalAddArg(null, _perches[perchIndex]);
            } else {
                // Remember the address of this perch as place to patch
                // once the clump is finished.
                _argumentState = kArgumentResolvedToPerch;
                InternalAddArgNeedingPatch(PatchInfo::Perch, (void**)&_perches[perchIndex]);
            }
        } else {
           // TODO function too complex
        }
    } else {
        _argumentState = kArgumentNotResolved;
    }
}
//------------------------------------------------------------
void ClumpParseState::AddClumpTargetArgument(SubString* clumpIndexToken)
{
    IntMax clumpIndex;
    clumpIndexToken->ReadInt(&clumpIndex);
    if (clumpIndex<0 || clumpIndex >= _vi->Clumps()->Length()) {
        _argumentState = kArgumentNotResolved;
        return;
    }
    
    _argumentState = kArgumentResolvedToClump;
    InternalAddArg(null, _vi->Clumps()->BeginAt((IntIndex)clumpIndex));
    return;
}
//------------------------------------------------------------
VirtualInstrument* ClumpParseState::AddSubVITargetArgument(TypeRef viType)
{
    static SubString strReentrantVI(ReentrantVI_TypeName);
    VirtualInstrument *vi = null;
    
    // The primary instance of the actual VI will be the value of the type.
    // If its not reentrant then every caller uses that instance. If it is, then a copy needs to be made.
    
    TypedArrayCoreRef* pObj = (TypedArrayCoreRef*) viType->Begin(kPARead);
    if ((*pObj)->Type()->IsA(_baseReentrantViType)  && !_cia->IsCalculatePass()) {
        // Each reentrant VI will be a copy of the original.
        // If it is the calculate pass skip this and the use the original for its type.
        TypeManagerRef tm = this->_vi->OwningContext()->TheTypeManager();
        
        // Reentrant VI clones exist in TM the caller VI is in.
        DefaultValueType *cdt = DefaultValueType::New(tm, viType, false);
        VirtualInstrumentObjectRef pVICopy = *(VirtualInstrumentObjectRef*)cdt->Begin(kPARead);
        vi = (VirtualInstrument*) pVICopy->RawObj();
    } else {
        // Non reentrant VIs use the original type
        vi =  (VirtualInstrument*) (*pObj)->RawObj();
    }
    
    if (vi != null) {
        _argumentState = kArgumentResolvedToClump;
        InternalAddArg(null, vi->Clumps()->Begin());
    }
    return vi;
}
//------------------------------------------------------------
Int32 ClumpParseState::AddSubSnippet()
{
    // The sub snippet will not be built yet so just add null.
    // SubSnippets have to be started after the current instruction
    // has been emitted so the memory will be allocated in the correct order.
    // However the parameter position can be returned
    
    InternalAddArg(null, (void*) null);
    return _argCount - 1;
}
//------------------------------------------------------------
void ClumpParseState::BeginEmitSubSnippet(ClumpParseState* subSnippet, InstructionCore* owningInstruction,
                                          Int32 argIndex)
{
    GenericInstruction *pInstruction = (GenericInstruction*) owningInstruction;
    
    // For implicit next instructions the sub snippet will be where the "next" field points to
    // in packed instruction mode that means the instruction that immediately follows the current
    // instruction, so there is no actual pointer

    InstructionCore** ppNext;
    if  (argIndex >= 0) {
        ppNext = (InstructionCore**)&pInstruction->_args[argIndex];
    } else {
        // No place to patched (should be implicit next instruciton)
        ppNext = null;
    }
    subSnippet->StartSnippet(ppNext);
}
//------------------------------------------------------------
void ClumpParseState::EndEmitSubSnippet(ClumpParseState* subSnippet)
{
    subSnippet->CommitSubSnippet();
    _totalInstructionCount += subSnippet->_totalInstructionCount;
    _totalInstructionPointerCount += subSnippet->_totalInstructionPointerCount;
}
//------------------------------------------------------------
void ClumpParseState::LogEvent(EventLog::EventSeverity severity, Int32 lineNumber, ConstCStr message, ...)
{
    if (lineNumber != 0) {
        _approximateLineNumber = lineNumber;
    }
    
    va_list args;
    va_start (args, message);
    _pLog->LogEventV(severity, _approximateLineNumber, message, args);
    va_end (args);
}
//------------------------------------------------------------
void ClumpParseState::LogArgumentProcessing(Int32 lineNumber)
{
    _approximateLineNumber = lineNumber;
    EventLog::EventSeverity severity = LastArgumentError() ? EventLog::kSoftDataError : EventLog::kTrace;
    ConstCStr simpleMessage = null;
    switch (_argumentState)
    {
        case kArgumentNotResolved:
            // Ignore arguments if the instruction was not resolved.
            if (_instructionType)
                simpleMessage = "Argument not resolved";
            break;
        case kArgumentTooMany:
            simpleMessage = "Too many arguments";
            break;
        case kArgumentTooFew:
            simpleMessage = "Too few arguments";
            break;
        case kArgumentTypeMismatch:
            {
            SubString formalParameterTypeName = FormalParameterType()->Name();
            LogEvent(EventLog::kSoftDataError, lineNumber, "Type mismatch, argument should be '%.*s'",
                     FMT_LEN_BEGIN(&formalParameterTypeName));
            }
            break;
        case kArgumentNotOptional:          simpleMessage = "Argument not optional";    break;
        case kArgumentNotMutable:           simpleMessage = "Argument not mutable";     break;
        // Good states
        case kArgumentResolvedToClump:      simpleMessage = "Argument is clump";        break;
        case kArgumentResolvedToVIElement:  simpleMessage = "Argument is VI element";   break;
        case kArgumentResolvedToPerch:      simpleMessage = "Argument is perch";        break;
        case kArgumentResolvedToParameter:  simpleMessage = "Argument is parameter";    break;
        case kArgumentResolvedToDefault:    simpleMessage = "Argument is default";      break;
        default:                            simpleMessage = "Unknown argument type";          break;
    }
    if (simpleMessage) {
        LogEvent(severity, lineNumber, "%s '%.*s'", simpleMessage, FMT_LEN_BEGIN(&_parserFocus));
    }
}
//------------------------------------------------------------
// EmitCallVICopyProcs
// at this point the args array has the list of argument addresses (in or out)
// one for each passed argument, and the types have been checked against
// the VI's parameter block.
InstructionCore* ClumpParseState::EmitCallVIInstruction()
{
    VIREO_ASSERT(this->_argCount > 0);  // TODO arg[0] is subVI
    
    ClumpParseState snippetBuilder(this);
   
    // Save the arguments that will be passed to/from the subVI.
    AQBlock1*       viArgPointers[kMaxArguments];
    TypeRef         viArgTypes[kMaxArguments];
    IntIndex        viArgCount = _argCount-1;
    
    if ( viArgCount >=kMaxArguments)
        return null;
    
    VIClump* targetVIClump = (VIClump*)_argPointers[0];
    if (viArgCount > 0) {
        memcpy(viArgPointers, &_argPointers[1], viArgCount * sizeof(size_t));
        memcpy(viArgTypes, &_argTypes[1], viArgCount * sizeof(size_t));
    }
    
    // The initial argument is the pointer to the clump. Keep that one
    // and ad the real ones that will be used for the low level instruciton.
    _argCount = 1;
    
    // No explicit field, the first copy-in instruction follows this instructions.
    Int32 copyInId = -1;
    AddSubSnippet();    // Reserve storage for the explicit next pointer (_piNext)
    Int32 copyOutId = AddSubSnippet();

    _bIsVI = false;
    SubString  opName("CallVI");
    _instructionType = ReresolveInstruction(&opName, false);
    
    // Recurse now that the instruction is a simple one.
    CallVIInstruction* callInstruction  = (CallVIInstruction*) EmitInstruction();
    
    VirtualInstrument* vi =targetVIClump->OwningVI();
    TypedObjectRef viParamBlock = vi->Params();
    
    TypeRef viParamType = viParamBlock->ElementType();
    AQBlock1* pParamData = viParamBlock->RawBegin();
    
    //-----------------
    // Start generating sub snippets
    // First: copy-in-snippet, non-flat data will just be top copied in
    SubString  initOpName("Init");
    SubString  copyOpName("Copy");
    SubString  clearOpName("Clear");
    SubString  copyTopOpName("CopyTop");
    SubString  zeroOutTopOpName("ZeroOutTop");
    
    BeginEmitSubSnippet(&snippetBuilder, callInstruction, copyInId);
    for (IntIndex i = 0; i < viArgCount; i++) {
        TypeRef paramType = viParamType->GetSubElement(i);
        IntIndex offset = paramType->ElementOffset();
        if (!paramType->IsFlat()) {
            // Array parameters are top-copied in since the caller always owns the buffer
            // unless none is passed, in which case one is temporarily created in
            // in the sub VI param block.
            if (viArgPointers[i] != null) {
                // For parameters to subVIs that are objects, only the pointer is copied.
                snippetBuilder.StartInstruction(&copyTopOpName);
                snippetBuilder.InternalAddArg(viArgTypes[i], viArgPointers[i]);
                snippetBuilder.InternalAddArg(paramType, pParamData + offset);
                snippetBuilder.EmitInstruction(); 
            }
        } else {
            // Flat data is copied, if no argument is passed in the the param block element is
            // initialized to its default value.
            if (viArgPointers[i] != null && paramType->IsInputParam()) {
                // Not an object, do a normal copy.
                snippetBuilder.StartInstruction(&copyOpName);
                snippetBuilder.InternalAddArg(viArgTypes[i], viArgPointers[i]);
                snippetBuilder.InternalAddArg(paramType, pParamData + offset);
                snippetBuilder.EmitInstruction();
            }
        }
        if (viArgPointers[i] == null || (paramType->IsOutputParam() && paramType->HasCustomDefault())) {
            // If source location is null, no argument was passed.
            // Generate instruction to initialize parameter to default value.
            // For outputs we re-init to the default value if there is one.(in case the subvi does not write to it, or reads it locally)
            snippetBuilder.StartInstruction(&initOpName);
            snippetBuilder.InternalAddArg(null, paramType);
            snippetBuilder.InternalAddArg(paramType, pParamData + offset);
            snippetBuilder.EmitInstruction();
        }
    }
    EndEmitSubSnippet(&snippetBuilder);
    
    // Second: copy-out-snippet, non-flat still get top-copied
    // since empty singleton objects may have been promoted to instances
    // some parameters may be in and out.

    BeginEmitSubSnippet(&snippetBuilder, callInstruction, copyOutId);
    //-----------------
    for (IntIndex i = 0; i < viArgCount; i++) {
        TypeRef paramType = viParamType->GetSubElement(i);
        
        // Copy out if there is place to put it. No need to copy out simple arrays
        // If arrays are inside clusters they will be copied out, tough the top pointer should be the same
        if (paramType->IsOutputParam() && (!paramType->IsArray()) && viArgPointers[i] != null) {
            // If ArgPointer is null no output provided, don't copy out, it was a temporary allocation.
            IntIndex offset = paramType->ElementOffset();
            snippetBuilder.StartInstruction(&copyTopOpName);
            // Reverse direction for output parameters
            snippetBuilder.InternalAddArg(paramType, pParamData + offset);
            snippetBuilder.InternalAddArg(viArgTypes[i], viArgPointers[i]);
            snippetBuilder.EmitInstruction();
        }
        
        if (!paramType->IsFlat()) {
            // If it is non flat then it has to be owned. Unwired parameters should have been allocated a private copy.
            VIREO_ASSERT(viArgPointers[i] != null)
            // Zero out all traces of the non flat value passed in
            IntIndex offset = paramType->ElementOffset();
            snippetBuilder.StartInstruction(&zeroOutTopOpName);
            snippetBuilder.InternalAddArg(null, paramType);
            snippetBuilder.InternalAddArg(paramType, pParamData + offset);
            snippetBuilder.EmitInstruction();
        }
    }
    EndEmitSubSnippet(&snippetBuilder);
    _instructionType = null;
    
    // Now that sub snippets have been made, configure the clump parser so that
    // The CallVI instruciton knows where to go after it is done.
    RecordNextHere(&callInstruction->_piNext);

    return callInstruction;
}
//------------------------------------------------------------
//! Emit a specific instruction. Used by generic instruction emitters.
InstructionCore* ClumpParseState::EmitInstruction(SubString* opName, Int32 argCount, ...)
{
    // Look for funciton that matches parameter list.
    va_list args;
    Boolean keepTrying = true;
    StartInstruction(opName);
    while (keepTrying) {
        va_start (args, argCount);
        for (Int32 i = 0; (i < argCount) && keepTrying; i++) {
        
            TypeRef formalType  = ReadFormalParameterType();
            TypeRef actualType = va_arg(args, TypeRef);
            void* actualData = va_arg(args, void*);
            
            if (actualType->IsA(formalType, false) ) {
                InternalAddArg(actualType, actualData);
            } else {
                keepTrying = false;
            }
        }
        va_end (args);
        if (keepTrying) {
            keepTrying = false;
        } else {
            //
            keepTrying = StartNextOverload() != null;
        }
    }
    EmitInstruction();
    return null;
}
//------------------------------------------------------------
//! Emit the instruction resolved to by general clump parser.
InstructionCore* ClumpParseState::EmitInstruction()
{
    if (!_instructionType)
        return null;
    
    if (_bIsVI) {
        return EmitCallVIInstruction();
    } else if (_instructionPointerType && _instructionPointerType->PointerType() == kPTGenericFunctionCodeGen) {
        // Get pointer to load time generic resolver function.
        GenericEmitFunction genericResolver;
        _instructionPointerType->InitData(&genericResolver);
        if (genericResolver != null) {
            return genericResolver(this);
        }
        // If there is no generic resolver function assume the underlying function
        // can take the parameters as is (e.g. it is runtime polymorphic)
    }

    // If extra parameters exits for the matched function is that OK?
    Int32 formalArgCount = _instructionType->SubElementCount();
    if (formalArgCount > _argCount) {
        Boolean foundMissing = false;
        for (Int32 i = _argCount; i < formalArgCount; i++) {
            TypeRef type = _instructionType->GetSubElement(i);
            if (type->IsStaticParam()) {
                InternalAddArg(type, null);
            } else {
                foundMissing = true;
            }
        }
#if 0
        if (foundMissing && (_pVarArgCount == null)) {
            _argumentState = kArgumentTooFew;
            SubString instructionName = _instructionPointerType->Name();
            _parserFocus.AliasAssign(&instructionName);
        }
#endif
    }
    
    _pVarArgCount = null;
    _totalInstructionCount++;
    _totalInstructionPointerCount += (sizeof(InstructionCore) / sizeof(void*)) + _argCount;
    
    InstructionCore* instruction = CreateInstruction(_instructionPointerType, _argCount, _argPointers);
    if (_cia->IsCalculatePass())
        return instruction;
    
    if (_recordNextInstructionAddress>=0) {
        // TODO support multiple perch patching
        VIREO_ASSERT( _perches[_recordNextInstructionAddress] == kPerchBeingAlocated);
        _perches[_recordNextInstructionAddress] = instruction;
        _recordNextInstructionAddress = -1;
    }
    if (_argPatchCount > 0) {
        // Now that the instruction is built, if some of the arguments
        // still require patching (e.g. A branch to a forward perch)
        // add the _whereToPatch field.
        GenericInstruction *generic = (GenericInstruction*) instruction;
        for (Int32 i = 0; i < _argPatchCount; i++) {
            // Pointer to PatchInfo object was stashed in arg, look it up.
            PatchInfo *pPatch = (PatchInfo*)generic->_args[_argPatches[i]];
            
            // Now erase that pointer.
            generic->_args[_argPatches[i]] = null;
            
            VIREO_ASSERT(pPatch->_whereToPatch == null)
            pPatch->_whereToPatch = &generic->_args[_argPatches[i]];
        }
    }
    _argPatchCount = 0;
    return instruction;
}
//------------------------------------------------------------
void ClumpParseState::EmitSimpleInstruction(ConstCStr opName)
{
    SubString ssName(opName);
    StartInstruction(&ssName);
    EmitInstruction();
}
//------------------------------------------------------------
void ClumpParseState::CommitSubSnippet()
{
    // Emit a stub instruction with the CulDeSac function to avoid
    // a null at the end. Used in conjunction with
    // the funciton ExecutionContext::IsCulDeSac()
    EmitSimpleInstruction("CulDeSac");
}
//------------------------------------------------------------
void ClumpParseState::CommitClump()
{
    EmitSimpleInstruction("Done");
    
    // _codeStart will have been set by the first emitted instruction
    // at a minimum its the Done instruction emitted above.
    // That need to be copied to the _savePc field.
    _clump->_savePc = _clump->_codeStart;
    
    if (_cia->IsCalculatePass())
        return;
        
    for (Int32 i = 0; i < _patchInfoCount; i++) {
        *_patchInfos[i]._whereToPatch = *_patchInfos[i]._whereToPeek;
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(EnqueueRunQueue, VirtualInstrumentObjectRef)
{
    if (_Param(0))
        _Param(0)->ObjBegin()->PressGo();
    return _NextInstruction();
}
//------------------------------------------------------------
//! Custom data methods needed to Copy a VI.
class VIDataProcsClass : public IDataProcs
{
    virtual NIError InitData(TypeRef type, void* pData, TypeRef pattern)
    {
        // The Proto-VI has a generic Param/Locals with no clumps. The Pattern type still has that type,
        // but will have a custom default value for the underlying type. This means the
        // InitData method will detect the default value and will copy the pattern's value
        // once the core structure is set up. Look in ArrayType::InitData() for more details.
        return type->InitData(pData, pattern);
    }
    virtual NIError CopyData(TypeRef type, const void* pDataSource, void* pDataCopy)
    {
        // First copy the basics, then fix up a few things.
        type->CopyData(pDataSource, pDataCopy);

        VirtualInstrumentObjectRef vioCopy = *(VirtualInstrumentObjectRef*) pDataCopy;
        VirtualInstrument* viCopy = vioCopy->ObjBegin();
        VIClump *pClump = viCopy->Clumps()->Begin();
        VIClump *pClumpEnd = viCopy->Clumps()->End();
        // Set clumps to point to the correct owner,
        // clear any indication they are running.
        for (;pClump< pClumpEnd; pClump++) {
            pClump->_owningVI = viCopy;
            pClump->_next = null;
            pClump->_codeStart = null;
            pClump->_savePc = null;
            pClump->_shortCount = pClump->_fireCount;
        }
        return kNIError_Success;
    }
    virtual NIError ClearData(TypeRef type, void* pData)
    {
        VirtualInstrumentObjectRef vio = *(VirtualInstrumentObjectRef*) pData;
        VirtualInstrument* vi = vio->ObjBegin();
        
        VIClump *pClump = vi->Clumps()->Begin();
        if (pClump) {
            // In packed mode all instructions are in one block.
            // The first instruction of the first clump is the beginning of the block.
            vi->OwningContext()->TheTypeManager()->Free(pClump->_codeStart);

            // If it's a top VI
            if (!pClump->_caller)
                vi->ClearTopVIParamBlock();
        }
        
        return type->ClearData(pData);
    }
    //------------------------------------------------------------
    virtual TypeRef GetSubElementAddressFromPath(TypeRef type, SubString* path, void* pStart, void** ppData, Boolean allowDynamic)
    {
        VirtualInstrumentObjectRef vio = *(VirtualInstrumentObjectRef*) pStart;
        VirtualInstrument* vi = vio->ObjBegin();
        
        // Check of Params and Locals alias'
        TypeRef subType = vi->GetVIElementAddressFromPath(path, pStart, ppData, allowDynamic);
        
        // Check for full path symbols
        if (!subType) {
            subType = type->GetSubElementAddressFromPath(path, pStart, ppData, allowDynamic);
        }
        return subType;
    }

};
VIDataProcsClass gVIDataProcs;
//------------------------------------------------------------
//! Custom data methods needed to free up instruction lists.
class InstructionBlockDataProcsClass : public IDataProcs
{
    virtual NIError ClearData(TypeRef type, void* pData)
    {
        // All instructions for all clumps in a VI are stored in one
        // block of memory. The VI will free it.
        *(void**)pData = null;
        return kNIError_Success;
    }
};
InstructionBlockDataProcsClass gInstructionBlockDataProcs;
#endif

DEFINE_VIREO_BEGIN(LabVIEW_Execution2)
    DEFINE_VIREO_TYPE(ExecutionContext, ".DataPointer");  // TODO define as type string
    DEFINE_VIREO_CUSTOM_DP(InstructionBlock, ".Instruction", &gInstructionBlockDataProcs);
    DEFINE_VIREO_TYPE(VIClump, VIClump_TypeString);
    DEFINE_VIREO_CUSTOM_DP(VirtualInstrument, VI_TypeString, &gVIDataProcs);
    DEFINE_VIREO_TYPE(ReentrantVirtualInstrument, ".VirtualInstrument");  // A case of simple inheritance
    DEFINE_VIREO_FUNCTION(EnqueueRunQueue, "p(i(.VirtualInstrument))");
DEFINE_VIREO_END()

} // namespace Vireo
