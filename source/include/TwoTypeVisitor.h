/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Two type visitor mostly for variant support
*/

#ifndef TwoTypeVisitor_h
#define TwoTypeVisitor_h

#include "TypeDefiner.h"
#include "TwoTypeVisitor.h"
#include "TwoTypeOperation.h"

namespace Vireo {

//! This class manages the traversal of two similar types as long as they share the same structure
//! Applies the TwoTypeOperation and continues visiting if the operation allows the visitor to continue
class TwoTypeVisitor {
 public:
    TwoTypeVisitor() = default;

    bool Visit(TypeRef typeRefA, TypeRef typeRefB, TwoTypeOperation* operation);
};

}  // namespace Vireo

#endif

