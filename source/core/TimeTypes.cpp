/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include "TypeDefiner.h"
#include "TimeTypes.h"

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
#include <Windows.h>
#elif kVireoOS_macosxU
#include <pthread.h>
#include <time.h>
#include <mach/mach_time.h>
#elif (kVireoOS_linuxU)
#include <pthread.h>
#include <time.h>
#elif kVireoOS_ZynqARM
#include "xscutimer.h"
#elif kVireoOS_emscripten
#include <emscripten.h>
#endif



using namespace Vireo;

namespace Vireo
{
//------------------------------------------------------------
PlatformTickType PlatformTime::TickCount()
{
#if defined(_WIN32) || defined(_WIN64)

    // System returns 100ns count.
	FILETIME now;
	GetSystemTimeAsFileTime(&now);
	return now.dwLowDateTime;

#elif (kVireoOS_macosxU)

    return mach_absolute_time();
    
#elif (kVireoOS_wiring)

    return micros();

#elif (kVireoOS_linuxU)

    timespec time;
    clock_gettime(CLOCK_MONOTONIC, &time);
    return ((Int64)time.tv_sec * 1000000000) + (Int64)time.tv_nsec;

#elif (kVireoOS_emscripten)

    // milliseconds
    return (PlatformTickType) emscripten_get_now();

#elif (kVireoOS_ZynqARM)

    // Hard coded to the max Zynq7000 clock rate for now.
    // the clock register is only 32 bits so it can wrap around
    // pretty quick, depending on the prescalar.
	static Int64 TickCount;
    XScuTimer_Config*   pConfig;
    volatile UInt64     scuTickCount;
    static UInt64		lastScuTickCount = 0;
    static XScuTimer    Timer;
    static XScuTimer 	*pTimer = NULL;
    
    if (!pTimer) {
        pTimer = &Timer;
        
        pConfig = XScuTimer_LookupConfig(XPAR_XSCUTIMER_0_DEVICE_ID);
        
        Int32 reply = XScuTimer_CfgInitialize(pTimer, pConfig, pConfig->BaseAddr);
        if (reply != XST_SUCCESS) {
            return 0;
        }
        
        XScuTimer_SetPrescaler(pTimer, 10);
        XScuTimer_LoadTimer(pTimer, 0xFFFFFFFF);
        XScuTimer_EnableAutoReload(pTimer);
        XScuTimer_Start(pTimer);
        lastScuTickCount = ((UInt64)XScuTimer_GetCounterValue(pTimer));
    }
    
    scuTickCount = ((UInt64)XScuTimer_GetCounterValue(pTimer));
    
    if (scuTickCount > lastScuTickCount) {
    	// Wrapped around, the last one should be close to 0
    	// the current one should be close to max Int32
        TickCount += lastScuTickCount + (0xFFFFFFFF - scuTickCount);
    } else {
        TickCount += (lastScuTickCount - scuTickCount);
    }
    lastScuTickCount = scuTickCount;
    return TickCount;
    
#else
#error MicroSecondCount not defined
    return 0;
#endif
}

//------------------------------------------------------------
PlatformTickType PlatformTime::MicrosecondsFromNowToTickCount(Int64 microsecondCount)
{
    return PlatformTime::TickCount() + PlatformTime::MicrosecondsToTickCount(microsecondCount);
}
//------------------------------------------------------------
PlatformTickType PlatformTime::MillisecondsFromNowToTickCount(Int64 millisecondCount)
{
    return PlatformTime::TickCount() + PlatformTime::MicrosecondsToTickCount(millisecondCount * 1000);
}
//------------------------------------------------------------
PlatformTickType PlatformTime::SecondsToTickCount(Double seconds)
{
    return MicrosecondsToTickCount(seconds * 1000000.0);
}
//------------------------------------------------------------
PlatformTickType PlatformTime::MicrosecondsToTickCount(Int64 microseconds)
{
#if defined(_WIN32) || defined(_WIN64)
    
	// Windows filetime base tick count is 100ns
    return microseconds * 10;
    
#elif (kVireoOS_macosxU)
    
    // Scaling according to the kernel parameters.
    static mach_timebase_info_data_t    sTimebaseInfo = {0,0};
    if (sTimebaseInfo.denom == 0) {
        (void) mach_timebase_info(&sTimebaseInfo);
    }
    return (microseconds * 1000) * sTimebaseInfo.denom / sTimebaseInfo.numer;
    
#elif (kVireoOS_wiring)
    
    // tick count is microseconds for arduino's wiring
    return ticks;
    
#elif (kVireoOS_linuxU)
    
    // tick count is nanoseconds for linux
    return microseconds * 1000;
    
#elif (kVireoOS_emscripten)
    
    // Scale milliseconds to microseconds
    return microseconds / 1000;
    
#elif (kVireoOS_ZynqARM)
    
    // Still experimental.
    return microseconds * 333333 / 10000;
    
#else
#error MicroSecondCount not defined
    return 0;
#endif
}
//------------------------------------------------------------
Int64 PlatformTime::TickCountToMilliseconds(PlatformTickType ticks)
{
    return (TickCountToMicroseconds(ticks) / 1000);
}
//------------------------------------------------------------
Int64 PlatformTime::TickCountToMicroseconds(PlatformTickType ticks)
{
#if defined(_WIN32) || defined(_WIN64)

	// Windows filetime base tick count is 100ns
    return ticks / 10;
    
#elif (kVireoOS_macosxU)

    // Get scale factor used to convert to nanoseconds
    static mach_timebase_info_data_t    sTimebaseInfo = {0,0};
    if (sTimebaseInfo.denom == 0) {
        (void) mach_timebase_info(&sTimebaseInfo);
    }
    return (ticks * sTimebaseInfo.numer / sTimebaseInfo.denom) / 1000;
    
#elif (kVireoOS_wiring)

    // tick count is microseconds for arduino's wiring
    return ticks;
    
#elif (kVireoOS_linuxU)

    // tick count is nanoseconds for linux
    return ticks / 1000;
    
#elif (kVireoOS_emscripten)

    // Scale milliseconds to microseconds
    return ticks * 1000;
    
#elif (kVireoOS_ZynqARM)

    // Still experimental.
    return ticks * 10000 / 333333;

#else
#error MicroSecondCount not defined
    return 0;
#endif
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(GetTickCount, Int64)
{
    _Param(0) = PlatformTime::TickCount();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCount, Int64)
{
    _Param(0) = PlatformTime::TickCountToMicroseconds(PlatformTime::TickCount());
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCount, UInt32)
{
    _Param(0) = (UInt32) PlatformTime::TickCountToMilliseconds(PlatformTime::TickCount());
    return _NextInstruction();
}

#if defined(VIREO_TYPE_ATime)
/* Localize the warnings for float comparison to one place
 see http://www.codeguru.com/forum/showthread.php?t=323835 */
enum FloatComparisonMethod {
    FloatComparisonExact,
    FloatComparisonWithinEpsilon
};

// January 1, 1904 (the epoch of AbsTime128) in FILETIME
static const ATime128 k_1904FileTime = ATime128(0x0153b281e0fb4000ull, 0);
#if 0
ATime128 ATime128FromHILOTime(const uInt32 &high,const uInt32 &low)
{
	NITime temp(high,low, 0,0);
	temp -= k_1904FileTime;
	return ATime128(temp /1E7);
}
#endif

/**
 Functions for getting TimeStamp
 */
void GetCurrentATime128(ATime128 *t)
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

	stdTime -= 11644473600000000Ui64;	// DELTA_EPOCH_IN_MICROSECS
	stdTime /= 10;						// Convert to microseconds
	*t = ATime128( (Double) (stdTime/1000000UL), (stdTime % 1000000UL) / 1E6);

#elif defined(VIREO_DATE_TIME_STDLIB)
	struct timeval tv;
	Int32 retval;
 
	retval = gettimeofday(&tv, null);
	if (retval == -1)
		*t = ATime128(0,0);
	else {
	//	uInt32 tempTime = (uInt32) tv.tv_sec;
	//	TToStd(&tempTime);
		*t = ATime128( (Double) tv.tv_sec, tv.tv_usec / 1E6);
	}
#elif defined(VIREO_DATE_TIME_VXWORKS)
    struct timespec ts;
    Int32 retval;

    retval = clock_gettime(CLOCK_REALTIME, &ts);
    if (retval == -1)
    *t = ATime128(0.0);
    else {
        uInt32 tempTime = static_cast<uInt32>(ts.tv_sec);
        TToStd(&tempTime);
        *t = ATime128( static_cast<Double>(tempTime), ts.tv_nsec / 1E9);

#endif
}

/*
DECLARE_VIREO_PRIMITIVE3( AddTime,    Fixed128f64, Fixed128f64, Fixed128f64, (_Param(2) = _Param(0) + _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( SubTime,    Fixed128f64, Fixed128f64, Fixed128f64, (_Param(2) = _Param(0) - _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( LTTime,     Fixed128f64, Fixed128f64, bool,        (_Param(2) = _Param(0) < _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( LTEQTime,   Fixed128f64, Fixed128f64, bool,        (_Param(2) = _Param(0) <= _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( EQTime,     Fixed128f64, Fixed128f64, bool,        (_Param(2) = _Param(0) == _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( GTTime,     Fixed128f64, Fixed128f64, bool,        (_Param(2) = _Param(0) > _Param(1)) )
DECLARE_VIREO_PRIMITIVE3( GTEQTime,   Fixed128f64, Fixed128f64, bool,        (_Param(2) = _Param(0) >= _Param(1)) )
*/
Int64 getYear(Int64 wholeSeconds, Int64* yearSeconds)
{
	// Labview don't consider the leap second
	Int64 secondsInyear = 31536000;
	Int64 secondsInLeap = 31622400;
	Int64 startYear = 1903;

	Int64 baseYear = 1903;
	Int64 currentYear = baseYear;
	Int64 yearMax = wholeSeconds/secondsInyear;
	Int64 yearMin = wholeSeconds/secondsInLeap;

	if (wholeSeconds>=0) {
		for (Int64 i = yearMin; i <= yearMax; i++) {
			Int64 year = startYear + i;
			Int64 numberOfLeap = 0;
			numberOfLeap = year/4 - year/100 + year/400 - (baseYear/4-baseYear/100+baseYear/400);
			Int64 totalSeconds = numberOfLeap*secondsInLeap + (i-numberOfLeap)*secondsInyear;
			Int64 nextyear = startYear + i +1;
			numberOfLeap = nextyear/4 - nextyear/100 + nextyear/400 - (baseYear/4-baseYear/100+baseYear/400);
			Int64 totalSecondsNext = numberOfLeap*secondsInLeap + (i+1-numberOfLeap)*secondsInyear;

			if (totalSeconds <= wholeSeconds && wholeSeconds < totalSecondsNext) {
				currentYear = nextyear;
				*yearSeconds = wholeSeconds - totalSeconds;
				break;
			}
		}
	} else if (wholeSeconds<0) {
		for (Int64 i = yearMax; i <= yearMin; i++) {
			Int64 year = startYear + i;
			Int64 numberOfLeap = 0;
			numberOfLeap = year/4 - year/100 + year/400 - (baseYear/4-baseYear/100+baseYear/400);
			Int64 totalSeconds = numberOfLeap*secondsInLeap + (i-numberOfLeap)*secondsInyear;
			Int64 previousyear = startYear + i - 1;
			numberOfLeap = (previousyear/4 - previousyear/100 + previousyear/400) - (baseYear/4-baseYear/100+baseYear/400);
			Int64 totalSecondsPrevious = numberOfLeap*secondsInLeap + (i-1-numberOfLeap)*secondsInyear;

			if (totalSecondsPrevious <= wholeSeconds && wholeSeconds < totalSeconds) {
				currentYear = year;
				// this will make sure the *yearSeconds is always positive
				*yearSeconds = wholeSeconds - totalSecondsPrevious;
				break;
			}

		}
	} else {
		*yearSeconds = 0;
		currentYear = 1904;
	}
	return currentYear;
}

void getDate(Int64 wholeSecond, Int64* yearPtr, Int64* monthPtr = NULL, Int64* dayPtr = NULL, Int64* hourPtr = NULL, Int64* minPtr = NULL, Int64* secondPtr = NULL)
{
	Int64 secondsofYear;
	Int64 year = getYear(wholeSecond, &secondsofYear);
	if (yearPtr!= NULL) {
		*yearPtr = year;
	}
	printf("seconds of year %d\n", secondsofYear);
	Int64 currentMonth = -2;
	Int64 secondsofMonth = -2;
	if(year%4==0 && (year%100 != 0 || year%400 == 0)) {
		// leap year
		int dayofMonth[]={31, 29,31,30,31,30,31,31,30,31,30,31};
		Int64 seconds=0;
		for (Int64 i = 0;i<12;i++) {
			secondsofMonth = seconds;
			seconds+=24*3600*dayofMonth[i];
			if (seconds > secondsofYear) {
				currentMonth = i;
				secondsofMonth = secondsofYear - secondsofMonth;
				break;
			}
		}
	} else {
		int dayofMonth[]={31, 28,31,30,31,30,31,31,30,31,30,31};
		Int64 seconds=0;
		for (Int64 i = 0;i<12;i++) {
			secondsofMonth = seconds;
			seconds+=24*3600*dayofMonth[i];
			if (seconds > secondsofYear) {
				currentMonth = i;
				secondsofMonth = secondsofYear - secondsofMonth;
				break;
			}
		}
	}
	Int64 days = secondsofMonth/(24*3600);
	Int64 secondsofHour = secondsofMonth%(24*3600);
	Int64 hours = secondsofHour/3600;
	Int64 secondsofMinutes = secondsofHour%(3600);
	Int64 minutes = secondsofMinutes/60;
	Int64 seconds= secondsofMinutes%60;
	if (monthPtr!=NULL) {
		*monthPtr = currentMonth;
	}
	if (dayPtr != NULL) {
		*dayPtr = days;
	}
	if (hourPtr!=NULL) {
		*hourPtr = hours;
	}
	if (minPtr!=NULL) {
		*minPtr = minutes;
	}
	if (secondPtr !=NULL) {
		*secondPtr = seconds;
	}
 }

VIREO_FUNCTION_SIGNATURE1(ATimeGetCurrent, ATime128)
{
    GetCurrentATime128(_ParamPointer(0));
    return _NextInstruction();
}

#if defined(VIREO_TYPE_Double)
VIREO_FUNCTION_SIGNATURE3(ATimeFromDoubleDouble, Double, Double, ATime128)
{
    _Param(2) = ATime128(_Param(0), _Param(1));
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(ATimeGetSecondsDouble, ATime128, Double)
{
    _Param(1) = _Param(0).Seconds();
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(ATimeGetFractionDouble, ATime128, Double)
{
    _Param(1) = _Param(0).FractionOfSecond();
    return _NextInstruction();
}
#endif

VIREO_FUNCTION_SIGNATURE3(ATimeFromInt64UInt64, Int64, UInt64, ATime128)
{
    _Param(2) = ATime128(_Param(0), _Param(1));
    return _NextInstruction();
}
#if 0
VIREO_FUNCTION_SIGNATURE1(ATimeIncrementLSB, ATime128)
{
   _Param(0).IncrementLSB();
    return _NextInstruction();
}
#endif
    
VIREO_FUNCTION_SIGNATURE2(ATimeGetSecondsInt64, ATime128, Int64)
{
    _Param(1) = _Param(0).SecondsInt64();
    return _NextInstruction();
}


VIREO_FUNCTION_SIGNATURE2(ATimeGetFractionUInt64, ATime128, UInt64)
{
    _Param(1) = _Param(0).FractionUIn64();
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(ATimeSetSecondsInt64, ATime128, Int64)
{
   // _Param(0).SetInt64Seconds(_Param(1));
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(ATimeSetFractionUInt64, ATime128, UInt64)
{
   // _Param(0).SetUInt64Fraction(_Param(1));
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE4(FormatDateTimeString, StringRef, StringRef, ATime128, Boolean)
{
	Int64 wholeSeconds = _Param(2).Integer();
	printf("wholeSeconds :%d\n", wholeSeconds);
	UInt64 fraction = _Param(2).Fraction();
	Int64 year, month, day, hour, min, second;
	getDate(wholeSeconds, &year, &month, &day, &hour, &min, & second);
	printf("year:%d, month %d, day %d, hour%d, min %d, second %d\n", year,month+1, day,hour,min,second);
	return _NextInstruction();
}

#endif

DEFINE_VIREO_BEGIN(Time)
/*
    DEFINE_VIREO_FUNCTION(AddTime, "p(i(.Time) i(.Time) o(.Time))")
    DEFINE_VIREO_FUNCTION(SubTime, "p(i(.Time) i(.Time) o(.Time))")
    DEFINE_VIREO_FUNCTION(LTTime, "p(i(.Time) i(.Time) o(.Boolean))")
    DEFINE_VIREO_FUNCTION(LTEQTime, "p(i(.Time) i(.Time) o(.Boolean))")
    DEFINE_VIREO_FUNCTION(EQTime, "p(i(.Time) i(.Time) o(.Boolean))")
    DEFINE_VIREO_FUNCTION(GTTime, "p(i(.Time) i(.Time) o(.Boolean))")
    DEFINE_VIREO_FUNCTION(GTEQTime, "p(i(.Time) i(.Time) o(.Boolean))")
*/

    DEFINE_VIREO_FUNCTION(GetTickCount, "p(o(.Int64))")
    DEFINE_VIREO_FUNCTION(GetMicrosecondTickCount, "p(o(.Int64))")
    DEFINE_VIREO_FUNCTION(GetMillisecondTickCount, "p(o(.UInt32))")

#if defined(VIREO_TYPE_ATime)
#if defined(VIREO_TYPE_Double)
    DEFINE_VIREO_FUNCTION(ATimeFromDoubleDouble, "p(i(.Double) i(.Double) o(.Time))")
    DEFINE_VIREO_FUNCTION(ATimeGetSecondsDouble, "p(i(.Time) o(.Double))")
    DEFINE_VIREO_FUNCTION(ATimeGetFractionDouble, "p(i(.Time) o(.Double))")
#endif

    DEFINE_VIREO_FUNCTION(ATimeFromInt64UInt64, "p(i(.Int64) i(.UInt64) o(.Time))")
    DEFINE_VIREO_FUNCTION(ATimeGetCurrent, "p(o(.Time))")
 // DEFINE_VIREO_FUNCTION(ATimeIncrementLSB, "p(e(.Time))")  //TODO input instead of inplace
    DEFINE_VIREO_FUNCTION(ATimeGetSecondsInt64, "p(i(.Time) o(.Int64))")
    DEFINE_VIREO_FUNCTION(ATimeGetFractionUInt64, "p(i(.Time) o(.UInt64))")
    DEFINE_VIREO_FUNCTION(ATimeSetSecondsInt64, "p(i(.Time) o(.Int64))")
    DEFINE_VIREO_FUNCTION(ATimeSetFractionUInt64, "p(i(.Time) o(.UInt64))")
    DEFINE_VIREO_FUNCTION(FormatDateTimeString, "p(o(.String) i(.String) i(.Time) i(.Boolean))")
#endif

DEFINE_VIREO_END()

}

