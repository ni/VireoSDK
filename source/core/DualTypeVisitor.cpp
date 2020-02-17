// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
        {
            EncodingEnum encodingY = typeRefY->BitEncoding();
            if (encodingY == kEncoding_Array)
                success = ClusterArrayCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
            else if (encodingY == kEncoding_Cluster)
                success = ClusterCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
            break;
        }
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
        case kEncoding_Variant:
            success = VariantCompatible(typeRefX, pDataX, typeRefY, pDataY, operation);
            break;
        default:
            success = false;
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::VariantCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        VariantDataRef variantX = *reinterpret_cast<VariantDataRef *>(pDataX);
        VariantDataRef variantY = *reinterpret_cast<VariantDataRef *>(pDataY);

        if (!typeRefX->IsVariant() || !typeRefY->IsVariant())
            return false;

        if (variantX->IsUninitializedVariant() && variantY->IsUninitializedVariant())
            return true;

        if (variantX->IsUninitializedVariant() != variantY->IsUninitializedVariant())
            return false;

        if (variantX->HasData()  != variantY->HasData())
            return false;

        if (variantX->HasMap() != variantY->HasMap())
            return false;

        if (variantX->HasMap() && variantY->HasMap() &&
            variantX->GetMap_size() != variantY->GetMap_size()) {
                return false;
        }

        // All the inexpensive checks are done first (above)
        // Do the expensive checks below

        TypeRef underlyingTypeX = variantX->GetInnerType();
        TypeRef underlyingTypeY = variantY->GetInnerType();

        if (underlyingTypeX != nullptr && underlyingTypeY != nullptr) {
            VIREO_ASSERT(variantX->HasData() && variantY->HasData());
            if (!TypesAreCompatible(underlyingTypeX,
                variantX->GetInnerData(),
                underlyingTypeY,
                variantY->GetInnerData(),
                operation)) {
                return false;
            }
        }

        if (variantX->HasMap() && variantY->HasMap()) {
            auto iterX = variantX->GetMap_cbegin(), iterXEnd = variantX->GetMap_cend();
            auto iterY = variantY->GetMap_cbegin(), iterYEnd = variantY->GetMap_cend();
            for (; iterX != iterXEnd && iterY != iterYEnd; ++iterX, ++iterY) {
                VariantDataRef valueX = iterX->second;
                VariantDataRef valueY = iterY->second;
                if (!TypesAreCompatible(valueX->Type(), &valueX, valueY->Type(), &valueY, operation))
                    return false;
            }
            return iterX == iterXEnd && iterY == iterYEnd;
        }
        return true;
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
    bool DualTypeVisitor::ClusterArrayCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation& operation)
    {
        bool success = true;
        Int32 numberOfClusterFields = typeRefX->SubElementCount();

        TypedArrayCoreRef arrayY = *(static_cast<const TypedArrayCoreRef*>(pDataY));
        if (arrayY->Rank() != 1)
            return false;
        TypeRef elementYType = arrayY->ElementType();
        if (!elementYType->IsVariant()) {
            for (IntIndex i = 0; success && i < typeRefX->SubElementCount(); i++) {
                TypeRef elementXType = typeRefX->GetSubElement(i);
                IntIndex fieldOffsetX = elementXType->ElementOffset();
                AQBlock1* pDataXElement = static_cast<AQBlock1*>(pDataX) + fieldOffsetX;
                success = TypesAreCompatible(elementXType, pDataXElement, elementYType, pDataY, operation);
            }
        }
        if (success && operation.ShouldInflateDestination()) {
            arrayY->Resize1D(numberOfClusterFields);
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
        EncodingEnum encodingX = typeRefX->BitEncoding();
        switch (encodingX) {
        case kEncoding_Cluster:
        {
            EncodingEnum encodingY = typeRefY->BitEncoding();
            if (encodingY == kEncoding_Array)
                success = ApplyClusterToArray(typeRefX, pDataX, typeRefY, pDataY, operation);
            else
                success = ApplyCluster(typeRefX, pDataX, typeRefY, pDataY, operation);
            break;
        }
        case kEncoding_Array:
            if (typeRefX->Rank() == 1 && typeRefX->GetSubElement(0)->BitEncoding() == kEncoding_Unicode)
                success = ApplyString(typeRefX, pDataX, typeRefY, pDataY, operation);
            else
                success = ApplyArray(typeRefX, pDataX, typeRefY, pDataY, operation);
            break;
        case kEncoding_Variant:
            if (typeRefY->BitEncoding() == kEncoding_Variant)
                success = ApplyVariant(typeRefX, pDataX, typeRefY, pDataY, operation);
            break;
        default:
            success = operation.Apply(typeRefX, pDataX, typeRefY, pDataY);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyVariant(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        auto variantX = *reinterpret_cast<VariantDataRef *>(pDataX);
        auto variantY = *reinterpret_cast<VariantDataRef *>(pDataY);

        TypeRef underlyingTypeX = variantX->GetInnerType();
        TypeRef underlyingTypeY = variantY->GetInnerType();

        if (underlyingTypeX != nullptr && underlyingTypeY != nullptr) {
            VIREO_ASSERT(variantX->HasData() && variantY->HasData());
            if (!Apply(underlyingTypeX,
                variantX->GetInnerData(),
                underlyingTypeY,
                variantY->GetInnerData(),
                operation)) {
                return false;
            }
        }

        if (variantX->HasMap() && variantY->HasMap()) {
            auto iterX = variantX->GetMap_cbegin(), iterXEnd = variantX->GetMap_cend();
            auto iterY = variantY->GetMap_cbegin(), iterYEnd = variantY->GetMap_cend();
            for (; iterX != iterXEnd && iterY != iterYEnd; ++iterX, ++iterY) {
                StringRef nameX = iterX->first;
                VariantDataRef valueX = iterX->second;
                StringRef nameY = iterY->first;
                VariantDataRef valueY = iterY->second;
                if (!nameX->IsEqual(nameY))
                    return false;
                if (!Apply(valueX->Type(), &valueX, valueY->Type(), &valueY, operation))
                    return false;
            }
            return iterX == iterXEnd && iterY == iterYEnd;
        }

        return true;
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
    bool DualTypeVisitor::ApplyClusterToArray(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation)
    {
        bool success = true;
        IntIndex i = 0;
        TypedArrayCoreRef pDataArrayY = *static_cast<TypedArrayCoreRef*>(pDataY);
        TypeRef elementYType = pDataArrayY->ElementType();
        AQBlock1* pValuesInsertY = pDataArrayY->BeginAt(0);
        Int32 dataArrayYOffset = elementYType->TopAQSize();
        while (success && i < typeRefX->SubElementCount()) {
            TypeRef elementXType = typeRefX->GetSubElement(i);
            IntIndex fieldOffsetX = elementXType->ElementOffset();
            AQBlock1* pDataXElement = static_cast<AQBlock1*>(pDataX) + fieldOffsetX;

            if (elementYType->IsVariant()) {
                VariantDataRef outputVariant = *reinterpret_cast<VariantDataRef *>(pValuesInsertY);
                outputVariant->AQFree();
                if (elementXType->IsVariant()) {
                    elementXType->CopyData(pDataXElement, pValuesInsertY);
                } else {
                    StaticTypeAndData td{};
                    td._paramType = elementXType;
                    td._pData = pDataXElement;
                    outputVariant->InitializeFromStaticTypeAndData(td);
                }
            } else {
                success = Apply(elementXType, pDataXElement, elementYType, pValuesInsertY, operation);
            }
            i++;
            pValuesInsertY += dataArrayYOffset;
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

