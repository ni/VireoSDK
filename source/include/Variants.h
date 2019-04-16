/**

Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Variant data type
*/

#ifndef Variant_h
#define Variant_h

#include "TypeAndDataManager.h"
#include <map>

namespace Vireo {

class VariantType;
using VariantTypeRef = VariantType*;

class VariantType : public WrappedType
{
 public:
    using AttributeMapType = std::map<StringRef, VariantTypeRef, StringRefCmp>;
    TypeRef _underlyingTypeRef;
    AttributeMapType *_attributeMap;
 private:
    VariantType(TypeManagerRef typeManager, TypeRef type);
 public:
    SubString Name() override { return SubString(TypeCommon::TypeVariant); }
    static VariantTypeRef New(TypeManagerRef typeManager, TypeRef type);
    static VariantTypeRef CreateNewVariantFromType(TypeRef inputType);
    static VariantTypeRef CreateNewVariantFromStaticTypeAndData(const StaticTypeAndData& input);
    static VariantTypeRef CreateNewVariantFromVariant(const VariantTypeRef& inputVariant);
    static void SetVariantToDataTypeError(TypeRef inputType, TypeRef targetType, TypeRef outputType, void* outputData, ErrorCluster* errPtr);
    static bool IsNullVariant(VariantTypeRef variant);
 public:
    NIError ClearData(void* pData) override;
};

enum { kVariantArgErr = 1, kVariantIncompatibleType = 91, kUnsupportedOnTarget = 2304 };

}  // namespace Vireo

#endif
