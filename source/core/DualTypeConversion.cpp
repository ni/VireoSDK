/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Compares if two types have the same structure and does conversion for numeric values
*/

#include "DualTypeConversion.h"

namespace Vireo
{
    //------------------------------------------------------------
    DualTypeConversion::DualTypeConversion()
    {
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ShouldInflateDestination()
    {
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        EncodingEnum encodingX = typeRefX->BitEncoding();
        bool success = false;
        switch (encodingX)
        {
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
    };

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(StringRef stringRefX, StringRef stringRefY)
    {
        stringRefY->CopyFromSubString(&stringRefX->MakeSubStringAlias());
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(Timestamp* timestampX, Timestamp* timestampY)
    {
        *timestampY = *timestampX;
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY)
    {
        *complexSingleY = *complexSingleX;
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY)
    {

        *complexDoubleY = *complexDoubleX;
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        bool booleanValueX = *static_cast<Boolean*>(pDataX);
        bool booleanValueY = *static_cast<Boolean*>(pDataY);
        booleanValueY = booleanValueX;
        return true;
    }

    template<typename T> void ApplyNumeric(T valueX, TypeRef typeRefY, void* pDataY)
    {
        EncodingEnum encodingY = typeRefY->BitEncoding();
        switch (encodingY) {
            case kEncoding_UInt:
                switch (typeRefY->TopAQSize()) {
                    case 0:
                        break;
                    case 1:
                        *reinterpret_cast<UInt8*>(pDataY) = static_cast<UInt8>(valueX);
                        break;
                    case 2:
                        *reinterpret_cast<UInt16*>(pDataY) = static_cast<UInt16>(valueX);
                        break;
                    case 4:
                        *reinterpret_cast<UInt32*>(pDataY) = static_cast<UInt32>(valueX);
                        break;
                    case 8:
                        *reinterpret_cast<UInt64*>(pDataY) = static_cast<UInt64>(valueX);
                        break;
                }
                break;
            case kEncoding_S2CInt:
                switch (typeRefY->TopAQSize()) {
                    case 0:
                        break;
                    case 1:
                        *reinterpret_cast<Int8*>(pDataY) = static_cast<Int8>(valueX);
                        break;
                    case 2:
                        *reinterpret_cast<Int16*>(pDataY) = static_cast<Int16>(valueX);
                        break;
                    case 4:
                        *reinterpret_cast<Int32*>(pDataY) = static_cast<Int32>(valueX);
                        break;
                    case 8:
                        *reinterpret_cast<Int64*>(pDataY) = static_cast<Int64>(valueX);
                        break;
                }
                break;
            case kEncoding_IEEE754Binary:
                if (typeRefY->TopAQSize() == sizeof(Single))
                {
                    *reinterpret_cast<Single*>(pDataY) = static_cast<Single>(valueX);
                }
                else {
                    *reinterpret_cast<Double*>(pDataY) = static_cast<Double>(valueX);
                }
                break;
            case kEncoding_Enum:
                break;
        }
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        switch (typeRefX->TopAQSize()) {
            case 0:
                break;
            case 1: {
                UInt8 uInt8ValueX = *static_cast<UInt8*>(pDataX);
                ApplyNumeric<UInt8>(uInt8ValueX, typeRefY, pDataY);
                break;
            }
            case 2: {
                UInt16 uInt16ValueX = *static_cast<UInt16*>(pDataX);
                ApplyNumeric<UInt16>(uInt16ValueX, typeRefY, pDataY);
                break;
            }
            case 4: {
                UInt32 uInt32ValueX = *static_cast<UInt32*>(pDataX);
                ApplyNumeric<UInt32>(uInt32ValueX, typeRefY, pDataY);
                break;
            }
            case 8: {
                UInt64 uInt64ValueX = *static_cast<UInt64*>(pDataX);
                ApplyNumeric<UInt64>(uInt64ValueX, typeRefY, pDataY);
                break;
            }
        }
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        switch (typeRefX->TopAQSize()) {
            case 0:
                break;
            case 1: {
                Int8 int8ValueX = *static_cast<Int8*>(pDataX);
                ApplyNumeric<Int8>(int8ValueX, typeRefY, pDataY);
                break;
            }
            case 2: {
                Int16 int16ValueX = *static_cast<Int16*>(pDataX);
                ApplyNumeric<Int16>(int16ValueX, typeRefY, pDataY);
                break;
            }
            case 4: {
                Int32 int32ValueX = *static_cast<Int32*>(pDataX);
                ApplyNumeric<Int32>(int32ValueX, typeRefY, pDataY);
                break;
            }
            case 8: {
                Int64 int64ValueX = *static_cast<Int64*>(pDataX);
                ApplyNumeric<Int64>(int64ValueX, typeRefY, pDataY);
                break;
            }
        }
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        if (typeRefX->TopAQSize() == sizeof(Single)) {
            Single singleValueX = *reinterpret_cast<Single*>(pDataX);
            ApplyNumeric<Single>(singleValueX, typeRefY, pDataY);
        } else {
            Double doubleValueX = *reinterpret_cast<Double*>(pDataX);
            ApplyNumeric<Double>(doubleValueX, typeRefY, pDataY);
        }
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreBooleanCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool sameEncodingAndSize = DoTypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreUIntCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool typesAreCompatible = TypesAreCompatible(typeRefX, typeRefY);
        return typesAreCompatible;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreS2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool typesAreCompatible = TypesAreCompatible(typeRefX, typeRefY);
        return typesAreCompatible;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreIEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool typesAreCompatible = TypesAreCompatible(typeRefX, typeRefY);
        return typesAreCompatible;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::DoTypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY)
    {
        EncodingEnum encodingX = typeRefX->BitEncoding();
        EncodingEnum encodingY = typeRefY->BitEncoding();
        bool sameEnconding = (encodingX == encodingY);
        bool sameSize = typeRefX->TopAQSize() == typeRefY->TopAQSize();
        return sameEnconding && sameSize;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::TypesAreCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool typesAreCompatible =
            (typeRefX->BitEncoding() == kEncoding_UInt ||
             typeRefX->BitEncoding() == kEncoding_S2CInt ||
             typeRefX->BitEncoding() == kEncoding_IEEE754Binary ||
             typeRefX->BitEncoding() == kEncoding_Enum)
            &&
            (typeRefY->BitEncoding() == kEncoding_UInt ||
             typeRefY->BitEncoding() == kEncoding_S2CInt ||
             typeRefY->BitEncoding() == kEncoding_IEEE754Binary ||
             typeRefY->BitEncoding() == kEncoding_Enum);
        return typesAreCompatible;
    }
};  // namespace Vireo
