// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
\brief Compares if two types have the same structure and does conversion for numeric values
*/

#include "DualTypeConversion.h"

namespace Vireo
{
    // Convention used in naming methods and variables.
    // Integer = Signed and unsigned integer types
    // Integral = Integer and enum type
    // Numeric = Integral and floating point

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

    template<typename TSource, typename TDest> void ConvertNumericToEnum(TSource srcValue, TypeRef destTypeRef, void *destDataRef)
    {
        srcValue = srcValue >= 0 ? srcValue : 0;
        auto destEnumCount = static_cast<TDest>(destTypeRef->GetEnumItemCount());
        TDest dest = (static_cast<UInt32>(srcValue) >= static_cast<UInt32>(destEnumCount)) ? destEnumCount - 1 : static_cast<TDest>(srcValue);
        *reinterpret_cast<TDest*>(destDataRef) = dest;
    }

    template<typename T> void ApplyIntegralToNumeric(T srcValue, TypeRef destTypeRef, void* destDataRef)
    {
        EncodingEnum encodingY = destTypeRef->BitEncoding();
        switch (encodingY) {
            case kEncoding_UInt:
                switch (destTypeRef->TopAQSize()) {
                case 1:
                    *reinterpret_cast<UInt8*>(destDataRef) = static_cast<UInt8>(srcValue);
                    break;
                case 2:
                    *reinterpret_cast<UInt16*>(destDataRef) = static_cast<UInt16>(srcValue);
                    break;
                case 4:
                    *reinterpret_cast<UInt32*>(destDataRef) = static_cast<UInt32>(srcValue);
                    break;
                case 8:
                    *reinterpret_cast<UInt64*>(destDataRef) = static_cast<UInt64>(srcValue);
                    break;
                default:
                    VIREO_ASSERT(false);
                }
                break;
            case kEncoding_Enum:
                switch (destTypeRef->TopAQSize()) {
                    case 1:
                        ConvertNumericToEnum<T, UInt8>(srcValue, destTypeRef, destDataRef);
                        break;
                    case 2:
                        ConvertNumericToEnum<T, UInt16>(srcValue, destTypeRef, destDataRef);
                        break;
                    case 4:
                        ConvertNumericToEnum<T, UInt32>(srcValue, destTypeRef, destDataRef);
                        break;
                    case 8:
                        ConvertNumericToEnum<T, UInt64>(srcValue, destTypeRef, destDataRef);
                        break;
                    default:
                        VIREO_ASSERT(false);
                }
                break;
            case kEncoding_S2CInt:
                switch (destTypeRef->TopAQSize()) {
                    case 1:
                        *reinterpret_cast<Int8*>(destDataRef) = static_cast<Int8>(srcValue);
                        break;
                    case 2:
                        *reinterpret_cast<Int16*>(destDataRef) = static_cast<Int16>(srcValue);
                        break;
                    case 4:
                        *reinterpret_cast<Int32*>(destDataRef) = static_cast<Int32>(srcValue);
                        break;
                    case 8:
                        *reinterpret_cast<Int64*>(destDataRef) = static_cast<Int64>(srcValue);
                        break;
                    default:
                        VIREO_ASSERT(false);
                }
                break;
            case kEncoding_IEEE754Binary:
            {
                if (destTypeRef->TopAQSize() == sizeof(Single)) {
                    *reinterpret_cast<Single*>(destDataRef) = static_cast<Single>(srcValue);
                } else {
                    *reinterpret_cast<Double*>(destDataRef) = static_cast<Double>(srcValue);
                }
            }
                break;
            default:
                break;
        }
    }

    template<typename TSource> void ApplyFloatToNumeric(TSource srcValue, TypeRef destTypeRef, void* destDataRef)
    {
        EncodingEnum destEncoding = destTypeRef->BitEncoding();
        switch (destEncoding) {
            case kEncoding_UInt:
                switch (destTypeRef->TopAQSize()) {
                case 1:
                    *reinterpret_cast<UInt8*>(destDataRef) = ConvertFloatToInt<TSource, UInt8>(srcValue);
                    break;
                case 2:
                    *reinterpret_cast<UInt16*>(destDataRef) = ConvertFloatToInt<TSource, UInt16>(srcValue);
                    break;
                case 4:
                    *reinterpret_cast<UInt32*>(destDataRef) = ConvertFloatToInt<TSource, UInt32>(srcValue);
                    break;
                case 8:
                    *reinterpret_cast<UInt64*>(destDataRef) = ConvertFloatToInt<TSource, UInt64>(srcValue);
                    break;
                default:
                    VIREO_ASSERT(false);
                }
                break;
            case kEncoding_Enum:
                switch (destTypeRef->TopAQSize()) {
                    case 1:
                        ConvertNumericToEnum<TSource, UInt8>(srcValue, destTypeRef, destDataRef);
                        break;
                    case 2:
                        ConvertNumericToEnum<TSource, UInt16>(srcValue, destTypeRef, destDataRef);
                        break;
                    case 4:
                        ConvertNumericToEnum<TSource, UInt32>(srcValue, destTypeRef, destDataRef);
                        break;
                    case 8:
                        ConvertNumericToEnum<TSource, UInt64>(srcValue, destTypeRef, destDataRef);
                        break;
                    default:
                        VIREO_ASSERT(false);
                }
                break;
            case kEncoding_S2CInt:
                switch (destTypeRef->TopAQSize()) {
                    case 1:
                        *reinterpret_cast<Int8*>(destDataRef) = ConvertFloatToInt<TSource, Int8>(srcValue);
                        break;
                    case 2:
                        *reinterpret_cast<Int16*>(destDataRef) = ConvertFloatToInt<TSource, Int16>(srcValue);
                        break;
                    case 4:
                        *reinterpret_cast<Int32*>(destDataRef) = ConvertFloatToInt<TSource, Int32>(srcValue);
                        break;
                    case 8:
                        *reinterpret_cast<Int64*>(destDataRef) = ConvertFloatToInt<TSource, Int64>(srcValue);
                        break;
                    default:
                        VIREO_ASSERT(false);
                }
                break;
            case kEncoding_IEEE754Binary:
            {
                if (destTypeRef->TopAQSize() == sizeof(Single)) {
                    *reinterpret_cast<Single*>(destDataRef) = static_cast<Single>(srcValue);
                } else {
                    *reinterpret_cast<Double*>(destDataRef) = static_cast<Double>(srcValue);
                }
            }
                break;
            default:
                break;
        }
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        switch (typeRefX->TopAQSize()) {
            case 1: {
                UInt8 uInt8ValueX = *static_cast<UInt8*>(pDataX);
                ApplyIntegralToNumeric<UInt8>(uInt8ValueX, typeRefY, pDataY);
                break;
            }
            case 2: {
                UInt16 uInt16ValueX = *static_cast<UInt16*>(pDataX);
                ApplyIntegralToNumeric<UInt16>(uInt16ValueX, typeRefY, pDataY);
                break;
            }
            case 4: {
                UInt32 uInt32ValueX = *static_cast<UInt32*>(pDataX);
                ApplyIntegralToNumeric<UInt32>(uInt32ValueX, typeRefY, pDataY);
                break;
            }
            case 8: {
                UInt64 uInt64ValueX = *static_cast<UInt64*>(pDataX);
                ApplyIntegralToNumeric<UInt64>(uInt64ValueX, typeRefY, pDataY);
                break;
             }
            default:
                VIREO_ASSERT(false);
        }
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        switch (typeRefX->TopAQSize()) {
            case 1: {
                Int8 int8ValueX = *static_cast<Int8*>(pDataX);
                ApplyIntegralToNumeric<Int8>(int8ValueX, typeRefY, pDataY);
                break;
            }
            case 2: {
                Int16 int16ValueX = *static_cast<Int16*>(pDataX);
                ApplyIntegralToNumeric<Int16>(int16ValueX, typeRefY, pDataY);
                break;
            }
            case 4: {
                Int32 int32ValueX = *static_cast<Int32*>(pDataX);
                ApplyIntegralToNumeric<Int32>(int32ValueX, typeRefY, pDataY);
                break;
            }
            case 8: {
                Int64 int64ValueX = *static_cast<Int64*>(pDataX);
                ApplyIntegralToNumeric<Int64>(int64ValueX, typeRefY, pDataY);
                break;
            }
            default:
                VIREO_ASSERT(false);
        }
        return true;
    }

    //------------------------------------------------------------
    bool DualTypeConversion::ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY)
    {
        if (typeRefX->TopAQSize() == sizeof(Single)) {
            Single singleValueX = *reinterpret_cast<Single*>(pDataX);
            ApplyFloatToNumeric<Single>(singleValueX, typeRefY, pDataY);
        } else {
            Double doubleValueX = *reinterpret_cast<Double*>(pDataX);
            ApplyFloatToNumeric<Double>(doubleValueX, typeRefY, pDataY);
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
