/**
 
 Copyright (c) 2014-2015 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#if kVireoOS_emscripten
#include <emscripten.h>
#endif
using namespace Vireo;

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(JSEval, StringRef)
{
    TempStackCStringFromString cString(_Param(0));
#if kVireoOS_emscripten
    emscripten_run_script(cString.BeginCStr());
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(JSTest2, Int32, Int32)
{
#if kVireoOS_emscripten
    _Param(1) = EM_ASM_INT({
        alert('Hello');
        return $0 + 2;
    }, _Param(0));
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(JSGetElementByID, StringRef, Int32)
{
    TempStackCStringFromString cString(_Param(0));
    return _NextInstruction();
}
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(JavaScript)
    DEFINE_VIREO_FUNCTION(JSEval, "p(i(String))");
    DEFINE_VIREO_FUNCTION(JSTest2, "p(i(Int32)o(Int32))");
    DEFINE_VIREO_FUNCTION(JSGetElementByID, "p(i(String)o(Int32))");
DEFINE_VIREO_END()
