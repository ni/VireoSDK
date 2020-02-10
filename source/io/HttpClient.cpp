// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

#include <stdio.h>

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include "VirtualInstrument.h"

#if defined (VIREO_TYPE_HttpClient)
namespace Vireo {

#if kVireoOS_emscripten
enum HttpClientMethodId {
    kGet = 0,
    kHead = 1,
    kPut = 2,
    kPost = 3,
    kDelete = 4
};

#define HTTP_REQUIRED_INPUTS_MESSAGE "All inputs and outputs must be provided for HTTP functions"

extern "C" {
    extern void jsHttpClientOpen(
        TypeRef cookieType, StringRef * cookieFile,
        TypeRef userNameType, StringRef * userName,
        TypeRef passwordType, StringRef * password,
        TypeRef verifyServerType, UInt32 * verifyServer,
        TypeRef handleType, UInt32 * handle,
        TypeRef errorType, ErrorCluster * errorData);

    extern void jsHttpClientClose(
        TypeRef handleType, UInt32* handle,
        TypeRef errorType, ErrorCluster* errorData);

    extern void jsHttpClientAddHeader(
        TypeRef handleType, UInt32* handle,
        TypeRef headerType, StringRef* headerData,
        TypeRef valueType, StringRef* valueData,
        TypeRef errorType, ErrorCluster* errorData);

    extern void jsHttpClientRemoveHeader(
        TypeRef handleType, UInt32* handle,
        TypeRef headerType, StringRef* headerData,
        TypeRef errorType, ErrorCluster* errorData);

    extern void jsHttpClientGetHeader(
        TypeRef handleType, UInt32* handle,
        TypeRef headerType, StringRef* headerData,
        TypeRef valueType, StringRef* valueData,
        TypeRef errorType, ErrorCluster* errorData);

    extern void jsHttpClientHeaderExists(
        TypeRef handleType, UInt32* handle,
        TypeRef headerType, StringRef* headerData,
        TypeRef headerExistsType, UInt32 * headerExistsData,
        TypeRef valueType, StringRef* valueData,
        TypeRef errorType, ErrorCluster* errorData);

    extern void jsHttpClientListHeaders(
        TypeRef handleType, UInt32* handle,
        TypeRef headerListType, StringRef* headerList,
        TypeRef errorCluster, ErrorCluster* errorData);

    extern void jsHttpClientMethod(
        HttpClientMethodId methodId,
        TypeRef handleType, UInt32* handle,
        TypeRef urlType, StringRef* urlData,
        TypeRef outputFilePathType, StringRef* outputFilePathData,
        TypeRef bufferType, StringRef* bufferData,
        TypeRef timeoutType, Int32 * timeoutData,
        TypeRef headersType, StringRef* headersData,
        TypeRef bodyType, StringRef * bodyData,
        TypeRef statusCodeType, UInt32 * statusCodeData,
        TypeRef errorType, ErrorCluster * errorData,
        OccurrenceRef occurence);

    extern void jsHttpClientConfigCORS(
        TypeRef handleType, UInt32 * handle,
        TypeRef includeCrendentialsDuringCORSType, UInt32 * includeCredentialsDuringCORSData,
        TypeRef errorType, ErrorCluster* errorData);
}
#endif

/*
    The call chain will be prepended to errorCluster source string.
    For example:

    If existing source is empty string then output is
        Primitive in MyVI->SubVI

    If existing source contains contents such as <APPEND>\nCustom Error Information then output is
        Primitive in MyVI->SubVI<APPEND>\nCustom Error Information
*/
void AddCallChainToSourceIfErrorPresent(ErrorCluster *errorCluster, ConstCStr methodName)
{
    if (errorCluster && errorCluster->status) {
        STACK_VAR(String, currentErrorString);
        StringRef s = currentErrorString.Value;
        s->Append(errorCluster->source);
        errorCluster->source->Resize1D(0);
        errorCluster->source->AppendCStr(methodName);
        errorCluster->source->AppendCStr(" in ");
        AppendCallChainString(errorCluster->source);
        errorCluster->source->Append(s);
    }
}

void GenerateNotSupportedOnPlatformError(ErrorCluster *errorCluster, ConstCStr methodName)
{
    if (errorCluster && !errorCluster->status) {
        errorCluster->status = true;
        errorCluster->code = kLVError_NotSupported;
        errorCluster->source->Resize1D(0);
        AddCallChainToSourceIfErrorPresent(errorCluster, methodName);
    }
}

//------------------------------------------------------------
// Cookie file(0), username(1), password(2), verify Server(3), handle(4), error cluster(5)
VIREO_FUNCTION_SIGNATURE6(HttpClientOpen, StringRef, StringRef, StringRef, UInt32, UInt32, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(3) || !_ParamPointer(4) || !_ParamPointer(5)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    if (!_Param(5).status) {
        jsHttpClientOpen(
            _Param(0)->Type(), _ParamPointer(0),
            _Param(1)->Type(), _ParamPointer(1),
            _Param(2)->Type(), _ParamPointer(2),
            typeRefUInt32, _ParamPointer(3),
            typeRefUInt32, _ParamPointer(4),
            typeRefErrorCluster, _ParamPointer(5));
        AddCallChainToSourceIfErrorPresent(_ParamPointer(5), "HttpClientOpen");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(5), "HttpClientOpen");
#endif

    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), error cluster(1)
VIREO_FUNCTION_SIGNATURE2(HttpClientClose, UInt32, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    // Run close regardless of an existing error to clean-up resources
    Boolean existingStatus = _Param(1).status;
    jsHttpClientClose(
        typeRefUInt32, _ParamPointer(0),
        typeRefErrorCluster, _ParamPointer(1));
    if (!existingStatus) {
        AddCallChainToSourceIfErrorPresent(_ParamPointer(1), "HttpClientClose");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(1), "HttpClientClose");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), value(2), error cluster(3)
VIREO_FUNCTION_SIGNATURE4(HttpClientAddHeader, UInt32, StringRef, StringRef, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(3)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    if (!_Param(3).status) {
        jsHttpClientAddHeader(
            typeRefUInt32, _ParamPointer(0),
            _Param(1)->Type(), _ParamPointer(1),
            _Param(2)->Type(), _ParamPointer(2),
            typeRefErrorCluster, _ParamPointer(3));
        AddCallChainToSourceIfErrorPresent(_ParamPointer(3), "HttpClientAddHeader");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(3), "HttpClientAddHeader");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), error cluster(2)
VIREO_FUNCTION_SIGNATURE3(HttpClientRemoveHeader, UInt32, StringRef, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    if (!_Param(2).status) {
        jsHttpClientRemoveHeader(
            typeRefUInt32, _ParamPointer(0),
            _Param(1)->Type(), _ParamPointer(1),
            typeRefErrorCluster, _ParamPointer(2));
        AddCallChainToSourceIfErrorPresent(_ParamPointer(2), "HttpClientRemoveHeader");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(2), "HttpClientRemoveHeader");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), value(2), error cluster(3)
VIREO_FUNCTION_SIGNATURE4(HttpClientGetHeader, UInt32, StringRef, StringRef, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(3)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    if (!_Param(3).status) {
        jsHttpClientGetHeader(
            typeRefUInt32, _ParamPointer(0),
            _Param(1)->Type(), _ParamPointer(1),
            _Param(2)->Type(), _ParamPointer(2),
            typeRefErrorCluster, _ParamPointer(3));
        AddCallChainToSourceIfErrorPresent(_ParamPointer(3), "HttpClientGetHeader");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(3), "HttpClientGetHeader");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), header(1), headerExist(2), value(3), error cluster(4)
VIREO_FUNCTION_SIGNATURE5(HttpClientHeaderExists, UInt32, StringRef, UInt32, StringRef, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(3) || !_ParamPointer(4)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    if (!_Param(4).status) {
        jsHttpClientHeaderExists(
            typeRefUInt32, _ParamPointer(0),
            _Param(1)->Type(), _ParamPointer(1),
            typeRefUInt32, _ParamPointer(2),
            _Param(3)->Type(), _ParamPointer(3),
            typeRefErrorCluster, _ParamPointer(4));
        AddCallChainToSourceIfErrorPresent(_ParamPointer(4), "HttpClientHeaderExists");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(4), "HttpClientHeaderExists");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), headerList(1), error cluster(2)
VIREO_FUNCTION_SIGNATURE3(HttpClientListHeaders, UInt32, StringRef, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    if (!_Param(2).status) {
        jsHttpClientListHeaders(
            typeRefUInt32, _ParamPointer(0),
            _Param(1)->Type(), _ParamPointer(1),
            typeRefErrorCluster, _ParamPointer(2));
        AddCallChainToSourceIfErrorPresent(_ParamPointer(2), "HttpClientListHeaders");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(2), "HttpClientListHeaders");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), timeout(3), headers(4), body(5), status code(6), error cluster(7), occurrence(8)
// NOTE: occurrence is inserted by the Vireo Compiler
VIREO_FUNCTION_SIGNATURE9(HttpClientGet, UInt32, StringRef, StringRef, Int32, StringRef, StringRef, UInt32, ErrorCluster, OccurrenceRef)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    // Timeout(3) nullptr value is handled by js and occurrence(8) handled by vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(4) || !_ParamPointer(5) || !_ParamPointer(6) || !_ParamPointer(7)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefInt32 = TypeManagerScope::Current()->FindType("Int32");
    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    OccurrenceCore *pOcc = _Param(8)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        if (!_Param(7).status) {
            // This is the initial call, call the js function
            jsHttpClientMethod(
                kGet,
                typeRefUInt32, _ParamPointer(0),
                _Param(1)->Type(), _ParamPointer(1),
                _Param(2)->Type(), _ParamPointer(2),
                nullptr,
                nullptr,
                typeRefInt32, _ParamPointer(3),
                _Param(4)->Type(), _ParamPointer(4),
                _Param(5)->Type(), _ParamPointer(5),
                typeRefUInt32, _ParamPointer(6),
                typeRefErrorCluster, _ParamPointer(7),
                _Param(8));
            pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
            pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
            return clump->WaitOnObservableObject(_this);
        } else {
            return _NextInstruction();
        }
    } else {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        AddCallChainToSourceIfErrorPresent(_ParamPointer(7), "HttpClientGet");
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(7), "HttpClientGet");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), timeout(2), headers(3), status code(4), error cluster(5), occurrence(6)
VIREO_FUNCTION_SIGNATURE7(HttpClientHead, UInt32, StringRef, Int32, StringRef, UInt32, ErrorCluster, OccurrenceRef)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    // Timeout(2) nullptr value is handled by js and occurrence(6) handled by vireo
    if (!_ParamPointer(0) || !_ParamPointer(1)|| !_ParamPointer(3) || !_ParamPointer(4) || !_ParamPointer(5)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefInt32 = TypeManagerScope::Current()->FindType("Int32");
    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    OccurrenceCore *pOcc = _Param(6)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        if (!_Param(5).status) {
            // This is the initial call, call the js function
            jsHttpClientMethod(
                kHead,
                typeRefUInt32, _ParamPointer(0),
                _Param(1)->Type(), _ParamPointer(1),
                nullptr, nullptr,
                nullptr, nullptr,
                typeRefInt32, _ParamPointer(2),
                _Param(3)->Type(), _ParamPointer(3),
                nullptr, nullptr,
                typeRefUInt32, _ParamPointer(4),
                typeRefErrorCluster, _ParamPointer(5),
                _Param(6));
            pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
            pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
            return clump->WaitOnObservableObject(_this);
        } else {
            return _NextInstruction();
        }
    } else {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        AddCallChainToSourceIfErrorPresent(_ParamPointer(5), "HttpClientHead");
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(5), "HttpClientHead");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), buffer(3), timeout(4), headers(5), body(6), status code(7), error cluster(8), occurrence(9)
VIREO_FUNCTION_SIGNATURE10(HttpClientPut, UInt32, StringRef, StringRef, StringRef, Int32, StringRef, StringRef, UInt32, ErrorCluster, OccurrenceRef)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    // Timeout(4) nullptr value is handled by js and occurrence(9) handled by vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(3)
        || !_ParamPointer(5) || !_ParamPointer(6) || !_ParamPointer(7) || !_ParamPointer(8)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefInt32 = TypeManagerScope::Current()->FindType("Int32");
    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    OccurrenceCore *pOcc = _Param(9)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        if (!_Param(8).status) {
            // This is the initial call, call the js function
            jsHttpClientMethod(
                kPut,
                typeRefUInt32, _ParamPointer(0),
                _Param(1)->Type(), _ParamPointer(1),
                _Param(2)->Type(), _ParamPointer(2),
                _Param(3)->Type(), _ParamPointer(3),
                typeRefInt32, _ParamPointer(4),
                _Param(5)->Type(), _ParamPointer(5),
                _Param(6)->Type(), _ParamPointer(6),
                typeRefUInt32 , _ParamPointer(7),
                typeRefErrorCluster, _ParamPointer(8),
                _Param(9));
            pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
            pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
            return clump->WaitOnObservableObject(_this);
        } else {
            return _NextInstruction();
        }
    } else {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        AddCallChainToSourceIfErrorPresent(_ParamPointer(8), "HttpClientPut");
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(8), "HttpClientPut");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), timeout(3), headers(4), body(5), status code(6), error cluster(7), occurrence(8)
VIREO_FUNCTION_SIGNATURE9(HttpClientDelete, UInt32, StringRef, StringRef, Int32, StringRef, StringRef, UInt32, ErrorCluster, OccurrenceRef)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    // Timeout(3) nullptr value is handled by js and occurrence(8) handled by vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(4)
        || !_ParamPointer(5) || !_ParamPointer(6) || !_ParamPointer(7)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefInt32 = TypeManagerScope::Current()->FindType("Int32");
    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    OccurrenceCore *pOcc = _Param(8)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        if (!_Param(7).status) {
            // This is the initial call, call the js function
            jsHttpClientMethod(
                kDelete,
                typeRefUInt32, _ParamPointer(0),
                _Param(1)->Type(), _ParamPointer(1),
                _Param(2)->Type(), _ParamPointer(2),
                nullptr, nullptr,
                typeRefInt32, _ParamPointer(3),
                _Param(4)->Type(), _ParamPointer(4),
                _Param(5)->Type(), _ParamPointer(5),
                typeRefUInt32, _ParamPointer(6),
                typeRefErrorCluster, _ParamPointer(7),
                _Param(8));
            pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
            pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
            return clump->WaitOnObservableObject(_this);
        } else {
            return _NextInstruction();
        }
    } else {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        AddCallChainToSourceIfErrorPresent(_ParamPointer(7), "HttpClientDelete");
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(7), "HttpClientDelete");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), url(1), output file(2), buffer(3), timeout(4), headers(5), body(6), status code(7), error cluster(8), occurrence(9)
VIREO_FUNCTION_SIGNATURE10(HttpClientPost, UInt32, StringRef, StringRef, StringRef, Int32, StringRef, StringRef, UInt32, ErrorCluster, OccurrenceRef)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    // Timeout(4) nullptr value is handled by js and occurrence(9) handled by vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2) || !_ParamPointer(3)
        || !_ParamPointer(5) || !_ParamPointer(6) || !_ParamPointer(7) || !_ParamPointer(8)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefInt32 = TypeManagerScope::Current()->FindType("Int32");
    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    OccurrenceCore *pOcc = _Param(9)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        if (!_Param(8).status) {
            // This is the initial call, call the js function
            jsHttpClientMethod(
                kPost,
                typeRefUInt32, _ParamPointer(0),
                _Param(1)->Type(), _ParamPointer(1),
                _Param(2)->Type(), _ParamPointer(2),
                _Param(3)->Type(), _ParamPointer(3),
                typeRefInt32, _ParamPointer(4),
                _Param(5)->Type(), _ParamPointer(5),
                _Param(6)->Type(), _ParamPointer(6),
                typeRefUInt32, _ParamPointer(7),
                typeRefErrorCluster, _ParamPointer(8),
                _Param(9));
            pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
            pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
            return clump->WaitOnObservableObject(_this);
        } else {
            return _NextInstruction();
        }
    } else {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        AddCallChainToSourceIfErrorPresent(_ParamPointer(8), "HttpClientPost");
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(8), "HttpClientPost");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
// handle(0), includeCredentialsDuringCORS(1), error cluster(2)
VIREO_FUNCTION_SIGNATURE3(HttpClientConfigCORS, UInt32, UInt32, ErrorCluster)
{
#if kVireoOS_emscripten
    // TODO(rajsite): these checks are too aggressive. Should allow unwired values for optional terminals and avoid checking types inserted by Vireo
    if (!_ParamPointer(0) || !_ParamPointer(1) || !_ParamPointer(2)) {
        THREAD_EXEC()->LogEvent(EventLog::kHardDataError, HTTP_REQUIRED_INPUTS_MESSAGE);
        return THREAD_EXEC()->Stop();
    }

    TypeRef typeRefInt32 = TypeManagerScope::Current()->FindType("Int32");
    TypeRef typeRefUInt32 = TypeManagerScope::Current()->FindType("UInt32");
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

    if (!_Param(2).status) {
        jsHttpClientConfigCORS(
            typeRefUInt32, _ParamPointer(0),
            typeRefUInt32, _ParamPointer(1),
            typeRefErrorCluster, _ParamPointer(2));
        AddCallChainToSourceIfErrorPresent(_ParamPointer(2), "HttpClientConfigCORS");
    }
#else
    GenerateNotSupportedOnPlatformError(_ParamPointer(2), "HttpClientConfigCORS");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(HttpClient)
    DEFINE_VIREO_REQUIRE(Synchronization)
    DEFINE_VIREO_FUNCTION(HttpClientOpen, "p(i(.String) i(.String) i(.String) i(.UInt32) o(.UInt32) io(" ERROR_CLUST_TYPE_STRING "))")
    DEFINE_VIREO_FUNCTION(HttpClientClose, "p(i(.UInt32) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION(HttpClientAddHeader, "p(io(.UInt32) i(.String) i(.String) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION(HttpClientRemoveHeader, "p(io(.UInt32) i(.String) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION(HttpClientGetHeader, "p(io(.UInt32) i(.String) o(.String) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION(HttpClientHeaderExists, "p(io(.UInt32) i(.String) o(.UInt32) o(.String) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION(HttpClientListHeaders, "p(io(.UInt32) o(.String) io(ErrorCluster))")
    DEFINE_VIREO_FUNCTION(HttpClientGet, "p(io(.UInt32) i(.String) i(.String) i(.Int32) o(.String) o(.String) o(.UInt32) io(ErrorCluster) s(.Occurrence))")
    DEFINE_VIREO_FUNCTION(HttpClientHead, "p(io(.UInt32) i(.String) i(.Int32) o(.String) o(.UInt32) io(" ERROR_CLUST_TYPE_STRING ") s(.Occurrence))")
    DEFINE_VIREO_FUNCTION(HttpClientPut, "p(io(.UInt32) i(.String) i(.String) i(.String) i(.Int32) o(.String) "
                          "o(.String) o(.UInt32) io(ErrorCluster) s(.Occurrence))")
    DEFINE_VIREO_FUNCTION(HttpClientDelete, "p(io(.UInt32) i(.String) i(.String) i(.Int32) o(.String) "
                          "o(.String) o(.UInt32) io(ErrorCluster) s(.Occurrence))")
    DEFINE_VIREO_FUNCTION(HttpClientPost, "p(io(.UInt32) i(.String) i(.String) i(.String) i(.Int32) "
                          "o(.String) o(.String) o(.UInt32) io(ErrorCluster) s(.Occurrence))")
    DEFINE_VIREO_FUNCTION(HttpClientConfigCORS, "p(io(.UInt32) i(.UInt32) io(ErrorCluster))")
DEFINE_VIREO_END()

}  // namespace Vireo
#endif  // VIREO_TYPE_HttpClient
