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

namespace Vireo {

class String;
typedef String *StringRef;

//------------------------------------------------------------
void PlatformSetup();
void PlatformShutdown();

//------------------------------------------------------------
//! Process level fucntions for memory allocation.
class PlatformMemory
{
public:
    static void* Malloc(size_t countAQ);
    static void Free(void* pBuffer);
};

//------------------------------------------------------------
//! Process level fucntions for stdio.
class PlatformIO
{
public:
    static void Print(Int32 len, ConstCStr string);
    static void Print(ConstCStr string);
    static void Printf(ConstCStr format, ...);
    static void ReadFile(ConstCStr name, StringRef buffer);
    static void ReadStdin(StringRef buffer);
};

//------------------------------------------------------------
//! Process level fucntions for low level time information.
#if defined (__ARDUINO__)
    typedef UInt32 PlatformTickType;
#elif kVireoOS_emscripten
    typedef Int64 PlatformTickType;
    //  typedef Double PlatformTickType; (slightly more native for JavaScript/emscripten)
#else
    typedef Int64 PlatformTickType;
#endif

class PlatformTime
{
public:
    static PlatformTickType TickCount();
    static PlatformTickType MicrosecondsToTickCount(Int64 microseconds);
    static PlatformTickType SecondsToTickCount(Double seconds);
    static Int64 TickCountToMilliseconds(PlatformTickType);
    static Int64 TickCountToMicroseconds(PlatformTickType);
    static PlatformTickType MillisecondsFromNowToTickCount(Int64 milliseconds);
    static PlatformTickType MicrosecondsFromNowToTickCount(Int64 microseconds);
};




}

#endif // Platform_h
