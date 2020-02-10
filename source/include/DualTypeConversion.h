// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
\brief Compares if two types have the same structure and does conversion for numeric values
*/

#ifndef DualTypeConversion_h
#define DualTypeConversion_h

#include "TypeDefiner.h"
#include "DualTypeOperation.h"

namespace Vireo {

class DualTypeConversion : public DualTypeOperation {
 public:
    DualTypeConversion();

    bool ShouldInflateDestination() const override;
    bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY) const override;
    bool Apply(StringRef stringRefX, StringRef stringRefY) const override;
    bool Apply(Timestamp* timestampX, Timestamp* timestampY) const override;
    bool Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY) const override;
    bool Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY) const override;
    bool AreBooleanCompatible(TypeRef typeRefX, TypeRef typeRefY) const override;
    bool AreUIntCompatible(TypeRef typeRefX, TypeRef typeRefY) const override;
    bool AreS2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY) const override;
    bool AreIEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY) const override;
    bool AreIntrinsicClustersCompatible(TypeRef typeRefX, TypeRef typeRefY) const override;

 private:
    static bool ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool TypesAreCompatible(TypeRef typeRefX, TypeRef typeRefY);
};
}  // namespace Vireo

#endif
