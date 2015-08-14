/**

Copyright (c) 2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

#include <stdio.h>

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include "VirtualInstrument.h"

#if defined (VIREO_TYPE_WebSocketClient)

#if kVireoOS_emscripten
#include "emscripten.h"
#endif

using namespace Vireo;

#if kVireoOS_emscripten


extern "C" {
    extern Int32 jsWebSocketClientConnect(const char*, int, const char*, int, UInt32 *, StringRef, OccurrenceRef);
    extern Int32 jsWebSocketClientSend(UInt32, const char *, int, StringRef);
    extern Int32 jsWebSocketClientRead(UInt32, Int32, StringRef, StringRef, OccurrenceRef);
    extern Int32 jsWebSocketClientClose(UInt32, StringRef);
    extern Int32 jsWebSocketClientState(UInt32, Int32 *, StringRef);
}
#endif

//------------------------------------------------------------
// url(0), protocol(1), connection(2), errorCode(3), errorMessage(4), occurrence(5)
VIREO_FUNCTION_SIGNATURE6(WebSocketClientConnect, StringRef, StringRef, UInt32, Int32, StringRef, OccurrenceRef)
{
#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(5)->ObjBegin();
	VIClump* clump = THREAD_CLUMP();
	Observer* pObserver = clump->GetObservationStates(2);
    if(!pObserver) {
        // This is the initial call, call the js function
        _Param(3) = jsWebSocketClientConnect(
            (char*)_Param(0)->Begin(), _Param(0)->Length(),
            (char*)_Param(1)->Begin(), _Param(1)->Length(),
            _ParamPointer(2),
            _Param(4),
            _Param(5)
        );
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
		pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
		return clump->WaitOnObservableObject(_this);
    } else {
        // re-entering the instruction and the operation is done or it timed out.
		// the clump should continue.
		clump->ClearObservationStates();
		return _NextInstruction();
    }
#endif
    return _NextInstruction();
}


//------------------------------------------------------------
// connection(0), message(1), errorCode(2). errorMessage(3)
VIREO_FUNCTION_SIGNATURE4(WebSocketClientSend, UInt32, StringRef, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(2) = jsWebSocketClientSend(
        _Param(0),
        (char*)_Param(1)->Begin(), _Param(1)->Length(),
        _Param(3)
    );
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// connection(0), timeout(1), data(2), errorCode(3), errorMessage(4), occurence(5)
// NOTE: ocurrence is inserted by the Vireo Compiler
VIREO_FUNCTION_SIGNATURE6(WebSocketClientRead, UInt32, Int32, StringRef, Int32, StringRef, OccurrenceRef)
{
#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(5)->ObjBegin();
	VIClump* clump = THREAD_CLUMP();
	Observer* pObserver = clump->GetObservationStates(2);
    if(!pObserver) {
        // This is the initial call, call the js function
        _Param(3) = jsWebSocketClientRead(
            _Param(0),
            _Param(1),
            _Param(2),
            _Param(4),
            _Param(5)
        );
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
		pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
		return clump->WaitOnObservableObject(_this);
    } else {
        // re-entering the instruction and the operation is done or it timed out.
		// the clump should continue.
		clump->ClearObservationStates();
		return _NextInstruction();
    }
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// connection(0), errorCode(1), errorMessage(2)
VIREO_FUNCTION_SIGNATURE3(WebSocketClientClose, UInt32, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(1) = jsWebSocketClientClose(
        _Param(0),
        _Param(2)
    );
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// connection(0), state(1), errorCode(2), errorMessage(3)
VIREO_FUNCTION_SIGNATURE4(WebSocketClientState, UInt32, Int32, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(2) = jsWebSocketClientState(
        _Param(0),
        _ParamPointer(1),
        _Param(3)
    );
#endif
    return _NextInstruction();
}



//------------------------------------------------------------
DEFINE_VIREO_BEGIN(WebSocketClient)
    DEFINE_VIREO_REQUIRE(Synchronization)
    DEFINE_VIREO_FUNCTION(WebSocketClientConnect, "p(i(.String) i(.String) o(.UInt32) io(.Int32) o(.String) s(.Occurrence))")
    DEFINE_VIREO_FUNCTION(WebSocketClientSend, "p(io(.UInt32) i(.String) io(.Int32) o(.String))")
    DEFINE_VIREO_FUNCTION(WebSocketClientRead, "p(io(.UInt32) i(.Int32) o(.String) io(.Int32) o(.String) s(.Occurrence))")
    DEFINE_VIREO_FUNCTION(WebSocketClientClose, "p(i(.UInt32) io(.Int32) o(.String))")
    DEFINE_VIREO_FUNCTION(WebSocketClientState, "p(i(.UInt32) io(.Int32) io(.Int32) o(.String))")
DEFINE_VIREO_END()
#endif
