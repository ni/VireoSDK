/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
 */

#include "TypeAndDataManager.h"
#include "ExecutionContext.h"

namespace Vireo
{

//------------------------------------------------------------
//! Visits a type replacing template elements with the template parameters.
class TypeTemplateVisitor : public TypeVisitor
{
 public:
    TypeTemplateVisitor(TypeManagerRef tm, SubVector<TypeRef>* parameters);
    TypeRef Accept(TypeRef type);

 private:
    TypeManagerRef _typeManager;
    SubVector<TypeRef>* _parameters;
    TypeRef _newType;
    AggregateAlignmentCalculator *_alignmentCalculator;

 private:
    TypeRef  LookupParameter(IntIndex i);
    IntIndex AcceptIntDim(IntIndex value);

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
    virtual void VisitEnum(EnumType* type);
    virtual void VisitRefNumVal(RefNumValType* type);
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
    type->Accept(this);
    TypeRef newType = _newType;
    _newType = null;
    return newType;
}
//------------------------------------------------------------
TypeTemplateVisitor::TypeTemplateVisitor(TypeManagerRef tm, SubVector<TypeRef>* parameters)
{
    _typeManager = tm;
    _parameters = parameters;
    _newType = null;
    _alignmentCalculator = null;
}
//------------------------------------------------------------
TypeRef TypeTemplateVisitor::LookupParameter(IntIndex i)
{
    if (i >= 0 && i < _parameters->Length()) {
        return _parameters->Begin()[i];
    } else {
        // unsupplied parameters become new named types?
        // or permanently left open.
        return null;
    }
}
//------------------------------------------------------------
IntIndex TypeTemplateVisitor::AcceptIntDim(IntIndex value)
{
    if (IsTemplateDim(value)) {
        // Find the template parameter.
        IntIndex i = TemplateDimIndex(value);
        TypeRef type = LookupParameter(i);
        if (type) {
            // Use its value.
            return (IntIndex) ReadIntFromMemory(type, type->Begin(kPARead));
        } else {
            // If no parameter is supplied then change it to simply being variable size
            // TODO(templates) or shift its position?, thats not hard either.
            return kArrayVariableLengthSentinel;
        }
    } else {
        return value;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBad(TypeRef type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBitBlock(BitBlockType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitBitCluster(BitClusterType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitCluster(ClusterType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    ClusterAlignmentCalculator calc(_typeManager);
    AggregateAlignmentCalculator* saveCalc = _alignmentCalculator;
    _alignmentCalculator = &calc;

    TypeRef elementTypes[1000];   // TODO enforce limits or make them dynamic
    IntIndex subElementCount = type->SubElementCount();

    for (Int32 i = 0; i < subElementCount; i++) {
        elementTypes[i] = Accept(type->GetSubElement(i));
    }
    _newType  = ClusterType::New(_typeManager, elementTypes, type->SubElementCount());

    _alignmentCalculator = saveCalc;
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitParamBlock(ParamBlockType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitEquivalence(EquivalenceType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    EquivalenceAlignmentCalculator calc(_typeManager);
    AggregateAlignmentCalculator* saveCalc = _alignmentCalculator;
    _alignmentCalculator = &calc;

    TypeRef elementTypes[1000];   // TODO enforce limits or make them dynamic
    IntIndex subElementCount = type->SubElementCount();

    for (Int32 i = 0; i < subElementCount; i++) {
        elementTypes[i] = Accept(type->GetSubElement(i));
    }
    _newType  = EquivalenceType::New(_typeManager, elementTypes, type->SubElementCount());

    _alignmentCalculator = saveCalc;
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitArray(ArrayType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    // Array  may be visited if the element type or a dimension is
    // templated. Simple having a dimension that is variable should
    // not trigger template type substitution.

    IntIndexItr iDim(type->DimensionLengths(), type->Rank());
    ArrayDimensionVector newDimensions;
    IntIndex* pNew  = newDimensions;
    while (iDim.HasNext()) {
        *pNew++ = AcceptIntDim(iDim.Read());
    }

    TypeRef subType = Accept(type->GetSubElement(0));
    // not strictly true any longer.
    VIREO_ASSERT(subType != type->GetSubElement(0));

    Boolean inhibitUniq = type->Rank() > 0 && _inhibitTypeUniqueness;
    _newType = ArrayType::New(_typeManager, subType, type->Rank(), newDimensions, inhibitUniq);
    VIREO_ASSERT(_newType != type);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitElement(ElementType* type)
{
    IntIndex offset;
    if (!type->IsTemplate()) {
        _newType = type;
        offset = _alignmentCalculator->AlignNextElement(type->BaseType());
        VIREO_ASSERT(type->ElementOffset() == offset);
        return;
    }

    TypeRef   baseType = Accept(type->BaseType());
    SubString fieldName = type->ElementName();
    UsageTypeEnum usageType = type->ElementUsageType();
    offset = _alignmentCalculator->AlignNextElement(baseType);

    _newType = ElementType::New(_typeManager, &fieldName, baseType, usageType, offset);
    VIREO_ASSERT(_newType != type);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitNamed(NamedType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    SubString name = type->Name();
    IntMax nTParams =  _parameters->Length();

    // When visiting a NamedType it means there is some portion it contains that is open.
    // other wise the existing type would have been used as is.

    // Case 1: The name is a template parameter name like '$0', '$1', ...
    // In this case the type get substituted with the parameter value.
    if (name.EatChar(*tsMetaIdPrefix)) {
        IntMax i;
        name.ReadInt(&i);
        if (i >= 0 && i < nTParams) {
            _newType = _parameters->Begin()[i];
        } else {
             // BaseType of a generic parameter is the simple generic type
             // so use it if the parameter was not passed in.
            _newType = type->BaseType();
        }
        return;
    }

    // Case 2: There were no type passed in the template expression
    if (0 == nTParams) {
        _newType = type;
        return;
    }

    // Case 3: It's a named type that contains some open types.
    // IF ther are parameters they are the set of parameters for this type
    // but not for nested named types. So build a Name based on the set of parameters
    // supplied then hide the parameters before recursing. If a named typed
    // is templated in the top typ it (may/will) have its own set of arguments
    // based on the outer scope.

    //
    // base type is also generic. First create the hypothetical new name
    // and see if the instance already exists. If not, make one.

    // Create a new name, TODO should  really use TDCodecVIA to parse the type
    STACK_VAR(String, tempString);

    tempString.Value->Append(name.Length(), (Utf8Char*)name.Begin());
    tempString.Value->Append('<');
    for (Int32 i = 0; i < nTParams; i++) {
        tempString.Value->Append('.');
        name =  (_parameters->Begin()[i])->Name();
        tempString.Value->Append(name.Length(), (Utf8Char*)name.Begin());
        if (i < nTParams-1)
            tempString.Value->Append(' ');
    }
    tempString.Value->Append('>');
    name = tempString.Value->MakeSubStringAlias();

    // Find an existing instantiation, or make one.
    _newType = _typeManager->FindType(&name);
    if (!_newType) {
        TypeRef newBaseType = Accept(type->BaseType());
        VIREO_ASSERT(newBaseType != type->BaseType());
        _newType = _typeManager->Define(&name, newBaseType);
        // The new type needs to have an IsA relationship to the template it is derived from
        // how to do that?
    } else {
        // This instantiation already exists.
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitPointer(PointerType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    TypeRef newBaseType = Accept(type->BaseType());
    if (newBaseType != type->BaseType()) {
        _newType = PointerType::New(_typeManager, newBaseType);
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitRefNumVal(RefNumValType *type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    TypeRef newBaseType = Accept(type->BaseType());
    if (newBaseType != type->BaseType()) {
        _newType = RefNumValType::New(_typeManager, newBaseType);
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitEnum(EnumType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    TypeRef newBaseType = Accept(type->BaseType());
    if (newBaseType != type->BaseType()) {
        _newType = EnumType::New(_typeManager, newBaseType);
    } else {
        _newType = type;
    }
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitDefaultValue(DefaultValueType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

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
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}
//------------------------------------------------------------
void TypeTemplateVisitor::VisitCustomDataProc(CustomDataProcType* type)
{
    if (!type->IsTemplate()) {
        _newType = type;
        return;
    }

    _newType = _typeManager->BadType();
    VIREO_ASSERT(false);
}

}  // namespace Vireo
