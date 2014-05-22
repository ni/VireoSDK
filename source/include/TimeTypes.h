/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Tools to working with relative, absolute and tic-count times.
 */

#ifndef TimeTypes_h
#define TimeTypes_h

#include "DataTypes.h"

namespace Vireo
{
//------------------------------------------------------------
#if defined (__ARDUINO__)
	typedef UInt32 PlatformTickType;
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
    static Int64 TickCountToMilliseconds(PlatformTickType);
    static Int64 TickCountToMicroseconds(PlatformTickType);
};

//------------------------------------------------------------
//! A 64.64 bit fixed point value used for working with absolute and relative times.
class Fixed128f64
{
private:
    Int64 _integer;
    UInt64 _fraction;
    
public:
    Fixed128f64() { _integer = 0; _fraction = 0;}
    Fixed128f64(Int64 integer, UInt64 fraction) { _integer = integer; _fraction = fraction;}
    Int64 Integer() const { return _integer; };
    UInt64 Fraction() const { return _fraction; };
    
    Fixed128f64 operator+(const Fixed128f64 & value)
    {
        Fixed128f64 answer;
        answer._integer = _integer + value._integer;
        answer._fraction = _fraction + value._fraction;
        if (answer._fraction < _fraction) {
            answer._integer++;
        }
        return answer;
    }
    
public:
    Fixed128f64 const operator-(const Fixed128f64 & value)
    {
        Fixed128f64 answer;
        answer._integer = _integer - value._integer;
        answer._fraction = _fraction - value._fraction;
        if (answer._fraction > _fraction) {
            answer._integer--;
        }
        return answer;
        
    }
    
    Boolean operator==(const Fixed128f64 & value) const
    {
        return ((_integer == value._integer) && (_fraction == value._fraction));
    }
    Boolean operator>(const Fixed128f64 & value) const
    {
        return ((_integer > value._integer) || ((_integer == value._integer) && (_fraction > value._fraction)));
    }
    Boolean operator<(const Fixed128f64 & value) const
    {
        return ((_integer < value._integer) || ((_integer == value._integer) && (_fraction < value._fraction)));
    }
    Boolean operator>=(const Fixed128f64 & value) const
    {
        return (value > *this) || (value == *this);
    }
    Boolean operator<=(const Fixed128f64 & value) const
    {
        return (value < *this) || (value == *this);
    }
};

//------------------------------------------------------------
//! Time that is relative to a predefined epoch.
class ATime128 : public Fixed128f64
{
public:
    Double Seconds (void) const
    {
        // TODO Return floored Second value.
        // eg -1.9 seconds before epoch will return -2
        // 		1.9 seconds will return 1
        return (Double) this->Integer();
    }
    
    UInt64 FractionUIn64 (void) const
    {
        // TODO Return floored Second value.
        // eg -1.9 seconds before epoch will return -2
        // 		1.9 seconds will return 1
        return this->Fraction();
    }
    
    Int64 SecondsInt64 (void) const
    {
        // TODO Return floored Second value.
        // eg -1.9 seconds before epoch will return -2
        // 		1.9 seconds will return 1
        return this->Integer();
    }
    
    Double FractionOfSecond (void) const
    {
        // TODO Return fractional second value
        // eg -1.9 seconds before epoch will return 0.1
        // 		1.9 seconds will return 0.9
        //	Get(NULL, NULL, &tsb, &lsb);
        //	NITime	temp(0, 0, tsb, lsb);
        return (Double) this->Fraction();
    }
    
    ATime128() : Fixed128f64(0,0) { }
    ATime128(Int64 integer, UInt64 fraction) : Fixed128f64(integer,fraction) { }
};

}
#endif // TimeTypes_h
