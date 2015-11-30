/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Native Vireo array functions
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include <vector>
#include <algorithm>

using namespace Vireo;

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
    for (IntIndex i =0; i< rank; i++) {
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

    if (array->Resize1D(length)) {
        eltType->MultiCopyData(_ParamPointer(2), array->RawBegin(), length);
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
    }

    _Param(ArrayOut)->ResizeDimensions(numDimensionInputs, tempDimensionLengths, false);

    IntIndex totalLenght = _Param(ArrayOut)->Length();
    TypeRef eltType = array->ElementType();
    eltType->MultiCopyData(_ParamPointer(InitialValue), array->RawBegin(), totalLenght);

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

//indexing on 2d array, the row argument comes before column argument
//which is different from the indexing used in normal N dimension functions(e.g 0 d index, 1st d index, 3nd d index ...)
// Arguments: inputArray, row, column, outputElement/Array
VIREO_FUNCTION_SIGNATURE4(ArrayIndexElt2DV, TypedArrayCoreRef, void, void, void)
{
    TypedArrayCoreRef arrayIn = _Param(0);
    Boolean pickRow = false;
    Boolean pickCol = false;
    IntIndex row, col;
    IntIndex rank = 2;
    IntIndex* lengths = arrayIn->DimensionLengths();
    if (_ParamPointer(1) != NULL) {
        row = *((IntIndex*)_ParamPointer(1));
        pickRow = true;
    } else {
        row = -1;
    }
    if (_ParamPointer(2) != NULL) {
        col = *((IntIndex*)_ParamPointer(2));
        pickCol = true;
    } else {
        col = -1;
    }
    TypedArrayCoreRef arrayOut;
    if (pickCol && pickRow) {
        if (row >=0 && row < lengths[1] && col>=0 && col <lengths[0]) {
            IntIndex index2D[2];
            index2D[0] = col;
            index2D[1] = row;
            arrayIn->ElementType()->CopyData(arrayIn->BeginAtND(rank, index2D), _ParamPointer(3));
        }
    } else {
        IntIndex index2D[2];
        arrayOut=  *((TypedArrayCoreRef*)_ParamPointer(3));
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
struct ArrayReplaceSubsetStruct : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamDef(TypedArrayCoreRef, ArrayIn);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};
//ArrayReplaceSubset function for 1d array, support multiple inputs
VIREO_FUNCTION_SIGNATUREV(ArrayReplaceSubset, ArrayReplaceSubsetStruct)
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
        if (arguments[i]._pData != NULL) {
            idx = (IntIndex) ReadIntFromMemory(argType, arguments[i]._pData);
        } else {
            idx >= 0? idx++ : idx = 0;
        }
        i++;
        TypedArrayCoreRef subArray = null;
        void* element = arguments[i]._pData;
        argType = arguments[i]._paramType;
        //whether the input is single element or not. The argType needn't to be flat to specify single element
        //. e.g. string type
        if (!argType->IsA(arrayIn->ElementType())) {
            subArray = *(TypedArrayCoreRef*)arguments[i]._pData;
        }
        i++;
        if (arrayOut == subArray) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayReplaceSubset inplace");
            return THREAD_EXEC()->Stop();
        }

        if (idx >= 0 && idx < arrayOut->Length()) {
            if (subArray != null) {
                IntIndex length = Min(subArray->Length(), arrayOut->Length() - idx);
                arrayIn->ElementType()->CopyData(subArray->BeginAt(0), arrayOut->BeginAt(idx), length);
            } else {
                arrayIn->ElementType()->CopyData(element, arrayOut->BeginAt(idx), 1);
            }
        }
    }
    return _NextInstruction();
}

//function called by ArrayReplaceSubset2DV for each pair of input.
//arguments: output array, input array, newElem/newArray, row, column, rankofthenewElem.
//elemRank specify the rank of the input element. in this case (2D input), it can only be 1 or 0.
void replace2dArray(TypedArrayCoreRef arrayOut, TypedArrayCoreRef arrayIn, void* newElem, IntIndex row, IntIndex col, IntIndex elemRank)
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

//ArrayReplaceSubset function for 2d array, the function can be used to replace a single element, a row or a column
VIREO_FUNCTION_SIGNATUREV(ArrayReplaceSubset2DV, ArrayReplaceSubsetStruct)
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
        if (arguments[i]._pData != NULL) {
            row = *((IntIndex*)arguments[i]._pData);
            wireRow = true;
        } else {
            row >= 0? row++ : row = 0;
        }

        i++;
        argType = arguments[i]._paramType;
        if (arguments[i]._pData != NULL) {
            col = *((IntIndex*)arguments[i]._pData);
            wireCol = true;
        } else {
            col >= 0? col++ : col = 0;
        }

        i++;
        TypedArrayCoreRef subArray = null;
        void* element = arguments[i]._pData;
        argType = arguments[i]._paramType;

        if (!argType->IsA(arrayIn->ElementType())) {
            subArray = *(TypedArrayCoreRef*)arguments[i]._pData;
            // if no index wired, column becomes disabled
            if(!wireRow && !wireCol) {col = -1;}
            replace2dArray(arrayOut, arrayIn, subArray, row, col, 1);
        } else {
            if(!wireRow && !wireCol) {row > 0? row-- : row = 0;}
            replace2dArray(arrayOut, arrayIn, element, row, col, 0);
        }
        i++;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArraySubset, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    IntIndex idx = (_ParamPointer(2) != null) ? _Param(2) : 0;
    // Coerce index to non-negative integer
    idx = Max(idx, 0);

    if (arrayOut == arrayIn && idx != 0) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArraySubset inplace");
        return THREAD_EXEC()->Stop();
    }

    // Calculate count from idx to end of array
    IntIndex maxLen = arrayIn->Length() - idx;
    maxLen = Max(maxLen, 0);

    IntIndex len = (_ParamPointer(3) != null) ? _Param(3) : maxLen;
    len = Max(len, 0);
    len = Min(len, maxLen);
    arrayOut->Resize1D(len);
    if (idx < arrayIn->Length() && arrayOut != arrayIn) {
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(idx), arrayOut->BeginAt(0), len);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArrayInsertElt, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, void)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    IntIndex length = arrayIn->Length();
    IntIndex index = (_ParamPointer(2) != null) ? _Param(2) : length;

    if (arrayOut != arrayIn)
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));

    if (0 <= index && index <= length)
        arrayOut->Insert1D(index, 1, _ParamPointer(3));

    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArrayInsertSubset, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    IntIndex arrayInLength = arrayIn->Length();

    IntIndex idx = (_ParamPointer(2) != null) ? _Param(2) : arrayInLength;

    TypedArrayCoreRef subArray = _Param(3);
    IntIndex subArrayLength = subArray->Length();

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
    inline InstructionCore* Next()      { return this->_piNext; }
};
//Emit the sort instruction for specific type
//------------------------------------------------------------
InstructionCore* EmitSortInstruction(ClumpParseState* pInstructionBuilder)
{
    ConstCStr pSortOpName = "Sort1DArrayInternal";
    SubString sortOpToken(pSortOpName);

    pInstructionBuilder->ReresolveInstruction(&sortOpToken, false);
    InstructionCore* pInstruction = null;
    TypedArrayCoreRef arrayArg = *(TypedArrayCoreRef*)pInstructionBuilder->_argPointers[0];
    TypeRef elementType  = arrayArg->ElementType();
    SubString LTName("IsLT");
    // Add param slot to hold the snippet
    Int32 snippetArgId = pInstructionBuilder->AddSubSnippet();
    Sort1DArrayInstruction* sortOp = (Sort1DArrayInstruction*) pInstructionBuilder->EmitInstruction();
    pInstruction = sortOp;
    TypeRef booleanType = pInstructionBuilder->_clump->TheTypeManager()->FindType(tsBooleanType);

    ClumpParseState snippetBuilder(pInstructionBuilder);
    pInstructionBuilder->BeginEmitSubSnippet(&snippetBuilder, sortOp, snippetArgId);
    snippetBuilder.EmitInstruction(&LTName, 3, elementType, (void*)null, elementType, (void*)null, booleanType, (void*)null);

    pInstructionBuilder->EndEmitSubSnippet(&snippetBuilder);
    pInstructionBuilder->RecordNextHere(&sortOp->_piNext);

    return pInstruction;
}

struct comparetor
{
private:
    Instruction3<void, void, Boolean>* _snippet;
public:
    comparetor(Instruction3<void, void, Boolean>* snippet) {_snippet = snippet;}
    bool operator()(AQBlock1* i, AQBlock1* j)
    {
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
    comparetor myComparetor(snippet);
    std::vector<AQBlock1*>::iterator it;
    std::sort(myVector.begin(), myVector.end(), myComparetor);
    IntIndex i = 0;
    for (it = myVector.begin(); it != myVector.end(); it++) {
        AQBlock1* element = *it;
        arrayOut->ElementType()->CopyData(element, arrayOut->BeginAt(i));
        i++;
    }
    return _NextInstruction();
}

// ArrayDelete function, can delete single element or multiple elements in 1d Array
VIREO_FUNCTION_SIGNATURE6(ArrayDelete, TypedArrayCoreRef, StaticType, void, TypedArrayCoreRef, IntIndex, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(3);
    TypeRef deletedPartType = _ParamPointer(1);
    IntIndex length = _Param(4);
    IntIndex offset = _Param(5);
    IntIndex startIndex = offset > 0? offset : 0;
    IntIndex endIndex = offset + length > arrayIn->Length()? arrayIn->Length() : offset + length;

    if (endIndex <= 0) {
        return _NextInstruction();
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
        deletedArray->ElementType() ->CopyData(arrayIn->BeginAt(startIndex), deletedArray->BeginAt(0), deletedArray->Length());
    } else if (endIndex - startIndex > 0 ){
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(startIndex), _ParamPointer(2));
    }

    if (endIndex < arrayIn->Length()) {
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(endIndex), arrayOut->BeginAt(startIndex), arrayOutLength - startIndex);
    }
    return _NextInstruction();
}

struct ArrayReshapeStruct : public VarArgInstruction
{
    _ParamDef(TypedArrayCoreRef, ArrayOut);
    _ParamDef(TypedArrayCoreRef, ArrayIn);
    _ParamImmediateDef(IntIndex*, Dimension1[1]);
    NEXT_INSTRUCTION_METHODV()
};

//Array Iterator
class ArrayIterator
{
private:
    ArrayDimensionVector  _indexStack;
    IntIndex _indexDim;
    IntIndex*  dimensions;
    IntIndex  _rank;
    TypedArrayCoreRef _array;
public:
    ArrayIterator(TypedArrayCoreRef array)
    {
        _array = array;
        _rank = array->Rank();
        _indexDim = 0;
        dimensions = array->DimensionLengths();
        for (IntIndex i = 0; i < _rank; i++) {
            _indexStack[i] = 0;
        }
    };
    void* Begin()
    {
        for (IntIndex i = 0; i < _rank; i++) {
            _indexStack[i] = 0;
        }
        _indexDim = 0;
        return _array->BeginAtND(_rank, _indexStack);
    }
    void* Next()
    {
        _indexStack[_indexDim]++;
        if (dimensions[_indexDim] <= _indexStack[_indexDim]) {
            while (dimensions[_indexDim] <= _indexStack[_indexDim]) {
                _indexDim++;
                _indexStack[_indexDim]++;
            }
            if (_indexDim >= _rank) {
                return NULL;
            }
            for (IntIndex i = 0; i < _indexDim; i++) {
                _indexStack[i] = 0;
                _indexDim = 0;
            }
        }
        return (void*)_array->BeginAtND(_rank, _indexStack);
    };
};

//ArrayReshape function
VIREO_FUNCTION_SIGNATUREV(ArrayReshape, ArrayReshapeStruct)
{
    TypedArrayCoreRef arrayOut = _Param(ArrayOut);
    TypedArrayCoreRef arrayIn = _Param(ArrayIn);
    IntIndex **newDimensions = _ParamImmediate(Dimension1);

    Int32 count = _ParamVarArgCount() -2;
    Int32 rank = arrayOut->Rank();
    ArrayDimensionVector  dimensions;
    for (IntIndex i = 0; i < count; i++) {
        IntIndex* pDim = newDimensions[i];
        IntIndex size = pDim? *pDim : 0;
        if (size <= 0){
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
    //IntIndex* inputDimensions = arrayOut->DimensionLengths();
    IntIndex inputRank = arrayIn->Rank();
    ArrayIterator iteratorIn(arrayIn);
    ArrayIterator iteratorOut(arrayOut);
    void* input = iteratorIn.Begin();
    void* output = iteratorOut.Begin();
    while (input != NULL && output != NULL) {
        arrayOut->ElementType()->CopyData(input, output);
        input = iteratorIn.Next();
        output = iteratorOut.Next();
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArrayInterpolate, void, TypedArrayCoreRef, StaticType, void)
{
    TypedArrayCoreRef arrayIn = _Param(1);
    Double fractionalIndex = ReadDoubleFromMemory(_ParamPointer(2), _ParamPointer(3));
    IntIndex left = 0;
    IntIndex right = arrayIn->Length()-1;
    if(left == right) {
        return _NextInstruction();
    }
    if (arrayIn->ElementType()->IsCluster()) {
        TypeRef type = arrayIn->ElementType();
        AQBlock1* point = arrayIn->BeginAt(0);
        void*  pX;
        void*  pY;
        SubString fieldNameX("x");
        SubString fieldNameY("y");
        TypeRef elementXType = type->GetSubElementAddressFromPath(&fieldNameX, point , &pX, true);
        TypeRef elementYType = type->GetSubElementAddressFromPath(&fieldNameY, point , &pY, true);
        if (pX == null || pY == null) {
            gPlatform.IO.Printf("(Error \"Cluster should contain x field and y field:%d\")\n");
            return _NextInstruction();
        }
        IntIndex fieldOffsetX = (AQBlock1*)pX - point;
        IntIndex fieldOffsetY = (AQBlock1*)pY - point;
        Double leftX;
        Double rightX;
        Double leftY;
        Double rightY;
        for (IntIndex i = 0; i < arrayIn->Length(); i++) {
            void* xPtr = arrayIn->BeginAt(i) + fieldOffsetX;
            void* yPtr = arrayIn->BeginAt(i) + fieldOffsetY;
            Double x = ReadDoubleFromMemory(elementXType, xPtr);
            Double y = ReadDoubleFromMemory(elementYType, yPtr);
            if (i == 0) {
                leftX = x;
                leftY = y;
            } else if (i == 1){
                rightX = x;
                rightY = y;
            } else {
                if(rightX < fractionalIndex) {
                    leftX = rightX;
                    leftY = rightY;
                    rightX = x;
                    rightY = y;
                } else {
                    break;
                }
            }
        }
        *(Double*)_ParamPointer(0) = leftY*(rightX - fractionalIndex)/(rightX - leftX) + rightY*(fractionalIndex - leftX)/(rightX - leftX);

    } else {
        while (right - left > 1) {
            if (left + 1 <= fractionalIndex) { left++; }
            if (right - 1 > fractionalIndex) { right--; }
        }
        Double leftD = (Double)left;
        Double rightD = (Double)right;
        Double leftValue = ReadDoubleFromMemory(arrayIn->ElementType(), arrayIn->BeginAt(left));
        Double rightValue = ReadDoubleFromMemory(arrayIn->ElementType(), arrayIn->BeginAt(right));
        Double y = rightValue*(fractionalIndex - leftD)/(rightD - leftD) + leftValue*(rightD - fractionalIndex)/(rightD - leftD);
        *(Double*)_ParamPointer(0) = y;
    }
    return _NextInstruction();
}


//#define VIREO_VECTOR_SPECIALIZATION_TEST

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
    //DEFINE_VIREO_FUNCTION(ArrayReplaceSubset, "p(o(Array) i(Array) i(Int32) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayReplaceSubset, "p(i(VarArgCount) o(Array) i(Array) i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(ArraySubset, "p(o(Array) i(Array) i(Int32) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayInsertElt, "p(o(Array) i(Array) i(Int32) i(*))")
    DEFINE_VIREO_FUNCTION(ArrayInsertSubset, "p(o(Array) i(Array) i(Int32) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayReverse, "p(o(Array) i(Array))")
    DEFINE_VIREO_FUNCTION(ArrayRotate, "p(o(Array) i(Array) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayDelete, "p(o(Array) o(StaticTypeAndData) i(Array) i(Int32) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArraySplit, "p(o(Array) o(Array) i(Array) i(Int32))")
    DEFINE_VIREO_GENERIC(Sort1DArray, "p(o(Array) i(Array) s(Instruction))", EmitSortInstruction);
    DEFINE_VIREO_FUNCTION(Sort1DArrayInternal, "p(o(Array) i(Array) s(Instruction))")
    DEFINE_VIREO_FUNCTION(ArrayReshape, "p(i(VarArgCount) o(Array) i(Array) i(Int32))")
    DEFINE_VIREO_FUNCTION(ArrayInterpolate, "p(o(*) i(Array) i(StaticTypeAndData))")
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

#ifdef VIREO_TYPE_Waveform
DEFINE_VIREO_BEGIN(Waveform)
    DEFINE_VIREO_REQUIRE(IEEE754Math)
    DEFINE_VIREO_REQUIRE(Timestamp)
    DEFINE_VIREO_TYPE(AnalogWaveform, "c(e(a(Double *) Y)e(Timestamp t0)e(Double dt))")
    DEFINE_VIREO_TYPE(DigitalWaveform, "c(e(a(UInt8 * *) data)e(a(UInt32 *) transitions))")
DEFINE_VIREO_END()
#endif
