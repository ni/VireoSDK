// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 */

#include "TypeAndDataManager.h"
#include "DataReflectionVisitor.h"

namespace Vireo
{
#if defined (VIREO_INSTRUCTION_REFLECTION)
//------------------------------------------------------------
TypeRef TypeManager::PointerToSymbolPath(TypeRef tNeedle, DataPointer pNeedle, StringRef path, Boolean *foundInVI)
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

    if (foundInVI) {
       *foundInVI = drv.FoundInVI();
    }

    return nullptr;
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
    _pHayStack = nullptr;
    _found = false;
    _foundInVI = false;
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
        if (type->IsA("VirtualInstrument")) {
            PercentEncodedSubString encStr(rootName, true, false);
            SubString encSubStr = encStr.GetSubString();
            _path->InsertSubString(0, &encSubStr);
            _foundInVI = true;
        } else {
            _path->InsertSubString(0, &rootName);
        }
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
void DataReflectionVisitor::VisitCluster(ClusterType* type)
{
    if (_pHayStack == nullptr)
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
void DataReflectionVisitor::VisitArray(ArrayType* type)
{
    if (_pHayStack == nullptr)
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
#endif
}  // namespace Vireo
