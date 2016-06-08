/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Generic instruction generation methods for polymorphic and aggregate functions.
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "TDCodecVia.h"
#include "VirtualInstrument.h"

namespace Vireo
{

//------------------------------------------------------------
ConstCStr CopyProcName(void *pSource, void *pDest, Int32 aqSize)
{
    // If the source or dest are not aligned to aqSize bytes, return null.
    if (((uintptr_t) pSource % aqSize != 0) || ((uintptr_t) pDest % aqSize != 0))
        return null;

    switch (aqSize) {
        case 1:     return "Copy1";   break;
        case 2:     return "Copy2";   break;
        case 4:     return "Copy4";   break;
        case 8:     return "Copy8";   break;
        case 16:    return "Copy16";  break;
        case 32:    return "Copy32";  break;
        default:    return null;      break;
    }
}
//------------------------------------------------------------
InstructionCore* EmitGenericCopyInstruction(ClumpParseState* pInstructionBuilder)
{
    // TODO-security. user code should only be allowed to use the "Copy" operation,
    // not the more type-specific ones this function references.
    // those should be marked as kernel access. (can user name spaces over load the same names?)
    InstructionCore* pInstruction = null;
    if (pInstructionBuilder->_argCount != 2)
        return null;
    TypeRef sourceType = pInstructionBuilder->_argTypes[0];
    TypeRef destType = pInstructionBuilder->_argTypes[1];
    SubString originalCopyOp = pInstructionBuilder->_instructionPointerType->Name();
    
    // Compare types
    
    if (sourceType->IsA(destType, true) || destType->IsA(sourceType, true)) {
        void* pSource = pInstructionBuilder->_argPointers[0];
        void* pDest = pInstructionBuilder->_argPointers[1];
        void* extraParam = null;
        ConstCStr copyOpName = null;
        if (originalCopyOp.CompareCStr("CopyTop")) {
            copyOpName = CopyProcName(pSource, pDest, sourceType->TopAQSize());
            if (!copyOpName) {
                copyOpName = "CopyN";
                // For CopyN a count is passed as well
                extraParam = (void*) (size_t)sourceType->TopAQSize();
            }
        } else if (sourceType->IsFlat()) {
            copyOpName = CopyProcName(pSource, pDest, sourceType->TopAQSize());
            if (!copyOpName) {
                copyOpName = "CopyN";
                // For CopyN a count is passed as well
                extraParam = (void*) (size_t)sourceType->TopAQSize();
            }
        } else if (sourceType->IsArray()) {
            VIREO_ASSERT(!destType->IsInputParam());
            if (destType->IsAlias() && !destType->IsOutputParam()) {
                // If its a local alias then just copy the pointer.
                // Outputs are alias to the callers params, so that still needs a deep copy
                copyOpName = "CopyTop";
            } else {
                //Objects require a deep copy (e.g. arrays will copy over all values)
                copyOpName = "CopyObject";
            }
        } else {
            // Non flat clusters (e.g clusters with arrays) need type info passed
            // so the general purpose copy function can get to the types copy proc.
            copyOpName = "CopyStaticTypedBlock";
            extraParam = (void*) sourceType;
        }
        
        SubString copyOpToken(copyOpName);
        if (extraParam) {
            // Some copy operations take an additional parameter, pass it at the end.
            pInstructionBuilder->InternalAddArg(null, extraParam);
        }
        pInstructionBuilder->ReresolveInstruction(&copyOpToken, false);
        pInstruction = pInstructionBuilder->EmitInstruction();
    } else {
        pInstructionBuilder->LogEvent(EventLog::kSoftDataError, 0, "Type mismatch");
    }
    return pInstruction;
}
//------------------------------------------------------------
// Data Init function
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(Init, StaticType, void)
{
    _ParamPointer(0)->InitData(_ParamPointer(1));
    return _NextInstruction();
}
//------------------------------------------------------------
// Data Clear function
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(Clear, StaticType, void)
{
    _ParamPointer(0)->ClearData(_ParamPointer(1));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ZeroOutTop, StaticType, void)
{
    // Used to zero out parameters after a call is done.
    _ParamPointer(0)->ZeroOutTop(_ParamPointer(1));
    return _NextInstruction();
}
//------------------------------------------------------------
// Data Copy functions
//------------------------------------------------------------
// Let the c++ compiler generate default assignment code for some
// larger chunks, note that data alignment rules apply.
struct Block128 {
    // clang support __int128, but using it caused a crash.
    // perhaps because it changes alignment requirements.
    // __int128 chunk;
    Int64 block1;
    Int64 block2;
} ;

struct Block256 {
    Block128 block1;
    Block128 block2;
} ;

DECLARE_VIREO_PRIMITIVE2( Copy1, Int8,  Int8,  (_Param(1) = _Param(0)) )
DECLARE_VIREO_PRIMITIVE2( Copy2, Int16, Int16, (_Param(1) = _Param(0)) )
DECLARE_VIREO_PRIMITIVE2( Copy4, Int32, Int32, (_Param(1) = _Param(0)) )
DECLARE_VIREO_PRIMITIVE2( Copy8, Int64, Int64, (_Param(1) = _Param(0)) )
DECLARE_VIREO_PRIMITIVE2( Copy16, Block128, Block128, (_Param(1) = _Param(0)) )
DECLARE_VIREO_PRIMITIVE2( Copy32, Block256, Block256, (_Param(1) = _Param(0)) )

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(CopyN, void, void, void)
{
    size_t countAq = (size_t) _ParamPointer(2);
    memmove( _ParamPointer(1), _ParamPointer(0), countAq);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(CopyObject, TypedObjectRef, TypedObjectRef)
{
    TypedObjectRef* pObjectSource = _ParamPointer(0);
    TypedObjectRef* pObjectDest = _ParamPointer(1);
    
    TypeRef type = (*pObjectSource)->Type();
    type->CopyData(pObjectSource, pObjectDest);
        
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(CopyStaticTypedBlock, void, void, StaticType)
{
    TypeRef sourceType = _ParamPointer(2);
    sourceType->CopyData(_ParamPointer(0), _ParamPointer(1));
    return _NextInstruction();
}
//------------------------------------------------------------
struct AggregateBinOpInstruction : public InstructionCore
{
    union {
        _ParamDef(TypedArrayCoreRef, VX);
        _ParamDef(AQBlock1*, SX);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VY);
        _ParamDef(AQBlock1*, SY);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VDest);
        _ParamDef(AQBlock1*, SDest);
        _ParamDef(Boolean, BooleanDest);
    };
    _ParamImmediateDef(InstructionCore*, Snippet);
    _ParamImmediateDef(InstructionCore*, Accumulator);
    inline InstructionCore* Accumulator()   { return this->_piAccumulator; }
    inline InstructionCore* Snippet()       { return this->_piSnippet; }
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Next()          { return this->_piNext; }
};
//------------------------------------------------------------
InstructionCore* EmitGenericBinOpInstruction(ClumpParseState* pInstructionBuilder)
{
    InstructionCore* pInstruction = null;
    TypeRef sourceXType = pInstructionBuilder->_argTypes[0];
    TypeRef sourceYType = pInstructionBuilder->_argTypes[1];
    TypeRef destType = pInstructionBuilder->_argTypes[2];
    TypeRef goalType = destType;
    Boolean isAccumulator = false;
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();
    
    // Check for accumulator style binops where the dest type is simpler. (eg. compareAggregates.. others?)
    if (sourceXType->BitEncoding() == kEncoding_Array && sourceYType->BitEncoding() == kEncoding_Array && destType->BitEncoding() != kEncoding_Array) {
        goalType = sourceXType;
        isAccumulator = true;
    } else if (sourceXType->BitEncoding() == kEncoding_Cluster && sourceYType->BitEncoding() == kEncoding_Cluster && destType->BitEncoding() != kEncoding_Cluster) {
        goalType = sourceXType;
        isAccumulator = true;
    } else if (destType->BitEncoding() == kEncoding_Boolean) { //some kind of comparison
        goalType = sourceXType;
    }
    if (savedOperation.CompareCStr("Split") || savedOperation.CompareCStr("Join")) {  // Split and Join are uniquely identified by source type rather than dest type
        goalType = sourceXType;
    }

    switch (goalType->BitEncoding()) {
        case kEncoding_Array:
        {
            // Find out what this name of the original opcode was.
            // this will be the name of the _instructionPointerType.
            savedOperation = pInstructionBuilder->_instructionPointerType->Name();
            ConstCStr pVectorBinOpName = null;
            // TODO: Validating runtime will require  type checking
            if (sourceXType->IsArray() && sourceYType->IsArray()) {
                if (savedOperation.CompareCStr("Split"))
                    pVectorBinOpName = "VectorVectorSplitOp";
                else
                    pVectorBinOpName = isAccumulator ? "VectorVectorBinaryAccumulatorOp" : "VectorVectorBinaryOp";
            } else if (sourceXType->IsArray()) {
                pVectorBinOpName = "VectorScalarBinaryOp";
            } else {
                pVectorBinOpName = "ScalarVectorBinaryOp";
            }
            SubString vectorBinOpToken(pVectorBinOpName);
            pInstructionBuilder->ReresolveInstruction(&vectorBinOpToken, false); //build a vector op
            // This would be easier if the vector bin op was at the end...
            Int32 binOpArgId = pInstructionBuilder->AddSubSnippet();
            Int32 accumulatorOpArgId = pInstructionBuilder->AddSubSnippet();

            // Add room for next field
            pInstructionBuilder->AddSubSnippet();

            // Emit the vector op
            AggregateBinOpInstruction* vectorBinOp = (AggregateBinOpInstruction*) pInstructionBuilder->EmitInstruction();
            pInstruction = vectorBinOp;

            // Recurse on the subtype
            ClumpParseState snippetBuilder(pInstructionBuilder);
            
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, vectorBinOp, binOpArgId);
            TypeRef xEltType = sourceXType->IsArray() ? sourceXType->GetSubElement(0) : sourceXType;
            TypeRef yEltType = sourceYType->IsArray() ? sourceYType->GetSubElement(0) : sourceYType;
            TypeRef destEltType = destType->IsArray() ? destType->GetSubElement(0) : destType;
            snippetBuilder.EmitInstruction(&savedOperation, 3, xEltType, (void*)null, yEltType, (void*)null, destEltType, (void*)null);
            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            
            // Create the accumulator snippet
            if (isAccumulator) {
                TempStackCString opToken(&savedOperation);
                SubString accToken("Accumulator");
                opToken.Append(&accToken);
                SubString accumulatorToken(opToken.BeginCStr());

                pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, vectorBinOp, accumulatorOpArgId);
                snippetBuilder.StartInstruction(&accumulatorToken);
                snippetBuilder.InternalAddArg(null, vectorBinOp == kFakedInstruction ? null : vectorBinOp->_piSnippet);  //TODO this seems redundant
                snippetBuilder.EmitInstruction();
                pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            }
            pInstructionBuilder->RecordNextHere(&vectorBinOp->_piNext);
            break;
        }
        case kEncoding_Cluster:
        {
            savedOperation = pInstructionBuilder->_instructionPointerType->Name();
            ConstCStr pClusterBinOpName = "ClusterBinaryOp";
            SubString clusterBinOpToken(pClusterBinOpName);

            pInstructionBuilder->ReresolveInstruction(&clusterBinOpToken, false);
            Int32 binOpArgId = pInstructionBuilder->AddSubSnippet(); // Add param slots to hold the snippets
            Int32 accumulatorOpArgId = pInstructionBuilder->AddSubSnippet();

            // Add room for next field
            pInstructionBuilder->AddSubSnippet();

            AggregateBinOpInstruction* clusterOp = (AggregateBinOpInstruction*)pInstructionBuilder->EmitInstruction();
            pInstruction = clusterOp;
            
            ClumpParseState snippetBuilder(pInstructionBuilder);
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, clusterOp, binOpArgId);

            for (Int32 i = 0; i < goalType->SubElementCount(); i++) {
                TypeRef arg1Type, arg2Type, arg3Type;
                void    *arg1Data, *arg2Data, *arg3Data;
                
                if (sourceXType->IsCluster()) {
                    arg1Type = sourceXType->GetSubElement(i);
                    arg1Data = (void*)(size_t)arg1Type->ElementOffset();
                } else {
                    arg1Type = sourceXType;
                    arg1Data = null;
                }
                if (sourceYType->IsCluster()) {
                    arg2Type = sourceYType->GetSubElement(i);
                    arg2Data = (void*)(size_t)arg2Type->ElementOffset();
                } else {
                    arg2Type = sourceYType;
                    arg2Data = null;
                }
                
                if (destType->IsCluster()) {
                    arg3Type = destType->GetSubElement(i);
                    arg3Data = (void*)(size_t)arg3Type->ElementOffset();
                } else {
                    arg3Type = destType;
                    arg3Data = null;
                }
                
                snippetBuilder.EmitInstruction(&savedOperation, 3, arg1Type, arg1Data, arg2Type, arg2Data, arg3Type, arg3Data);
            }
            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            
            if (isAccumulator) {
                // create the accumulator snippet
                TempStackCString opToken(&savedOperation);
                SubString accToken("Accumulator");
                opToken.Append(&accToken);
                SubString accumulatorToken(opToken.BeginCStr());

                pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, clusterOp, accumulatorOpArgId);
                snippetBuilder.StartInstruction(&accumulatorToken);
                snippetBuilder.InternalAddArg(null, clusterOp == kFakedInstruction ? null : clusterOp->_piSnippet);
                snippetBuilder.EmitInstruction();
                pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            }

            pInstructionBuilder->RecordNextHere(&clusterOp->_piNext);
            break;
        }
        default:
        {       
            pInstruction = null;
            break;
        }
    }
    return pInstruction;
}
//------------------------------------------------------------
struct AggregateUnOpInstruction : public InstructionCore
{
    union {
        _ParamDef(TypedArrayCoreRef, VSource);
        _ParamDef(AQBlock1*, SSource);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VDest);
        _ParamDef(AQBlock1*, SDest);
    };
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()          { return this->_piNext; }
};
//------------------------------------------------------------
InstructionCore* EmitGenericUnOpInstruction(ClumpParseState* pInstructionBuilder)
{
    InstructionCore* pInstruction = null;
    TypeRef sourceXType = pInstructionBuilder->_argTypes[0];
    TypeRef destType = pInstructionBuilder->_argTypes[1];
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();

    if (savedOperation.CompareCStr("Convert")) {
        // Special case for convert, if the types are the same go straight to the more efficent copy
        SubString destTypeName = destType->Name();
        if (destTypeName.Length() > 0 && sourceXType->CompareType(destType)) {
            ConstCStr copyOpName = "Copy";
            SubString copyOpToken(copyOpName);
            pInstructionBuilder->ReresolveInstruction(&copyOpToken, false);
            return pInstructionBuilder->EmitInstruction();
        }
    }

    
    switch(destType->BitEncoding()) {
        case kEncoding_Array:
        {
            ConstCStr pVectorUnOpName = "VectorUnaryOp";
            SubString vectorUnOpToken(pVectorUnOpName);
            pInstructionBuilder->ReresolveInstruction(&vectorUnOpToken, false); //build a vector op
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
            AggregateUnOpInstruction* unaryOp = (AggregateUnOpInstruction*) pInstructionBuilder->EmitInstruction(); //emit the vector op
            pInstruction = unaryOp;

            // Recurse on the element
            ClumpParseState snippetBuilder(pInstructionBuilder);
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, unaryOp, snippetArgId);
            
            snippetBuilder.EmitInstruction(&savedOperation, 2, sourceXType->GetSubElement(0), (void*)null, destType->GetSubElement(0), (void*)null);

            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            pInstructionBuilder->RecordNextHere(&unaryOp->_piNext);
            break;
        }
        case kEncoding_Cluster:
        {
            ConstCStr pClusterUnOpName = "ClusterUnaryOp";
            SubString clusterUnOpToken(pClusterUnOpName);

            pInstructionBuilder->ReresolveInstruction(&clusterUnOpToken, false);
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
            AggregateUnOpInstruction* unaryOp = (AggregateUnOpInstruction*)pInstructionBuilder->EmitInstruction();
            pInstruction = unaryOp;
            
            // Recurse on the sub elemets
            ClumpParseState snippetBuilder(pInstructionBuilder);
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, unaryOp, snippetArgId);
            for (Int32 i = 0; i < destType->SubElementCount(); i++) {
 
                TypeRef destSub = destType->GetSubElement(i);
                TypeRef sourceSub = sourceXType;
                void* sourceData = null;
                if (sourceXType->BitEncoding() == kEncoding_Cluster) {
                    sourceSub = sourceXType->GetSubElement(i);
                    sourceData =  (void*)(size_t)sourceSub->ElementOffset();
                }
                snippetBuilder.EmitInstruction(&savedOperation, 2, sourceSub, sourceData, destSub, (void*)(size_t)destSub->ElementOffset());
            }
            
            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            pInstructionBuilder->RecordNextHere(&unaryOp->_piNext);
            break;
        }
        default:
        {
            // Leave pInstruction null. Error reported by caller.
            break;
        }
    }
    return pInstruction;
}

//----------------------------------------------------------------------------
struct MaxMinValueInstruction : public InstructionCore
{
    _ParamDef(void, ValueX);
    _ParamDef(void, ValueY);
    _ParamImmediateDef(StaticTypeAndData, MaxValue[1]);
    _ParamImmediateDef(StaticTypeAndData, MinValue[1]);
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()      { return this->_piNext; }
};
//------------------------------------------------------------
InstructionCore* EmitMaxMinValueInstruction(ClumpParseState* pInstructionBuilder)
{
    ConstCStr pMaxMinOpName = "MaxMinValueInternal";
    SubString findMaxMinOpToken(pMaxMinOpName);

    pInstructionBuilder->ReresolveInstruction(&findMaxMinOpToken, false);
    InstructionCore* pInstruction = null;
    TypeRef argType =  pInstructionBuilder->_argTypes[0];
    TypeRef argType2 = pInstructionBuilder->_argTypes[1];
    if(!argType->CompareType(argType2)) {
        return null;
    }
    TypeRef outputType = pInstructionBuilder->_argTypes[3];
    TypeRef outputType2 = pInstructionBuilder->_argTypes[5];
    if(!outputType->CompareType(outputType2)) {
        return null;
    }
    if(!argType2->CompareType(outputType2)) {
        return null;
    }
    SubString LTName("IsLT");
    // Add param slot to hold the snippet
    Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
    MaxMinValueInstruction* maxMinOp = (MaxMinValueInstruction*)pInstructionBuilder->EmitInstruction();

    pInstruction = maxMinOp;
    TypeRef booleanType = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsBooleanType);

    ClumpParseState snippetBuilder(pInstructionBuilder);
    pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, maxMinOp, snippetArgId);
    snippetBuilder.EmitInstruction(&LTName, 3, argType, (void*)null, argType, (void*)null, booleanType, (void*)null);

    pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
    pInstructionBuilder->RecordNextHere(&maxMinOp->_piNext);
    return pInstruction;
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(MaxMinValueInternal, MaxMinValueInstruction)
{
    Instruction3<void, void, Boolean>* snippet = (Instruction3<void, void, Boolean>*)_ParamMethod(Snippet());
    Boolean isLT;

    snippet->_p0 = _ParamPointer(ValueX);
    snippet->_p1 = _ParamPointer(ValueY);
    snippet->_p2 = &isLT;
    TypeRef type = _ParamImmediate(MinValue)->_paramType;

    _PROGMEM_PTR(snippet, _function)(snippet);
    if(isLT) {
        type->CopyData(_ParamPointer(ValueX), _ParamImmediate(MinValue)->_pData);
        type->CopyData(_ParamPointer(ValueY), _ParamImmediate(MaxValue)->_pData);
    } else {
        type->CopyData(_ParamPointer(ValueY), _ParamImmediate(MinValue)->_pData);
        type->CopyData(_ParamPointer(ValueX), _ParamImmediate(MaxValue)->_pData);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
struct Search1DArrayInstruction : public InstructionCore
{
    _ParamDef(TypedArrayCoreRef, Array);
    _ParamDef(AQBlock1*, Element);
    _ParamDef(Int32, StartIndex);
    _ParamDef(Int32, FoundIndex);
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()      { return this->_piNext; }
};
//------------------------------------------------------------
InstructionCore* EmitSearchInstruction(ClumpParseState* pInstructionBuilder)
{
    ConstCStr pSearchOpName = "Search1DArrayInternal";
    SubString searchOpToken(pSearchOpName);

    pInstructionBuilder->ReresolveInstruction(&searchOpToken, false);
    InstructionCore* pInstruction = null;
    TypeRef elementType = pInstructionBuilder->_argTypes[1];

    VIREO_ASSERT(pInstructionBuilder->_argTypes[0]->BitEncoding() == kEncoding_Array);

    SubString EQName("IsEQ");
    // Add param slot to hold the snippet
    Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
    Search1DArrayInstruction* searchOp = (Search1DArrayInstruction*) pInstructionBuilder->EmitInstruction(); //emit the search op
    pInstruction = searchOp;
    TypeRef booleanType = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsBooleanType);

    ClumpParseState snippetBuilder(pInstructionBuilder);
    pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, searchOp, snippetArgId);
    snippetBuilder.EmitInstruction(&EQName, 3, elementType, (void*)null, elementType, pInstructionBuilder->_argPointers[1], booleanType, (void*)null);

    pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
    pInstructionBuilder->RecordNextHere(&searchOp->_piNext);

    return pInstruction;
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(Search1DArrayInternal, Search1DArrayInstruction)
{
    TypedArrayCoreRef array = _Param(Array);
    Int32 startIndex = (_ParamPointer(StartIndex) != null) ? _Param(StartIndex) : 0;
    if (startIndex < 0)
        startIndex = 0;
    Instruction3<AQBlock1, void, Boolean>* snippet = (Instruction3<AQBlock1, void, Boolean>*)_ParamMethod(Snippet());
    
    VIREO_ASSERT(array->Rank() == 1);
    IntIndex arrayLength = array->Length();
    IntIndex elementSize = array->ElementType()->TopAQSize();
    Boolean found = false;
    if (startIndex < arrayLength) {
        snippet->_p0 = array->BeginAt(startIndex);
        snippet->_p2 = &found;
        
        for (IntIndex i = startIndex; i < arrayLength; i++) {
            _PROGMEM_PTR(snippet, _function)(snippet);
            if (found) {
                _Param(FoundIndex) = i;
                return _NextInstruction();
            }
            snippet->_p0 += elementSize;
        }
    }
    _Param(FoundIndex) = -1;
    
    return _NextInstruction();
}
//------------------------------------------------------------
struct VectorOpInstruction : public InstructionCore
{
    _ParamDef(TypedArrayCoreRef, Array);
    _ParamImmediateDef(AQBlock1*, Result);
    _ParamImmediateDef(Boolean, IsIdentityOne);
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()      { return this->_piNext; }
};
//------------------------------------------------------------
InstructionCore* EmitVectorOp(ClumpParseState* pInstructionBuilder)
{
    TypeRef sourceType = pInstructionBuilder->_argTypes[0];
    TypeRef destType = pInstructionBuilder->_argTypes[1];
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();

    ConstCStr scalarOpName = null;
    Boolean isIdentityOne = false;
    if (savedOperation.CompareCStr("AddElements")) {
        scalarOpName = "Add";
        isIdentityOne = false;
    } else if (savedOperation.CompareCStr("MultiplyElements")) {
        scalarOpName = "Mul";
        isIdentityOne = true;
    } else if (savedOperation.CompareCStr("AndElements")) {
        scalarOpName = "And";
        isIdentityOne = true;
    } else if (savedOperation.CompareCStr("OrElements")) {
        scalarOpName = "Or";
        isIdentityOne = false;
    } else {
        VIREO_ASSERT(false);
    }
    SubString scalarOpToken(scalarOpName);

    // Build the vector op
    ConstCStr vectorOpName = "VectorOpInternal";
    SubString vectorOpToken(vectorOpName);
    pInstructionBuilder->ReresolveInstruction(&vectorOpToken, false);
    pInstructionBuilder->InternalAddArg(null, (void *) (size_t)isIdentityOne);
    Int32 scalarOpSnippetArgId = pInstructionBuilder->AddSubSnippet();
    VectorOpInstruction* vectorOp = (VectorOpInstruction*) pInstructionBuilder->EmitInstruction();

    // Build the scalar op sub-snippet
    ClumpParseState snippetBuilder(pInstructionBuilder);
    pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, vectorOp, scalarOpSnippetArgId);
    
    snippetBuilder.EmitInstruction(&scalarOpToken, 3, sourceType->GetSubElement(0), (void*)null,
        destType, pInstructionBuilder->_argPointers[1], destType, pInstructionBuilder->_argPointers[1]);
    
    pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
    pInstructionBuilder->RecordNextHere(&vectorOp->_piNext);

    return (InstructionCore*) vectorOp;
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorOpInternal, VectorOpInstruction)
{
    TypedArrayCoreRef array = _Param(Array);
    Instruction3<AQBlock1, AQBlock1, AQBlock1>* scalarOpSnippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());
    Boolean isIdentityOne = _ParamImmediate(IsIdentityOne);

    VIREO_ASSERT(array->Rank() == 1);
    IntIndex arrayLength = array->Length();
    IntIndex elementSize = array->ElementType()->TopAQSize();

    // Initialize the partial result to the identity of the scalar op.
    switch (array->ElementType()->BitEncoding()) {
        case kEncoding_Boolean:
        {
            *(Boolean *)scalarOpSnippet->_p2 = isIdentityOne;
            break;
        }
        case kEncoding_IEEE754Binary:
        {
            if (elementSize == sizeof(Single))
                *(Single *)scalarOpSnippet->_p2 = isIdentityOne;
            else
                *(Double *)scalarOpSnippet->_p2 = isIdentityOne;
            break;
        }
        default:
        {
            switch(elementSize) {
                case 1: *(Int8  *) scalarOpSnippet->_p2 = isIdentityOne; break;
                case 2: *(Int16 *) scalarOpSnippet->_p2 = isIdentityOne; break;
                case 4: *(Int32 *) scalarOpSnippet->_p2 = isIdentityOne; break;
                case 8: *(Int64 *) scalarOpSnippet->_p2 = isIdentityOne; break;
            }
        }
    }
    // For each array element, apply the scalar op to the element and the partial result to get the next partial result.
    for (scalarOpSnippet->_p0 = array->BeginAt(0); arrayLength-- > 0; scalarOpSnippet->_p0 += elementSize)
        _PROGMEM_PTR(scalarOpSnippet, _function)(scalarOpSnippet);

    return _NextInstruction();
}
//------------------------------------------------------------
InstructionCore* EmitArrayConcatenateInstruction(ClumpParseState* pInstructionBuilder)
{
    SubString ArrayConcatenateOpToken("ArrayConcatenateInternal");

    pInstructionBuilder->ReresolveInstruction(&ArrayConcatenateOpToken, false);
    Int32 argCount = pInstructionBuilder->_argCount;
    // _argPointers[0] holds the count
    TypeRef pDestType = pInstructionBuilder->_argTypes[1];

    // Skip the arg count and output array arguments.  Then, for each input add an argument which
    // indicates whether input's type is the same as ArrayOut's type or ArrayOut's element type.
    for (Int32 i = 2; i < argCount; i++) {
        if (pDestType->CompareType(pInstructionBuilder->_argTypes[i])) // input is an array
            pInstructionBuilder->InternalAddArg(null, pInstructionBuilder->_argPointers[i]);
        else if (pDestType->GetSubElement(0)->CompareType(pInstructionBuilder->_argTypes[i])) // input is a single element
            pInstructionBuilder->InternalAddArg(null, null);
        else // type mismatch
            VIREO_ASSERT(false);
    }

    return pInstructionBuilder->EmitInstruction();
}
//------------------------------------------------------------
struct ArrayConcatenateInternalParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamImmediateDef(void*, Element[1]);
    NEXT_INSTRUCTION_METHODV()
};
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATUREV(ArrayConcatenateInternal, ArrayConcatenateInternalParamBlock)
{
    Int32 numInputs = (_ParamVarArgCount() - 1) / 2;
    TypedArrayCoreRef pDest = _Param(ArrayOut);
    Int32 originalLength = pDest->Length();
    Int32 totalLength = 0;
    
    // Each input has a corresponding typeComparison entry which indicates whether input's type
    // is the same as ArrayOut's type or ArrayOut's element type.
    // The typeComparisons arguments are added after the inputs by EmitArrayConcatenateInstruction.
    void** inputs =  _ParamImmediate(Element);
    void** typeComparisons =  inputs + numInputs;
    
    for (Int32 i = 0; i < numInputs; i++) {
        // TODO check for overflow
        if (typeComparisons[i]) { // input is an array
            TypedArrayCoreRef arrayInput = *((TypedArrayCoreRef *) inputs[i]);
            totalLength += arrayInput->Length();
        } else {
            // Input is a single element
            totalLength++;
        }
    }
    
    if (pDest->Resize1DOrEmpty(totalLength)) {
        AQBlock1* pInsert = pDest->BeginAt(0);
        TypeRef elementType = pDest->ElementType();
        Int32   aqSize = elementType->TopAQSize();
        NIError err = kNIError_Success;
        for (Int32 i = 0; i < numInputs; i++) {
            if (typeComparisons[i]) {
                TypedArrayCoreRef pSource = *((TypedArrayCoreRef*) inputs[i]);
                if (pSource != pDest) {
                    IntIndex length = pSource->Length();
                    err = elementType->CopyData(pSource->BeginAt(0), pInsert, length);
                    pInsert += (length * aqSize);
                } else { // Source and dest are the same array
                
                    if (i != 0) {
                        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Illegal ArrayConcatenate inplaceness");
                        return THREAD_EXEC()->Stop();
                    }

                    pInsert += (originalLength * aqSize);
                }
            } else {
                err = elementType->CopyData(inputs[i], pInsert);
                pInsert +=  aqSize;
            }
            if (err != kNIError_Success) {
                pDest->Resize1D(0);
                break;
            }
        }
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorVectorBinaryAccumulatorOp, AggregateBinOpInstruction);
VIREO_FUNCTION_SIGNATURET(ClusterBinaryOp, AggregateBinOpInstruction)
{
    Instruction3<AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet()); //pointer to snippet.
    Instruction1<void>* accumulator = (Instruction1<void>* )_ParamMethod(Accumulator()); //pointer to accumulator

    if (accumulator != null) {
        // If there is an accumulator call it instead.
        // It will loop through the snippets settign the boolean result
        // In the third parameter. All boolean results point to the same location.
        while(ExecutionContext::IsNotCulDeSac(snippet)) {
            Boolean bNestedAccumulator =   (snippet->_function == (InstructionFunction)VectorVectorBinaryAccumulatorOp)
                                        || (snippet->_function == (InstructionFunction)ClusterBinaryOp);

            // Add the cluster offset to the snippet params
            snippet->_p0 += (size_t)_ParamPointer(SX);
            snippet->_p1 += (size_t)_ParamPointer(SY);
            snippet->_p2 = (AQBlock1*)_ParamPointer(BooleanDest);
            if (bNestedAccumulator) {
                snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*) ((AggregateBinOpInstruction*) snippet)->Next();
            } else {
                snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*) snippet->Next();
            }
        }
         _PROGMEM_PTR(accumulator, _function)(accumulator);
        snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());
        while(ExecutionContext::IsNotCulDeSac(snippet)) {
            Boolean bNestedAccumulator =   (snippet->_function == (InstructionFunction)VectorVectorBinaryAccumulatorOp)
                                        || (snippet->_function == (InstructionFunction)ClusterBinaryOp);

            // Reset snippet params back to just being offsets
            snippet->_p0 -= (size_t)_ParamPointer(SX);
            snippet->_p1 -= (size_t)_ParamPointer(SY);
            if (bNestedAccumulator) {
                snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*) ((AggregateBinOpInstruction*) snippet)->Next();
            } else {
                snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*) snippet->Next();
            }
        }
    } else {
        while(ExecutionContext::IsNotCulDeSac(snippet)) {
            snippet->_p0 += (size_t)_ParamPointer(SX);
            snippet->_p1 += (size_t)_ParamPointer(SY);
            snippet->_p2 += (size_t)_ParamPointer(SDest);
            InstructionCore *next = _PROGMEM_PTR(snippet, _function)(snippet);
            snippet->_p0 -= (size_t)_ParamPointer(SX);
            snippet->_p1 -= (size_t)_ParamPointer(SY);
            snippet->_p2 -= (size_t)_ParamPointer(SDest);
            snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*) next;
        }
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(ClusterUnaryOp, AggregateUnOpInstruction)
{
    Instruction2<AQBlock1, AQBlock1>* pInstruction = (Instruction2<AQBlock1, AQBlock1>* )_ParamMethod(Snippet());
    
    while(ExecutionContext::IsNotCulDeSac(pInstruction)) {
        pInstruction->_p0 += (size_t)_ParamPointer(SSource);
        pInstruction->_p1 += (size_t)_ParamPointer(SDest);
        InstructionCore* next = _PROGMEM_PTR(pInstruction,_function)(pInstruction); //execute inline for now. TODO yield to the scheduler
        pInstruction->_p0 -= (size_t)_ParamPointer(SSource);
        pInstruction->_p1 -= (size_t)_ParamPointer(SDest);
        pInstruction = (Instruction2<AQBlock1, AQBlock1>* )next;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
typedef Instruction3<AQBlock1, AQBlock1, Boolean> BinaryCompareInstruction;
//------------------------------------------------------------
// Accumulators are used for elements of an array and elements of a cluster
VIREO_FUNCTION_SIGNATURE1(IsEQAccumulator, void)
{
    BinaryCompareInstruction* binop = (BinaryCompareInstruction*)_ParamPointer(0);
    Boolean* dest = binop->_p2;
    InstructionCore* pInstruction = binop;
    if ((binop->_p0 == null) || (binop->_p1 == null)) {
        *dest = binop->_p0 == binop->_p1;
    } else {
        while(ExecutionContext::IsNotCulDeSac(pInstruction)) {
            pInstruction = _PROGMEM_PTR(pInstruction, _function)(pInstruction);
            if (!*dest)
                return null;
        }
    }
    return _this;
}
//------------------------------------------------------------
//execute a snippet of binops until one of them returns true
VIREO_FUNCTION_SIGNATURE1(IsNEAccumulator, void)
{
    BinaryCompareInstruction* binop = (BinaryCompareInstruction*)_ParamPointer(0);
    Boolean* dest = binop->_p2;
    InstructionCore* pInstruction = binop;
    if ((binop->_p0 == null) || (binop->_p1 == null)) {
        *dest = binop->_p0 != binop->_p1;
    } else {
        while(ExecutionContext::IsNotCulDeSac(pInstruction)) {
            pInstruction = _PROGMEM_PTR(pInstruction, _function)(pInstruction);
            if (*dest)
                return null;
        }
    }
    return _this;
}
//------------------------------------------------------------
//execute a snippet of binops until one of them returns true or the commutative pair returns true
VIREO_FUNCTION_SIGNATURE1(IsLTAccumulator, void)
{
    BinaryCompareInstruction* binop = (BinaryCompareInstruction*)_ParamPointer(0);
    Boolean* dest = binop->_p2;
    if (binop->_p1 == null) {
        *dest = false;
        return null;
    } else if (binop->_p0 == null) {
        *dest = true;
        return null;
    } else {
        while(ExecutionContext::IsNotCulDeSac(binop)) {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (*dest) {
                return null;
            } else {  //commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (*dest) { 
                    *dest = false; //flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
//execute a snippet of binops until one of them returns true or the commutative pair returns true 
VIREO_FUNCTION_SIGNATURE1(IsGTAccumulator, void)
{
    BinaryCompareInstruction* binop = (BinaryCompareInstruction*)_ParamPointer(0);
    Boolean* dest = binop->_p2;
    if (binop->_p0 == null) {
        *dest = false;
        return null;
    } else if (binop->_p1 == null) {
        *dest = true;
        return null;
    } else {
        while(ExecutionContext::IsNotCulDeSac(binop)) {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (*dest) {
                return null;
            } else {  //commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (*dest) { 
                    *dest = false; //flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
//execute a snippet of binops until one of them returns false or the commutative pair returns true 
VIREO_FUNCTION_SIGNATURE1(IsLEAccumulator, void)
{
    BinaryCompareInstruction* binop = (BinaryCompareInstruction*)_ParamPointer(0);
    Boolean* dest = binop->_p2;
    if (binop->_p0 == null) {
        *dest = true;
        return null;
    } else if (binop->_p1 == null) {
        *dest = false;
        return null;
    } else {
        while(ExecutionContext::IsNotCulDeSac(binop))
        {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (!*dest) {
                return null;
            } else { //commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (!*dest) {
                    *dest = true; //flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
//execute a snippet of binops until one of them returns false or the commutative pair returns true
VIREO_FUNCTION_SIGNATURE1(IsGEAccumulator, void)
{
    BinaryCompareInstruction* binop = (BinaryCompareInstruction*)_ParamPointer(0);
    Boolean* dest = binop->_p2;
    if (binop->_p1 == null) {
        *dest = true;
        return null;
    } else if (binop->_p0 == null) {
        *dest = false;
        return null;
    } else {
        while(ExecutionContext::IsNotCulDeSac(binop))
        {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (!*dest) {
                return null;
            } else { //commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (!*dest) {
                    *dest = true; //flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorVectorBinaryOp, AggregateBinOpInstruction)
{
    TypedArrayCoreRef srcArray1 = _Param(VX);
    TypedArrayCoreRef srcArray2 = _Param(VY);
    TypedArrayCoreRef destArray = _Param(VDest);
    Instruction3<AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());
    
    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSize2 = srcArray2->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex lengthA1 = srcArray1->Length();
    IntIndex lengthA2 = srcArray2->Length();
    IntIndex count = (lengthA1 < lengthA2) ? lengthA1 : lengthA2;
    
    // Resize output to minimum of input arrays
    destArray->Resize1D(count);
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *begin2 = srcArray2->RawBegin();
    AQBlock1 *beginDest = destArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);
    
    snippet->_p0 = begin1;
    snippet->_p1 = begin2;
    snippet->_p2 = beginDest;
    while (snippet->_p2 < endDest)
    {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSize1;
        snippet->_p1 += elementSize2;
        snippet->_p2 += elementSizeDest;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorVectorBinaryAccumulatorOp, AggregateBinOpInstruction)
{
    TypedArrayCoreRef srcArray1 = _Param(VX);
    TypedArrayCoreRef srcArray2 = _Param(VY);
    Boolean *dest = _ParamPointer(BooleanDest);
    Instruction3<AQBlock1, AQBlock1, Boolean>* snippet = (Instruction3<AQBlock1, AQBlock1, Boolean>*)_ParamMethod(Snippet());
    Instruction1<void>* accumulator = (Instruction1<void>*)_ParamMethod(Accumulator());
    
    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSize2 = srcArray2->ElementType()->TopAQSize();
    IntIndex lengthA1 = srcArray1->Length();
    IntIndex lengthA2 = srcArray2->Length();
    IntIndex minLength = (lengthA1 < lengthA2) ? lengthA1 : lengthA2;
    
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *begin2 = srcArray2->RawBegin();
    
    snippet->_p0 = begin1;
    snippet->_p1 = begin2;
    snippet->_p2 = dest;
    
    // If both vectors are empty, pass null for the argument pointers and compare.
    if ((lengthA1 == 0) && (lengthA2 == 0)) {
        snippet->_p0 = null;
        snippet->_p1 = null;
        _PROGMEM_PTR(accumulator, _function)(accumulator);
    } else {
        // Iterate over minLength elements of the vectors using the accumulator to compare and possibly short-circuit.
        while (minLength-- > 0)
        {
            if (_PROGMEM_PTR(accumulator, _function)(accumulator) == null) {
                return _NextInstruction();
            }
            snippet->_p0 += elementSize1;
            snippet->_p1 += elementSize2;
        }
        
        // If the vectors have different lengths, pass null as the argument pointer for the array that ran out of elements.
        if (lengthA1 != lengthA2)
        {
            if (lengthA1 < lengthA2) {
                snippet->_p0 = null;
            } else {
                snippet->_p1 = null;
            }
            _PROGMEM_PTR(accumulator, _function)(accumulator);
        }
    }
    
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorVectorSplitOp, AggregateBinOpInstruction)
{
    TypedArrayCoreRef srcArray = _Param(VX);
    TypedArrayCoreRef destArray1 = _Param(VY);
    TypedArrayCoreRef destArray2 = _Param(VDest);
    Instruction3<AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());
    
    IntIndex elementSizeSrc = srcArray->ElementType()->TopAQSize();
    IntIndex elementSizeDest1 = destArray1->ElementType()->TopAQSize();
    IntIndex elementSizeDest2 = destArray2->ElementType()->TopAQSize();
    IntIndex count = srcArray->Length();
    
    // Resize output arrays to minimum of input arrays
    destArray1->Resize1D(count);
    destArray2->Resize1D(count);
    AQBlock1 *beginSrc = srcArray->RawBegin();
    AQBlock1 *beginDest1 = destArray1->RawBegin();
    AQBlock1 *beginDest2 = destArray2->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *endDest = beginDest2 + (count * elementSizeDest2);
    
    snippet->_p0 = beginSrc;
    snippet->_p1 = beginDest1;
    snippet->_p2 = beginDest2;
    while (snippet->_p2 < endDest)
    {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSizeSrc;
        snippet->_p1 += elementSizeDest1;
        snippet->_p2 += elementSizeDest2;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(ScalarVectorBinaryOp, AggregateBinOpInstruction)
{
    Instruction3<void, AQBlock1, AQBlock1>* snippet = (Instruction3<void, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());
    
    TypedArrayCoreRef srcArray1 = _Param(VY);
    TypedArrayCoreRef destArray = _Param(VDest);
    
    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex count = srcArray1->Length();
    
    // Resize output to size of input array
    destArray->Resize1D(count);
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *beginDest = destArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);
    
    snippet->_p0 = _ParamPointer(SX);
    snippet->_p1 = begin1;
    snippet->_p2 = beginDest;
    while (snippet->_p2 < endDest)
    {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p1 += elementSize1;
        snippet->_p2 += elementSizeDest;
    }
    
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorScalarBinaryOp, AggregateBinOpInstruction)
{
    Instruction3<AQBlock1, void, AQBlock1>* snippet = (Instruction3<AQBlock1, void, AQBlock1>*)_ParamMethod(Snippet());
    TypedArrayCoreRef srcArray1 = _Param(VX);
    TypedArrayCoreRef destArray = _Param(VDest);
    
    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex count = srcArray1->Length();
    
    // Resize output to size of input array
    destArray->Resize1D(count);
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *beginDest = destArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);
    
    snippet->_p0 = begin1;
    snippet->_p1 = _ParamPointer(SY);
    snippet->_p2 = beginDest;
    while (snippet->_p2 < endDest)
    {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSize1;
        snippet->_p2 += elementSizeDest;
    }
    
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorUnaryOp, AggregateUnOpInstruction)
{
    TypedArrayCoreRef srcArray1 = _Param(VSource);
    TypedArrayCoreRef destArray = _Param(VDest);
    Instruction2<AQBlock1, AQBlock1>* snippet = ( Instruction2<AQBlock1, AQBlock1>*)_ParamMethod(Snippet());
    
    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex count = srcArray1->Length();
    
    // Resize output to size of input arrays
    destArray->Resize1D(count);
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *beginDest = destArray->RawBegin();  // might be in-place to one of the input arrays.
    
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);
    
    snippet->_p0 = begin1;
    snippet->_p1 = beginDest;
    while (snippet->_p1 < endDest)
    {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSize1;
        snippet->_p1 += elementSizeDest;
    }
    
    return _NextInstruction();
}
//------------------------------------------------------------      
DEFINE_VIREO_BEGIN(Generics)
    DEFINE_VIREO_FUNCTION(Init, "p(i(StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(Clear, "p(i(StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(ZeroOutTop, "p(i(StaticTypeAndData))")

    DEFINE_VIREO_TYPE(GenericBinOp, "p(i(*) i(*) o(*))")
    DEFINE_VIREO_TYPE(GenericUnOp, "p(i(*) o(*))")

    // Copy and CopyTop share the same generic emitter, it checks the name of the instruction
    // to determine the correct behaviour.
    DEFINE_VIREO_GENERIC(Copy, "GenericUnOp", EmitGenericCopyInstruction);
    DEFINE_VIREO_GENERIC(CopyTop, "GenericUnOp", EmitGenericCopyInstruction);
    
    // Internal copy operation for flat blocks of of data.
    DEFINE_VIREO_FUNCTION(Copy1, "p(i(Int8) o(Int8))");
    DEFINE_VIREO_FUNCTION(Copy2, "p(i(Int16)  o(Int16))");
    DEFINE_VIREO_FUNCTION(Copy4, "p(i(Int32)  o(Int32))");
    DEFINE_VIREO_FUNCTION(Copy8, "p(i(Int64)  o(Int64))");
    DEFINE_VIREO_FUNCTION(Copy16, "p(i(Block128) o(Block128))");
    DEFINE_VIREO_FUNCTION(Copy32, "p(i(Block256) o(Block256))");
    DEFINE_VIREO_FUNCTION(CopyN, "p(i(DataPointer) o(DataPointer) i(Int32))");
    
    // Deep copy where needed for objects/arrays/strings.
    DEFINE_VIREO_FUNCTION(CopyObject, "p(i(Object) o(Object))")

    // Deep copy for clusters
    DEFINE_VIREO_FUNCTION(CopyStaticTypedBlock, "p(i(DataPointer) o(DataPointer) i(StaticType))")

    // Generic math operations
    DEFINE_VIREO_GENERIC(Not, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(And, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Or, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Xor, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Nand, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Nor, "GenericBinOp", EmitGenericBinOpInstruction);

    DEFINE_VIREO_GENERIC(IsEQ, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsNE, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsLT, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsGT, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsLE, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsGE, "GenericBinOp", EmitGenericBinOpInstruction);
    
    DEFINE_VIREO_GENERIC(Add, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Sub, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Mul, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Div, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Mod, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Quotient, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Remainder, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Split, "p(i(*) o(*) o(*))", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Join, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Sine, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Cosine, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Tangent, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Secant, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Cosecant, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Log10, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Log, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Log2, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Exp, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(SquareRoot, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Pow, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(ArcSine, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(ArcCosine, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(ArcTan, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(ArcTan2, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Ceil, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Absolute, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Norm, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Phase, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Conjugate, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Floor, "GenericUnOp", EmitGenericUnOpInstruction);
	DEFINE_VIREO_GENERIC(RoundToNearest, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Convert, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Sign, "GenericUnOp", EmitGenericUnOpInstruction);

    DEFINE_VIREO_GENERIC(MaxAndMin, "p(i(*) i(*) o(StaticTypeAndData) o(StaticTypeAndData) s(Instruction))", EmitMaxMinValueInstruction);
    DEFINE_VIREO_FUNCTION(MaxMinValueInternal, "p(i(*) i(*) o(StaticTypeAndData) o(StaticTypeAndData) s(Instruction))");

    DEFINE_VIREO_GENERIC(Search1DArray, "p(i(*) i(*) i(Int32) o(Int32) s(Instruction))", EmitSearchInstruction);
    DEFINE_VIREO_FUNCTION(Search1DArrayInternal, "p(i(Array) i(*) i(Int32) o(Int32) s(Instruction))")
    DEFINE_VIREO_GENERIC(ArrayConcatenate, "p(i(VarArgCount) o(Array output) i(*))", EmitArrayConcatenateInstruction);
    DEFINE_VIREO_FUNCTION(ArrayConcatenateInternal, "p(i(VarArgCount) o(Array output) i(*))" )
    DEFINE_VIREO_GENERIC(AddElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_GENERIC(MultiplyElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_GENERIC(AndElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_GENERIC(OrElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_FUNCTION(VectorOpInternal, "p(i(Array) o(* output) i(Boolean))" )

    DEFINE_VIREO_FUNCTION(ClusterBinaryOp, "p(i(*) i(*) o(*) s(Instruction) s(Instruction))")
    DEFINE_VIREO_FUNCTION(ClusterUnaryOp, "p(i(*) o(*) s(Instruction))")
    DEFINE_VIREO_FUNCTION(IsEQAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsNEAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsLTAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsGTAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsLEAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsGEAccumulator, "p(i(GenericBinOp))");
    
    // Vector operations
    DEFINE_VIREO_FUNCTION(VectorVectorBinaryOp, "p(i(Array) i(Array) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorVectorBinaryAccumulatorOp, "p(i(Array) i(Array) o(Array) s(Instruction) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorVectorSplitOp, "p(i(Array) o(Array) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(ScalarVectorBinaryOp, "p(i(*) i(Array) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorScalarBinaryOp, "p(i(Array) i(*) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorUnaryOp, "p(i(Array) o(Array) s(Instruction))" )

DEFINE_VIREO_END()
} // namespace Vireo
