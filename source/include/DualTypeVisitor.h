/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

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
    bool Visit(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);

 private:
    bool TypesAreCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool VariantCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool ClusterCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool EnumCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation);
    bool IntrinsicClustersCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool UserDefinedClustersCompatible(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool StringCompatible(TypeRef typeRefX, TypeRef typeRefY);
    bool ArrayCompatible(TypeRef typeRefX, TypeRef typeRefY, DualTypeOperation* operation);

    bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool ApplyVariant(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool ApplyCluster(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool ApplyString(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
    bool ApplyArray(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, DualTypeOperation* operation);
};
}  // namespace Vireo
#endif
