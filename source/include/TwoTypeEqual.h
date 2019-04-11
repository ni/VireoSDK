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
        Boolean _areEqual = true;

    public:
        TwoTypeEqual();
        Boolean Apply(TypeRef typeRefA, TypeRef typeRefB) override;
        Boolean AreEqual() { return _areEqual; }
    };

}  // namespace Vireo

#endif

