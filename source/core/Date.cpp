// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file Date implementation file
 */

#include "BuildConfig.h"
#include "TypeDefiner.h"
#include "TDCodecVia.h"
#include "Date.h"

#include <cstdio>
#if defined(VIREO_DATE_TIME_STDLIB)
#if kVireoOS_windows
    #include <windows.h>
    #include <ctime>
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
#elif kVireoOS_linuxU
    #undef _BSD_SOURCE
    #define _BSD_SOURCE
    #include <pthread.h>
    #include <time.h>
#elif kVireoOS_ZynqARM
    #include <xscutimer.h>
#elif kVireoOS_emscripten
    #include <emscripten.h>
#endif

namespace Vireo {
#if defined(VIREO_TYPE_Timestamp)

    Int32 Date::_systemLocaleTimeZone = 0;

#if kVireoOS_windows
    // UnixTimeToFileTime and UnixTimeToSystemTime are from
    // https:support.microsoft.com/en-us/help/167296/how-to-convert-a-unix-time-t-to-a-win32-filetime-or-systemtime
    static void UnixTimeToFileTime(time_t t, LPFILETIME pft) {
       // Note that LONGLONG is a 64-bit value
       LONGLONG ll;

       ll = Int32x32To64(t, 10000000) + 116444736000000000;
       pft->dwLowDateTime = (DWORD)ll;
       pft->dwHighDateTime = ll >> 32;
    }

    static void UnixTimeToSystemTime(time_t t, LPSYSTEMTIME pst) {
       FILETIME ft;

       UnixTimeToFileTime(t, &ft);
       FileTimeToSystemTime(&ft, pst);
    }

    static void UtcTimeToSystemTime(Int64 utcTime, LPSYSTEMTIME pst) {
       FILETIME ft;
       UnixTimeToFileTime(utcTime, &ft);
       FileTimeToSystemTime(&ft, pst);
    }

    static Int64 FileTimeToTimeInSeconds(FILETIME fileTimeLocal) {
       const Int32 k100_ns_in_1_second = 10000000;
       ULARGE_INTEGER l;
       l.HighPart = fileTimeLocal.dwHighDateTime;
       l.LowPart = fileTimeLocal.dwLowDateTime;
       return l.QuadPart / k100_ns_in_1_second;
    }

    static Int32 GetTimeZoneOffsetSeconds(Int64 utcTime) {
       TIME_ZONE_INFORMATION timeZoneInfo;
       GetTimeZoneInformation(&timeZoneInfo);

       SYSTEMTIME sysTimeUtc, sysTimeLocal;
       UtcTimeToSystemTime(utcTime, &sysTimeUtc);
       SystemTimeToTzSpecificLocalTime(&timeZoneInfo, &sysTimeUtc, &sysTimeLocal);

       FILETIME fileTimeLocal, fileTimeUtc;
       SystemTimeToFileTime(&sysTimeLocal, &fileTimeLocal);
       SystemTimeToFileTime(&sysTimeUtc, &fileTimeUtc);
       Int64 localFileTime = FileTimeToTimeInSeconds(fileTimeLocal);
       Int64 utcFileTime = FileTimeToTimeInSeconds(fileTimeUtc);
       return (Int32)(localFileTime - utcFileTime);
    }
#endif

    //------------------------------------------------------------
    Int32 numberOfLeapYears(Int32 year, Int32 baseYear) {
        Int32 numberOfYears = year / 4 - year / 100 + year / 400 - (baseYear / 4 - baseYear / 100 + baseYear / 400);
        return numberOfYears;
    }

    //------------------------------------------------------------
    Int32 Date::getYear(Int64 wholeSeconds, Int64* yearSeconds, Int32* weekDays) {
        // Thursday, January 01, 1903
        Int32 baseYear = 1903;
        Int32 baseWeek = 4;  // 3;  3 was with 0=Monday, want 0=Sunday
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
                    if (yearSeconds)
                        *yearSeconds = (Int32)(wholeSeconds - totalSeconds);
                    break;
                }
            }
        } else if (wholeSeconds < 0) {
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
                    if (yearSeconds)
                        *yearSeconds = (Int32)(wholeSeconds - totalSecondsPrevious);
                    break;
                }
            }
        } else {
            *yearSeconds = 0;
            currentYear = 1904;
        }
        Int64 numberOfLeap = numberOfLeapYears(currentYear - 1, baseYear);
        Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (currentYear - baseYear - numberOfLeap)*kSecondsInYear;
        Int32 weekdaysOfYear = (totalSeconds / kSecondsPerDay + baseWeek) % kDaysInWeek;
        weekdaysOfYear = (weekdaysOfYear < 0) ? (weekdaysOfYear + kDaysInWeek) : weekdaysOfYear;
        if (weekDays)
            *weekDays = weekdaysOfYear;
        return currentYear;
    }

    static void abbreviateTimeZone(const char * input, char output[kTempCStringLength]) {
        char prev = ' ';
        size_t j = 0;
        for (size_t i = 0; i < strlen(input); i++) {
            if (prev == ' ' && input[i] != ' ') {
                output[j] = input[i];
                ++j;
            }
            prev = input[i];
        }
        output[j] = 0;
    }

    //------------------------------------------------------------
    Boolean isLeapYear(Int32 year) {
        return (year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0));
    }

    //------------------------------------------------------------
    void Date::getDate(Timestamp timestamp, Int64* secondsOfYearPtr, Int32* yearPtr,
                 Int32* monthPtr, Int32* dayPtr, Int32* hourPtr,
                 Int32* minutePtr, Int32* secondPtr, Double* fractionPtr,
                 Int32* weekDayPtr, Int32* weekOfFirstDay, char** timeZoneString) {
        Int64 secondsOfYear = 0;
        Int32 firstweekDay = 0;

        Int32 year = getYear(timestamp.Integer(), &secondsOfYear, &firstweekDay);
        if (yearPtr != nullptr) {
            *yearPtr = year;
        }
        if (weekOfFirstDay != nullptr) {
            // get the first week day for this year
            *weekOfFirstDay = firstweekDay;
        }
        if (secondsOfYearPtr != nullptr) {
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

        // Get timezone abbreviation
        char timeZoneAbbr[kTempCStringLength] = "UnknownTimeZone";
#if (kVireoOS_linuxU || kVireoOS_macosxU || kVireoOS_emscripten)
        time_t rawtime = timestamp.Integer() - kStdDT1970re1904;
        struct tm timeinfo;
        localtime_r(&rawtime, &timeinfo);
        if (strchr(timeinfo.tm_zone, ' ') == nullptr) {
            // if timezone name is abbreviated, there won't be space. True on Linux and Mac (native, node.js, and browser)
            snprintf(timeZoneAbbr, sizeof(timeZoneAbbr), "%s", timeinfo.tm_zone);
        } else {
            // if timezone name is unabbreviated (True on Windows (both node.js and browser), then abbreviate it
            abbreviateTimeZone(timeinfo.tm_zone, timeZoneAbbr);
        }
// #elif kVireoOS_emscripten variant deleted (03/2017); localtime_r works correctly
#elif kVireoOS_windows
        TIME_ZONE_INFORMATION timeZoneInfo;
        int rc = GetTimeZoneInformationForYear(year, nullptr, &timeZoneInfo);
        char timeZoneName[kTempCStringLength] = "UnknownTimeZone";
        if (rc != 0) {
           Int32 timeZoneOffsetMinsStandard = timeZoneInfo.Bias;
           Int32 timeZoneOffsetMinsDaylight = timeZoneInfo.Bias + timeZoneInfo.DaylightBias;
           Int32 timeZoneOffsetMins = -(GetTimeZoneOffsetSeconds(timestamp.Integer()) / 60);
           if (timeZoneOffsetMins == timeZoneOffsetMinsStandard) {
               wcstombs(timeZoneName, timeZoneInfo.StandardName, sizeof(timeZoneName));
           } else if (timeZoneOffsetMins == timeZoneOffsetMinsDaylight) {
              wcstombs(timeZoneName, timeZoneInfo.DaylightName, sizeof(timeZoneName));
           }
        }
        // timezone name is unabbreviated (on native Windows). abbreviate it
        abbreviateTimeZone(timeZoneName, timeZoneAbbr);
#endif
        Int32 days = secondsOfMonth / kSecondsPerDay;
        Int32 secondsOfHour = secondsOfMonth % kSecondsPerDay;
        Int32 hours = secondsOfHour / kSecondsPerHour;
        Int32 secondsOfMinutes = secondsOfHour % kSecondsPerHour;
        Int32 minutes = secondsOfMinutes / kSecondsPerMinute;
        seconds = secondsOfMinutes % kSecondsPerMinute;
        if (monthPtr != nullptr) {
            *monthPtr = currentMonth;
        }
        if (dayPtr != nullptr) {
            *dayPtr = days+1;
        }
        if (hourPtr != nullptr) {
            *hourPtr = hours;
        }
        if (minutePtr != nullptr) {
            *minutePtr = minutes;
        }
        if (secondPtr != nullptr) {
            *secondPtr = seconds;
        }
        if (fractionPtr != nullptr) {
            *fractionPtr = timestamp.ToDouble() - timestamp.Integer();
        }
        if (weekDayPtr != nullptr) {
            *weekDayPtr = (secondsOfYear/kSecondsPerDay + firstweekDay) % kDaysInWeek;
        }
        if (timeZoneString != nullptr) {
            if (*timeZoneString != nullptr) {
                free(*timeZoneString);
            }
            *timeZoneString = static_cast<char *>(malloc(strlen(timeZoneAbbr) + 1));
            strncpy(*timeZoneString, timeZoneAbbr, strlen(timeZoneAbbr)+1);
        }
    }

    //------------------------------------------------------------
    Date::Date(Timestamp timestamp, Int32 timeZoneOffset) {
        _timeZoneOffset = timeZoneOffset;
        _timeZoneString = nullptr;
        Timestamp local = timestamp + _timeZoneOffset;
        getDate(local, &_secondsOfYear, &_year, &_month, &_day, &_hour,
                &_minute, &_second, &_fractionalSecond, &_weekday, &_firstWeekDay, &_timeZoneString);
        _daylightSavingTime = isDaylightSavingTime();
    }

    Date::Date(Timestamp timestamp, Boolean isUTC) {
#ifdef VIREO_DATE_TIME_STDLIB
#if !kVireoOS_windows
        struct tm tm;
        time_t time = timestamp.Integer() - kStdDT1970re1904;
        if (isUTC)
            gmtime_r(&time, &tm);
        else
            localtime_r(&time, &tm);
        _timeZoneOffset = static_cast<int>(isUTC ? 0 : tm.tm_gmtoff);
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
        if (tz) {
            char timeZoneAbbr[kTempCStringLength];
            if (!isUTC && strchr(tz, ' ') == nullptr) {
                // if timezone name is abbreviated, there won't be space. True on Linux and Mac (native, node.js, and browser)
                snprintf(timeZoneAbbr, sizeof(timeZoneAbbr), "%s", tz);
            } else {
                // if timezone name is unabbreviated (True on Windows (both node.js and browser), then abbreviate it
                abbreviateTimeZone(tz, timeZoneAbbr);
            }
            _timeZoneString = static_cast<char *>(malloc(strlen(timeZoneAbbr) + 1));
            strncpy(_timeZoneString, timeZoneAbbr, strlen(timeZoneAbbr)+1);
        } else {
            _timeZoneString = nullptr;
        }
#else
        _timeZoneOffset = isUTC ? 0 : Date::getLocaletimeZone(timestamp.Integer());
        _timeZoneString = nullptr;
        Timestamp local = timestamp + _timeZoneOffset;
        getDate(local, &_secondsOfYear, &_year, &_month, &_day, &_hour,
                &_minute, &_second, &_fractionalSecond, &_weekday, &_firstWeekDay, &_timeZoneString);
        _daylightSavingTime = isDaylightSavingTime();
#endif
#endif
    }

    Timestamp Date::DateUTCToTimestamp(Int32 year, Int32 month, Int32 day, Int32 hour, Int32 minute, Int32 second, Double fracSecs) {
        Int32 baseYear = 1903;
        Int64 numberOfLeap = numberOfLeapYears(year - 1, baseYear);
        Int64 totalSeconds = numberOfLeap*kSecondsInLeapYear + (year-1 - baseYear - numberOfLeap)*kSecondsInYear;
        Int32 dayOfMonth[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
        if (isLeapYear(year))
            dayOfMonth[1] = 29;
        Int32 i;
        for (i = 0; i < month; ++i) {
            totalSeconds += dayOfMonth[i] * kSecondsPerDay;
        }
        totalSeconds += (day - 1) * kSecondsPerDay;
        totalSeconds += hour * kSecondsPerHour + minute * kSecondsPerMinute + second;
        return Timestamp(Double(totalSeconds) + fracSecs);
    }

    Date::~Date() {
        if (_timeZoneString) {
            free(_timeZoneString);
            _timeZoneString = nullptr;
        }
    }


    //------------------------------------------------------------
    Int32 Date::getLocaletimeZone(Int64 utcTime) {
// #if kVireoOS_emscripten formerly here which was using jsTimestampGetTimeZoneOffset has been deleted (03/2017);
// the localtime_r emulation works correctly
#if (kVireoOS_linuxU || kVireoOS_macosxU || kVireoOS_emscripten)
        struct tm tm;
        time_t timeVal = utcTime - kStdDT1970re1904;
        localtime_r(&timeVal, &tm);
        _systemLocaleTimeZone = static_cast<int>(tm.tm_gmtoff);
#else
        _systemLocaleTimeZone = GetTimeZoneOffsetSeconds(utcTime);
#endif
        return _systemLocaleTimeZone;
    }

    //------------------------------------------------------------
    Int32 Date::isDaylightSavingTime() {
        return 0;
    }
#endif
}  // namespace Vireo

