/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
 */

#include "TypeDefiner.h"
#include "Timestamp.h"
#include "TDCodecVia.h"
#include "ExecutionContext.h"

#include <math.h> /* fabs */
#include <float.h> /* DBL_EPSILON */

#if defined(VIREO_DATE_TIME_STDLIB)
#if kVireoOS_win32U
    #include <windows.h>
    #include <time.h>
#else
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

namespace Vireo
{
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(GetTickCount, Int64)
{
    _Param(0) = gPlatform.Timer.TickCount();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCount, Int64)
{
    _Param(0) = gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCount, UInt32)
{
    _Param(0) = (UInt32) gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
    return _NextInstruction();
}

#if defined(VIREO_TYPE_Timestamp)
/* Localize the warnings for float comparison to one place
 see http://www.codeguru.com/forum/showthread.php?t=323835 */
enum FloatComparisonMethod {
    FloatComparisonExact,
    FloatComparisonWithinEpsilon
};

// January 1, 1904 (the epoch of AbsTime128) in FILETIME
static const Timestamp k_1904FileTime = Timestamp(0x0153b281e0fb4000ull, 0);
#if 0
Timestamp ATime128FromHILOTime(const uInt32 &high, const uInt32 &low)
{
    NITime temp(high, low, 0, 0);
    temp -= k_1904FileTime;
    return Timestamp(temp /1E7);
}
#endif

/**
 Functions for getting Timestamps
  */
void GetCurrentTimestamp(Timestamp *t)
{
#if WIN32
    struct timeval tv;
    Int32 retval;
    FILETIME ft;
    UInt64    stdTime = 0;

    GetSystemTimeAsFileTime(&ft);

    stdTime |= ft.dwHighDateTime;
    stdTime <<= 32;
    stdTime |= ft.dwLowDateTime;

    stdTime -= 11644473600000000Ui64;    // DELTA_EPOCH_IN_MICROSECS
    stdTime /= 10;                        // Convert to microseconds
    *t = Timestamp((Double)(stdTime/1000000UL), (stdTime % 1000000UL) / 1E6);

#elif defined(VIREO_DATE_TIME_STDLIB)
    static const UInt32 kStdDT1970re1904 = 2082844800;
    struct timeval tv;
    Int32 retval;

    retval = gettimeofday(&tv, null);
    if (retval == -1) {
        *t = Timestamp(0, 0);
    } else {
        *t = Timestamp((Double)tv.tv_sec + kStdDT1970re1904, tv.tv_usec / 1E6);
    }
#elif defined(VIREO_DATE_TIME_VXWORKS)
    struct timespec ts;
    Int32 retval;

    retval = clock_gettime(CLOCK_REALTIME, &ts);
    if (retval == -1) {
        *t = Timestamp(0.0);
    } else {
        uInt32 tempTime = static_cast<uInt32>(ts.tv_sec);
        TToStd(&tempTime);
        *t = Timestamp(static_cast<Double>(tempTime), ts.tv_nsec / 1E9);
    }
#endif
}
//------------------------------------------------------------
Timestamp::Timestamp(double seconds)
{
    if (seconds > 0) {
        Double wholeSeconds = floor(seconds);
        _integer = (Int64)wholeSeconds;
        // Conceptually is 2^65 * fractional part though the double will only have ~15 digits
        _fraction = (UInt64) (18446744073709551616.0 * (seconds - wholeSeconds));
    } else {
        Double wholeSeconds = ceil(seconds);
        _integer = (Int64)wholeSeconds;
        _fraction = (UInt64) (18446744073709551616.0 * (seconds - wholeSeconds));
    }
}
//------------------------------------------------------------
Double Timestamp::ToDouble() const
{
    Double wholeSeconds = (Double)this->Integer();
    Double fractionalSeconds = (Double)this->_fraction * (1.0 / 18446744073709551616.0);
    return wholeSeconds + fractionalSeconds;
}
//------------------------------------------------------------
Timestamp const Timestamp::operator+(const Int64& value)
{
    Timestamp answer;
    answer._integer = _integer + value;
    answer._fraction = _fraction;
    return answer;
}
//------------------------------------------------------------
Timestamp const Timestamp::operator+(const Timestamp& value)
{
    Timestamp answer;
    answer._integer = _integer + value._integer;
    answer._fraction = _fraction + value._fraction;
    if (answer._fraction < _fraction) {
        answer._integer++;
    }
    return answer;
}
//------------------------------------------------------------
Timestamp const Timestamp::operator-(const Timestamp& value)
{
    Timestamp answer;
    answer._integer = _integer - value._integer;
    answer._fraction = _fraction - value._fraction;
    if (answer._fraction > _fraction) {
        answer._integer--;
    }
    return answer;
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(SubTimestamp, Timestamp, Timestamp, Double)
{
    Timestamp diff = _Param(0) - _Param(1);
    _Param(2) = diff.ToDouble();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AddTimestampDoubleR, Timestamp, Double, Timestamp)
{
    Timestamp delta(_Param(1));
    _Param(2) = _Param(0) + delta;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AddTimestampDoubleL, Double, Timestamp, Timestamp)
{
    Timestamp delta(_Param(0));
    _Param(2) = delta + _Param(1);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AddTimestampInt32R, Timestamp, Int32, Timestamp)
{
    _Param(2) = _Param(0) + _Param(1);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AddTimestampInt32L, Int32, Timestamp, Timestamp)
{
    _Param(2) = _Param(1) + _Param(0);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(IsLTTimestamp, Timestamp, Timestamp, Boolean)
{
    _Param(2) = _Param(0) < _Param(1);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(IsLETimestamp, Timestamp, Timestamp, Boolean)
{
    _Param(2) = _Param(0) <= _Param(1);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(IsGTTimestamp, Timestamp, Timestamp, Boolean)
{
    _Param(2) = _Param(0) > _Param(1);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(IsGETimestamp, Timestamp, Timestamp, Boolean)
{
    _Param(2) = _Param(0) >= _Param(1);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(GetTimestamp, Timestamp)
{
    GetCurrentTimestamp(_ParamPointer(0));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TimestampConvertDouble, Timestamp, Double)
{
    _Param(1) = _Param(0).ToDouble();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(ToTimestamp, Double, Timestamp)
{
    _Param(1) = Timestamp(_Param(0));
    return _NextInstruction();
}
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
void getDate(Timestamp timestamp, Int64* secondofYearPtr, Int32* yearPtr,
             Int32* monthPtr = NULL, Int32* dayPtr = NULL, Int32* hourPtr = NULL,
             Int32* minPtr = NULL, Int32* secondPtr = NULL, Double* fractionPtr = NULL,
             Int32* weekPtr = NULL, Int32* weekOfFirstDay = NULL, ConstCStr* timeZoneString = NULL)
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
    // Not implemented for Win32 yet
    _SystemLocaletimeZone = 0;
#endif
    return _SystemLocaletimeZone;
};
//------------------------------------------------------------
Int32 Date::isDTS()
{
    return 0;
}
#endif


DEFINE_VIREO_BEGIN(Timestamp)
    DEFINE_VIREO_REQUIRE(IEEE754Math)

    // Low level time functions
    DEFINE_VIREO_FUNCTION(GetTickCount, "p(o(Int64))")
    DEFINE_VIREO_FUNCTION(GetMicrosecondTickCount, "p(o(Int64))")
    DEFINE_VIREO_FUNCTION(GetMillisecondTickCount, "p(o(UInt32))")

#if defined(VIREO_TYPE_Timestamp)
    DEFINE_VIREO_TYPE(Timestamp, "c(e(Int64 seconds) e(UInt64 fraction))")
    DEFINE_VIREO_FUNCTION(GetTimestamp, "p(o(Timestamp))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsLT, IsLTTimestamp, "p(i(Timestamp) i(Timestamp) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsLE, IsLETimestamp, "p(i(Timestamp) i(Timestamp) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsGE, IsGETimestamp, "p(i(Timestamp) i(Timestamp) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsGT, IsGTTimestamp, "p(i(Timestamp) i(Timestamp) o(Boolean))")

    DEFINE_VIREO_FUNCTION_CUSTOM(Add, AddTimestampInt32R, "p(i(Timestamp) i(Int32) o(Timestamp))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Add, AddTimestampInt32L, "p(i(Int32) i(Timestamp) o(Timestamp))")
#if defined(VIREO_TYPE_Double)
    DEFINE_VIREO_FUNCTION_CUSTOM(Sub, SubTimestamp, "p(i(Timestamp) i(Timestamp)o(Double))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Add, AddTimestampDoubleL, "p(i(Double)i(Timestamp)o(Timestamp))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Add, AddTimestampDoubleR, "p(i(Timestamp)i(Double)o(Timestamp))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, TimestampConvertDouble, "p(i(Timestamp) o(Double))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, ToTimestamp, "p(i(Double) o(Timestamp))")
#endif
#endif

DEFINE_VIREO_END()
}  // namespace Vireo
