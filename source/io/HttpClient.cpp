/**

 Copyright (c) 2014 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include <stdio.h>

using namespace Vireo;

#if defined (VIREO_TYPE_HttpClient)

#if kVireoOS_emscripten
    #include "emscripten.h"
#endif

#if kVireoOS_emscripten
extern "C" {
    extern void js_ni_httpClient_Get(const char *, int, StringRef, StringRef);
}
#endif

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(ni_httpClient_Get, StringRef, StringRef, StringRef)
{
#if kVireoOS_emscripten
    js_ni_httpClient_Get((char*)_Param(0)->Begin(), _Param(0)->Length(), _Param(1), _Param(2));
    //printf("Response in ni_httpClient_Get is (%s)\n", _Param(1)->Begin());
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_HttpClient)
    DEFINE_VIREO_FUNCTION(ni_httpClient_Get, "p(i(.String)o(.String)o(.String)");
DEFINE_VIREO_END()
#endif
