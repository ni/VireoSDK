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
    extern Int32 jsHttpClientOpen(const char *, int, const char*, int, const char*, int, Boolean, UInt32 *, StringRef);
    extern Int32 jsHttpClientClose(UInt32, StringRef);
    extern Int32 jsHttpClientAddHeader(UInt32, const char *, int, const char *, int, StringRef);
    extern Int32 jsHttpClientRemoveHeader(UInt32, const char *, int, StringRef);
    extern Int32 jsHttpClientGetHeader(UInt32, const char *, int, StringRef, StringRef);
    extern Int32 jsHttpClientHeaderExist(UInt32, const char *, int, UInt32 *, StringRef);
    extern Int32 jsHttpClientListHeaders(UInt32, StringRef, StringRef);
    extern void jsHttpClientGet(UInt32, const char *, int, const char *, int, Int32, StringRef, StringRef, Int32 *, StringRef, OccurrenceRef);
    extern void jsHttpClientHead(UInt32, const char *, int, Int32, StringRef, Int32 *, StringRef, OccurrenceRef);
    extern void jsHttpClientPutBuffer(UInt32, const char *, int, const char *, int, const char *, int, Int32, StringRef, StringRef, Int32 *, StringRef, OccurrenceRef);
    extern void jsHttpClientDelete(UInt32, const char *, int, const char *, int, Int32, StringRef, StringRef, Int32 *, StringRef, OccurrenceRef);
    extern void jsHttpClientPostBuffer(UInt32, const char *, int, const char *, int, const char *, int, Int32, StringRef, StringRef, Int32 *, StringRef, OccurrenceRef);
}
#endif

//------------------------------------------------------------
// Cookie file(0), userName(1), password(2), verify Server(3), handle(4), error code(5), error message(6)
VIREO_FUNCTION_SIGNATURE7(HttpClientOpen, StringRef, StringRef, StringRef, Boolean, UInt32, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(5) = jsHttpClientOpen(
        (char*)_Param(0)->Begin(), _Param(0)->Length(),
        (char*)_Param(1)->Begin(), _Param(1)->Length(),
        (char*)_Param(2)->Begin(), _Param(2)->Length(),
        _Param(3),
        _ParamPointer(4),
        _Param(6)
        );
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), error code(1), error message(2)
VIREO_FUNCTION_SIGNATURE3(HttpClientClose, UInt32, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(1) = jsHttpClientClose(_Param(0), _Param(2));
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), value(2), error code(3), error message(4)
VIREO_FUNCTION_SIGNATURE5(HttpClientAddHeader, UInt32, StringRef, StringRef, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(3) = jsHttpClientAddHeader(
        _Param(0),
        (char*)_Param(1)->Begin(), _Param(1)->Length(),
        (char*)_Param(2)->Begin(), _Param(2)->Length(),
        _Param(4));
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), error code(2), error message(3)
VIREO_FUNCTION_SIGNATURE4(HttpClientRemoveHeader, UInt32, StringRef, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(2) = jsHttpClientRemoveHeader(
        _Param(0),
        (char*)_Param(1)->Begin(), _Param(1)->Length(),
        _Param(3));
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), value(2), error code(3), error message(4)
VIREO_FUNCTION_SIGNATURE5(HttpClientGetHeader, UInt32, StringRef, StringRef, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(3) = jsHttpClientGetHeader(
        _Param(0),
        (char*)_Param(1)->Begin(), _Param(1)->Length(),
        _Param(2),
        _Param(4));
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), headerExist(2), value(3), error code(4), error message(5)
VIREO_FUNCTION_SIGNATURE6(HttpClientHeaderExist, UInt32, StringRef, UInt32, StringRef, Int32, StringRef)
{
    #if kVireoOS_emscripten
    _Param(4) = jsHttpClientHeaderExist(
        _Param(0),
        (char*)_Param(1)->Begin(), _Param(1)->Length(),
        _ParamPointer(2),
        _Param(5));
    if ((_Param(4) == 0) && (_Param(2) == 1))
    {
        _Param(4) = jsHttpClientGetHeader(
            _Param(0),
            (char*)_Param(1)->Begin(), _Param(1)->Length(),
            _Param(3),
            _Param(5));
    }
    else
    {
        _Param(3)->Resize1D(0);
    }
    #endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), headerList(1), error code(2), error message(3)
VIREO_FUNCTION_SIGNATURE4(HttpClientListHeaders, UInt32, StringRef, Int32, StringRef)
{
#if kVireoOS_emscripten
    _Param(2) = jsHttpClientListHeaders(
        _Param(0),
        _Param(1),
        _Param(3));
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), timeOut(3), headers(4), body(5), errorCode(6), errorMessage(7), ocurrence(8)
// NOTE: ocurrence is inserted by the Vireo Compiler
VIREO_FUNCTION_SIGNATURE9(HttpClientGet, UInt32, StringRef, StringRef, Int32, StringRef, StringRef, Int32, StringRef, OccurrenceRef)
{
#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(8)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        // This is the initial call, call the js function
        jsHttpClientGet(
            _Param(0),
            (char*)_Param(1)->Begin(), _Param(1)->Length(),
            (char*)_Param(2)->Begin(), _Param(2)->Length(),
            _Param(3),
            _Param(4),
            _Param(5),
            _ParamPointer(6),
            _Param(7),
            _Param(8));
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
        pOcc->InsertObserver(pObserver + 1, pOcc->Count()+1);
        return clump->WaitOnObservableObject(_this);
    }
    else
    {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), timeOut(2), headers(3), errorCode(4), errorMessage(5), occurrence(6)
VIREO_FUNCTION_SIGNATURE7(HttpClientHead, UInt32, StringRef, Int32, StringRef, Int32, StringRef, OccurrenceRef)
{
#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(6)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        // This is the initial call, call the js function
        jsHttpClientHead(
            _Param(0),
            (char*)_Param(1)->Begin(), _Param(1)->Length(),
            _Param(2),
            _Param(3),
            _ParamPointer(4),
            _Param(5),
            _Param(6));
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
        pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
        return clump->WaitOnObservableObject(_this);
    }
    else
    {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        clump->ClearObservationStates();
        return _NextInstruction();
    }

#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), buffer(3), timeOut(4), headers(5), body(6), errorCode(7), errorMessage(8), occurrence(9)
VIREO_FUNCTION_SIGNATURE10(HttpClientPut, UInt32, StringRef, StringRef, StringRef, Int32, StringRef, StringRef, Int32, StringRef, OccurrenceRef)
{
#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(9)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        // This is the initial call, call the js function
        jsHttpClientPutBuffer(
            _Param(0),
            (char*)_Param(1)->Begin(), _Param(1)->Length(),
            (char*)_Param(2)->Begin(), _Param(2)->Length(),
            (char*)_Param(3)->Begin(), _Param(3)->Length(),
            _Param(4),
            _Param(5),
            _Param(6),
            _ParamPointer(7),
            _Param(8),
            _Param(9));
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
        pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
        return clump->WaitOnObservableObject(_this);
    }
    else
    {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), timeOut(3), headers(4), body(5), errorCode(6), errorMessage(7), occurrence(8)
VIREO_FUNCTION_SIGNATURE9(HttpClientDelete, UInt32, StringRef, StringRef, Int32, StringRef, StringRef, Int32, StringRef, OccurrenceRef)
{
#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(8)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        // This is the initial call, call the js function
        jsHttpClientDelete(
            _Param(0),
            (char*)_Param(1)->Begin(), _Param(1)->Length(),
            (char*)_Param(2)->Begin(), _Param(2)->Length(),
            _Param(3),
            _Param(4),
            _Param(5),
            _ParamPointer(6),
            _Param(7),
            _Param(8));
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
        pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
        return clump->WaitOnObservableObject(_this);
    }
    else
    {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), buffer(3), timeOut(4), headers(5), body(6), errorCode(7), errorMessage(8), occurrence(9)
VIREO_FUNCTION_SIGNATURE10(HttpClientPost, UInt32, StringRef, StringRef, StringRef, Int32, StringRef, StringRef, Int32, StringRef, OccurrenceRef)
{
#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(9)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        // This is the initial call, call the js function
        jsHttpClientPostBuffer(
            _Param(0),
            (char*)_Param(1)->Begin(), _Param(1)->Length(),
            (char*)_Param(2)->Begin(), _Param(2)->Length(),
            (char*)_Param(3)->Begin(), _Param(3)->Length(),
            _Param(4),
            _Param(5),
            _Param(6),
            _ParamPointer(7),
            _Param(8),
            _Param(9));
        pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
        pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
        return clump->WaitOnObservableObject(_this);
    }
    else
    {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_HttpClient)
    DEFINE_VIREO_FUNCTION(HttpClientOpen, "p(i(.String) i(.String) i(.String) i(.Boolean) o(.UInt32) io(.Int32) o(.String))");
    DEFINE_VIREO_FUNCTION(HttpClientClose, "p(i(.UInt32) io(.Int32) o(.String))");
    DEFINE_VIREO_FUNCTION(HttpClientAddHeader, "p(io(.UInt32) i(.String) i(.String) io(.Int32) o(.String) )");
    DEFINE_VIREO_FUNCTION(HttpClientRemoveHeader, "p(io(.UInt32) i(.String) io(.Int32) o(.String))");
    DEFINE_VIREO_FUNCTION(HttpClientGetHeader, "p(io(.UInt32) i(.String) o(.String) io(.Int32) o(.String))");
    DEFINE_VIREO_FUNCTION(HttpClientHeaderExist, "p(io(.UInt32) i(.String) o(.UInt32) o(.String) io(.Int32) o(.String))");
    DEFINE_VIREO_FUNCTION(HttpClientListHeaders, "p(io(.UInt32) o(.String) io(.Int32) o(.String))");
    DEFINE_VIREO_FUNCTION(HttpClientGet, "p(io(.UInt32) i(.String) i(.String) i(.Int32) o(.String) o(.String) io(.Int32) o(.String) s(.Occurrence))");
    DEFINE_VIREO_FUNCTION(HttpClientHead, "p(io(.UInt32) i(.String) i(.Int32) o(.String) io(.Int32) o(.String) s(.Occurrence))");
    DEFINE_VIREO_FUNCTION(HttpClientPut, "p(io(.UInt32) i(.String) i(.String) i(.String) i(.Int32) o(.String) o(.String) io(.Int32) o(.String) s(.Occurrence))");
    DEFINE_VIREO_FUNCTION(HttpClientDelete, "p(io(.UInt32) i(.String) i(.String) i(.Int32) o(.String) o(.String) io(.Int32) o(.String) s(.Occurrence))");
    DEFINE_VIREO_FUNCTION(HttpClientPost, "p(io(.UInt32) i(.String) i(.String) i(.String) i(.Int32) o(.String) o(.String) io(.Int32) o(.String) s(.Occurrence))");
DEFINE_VIREO_END()
#endif
