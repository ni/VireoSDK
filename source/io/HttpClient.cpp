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

#if defined (VIREO_TYPE_HttpClient)

#if kVireoOS_emscripten
#include "emscripten.h"
#endif

using namespace Vireo;

#if kVireoOS_emscripten
extern "C" {
	extern UInt32 js_ni_httpClient_Open(const char *, int, const char*, int, const char*, int, Int32, Boolean);
	extern Int32 js_ni_httpClient_Close(UInt32);
	extern Int32 js_ni_httpClient_AddHeader(UInt32, const char *, int, const char *, int);
	extern Int32 js_ni_httpClient_RemoveHeader(UInt32, const char *, int);
	extern Int32 js_ni_httpClient_GetHeader(UInt32, const char *, int, StringRef);
	extern Boolean js_ni_httpClient_HeaderExist(UInt32, const char *, int);
	extern Int32 js_ni_httpClient_ListHeaders(UInt32, StringRef);
	extern Int32 js_ni_httpClient_Get(UInt32, const char *, int, const char *, int, Int32, StringRef, StringRef, StringRef);
	extern Int32 js_ni_httpClient_Head(UInt32, const char *, int, Int32, StringRef, StringRef);
	extern Int32 js_ni_httpClient_PutBuffer(UInt32, const char *, int, const char *, int, const char *, int, Int32, StringRef, StringRef, StringRef);
	extern Int32 js_ni_httpClient_Delete(UInt32, const char *, int, const char *, int, Int32, StringRef, StringRef, StringRef);
	extern Int32 js_ni_httpClient_PostBuffer(UInt32, const char *, int, const char *, int, const char *, int, Int32, StringRef, StringRef, StringRef);
}
#endif

//------------------------------------------------------------
//VIREO_FUNCTION_SIGNATURE3(HttpClientGet, StringRef, StringRef, StringRef)
VIREO_FUNCTION_SIGNATURE4(HttpClientGet, StringRef, StringRef, StringRef, OccurrenceRef)
{
#if 1
  
#if kVireoOS_emscripten
    js_ni_httpClient_Get((char*)_Param(0)->Begin(), _Param(0)->Length(), _Param(1), _Param(2));
#endif
    return _NextInstruction();
    
#else
    OccurrenceCore *pOcc = _Param(3)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        // This is the initial call, call th js function
        
#if kVireoOS_emscripten
        js_ni_httpClient_Get((char*)_Param(0)->Begin(), _Param(0)->Length(), _Param(1), _Param(2));
#endif
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
        pOcc->InsertObserver(pObserver+1, 1);
        return clump->WaitOnObservableObject(_this);
    }
    else {
        // re-entering the instruction and the operation is done or it timedout.
        // the clump should continue.
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#endif
}


//------------------------------------------------------------
// Cookie file, userName, password, error code, verify Server, handle
VIREO_FUNCTION_SIGNATURE6(ni_httpClient_Open, StringRef, StringRef, StringRef, Int32, Boolean, UInt32)
{
#if kVireoOS_emscripten
	_Param(5) = js_ni_httpClient_Open(
		(char*)_Param(0)->Begin(), _Param(0)->Length(),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		(char*)_Param(2)->Begin(), _Param(2)->Length(),
		_Param(3),
		_Param(4));
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, error code
VIREO_FUNCTION_SIGNATURE2(ni_httpClient_Close, UInt32, Int32)
{
#if kVireoOS_emscripten
	_Param(1) = js_ni_httpClient_Close(_Param(0));
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, header, value, errorCode
VIREO_FUNCTION_SIGNATURE4(ni_httpClient_AddHeader, UInt32, StringRef, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(3) = js_ni_httpClient_AddHeader(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		(char*)_Param(2)->Begin(), _Param(2)->Length());
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, header, errorCode
VIREO_FUNCTION_SIGNATURE3(ni_httpClient_RemoveHeader, UInt32, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(2) = js_ni_httpClient_RemoveHeader(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length());
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, header, value, errorCode
VIREO_FUNCTION_SIGNATURE4(ni_httpClient_GetHeader, UInt32, StringRef, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(3) = js_ni_httpClient_GetHeader(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		_Param(2));
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, header, headerExist, value, errorCode
VIREO_FUNCTION_SIGNATURE5(ni_httpClient_HeaderExist, UInt32, StringRef, Boolean, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(2) = js_ni_httpClient_HeaderExist(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length());
	if (_Param(2))
	{
		Int32 result = js_ni_httpClient_GetHeader(
			_Param(0),
			(char*)_Param(1)->Begin(), _Param(1)->Length(),
			_Param(3));
	}
	else
	{
		_Param(3)->Resize1D(0);
	}
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, headerList, errorCode
VIREO_FUNCTION_SIGNATURE3(ni_httpClient_ListHeaders, UInt32, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(2) = js_ni_httpClient_ListHeaders(
		_Param(0),
		_Param(1));
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, url, output file, timeOut, headers, body, done, errorCode
VIREO_FUNCTION_SIGNATURE8(ni_httpClient_Get, UInt32, StringRef, StringRef, Int32, StringRef, StringRef, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(7) = js_ni_httpClient_Get(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		(char*)_Param(2)->Begin(), _Param(2)->Length(),
		_Param(3),
		_Param(4),
		_Param(5),
		_Param(6)
		);
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, url, timeOut, headers, done, errorCode
VIREO_FUNCTION_SIGNATURE6(ni_httpClient_Head, UInt32, StringRef, Int32, StringRef, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(5) = js_ni_httpClient_Head(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		_Param(2),
		_Param(3),
		_Param(4));
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, url, output file, buffer, timeOut, headers, body, done, errorCode
VIREO_FUNCTION_SIGNATURE9(ni_httpClient_Put, UInt32, StringRef, StringRef, StringRef, Int32, StringRef, StringRef, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(8) = js_ni_httpClient_PutBuffer(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		(char*)_Param(2)->Begin(), _Param(2)->Length(),
		(char*)_Param(3)->Begin(), _Param(3)->Length(),
		_Param(4),
		_Param(5),
		_Param(6),
		_Param(7)
		);
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, url, output file, timeOut, headers, body, done, errorCode
VIREO_FUNCTION_SIGNATURE8(ni_httpClient_Delete, UInt32, StringRef, StringRef, Int32, StringRef, StringRef, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(7) = js_ni_httpClient_Delete(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		(char*)_Param(2)->Begin(), _Param(2)->Length(),
		_Param(3),
		_Param(4),
		_Param(5),
		_Param(6)
		);
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
// handle, url, output file, buffer, timeOut, headers, body, done, errorCode
VIREO_FUNCTION_SIGNATURE9(ni_httpClient_Post, UInt32, StringRef, StringRef, StringRef, Int32, StringRef, StringRef, StringRef, Int32)
{
#if kVireoOS_emscripten
	_Param(8) = js_ni_httpClient_PostBuffer(
		_Param(0),
		(char*)_Param(1)->Begin(), _Param(1)->Length(),
		(char*)_Param(2)->Begin(), _Param(2)->Length(),
		(char*)_Param(3)->Begin(), _Param(3)->Length(),
		_Param(4),
		_Param(5),
		_Param(6),
		_Param(7)
		);
#endif
	return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_HttpClient)
    DEFINE_VIREO_FUNCTION(HttpClientGet, "p(i(.String) o(.String) o(.String) s(.Occurrence))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_Open, "p(i(.String) i(.String) i(.String) io(.Int32) i(.Boolean) o(.UInt32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_Close, "p(i(.UInt32) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_AddHeader, "p(io(.UInt32) i(.String) i(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_RemoveHeader, "p(io(.UInt32) i(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_GetHeader, "p(io(.UInt32) i(.String) o(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_HeaderExist, "p(io(.UInt32) i(.String) o(.Boolean) o(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_ListHeaders, "p(io(.UInt32) o(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_Get, "p(io(.UInt32) i(.String) i(.String) i(.Int32) o(.String) o(.String) o(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_Head, "p(io(.UInt32) i(.String) i(.Int32) o(.String) o(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_Put, "p(io(.UInt32) i(.String) i(.String) i(.String) i(.Int32) o(.String) o(.String) o(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_Delete, "p(io(.UInt32) i(.String) i(.String) i(.Int32) o(.String) o(.String) o(.String) io(.Int32))");
    DEFINE_VIREO_FUNCTION(ni_httpClient_Post, "p(io(.UInt32) i(.String) i(.String) i(.String) i(.Int32) o(.String) o(.String) o(.String) io(.Int32))");
DEFINE_VIREO_END()
#endif
