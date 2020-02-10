// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Variant data type and variant attribute support functions
*/

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "TDCodecVia.h"
#include <limits>
#include <map>
#include "Variants.h"
#include "DualTypeVisitor.h"
#include "DualTypeOperation.h"
#include "DualTypeEqual.h"
#include "DualTypeConversion.h"

namespace Vireo
{

//------------------------------------------------------------
VariantType::VariantType(TypeManagerRef typeManager)
    : TypeCommon(typeManager)
{
    _isFlat = false;
    _ownsDefDefData = false;
    _isMutableValue = true;
    _hasCustomDefault = false;
    _topAQSize = TypeManager::HostPointerToAQSize();
    _aqAlignment = TypeManager::AQAlignment(sizeof(void*));
    _encoding = kEncoding_Variant;
    _isValid = 1;
}

NIError VariantType::InitData(void* pData, TypeRef pattern)
{
    NIError err = kNIError_Success;

    auto variantValue = static_cast<VariantDataRef *>(pData);
    if (*variantValue != nullptr) {
        VIREO_ASSERT((*variantValue)->IsUninitializedVariant());
    } else {
        if (pattern == nullptr) {
            pattern = this;
        }
        VariantDataRef newVariant = VariantData::New(pattern);
        *variantValue = newVariant;
        if (!newVariant) {
            err = kNIError_kInsufficientResources;
        }
    }
    return err;
}

NIError VariantType::CopyData(const void* pData, void* pDataCopy)
{
    NIError err = kNIError_Success;
    const VariantData * const pSource = *static_cast<const VariantDataRef*>(pData);
    VariantDataRef pDest = *static_cast<VariantDataRef*>(pDataCopy);

    if (pSource == nullptr && pDest == nullptr) {
        VIREO_ASSERT(false);
        return kNIError_Success;
    }
    VIREO_ASSERT(pSource != nullptr)
    if (pSource->IsUninitializedVariant() && pDest->IsUninitializedVariant()) {
        return kNIError_Success;
    }
    if (pDest && !pDest->IsUninitializedVariant()) {
        ClearData(pDataCopy);
    }
    InitData(pDataCopy, pSource->Type());
    pDest = *static_cast<VariantDataRef*>(pDataCopy);
    pSource->Copy(pDest);
    return kNIError_Success;
}

NIError VariantType::ClearData(void* pData)
{
    VariantDataRef variantValue = *static_cast<VariantDataRef *>(pData);

    if (variantValue != nullptr) {
        VariantData::Delete(variantValue);
        *static_cast<VariantDataRef *>(pData) = nullptr;
    }
    return kNIError_Success;
}

VariantTypeRef VariantType::New(TypeManagerRef typeManager)
{
    return TADM_NEW_PLACEMENT(VariantType)(typeManager);
}

void VariantType::SetVariantToDataTypeError(TypeRef inputType, TypeRef targetType, TypeRef outputType, void* outputData, ErrorCluster* errPtr)
{
    errPtr->SetErrorAndAppendCallChain(true, kVariantIncompatibleType, "Variant To Data");
    if (outputType && outputData) {
        outputType->ClearData(outputData);
        outputType->InitData(outputData);
    }
}

VariantData::VariantData(TypeRef type)
{
    VIREO_ASSERT(type->IsVariant());
    _typeRef = type;
    _innerTypeRef = nullptr;
    _attributeMap = nullptr;
    _pInnerData = nullptr;
}

VariantDataRef VariantData::New(TypeRef type)
{
    return TADM_NEW_PLACEMENT(VariantData)(type);
}

void VariantData::InitializeFromStaticTypeAndData(const StaticTypeAndData& input)
{
    VIREO_ASSERT(_pInnerData == nullptr && _innerTypeRef == nullptr && _attributeMap == nullptr);

    TypeRef inputType = input._paramType;
    TypeManagerRef tm = THREAD_TADM();
    void* inputData = input._pData;
    _innerTypeRef = inputType;
    _pInnerData = tm->Malloc(_innerTypeRef->TopAQSize());
    _innerTypeRef->InitData(_pInnerData);
    _innerTypeRef->CopyData(inputData, _pInnerData);
}

void VariantData::Delete(VariantDataRef variant)
{
    variant->AQFree();
    THREAD_TADM()->Free(variant);
}

void VariantData::AQFree()
{
    if (_pInnerData) {
        VIREO_ASSERT(_innerTypeRef != nullptr);
        _innerTypeRef->ClearData(_pInnerData);
        THREAD_TADM()->Free(_pInnerData);
        _pInnerData = nullptr;
        _innerTypeRef = nullptr;
    }
    if (_attributeMap) {
        for (auto attribute : *_attributeMap) {
            String::Delete(attribute.first);
            VariantDataRef attributeValue = attribute.second;
            attributeValue->Type()->ClearData(&attributeValue);
        }
        _attributeMap->clear();
        delete _attributeMap;
        _attributeMap = nullptr;
    }
}

void VariantData::Copy(VariantDataRef pDest) const
{
    TypeManagerRef tm = THREAD_TADM();
    if (_pInnerData != nullptr) {
        VIREO_ASSERT(_innerTypeRef != nullptr);
        VIREO_ASSERT(pDest->_pInnerData == nullptr && pDest->_innerTypeRef == nullptr);
        pDest->_pInnerData = tm->Malloc(_innerTypeRef->TopAQSize());
        _innerTypeRef->InitData(pDest->_pInnerData);
        _innerTypeRef->CopyData(_pInnerData, pDest->_pInnerData);
        pDest->_innerTypeRef = _innerTypeRef;
    }

    if (_attributeMap != nullptr) {
        auto attributeMapOutput = new AttributeMapType;
        for (auto attribute : *_attributeMap) {
            StringRef nameKeyRef = nullptr;
            TypeRef stringType = tm->FindType("String");
            stringType->InitData(&nameKeyRef);
            nameKeyRef->Append(attribute.first->Length(), attribute.first->Begin());

            VariantDataRef attributeValueVariant = attribute.second;
            attributeValueVariant->Type()->CopyData(&attributeValueVariant, &(*attributeMapOutput)[nameKeyRef]);
        }
        pDest->_attributeMap = attributeMapOutput;
    }
}

// Returns true if no data is stored with variant. May have attributes. This is for supporting use cases
// to set attributes on an empty variant constant/terminal in G.
bool VariantData::IsVoidVariant() const
{
    return _innerTypeRef == nullptr && _pInnerData == nullptr;
}

// Returns true only if VariantData was not initialized at all (i.e. Neither any data nor any attribute is stored in the variant)
bool VariantData::IsUninitializedVariant() const
{
    return _pInnerData == nullptr && _attributeMap == nullptr && _innerTypeRef == nullptr;
}

bool VariantData::SetAttribute(StringRef name, const StaticTypeAndData& value)
{
    TypeManagerRef tm = THREAD_TADM();
    VariantDataRef variantValue = nullptr;
    NIError err = _typeRef->InitData(&variantValue, _typeRef);

    if (value._paramType->IsVariant()) {
        value._paramType->CopyData(value._pData, &variantValue);
    } else {
        variantValue->InitializeFromStaticTypeAndData(value);
    }

    StringRef nameKeyRef = nullptr;
    TypeRef stringType = tm->FindType("String");
    stringType->InitData(&nameKeyRef);
    nameKeyRef->Append(name->Length(), name->Begin());

    if (_attributeMap == nullptr) {
        _attributeMap = new AttributeMapType;
    }
    auto pairIterBool = _attributeMap->insert(AttributeMapType::value_type(nameKeyRef, variantValue));
    bool inserted = pairIterBool.second;
    if (!inserted) {
        VariantDataRef oldVariantValue = pairIterBool.first->second;
        oldVariantValue->Type()->ClearData(&oldVariantValue);
        pairIterBool.first->second = variantValue;
        String::Delete(nameKeyRef);
    }
    return !inserted;  //  !inserted implies attribute replaced
}

VariantDataRef VariantData::GetAttribute(StringRef name) const
{
    if (_attributeMap) {
        auto attributeMapIter = _attributeMap->find(name);
        if (attributeMapIter != _attributeMap->end()) {
            VariantDataRef foundValue = attributeMapIter->second;
            return foundValue;
        }
    }
    return nullptr;
}

bool VariantData::GetVariantAttributeAll(TypedArrayCoreRef names, TypedArrayCoreRef values) const
{
    bool copiedAnything = false;
    if (_attributeMap != nullptr) {
        const auto mapSize = _attributeMap->size();
        if (mapSize != 0) {
            copiedAnything = true;
            if (names)
                names->Resize1D(mapSize);
            if (values)
                values->Resize1D(mapSize);
            AQBlock1* pNamesInsert = names ? names->BeginAt(0) : nullptr;
            TypeRef namesElementType = names ? names->ElementType() : nullptr;
            Int32 namesAQSize = names ? namesElementType->TopAQSize() : 0;
            AQBlock1* pValuesInsert = values ? values->BeginAt(0) : nullptr;
            TypeRef valuesElementType = values ? values->ElementType() : nullptr;
            Int32 valuesAQSize = values ? valuesElementType->TopAQSize() : 0;
            for (const auto attributePair : *_attributeMap) {
                String* const* attributeNameStr = &(attributePair.first);
                VariantDataRef attributeValue = attributePair.second;
                if (names) {
                    namesElementType->CopyData(attributeNameStr, pNamesInsert);
                    pNamesInsert += namesAQSize;
                }
                if (values) {
                    attributeValue->Type()->CopyData(&attributeValue, pValuesInsert);
                    pValuesInsert += valuesAQSize;
                }
            }
        }
    }
    return copiedAnything;
}

bool VariantData::DeleteAttribute(StringRef* name)
{
    bool clearAllAttributes = (!name || (*name)->Length() == 0);
    bool found = false;
    if (_attributeMap != nullptr) {
        const auto mapSize = _attributeMap->size();
        if (mapSize != 0) {
            if (clearAllAttributes) {
                for (auto attribute : *_attributeMap) {
                    String::Delete(attribute.first);
                    attribute.second->Type()->ClearData(&attribute.second);
                }
                _attributeMap->clear();
                delete _attributeMap;
                _attributeMap = nullptr;
                found = true;
            } else {
                const auto attributeMapIterator = _attributeMap->find(*name);
                if (attributeMapIterator != _attributeMap->end()) {
                    found = true;
                    String::Delete(attributeMapIterator->first);
                    attributeMapIterator->second->Type()->ClearData(&attributeMapIterator->second);
                    _attributeMap->erase(attributeMapIterator);
                    if (_attributeMap->empty()) {
                        delete _attributeMap;
                        _attributeMap = nullptr;
                    }
                }
            }
        }
    }
    return found;
}

/// Copy only data from a variant (even if nested) to a destination whose type is non-variant -- which also means
/// there is no need (no way) to copy attributes at any nested level.
/// If void-variant is what the innermost we find, then there is no real data associated with this variant of non-variant type, so return false.
/// if found and copied, return true.
bool VariantData::CopyToNonVariant(TypeRef destType, void *destData) const
{
    auto innerVariant = const_cast<VariantDataRef>(this);
    while (innerVariant && !innerVariant->IsVoidVariant() && innerVariant->_innerTypeRef->IsVariant()) {
        // Recurse until finding a non-variant type or void-variant.

        innerVariant = *reinterpret_cast<VariantDataRef *>(_pInnerData);
    }
    if (!innerVariant || innerVariant->IsVoidVariant())
        return false;

    if (innerVariant->_innerTypeRef->IsA(destType, true) &&
            !innerVariant->_innerTypeRef->IsEnum() && !destType->IsEnum()) {
        // Enum types have special conversion rules. So, don't call CopyData but go through
        // the dual type Visitor.
        destType->CopyData(innerVariant->_pInnerData, destData);
        return true;
    }

    DualTypeVisitor visitor;
    DualTypeConversion dualTypeConversion;
    return visitor.Visit( _innerTypeRef, _pInnerData, destType, destData, dualTypeConversion);
}

//------------------------------------------------------------
struct DataToVariantParamBlock : public InstructionCore
{
    _ParamImmediateDef(StaticTypeAndData, InputData);
    _ParamDef(VariantDataRef, OutputVariant);
    NEXT_INSTRUCTION_METHOD()
};

// Convert data of any type to variant
VIREO_FUNCTION_SIGNATURET(DataToVariant, DataToVariantParamBlock)
{
    if (_ParamPointer(OutputVariant)) {
         VariantDataRef outputVariant = _Param(OutputVariant);
         outputVariant->AQFree();  // No need to call ClearData() here and allocate a new one. So, just AQFree() the contents.
         outputVariant->InitializeFromStaticTypeAndData(_ParamImmediate(InputData));
    }
    return _NextInstruction();
}

//------------------------------------------------------------
struct VariantToDataParamBlock : public InstructionCore
{
    _ParamImmediateDef(StaticTypeAndData, InputData);
    _ParamDef(ErrorCluster, ErrorClust);
    _ParamDef(StaticType, TargetType);
    _ParamImmediateDef(StaticTypeAndData, OutputData);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(VariantToData, VariantToDataParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    if (errPtr && errPtr->status)
        return _NextInstruction();

    TypeRef inputType = _ParamImmediate(InputData._paramType);
    void* inputData = _ParamImmediate(InputData)._pData;

    TypeRef targetType = _ParamPointer(TargetType);
    TypeRef outputType = _ParamImmediate(OutputData._paramType);
    void* outputData = _ParamImmediate(OutputData)._pData;

    if (targetType->IsStaticTypeWildcard() || (!outputType->IsStaticTypeAndDataWildcard() && !outputType->IsA(targetType, true))) {
        // In VIA, TargetType is a required argument. Generated VIA from G must guarantee this.
        // If TargetType is optional, just throw internal error and exit.
        // OutputData is optional. However, if supplied, outputType MUST be same as targetType. Generated VIA from G must guarantee this.
        // If violated, just throw internal error and exit.
        // We should not throw valid LV errors.
        if (errPtr)
            errPtr->SetErrorAndAppendCallChain(true, kUnspecifiedError, "Variant To Data");
        return _NextInstruction();
    }

    if (inputType->IsVariant()) {
        VariantDataRef variant = *reinterpret_cast<VariantDataRef *>_ParamImmediate(InputData._pData);
        if (variant->IsVoidVariant()) {
            if (errPtr) {
                if (targetType->IsVariant())
                    errPtr->SetErrorAndAppendCallChain(true, kVariantArgErr, "Variant To Data");
                else
                    errPtr->SetErrorAndAppendCallChain(true, kVariantIncompatibleType, "Variant To Data");
            }
            return _NextInstruction();
        }

        bool typesCompatible = false;
        TypeRef underlyingType = variant->GetInnerType();
        if (targetType->IsVariant()) {
            if (outputData) {
                VariantDataRef outputVariant = *reinterpret_cast<VariantDataRef *>_ParamImmediate(OutputData._pData);
                outputVariant->AQFree();
                outputType->CopyData(variant->GetInnerData(), outputData);
            }
            typesCompatible = true;
        } else {
            DualTypeVisitor visitor;
            DualTypeConversion dualTypeConversion;
            if (outputData) {
                typesCompatible = variant->CopyToNonVariant(outputType, outputData);
            } else {
                typesCompatible = visitor.TypesAreCompatible(
                    underlyingType,
                    variant->GetInnerData(),
                    targetType,
                    targetType->Begin(kPARead),
                    dualTypeConversion);
            }
        }
        if (errPtr && !typesCompatible) {
            VariantType::SetVariantToDataTypeError(underlyingType, targetType, outputType, outputData, errPtr);
        }
        return _NextInstruction();
    }

    bool typesCompatible = false;
    if (targetType->IsVariant()) {
        if (outputData) {
            // Same as DataToVariant case
            VariantDataRef outputVariant = *reinterpret_cast<VariantDataRef *>_ParamImmediate(OutputData._pData);
            outputVariant->AQFree();
            outputVariant->InitializeFromStaticTypeAndData(_ParamImmediate(InputData));
        }
        typesCompatible = true;
    } else {
        DualTypeVisitor visitor;
        DualTypeConversion dualTypeConversion;
        if (outputData) {
            if (inputType->IsA(targetType, true)) {
                typesCompatible = true;
                targetType->CopyData(inputData, outputData);
            } else {
                typesCompatible = visitor.Visit(inputType, inputData, outputType, outputData, dualTypeConversion);
            }
        } else {
            typesCompatible = visitor.TypesAreCompatible(inputType, inputData, targetType, targetType->Begin(kPARead), dualTypeConversion);
        }
    }
    if (errPtr && !typesCompatible) {
        VariantType::SetVariantToDataTypeError(inputType, targetType, outputType, outputData, errPtr);
    }
    return _NextInstruction();
}

struct CopyVariantParamBlock : public InstructionCore
{
    _ParamDef(VariantDataRef, InputVariant);
    _ParamDef(VariantDataRef, OutputVariant);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(CopyVariant, CopyVariantParamBlock)
{
    VariantDataRef inputVariant = _Param(InputVariant);
    VariantDataRef outputVariant = _Param(OutputVariant);

    if (_ParamPointer(OutputVariant)) {
        outputVariant->AQFree();
        inputVariant->Type()->CopyData(&inputVariant, &outputVariant);
    }
    return _NextInstruction();
}

struct SetVariantAttributeParamBlock : public InstructionCore
{
    _ParamDef(VariantDataRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamImmediateDef(StaticTypeAndData, Value);
    _ParamDef(Boolean, Replaced);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(SetVariantAttribute, SetVariantAttributeParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    bool replaced = false;
    if (!errPtr || !errPtr->status) {
        StringRef name = _Param(Name);
        if (IsStringEmpty(name)) {
            if (errPtr) {
                errPtr->SetErrorAndAppendCallChain(true, kVariantArgErr, "Set Variant Attribute");
            }
        } else {
            VariantDataRef inputVariant = _Param(InputVariant);
            replaced = inputVariant->SetAttribute(name, _ParamImmediate(Value));
        }
    }
    if (_ParamPointer(Replaced))
        _Param(Replaced) = replaced;
    return _NextInstruction();
}

struct GetVariantAttributeParamBlock : public InstructionCore
{
    _ParamDef(VariantDataRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamImmediateDef(StaticTypeAndData, Value);
    _ParamDef(Boolean, Found);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHOD()
};

// TODO(smuthukr) There is a disadvantage to use only Value for both default value and output value.
// If the intended purpose of GetVariantAttribute is to only check if an attribute exists (i.e. only
// using the "Found" output), then the current design still incurs the expense of copying the value.
// It might be better to just follow the design of VariantToData to include the "default value"
// that supplies the target type and default value and copy "Value" only if the "Value" is not
// wild-card.
VIREO_FUNCTION_SIGNATURET(GetVariantAttribute, GetVariantAttributeParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    bool found = false;
    VariantDataRef inputVariant = _Param(InputVariant);
    if ((!errPtr || !errPtr->status) && inputVariant) {
        StringRef name = _Param(Name);
        StaticTypeAndDataRef value = &_ParamImmediate(Value);
        VariantDataRef foundValue = inputVariant->GetAttribute(name);
        if (foundValue) {
            bool typesCompatible = false;
            if (value->_paramType->IsVariant()) {
                VariantDataRef variant = *reinterpret_cast<VariantDataRef *>_ParamImmediate(Value._pData);
                variant->AQFree();
                variant->Type()->CopyData(&foundValue, &variant);
                found = true;
                typesCompatible = true;
            } else {
                typesCompatible = found = foundValue->CopyToNonVariant(value->_paramType, value->_pData);
            }
            if (errPtr && !typesCompatible) {  // Incorrect type for default attribute value
                errPtr->SetErrorAndAppendCallChain(true, kVariantIncompatibleType, "Get Variant Attribute");
            }
        }
    }
    if (_ParamPointer(Found))
        _Param(Found) = found;
    return _NextInstruction();
}

struct GetVariantAttributesAllParamBlock : public InstructionCore
{
    _ParamDef(VariantDataRef, InputVariant);
    _ParamDef(TypedArrayCoreRef, Names);
    _ParamDef(TypedArrayCoreRef, Values);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(GetVariantAttributeAll, GetVariantAttributesAllParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    TypedArrayCoreRef names = _ParamPointer(Names) ? _Param(Names) : nullptr;
    TypedArrayCoreRef values = _ParamPointer(Values) ? _Param(Values) : nullptr;
    bool bResetOutputArrays = true;
    if ((!errPtr || !errPtr->status) && (names || values)) {
        VariantDataRef inputVariant = _Param(InputVariant);
        bResetOutputArrays = !inputVariant->GetVariantAttributeAll(names, values);
    }
    if (bResetOutputArrays) {
        if (names)
            names->Resize1D(0);
        if (values)
            values->Resize1D(0);
    }
    return _NextInstruction();
}

struct DeleteVariantAttributeParamBlock : public InstructionCore
{
    _ParamDef(VariantDataRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamDef(Boolean, Found);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(DeleteVariantAttribute, DeleteVariantAttributeParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    StringRef *name = _ParamPointer(Name);
    Boolean found = false;
    if (!errPtr || !errPtr->status) {
        const VariantDataRef inputVariant = _Param(InputVariant);
        found = inputVariant->DeleteAttribute(name);
    }
    if (_ParamPointer(Found))
        _Param(Found) = found;
    return _NextInstruction();
}

struct VariantComparisonParamBlock : public InstructionCore
{
    _ParamDef(VariantDataRef, VariantX);
    _ParamDef(VariantDataRef, VariantY);
    _ParamDef(Boolean, Result);

    NEXT_INSTRUCTION_METHOD()
};

bool VariantsAreEqual(VariantDataRef variantX, VariantDataRef variantY)
{
    DualTypeVisitor visitor;
    DualTypeEqual dualTypeEqual;

    if (variantX->IsUninitializedVariant() && variantY->IsUninitializedVariant())
        return true;

    if (variantX->IsUninitializedVariant() != variantY->IsUninitializedVariant())
        return false;

    return visitor.Visit(variantX->Type(), &variantX, variantY->Type(), &variantY, dualTypeEqual);
}

VIREO_FUNCTION_SIGNATURET(IsEQVariant, VariantComparisonParamBlock) {
    VariantDataRef variantX = _Param(VariantX);
    VariantDataRef variantY = _Param(VariantY);
    _Param(Result) = VariantsAreEqual(variantX, variantY);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURET(IsEQSearchVariant, VariantComparisonParamBlock) {
    VariantDataRef variantX = _Param(VariantX);
    VariantDataRef variantY = _Param(VariantY);
    _Param(Result) = VariantsAreEqual(variantX, variantY);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURET(IsNEVariant, VariantComparisonParamBlock) {
    VariantDataRef variantX = _Param(VariantX);
    VariantDataRef variantY = _Param(VariantY);
    _Param(Result) = !VariantsAreEqual(variantX, variantY);
    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(Variant)
    DEFINE_VIREO_FUNCTION(DataToVariant, "p(i(StaticTypeAndData) o(Variant))");
    DEFINE_VIREO_FUNCTION(VariantToData, "p(i(StaticTypeAndData inputVariant) io(ErrorCluster error)"
                                            "i(StaticType targetType) o(StaticTypeAndData outputType))");
    DEFINE_VIREO_FUNCTION(SetVariantAttribute, "p(io(Variant inputVariant) i(String name)"
                                                " i(StaticTypeAndData value) o(Boolean replaced) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(GetVariantAttribute, "p(i(Variant inputVariant) i(String name)"
                                                "io(StaticTypeAndData value) o(Boolean found) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(GetVariantAttributeAll, "p(i(Variant inputVariant) o(Array names)"
                                                    "o(Array values) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(DeleteVariantAttribute, "p(io(Variant inputVariant) i(String name) o(Boolean found) io(ErrorCluster error) )");

    DEFINE_VIREO_FUNCTION(CopyVariant, "p(i(Variant inputVariant) o(Variant outputVariant) )");
    DEFINE_VIREO_FUNCTION(IsEQVariant, "p(i(Variant variantX) i(Variant variantY) o(Boolean result))")
    DEFINE_VIREO_FUNCTION(IsEQSearchVariant, "p(i(Variant variantX) i(Variant variantY) o(Boolean result))")
    DEFINE_VIREO_FUNCTION(IsNEVariant, "p(i(Variant variantX) i(Variant variantY) o(Boolean result))")

DEFINE_VIREO_END()

};  // namespace Vireo
