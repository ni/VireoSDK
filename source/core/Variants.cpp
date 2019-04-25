
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
#include "DualTypeConversion.h"

namespace Vireo
{

bool VariantType::IsNullVariant(VariantTypeRef variant)
{
    return variant == nullptr;
}

VariantTypeRef VariantType::CreateNewVariantFromType(TypeRef inputType)
{
    TypeManagerRef tm = THREAD_TADM();
    VariantTypeRef newVariant = VariantType::New(tm, inputType == nullptr ? tm->BadType() : inputType);
    return newVariant;
}

VariantTypeRef VariantType::CreateNewVariantFromStaticTypeAndData(const StaticTypeAndData& input)
{
    TypeRef inputType = input._paramType;
    TypeManagerRef tm = THREAD_TADM();

    auto inputData = input._pData;
    if (inputType->IsVariant()) {
        VariantTypeRef variant = *reinterpret_cast<VariantTypeRef *>(input._pData);
        inputType = variant->_underlyingTypeRef;
        inputData = variant->Begin(kPARead);
    }
    VariantTypeRef newVariant = VariantType::New(tm, inputType);
    newVariant->CopyData(inputData, newVariant->Begin(kPAWrite));
    return newVariant;
}

VariantTypeRef VariantType::CreateNewVariantFromVariant(const VariantTypeRef& inputVariant)
{
    TypeManagerRef tm = THREAD_TADM();
    TypeRef underlyingType = inputVariant->_underlyingTypeRef;
    VariantTypeRef newVariant = VariantType::New(tm, underlyingType);
    newVariant->CopyData(inputVariant->Begin(kPARead), newVariant->Begin(kPAWrite));
    return newVariant;
}

void VariantType::SetVariantToDataTypeError(TypeRef inputType, TypeRef targetType, TypeRef outputType, void* outputData, ErrorCluster* errPtr)
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

VariantTypeRef VariantType::New(TypeManagerRef typeManager, TypeRef type)
{
    return TADM_NEW_PLACEMENT(VariantType)(typeManager, type);
}

//------------------------------------------------------------
VariantType::VariantType(TypeManagerRef typeManager, TypeRef type)
    : WrappedType(typeManager, type)
{
    _isFlat = false;
    _ownsDefDefData = true;
    _isMutableValue = true;
    _hasCustomDefault = true;
    _topAQSize = sizeof(void*);
    _aqAlignment = sizeof(void*);
    TypeRef copyInputType = DefaultValueType::New(typeManager, type, true);
    _underlyingTypeRef = copyInputType;
    _attributeMap = nullptr;
    _wrapped = copyInputType;
}

NIError VariantType::ClearData(void*)
{
    if (_underlyingTypeRef) {
        _underlyingTypeRef->ClearData(this->Begin(kPAClear));
        _underlyingTypeRef = nullptr;
    }
    if (_attributeMap) {
        for (auto attribute : *_attributeMap) {
            attribute.first->Delete(attribute.first);
            if (attribute.second && attribute.second->_underlyingTypeRef) {
                attribute.second->_underlyingTypeRef->ClearData(attribute.second->Begin(kPAClear));
            }
        }
        _attributeMap->clear();
        delete _attributeMap;
        _attributeMap = nullptr;
    }
    return kNIError_Success;
}

//------------------------------------------------------------
struct DataToVariantParamBlock : public InstructionCore
{
    _ParamImmediateDef(StaticTypeAndData, InputData);
    _ParamDef(VariantTypeRef, OutputVariant);
    NEXT_INSTRUCTION_METHOD()
};

// Convert data of any type to variant
VIREO_FUNCTION_SIGNATURET(DataToVariant, DataToVariantParamBlock)
{
    if (_ParamPointer(OutputVariant)) {
        VariantTypeRef variant = VariantType::CreateNewVariantFromStaticTypeAndData(_ParamImmediate(InputData));
        _Param(OutputVariant) = variant;
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

// Convert variant to data of given type. Error if the data types don't match
VIREO_FUNCTION_SIGNATURET(VariantToData, VariantToDataParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    if (!errPtr || !errPtr->status) {
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
            VariantTypeRef variant = *reinterpret_cast<VariantTypeRef *>_ParamImmediate(InputData._pData);
            if (VariantType::IsNullVariant(variant)) {
                if (errPtr)
                    errPtr->SetErrorAndAppendCallChain(true, kVariantIncompatibleType, "Variant To Data");
            } else {
                DualTypeVisitor visitor;
                DualTypeConversion dualTypeConversion;
                bool typesCompatible = false;
                TypeRef underlyingType = variant->_underlyingTypeRef;
                if (targetType->IsVariant()) {
                    if (outputData) {
                        *static_cast<VariantTypeRef *>(outputData) = VariantType::CreateNewVariantFromType(underlyingType);
                    }
                    typesCompatible = true;
                } else {
                    if (outputData) {
                        typesCompatible = visitor.Visit(underlyingType, underlyingType->Begin(kPARead), outputType, outputData, &dualTypeConversion);
                    } else {
                        typesCompatible = underlyingType->IsA(targetType, true);
                    }
                }
                if (errPtr && !typesCompatible) {
                    VariantType::SetVariantToDataTypeError(underlyingType, targetType, outputType, outputData, errPtr);
                }
            }
        } else {
            DualTypeVisitor visitor;
            DualTypeConversion dualTypeConversion;
            bool typesCompatible = false;
            if (targetType->IsVariant()) {
                if (outputData)
                    *static_cast<VariantTypeRef*>(outputData) = VariantType::CreateNewVariantFromType(inputType);
            } else {
                if (outputData) {
                    typesCompatible = visitor.Visit(inputType, inputData, outputType, outputData, &dualTypeConversion);
                } else {
                    typesCompatible = inputType->IsA(targetType, true);
                }
            }
            if (errPtr && !typesCompatible) {
                VariantType::SetVariantToDataTypeError(inputType, targetType, outputType, outputData, errPtr);
            }
        }
    }
    return _NextInstruction();
}

struct SetVariantAttributeParamBlock : public InstructionCore
{
    _ParamDef(VariantTypeRef, InputVariant);
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

            VariantTypeRef variantAttributeValue = VariantType::CreateNewVariantFromStaticTypeAndData(_ParamImmediate(Value));

            VariantTypeRef inputVariant = _Param(InputVariant);
            if (inputVariant->_attributeMap == nullptr) {
                inputVariant->_attributeMap = new VariantType::AttributeMapType;
            }
            auto pairIterBool = inputVariant->_attributeMap->insert(VariantType::AttributeMapType::value_type(nameKeyRef, variantAttributeValue));
            replaced = !pairIterBool.second;
            if (replaced) {
                pairIterBool.first->second = variantAttributeValue;
                nameKeyRef->Delete(nameKeyRef);
            }
        }
    }
    if (_ParamPointer(Replaced))
        _Param(Replaced) = replaced;
    return _NextInstruction();
}

struct GetVariantAttributeParamBlock : public InstructionCore
{
    _ParamDef(VariantTypeRef, InputVariant);
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
    VariantTypeRef inputVariant = _Param(InputVariant);
    if ((!errPtr || !errPtr->status) && inputVariant) {
        StringRef name = _Param(Name);
        StaticTypeAndDataRef value = &_ParamImmediate(Value);
        if (inputVariant->_attributeMap) {
            DualTypeVisitor visitor;
            DualTypeConversion dualTypeConversion;
            bool typesCompatible = false;
            auto attributeMapIter = inputVariant->_attributeMap->find(name);
            if (attributeMapIter != inputVariant->_attributeMap->end()) {
                VariantTypeRef foundValue = attributeMapIter->second;
                if (value->_paramType->IsVariant()) {
                    *static_cast<VariantTypeRef*>(value->_pData) = VariantType::CreateNewVariantFromVariant(foundValue);
                    found = true;
                    typesCompatible = true;
                } else {
                    typesCompatible = visitor.Visit(
                        foundValue->_underlyingTypeRef,
                        foundValue->_underlyingTypeRef->Begin(kPARead),
                        value->_paramType,
                        value->_pData,
                        &dualTypeConversion);
                    found = typesCompatible;
                }
                if (errPtr && !typesCompatible) {  // Incorrect type for default attribute value
                    errPtr->SetErrorAndAppendCallChain(true, kVariantIncompatibleType, "Get Variant Attribute");
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
    _ParamDef(VariantTypeRef, InputVariant);
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
        VariantTypeRef inputVariant = _Param(InputVariant);
        if (inputVariant->_attributeMap != nullptr) {
            const auto mapSize = inputVariant->_attributeMap->size();
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
                for (const auto attributePair : *inputVariant->_attributeMap) {
                    String* const* attributeNameStr = &(attributePair.first);
                    VariantTypeRef attributeValue = attributePair.second;
                    if (names) {
                        namesElementType->CopyData(attributeNameStr, pNamesInsert);
                        pNamesInsert += namesAQSize;
                    }
                    if (values) {
                        VariantTypeRef newVariant = VariantType::CreateNewVariantFromVariant(attributeValue);
                        *reinterpret_cast<VariantTypeRef *>(pValuesInsert) = newVariant;
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
    _ParamDef(VariantTypeRef, InputVariant);
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
        const VariantTypeRef inputVariant = _Param(InputVariant);
        if (inputVariant->_attributeMap != nullptr) {
            const auto mapSize = inputVariant->_attributeMap->size();
            if (mapSize != 0) {
                if (clearAllAttributes) {
                    for (auto attribute : *inputVariant->_attributeMap)
                        attribute.first->Delete(attribute.first);
                    inputVariant->_attributeMap->clear();
                    delete inputVariant->_attributeMap;
                    inputVariant->_attributeMap = nullptr;
                    found = true;
                } else {
                    const auto attributeMapIterator = inputVariant->_attributeMap->find(*name);
                    if (attributeMapIterator != inputVariant->_attributeMap->end()) {
                        found = true;
                        attributeMapIterator->first->Delete(attributeMapIterator->first);
                        inputVariant->_attributeMap->erase(attributeMapIterator);
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
    _ParamDef(VariantTypeRef, InputVariant);
    _ParamDef(VariantTypeRef, OutputVariant);
    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATURET(CopyVariant, CopyVariantParamBlock)
{
    VariantTypeRef inputVariant = _Param(InputVariant);
    TypeManagerRef tm = THREAD_TADM();

    if (!VariantType::IsNullVariant(inputVariant)) {
        VariantTypeRef variantCopy = VariantType::CreateNewVariantFromVariant(inputVariant);

        VariantType::AttributeMapType* attributeMapInput = inputVariant->_attributeMap;
        if (attributeMapInput != nullptr) {
            auto attributeMapOutput = new VariantType::AttributeMapType;
            for (auto attribute : *attributeMapInput) {
                StringRef nameKeyRef = nullptr;
                TypeRef stringType = tm->FindType("String");
                stringType->InitData(&nameKeyRef);
                nameKeyRef->Append(attribute.first->Length(), attribute.first->Begin());

                VariantTypeRef attributeValueVariant = attribute.second;
                (*attributeMapOutput)[nameKeyRef] = VariantType::CreateNewVariantFromVariant(attributeValueVariant);
            }
            variantCopy->_attributeMap = attributeMapOutput;
        }
        _Param(OutputVariant) = variantCopy;
    } else {
        // TODO(sanmut) : This is a workaround. We should create null Variant for local variables to allow
        // SetVariantAttribute to be called without calling ToVariant.
        // This works because our tests call copy on a variant constant before calling SetVariantAttribute.
        _Param(OutputVariant) = VariantType::CreateNewVariantFromType(nullptr);
    }
    return _NextInstruction();
}

struct VariantComparisonParamBlock : public InstructionCore
{
    _ParamDef(VariantTypeRef, VariantX);
    _ParamDef(VariantTypeRef, VariantY);
    _ParamDef(Boolean, Result);

    NEXT_INSTRUCTION_METHOD()
};

bool VariantsAreEqual(VariantTypeRef variantX, VariantTypeRef variantY)
{
    DualTypeVisitor visitor;
    DualTypeEqual dualTypeEqual;
    return visitor.Visit(variantX, variantX->Begin(kPARead), variantY, variantY->Begin(kPARead), &dualTypeEqual);
}

VIREO_FUNCTION_SIGNATURET(IsEQVariant, VariantComparisonParamBlock) {
    VariantTypeRef variantX = _Param(VariantX);
    VariantTypeRef variantY = _Param(VariantY);
    _Param(Result) = VariantsAreEqual(variantX, variantY);
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURET(IsNEVariant, VariantComparisonParamBlock) {
    VariantTypeRef variantX = _Param(VariantX);
    VariantTypeRef variantY = _Param(VariantY);
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
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, DataToVariant, "p(i(StaticTypeAndData) o(Variant))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQVariant, "p(i(Variant variantX) i(Variant variantY) o(Boolean result))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNEVariant, "p(i(Variant variantX) i(Variant variantY) o(Boolean result))")

DEFINE_VIREO_END()

};  // namespace Vireo
