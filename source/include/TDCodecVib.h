// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief A Vireo codec for the VIB (VI Binary) binary format.
 */

#ifndef TypeAndDataCodecBin8_h
#define TypeAndDataCodecBin8_h

namespace Vireo
{

//------------------------------------------------------------
class SubVibBuffer : SubBinaryBuffer
{
 public:
    IntMax ReadVBWSInt();
    IntMax ReadVBWUInt();
    NIError Error();
};

//------------------------------------------------------------
class TDVibDecoder
{
 private:
    TypeManagerRef  _typeManager;
    SubBuffer       _buffer;

 public:
    TDVibDecoder(TypeManagerRef typeManager, SubBuffer* buffer);

    TypeRef DecodeType();
    void DecodeData(TypeRef type, void* pData, Int32 rank);
    void DecodeArrayData(TypeRef type, void* pData, Int32 rank);

    void DecodeVirtualInstrument(TypeRef viType, void* pData);
    void DecodeClump(VIClump* clump, Boolean delayedLoad);

    void DelayDecodeClump(VIClump* viClump);
    void DecodeInstructionArguments(VIClump* clump);

 private:
    void MarkError(ConstCStr message);
    TypeRef BadType()   {return _typeManager->BadType();}   // TODO(PaulAustin): could create error that encodes scan point
    NIError ParseAggregateElementList(TypeRef ElementTypes[], Int32* pElementCount);
    TypeRef ParseArray();
    TypeRef ParseBitBlock();
    TypeRef ParseBitCluster();
    TypeRef ParseCluster();
    TypeRef ParseDefaultValue(Boolean mutableValue);
    TypeRef ParseEquivalence();
    TypeRef ParseParamBlock();
    TypeRef ParsePointerType(Boolean shortNotation);
    EncodingEnum ParseEncoding(SubString* str);
};

//------------------------------------------------------------
class TDVibEncoder
{
 private:
    BinaryBufferRef     _buffer;

 public:
    explicit TDVibEncoder(BinaryBufferRef bufferRef);

    void EncodeData();

    void EncodeType(TypeRef type);
    void EncodeClusterType(TypeRef clusterType);
    void EncodeArrayType(TypeRef arrayType);

    // Data formatters
    void EncodeData(TypeRef type, void* pData);
    void EncodeArrayData(TypeRef arrayType, TypedArrayCoreRef pData, Int32 rank);
    void EncodeArrayDataRecurse(TypeRef elementType, Int32 rank, AQBlock1* pBegin,
                                   IntIndex *pDimLengths, IntIndex *pSlabLengths);

    void EncodeClusterData(TypeRef clusterType, void* pData);
    void EncodePointerData(TypeRef pointerType, void* pData);
    void EncodeSInt(Int32 aqSize, void* pData);
    void EncodeUInt(Int32 aqSize, void* pData);
    void EncodeVBWSInt(IntMax value);
    void EncodeVBWUInt(UIntMax value);
    void EncodeIEEE754(EncodingEnum encoding, Int32 aqSize, void* pData);

    // The maximum for a size field arbitrarily large since the format
    // uses a variable-width encoding for all sizes. The reader for different size targets
    // may be hard coded to only support a limits size typically UInt8, UIn16, UInt32, or UInt64.
    // the reader should be able to safely report an error when reading sizes larger than supported
    // on the target.
};

}  // namespace Vireo
#endif  // TypeAndDataCodecBin8_H
