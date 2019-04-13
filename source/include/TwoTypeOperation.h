/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Base class for operations on two types for variant support
*/

#ifndef TwoTypeOperation_h
#define TwoTypeOperation_h

#include "TypeDefiner.h"

namespace Vireo {
class TwoTypeOperation {
 public:
    TwoTypeOperation() = default;

    virtual bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY) = 0;
    virtual bool Apply(StringRef stringRefX, StringRef stringRefY) = 0;
    virtual bool BooleanCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
    virtual bool UIntCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
    virtual bool S2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
    virtual bool IEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
};
}  // namespace Vireo

#endif
