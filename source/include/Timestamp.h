/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Tools to working with relative, absolute and tic-count times.
 */

#ifndef Timestamp_h
#define Timestamp_h

#include "DataTypes.h"

namespace Vireo {
//------------------------------------------------------------
#if defined (__ARDUINO__)
	typedef UInt32 PlatformTickType;
#elif kVireoOS_emscripten
	typedef Int64 PlatformTickType;
//  typedef Double PlatformTickType; (slightly more native for JavaScript/emscripten)
#else
	typedef Int64 PlatformTickType;
#endif

//------------------------------------------------------------
//! Suport for the higest resolution timer available on the target platfrom
class PlatformTime
{
public:
	static PlatformTickType TickCount();
    static PlatformTickType MicrosecondsToTickCount(Int64 microseconds);
    static PlatformTickType SecondsToTickCount(Double seconds);
    static Int64 TickCountToMilliseconds(PlatformTickType);
    static Int64 TickCountToMicroseconds(PlatformTickType);
    static PlatformTickType MillisecondsFromNowToTickCount(Int64 milliseconds);
    static PlatformTickType MicrosecondsFromNowToTickCount(Int64 microseconds);
};

//------------------------------------------------------------
//! A 64.64 bit fixed point use to represent seconds since Jan 1, 1904 GMT
class Timestamp
{
 private:
    Int64 _integer;
    UInt64 _fraction;
    
 public:
    Timestamp()
        { _integer = 0; _fraction = 0;}
    Timestamp(Int64 integer, UInt64 fraction)
        { _integer = integer; _fraction = fraction;}
    Timestamp(Double seconds);

    Int64 Integer() const { return _integer; };
    UInt64 Fraction() const { return _fraction; };
        
    //! Add two timestamps, one operand should be relative.
    Timestamp const operator+(const Timestamp & value);
    
    //! Add interger number of seconds to a timestamp.
    Timestamp const operator+(const Int64 & value);

    //! Subtract two timestamps, result is a relative value.
    Timestamp const operator-(const Timestamp & value);
    Boolean operator==(const Timestamp & value) const
    {
        return ((_integer == value._integer) && (_fraction == value._fraction));
    }
    Boolean operator>(const Timestamp & value) const
    {
        return ((_integer > value._integer) || ((_integer == value._integer) && (_fraction > value._fraction)));
    }
    Boolean operator<(const Timestamp & value) const
    {
        return ((_integer < value._integer) || ((_integer == value._integer) && (_fraction < value._fraction)));
    }
    Boolean operator>=(const Timestamp & value) const
    {
        return (*this > value) || (value == *this);
    }
    Boolean operator<=(const Timestamp & value) const
    {
        return (*this < value) || (value == *this);
    }
    Double ToDouble (void) const;
};

}  // namespace Vireo
#endif // Timestamp_h
