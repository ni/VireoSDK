/**
Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Variant data type and variant attribute support functions
*/

#include "TwoTypeVisitor.h"

namespace Vireo
{
    //------------------------------------------------------------
    bool TwoTypeVisitor::Visit(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation)
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
    bool TwoTypeVisitor::TypesAreCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation)
    {
        bool success = false;
        if (typeRefX->IsVariant() && typeRefY->IsVariant()) {
            success = VariantCompatible(typeRefX, typeRefX, operation);
        }
        else {
            EncodingEnum encodingX = typeRefX->BitEncoding();
            switch (encodingX)
            {
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
                success = ClusterCompatible(typeRefX, typeRefY, operation);
                break;
            case kEncoding_Array:
                success = ArrayCompatible(typeRefX, typeRefY, operation);
                break;
            default:
                success = false;
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool TwoTypeVisitor::Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation)
    {
        return false;
    }

    //------------------------------------------------------------
    bool TwoTypeVisitor::VariantCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation)
    {
        TypeRef variantInnerTypeX = *static_cast<TypeRef*>(typeRefX->Begin(kPARead));
        TypeRef variantInnerTypeY = *static_cast<TypeRef*>(typeRefY->Begin(kPARead));
        bool success = false;
        if (!variantInnerTypeX && !variantInnerTypeY)
        {
            success = TypesAreCompatible(typeRefX, typeRefY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool TwoTypeVisitor::ClusterCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation)
    {
        bool success = false;
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        if (isTypeXIntrinsicClusterType && isTypeYIntrinsicClusterType) {
            success = IntrinsicClustersCompatible(typeRefX, typeRefY, operation);
        }
        else if (!isTypeXIntrinsicClusterType && !isTypeYIntrinsicClusterType) {
            success = UserDefinedClustersCompatible(typeRefX, typeRefY, operation);
        }
        return success;
    }

    //------------------------------------------------------------
    bool TwoTypeVisitor::IntrinsicClustersCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation)
    {
        SubString typeXName, typeYName;
        Boolean isTypeXIntrinsicClusterType = typeRefX->IsIntrinsicClusterDataType(&typeXName);
        Boolean isTypeYIntrinsicClusterType = typeRefY->IsIntrinsicClusterDataType(&typeYName);
        bool success = typeXName.Compare(&typeYName);
        return success;
    }

    //------------------------------------------------------------
    bool TwoTypeVisitor::UserDefinedClustersCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation)
    {
        bool success = typeRefX->SubElementCount() == typeRefY->SubElementCount();
        if (success) {
            IntIndex i = 0;
            while (success && i < typeRefX->SubElementCount())
            {
                success = TypesAreCompatible(typeRefX->GetSubElement(i), typeRefY->GetSubElement(i), operation);
            }
        }
        return success;
    }

    //------------------------------------------------------------
    bool TwoTypeVisitor::ArrayCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation)
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
            while (success && i++ < typeRefX->Rank())
            {
                success = (dimensionLenghtsX[i] == dimensionLenghtsY[i]);
            }
            // Verify each array has the same element type
            if (success)
            {
                success = TypesAreCompatible(arrayX->ElementType(), arrayY->ElementType(), operation);
            }
        }
        return success;
    }

};  // namespace Vireo

