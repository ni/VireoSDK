// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
    virtual bool ShouldInflateDestination() const = 0;
    virtual bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY) const = 0;
    virtual bool Apply(StringRef stringRefX, StringRef stringRefY) const = 0;
    virtual bool Apply(Timestamp* timestampX, Timestamp* timestampY) const = 0;
    virtual bool Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY) const = 0;
    virtual bool Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY) const = 0;
    virtual bool AreBooleanCompatible(TypeRef typeRefX, TypeRef typeRefY) const = 0;
    virtual bool AreUIntCompatible(TypeRef typeRefX, TypeRef typeRefY) const = 0;
    virtual bool AreS2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY) const = 0;
    virtual bool AreIEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY) const = 0;
    virtual bool AreIntrinsicClustersCompatible(TypeRef typeRefX, TypeRef typeRefY) const = 0;
 protected:
    static bool DoTypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY);
};
}  // namespace Vireo

#endif
