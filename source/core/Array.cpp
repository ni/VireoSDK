// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Native Vireo array functions
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "VirtualInstrument.h"
#include "Array.h"
#include <vector>
#include <algorithm>
#include <cmath>

namespace Vireo {

//------------------------------------------------------------
DECLARE_VIREO_PRIMITIVE2(ArrayResize, TypedArrayCoreRef, IntIndex, (_Param(0)->Resize1D(_Param(1)) ))
DECLARE_VIREO_PRIMITIVE2(ArrayLength, TypedArrayCoreRef, IntIndex, (_Param(1) = _Param(0)->Length()))
DECLARE_VIREO_PRIMITIVE2(ArrayRank, TypedArrayCoreRef, IntIndex, (_Param(1) = _Param(0)->Rank()))
DECLARE_VIREO_PRIMITIVE2(ArrayElementType, TypedArrayCoreRef, TypeRef, (_Param(1) = _Param(0)->ElementType()))

//-----------------------------------------------------------
/**
 * the order of output dimension size is from the high dimension to low dimension
 * */
VIREO_FUNCTION_SIGNATURE2(ArrayLengthN, TypedArrayCoreRef, TypedArray1D<IntIndex>*)
{
    IntIndex rank = _Param(0)->Rank();
    IntIndex* pLengths = _Param(0)->DimensionLengths();
    TypeRef elementType = _Param(1)->ElementType();
    _Param(1)->Resize1D(rank);
    for (IntIndex i = 0; i < rank; i++) {
        elementType->CopyData(pLengths+(rank-1-i), _Param(1)->BeginAt(i));
    }
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayCapacity, TypedArrayCoreRef, IntIndex)
{
    _Param(1) = _Param(0)->Capacity();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayDimensions, TypedArrayCoreRef, TypedArray1D<IntIndex>*)
{
    IntIndex rank = _Param(0)->Rank();
    IntIndex* pLengths = _Param(0)->DimensionLengths();
    _Param(1)->Replace1D(0, rank, pLengths, true);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayResizeDimensions, TypedArrayCoreRef, TypedArray1D<IntIndex>*)
{
    // Details on how arrays are redimensioned are in ResizeDimensions().
    IntIndex rankProvided = _Param(1)->Length();
    IntIndex* pLengths = _Param(1)->Begin();
    _Param(0)->ResizeDimensions(rankProvided, pLengths, false);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(ArrayFill, TypedArrayCoreRef, IntIndex, void)
{
    TypedArrayCoreRef array = _Param(0);
    TypeRef     eltType = array->ElementType();
    IntIndex    length = _Param(1);

    if (length < 0)
        length = 0;
    if (array->Resize1D(length)) {
        eltType->MultiCopyData(_ParamPointer(2), array->RawBegin(), length);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
struct ArrayIndexNDParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, Array);
    _ParamImmediateDef(StaticTypeAndData, Element);
    _ParamImmediateDef(IntIndex*, Dimension1[1]);
    NEXT_INSTRUCTION_METHODV()
};

// ArrayIndexND - row-major index version, allowing unwired indexes to produce subarrays
// Compare with ArrayIndexEltNDV, which is column major and always produces a scalar elem
VIREO_FUNCTION_SIGNATUREV(ArrayIndexND, ArrayIndexNDParamBlock)
{
    Int32 numDimensionInputs = ((_ParamVarArgCount() - 3));
    TypedArrayCoreRef array = _Param(Array);
    IntIndex **ppDimensions = _ParamImmediate(Dimension1);
    IntIndex rank = array->Rank(), i, j = 0;
    ArrayDimensionVector arrIndex, arrayLen, arraySlabLen;
    bool empty = false;
    IntIndex subRank = rank;
    if (numDimensionInputs != rank) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayIndex wrong number of dims");
        return THREAD_EXEC()->Stop();
    }
    for (i = 0; i < rank; ++i)
        if (ppDimensions[i] != nullptr)
            --subRank;
    bool noneWired = false;
    if (subRank == rank) {
        noneWired = true;
        --subRank;
    }
    for (i = 0; i < rank; ++i) {
        bool wired = (ppDimensions[i] != nullptr);
        IntIndex idx = 0;
        if (wired || (i == 0 && noneWired)) {
            idx = wired ? *ppDimensions[i] : 0;
            wired = true;
        } else {
            arraySlabLen[subRank-1-j] = array->SlabLengths()[rank-1-i];
        }

        IntIndex len = array->DimensionLengths()[rank-1-i];
        if (empty || idx < 0 || idx >= len) {
            idx = 0;
            len = 0;
        } else {
            len -= idx;
        }
        arrIndex[rank-1-i] = idx;
        if (!wired) {
            arrayLen[subRank-1-j] = len;
            ++j;
        }
        if (len == 0)
            empty = true;
    }
    for (; j < rank; ++j) {
        arraySlabLen[j] = j >= 1 ? arraySlabLen[j-1] : 0;
        arrayLen[j] = 1;
    }
    if (subRank > 0) {
        if (empty)
            arrayLen[subRank-1] = 0;
        TypedArrayCoreRef arrayOut = *(TypedArrayCoreRef*)_ParamImmediate(Element._pData);
        if (_ParamImmediate(Element._paramType)->BitEncoding() != kEncoding_Array
            || _ParamImmediate(Element._paramType)->Rank() != subRank) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayIndex bad output rank");
            return THREAD_EXEC()->Stop();
        }
        arrayOut->ResizeDimensions(subRank, arrayLen, false);
        if (!empty) {
            ArrayToArrayCopyHelper(array->ElementType(), arrayOut->BeginAt(0), arrayOut->SlabLengths(),
                                   array->BeginAtND(rank, arrIndex), arrayLen, arraySlabLen, subRank,
                                   rank, true);
        }
    } else {
        void *pData = array->BeginAtND(rank, arrIndex);
        if (!_ParamImmediate(Element._paramType)->IsA(array->ElementType())) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayIndex bad output type");
            return THREAD_EXEC()->Stop();
        }
        if (pData && !empty)
            array->ElementType()->CopyData(pData, _ParamImmediate(Element._pData));
        else
            array->ElementType()->InitData(_ParamImmediate(Element._pData));
    }
    return _NextInstruction();
}

#ifdef VIREO_TYPE_ArrayND
//------------------------------------------------------------
struct ArrayFillNDVParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamDef(void*, InitialValue);
    _ParamImmediateDef(IntIndex*, Dimension1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(ArrayFillNDV, ArrayFillNDVParamBlock)
{
    Int32 numDimensionInputs = ((_ParamVarArgCount() - 2));
    TypedArrayCoreRef array = _Param(ArrayOut);
    IntIndex **dimensions = _ParamImmediate(Dimension1);

    ArrayDimensionVector  tempDimensionLengths;
    for (IntIndex i = 0; i < numDimensionInputs; i++) {
        IntIndex* pDim = dimensions[i];
        tempDimensionLengths[i] = pDim ? *pDim : 0;
        if (tempDimensionLengths[i] < 0)
            tempDimensionLengths[i] = 0;
    }

    _Param(ArrayOut)->ResizeDimensions(numDimensionInputs, tempDimensionLengths, false);

    IntIndex totalLength = _Param(ArrayOut)->Length();
    TypeRef eltType = array->ElementType();
    eltType->MultiCopyData(_ParamPointer(InitialValue), array->RawBegin(), totalLength);

    return _NextInstruction();
}
//------------------------------------------------------------
struct ArrayIndexNDVParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, Array);
    _ParamDef(void*, Element);
    _ParamImmediateDef(IntIndex*, Dimension1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(ArrayIndexEltNDV, ArrayIndexNDVParamBlock)
{
    Int32 numDimensionInputs = ((_ParamVarArgCount() - 2));
    TypedArrayCoreRef array = _Param(Array);
    IntIndex **ppDimensions = _ParamImmediate(Dimension1);
    AQBlock1* pElement = array->BeginAtNDIndirect(numDimensionInputs, ppDimensions);
    TypeRef elementType = array->ElementType();

    if (pElement) {
        elementType->CopyData(pElement, _ParamPointer(Element));
    } else {
        elementType->InitData(_ParamPointer(Element));
    }
    return _NextInstruction();
}

// Indexing on 2d array, the row argument comes before column argument
// which is different from the indexing used in normal N dimension functions(e.g 0 d index,
// 1st d index, 3nd d index ...)
// Arguments: inputArray, row, column, outputElement/Array
VIREO_FUNCTION_SIGNATURE4(ArrayIndexElt2DV, TypedArrayCoreRef, void, void, void)
{
    TypedArrayCoreRef arrayIn = _Param(0);
    Boolean pickRow = false;
    Boolean pickCol = false;
    IntIndex row, col;
    IntIndex rank = 2;
    IntIndex* lengths = arrayIn->DimensionLengths();
    if (_ParamPointer(1) != nullptr) {
        row = *((IntIndex*)_ParamPointer(1));
        pickRow = true;
    } else {
        row = -1;
    }
    if (_ParamPointer(2) != nullptr) {
        col = *((IntIndex*)_ParamPointer(2));
        pickCol = true;
    } else {
        col = -1;
    }
    TypedArrayCoreRef arrayOut;
    if (pickCol && pickRow) {
        if (row >= 0 && row < lengths[1] && col >= 0 && col < lengths[0]) {
            IntIndex index2D[2];
            index2D[0] = col;
            index2D[1] = row;
            arrayIn->ElementType()->CopyData(arrayIn->BeginAtND(rank, index2D), _ParamPointer(3));
        }
    } else {
        IntIndex index2D[2];
        arrayOut =  *((TypedArrayCoreRef*)_ParamPointer(3));
        if (pickCol) {
            if (col >= 0 && col < lengths[0]) {
                arrayOut->Resize1D(lengths[1]);
                index2D[0] = col;
                for (IntIndex i = 0; i < arrayOut->Length(); i++) {
                    index2D[1] = i;
                    arrayOut->ElementType()->CopyData(arrayIn->BeginAtND(rank, index2D), arrayOut->BeginAt(i));
                }
            }
        } else {
            if (!pickRow) { row = 0;}
            if (row >= 0 && row < lengths[1]) {
                arrayOut->Resize1D(lengths[0]);
                index2D[1] = row;
                for (IntIndex i = 0; i < arrayOut->Length(); i++) {
                    index2D[0] = i;
                    arrayOut->ElementType()->CopyData(arrayIn->BeginAtND(rank, index2D), arrayOut->BeginAt(i));
                }
            }
        }
    }
    return _NextInstruction();
}

//------------------------------------------------------------
struct ArrayReplaceNDVParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamDef(TypedArrayCoreRef, ArrayIn);
    _ParamDef(void*, Element);
    _ParamImmediateDef(IntIndex*, Dimension1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(ArrayReplaceEltNDV, ArrayReplaceNDVParamBlock)
{
    Int32 numDimensionInputs = ((_ParamVarArgCount() - 3));
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    IntIndex **ppDimensions = _ParamImmediate(Dimension1);

    if (arrayOut != arrayIn) {
        // To copy the full array the CopyData method gets a pointer to the ArrayRef.
        arrayIn->Type()->CopyData(_ParamPointer(ArrayIn), _ParamPointer(ArrayOut));
    }

    AQBlock1* pElement = arrayOut->BeginAtNDIndirect(numDimensionInputs, ppDimensions);
    TypeRef elementType = arrayIn->ElementType();

    if (pElement) {
        elementType->CopyData(_ParamPointer(Element), pElement);
    }
    return _NextInstruction();
}
#endif
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(ArrayIndexElt, TypedArrayCoreRef, IntIndex, void)
{
    TypedArrayCoreRef array = _Param(0);
    IntIndex    length = array->Length();
    TypeRef     elementType = array->ElementType();
    IntIndex    index = _Param(1);

    if (_ParamPointer(2)) {
        if (index < 0 || index >= length) {
            elementType->InitData(_ParamPointer(2));
        } else {
            elementType->CopyData(array->BeginAt(index), _ParamPointer(2));
        }
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayAppendElt, TypedArrayCoreRef, void)
{
    TypedArrayCoreRef array = _Param(0);
    array->Insert1D(array->Length(), 1, _ParamPointer(1));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArrayReplaceElt, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, void)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    TypeRef     elementType = arrayOut->ElementType();
    IntIndex    index = _Param(2);
    IntIndex    length = arrayIn->Length();

    if (arrayOut != arrayIn) {
        arrayIn->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));
    }

    if (index >= 0 && index < length) {
        void* pDest = arrayOut->BeginAt(index);
        elementType->CopyData(_ParamPointer(3), pDest);
    }

    return _NextInstruction();
}

//------------------------------------------------------------
// arguments: output array, input array, index1, newElement1/subarray1(, indexk, newElementk/subarrayk)
struct ArrayReplaceSubsetParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamDef(TypedArrayCoreRef, ArrayIn);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

// ArrayReplaceSubset function for 1d array, support multiple inputs
VIREO_FUNCTION_SIGNATUREV(ArrayReplaceSubset, ArrayReplaceSubsetParamBlock)
{
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    StaticTypeAndData *arguments =  _ParamImmediate(argument1);
    Int32 count = (_ParamVarArgCount() -2)/2;
    Int32 i = 0;
    if (arrayOut != arrayIn) {
        // To copy the full array the CopyData method gets a pointer to the ArrayRef.
        arrayIn->Type()->CopyData(&arrayIn, &arrayOut);
    }
    IntIndex idx = -1;
    while (i < count) {
        TypeRef argType = arguments[i]._paramType;
        if (arguments[i]._pData != nullptr) {
            idx = (IntIndex) ReadIntFromMemory(argType, arguments[i]._pData);
        } else {
            idx >= 0? idx++ : idx = 0;
        }
        i++;
        TypedArrayCoreRef subArray = nullptr;
        void* element = arguments[i]._pData;
        argType = arguments[i]._paramType;
        // whether the input is single element or not. The argType needn't to be flat to specify single element
        // e.g. string type
        if (!argType->IsA(arrayIn->ElementType())) {
            subArray = *(TypedArrayCoreRef*)arguments[i]._pData;
        }
        i++;
        if (arrayOut == subArray) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayReplaceSubset inplace");
            return THREAD_EXEC()->Stop();
        }

        if (idx >= 0 && idx < arrayOut->Length()) {
            if (subArray != nullptr) {
                IntIndex length = Min(subArray->Length(), arrayOut->Length() - idx);
                arrayIn->ElementType()->CopyData(subArray->BeginAt(0), arrayOut->BeginAt(idx), length);
            } else {
                arrayIn->ElementType()->CopyData(element, arrayOut->BeginAt(idx), 1);
            }
        }
    }
    return _NextInstruction();
}

// Function called by ArrayReplaceSubset2DV for each pair of input.
// Arguments: output array, input array, newElem/newArray, row, column, rankofthenewElem.
// elemRank specify the rank of the input element. in this case (2D input), it can only be 1 or 0.
void replace2dArray(TypedArrayCoreRef arrayOut, TypedArrayCoreRef arrayIn, void* newElem,
                    IntIndex row, IntIndex col, IntIndex elemRank)
{
    IntIndex rank = arrayOut->Rank();
    IntIndex* lengths = arrayIn->DimensionLengths();
    if (elemRank == 1) {
        TypedArrayCoreRef subArray = (TypedArrayCoreRef)newElem;
        IntIndex index2D[2];
        if (col >= 0) {
             if (col < lengths[0]) {
                 index2D[0] = col;
                 int l = lengths[1];
                 if (l > subArray->Length()) { l = subArray->Length(); }
                 for (IntIndex i = 0; i < l; i++) {
                     index2D[1] = i;
                     arrayOut->ElementType()->CopyData(subArray->BeginAt(i), arrayOut->BeginAtND(rank, index2D));
                 }
             }
         } else {
             if (row < -1) { row = 0;}
             if (row < lengths[1]) {
                 index2D[1] = row;
                 int l = lengths[0];
                 if (l > subArray->Length()) { l = subArray->Length(); }
                 for (IntIndex i = 0; i < l; i++) {
                     index2D[0] = i;
                     arrayOut->ElementType()->CopyData(subArray->BeginAt(i), arrayOut->BeginAtND(rank, index2D));
                 }
             }
         }
    } else {
        IntIndex index[2];
        index[0] = col;
        index[1] = row;
        if (index[0] >= 0 && index[0] < lengths[0] \
                && index[1] >= 0 && index[1] < lengths[1]) {
            arrayOut->ElementType()->CopyData(newElem, arrayOut->BeginAtND(rank, index));
        }
    }
}

// ArrayReplaceSubset function for 2d array, the function can be used to replace a single element, a row or a column
// This function is obsoleted by prim ArrayReplaceSubset, implemented by ArrayReplaceSubsetND
VIREO_FUNCTION_SIGNATUREV(ArrayReplaceSubset2DV, ArrayReplaceSubsetParamBlock)
{
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    StaticTypeAndData *arguments =  _ParamImmediate(argument1);
    Int32 count = (_ParamVarArgCount() -2)/2;
    Int32 i = 0;
    if (arrayOut != arrayIn) {
       arrayIn->Type()->CopyData(&arrayIn, &arrayOut);
    }
    IntIndex row = -1;
    IntIndex col = -1;

    while (i < count) {
        Boolean wireRow = false;
        Boolean wireCol = false;
        TypeRef argType = arguments[i]._paramType;
        if (arguments[i]._pData != nullptr) {
            row = *((IntIndex*)arguments[i]._pData);
            wireRow = true;
        } else {
            row >= 0? row++ : row = 0;
        }

        i++;
        argType = arguments[i]._paramType;
        if (arguments[i]._pData != nullptr) {
            col = *((IntIndex*)arguments[i]._pData);
            wireCol = true;
        } else {
            col >= 0? col++ : col = 0;
        }

        i++;
        TypedArrayCoreRef subArray = nullptr;
        void* element = arguments[i]._pData;
        argType = arguments[i]._paramType;

        if (!argType->IsA(arrayIn->ElementType())) {
            subArray = *(TypedArrayCoreRef*)arguments[i]._pData;
            // if no index wired, column becomes disabled
            if (!wireCol) {col = -1;}
            replace2dArray(arrayOut, arrayIn, subArray, row, col, 1);
        } else {
            if (!wireRow && !wireCol) {row > 0? row-- : row = 0;}
            replace2dArray(arrayOut, arrayIn, element, row, col, 0);
        }
        i++;
    }
    return _NextInstruction();
}

// ArrayReplaceSubset function for N-D array, the function can be used to replace a single element or any sub-array
// by leaving the appropriate indexes unwired (*)
VIREO_FUNCTION_SIGNATUREV(ArrayReplaceSubsetND, ArrayReplaceSubsetParamBlock)
{
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    IntIndex rank = arrayOut->Rank();
    if (rank == 1)
        return ArrayReplaceSubset(_this);

    StaticTypeAndData *arguments =  _ParamImmediate(argument1);
    Int32 count = (_ParamVarArgCount()-2)/2;
    Int32 i = 0, j = 0;
    if (arrayOut != arrayIn) {
        arrayIn->Type()->CopyData(&arrayIn, &arrayOut);
    }
    ArrayDimensionVector arrIndex, subArrayLen, arrayOutSlabLengths;
    bool empty = false;
    if (rank < 2 || count != rank+1) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayReplaceSubset wrong number of index args");
        return THREAD_EXEC()->Stop();
    }
    IntIndex expectedElemRank = rank;
    for (i = 0; i < rank; ++i)
        if (arguments[i]._pData != nullptr)
            --expectedElemRank;
    bool noneWired = false;
    if (expectedElemRank == rank) {
        noneWired = true;
        --expectedElemRank;
    }
    for (i = 0; i < rank; ++i) {
        bool wired = (arguments[i]._pData != nullptr);
        IntIndex idx = 0;
        if (wired || (i == 0 && noneWired)) {
            idx = wired ? *(IntIndex*)arguments[i]._pData : 0;
        } else {
            arrayOutSlabLengths[expectedElemRank-1-j] = arrayOut->SlabLengths()[rank-1-i];
            ++j;
        }

        // Coerce index to non-negative integer
        idx = Max(idx, 0);
        // Calculate count from idx to end of array
        IntIndex len = arrayOut->DimensionLengths()[rank-1-i];
        idx = Min(idx, len);
        len -= idx;
        arrIndex[rank-1-i] = idx;
        if (len == 0)
            empty = true;
    }
    for (; j < rank; ++j) {
        arrayOutSlabLengths[j] = j >= 1 ? arrayOutSlabLengths[(j-1)] : 0;
    }
    void* element = arguments[i]._pData;
    IntIndex srcRank =  arguments[i]._paramType->Rank();
    if (srcRank != expectedElemRank) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayReplaceSubset bad elem rank");
        return THREAD_EXEC()->Stop();
    }
    if (!empty) {
        bool badType = false;
        if (srcRank > 0) {
            TypedArrayCoreRef subArray = *(TypedArrayCoreRef*)element;
            if (!arrayOut->ElementType()->IsA(subArray->ElementType())) {
                badType = true;
            } else {
                AQBlock1 *srcData = subArray->BeginAt(0);
                j = expectedElemRank-1;
                for (i = 0; i < rank; ++i) {
                    bool wired = (arguments[i]._pData != nullptr);
                    if (!(wired || (i == 0 && noneWired))) {
                        subArrayLen[j] = subArray->DimensionLengths()[j];
                        if (subArrayLen[j] > arrayOut->DimensionLengths()[rank-1-i])
                            subArrayLen[j] = arrayOut->DimensionLengths()[rank-1-i];
                        --j;
                    }
                }
                AQBlock1 *pData = arrayOut->BeginAtND(rank, arrIndex);
                if (pData)
                    ArrayToArrayCopyHelper(arrayOut->ElementType(), pData, arrayOutSlabLengths,
                                       srcData, subArrayLen, subArray->SlabLengths(), arrayOut->Rank(), srcRank, true);
            }
        } else {
            TypeRef argType = arguments[i]._paramType;
            if (!argType->IsA(arrayOut->ElementType())) {
                badType = true;
            } else {
                AQBlock1 *srcData = (AQBlock1*)element;
                AQBlock1 *pData = arrayOut->BeginAtND(rank, arrIndex);
                if (pData)
                    arrayOut->ElementType()->CopyData(srcData, pData);
            }
        }
        if (badType) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayReplaceSubset bad elem type");
            return THREAD_EXEC()->Stop();
        }
    }
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArraySubset, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    IntIndex idx = (_ParamPointer(2) != nullptr) ? _Param(2) : 0;
    // Coerce index to non-negative integer
    idx = Max(idx, 0);

    if (arrayOut == arrayIn && idx != 0) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArraySubset inplace");
        return THREAD_EXEC()->Stop();
    }

    // Calculate count from idx to end of array
    IntIndex maxLen = arrayIn->Length() - idx;
    maxLen = Max(maxLen, 0);

    IntIndex len = (_ParamPointer(3) != nullptr) ? _Param(3) : maxLen;
    len = Max(len, 0);
    len = Min(len, maxLen);
    arrayOut->Resize1D(len);
    if (idx < arrayIn->Length() && arrayOut != arrayIn) {
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(idx), arrayOut->BeginAt(0), len);
    }
    return _NextInstruction();
}

//
//------------------------------------------------------------
struct IndexAndLength {
    IntIndex *idx;
    IntIndex *len;
};

struct ArraySubsetNDParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamDef(TypedArrayCoreRef, ArrayIn);
    _ParamImmediateDef(IndexAndLength, arg[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(ArraySubsetND, ArraySubsetNDParamBlock)
{
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    Int32 count = (_ParamVarArgCount()-2)/2;
    Int32 i;
    ArrayDimensionVector tempDimensionLengths;
    Int32 rank = arrayOut->Rank();
    bool empty = false;
    if (rank < 2 || count != rank) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArraySubset wrong number of index/length args");
        return THREAD_EXEC()->Stop();
    }
    for (i = 0; i < rank; ++i) {
        IntIndex idx = (_ParamImmediate(arg[i].idx) != nullptr) ? *_ParamImmediate(arg[i].idx) : 0;

        // Coerce index to non-negative integer
        idx = Max(idx, 0);
        if (arrayOut == arrayIn && idx != 0) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArraySubset inplace");
            return THREAD_EXEC()->Stop();
        }

        // Calculate count from idx to end of array
        IntIndex maxLen = arrayIn->DimensionLengths()[rank-1-i] - idx;
        maxLen = Max(maxLen, 0);

        IntIndex len = (_ParamImmediate(arg[i].len) != nullptr) ? *_ParamImmediate(arg[i].len) : maxLen;
        len = Max(len, 0);
        len = Min(len, maxLen);

        tempDimensionLengths[rank-1-i] = len;
        tempDimensionLengths[count+rank-1-i] = idx;
        if (len == 0)
            empty = true;
    }
    arrayOut->ResizeDimensions(rank, tempDimensionLengths, false);
    if (!empty && arrayOut != arrayIn) {
        ArrayToArrayCopyHelper(arrayOut->ElementType(), arrayOut->BeginAt(0), arrayOut->SlabLengths(),
                               arrayIn->BeginAtND(rank, tempDimensionLengths+rank), tempDimensionLengths,
                               arrayIn->SlabLengths(), arrayOut->Rank(), arrayIn->Rank());
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArrayInsertElt, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, void)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    IntIndex length = arrayIn->Length();
    IntIndex index = (_ParamPointer(2) != nullptr) ? _Param(2) : length;

    if (arrayOut != arrayIn)
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));

    if (0 <= index && index <= length)
        arrayOut->Insert1D(index, 1, _ParamPointer(3));

    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(ArrayInsertSubsetND, TypedArrayCoreRef, TypedArrayCoreRef,
                          IntIndex, IntIndex, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    IntIndex rankIdx = (_ParamPointer(3) != nullptr) ? _Param(3) : 0;
    IntIndex idx = (_ParamPointer(2) != nullptr) ? _Param(2) : arrayIn->DimensionLengths()[arrayIn->Rank()-1-rankIdx];

    TypedArrayCoreRef subArray = _Param(4);

    if (arrayOut == subArray) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayInsertSubset inplace");
        return THREAD_EXEC()->Stop();
    }

    if (arrayIn->Rank() == 1) {
        IntIndex arrayInLength = arrayIn->Length();
        IntIndex subArrayLength = subArray->Length();
        if (0 > idx && idx > arrayInLength) {
            arrayOut->Type()->CopyData(&arrayIn, &arrayOut);
        } else if (arrayOut == arrayIn) {
            arrayOut->Insert1D(idx, subArrayLength, subArray->BeginAt(0));
        } else {
            arrayOut->Resize1D(arrayInLength + subArrayLength);

            // Copy the original array up to the insert point
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(0),
                                              arrayOut->BeginAt(0),
                                              idx);

            // Copy the inserted subarray
            arrayOut->ElementType()->CopyData(subArray->BeginAt(0),
                                              arrayOut->BeginAt(idx),
                                              subArrayLength);

            // Copy the rest of the original array.
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(idx),
                                              arrayOut->BeginAt(idx + subArrayLength),
                                              arrayInLength - idx);
        }
    } else {
        if (arrayOut != arrayIn)
            arrayOut->Type()->CopyData(&arrayIn, &arrayOut);
        Int32 elementSize = arrayOut->ElementType()->TopAQSize();
        IntIndex startIndex = idx;
        IntIndex dimensionToInsert = rankIdx;
        IntIndex numberOfDimensions = arrayOut->Rank();
        if (dimensionToInsert < 0 || dimensionToInsert >= numberOfDimensions) {
            return _NextInstruction();
        }
        IntIndex insertedPortionLength = subArray->Rank() == numberOfDimensions ?
                            subArray->GetLength(numberOfDimensions-1-dimensionToInsert) : 1;
        if (insertedPortionLength <= 0 || startIndex < 0) {
            return _NextInstruction();
        }

        ArrayDimensionVector index, dimensionSize, newLengths, sourceDimLen, sourceSlabLen;
        size_t totalNumberOfElements = 1;
        for (Int32 i = 0, j = 0; i < numberOfDimensions; ++i) {
            newLengths[i] = arrayOut->DimensionLengths()[i];
            dimensionSize[i] = arrayOut->DimensionLengths()[numberOfDimensions-1-i];
            if (numberOfDimensions == subArray->Rank()) {
                sourceSlabLen[i] = subArray->SlabLengths()[i];
                sourceDimLen[i] = subArray->DimensionLengths()[i];
                if (numberOfDimensions-1-i != dimensionToInsert && sourceDimLen[i] > newLengths[i])
                    sourceDimLen[i] = newLengths[i];
            } else {
                if (i == numberOfDimensions-1-dimensionToInsert) {
                    sourceSlabLen[i] = subArray->SlabLengths()[j];
                    sourceDimLen[i] = 1;
                } else {
                    sourceSlabLen[i] = subArray->SlabLengths()[j];
                    sourceDimLen[i] = subArray->DimensionLengths()[j];
                    if (sourceDimLen[i] > newLengths[i])
                        sourceDimLen[i] = newLengths[i];
                    ++j;
                }
            }
            totalNumberOfElements *= dimensionSize[i];
        }
        if (startIndex > dimensionSize[dimensionToInsert]) {
            return _NextInstruction();
        }
        newLengths[numberOfDimensions-1-dimensionToInsert] += insertedPortionLength;
        arrayOut->ResizeDimensions(numberOfDimensions, newLengths, true);

        dimensionSize[dimensionToInsert] += insertedPortionLength;
        size_t totalNumberOfElementsAfterInsertion = 1;
        for (Int32 i = 0; i < numberOfDimensions; ++i) {
            index[i] = dimensionSize[i]-1;
            totalNumberOfElementsAfterInsertion *= dimensionSize[i];
        }
        if (totalNumberOfElements) {
            AQBlock1 *arrayPtr, *sourcePtr, *destinationPtr;
            arrayPtr = arrayOut->BeginAt(0);
            sourcePtr = arrayPtr + totalNumberOfElements * elementSize;
            destinationPtr = arrayPtr + totalNumberOfElementsAfterInsertion * elementSize;
            Int32 numberOfElementsInInsertedDimension = 1;
            for (Int32 i = dimensionToInsert + 1; i < numberOfDimensions; ++i)
                numberOfElementsInInsertedDimension *= dimensionSize[i];

            // startIndex cannot be < 0 (we would have returned an error), but can be == 0
            size_t numberOfElementsBeforeInserted = startIndex * numberOfElementsInInsertedDimension;
            size_t bytesBeforeInserted = numberOfElementsBeforeInserted * elementSize;
            size_t numberOfElementsToBeInserted = insertedPortionLength * numberOfElementsInInsertedDimension;
            size_t bytesToBeInserted = numberOfElementsToBeInserted * elementSize;
            size_t numberOfElementsAfterInserted = 0;
            size_t bytesAfterInserted = 0;
            if (dimensionSize[dimensionToInsert] > (startIndex + insertedPortionLength)) {
                numberOfElementsAfterInserted = (dimensionSize[dimensionToInsert]
                    - (startIndex + insertedPortionLength)) * numberOfElementsInInsertedDimension;
                bytesAfterInserted = numberOfElementsAfterInserted * elementSize;
            }
            Int32 currentDimension;
            do {
                if (bytesAfterInserted)
                    memmove(destinationPtr -= bytesAfterInserted, sourcePtr -= bytesAfterInserted, bytesAfterInserted);
                memset(destinationPtr -= bytesToBeInserted, 0, bytesToBeInserted);
                if (bytesBeforeInserted) {
                    memmove(destinationPtr -= bytesBeforeInserted,
                            sourcePtr -= bytesBeforeInserted,  bytesBeforeInserted);
                }
                currentDimension = dimensionToInsert;
                while (--currentDimension >= 0 && index[currentDimension]-- == 0)
                    index[currentDimension] = dimensionSize[currentDimension]-1;
            } while (currentDimension >= 0);
            ArrayToArrayCopyHelper(arrayOut->ElementType(),
                 arrayOut->RawBegin()+startIndex*arrayOut->SlabLengths()[numberOfDimensions-1-dimensionToInsert],
                 arrayOut->SlabLengths(), subArray->BeginAt(0), sourceDimLen, sourceSlabLen,
                                   numberOfDimensions, numberOfDimensions, true);
if (destinationPtr != arrayPtr) {
                THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayInsert wild ptr!");
                return THREAD_EXEC()->Stop();
            }
        }
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArrayInsertSubset, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    IntIndex arrayInLength = arrayIn->Length();

    IntIndex idx = (_ParamPointer(2) != nullptr) ? _Param(2) : arrayInLength;

    TypedArrayCoreRef subArray = _Param(3);
    IntIndex subArrayLength = subArray->Length();
    if (arrayOut->Rank() != 1) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError,
                                "ArrayInsertSubset needs dimNum arg for 2-D or higher arrays");
        return THREAD_EXEC()->Stop();
    }
    if (arrayOut == subArray) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayInsertSubset inplace");
        return THREAD_EXEC()->Stop();
    }

    if (0 <= idx && idx <= arrayInLength) {
        if (arrayOut == arrayIn) {
            arrayOut->Insert1D(idx, subArrayLength, subArray->BeginAt(0));
        } else {
            arrayOut->Resize1D(arrayInLength + subArrayLength);

            // Copy the original array up to the insert point
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(0),
                                              arrayOut->BeginAt(0),
                                              idx);
            // Copy the inserted subarray
            arrayOut->ElementType()->CopyData(subArray->BeginAt(0),
                                              arrayOut->BeginAt(idx),
                                              subArrayLength);
            // Copy the rest of the original array.
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(idx),
                                              arrayOut->BeginAt(idx + subArrayLength),
                                              arrayInLength - idx);
        }
    } else if (arrayOut != arrayIn) {
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));
    }
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayReverse, TypedArrayCoreRef, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    IntIndex arrayInLength = arrayIn->Length();

    if (arrayOut == arrayIn) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayReverse inplace");
        return THREAD_EXEC()->Stop();
    }

    arrayOut->Resize1D(arrayInLength);
    for (IntIndex i = 0; i < arrayInLength; i++)
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(i), arrayOut->BeginAt(arrayInLength - 1 - i));

    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(ArrayRotate, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    IntIndex offset = _Param(2);

    if (arrayOut == arrayIn) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayRotate inplace");
        return THREAD_EXEC()->Stop();
    }

    IntIndex arrayInLength = arrayIn->Length();
    arrayOut->Resize1D(arrayInLength);

    if (arrayInLength > 0) {
        offset = offset % arrayInLength;
        if (offset < 0)
            offset += arrayInLength;

        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(0), arrayOut->BeginAt(offset), arrayInLength - offset);
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(arrayInLength - offset), arrayOut->BeginAt(0), offset);
    }

    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArraySplit, TypedArrayCoreRef, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex)
{
    TypedArrayCoreRef array1st = _Param(0);
    TypedArrayCoreRef array2nd = _Param(1);
    TypedArrayCoreRef arrayIn = _Param(2);
    IntIndex index = _Param(3);
    IntIndex length1 = 0;
    IntIndex length2 = arrayIn->Length();
    if (index < 0) {
        index = 0;
        length1 = 0;
    } else if (index >= arrayIn->Length()) {
        index = arrayIn->Length();
        length1 = length2;
        length2 = 0;
    } else {
        length1 = index;
        length2 = length2 - index;
    }
    array1st->Resize1D(length1);
    if (length1 > 0) {
        array1st->ElementType()->CopyData(arrayIn->BeginAt(0), array1st->BeginAt(0), length1);
    }
    array2nd->Resize1D(length2);
    if (length2 > 0) {
        array2nd->ElementType()->CopyData(arrayIn->BeginAt(index), array2nd->BeginAt(0), length2);
    }
    return _NextInstruction();
}

struct Sort1DArrayInstruction : public InstructionCore
{
    _ParamDef(TypedArrayCoreRef, OutArray);
    _ParamDef(TypedArrayCoreRef, InArray);
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next() const { return this->_piNext; }
};
// Emit the sort instruction for specific type
//------------------------------------------------------------
InstructionCore* EmitSortInstruction(ClumpParseState* pInstructionBuilder)
{
    ConstCStr pSortOpName = "Sort1DArrayInternal";
    SubString sortOpToken(pSortOpName);

    pInstructionBuilder->ReresolveInstruction(&sortOpToken);
    InstructionCore* pInstruction = nullptr;
    TypedArrayCoreRef arrayArg = *(TypedArrayCoreRef*)pInstructionBuilder->_argPointers[0];
    TypeRef elementType = arrayArg->ElementType();
    SubString LTName("IsLTSort");
    // Add param slot to hold the snippet
    Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
    Sort1DArrayInstruction* sortOp = (Sort1DArrayInstruction*) pInstructionBuilder->EmitInstruction();
    pInstruction = sortOp;
    TypeRef booleanType = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsBooleanType);

    ClumpParseState snippetBuilder(pInstructionBuilder);
    pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, sortOp, snippetArgId);
    snippetBuilder.EmitInstruction(&LTName, 3, elementType, nullptr, elementType, nullptr, booleanType, nullptr);

    pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
    pInstructionBuilder->RecordNextHere(&sortOp->_piNext);

    return pInstruction;
}

struct comparator
{
 private:
    Instruction3<void, void, Boolean>* _snippet;
 public:
    explicit comparator(Instruction3<void, void, Boolean>* snippet) {_snippet = snippet;}
    bool operator()(AQBlock1* i, AQBlock1* j) const {
        Boolean less = false;
        _snippet->_p0 = i;
        _snippet->_p1 = j;
        _snippet->_p2 = &less;
        _PROGMEM_PTR(_snippet, _function)(_snippet);
        return less;
    }
};

// using the stl vector and sort algorithm to sort the array. the compare function is defined above
VIREO_FUNCTION_SIGNATURET(Sort1DArrayInternal, Sort1DArrayInstruction)
{
    TypedArrayCoreRef arrayOut = _Param(OutArray);
    TypedArrayCoreRef arrayIn = _Param(InArray);
    Instruction3<void, void, Boolean>* snippet = (Instruction3<void, void, Boolean>*)_ParamMethod(Snippet());
    IntIndex len = arrayIn->Length();
    arrayOut->Resize1D(len);
    std::vector<AQBlock1*> myVector;
    AQBlock1* base = arrayIn->BeginAt(0);
    Int32 elementSize = arrayIn->ElementType()->TopAQSize();
    for (IntIndex i = 0; i < len; i++) {
        myVector.push_back(base);
        base += elementSize;
    }
    comparator myComparator(snippet);
    std::vector<AQBlock1*>::iterator it;
    std::sort(myVector.begin(), myVector.end(), myComparator);
    IntIndex i = 0;
    for (it = myVector.begin(); it != myVector.end(); it++) {
        AQBlock1* element = *it;
        arrayOut->ElementType()->CopyData(element, arrayOut->BeginAt(i));
        i++;
    }
    return _NextInstruction();
}

struct FindArrayMaxMinInstruction : public InstructionCore
{
    _ParamDef(TypedArrayCoreRef, InArray);
    _ParamDef(void, MaxValue);
    union {
        _ParamDef(IntIndex, MaxIndex);
        _ParamDef(TypedArrayCoreRef, MaxIndexArr);
    };
    _ParamDef(void, MinValue);
    union {
        _ParamDef(IntIndex, MinIndex);
        _ParamDef(TypedArrayCoreRef, MinIndexArr);
    };
    _ParamImmediateDef(InstructionCore*, Next);
    inline InstructionCore* Snippet()   { return this + 1; }
    inline InstructionCore* Next() const { return this->_piNext; }
};

InstructionCore* EmitMaxMinInstruction(ClumpParseState* pInstructionBuilder)
{
    TypedArrayCoreRef arrayArg = *(TypedArrayCoreRef*)pInstructionBuilder->_argPointers[0];
    ConstCStr pMaxMinOpName = arrayArg->Rank() > 1 ? "ArrayMaxMinInternal" : "ArrayMaxMinInternal";
    SubString findMaxMinOpToken(pMaxMinOpName);

    pInstructionBuilder->ReresolveInstruction(&findMaxMinOpToken);
    InstructionCore* pInstruction = nullptr;
    TypeRef elementType = arrayArg->ElementType();
    SubString LTName("IsLT");
    // Add param slot to hold the snippet
    Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
    FindArrayMaxMinInstruction* findOp = (FindArrayMaxMinInstruction*)pInstructionBuilder->EmitInstruction();
    pInstruction = findOp;
    TypeRef booleanType = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsBooleanType);

    ClumpParseState snippetBuilder(pInstructionBuilder);
    pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, findOp, snippetArgId);
    snippetBuilder.EmitInstruction(&LTName, 3, elementType, nullptr, elementType, nullptr, booleanType, nullptr);

    pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
    pInstructionBuilder->RecordNextHere(&findOp->_piNext);
    return pInstruction;
}

VIREO_FUNCTION_SIGNATURET(ArrayMaxMinInternal, FindArrayMaxMinInstruction)
{
    TypedArrayCoreRef arrayIn = _Param(InArray);
    Instruction3<void, void, Boolean>* snippet = (Instruction3<void, void, Boolean>*)_ParamMethod(Snippet());
    Int32 numDims = arrayIn->Rank();
    IntIndex len = arrayIn->Length();
    IntIndex maxIndex = 0, minIndex = 0;
    AQBlock1* minValue = arrayIn->BeginAt(0);
    AQBlock1* maxValue = minValue;
    if (len == 0) {
        maxIndex = minIndex = -1;
    } else {
        if (arrayIn->ElementType()->IsFloat()) {
            maxIndex = minIndex = -1;
            if (arrayIn->ElementType()->TopAQSize() == sizeof(Double)) {
                for (IntIndex i = 0; i < len; ++i) {
                    minValue = arrayIn->BeginAt(i);
                    if (!std::isnan(*(Double*)minValue)) {
                        maxIndex = minIndex = i;
                        maxValue = minValue;
                        break;
                    }
                }
            } else {
                for (IntIndex i = 0; i < len; ++i) {
                    minValue = arrayIn->BeginAt(i);
                    if (!std::isnan(*(Single*)minValue)) {
                        maxIndex = minIndex = i;
                        maxValue = minValue;
                        break;
                    }
                }
            }
        }
    }

    for (IntIndex i = 0; i < len; i++) {
        Boolean shouldUpdateMaxOrMin = false;
        AQBlock1* currentElement = arrayIn->BeginAt(i);
        snippet->_p0 = currentElement;
        snippet->_p1 = minValue;
        snippet->_p2 = &shouldUpdateMaxOrMin;
        _PROGMEM_PTR(snippet, _function)(snippet);
        if (shouldUpdateMaxOrMin) {
            minValue = currentElement;
            minIndex = i;
        }

        snippet->_p0 = maxValue;
        snippet->_p1 = currentElement;
        snippet->_p2 = &shouldUpdateMaxOrMin;
        _PROGMEM_PTR(snippet, _function)(snippet);
        if (shouldUpdateMaxOrMin) {
            maxValue = currentElement;
            maxIndex = i;
        }
    }

    if (len && maxIndex != -1) {
        arrayIn->ElementType()->CopyData(minValue, _ParamPointer(MinValue));
        arrayIn->ElementType()->CopyData(maxValue, _ParamPointer(MaxValue));
    } else {
        arrayIn->ElementType()->InitData(_ParamPointer(MinValue));
        arrayIn->ElementType()->InitData(_ParamPointer(MaxValue));
    }

    if (numDims == 1) {
        _Param(MinIndex) = minIndex;
        _Param(MaxIndex) = maxIndex;
    } else {
        ArrayDimensionVector  tempDimensionLengths;
        tempDimensionLengths[0] = numDims;
        _Param(MinIndexArr)->ResizeDimensions(1, tempDimensionLengths, false);
        _Param(MaxIndexArr)->ResizeDimensions(1, tempDimensionLengths, false);
        for (IntIndex i = 0; i < numDims; ++i) {
            IntIndex curDimSize = (i == numDims - 1) ? 1 : arrayIn->GetLength(numDims-1-i-1);
            IntIndex *minIndexPtr = (IntIndex*)_Param(MinIndexArr)->BeginAt(i);
            IntIndex *maxIndexPtr = (IntIndex*)_Param(MaxIndexArr)->BeginAt(i);

            if (minIndex >= 0) {
                *minIndexPtr = minIndex / curDimSize;
                minIndex -= *minIndexPtr * curDimSize;
            } else {
                *minIndexPtr = minIndex;
            }

            if (maxIndex >= 0) {
                *maxIndexPtr = maxIndex / curDimSize;
                maxIndex -= *maxIndexPtr * curDimSize;
            } else {
                *maxIndexPtr = maxIndex;
            }
        }
    }
    return _NextInstruction();
}
// NOLINT(runtime/references)
static void CopySubArray(AQBlock1* &sourcePtr, AQBlock1* &destinationPtr,  // NOLINT(runtime/references)
                        const size_t elementsToCopy, TypedArrayCoreRef arraySource, TypedArrayCoreRef arrayDest)
{
    NIError err = kNIError_Success;
    TypeRef elementType = arraySource->ElementType();
    if (elementType->IsFlat()) {
        if (elementsToCopy) {
            size_t bytesToCopy = elementsToCopy * elementType->TopAQSize();
            if (destinationPtr) {
                memmove(destinationPtr, sourcePtr, bytesToCopy);
                sourcePtr += bytesToCopy, destinationPtr += bytesToCopy;
            } else {
                sourcePtr += bytesToCopy;
            }
        }
    } else {
        IntIndex stride = elementType->TopAQSize();
        IntIndex count = elementsToCopy;
        for (Int32 i = 0; i < count; i++) {
            err = elementType->CopyData(sourcePtr, destinationPtr);
            if (err != kNIError_Success) {
                arrayDest->Resize1D(0);
                break;
            }
            sourcePtr += stride;
            destinationPtr += stride;
        }
    }
}

// ArrayDeleteND function, can delete one or multiple rows, columns, pages, etc. in an ND Array
VIREO_FUNCTION_SIGNATURE7(ArrayDeleteND, TypedArrayCoreRef, StaticType, void,
                          TypedArrayCoreRef, IntIndex, IntIndex, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(3);
    IntIndex numberOfDimensions = arrayOut->Rank();
    TypeRef deletedPartType = _ParamPointer(1);
    IntIndex deletedPortionLength = (_ParamPointer(4) == nullptr)? 1 : _Param(4);
    IntIndex dimensionToDelete = (_ParamPointer(6) == nullptr)? 0 : _Param(6);
    if (dimensionToDelete < 0 || dimensionToDelete >= numberOfDimensions) {
        dimensionToDelete = 0;
        deletedPortionLength = 0;
    }
    IntIndex lengthOfArrayDimensionToDelete = arrayIn->GetLength(numberOfDimensions-1-dimensionToDelete);

    IntIndex offset = (_ParamPointer(5) == nullptr) ?
        lengthOfArrayDimensionToDelete - deletedPortionLength : _Param(5);
    if (offset > lengthOfArrayDimensionToDelete) {
        offset = lengthOfArrayDimensionToDelete;
    }
    Int32 rank = arrayIn->Rank();

    IntIndex startIndex = offset > 0 ? offset : 0;
    IntIndex endIndex = (offset + deletedPortionLength > lengthOfArrayDimensionToDelete) ?
        lengthOfArrayDimensionToDelete : offset + deletedPortionLength;
    if (endIndex - startIndex < deletedPortionLength) {
        deletedPortionLength = endIndex - startIndex;
    }

    if (endIndex < startIndex) {
        endIndex = startIndex;
    }
    IntIndex arrayOutLength = lengthOfArrayDimensionToDelete - (endIndex - startIndex);
    if (rank == 1) {
        arrayOut->Resize1D(arrayOutLength);
        if (startIndex > 0) {
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(0), arrayOut->BeginAt(0), startIndex);
        }

        // check whether to delete single element or subArray from the input array
        if (!deletedPartType->IsA(arrayIn->ElementType())) {
            TypedArrayCoreRef deletedArray =  *((TypedArrayCoreRef*)_ParamPointer(2));
            deletedArray->Resize1D(endIndex - startIndex);
            deletedArray->ElementType() ->CopyData(arrayIn->BeginAt(startIndex),
                                                   deletedArray->BeginAt(0), deletedArray->Length());
        } else if (endIndex - startIndex > 0) {
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(startIndex), _ParamPointer(2));
        } else {
            arrayOut->ElementType()->InitData(_ParamPointer(2));
        }
        if (endIndex < arrayIn->GetLength(0)) {
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(endIndex), arrayOut->BeginAt(startIndex),
                                              arrayOutLength - startIndex);
        }
    } else {
        TypedArrayCoreRef deletedArray = *((TypedArrayCoreRef*)_ParamPointer(2));
        Int32 elementSize = arrayIn->ElementType()->TopAQSize();
        if (deletedArray->Rank() < numberOfDimensions && deletedPortionLength > 1)
            deletedPortionLength = 1;
        ArrayDimensionVector index, dimensionSize, newLengths, deletedArrayDimLen;
        size_t totalNumberOfElements = 1;
        for (Int32 i = 0, j = 0; i < numberOfDimensions; ++i) {
            newLengths[i] = arrayIn->DimensionLengths()[i];
            dimensionSize[i] = arrayIn->DimensionLengths()[numberOfDimensions-1-i];
            if (i == numberOfDimensions-1-dimensionToDelete) {
                if (numberOfDimensions == deletedPartType->Rank()) {
                    deletedArrayDimLen[j] = deletedPortionLength;
                    ++j;
                }
            } else {
                deletedArrayDimLen[j] = arrayIn->DimensionLengths()[i];
                ++j;
            }
            totalNumberOfElements *= dimensionSize[i];
        }
        if (deletedPortionLength <= 0 || startIndex < 0 || startIndex > dimensionSize[dimensionToDelete]) {
            startIndex = 0;
            deletedPortionLength = 0;
        }
        if (startIndex > dimensionSize[dimensionToDelete]) {
            return _NextInstruction();
        }
        newLengths[numberOfDimensions-1-dimensionToDelete] -= deletedPortionLength;
        deletedArray->ResizeDimensions(numberOfDimensions, deletedArrayDimLen, false);

        for (Int32 i = 0; i < numberOfDimensions; i++)
            index[i] = 0;
        if (totalNumberOfElements) {
            AQBlock1 *inputArrayPtr, *deletedArrayPtr, *outputArrayPtr;
            if (arrayIn != arrayOut)
                arrayOut->ResizeDimensions(numberOfDimensions, newLengths, false);
            inputArrayPtr = arrayIn->BeginAt(0);
            deletedArrayPtr = deletedArray->RawBegin();
            outputArrayPtr = arrayOut->BeginAt(0);
            UInt32 numberOfElementsInDeletedDimension = 1;
            for (Int32 i = dimensionToDelete + 1; i < numberOfDimensions; ++i)
                numberOfElementsInDeletedDimension *= dimensionSize[i];
            size_t numberOfElementsBeforeDeleted = startIndex * numberOfElementsInDeletedDimension;
            size_t numberOfElementsToBeDeleted = deletedPortionLength * numberOfElementsInDeletedDimension;
            size_t numberOfElementsAfterDeleted = (dimensionSize[dimensionToDelete]
                       - (startIndex + deletedPortionLength)) * numberOfElementsInDeletedDimension;
            Int32 currentDimension;
            do {
                CopySubArray(inputArrayPtr, outputArrayPtr, numberOfElementsBeforeDeleted, arrayIn, arrayOut);
                CopySubArray(inputArrayPtr, deletedArrayPtr, numberOfElementsToBeDeleted, arrayIn, deletedArray);
                CopySubArray(inputArrayPtr, outputArrayPtr, numberOfElementsAfterDeleted, arrayIn, arrayOut);
                currentDimension = dimensionToDelete;
                while (--currentDimension >= 0 && ++index[currentDimension] >= dimensionSize[currentDimension])
                    index[currentDimension] = 0;
            } while (currentDimension >= 0);
        }
        dimensionSize[dimensionToDelete] -= deletedPortionLength;
        if (arrayIn == arrayOut)
            arrayOut->ResizeDimensions(numberOfDimensions, newLengths, true);
    }
    return _NextInstruction();
}

// [unused]
// ArrayDelete function, can delete single element or multiple elements in 1d Array
VIREO_FUNCTION_SIGNATURE6(ArrayDelete, TypedArrayCoreRef, StaticType, void, TypedArrayCoreRef, IntIndex, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(3);
    TypeRef deletedPartType = _ParamPointer(1);
    IntIndex length = (_ParamPointer(4) == nullptr)? 1 : _Param(4);
    IntIndex offset = (_ParamPointer(5) == nullptr)? arrayIn->Length() - length : _Param(5);
    if (offset > arrayIn->Length())
        offset = arrayIn->Length();

    IntIndex startIndex = offset > 0? offset : 0;
    IntIndex endIndex = offset + length > arrayIn->Length()? arrayIn->Length() : offset + length;
    if (arrayOut->Rank() != 1 || arrayIn->Rank() != 1) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayDelete needs dimNum arg for 2-D or higher arrays");
        return THREAD_EXEC()->Stop();
    }

    if (endIndex < startIndex) {
        endIndex = startIndex;
    }
    IntIndex arrayOutLength = arrayIn->Length() - (endIndex - startIndex);
    arrayOut->Resize1D(arrayOutLength);
    if (startIndex > 0) {
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(0), arrayOut->BeginAt(0), startIndex);
    }

    // check whether to delete single element or subArray from the input array
    if (!deletedPartType->IsA(arrayIn->ElementType())) {
        TypedArrayCoreRef deletedArray =  *((TypedArrayCoreRef*)_ParamPointer(2));
        deletedArray->Resize1D(endIndex - startIndex);
        deletedArray->ElementType() ->CopyData(arrayIn->BeginAt(startIndex),
                                               deletedArray->BeginAt(0), deletedArray->Length());
    } else if (endIndex - startIndex > 0) {
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(startIndex), _ParamPointer(2));
    } else {
        arrayOut->ElementType()->InitData(_ParamPointer(2));
    }
    if (endIndex < arrayIn->Length()) {
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(endIndex), arrayOut->BeginAt(startIndex),
                                          arrayOutLength - startIndex);
    }
    return _NextInstruction();
}

struct ArrayReshapeParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamDef(TypedArrayCoreRef, ArrayIn);
    _ParamImmediateDef(IntIndex*, Dimension1[1]);
    NEXT_INSTRUCTION_METHODV()
};

// ArrayReshape function
VIREO_FUNCTION_SIGNATUREV(ArrayReshape, ArrayReshapeParamBlock)
{
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    IntIndex **newDimensions = _ParamImmediate(Dimension1);

    Int32 count = _ParamVarArgCount() -2;
    Int32 rank = arrayOut->Rank();
    ArrayDimensionVector  dimensions;
    for (IntIndex i = 0; i < count; i++) {
        IntIndex* pDim = newDimensions[count - 1 -i];
        IntIndex size = pDim? *pDim : 0;
        if (size <= 0) {
            for (IntIndex j = 0; j < rank; j++) {
                dimensions[j] = 0;
            }
            arrayOut->ResizeDimensions(rank, dimensions, false);
            return _NextInstruction();
        } else {
            dimensions[i] = size;
        }
    }
    arrayOut->ResizeDimensions(rank, dimensions, false);
    ArrayIterator iteratorIn(arrayIn);
    ArrayIterator iteratorOut(arrayOut);
    void* input = iteratorIn.Begin();
    void* output = iteratorOut.Begin();
    while (input != nullptr && output != nullptr) {
        arrayOut->ElementType()->CopyData(input, output);
        input = iteratorIn.Next();
        output = iteratorOut.Next();
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(ArrayTranspose, TypedArrayCoreRef, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    if (arrayOut->Rank() != 2 || arrayIn->Rank() != 2) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Only process 2d Array");
    }
    IntIndex* pLengths = arrayIn->DimensionLengths();
    IntIndex newLengths[2];
    newLengths[0] = pLengths[1];
    newLengths[1] = pLengths[0];
    arrayOut->ResizeDimensions(2, newLengths, true);
    IntIndex originalIndex[2];
    IntIndex transposeIndex[2];
    TypeRef elementType = arrayIn->ElementType();
    for (IntIndex i = 0; i < pLengths[0]; i++) {
        originalIndex[0] = i;
        transposeIndex[1] = i;
        for (IntIndex j = 0; j < pLengths[1]; j++) {
            originalIndex[1] = j;
            transposeIndex[0] = j;
            elementType->CopyData(arrayIn->BeginAtND(2, originalIndex), arrayOut->BeginAtND(2, transposeIndex));
        }
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArrayInterpolate, void, TypedArrayCoreRef, StaticType, void)
{
    TypedArrayCoreRef arrayIn = _Param(1);
    Double fractionalIndex = ReadDoubleFromMemory(_ParamPointer(2), _ParamPointer(3));
    IntIndex left = 0;
    IntIndex right = arrayIn->Length()-1;
    if (left > right) {
        *(Double*)_ParamPointer(0) = NAN;
        return _NextInstruction();
    }
    if (arrayIn->ElementType()->IsCluster()) {
        TypeRef clusterType = arrayIn->ElementType();
        if (clusterType->SubElementCount() < 2) {
            gPlatform.IO.Printf("(Error \"Cluster should contain at least x field and y field:%d\")\n");
            return _NextInstruction();
        }
        TypeRef elementXType = clusterType->GetSubElement(0);
        TypeRef elementYType = clusterType->GetSubElement(1);
        IntIndex fieldOffsetX = elementXType->ElementOffset();
        IntIndex fieldOffsetY = elementYType->ElementOffset();
        Double leftX = 0, rightX = 0, leftY = 0, rightY = 0;
        for (IntIndex i = 0; i < arrayIn->Length(); i++) {
            void* xPtr = arrayIn->BeginAt(i) + fieldOffsetX;
            void* yPtr = arrayIn->BeginAt(i) + fieldOffsetY;
            Double x = ReadDoubleFromMemory(elementXType, xPtr);
            Double y = ReadDoubleFromMemory(elementYType, yPtr);
            if (i == 0) {
                leftX = rightX = x;
                leftY = rightY = y;
            } else {
                leftX = rightX;
                leftY = rightY;
                rightX = x;
                rightY = y;
            }
            if (fractionalIndex <= x)
                break;
        }
        if (fractionalIndex < leftX)
            fractionalIndex = leftX;
        else if (fractionalIndex > rightX)
            fractionalIndex = rightX;
        if (rightX == leftX)
            *(Double*)_ParamPointer(0) = leftY;
        else
            *(Double*)_ParamPointer(0) = leftY*(rightX - fractionalIndex)/(rightX - leftX) +
                rightY*(fractionalIndex - leftX)/(rightX - leftX);
    } else {
        if (fractionalIndex < 0)
            fractionalIndex = 0;
        else if (fractionalIndex > right)
            fractionalIndex = right;
        while (right - left > 1) {
            if (left + 1 <= fractionalIndex) { left++; }
            if (right - 1 > fractionalIndex) { right--; }
        }
        Double leftD = (Double)left;
        Double rightD = (Double)right;
        Double leftValue = ReadDoubleFromMemory(arrayIn->ElementType(), arrayIn->BeginAt(left));
        Double rightValue = ReadDoubleFromMemory(arrayIn->ElementType(), arrayIn->BeginAt(right));
        Double y = rightValue*(fractionalIndex - leftD)/(rightD - leftD) +
            leftValue*(rightD - fractionalIndex)/(rightD - leftD);
        *(Double*)_ParamPointer(0) = y;
    }
    return _NextInstruction();
}

//----------------------------------------------------------------------
// interpolated result(0), input array(1), threshold y(2), start index(3)
VIREO_FUNCTION_SIGNATURE4(ArrayThreshold, Double, TypedArrayCoreRef, Double, IntIndex)
{
    TypedArrayCoreRef arrayIn = _Param(1);
    Double thresholdY = _Param(2);
    IntIndex startIndex = _ParamPointer(3) == nullptr ? 0 : _Param(3);
    if (arrayIn->Length() == 0) {  // Emtpy array returns NaN
        _Param(0) = NAN;
        return _NextInstruction();
    }
    if (startIndex > arrayIn->Length() - 1) {  // Index greater than array capacity returns NaN
        _Param(0) = NAN;
        return _NextInstruction();
    }
    if (startIndex < 0) {  // Coerce negative index to 0
        startIndex = 0;
    }
    TypeRef elementType = arrayIn->ElementType();
    Double left = 0, right = 0;
    Double leftValue = 0, rightValue = 0;
    Boolean isCluster = elementType->IsCluster();
    if (isCluster) {
        TypeRef elementXType = elementType->GetSubElement(0);
        TypeRef elementYType = elementType->GetSubElement(1);
        IntIndex fieldOffsetX = elementXType->ElementOffset();
        IntIndex fieldOffsetY = elementYType->ElementOffset();
        for (IntIndex i = startIndex; i < arrayIn->Length(); i++) {
            void* xPtr = arrayIn->BeginAt(i) + fieldOffsetX;
            void* yPtr = arrayIn->BeginAt(i) + fieldOffsetY;
            Double x = ReadDoubleFromMemory(elementXType, xPtr);
            Double y = ReadDoubleFromMemory(elementYType, yPtr);
            if (i == startIndex) { right = left = x;}  // i
            if (y < thresholdY) {
                left = x;
                leftValue = y;
                right = left;
            } else {
                left = right;
                right = x;
                rightValue = y;
                break;
            }
        }
    } else {
        for (IntIndex i = startIndex; i < arrayIn->Length(); i++) {
            Double y = ReadDoubleFromMemory(arrayIn->ElementType(), arrayIn->BeginAt(i));
            if (i == startIndex) { left = right = (Double)startIndex;}
            if (y < thresholdY) {
                left = (Double)i;
                leftValue = y;
                right = left;
            } else {
                left = right;
                right = (Double)i;
                rightValue = y;
                break;
            }
        }
    }
    if (left == right) {
        _Param(0) = left;
    } else if (leftValue == rightValue) {
        _Param(0) = (left + right) / 2;
    } else if (std::isinf(rightValue)) {
        _Param(0) = left;
    } else if (std::isnan(rightValue)) {
        _Param(0) = right;
    } else {
        _Param(0) = left*(rightValue - thresholdY) / (rightValue - leftValue) +
            right*(thresholdY - leftValue) / (rightValue - leftValue);
    }
    return _NextInstruction();
}

struct ArrayInterleaveParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamImmediateDef(TypedArrayCoreRef*, ArrayPrimitives[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(ArrayInterleave, ArrayInterleaveParamBlock)
{
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef **arrayInputs = _ParamImmediate(ArrayPrimitives);
    IntIndex numberOfInput = (_ParamVarArgCount() -1);
    IntIndex length = (*arrayInputs[0])->Length();
    if (arrayOut->Rank() != 1) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayInterleave invalid array rank");
        return THREAD_EXEC()->Stop();
    }
    for (IntIndex i = 0; i < numberOfInput; i++) {
        if (length > (*arrayInputs[i])->Length()) {
            length = (*arrayInputs[i])->Length();
        }
    }
    arrayOut->Resize1D(length*numberOfInput);
    for (IntIndex i = 0; i < length; i++) {
        for (IntIndex k = 0; k < numberOfInput; k++) {
            TypedArrayCoreRef arrayK = *arrayInputs[k];
            arrayOut->ElementType()->CopyData(arrayK->BeginAt(i), arrayOut->BeginAt(i*numberOfInput + k));
        }
    }
    return _NextInstruction();
}

struct ArrayDecimateParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayIn);
    _ParamImmediateDef(TypedArrayCoreRef*, ArrayOutputs[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(ArrayDecimate, ArrayDecimateParamBlock)
{
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    TypedArrayCoreRef **arrayOutputs = _ParamImmediate(ArrayOutputs);
    IntIndex numberOfOutputs = (_ParamVarArgCount() -1);
    IntIndex length = arrayIn->Length();
    IntIndex outLength = length / numberOfOutputs;
    if (arrayIn->Rank() != 1) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "ArrayDecimate invalid array rank");
        return THREAD_EXEC()->Stop();
    }
    for (IntIndex k = 0; k < numberOfOutputs; k++) {
        TypedArrayCoreRef arrayK = *arrayOutputs[k];
        arrayK->Resize1D(outLength);
        for (IntIndex i = 0; i < outLength; i++) {
            arrayIn->ElementType()->CopyData(arrayIn->BeginAt(i*numberOfOutputs + k), arrayK->BeginAt(i));
        }
    }
    return _NextInstruction();
}

struct IndexBundleClusterArrayParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayCluster);
    _ParamImmediateDef(TypedArrayCoreRef*, ArrayPrimitives[1]);
    NEXT_INSTRUCTION_METHODV()
};
VIREO_FUNCTION_SIGNATUREV(IndexBundleClusterArray, IndexBundleClusterArrayParamBlock)
{
    TypedArrayCoreRef arrayCluster = _Param(ArrayCluster);
    TypedArrayCoreRef **arrayInputs = _ParamImmediate(ArrayPrimitives);
    IntIndex numberOfFields = (_ParamVarArgCount() -1);
    IntIndex length = (*(arrayInputs[0]))->Length();

    for (IntIndex i = 1; i < numberOfFields; i++) {
        if (length > (*(arrayInputs[i]))->Length()) {
            length = (*(arrayInputs[i]))->Length();
        }
    }
    arrayCluster->Resize1D(length);
    TypeRef clusterType = arrayCluster->ElementType();
    for (IntIndex i = 0; i < length; i++) {
        AQBlock1 *clusterElement = arrayCluster->BeginAt(i);
        for (IntIndex d = 0; d < numberOfFields; d++) {
            TypeRef elementType = clusterType->GetSubElement(d);
            IntIndex offset = elementType->ElementOffset();
            AQBlock1 *pElement = clusterElement + offset;
            TypedArrayCoreRef arrayInput = *(arrayInputs[d]);
            elementType->CopyData(arrayInput->BeginAt(i), pElement);
        }
    }
    return _NextInstruction();
}

struct BuildClusterArrayParamBlock : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayCluster);
    _ParamImmediateDef(void*, ArrayPrimitives[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(BuildClusterArray, BuildClusterArrayParamBlock)
{
    TypedArrayCoreRef arrayCluster = _Param(ArrayCluster);
    void **inputElements = _ParamImmediate(ArrayPrimitives);
    IntIndex arrayLength = (_ParamVarArgCount() -1);
    arrayCluster->Resize1D(arrayLength);
    TypeRef clusterType = arrayCluster->ElementType();
    for (IntIndex i = 0; i < arrayCluster->Length(); i++) {
       AQBlock1 *clusterElement = arrayCluster->BeginAt(i);
       TypeRef elementType = clusterType->GetSubElement(0);
       IntIndex offset = elementType->ElementOffset();
       AQBlock1 *pElement = clusterElement + offset;
       elementType->CopyData(inputElements[i], pElement);
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(ArrayToCluster, StaticType, void, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayIn = _Param(2);
    void* cluster = _ParamPointer(1);
    TypeRef clusterType = _ParamPointer(0);
    for (IntIndex i = 0; i < arrayIn->Length() && i < clusterType->SubElementCount(); i++) {
         TypeRef elementType = clusterType->GetSubElement(i);
         IntIndex offset = elementType->ElementOffset();
         AQBlock1 *pElement = (AQBlock1*)cluster + offset;
         elementType->CopyData(arrayIn->BeginAt(i), pElement);
      }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(ClusterToArray, TypedArrayCoreRef, StaticType, void)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    void* cluster = _ParamPointer(2);
    TypeRef clusterType = _ParamPointer(1);
    arrayOut->Resize1D(clusterType->SubElementCount());
    for (IntIndex i = 0; i < arrayOut->Length(); i++) {
         TypeRef elementType = clusterType->GetSubElement(i);
         IntIndex offset = elementType->ElementOffset();
         AQBlock1 *pElement = (AQBlock1*)cluster + offset;
         elementType->CopyData(pElement, arrayOut->BeginAt(i));
      }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE3(NumberToBooleanArray, StaticType, void, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(2);
    if (arrayOut->ElementType()->BitEncoding() != kEncoding_Boolean || arrayOut->Rank() != 1) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "NumberToBooleanArray bad output type");
        return THREAD_EXEC()->Stop();
    }
    UIntMax number = ReadIntFromMemory(_ParamPointer(0), _ParamPointer(1));
    Int32 numBits = _ParamPointer(0)->BitLength();
    arrayOut->Resize1D(numBits);
    AQBlock1* eltPointer = arrayOut->BeginAt(0);
    UIntMax bitMask = 1;
    for (Int32 i = 0; i < numBits; ++i) {
        *eltPointer++ = ((number & bitMask) != 0);
        bitMask <<= 1;
    }
    return _NextInstruction();
}
VIREO_FUNCTION_SIGNATURE3(BooleanArrayToNumber, TypedArrayCoreRef, StaticType, void)
{
    TypedArrayCoreRef arrayIn = _Param(0);
    if (arrayIn->ElementType()->BitEncoding() != kEncoding_Boolean || arrayIn->Rank() != 1) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "BooleanArrayToNumber bad input type");
        return THREAD_EXEC()->Stop();
    }
    UIntMax number = 0;
    UIntMax bitMask = 1;
    Int32 numBits = _ParamPointer(1)->BitLength();
    Int32 arrayLength = arrayIn->Length();
    AQBlock1* eltPointer = arrayIn->BeginAt(0);
    Int32 i = 0;
    Boolean lastBit = false;
    if (arrayLength > numBits)
        arrayLength = numBits;
    while (i < arrayLength) {
        lastBit = (*eltPointer++ != 0);
        if (lastBit)
            number |= bitMask;
        bitMask <<= 1;
        ++i;
    }
    if (lastBit && _ParamPointer(1)->BitEncoding() == kEncoding_S2CInt) {
        while (i < numBits) {
            number |= bitMask;
            bitMask <<= 1;
            ++i;
        }
    }
    WriteIntToMemory(_ParamPointer(1), _ParamPointer(2), number);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(IsEmptyArray, TypedArrayCoreRef, Boolean)
{
    if (!_Param(0) || _Param(0)->Length() == 0)
        _Param(1) = true;
    else
        _Param(1) = false;
    return _NextInstruction();
}

// #define VIREO_VECTOR_SPECIALIZATION_TEST

#if defined(VIREO_VECTOR_SPECIALIZATION_TEST)

#if defined(kVireoOS_macosxU)
    #include <Accelerate/Accelerate.h>
#else
#endif

// Some early experimental GPU accelerated functions on the Mac/iOS
VIREO_FUNCTION_SIGNATURE3(Mul_VDouble, TypedArray1D<Double>*, TypedArray1D<Double>*, TypedArray1D<Double>*)
{
    IntIndex inputASize = _Param(0)->Length();
    IntIndex inputBSize = _Param(1)->Length();
    IntIndex outputSize = _Param(2)->Length();
    IntIndex minSize = inputASize > inputBSize ? inputBSize : inputASize;

    if (outputSize != minSize) {
        _Param(2)->Resize1D(minSize);
    }
    gPlatform.IO.Printf("Accelerated Vector Multiply\n");

    Double *pSrcA = _Param(0)->Begin();
    Double *pSrcB = _Param(1)->Begin();
    Double *pDestC = _Param(2)->Begin();

#if defined(kVireoOS_macosxU)
    vDSP_vmulD(pSrcA, 1, pSrcB, 1, pDestC, 1, minSize);
#else
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(Add_VDouble, TypedArray1D<Double>*, TypedArray1D<Double>*, TypedArray1D<Double>*)
{
    IntIndex inputASize = _Param(0)->Length();
    IntIndex inputBSize = _Param(1)->Length();
    IntIndex outputSize = _Param(2)->Length();
    IntIndex minSize = inputASize > inputBSize ? inputBSize : inputASize;

    if (outputSize != minSize) {
        _Param(2)->Resize1D(minSize);
    }

    gPlatform.IO.Printf("Accelerated Vector Add\n");

    Double *pSrcA = _Param(0)->Begin();
    Double *pSrcB = _Param(1)->Begin();
    Double *pDestC = _Param(2)->Begin();

#if defined(kVireoOS_macosxU)
    vDSP_vaddD(pSrcA, 1, pSrcB, 1, pDestC, 1, minSize);
#else
#endif
    return _NextInstruction();
}
#endif

DEFINE_VIREO_BEGIN(Array)
    DEFINE_VIREO_REQUIRE(IEEE754Math)
#if defined(VIREO_VECTOR_SPECIALIZATION_TEST)
    DEFINE_VIREO_REQUIRE(IEEE754Math)
    DEFINE_VIREO_FUNCTION_CUSTOM(Mul, Mul_VDouble, "p(i(a(Double *))i(a(Double *))o(a(Double *)))");
    DEFINE_VIREO_FUNCTION_CUSTOM(Add, Add_VDouble, "p(i(a(Double *))i(a(Double *))o(a(Double *)))");
#endif

    DEFINE_VIREO_FUNCTION(ArrayFill, "p(o(Array) i(Int32) i(*))")
    DEFINE_VIREO_FUNCTION(ArrayCapacity, "p(i(Array) o(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayLength, "p(i(Array) o(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayLengthN, "p(i(Array) o(a(Int32 *)))")
    DEFINE_VIREO_FUNCTION(ArrayRank, "p(i(Array) o(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayElementType, "p(i(Array) o(Type))")
    DEFINE_VIREO_FUNCTION(ArrayResize, "p(io(Array) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayDimensions, "p(i(Array) o(a(Int32 *)))")
    DEFINE_VIREO_FUNCTION(ArrayResizeDimensions, "p(io(Array) i(a(Int32 *)))")
    DEFINE_VIREO_FUNCTION(ArrayIndexElt, "p(i(Array) i(Int32) o(*))")
    DEFINE_VIREO_FUNCTION(ArrayAppendElt, "p(io(Array) i(*))")
    DEFINE_VIREO_FUNCTION(ArrayReplaceElt, "p(o(Array) i(Array) i(Int32) i(*))")
    DEFINE_VIREO_FUNCTION(ArraySubset, "p(o(Array) i(Array) i(Int32) i(Int32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(ArraySubset, ArraySubsetND, "p(i(VarArgCount) o(Array) i(Array) i(Int32) i(Int32) i(Int32) i(Int32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(ArrayReplaceSubset, ArrayReplaceSubsetND, "p(i(VarArgCount) o(Array) i(Array) i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION_CUSTOM(ArrayIndex, ArrayIndexND, "p(i(VarArgCount) i(Array) o(StaticTypeAndData) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayInsertElt, "p(o(Array) i(Array) i(Int32) i(*))")
    DEFINE_VIREO_FUNCTION_CUSTOM(ArrayInsertSubset, ArrayInsertSubsetND, "p(o(Array) i(Array) i(Int32) i(Int32) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayInsertSubset, "p(o(Array) i(Array) i(Int32) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayReverse, "p(o(Array) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayRotate, "p(o(Array) i(Array) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayDelete, "p(o(Array) o(StaticTypeAndData) i(Array) i(Int32) i(Int32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(ArrayDelete, ArrayDeleteND, "p(o(Array) o(StaticTypeAndData) i(Array) i(Int32) i(Int32) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArraySplit, "p(o(Array) o(Array) i(Array) i(Int32))")
    DEFINE_VIREO_GENERIC(Sort1DArray, "p(o(Array) i(Array) s(Instruction))", EmitSortInstruction);
    DEFINE_VIREO_FUNCTION(Sort1DArrayInternal, "p(o(Array) i(Array) s(Instruction))")

    DEFINE_VIREO_GENERIC(ArrayMaxMin, "p(i(Array) o(*) o(Int32) o(*) o(Int32))", EmitMaxMinInstruction);
    DEFINE_VIREO_FUNCTION(ArrayMaxMinInternal, "p(i(Array) o(*) o(Int32) o(*) o(Int32) s(Instruction))");

    DEFINE_VIREO_GENERIC(ArrayMaxMin, "p(i(Array) o(*) o(Array) o(*) o(Array))", EmitMaxMinInstruction);
    DEFINE_VIREO_FUNCTION(ArrayMaxMinInternal, "p(i(Array) o(*) o(Array) o(*) o(Array) s(Instruction))");

    DEFINE_VIREO_FUNCTION(ArrayReshape, "p(i(VarArgCount) o(Array) i(Array) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayTranspose, "p(o(Array) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayInterpolate, "p(o(*) i(Array) i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(ArrayThreshold, "p(o(Double) i(Array) i(Double) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayInterleave, "p(i(VarArgCount) o(Array) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayDecimate, "p(i(VarArgCount) i(Array) o(Array))")

    DEFINE_VIREO_FUNCTION(IndexBundleClusterArray, "p(i(VarArgCount) o(Array) i(Array))")
    DEFINE_VIREO_FUNCTION(BuildClusterArray, "p(i(VarArgCount) o(Array) i(*))")
    DEFINE_VIREO_FUNCTION(ArrayToCluster, "p(o(StaticTypeAndData) i(Array))")
    DEFINE_VIREO_FUNCTION(ClusterToArray, "p(o(Array) i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(NumberToBooleanArray, "p(i(StaticTypeAndData) o(Array))")
    DEFINE_VIREO_FUNCTION(BooleanArrayToNumber, "p(i(Array) o(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(IsEmptyArray, "p(i(Array) o(Boolean))")
#ifdef VIREO_TYPE_ArrayND
    DEFINE_VIREO_FUNCTION(ArrayFillNDV, "p(i(VarArgCount) o(Array) i(*) i(Int32) )")
    DEFINE_VIREO_FUNCTION(ArrayIndexElt2DV, "p(i(Array) i(*) i(*) o(*))")
    DEFINE_VIREO_FUNCTION(ArrayReplaceSubset2DV, "p(i(VarArgCount) o(Array) i(Array) i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(ArrayIndexEltNDV, "p(i(VarArgCount) i(Array) o(*) i(Int32) )")
    DEFINE_VIREO_FUNCTION(ArrayReplaceEltNDV, "p(i(VarArgCount) o(Array) i(Array) i(*) i(Int32) )")
    // It might be helpful to have indexing functions that take the
    // set of indexes as a vector, but that is not needed at this time.
    // DEFINE_VIREO_FUNCTION(ArrayIndexEltND, "p(i(Array) i(*) i(a(Int32 *)) )")
    // DEFINE_VIREO_FUNCTION(ArrayReplaceEltND, "p(io(Array) o(*) i(a(Int32 *)) )")
#endif

DEFINE_VIREO_END()

}  // namespace Vireo
