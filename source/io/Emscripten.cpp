/**
 
 Copyright (c) 2014 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#if kVireoOS_emscripten
    #include "Emscripten.h"
#endif

using namespace Vireo;


//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(JSEval, StringRef)
{
#if kVireoOS_emscripten
    TempStackCStringFromString cString(_Param(0));

    emscripten_run_script(cString.BeginCStr());
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_Emscripten)
    DEFINE_VIREO_FUNCTION(JSEval, "p(i(.String))");
DEFINE_VIREO_END()
