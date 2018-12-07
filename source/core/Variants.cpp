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

namespace Vireo
{
class VariantAttributeManager {
 public:
    using AttributeMapType = std::map<StringRef, StaticTypeAndDataRef, StringRefCmp>;
    using VariantToAttributeMapType = std::map< DataPointer, AttributeMapType *>;
    VariantAttributeManager(const VariantAttributeManager&) = delete;
    VariantAttributeManager& operator=(const VariantAttributeManager&) = delete;

 private:
    VariantToAttributeMapType _variantToAttributeMap;
    VariantAttributeManager() = default;

 public:
    static VariantAttributeManager& Instance() {
        static VariantAttributeManager _instance;
        return _instance;
    }

    const VariantToAttributeMapType& GetVariantToAttributeMap() const {
        return _variantToAttributeMap;
    }

    VariantToAttributeMapType& GetVariantToAttributeMap() {
        return _variantToAttributeMap;
    }

    ~VariantAttributeManager() {
        for (auto entry : _variantToAttributeMap) {
            entry.second->clear();
        }
        _variantToAttributeMap.clear();
    }
};

//------------------------------------------------------------
struct DataToVariantParamBlock : public VarArgInstruction
{
    _ParamImmediateDef(StaticTypeAndData, InputData);
    _ParamDef(TypeRef, OutputVariant);
    NEXT_INSTRUCTION_METHODV()
};

// Convert data of any type to variant
VIREO_FUNCTION_SIGNATUREV(DataToVariant, DataToVariantParamBlock)
{
    TypeRef inputType = _ParamImmediate(InputData._paramType);
    TypeManagerRef tm = THREAD_TADM();

    TypeRef variantType = DefaultValueType::New(tm, inputType, true);
    variantType->CopyData(_ParamImmediate(InputData._pData), variantType->Begin(kPAWrite));
    _Param(OutputVariant) = variantType;
    return _NextInstruction();
}

//------------------------------------------------------------
struct VariantToDataParamBlock : public VarArgInstruction
{
    _ParamDef(TypeRef, VariantType);
    _ParamDef(ErrorCluster, ErrorClust);
    _ParamImmediateDef(StaticTypeAndData, DestData);
    NEXT_INSTRUCTION_METHODV()
};

// Convert variant to data of given type. Error if the data types don't match
VIREO_FUNCTION_SIGNATUREV(VariantToData, VariantToDataParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    if (!errPtr || !errPtr->status) {
        TypeRef variantType = _Param(VariantType);
        TypeRef destType = _ParamImmediate(DestData._paramType);

        if (variantType->IsA(destType)) {
            void* destData = _ParamImmediate(DestData)._pData;
            variantType->CopyData(variantType->Begin(kPARead), destData);
        } else {
            if (errPtr) {
                errPtr->SetError(true, 91, "Variant To Data");
            }
        }
    }
    return _NextInstruction();
}

struct SetVariantAttributeParamBlock : public VarArgInstruction
{
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamImmediateDef(StaticTypeAndData, Value);
    _ParamDef(Boolean, Replaced);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(SetVariantAttribute, SetVariantAttributeParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    bool replaced = false;
    if (!errPtr || !errPtr->status) {
        StringRef name = _Param(Name);
        if (IsStringEmpty(name)) {
            if (errPtr) {
                errPtr->SetError(true, 1, "Set Variant Attribute");
            }
        } else {
            TypeRef inputVariant = _Param(InputVariant);
            StaticTypeAndDataRef value = &_ParamImmediate(Value);
            VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

            auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
            if (variantToAttributeMapIter != variantToAttributeMap.end()) {
                VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;

                auto pairIterBool = attributeMap->insert(VariantAttributeManager::AttributeMapType::value_type(name, value));
                replaced = !pairIterBool.second;
                if (!pairIterBool.second) {
                    pairIterBool.first->second = value;
                }
            } else {
                auto attributeMap = new VariantAttributeManager::AttributeMapType;
                (*attributeMap)[name] = value;
                variantToAttributeMap[inputVariant] = attributeMap;
                replaced = false;
            }
        }
    }
    if (_ParamPointer(Replaced)) {
        _Param(Replaced) = replaced;
    }
    return _NextInstruction();
}

struct GetVariantAttributesParamBlock : public VarArgInstruction
{
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamImmediateDef(StaticTypeAndData, Value);
    _ParamDef(Boolean, Found);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(GetVariantAttribute, GetVariantAttributesParamBlock)
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
                StaticTypeAndDataRef foundValue = attributeMapIter->second;
                if (foundValue->_paramType->IsA(value->_paramType) || value->_paramType->Name().Compare(&TypeCommon::TypeVariant)) {
                    found = true;
                    value->_paramType->CopyData(foundValue->_pData, value->_pData);
                } else {
                    if (errPtr) {
                        errPtr->SetError(true, 91, "Get Variant Attribute");  // Incorrect type for default value for the attribute
                    }
                }
            }
        }
    }
    if (_ParamPointer(Found)) {
        _Param(Found) = found;
    }
    return _NextInstruction();
}

struct GetVariantAttributesAllParamBlock : public VarArgInstruction
{
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(TypedArrayCoreRef, Names);
    _ParamDef(TypedArrayCoreRef, Values);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(GetVariantAttributeAll, GetVariantAttributesAllParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    TypedArrayCoreRef names = _Param(Names);
    TypedArrayCoreRef values = _Param(Values);
    bool bResetOutputArrays = true;
    if (!errPtr || !errPtr->status) {
        TypeRef inputVariant = _Param(InputVariant);
        const VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        const auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;
            const auto mapSize = attributeMap->size();
            if (mapSize != 0) {
                bResetOutputArrays = false;
                names->Resize1D(mapSize);
                values->Resize1D(mapSize);
                AQBlock1* pNamesInsert = names->BeginAt(0);
                AQBlock1* pValuesInsert = values->BeginAt(0);
                TypeRef namesElementType = names->ElementType();
                TypeRef valuesElementType = values->ElementType();
                const Int32 namesAQSize = namesElementType->TopAQSize();
                const Int32 valuesAQSize = valuesElementType->TopAQSize();
                TypeManagerRef tm = THREAD_TADM();
                for (const auto attributePair : *attributeMap) {
                    String* const* attributeNameStr = &(attributePair.first);
                    StaticTypeAndDataRef attributeValue = attributePair.second;
                    namesElementType->CopyData(attributeNameStr, pNamesInsert);

                    if (attributeValue->_paramType->Name().Compare(&TypeCommon::TypeVariant)) {
                        attributeValue->_paramType->CopyData(attributeValue->_pData, pValuesInsert);
                    } else {
                        TypeRef variantType = DefaultValueType::New(tm, attributeValue->_paramType, true);
                        variantType->CopyData(attributeValue->_pData, variantType->Begin(kPAWrite));
                        *reinterpret_cast<TypeRef *>(pValuesInsert) = variantType;
                    }
                    pNamesInsert += namesAQSize;
                    pValuesInsert += valuesAQSize;
                }
            }
        }
    }
    if (bResetOutputArrays) {
        names->Resize1D(0);
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

VIREO_FUNCTION_SIGNATUREV(DeleteVariantAttribute, DeleteVariantAttributeParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    StringRef *name = _ParamPointer(Name);
    _Param(Found) = false;
    if (!errPtr || !errPtr->status) {
        const TypeRef inputVariant = _Param(InputVariant);
        VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        const auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;
            const auto mapSize = attributeMap->size();
            if (mapSize != 0) {
                if (!name) {
                    attributeMap->clear();
                    variantToAttributeMap.erase(variantToAttributeMapIter);
                    delete attributeMap;
                    _Param(Found) = true;
                } else {
                    const auto attributeMapIterator = attributeMap->find(*name);
                    if (attributeMapIterator != attributeMap->end()) {
                        _Param(Found) = true;
                        attributeMap->erase(attributeMapIterator);
                    }
                }
            }
        }
    }
    return _NextInstruction();
}

struct CopyVariantParamBlock : public InstructionCore
{
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(TypeRef, OutputVariant);

    NEXT_INSTRUCTION_METHOD()
};

VIREO_FUNCTION_SIGNATUREV(CopyVariant, CopyVariantParamBlock)
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
            attributeMapOutput->insert(attributeMapInput->begin(), attributeMapInput->end());
            variantToAttributeMap[destType] = attributeMapOutput;
        }
        _Param(OutputVariant) = destType;
    }
    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(Variant)

    DEFINE_VIREO_FUNCTION(VariantToData, "p(i(VarArgCount argumentCount) i(Variant) io(ErrorCluster) o(StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(DataToVariant, "p(i(VarArgCount argumentCount) i(StaticTypeAndData) o(Variant))");
    DEFINE_VIREO_FUNCTION(SetVariantAttribute, "p(i(VarArgCount argCount) io(Variant inputVariant) i(String name)"
                                                " i(StaticTypeAndData value) o(Boolean replaced) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(GetVariantAttribute, "p(i(VarArgCount argCount) i(Variant inputVariant) i(String name)"
                                                "io(StaticTypeAndData value) o(Boolean found) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(GetVariantAttributeAll, "p(i(VarArgCount argCount) i(Variant inputVariant) o(Array names)"
                                                   "o(Array values) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(DeleteVariantAttribute, "p(io(Variant inputVariant) i(String name) o(Boolean found) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(CopyVariant, "p(i(Variant inputVariant) o(Variant outputVariant) )");

DEFINE_VIREO_END()

};  // namespace Vireo
