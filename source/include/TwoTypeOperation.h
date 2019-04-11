/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Two type operation mostly for variant support
*/

#ifndef TwoTypeOperation_h
#define TwoTypeOperation_h

#include "TypeDefiner.h"

namespace Vireo {

class TwoTypeOperation {
 public:
    TwoTypeOperation() = default;

    //! Check if the types are compatible and applies an operation if they are
    //! Return true if the operation was successful
    virtual Boolean Apply(TypeRef typeRefA, TypeRef typeRefB) = 0;
};

}  // namespace Vireo

#endif

