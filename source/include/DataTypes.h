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
        void VireoAssert_Hidden(Boolean test, const char* file, int line);
    #else
        #define VIREO_ASSERT( _TEST_ ) VireoAssert_Hidden( _TEST_, #_TEST_, __FILE__, __LINE__ );
        void VireoAssert_Hidden(Boolean test, const char* message, const char* file, int line);
    #endif
#else
    #define VIREO_ASSERT( _TEST_ )
#endif

//------------------------------------------------------------
//! A wrapper that gives a raw block of elements a Begin(), End(), and Length() method.
template <class T>
class SimpleSubVector
{
protected:
    const T*  _begin;
    const T*  _end;
public:
    //! Construct a wrapper from an existing wrapper.
    SimpleSubVector()
    {
        _begin = _end = null;
    }
    
    //! Construct a wrapper for a raw block of elements.
    SimpleSubVector(const T* begin, const T* end)
    {
        assign(begin, end);
    }
    
    //! Reassign the wrapper.
    void AliasAssign(SimpleSubVector *subVector)
    {
        if (subVector) {
            _begin = subVector->Begin();
            _end = subVector->End();
        } else {
            _begin = null;
            _end = null;
        }
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
    bool Compare(const SimpleSubVector *subVector)
    {
        return Compare(subVector->Begin(), subVector->Length());
    }
};

//------------------------------------------------------------
//! A wrapper for an aray of UInt8s (.e.g bytes). It does not own the data.
class SubBinaryBuffer :  public SimpleSubVector<UInt8>
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
    //! Read the iterators next pointer
    T* ReadP()          { return _current++; }
    //! Read the iterators next value
    T Read()            { return *_current++;  }
    Boolean InRange()   { return _current < _end; }
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
};
//------------------------------------------------------------
typedef Itr<IntIndex>   IntIndexItr;

//------------------------------------------------------------
//! A Fixed C array that has and API that looks a bit like Vireo arrays
template <class T, size_t COUNT>
class FixedCArray
{
protected:
    // The buffer has a an extra element for cases where the C array
    // contains a null element at the end.
    T    _buffer[COUNT+1];
    T*   _end;
    
public:
    FixedCArray(SimpleSubVector<T>* string)
    {
        size_t length = (string->Length() < COUNT) ? string->Length() : COUNT;
        _end = _buffer + length;
        memcpy(_buffer, string->Begin(), length);
        *_end = (T) 0;
    }
    FixedCArray(T* begin, IntIndex length)
    {
        if (length >= COUNT)
            length = COUNT;
        _end = _buffer + length;
        memcpy(_buffer, begin, length);
        *_end = (T) 0;
    }
    T* End()            { return _end; }
    T* Begin()          { return _buffer; }
    IntIndex Length()   { return _end - _buffer; }
    IntIndex Capacity() { return COUNT - 1; }
    Boolean Append(T element)
    {
        Int32 i = Length();
        if (i < COUNT) {
            _buffer[i] = element;
            _end++;
            *_end = (T) 0;
            return true;
        } else {
            return true;
        }
    }
    Boolean Append(const T* begin, size_t length)
    {
        T* newEnd = _end + length;
        if (newEnd > _buffer + Capacity()) {
            return false;
        }
        length = newEnd - _end;
        memcpy(_end, begin, length);
        _end = newEnd;
        *_end = (T) 0;
        return true;
    }
};
    
}
#endif // DataTypes_h
