/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Compares if two types have the same structure and the same values
*/

#include "TwoTypeEqual.h"

namespace Vireo
{
    //------------------------------------------------------------
    TwoTypeEqual::TwoTypeEqual ()
    {
        _areEqual = true;
    }

    //------------------------------------------------------------
    Boolean TwoTypeEqual::Apply(TypeRef typeRefA, TypeRef typeRefB)
    {
        EncodingEnum encodingA = typeRefA->BitEncoding();
        EncodingEnum encodingB = typeRefB->BitEncoding();
        if (encodingA != encodingB) {
            _areEqual = false;
            return false;
        }
        bool canContinue = false;
        if (typeRefA->IsVariant() && typeRefB->IsVariant()) {
            canContinue = CompareVariants(typeRefA, typeRefB);
        } else {
            switch (encodingA)
            {
            case kEncoding_Boolean:
                canContinue = CompareBooleans(typeRefA, typeRefB);
                break;
            case kEncoding_UInt:
                canContinue = CompareUInts(typeRefA, typeRefB);
                break;
            case kEncoding_S2CInt:
                canContinue = CompareS2CInts(typeRefA, typeRefB);
                break;
            case kEncoding_IEEE754Binary:
                canContinue = CompareIEEE754Binaries(typeRefA, typeRefB);
                break;
            case kEncoding_Ascii:
                // TODO
                break;
            case kEncoding_Unicode:
                // TODO
                break;
            case kEncoding_RefNum:
                // TODO
                break;
            case kEncoding_Cluster:
                canContinue = CompareClusters(typeRefA, typeRefB);
                break;
            case kEncoding_Array:
                canContinue = CompareArrays(typeRefA, typeRefB);
                break;
            default:
                _areEqual = false;
            }
        }
        return canContinue;
    };

    //------------------------------------------------------------
    bool TwoTypeEqual::CompareVariants(TypeRef typeRefA, TypeRef typeRefB)
    {
        TypeRef variantInnerTypeA = *static_cast<TypeRef*>(typeRefA->Begin(kPARead));
        TypeRef variantInnerTypeB = *static_cast<TypeRef*>(typeRefB->Begin(kPARead));
        return (!variantInnerTypeA && !variantInnerTypeB) || Apply(variantInnerTypeA, variantInnerTypeB);
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::CompareBooleans(TypeRef typeRefA, TypeRef typeRefB)
    {
        bool booleanValueA = *static_cast<Boolean*>(typeRefA->Begin(kPARead));
        bool booleanValueB = *static_cast<Boolean*>(typeRefB->Begin(kPARead));
        _areEqual = (booleanValueA == booleanValueB);
        return _areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::CompareUInts(TypeRef typeRefA, TypeRef typeRefB)
    {
        if (typeRefA->TopAQSize() == typeRefB->TopAQSize()) {
            switch (typeRefA->TopAQSize()) {
            case 0:
                _areEqual = true;
                break;
            case 1: {
                UInt8 uInt8ValueA = *static_cast<UInt8*>(typeRefA->Begin(kPARead));
                UInt8 uInt8ValueB = *static_cast<UInt8*>(typeRefB->Begin(kPARead));
                _areEqual = (uInt8ValueA == uInt8ValueB);
            }
                    break;
            case 2: {
                UInt16 uInt16ValueA = *static_cast<UInt16*>(typeRefA->Begin(kPARead));
                UInt16 uInt16ValueB = *static_cast<UInt16*>(typeRefB->Begin(kPARead));
                _areEqual = (uInt16ValueA == uInt16ValueB);
            }
                    break;
            case 4: {
                UInt32 uInt32ValueA = *static_cast<UInt32*>(typeRefA->Begin(kPARead));
                UInt32 uInt32ValueB = *static_cast<UInt32*>(typeRefB->Begin(kPARead));
                _areEqual = (uInt32ValueA == uInt32ValueB);
            }
                    break;
            case 8: {
                UInt64 uInt64ValueA = *static_cast<UInt64*>(typeRefA->Begin(kPARead));
                UInt64 uInt64ValueB = *static_cast<UInt64*>(typeRefB->Begin(kPARead));
                _areEqual = (uInt64ValueA == uInt64ValueB);
            }
                    break;
            default:
                _areEqual = false;
            }
        }
        else {
            _areEqual = false;
        }
        return _areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::CompareS2CInts(TypeRef typeRefA, TypeRef typeRefB)
    {
        if (typeRefA->TopAQSize() == typeRefB->TopAQSize()) {
            switch (typeRefA->TopAQSize()) {
            case 0:
                _areEqual = true;
                break;
            case 1: {
                Int8 int8ValueA = *static_cast<Int8*>(typeRefA->Begin(kPARead));
                Int8 int8ValueB = *static_cast<Int8*>(typeRefB->Begin(kPARead));
                _areEqual = (int8ValueA == int8ValueB);
            }
                    break;
            case 2: {
                Int16 int16ValueA = *static_cast<Int16*>(typeRefA->Begin(kPARead));
                Int16 int16ValueB = *static_cast<Int16*>(typeRefB->Begin(kPARead));
                _areEqual = (int16ValueA == int16ValueB);
            }
                    break;
            case 4: {
                Int32 int32ValueA = *static_cast<Int32*>(typeRefA->Begin(kPARead));
                Int32 int32ValueB = *static_cast<Int32*>(typeRefB->Begin(kPARead));
                _areEqual = (int32ValueA == int32ValueB);
            }
                    break;
            case 8: {
                Int64 int64ValueA = *static_cast<Int64*>(typeRefA->Begin(kPARead));
                Int64 int64ValueB = *static_cast<Int64*>(typeRefB->Begin(kPARead));
                _areEqual = (int64ValueA == int64ValueB);
            }
                    break;
            default:
                _areEqual = false;
            }
        }
        else {
            _areEqual = false;
        }
        return _areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::CompareIEEE754Binaries(TypeRef typeRefA, TypeRef typeRefB)
    {
        if (typeRefA->TopAQSize() == typeRefB->TopAQSize()) {
            if (typeRefA->TopAQSize() == sizeof(Single)) {
                Single singleValueA = *static_cast<Single*>(typeRefA->Begin(kPARead));
                Single singleValueB = *static_cast<Single*>(typeRefB->Begin(kPARead));
                _areEqual = (singleValueA == singleValueB);
            }
            else {
                Double doubleValueA = *static_cast<Double*>(typeRefA->Begin(kPARead));
                Double doubleValueB = *static_cast<Double*>(typeRefB->Begin(kPARead));
                _areEqual = (doubleValueA == doubleValueB);
            }
        }
        else {
            _areEqual = false;
        }
        return _areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::CompareClusters(TypeRef typeRefA, TypeRef typeRefB)
    {
        _areEqual = false;
        SubString typeAName, typeBName;
        Boolean isTypeAIntrinsicClusterType = typeRefA->IsIntrinsicClusterDataType(&typeAName);
        Boolean isTypeBIntrinsicClusterType = typeRefB->IsIntrinsicClusterDataType(&typeBName);
        if (isTypeAIntrinsicClusterType && isTypeBIntrinsicClusterType) {
            bool dataEqual = true; // todo compare data?
            if (typeAName.Compare(&typeBName) && dataEqual) {
                return true;
            }
        } else if (!isTypeAIntrinsicClusterType && !isTypeBIntrinsicClusterType) {
            if (typeRefA->SubElementCount() == typeRefB->SubElementCount()) {
                for (Int32 i = 0; i < typeRefA->SubElementCount(); i++) {
                    if (!Apply(typeRefA->GetSubElement(i), typeRefB->GetSubElement(i))) {
                        _areEqual = false;
                        return false;
                    }
                }
                _areEqual = true;
            }
        }
        return _areEqual;
    }

    //------------------------------------------------------------
    bool TwoTypeEqual::CompareArrays(TypeRef typeRefA, TypeRef typeRefB)
    {
        _areEqual = false;
        return false;
    }
};  // namespace Vireo
