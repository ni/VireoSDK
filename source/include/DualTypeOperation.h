/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Base class for operations on two types for variant support
*/

#ifndef DualTypeOperation_h
#define DualTypeOperation_h

#include "TypeDefiner.h"
#include "Timestamp.h"
#include <complex>

namespace Vireo {
class DualTypeOperation {
 public:
    DualTypeOperation() = default;

    virtual bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY) = 0;
    virtual bool Apply(StringRef stringRefX, StringRef stringRefY) = 0;
    virtual bool Apply(Timestamp* timestampX, Timestamp* timestampY) = 0;
    virtual bool Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY) = 0;
    virtual bool Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY) = 0;
    virtual bool AreBooleanCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
    virtual bool AreUIntCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
    virtual bool AreS2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
    virtual bool AreIEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY) = 0;
};
}  // namespace Vireo

#endif
