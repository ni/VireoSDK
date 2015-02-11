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

#define VIREO_MAIN main

// VIVM_FASTCALL if there is a key word that allows functions to use register
// passing this may help ( once used on windows). Not currently used.
// ARM uses registers always, and clang x86/x64 uses registers
#define VIVM_FASTCALL

#ifdef VIREO_MICRO
    // For Vireo-micro there is a dispatch table statically linked at build time
    // In this case the functions need to neeed to be linkable across obj files
    #define VIREO_INSTRUCTION_LINKAGE extern "C"
    #define VIREO_SINGLE_GLOBAL_CONTEXT
    //#define VIREO_USING_ASSERTS

    #define VIREO_TYPE_Int8   1

#elif defined(VIREO_MINI)

    // Options for turning off primitives for some types.
    // #define VIREO_TYPE_UInt8  1
    // #define VIREO_TYPE_UInt16 1
    #define VIREO_TYPE_UInt32 1
    //  #define VIREO_TYPE_UInt64 1

    // #define VIREO_TYPE_Int8   1
    // #define VIREO_TYPE_Int16  1
    #define VIREO_TYPE_Int32  1
    //  #define VIREO_TYPE_Int64  1

    //  #define VIREO_TYPE_Single 1
    //  #define VIREO_TYPE_Double 1
    //  #define VIREO_TYPE_ComplexSingle 1
    //  #define VIREO_TYPE_ComplexDouble 1
    #define VIREO_TYPE_ArrayND 1

    //  #define VIREO_TYPE_ATime 1

    // Vireo can be configured to assume all strings are 7 bit ASCII
    // This means String ArrayLength will alwasy equal StringLength
    // Note that even when Utf8 is used StringLength may be longer that
    // The number of graphemes due to combining codepoints
    // #define VIREO_ASCII_ONLY 1

    // #define VIREO_TYPE_VARIANT 1

    // Track internal unique C function names for primitive functions.
    // Used for generating C source
    // #define VIREO_INSTRUCTION_REFLECTION 1
    // #define VIREO_TYPE_CONSTRUCTION 1

    // For Vireo-full functions are dynamically registered by each module when loaded
    // or when the the app is started for statically linked modules so the symbols
    // are private to each obj.
    #define VIREO_INSTRUCTION_LINKAGE static

    // #define VIREO_MULTI_THREAD
    #undef VIREO_FILESYSTEM
    #undef VIREO_FILESYSTEM_DIRLIST
    
    // FILEIO covers read and write operation, perhaps only for stdio.
    #define VIREO_POSIX_FILEIO 1

#else

    #define VIREO_VIA_FORMATTER 1
    #define VIREO_C_ENTRY_POINTS 1
    // Options for turning off primitives for some types.
    #define VIREO_TYPE_UInt8  1
    #define VIREO_TYPE_UInt16 1
    #define VIREO_TYPE_UInt32 1
    #define VIREO_TYPE_UInt64 1

    #define VIREO_TYPE_Int8   1
    #define VIREO_TYPE_Int16  1
    #define VIREO_TYPE_Int32  1
    #define VIREO_TYPE_Int64  1

    #define VIREO_TYPE_Single 1
    #define VIREO_TYPE_Double 1
    #define VIREO_TYPE_ComplexSingle 1
    #define VIREO_TYPE_ComplexDouble 1
    #define VIREO_TYPE_ArrayND 1

    #define VIREO_TYPE_ATime 1
    #define VIREO_TYPE_Canvas2D  1

 // Vireo can be configured to assume all strings are 7 bit ASCII
 // This means String ArrayLength will alwasy equal StringLength
 // Note that even when Utf8 is used StringLength may be longer that
 // The number of graphemes due to combining codepoints
 // #define VIREO_ASCII_ONLY 1

    #define VIREO_TYPE_VARIANT 1

    // Track internal unique C function names for primitive functions.
    // Used for generating C source
    #define VIREO_INSTRUCTION_REFLECTION 1

    #define VIREO_TYPE_CONSTRUCTION 1

    // For Vireo-full functions are dynamically registered by each module when loaded
    // or when the the app is started for statically linked modules so the symbols
    // are private to each obj.
    #define VIREO_INSTRUCTION_LINKAGE static

    #define VIREO_MULTI_THREAD

    // FILEIO covers read and write operation, perhaps only for stdio.
    #define VIREO_POSIX_FILEIO 1

    // FILESYSTEM covers open/close operations
    #define VIREO_FILESYSTEM 1

    // FILESYSTEM covers open/close operations
    #define VIREO_FILESYSTEM_DIRLIST 1

    #define VIREO_PERF_COUNTERS

#endif

#define USE_C99_TYPES

#define VIVM_BREAKOUT_COUNT 20


// TODO allow for thread locals on linux/unix
#define VIVM_THREAD_LOCAL

#ifdef VIREO_DEBUG
#define VIREO_TRACK_MEMORY_QUANTITY
#define VIREO_USING_ASSERTS
#endif

#define VIREO_ISR_DISABLE
#define VIREO_ISR_ENABLE

#define VIREO_EXPORT extern "C"

//------------------------------------------------------------
#if defined(__ARDUINO__)
    //#define VIVM_HARVARD
    #include <avr/pgmspace.h>

    #define kVireoOS_wiring

    #define VIREO_SUPPORTS_ISR
    #define VIREO_ISR_DISABLE  cli();
    #define VIREO_ISR_ENABLE  sei();

    #define VIVM_SUPPORTS_FUNCTION_REGISTRATION_BY_NUMBER

    #define VIVM_BREAKOUT_COUNT 10

    #ifdef VIVM_ENABLE_TRACE
        #define VIVM_TRACE(message)  {Serial.print(message); Serial.print("\n");}
        #define VIVM_TRACE_FUNCTION(name)   VIVM_TRACE(name)
    #endif

//------------------------------------------------------------
#elif defined(__PIC32MX__)
    #define kVireoOS_wiring

    #define VIREO_SUPPORTS_ISR

    #define VIVM_SUPPORTS_FUNCTION_REGISTRATION_BY_NUMBER

    #define VIVM_BREAKOUT_COUNT 10

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

    #undef VIREO_MAIN
    #define VIREO_MAIN  __cdecl main

    #undef VIVM_THREAD_LOCAL
    #define VIVM_THREAD_LOCAL __declspec(thread)

    #undef VIREO_EXPORT
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
