/**
 
 Copyright (c) 2014-2015 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

/*! \file
 */


#ifndef Platform_h
#define Platform_h

#include "DataTypes.h"

#if kVireoOS_emscripten
#define rintf RINTF_UNDEFINED // don't use rintf implementation on emscripten; it doesn't obey rounding modes correctly
#define EMSCRIPTEN_NOOPT __attribute__((optnone)) // allow disabling optimizations that expose bugs in emscripten libs, such as those that cause Double casts to be elided and a rint call replaced with rintf
#else
#define EMSCRIPTEN_NOOPT
#endif

namespace Vireo {

class SubString;
class String;
typedef String *StringRef;

//------------------------------------------------------------
//! Process level fucntions for memory allocation.
class PlatformMemory {
  private:
    size_t _totalAllocated;
  public:
    void* Malloc(size_t countAQ);
    void* Realloc(void* pBuffer, size_t countAQ);
    void Free(void* pBuffer);
    size_t TotalAllocated() { return _totalAllocated; }
};

//#define VIREO_TRACK_MALLOC

#if defined(VIREO_TRACK_MALLOC)
  #define LOG_PLATFORM_MEM(message)    gPlatform.IO.Printf(message " %d\n", (int)gPlatform.Mem.TotalAllocated());
#else
  #define LOG_PLATFORM_MEM(message)
#endif
    
//------------------------------------------------------------
//! Process level fucntions for stdio.
class PlatformIO {
  public:
    void Print(Int32 len, ConstCStr string);
    void Print(ConstCStr string);
    void Printf(ConstCStr format, ...);
    void ReadFile(SubString *name, StringRef buffer);
    void ReadStdin(StringRef buffer);
};

//------------------------------------------------------------
//! Process level fucntions for low level time information.
#if defined (__ARDUINO__)
    typedef UInt32 PlatformTickType;
#elif kVireoOS_emscripten
    typedef Int64 PlatformTickType;
#else
    typedef Int64 PlatformTickType;
#endif

class PlatformTimer {
  public:
    PlatformTickType TickCount();
    PlatformTickType MicrosecondsToTickCount(Int64 microseconds);
    PlatformTickType SecondsToTickCount(Double seconds);
    Int64 TickCountToMilliseconds(PlatformTickType);
    Int64 TickCountToMicroseconds(PlatformTickType);
    PlatformTickType MillisecondsFromNowToTickCount(Int64 milliseconds);
    PlatformTickType MicrosecondsFromNowToTickCount(Int64 microseconds);
};

//------------------------------------------------------------
//! Single class to gather platform classes.
class Platform {
  public:
    void Setup();
    void Shutdown();
  public:
    PlatformMemory  Mem;
    PlatformIO      IO;
    PlatformTimer   Timer;
};
extern Platform gPlatform;

}

#endif // Platform_h
