
/**
Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

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

namespace Vireo
{
//------------------------------------------------------------
struct DataToVariantParamBlock : public InstructionCore
{
    _ParamImmediateDef(StaticTypeAndData, InputData);
    _ParamDef(TypeRef, OutputVariant);
    NEXT_INSTRUCTION_METHOD()
};

// Convert data of any type to variant
VIREO_FUNCTION_SIGNATURET(DataToVariant, DataToVariantParamBlock)
{
    TypeRef inputType = _ParamImmediate(InputData._paramType);
    TypeManagerRef tm = THREAD_TADM();

    TypeRef variant = DefaultValueType::New(tm, inputType, true);
    variant->CopyData(_ParamImmediate(InputData._pData), variant->Begin(kPAWrite));
    _Param(OutputVariant) = variant;
    return _NextInstruction();
}

//------------------------------------------------------------
struct VariantToDataParamBlock : public InstructionCore
{
    _ParamImmediateDef(StaticTypeAndData, InputData);
    _ParamDef(ErrorCluster, ErrorClust);
    _ParamImmediateDef(StaticTypeAndData, TargetType);
    _ParamImmediateDef(StaticTypeAndData, OutputData);
    NEXT_INSTRUCTION_METHOD()
};

TypeRef CopyToVariant(TypeRef sourceType)
{
    TypeManagerRef tm = THREAD_TADM();
    TypeRef variant = DefaultValueType::New(tm, sourceType, true);
    variant->CopyData(sourceType->Begin(kPARead), variant->Begin(kPAWrite));
    return variant;
}

bool IsTypeUnspecifiedOrVariant(TypeRef destType, void* destData)
{
    return !destData || destType->IsVariant();
}

bool IsTargetTypeSameAsOutput(TypeRef targetType, void* targetData, TypeRef outputType, void* outputData)
{
    return (IsTypeUnspecifiedOrVariant(targetType, targetData) && IsTypeUnspecifiedOrVariant(outputType, outputData))
        || targetType->IsA(outputType, true)
        || !outputData;
}

bool IsTargetTypeCompatibleWithInput(TypeRef inputType, TypeRef targetType, void* targetData)
{
    // If target type parameter is unspecified, or it is the same as the input, return true.
    return inputType && (!targetData || inputType->IsA(targetType, true));
}

void SetVariantToDataTypeError(TypeRef inputType, TypeRef targetType, TypeRef outputType, void* outputData, ErrorCluster* errPtr)
{
    if (inputType && inputType->IsCluster() && targetType->IsArray()) {
        errPtr->SetErrorAndAppendCallChain(true, kUnsupportedOnTarget, "Variant To Data");
    } else {
        errPtr->SetErrorAndAppendCallChain(true, kVariantIncompatibleType, "Variant To Data");
    }
    if (outputType && outputData) {
            outputType->InitData(outputData);
    }
}

// Convert variant to data of given type. Error if the data types don't match
VIREO_FUNCTION_SIGNATURET(VariantToData, VariantToDataParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    if (!errPtr || !errPtr->status) {
        TypeRef inputType = _ParamImmediate(InputData._paramType);
        void* inputData = _ParamImmediate(InputData)._pData;

        TypeRef targetType = _ParamImmediate(TargetType._paramType);
        void* targetData = _ParamImmediate(TargetType)._pData;

        TypeRef outputType = _ParamImmediate(OutputData._paramType);
        void* outputData = _ParamImmediate(OutputData)._pData;

        if (inputType->IsVariant()) {
            TypeRef variantInnerType = *reinterpret_cast<TypeRef *>_ParamImmediate(InputData._pData);
            if (variantInnerType
                && IsTargetTypeCompatibleWithInput(variantInnerType, targetType, targetData)
                && IsTargetTypeSameAsOutput(targetType, targetData, outputType, outputData)) {
                if (outputData) {
                    variantInnerType->CopyData(variantInnerType->Begin(kPARead), outputData);
                }
            } else if (variantInnerType
                && IsTypeUnspecifiedOrVariant(targetType, targetData)
                && IsTypeUnspecifiedOrVariant(outputType, outputData)) {
                if (outputData) {
                    *static_cast<TypeRef*>(outputData) = CopyToVariant(variantInnerType);
                }
            } else if (errPtr) {
                SetVariantToDataTypeError(variantInnerType, targetType, outputType, outputData, errPtr);
            }
        } else {
            if (IsTargetTypeCompatibleWithInput(inputType, targetType, targetData)
                && IsTargetTypeSameAsOutput(targetType, targetData, outputType, outputData)) {
                if (outputData) {
                    inputType->CopyData(inputData, outputData);
                }
            } else if (IsTypeUnspecifiedOrVariant(targetType, targetData)
                && IsTypeUnspecifiedOrVariant(outputType, outputData)) {
                if (outputData) {
                    *static_cast<TypeRef*>(outputData) = CopyToVariant(inputType);
                }
            } else if (errPtr) {
                SetVariantToDataTypeError(inputType, targetType, outputType, outputData, errPtr);
            }
        }
    }
    return _NextInstruction();
}

struct SetVariantAttributeParamBlock : public InstructionCore
{
    _ParamDef(TypeRef, InputVariant);
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
            TypeManagerRef tm = THREAD_TADM();

            StringRef nameKeyRef = nullptr;
            TypeRef stringType = tm->FindType("String");
            stringType->InitData(&nameKeyRef);
            nameKeyRef->Append(name->Length(), name->Begin());

            TypeRef valueType = _ParamImmediate(Value._paramType);
            TypeRef variantValue = DefaultValueType::New(tm, valueType, true);
            variantValue->CopyData(_ParamImmediate(Value._pData), variantValue->Begin(kPAWrite));

            TypeRef inputVariant = _Param(InputVariant);
            VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();
            auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
            if (variantToAttributeMapIter != variantToAttributeMap.end()) {
                VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;

                auto pairIterBool = attributeMap->insert(VariantAttributeManager::AttributeMapType::value_type(nameKeyRef, variantValue));
                replaced = !pairIterBool.second;
                if (replaced) {
                    pairIterBool.first->second = variantValue;
                    nameKeyRef->Delete(nameKeyRef);
                }
            } else {
                auto attributeMap = new VariantAttributeManager::AttributeMapType;
                (*attributeMap)[nameKeyRef] = variantValue;
                variantToAttributeMap[inputVariant] = attributeMap;
                replaced = false;
            }
        }
    }
    if (_ParamPointer(Replaced))
        _Param(Replaced) = replaced;
    return _NextInstruction();
}

struct GetVariantAttributeParamBlock : public InstructionCore
{
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamImmediateDef(StaticTypeAndData, Value);
    _ParamDef(Boolean, Found);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(GetVariantAttribute, GetVariantAttributeParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    bool found = false;
    if (!errPtr || !errPtr->status) {
        TypeRef inputVariant = _Param(InputVariant);
        StringRef name = _Param(Name);
        StaticTypeAndDataRef value = &_ParamImmediate(Value);
        const VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        const auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;
            auto attributeMapIter = attributeMap->find(name);
            if (attributeMapIter != attributeMap->end()) {
                TypeRef foundValue = attributeMapIter->second;
                if (value->_paramType->IsVariant()) {
                    TypeManagerRef tm = THREAD_TADM();
                    TypeRef variant = DefaultValueType::New(tm, foundValue, true);
                    variant->CopyData(foundValue->Begin(kPARead), variant->Begin(kPAWrite));
                    *static_cast<TypeRef*>(value->_pData) = variant;
                    found = true;
                } else if (foundValue->IsA(value->_paramType, true)) {
                    found = true;
                    value->_paramType->CopyData(foundValue->Begin(kPARead), value->_pData);
                } else {
                    if (errPtr) {  // Incorrect type for default attribute value
                        errPtr->SetErrorAndAppendCallChain(true, kVariantIncompatibleType, "Get Variant Attribute");
                    }
                }
            }
        }
    }
    if (_ParamPointer(Found))
        _Param(Found) = found;
    return _NextInstruction();
}

struct GetVariantAttributesAllParamBlock : public InstructionCore
{
    _ParamDef(TypeRef, InputVariant);
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
        TypeRef inputVariant = _Param(InputVariant);
        const VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        const auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;
            const auto mapSize = attributeMap->size();
            if (mapSize != 0) {
                bResetOutputArrays = false;
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
                TypeManagerRef tm = THREAD_TADM();
                for (const auto attributePair : *attributeMap) {
                    String* const* attributeNameStr = &(attributePair.first);
                    TypeRef attributeValue = attributePair.second;
                    if (names) {
                        namesElementType->CopyData(attributeNameStr, pNamesInsert);
                        pNamesInsert += namesAQSize;
                    }
                    if (values) {
                        if (attributeValue->IsVariant()) {
                            attributeValue->CopyData(attributeValue->Begin(kPARead), pValuesInsert);
                        } else {
                            TypeRef variant = DefaultValueType::New(tm, attributeValue, true);
                            variant->CopyData(attributeValue->Begin(kPARead), variant->Begin(kPAWrite));
                            *reinterpret_cast<TypeRef *>(pValuesInsert) = variant;
                        }
                        pValuesInsert += valuesAQSize;
                    }
                }
            }
        }
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
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamDef(Boolean, Found);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(DeleteVariantAttribute, DeleteVariantAttributeParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    StringRef *name = _ParamPointer(Name);
    bool clearAllAttributes = (!name || (*name)->Length() == 0);
    Boolean found = false;
    if (!errPtr || !errPtr->status) {
        const TypeRef inputVariant = _Param(InputVariant);
        VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        const auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;
            const auto mapSize = attributeMap->size();
            if (mapSize != 0) {
                if (clearAllAttributes) {
                    for (auto attribute : *attributeMap) {
                        attribute.first->Delete(attribute.first);
                    }
                    attributeMap->clear();
                    variantToAttributeMap.erase(variantToAttributeMapIter);
                    delete attributeMap;
                    found = true;
                } else {
                    const auto attributeMapIterator = attributeMap->find(*name);
                    if (attributeMapIterator != attributeMap->end()) {
                        found = true;
                        attributeMapIterator->first->Delete(attributeMapIterator->first);
                        attributeMap->erase(attributeMapIterator);
                    }
                }
            }
        } else if (clearAllAttributes) {
            found = true;
        }
    }
    if (_ParamPointer(Found))
        _Param(Found) = found;
    return _NextInstruction();
}

struct CopyVariantParamBlock : public InstructionCore
{
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(TypeRef, OutputVariant);

    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(CopyVariant, CopyVariantParamBlock)
{
    TypeRef inputVariant = _Param(InputVariant);
    TypeManagerRef tm = THREAD_TADM();

    if (inputVariant != nullptr) {
        TypeRef destType = DefaultValueType::New(tm, inputVariant, true);
        destType->CopyData(inputVariant->Begin(kPARead), destType->Begin(kPAWrite));

        VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        const auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType* attributeMapInput = variantToAttributeMapIter->second;
            auto attributeMapOutput = new VariantAttributeManager::AttributeMapType;
            for (auto attribute : *attributeMapInput) {
                StringRef nameKeyRef = nullptr;
                TypeRef stringType = tm->FindType("String");
                stringType->InitData(&nameKeyRef);
                nameKeyRef->Append(attribute.first->Length(), attribute.first->Begin());

                TypeRef valueType = attribute.second;
                TypeRef variantValue = DefaultValueType::New(tm, valueType, true);
                variantValue->CopyData(attribute.second->Begin(kPARead), variantValue->Begin(kPAWrite));

                (*attributeMapOutput)[nameKeyRef] = variantValue;
            }
            variantToAttributeMap[destType] = attributeMapOutput;
        }
        _Param(OutputVariant) = destType;
    }
    return _NextInstruction();
}

struct VariantComparisonParamBlock : public InstructionCore
{
    _ParamDef(TypeRef, VariantX);
    _ParamDef(TypeRef, VariantY);
    _ParamDef(Boolean, Result);

    NEXT_INSTRUCTION_METHOD()
};

bool VariantsAreEqual(TypeRef variantX, TypeRef variantY)
{
    DualTypeVisitor visitor;
    DualTypeEqual dualTypeEqual;
    return visitor.Visit(variantX, variantX->Begin(kPARead), variantY, variantY->Begin(kPARead), &dualTypeEqual);
}

VIREO_FUNCTION_SIGNATURET(IsEQVariant, VariantComparisonParamBlock) {
    TypeRef variantX = _Param(VariantX);
    TypeRef variantY = _Param(VariantY);
    _Param(Result) = VariantsAreEqual(variantX, variantY);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURET(IsNEVariant, VariantComparisonParamBlock) {
    TypeRef variantX = _Param(VariantX);
    TypeRef variantY = _Param(VariantY);
    _Param(Result) = !VariantsAreEqual(variantX, variantY);
    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(Variant)

    DEFINE_VIREO_FUNCTION(VariantToData, "p(i(StaticTypeAndData inputVariant) io(ErrorCluster error)"
        "i(StaticTypeAndData targetType) o(StaticTypeAndData outputType))");
    DEFINE_VIREO_FUNCTION(DataToVariant, "p(i(StaticTypeAndData) o(Variant))");
    DEFINE_VIREO_FUNCTION(SetVariantAttribute, "p(io(Variant inputVariant) i(String name)"
        " i(StaticTypeAndData value) o(Boolean replaced) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(GetVariantAttribute, "p(i(Variant inputVariant) i(String name)"
        "io(StaticTypeAndData value) o(Boolean found) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(GetVariantAttributeAll, "p(i(Variant inputVariant) o(Array names)"
        "o(Array values) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(DeleteVariantAttribute, "p(io(Variant inputVariant) i(String name) o(Boolean found) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(CopyVariant, "p(i(Variant inputVariant) o(Variant outputVariant) )");
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, DataToVariant, "p(i(StaticTypeAndData) o(Variant))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQVariant, "p(i(Variant variantX) i(Variant variantY) o(Boolean result))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNEVariant, "p(i(Variant variantX) i(Variant variantY) o(Boolean result))")

DEFINE_VIREO_END()

};  // namespace Vireo
