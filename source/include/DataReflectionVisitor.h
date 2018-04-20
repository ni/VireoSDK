
/**

Copyright (c) 2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
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
* initially the hay stack is null, but when a type is visited that owns a value ( constant or var)
* it will establish a haystack then as the type is visited the stack is narrowed.
*/

class DataReflectionVisitor : public TypeVisitor
{
 public:
    DataReflectionVisitor(TypeRef tNeedle, DataPointer pHaystack, StringRef path);
    void Accept(TypeRef tHaystack, DataPointer pHaystack);
    void Accept(TypeManagerRef tm);
    Boolean Found() { return _found; }

 protected:
    // What is being searched through
    void*           _pHayStack;

    // What is being looked for
    TypeRef         _tNeedle;
    void*           _pNeedle;

    // Used as frames are unwound
    Boolean         _found;
    StringRef       _path;

 private:
    virtual void VisitBad(TypeRef type)                         { }
    virtual void VisitBitBlock(BitBlockType* type)              { }
    virtual void VisitBitCluster(BitClusterType* type)          { }
    virtual void VisitCluster(ClusterType* type);
    virtual void VisitParamBlock(ParamBlockType* type)          { }
    virtual void VisitEquivalence(EquivalenceType* type)        { Accept(type->GetSubElement(0), _pHayStack); }
    virtual void VisitArray(ArrayType* type);
    virtual void VisitElement(ElementType* type)                { Accept(type->BaseType(), _pHayStack); }
    virtual void VisitNamed(NamedType* type)                    { Accept(type->BaseType(), _pHayStack); }
    virtual void VisitPointer(PointerType* type)                { }
    virtual void VisitEnum(EnumType* type)                      { Accept(type->BaseType(), _pHayStack); }
    virtual void VisitRefNumVal(RefNumValType* type)            { }
    virtual void VisitDefaultValue(DefaultValueType* type)      { Accept(type->BaseType(), _pHayStack); }
    virtual void VisitDefaultPointer(DefaultPointerType* type)  { }
    virtual void VisitCustomDataProc(CustomDataProcType* type)  { Accept(type->BaseType(), _pHayStack); }
};
#endif
}  // namespace Vireo

#endif  // /* DataReflectionVisitor_H */
