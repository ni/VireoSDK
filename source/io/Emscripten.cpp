/**
 
 Copyright (c) 2014 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#include "emscripten.h"

using namespace Vireo;

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(JSEval, StringRef)
{
    TempStackCStringFromString cString(_Param(0));
    emscripten_run_script(cString.BeginCStr());
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(JSTest2, Int32, Int32)
{
    _Param(1) = EM_ASM_INT({
        alert('Hello');
        return $0 + 2;
    }, _Param(0));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(JSGetElementByID, StringRef, Int32)
{
    TempStackCStringFromString cString(_Param(0));
    return _NextInstruction();
}
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_Emscripten)
    DEFINE_VIREO_FUNCTION(JSEval, "p(i(.String))");
    DEFINE_VIREO_FUNCTION(JSTest2, "p(i(.Int32)o(.Int32))");
    DEFINE_VIREO_FUNCTION(JSGetElementByID, "p(i(.String)o(.Int32))");
DEFINE_VIREO_END()
