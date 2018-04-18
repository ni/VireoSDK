/**

Copyright (c) 2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
 */

#include "TypeAndDataManager.h"

namespace Vireo
{

//------------------------------------------------------------
/* Create a visitor with a needle being looked for and a TypeRef
* that describes what the needle is a pointer to. The visitor will visit
* all types in the type manger and thus ultimate all values owned by that type manager
* and if necessary parent type managers as well.
* initiall the hay stack is null, but when a type is visited that owns a value ( constant or var)
* it will establish a haystack then as the type is visited the stack is narrowed.
*/

class PathFinderVisitor : public TypeVisitor
{
 public:
    PathFinderVisitor(TypeRef tNeedle, DataPointer pHaystack, StringRef path);
    void Accept(TypeRef tHaystack, DataPointer pHaystack);
    void Accept(TypeManagerRef tm);
    Boolean Found() {return _found;}

 private:
    // What is being searched through
    void*           _pHayStack;

    // What is being looked for
    TypeRef         _tNeedle;
    void*           _pNeedle;

    // Used as frames are unwound
    Boolean         _pathEmpty;
    Boolean         _found;
    StringRef       _path;

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
    virtual void VisitEnum(EnumType* type);
    virtual void VisitRefNumVal(RefNumValType* type);
    virtual void VisitDefaultValue(DefaultValueType* type);
    virtual void VisitDefaultPointer(DefaultPointerType* type);
    virtual void VisitCustomDataProc(CustomDataProcType* type);
};
//------------------------------------------------------------
void TypeManager::GetPathFromPointer(TypeRef tNeedle, DataPointer pNeedle, StringRef path)
{
    path->Resize1D(0);
    PathFinderVisitor drv(tNeedle, pNeedle, path);
    for (TypeManager *tm = this; tm && !drv.Found(); tm = tm->BaseTypeManager()) {
        drv.Accept(tm);
    }

    if (!drv.Found()) {
        path->AppendCStr("*pointer-not-found*");
    }
}
//------------------------------------------------------------
PathFinderVisitor::PathFinderVisitor(TypeRef tHaystack, DataPointer pNeedle, StringRef path)
{
    _tNeedle = tHaystack;
    _pNeedle = pNeedle;
    _pHayStack = null;
    _pathEmpty = true;
    _found = false;
    _path = path;
}
//------------------------------------------------------------
//! Visitor dispatch helper method that traverses all the types in a TypeManager
void PathFinderVisitor::Accept(TypeManagerRef tm)
{
    TypeRef type = tm->TypeList();
    while (type) {
        Accept(type, type->Begin(kPASoftRead));
        if (_found)
            break;
        type = type->Next();
    }

    SubString rootName;
    Boolean isTypeRefConstant = false;
    if (_found) {
        rootName = type->Name();
    } else {
        _found = tm->PointerToTypeConstRefName((TypeRef*)_pNeedle, &rootName);
        isTypeRefConstant = _found;
    }

    if (_found) {
        if (isTypeRefConstant) {
            _path->InsertCStr(0, ".");
        }
        if (!type->IsA("VirtualInstrument")) {
            // EncodedSubString encodedStr(rootName, true, false);
            // SubString encSubStr = encodedStr.GetSubString();
            _path->InsertSubString(0, &rootName);
        }
    }
}
//------------------------------------------------------------
//! Visitor dispatch helper method that defines a new/smaller haystack
void PathFinderVisitor::Accept(TypeRef tHayStack, DataPointer pHayStack)
{
    if (_pNeedle == tHayStack) {
        // The value may be a TypeRef. If so check and catch it here,
        // no need for each visitor to do a check.
        // _isTypeRef = true;
        _found = true;
    } else if ((_pNeedle == pHayStack) && (_tNeedle->IsA(tHayStack, true) )) {
        // Once the needle is found then there is no need to keep
        // digging if the types match. However, if the needle is the
        // first field in a cluster more digging may be necessary
        // to get the correct full symbol path.
        _found = true;
    } else {
        // Dig deeper into the data.
        void* saveData = _pHayStack;
        _pHayStack = pHayStack;
        tHayStack->Accept(this);
        _pHayStack = saveData;
    }
}
//------------------------------------------------------------
void PathFinderVisitor::VisitBad(TypeRef type)
{
}
//------------------------------------------------------------
void PathFinderVisitor::VisitBitBlock(BitBlockType* type)
{
}
//------------------------------------------------------------
void PathFinderVisitor::VisitBitCluster(BitClusterType* type)
{
}
//------------------------------------------------------------
void PathFinderVisitor::VisitCluster(ClusterType* type)
{
    if (_pHayStack == null)
        return;

    IntIndex count = type->SubElementCount();
    for (IntIndex j = 0; j < count; j++) {
        TypeRef elementType = type->GetSubElement(j);
        IntIndex offset = elementType->ElementOffset();
        AQBlock1* pElementData = (AQBlock1*)_pHayStack + offset;
        Accept(elementType, pElementData);
        if (_found) {
            
            if (!elementType->ElementName().CompareCStr("Locals")) {
                if (!_pathEmpty) {
                    _path->InsertCStr(0, ".");   
                }
                SubString ss = elementType->ElementName();
                _path->InsertSubString(0, &ss);
                _pathEmpty = false;
            }

            break;
        }
    }
}
//------------------------------------------------------------
void PathFinderVisitor::VisitParamBlock(ParamBlockType* type)
{
}
//------------------------------------------------------------
void PathFinderVisitor::VisitEquivalence(EquivalenceType* type)
{
    Accept(type->GetSubElement(0), _pHayStack);
}
//------------------------------------------------------------
void PathFinderVisitor::VisitArray(ArrayType* type)
{
    if (_pHayStack == null)
        return;

    TypedArrayCoreRef pArray = *(TypedArrayCoreRef*)_pHayStack;
    TypeRef elementType = pArray->ElementType();

    if (type->IsZDA()) {
        // ZDA's have one element.
        Accept(elementType, pArray->RawBegin());
    }
}
//------------------------------------------------------------
void PathFinderVisitor::VisitElement(ElementType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void PathFinderVisitor::VisitNamed(NamedType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void PathFinderVisitor::VisitPointer(PointerType* type)
{
}
//------------------------------------------------------------
void PathFinderVisitor::VisitEnum(EnumType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void PathFinderVisitor::VisitRefNumVal(RefNumValType *type)
{
}
//------------------------------------------------------------
void PathFinderVisitor::VisitDefaultValue(DefaultValueType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void PathFinderVisitor::VisitDefaultPointer(DefaultPointerType* type)
{
}
//------------------------------------------------------------
void PathFinderVisitor::VisitCustomDataProc(CustomDataProcType* type)
{
    Accept(type->BaseType(), _pHayStack);
}

}  // namespace Vireo

