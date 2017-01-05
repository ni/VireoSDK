/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file Time and date related functions for Vireo
 */

#include "TypeDefiner.h"
#include "TDCodecVia.h"
#include "ExecutionContext.h"
#include "Timestamp.h"
#include "Date.h"
#include "LVDateTimeRecord.h"

namespace Vireo {
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTickCount, Int64)
    {
        _Param(0) = gPlatform.Timer.TickCount();
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTickCountUInt32, UInt32)
    {
        _Param(0) = (UInt32)gPlatform.Timer.TickCount();
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTickCountUInt16, UInt16)
    {
        _Param(0) = (UInt16)gPlatform.Timer.TickCount();
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTickCountUInt8, UInt8)
    {
        _Param(0) = (UInt8)gPlatform.Timer.TickCount();
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCount, Int64)
    {
        _Param(0) = gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCountUInt32, UInt32)
    {
        _Param(0) = (UInt32) gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCountUInt16, UInt16)
    {
        _Param(0) = (UInt16)gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCountUInt8, UInt8)
    {
        _Param(0) = (UInt8)gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCount, UInt32)
    {
        _Param(0) = (UInt32) gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCountUInt16, UInt16)
    {
        _Param(0) = (UInt16)gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCountUInt8, UInt8)
    {
        _Param(0) = (UInt8)gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }

#if defined(VIREO_TYPE_Timestamp)
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
        Timestamp::GetCurrentTimestamp(_ParamPointer(0));
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
    VIREO_FUNCTION_SIGNATURE2(DateTimeToTimestamp, LVDateTimeRec, Timestamp)
    {
        LVDateTimeRec *dt = _ParamPointer(0);
        Timestamp timestamp(dt->fractional_secs, dt->second, dt->minute, dt->hour, dt->day_of_month, dt->month, dt->year);
        _Param(1) = timestamp;
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE2(TimestampToDateTime, Timestamp, LVDateTimeRec)
    {
        Timestamp timestamp = _Param(0);
        LVDateTimeRec *dt = _ParamPointer(1);
        Int32 firstWeekDay = 0;
        Int64 secondsOfYear = 0;
        Date::getDate(timestamp, &secondsOfYear, &dt->year,
                &dt->month, &dt->day_of_month, &dt->hour,
                &dt->minute, &dt->second, &dt->fractional_secs,
                &firstWeekDay, NULL, NULL);
        ++dt->day_of_month;
        ++dt->month;
        dt->day_of_year = Int32(secondsOfYear / (24*60*60));
        dt->day_of_week = (firstWeekDay+1) % 7 + 1;
        ++dt->day_of_year;
        return _NextInstruction();
    }
    VIREO_FUNCTION_SIGNATURE5(GetDateTimeString, Timestamp, Boolean, Int32, StringRef, StringRef) {
        Timestamp timestamp;
        Boolean useUTC = true; // add as argument?
        if (_ParamPointer(0))
            timestamp = _Param(0);
        else
            Timestamp::GetCurrentTimestamp(&timestamp);
        Boolean useSeconds = _ParamPointer(1) ? _Param(1) : false;
        Int32 format = _ParamPointer(2) ? _Param(2) : 0;
        StringRef *dateStr = _ParamPointer(3);
        StringRef *timeStr = _ParamPointer(4);
        Int32 tz = Date::getLocaletimeZone();
        Date date(timestamp, tz);
        TempStackCString formatString;
        SubString tempFormat;
        if (dateStr) {
            if (format == 0)
                formatString.AppendCStr("%#x");
            else if (format == 1)
                formatString.AppendCStr("%A, %B %#d, %Y");
            else
                formatString.AppendCStr("%a, %b %#d, %Y");
            tempFormat.AliasAssign(formatString.Begin(), formatString.End());
            (*dateStr)->Resize1D(0);
            DateTimeToString(date, useUTC, &tempFormat, *dateStr);
        }
        if (timeStr) {
            formatString.Clear();
            formatString.AppendCStr(useSeconds ? "%#I:%M:%S %p" : "%#I:%M %p");
            tempFormat.AliasAssign(formatString.Begin(), formatString.End());
            (*timeStr)->Resize1D(0);
            DateTimeToString(date, useUTC, &tempFormat, *timeStr);
        }
        return _NextInstruction();
    }
#endif

DEFINE_VIREO_BEGIN(Timestamp)
    DEFINE_VIREO_REQUIRE(IEEE754Math)

    // Low level time functions
    DEFINE_VIREO_FUNCTION(GetTickCount, "p(o(Int64))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetTickCount, GetTickCountUInt32, "p(o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetTickCount, GetTickCountUInt16, "p(o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetTickCount, GetTickCountUInt8, "p(o(UInt8))")
    DEFINE_VIREO_FUNCTION(GetMicrosecondTickCount, "p(o(Int64))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetMicrosecondTickCount, GetMicrosecondTickCountUInt32, "p(o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetMicrosecondTickCount, GetMicrosecondTickCountUInt16, "p(o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetMicrosecondTickCount, GetMicrosecondTickCountUInt8, "p(o(UInt8))")
    DEFINE_VIREO_FUNCTION(GetMillisecondTickCount, "p(o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetMillisecondTickCount, GetMillisecondTickCountUInt16, "p(o(UInt16))")
    DEFINE_VIREO_FUNCTION_CUSTOM(GetMillisecondTickCount, GetMillisecondTickCountUInt8, "p(o(UInt8))")

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

#define kLVDateTimeTypeStr  "c(e(Double fractional_sec) e(Int32 second) e(Int32 minute) e(Int32 hour) e(Int32 day_of_month) e(Int32 month) e(Int32 year) e(Int32 day_of_week) e(Int32 day_of_year) e(Int32 dst))"
    DEFINE_VIREO_TYPE(LVDateTimeRec, kLVDateTimeTypeStr);
    DEFINE_VIREO_FUNCTION(DateTimeToTimestamp, "p(i(" kLVDateTimeTypeStr ") o(Timestamp))")
    DEFINE_VIREO_FUNCTION(TimestampToDateTime, "p(i(Timestamp) o(" kLVDateTimeTypeStr "))")
    DEFINE_VIREO_FUNCTION(GetDateTimeString, "p(i(Timestamp) i(Boolean) i(Int32) o(String) o(String))");
#endif
#endif

DEFINE_VIREO_END()
}  // namespace Vireo
