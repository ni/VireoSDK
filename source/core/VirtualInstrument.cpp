// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Virtual Instrument support
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "Events.h"
#include "DebuggingToggles.h"

namespace Vireo
{
#ifndef VIREO_MICRO
//------------------------------------------------------------
// VirtualInstrument
//------------------------------------------------------------
NIError VirtualInstrument::Init(TypeManagerRef tm, Int32 clumpCount, TypeRef paramsType, TypeRef localsType, TypeRef eventSpecsType,
                              Int32 lineNumberBase, SubString* clumpSource)
{
    VIREO_ASSERT(_typeManager == nullptr)
    VIREO_ASSERT( sizeof(VIClump) == _clumps->ElementType()->TopAQSize() )

    // The preliminary initialization defines a generic VI
    // finish it out by defining its type.
    _typeManager = tm;
    _viName = nullptr;
    _eventInfo = nullptr;
    _params->SetElementType(paramsType, false);
    _locals->SetElementType(localsType, false);
    _eventSpecs->SetElementType(eventSpecsType, false);
    _clumps->Resize1D(clumpCount);
    _lineNumberBase = lineNumberBase;
    _clumpSource = *clumpSource;

    VIClump *pElt = _clumps->Begin();
    for (IntIndex i= 0; i < clumpCount; i++) {
        pElt->_fireCount = 1;  // clumps default to 1  (0 would run instantly)
        pElt->_shortCount = 1;
        pElt->_owningVI = this;
        pElt++;
    }
    return kNIError_Success;
}
VirtualInstrument::~VirtualInstrument()
{
    delete[] _viName;
    delete[] _eventInfo;
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
        eltType->InitData(pParamData + eltType->ElementOffset());
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
            eltType->ClearData(pParamData + eltType->ElementOffset());
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
    if (actualType == nullptr && paramBlock) {
        actualType = paramBlock->ElementType()->GetSubElementAddressFromPath(eltPath, paramBlock->RawBegin(), ppData, allowDynamic);
    }
    return actualType;
}
//------------------------------------------------------------
void VirtualInstrument::PressGo()
{
    VIClump  *rootClump = Clumps()->Begin();

    // If there is no code, or its running there is nothing to do.
    if ( rootClump == nullptr || rootClump->ShortCount() < 1)
        return;

    InitParamBlock();

    VIREO_ASSERT(rootClump->FireCount() == 1)
    rootClump->Trigger();
}

//------------------------------------------------------------
void VirtualInstrument::GoIsDone()
{
    // If the results are cleared out when done,
    // there is nothing for the the debugger to read.
    // So this is postponed until the VI the cleared
    // ClearParamBlock();
    UnregisterForStaticEvents(this);
    RunCleanupProcs(this);
}
//------------------------------------------------------------
void VirtualInstrument::SetVIName(const SubString &s, bool decode)   {
    PercentDecodedSubString decodedStr(s, decode, true);
    _viName = decodedStr.DetachValue();
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
// TODO(PaulAustin): Wait Many?  Right way to wait until first, or allow for one that is a time-out?
// Easy enough to do as a var arg function.
//
void VIClump::Trigger()
{
    // TODO(PaulAustin): Make sure there is a MT version of this (or all are MT safe)
    VIREO_ASSERT(_shortCount > 0)

    // Strictly speaking, this assert can be relaxed, but It will be interesting
    // to see when that change is needed.
    VIREO_ASSERT(THREAD_EXEC() == TheExecutionContext())

    if (--_shortCount == 0) {
        EnqueueRunQueue();
    }
}
//------------------------------------------------------------
void VIClump::InsertIntoWaitList(VIClump* elt)
{
    // The clump being added to this list should not be in another list.
    VIREO_ASSERT(nullptr == elt->_next)

    elt->_next = _waitingClumps;
    _waitingClumps = elt;
}
//------------------------------------------------------------
void VIClump::AppendToWaitList(VIClump* elt)
{
    // The clump being added to this list should not be in another list.
    VIREO_ASSERT(nullptr == elt->_next)

    // Add to the end of the list.
    if (_waitingClumps == nullptr) {
        _waitingClumps = elt;
    } else {
        VIClump* waiting = _waitingClumps;
        while (waiting-> _next != nullptr) {
            waiting = waiting-> _next;
        }
        waiting->_next = elt;
    }
}
//------------------------------------------------------------
Observer* VIClump::ReserveObservationStatesWithTimeout(Int32 count, PlatformTickType tickCount)
{
    VIREO_ASSERT(_observationCount == 0);
    if (count <= 2) {
        _observationCount = count;
        _observationStates[0]._clump = this;
        _observationStates[1]._clump = this;
        if (tickCount) {
            TheExecutionContext()->_timer.InitObservableTimerState(_observationStates, tickCount);
        } else {
            TheExecutionContext()->_timer.InitObservableTimerState(_observationStates, 0x7FFFFFFFFFFFFFFF);
        }
        return _observationStates;
    } else {
        return nullptr;
    }
}
//------------------------------------------------------------
void VIClump::ClearObservationStates()
{
    // When an instruction retries and decides its time to continue for any reason
    // the instruction function need to clear all WS that might wake the clump up.
    if (_observationCount) {
        for (Observer* pObserver = _observationStates; _observationCount; pObserver++) {
            if (pObserver->_object) {
                pObserver->_object->RemoveObserver(pObserver);
                VIREO_ASSERT(pObserver->_object == nullptr);
            }
            _observationCount -= 1;
        }
    }
}
//------------------------------------------------------------
InstructionCore* VIClump::WaitUntilTickCount(PlatformTickType tickCount, InstructionCore* nextInstruction)
{
    VIREO_ASSERT(_next == nullptr)
    VIREO_ASSERT(_shortCount == 0)

    ReserveObservationStatesWithTimeout(1, tickCount);
    return this->WaitOnObservableObject(nextInstruction);
}
//------------------------------------------------------------
InstructionCore* VIClump::WaitOnObservableObject(InstructionCore* nextInstruction)
{
    if (_observationCount) {
        // Hack, single one is a timer so it doesn't retry. There will be nothing to clear.
        if (_observationCount == 1)
            _observationCount = 0;
        return TheExecutionContext()->SuspendRunningQueueElt(nextInstruction);
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
    VIREO_ASSERT(_next == nullptr);
    _size += count;
}
//------------------------------------------------------------
void InstructionAllocator::Allocate(TypeManagerRef tm)
{
    VIREO_ASSERT(_next == nullptr);
    if (_size) {
        _next = static_cast<AQBlock1*>(tm->Malloc(_size));
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
        return nullptr;
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
    _pWhereToPatch = nullptr;

    _totalInstructionCount = 0;
    _totalInstructionPointerCount = 0;

    _argPointers.reserve(kClumpStateIncrementSize);
    _argTypes.reserve(kClumpStateIncrementSize);
    _argPatches.reserve(kClumpStateIncrementSize);
    _patchInfos.reserve(kClumpStateIncrementSize);
    _perches.reserve(kClumpStateIncrementSize*4);

    _argCount = 0;
    _argPatchCount = 0;
    _patchInfoCount = 0;
    _varArgCount = -1;
    _varArgRepeatStart = 0;
    _clump = clump;
    _vi = clump->OwningVI();
    _pLog = pLog;
    _approximateLineNumber = lineNumber;
    _cia = cia;
    _bIsVI = false;

    _perchCount = 0;
    _perchIndexToRecordNextInstrAddr = -1;

    _baseViType = _clump->TheTypeManager()->FindType(VI_TypeName);
    _baseReentrantViType = _clump->TheTypeManager()->FindType(ReentrantVI_TypeName);
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
        VIREO_ASSERT(_pWhereToPatch == nullptr)
        _pWhereToPatch = where;
    }
}
//------------------------------------------------------------
InstructionCore* ClumpParseState::AllocInstructionCore(Int32 argumentCount)
{
    InstructionCore* instruction = nullptr;
    Int32 size = sizeof(InstructionCore) + (sizeof(void*) * argumentCount);

    // Allocate the instruction
    if (_cia->IsCalculatePass()) {
        _cia->AddRequest(size);
        return kFakedInstruction;
    } else {
        instruction = static_cast<InstructionCore*>(_cia->AllocateSlice(size));
    }

    instruction->_function = nullptr;

    // Patch up the previous jump point as necessary
    // For the first instruction in a block there will be a address to patch to jump
    // to this block. In packed mode, once it is set no more "next" patches will be done for the block
    if (_pWhereToPatch) {
        *_pWhereToPatch = instruction;
        _pWhereToPatch = nullptr;
    }

    return instruction;
}
//------------------------------------------------------------
InstructionCore* ClumpParseState::CreateInstruction(TypeRef instructionType, Int32 argCount, void* args[])
{
    InstructionCore* instruction = nullptr;

    VIREO_ASSERT(instructionType->TopAQSize() == sizeof(void*))

    if (instructionType->TopAQSize() == sizeof(void*) && instructionType->HasCustomDefault()) {
        // Alloc the memory and set the pointer to the runtime function
        instruction = this->AllocInstructionCore(argCount);
        if (!_cia->IsCalculatePass()) {
            instructionType->InitData(&instruction->_function);

            GenericInstruction *ginstruction = static_cast<GenericInstruction*>(instruction);
            for (Int32 i = 0; i < argCount; i++) {
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
        return nullptr;

    TypeRef type = _instructionType->GetSubElement(_formalParameterIndex++);

    if (type) {
        _formalParameterType = type;
    } else if (_varArgCount >= 0) {
        if (_varArgRepeatStart > 0) {
            _formalParameterIndex = _varArgRepeatStart;
            type = _instructionType->GetSubElement(_formalParameterIndex++);
            if (type)
                _formalParameterType = type;
        }
        // Reading past the end is OK for VarArg functions, the last parameter type will be re-used.
    } else {
        // read past end, and no var arg
        _formalParameterType = nullptr;
        _argumentState = kArgumentTooMany;
    }
    return _formalParameterType;
}
//------------------------------------------------------------
void ClumpParseState::SetClumpFireCount(Int32 fireCount) const
{
    // TODO(PaulAustin): some bootstrap that could be a bit cleaner.
    // If the short count is less than the fire count then the clump was enqueued
    // before it has been fully loaded. Don't stomp that
    // This should only be true for root clumps
    if (_clump->_fireCount == _clump->_shortCount) {
        _clump->_shortCount = fireCount;
    }
    _clump->_fireCount = fireCount;
}
//------------------------------------------------------------
TypeRef ClumpParseState::ReresolveInstruction(SubString* opName)
{
#if VIREO_DEBUG_PARSING_PRINT_OVERLOADS
    if (_cia->IsCalculatePass()) {
        gPlatform.IO.Printf("The instruction has been substituted with '%.*s'\n", FMT_LEN_BEGIN(opName));
    }
#endif
    // A new instruction function is being substituted for the
    // on original map (used for generics and SubVI calling)
    VIREO_ASSERT(_instructionType != nullptr)
    TypeRef foundType = _clump->TheTypeManager()->FindType(opName);

    _instructionPointerType = foundType;
    // For now reresolving should map to a native function. In time that will change
    // when it does this will look more like StartInstruction.
    VIREO_ASSERT(_instructionPointerType != nullptr);
    VIREO_ASSERT(_instructionPointerType->BitEncoding() == kEncoding_Pointer);
    _instructionType = _instructionPointerType->GetSubElement(0);
    VIREO_ASSERT(_instructionType != nullptr);

    return _instructionType;
}
#if VIREO_DEBUG_PARSING_PRINT_OVERLOADS
//------------------------------------------------------------
static void PrintOverload(ConstCStr outputPrefix, NamedTypeRef overload, TypeRef baseVIType, Boolean isCalculatePass)
{
    if (!isCalculatePass)
        return;

    gPlatform.IO.Printf("%s", outputPrefix);
    if (overload->BitEncoding() == kEncoding_Pointer) {
        TypeRef parameters = nullptr;
        // Native instruction
        if (overload->PointerType() == kPTGenericFunctionCodeGen) {
            TypeRef instructionType = overload->GetSubElement(0);
            parameters = instructionType;
            gPlatform.IO.Printf("%.*s (", FMT_LEN_BEGIN(&instructionType->Name()));
        } else {
            InstructionFunction  instructionfunction;
            overload->InitData(&instructionfunction);
            SubString cName;
            THREAD_TADM()->FindCustomPointerTypeFromValue(static_cast<void*>(instructionfunction), &cName);
            gPlatform.IO.Printf("%.*s (", FMT_LEN_BEGIN(&cName));
            parameters = overload->GetSubElement(0);
        }
        // Print parameters type
        if (parameters) {
            Int32 parametersCount = parameters->SubElementCount();
            for (int i = 0; i < parametersCount; i++) {
                TypeRef parameterType = parameters->GetSubElement(i);
                gPlatform.IO.Printf("%.*s", FMT_LEN_BEGIN(&parameterType->Name()));
                if (i != parametersCount - 1) {
                    gPlatform.IO.Printf(", ");
                }
            }
        }
        gPlatform.IO.Printf(")");
    } else if (overload->IsA(baseVIType)) {
        gPlatform.IO.Printf("%.*s - SubVI Call", FMT_LEN_BEGIN(&overload->Name()));
    } else if (overload->IsString()) {
        StringRef *str = static_cast<StringRef*>(overload->Begin(kPARead));
        if (str) {
            SubString subString = (*str)->MakeSubStringAlias();
            gPlatform.IO.Printf("String: %.*s : ", FMT_LEN_BEGIN(&subString));
        }
    }

    if (overload->PointerType() == kPTGenericFunctionCodeGen) {
        gPlatform.IO.Printf("\n\t\tGeneric loader");
    }
    gPlatform.IO.Printf("\n");
}
//------------------------------------------------------------
static void PrintOverloads(SubString* opName, TypeManagerRef typeManagerRef, TypeRef baseVIType, Boolean isCalculatePass)
{
    if (!isCalculatePass)
        return;

    NamedTypeRef originalFunctionDefinition = typeManagerRef->FindTypeCore(opName, true);
    gPlatform.IO.Printf("=========================================================\n");
    gPlatform.IO.Printf("Finding an appropriate overload for '%.*s'\n", FMT_LEN_BEGIN(opName));
    gPlatform.IO.Printf("It currently has the following overloads:\n");
    for (NamedTypeRef overload = originalFunctionDefinition; overload; overload = overload->NextOverload()) {
        PrintOverload("\t", overload, baseVIType, isCalculatePass);
    }
    gPlatform.IO.Printf("\n");
}
#endif  // VIREO_DEBUG_PARSING_PRINT_OVERLOADS
//------------------------------------------------------------
TypeRef ClumpParseState::StartNextOverload()
{
    _instructionType = nullptr;
    _formalParameterIndex = 0;
    _formalParameterType = nullptr;
    _instructionPointerType = nullptr;
    _varArgCount = -1;
    _varArgRepeatStart = 0;
    _argCount = 0;
    _argPointers.clear();
    _argTypes.clear();
    _argPatches.clear();
    if (_argPatchCount > 0) {
        _patchInfoCount -= _argPatchCount;
        _argPatchCount = 0;
    }
    _bIsVI = false;

    NamedTypeRef t = _nextFunctionDefinition;
    if (t) {
        if (t == _genericFunctionDefinition) {
            t = t->NextOverload();
        }
        _nextFunctionDefinition = t ? t->NextOverload() : nullptr;
    }
    if (!t) {
        // Got to the end of the list. If there is generic loader use it last
        t = _genericFunctionDefinition;
        _genericFunctionDefinition = nullptr;
    }

    if (t && t->BitEncoding() == kEncoding_Pointer) {
        // Looks like it resolved to a native instruction
        _instructionPointerType = t;
        _instructionType = _instructionPointerType->GetSubElement(0);
    } else if (t && (t->IsA(_baseViType))) {
        // Also covers reentrant VIs since reentrant VIs inherit from simple VIs
        _bIsVI = true;
        VirtualInstrument* vi = AddSubVITargetArgument(t);
        _instructionPointerType = t;
        _instructionType = vi->Params()->ElementType();
    } else if (t && t->IsString()) {
        StringRef *str = static_cast<StringRef*>(t->Begin(kPARead));
        if (str) {
            SubString ss = (*str)->MakeSubStringAlias();
            t = _clump->TheTypeManager()->FindTypeCore(&ss);
        }
    }
#if VIREO_DEBUG_PARSING_PRINT_OVERLOADS
    PrintOverload("\ttrying... ", t, _baseViType, _cia->IsCalculatePass());
#endif
    return _instructionType;
}
//------------------------------------------------------------
TypeRef ClumpParseState::StartInstruction(SubString* opName)
{
    _nextFunctionDefinition = _clump->TheTypeManager()->FindTypeCore(opName, true);
    _genericFunctionDefinition = nullptr;

    // Look for a generic loader.
    for (NamedTypeRef overload = _nextFunctionDefinition; overload; overload = overload->NextOverload()) {
        if (overload->PointerType() == kPTGenericFunctionCodeGen) {
            _genericFunctionDefinition = overload;
            break;
        }
    }
    _hasMultipleDefinitions = _nextFunctionDefinition ? _nextFunctionDefinition->NextOverload() != nullptr : false;
#if VIREO_DEBUG_PARSING_PRINT_OVERLOADS
    PrintOverloads(opName, _clump->TheTypeManager(), _baseViType, _cia->IsCalculatePass());
#endif
    return StartNextOverload();
}
//------------------------------------------------------------
void ClumpParseState::ResolveActualArgument(SubString* argument, void** ppData, Boolean needsAddress)
{
    _actualArgumentType = nullptr;
    *ppData = nullptr;

    // "." prefixed symbols are type symbols from the TypeManager
    if (argument->ComparePrefix('.')) {
        _actualArgumentType = _clump->TheTypeManager()->FindType(tsTypeType);

        Utf8Char dot;
        argument->ReadRawChar(&dot);
        TypeRef type = _clump->TheTypeManager()->FindType(argument);
        if (type != nullptr) {
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
            TypeRef* pDef = static_cast<TypeRef*>(cdt->Begin(kPAInit));
            if (pDef) {
                *pDef = type;
            }
            cdt = cdt->FinalizeDVT();
            if (needsAddress) {
                *ppData = static_cast<AQBlock1*>(cdt->Begin(kPARead));
            }
        }
        return;
    }

    // See if actual argument is '*' meaning use the default/unwired behavior.
    if (argument->CompareCStr(tsWildCard)) {
        _actualArgumentType = FormalParameterType();
        // Regardless of whether the optional argument is flat or not, do not allocate data value
        // and use nullptr-pointer and let the prims handle the optional arguments correctly
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

        TypeRef type = TypeDefiner::ParseLiteral(_clump->TheTypeManager(), FormalParameterType(), _pLog, _approximateLineNumber, argument);
        if (type) {
            _argumentState = kArgumentResolvedToLiteral;
            _actualArgumentType = type;
            if (needsAddress) {
                *ppData = type->Begin(kPARead);
            }
        } else {
            _argumentState = kArgumentNotResolved;
        }
        return;
    }

    // See if it is in the VI's locals or paramblock
    _actualArgumentType = _vi->GetVIElementAddressFromPath(argument, _vi, ppData, false);
    if (_actualArgumentType) {
        if ((_actualArgumentType->ElementUsageType() == kUsageTypeInput || _actualArgumentType->ElementUsageType() == kUsageTypeConst)
            && _formalParameterType->ElementUsageType() != kUsageTypeInput)
            _argumentState = kArgumentNotMutable;  // can't write to an subVI's input parameter
        else
            _argumentState = kArgumentResolvedToVIElement;
        return;
    }

    // See if it is a global value.
    // the first part of the path is the symbol. Beyond that it drills into the variable.
    SubString pathHead, pathTail;
    argument->SplitString(&pathHead, &pathTail, '.');
    _actualArgumentType = _clump->TheTypeManager()->FindType(&pathHead);
    if (_actualArgumentType != nullptr) {
        // The symbol was found in the TypeManager chain. Get a pointer to the value.

        UsageTypeEnum usageType = _formalParameterType->ElementUsageType();
        void* pData = nullptr;

        // TODO(PaulAustin): access-option based on parameter direction;
        if (usageType == kUsageTypeInput) {
            pData = _actualArgumentType->Begin(kPARead);
        } else if (usageType == kUsageTypeOutput) {
            pData = _actualArgumentType->Begin(kPAWrite);
        } else if (usageType == kUsageTypeInputOutput) {
            pData = _actualArgumentType->Begin(kPAReadWrite);
        } else {
            pData = nullptr;
        }

        if (!pData) {
            _argumentState = kArgumentNotMutable;
            return;
        }

        // If there is a dot after the head, then there is more to parse.
        if (pathTail.Length()) {
            // If the top type is a cluster then the remainder is field name qualifier path.
            void* pDataStart = pData;
            _actualArgumentType = _actualArgumentType->GetSubElementAddressFromPath(&pathTail, pDataStart, &pData, false);
        }
        if (_actualArgumentType) {
            if (needsAddress) {
                *ppData = pData;
            }
            _argumentState = kArgumentResolvedToGlobal;
        }
    }
}
//------------------------------------------------------------
void ClumpParseState::AddDataTargetArgument(SubString* argument, Boolean addType, Boolean addAddress)
{
    void* pData = nullptr;

    ResolveActualArgument(argument, &pData, addAddress);

    if (ActualArgumentType() == nullptr) {
        return;
    }

    SubString dsTypeName = ActualArgumentType()->Name();

    if (addType) {
        // StaticTypeAndData formal parameters get passed the type and pointer to the data.
        // they are fully polymorphic.
        InternalAddArgBack(nullptr, ActualArgumentType());
        static SubString etad("EnumTypeAndData");
        if (FormalParameterType()->IsA(&etad)) {
            if (!ActualArgumentType()->IsEnum()) {
                _argumentState = kArgumentTypeMismatch;
            }
        }
    } else if (dsTypeName.CompareCStr(tsWildCard) && FormalParameterType()->IsOptionalParam()) {
        // '*' as an argument means no value is passed. If its marked as optional this is OK
        // the '*' is not the generic type in this case.
    } else {
        if (!ActualArgumentType()->IsA(FormalParameterType())) {
            // IsA uses type name comparison.  If this fails, allow unnamed types to match based on structure
            // (We don't allow two named types with different names to match based on structure only
            // because, for example, TimeStamp and ComplexDouble have the same structure and this causes issues.)
            bool structTypeSame = ActualArgumentType()->Name().Length() == 0 && ActualArgumentType()->IsA(FormalParameterType(), true);
            if (!structTypeSame)
                _argumentState = kArgumentTypeMismatch;
        }
    }

    if (addAddress) {
        InternalAddArgBack(ActualArgumentType(), pData);
    }
}
//------------------------------------------------------------
void ClumpParseState::InternalAddArgBack(TypeRef actualType, void* address)
{
    _argTypes.push_back(actualType);
    _argPointers.push_back(address);
    ++_argCount;

    if (_varArgCount >= 0) {
        ++_varArgCount;
        _argPointers[0] = reinterpret_cast<void*>(_varArgCount);  // VargArgCount is always first argument; update
    }
}
//------------------------------------------------------------
void ClumpParseState::InternalAddArgFront(TypeRef actualType, void* address)
{
    VIREO_ASSERT(!VarArgParameterDetected());
    auto argTypesIter = _argTypes.begin();
    auto argPointersIter = _argPointers.begin();

    _argTypes.insert(argTypesIter, actualType);
    _argPointers.insert(argPointersIter, address);
    ++_argCount;
}
//------------------------------------------------------------
void ClumpParseState::InternalAddArgNeedingPatch(PatchInfo::PatchType patchType, intptr_t whereToPeek)
{
    // Note which argument needs patching.
    // WhereToPeek is the location that will have the resolved value later.
    // it should point to nullptr when checked if not yet resolved.
    _argPatches.push_back(_argCount);
    ++_argPatchCount;
    if (_patchInfos.size() <= size_t(_patchInfoCount))
        _patchInfos.resize(_patchInfoCount+kClumpStateIncrementSize);
    PatchInfo *pPatch = &_patchInfos[_patchInfoCount];
    pPatch->_patchType = patchType;
    pPatch->_whereToPeek = IntIndex(whereToPeek);
    InternalAddArgBack(nullptr, reinterpret_cast<void*>(_patchInfoCount));
    ++_patchInfoCount;
}
//------------------------------------------------------------
void ClumpParseState::AddVarArgCount()
{
    // The VarArg count is a constant passed by value to the instruction.
    // It indicates how many pointers arguments are passed after the VarArg
    // normal Parameter token.
    VIREO_ASSERT(_argCount == 0 && _argPointers.empty());

    _argPointers.push_back(nullptr);
    _argTypes.resize(1);  // placeholder, not used
    ++_argCount;
    _varArgCount = 0;
}
//------------------------------------------------------------
void ClumpParseState::MarkPerch(SubString* perchToken)
{
    if (_cia->IsCalculatePass())
        return;

    // For a perch(n) instruction make sure it has not been defined before
    // and flag the emitter to record the address of the next instruction
    // as the target location to jump to for branches to this perch.

    IntMax index;
    if (perchToken->ReadInt(&index)) {
        size_t perchIndex = size_t(index);
        if (perchIndex >= _perches.size())
            _perches.resize(UInt32(perchIndex + kClumpStateIncrementSize));
        if (_perches[perchIndex] < kPerchUndefined) {
            LogEvent(EventLog::kSoftDataError, 0, "Perch '%d' duplicated in clump", perchIndex);
        }
        if (_perchIndexToRecordNextInstrAddr < 0) {
            // Reserve the perch till the next instruction is emitted
            // nullptr will never be a valid instruction address.
            _perches[perchIndex] = kPerchBeingAllocated;
            _perchIndexToRecordNextInstrAddr = (Int32)perchIndex;
        } else {
            LogEvent(EventLog::kSoftDataError, 0, "Double Perch '%d' not supported", perchIndex);
        }
    } else {
        LogEvent(EventLog::kSoftDataError, 0, "Perch label syntax error '%.*s'", FMT_LEN_BEGIN(perchToken));
    }
}
//------------------------------------------------------------
void ClumpParseState::AddBranchTargetArgument(SubString* branchTargetToken)
{
    IntMax index;
    if (branchTargetToken->ReadInt(&index)) {
        size_t perchIndex = size_t(index);
        if (perchIndex >= _perches.size())
            _perches.resize(perchIndex+kClumpStateIncrementSize);
        if ((_perches[perchIndex] != kPerchUndefined) && (_perches[perchIndex] != kPerchBeingAllocated)) {
            // The perch address is already known, use it.
            _argumentState = kArgumentResolvedToPerch;
            InternalAddArgBack(nullptr, _perches[perchIndex]);
        } else {
            // Remember the address of this perch as place to patch
            // once the clump is finished.
            _argumentState = kArgumentResolvedToPerch;
            InternalAddArgNeedingPatch(PatchInfo::Perch,  // (void**)&_perches[
                                       perchIndex);
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
    InternalAddArgBack(nullptr, _vi->Clumps()->BeginAt((IntIndex)clumpIndex));
}
//------------------------------------------------------------
VirtualInstrument* ClumpParseState::AddSubVITargetArgument(TypeRef viType)
{
    static SubString strReentrantVI(ReentrantVI_TypeName);
    VirtualInstrument *vi = nullptr;

    // The primary instance of the actual VI will be the value of the type.
    // If its not reentrant then every caller uses that instance. If it is, then a copy needs to be made.

    TypedArrayCoreRef* pObj = static_cast<TypedArrayCoreRef*>(viType->Begin(kPARead));
    if ((*pObj)->Type()->IsA(_baseReentrantViType)  && !_cia->IsCalculatePass()) {
        // Each reentrant VI will be a copy of the original.
        // If it is the calculate pass skip this and the use the original for its type.
        TypeManagerRef tm = this->_vi->TheTypeManager();

        // Reentrant VI clones exist in TM the caller VI is in.
        DefaultValueType *cdt = DefaultValueType::New(tm, viType, false);
        VirtualInstrumentObjectRef pVICopy = *(static_cast<VirtualInstrumentObjectRef*>(cdt->Begin(kPARead)));
        vi = static_cast<VirtualInstrument*>(pVICopy->RawObj());
    } else {
        // Non reentrant VIs use the original type
        vi = static_cast<VirtualInstrument*>((*pObj)->RawObj());
    }

    if (vi != nullptr) {
        _argumentState = kArgumentResolvedToClump;
        InternalAddArgBack(nullptr, vi->Clumps()->Begin());
    }
    return vi;
}
//------------------------------------------------------------
Int32 ClumpParseState::AddSubSnippet()
{
    // The sub snippet will not be built yet so just add nullptr.
    // SubSnippets have to be started after the current instruction
    // has been emitted so the memory will be allocated in the correct order.
    // However the parameter position can be returned

    InternalAddArgBack(nullptr, nullptr);
    return _argCount - 1;
}
//------------------------------------------------------------
void ClumpParseState::BeginEmitSubSnippet(ClumpParseState* subSnippet, InstructionCore* owningInstruction,
                                          Int32 argIndex)
{
    GenericInstruction *pInstruction = static_cast<GenericInstruction*>(owningInstruction);

    // For implicit next instructions the sub snippet will be where the "next" field points to
    // in packed instruction mode that means the instruction that immediately follows the current
    // instruction, so there is no actual pointer

    InstructionCore** ppNext;
    if  (argIndex >= 0) {
        ppNext = reinterpret_cast<InstructionCore**>(&pInstruction->_args[argIndex]);
    } else {
        // No place to patched (should be implicit next instruction)
        ppNext = nullptr;
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
    va_start(args, message);
    _pLog->LogEventV(severity, _approximateLineNumber, message, args);
    va_end(args);
}
//------------------------------------------------------------
void ClumpParseState::LogArgumentProcessing(Int32 lineNumber)
{
    _approximateLineNumber = lineNumber;
    EventLog::EventSeverity severity = LastArgumentError() ? EventLog::kSoftDataError : EventLog::kTrace;
    ConstCStr simpleMessage = nullptr;
    switch (_argumentState) {
        case kArgumentNotResolved:
            // Ignore arguments if the instruction was not resolved.
            simpleMessage = _instructionType ? "Argument not resolved" : nullptr;
            break;
        case kArgumentTypeMismatch:
            {
            SubString formalParameterTypeName = FormalParameterType()->Name();
            LogEvent(EventLog::kSoftDataError, lineNumber, "Type mismatch, argument should be '%.*s'",
                     FMT_LEN_BEGIN(&formalParameterTypeName));
            }
            break;
        case kArgumentTooMany:              simpleMessage = "Too many arguments";       break;
        case kArgumentTooFew:               simpleMessage = "Too few arguments";        break;
        case kArgumentNotOptional:          simpleMessage = "Argument not optional";    break;
        case kArgumentNotMutable:           simpleMessage = "Argument not mutable";     break;
        // Good states
        case kArgumentResolvedToGlobal:
        case kArgumentResolvedToLiteral:
        case kArgumentResolvedToClump:
        case kArgumentResolvedToVIElement:
        case kArgumentResolvedToPerch:
        case kArgumentResolvedToParameter:
        case kArgumentResolvedToDefault:    simpleMessage = nullptr;                       break;
        default:                            simpleMessage = "Unknown argument type";    break;
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
    VIREO_ASSERT(this->_argCount > 0);  // TODO(PaulAustin): arg[0] is subVI

    ClumpParseState snippetBuilder(this);

    // Save the arguments that will be passed to/from the subVI.
    AQBlock1*       viArgPointers[kMaxArguments];
    TypeRef         viArgTypes[kMaxArguments];
    IntIndex        viArgCount = _argCount-1;

    if (viArgCount >= kMaxArguments)
        return nullptr;

    VIClump* targetVIClump = static_cast<VIClump*>(_argPointers[0]);
    if (viArgCount > 0) {
        memcpy(viArgPointers, &_argPointers[1], viArgCount * sizeof(size_t));
        memcpy(viArgTypes, &_argTypes[1], viArgCount * sizeof(size_t));
    }

    // The initial argument is the pointer to the clump. Keep that one
    // and ad the real ones that will be used for the low level instruction.
    _argCount = 1;

    // No explicit field, the first copy-in instruction follows this instructions.
    Int32 copyInId = -1;
    AddSubSnippet();    // Reserve storage for the explicit next pointer (_piNext)
    Int32 copyOutId = AddSubSnippet();

    _bIsVI = false;
    SubString  opName("CallVI");
    _instructionType = ReresolveInstruction(&opName);

    // Recurse now that the instruction is a simple one.
    CallVIInstruction* callInstruction = static_cast<CallVIInstruction*>(EmitInstruction());

    VirtualInstrument* vi = targetVIClump->OwningVI();
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
            if (viArgPointers[i] != nullptr) {
                // For parameters to subVIs that are objects, only the pointer is copied.
                snippetBuilder.StartInstruction(&copyTopOpName);
                snippetBuilder.InternalAddArgBack(viArgTypes[i], viArgPointers[i]);
                snippetBuilder.InternalAddArgBack(paramType, pParamData + offset);
                snippetBuilder.EmitInstruction();
            }
        } else {
            // Flat data is copied, if no argument is passed in the the param block element is
            // initialized to its default value.
            if (viArgPointers[i] != nullptr && paramType->IsInputParam()) {
                // Not an object, do a normal copy.
                snippetBuilder.StartInstruction(&copyOpName);
                snippetBuilder.InternalAddArgBack(viArgTypes[i], viArgPointers[i]);
                snippetBuilder.InternalAddArgBack(paramType, pParamData + offset);
                snippetBuilder.EmitInstruction();
            }
        }
        if (viArgPointers[i] == nullptr || (paramType->IsOutputParam() && paramType->HasCustomDefault())) {
            // If source location is nullptr, no argument was passed.
            // Generate instruction to initialize parameter to default value.
            // For outputs we re-init to the default value if there is one.(in case the subvi does not write to it, or reads it locally)
            snippetBuilder.StartInstruction(&initOpName);
            snippetBuilder.InternalAddArgBack(nullptr, paramType);
            snippetBuilder.InternalAddArgBack(paramType, pParamData + offset);
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
        IntIndex offset = paramType->ElementOffset();
        // Copy out if there is place to put it. No need to copy out simple arrays
        // If arrays are inside clusters they will be copied out, tough the top pointer should be the same
        if (paramType->IsOutputParam() && (!paramType->IsArray()) && viArgPointers[i] != nullptr) {
            // If ArgPointer is nullptr no output provided, don't copy out, it was a temporary allocation.
            snippetBuilder.StartInstruction(&copyTopOpName);
            // Reverse direction for output parameters
            snippetBuilder.InternalAddArgBack(paramType, pParamData + offset);
            snippetBuilder.InternalAddArgBack(viArgTypes[i], viArgPointers[i]);
            snippetBuilder.EmitInstruction();
        }
        if (!paramType->IsFlat()) {
            if (viArgPointers[i] != nullptr) {
                // If it is non flat then it has to be owned. (Unwired parameters should have been allocated a private copy, handled in else)
                // Zero out all traces of the non flat value passed in
                snippetBuilder.StartInstruction(&zeroOutTopOpName);
                snippetBuilder.InternalAddArgBack(nullptr, paramType);
                snippetBuilder.InternalAddArgBack(paramType, pParamData + offset);
                snippetBuilder.EmitInstruction();
            } else {
                // Wild card argument was passed, so it was locally allocated in param block. We should clear the data.
                snippetBuilder.StartInstruction(&clearOpName);
                snippetBuilder.InternalAddArgBack(nullptr, paramType);
                snippetBuilder.InternalAddArgBack(paramType, pParamData + offset);
                snippetBuilder.EmitInstruction();
            }
        }
    }
    EndEmitSubSnippet(&snippetBuilder);
    _instructionType = nullptr;

    // Now that sub snippets have been made, configure the clump parser so that
    // The CallVI instruction knows where to go after it is done.
    RecordNextHere(&callInstruction->_piNext);

    return callInstruction;
}
//------------------------------------------------------------
//! Emit a specific instruction. Used by generic instruction emitters.
InstructionCore* ClumpParseState::EmitInstruction(SubString* opName, Int32 argCount, ...)
{
    // Look for function that matches parameter list.
    va_list args;
    Boolean keepTrying = true;
    StartInstruction(opName);
    while (keepTrying) {
        va_start(args, argCount);
        for (Int32 i = 0; (i < argCount) && keepTrying; i++) {
            TypeRef formalType = ReadFormalParameterType();
            TypeRef actualType = va_arg(args, TypeRef);
            void* actualData = va_arg(args, void*);

            if (actualType->IsA(formalType, false)) {
                InternalAddArgBack(actualType, actualData);
            } else {
                keepTrying = false;
            }
        }
        va_end(args);
        if (keepTrying) {
            keepTrying = false;
        } else {
            keepTrying = StartNextOverload() != nullptr;
        }
    }
    return EmitInstruction();
}
//------------------------------------------------------------
//! Emit the instruction resolved to by general clump parser.
InstructionCore* ClumpParseState::EmitInstruction()
{
    if (!_instructionType) {
        _varArgCount = -1;
        _varArgRepeatStart = 0;
        return nullptr;
        }

    if (_bIsVI) {
        return EmitCallVIInstruction();
    } else if (_instructionPointerType && _instructionPointerType->PointerType() == kPTGenericFunctionCodeGen) {
        // Get pointer to load time generic resolver function.
        GenericEmitFunction genericResolver;
        _instructionPointerType->InitData(&genericResolver);
        if (genericResolver != nullptr) {
            return genericResolver(this);
        }
        // If there is no generic resolver function assume the underlying instruction
        // can take the parameters as is (e.g. it is runtime polymorphic)
    }

    // If extra parameters exist for the matched instruction is that OK?
    Int32 formalArgCount = _instructionType->SubElementCount();
    if (formalArgCount > _argCount) {
//      Boolean foundMissing = false;
        for (Int32 i = _argCount; i < formalArgCount; i++) {
            TypeRef type = _instructionType->GetSubElement(i);
            if (type->IsStaticParam()) {
                DefaultValueType *cdt = DefaultValueType::New(_clump->TheTypeManager(), type, true);
                cdt = cdt->FinalizeDVT();
                void* pData = static_cast<AQBlock1*>(cdt->Begin(kPAReadWrite));  // * passed as a param means nullptr
                InternalAddArgBack(type, pData);
            } else {
//              foundMissing = true;
            }
        }
#if 0
        if (foundMissing && (_varArgCount < 0)) {
            _argumentState = kArgumentTooFew;
            SubString instructionName = _instructionPointerType->Name();
            _parserFocus.AliasAssign(&instructionName);
        }
#endif
    }

    _varArgCount = -1;
    _varArgRepeatStart = 0;
    _totalInstructionCount++;
    _totalInstructionPointerCount += (sizeof(InstructionCore) / sizeof(void*)) + _argCount;

    InstructionCore* instruction = CreateInstruction(_instructionPointerType, _argCount, !_argPointers.empty() ? &*_argPointers.begin() : nullptr);
    if (_cia->IsCalculatePass())
        return instruction;

    if (_perchIndexToRecordNextInstrAddr >= 0) {
        // TODO(PaulAustin): support multiple perch patching
        VIREO_ASSERT(_perches[_perchIndexToRecordNextInstrAddr] == kPerchBeingAllocated);
        _perches[_perchIndexToRecordNextInstrAddr] = instruction;
        _perchIndexToRecordNextInstrAddr = -1;
    }
    if (_argPatchCount > 0) {
        // Now that the instruction is built, if some of the arguments
        // still require patching (e.g. A branch to a forward perch)
        // add the _whereToPatch field.
        GenericInstruction *generic = static_cast<GenericInstruction*>(instruction);
        for (Int32 i = 0; i < _argPatchCount; i++) {
            Int32 argNumToPatch = _argPatches[i];
            // PatchInfo object index was stashed in arg, look it up.
            intptr_t patchInfoIndex = intptr_t(generic->_args[argNumToPatch]);
            PatchInfo *pPatch = &_patchInfos[patchInfoIndex];

            // Now erase that pointer.
            generic->_args[argNumToPatch] = nullptr;

            VIREO_ASSERT(pPatch->_whereToPatch == nullptr)
            pPatch->_whereToPatch = &generic->_args[argNumToPatch];
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
    // a nullptr at the end. Used in conjunction with
    // the function ExecutionContext::IsCulDeSac()
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

    for (IntIndex i = 0; i < _patchInfoCount; i++) {
        VIREO_ASSERT(_patchInfos[i]._patchType == PatchInfo::Perch);
        *_patchInfos[i]._whereToPatch = _perches[_patchInfos[i]._whereToPeek];
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(Start, VirtualInstrumentObjectRef)
{
    if (_Param(0))
        _Param(0)->ObjBegin()->PressGo();
    return _NextInstruction();
}
//------------------------------------------------------------
//! Custom data methods needed to Copy a VI.
class VIDataProcsClass : public IDataProcs
{
    NIError InitData(TypeRef type, void* pData, TypeRef pattern) override
    {
        // The Proto-VI has a generic Param/Locals with no clumps. The Pattern type still has that type,
        // but will have a custom default value for the underlying type. This means the
        // InitData method will detect the default value and will copy the pattern's value
        // once the core structure is set up. Look in ArrayType::InitData() for more details.
        return type->InitData(pData, pattern);
    }

    NIError CopyData(TypeRef type, const void* pDataSource, void* pDataCopy) override
    {
        // First copy the basics, then fix up a few things.
        type->CopyData(pDataSource, pDataCopy);

        VirtualInstrumentObjectRef vioCopy = *(static_cast<VirtualInstrumentObjectRef*>(pDataCopy));
        VirtualInstrument* viCopy = vioCopy->ObjBegin();
        VIClump *pClump = viCopy->Clumps()->Begin();
        VIClump *pClumpEnd = viCopy->Clumps()->End();
        // Set clumps to point to the correct owner,
        // clear any indication they are running.
        for (; pClump < pClumpEnd; pClump++) {
            pClump->_owningVI = viCopy;
            pClump->_next = nullptr;
            pClump->_codeStart = nullptr;
            pClump->_savePc = nullptr;
            pClump->_shortCount = pClump->_fireCount;
        }
        return kNIError_Success;
    }
    NIError ClearData(TypeRef type, void* pData) override
    {
        VirtualInstrumentObjectRef vio = *(static_cast<VirtualInstrumentObjectRef*>(pData));
        if (nullptr == vio)
            return kNIError_Success;

        VirtualInstrument* vi = vio->ObjBegin();

        VIClump *pClump = vi->Clumps()->Begin();
        if (pClump) {
            // In packed mode all instructions are in one block.
            // The first instruction of the first clump is the beginning of the block.
            vi->TheTypeManager()->Free(pClump->_codeStart);

            // If it's a top VI
            if (!pClump->_caller)
                vi->ClearTopVIParamBlock();
        }

        return type->ClearData(pData);
    }
    //------------------------------------------------------------
    TypeRef GetSubElementAddressFromPath(TypeRef type, SubString* path, void* pStart, void** ppData, Boolean allowDynamic) override
    {
        VirtualInstrumentObjectRef vio = *(static_cast<VirtualInstrumentObjectRef*>(pStart));
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
    NIError ClearData(TypeRef type, void* pData) override
    {
        // All instructions for all clumps in a VI are stored in one
        // block of memory. The VI will free it.
        *(static_cast<void**>(pData)) = nullptr;
        return kNIError_Success;
    }
};
InstructionBlockDataProcsClass gInstructionBlockDataProcs;
#endif

DEFINE_VIREO_BEGIN(VirtualInstrument)
    DEFINE_VIREO_REQUIRE(TypeManager)
    DEFINE_VIREO_REQUIRE(Synchronization)
    DEFINE_VIREO_TYPE(ExecutionContext, "DataPointer");  // TODO(PaulAustin): define as type string
    DEFINE_VIREO_CUSTOM_DP(InstructionBlock, "Instruction", &gInstructionBlockDataProcs);
    DEFINE_VIREO_TYPE(Clump, Clump_TypeString);
    DEFINE_VIREO_TYPE(EmptyParameterList, "c()");
    DEFINE_VIREO_CUSTOM_DP(VirtualInstrument, VI_TypeString, &gVIDataProcs);
    DEFINE_VIREO_TYPE(VI, "VirtualInstrument");
    DEFINE_VIREO_TYPE(ReentrantVirtualInstrument, "VirtualInstrument");  // A case of simple inheritance
    DEFINE_VIREO_FUNCTION(Start, "p(i(VirtualInstrument))");
DEFINE_VIREO_END()

}  // namespace Vireo
