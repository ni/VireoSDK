// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
    VIREO_FUNCTION_SIGNATURE1(GetTickCount, Int64) {
        _Param(0) = gPlatform.Timer.TickCount();
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTickCountUInt32, UInt32) {
        _Param(0) = (UInt32)gPlatform.Timer.TickCount();
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTickCountUInt16, UInt16) {
        _Param(0) = (UInt16)gPlatform.Timer.TickCount();
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTickCountUInt8, UInt8) {
        _Param(0) = (UInt8)gPlatform.Timer.TickCount();
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCount, Int64) {
        _Param(0) = gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCountUInt32, UInt32) {
        _Param(0) = (UInt32) gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCountUInt16, UInt16) {
        _Param(0) = (UInt16)gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMicrosecondTickCountUInt8, UInt8) {
        _Param(0) = (UInt8)gPlatform.Timer.TickCountToMicroseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCount, UInt32) {
        _Param(0) = (UInt32) gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCountUInt16, UInt16) {
        _Param(0) = (UInt16)gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetMillisecondTickCountUInt8, UInt8) {
        _Param(0) = (UInt8)gPlatform.Timer.TickCountToMilliseconds(gPlatform.Timer.TickCount());
        return _NextInstruction();
    }

#if defined(VIREO_TYPE_Timestamp)
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(SubTimestamp, Timestamp, Timestamp, Double) {
        Timestamp diff = _Param(0) - _Param(1);
        _Param(2) = diff.ToDouble();
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(SubTimestampDouble, Timestamp, Double, Timestamp) {
        _Param(2) = _Param(0) - Timestamp(_Param(1));
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(AddTimestampDoubleR, Timestamp, Double, Timestamp) {
        Timestamp delta(_Param(1));
        _Param(2) = _Param(0) + delta;
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(AddTimestampDoubleL, Double, Timestamp, Timestamp) {
        Timestamp delta(_Param(0));
        _Param(2) = delta + _Param(1);
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(AddTimestampInt32R, Timestamp, Int32, Timestamp) {
        _Param(2) = _Param(0) + _Param(1);
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(AddTimestampInt32L, Int32, Timestamp, Timestamp) {
        _Param(2) = _Param(1) + _Param(0);
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(IsLTTimestamp, Timestamp, Timestamp, Boolean) {
        _Param(2) = _Param(0) < _Param(1);
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(IsLETimestamp, Timestamp, Timestamp, Boolean) {
        _Param(2) = _Param(0) <= _Param(1);
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(IsGTTimestamp, Timestamp, Timestamp, Boolean) {
        _Param(2) = _Param(0) > _Param(1);
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(IsGETimestamp, Timestamp, Timestamp, Boolean) {
        _Param(2) = _Param(0) >= _Param(1);
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE1(GetTimestamp, Timestamp) {
        Timestamp::GetCurrentTimestamp(_ParamPointer(0));
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE2(TimestampConvertDouble, Timestamp, Double) {
        _Param(1) = _Param(0).ToDouble();
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE2(TimestampConvertUInt32, Timestamp, UInt32) {
        _Param(1) = static_cast<UInt32>(_Param(0).Integer());
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE2(TimestampConvertUInt64, Timestamp, UInt64) {
        _Param(1) = _Param(0).Integer();
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE2(TimestampConvertInt32, Timestamp, Int32) {
        _Param(1) = static_cast<Int32>(_Param(0).Integer());
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE2(TimestampConvertInt64, Timestamp, Int64) {
        _Param(1) = _Param(0).Integer();
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE2(ToTimestamp, Double, Timestamp) {
        _Param(1) = Timestamp(_Param(0));
        return _NextInstruction();
    }

    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(DateTimeToTimestamp, LVDateTimeRec, Boolean, Timestamp) {
        LVDateTimeRec *dt = _ParamPointer(0);
        Boolean isUTC = _ParamPointer(1) ? _Param(1) : false;
        Timestamp timestamp(dt->fractional_secs, dt->second, dt->minute, dt->hour, dt->day_of_month, dt->month, dt->year);
        Int32 timeZoneOffset = isUTC ? 0 : Date::getLocaletimeZone(timestamp.Integer());
        Timestamp local = timestamp - timeZoneOffset;
        _Param(2) = local;
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE3(TimestampToDateTime, Timestamp, Boolean, LVDateTimeRec) {
        Timestamp timestamp = _Param(0);
        Boolean toUTC = _ParamPointer(1) ? _Param(1) : false;
        LVDateTimeRec *dt = _ParamPointer(2);

        Date date(timestamp, toUTC);
        dt->year = date.Year();
        dt->month = date.Month();
        dt->day_of_month = date.Day();
        dt->hour = date.Hour();
        dt->minute = date.Minute();
        dt->second = date.Second();
        dt->fractional_secs = date.FractionalSecond();

        ++dt->month;
        dt->day_of_year = Int32(date.SecondsOfYear() / kSecondsPerDay);
        dt->day_of_week = date.WeekDay() % kDaysInWeek + 1;
        ++dt->day_of_year;
        return _NextInstruction();
    }
    //------------------------------------------------------------
    VIREO_FUNCTION_SIGNATURE6(GetDateTimeString, Timestamp, UInt16, Boolean, Boolean, StringRef, StringRef) {
        Timestamp timestamp;
        if (_ParamPointer(0))
            timestamp = _Param(0);
        else
            Timestamp::GetCurrentTimestamp(&timestamp);
        Boolean useSeconds = _ParamPointer(2) ? _Param(2) : false;
        Boolean useUTC = _ParamPointer(3) ? _Param(3) : false;
        Int32 format = _ParamPointer(1) ? _Param(1) : 0;
        StringRef *dateStr = _ParamPointer(4);
        StringRef *timeStr = _ParamPointer(5);
        Int32 tz = useUTC ? 0 :  Date::getLocaletimeZone(timestamp.Integer());
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
            formatString.Clear();
        }

        return _NextInstruction();
    }
#endif

    DECLARE_VIREO_PRIMITIVE2(CeilTimestamp, Timestamp, Timestamp, (_Param(1) = Timestamp((_Param(0) + Timestamp(0.9999999)).Integer(), 0)))
    DECLARE_VIREO_PRIMITIVE2(FloorTimestamp, Timestamp, Timestamp, (_Param(1) = Timestamp(_Param(0).Integer(), 0)))
    DECLARE_VIREO_PRIMITIVE2(RoundToNearestTimestamp, Timestamp, Timestamp, (_Param(1) = Timestamp((_Param(0) + Timestamp(0.5)).Integer(), 0)))

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
    DEFINE_VIREO_FUNCTION_CUSTOM(Sub, SubTimestamp, "p(i(Timestamp) i(Timestamp) o(Double))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Sub, SubTimestampDouble, "p(i(Timestamp) i(Double) o(Timestamp))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Add, AddTimestampDoubleL, "p(i(Double) i(Timestamp) o(Timestamp))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Add, AddTimestampDoubleR, "p(i(Timestamp) i(Double) o(Timestamp))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, TimestampConvertDouble, "p(i(Timestamp) o(Double))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, TimestampConvertUInt32, "p(i(Timestamp) o(UInt32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, TimestampConvertUInt64, "p(i(Timestamp) o(UInt64))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, TimestampConvertInt32, "p(i(Timestamp) o(Int32))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, TimestampConvertInt64, "p(i(Timestamp) o(Int64))")
    DEFINE_VIREO_FUNCTION_CUSTOM(Convert, ToTimestamp, "p(i(Double) o(Timestamp))")

#define kLVDateTimeTypeStr  "c(e(Double fractional_sec) e(Int32 second) e(Int32 minute) e(Int32 hour)"\
    "e(Int32 day_of_month) e(Int32 month) e(Int32 year) e(Int32 day_of_week) e(Int32 day_of_year) e(Int32 dst))"
    DEFINE_VIREO_TYPE(LVDateTimeRec, kLVDateTimeTypeStr);
    DEFINE_VIREO_FUNCTION(DateTimeToTimestamp, "p(i(" kLVDateTimeTypeStr ") i(Boolean isUTC) o(Timestamp))")
    DEFINE_VIREO_FUNCTION(TimestampToDateTime, "p(i(Timestamp) i(Boolean toUTC) o(" kLVDateTimeTypeStr "))")
    DEFINE_VIREO_FUNCTION(GetDateTimeString, "p(i(Timestamp) i(UInt16 format) i(Boolean showSecs) i(Boolean useUTC) o(String) o(String))");
#endif
#endif
    DEFINE_VIREO_TYPE(UnOpTimestamp, "p(i(Timestamp input) o(Timestamp output))")
    DEFINE_VIREO_FUNCTION_TYPED(Ceil, Timestamp, "UnOpTimestamp")
    DEFINE_VIREO_FUNCTION_TYPED(Floor, Timestamp, "UnOpTimestamp")
    DEFINE_VIREO_FUNCTION_TYPED(RoundToNearest, Timestamp, "UnOpTimestamp")
DEFINE_VIREO_END()
}  // namespace Vireo
