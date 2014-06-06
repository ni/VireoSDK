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
//------------------------------------------------------------
// VirtualInstrument
//------------------------------------------------------------
NIError VirtualInstrument::Init(ExecutionContext *context, Int32 clumpCount, TypeRef paramBlockType, TypeRef dataSpaceType, Int32 lineNumberBase, SubString* clumpSource)
{
    VIREO_ASSERT(_executionContext == null)
    VIREO_ASSERT( sizeof(VIClump) == _clumps->ElementType()->TopAQSize() )

    // The preliminary initialization defines a generic VI
    // finish it out by defining its type.
    _executionContext = context;
    _paramBlock->SetElementType(paramBlockType, false);
    _dataSpace->SetElementType(dataSpaceType, false);
    _clumps->Resize1D(clumpCount);
    _lineNumberBase = lineNumberBase;
    _clumpSource = clumpSource;
    
    VIClump *pElt = _clumps->Begin();
    for(IntIndex i= 0; i < clumpCount; i++)
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
    TypedBlock* viParamBlock = this->ParamBlock();
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
    TypedBlock* viParamBlock = this->ParamBlock();
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
TypeManager* VIClump::TheTypeManager()
{
    return OwningVI()->OwningContext()->TheTypeManager();
}
//------------------------------------------------------------
// InstructionAllocator
//------------------------------------------------------------
void InstructionAllocator::AddRequest(size_t count)
{
    // cant be adding requests once the
    VIREO_ASSERT(_next == null);
    _size += count;
}
//------------------------------------------------------------
void InstructionAllocator::Allocate (TypeManager * tm)
{
    VIREO_ASSERT(_next == null);
    _next = (AQBlock1*) tm->Malloc(_size);;
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
    Construct(cps->_clump, cps->_cia, cps->_pLog);
}
//------------------------------------------------------------
ClumpParseState::ClumpParseState(VIClump* clump, InstructionAllocator *cia, EventLog *pLog)
{
    Construct(clump, cia, pLog);
}
//------------------------------------------------------------
void ClumpParseState::Construct(VIClump* clump, InstructionAllocator *cia, EventLog *pLog)
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
    _cia = cia;
    _bIsVI = false;
    
    _paramBlock = _vi->ParamBlock();
    _paramBlockBase = _paramBlock->RawBegin();
    _paramBlockType = _paramBlock->ElementType();
    
    _dataSpace = _vi->DataSpace();
    _dataSpaceBase = _dataSpace->RawBegin();
    _dataSpaceType = _dataSpace->ElementType();
    
    _perchCount = 0;
    _recordNextInstructionAddress = -1;
    for (Int32 i = 0; i < kMaxPerches; i ++) {
        _perches[i] = kPerchUndefined;
    }
    
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
#ifdef VIREO_PACKED_INSTRUCTIONS
    if (_cia->IsCalculatePass()) {
        _cia->AddRequest(size);
        return kFakedInstruction;
    } else {
        instruction = (InstructionCore*)_cia->AllocateSlice(size);
    }
#else
    instruction = (InstructionCore*) _clump->TheTypeManager()->Malloc(size);
#endif
    
    instruction->_function = null;
    
    // Patch up the previous jump point as necessary
#ifdef VIREO_PACKED_INSTRUCTIONS
    // For the first instruction in a block there will be a address to patch to jump
    // to this block. In packed mode, once it is set no more "next" patches will be done for the block
    if (_pWhereToPatch) {
        *_pWhereToPatch = instruction;
        _pWhereToPatch = null;
    }
#else
    instruction->_next = null;
    *_pWhereToPatch = instruction;
    _pWhereToPatch = &instruction->_next;
#endif
    
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
        if(!_cia->IsCalculatePass()) {
            instructionType->InitData(&instruction->_function);
            
            GenericInstruction *ginstruction = (GenericInstruction*)instruction;
            for (int i=0; i<argCount; i++) {
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
TypeRef ClumpParseState::ReresolveInstruction(SubString* opName, bool allowErrors)
{
    // A new instruction function is being substituted for the
    // on original map (used for generics and SubVI calling)
    VIREO_ASSERT(_instructionType != null)
    TypeRef foundType = _clump->TheTypeManager()->FindType(opName);
    if(foundType == null && allowErrors)
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
TypeRef ClumpParseState::StartInstruction(SubString* opName)
{
    static const SubString strVI(VI_TypeName);

    _instructionType = null;
    _formalParameterIndex = 0;
    _formalParameterType = null;
    _argCount = 0;
    _argPatchCount = 0;
    _bIsVI = false;
    
    TypeRef t = _clump->TheTypeManager()->FindType(opName);
    
    if (t && t->BitEncoding() == kEncoding_Pointer) {
        // looks like it resolved to a native function
        _instructionPointerType = t;
        _instructionType = _instructionPointerType->GetSubElement(0);
    } else if (t && (t->IsA(&strVI))) {
        // Also covers reentrant VIs since reentrant VIs inherit from simple VIs
        _bIsVI = true;
        VirtualInstrument* vi = AddSubVITargetArgument(opName);
        _instructionPointerType = t;
        _instructionType = vi->ParamBlock()->ElementType();
    }
    return _instructionType;
}
//------------------------------------------------------------
void ClumpParseState::ResolveActualArgumentAddress(SubString* argument, AQBlock1** ppData)
{
    _actualArgumentType = null;
    
    // "." prefixed symbols are type constant from the TypeManager
    if (argument->ComparePrefixCStr(".")) {
        // If it is to be passed as an input then that is OK. Elements in the
        // type dictionary can not be used as an output.
        char dot;
        argument->ReadRawChar(&dot);
        *ppData = (AQBlock1*) _clump->TheTypeManager()->FindTypeConstRef(argument);
        if (*ppData != null) {
            UsageTypeEnum usageType = _formalParameterType->ElementUsageType();
            if (usageType != kUsageTypeInput) {
                *ppData = null;
                _argumentState = kArgumentNotMutable;
            } else {
                SubString typeTypeName("Type");
                _actualArgumentType = _clump->TheTypeManager()->FindType(&typeTypeName);
                _argumentState = kArgumentResolvedToGlobal;
            }
        }
        return;
    }
    
    // See if it is a default parameter ('*')
    if(argument->CompareCStr("*")){
        _actualArgumentType = FormalParameterType();
        if (!_actualArgumentType->IsFlat()) {
            // Define a DefaultValue type. As a DV it will never merge to another instance.
            // Since it has no name it cannot be looked up, but it will be freed once the TADM/ExecutionContext is freed up.
            DefaultValueType *cdt = DefaultValueType::New(_clump->TheTypeManager(), _actualArgumentType);
            *ppData = (AQBlock1*)cdt->Begin(kPARead); // * passed as a param means null
        } else {
            // For flat data the call instruction logic for VIs will initialize the callee parameter
            // to the default value. For native instructions a null parameter value is passed.
            *ppData = null;
        }
        _argumentState = kArgumentResolvedToDefault;
        return;
    }
    
    // See if it is a local variable
    Int32 offset = 0;
    _actualArgumentType = _dataSpaceType->GetSubElementOffsetFromPath(argument, &offset);
    if (_actualArgumentType != null) {
        *ppData = _dataSpaceBase + offset;
        _argumentState = kArgumentResolvedToLocal;
        return;
    }
    
    // See if it is a parameter variable
    if (_paramBlock) {
        _actualArgumentType = _paramBlockType->GetSubElementOffsetFromPath(argument, &offset);
        if (_actualArgumentType != null) {
            *ppData = _paramBlockBase + offset;
            _argumentState = kArgumentResolvedToParameter;
            return;
        }
    }
    
    // See if it is a global value.
    // the first part of the path is the symbol. Beyond that it drills into the variable.
    SubString pathHead, pathTail;
    argument->SplitString(&pathHead, &pathTail, '.');
    _actualArgumentType = _clump->TheTypeManager()->FindType(&pathHead);
    if(_actualArgumentType != null){
        // The symbol was found in the TypeManager chain. Get a pointer to the value.
        
        // TODO access-option based on parameter direction;
        AQBlock1* pData = (AQBlock1*)_actualArgumentType->Begin(kPARead);

        // If there is a dot after the head, then there is more to parse.
        if(pathTail.ReadChar('.')) {
            // If the top type is a cluster then the remainder should be a simple field name qualifier
            // Array drill down not yet supported. (it would not be hard for fixed sized arrays)
            // but blunded or variabel aray element addresses are dynamic.
            void* pDataStart = pData;
            _actualArgumentType = _actualArgumentType->GetSubElementInstancePointerFromPath(&pathTail, pDataStart, (void**) &pData, false);
        }
        if (_actualArgumentType) {
            *ppData = pData;
            _argumentState = kArgumentResolvedToGlobal;
            return;
        }
    }
    *ppData = null;
    _actualArgumentType = null;
}
//------------------------------------------------------------
void ClumpParseState::AddDataTargetArgument(SubString* argument, Boolean prependType)
{
    AQBlock1* pData = null;
    ResolveActualArgumentAddress(argument, &pData);
    
    if (ActualArgumentType() == null) {
        return;
    }
    
    SubString dsTypeName, formalParameterTypeName;
    ActualArgumentType()->GetName(&dsTypeName);
    FormalParameterType()->GetName(&formalParameterTypeName);
    
    if (prependType) {
        // StaticTypeAndData formal parameters get passed the type and pointer to the data.
        // they are fully polymorphic.
        InternalAddArg(null, ActualArgumentType());
	} else if(dsTypeName.CompareCStr("*") && FormalParameterType()->IsOptionalParam()){
		// "*" passed as an argument, don't need to do a typecheck
	} else {
        if (!ActualArgumentType()->IsA(&formalParameterTypeName)) {
            _argumentState = kArgumentTypeMismatch;
        }
    }
    
    InternalAddArg(ActualArgumentType(), pData);
}
//------------------------------------------------------------
void ClumpParseState::AddStaticString(SubString* argument)
{
    _argumentState = kArgumentResolvedToStaticString;
    // Cast off the const char*.
    // Functions that take a static string should not modify it.
    InternalAddArg(null, (AQBlock1*)argument->Begin()+1);
    InternalAddArg(null, (AQBlock1*)argument->End()-1);
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
    // TODO support NamedType patches as well. That needs to cross VI boundaries
    // so PatchInfo will move from Clump parser state to TypeString Parser
    // and might be malloced.
    _argPatches[_argPatchCount++] = _argCount;
    if (_patchInfoCount < kMaxPatchInfos) {
        PatchInfo *pPatch = &_patchInfos[_patchInfoCount++];
        pPatch->_patchType = patchType;
        pPatch->_whereToPeek = whereToPeek;
        InternalAddArg(null, pPatch);
    } else {
        printf("(Error \"Too many forward patches\")\n");
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
            if (_perches[perchIndex]<0){
                printf("(Error \"Perch <%d> duplicated in a clump\")\n", (Int32)perchIndex);
            }
            if(_recordNextInstructionAddress<0){
                // Reserve the perch till the next instruction is emitted
                // null will never be a valid instruction address.
                _perches[perchIndex] = kPerchBeingAlocated;
                _recordNextInstructionAddress = (Int32)perchIndex;
            } else {
                printf("(Error \"Double Perch <%d> not supported\")\n", (Int32)perchIndex);
            }
        } else {
            printf("(Error \"Perch <%d> exceeds limits\")\n", (Int32)perchIndex);
        }
    } else {
        printf("(Error \"Perch label syntax error <%.*s>\")\n", FMT_LEN_BEGIN(perchToken));
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
VirtualInstrument* ClumpParseState::AddSubVITargetArgument(SubString* subVIName)
{
    static SubString strReentrantVI(ReentrantVI_TypeName);
    VirtualInstrument *vi = null;

    // 1. Look up the type. This will be VirtualInstrument type.
    TypeRef targetVIType = _vi->OwningContext()->TheTypeManager()->FindType(subVIName);

    if (!targetVIType) {
        return null;
    }
    
    // 2. The primary instance of the actual VI will be the value of the type.
    TypedArrayCore** pObj = (TypedArrayCore**) targetVIType->Begin(kPARead);
    if ((*pObj)->Type()->IsA(&strReentrantVI)  && !_cia->IsCalculatePass()) {
        // Each reentrant VI will be a copy of the original.
        // If it is the calculate pass skip this and the use the original for its type.
        TypeManager *tm = this->_vi->OwningContext()->TheTypeManager();
        
        // Reentrant VI clones exist in TM the caller VI is in.
        DefaultValueType *cdt = DefaultValueType::New(tm, targetVIType);
        VirtualInstrumentObject* pVICopy = *(VirtualInstrumentObject**)cdt->Begin(kPARead);
        vi = (VirtualInstrument*) pVICopy->RawObj();
    } else {
        // Non reentrant use the original type
        vi =  (VirtualInstrument*) (*pObj)->RawObj();
    }
    
    if (vi != null) {
        _argumentState = kArgumentResolvedToClump;
        InternalAddArg(null, vi->Clumps()->Begin());
    }
    return vi;
}
//------------------------------------------------------------
void ClumpParseState::AddInstructionFunctionArgument(SubString* instructionNameToken)
{
    TypeRef instructionType = _vi->OwningContext()->TheTypeManager()->FindType(instructionNameToken);
    InstructionFunction     functionPointer;
    instructionType->InitData(&functionPointer);
    
    _argumentState = kArgumentResolvedToInstructionFunction;
    InternalAddArg(null, (void*) functionPointer);
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
void  ClumpParseState::LogArgumentProcessing(Int32 lineNumber)
{
    EventLog::EventSeverity severity = LastArgumentError() ? EventLog::kSoftDataError : EventLog::kTrace;
    const char* simpleMessage = null;
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
            SubString formalParameterTypeName;
            FormalParameterType()->GetName(&formalParameterTypeName);
            _pLog->LogEvent(EventLog::kSoftDataError, lineNumber, "Type mismatch, argument should be", &formalParameterTypeName);
            }
            break;
        case kArgumentNotOptional:                      simpleMessage = "Argument not optional";    break;
        case kArgumentNotMutable:                       simpleMessage = "Argument not mutable";     break;
        // Good states
        case kArgumentResolvedToClump:                  simpleMessage = "Argument is clump";        break;
        case kArgumentResolvedToLocal:                  simpleMessage = "Argument is local";        break;
        case kArgumentResolvedToPerch:                  simpleMessage = "Argument is perch";        break;
        case kArgumentResolvedToParameter:              simpleMessage = "Argument is parameter";    break;
        case kArgumentResolvedToGlobal:                 simpleMessage = "Argument is global";       break;
        case kArgumentResolvedToDefault:                simpleMessage = "Argument is default";      break;
        case kArgumentResolvedToStaticString:           simpleMessage = "Argument is static";       break;
        case kArgumentResolvedToInstructionFunction:    simpleMessage = "Argument is ifunction";    break;
            simpleMessage = "Argument is clump";
            break;
        default:
            simpleMessage = "Unknown argument type";
            break;
    }
    if (simpleMessage) {
        _pLog->LogEvent(severity, lineNumber, simpleMessage, &_actualArgumentName);
    }
}
//------------------------------------------------------------
// EmitCallVICopyProcs
// at this point the args array has the list of argument addresses (in or out)
// one for each passed argument, and the types have been checked against
// the VI's parameter block.
InstructionCore* ClumpParseState::EmitCallVIInstruction()
{
    VIREO_ASSERT(this->_argCount >0);  // TODO arg[0] is subVI
    
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
    
#ifdef VIREO_PACKED_INSTRUCTIONS
    // No explicit field, the first copy-in instruction follows this instructions.
    Int32 copyInId = -1;
    AddSubSnippet();    // Reserve storage for the explicit next pointer (_piNext)
#else
    Int32 copyInId = AddSubSnippet();
#endif
    Int32 copyOutId = AddSubSnippet();

    _bIsVI = false;
    SubString  opName("CallVI");
    _instructionType = ReresolveInstruction(&opName, false);
    
    // Recurse now that the instruction is a simple one.
    CallVIInstruction* callInstruction  = (CallVIInstruction*) EmitInstruction();
    
    VirtualInstrument* vi =targetVIClump->OwningVI();
    TypedBlock* viParamBlock = vi->ParamBlock();
    
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
        if(!paramType->IsFlat()) {
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
    
#ifdef VIREO_PACKED_INSTRUCTIONS
    // Now that sub snippets have been made, configure the clump parser so that
    // The CallVI instruciton knows where to go after it is done.
    RecordNextHere(&callInstruction->_piNext);
#endif

    return callInstruction;
}
//------------------------------------------------------------
InstructionCore* ClumpParseState::EmitInstruction()
{
    if (!_instructionType)
        return null;
        
    if (_bIsVI) {
        return EmitCallVIInstruction();
    } else if (GenericFunction() && _instructionPointerType->PointerType() == kPTGenericFunctionCodeGen) {
        GenericEmitFunction genericResolver;
        _instructionPointerType->InitData(&genericResolver);
        if (genericResolver != null) {
            return genericResolver(this);
        }
        // If there is no generic resolver function assume the underlying function
        // can take the parameters as is (e.g. it is runtime polymorphic)
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
        GenericInstruction *generic = (GenericInstruction*) instruction;
        for(int i = 0; i < _argPatchCount; i++) {
            // Pointer to PatchInfo object was stashed in arg, look it up.
            PatchInfo *pPatch = (PatchInfo*)generic->_args[i];
            
            // Now erase that pointer.
            generic->_args[i] = null;
            
            VIREO_ASSERT(pPatch->_whereToPatch == null)
            pPatch->_whereToPatch = &generic->_args[_argPatches[i]];
        }
    }
    return instruction;
}
//------------------------------------------------------------
void ClumpParseState::EmitSimpleInstruction(const char* opName)
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
    // printf(" total sub-snippet size %d (%d) \n", _totalInstructionPointerCount, _totalInstructionCount);
}
//------------------------------------------------------------
void ClumpParseState::CommitClump()
{
    EmitSimpleInstruction("Done");
    
    // _codeStart will have been set by the first emitted instruction
    // at a minimum its the Done instruction emitted above.
    // That need to be copied to the _savePc field.
    _clump->_savePc = _clump->_codeStart;
    
    if(_cia->IsCalculatePass())
        return;
        
    for(int i = 0; i < _patchInfoCount; i++) {
        PatchInfo *pPatch = &_patchInfos[i];
        *pPatch->_whereToPatch = *pPatch->_whereToPeek;
    }
   // printf(" total instruction size %d ( %d) \n", _totalInstructionPointerCount, _totalInstructionCount);
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(EnqueueRunQueue, VirtualInstrumentObject*)
{
    VirtualInstrumentObject *pVI = _Param(0);
    pVI->Obj()->PressGo();
    return _NextInstruction();
}
//------------------------------------------------------------
//! Custom data methods needed to Copy a VI.
class VIDataProcsClass : public IDataProcs
{
    virtual NIError InitData(TypeRef type, void* pData, TypeRef pattern)
    {
        // The Proto-VI has a generic DS/PB and no clumps. The Pattern type still has that type,
        // but will have a custom default value for the underlying type. This means the
        // InitData method will detect the default value and will copy the pattern's value
        // once the core structure is set up. Look in ArrayType::InitData() for more details.
        return type->InitData(pData, pattern);
    }
    virtual NIError CopyData(TypeRef type, const void* pDataSource, void* pDataCopy)
    {
        // First copy the basics, then fix up a few things.
        type->CopyData(pDataSource, pDataCopy);

        VirtualInstrumentObject *vioCopy = *(VirtualInstrumentObject**) pDataCopy;
        VirtualInstrument* viCopy = vioCopy->Obj();
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
#ifdef VIREO_PACKED_INSTRUCTIONS
    virtual NIError ClearData(TypeRef type, void* pData)
    {
        VirtualInstrumentObject *vio = *(VirtualInstrumentObject**) pData;
        VirtualInstrument* vi = vio->Obj();
        
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
#else
    // No special processing is needed for Clear since InstructionList has its
    // own special Clear method
#endif
};
VIDataProcsClass gVIDataProcs;
//------------------------------------------------------------
//! Custom data methods needed to free up instruction lists.
class InstructionListDataProcsClass : public IDataProcs
{
    virtual NIError ClearData(TypeRef type, void* pData)
    {
#ifdef VIREO_PACKED_INSTRUCTIONS
        // All instructions for all clumps in a VI are atored in one
        // block of memory. The VI will free it.
#else
        TypeManager *tm = TypeManagerScope::Current();
        InstructionCore *ins = *(InstructionCore**) pData;
        if (ins == null) {
            return kNIError_Success;
        }
        InstructionCore *next;
        for (; ins  != null; ins = next) {
            next = ins->_next;
            tm->Free(ins);
        }
#endif 
        *(void**)pData = null;
        return kNIError_Success;
    }
};
InstructionListDataProcsClass gInstructionListDataProcs;
    
DEFINE_VIREO_BEGIN(LabVIEW_Execution2)
    DEFINE_VIREO_TYPE(ExecutionContext, ".DataPointer");  // TODO define as type string
    DEFINE_VIREO_TYPE(Instruction, ".DataPointer");
    DEFINE_VIREO_CUSTOM_DP(InstructionList, ".Instruction", &gInstructionListDataProcs);
    DEFINE_VIREO_TYPE(VIClump, VIClump_TypeString);
    DEFINE_VIREO_CUSTOM_DP(VirtualInstrument, VI_TypeString, &gVIDataProcs);
    DEFINE_VIREO_TYPE(ReentrantVirtualInstrument, ".VirtualInstrument");  // A case of simple inheritance
    DEFINE_VIREO_FUNCTION(EnqueueRunQueue, "p(i(.VirtualInstrument))");
DEFINE_VIREO_END()

} // namespace Vireo
