/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file Date implementation file
 */

#include "TypeDefiner.h"
#include "TDCodecVia.h"
#include "Date.h"

#if defined(VIREO_DATE_TIME_STDLIB)
#if kVireoOS_win32U
    #include <windows.h>
    #include <time.h>
#else
    #include <time.h>
    #include <sys/time.h>
#endif
#elif defined(VIREO_DATE_TIME_VXWORKS)
    #include <sys/times.h>
    #include <timers.h>
    #include <tickLib.h>
#endif

#if (kVireoOS_win32U || kVireoOS_win64U)
    #define NOMINMAX
    #include <windows.h>
#elif kVireoOS_macosxU
    #define _BSD_SOURCE
    #include <pthread.h>
    #include <time.h>
    #include <mach/mach_time.h>
#elif (kVireoOS_linuxU)
    #define _BSD_SOURCE
    #include <pthread.h>
    #include <time.h>
#elif kVireoOS_ZynqARM
    #include <xscutimer.h>
#elif kVireoOS_emscripten
    #include <emscripten.h>
#endif

#if kVireoOS_emscripten
extern "C" {
    extern char * jsTimestampGetTimeZoneAbbr();
    extern char * jsTimestampGetTimeZoneOffset();
}
#endif

namespace Vireo {
#if defined(VIREO_TYPE_Timestamp)

    static const Int64 secondsInYear = 31536000;
    static const Int64 secondsInLeapYear = 31622400;
    static const Int32 secondsPerMinute = 60;
    static const Int32 secondsPerHour = secondsPerMinute * 60;
    static const Int32 secondsPerDay = secondsPerHour * 24;

    Int32 Date::_systemLocaleTimeZone = 0;

    //------------------------------------------------------------
    Int64 SecondsFromBaseYear(Int64 year, Int64 baseYear)
    {
        Int64 numberOfLeap = (year-1)/4 - (year-1)/100 + (year-1)/400 - (baseYear/4-baseYear/100+baseYear/400);
        Int64 totalSeconds = numberOfLeap*secondsInLeapYear + (year - baseYear - numberOfLeap)*secondsInYear;
        return totalSeconds;
    }

    //------------------------------------------------------------
    Int32 getYear(Int64 wholeSeconds, Int32* yearSeconds, Int32* weekDays)
    {
        // Thursday, January 01, 1903
        Int32 baseYear = 1903;
        Int32 baseWeek = 3;
        Int32 currentYear = baseYear;
        Int32 yearMax = (Int32)(wholeSeconds / secondsInYear);
        Int32 yearMin = (Int32)(wholeSeconds / secondsInLeapYear);

        if (wholeSeconds >= 0) {
            for (Int32 i = yearMin; i <= yearMax; i++) {
                Int32 year = baseYear + i;
                Int32 numberOfLeap = 0;
                numberOfLeap = year/4 - year/100 + year/400 - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSeconds = numberOfLeap*secondsInLeapYear + (i-numberOfLeap)*secondsInYear;
                Int32 nextyear = baseYear + i +1;
                numberOfLeap = nextyear/4 - nextyear/100 + nextyear/400 - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSecondsNext = numberOfLeap*secondsInLeapYear + (i+1-numberOfLeap)*secondsInYear;
                if (totalSeconds <= wholeSeconds && wholeSeconds < totalSecondsNext) {
                    currentYear = nextyear;
                    *yearSeconds = (Int32)(wholeSeconds - totalSeconds);
                    break;
                }
            }
        } else if (wholeSeconds < 0) {
            for (Int32 i = yearMax; i <= yearMin; i++) {
                Int32 year = baseYear + i;
                Int32 numberOfLeap = 0;
                numberOfLeap = year/4 - year/100 + year/400 - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSeconds = numberOfLeap*secondsInLeapYear + (i-numberOfLeap)*secondsInYear;
                Int32 previousyear = baseYear + i - 1;
                numberOfLeap = (previousyear/4 - previousyear/100 + previousyear/400)
                        - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSecondsPrevious = numberOfLeap*secondsInLeapYear + (i-1-numberOfLeap)*secondsInYear;
                if (totalSecondsPrevious <= wholeSeconds && wholeSeconds < totalSeconds) {
                    currentYear = year;
                    // this will make sure the *yearSeconds is always positive
                    *yearSeconds = (Int32)(wholeSeconds - totalSecondsPrevious);
                    break;
                }
            }
        } else {
            *yearSeconds = 0;
            currentYear = 1904;
        }
        Int64 numberOfLeap = (currentYear-1)/4 - (currentYear-1)/100 + (currentYear-1)/400
                - (baseYear/4-baseYear/100+baseYear/400);
        Int64 totalSeconds = numberOfLeap*secondsInLeapYear + (currentYear - baseYear - numberOfLeap)*secondsInYear;
        Int32 weekdaysOfyear = (totalSeconds/secondsPerDay + baseWeek)%7;
        weekdaysOfyear = (weekdaysOfyear < 0) ? (weekdaysOfyear + 7) : weekdaysOfyear;
        *weekDays = weekdaysOfyear;
        return currentYear;
    }

    //------------------------------------------------------------
    void Date::getDate(Timestamp timestamp, Int64* secondsOfYearPtr, Int32* yearPtr,
                 Int32* monthPtr, Int32* dayPtr, Int32* hourPtr,
                 Int32* minutePtr, Int32* secondPtr, Double* fractionPtr,
                 Int32* weekPtr, Int32* weekOfFirstDay, ConstCStr* timeZoneString)
    {
        Int32 secondsOfYear = 0;
        Int32 firstweekDay = 0;

        Int32 year = getYear(timestamp.Integer(), &secondsOfYear, &firstweekDay);
        if (yearPtr!= NULL) {
            *yearPtr = year;
        }
        if (weekOfFirstDay != NULL) {
            // get the first week day for this year
            *weekOfFirstDay = firstweekDay;
        }
        if (secondsOfYearPtr != NULL) {
            *secondsOfYearPtr = secondsOfYear;
        }
        Int32 currentMonth = -2;
        Int32 secondsofMonth = -2;
        if ((year%4 == 0) && ((year%100 != 0) || (year%400 == 0))) {
            // leap year
            Int32 dayofMonth[] = {31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
            Int32 seconds = 0;
            for (Int32 i = 0; i < 12; i++) {
                secondsofMonth = seconds;
                seconds+= secondsPerDay * dayofMonth[i];
                if (seconds > secondsOfYear) {
                    currentMonth = i;
                    secondsofMonth = secondsOfYear - secondsofMonth;
                    break;
                }
            }
        } else {
            Int32 dayofMonth[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
            Int32 seconds = 0;
            for (Int32 i = 0; i < 12; i++) {
                secondsofMonth = seconds;
                seconds+= secondsPerDay * dayofMonth[i];
                if (seconds > secondsOfYear) {
                    currentMonth = i;
                    secondsofMonth = secondsOfYear - secondsofMonth;
                    break;
                }
            }
        }
        // Get timezone abbrevation
        ConstCStr timeZoneAbbr;
#if (kVireoOS_linuxU || kVireoOS_macosxU)
        time_t rawtime;
        struct tm* timeinfo;
        time(&rawtime);
        timeinfo = localtime(&rawtime);
        timeZoneAbbr = timeinfo->tm_zone;
#elif kVireoOS_emscripten
        timeZoneAbbr = jsTimestampGetTimeZoneAbbr();
#else
        timeZoneAbbr = "TODO-TMZ";
#endif
        Int32 days = secondsofMonth / secondsPerDay;
        Int32 secondsofHour = secondsofMonth % secondsPerDay;
        Int32 hours = secondsofHour / secondsPerHour;
        Int32 secondsofMinutes = secondsofHour % secondsPerHour;
        Int32 minutes = secondsofMinutes / secondsPerMinute;
        Int32 seconds = secondsofMinutes % secondsPerMinute;
        if (monthPtr != NULL) {
            *monthPtr = currentMonth;
        }
        if (dayPtr != NULL) {
            *dayPtr = days;
        }
        if (hourPtr != NULL) {
            *hourPtr = hours;
        }
        if (minutePtr != NULL) {
            *minutePtr = minutes;
        }
        if (secondPtr != NULL) {
            *secondPtr = seconds;
        }
        if (fractionPtr != NULL) {
            *fractionPtr = timestamp.ToDouble() - timestamp.Integer();
        }
        if (weekPtr != NULL) {
            *weekPtr = (secondsOfYear/secondsPerDay + firstweekDay)%7;
        }
        if (timeZoneString != NULL) {
            *timeZoneString = timeZoneAbbr;
        }
    }

    //------------------------------------------------------------
    Date::Date(Timestamp timestamp, Int32 timeZoneOffset)
    {
        _timeZoneOffset = timeZoneOffset;
        Timestamp local = timestamp + _timeZoneOffset;
        getDate(local, &_secondsOfYear, &_year, &_month, &_day, &_hour,
                &_minute, &_second, &_fractionalSecond, &_weekday, &_firstWeekDay, &_timeZoneString);
        _dayTimeSaving = isDayTimeSaving();
    }

    //------------------------------------------------------------
    Int32 Date::getLocaletimeZone()
    {
#if kVireoOS_emscripten
        TempStackCString result;
        result.AppendCStr(jsTimestampGetTimeZoneOffset());
        EventLog log(EventLog::DevNull);
        SubString valueString(result.Begin(), result.End());
        TDViaParser parser(THREAD_TADM(), &valueString, &log, 1);
        TypeRef parseType = THREAD_TADM()->FindType(tsInt32Type);
        Int32 minutes;
        parser.ParseData(parseType, &minutes);
        _systemLocaleTimeZone = -(minutes * secondsPerMinute);
        // flipping the sign of the time zone since JS runtime will be positive
        // for being behind UTC and negative for being ahead. ctime assumes
        // negative for behind and postive for ahead. We attempt to match the ctime result.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
#elif (kVireoOS_linuxU || kVireoOS_macosxU)
        struct tm tm;
        time_t now = time(NULL);
        localtime_r(&now, &tm);
        _systemLocaleTimeZone = int(tm.tm_gmtoff);
#else
        // flipping the sign of the time zone
        TIME_ZONE_INFORMATION timeZoneInfo;
        GetTimeZoneInformation(&timeZoneInfo);
        _systemLocaleTimeZone = -int((timeZoneInfo.Bias + timeZoneInfo.DaylightBias) * secondsPerMinute);
#endif
        return _systemLocaleTimeZone;
    };

    //------------------------------------------------------------
    Int32 Date::isDayTimeSaving()
    {
        return 0;
    }
#endif
}
