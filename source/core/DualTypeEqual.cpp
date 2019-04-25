/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Compares if two types have the same structure and the same values
*/

#include "DualTypeEqual.h"
#include "Platform.h"

namespace Vireo
{
    //------------------------------------------------------------
    DualTypeEqual::DualTypeEqual()
    {
    }

    bool DualTypeEqual::ShouldInflateDestination()
    {
        return false;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        EncodingEnum encodingX = typeRefX->BitEncoding();
        bool success = false;
        switch (encodingX) {
            case kEncoding_Boolean:
                success = ApplyBooleans(typeRefX, pDataX, typeRefY, pDataY);
                break;
            case kEncoding_UInt:
                success = ApplyUInts(typeRefX, pDataX, typeRefY, pDataY);
                break;
            case kEncoding_S2CInt:
                success = ApplyS2CInts(typeRefX, pDataX, typeRefY, pDataY);
                break;
            case kEncoding_IEEE754Binary:
                success = ApplyIEEE754Binaries(typeRefX, pDataX, typeRefY, pDataY);
                break;
            case kEncoding_Enum:
                success = ApplyUInts(typeRefX, pDataX, typeRefY, pDataY);
                break;
            default:
                break;
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::Apply(StringRef stringRefX, StringRef stringRefY)
    {
        bool areEqual = stringRefX->IsEqual(stringRefY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::Apply(Timestamp* timestampX, Timestamp* timestampY)
    {
        bool areEqual = (*timestampX == *timestampY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY)
    {
        bool areEqual = (*complexSingleX == *complexSingleY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY)
    {
        bool areEqual = (*complexDoubleX == *complexDoubleY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        bool booleanValueX = *static_cast<Boolean*>(pDataX);
        bool booleanValueY = *static_cast<Boolean*>(pDataY);
        bool areEqual = (booleanValueX == booleanValueY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        return memcmp(pDataX, pDataY, typeRefX->TopAQSize()) == 0;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        return memcmp(pDataX, pDataY, typeRefX->TopAQSize()) == 0;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        return memcmp(pDataX, pDataY, typeRefX->TopAQSize()) == 0;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::AreBooleanCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = DoTypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::AreUIntCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = DoTypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::AreS2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = DoTypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::AreIEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = DoTypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool DualTypeEqual::AreIntrinsicClustersCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        return typeXName.Compare(&typeYName);
    }

    //------------------------------------------------------------
    bool DualTypeEqual::DoTypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY)
    {
        EncodingEnum encodingX = typeRefX->BitEncoding();
        EncodingEnum encodingY = typeRefY->BitEncoding();
        bool sameEncoding = (encodingX == encodingY);
        bool sameSize = typeRefX->TopAQSize() == typeRefY->TopAQSize();
        return sameEncoding && sameSize;
    }
};  // namespace Vireo
