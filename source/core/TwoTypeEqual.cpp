/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Compares if two types have the same structure and the same values
*/

#include "TwoTypeEqual.h"
#include "Platform.h"

namespace Vireo
{
    //------------------------------------------------------------
    TwoTypeEqual::TwoTypeEqual()
    {
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
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
        }
        return success;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::Apply(StringRef stringRefX, StringRef stringRefY)
    {
        bool areEqual = stringRefX->IsEqual(stringRefY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::Apply(Timestamp* timestampX, Timestamp* timestampY)
    {
        bool areEqual = (*timestampX == *timestampY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY)
    {
        bool areEqual = (*complexSingleX == *complexSingleY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY)
    {
        bool areEqual = (*complexDoubleX == *complexDoubleY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        bool booleanValueX = *static_cast<Boolean*>(pDataX);
        bool booleanValueY = *static_cast<Boolean*>(pDataY);
        bool areEqual = (booleanValueX == booleanValueY);
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        bool areEqual = false;
        switch (typeRefX->TopAQSize()) {
            case 0:
                areEqual = true;
                break;
            case 1: {
                UInt8 uInt8ValueX = *static_cast<UInt8*>(pDataX);
                UInt8 uInt8ValueY = *static_cast<UInt8*>(pDataY);
                areEqual = (uInt8ValueX == uInt8ValueY);
                break;
            }
            case 2: {
                UInt16 uInt16ValueX = *static_cast<UInt16*>(pDataX);
                UInt16 uInt16ValueY = *static_cast<UInt16*>(pDataY);
                areEqual = (uInt16ValueX == uInt16ValueY);
                break;
            }
            case 4: {
                UInt32 uInt32ValueX = *static_cast<UInt32*>(pDataX);
                UInt32 uInt32ValueY = *static_cast<UInt32*>(pDataY);
                areEqual = (uInt32ValueX == uInt32ValueY);
                break;
            }
            case 8: {
                UInt64 uInt64ValueX = *static_cast<UInt64*>(pDataX);
                UInt64 uInt64ValueY = *static_cast<UInt64*>(pDataY);
                areEqual = (uInt64ValueX == uInt64ValueY);
                break;
            }
        }
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        bool areEqual = false;
        switch (typeRefX->TopAQSize()) {
            case 0:
                areEqual = true;
                break;
            case 1: {
                Int8 int8ValueX = *static_cast<Int8*>(pDataX);
                Int8 int8ValueY = *static_cast<Int8*>(pDataY);
                areEqual = (int8ValueX == int8ValueY);
                break;
            }
            case 2: {
                Int16 int16ValueX = *static_cast<Int16*>(pDataX);
                Int16 int16ValueY = *static_cast<Int16*>(pDataY);
                areEqual = (int16ValueX == int16ValueY);
                break;
            }
            case 4: {
                Int32 int32ValueX = *static_cast<Int32*>(pDataX);
                Int32 int32ValueY = *static_cast<Int32*>(pDataY);
                areEqual = (int32ValueX == int32ValueY);
                // gPlatform.IO.Printf("are %d and %d equal? %s\n", int32ValueX, int32ValueY, areEqual ? "true" : "false");
                break;
            }
            case 8: {
                Int64 int64ValueX = *static_cast<Int64*>(pDataX);
                Int64 int64ValueY = *static_cast<Int64*>(pDataY);
                areEqual = (int64ValueX == int64ValueY);
                break;
            }
        }
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        bool areEqual = false;
        if (typeRefX->TopAQSize() == sizeof(Single)) {
            Single singleValueX = *static_cast<Single*>(pDataX);
            Single singleValueY = *static_cast<Single*>(pDataY);
            areEqual = (singleValueX == singleValueY);
        }
        else {
            Double doubleValueX = *static_cast<Double*>(pDataX);
            Double doubleValueY = *static_cast<Double*>(pDataY);
            areEqual = (doubleValueX == doubleValueY);
        }
        return areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::BooleanCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = TypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::UIntCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = TypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::S2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = TypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::IEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = TypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::TypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY)
    {
        EncodingEnum encodingX = typeRefX->BitEncoding();
        EncodingEnum encodingY = typeRefY->BitEncoding();
        bool sameEncoding = (encodingX == encodingY);
        bool sameSize = typeRefX->TopAQSize() == typeRefY->TopAQSize();
        return sameEncoding && sameSize;
    }
};  // namespace Vireo
