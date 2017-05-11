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
#if defined (VIREO_INSTRUCTION_REFLECTION)

//------------------------------------------------------------
/* Create a visitor with a needle being looked for and a TypeRef
* that describes what the needle is a pointer to. The visitor will visit
* all types in the type manger and thus ultimate all values owned by that type manager
* and if necessary parent type managers as well.
* initiall the hay stack is null, but when a type is visited that owns a value ( constant or var)
* it will establish a haystack then as the type is visited the stack is narrowed.
*/

class DataReflectionVisitor : public TypeVisitor
{
 public:
    DataReflectionVisitor(TypeRef tNeedle, DataPointer pHaystack, StringRef path);
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
TypeRef TypeManager::PointerToSymbolPath(TypeRef tNeedle, DataPointer pNeedle, StringRef path)
{
    // TODO(PaulAustin): needs scope output (local, global, type constant)

    path->Resize1D(0);
    DataReflectionVisitor drv(tNeedle, pNeedle, path);
    for (TypeManager *tm = this; tm && !drv.Found(); tm = tm->BaseTypeManager()) {
        drv.Accept(tm);
    }

    if (!drv.Found()) {
        path->AppendCStr("*pointer-not-found*");
    }
    return null;
}
//------------------------------------------------------------
Boolean TypeManager::PointerToTypeConstRefName(TypeRef* pNeedle, SubString* name)
{
    MUTEX_SCOPE()
    TypeDictionaryIterator iter = _typeNameDictionary.begin();
    TypeDictionaryIterator end = _typeNameDictionary.end();
    while (iter != end) {
        if ((TypeRef*)&iter->second == pNeedle) {
            *name = iter->first;
            return true;
        }
        iter++;
    }
    return false;
}
//------------------------------------------------------------
DataReflectionVisitor::DataReflectionVisitor(TypeRef tHaystack, DataPointer pNeedle, StringRef path)
{
    _tNeedle = tHaystack;
    _pNeedle = pNeedle;
    _pHayStack = null;
    _found = false;
    _path = path;
}
//------------------------------------------------------------
//! Visitor dispatch helper method that traverses all the types in a TypeManager
void DataReflectionVisitor::Accept(TypeManagerRef tm)
{
    TypeRef type = tm->TypeList();
    while (type) {
#if 0
        // helpful section of development
        SubString ss = type->Name();
        if (ss.CompareCStr("VirtualInstrument")) {
            PlatformIO::Print("found\n");
        }
#endif
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
        _path->InsertSubString(0, &rootName);
        if (isTypeRefConstant) {
            _path->InsertCStr(0, ".");
        }
    }
}
//------------------------------------------------------------
//! Visitor dispatch helper method that defines a new/smaller haystack
void DataReflectionVisitor::Accept(TypeRef tHayStack, DataPointer pHayStack)
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
void DataReflectionVisitor::VisitBad(TypeRef type)
{
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitBitBlock(BitBlockType* type)
{
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitBitCluster(BitClusterType* type)
{
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitCluster(ClusterType* type)
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
            SubString ss = elementType->ElementName();
            _path->InsertSubString(0, &ss);
            _path->InsertCStr(0, ".");
            break;
        }
    }
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitParamBlock(ParamBlockType* type)
{
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitEquivalence(EquivalenceType* type)
{
    Accept(type->GetSubElement(0), _pHayStack);
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitArray(ArrayType* type)
{
    if (_pHayStack == null)
        return;

    TypedArrayCoreRef pArray = *(TypedArrayCoreRef*)_pHayStack;
    TypeRef elementType = pArray->ElementType();

    if (type->IsZDA()) {
        // ZDA's have one element.
        Accept(elementType, pArray->RawBegin());
    }
#if 0
    // still in work
    TypedArrayCoreRef pArray = *(TypedArrayCoreRef*)_pHayStack;
    TypeRef eltType = pArray->ElementType();
    BlockItr itr = pArray->RawItr();

    if (itr.PointerInRange(_pNeedle)) {
        // May be in cluster, still need to drill down
        _found = true;
        return;
    }

    if (!eltType->IsFlat()) {
        IntIndex count = type->SubElementCount();
        for (IntIndex j = 0; j < count; j++) {
            TypeRef elementType = type->GetSubElement(j);
            IntIndex offset = elementType->ElementOffset();
            AQBlock1* pElementData = (AQBlock1*)_pHayStack + offset;
            Accept(elementType, pElementData);
        }
    }
#endif
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitElement(ElementType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitNamed(NamedType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitPointer(PointerType* type)
{
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitEnum(EnumType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitRefNumVal(RefNumValType *type)
{
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitDefaultValue(DefaultValueType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitDefaultPointer(DefaultPointerType* type)
{
}
//------------------------------------------------------------
void DataReflectionVisitor::VisitCustomDataProc(CustomDataProcType* type)
{
    Accept(type->BaseType(), _pHayStack);
}
#endif
}  // namespace Vireo

