// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Visitor that tries to find the path of a given DataPointer and TypeRef
*/

#ifndef DataReflectionVisitor_H
#define DataReflectionVisitor_H

#include "TypeAndDataManager.h"

namespace Vireo
{
#if defined (VIREO_INSTRUCTION_REFLECTION)
//------------------------------------------------------------
/* Create a visitor with a needle being looked for and a TypeRef
* that describes what the needle is a pointer to. The visitor will visit
* all types in the type manager and thus ultimate all values owned by that type manager
* and if necessary parent type managers as well.
* initially the hay stack is nullptr, but when a type is visited that owns a value ( constant or var)
* it will establish a haystack then as the type is visited the stack is narrowed.
*/
class DataReflectionVisitor : public TypeVisitor
{
 public:
    DataReflectionVisitor(TypeRef tHaystack, DataPointer pNeedle, StringRef path);
    void Accept(TypeRef tHayStack, DataPointer pHayStack);
    void Accept(TypeManagerRef tm);
    Boolean Found() const { return _found; }
    Boolean FoundInVI() const { return _foundInVI; }

 private:
    // What is being searched through
    void*           _pHayStack;

    // What is being looked for
    TypeRef         _tNeedle;
    void*           _pNeedle;

    // Used as frames are unwound
    Boolean         _found;
    Boolean         _foundInVI;
    StringRef       _path;

 private:
    void VisitBad(TypeRef type) override { }
    void VisitBitBlock(BitBlockType* type) override { }
    void VisitBitCluster(BitClusterType* type) override { }
    void VisitCluster(ClusterType* type) override;
    void VisitParamBlock(ParamBlockType* type) override { }
    void VisitEquivalence(EquivalenceType* type) override { Accept(type->GetSubElement(0), _pHayStack); }
    void VisitArray(ArrayType* type) override;
    void VisitElement(ElementType* type) override { Accept(type->BaseType(), _pHayStack); }
    void VisitNamed(NamedType* type) override { Accept(type->BaseType(), _pHayStack); }
    void VisitPointer(PointerType* type) override { }
    void VisitEnum(EnumType* type) override { Accept(type->BaseType(), _pHayStack); }
    void VisitRefNumVal(RefNumValType* type) override { }
    void VisitDefaultValue(DefaultValueType* type) override { Accept(type->BaseType(), _pHayStack); }
    void VisitDefaultPointer(DefaultPointerType* type) override { }
    void VisitCustomDataProc(CustomDataProcType* type) override { Accept(type->BaseType(), _pHayStack); }
};
#endif
}  // namespace Vireo

#endif  // /* DataReflectionVisitor_H */
