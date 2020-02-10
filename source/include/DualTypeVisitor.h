// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
\brief Two type visitor mostly for variant support
*/

#ifndef DualTypeVisitor_h
#define DualTypeVisitor_h

#include "TypeDefiner.h"
#include "DualTypeVisitor.h"
#include "DualTypeOperation.h"

namespace Vireo {
//! This class manages the traversal of two similar types as long as they share the same structure
//! Applies the DualTypeOperation and continues visiting if the operation allows the visitor to continue
class DualTypeVisitor {
 public:
    DualTypeVisitor() = default;
    bool Visit(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    bool TypesAreCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);

 private:
    bool VariantCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    bool ClusterCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    bool ClusterArrayCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation& operation);
    bool EnumCompatible(TypeRef typeRefX, TypeRef typeRefY, const DualTypeOperation &operation);
    bool UserDefinedClustersCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    static bool StringCompatible(TypeRef typeRefX, TypeRef typeRefY);
    bool ArrayCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);

    static bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    static bool ApplyVariant(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    static bool ApplyCluster(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    static bool ApplyClusterToArray(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    static bool ApplyString(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
    static bool ApplyArray(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, const DualTypeOperation &operation);
};
}  // namespace Vireo
#endif
