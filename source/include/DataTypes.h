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

// For places where the Vireo kenel function hold used data
// these types can be used.
typedef Int64               IntMax;
typedef UInt64              UIntMax;

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
typedef Int32 IntSmall;

//------------------------------------------------------------
//! Type used for indexing arrays.
typedef VIREO_ARRAY_INDEX_TYPE        IntIndex;
    
enum { kVariableSizeSentinel = VIREO_ARRAY_VARIABLE_SENTINEL };

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
    #define VIREO_ASSERT( _TEST_ ) VireoAssert_Hidden( _TEST_, #_TEST_, __FILE__, __LINE__ );
    void VireoAssert_Hidden(Boolean test, const char* message, const char* file, int line);
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

}

#endif // DataTypes_h
