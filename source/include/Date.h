// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
    static const Int32 kSecondsPerWeek = kSecondsPerDay * kDaysInWeek;
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
    static void getDate(Timestamp timestamp, Int64* secondsOfYearPtr, Int32* yearPtr,
        Int32* monthPtr = nullptr, Int32* dayPtr = nullptr, Int32* hourPtr = nullptr,
        Int32* minutePtr = nullptr, Int32* secondPtr = nullptr, Double* fractionPtr = nullptr,
        Int32* weekDayPtr = nullptr, Int32* weekOfFirstDay = nullptr, char** timeZoneString = nullptr);

 public:
    Date(Timestamp timestamp, Int32 timeZoneOffset);  // this API is conceptually wrong;
    // (tzo should be computed from UTC date)
    explicit Date(Timestamp timestamp, Boolean isUTC = false);
    ~Date();
    static Int32 getLocaletimeZone(Int64 utcTime);
    static Int32 getYear(Int64 wholeSeconds, Int64* yearSeconds, Int32* weekDays);
    static Timestamp DateUTCToTimestamp(Int32 year, Int32 month, Int32 day, Int32 hour, Int32 minute, Int32 second, Double fracSecs);
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
    static Int32 isDaylightSavingTime();
    Double FractionalSecond() const {return  _fractionalSecond;}
};

Boolean DateTimeToString(const Date& date, Boolean isUTC, SubString* format, StringRef output);
Boolean RelTimeToString(Double relTimeSeconds, SubString* format, StringRef output);

Boolean StringToDateTime(SubString *input, Boolean isUTC, SubString* format, Timestamp *timestamp);
Boolean StringToRelTime(SubString *input, SubString* format, Double *relTimeSecondsPtr);

}  // namespace Vireo
#endif  // DATE_H
