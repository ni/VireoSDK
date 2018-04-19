/**

Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
 */

#include "TypeAndDataManager.h"
#include "DataReflectionVisitor.h"

namespace Vireo
{

//------------------------------------------------------------
/* Inherits searching behavior from DataReflectionVisitor to build
* a path for the specified needle and haystack. Path format does
* not include the VI name nor "Locals" section.
*/

class PathFinderVisitor : public DataReflectionVisitor
{
 public:
    PathFinderVisitor(TypeRef tNeedle, DataPointer pHaystack, StringRef path);
    void Accept(TypeManagerRef tm);

 private:
    // Used as frames are unwound
    Boolean         _pathEmpty;

 private:
    virtual void VisitCluster(ClusterType* type);
};
//------------------------------------------------------------
void TypeManager::GetPathFromPointer(TypeRef tNeedle, DataPointer pNeedle, StringRef path)
{
    path->Resize1D(0);
    PathFinderVisitor pfv(tNeedle, pNeedle, path);
    for (TypeManager *tm = this; tm && !pfv.Found(); tm = tm->BaseTypeManager()) {
        pfv.Accept(tm);
    }

    if (!pfv.Found()) {
        path->AppendCStr("*pointer-not-found*");
    }
}
//------------------------------------------------------------
PathFinderVisitor::PathFinderVisitor(TypeRef tHaystack, DataPointer pNeedle, StringRef path) :
    DataReflectionVisitor(tHaystack, pNeedle, path)
{
    _pathEmpty = true;
}
//------------------------------------------------------------
//! Visitor dispatch helper method that traverses all the types in a TypeManager
void PathFinderVisitor::Accept(TypeManagerRef tm)
{
    TypeRef type = tm->TypeList();
    while (type) {
        DataReflectionVisitor::Accept(type, type->Begin(kPASoftRead));
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
            _path->InsertSubString(0, &rootName);
        }
    }
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
        DataReflectionVisitor::Accept(elementType, pElementData);
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

}  // namespace Vireo

