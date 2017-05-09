/**

Copyright (c) 2014-2016 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Defines the Date class.
 */

#ifndef DATE_H
#define DATE_H

#include "DataTypes.h"
#include "Timestamp.h"

namespace Vireo {

    static const Int64 kSecondsInYear = 31536000;
    static const Int64 kSecondsInLeapYear = 31622400;
    static const Int32 kSecondsPerMinute = 60;
    static const Int32 kSecondsPerHour = kSecondsPerMinute * 60;
    static const Int32 kSecondsPerDay = kSecondsPerHour * 24;
    static const Int32 kDaysInWeek = 7;
    static const UInt32 kStdDT1970re1904 = 2082844800;

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
    char* _timeZoneString;
    Int32 _daylightSavingTime;
    static Int32 _systemLocaleTimeZone;

 private:
    void getDate(Timestamp timestamp, Int64* secondsOfYearPtr, Int32* yearPtr,
        Int32* monthPtr = NULL, Int32* dayPtr = NULL, Int32* hourPtr = NULL,
        Int32* minutePtr = NULL, Int32* secondPtr = NULL, Double* fractionPtr = NULL,
        Int32* weekPtr = NULL, Int32* weekOfFirstDay = NULL, char** timeZoneString = NULL);

 public:
    Date(Timestamp timestamp, Int32 timeZoneOffset);  // this API is conceptually wrong;
    // (tzo should be computed from UTC date)
    explicit Date(Timestamp timestamp, bool isUTC = false);
    ~Date();
    static Int32 getLocaletimeZone(Int64 utcTime);
    Int32 Year() const { return _year; }
    Int32 Month() const { return _month; }
    Int32 Day() const { return _day; }
    Int32 Hour() const { return _hour; }
    Int32 Minute() const { return _minute; }
    Int32 Second() const { return _second; }
    Int32 WeekDay() const { return _weekday; }
    Int32 FirstWeekDay() const { return _firstWeekDay; }
    Int64 SecondsOfYear() const {return _secondsOfYear;}
    Int32 TimeZoneOffset() const {return _timeZoneOffset;}
    ConstCStr TimeZoneString() const { return _timeZoneString; }
    Int32 DaylightSavingTime() const {return _daylightSavingTime;}
    Int32 isDaylightSavingTime();
    Double FractionalSecond() const {return  _fractionalSecond;}
};

Boolean DateTimeToString(const Date& date, Boolean isUTC, SubString* format, StringRef output);

}  // namespace Vireo
#endif  // DATE_H
