/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file Date implementation file
 */

#include "BuildConfig.h"
#include "TypeDefiner.h"
#include "TDCodecVia.h"
#include "Date.h"

#include <stdio.h>
#if defined(VIREO_DATE_TIME_STDLIB)
#if kVireoOS_windows
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

#if (kVireoOS_windows)
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

    Int32 Date::_systemLocaleTimeZone = 0;

    //------------------------------------------------------------
    Int32 numberOfLeapYears(Int32 year, Int32 baseYear)
    {
        Int32 numberOfYears = year / 4 - year / 100 + year / 400 - (baseYear / 4 - baseYear / 100 + baseYear / 400);
        return numberOfYears;
    }

    //------------------------------------------------------------
    Int32 getYear(Int64 wholeSeconds, Int64* yearSeconds, Int32* weekDays)
    {
        // Thursday, January 01, 1903
        Int32 baseYear = 1903;
        Int32 baseWeek = 4; // 3;  3 was with 0=Monday, want 0=Sunday
        Int32 currentYear = baseYear;
        Int32 yearMax = (Int32)(wholeSeconds / kSecondsInYear);
        Int32 yearMin = (Int32)(wholeSeconds / kSecondsInLeapYear);

        if (wholeSeconds >= 0) {
            for (Int32 i = yearMin; i <= yearMax; i++) {
                Int32 year = baseYear + i;
                Int32 numberOfLeap = numberOfLeapYears(year, baseYear);
                Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (i - numberOfLeap)*kSecondsInYear;
                Int32 nextYear = baseYear + i + 1;
                numberOfLeap = numberOfLeapYears(nextYear, baseYear);
                Int64 totalSecondsNext = numberOfLeap*kSecondsInLeapYear + (i + 1 - numberOfLeap)*kSecondsInYear;
                if (totalSeconds <= wholeSeconds && wholeSeconds < totalSecondsNext) {
                    currentYear = nextYear;
                    *yearSeconds = (Int32)(wholeSeconds - totalSeconds);
                    break;
                }
            }
        }
        else if (wholeSeconds < 0) {
            for (Int32 i = yearMax; i <= yearMin; i++) {
                Int32 year = baseYear + i;
                Int32 numberOfLeap = numberOfLeapYears(year, baseYear);
                Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (i - numberOfLeap)*kSecondsInYear;
                Int32 previousYear = baseYear + i - 1;
                numberOfLeap = numberOfLeapYears(previousYear, baseYear);
                Int64 totalSecondsPrevious = numberOfLeap*kSecondsInLeapYear + (i - 1 - numberOfLeap)*kSecondsInYear;
                if (totalSecondsPrevious <= wholeSeconds && wholeSeconds < totalSeconds) {
                    currentYear = year;
                    // this will make sure the *yearSeconds is always positive
                    *yearSeconds = (Int32)(wholeSeconds - totalSecondsPrevious);
                    break;
                }
            }
        }
        else {
            *yearSeconds = 0;
            currentYear = 1904;
        }
        Int64 numberOfLeap = numberOfLeapYears(currentYear - 1, baseYear);
        Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (currentYear - baseYear - numberOfLeap)*kSecondsInYear;
        Int32 weekdaysOfyear = (totalSeconds / kSecondsPerDay + baseWeek) % kDaysInWeek;
        weekdaysOfyear = (weekdaysOfyear < 0) ? (weekdaysOfyear + kDaysInWeek) : weekdaysOfyear;
        *weekDays = weekdaysOfyear;
        return currentYear;
    }

#if kVireoOS_windows
    std::string abbreviateTimeZoneName(std::string input)
    {
        char prev = ' ';
        std::string output;
        for (int i = 0; i < input.length(); i++)
        {
            if (prev == ' ' && input[i] != ' ')
            {
                output += input[i];
            }
            prev = input[i];
        }
        return output;
    }
#endif

    //------------------------------------------------------------
    Boolean isLeapYear(Int32 year)
    {
        return (year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0));
    }

    //------------------------------------------------------------
    void Date::getDate(Timestamp timestamp, Int64* secondsOfYearPtr, Int32* yearPtr,
                 Int32* monthPtr, Int32* dayPtr, Int32* hourPtr,
                 Int32* minutePtr, Int32* secondPtr, Double* fractionPtr,
                 Int32* weekDayPtr, Int32* weekOfFirstDay, char** timeZoneString)
    {
        Int64 secondsOfYear = 0;
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
        Int32 secondsOfMonth = -2;
        Int32 dayOfMonth[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
        if (isLeapYear(year)) {
            dayOfMonth[1] = 29;
        }
        Int32 seconds = 0;
        for (Int32 i = 0; i < 12; i++) {
            secondsOfMonth = seconds;
            seconds += kSecondsPerDay * dayOfMonth[i];
            if (seconds > secondsOfYear) {
                currentMonth = i;
                secondsOfMonth = Int32(secondsOfYear - secondsOfMonth);
                break;
            }
        }

        // Get timezone abbrevation
        char timeZoneAbbr[kTempCStringLength] = "TODO-TimeZone";
#if (kVireoOS_linuxU || kVireoOS_macosxU || kVireoOS_emscripten)
        time_t rawtime = timestamp.Integer() - kStdDT1970re1904;
        struct tm timeinfo;
        localtime_r(&rawtime, &timeinfo);
        snprintf(timeZoneAbbr, sizeof(timeZoneAbbr), "%s", timeinfo.tm_zone);
// #elif kVireoOS_emscripten variant deleted (03/2017); localtime_r works correctly
#elif kVireoOS_windows
        // Issue #218 TODO - FIXME: return time zone info/dst based on timestamp.Integer(), not current time.
        // Possibly use SystemTimeToTzSpecificLocalTime
        TIME_ZONE_INFORMATION timeZoneInfo;
        int rc = GetTimeZoneInformation(&timeZoneInfo);
        wchar_t *timeZoneName = L"TimeZoneUnknown";
        if (rc == TIME_ZONE_ID_STANDARD)
        {
            timeZoneName = timeZoneInfo.StandardName;
        }
        else if (rc == TIME_ZONE_ID_DAYLIGHT)
        {
            timeZoneName = timeZoneInfo.DaylightName;
        }
        //int timeZoneStringSize = wcslen(timeZoneName) + 1;
        //wcstombs(timeZoneAbbr, timeZoneName, timeZoneStringSize - 1);
        wcstombs(timeZoneAbbr, timeZoneName, sizeof(timeZoneAbbr));
        std::string timeZone = abbreviateTimeZoneName(timeZoneAbbr);
        snprintf(timeZoneAbbr, sizeof(timeZoneAbbr), "%s", timeZone.c_str());
#endif
        Int32 days = secondsOfMonth / kSecondsPerDay;
        Int32 secondsOfHour = secondsOfMonth % kSecondsPerDay;
        Int32 hours = secondsOfHour / kSecondsPerHour;
        Int32 secondsOfMinutes = secondsOfHour % kSecondsPerHour;
        Int32 minutes = secondsOfMinutes / kSecondsPerMinute;
        seconds = secondsOfMinutes % kSecondsPerMinute;
        if (monthPtr != NULL) {
            *monthPtr = currentMonth;
        }
        if (dayPtr != NULL) {
            *dayPtr = days+1;
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
        if (weekDayPtr != NULL) {
            *weekDayPtr = (secondsOfYear/kSecondsPerDay + firstweekDay) % kDaysInWeek;
        }
        if (timeZoneString != NULL)
        {
            if (*timeZoneString != NULL)
            {
                free(*timeZoneString);
            }
            *timeZoneString = (char *)malloc(strlen(timeZoneAbbr)+1);
            strncpy(*timeZoneString, timeZoneAbbr, strlen(timeZoneAbbr)+1);
        }
    }

    //------------------------------------------------------------
    Date::Date(Timestamp timestamp, Int32 timeZoneOffset)
    {
        _timeZoneOffset = timeZoneOffset;
        _timeZoneString = NULL;
        Timestamp local = timestamp + _timeZoneOffset;
        getDate(local, &_secondsOfYear, &_year, &_month, &_day, &_hour,
                &_minute, &_second, &_fractionalSecond, &_weekday, &_firstWeekDay, &_timeZoneString);
        _daylightSavingTime = isDaylightSavingTime();
    }

    Date::Date(Timestamp timestamp, bool isUTC) {
#ifdef VIREO_DATE_TIME_STDLIB
#if !kVireoOS_windows
        struct tm tm;
        time_t time = timestamp.Integer() - kStdDT1970re1904;
        if (isUTC)
            gmtime_r(&time, &tm);
        else
            localtime_r(&time, &tm);
        _timeZoneOffset = int(isUTC ? 0 : tm.tm_gmtoff);
        _secondsOfYear = 0;
        _year = tm.tm_year + 1900;
        _month = tm.tm_mon;
        _day = tm.tm_mday;
        _hour = tm.tm_hour;
        _minute = tm.tm_min;
        _second = tm.tm_sec;
        _weekday = tm.tm_wday;
        _fractionalSecond = timestamp.ToDouble() - timestamp.Integer();

        getYear(timestamp.Integer() + _timeZoneOffset , &_secondsOfYear, &_firstWeekDay);

        const char *tz = isUTC ? "UTC" : tm.tm_zone;
        _daylightSavingTime = tm.tm_isdst;
        if (tm.tm_zone) {
            _timeZoneString = (char *)malloc(strlen(tz)+1);
            strncpy(_timeZoneString, tm.tm_zone, strlen(tz)+1);
        } else
            _timeZoneString = NULL;
#else
        _timeZoneOffset = isUTC ? 0 : Date::getLocaletimeZone(timestamp.Integer());
        _timeZoneString = NULL;
        Timestamp local = timestamp + _timeZoneOffset;
        getDate(local, &_secondsOfYear, &_year, &_month, &_day, &_hour,
                &_minute, &_second, &_fractionalSecond, &_weekday, &_firstWeekDay, &_timeZoneString);
        _daylightSavingTime = isDaylightSavingTime();
#endif
#endif
    }

    Date::~Date()
    {
        if (_timeZoneString)
        {
            free(_timeZoneString);
            _timeZoneString = NULL;
        }
    }


    //------------------------------------------------------------
    Int32 Date::getLocaletimeZone(Int64 utcTime)
    {
// #if kVireoOS_emscripten formerly here which was using jsTimestampGetTimeZoneOffset has been deleted (03/2017); the localtime_r emulation works correctly
#if (kVireoOS_linuxU || kVireoOS_macosxU || kVireoOS_emscripten)
        struct tm tm;
        time_t timeVal = utcTime - kStdDT1970re1904;
        localtime_r(&timeVal, &tm);
        _systemLocaleTimeZone = int(tm.tm_gmtoff);
#else
        // Issue #218 TODO -  FIXME: if utcTime is non-zero, time zone bias should be based on utcTime passed in
        // (in GMT secs since epoch), not current time.
        // Possibly use SystemTimeToTzSpecificLocalTime
        
        // flipping the sign of the time zone
        TIME_ZONE_INFORMATION timeZoneInfo;
        GetTimeZoneInformation(&timeZoneInfo);
        _systemLocaleTimeZone = -int((timeZoneInfo.Bias) * kSecondsPerMinute);
#endif
        return _systemLocaleTimeZone;
    };

    //------------------------------------------------------------
    Int32 Date::isDaylightSavingTime()
    {
        return 0;
    }
#endif
}
