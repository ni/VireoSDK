/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Core types (Int32,...) and ifdefs to work around a few platfrom collisions.
 */

#ifndef DataTypes_h
#define DataTypes_h

#include <stddef.h>
#include <string.h>     // memcpy()

#include "BuildConfig.h"

#if defined (__APPLE__)
typedef char  int8, Int8;
typedef unsigned char Boolean;
#else
typedef signed char int8, Int8;
typedef bool Boolean;
#endif

typedef unsigned char       UInt8, Utf8Char;
typedef short               Int16;
typedef unsigned short      UInt16, Utf16Char;
#if __LP64__
typedef int                 Int32;
typedef unsigned int        UInt32;
#else
typedef int                 Int32;
typedef unsigned int        UInt32;
#endif
typedef long long           Int64;
typedef unsigned long long  UInt64;
typedef float               Single;
typedef double              Double;

typedef Int64               IntMax;
typedef UInt64              UIntMax;

//! Poiner to generic data
typedef void*               DataPointer;
//! Poiner to native executable code
typedef void*               CodePointer;

//! Pointer to read only null terminated string
typedef const char*         ConstCStr;


typedef union {
    // Looks like some of the recent C++ specs supply a type
    // like this (aligned_storage) but its too early to rely
    // on that being available.
    IntMax  _align_IntMax;
    Double  _align_Double;
    void*   _align_Pointer;
} MaxAlignedType;


#define __STDC_LIMIT_MACROS
#include <stdint.h>

namespace Vireo
{

//------------------------------------------------------------
#ifdef __cplusplus
#define null 0
#else
#define null ((void *)0)
#endif


//------------------------------------------------------------
//! Int that can be used for small counts could be In8 for very small targets.
#ifdef VIREO_MICRO
    typedef Int8 IntSmall;
#else
    typedef Int32 IntSmall;
#endif

//------------------------------------------------------------
//! Type used for indexing arrays.
typedef VIREO_ARRAY_INDEX_TYPE        IntIndex;
    
enum { kVariableSizeSentinel = VIREO_ARRAY_VARIABLE_SENTINEL };
enum { kMaximumRank = 15 };
typedef IntIndex  ArrayDimensionVector[kMaximumRank];

//------------------------------------------------------------
typedef enum {
    kNIError_Success = 0,
    kNIError_kInsufficientResources = 1,// Typically memory
    kNIError_kResourceNotFound = 2,
    kNIError_kArrayRankMismatch = 3,    // Arrays ranks do not fir function requirements (typically they must be the same)
    kNIError_kCantDecode = 4,           // Data in stream does not fit grammar
    kNIError_kCantEncode = 5,           // Data type not supported by encoder
    kNIError_kLogicFailure = 6,
    kNIError_ValueTruncated = 7,
} NIError ;

// Types used for structs and pointers when the semantics of the underlying bits may vary
typedef UInt8   AQBlock1;
typedef Int16   AQBlock2;
typedef Int32   AQBlock4;
typedef Int64   AQBlock8;

//------------------------------------------------------------
#ifdef VIREO_USING_ASSERTS
    #ifdef VIREO_MICRO
        #define VIREO_ASSERT( _TEST_ ) VireoAssert_Hidden( _TEST_, __FILE__, __LINE__ );
        void VireoAssert_Hidden(Boolean test, ConstCStr file, int line);
    #else
        #define VIREO_ASSERT( _TEST_ ) VireoAssert_Hidden( _TEST_, #_TEST_, __FILE__, __LINE__ );
        void VireoAssert_Hidden(Boolean test, ConstCStr message, ConstCStr file, int line);
    #endif
#else
    #define VIREO_ASSERT( _TEST_ )
#endif

//------------------------------------------------------------
//! A wrapper that gives a raw block of elements a Begin(), End(), and Length() method.
template <class T>
class SubVector
{
protected:
    const T*  _begin;
    const T*  _end;
public:
    //! Construct a wrapper from an existing wrapper.
    SubVector()
    {
        _begin = _end = null;
    }
    //! Construct a wrapper for a raw block of elements.
    SubVector(const T* begin, const T* end)
    {
        _begin = begin;
        _end = end;
    }
    //! Reassign the wrapper.
    void AliasAssign(SubVector *subVector)
    {
        _begin = subVector->Begin();
        _end = subVector->End();
    }

    //! Reassign the wrapper to a new raw block of elements.
    void AliasAssign(const T* begin, const T* end)
    {
        _begin = begin;
        _end = end;
    }
    
    //! Construct a wrapper for a raw block of elements.
    IntIndex CopyToBoundedBuffer(IntIndex bufferSize, T* buffer)
    {
        IntIndex length = Length();
        if (bufferSize < length)
            length = bufferSize;
        memcpy(buffer, Begin(), length * sizeof(T));
        return length;
    }

    //! Return a pointer to the first element in the vector
    const T*  Begin() const  { return _begin; }

    //! Returns a pointer just past the last element in the vector.
    const T*  End()   const  { return _end; }
    
    //! Returns the lenght of the vector.
    IntIndex Length()  const   { return (IntIndex)(_end - _begin); }
    
    //! Return true if the blocks are equivalent.
    bool Compare(const T* begin2, Int32 length2)
    {
        return (length2 == Length() && (memcmp(_begin, begin2, Length()) == 0));
    }
    
    //! Return true if the blocks are equivalent.
    bool Compare(const SubVector *subVector)
    {
        return Compare(subVector->Begin(), subVector->Length());
    }
};

//------------------------------------------------------------
//! A wrapper for an aray of UInt8s (.e.g bytes). It does not own the data.
class SubBinaryBuffer :  public SubVector<UInt8>
{
public:
    SubBinaryBuffer()   { }
    SubBinaryBuffer(const Utf8Char * begin, const Utf8Char *end) { AliasAssign(begin, end); }
};
//------------------------------------------------------------
//! A light weight iterator for sequential reads of staticly type values
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
};
//------------------------------------------------------------
//! A light weight iterator for sequential reads of runtime typed values
class BlockItr : public Itr<AQBlock1>
{
    IntIndex _blockLength;
public:
    //! Construct an iterator for an array of blocks 
    BlockItr(void* begin, IntIndex blockLength, IntIndex count)
    : Itr((AQBlock1*)begin, (AQBlock1*)begin + (blockLength * count))
    {
        _blockLength = blockLength;
    }
    //! Read the iterators next pointer
    AQBlock1* ReadP()
    {
        AQBlock1* p = _current;
        _current += _blockLength;
        return p;
    }
    Boolean PointerInRange(void* p)
    {
        return p>=_current && p < _end;
    }
};
//------------------------------------------------------------
typedef Itr<IntIndex>   IntIndexItr;

//------------------------------------------------------------
//! A Fixed C array that has and API that looks a bit like Vireo arrays
template <class T, size_t COUNT>
    class FixedCArray : public SubVector<T>
{
protected:
    // The buffer has a an extra element for cases where the C array
    // contains a null element at the end.
    T    _buffer[COUNT+1];
    // Since this class owns the buffer and it know what is going on,
    // in certain cases it is OK to write and the end pointer.
    T*   NonConstEnd() { return const_cast<T*>(this->_end); }
public:

    //! Construct the array and initialize it as empty.
    FixedCArray()
    {
        this->_begin = _buffer;
        this->_end = _buffer;
        *NonConstEnd() = (T) 0;
    }
    
    //! Construct the array and initialize it from a SubVector.
    FixedCArray(SubVector<T>* buffer)
    {
        this->_begin = _buffer;
        size_t length = (buffer->Length() < COUNT) ? buffer->Length() : COUNT;
        this->_end = _buffer + length;
        memcpy(_buffer, buffer->Begin(), length);
        *NonConstEnd() = (T) 0;
    }
    
    //! Construct the array and initialize it from a block of data.
    FixedCArray(T* begin, IntIndex length)
    {
        this->_begin = _buffer;
        if (length >= COUNT)
            length = COUNT;
        this->_end = _buffer + length;
        memcpy(_buffer, begin, length);
        *NonConstEnd() = (T) 0;
    }
    
    //! Return the maximum capacity of the array.
    IntIndex Capacity() { return COUNT - 1; }
    
    //! Return a reference to the indexed element in the vector (no range checking).
    const T&  operator[] (const int i)  { return _buffer[i]; }
    
    //! Append an element to the aray if there is room.
    Boolean Append(T element)
    {
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
    
    //! Append a block of elements to the aray if there is room.
    Boolean Append(const T* begin, size_t length)
    {
        if (length + this->Length() > Capacity()) {
            return false;
        }
        memcpy(NonConstEnd(), begin, length);
        this->_end += length;
        *NonConstEnd() = (T) 0;
        return true;
    }
};
    
}
#endif // DataTypes_h
