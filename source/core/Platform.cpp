/**
 
 Copyright (c) 2014-2015 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

/*! \file
 */

#include "Platform.h"

#include <stdlib.h>
#include <stdarg.h>
#include <stdio.h>

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

namespace Vireo {

//============================================================
//! Static memory allocator used for all TM memory management.
void* PlatformMemory::Malloc(size_t countAQ)
{
    void* pBuffer = malloc(countAQ);
    if (pBuffer) {
        memset(pBuffer, 0, countAQ);
    }
    return pBuffer;
}
//------------------------------------------------------------
//! Static memory deallocator used for all TM memory manaagement.
void PlatformMemory::Free(void* pBuffer)
{
    free(pBuffer);
}
//============================================================
//! Static memory deallocator used for all TM memory manaagement.
void PlatformIO::Print(ConstCStr string)
{
    fwrite (string , 1, strlen(string), stdout);
}
//------------------------------------------------------------
//! Static memory deallocator used for all TM memory manaagement.
void PlatformIO::Print(Int32 len, ConstCStr string)
{
    fwrite (string , 1, len, stdout);
}
//------------------------------------------------------------
//! Static memory deallocator used for all TM memory manaagement.
void PlatformIO::Printf(ConstCStr format, ...)
{
    va_list args;
    va_start(args, format);
    vprintf(format, args);
    va_end (args);
}
//============================================================
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
    //#error MicroSecondCount not defined
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
    // #error MicroSecondCount not defined
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
    //#error MicroSecondCount not defined
    return 0;
#endif
}

} // namespace Vireo

