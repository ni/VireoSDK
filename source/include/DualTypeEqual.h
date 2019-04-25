/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Compares two types to have the same structure and the same values
*/

#ifndef DualTypeEqual_h
#define DualTypeEqual_h

#include "TypeDefiner.h"
#include "DualTypeOperation.h"

namespace Vireo {
class DualTypeEqual : public DualTypeOperation {
 public:
    DualTypeEqual();
    bool ShouldInflateDestination() override;
    bool Apply(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY) override;
    bool Apply(StringRef stringRefX, StringRef stringRefY) override;
    bool Apply(Timestamp* timestampX, Timestamp* timestampY) override;
    bool Apply(std::complex<Single>* complexSingleX, std::complex<Single>* complexSingleY) override;
    bool Apply(std::complex<Double>* complexDoubleX, std::complex<Double>* complexDoubleY) override;
    bool AreBooleanCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
    bool AreUIntCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
    bool AreS2CIntCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
    bool AreIEEE754BinaryCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
    bool AreIntrinsicClustersCompatible(TypeRef typeRefX, TypeRef typeRefY) override;
 private:
     static bool DoTypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY);
     static bool ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
     static bool ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
     static bool ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
     static bool ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
};
}  // namespace Vireo

#endif
