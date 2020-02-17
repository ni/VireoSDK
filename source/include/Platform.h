// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 */

#ifndef Platform_h
#define Platform_h

#include "DataTypes.h"

#if kVireoOS_emscripten
#define rintf RINTF_UNDEFINED  // don't use rintf implementation on emscripten; it doesn't obey rounding modes correctly
#define EMSCRIPTEN_NOOPT __attribute__((optnone))  // allow disabling optimizations that expose bugs in
// emscripten libs, such as those that cause Double casts to be elided and a rint call replaced with rintf
#else
#define EMSCRIPTEN_NOOPT
#endif

namespace Vireo {

class SubString;
class String;
typedef String *StringRef;

//------------------------------------------------------------
//! Process level functions for memory allocation.
class PlatformMemory {
 private:
    size_t _totalAllocated = 0;
 public:
    void* Malloc(size_t countAQ);
    static void* Realloc(void* pBuffer, size_t countAQ);
    void Free(void* pBuffer);
    size_t TotalAllocated() const { return _totalAllocated; }
};

// #define VIREO_TRACK_MALLOC

#if defined(VIREO_TRACK_MALLOC)
  #define LOG_PLATFORM_MEM(message)    gPlatform.IO.Printf(message " %d\n", (int)gPlatform.Mem.TotalAllocated());
#else
  #define LOG_PLATFORM_MEM(message)
#endif

//------------------------------------------------------------
//! Process level functions for stdio.
class PlatformIO {
 public:
    static void Print(Int32 len, ConstCStr str);
    static void Print(ConstCStr str);
    void Printf(ConstCStr format, ...) const;
    static void ReadFile(SubString *name, StringRef buffer);
    static void ReadStdin(StringRef buffer);
};

//------------------------------------------------------------
//! Process level functions for low level time information.
#if defined (__ARDUINO__)
    typedef UInt32 PlatformTickType;
#elif kVireoOS_emscripten
    typedef Int64 PlatformTickType;
#else
    typedef Int64 PlatformTickType;
#endif

class PlatformTimer {
 public:
    static PlatformTickType TickCount();
    static PlatformTickType MicrosecondsToTickCount(Int64 microseconds);
    static Int64 TickCountToMilliseconds(PlatformTickType);
    static Int64 TickCountToMicroseconds(PlatformTickType);
    static PlatformTickType MillisecondsFromNowToTickCount(Int64 millisecondCount);
    static PlatformTickType MicrosecondsFromNowToTickCount(Int64 microsecondCount);
#if !kVireoOS_emscripten
    static void SleepMilliseconds(Int64 milliseconds);  // Cannot sleep in emscripten code without using interpreter, must sleep in caller on JS side
#endif
};

//------------------------------------------------------------
//! Single class to gather platform classes.
class Platform {
 public:
    static void Setup();
    static void Shutdown();
 public:
    PlatformMemory  Mem;
    PlatformIO      IO;
    PlatformTimer   Timer;
};
extern Platform gPlatform;

}  // namespace Vireo

#endif  // Platform_h
