/**

Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Functions to call user defined JavaScript functions
*/

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include <stdio.h>
#include "VirtualInstrument.h"

#if defined(VIREO_TYPE_JavaScriptInvoke)
namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    // JavaScript function prototypes
    extern void jsJavaScriptInvoke(OccurrenceRef occurrence, StringRef functionName, void *returnValue, void *parameters, Int32 parametersCount,
                                    Boolean isInternalFunction, TypeRef errorClusterType, ErrorCluster* errorClusterData);
}
#endif

StringRef AllocateReturnBuffer()
{
    static StringRef returnBuffer = nullptr;
    if (returnBuffer == nullptr) {
        // Allocate a string the first time it is used.
        // After that it will be resized as needed.
        STACK_VAR(String, tempReturn);
        returnBuffer = tempReturn.DetachValue();
    } else {
        returnBuffer->Resize1D(0);
    }

    return returnBuffer;
}

//------------------------------------------------------------
//! Return parameter type name for the given element(index) in the parameters array
VIREO_EXPORT const char* JavaScriptInvoke_GetParameterType(StaticTypeAndData *parameters, Int32 index)
{
    TypeRef parameterType = parameters[index]._paramType;
    StringRef returnBuffer = AllocateReturnBuffer();

    if (returnBuffer) {
        SubString typeName = parameterType->Name();
        returnBuffer->Append(typeName.Length(), (Utf8Char*)typeName.Begin());

        // Add an explicit nullptr terminator so it looks like a C string.
        returnBuffer->Append((Utf8Char)'\0');
        return (const char*)returnBuffer->Begin();
    }

    return nullptr;
}

VIREO_EXPORT const char* JavaScriptInvoke_GetArrayElementType(TypedArrayCoreRef arrayObject)
{
    StringRef returnBuffer = AllocateReturnBuffer();
    if (returnBuffer) {
        SubString elementTypeName = arrayObject->ElementType()->Name();
        returnBuffer->Append(elementTypeName.Length(), (Utf8Char*)elementTypeName.Begin());

        // Add an explicit nullptr terminator so it looks like a C string.
        returnBuffer->Append((Utf8Char)'\0');
        return (const char*)returnBuffer->Begin();
    }

    return nullptr;
}

//------------------------------------------------------------
//! Return parameter pointer for the given element(index) in the parameters array
VIREO_EXPORT void* JavaScriptInvoke_GetParameterPointer(StaticTypeAndData *parameters, Int32 index)
{
    void *pData = parameters[index]._pData;
    TypeRef parameterType = parameters[index]._paramType;
    if (parameterType->IsString()) {
        // We a have pointer to a StringRef, we just need the StringRef.
        // So we can use functions that already work with StringRef on the JavaScript side.
        pData = *(StringRef*)pData;
    } else if (parameterType->IsArray()) {
        pData = *(TypedArrayCoreRef*)pData;
    } else if (!(parameterType->IsNumeric()
        || parameterType->IsString()
        || parameterType->IsFloat()
        || parameterType->IsBoolean()
        || parameterType->IsJavaScriptRefNum())) {
        return nullptr;
    } else if (parameterType->IsInteger64()) {
        return nullptr;
    }

    return pData;
}

//------------------------------------------------------------
// arguments: occurrence, isInternalFunction, errorCluster, functionName, returnValue, then variable number of inputs that can be nullptr or any type
struct JavaScriptInvokeParamBlock : public VarArgInstruction
{
    _ParamDef(OccurrenceRef, occurrence);
    _ParamDef(Boolean, isInternalFunction);
    _ParamDef(ErrorCluster, errorCluster);
    _ParamDef(StringRef, functionName);
    _ParamImmediateDef(StaticTypeAndData, returnValue[1]);
    _ParamImmediateDef(StaticTypeAndData, parameters[1]);
    NEXT_INSTRUCTION_METHODV()
};

extern void AddCallChainToSourceIfErrorPresent(ErrorCluster *errorCluster, ConstCStr methodName);
extern void GenerateNotSupportedOnPlatformError(ErrorCluster *errorCluster, ConstCStr methodName);

//------------------------------------------------------------
// Function for calling user defined JavaScript functions
VIREO_FUNCTION_SIGNATUREV(JavaScriptInvoke, JavaScriptInvokeParamBlock)
{
    ErrorCluster *errorClusterPtr = _ParamPointer(errorCluster);
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");

#if kVireoOS_emscripten
    OccurrenceCore *pOcc = _Param(occurrence)->ObjBegin();
    VIClump* clump = THREAD_CLUMP();
    Observer* pObserver = clump->GetObservationStates(2);
    if (!pObserver) {
        StringRef functionName = _Param(functionName);
        Boolean isInternalFunction = _Param(isInternalFunction);
        const Int32 configurationParameters = 4;  // occurrence, isInternalFunction, errorCluster and functionName
        const Int32 staticTypeAndDataParameters = 2;  // Two parameters are inserted, one for type another for data. See StaticTypeAndData definition.
        Int32 userParametersCount = (_ParamVarArgCount() - configurationParameters - staticTypeAndDataParameters) / staticTypeAndDataParameters;
        StaticTypeAndData *returnValuePtr = _ParamImmediate(returnValue);
        StaticTypeAndData *parametersPtr = _ParamImmediate(parameters);

        bool shouldInvoke = errorClusterPtr == nullptr ? true : !errorClusterPtr->status;

        if (shouldInvoke) {
            pObserver = clump->ReserveObservationStatesWithTimeout(2, 0);
            pOcc->InsertObserver(pObserver + 1, pOcc->Count() + 1);
            jsJavaScriptInvoke(
                _Param(occurrence),
                functionName,
                returnValuePtr,
                parametersPtr,
                userParametersCount,
                isInternalFunction,
                typeRefErrorCluster,
                errorClusterPtr);

            if (isInternalFunction) {
                AddCallChainToSourceIfErrorPresent(errorClusterPtr, (const char*)functionName->Begin());
            } else {
                AddCallChainToSourceIfErrorPresent(errorClusterPtr, "JavaScriptInvoke");
            }

            InstructionCore* instructionCorePtr = clump->WaitOnObservableObject(_this);
            return instructionCorePtr;
        }
    } else {
        // re-entering the instruction and the operation is done or it timed out.
        // the clump should continue.
        clump->ClearObservationStates();
        return _NextInstruction();
    }
#else
    GenerateNotSupportedOnPlatformError(errorClusterPtr, "JavaScriptInvoke");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(JavaScriptInvoke)
    DEFINE_VIREO_REQUIRE(Synchronization)
    DEFINE_VIREO_FUNCTION(JavaScriptInvoke, "p(i(VarArgCount argumentCount) i(Occurrence occurrence) i(Boolean isInternalFunction)"
        "io(ErrorCluster errorCluster) i(String functionName) o(StaticTypeAndData returnValue) io(StaticTypeAndData functionParameters))")
DEFINE_VIREO_END()


}  // namespace Vireo
#endif  // VIREO_TYPE_JavaScriptInvoke
