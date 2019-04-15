/**
Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Variant data type and variant attribute support functions
*/

#include "DualTypeVisitor.h"

namespace Vireo
{
    //------------------------------------------------------------
    bool DualTypeVisitor::Visit(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
    {
        bool success = false;
        if (operation) {
            success = TypesAreCompatible(typeRefX, typeRefY, operation);
            if (success)
                success = Apply(typeRefX, pDataX, typeRefY, pDataY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::TypesAreCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation)
    {
        bool success = false;
        if (typeRefX->IsVariant() && typeRefY->IsVariant()) {
            success = VariantCompatible(typeRefX, typeRefX, operation);
        } else {
            EncodingEnum encodingX = typeRefX->BitEncoding();
            switch (encodingX) {
                case kEncoding_Boolean:
                    success = operation->BooleanCompatible(typeRefX, typeRefY);
                    break;
                case kEncoding_UInt:
                    success = operation->UIntCompatible(typeRefX, typeRefY);
                    break;
                case kEncoding_S2CInt:
                    success = operation->S2CIntCompatible(typeRefX, typeRefY);
                    break;
                case kEncoding_IEEE754Binary:
                    success = operation->IEEE754BinaryCompatible(typeRefX, typeRefY);
                    break;
                case kEncoding_Cluster:
                    success = ClusterCompatible(typeRefX, typeRefY, operation);
                    break;
                case kEncoding_Array: {
                    if (typeRefX->Rank() == 1 && typeRefX->GetSubElement(0)->BitEncoding() == kEncoding_Unicode)
                        success = StringCompatible(typeRefX, typeRefY);
                    else 
                        success = ArrayCompatible(typeRefX, typeRefY, operation);
                    break;
                }
                default:
                    success = false;
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::VariantCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation)
    {
        TypeRef variantInnerTypeX = *static_cast<TypeRef*>(typeRefX->Begin(kPARead));
        TypeRef variantInnerTypeY = *static_cast<TypeRef*>(typeRefY->Begin(kPARead));
        bool success = false;
        if (!variantInnerTypeX && !variantInnerTypeY) {
            success = true;
        } else if (!variantInnerTypeX || !variantInnerTypeY) {
            success = false;
        } else {
            success = TypesAreCompatible(variantInnerTypeX, variantInnerTypeY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ClusterCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation)
    {
        bool success = false;
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        if (isTypeXIntrinsicClusterType && isTypeYIntrinsicClusterType) {
            success = IntrinsicClustersCompatible(typeRefX, typeRefY, operation);
        } else if (!isTypeXIntrinsicClusterType && !isTypeYIntrinsicClusterType) {
            success = UserDefinedClustersCompatible(typeRefX, typeRefY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::IntrinsicClustersCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation)
    {
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        bool success = typeXName.Compare(&typeYName);
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::UserDefinedClustersCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation)
    {
        bool success = typeRefX->SubElementCount() == typeRefY->SubElementCount();
        if (success) {
            IntIndex i = 0;
            while (success && i < typeRefX->SubElementCount()) {
                success = TypesAreCompatible(typeRefX->GetSubElement(i), typeRefY->GetSubElement(i), operation);
                i++;
            }
        }
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
    bool DualTypeVisitor::ArrayCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation)
    {
        // Verify number of dimensions are the same
        bool success = typeRefX->Rank() == typeRefY->Rank();
        // Verify each dimension has the same size
        if (success) {
            TypedArrayCoreRef arrayX = *(static_cast<const TypedArrayCoreRef*>(typeRefX->Begin(kPARead)));
            TypedArrayCoreRef arrayY = *(static_cast<const TypedArrayCoreRef*>(typeRefY->Begin(kPARead)));
            IntIndex* dimensionLenghtsX = arrayX->DimensionLengths();
            IntIndex* dimensionLenghtsY = arrayY->DimensionLengths();
            IntIndex i = 0;
            while (success && i++ < typeRefX->Rank()) {
                success = (dimensionLenghtsX[i] == dimensionLenghtsY[i]);
            }
            // Verify each array has the same element type
            if (success)
                success = TypesAreCompatible(arrayX->ElementType(), arrayY->ElementType(), operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
    {
        bool success = false;
        if (typeRefX->IsVariant() && typeRefY->IsVariant()) {
            success = ApplyVariant(typeRefX, pDataX, typeRefY, pDataY, operation);
        }
        else {
            EncodingEnum encodingX = typeRefX->BitEncoding();
            switch (encodingX)
            {
            case kEncoding_Cluster:
                success = ApplyCluster(typeRefX, pDataX, typeRefX, pDataY, operation);
                break;
            case kEncoding_Array:
                if (typeRefX->Rank() == 1 && typeRefX->GetSubElement(0)->BitEncoding() == kEncoding_Unicode)
                    success = ApplyString(typeRefX, pDataX, typeRefX, pDataY, operation);
                else
                    success = ApplyArray(typeRefX, pDataX, typeRefX, pDataY, operation);
                break;
            default:
                success = operation->Apply(typeRefX, pDataX, typeRefY, pDataY);
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyVariant(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
    {
        TypeRef variantInnerTypeX = *static_cast<TypeRef*>(typeRefX->Begin(kPARead));
        TypeRef variantInnerTypeY = *static_cast<TypeRef*>(typeRefY->Begin(kPARead));
        pDataX = typeRefX->Begin(kPARead);
        pDataY = typeRefY->Begin(kPARead);
        bool success = false;
        if (!variantInnerTypeX && !variantInnerTypeY) {
            success = true;
        } else if (!variantInnerTypeX || !variantInnerTypeY){
            success = false;
        } else {
            success = Apply(variantInnerTypeX, pDataX, variantInnerTypeY, pDataY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyCluster(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
    {
        bool success = false;
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        if (isTypeXIntrinsicClusterType && isTypeYIntrinsicClusterType) {
            success = ApplyIntrinsicClusters(typeRefX, pDataX, typeRefY, pDataY, operation);
        }
        else if (!isTypeXIntrinsicClusterType && !isTypeYIntrinsicClusterType) {
            success = ApplyUserDefinedClusters(typeRefX, pDataX, typeRefY, pDataY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyIntrinsicClusters(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
    {
        bool success = false;
        if (typeRefX->IsTimestamp()) {
            Timestamp* timestampX = static_cast<Timestamp*>(pDataX);
            Timestamp* timestampY = static_cast<Timestamp*>(pDataY);
            success = operation->Apply(timestampX, timestampY);
        } else if (typeRefX->IsComplexSingle()){
            std::complex<Single>* compleSingleX = static_cast<std::complex<Single>*>(pDataX);
            std::complex<Single>* compleSingleY = static_cast<std::complex<Single>*>(pDataY);
            success = operation->Apply(compleSingleX, compleSingleY);
        } else if (typeRefX->IsComplexDouble()) {
            std::complex<Double>* compleDoubleX = static_cast<std::complex<Double>*>(pDataX);
            std::complex<Double>* compleSingleY = static_cast<std::complex<Double>*>(pDataY);
            success = operation->Apply(compleDoubleX, compleSingleY);
        }
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyUserDefinedClusters(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
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
    bool DualTypeVisitor::ApplyString(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
    {
        StringRef  stringRefX = *(static_cast<const StringRef *>(pDataX));
        StringRef  stringRefY = *(static_cast<const StringRef *>(pDataY));
        bool success = operation->Apply(stringRefX, stringRefY);
        return success;
    }

    //------------------------------------------------------------
    bool DualTypeVisitor::ApplyArray(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation)
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

