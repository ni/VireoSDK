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

DECLARE_VIREO_PRIMITIVE2( ArrayResize, TypedArrayCore*, Int32, (_Param(0)->Resize1D(_Param(1)) ) )
DECLARE_VIREO_PRIMITIVE2( ArrayLength, TypedArrayCore*, Int32, (_Param(1) = _Param(0)->Length()) )
DECLARE_VIREO_PRIMITIVE2( ArrayRank, TypedArrayCore*, Int32, (_Param(1) = _Param(0)->Type()->Rank()) )

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ArrayCapacity, TypedArrayCoreRef, Int32)
{
    _Param(1) = _Param(0)->Capacity();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(ArrayFill, TypedArrayCoreRef, Int32, void)
{
    TypedArrayCore* array = _Param(0);
    TypeRef     eltType = array->ElementType();
    Int32       length = _Param(1);
    
    if (array->Resize1D(length)) {
        eltType->MultiCopyData(_ParamPointer(2), array->RawBegin(), length);
    }
    return _NextInstruction();
}
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
    if(arrayOut != arrayIn){
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));
    } 
    
    if (index >= 0 && index < length) {
        void* pDest = arrayOut->BeginAt(index);
        elementType->CopyData(_ParamPointer(3), pDest);
    }

    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArrayReplaceSubset, TypedArrayCoreRef, TypedArrayCoreRef, Int32, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    Int32 idx = _Param(2);
    TypedArrayCoreRef subArray = _Param(3);

    if (arrayOut == subArray) {
        printf("(Error 'Can't ArrayReplaceSubset inplace.')\n");
        return THREAD_EXEC()->Stop();
    }

    if(arrayOut != arrayIn){
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));
    }
    if(idx >= 0 && idx < arrayOut->Length()) { 
        Int32 length = Min(subArray->Length(), arrayOut->Length() - idx);
        arrayIn->ElementType()->CopyData(subArray->BeginAt(0), arrayOut->BeginAt(idx), length);
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArraySubset, TypedArrayCoreRef, TypedArrayCoreRef, IntIndex, IntIndex)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    Int32 idx = (_ParamPointer(2) != null) ? _Param(2) : 0;
    idx = Max(idx, 0); // coerce index to non-negative integer
    
    if (arrayOut == arrayIn && idx != 0) {
        printf("(Error 'Can't ArraySubset inplace.')\n");
        return THREAD_EXEC()->Stop();
    }

    Int32 maxLen = arrayIn->Length() - idx; // calculate count from idx to end of array
    maxLen = Max(maxLen, 0);
    
    Int32 len = (_ParamPointer(3) != null) ? _Param(3) : maxLen;
    len = Max(len, 0);
    len = Min(len, maxLen); // coerce len to 0 .. maxLen
    arrayOut->Resize1D(len);
    if(idx < arrayIn->Length() && arrayOut != arrayIn) { 
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(idx), arrayOut->BeginAt(0), len);
    }
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArrayInsertElt, TypedArrayCoreRef, TypedArrayCoreRef, Int32, void)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);

    Int32 length = arrayIn->Length();
    Int32 index = (_ParamPointer(2) != null) ? _Param(2) : length;

    if(arrayOut != arrayIn)
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));

    if (0 <= index && index <= length)
        arrayOut->Insert1D(index, 1, _ParamPointer(3));

    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(ArrayInsertSubset, TypedArrayCoreRef, TypedArrayCoreRef, Int32, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    IntIndex arrayInLength = arrayIn->Length();

    Int32 idx = (_ParamPointer(2) != null) ? _Param(2) : arrayInLength;

    TypedArrayCoreRef subArray = _Param(3);
    IntIndex subArrayLength = subArray->Length();

    if (arrayOut == subArray) {
        printf("(Error 'Can't ArrayInsertSubset inplace.')\n");
        return THREAD_EXEC()->Stop();
    }

    if (0 <= idx && idx <= arrayInLength) {
        if (arrayOut == arrayIn){
            arrayOut->Insert1D(idx, subArrayLength, subArray->BeginAt(0));
        } else {
            arrayOut->Resize1D(arrayInLength + subArrayLength);

            // Copy the original array up to the insert point
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(0), arrayOut->BeginAt(0), idx);
            // Copy the inserted subarray
            arrayOut->ElementType()->CopyData(subArray->BeginAt(0), arrayOut->BeginAt(idx), subArrayLength);
            // Copy the rest of the original array.
            arrayOut->ElementType()->CopyData(arrayIn->BeginAt(idx), arrayOut->BeginAt(idx + subArrayLength), arrayInLength - idx);
        }
    } else if (arrayOut != arrayIn)
        arrayOut->Type()->CopyData(_ParamPointer(1), _ParamPointer(0));

    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(ArrayReverse, TypedArrayCoreRef, TypedArrayCoreRef)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    IntIndex arrayInLength = arrayIn->Length();

    if (arrayOut == arrayIn) {
        printf("(Error 'Can't ArrayReverse inplace.')\n");
        return THREAD_EXEC()->Stop();
    }
    
    arrayOut->Resize1D(arrayInLength);
    for (IntIndex i = 0; i < arrayInLength; i++)
        arrayOut->ElementType()->CopyData(arrayIn->BeginAt(i), arrayOut->BeginAt(arrayInLength - 1 - i));

    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(ArrayRotate, TypedArrayCoreRef, TypedArrayCoreRef, Int32)
{
    TypedArrayCoreRef arrayOut = _Param(0);
    TypedArrayCoreRef arrayIn = _Param(1);
    Int32 offset = _Param(2);

    if (arrayOut == arrayIn) {
        printf("(Error 'Can't ArrayRotate inplace.')\n");
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
 //   vDSP_vaddD(_Param(0)->Begin(), 1, _Param(1)->Begin(), 1, _Param(2)->Begin(), 1, minSize);
#else
#endif
    return _NextInstruction();
}
#endif

DEFINE_VIREO_BEGIN(ExecutionContext)
    DEFINE_VIREO_FUNCTION(ArrayFill, "p(o(.Array) i(.Int32) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayCapacity, "p(i(.Array) o(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayLength, "p(i(.Array) o(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayRank, "p(i(.Array) o(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayResize, "p(io(.Array) o(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayIndexElt, "p(i(.Array) i(.Int32) o(.*))")
    DEFINE_VIREO_FUNCTION(ArrayAppendElt, "p(i(.Array) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayReplaceElt, "p(o(.Array) i(.Array) i(.Int32) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayReplaceSubset, "p(o(.Array) i(.Array) i(.Int32) i(.Array))")
    DEFINE_VIREO_FUNCTION(ArraySubset,"p(o(.Array) i(.Array) i(.Int32) i(.Int32))")
    DEFINE_VIREO_FUNCTION(ArrayInsertElt, "p(o(.Array) i(.Array) i(.Int32) i(.*))")
    DEFINE_VIREO_FUNCTION(ArrayInsertSubset, "p(o(.Array) i(.Array) i(.Int32) i(.Array))")
    DEFINE_VIREO_FUNCTION(ArrayReverse, "p(o(.Array) i(.Array))")
    DEFINE_VIREO_FUNCTION(ArrayRotate, "p(o(.Array) i(.Array) i(.Int32))")
DEFINE_VIREO_END()

