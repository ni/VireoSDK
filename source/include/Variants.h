// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
\brief Variant data type
*/

#ifndef Variant_h
#define Variant_h

#include "TypeAndDataManager.h"
#include <map>

namespace Vireo {

class VariantType;
class VariantData;
using VariantTypeRef = VariantType*;
using VariantDataRef = VariantData*;

class VariantType : public TypeCommon
{
 private:
    explicit VariantType(TypeManagerRef typeManager);

 public:
    NIError InitData(void* pData, TypeRef pattern = nullptr) override;
    NIError CopyData(const void* pData, void* pDataCopy) override;
    NIError ClearData(void* pData) override;
    SubString Name() override { return SubString(tsVariantType); }

 public:  // static methods
    static VariantTypeRef New(TypeManagerRef typeManager);
    static void SetVariantToDataTypeError(TypeRef inputType, TypeRef targetType, TypeRef outputType, void* outputData, ErrorCluster* errPtr);
};

class VariantData
{
 private:
    explicit VariantData(TypeRef type);
    using AttributeMapType = std::map<StringRef, VariantDataRef, StringRefCmp>;
    TypeRef _typeRef;  // Points to the TypeRef used to create this VariantData object. Stashed here so it can be retrieved easily
    TypeRef _innerTypeRef;
    AttributeMapType *_attributeMap;
    void *_pInnerData;

 public:
    void InitializeFromStaticTypeAndData(const StaticTypeAndData& input);
    bool SetAttribute(StringRef name, const StaticTypeAndData& value);
    Boolean DeleteAttribute(StringRef* name);
    void AQFree();
    VariantDataRef GetAttribute(StringRef name) const;
    bool GetVariantAttributeAll(TypedArrayCoreRef names, TypedArrayCoreRef values) const;
    void Copy(VariantDataRef pDest) const;
    bool CopyToNonVariant(TypeRef destType, void *destData) const;
    bool IsVoidVariant() const;
    bool IsUninitializedVariant() const;
    TypeRef Type() const { return _typeRef; }
    TypeRef GetInnerType() const { return _innerTypeRef; }
    void* GetInnerData() const { return _pInnerData; }
    bool HasData() const { return _pInnerData != nullptr; }
    bool HasMap() const { return _attributeMap != nullptr; }

    // The following methods are not completely CamelCased but written with "_" to have the
    // same STL container method names after "_" to imply the same semantics
    size_t GetMap_size () const { return _attributeMap->size(); }
    AttributeMapType::const_iterator GetMap_cbegin() const { return _attributeMap->cbegin(); }
    AttributeMapType::const_iterator GetMap_cend() const { return _attributeMap->cend(); }

 public:  // static methods
    static VariantDataRef New(TypeRef type);
    static void Delete(VariantDataRef variant);
};

enum { kVariantArgErr = 1, kVariantIncompatibleType = 91, kUnsupportedOnTarget = 2304 };

}  // namespace Vireo

#endif
