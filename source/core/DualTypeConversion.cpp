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
    bool DualTypeConversion::ShouldInflateDestination() const
    {
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY) const
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
            case kEncoding_Enum:
            {
                TypeRef enumSubElement = typeRefX->GetSubElement(0);
                IntIndex fieldOffsetX = enumSubElement->ElementOffset();
                AQBlock1* pDataXElement = static_cast<AQBlock1*>(pDataX) + fieldOffsetX;
                success = Apply(enumSubElement, pDataXElement, typeRefY, pDataY);
                break;
            }
            default:
                break;
        }
        return success;
    };

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(StringRef stringRefX, StringRef stringRefY) const
    {
        SubString subString = stringRefX->MakeSubStringAlias();
        stringRefY->CopyFromSubString(&subString);
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(Timestamp* timestampX, Timestamp* timestampY) const
    {
        *timestampY = *timestampX;
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY) const
    {
        *complexSingleY = *complexSingleX;
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY) const
    {
        *complexDoubleY = *complexDoubleX;
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        *reinterpret_cast<Boolean*>(pDataY) = *static_cast<Boolean*>(pDataX);
        return true;
    }

    template<typename X, typename Y, typename Z> Y ConvertFromEnum(Z valueX, TypeRef typeRefY)
    {
        X integerValueX = static_cast<X>(valueX);
        Y unsignedIntegerValueX = integerValueX >= 0 ? integerValueX : 0;
        Y numElementsInY = static_cast<Y>(typeRefY->GetEnumItemCount());
        if (unsignedIntegerValueX >= numElementsInY) {
            unsignedIntegerValueX = numElementsInY - 1;
        }
        return unsignedIntegerValueX;
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
            case kEncoding_Enum:
                switch (typeRefY->TopAQSize()) {
                    case 0:
                        break;
                    case 1:
                        *reinterpret_cast<UInt8*>(pDataY) = ConvertFromEnum<Int8, UInt8, T>(valueX, typeRefY);
                        break;
                    case 2:
                        *reinterpret_cast<UInt16*>(pDataY) = ConvertFromEnum<Int16, UInt16, T>(valueX, typeRefY);
                        break;
                    case 4:
                        *reinterpret_cast<UInt32*>(pDataY) = ConvertFromEnum<Int32, UInt32, T>(valueX, typeRefY);
                        break;
                    case 8:
                        *reinterpret_cast<UInt64*>(pDataY) = ConvertFromEnum<Int64, UInt64, T>(valueX, typeRefY);;
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
            {
                if (typeRefY->TopAQSize() == sizeof(Single)) {
                    *reinterpret_cast<Single*>(pDataY) = static_cast<Single>(valueX);
                } else {
                    *reinterpret_cast<Double*>(pDataY) = static_cast<Double>(valueX);
                }
                break;
            }
            default:
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
    bool DualTypeConversion::AreBooleanCompatible(TypeRef typeRefX, TypeRef typeRefY) const
    {
        bool sameEncodingAndSize = DoTypesHaveSameEncodingAndSize(typeRefX, typeRefY);
        return sameEncodingAndSize;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreUIntCompatible(TypeRef typeRefX, TypeRef typeRefY) const
    {
        bool typesAreCompatible = TypesAreCompatible(typeRefX, typeRefY);
        return typesAreCompatible;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreS2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY) const
    {
        bool typesAreCompatible = TypesAreCompatible(typeRefX, typeRefY);
        return typesAreCompatible;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreIEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY) const
    {
        bool typesAreCompatible = TypesAreCompatible(typeRefX, typeRefY);
        return typesAreCompatible;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::AreIntrinsicClustersCompatible(TypeRef typeRefX, TypeRef typeRefY) const
    {
        if (typeRefX->IsComplex() && typeRefY->IsComplex()) {  // Complex single and complex double are compatible types.
            return true;
        }
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        return typeXName.Compare(&typeYName);
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
