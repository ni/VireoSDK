/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include "TypeAndDataManager.h"
#include "ExecutionContext.h"

namespace Vireo
{

TypeRef InstantiateTypeTemplate(TypeManagerRef tm, TypeRef typeTemplate, TypeRef replacements);

//------------------------------------------------------------
class TypeTemplateVisitor : public TypeVisitor
{
public:
    TypeTemplateVisitor(TypeManagerRef tm, SubVector<TypeRef>* parameters);
    TypeRef Accept(TypeRef type);

private:
    TypeManagerRef _typeManager;
    SubVector<TypeRef>* _parameters;
    TypeRef _newType;
private:
    
    virtual void VisitBad(TypeRef type);
    virtual void VisitBitBlock(BitBlockType* type);
    virtual void VisitBitCluster(BitClusterType* type);
    virtual void VisitCluster(ClusterType* type);
    virtual void VisitParamBlock(ParamBlockType* type);
    virtual void VisitEquivalence(EquivalenceType* type);
    virtual void VisitArray(ArrayType* type);
    virtual void VisitElement(ElementType* type);
    virtual void VisitNamed(NamedType* type);
    virtual void VisitPointer(PointerType* type);
    virtual void VisitDefaultValue(DefaultValueType* type);
    virtual void VisitDefaultPointer(DefaultPointerType* type);
    virtual void VisitCustomDataProc(CustomDataProcType* type);
};
//------------------------------------------------------------
TypeRef InstantiateTypeTemplate(TypeManagerRef tm, TypeRef type, SubVector<TypeRef>* parameters)
{
    TypeTemplateVisitor itv(tm, parameters);
    return itv.Accept(type);
}
//------------------------------------------------------------
TypeRef TypeTemplateVisitor::Accept(TypeRef type)
{
    if (!type->HasGenericType()) {
        return type;
    } else {
        type->Accept(this);
        TypeRef newType = _newType;
        _newType = null;
        return newType;
    }
}
//------------------------------------------------------------
TypeTemplateVisitor::TypeTemplateVisitor(TypeManagerRef tm, SubVector<TypeRef>* parameters)
{
    _typeManager = tm;
    _parameters = parameters;
    _newType = null;
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBad(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBitBlock(BitBlockType* type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBitCluster(BitClusterType* type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitCluster(ClusterType* type)
{
    TypeRef elementTypes[1000];   //TODO enforce limits or make them dynamic
    IntIndex subElementCount = type->SubElementCount();
    for (int i = 0; i < subElementCount; i++) {
        elementTypes[i] = Accept(type->GetSubElement(i));
    }
    _newType  = ClusterType::New(_typeManager, elementTypes, type->SubElementCount());
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitParamBlock(ParamBlockType* type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitEquivalence(EquivalenceType* type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitArray(ArrayType* type)
{
    // A type can not currently derived based on dimension size
    TypeRef subType = Accept(type->GetSubElement(0));
    VIREO_ASSERT(subType != type->GetSubElement(0));
    
    _newType = ArrayType::New(_typeManager, subType, type->Rank(), type->GetDimensionLengths());
    VIREO_ASSERT(_newType != type);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitElement(ElementType* type)
{
    TypeRef   baseType = Accept(type->BaseType());
    SubString fieldName = type->GetElementName();
    UsageTypeEnum usageType = type->ElementUsageType();
    IntIndex offset = type->ElementOffset();
    _newType = ElementType::New(_typeManager, &fieldName, baseType, usageType, offset);
    VIREO_ASSERT(_newType != type);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitNamed(NamedType* type)
{
    SubString name = type->GetName();
    
    // TODO support more than one parameter
    if(name.CompareCStr(tsTemplatePrefix "1")) {
        _newType = *_parameters->Begin();
        return;
    }
    // To get here the named type was generic, and that means the
    // base type is also generic. First ceaate the hyotheitcal new name
    // and see if instance already exists. If not, make one.
    
    // Create a new name, TODO should  really use TDCodecVIA to parse the type
    STACK_VAR(String, tempString);

    tempString.Value->Append(name.Length(), (Utf8Char*)name.Begin());
    tempString.Value->Append('<');
    name =  (*_parameters->Begin())->GetName();
    tempString.Value->Append('.');
    tempString.Value->Append(name.Length(), (Utf8Char*)name.Begin());
    tempString.Value->Append('>');
    name = tempString.Value->MakeSubStringAlias();
    
    // Find an existing instantion, or make one.
    _newType = _typeManager->FindType(&name);
    if (!_newType) {
        TypeRef newBaseType = Accept(type->BaseType());
        VIREO_ASSERT(newBaseType != type->BaseType());
        _newType = _typeManager->Define(&name, newBaseType);
        // The new type needs to have an IsA relation ship to the template it is derived from
        // how to do that?
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitPointer(PointerType* type)
{
    TypeRef newBaseType = Accept(type->BaseType());
    if (newBaseType != type->BaseType()) {
        _newType = PointerType::New(_typeManager, newBaseType);
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitDefaultValue(DefaultValueType* type)
{
    TypeRef newBaseType = Accept(type->BaseType());
    if (newBaseType != type->BaseType()) {
        // Templated defaults are a bit extreme. If the type is generic then
        // how could the data have been parsed.
        _newType = DefaultValueType::New(_typeManager, type->BaseType(), type->IsMutableValue());
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitDefaultPointer(DefaultPointerType* type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitCustomDataProc(CustomDataProcType* type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}


}

