/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Compares two types to have the same structure and the same values
*/

#ifndef TwoTypeEqual_h
#define TwoTypeEqual_h

#include "TypeDefiner.h"
#include "TwoTypeOperation.h"

namespace Vireo {

class TwoTypeEqual : public TwoTypeOperation {
 private:
    bool _areEqual = true;

 public:
    TwoTypeEqual();
    bool Apply(TypeRef typeRefA, TypeRef typeRefB) override;
    bool AreEqual() { return _areEqual; }

 private:
    bool CompareBooleans(TypeRef typeRefA, TypeRef typeRefB);
    bool CompareUInts(TypeRef typeRefA, TypeRef typeRefB);
    bool CompareS2CInts(TypeRef typeRefA, TypeRef typeRefB);
    bool CompareIEEE754Binaries(TypeRef typeRefA, TypeRef typeRefB);
    bool CompareClusters(TypeRef typeRefA, TypeRef typeRefB);
    bool CompareArrays(TypeRef typeRefA, TypeRef typeRefB);
};

}  // namespace Vireo

#endif

