/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file 
    \brief A file that includes core C++ files so they can be compiled as a single unit.
 */

// For simpler linking, and perhaps help tighter optimizations,
// the core can be compiled as a single file.

// Type and Data system
#include "TypeAndDataManager.cpp"
#include "TypeAndDataReflection.cpp"
#include "TypeTemplates.cpp"
#include "TDCodecVia.cpp"
//#include "TDCodecVib.cpp"
#include "TDCodecLVFlat.cpp"
#include "StringUtilities.cpp"
#include "EventLog.cpp"
#include "Assert.cpp"

// Some actual type definitions
#include "TypeDefiner.cpp"

// Execution system
#include "ExecutionContext.cpp"
#include "Queue.cpp"
#include "VirtualInstrument.cpp"

// Native Functions
#include "Array.cpp"
#include "Math.cpp"
#include "String.cpp"
#include "NumericString.cpp"
#include "GenericFunctions.cpp"
#include "Synchronization.cpp"

// Memory, timer and bare minimum stdio
#include "Platform.cpp"

