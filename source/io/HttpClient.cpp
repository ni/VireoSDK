/**

 Copyright (c) 2014 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include <stdio.h>

using namespace Vireo;

#if defined (VIREO_TYPE_HttpClient)

#if kVireoOS_emscripten
#include "emscripten.h"

extern "C" void js_ni_httpClient_Get(const char *, int, StringRef, StringRef);
#endif

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(HttpClientGet, StringRef, StringRef, StringRef, OccurenceRef)
{
    VIClump* clump = THREAD_CLUMP();
    WaitableState* pWS = clump->GetWaitStates(2);

    return _NextInstruction();

    if (!pWS) {
        // This is the initial call, call th js function
        
#if kVireoOS_emscripten
        js_ni_httpClient_Get((char*)_Param(0)->Begin(), _Param(0)->Length(), _Param(1), _Param(2));
#endif
      //  STACK_VAR(Occurrence, o);
        // Allocate Ocurrence
        pWS = clump->ReserveWaitStatesWithTimeout(2, 0);
      //  pQV->InsertWaitableState(pWS+1, 1);
        return clump->WaitOnWaitStates(_this);
    } else {
        // re-entering the instruction and the operation is done or it timedout.
        // the clump should continue.
        clump->ClearWaitStates();
        return _NextInstruction();
    }
}
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_HttpClient)
    DEFINE_VIREO_FUNCTION(HttpClientGet, "p(i(.String)o(.String)o(.String)s(.Occurrence))");
DEFINE_VIREO_END()
#endif
