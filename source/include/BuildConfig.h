/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Target specific defines.
 */

#ifndef BuildConfig_h
#define BuildConfig_h

#if (linux == 1)
	#define kVireoOS_linuxU 1
#endif

#if defined(WIN32)
	#define kVireoOS_win32U 1
#endif

// Definitions common for most platforms
// Platform specific overrides are found in the sections below
#define VIVM_UNROLL_EXEC

#define VIVM_TYPE_MANAGER

#define VIREO_MAIN main

// VIVM_FASTCALL if there is a key word that allows functions to use register
// passing this may help ( once used on windows). Not currently used.
// ARM uses registers always, and clang x86/x64 uses registers
#define VIVM_FASTCALL

#define VIVM_INSTRUCTION_LINKAGE static

// Options for turning off primitives for some types.
#define VIREO_TYPE_UInt64 1
#define VIREO_TYPE_Int64  1
#define VIREO_TYPE_Single 1
#define VIREO_TYPE_Double 1
#define VIREO_TYPE_ComplexSingle 1
#define VIREO_TYPE_ComplexDouble 1

#define VIREO_ARRAY_INDEX_TYPE Int32
#define VIREO_ARRAY_VARIABLE_SENTINEL INT32_MIN

#define USE_C99_TYPES

#define VIVM_BREAKOUT_COUNT 20

#define VIREO_PERF_COUNTERS

// TODO allow for thread locals on linux/unix
#define VIVM_THREAD_LOCAL

// FILEIO covers read and write operation, perhaps only for stdio.
#define VIREO_POSIX_FILEIO 1

// FILESYSTEM covers open/close operations
#define VIREO_FILESYSTEM 1

// FILESYSTEM covers open/close operations
#define VIREO_FILESYSTEM_DIRLIST 1

// Instructions are directly concatenated there is no next pointer.
#define VIREO_PACKED_INSTRUCTIONS

#define VIREO_TRACK_MEMORY_QUANTITY

#define VIREO_USING_ASSERTS

#define VIREO_ISR_DISABLE
#define VIREO_ISR_ENABLE

#define VIREO_EXPORT extern "C"

//------------------------------------------------------------
#if defined(__ARDUINO__)
    //#define VIVM_HARVARD
    #include <avr/pgmspace.h>

    #define kVireoOS_wiring

    #define VIREO_PACKED_INSTRUCTIONS

    #define VIREO_SUPPORTS_ISR
    #define VIREO_ISR_DISABLE  cli();
    #define VIREO_ISR_ENABLE  sei();

    #define VIVM_SUPPORTS_FUNCTION_REGISTRATION_BY_NUMBER
    #define VIVM_SINGLE_EXECUTION_CONTEXT

    #define VIVM_BREAKOUT_COUNT 10
    #define VIVM_INSTRUCTION_LINKAGE  extern "C"

    #ifdef VIVM_ENABLE_TRACE
        #define VIVM_TRACE(message)  {Serial.print(message); Serial.print("\n");}
        #define VIVM_TRACE_FUNCTION(name)   VIVM_TRACE(name)
    #endif

//------------------------------------------------------------
#elif defined(__PIC32MX__)
    #define kVireoOS_wiring

    #define VIREO_PACKED_INSTRUCTIONS

    #define VIREO_SUPPORTS_ISR

    #define VIVM_SUPPORTS_FUNCTION_REGISTRATION_BY_NUMBER
    #define VIVM_SINGLE_EXECUTION_CONTEXT

    #define VIVM_BREAKOUT_COUNT 10
    #define VIVM_INSTRUCTION_LINKAGE  extern "C"

    #ifdef VIVM_ENABLE_TRACE
        #define VIVM_TRACE(message)  {Serial.print(message); Serial.print("\n");}
    #endif

//------------------------------------------------------------
#elif defined (__APPLE__)
    #define kVireoOS_macosxU 1
    #define VIREO_DATE_TIME_STDLIB

    #if __LP64__
    //    #define VIREO_ARRAY_INDEX_TYPE Int64
    #endif

//------------------------------------------------------------
#elif defined (__OS_ANDROID__)
    #define VIREO_DATE_TIME_STDLIB

#elif (kVireoOS_win32U || kVireoOS_win64U)
    #define snprintf _snprintf
    #define isinf !_finite
    #define isnan _isnan
    #define VIREO_MAIN  __cdecl main

    #define VIVM_THREAD_LOCAL __declspec(thread)

    #define VIREO_EXPORT extern "C" __declspec(dllexport)

    #define VIREO_DATE_TIME_STDLIB
    #undef VIREO_FILESYSTEM_DIRLIST

#elif kVireoOS_linuxU
    #define VIREO_DATE_TIME_STDLIB

#elif defined (kVireoOS_emscripten)
    #define VIREO_DATE_TIME_STDLIB
    #undef VIREO_FILESYSTEM_DIRLIST
#elif kVireoOS_vxworks
    #undef VIREO_POSIX_FILEIO
    #define VIREO_DATE_TIME_VXWORKS

#elif kVireoOS_ZynqARM
    #undef VIREO_FILESYSTEM
    #undef VIREO_FILESYSTEM_DIRLIST

#else
    #error : need to define this platfrom
#endif

#ifndef VIVM_ENABLE_TRACE
    #define VIVM_TRACE(message)
    #define VIVM_TRACE_FUNCTION(name)
#endif

#endif // BuildConfig_h
