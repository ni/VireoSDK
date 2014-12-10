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
    TypeTemplateVisitor(TypeManagerRef tm, TypeRef replacement);
    TypeRef Visit(TypeRef type);

private:
    TypeManagerRef _typeManager;
    TypeRef _replacementTypes;
    TypeRef _newType;
private:
    
    virtual void VisitBad(TypeRef type);
    virtual void VisitBitBlock(TypeRef type);
    virtual void VisitBitCluster(TypeRef type);
    virtual void VisitCluster(TypeRef type);
    virtual void VisitParamBlock(TypeRef type);
    virtual void VisitEquivalence(TypeRef type);
    virtual void VisitArray(TypeRef type);
    virtual void VisitElement(TypeRef type);
    virtual void VisitNamed(TypeRef type);
    virtual void VisitPointer(TypeRef type);
    virtual void VisitDefaultValue(TypeRef type);
    virtual void VisitCustomDefaultPointer(TypeRef type);
    virtual void VisitCustomDataProc(TypeRef type);
};
//------------------------------------------------------------
TypeRef InstantiateTypeTemplate(TypeManagerRef tm, TypeRef type, TypeRef parameters)
{
    TypeTemplateVisitor itv(tm, parameters);
    return itv.Visit(type);
}
//------------------------------------------------------------
TypeRef TypeTemplateVisitor::Visit(TypeRef type)
{
    if (!type->HasGenericType()) {
        return type;
    } else {
        type->Visit(this);
        TypeRef newType = _newType;
        _newType = null;
        return newType;
    }
}
//------------------------------------------------------------
TypeTemplateVisitor::TypeTemplateVisitor(TypeManagerRef tm, TypeRef replacement)
{
    _typeManager = tm;
    _replacementTypes = replacement;
    _newType = null;
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBad(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBitBlock(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBitCluster(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitCluster(TypeRef type)
{
    TypeRef elementTypes[1000];   //TODO enforce limits or make them dynamic
    IntIndex subElementCount = type->SubElementCount();
    for (int i = 0; i < subElementCount; i++) {
        elementTypes[i] = Visit(type->GetSubElement(i));
    }
    _newType  = ClusterType::New(_typeManager, elementTypes, type->SubElementCount());
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitParamBlock(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitEquivalence(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitArray(TypeRef type)
{
    // A type can not currently derived based on dimension size
    TypeRef subType = Visit(type->GetSubElement(0));
    VIREO_ASSERT(subType != type->GetSubElement(0));
    
    _newType = ArrayType::New(_typeManager, subType, type->Rank(), type->GetDimensionLengths());
    VIREO_ASSERT(_newType != type);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitElement(TypeRef type)
{
    TypeRef   baseType = Visit(type->BaseType());
    SubString fieldName = type->GetElementName();
    UsageTypeEnum usageType = type->ElementUsageType();
    IntIndex offset = type->ElementOffset();
    _newType = ElementType::New(_typeManager, &fieldName, baseType, usageType, offset);
    VIREO_ASSERT(_newType != type);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitNamed(TypeRef type)
{
    SubString name = type->GetName();
    
    if(name.CompareCStr("$1")) {
        _newType = _replacementTypes;
        return;
    }
    // To get here the named type was generic, and that means the
    // base type is also generic. First ceaate the hyotheitcal new name
    // and see if instance already exists. If not, make one.
    
    // Create a new name, TODO should  really use TDCodecVIA to parse the type
    STACK_VAR(String, tempString);

    tempString.Value->Append(name.Length(), (Utf8Char*)name.Begin());
    tempString.Value->Append('<');
    name = _replacementTypes->GetName();
    tempString.Value->Append('.');
    tempString.Value->Append(name.Length(), (Utf8Char*)name.Begin());
    tempString.Value->Append('>');
    name = tempString.Value->MakeSubStringAlias();
    
    // Find an existing instantion, or make one.
    _newType = _typeManager->FindType(&name);
    if (!_newType) {
        TypeRef newBaseType = Visit(type->BaseType());
        VIREO_ASSERT(newBaseType != type->BaseType());
        _newType = _typeManager->Define(&name, newBaseType);
        // The new type needs to have an IsA relation ship to the template it is derived from
        // how to do that?
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitPointer(TypeRef type)
{
    TypeRef newBaseType = Visit(type->BaseType());
    if (newBaseType != type->BaseType()) {
        _newType = PointerType::New(_typeManager, newBaseType);
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitDefaultValue(TypeRef type)
{
    TypeRef newBaseType = Visit(type->BaseType());
    if (newBaseType != type->BaseType()) {
        // Templated defaults are a bit extreme. If the type is generic then
        // how could the data have been parsed.
        _newType = DefaultValueType::New(_typeManager, type->BaseType(), type->IsMutableValue());
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitCustomDefaultPointer(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitCustomDataProc(TypeRef type)
{
    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}


}

