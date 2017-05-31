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
#include "Array.h"

namespace Vireo
{

//------------------------------------------------------------
ConstCStr CopyProcName(void *pSource, void *pDest, Int32 aqSize, Boolean isEnum)
{
    // If the source or dest are not aligned to aqSize bytes, return null.
    if (((uintptr_t) pSource % aqSize != 0) || ((uintptr_t) pDest % aqSize != 0))
        return null;
    if (isEnum) {
        switch (aqSize) {  // these are bytes not bits.  Enums are max UInt64 sized.
            case 1:     return "CopyEnum1";   break;
            case 2:     return "CopyEnum2";   break;
            case 4:     return "CopyEnum4";   break;
            case 8:     return "CopyEnum8";   break;
            default:    return null;      break;
        }
    }
    switch (aqSize) {  // copy sizes go to 32 bytes just for efficiency
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
    // TODO(PaulAustin): security. user code should only be allowed to use the "Copy" operation,
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
        if (sourceType->IsFlat() || originalCopyOp.CompareCStr("CopyTop")) {
            copyOpName = CopyProcName(pSource, pDest, sourceType->TopAQSize(), destType->IsEnum());
            if (!copyOpName) {
                copyOpName = "CopyN";
                // For CopyN a count is passed as well
                extraParam = (void*) (size_t)sourceType->TopAQSize();
            } else if (destType->IsEnum()) {
                extraParam = (void*) (uintptr_t)destType->GetEnumItemCount();
            }
        } else if (sourceType->IsArray()) {
            VIREO_ASSERT(!destType->IsInputParam());
            if (destType->IsAlias() && !destType->IsOutputParam()) {
                // If its a local alias then just copy the pointer.
                // Outputs are alias to the callers params, so that still needs a deep copy
                copyOpName = "CopyTop";
            } else {
                // Objects require a deep copy (e.g. arrays will copy over all values)
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
};

struct Block256 {
    Block128 block1;
    Block128 block2;
};

DECLARE_VIREO_PRIMITIVE2(Copy1, Int8,  Int8,  (_Param(1) = _Param(0)))
DECLARE_VIREO_PRIMITIVE2(Copy2, Int16, Int16, (_Param(1) = _Param(0)))
DECLARE_VIREO_PRIMITIVE2(Copy4, Int32, Int32, (_Param(1) = _Param(0)))
DECLARE_VIREO_PRIMITIVE2(Copy8, Int64, Int64, (_Param(1) = _Param(0)))
DECLARE_VIREO_PRIMITIVE2(Copy16, Block128, Block128, (_Param(1) = _Param(0)))
DECLARE_VIREO_PRIMITIVE2(Copy32, Block256, Block256, (_Param(1) = _Param(0)))

DECLARE_VIREO_PRIMITIVE3(CopyEnum1, UInt8, UInt8, void, (_Param(1) = _Param(0) < uintptr_t(_ParamPointer(2)) ? _Param(0) : uintptr_t(_ParamPointer(2))-1))
DECLARE_VIREO_PRIMITIVE3(CopyEnum2, UInt16, UInt16, void, (_Param(1) = _Param(0) < uintptr_t(_ParamPointer(2)) ? _Param(0) : uintptr_t(_ParamPointer(2))-1))
DECLARE_VIREO_PRIMITIVE3(CopyEnum4, UInt32, UInt32, void, (_Param(1) = _Param(0) < UInt32(uintptr_t(_ParamPointer(2))) ?
    _Param(0) : UInt32(uintptr_t(_ParamPointer(2)))-1))
DECLARE_VIREO_PRIMITIVE3(CopyEnum8, UInt64, UInt64, void, (_Param(1) = _Param(0) < uintptr_t(_ParamPointer(2)) ?
    _Param(0) : uintptr_t(_ParamPointer(2))-1))

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(CopyN, void, void, void)
{
    size_t countAq = (size_t) _ParamPointer(2);
    memmove(_ParamPointer(1), _ParamPointer(0), countAq);
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
    union {
        _ParamDef(TypedArrayCoreRef, VDest2);
        _ParamDef(AQBlock1*, SDest2);
        _ParamImmediateDef(InstructionCore*, Accumulator);
    };
    _ParamImmediateDef(InstructionCore*, Snippet);
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
    Int32 argCount = pInstructionBuilder->_argCount;
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();

    // Check for accumulator style binops where the dest type is simpler (eg. compareAggregates, others?)
    if (argCount == 3 && sourceXType->BitEncoding() == kEncoding_Array &&
        sourceYType->BitEncoding() == kEncoding_Array && destType->BitEncoding() != kEncoding_Array) {
        goalType = sourceXType;
        isAccumulator = true;
    } else if (argCount == 3 && sourceXType->BitEncoding() == kEncoding_Cluster
               && sourceYType->BitEncoding() == kEncoding_Cluster
               && destType->BitEncoding() != kEncoding_Cluster) {
        goalType = sourceXType;
        isAccumulator = true;
    } else if (destType->BitEncoding() == kEncoding_Boolean) {  // some kind of comparison
        goalType = sourceXType;
    }
    if (savedOperation.CompareCStr("Split") || savedOperation.CompareCStr("Join")) {
        // Split and Join are uniquely identified by source type rather than dest type
        goalType = sourceXType;
    }
    // two-output binops all must have identical output types
    if (argCount > 4 || (argCount == 4 &&
        (pInstructionBuilder->_argTypes[3]->BitEncoding() != destType->BitEncoding() ||
         pInstructionBuilder->_argTypes[3]->BitLength() != destType->BitLength())))
        return null;

    switch (goalType->BitEncoding()) {
        default:
        {
            EncodingEnum destEncoding = destType->BitEncoding();
            EncodingEnum sourceXEncoding = sourceXType->BitEncoding();
            EncodingEnum sourceYEncoding = sourceYType->BitEncoding();
            ConstCStr pConvertOpName = "Convert";
            SubString convertOpToken(pConvertOpName);
            bool useSnippet = false;
            pInstruction = null;
            if (destEncoding == kEncoding_S2CInt || destEncoding == kEncoding_IEEE754Binary) {
                // If the output type is numeric scalar, and exactly one of the inputs is not the same type as the output, automatically convert
                // using the destination as a temporary.  (If the destination is inplace to the other input, use an op with a snippet instead
                // so the op can use a stack local as a temporary argument for the snippet.)
                void *destArg = pInstructionBuilder->_argPointers[2];
                if ((sourceXEncoding != destEncoding || sourceXType->BitLength() != destType->BitLength())  // sourceX needs conversion
                    && sourceYEncoding == destEncoding && sourceYType->BitLength() == destType->BitLength()) {
                    if (pInstructionBuilder->_argumentState >= ClumpParseState::kArgumentResolved_FirstGood
                        && pInstructionBuilder->_argPointers[1] == pInstructionBuilder->_argPointers[2]) {
                        useSnippet = true;
                    } else {
                        void *savedArg = pInstructionBuilder->_argPointers[1];
                        if (pInstructionBuilder->_argumentState == ClumpParseState::kArgumentNotResolved) {
                            // invoked via recursion from Generic array/cluster binop
                            pInstruction = pInstructionBuilder->EmitInstruction(&convertOpToken, 2,
                             sourceXType, pInstructionBuilder->_argPointers[0],
                             destType, (void*)-1);  // tell vector/cluster op invoking us to convert the 1st arg
                        } else {
                            pInstruction = pInstructionBuilder->EmitInstruction(&convertOpToken, 2,
                             sourceXType, pInstructionBuilder->_argPointers[0], destType, destArg);
                        }
                        pInstructionBuilder->EmitInstruction(&savedOperation, 3, destType, destArg, sourceYType, savedArg, destType, destArg);
                    }
                } else if ((sourceYEncoding != destEncoding || sourceYType->BitLength() != destType->BitLength())  // sourceY needs conversion
                           && sourceXEncoding == destEncoding && sourceXType->BitLength() == destType->BitLength()) {
                    if (pInstructionBuilder->_argumentState >= ClumpParseState::kArgumentResolved_FirstGood
                        && pInstructionBuilder->_argPointers[0] == pInstructionBuilder->_argPointers[2]) {
                        useSnippet = true;
                    } else {
                        void *savedArg = pInstructionBuilder->_argPointers[0];
                        if (pInstructionBuilder->_argumentState == ClumpParseState::kArgumentNotResolved) {
                            // invoked via recursion from Generic array/cluster binop
                            pInstruction = pInstructionBuilder->EmitInstruction(&convertOpToken, 2,
                              sourceYType, pInstructionBuilder->_argPointers[1], destType, (void*)-2);
                            // tell vector/cluster op invoking us to convert the 2nd arg
                        } else {
                            pInstruction = pInstructionBuilder->EmitInstruction(&convertOpToken, 2,
                              sourceYType, pInstructionBuilder->_argPointers[1], destType, destArg);
                        }
                        pInstructionBuilder->EmitInstruction(&savedOperation, 3, sourceXType, savedArg,
                                                            destType, destArg, destType, destArg);
                    }
                }
            }
            if (!useSnippet)
                break;  // else fall through, will use ScalarScalarConvertBinaryOp
        }
        case kEncoding_Array:
        {
            // Find out what this name of the original opcode was.
            // this will be the name of the _instructionPointerType.
            savedOperation = pInstructionBuilder->_instructionPointerType->Name();
            ConstCStr pVectorBinOpName = null;
            // TODO(PaulAustin): Validating runtime will require  type checking
            if (sourceXType->IsArray() && sourceYType->IsArray()) {
                if (savedOperation.CompareCStr("Split"))
                    pVectorBinOpName = "VectorVectorSplitOp";
                else
                    pVectorBinOpName = isAccumulator ? "VectorVectorBinaryAccumulatorOp" : "VectorVectorBinaryOp";
            } else if (sourceXType->IsArray()) {
                pVectorBinOpName = "VectorScalarBinaryOp";
            } else if (sourceYType->IsArray()) {
                pVectorBinOpName = "ScalarVectorBinaryOp";
            } else {
                pVectorBinOpName = "ScalarScalarConvertBinaryOp";
            }
            SubString vectorBinOpToken(pVectorBinOpName);
            pInstructionBuilder->ReresolveInstruction(&vectorBinOpToken, false);  // build a vector op
            // This would be easier if the vector bin op was at the end...

            // If a 4th argument is passed, it overlaps the accumulator slot
            Int32 accumulatorOpArgId = argCount < 4 ? pInstructionBuilder->AddSubSnippet() : 0;
            Int32 binOpArgId = pInstructionBuilder->AddSubSnippet();

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
            if (!snippetBuilder.EmitInstruction(&savedOperation, argCount, xEltType, (void*)null, yEltType,
                (void*)null, destEltType, (void*)null, destEltType, (void*)null))
                pInstruction = null;
            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);

            // Create the accumulator snippet
            if (isAccumulator) {
                TempStackCString opToken(&savedOperation);
                SubString accToken("Accumulator");
                opToken.Append(&accToken);
                SubString accumulatorToken(opToken.BeginCStr());

                pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, vectorBinOp, accumulatorOpArgId);
                snippetBuilder.StartInstruction(&accumulatorToken);
                snippetBuilder.InternalAddArg(null, vectorBinOp == kFakedInstruction ?
                                        null : vectorBinOp->_piSnippet);  // TODO(PaulAustin): this seems redundant
                snippetBuilder.EmitInstruction();
                pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            }

            pInstructionBuilder->RecordNextHere(&vectorBinOp->_piNext);
            break;
        }
        case kEncoding_Cluster:
        {
            savedOperation = pInstructionBuilder->_instructionPointerType->Name();
            ConstCStr pClusterBinOpName = isAccumulator ?  "ClusterAggBinaryOp" : "ClusterBinaryOp";
            SubString clusterBinOpToken(pClusterBinOpName);

            pInstructionBuilder->ReresolveInstruction(&clusterBinOpToken, false);

            // If a 4th argument is passed, it overlaps the accumulator slot
            Int32 accumulatorOpArgId = argCount < 4 || isAccumulator ? pInstructionBuilder->AddSubSnippet() : 0;
            Int32 binOpArgId = pInstructionBuilder->AddSubSnippet();  // Add param slots to hold the snippets

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

                if (!snippetBuilder.EmitInstruction(&savedOperation, argCount, arg1Type, arg1Data,
                        arg2Type, arg2Data, arg3Type, arg3Data, arg3Type, arg3Data))
                    // 2-output prims must have identical output types
                    pInstruction = null;
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
struct AggregateUnOp2OutputInstruction : public InstructionCore
{
    union {
        _ParamDef(TypedArrayCoreRef, VSource);
        _ParamDef(AQBlock1*, SSource);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VDest);
        _ParamDef(AQBlock1*, SDest);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VDest2);
        _ParamDef(AQBlock1*, SDest2);
    };
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()      { return this->_piNext; }
};
//------------------------------------------------------------
InstructionCore* EmitGenericUnOpInstruction(ClumpParseState* pInstructionBuilder)
{
    InstructionCore* pInstruction = null;
    TypeRef sourceXType = pInstructionBuilder->_argTypes[0];
    TypeRef destType = pInstructionBuilder->_argTypes[1];
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();
    Int32 argCount = pInstructionBuilder->_argCount;
    Boolean isTwoOutput = false;
    if ((savedOperation.CompareCStr("ComplexToPolar") || savedOperation.CompareCStr("ComplexToReOrIm"))) {
        isTwoOutput = true;
        if (argCount != 3 || (pInstructionBuilder->_argTypes[2]->BitEncoding() != destType->BitEncoding() ||
                                                    pInstructionBuilder->_argTypes[2]->BitLength() != destType->BitLength()))
            return null;
    }
    if (savedOperation.CompareCStr("Convert")) {
        // Special case for convert, if the types are the same go straight to the more efficient copy
        SubString destTypeName = destType->Name();
        if (destTypeName.Length() > 0 && sourceXType->CompareType(destType)) {
            ConstCStr copyOpName = "Copy";
            SubString copyOpToken(copyOpName);
            pInstructionBuilder->ReresolveInstruction(&copyOpToken, false);
            return pInstructionBuilder->EmitInstruction();
        }
    }

    switch (destType->BitEncoding()) {
        case kEncoding_Array:
        {
            ConstCStr pVectorUnOpName = isTwoOutput ? "VectorUnary2OutputOp" : "VectorUnaryOp";
            SubString vectorUnOpToken(pVectorUnOpName);
            pInstructionBuilder->ReresolveInstruction(&vectorUnOpToken, false);  // build a vector op
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
            InstructionCore* unaryOp = pInstructionBuilder->EmitInstruction();  // emit the vector op
            pInstruction = unaryOp;

            // Recurse on the element
            ClumpParseState snippetBuilder(pInstructionBuilder);
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, unaryOp, snippetArgId);

            if (!snippetBuilder.EmitInstruction(&savedOperation, argCount, sourceXType->GetSubElement(0),
                (void*)null, destType->GetSubElement(0), (void*)null, destType->GetSubElement(0), (void*)null))
               pInstruction = null;

            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            if (isTwoOutput)
                pInstructionBuilder->RecordNextHere(&((AggregateUnOp2OutputInstruction*)unaryOp)->_piNext);  // NOLINT(runtime/casting)
            else
                pInstructionBuilder->RecordNextHere(&((AggregateUnOpInstruction*)unaryOp)->_piNext);  // NOLINT(runtime/casting)
            break;
        }
        case kEncoding_Cluster:
        {
            ConstCStr pClusterUnOpName = isTwoOutput ? "ClusterUnary2OutputOp" : "ClusterUnaryOp";
            SubString clusterUnOpToken(pClusterUnOpName);

            pInstructionBuilder->ReresolveInstruction(&clusterUnOpToken, false);
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
            AggregateUnOpInstruction* unaryOp = (AggregateUnOpInstruction*)pInstructionBuilder->EmitInstruction();
            pInstruction = unaryOp;

            // Recurse on the sub elements
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
                if (!snippetBuilder.EmitInstruction(&savedOperation, argCount, sourceSub, sourceData,
                    destSub, (void*)(size_t)destSub->ElementOffset(), destSub, (void*)(size_t)destSub->ElementOffset()))
                    pInstruction = null;
            }

            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            if (isTwoOutput)
                pInstructionBuilder->RecordNextHere(&((AggregateUnOp2OutputInstruction*)unaryOp)->_piNext);   // NOLINT(runtime/casting)
            else
                pInstructionBuilder->RecordNextHere(&((AggregateUnOpInstruction*)unaryOp)->_piNext);   // NOLINT(runtime/casting)
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

//------------------------------------------------------------
struct AggregateMaxAndMinInstruction : public InstructionCore
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
        _ParamDef(TypedArrayCoreRef, VMax);
        _ParamDef(AQBlock1*, SMax);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VMin);
        _ParamDef(AQBlock1*, SMin);
    };
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()      { return this->_piNext; }
};

//------------------------------------------------------------
InstructionCore* EmitMaxMinEltsInstruction(ClumpParseState* pInstructionBuilder)
{
    InstructionCore* pInstruction = null;
    TypeRef sourceXType = pInstructionBuilder->_argTypes[0];
    TypeRef sourceYType = pInstructionBuilder->_argTypes[1];
    TypeRef maxType = pInstructionBuilder->_argTypes[2];
    TypeRef minType = pInstructionBuilder->_argTypes[3];
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();
    if (!sourceXType->CompareType(sourceYType) || !sourceXType->CompareType(maxType) || !maxType->CompareType(minType)) {
        return null;
    }

    switch (maxType->BitEncoding()) {
        case kEncoding_Array:
        {
            ConstCStr pVectorUnOpName = "VectorMaxMinOp";
            SubString vectorUnOpToken(pVectorUnOpName);
            pInstructionBuilder->ReresolveInstruction(&vectorUnOpToken, false);  // build a vector op
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
            AggregateMaxAndMinInstruction* maxMinOp = (AggregateMaxAndMinInstruction*) pInstructionBuilder->EmitInstruction();  // emit the vector op
            pInstruction = maxMinOp;

            // Recurse on the element
            ClumpParseState snippetBuilder(pInstructionBuilder);
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, maxMinOp, snippetArgId);

            snippetBuilder.EmitInstruction(&savedOperation, 4, sourceXType->GetSubElement(0), (void*)null,
                sourceYType->GetSubElement(0), (void*)null, maxType->GetSubElement(0), (void*)null,
                minType->GetSubElement(0), (void*)null);

            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            pInstructionBuilder->RecordNextHere(&maxMinOp->_piNext);
            break;
        }
        case kEncoding_Cluster:
        {
            ConstCStr pClusterUnOpName = "ClusterMaxMinOp";
            SubString clusterUnOpToken(pClusterUnOpName);

            pInstructionBuilder->ReresolveInstruction(&clusterUnOpToken, false);
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
            AggregateMaxAndMinInstruction* maxMinOp = (AggregateMaxAndMinInstruction*)pInstructionBuilder->EmitInstruction();
            pInstruction = maxMinOp;

            // Recurse on the sub elements
            ClumpParseState snippetBuilder(pInstructionBuilder);
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, maxMinOp, snippetArgId);
            for (Int32 i = 0; i < maxType->SubElementCount(); i++) {
                TypeRef maxSub = maxType->GetSubElement(i), minSub = minType->GetSubElement(i);
                TypeRef sourceXSub = sourceXType, sourceYSub = sourceYType;
                void *sourceXData = null, *sourceYData = null;
                if (sourceXType->BitEncoding() == kEncoding_Cluster) {
                    sourceXSub = sourceXType->GetSubElement(i);
                    sourceXData =  (void*)(size_t)sourceXSub->ElementOffset();
                }
                if (sourceYType->BitEncoding() == kEncoding_Cluster) {
                    sourceYSub = sourceYType->GetSubElement(i);
                    sourceYData =  (void*)(size_t)sourceYSub->ElementOffset();
                }
                snippetBuilder.EmitInstruction(&savedOperation, 4, sourceXSub, sourceXData, sourceYSub, sourceYData,
                                               maxSub, (void*)(size_t)maxSub->ElementOffset(), minSub, (void*)(size_t)minSub->ElementOffset());
            }

            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            pInstructionBuilder->RecordNextHere(&maxMinOp->_piNext);
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

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorMaxMinOp, AggregateMaxAndMinInstruction)
{
    TypedArrayCoreRef srcArrayX = _Param(VX);
    TypedArrayCoreRef srcArrayY = _Param(VY);
    TypedArrayCoreRef maxArray = _Param(VMax);
    TypedArrayCoreRef minArray = _Param(VMin);
    Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction4<AQBlock1,
        AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    IntIndex elementSizeX = srcArrayX->ElementType()->TopAQSize();
    IntIndex elementSizeY = srcArrayY->ElementType()->TopAQSize();
    IntIndex elementSizeMax = maxArray->ElementType()->TopAQSize();
    IntIndex elementSizeMin = minArray->ElementType()->TopAQSize();
    IntIndex count = srcArrayX->Length();
    if (srcArrayY->Length() < count)
        count = srcArrayY->Length();

    // Resize output to size of input arrays
    maxArray->Resize1D(count);
    minArray->Resize1D(count);
    AQBlock1 *beginX = srcArrayX->RawBegin();
    AQBlock1 *beginY = srcArrayY->RawBegin();
    AQBlock1 *beginMax = maxArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *beginMin = minArray->RawBegin();  // might be in-place to one of the input arrays.

    AQBlock1 *endMax = beginMax + (count * elementSizeMax);

    snippet->_p0 = beginX;
    snippet->_p1 = beginY;
    snippet->_p2 = beginMax;
    snippet->_p3 = beginMin;
    while (snippet->_p2 < endMax) {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSizeX;
        snippet->_p1 += elementSizeY;
        snippet->_p2 += elementSizeMax;
        snippet->_p3 += elementSizeMin;
    }

    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(ClusterMaxMinOp, AggregateMaxAndMinInstruction)
{
    Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>* pInstruction = (Instruction4<AQBlock1, AQBlock1,
        AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    while (ExecutionContext::IsNotCulDeSac(pInstruction)) {
        pInstruction->_p0 += (size_t)_ParamPointer(SX);
        pInstruction->_p1 += (size_t)_ParamPointer(SY);
        pInstruction->_p2 += (size_t)_ParamPointer(SMax);
        pInstruction->_p3 += (size_t)_ParamPointer(SMin);
        InstructionCore* next = _PROGMEM_PTR(pInstruction, _function)(pInstruction);  // execute inline for now. TODO(PaulAustin): yield to the scheduler
        pInstruction->_p0 -= (size_t)_ParamPointer(SX);
        pInstruction->_p1 -= (size_t)_ParamPointer(SY);
        pInstruction->_p2 -= (size_t)_ParamPointer(SMax);
        pInstruction->_p3 -= (size_t)_ParamPointer(SMin);
        pInstruction = (Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>*)next;
    }
    return _NextInstruction();
}

//------------------------------------------------------------
struct InRangeAndCoerceInstruction : public InstructionCore
{
    enum IRCFlags { kXIsScalar = 1, kLoIsScalar = 2, kHiIsScalar = 4 };
    union {
        _ParamDef(TypedArrayCoreRef, VX);
        _ParamDef(AQBlock1, SX);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VLo);
        _ParamDef(AQBlock1, SLo);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VHi);
        _ParamDef(AQBlock1, SHi);
    };
    _ParamDef(Boolean, includeLo);
    _ParamDef(Boolean, includeHi);
    union {
        _ParamDef(TypedArrayCoreRef, VCoerced);
        _ParamDef(AQBlock1*, SCoerced);
    };
    union {
        _ParamDef(TypedArrayCoreRef, VDest);
        _ParamDef(AQBlock1*, SDest);
    };
    _ParamImmediateDef(enum IRCFlags, flags);
    _ParamImmediateDef(InstructionCore*, Snippet);
    inline InstructionCore* Snippet()       { return this->_piSnippet; }
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Next()          { return this->_piNext; }
};

struct InRangeAndCoerceInstructionAggregate : public InstructionCore
{
    _ParamDef(AQBlock1, SX);
    _ParamDef(AQBlock1, SLo);
    _ParamDef(AQBlock1, SHi);
    _ParamDef(Boolean, includeLo);
    _ParamDef(Boolean, includeHi);
    _ParamDef(AQBlock1*, SCoerced);
    _ParamDef(Boolean, BooleanDest);
    _ParamImmediateDef(TypeRef, paramType);
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()      { return this->_piNext; }
};

//------------------------------------------------------------
InstructionCore* EmitGenericInRangeAndCoerceInstruction(ClumpParseState* pInstructionBuilder)
{
    InstructionCore* pInstruction = null;
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();
    TypeRef sourceXType = pInstructionBuilder->_argTypes[0];
    TypeRef sourceLoType = pInstructionBuilder->_argTypes[1];
    TypeRef sourceHiType = pInstructionBuilder->_argTypes[2];
    TypeRef booleanType = pInstructionBuilder->_argTypes[3];
    TypeRef coercedType = pInstructionBuilder->_argTypes[5];
    TypeRef destType = pInstructionBuilder->_argTypes[6];
    TypeRef goalType = coercedType;
    Boolean isAccumulator = false;
    TypeRef Int32Type = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsInt32Type);

    if (destType->BitEncoding() == kEncoding_Boolean) {
        goalType = sourceXType;
        isAccumulator = true;
    }
    if (isAccumulator) {
        ConstCStr pInRangeOpAggregateName = "InRangeAccumulator";
        SubString findInRangeOpAggregateToken(pInRangeOpAggregateName);

        pInstructionBuilder->ReresolveInstruction(&findInRangeOpAggregateToken, false);
        if (!sourceXType->CompareType(sourceLoType) || !sourceLoType->CompareType(sourceHiType)) {
            return null;
        }
        if (!coercedType->CompareType(sourceXType) || !destType->CompareType(booleanType)) {
            return null;
        }
        SubString LTName("IsLT");

        // Add param slot to hold the snippet
        pInstructionBuilder->InternalAddArg(null, coercedType);
        Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();

        InRangeAndCoerceInstructionAggregate* ircOp = (InRangeAndCoerceInstructionAggregate*)pInstructionBuilder->EmitInstruction();

        ClumpParseState snippetBuilder(pInstructionBuilder);
        pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, ircOp, snippetArgId);
        snippetBuilder.EmitInstruction(&LTName, 3, sourceXType, (void*)null, sourceXType, (void*)null, booleanType, (void*)null);

        pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
        pInstructionBuilder->RecordNextHere(&ircOp->_piNext);
        pInstruction = ircOp;
        return pInstruction;
    }
    switch (goalType->BitEncoding()) {
        case kEncoding_Array:
        {
            // Find out what this name of the original opcode was.
            // this will be the name of the _instructionPointerType.
            savedOperation = pInstructionBuilder->_instructionPointerType->Name();
            ConstCStr pVectorBinOpName = null;
            // TODO(PaulAustin): Validating runtime will require  type checking
            pVectorBinOpName = "VectorOrScalarInRangeOp";
            SubString vectorBinOpToken(pVectorBinOpName);
            pInstructionBuilder->ReresolveInstruction(&vectorBinOpToken, false);  // build a vector op

            TypeRef xEltType = sourceXType->IsArray() ? sourceXType->GetSubElement(0) : sourceXType;
            TypeRef loEltType = sourceLoType->IsArray() ? sourceLoType->GetSubElement(0) : sourceLoType;
            TypeRef hiEltType = sourceHiType->IsArray() ? sourceHiType->GetSubElement(0) : sourceHiType;
            TypeRef coercedEltType = coercedType->IsArray() ? coercedType->GetSubElement(0) : coercedType;
            TypeRef destEltType = destType->IsArray() ? destType->GetSubElement(0) : destType;
            if (!coercedEltType->CompareType(xEltType)) {
                return null;
            }
            if (!loEltType->CompareType(xEltType)) {
                return null;
            }
            if (!loEltType->CompareType(hiEltType)) {
                return null;
            }
            UInt32 flags = 0;
            if (!sourceXType->IsArray())
                flags |= InRangeAndCoerceInstruction::kXIsScalar;
            if (!sourceLoType->IsArray())
                flags |= InRangeAndCoerceInstruction::kLoIsScalar;
            if (!sourceHiType->IsArray())
                flags |= InRangeAndCoerceInstruction::kHiIsScalar;
            pInstructionBuilder->InternalAddArg(Int32Type, (void*)(size_t)flags);
            // This would be easier if the vector bin op was at the end...
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();

            // Add room for next field
            pInstructionBuilder->AddSubSnippet();

            // Emit the vector op
            InRangeAndCoerceInstruction* vectorBinOp = (InRangeAndCoerceInstruction*) pInstructionBuilder->EmitInstruction();
            pInstruction = vectorBinOp;

            // Recurse on the subtype
            ClumpParseState snippetBuilder(pInstructionBuilder);

            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, vectorBinOp, snippetArgId);

            snippetBuilder.EmitInstruction(&savedOperation, 7, xEltType, (void*)null, loEltType, (void*)null, hiEltType, (void*)null,
                                           booleanType, (void*)null, booleanType, (void*)null,
                                           coercedEltType, (void*)null, destEltType, (void*)null);
            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            pInstructionBuilder->RecordNextHere(&vectorBinOp->_piNext);
            break;
        }
        case kEncoding_Cluster:
        {
            savedOperation = pInstructionBuilder->_instructionPointerType->Name();
            ConstCStr pClusterBinOpName = "ClusterInRangeOp";
            SubString clusterBinOpToken(pClusterBinOpName);

            pInstructionBuilder->ReresolveInstruction(&clusterBinOpToken, false);

            if (sourceXType->IsCluster() && sourceLoType->IsCluster() && sourceXType->SubElementCount() != sourceLoType->SubElementCount())
                return null;
            if (sourceXType->IsCluster() && sourceHiType->IsCluster() && sourceXType->SubElementCount() != sourceHiType->SubElementCount())
                return null;
            if (sourceLoType->IsCluster() && sourceHiType->IsCluster() && sourceLoType->SubElementCount() != sourceHiType->SubElementCount())
                return null;
            if (!coercedType->IsCluster() || !destType->IsCluster() || coercedType->SubElementCount() != destType->SubElementCount()
                || (sourceXType->IsCluster() && coercedType->SubElementCount() != sourceXType->SubElementCount())
                || (sourceLoType->IsCluster() && coercedType->SubElementCount() != sourceLoType->SubElementCount())
                || (sourceHiType->IsCluster() && coercedType->SubElementCount() != sourceHiType->SubElementCount()))
                return null;

            pInstructionBuilder->InternalAddArg(Int32Type, (void*)(size_t)0);  // flags only used in array case

            Int32 binOpArgId = pInstructionBuilder->AddSubSnippet();  // Add param slots to hold the snippets

            // Add room for next field
            pInstructionBuilder->AddSubSnippet();

            InRangeAndCoerceInstruction* clusterOp = (InRangeAndCoerceInstruction*)pInstructionBuilder->EmitInstruction();
            pInstruction = clusterOp;

            ClumpParseState snippetBuilder(pInstructionBuilder);
            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, clusterOp, binOpArgId);

            for (Int32 i = 0; i < goalType->SubElementCount(); i++) {
                TypeRef arg1Type, arg2Type, arg3Type, arg6Type, arg7Type;
                void    *arg1Data, *arg2Data, *arg3Data, *arg6Data, *arg7Data;

                if (sourceXType->IsCluster()) {
                    arg1Type = sourceXType->GetSubElement(i);
                    arg1Data = (void*)(size_t)arg1Type->ElementOffset();
                } else {
                    arg1Type = sourceXType;
                    arg1Data = null;
                }
                if (sourceLoType->IsCluster()) {
                    arg2Type = sourceLoType->GetSubElement(i);
                    arg2Data = (void*)(size_t)arg2Type->ElementOffset();
                } else {
                    arg2Type = sourceLoType;
                    arg2Data = null;
                }
                if (sourceHiType->IsCluster()) {
                    arg3Type = sourceHiType->GetSubElement(i);
                    arg3Data = (void*)(size_t)arg3Type->ElementOffset();
                } else {
                    arg3Type = sourceHiType;
                    arg3Data = null;
                }
                if (coercedType->IsCluster()) {
                    arg6Type = coercedType->GetSubElement(i);
                    arg6Data = (void*)(size_t)arg6Type->ElementOffset();
                } else {
                    arg6Type = coercedType;
                    arg6Data = null;
                }
                if (destType->IsCluster()) {
                    arg7Type = destType->GetSubElement(i);
                    arg7Data = (void*)(size_t)arg7Type->ElementOffset();
                } else {
                    arg7Type = destType;
                    arg7Data = null;
                }
                if (!arg1Type->CompareType(arg2Type) || !arg2Type->CompareType((arg3Type)) || !arg1Type->CompareType(arg6Type))
                    return null;
                snippetBuilder.EmitInstruction(&savedOperation, 7, arg1Type, arg1Data, arg2Type, arg2Data, arg3Type, arg3Data,
                                               booleanType, (void*)null, booleanType, (void*)null, arg6Type, arg6Data, arg7Type, arg7Data);
            }
            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
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

VIREO_FUNCTION_SIGNATURET(InRangeAccumulator, InRangeAndCoerceInstructionAggregate)
{
    Instruction3<void, void, Boolean>* snippet = (Instruction3<void, void, Boolean>*)_ParamMethod(Snippet());
    TypeRef type = _ParamImmediate(paramType);
    Boolean isLTLo = false, isGTHi = false;


    snippet->_p0 = _ParamPointer(SX);
    snippet->_p1 = _ParamPointer(SLo);
    snippet->_p2 = &isLTLo;
    _PROGMEM_PTR(snippet, _function)(snippet);
    if (isLTLo) {
        _Param(BooleanDest) = false;
        type->CopyData(_ParamPointer(SLo), _ParamPointer(SCoerced));
        return _NextInstruction();
    } else if (!_Param(includeLo)) {
        snippet->_p0 = _ParamPointer(SLo);
        snippet->_p1 = _ParamPointer(SX);
        _PROGMEM_PTR(snippet, _function)(snippet);
        if (!isLTLo) {
            _Param(BooleanDest) = false;
            type->CopyData(_ParamPointer(SLo), _ParamPointer(SCoerced));
            return _NextInstruction();
        }
    }

    snippet->_p0 = _ParamPointer(SHi);
    snippet->_p1 = _ParamPointer(SX);
    snippet->_p2 = &isGTHi;
    _PROGMEM_PTR(snippet, _function)(snippet);
    if (isGTHi) {
        _Param(BooleanDest) = false;
        type->CopyData(_ParamPointer(SHi), _ParamPointer(SCoerced));
        return _NextInstruction();
    } else if (!_Param(includeHi)) {
        snippet->_p0 = _ParamPointer(SX);
        snippet->_p1 = _ParamPointer(SHi);
        _PROGMEM_PTR(snippet, _function)(snippet);
        if (!isGTHi) {
            _Param(BooleanDest) = false;
            type->CopyData(_ParamPointer(SHi), _ParamPointer(SCoerced));
            return _NextInstruction();
        }
    }
    _Param(BooleanDest) = true;
    type->CopyData(_ParamPointer(SX), _ParamPointer(SCoerced));
    return _NextInstruction();
}

//------------------------------------------------------------
struct AggregateStrToNumInstruction : public InstructionCore
{
    union {
        _ParamDef(TypedArrayCoreRef, VStr);
        _ParamDef(AQBlock1*, SStr);
    };
    _ParamDef(Int32, Offset);
    _ParamDef(AQBlock1*, DefaultVal);
    _ParamDef(Int32, EndOffset);
    _ParamImmediateDef(StaticTypeAndData, VOutput[1]);
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next()      { return this->_piNext; }
};
typedef Instruction6<AQBlock1, Int32, AQBlock1, Int32, AQBlock1, AQBlock1> StrToNumInstructionArgs;

VIREO_FUNCTION_SIGNATURET(VectorOrClusterStrToNumOp, AggregateStrToNumInstruction)
{
    TypeRef type = _ParamImmediate(VOutput)->_paramType;
    Boolean isCluster = type->IsCluster();
    StrToNumInstructionArgs* snippet = (StrToNumInstructionArgs*)_ParamMethod(Snippet());
    AQBlock1 *beginStr, *beginDest, *endDest;
    IntIndex elementSizeStr, elementSizeDest, count = 0;
    if (isCluster) {
        count = type->SubElementCount();
        elementSizeStr = sizeof(StringRef);
        elementSizeDest = _ParamImmediate(VOutput)->_paramType->GetSubElement(0)->TopAQSize();
        beginStr = (AQBlock1*)_ParamPointer(SStr);
        beginDest = (AQBlock1*)_ParamImmediate(VOutput)->_pData;
    } else {
        TypedArrayCoreRef VStr = _Param(VStr);
        TypedArrayCoreRef VOutput = *(TypedArrayCoreRef*)_ParamImmediate(VOutput)->_pData;
        elementSizeStr = VStr->ElementType()->TopAQSize();
        elementSizeDest = _ParamImmediate(VOutput)->_paramType->GetSubElement(0)->TopAQSize();
        count = VStr->Length();
        VOutput->Resize1D(count);
        beginStr = VStr->RawBegin();
        beginDest = VOutput->RawBegin();
    }
    endDest = beginDest + (count * elementSizeDest);
    snippet->_p0 = beginStr;
    snippet->_p1 = _ParamPointer(Offset);
    snippet->_p2 = (AQBlock1*)_ParamPointer(DefaultVal);
    snippet->_p3 = _ParamPointer(EndOffset);
    snippet->_p4 = (AQBlock1*)type->GetSubElement(0);
    snippet->_p5 = beginDest;
    while (snippet->_p5 < endDest) {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSizeStr;
        snippet->_p5 += elementSizeDest;
    }
    return _NextInstruction();
}
InstructionCore* EmitGenericStringToNumber(ClumpParseState* pInstructionBuilder)
{
    InstructionCore* pInstruction = null;
    TypeRef sourceStrType = pInstructionBuilder->_argTypes[0];
    TypeRef outputType = pInstructionBuilder->_argTypes[5];
    SubString savedOperation = pInstructionBuilder->_instructionPointerType->Name();
    TypeRef Int32Type = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsInt32Type);
    TypeRef staticTypeAndDataType = pInstructionBuilder->_clump->TheTypeManager()->FindType("StaticTypeAndData");
    TypeRef stringType = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsStringType);
    switch (sourceStrType->BitEncoding()) {
        case kEncoding_Array:
        case kEncoding_Cluster:
        {
            savedOperation = pInstructionBuilder->_instructionPointerType->Name();
            ConstCStr pVectorBinOpName = null;
            pVectorBinOpName = "VectorOrClusterStrToNumOp";
            SubString vectorBinOpToken(pVectorBinOpName);
            pInstructionBuilder->ReresolveInstruction(&vectorBinOpToken, false);  // build a vector op
            if (sourceStrType->BitEncoding() != outputType->BitEncoding())
                return null;
            TypeRef srcEltType = sourceStrType->GetSubElement(0);
            if (!srcEltType->CompareType(stringType))
                return null;
            if (!pInstructionBuilder->_argTypes[1]->CompareType(Int32Type) || !pInstructionBuilder->_argTypes[3]->CompareType(Int32Type))
                return null;
            TypeRef outEltType = outputType->GetSubElement(0);
            if (!pInstructionBuilder->_argTypes[2]->CompareType(outEltType))
                return null;
            Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();

            // Emit the vector op
            AggregateStrToNumInstruction* vectorBinOp = (AggregateStrToNumInstruction*) pInstructionBuilder->EmitInstruction();
            pInstruction = vectorBinOp;

            // Recurse on the subtype
            ClumpParseState snippetBuilder(pInstructionBuilder);

            pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, vectorBinOp, snippetArgId);
            snippetBuilder.EmitInstruction(&savedOperation, 5, srcEltType, (void*)null, Int32Type, (void*)null, outEltType, (void*)null,
                                           Int32Type, (void*)null, staticTypeAndDataType, (void*)null);
            pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
            pInstructionBuilder->RecordNextHere(&vectorBinOp->_piNext);
            break;
        }
        default:
            break;
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
    if (!argType->CompareType(argType2)) {
        return null;
    }
    TypeRef outputType = pInstructionBuilder->_argTypes[3];
    TypeRef outputType2 = pInstructionBuilder->_argTypes[5];
    if (!outputType->CompareType(outputType2)) {
        return null;
    }
    if (!argType2->CompareType(outputType2)) {
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
    if (isLT) {
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
    Search1DArrayInstruction* searchOp = (Search1DArrayInstruction*)pInstructionBuilder->EmitInstruction();  // emit the search op
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
        case kEncoding_Cluster:
            if (array->ElementType()->IsComplex()) {
                if (elementSize == sizeof(Single)*2) {
                    ((Single *)scalarOpSnippet->_p2)[0] = isIdentityOne;
                    ((Single *)scalarOpSnippet->_p2)[1] = 0;
                } else {
                    ((Double *)scalarOpSnippet->_p2)[0] = isIdentityOne;
                    ((Double *)scalarOpSnippet->_p2)[1] = 0;
                }
                break;
            }  // else fall through
        default:
        {
            switch (elementSize) {
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
    EncodingEnum destEncoding = pDestType->BitEncoding();

    // Skip the arg count and output array arguments.  Then, for each input add an argument which
    // indicates whether input's type is the same as ArrayOut's type or ArrayOut's element type.
    for (Int32 i = 2; i < argCount; i++) {
        if (pDestType->CompareType(pInstructionBuilder->_argTypes[i]))  // input is an array
            pInstructionBuilder->InternalAddArg(null, pInstructionBuilder->_argPointers[i]);
        else if (destEncoding == kEncoding_Array && pDestType->Rank() == 1
            && pDestType->GetSubElement(0)->CompareType(pInstructionBuilder->_argTypes[i]))  // input is a single element
            pInstructionBuilder->InternalAddArg(null, null);
        else if (destEncoding == kEncoding_Array && pInstructionBuilder->_argTypes[i]->BitEncoding() == kEncoding_Array
            && pDestType->Rank() == pInstructionBuilder->_argTypes[i]->Rank()+1)  // input is array one rank less than output
            pInstructionBuilder->InternalAddArg(null, pInstructionBuilder->_argPointers[i]);
        else  // type mismatch
            VIREO_ASSERT(false);
    }

    return pInstructionBuilder->EmitInstruction();
}
//------------------------------------------------------------
// Copy a sourceRank-D source array into a destRank-D dest array of type elementType which has already been resized to accommodate.
// Inner dimension lengths of source array can be less than dest array dimension lengths.
// Top level call must pass destRank >= 2, and sourceRank == destRank or destRank-1.
AQBlock1* ArrayToArrayCopyHelper(TypeRef elementType, AQBlock1* pDest, IntIndex* destSlabLengths,
    AQBlock1 *pSource, IntIndex* sourceDimLengths, IntIndex* sourceSlabLengths, Int32 destRank,
    Int32 sourceRank, bool preinit) {
    if (sourceRank == 1) {
        Int32 elemSize = elementType->TopAQSize();
        if (elemSize == destSlabLengths[0] && elemSize == sourceSlabLengths[0]) {
            if (elementType->CopyData(pSource, pDest, sourceDimLengths[0]))
                return NULL;
            Int32 copiedLength = sourceDimLengths[0] * elemSize;
            if (!preinit && copiedLength < destSlabLengths[1]) {
                memset(pDest + copiedLength, 0, destSlabLengths[1] - copiedLength);
            }
        } else {
            AQBlock1 *pTemp = pDest;
            for (IntIndex i = 0; i < sourceDimLengths[0]; ++i) {
                if (elementType->CopyData(pSource, pTemp, 1))
                    return NULL;
                pTemp  += destSlabLengths[0];
                pSource += sourceSlabLengths[0];
            }
        }
        pDest += destSlabLengths[1];
    } else {
        for (IntIndex i = 0; i < sourceDimLengths[sourceRank-1]; ++i) {
            if (!(/*pDest = */ArrayToArrayCopyHelper(elementType, pDest, destSlabLengths, pSource,
                sourceDimLengths, sourceSlabLengths, destRank-1, sourceRank-1, preinit)))
                return NULL;
            pDest += destSlabLengths[sourceRank-1];
            pSource += sourceSlabLengths[sourceRank-1];
        }
    }
    return pDest;
}
// Same as above, but iterate in reverse so if the source and dest are the same but dimension sizes have changed,
// data is moved correctly without blapping source elements before they are copied.
static AQBlock1* ArrayToArrayCopyHelperRev(TypeRef elementType, AQBlock1* pDest, IntIndex* destSlabLengths,
    AQBlock1 *pSource, IntIndex* sourceDimLengths, IntIndex* sourceSlabLengths, Int32 destRank, Int32 sourceRank) {
    if (sourceRank == 1) {
        if (elementType->CopyData(pSource, pDest, sourceDimLengths[0]))
            return NULL;
        Int32 copiedLength = sourceDimLengths[0] * elementType->TopAQSize();
        if (copiedLength < destSlabLengths[1]) {
            memset(pDest + copiedLength, 0, destSlabLengths[1] - copiedLength);
        }
        pDest += destSlabLengths[1];
    } else {
        pSource += sourceSlabLengths[sourceRank-1] * sourceDimLengths[sourceRank-1];
        pDest += destSlabLengths[destRank-1] * sourceDimLengths[sourceRank-1];
        AQBlock1* pOrigDest = pDest;
        for (IntIndex i = sourceDimLengths[sourceRank-1]-1; i >= 0; --i) {
            pSource -= sourceSlabLengths[sourceRank-1];
            pDest -= destSlabLengths[destRank-1];
            ArrayToArrayCopyHelperRev(elementType, pDest, destSlabLengths, pSource, sourceDimLengths, sourceSlabLengths, destRank-1, sourceRank-1);
        }
        pDest = pOrigDest;
    }
    return pDest;
}
//------------------------------------------------------------
struct ArrayConcatenateInternalParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamImmediateDef(void*, Element[1]);
    NEXT_INSTRUCTION_METHODV()
};
VIREO_FUNCTION_SIGNATUREV(ArrayConcatenateInternal, ArrayConcatenateInternalParamBlock)
{
    Int32 numInputs = (_ParamVarArgCount() - 1) / 2;
    TypedArrayCoreRef pDest = _Param(ArrayOut);

    // Each input has a corresponding typeComparison entry which indicates whether input's type
    // is the same as ArrayOut's type or ArrayOut's element type.
    // The typeComparisons arguments are added after the inputs by EmitArrayConcatenateInstruction.
    void** inputs =  _ParamImmediate(Element);
    void** typeComparisons =  inputs + numInputs;
    IntIndex outputRank = pDest->Rank();
    Boolean inplaceDimChange = false;

    if (outputRank > 1) {
        IntIndex totalOuterDimLength = 0, i, j;
        IntIndex minInputRank = outputRank;
        ArrayDimensionVector tempDimensionLengths, origDimensionLengths, origSlab;
        Int32 originalOuterDimSize = pDest->DimensionLengths()[outputRank-1];
        for (i = 0; i < numInputs; i++) {
            TypedArrayCoreRef arrayInput = *((TypedArrayCoreRef *) inputs[i]);
            IntIndex* pInputDimLength = arrayInput->DimensionLengths();
            IntIndex inputRank = arrayInput->Rank(), inputOuterDimSize;
            if (inputRank < minInputRank)
                minInputRank = inputRank;
            if (inputRank == outputRank) {
                inputOuterDimSize =  arrayInput->DimensionLengths()[inputRank-1];
            } else {
                inputOuterDimSize = 1;
            }
            totalOuterDimLength += inputOuterDimSize;
            for (j = 0; j < outputRank-1; j++)
                if (i == 0 || tempDimensionLengths[j] < pInputDimLength[j]) {
                    tempDimensionLengths[j] = pInputDimLength[j];
                    if (i > 0)
                        inplaceDimChange = true;
                }
        }
        tempDimensionLengths[outputRank-1] = totalOuterDimLength;
        for (j = 0; j < outputRank; j++) {
            origDimensionLengths[j] = pDest->DimensionLengths()[j];
            origSlab[j] = pDest->SlabLengths()[j];
        }
        if (pDest->ResizeDimensions(outputRank, tempDimensionLengths, true)) {
            AQBlock1* pInsert = pDest->BeginAt(0);
            TypeRef elementType = pDest->ElementType();
            IntIndex* slabLengths = pDest->SlabLengths();
            for (i = 0; i < numInputs; i++) {
                TypedArrayCoreRef pSource = *((TypedArrayCoreRef*) inputs[i]);
                if (pSource != pDest) {
                    pInsert = ArrayToArrayCopyHelper(elementType, pInsert, slabLengths, pSource->BeginAt(0),
                        pSource->DimensionLengths(), pSource->SlabLengths(), outputRank, pSource->Rank());
                    if (!pInsert) {
                        tempDimensionLengths[0] = 0;
                        pDest->ResizeDimensions(outputRank, tempDimensionLengths, false);
                        break;
                    }
                } else {  // Source and dest are the same array
                    if (i != 0) {
                        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Illegal ArrayConcatenate inplaceness");
                        return THREAD_EXEC()->Stop();
                    }
                    if (inplaceDimChange)
                        ArrayToArrayCopyHelperRev(elementType, pInsert, pDest->SlabLengths(), pSource->BeginAt(0),
                            origDimensionLengths, origSlab, outputRank, pSource->Rank());
                    pInsert += originalOuterDimSize * slabLengths[outputRank-1];
                }
            }
        }
    } else {
        Int32 originalLength = pDest->Length();
        Int32 totalLength = 0;
        for (Int32 i = 0; i < numInputs; i++) {
            // TODO(PaulAustin): check for overflow
            if (typeComparisons[i]) {  // input is an array
                TypedArrayCoreRef arrayInput = *((TypedArrayCoreRef *) inputs[i]);
                totalLength += arrayInput->Length();
            } else {
                // Input is a single element
                totalLength++;
            }
        }
        if (pDest->Resize1DOrEmpty(totalLength)) {  // 1D output array
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
                    } else {  // Source and dest are the same array
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
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorVectorBinaryAccumulatorOp, AggregateBinOpInstruction);
VIREO_FUNCTION_SIGNATURET(ClusterAggBinaryOp, AggregateBinOpInstruction)
{
    Instruction3<AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());  // pointer to snippet.
    Instruction1<void>* accumulator = (Instruction1<void>*)_ParamMethod(Accumulator());

    if (accumulator != null) {
        // If there is an accumulator call it instead.
        // It will loop through the snippets setting the boolean result
        // In the third parameter. All boolean results point to the same location.
        while (ExecutionContext::IsNotCulDeSac(snippet)) {
            Boolean bNestedAccumulator =   (snippet->_function == (InstructionFunction)VectorVectorBinaryAccumulatorOp)
                                        || (snippet->_function == (InstructionFunction)ClusterAggBinaryOp);

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
        while (ExecutionContext::IsNotCulDeSac(snippet)) {
            Boolean bNestedAccumulator =   (snippet->_function == (InstructionFunction)VectorVectorBinaryAccumulatorOp)
                                        || (snippet->_function == (InstructionFunction)ClusterAggBinaryOp);

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
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Illegal Cluster aggregate op");
        return THREAD_EXEC()->Stop();
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURET(ClusterBinaryOp, AggregateBinOpInstruction)
{
    Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction4<AQBlock1, AQBlock1,
        AQBlock1, AQBlock1>*)_ParamMethod(Snippet()), *origSnippet = snippet;  // pointer to snippet.
    AQBlock1 *saveArg = origSnippet->_p1;
    if (intptr_t(snippet->_p1) < 0) {  // we need to call a conversion snippet for one of the args
        UInt8 convertBuffer[16];
        while (ExecutionContext::IsNotCulDeSac(snippet)) {
            // Argument snippet is conversion function, real op follows
            Instruction2<AQBlock1, AQBlock1>* convertSnippet = (Instruction2<AQBlock1, AQBlock1>*)snippet;
            int whichConvertArg = -int(intptr_t(convertSnippet->_p1));
            snippet = (Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>*)convertSnippet->Next();
            if (whichConvertArg == 1) {
                convertSnippet->_p0 = snippet->_p0 + (size_t)_ParamPointer(SX);
                snippet->_p0 = convertBuffer;
                snippet->_p1 += (size_t)_ParamPointer(SY);
            } else {
                convertSnippet->_p0 = snippet->_p0 + (size_t)_ParamPointer(SY);
                snippet->_p0 += (size_t)_ParamPointer(SX);
                snippet->_p1 = convertBuffer;
            }
            convertSnippet->_p1 = convertBuffer;
            snippet->_p2 += (size_t)_ParamPointer(SDest);
            _PROGMEM_PTR(convertSnippet, _function)(convertSnippet);
            InstructionCore *next = _PROGMEM_PTR(snippet, _function)(snippet);
            if (whichConvertArg == 1) {
                snippet->_p0 = convertSnippet->_p0 - (size_t)_ParamPointer(SX);
                snippet->_p1 -= (size_t)_ParamPointer(SY);
            } else {
                snippet->_p0 -= (size_t)_ParamPointer(SX);
                snippet->_p1 = convertSnippet->_p0 - (size_t)_ParamPointer(SY);
            }
            snippet->_p2 -= (size_t)_ParamPointer(SDest);
            convertSnippet->_p0 = null;
            convertSnippet->_p1 = (AQBlock1*)(intptr_t(whichConvertArg) << 24);
            snippet = (Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>*) next;
        }
        origSnippet->_p1 = saveArg;
        return _NextInstruction();
    }
    while (ExecutionContext::IsNotCulDeSac(snippet)) {
        snippet->_p0 += (size_t)_ParamPointer(SX);
        snippet->_p1 += (size_t)_ParamPointer(SY);
        snippet->_p2 += (size_t)_ParamPointer(SDest);
        if (_ParamPointer(SDest2))
            snippet->_p3 += (size_t)_ParamPointer(SDest2);
        InstructionCore *next = _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 -= (size_t)_ParamPointer(SX);
        snippet->_p1 -= (size_t)_ParamPointer(SY);
        snippet->_p2 -= (size_t)_ParamPointer(SDest);
        if (_ParamPointer(SDest2))
            snippet->_p3 -= (size_t)_ParamPointer(SDest2);
        snippet = (Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>*) next;
    }
    origSnippet->_p1 = saveArg;
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(ClusterUnaryOp, AggregateUnOpInstruction)
{
    Instruction2<AQBlock1, AQBlock1>* pInstruction = (Instruction2<AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    while (ExecutionContext::IsNotCulDeSac(pInstruction)) {
        pInstruction->_p0 += (size_t)_ParamPointer(SSource);
        pInstruction->_p1 += (size_t)_ParamPointer(SDest);
        InstructionCore* next = _PROGMEM_PTR(pInstruction, _function)(pInstruction);  // execute inline for now. TODO(PaulAustin): yield to the scheduler
        pInstruction->_p0 -= (size_t)_ParamPointer(SSource);
        pInstruction->_p1 -= (size_t)_ParamPointer(SDest);
        pInstruction = (Instruction2<AQBlock1, AQBlock1>*)next;
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURET(ClusterUnary2OutputOp, AggregateUnOp2OutputInstruction)
{
    Instruction3<AQBlock1, AQBlock1, AQBlock1>* pInstruction = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    while (ExecutionContext::IsNotCulDeSac(pInstruction)) {
        pInstruction->_p0 += (size_t)_ParamPointer(SSource);
        pInstruction->_p1 += (size_t)_ParamPointer(SDest);
        pInstruction->_p2 += (size_t)_ParamPointer(SDest2);
        InstructionCore* next = _PROGMEM_PTR(pInstruction, _function)(pInstruction);  // execute inline for now. TODO(PaulAustin): yield to the scheduler
        pInstruction->_p0 -= (size_t)_ParamPointer(SSource);
        pInstruction->_p1 -= (size_t)_ParamPointer(SDest);
        pInstruction->_p2 -= (size_t)_ParamPointer(SDest2);
        pInstruction = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)next;
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
        while (ExecutionContext::IsNotCulDeSac(pInstruction)) {
            pInstruction = _PROGMEM_PTR(pInstruction, _function)(pInstruction);
            if (!*dest)
                return null;
        }
    }
    return _this;
}
//------------------------------------------------------------
// Execute a snippet of binops until one of them returns true
VIREO_FUNCTION_SIGNATURE1(IsNEAccumulator, void)
{
    BinaryCompareInstruction* binop = (BinaryCompareInstruction*)_ParamPointer(0);
    Boolean* dest = binop->_p2;
    InstructionCore* pInstruction = binop;
    if ((binop->_p0 == null) || (binop->_p1 == null)) {
        *dest = binop->_p0 != binop->_p1;
    } else {
        while (ExecutionContext::IsNotCulDeSac(pInstruction)) {
            pInstruction = _PROGMEM_PTR(pInstruction, _function)(pInstruction);
            if (*dest)
                return null;
        }
    }
    return _this;
}
//------------------------------------------------------------
// Execute a snippet of binops until one of them returns true or the commutative pair returns true
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
        while (ExecutionContext::IsNotCulDeSac(binop)) {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (*dest) {
                return null;
            } else {  // commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (*dest) {
                    *dest = false;  // flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
// Execute a snippet of binops until one of them returns true or the commutative pair returns true
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
        while (ExecutionContext::IsNotCulDeSac(binop)) {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (*dest) {
                return null;
            } else {  // commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (*dest) {
                    *dest = false;  // flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
// Execute a snippet of binops until one of them returns false or the commutative pair returns true
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
        while (ExecutionContext::IsNotCulDeSac(binop)) {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (!*dest) {
                return null;
            } else {  // commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (!*dest) {
                    *dest = true;  // flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
// Execute a snippet of binops until one of them returns false or the commutative pair returns true
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
        while (ExecutionContext::IsNotCulDeSac(binop)) {
            InstructionCore* next = _PROGMEM_PTR(binop, _function)(binop);
            if (!*dest) {
                return null;
            } else {  // commute the args
                AQBlock1* temp = binop->_p0;
                binop->_p0 = binop->_p1;
                binop->_p1 = temp;
                _PROGMEM_PTR(binop, _function)(binop);
                binop->_p1 = binop->_p0;
                binop->_p0 = temp;
                if (!*dest) {
                    *dest = true;  // flip the result and return
                    return null;
                }
            }
            binop = (BinaryCompareInstruction*) next;
        }
    }
    return _this;
}
//------------------------------------------------------------
void VectorOpConvertArgs(Instruction3<AQBlock1, AQBlock1, AQBlock1>* snippet, AQBlock1 *begin1,
    AQBlock1 *begin2, AQBlock1 *beginDest, AQBlock1 *endDest, IntIndex elementSize1,
    IntIndex elementSize2, IntIndex elementSizeDest) {
    // Argument snippet is conversion function, real op follows
    Instruction2<AQBlock1, AQBlock1>* convertSnippet = (Instruction2<AQBlock1, AQBlock1>*)snippet;
    int whichConvertArg = -int(intptr_t(convertSnippet->_p1));
    snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)convertSnippet->Next();
    UInt8 convertBuffer[16];
    if (whichConvertArg == 1) {
        convertSnippet->_p0 = begin1;
        snippet->_p0 = convertBuffer;
        snippet->_p1 = begin2;
    } else {
        convertSnippet->_p0 = begin2;
        snippet->_p0 = begin1;
        snippet->_p1 = convertBuffer;
    }
    convertSnippet->_p1 = convertBuffer;
    snippet->_p2 = beginDest;
    while (snippet->_p2 < endDest) {
        _PROGMEM_PTR(convertSnippet, _function)(convertSnippet);
        _PROGMEM_PTR(snippet, _function)(snippet);
        if (whichConvertArg == 1) {
            convertSnippet->_p0 += elementSize1;
            snippet->_p1 += elementSize2;
        } else {
            snippet->_p0 += elementSize1;
            convertSnippet->_p0 += elementSize2;
        }
        snippet->_p2 += elementSizeDest;
    }
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorVectorBinaryOp, AggregateBinOpInstruction)
{
    TypedArrayCoreRef srcArray1 = _Param(VX);
    TypedArrayCoreRef srcArray2 = _Param(VY);
    TypedArrayCoreRef destArray = _Param(VDest);
    TypedArrayCoreRef destArray2 = _ParamPointer(VDest2) ? _Param(VDest2) : null;
    // snippet is either 3 or 4 args; only access _p3 if destArray2 is non-null
    Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction4<AQBlock1, AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSize2 = srcArray2->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex lengthA1 = srcArray1->Length();
    IntIndex lengthA2 = srcArray2->Length();
    IntIndex count = (lengthA1 < lengthA2) ? lengthA1 : lengthA2;

    // Resize output to minimum of input arrays for each dimension
    ArrayDimensionVector newDimensionLengths;
    // TODO(sanmut) Error out if ranks of srcArray1 and srcArray2 don't match
    IntIndex rank = srcArray1->Rank();
    IntIndex *srcArray1Lengths  = srcArray1->DimensionLengths();
    IntIndex *srcArray2Lengths  = srcArray2->DimensionLengths();
    VIREO_ASSERT(rank <= kArrayMaxRank);

    // if the dimension lenghts for all dimensions for both the array inputs are same,
    // this will be true and we can advance the iterator directly without going through
    // the ArrayIterator for sligthly better performance.
    bool isInputArraysDimensionsSame = true;

    for (int i = 0; i < rank; i++) {
       IntIndex dim1 = *(srcArray1Lengths + i);
       IntIndex dim2 = *(srcArray2Lengths + i);
       newDimensionLengths[i] = (dim1 < dim2) ? dim1 : dim2;
       if (dim1 != dim2)
           isInputArraysDimensionsSame = false;
    }
    destArray->ResizeDimensions(rank, newDimensionLengths, true);

    if (destArray2)
        destArray2->ResizeDimensions(rank, newDimensionLengths, true);

    ArrayIterator srcArray1Iter(srcArray1, rank, newDimensionLengths);
    ArrayIterator srcArray2Iter(srcArray2, rank, newDimensionLengths);
    ArrayIterator destArray1Iter(destArray, rank, newDimensionLengths);
    ArrayIterator destArray2Iter(destArray2, rank, newDimensionLengths);

    AQBlock1 *srcArray1IterPtr = (AQBlock1 *)srcArray1Iter.Begin();
    AQBlock1 *srcArray2IterPtr = (AQBlock1 *)srcArray2Iter.Begin();
    AQBlock1 *destArray1IterPtr = (AQBlock1 *)destArray1Iter.Begin();
    AQBlock1 *destArray2IterPtr = destArray2 ? (AQBlock1 *)destArray2Iter.Begin() : NULL;
    AQBlock1 *destArray1EndIterPos = destArray1IterPtr + (count * elementSizeDest);
    if (snippet->_p1) {  // we need to call a conversion snippet for one of the args
        AQBlock1 *saveArg = snippet->_p1;
        VectorOpConvertArgs(snippet, srcArray1IterPtr, srcArray2IterPtr, destArray1IterPtr, destArray1EndIterPos, elementSize1, elementSize2, elementSizeDest);
        snippet->_p1 = saveArg;
        return _NextInstruction();
    }

    if (isInputArraysDimensionsSame) {
        while (destArray1IterPtr != destArray1EndIterPos) {
            snippet->_p0 = srcArray1IterPtr;
            snippet->_p1 = srcArray2IterPtr;
            snippet->_p2 = destArray1IterPtr;
            if (destArray2)
                snippet->_p3 = destArray2IterPtr;
            _PROGMEM_PTR(snippet, _function)(snippet);
            srcArray1IterPtr = srcArray1IterPtr + elementSize1;
            srcArray2IterPtr = srcArray2IterPtr + elementSize2;
            destArray1IterPtr = destArray1IterPtr + elementSizeDest;
            if (destArray2)
                destArray2IterPtr = destArray2IterPtr + elementSizeDest;
        }
    } else {
        while (destArray1IterPtr != NULL) {
            snippet->_p0 = srcArray1IterPtr;
            snippet->_p1 = srcArray2IterPtr;
            snippet->_p2 = destArray1IterPtr;
            if (destArray2)
                snippet->_p3 = destArray2IterPtr;
            _PROGMEM_PTR(snippet, _function)(snippet);
            srcArray1IterPtr = (AQBlock1 *)srcArray1Iter.Next();
            srcArray2IterPtr = (AQBlock1 *)srcArray2Iter.Next();
            destArray1IterPtr = (AQBlock1 *)destArray1Iter.Next();
            if (destArray2)
                destArray2IterPtr = (AQBlock1 *)destArray2Iter.Next();
        }
    }

    snippet->_p1 = null;
    return _NextInstruction();
}

//------------------------------------------------------------
typedef Instruction7<AQBlock1, AQBlock1, AQBlock1, Boolean, Boolean, AQBlock1, AQBlock1> InRangeCompareInstructionArgs;

VIREO_FUNCTION_SIGNATURET(VectorOrScalarInRangeOp, InRangeAndCoerceInstruction)
{
    InRangeAndCoerceInstruction::IRCFlags flags = _ParamImmediate(flags);
    TypedArrayCoreRef srcArrayX = !(flags & InRangeAndCoerceInstruction::kXIsScalar) ? _Param(VX) : NULL;
    TypedArrayCoreRef srcArrayLo = !(flags & InRangeAndCoerceInstruction::kLoIsScalar) ? _Param(VLo) : NULL;
    TypedArrayCoreRef srcArrayHi = !(flags & InRangeAndCoerceInstruction::kHiIsScalar) ? _Param(VHi) : NULL;
    TypedArrayCoreRef coercedArray = _Param(VCoerced);
    TypedArrayCoreRef destArray = _Param(VDest);
    InRangeCompareInstructionArgs* snippet = (InRangeCompareInstructionArgs*)_ParamMethod(Snippet());

    IntIndex elementSizeX = srcArrayX ? srcArrayX->ElementType()->TopAQSize() : 0;
    IntIndex elementSizeLo = srcArrayLo ? srcArrayLo->ElementType()->TopAQSize() : 0;
    IntIndex elementSizeHi = srcArrayHi ? srcArrayHi->ElementType()->TopAQSize() : 0;
    IntIndex elementSizeCoerced = coercedArray->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex lengthAX = srcArrayX ? srcArrayX->Length() : 0;
    IntIndex lengthALo = srcArrayLo ? srcArrayLo->Length() : 0;
    IntIndex lengthAHi = srcArrayHi ? srcArrayHi->Length() : 0;
    IntIndex count = (srcArrayX && (!srcArrayLo || lengthAX < lengthALo)) ? lengthAX : srcArrayLo ? lengthALo : lengthAHi;
    if (srcArrayHi && lengthAHi < count)
        count = lengthAHi;

    // Resize output to minimum of input arrays
    coercedArray->Resize1D(count);
    destArray->Resize1D(count);
    AQBlock1 *beginX = srcArrayX ? srcArrayX->RawBegin() : _ParamPointer(SX);
    AQBlock1 *beginLo = srcArrayLo ? srcArrayLo->RawBegin() : _ParamPointer(SLo);
    AQBlock1 *beginHi = srcArrayHi ? srcArrayHi->RawBegin() : _ParamPointer(SHi);
    AQBlock1 *beginCoerced = coercedArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *beginDest = destArray->RawBegin();
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);
    snippet->_p0 = beginX;
    snippet->_p1 = beginLo;
    snippet->_p2 = beginHi;
    snippet->_p3 = _ParamPointer(includeLo);
    snippet->_p4 = _ParamPointer(includeHi);
    snippet->_p5 = beginCoerced;
    snippet->_p6 = beginDest;
    while (snippet->_p6 < endDest) {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSizeX;
        snippet->_p1 += elementSizeLo;
        snippet->_p2 += elementSizeHi;
        snippet->_p5 += elementSizeCoerced;
        snippet->_p6 += elementSizeDest;
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURET(ClusterInRangeOp, InRangeAndCoerceInstruction)
{
    InRangeCompareInstructionArgs* snippet = (InRangeCompareInstructionArgs*)_ParamMethod(Snippet());
    while (ExecutionContext::IsNotCulDeSac(snippet)) {
        snippet->_p0 += (size_t)_ParamPointer(SX);
        snippet->_p1 += (size_t)_ParamPointer(SLo);
        snippet->_p2 += (size_t)_ParamPointer(SHi);
        snippet->_p3 = _ParamPointer(includeLo);
        snippet->_p4 = _ParamPointer(includeHi);
        snippet->_p5 += (size_t)_ParamPointer(SCoerced);
        snippet->_p6 += (size_t)_ParamPointer(SDest);

        InstructionCore *next = _PROGMEM_PTR(snippet, _function)(snippet);

        snippet->_p0 -= (size_t)_ParamPointer(SX);
        snippet->_p1 -= (size_t)_ParamPointer(SLo);
        snippet->_p2 -= (size_t)_ParamPointer(SHi);
        snippet->_p5 -= (size_t)_ParamPointer(SCoerced);

        snippet->_p6 -= (size_t)_ParamPointer(SDest);
        snippet = (InRangeCompareInstructionArgs*) next;
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
        while (minLength-- > 0) {
            if (_PROGMEM_PTR(accumulator, _function)(accumulator) == null) {
                return _NextInstruction();
            }
            snippet->_p0 += elementSize1;
            snippet->_p1 += elementSize2;
        }

        // If the vectors have different lengths, pass null as the argument pointer for the array that ran out of elements.
        if (lengthA1 != lengthA2) {
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
    while (snippet->_p2 < endDest) {
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
    TypedArrayCoreRef srcArray1 = _Param(VY);
    TypedArrayCoreRef destArray = _Param(VDest);
    TypedArrayCoreRef destArray2 = _ParamPointer(VDest2) ? _Param(VDest2) : null;
    // snippet is either 3 or 4 args; only access _p3 if destArray2 is non-null
    Instruction4<void, AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction4<void, AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex count = srcArray1->Length();

    // Resize output to size of input array
    destArray->Resize1D(count);
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *beginDest = destArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *beginDest2 = destArray2 ? destArray2->RawBegin() : null;
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);
    if (snippet->_p1) {  // we need to call a conversion snippet for one of the args
        AQBlock1 *saveArg = snippet->_p1;
        VectorOpConvertArgs((Instruction3<AQBlock1, AQBlock1, AQBlock1>*)snippet, (AQBlock1*)_ParamPointer(SX),
            begin1, beginDest, endDest, 0, elementSize1, elementSizeDest);
        snippet->_p1 = saveArg;
        return _NextInstruction();
    }
    snippet->_p0 = _ParamPointer(SX);
    snippet->_p1 = begin1;
    snippet->_p2 = beginDest;
    if (beginDest2)
        snippet->_p3 = beginDest2;
    while (snippet->_p2 < endDest) {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p1 += elementSize1;
        snippet->_p2 += elementSizeDest;
        if (beginDest2)
            snippet->_p3 += elementSizeDest;
    }
    snippet->_p1 = null;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorScalarBinaryOp, AggregateBinOpInstruction)
{
    TypedArrayCoreRef srcArray1 = _Param(VX);
    TypedArrayCoreRef destArray = _Param(VDest);
    TypedArrayCoreRef destArray2 = _ParamPointer(VDest2) ? _Param(VDest2) : null;
    // snippet is either 3 or 4 args; only access _p3 if destArray2 is non-null
    Instruction4<AQBlock1, void, AQBlock1, AQBlock1>* snippet = (Instruction4<AQBlock1, void, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex count = srcArray1->Length();

    // Resize output to size of input array
    destArray->Resize1D(count);
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *beginDest = destArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *beginDest2 = destArray2 ? destArray2->RawBegin() : null;
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);
    if (snippet->_p1) {  // we need to call a conversion snippet for one of the args
        void *saveArg = snippet->_p1;
        VectorOpConvertArgs((Instruction3<AQBlock1, AQBlock1, AQBlock1>*)snippet, begin1,
            (AQBlock1*)_ParamPointer(SY), beginDest, endDest, elementSize1, 0, elementSizeDest);
        snippet->_p1 = saveArg;
        return _NextInstruction();
    }
    snippet->_p0 = begin1;
    snippet->_p1 = _ParamPointer(SY);
    snippet->_p2 = beginDest;
    if (beginDest2)
        snippet->_p3 = beginDest2;
    while (snippet->_p2 < endDest) {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSize1;
        snippet->_p2 += elementSizeDest;
        if (beginDest2)
            snippet->_p3 += elementSizeDest;
    }
    snippet->_p1 = null;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(ScalarScalarConvertBinaryOp, AggregateBinOpInstruction)
{
    Instruction3<void, void, AQBlock1>* snippet = (Instruction3<void, void, AQBlock1>*)_ParamMethod(Snippet());

    AQBlock1 *beginDest = (AQBlock1*)_ParamPointer(SDest);  // might be in-place to one of the inputs.
    AQBlock1 *endDest = beginDest + 1;
    if (snippet->_p1) {  // we need to call a conversion snippet for one of the args
        void *saveArg = snippet->_p1;
        VectorOpConvertArgs((Instruction3<AQBlock1, AQBlock1, AQBlock1>*)snippet, (AQBlock1*)_ParamPointer(SX),
            (AQBlock1*)_ParamPointer(SY), beginDest, endDest, 0, 0, 1);
        snippet->_p1 = saveArg;
        return _NextInstruction();
    }
    snippet->_p0 = _ParamPointer(SX);
    snippet->_p1 = _ParamPointer(SY);
    snippet->_p2 = beginDest;
    _PROGMEM_PTR(snippet, _function)(snippet);
    snippet->_p1 = null;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURET(VectorUnaryOp, AggregateUnOpInstruction)
{
    TypedArrayCoreRef srcArray1 = _Param(VSource);
    TypedArrayCoreRef destArray = _Param(VDest);
    Instruction2<AQBlock1, AQBlock1>* snippet = (Instruction2<AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

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
    while (snippet->_p1 < endDest) {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSize1;
        snippet->_p1 += elementSizeDest;
    }

    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURET(VectorUnary2OutputOp, AggregateUnOp2OutputInstruction)
{
    TypedArrayCoreRef srcArray1 = _Param(VSource);
    TypedArrayCoreRef destArray = _Param(VDest);
    TypedArrayCoreRef destArray2 = _Param(VDest2);
    Instruction3<AQBlock1, AQBlock1, AQBlock1>* snippet = (Instruction3<AQBlock1, AQBlock1, AQBlock1>*)_ParamMethod(Snippet());

    IntIndex elementSize1 = srcArray1->ElementType()->TopAQSize();
    IntIndex elementSizeDest = destArray->ElementType()->TopAQSize();
    IntIndex elementSizeDest2 = destArray2->ElementType()->TopAQSize();
    IntIndex count = srcArray1->Length();

    // Resize output to size of input arrays
    destArray->Resize1D(count);
    destArray2->Resize1D(count);
    AQBlock1 *begin1 = srcArray1->RawBegin();
    AQBlock1 *beginDest = destArray->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *beginDest2 = destArray2->RawBegin();  // might be in-place to one of the input arrays.
    AQBlock1 *endDest = beginDest + (count * elementSizeDest);

    snippet->_p0 = begin1;
    snippet->_p1 = beginDest;
    snippet->_p2 = beginDest2;
    while (snippet->_p1 < endDest) {
        _PROGMEM_PTR(snippet, _function)(snippet);
        snippet->_p0 += elementSize1;
        snippet->_p1 += elementSizeDest;
        snippet->_p2 += elementSizeDest2;
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE4(ConvertEnum, StaticType, void, StaticType, void)
{
    Int32 sourceSize = _ParamPointer(0)->TopAQSize();
    Int32 destSize = _ParamPointer(2)->TopAQSize();
    EncodingEnum encoding = _ParamPointer(0)->BitEncoding();
    UInt32 numElems = UInt32(_ParamPointer(2)->GetEnumItemCount());
    UInt32 val = 0;
    Int32 ival = 0;
    if (encoding == kEncoding_IEEE754Binary) {
        if (sourceSize == 8)
            ival = Int32(*(Double*)_ParamPointer(1));
        else
            ival = Int32(*(Single*)_ParamPointer(1));
        val = ival >= 0 ? ival : 0;
    } else if (encoding == kEncoding_UInt) {
        switch (sourceSize) {
            case 1: val = *(Int8*)_ParamPointer(1); break;
            case 2: val = *(Int16*)_ParamPointer(1); break;
            case 4: val = *(Int32*)_ParamPointer(1); break;
            case 8: val = Int32(*(Int64*)_ParamPointer(1)); break;
            default: break;
        }
    } else {
        switch (sourceSize) {
            case 1: ival = *(UInt8*)_ParamPointer(1); break;
            case 2: ival = *(UInt16*)_ParamPointer(1); break;
            case 4: ival = *(UInt32*)_ParamPointer(1); break;
            case 8: ival = UInt32(*(UInt64*)_ParamPointer(1)); break;
            default: break;
        }
        val = ival >= 0 ? ival : 0;
    }
    if (val >= numElems)
        val = numElems-1;
    switch (destSize) {
        case 1: *(UInt8*)_ParamPointer(3) = val; break;
        case 2: *(UInt16*)_ParamPointer(3) = val; break;
        case 4: *(UInt32*)_ParamPointer(3) = val; break;
        case 8: *(UInt64*)_ParamPointer(3) = val; break;
        default: break;
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
    // to determine the correct behavior.
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
    DEFINE_VIREO_FUNCTION(CopyEnum1, "p(i(UInt8) o(UInt8) i(UInt8))");
    DEFINE_VIREO_FUNCTION(CopyEnum2, "p(i(UInt16)  o(UInt16) i(UInt16))");
    DEFINE_VIREO_FUNCTION(CopyEnum4, "p(i(UInt32)  o(UInt32) i(UInt32))");
    DEFINE_VIREO_FUNCTION(CopyEnum8, "p(i(UInt64)  o(UInt64) i(UInt64))");

    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, ConvertEnum, "p(i(StaticTypeAndData) o(EnumTypeAndData))")

    // Deep copy where needed for objects/arrays/strings.
    DEFINE_VIREO_FUNCTION(CopyObject, "p(i(Object) o(Object))")

    // Deep copy for clusters
    DEFINE_VIREO_FUNCTION(CopyStaticTypedBlock, "p(i(DataPointer) o(DataPointer) i(StaticType))")

    // Generic math operations
    DEFINE_VIREO_GENERIC(Not, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(And, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Or, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Xor, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Implies, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Nand, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Nor, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Nxor, "GenericBinOp", EmitGenericBinOpInstruction);

    DEFINE_VIREO_GENERIC(IsEQ, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsNE, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsLT, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsGT, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsLE, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsGE, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(IsEQ0, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsNE0, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsLT0, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsGT0, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsLE0, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsGE0, "GenericUnOp", EmitGenericUnOpInstruction);

    DEFINE_VIREO_GENERIC(IsNotANumPathRefnum, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsEmptyString, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsEmptyStringOrPath, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsDecimalDigit, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsHexDigit, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsOctalDigit, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsPrintable, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(IsWhiteSpace, "GenericUnOp", EmitGenericUnOpInstruction);

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
    DEFINE_VIREO_GENERIC(Sinc, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(ArcCotangent, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Cotangent, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(ArcSecant, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(ArcCosecant, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Log10, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Log, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Log2, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Exp, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(SquareRoot, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Pow, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(Scale2X, "GenericBinOp", EmitGenericBinOpInstruction);
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

    DEFINE_VIREO_GENERIC(Polar, "GenericBinOp", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(ComplexToPolar, "p(i(*) o(*) o(*))", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(PolarToReOrIm, "p(i(*) i(*) o(*) o(*))", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(ReOrImToPolar, "p(i(*) i(*) o(*) o(*))", EmitGenericBinOpInstruction);
    DEFINE_VIREO_GENERIC(ComplexToReOrIm, "p(i(*) o(*) o(*))", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(ReOrImToComplex, "GenericBinOp", EmitGenericBinOpInstruction);

    DEFINE_VIREO_GENERIC(Convert, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Sign, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Reciprocal, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Negate, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Increment, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(Decrement, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(BooleanConvertInt16, "p(i(Array) o(Array))", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(BooleanConvertInt16, "p(i(*) o(*))", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(MaxAndMin, "p(i(*) i(*) o(StaticTypeAndData) o(StaticTypeAndData) s(Instruction))", EmitMaxMinValueInstruction);
    DEFINE_VIREO_FUNCTION(MaxMinValueInternal, "p(i(*) i(*) o(StaticTypeAndData) o(StaticTypeAndData) s(Instruction))");

    DEFINE_VIREO_GENERIC(StringLength, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(StringReverse, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(StringRotate, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(StringToUpper, "GenericUnOp", EmitGenericUnOpInstruction);
    DEFINE_VIREO_GENERIC(StringToLower, "GenericUnOp", EmitGenericUnOpInstruction);

    DEFINE_VIREO_GENERIC(MaxAndMinElts, "p(i(*) i(*) o(*) o(*) s(Instruction))", EmitMaxMinEltsInstruction);
    DEFINE_VIREO_FUNCTION(VectorMaxMinOp, "p(i(Array) i(Array) o(Array) o(Array) s(Instruction))")
    DEFINE_VIREO_FUNCTION(ClusterMaxMinOp, "p(i(*) i(*) o(*) o(*) s(Instruction))")

    DEFINE_VIREO_GENERIC(InRangeAndCoerce, "p(i(*) i(*) i(*) i(Boolean) i(Boolean) o(*) o(*) s(StaticType) s(Instruction))",
        EmitGenericInRangeAndCoerceInstruction);
    DEFINE_VIREO_FUNCTION(VectorOrScalarInRangeOp, "p(i(Array) i(Array) i(Array) i(Boolean) i(Boolean) o(Array) o(Array) i(Int32) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(ClusterInRangeOp, "p(i(*) i(*) i(*) i(Boolean) i(Boolean) o(*) o(*) s(Instruction) s(Instruction))");
    DEFINE_VIREO_FUNCTION(InRangeAccumulator, "p(i(*) i(*) i(*) i(Boolean) i(Boolean) o(*) o(Boolean) s(Instruction))");

    DEFINE_VIREO_FUNCTION(VectorOrClusterStrToNumOp, "p(i(Array) i(Int32) i(*) o(Int32) o(StaticTypeAndData) s(Instruction))" )
    DEFINE_VIREO_GENERIC(DecimalStringToNumber, "p(i(*) i(Int32) i(*) o(Int32) o(StaticTypeAndData))", EmitGenericStringToNumber);
    DEFINE_VIREO_GENERIC(HexStringToNumber, "p(i(*) i(Int32) i(*) o(Int32) o(StaticTypeAndData))", EmitGenericStringToNumber);
    DEFINE_VIREO_GENERIC(OctalStringToNumber, "p(i(*) i(Int32) i(*) o(Int32) o(StaticTypeAndData))", EmitGenericStringToNumber);
    DEFINE_VIREO_GENERIC(BinaryStringToNumber, "p(i(*) i(Int32) i(*) o(Int32) o(StaticTypeAndData))", EmitGenericStringToNumber);
    DEFINE_VIREO_GENERIC(ExponentialStringToNumber, "p(i(*) i(Int32) i(*) o(Int32) o(StaticTypeAndData))", EmitGenericStringToNumber);

    DEFINE_VIREO_GENERIC(Search1DArray, "p(i(*) i(*) i(Int32) o(Int32) s(Instruction))", EmitSearchInstruction);
    DEFINE_VIREO_FUNCTION(Search1DArrayInternal, "p(i(Array) i(*) i(Int32) o(Int32) s(Instruction))")
    DEFINE_VIREO_GENERIC(ArrayConcatenate, "p(i(VarArgCount) o(Array output) i(*))", EmitArrayConcatenateInstruction);
    DEFINE_VIREO_FUNCTION(ArrayConcatenateInternal, "p(i(VarArgCount) o(Array output) i(*))" )
    DEFINE_VIREO_GENERIC(AddElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_GENERIC(MultiplyElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_GENERIC(AndElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_GENERIC(OrElements, "p(i(Array) o(* output))", EmitVectorOp);
    DEFINE_VIREO_FUNCTION(VectorOpInternal, "p(i(Array) o(* output) i(Boolean))" )

    DEFINE_VIREO_FUNCTION(ClusterAggBinaryOp, "p(i(*) i(*) o(*) s(Instruction) s(Instruction))")
    DEFINE_VIREO_FUNCTION(ClusterBinaryOp, "p(i(*) i(*) o(*) o(*) s(Instruction))")
    DEFINE_VIREO_FUNCTION(ClusterUnaryOp, "p(i(*) o(*) s(Instruction))")
    DEFINE_VIREO_FUNCTION(ClusterUnary2OutputOp, "p(i(*) o(*) o(*) s(Instruction))")
    DEFINE_VIREO_FUNCTION(IsEQAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsNEAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsLTAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsGTAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsLEAccumulator, "p(i(GenericBinOp))");
    DEFINE_VIREO_FUNCTION(IsGEAccumulator, "p(i(GenericBinOp))");
    // EQ0. NE0, etc. do not have compare aggregates mode; no accumulators needed

    // Vector operations
    DEFINE_VIREO_FUNCTION(VectorVectorBinaryOp, "p(i(Array) i(Array) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorVectorBinaryAccumulatorOp, "p(i(Array) i(Array) o(Array) s(Instruction) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorVectorSplitOp, "p(i(Array) o(Array) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(ScalarVectorBinaryOp, "p(i(*) i(Array) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorScalarBinaryOp, "p(i(Array) i(*) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(ScalarScalarConvertBinaryOp, "p(i(*) i(*) o(*) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorUnaryOp, "p(i(Array) o(Array) s(Instruction))" )
    DEFINE_VIREO_FUNCTION(VectorUnary2OutputOp, "p(i(Array) o(Array) o(Array) s(Instruction))" )

DEFINE_VIREO_END()
}  // namespace Vireo
