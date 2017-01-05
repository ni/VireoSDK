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

#include <stdio.h>
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

    static const Int64 kSecondsInYear = 31536000;
    static const Int64 kSecondsInLeapYear = 31622400;
    static const Int32 kSecondsPerMinute = 60;
    static const Int32 kSecondsPerHour = kSecondsPerMinute * 60;
    static const Int32 kSecondsPerDay = kSecondsPerHour * 24;

    Int32 Date::_systemLocaleTimeZone = 0;

    //------------------------------------------------------------
    Int64 SecondsFromBaseYear(Int64 year, Int64 baseYear)
    {
        Int64 numberOfLeap = (year-1)/4 - (year-1)/100 + (year-1)/400 - (baseYear/4-baseYear/100+baseYear/400);
        Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (year - baseYear - numberOfLeap)*kSecondsInYear;
        return totalSeconds;
    }

    //------------------------------------------------------------
    Int32 getYear(Int64 wholeSeconds, Int32* yearSeconds, Int32* weekDays)
    {
        // Thursday, January 01, 1903
        Int32 baseYear = 1903;
        Int32 baseWeek = 3;
        Int32 currentYear = baseYear;
        Int32 yearMax = (Int32)(wholeSeconds / kSecondsInYear);
        Int32 yearMin = (Int32)(wholeSeconds / kSecondsInLeapYear);

        if (wholeSeconds >= 0) {
            for (Int32 i = yearMin; i <= yearMax; i++) {
                Int32 year = baseYear + i;
                Int32 numberOfLeap = 0;
                numberOfLeap = year/4 - year/100 + year/400 - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (i-numberOfLeap)*kSecondsInYear;
                Int32 nextyear = baseYear + i +1;
                numberOfLeap = nextyear/4 - nextyear/100 + nextyear/400 - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSecondsNext = numberOfLeap*kSecondsInLeapYear + (i+1-numberOfLeap)*kSecondsInYear;
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
                Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (i-numberOfLeap)*kSecondsInYear;
                Int32 previousyear = baseYear + i - 1;
                numberOfLeap = (previousyear/4 - previousyear/100 + previousyear/400)
                        - (baseYear/4-baseYear/100+baseYear/400);
                Int64 totalSecondsPrevious = numberOfLeap*kSecondsInLeapYear + (i-1-numberOfLeap)*kSecondsInYear;
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
        Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (currentYear - baseYear - numberOfLeap)*kSecondsInYear;
        Int32 weekdaysOfyear = (totalSeconds/kSecondsPerDay + baseWeek)%7;
        weekdaysOfyear = (weekdaysOfyear < 0) ? (weekdaysOfyear + 7) : weekdaysOfyear;
        *weekDays = weekdaysOfyear;
        return currentYear;
    }

#if kVireoOS_win32U
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
    void Date::getDate(Timestamp timestamp, Int64* secondsOfYearPtr, Int32* yearPtr,
                 Int32* monthPtr, Int32* dayPtr, Int32* hourPtr,
                 Int32* minutePtr, Int32* secondPtr, Double* fractionPtr,
                 Int32* weekPtr, Int32* weekOfFirstDay, char** timeZoneString)
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
        Int32 secondsOfMonth = -2;
        if ((year%4 == 0) && ((year%100 != 0) || (year%400 == 0))) {
            // leap year
            Int32 dayOfMonth[] = {31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
            Int32 seconds = 0;
            for (Int32 i = 0; i < 12; i++) {
                secondsOfMonth = seconds;
                seconds+= kSecondsPerDay * dayOfMonth[i];
                if (seconds > secondsOfYear) {
                    currentMonth = i;
                    secondsOfMonth = secondsOfYear - secondsOfMonth;
                    break;
                }
            }
        } else {
            Int32 dayOfMonth[] = {31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31};
            Int32 seconds = 0;
            for (Int32 i = 0; i < 12; i++) {
                secondsOfMonth = seconds;
                seconds+= kSecondsPerDay * dayOfMonth[i];
                if (seconds > secondsOfYear) {
                    currentMonth = i;
                    secondsOfMonth = secondsOfYear - secondsOfMonth;
                    break;
                }
            }
        }
        // Get timezone abbrevation
        char timeZoneAbbr[kTempCStringLength] = "TODO-TimeZone";
#if (kVireoOS_linuxU || kVireoOS_macosxU)
        time_t rawtime;
        struct tm* timeinfo;
        time(&rawtime);
        timeinfo = localtime(&rawtime);
        snprintf(timeZoneAbbr, sizeof(timeZoneAbbr), "%s", timeinfo->tm_zone);
#elif kVireoOS_emscripten
        TempStackCString result;
        result.AppendCStr(jsTimestampGetTimeZoneAbbr());
        snprintf(timeZoneAbbr, sizeof(timeZoneAbbr), "%s", result.BeginCStr());
#elif kVireoOS_win32U
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
        Int32 seconds = secondsOfMinutes % kSecondsPerMinute;
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
            *weekPtr = (secondsOfYear/kSecondsPerDay + firstweekDay)%7;
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

    Date::~Date()
    {
        if (_timeZoneString)
        {
            free(_timeZoneString);
            _timeZoneString = NULL;
        }
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
        _systemLocaleTimeZone = -(minutes * kSecondsPerMinute);
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
