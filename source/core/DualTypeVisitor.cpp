/**
Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Variant data type and variant attribute support functions
*/

#include "DualTypeVisitor.h"
#include "Variants.h"

namespace Vireo
{
    //------------------------------------------------------------
    bool DualTypeVisitor::Visit(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        bool success = false;
        success = TypesAreCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
        if (success)
            success = Apply(typeRefX, pDataX, typeRefY, pDataY, operation);
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::TypesAreCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        bool success = false;
        if (typeRefX->IsVariant() && typeRefY->IsVariant()) {
            success = VariantCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
        } else {
            EncodingEnum encodingX = typeRefX->BitEncoding();
            switch (encodingX) {
            case kEncoding_Boolean:
                success = operation.AreBooleanCompatible(typeRefX, typeRefY);
                break;
            case kEncoding_UInt:
                success = operation.AreUIntCompatible(typeRefX, typeRefY);
                break;
            case kEncoding_S2CInt:
                success = operation.AreS2CIntCompatible(typeRefX, typeRefY);
                break;
            case kEncoding_IEEE754Binary:
                success = operation.AreIEEE754BinaryCompatible(typeRefX, typeRefY);
                break;
            case kEncoding_Cluster:
                success = typeRefY->BitEncoding() == kEncoding_Cluster && ClusterCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
                break;
            case kEncoding_Enum:
                success = EnumCompatible(typeRefX, typeRefY, operation);
                break;
            case kEncoding_Array: {
                if (typeRefX->Rank() == 1 && typeRefX->GetSubElement(0)->BitEncoding() == kEncoding_Unicode) {
                    success = StringCompatible(typeRefX, typeRefY);
                } else {
                    success = typeRefY->BitEncoding() == kEncoding_Array && ArrayCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
                }
                break;
            }
            case kEncoding_None:
                success = typeRefY->BitEncoding() == kEncoding_None;
                break;
            default:
                success = false;
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::VariantCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        VariantTypeRef variantTypeX = reinterpret_cast<VariantTypeRef>(typeRefX);
        VariantTypeRef variantTypeY = reinterpret_cast<VariantTypeRef>(typeRefY);

        TypeRef variantUnderlyingTypeX = variantTypeX->_underlyingTypeRef;
        TypeRef variantUnderlyingTypeY = variantTypeY->_underlyingTypeRef;
        bool success = false;
        if (!variantUnderlyingTypeX && !variantUnderlyingTypeY) {
            success = true;
        } else if (!variantUnderlyingTypeX || !variantUnderlyingTypeY) {
            return false;
        } else {
            success = TypesAreCompatible(variantUnderlyingTypeX,
                variantUnderlyingTypeX->Begin(kPARead),
                variantUnderlyingTypeY,
                variantUnderlyingTypeY->Begin(kPARead),
                operation);
        }
        if (success) {
            // compare attributes
            if (!variantTypeX->_attributeMap && !variantTypeY->_attributeMap) {
                return true;
            } else if (variantTypeX->_attributeMap && variantTypeY->_attributeMap) {
                if (variantTypeX->_attributeMap->size() != variantTypeY->_attributeMap->size()) {
                    return false;
                }
                for (const auto attributePairInX : *variantTypeX->_attributeMap) {
                    StringRef const attributeNameStrInX = attributePairInX.first;
                    VariantTypeRef attributeValueInX = attributePairInX.second;
                    auto attributePairInY = variantTypeY->_attributeMap->find(attributeNameStrInX);
                    if (attributePairInY != variantTypeY->_attributeMap->end()) {
                        VariantTypeRef attributeValueInY = attributePairInY->second;
                        if (!TypesAreCompatible(attributeValueInX,
                            attributeValueInX->Begin(kPARead),
                            attributeValueInY,
                            attributeValueInY->Begin(kPARead),
                            operation)) {
                            return false;
                        }
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ClusterCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        bool success = false;
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        if (isTypeXIntrinsicClusterType && isTypeYIntrinsicClusterType) {
            success = operation.AreIntrinsicClustersCompatible(typeRefX, typeRefY);
        } else if (!isTypeXIntrinsicClusterType && !isTypeYIntrinsicClusterType) {
            success = UserDefinedClustersCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::UserDefinedClustersCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        bool success = typeRefX->SubElementCount() == typeRefY->SubElementCount();
        if (success) {
            IntIndex i = 0;
            while (success && i < typeRefX->SubElementCount()) {
                TypeRef elementXType = typeRefX->GetSubElement(i);
                TypeRef elementYType = typeRefY->GetSubElement(i);
                IntIndex fieldOffsetX = elementXType->ElementOffset();
                IntIndex fieldOffsetY = elementYType->ElementOffset();
                AQBlock1* pDataXElement = static_cast<AQBlock1*>(pDataX) + fieldOffsetX;
                AQBlock1* pDataYElement = static_cast<AQBlock1*>(pDataY) + fieldOffsetY;

                success = TypesAreCompatible(elementXType, pDataXElement, elementYType, pDataYElement, operation);
                i++;
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::EnumCompatible(TypeRef typeRefX, TypeRef typeRefY, const DualTypeOperation &operation)
    {
        bool success = TypesAreCompatible(typeRefX->GetSubElement(0),
            typeRefX->Begin(kPARead),
            typeRefY->GetSubElement(0),
            typeRefY->Begin(kPARead), operation);
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::StringCompatible(TypeRef typeRefX, TypeRef typeRefY)
    {
        bool success =
            typeRefY->BitEncoding() == kEncoding_Array &&
            typeRefY->Rank() == 1 &&
            typeRefY->GetSubElement(0)->BitEncoding() == kEncoding_Unicode;
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ArrayCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        // Verify number of dimensions are the same
        bool success = typeRefX->Rank() == typeRefY->Rank();
        // Verify each dimension has the same size
        if (success) {
            TypedArrayCoreRef arrayX = *(static_cast<const TypedArrayCoreRef*>(pDataX));
            TypedArrayCoreRef arrayY = *(static_cast<const TypedArrayCoreRef*>(pDataY));
            if (operation.ShouldInflateDestination()) {
                arrayY->ResizeToMatchOrEmpty(arrayX);
            } else {
                IntIndex* dimensionLenghtsX = arrayX->DimensionLengths();
                IntIndex* dimensionLenghtsY = arrayY->DimensionLengths();
                IntIndex i = 0;
                while (success && i < typeRefX->Rank()) {
                    success = (dimensionLenghtsX[i] == dimensionLenghtsY[i]);
                    i++;
                }
            }
            // Verify each array has the same element type
            if (success)
                success = TypesAreCompatible(arrayX->ElementType(), arrayX->BeginAt(0), arrayY->ElementType(), arrayY->BeginAt(0), operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        bool success = false;
        if (typeRefX->IsVariant() && typeRefY->IsVariant()) {
            success = ApplyVariant(typeRefX, pDataX, typeRefY, pDataY, operation);
        } else {
            EncodingEnum encodingX = typeRefX->BitEncoding();
            switch (encodingX)
            {
            case kEncoding_Cluster:
                success = ApplyCluster(typeRefX, pDataX, typeRefY, pDataY, operation);
                break;
            case kEncoding_Array:
                if (typeRefX->Rank() == 1 && typeRefX->GetSubElement(0)->BitEncoding() == kEncoding_Unicode)
                    success = ApplyString(typeRefX, pDataX, typeRefY, pDataY, operation);
                else
                    success = ApplyArray(typeRefX, pDataX, typeRefY, pDataY, operation);
                break;
            case kEncoding_None:
                success = typeRefY->BitEncoding() == kEncoding_None;
                break;
            default:
                success = operation.Apply(typeRefX, pDataX, typeRefY, pDataY);
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyVariant(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        VariantTypeRef variantTypeX = reinterpret_cast<VariantTypeRef> (typeRefX);
        VariantTypeRef variantTypeY = reinterpret_cast<VariantTypeRef> (typeRefY);
        TypeRef variantUnderlyingTypeX = variantTypeX->_underlyingTypeRef;
        TypeRef variantUnderlyingTypeY = variantTypeY->_underlyingTypeRef;
        pDataX = typeRefX->Begin(kPARead);
        pDataY = typeRefY->Begin(kPARead);
        bool success = false;
        if (!variantUnderlyingTypeX && !variantUnderlyingTypeY) {
            success = true;
        } else if (!variantUnderlyingTypeX || !variantUnderlyingTypeY){
            return false;
        } else {
            success = Apply(variantUnderlyingTypeX, pDataX, variantUnderlyingTypeY, pDataY, operation);
        }
        if (success) {
            // compare attributes
            if (!variantTypeX->_attributeMap && !variantTypeY->_attributeMap) {
                return true;
            } else if (variantTypeX->_attributeMap && variantTypeY->_attributeMap) {
                // TODO(siddhukrs) - since attribute maps are ordered, we can compare them in a single loop for efficiency
                for (const auto attributePairInX : *variantTypeX->_attributeMap) {
                    StringRef const attributeNameInX = attributePairInX.first;
                    VariantTypeRef attributeValueInX = attributePairInX.second;
                    auto attributePairInY = variantTypeY->_attributeMap->find(attributeNameInX);
                    VariantTypeRef attributeValueInY = attributePairInY->second;
                    if (!Apply(attributeValueInX,
                        attributeValueInX->Begin(kPARead),
                        attributeValueInY,
                        attributeValueInY->Begin(kPARead),
                        operation)) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyCluster(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        bool success = true;
        IntIndex i = 0;
        while (success && i < typeRefX->SubElementCount()) {
            TypeRef elementXType = typeRefX->GetSubElement(i);
            TypeRef elementYType = typeRefY->GetSubElement(i);
            IntIndex fieldOffsetX = elementXType->ElementOffset();
            IntIndex fieldOffsetY = elementYType->ElementOffset();
            AQBlock1* pDataXElement = static_cast<AQBlock1*>(pDataX) + fieldOffsetX;
            AQBlock1* pDataYElement = static_cast<AQBlock1*>(pDataY) + fieldOffsetY;
            success = Apply(elementXType, pDataXElement, elementYType, pDataYElement, operation);
            i++;
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyString(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        StringRef  stringRefX = *(static_cast<const StringRef *>(pDataX));
        StringRef  stringRefY = *(static_cast<const StringRef *>(pDataY));
        bool success = operation.Apply(stringRefX, stringRefY);
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyArray(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        TypedArrayCoreRef arrayX = *(static_cast<const TypedArrayCoreRef*>(pDataX));
        TypedArrayCoreRef arrayY = *(static_cast<const TypedArrayCoreRef*>(pDataY));
        TypeRef arrayXElementType = arrayX->ElementType();
        TypeRef arrayYElementType = arrayY->ElementType();
        bool success = true;
        IntIndex i = 0;
        while (success && i < arrayX->Length()) {
            success = Apply(arrayXElementType, arrayX->BeginAt(i), arrayYElementType, arrayY->BeginAt(i), operation);
            i++;
        }
        return success;
    }
};  // namespace Vireo

