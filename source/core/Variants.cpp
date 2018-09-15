/**
Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
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
    typedef std::map<StringRef, StaticTypeAndDataPointer, StringRefCmp> AttributeMapType;
    typedef std::map< DataPointer, AttributeMapType *> VariantToAttributeMapType;

 private:
    VariantToAttributeMapType _variantToAttributeMap;

    VariantAttributeManager() {}
    VariantAttributeManager(const VariantAttributeManager&) = delete;
    VariantAttributeManager& operator=(const VariantAttributeManager&) = delete;

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
    if (variantType->IsA(inputType)) {  // TODO(sanmut): Delete if condition. Does not make sense
        variantType->CopyData(_ParamImmediate(InputData._pData), variantType->Begin(kPAWrite));
    }
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
            errPtr->SetError(true, 91, "Variant To Data");
        }
    }
    return _NextInstruction();
}

struct SetVariantAttributesParamBlock : public VarArgInstruction
{
    _ParamDef(TypeRef, InputVariant);
    _ParamDef(StringRef, Name);
    _ParamImmediateDef(StaticTypeAndData, Value);
    _ParamDef(Boolean, Replaced);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(SetVariantAttributes, SetVariantAttributesParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    if (!errPtr || !errPtr->status) {
        TypeRef inputVariant = _Param(InputVariant);
        StringRef name = _Param(Name);
        StaticTypeAndDataPointer value = &_ParamImmediate(Value);
        VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;

            auto pairIterBool = attributeMap->insert(VariantAttributeManager::AttributeMapType::value_type(name, value));
            _Param(Replaced) = !pairIterBool.second;
            if (!pairIterBool.second) {
                pairIterBool.first->second = value;
            }
        } else {
            VariantAttributeManager::AttributeMapType *attributeMap = new VariantAttributeManager::AttributeMapType;
            (*attributeMap)[name] = value;
            variantToAttributeMap[inputVariant] = attributeMap;
            _Param(Replaced) = false;
        }
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

VIREO_FUNCTION_SIGNATUREV(GetVariantAttributes, GetVariantAttributesParamBlock)
{
    ErrorCluster *errPtr = _ParamPointer(ErrorClust);
    _Param(Found) = false;
    if (!errPtr || !errPtr->status) {
        TypeRef inputVariant = _Param(InputVariant);
        StringRef name = _Param(Name);
        StaticTypeAndDataPointer value = &_ParamImmediate(Value);
        const VariantAttributeManager::VariantToAttributeMapType &variantToAttributeMap = VariantAttributeManager::Instance().GetVariantToAttributeMap();

        auto variantToAttributeMapIter = variantToAttributeMap.find(inputVariant);
        if (variantToAttributeMapIter != variantToAttributeMap.end()) {
            VariantAttributeManager::AttributeMapType *attributeMap = variantToAttributeMapIter->second;
            auto attributeMapIter = attributeMap->find(name);
            if (attributeMapIter != attributeMap->end()) {
                StaticTypeAndDataPointer foundValue = attributeMapIter->second;
                if (foundValue->_paramType->IsA(value->_paramType)) {
                    _Param(Found) = true;
                    value->_paramType->CopyData(foundValue->_pData, value->_pData);
                } else {
                    errPtr->SetError(true, 91, "Get Variant Attribute");  // Incorrect type for default value for the attribute
                }
            }
        }
    }
    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(Variant)

    DEFINE_VIREO_FUNCTION(VariantToData, "p(i(VarArgCount argumentCount) i(Variant) io(ErrorCluster) o(StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(DataToVariant, "p(i(VarArgCount argumentCount) i(StaticTypeAndData) o(Variant))");
    DEFINE_VIREO_FUNCTION(SetVariantAttributes, "p(i(VarArgCount argCount) io(Variant inputVariant) i(String name)"
                                                " i(StaticTypeAndData value) o(Boolean replaced) io(ErrorCluster error) )");
    DEFINE_VIREO_FUNCTION(GetVariantAttributes, "p(i(VarArgCount argCount) io(Variant inputVariant) i(String name)"
                                                "io(StaticTypeAndData value) o(Boolean found) io(ErrorCluster error) )");

DEFINE_VIREO_END()

};  // namespace Vireo
