/**
 
Copyright (c) 2014 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Native Vireo array functions
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"

using namespace Vireo;

//------------------------------------------------------------
DECLARE_VIREO_PRIMITIVE2(ArrayResize, TypedArrayCoreRef, Int32, (_Param(0)->Resize1D(_Param(1)) ))
DECLARE_VIREO_PRIMITIVE2(ArrayLength, TypedArrayCoreRef, Int32, (_Param(1) = _Param(0)->Length()))
DECLARE_VIREO_PRIMITIVE2(ArrayRank, TypedArrayCoreRef, Int32, (_Param(1) = _Param(0)->Rank()))
DECLARE_VIREO_PRIMITIVE2(ArrayElementType, TypedArrayCoreRef, TypeRef, (_Param(1) = _Param(0)->ElementType()))

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayCapacity, TypedArrayCoreRef, Int32)
{
    _Param(1) = _Param(0)->Capacity();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayDimensions, TypedArrayCoreRef, TypedArray1D<IntIndex>*)
{
    Int32 rank = _Param(0)->Rank();
    IntIndex* pLengths = _Param(0)->GetDimensionLengths();
    _Param(1)->Replace1D(0, rank, pLengths, true);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayResizeDimensions, TypedArrayCoreRef, TypedArray1D<IntIndex>*)
{
    // Details on how arrays are redimensioned are in ResizeDimensions().
    Int32 rankProvided = _Param(1)->Length();
    IntIndex* pLengths = _Param(1)->Begin();
    _Param(0)->ResizeDimensions(rankProvided, pLengths, false);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(ArrayFill, TypedArrayCoreRef, Int32, void)
{
    TypedArrayCoreRef array = _Param(0);
    TypeRef     eltType = array->ElementType();
    Int32       length = _Param(1);

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
    Int32 **dimensions = _ParamImmediate(Dimension1);

    ArrayDimensionVector  tempDimensionLengths;
    for (Int32 i = 0; i < numDimensionInputs; i++) {
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
    Int32 **ppDimensions = _ParamImmediate(Dimension1);

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
VIREO_FUNCTION_SIGNATURE3(ArrayIndexElt, TypedArrayCoreRef, Int32, void)
{
    TypedArrayCoreRef array = _Param(0);
    Int32       length = array->Length();
    TypeRef     elementType = array->ElementType();
    Int32       index = _Param(1);

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
VIREO_FUNCTION_SIGNATURE4(ArrayReplaceElt, TypedArrayCoreRef, TypedArrayCoreRef, Int32, void)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    TypeRef     elementType = arrayOut->ElementType();
    Int32       index = _Param(2);
    Int32       length = arrayIn->Length();

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
VIREO_FUNCTION_SIGNATURE4(ArrayReplaceSubset, TypedArrayCoreRef, TypedArrayCoreRef, Int32, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    Int32 idx = _Param(2);
    TypedArrayCoreRef subArray = _Param(3);

    if (arrayOut == subArray) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayReplaceSubset inplace");
        return THREAD_EXEC()->Stop();
    }

    if (arrayOut != arrayIn) {
        // To copy the full array the CopyData method gets a pointer to the ArrayRef.
        arrayIn->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));
    }

    if (idx >= 0 && idx < arrayOut->Length()) {
        Int32 length = Min(subArray->Length(), arrayOut->Length() - idx);
        arrayIn->ElementType()->CopyData(subArray->BeginAt(0), arrayOut->BeginAt(idx), length);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArraySubset, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    Int32 idx = (_ParamPointer(2) != null) ? _Param(2) : 0;
    // Coerce index to non-negative integer
    idx = Max(idx, 0);

    if (arrayOut == arrayIn && idx != 0) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArraySubset inplace");
        return THREAD_EXEC()->Stop();
    }

    // Calculate count from idx to end of array
    Int32 maxLen = arrayIn->Length() - idx;
    maxLen = Max(maxLen, 0);

    Int32 len = (_ParamPointer(3) != null) ? _Param(3) : maxLen;
    len = Max(len, 0);
    len = Min(len, maxLen);
    arrayOut->Resize1D(len);
    if (idx < arrayIn->Length() && arrayOut != arrayIn) {
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(idx), arrayOut->BeginAt(0), len);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArrayInsertElt, TypedArrayCoreRef, TypedArrayCoreRef, Int32, void)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    Int32 length = arrayIn->Length();
    Int32 index = (_ParamPointer(2) != null) ? _Param(2) : length;

    if (arrayOut != arrayIn)
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));

    if (0 <= index && index <= length)
        arrayOut->Insert1D(index, 1, _ParamPointer(3));

    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(ArrayInsertSubset, TypedArrayCoreRef, TypedArrayCoreRef, Int32, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    IntIndex arrayInLength = arrayIn->Length();

    Int32 idx = (_ParamPointer(2) != null) ? _Param(2) : arrayInLength;

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
VIREO_FUNCTION_SIGNATURE3(ArrayRotate, TypedArrayCoreRef, TypedArrayCoreRef, Int32)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    Int32 offset = _Param(2);

    if (arrayOut == arrayIn) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "Can't ArrayRotate inplace");
        return THREAD_EXEC()->Stop();
    }

    IntIndex arrayInLength = arrayIn->Length();
    arrayOut->Resize1D(arrayInLength);

    if (arrayInLength > 0)
    {
        offset = offset % arrayInLength;
        if (offset < 0)
            offset += arrayInLength;

        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(0), arrayOut->BeginAt(offset), arrayInLength - offset);
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(arrayInLength - offset), arrayOut->BeginAt(0), offset);
    }

    return _NextInstruction();
}


#if 0
// Some early experimental GPU accelerated functions on the Mac/iOS
VIREO_FUNCTION_SIGNATURE3(MulVDouble, DoubleArray1D*, DoubleArray1D*, DoubleArray1D*)
{
    Int32 inputASize = _Param(0)->Length();
    Int32 inputBSize = _Param(1)->Length();
    Int32 outputSize = _Param(2)->Length();
    Int32 minSize = inputASize > inputBSize ? inputBSize : inputASize;

    if (outputSize != minSize)
    {
        _Param(2)->Resize1D(minSize);
    }
#ifdef __APPLE__
  //  vDSP_vmulD(_Param(0)->Begin(), 1, _Param(1)->Begin(), 1, _Param(2)->Begin(), 1, minSize);
#else
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AddVDouble, DoubleArray1D*, DoubleArray1D*, DoubleArray1D*)
{
    Int32 inputASize = _Param(0)->Length();
    Int32 inputBSize = _Param(1)->Length();
    Int32 outputSize = _Param(2)->Length();
    Int32 minSize = inputASize > inputBSize ? inputBSize : inputASize;

    if (outputSize != minSize)
    {
        _Param(2)->Resize1D(minSize);
    }
#ifdef __APPLE__
    // vDSP_vaddD(_Param(0)->Begin(), 1, _Param(1)->Begin(), 1, _Param(2)->Begin(), 1, minSize);
#else
#endif
    return _NextInstruction();
}
#endif

DEFINE_VIREO_BEGIN(Array)
    DEFINE_VIREO_FUNCTION(ArrayFill, "p(o(.Array) i(.Int32) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayCapacity, "p(i(.Array) o(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayLength, "p(i(.Array) o(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayRank, "p(i(.Array) o(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayElementType, "p(i(.Array) o(.Type))")
    DEFINE_VIREO_FUNCTION(ArrayResize, "p(io(.Array) i(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayDimensions, "p(i(.Array) o(a(.Int32 *)))")
    DEFINE_VIREO_FUNCTION(ArrayResizeDimensions, "p(io(.Array) i(a(.Int32 *)))")
    DEFINE_VIREO_FUNCTION(ArrayIndexElt, "p(i(.Array) i(.Int32) o(.*))")
    DEFINE_VIREO_FUNCTION(ArrayAppendElt, "p(io(.Array) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayReplaceElt, "p(o(.Array) i(.Array) i(.Int32) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayReplaceSubset, "p(o(.Array) i(.Array) i(.Int32) i(.Array))")
    DEFINE_VIREO_FUNCTION(ArraySubset, "p(o(.Array) i(.Array) i(.Int32) i(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayInsertElt, "p(o(.Array) i(.Array) i(.Int32) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayInsertSubset, "p(o(.Array) i(.Array) i(.Int32) i(.Array))")
    DEFINE_VIREO_FUNCTION(ArrayReverse, "p(o(.Array) i(.Array))")
    DEFINE_VIREO_FUNCTION(ArrayRotate, "p(o(.Array) i(.Array) i(.Int32))")

#ifdef VIREO_TYPE_ArrayND
    DEFINE_VIREO_FUNCTION(ArrayFillNDV, "p(i(.VarArgCount) o(.Array) i(.*) i(.Int32) )")
    DEFINE_VIREO_FUNCTION(ArrayIndexEltNDV, "p(i(.VarArgCount) i(.Array) o(.*) i(.Int32) )")
    DEFINE_VIREO_FUNCTION(ArrayReplaceEltNDV, "p(i(.VarArgCount) o(.Array) i(.Array) i(.*) i(.Int32) )")
    // It might be helpful to have indexing functions that take the
    // set of indexes as a vector, but that is not needed at this time.
    // DEFINE_VIREO_FUNCTION(ArrayIndexEltND, "p(i(.Array) i(.*) i(a(.Int32 *)) )")
    // DEFINE_VIREO_FUNCTION(ArrayReplaceEltND, "p(io(.Array) o(.*) i(a(.Int32 *)) )")
#endif


DEFINE_VIREO_END()

