// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Core types (Int32,...) and ifdefs to work around a few platform collisions.
 */

#ifndef DataTypes_h
#define DataTypes_h

#include <stddef.h>
#include <string.h>     // memcpy()

#include "BuildConfig.h"

typedef bool Boolean;

#define __STDC_LIMIT_MACROS
#include <stdint.h>

//! Basic integer types.
typedef int8_t          Int8;
typedef uint8_t         UInt8, Utf8Char, *Utf8Ptr;
typedef int16_t         Int16;
typedef uint16_t        UInt16, Utf16Char;
typedef int32_t         Int32;
typedef uint32_t        UInt32;
typedef int64_t         Int64;
typedef uint64_t        UInt64;

//! Largest int type supported by the compiler (C++11).
typedef intmax_t        IntMax;
typedef uintmax_t       UIntMax;

//! Floating point types.
typedef float           Single;
typedef double          Double;

//! Unicode code point encoded in Uft32.
typedef Int32          Utf32Char;

//! Pointer to generic data.
typedef void*          DataPointer;

//! Pointer to native executable code.
typedef void*          CodePointer;

//! Pointer to read only nullptr terminated strings
typedef const char*    ConstCStr;

//! Structure that should have the largest required alignment.
typedef union {
    // Looks like some of the recent C++ specs supply a type
    // like this (aligned_storage) but its too early to rely
    // on that being available. Oddest case seen so far was
    // javascript via emscripten; pointer were 4 bytes, but alignment
    // was 8 due to doubles.
    IntMax  _align_IntMax;
    Double  _align_Double;
    void*   _align_Pointer;
} MaxAlignedType;

#include "Platform.h"

namespace Vireo
{

//------------------------------------------------------------
//! Types used for array indexes and dimensions
typedef Int32        IntIndex;
typedef Int32        IntDim;
enum {
    // IntDim encoded as "*"
    kArrayVariableLengthSentinel = INT32_MIN,

    // IntDim encoded as template parameters $0 .. $255
    kArrayMaxTemplatedDimLengths = 256,

    kArrayFirstTemplatedDimLength = kArrayVariableLengthSentinel + kArrayMaxTemplatedDimLengths,
    kArrayIndexMax = INT32_MAX,
    kArrayMaxRank = 32,
    };


typedef IntIndex  ArrayDimensionVector[kArrayMaxRank];

//! Template dimensions are the encodings for $0.. $n
inline Boolean IsTemplateDim(IntIndex dim)
{
    return (dim > kArrayVariableLengthSentinel) && (dim <= kArrayFirstTemplatedDimLength);
}

//! Variable dimension is the encodings for *. Templates params also count as variable.
inline Boolean IsVariableLengthDim(IntIndex dim)
{
    return dim <= kArrayFirstTemplatedDimLength;
}
//! Decode a template parameter index.
inline IntIndex TemplateDimIndex(IntIndex dim)
{
    if (IsTemplateDim(dim)) {
        return dim - kArrayVariableLengthSentinel - 1;
    } else {
        return 0;
    }
}


//------------------------------------------------------------
// Keep in sync with niErrorEnum in module_eggShell.js
typedef enum {
    kNIError_Success = 0,
    kNIError_kInsufficientResources = 1,  // Typically memory
    kNIError_kResourceNotFound = 2,
    kNIError_kArrayRankMismatch = 3,      // Array's rank do not fit function requirements
                                          //  (typically they must be the same)
    kNIError_kCantDecode = 4,             // Data in stream does not fit grammar
    kNIError_kCantEncode = 5,             // Data type not supported by encoder
    kNIError_kLogicFailure = 6,
    kNIError_kValueTruncated = 7,
} NIError;

typedef enum {
    kLVError_NoError = 0,
    kLVError_ArgError = 1,
    kLVError_MemFull = 2,
    kLVError_NotSupported = 53,  // Not supported on this platform
    kUnspecifiedError = -2147467259,
} LVError;

typedef enum {
    kLVError_JSONOutOfRange = -375012,
    kLVError_JSONBadInf = -375011,
    kLVError_JSONBadNaN = -375010,
    kLVError_JSONInvalidArray = -375009,
    kLVError_JSONInvalidArrayDims = -375008,
    kLVError_JSONStrictFieldNotFound = -375007,
    kLVError_JSONClusterElemNotFound = -375006,
    kLVError_JSONTypeMismatch = -375005,
    kLVError_JSONInvalidPath = -375004,
    kLVError_JSONInvalidString = -375003,
    // The rest are semantic analysis errors so can never be seen in LV-generated code:
    // TODO(spathiwa): Implement for benefit of hand-written Vireo
    kLVError_JSONInvalidElementNameError = -375002,
    kLVError_JSONInvalidRootContainerError = -375001,
    kLVError_JSONUnsupportedTypeError = -375000
} JSONLVError;

// Types used for structs and pointers when the semantics of the underlying bits may vary
typedef UInt8   AQBlock1;
typedef Int16   AQBlock2;
typedef Int32   AQBlock4;
typedef Int64   AQBlock8;

//------------------------------------------------------------
#ifdef VIREO_USING_ASSERTS
    #ifdef VIREO_MICRO
        #define VIREO_ASSERT( _TEST_ ) if (!(_TEST_)) VireoAssert_Hidden( _TEST_, __FILE__, __LINE__ ); else;
        void VireoAssert_Hidden(Boolean test, ConstCStr file, int line);
    #else
        #define VIREO_ASSERT( _TEST_ ) if (!(_TEST_)) VireoAssert_Hidden( _TEST_, #_TEST_, __FILE__, __LINE__ ); else;
        void VireoAssert_Hidden(Boolean test, ConstCStr message, ConstCStr file, int line);
    #endif
#else
    #define VIREO_ASSERT(_TEST_)
#endif

//------------------------------------------------------------
//! A wrapper that gives a raw block of elements a Begin(), End(), and Length() method. It does not own the data.
template <class T>
class SubVector
{
 protected:
    const T*  _begin;
    const T*  _end;
 public:
    //! Construct a wrapper from an existing wrapper.
    SubVector() {
        _begin = _end = nullptr;
    }
    //! Construct a wrapper for a raw block of elements.
    SubVector(const T* begin, const T* end) {
        _begin = begin;
        _end = end;
    }
    //! Reassign the wrapper.
    void AliasAssign(SubVector *subVector) {
        _begin = subVector->Begin();
        _end = subVector->End();
    }

    //! Reassign the wrapper to a new raw block of elements.
    void AliasAssign(const T* begin, const T* end) {
        _begin = begin;
        _end = end;
    }

    //! Construct a wrapper for a raw block of elements.
    IntIndex CopyToBoundedBuffer(IntIndex bufferLength, T* destinationBuffer) {
        bufferLength--;  // Make room for nullptr
        IntIndex length = Length();
        if (bufferLength < length) {
            length = bufferLength;
        }
        memcpy(destinationBuffer, Begin(), length * sizeof(T));
        destinationBuffer[length] = (T)0;
        return length;
    }

    //! Return a pointer to the first element in the vector
    const T*  Begin() const  { return _begin; }

    //! Returns a pointer just past the last element in the vector.
    const T*  End()   const  { return _end; }

    //! Returns the length of the vector.
    IntIndex Length()  const   { return (IntIndex)(_end - _begin); }

    //! Return true if the blocks are equivalent.
    Boolean Compare(const T* begin2, IntIndex length2) {
        return (length2 == Length() && (memcmp(_begin, begin2, Length()) == 0));
    }

    //! Return true if the blocks are equivalent.
    Boolean Compare(const SubVector *subVector) {
        return Compare(subVector->Begin(), subVector->Length());
    }
};

//------------------------------------------------------------
//! A wrapper for an array of UInt8s (.e.g bytes). It does not own the data.
class SubBinaryBuffer :  public SubVector<UInt8>  // Binary or byte buffer
{
 public:
    SubBinaryBuffer()   { }
    SubBinaryBuffer(const Utf8Char * begin, const Utf8Char *end) { AliasAssign(begin, end); }
};
//------------------------------------------------------------
//! A light weight iterator for sequential reads of statically type values
template <class T>
class Itr {
 protected:
    T*   _current;
    T*   _end;
 public:
    Itr(T* begin, T* end) {_current = begin; _end = end;}
    Itr(T* begin, IntIndex length) {_current = begin; _end = begin + length;}
    //! Read the iterator's next pointer
    T* ReadP()          { return _current++; }
    //! Read the iterator's next value
    T Read()            { return *_current++;  }
    Boolean HasNext()   { return _current < _end; }
    Boolean PointerInRange(void* p) { return p >= _current && p < _end; }
};
//------------------------------------------------------------
//! A light weight iterator for sequential reads of runtime typed values
class BlockItr : public Itr<AQBlock1>
{
    IntIndex _blockLength;
 public:
    //! Construct an iterator for an array of blocks
    BlockItr(void* begin, IntIndex blockLength, IntIndex count)
    : Itr((AQBlock1*)begin, (AQBlock1*)begin + (blockLength * count)) {
        _blockLength = blockLength;
    }
    //! Read the iterators next pointer
    AQBlock1* ReadP() {
        AQBlock1* p = _current;
        _current += _blockLength;
        return p;
    }
};
//------------------------------------------------------------
typedef Itr<IntIndex>   IntIndexItr;

//------------------------------------------------------------
//! A fixed stack based C array that has and API that looks a bit like Vireo arrays
template <class T, IntIndex COUNT>
class FixedCArray : public SubVector<T>
{
 protected:
    // The buffer has a an extra element for cases where the C array
    // contains a nullptr element at the end.
    T    _buffer[COUNT+1];
    // Since this class owns the buffer and it knows what is going on,
    // in certain cases it is OK to write and the end pointer.
    T*   NonConstEnd() { return const_cast<T*>(this->_end); }
 public:
    //! Construct the array and initialize it as empty.
    void Clear() {
        this->_begin = _buffer;
        this->_end = _buffer;
        *NonConstEnd() = (T) 0;
    }

    FixedCArray() {
        Clear();
    }

    //! Construct the array and initialize it from a SubVector.
    explicit FixedCArray(SubVector<T>* buffer) {
        this->_begin = _buffer;
        size_t length = (buffer->Length() < COUNT) ? buffer->Length() : COUNT;
        this->_end = _buffer + length;
        memcpy(_buffer, buffer->Begin(), length);
        *NonConstEnd() = (T) 0;
    }

    //! Construct the array and initialize it from a block of data.
    FixedCArray(T* begin, IntIndex length) {
        this->_begin = _buffer;
        if (length >= COUNT)
            length = COUNT;
        this->_end = _buffer + length;
        memcpy(_buffer, begin, length);
        *NonConstEnd() = (T) 0;
    }

    //! Return the maximum capacity of the array.
    static IntIndex Capacity() { return COUNT - 1; }

    //! Return a reference to the indexed element in the vector (no range checking).
    const T&  operator[] (const int i)  { return _buffer[i]; }

    //! Append an element to the array if there is room.
    Boolean Append(T element) {
        IntIndex i = this->Length();
        if (i < COUNT) {
            _buffer[i] = element;
            this->_end++;
            _buffer[this->Length()] = (T) 0;
            return true;
        } else {
            return false;
        }
    }

    //! Append a block of elements to the array if there is room.
    Boolean Append(const T* begin, size_t length) {
        if (IntIndex(length + this->Length()) > Capacity()) {
            return false;
        }
        memcpy(NonConstEnd(), begin, length);
        this->_end += length;
        *NonConstEnd() = (T) 0;
        return true;
    }
};

//------------------------------------------------------------
//! A fixed heap based C array, that has and API that looks a bit like Vireo arrays
template <class T>
class FixedHeapCArray : public SubVector<T>
{
 protected:
    // The buffer has a an extra element for cases where the C array
    // contains a nullptr element at the end.
    T*    _buffer = nullptr;
    // Since this class owns the buffer and it knows what is going on,
    // in certain cases it is OK to write the end pointer.
    T*   NonConstEnd() { return const_cast<T*>(this->_end); }
 private:
    IntIndex _capacity;

    void AllocateBuffer(IntIndex capacity)
    {
        _capacity = capacity;
        _buffer = static_cast<T*>(gPlatform.Mem.Malloc(sizeof(T)*(Capacity() + 1)));
    }
 public:
    //! Construct the array and initialize it as empty.
    void Clear() {
        this->_begin = _buffer;
        this->_end = _buffer;
        *NonConstEnd() = (T)0;
    }

    FixedHeapCArray() = delete;

    explicit FixedHeapCArray(IntIndex capacity) {
        AllocateBuffer(capacity);
        Clear();
    }

    ~FixedHeapCArray() {
        gPlatform.Mem.Free(_buffer);
    }

    //! Construct the array and initialize it from a SubVector.
    FixedHeapCArray(SubVector<T>* buffer, IntIndex capacity) {
        AllocateBuffer(capacity);
        this->_begin = _buffer;
        size_t length = (buffer->Length() <= Capacity()) ? buffer->Length() : Capacity();
        this->_end = _buffer + length;
        memcpy(_buffer, buffer->Begin(), length);
        *NonConstEnd() = (T)0;
    }

    //! Construct the array and initialize it from a block of data.
    FixedHeapCArray(T* begin, IntIndex length, IntIndex capacity) {
        AllocateBuffer(capacity);
        this->_begin = _buffer;
        if (length >= Capacity())
            length = Capacity();
        this->_end = _buffer + length;
        memcpy(_buffer, begin, length);
        *NonConstEnd() = (T)0;
    }

    //! Return the maximum capacity of the array.
    IntIndex Capacity() { return _capacity; }

    //! Return a reference to the indexed element in the vector (no range checking).
    const T&  operator[] (const int i) { return _buffer[i]; }

    //! Append an element to the array if there is room.
    Boolean Append(T element) {
        IntIndex length = this->Length();
        if (length <= Capacity()) {
            _buffer[length] = element;
            this->_end++;
            *NonConstEnd() = (T)0;
            return true;
        } else {
            return false;
        }
    }

    //! Append a block of elements to the array if there is room.
    Boolean Append(const T* begin, size_t length) {
        if (IntIndex(length + this->Length()) > Capacity()) {
            return false;
        }
        memcpy(NonConstEnd(), begin, length);
        this->_end += length;
        *NonConstEnd() = (T)0;
        return true;
    }
};

}  // namespace Vireo
#endif  // DataTypes_h
