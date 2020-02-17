// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Native Verio functions for LV flat data format.
 */

#include "TypeDefiner.h"

// TODO(PaulAustin): Code review
namespace Vireo
{
inline UInt32 ReadLittleEndianUInt32(UInt8 *aBuf, IntIndex i) {
    return aBuf[i] | (aBuf[i+1] << 8) | (aBuf[i+2] << 16)  | (aBuf[i+3] << 24);
}
inline UInt32 ReadBigEndianUInt32(UInt8 *aBuf, IntIndex i) {
    return (aBuf[i] << 24) | (aBuf[i+1] << 16) | (aBuf[i+2] << 8)  | aBuf[i];
}
inline void WriteLittleEndianUInt32(UInt8 *aBuf, IntIndex i, UInt32 v) {
    aBuf[i] = v & 0xff; aBuf[i+1] = (v >> 8) & 0xff; aBuf[i+2] = (v >> 16) & 0xff; aBuf[i+3] = (v >> 24) & 0xff;
}
inline void WriteBigEndianUInt32(UInt8 *aBuf, IntIndex i, UInt32 v) {
    aBuf[i] = (v >> 24) & 0xff; aBuf[i+1] = (v >> 16) & 0xff; aBuf[i+2] = (v >> 8) & 0xff; aBuf[i+3] = v & 0xff;
}

NIError FlattenData(TypeRef type, void *pData, StringRef pString, Boolean prependArrayLength)
{
    EncodingEnum encoding = type->BitEncoding();

    switch (encoding) {
        case kEncoding_Array:
        {
            TypedArrayCoreRef pArray = *(TypedArrayCoreRef*) pData;
            IntIndex* dimLengths = pArray->DimensionLengths();
            Int32 rank = pArray->Rank();

            if (pArray == nullptr)
                return kNIError_kResourceNotFound;

            TypeRef elementType = type->GetSubElement(0);

            // Conditionally prepend an array with its length.
            // This is only optional for top-level data.  Arrays contained in
            // other data structures always include length information.
            if (prependArrayLength) {
                for (Int32 i = 0; i < rank; i++) {
                    // LV format is bigendian.
                    UInt32 arrayLength = dimLengths[i];
                    WriteBigEndianUInt32((UInt8*)&arrayLength, 0, dimLengths[i]);
                    pString->Append(sizeof(arrayLength), (Utf8Char*)&arrayLength);
                }
            }

            if (elementType->IsFlat()) {
                pString->Append(pArray->Length() * elementType->TopAQSize(), (Utf8Char*)pArray->BeginAt(0));
            } else {
                // Recursively call FlattenData on each element.
                // Arrays contained in other data structures always include
                // length information.
                size_t   elementLength = pArray->SlabLengths()[0];
                AQBlock1 *pElement = pArray->BeginAt(0);
                AQBlock1 *pEnd = pElement + (pArray->Length() * elementLength);

                for (; pElement < pEnd; pElement += elementLength)
                    FlattenData(elementType, pElement, pString, true);
            }
            break;
        }
        case kEncoding_Cluster:
        {
            IntIndex count = type->SubElementCount();

            for (IntIndex j = 0; j < count; j++) {
                TypeRef elementType = type->GetSubElement(j);
                IntIndex offset = elementType->ElementOffset();
                AQBlock1* pElementData = (AQBlock1*)pData + offset;

                // Recursively call FlattenData on each element with
                // prependArrayLength set to true.
                FlattenData(elementType, pElementData, pString, true);
            }
            break;
        }
        default:
        {
            pString->Append(type->TopAQSize(), (Utf8Char*)pData);
            break;
        }
    }

    return kNIError_Success;
}

VIREO_FUNCTION_SIGNATURE4(FlattenToString, StaticType, void, Boolean, StringRef)
{
    TypeRef type = _ParamPointer(0);
    void *pData = _ParamPointer(1);
    Boolean prependArrayLength = _ParamPointer(2) ? _Param(2) : true;
    String *pString = _Param(3);

    pString->Resize1D(0);
    FlattenData(type, pData, pString, prependArrayLength);

    return _NextInstruction();
}

IntIndex UnflattenData(SubBinaryBuffer *pBuffer, Boolean prependArrayLength, IntIndex stringIndex, void *pDefaultData, TypeRef type, void *pData)
{
    EncodingEnum encoding = type->BitEncoding();

    switch (encoding) {
        case kEncoding_Array:
        {
            TypedArrayCoreRef pArray = pData ? *(TypedArrayCoreRef*) pData : nullptr;
            TypeRef elementType = type->GetSubElement(0);
            Int32 arrayLength;

            // If length information precedes the array, read it.
            // Otherwise, infer it based on the size of the remaining string.
            if (prependArrayLength) {
                // If the string is long enough, read the array length
                if (stringIndex + (IntIndex)sizeof(arrayLength) <= pBuffer->Length()) {
                    UInt8 *aBuf = (UInt8*)pBuffer->Begin();
                    arrayLength = ReadBigEndianUInt32(aBuf, stringIndex);
                    stringIndex += sizeof(arrayLength);
                } else {
                    return -1;
                }
            } else {
                arrayLength = (pBuffer->Length() - stringIndex) / elementType->TopAQSize();
            }

            // If the length is a sane value, resize the array.
            if (arrayLength <= pBuffer->Length() - stringIndex) {
                if (pArray)
                    pArray->Resize1D(arrayLength);
            } else {
                return -1;
            }

            if (elementType->IsFlat()) {
                Int32 copyLength = arrayLength * elementType->TopAQSize();

                // If the string is long enough, copy data.
                if (stringIndex + copyLength <= pBuffer->Length()) {
                    if (pArray)
                        memcpy(pArray->BeginAt(0), (pBuffer->Begin() + stringIndex), copyLength);
                    stringIndex += copyLength;
                } else {
                    return -1;
                }
            } else if (pData) {
                // Recursively call UnflattenData for each element.
                // Arrays contained in other data structures always include
                // length information.
                size_t   elementLength = pArray->SlabLengths()[0];
                AQBlock1 *pEnd = pArray->BeginAt(0) + (pArray->DimensionLengths()[0] * elementLength);
                AQBlock1 *pElementData = pArray->BeginAt(0);

                for (; pElementData < pEnd; pElementData += elementLength) {
                    stringIndex = UnflattenData(pBuffer, true, stringIndex, pDefaultData, elementType, pElementData);
                    if (stringIndex == -1)
                        return -1;
                }
            } else {
                // pData is nullptr, so call UnflattenData recursing on elements of pDefaultData.
                // Arrays contained in other data structures always include
                // length information.
                TypedArrayCoreRef pDefaultArray = *(TypedArrayCoreRef *) pDefaultData;
                size_t   elementLength = pDefaultArray->SlabLengths()[0];
                AQBlock1 *pEnd = pDefaultArray->BeginAt(0) + (pDefaultArray->DimensionLengths()[0] * elementLength);
                AQBlock1 *pElementData = pDefaultArray->BeginAt(0);

                for (; pElementData < pEnd; pElementData += elementLength) {
                    stringIndex = UnflattenData(pBuffer, true, stringIndex, pElementData, elementType, nullptr);
                    if (stringIndex == -1)
                        return -1;
                }
            }
            break;
        }
        case kEncoding_Cluster:
        {
            IntIndex count = type->SubElementCount();

            for (IntIndex j = 0; j < count; j++) {
                // Recursively call UnflattenData for each element with
                // prependArrayLength set to true.
                TypeRef elementType = type->GetSubElement(j);
                IntIndex offset = elementType->ElementOffset();
                AQBlock1* pElementData = pData ? (AQBlock1*)pData + offset : nullptr;

                stringIndex = UnflattenData(pBuffer, true, stringIndex, pDefaultData, elementType, pElementData);
                if (stringIndex == -1)
                    return -1;
            }
            break;
        }
        default:
        {
            Int32 copyLength = type->TopAQSize();

            // If the string is long enough, copy data.
            if (stringIndex + copyLength <= pBuffer->Length()) {
                if (pData)
                    memcpy(pData, (pBuffer->Begin() + stringIndex), copyLength);
                stringIndex += copyLength;
            } else {
                return -1;
            }
            break;
        }
    }

    return stringIndex;
}

VIREO_FUNCTION_SIGNATURE7(UnflattenFromString, StringRef, Boolean, StaticType, void, StringRef, void, Boolean)
{
    StringRef pString = _Param(0);
    Boolean prependArrayLength = _ParamPointer(1) ? _Param(1) : true;
    TypeRef type = _ParamPointer(2);
    void *pDefaultData = _ParamPointer(3);
    StringRef pRemainder = _ParamPointer(4) ? _Param(4) : nullptr;
    void *pData = _ParamPointer(5);

    SubBinaryBuffer subBuffer(pString->Begin(), pString->End());
    IntIndex remainderIndex = UnflattenData(&subBuffer, prependArrayLength, 0, pDefaultData, type, pData);
    IntIndex remainderLength = pString->Length() - remainderIndex;
    Boolean error = (remainderIndex == -1);

    if (error)
        type->CopyData(pDefaultData, pData);

    // Set the optional output param for the remaining string.
    if (pRemainder) {
        pRemainder->Resize1D(0);
        if (!error)
            pRemainder->Append(remainderLength, pString->BeginAt(remainderIndex));
    }

    // Set the optional output param for error.
    if (_ParamPointer(6))
        _Param(6) = error;

    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(TDCodecLVFlat)
DEFINE_VIREO_FUNCTION(FlattenToString, "p(i(StaticTypeAndData) i(Boolean) o(String))");
DEFINE_VIREO_FUNCTION(UnflattenFromString, "p(i(String) i(Boolean) i(StaticTypeAndData) o(String) o(*) o(Boolean))");
DEFINE_VIREO_END()

}  // namespace Vireo



