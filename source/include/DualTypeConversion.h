/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

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
    static bool ApplyBooleans(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool ApplyUInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool ApplyS2CInts(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool ApplyIEEE754Binaries(TypeRef typeRefX, void* pDataX, TypeRef typeRefY, void* pDataY);
    static bool DoTypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY);
    static bool TypesAreCompatible(TypeRef typeRefX, TypeRef typeRefY);
};
}  // namespace Vireo

#endif
