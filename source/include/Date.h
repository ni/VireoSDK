/**

Copyright (c) 2014-2016 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Defines the Date class.
 */

#ifndef Date_h
#define Date_h

#include "DataTypes.h"
#include "Timestamp.h"

namespace Vireo {

class Date {
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
        char *_timeZoneString;
        Int32 _DTS;
        static Int32 _SystemLocaletimeZone;
    public:
        Date(Timestamp timestamp, Int32 timeZone);
        ~Date();
        static void getDate(Timestamp timestamp, Int64* secondofYearPtr, Int32* yearPtr,
            Int32* monthPtr = NULL, Int32* dayPtr = NULL, Int32* hourPtr = NULL,
            Int32* minPtr = NULL, Int32* secondPtr = NULL, Double* fractionPtr = NULL,
            Int32* weekPtr = NULL, Int32* weekOfFirstDay = NULL, char** timeZoneString = NULL);
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
        ConstCStr TimeZoneString() const { return _timeZoneString; };
        Int32 DTS() const {return _DTS;}
        Int32 isDTS();
        Double FractionSecond() const {return  _fractionalSecond;};
        // return a new date object at other time zone
        Date AtTimeZone(Int32 timeZone);
};

}
#endif
