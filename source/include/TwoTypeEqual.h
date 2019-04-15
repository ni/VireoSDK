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
 public:
    TwoTypeEqual();
    bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY) override;
    bool Apply(StringRef stringRefX, StringRef stringRefY) override;
    bool Apply(Timestamp* timestampX, Timestamp* timestampY) override;
    bool Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY) override;
    bool Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY) override;
    bool BooleanCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
    bool UIntCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
    bool S2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
    bool IEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
 private:
    bool TypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY);
    bool ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    bool ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    bool ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    bool ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
};
}  // namespace Vireo

#endif
