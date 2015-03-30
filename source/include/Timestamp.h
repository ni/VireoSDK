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
	#include <emscripten.h>
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

class Date
{
 private:
    Double _fractionalSecond;
    Int32 _second;
    Int32 _minute;
    Int32 _hour;
    Int32 _day;
    Int32 _month;
    Int32 _year;
    Int32 _weekday;
    Int64 _secondsOfYear;
    Int32 _firstWeekDay;
    Int32 _timeZoneOffset;
    Int32 _DTS;
    static Int32 _SystemLocaletimeZone;
 public:
        Date(Timestamp timestamp, Int32 timeZone);
        static Int32 getLocaletimeZone();
        Int32 Year() const { return _year; };
        Int32 Month() const { return _month; };
        Int32 Day() const { return _day; };
        Int32 Hour() const { return _hour; };
        Int32 Minute() const { return _minute; };
        Int32 Second() const { return _second; };
        Int32 WeekDay() const { return _weekday; };
        Int32 FirstWeekDay() const { return _firstWeekDay; };
        Int64 SecondsOfYear() const {return _secondsOfYear;};
        Int32 TimeZoneOffset() const {return _timeZoneOffset;};
        Int32 DTS() const {return _DTS;}
        Int32 isDTS();
        Double FractionSecond() const {return  _fractionalSecond;};
        // return a new date object at other time zone
        Date AtTimeZone(Int32 timeZone);
};

}  // namespace Vireo
#endif // Timestamp_h
