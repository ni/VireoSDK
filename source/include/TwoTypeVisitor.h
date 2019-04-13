/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Two type visitor mostly for variant support
*/

#ifndef TwoTypeVisitor_h
#define TwoTypeVisitor_h

#include "TypeDefiner.h"
#include "TwoTypeVisitor.h"
#include "TwoTypeOperation.h"

namespace Vireo {
//! This class manages the traversal of two similar types as long as they share the same structure
//! Applies the TwoTypeOperation and continues visiting if the operation allows the visitor to continue
class TwoTypeVisitor {
 public:
    TwoTypeVisitor() = default;
    bool Visit(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation);

 private:
    bool TypesAreCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation);
    bool VariantCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation);
    bool ClusterCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation);
    bool IntrinsicClustersCompatible(TypeRef typeRefA, TypeRef typeRefB, TwoTypeOperation* operation);
    bool UserDefinedClustersCompatible(TypeRef typeRefA, TypeRef typeRefB, TwoTypeOperation* operation);
    bool StringCompatible(TypeRef typeRefX, TypeRef typeRefY);
    bool ArrayCompatible(TypeRef typeRefX, TypeRef typeRefY, TwoTypeOperation* operation);

    bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation);
    bool ApplyVariant(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation);
    bool ApplyCluster(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation);
    bool ApplyString(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation);
    bool ApplyArray(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY, TwoTypeOperation* operation);
};
}  // namespace Vireo
#endif
