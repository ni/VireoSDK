// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file Timestamp implementation file
 */

#include "BuildConfig.h"
#include "TypeDefiner.h"
#include "Timestamp.h"
#include "TDCodecVia.h"
#include "ExecutionContext.h"

#include <cmath> /* fabs */
#include <cfloat> /* DBL_EPSILON */

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

#if kVireoOS_windows
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

namespace Vireo
{
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
    Timestamp ATime128FromHILOTime(const uInt32 &high, const uInt32 &low) {
        NITime temp(high, low, 0, 0);
        temp -= k_1904FileTime;
        return Timestamp(temp /1E7);
    }
    #endif

    /**
     Functions for getting Timestamps
      */
    void Timestamp::GetCurrentTimestamp(Timestamp *t) {
    #if kVireoOS_win32U
        FILETIME ft;
        UInt64    stdTime = 0;

        GetSystemTimeAsFileTime(&ft);

        stdTime |= ft.dwHighDateTime;
        stdTime <<= 32;
        stdTime |= ft.dwLowDateTime;

        stdTime -= 11644473600000000Ui64;    // DELTA_EPOCH_IN_MICROSECS
        stdTime /= 10;                        // Convert to microseconds
        *t = Timestamp(stdTime / 1E6);

    #elif defined(VIREO_DATE_TIME_STDLIB)
        struct timeval tv;
        Int32 retval;

        retval = gettimeofday(&tv, nullptr);
        if (retval == -1) {
            *t = Timestamp(0, 0);
        } else {
            *t = Timestamp(tv.tv_sec + kStdDT1970re1904 + (tv.tv_usec / 1E6));
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
            *t = Timestamp(static_cast<Double>(tempTime) + (ts.tv_nsec / 1E9));
        }
    #endif
    }

    //------------------------------------------------------------
    Timestamp::Timestamp(double seconds) {
        if (seconds > 0) {
            Double wholeSeconds = floor(seconds);
            _integer = (Int64)wholeSeconds;
            // Conceptually is 2^65 * fractional part though the double will only have ~15 digits
            _fraction = (UInt64)(18446744073709551616.0 * (seconds - wholeSeconds));
        } else {
            Double wholeSeconds = ceil(seconds);
            _integer = (Int64)wholeSeconds;
            _fraction = (UInt64)(18446744073709551616.0 * (seconds - wholeSeconds));
        }
    }
    //------------------------------------------------------------
    Timestamp::Timestamp(Double fracSecs, Int32 sec, Int32 min, Int32 hour, Int32 day, Int32 month, Int32 year) {
        // We no longer use timegm/mktime/_mkgmtime here because of limitations on various platforms.
        // Mac can't handle dates before 1901, even though time_t is signed 64-bit.
        // Windows can't handle dates before 1970; time_t is unsigned 64-bit.
        // We now use a simplified variant of mktime implemented in Date::DateUTCToTimestamp().
        // It can't handle converting using tm_wday, tm_yday fields or DST/TZ like mktime, but we don't need this.
        Timestamp ts = Date::DateUTCToTimestamp(year, month-1, day, hour, min, sec, fracSecs);
        *this = ts;
      }
    //------------------------------------------------------------
    Double Timestamp::ToDouble() const {
        Double wholeSeconds = (Double)this->Integer();
        Double fractionalSeconds = (Double)this->_fraction * (1.0 / 18446744073709551616.0);
        return wholeSeconds + fractionalSeconds;
    }
    //------------------------------------------------------------
    Timestamp Timestamp::operator+(const Int64& value) const {
        Timestamp answer;
        answer._integer = _integer + value;
        answer._fraction = _fraction;
        return answer;
    }
    //------------------------------------------------------------
    Timestamp Timestamp::operator-(const Int64& value) const {
        Timestamp answer;
        answer._integer = _integer - value;
        answer._fraction = _fraction;
        return answer;
    }
    //------------------------------------------------------------
    Timestamp Timestamp::operator+(const Timestamp& value) const {
        Timestamp answer;
        answer._integer = _integer + value._integer;
        answer._fraction = _fraction + value._fraction;
        if (answer._fraction < _fraction) {
            answer._integer++;
        }
        return answer;
    }
    //------------------------------------------------------------
    Timestamp Timestamp::operator-(const Timestamp& value) const {
        Timestamp answer;
        answer._integer = _integer - value._integer;
        answer._fraction = _fraction - value._fraction;
        if (answer._fraction > _fraction) {
            answer._integer--;
        }
        return answer;
    }
#endif

}  // namespace Vireo
