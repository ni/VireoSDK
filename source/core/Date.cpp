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

#include <math.h> /* fabs */
#include <float.h> /* DBL_EPSILON */

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
    //------------------------------------------------------------
    Int64 SecondsFromBaseYear(Int64 year, Int64 baseYear)
    {
        Int64 secondsInyear = 31536000;
        Int64 secondsInLeap = 31622400;
        Int64 numberOfLeap = (year-1)/4 - (year-1)/100 + (year-1)/400 - (baseYear/4-baseYear/100+baseYear/400);
        Int64 totalSeconds = numberOfLeap*secondsInLeap + (year - baseYear - numberOfLeap)*secondsInyear;
        return totalSeconds;
    }
    //------------------------------------------------------------
    Int32 getYear(Int64 wholeSeconds, UInt64 fractions, Int32* yearSeconds, Int32* weekDays)
    {
        // Does not account for leap seconds.
        Int64 secondsInyear = 31536000;
        Int64 secondsInLeap = 31622400;
        // Thursday, January 01, 1903
        Int32 baseYear = 1903;
        Int32 baseWeek = 3;
        Int32 currentYear = baseYear;
        Int32 yearMax = (Int32)(wholeSeconds/secondsInyear);
        Int32 yearMin = (Int32)(wholeSeconds/secondsInLeap);

        if (wholeSeconds >= 0) {
            for (Int32 i = yearMin; i <= yearMax; i++) {
                Int32 year = baseYear + i;
                Int32 numberOfLeap = 0;
                numberOfLeap = year/4 - year/100 + year/400 - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSeconds = numberOfLeap*secondsInLeap + (i-numberOfLeap)*secondsInyear;
                Int32 nextyear = baseYear + i +1;
                numberOfLeap = nextyear/4 - nextyear/100 + nextyear/400 - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSecondsNext = numberOfLeap*secondsInLeap + (i+1-numberOfLeap)*secondsInyear;
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
                Int64 totalSeconds = numberOfLeap*secondsInLeap + (i-numberOfLeap)*secondsInyear;
                Int32 previousyear = baseYear + i - 1;
                numberOfLeap = (previousyear/4 - previousyear/100 + previousyear/400)
                        - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSecondsPrevious = numberOfLeap*secondsInLeap + (i-1-numberOfLeap)*secondsInyear;
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
        Int64 totalSeconds = numberOfLeap*secondsInLeap + (currentYear - baseYear - numberOfLeap)*secondsInyear;
        Int32 weekdaysOfyear = (totalSeconds/(24*3600) + baseWeek)%7;
        weekdaysOfyear = (weekdaysOfyear < 0) ? (weekdaysOfyear + 7) : weekdaysOfyear;
        *weekDays = weekdaysOfyear;
        return currentYear;
    }

    //------------------------------------------------------------
    void Date::getDate(Timestamp timestamp, Int64* secondofYearPtr, Int32* yearPtr,
                 Int32* monthPtr, Int32* dayPtr, Int32* hourPtr,
                 Int32* minPtr, Int32* secondPtr, Double* fractionPtr,
                 Int32* weekPtr, Int32* weekOfFirstDay, ConstCStr* timeZoneString)
    {
        Int32 secondsOfYear = 0;
        Int32 firstweekDay = 0;

        Int32 year = getYear(timestamp.Integer(), timestamp.Fraction(), &secondsOfYear, &firstweekDay);
        if (yearPtr!= NULL) {
            *yearPtr = year;
        }
        if (weekOfFirstDay != NULL) {
            // get the first week day for this year
            *weekOfFirstDay = firstweekDay;
        }
        if (secondofYearPtr != NULL) {
            *secondofYearPtr = secondsOfYear;
        }
        Int32 currentMonth = -2;
        Int32 secondsofMonth = -2;
        if ((year%4 == 0) && ((year%100 != 0) || (year%400 == 0))) {
            // leap year
            Int32 dayofMonth[] = {31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
            Int32 seconds = 0;
            for (Int32 i = 0; i < 12; i++) {
                secondsofMonth = seconds;
                seconds+=24*3600*dayofMonth[i];
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
                seconds+=24*3600*dayofMonth[i];
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
        Int32 days = secondsofMonth/(24*3600);
        Int32 secondsofHour = secondsofMonth%(24*3600);
        Int32 hours = secondsofHour/3600;
        Int32 secondsofMinutes = secondsofHour%(3600);
        Int32 minutes = secondsofMinutes/60;
        Int32 seconds = secondsofMinutes%60;
        if (monthPtr != NULL) {
            *monthPtr = currentMonth;
        }
        if (dayPtr != NULL) {
            *dayPtr = days;
        }
        if (hourPtr != NULL) {
            *hourPtr = hours;
        }
        if (minPtr != NULL) {
            *minPtr = minutes;
        }
        if (secondPtr != NULL) {
            *secondPtr = seconds;
        }
        if (fractionPtr != NULL) {
            *fractionPtr = timestamp.ToDouble() - timestamp.Integer();
        }
        if (weekPtr != NULL) {
            *weekPtr = (secondsOfYear/(24*3600)+firstweekDay)%7;
        }
        if (timeZoneString != NULL) {
            *timeZoneString = timeZoneAbbr;
        }
    }

    Int32 Date::_SystemLocaletimeZone = 0;

    //------------------------------------------------------------
    Date::Date(Timestamp timestamp, Int32 timeZone)
    {
        _timeZoneOffset = timeZone;
        Timestamp local = timestamp + _timeZoneOffset;
        getDate(local, &_secondsOfYear, &_year, &_month, &_day, &_hour,
                &_minute, &_second, &_fractionalSecond, &_weekday, &_firstWeekDay, &_timeZoneString);
        _DTS = isDTS();
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
        _SystemLocaletimeZone = -(minutes * 60);
        // flipping the sign of the time zone since JS runtime will be positive
        // for being behind UTC and negative for being ahead. ctime assumes
        // negative for behind and postive for ahead. We attempt to match the ctime result.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
#elif (kVireoOS_linuxU || kVireoOS_macosxU)
        struct tm tm;
        time_t now = time(NULL);
        localtime_r(&now, &tm);
        _SystemLocaletimeZone = int(tm.tm_gmtoff);
#else
        // flipping the sign of the time zone
        TIME_ZONE_INFORMATION timeZoneInfo;
        GetTimeZoneInformation(&timeZoneInfo);
        _SystemLocaletimeZone = -int(timeZoneInfo.Bias * 60);
#endif
        return _SystemLocaletimeZone;
    };
    //------------------------------------------------------------
    Int32 Date::isDTS()
    {
        return 0;
    }
#endif
}
