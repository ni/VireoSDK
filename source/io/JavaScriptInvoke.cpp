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

#if defined (VIREO_TYPE_JavaScriptInvoke)
namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    // JavaScript function prototypes
    // Parameters: functionName, parameters*, parametersCount, errorCheckingEnabled, errorStatus*, errorCode*, errorSource*
    extern void jsJavaScriptInvoke(StringRef, void *, Int32, Boolean, Boolean *, Int32 *, StringRef);
}
#endif

// Keep in synchrony with JAVASCRIPT_PARAMETER_TYPE in module_javaScriptInvoke.js
enum JavaScriptParameterTypeEnum {
    kJavaScriptParameterType_None = 0,
    kJavaScriptParameterType_Int32,
    kJavaScriptParameterType_UInt32,
    kJavaScriptParameterType_String,
    kJavaScriptParameterType_Boolean
};

//------------------------------------------------------------
//! Return parameter type for the given element(index) in the parameters array
VIREO_EXPORT Int32 Data_GetParameterType(StaticTypeAndData *parameters, Int32 index)
{
    TypeRef parameterType = parameters[index]._paramType;
    Int32 type = kJavaScriptParameterType_None;
    if (parameterType->BitEncoding() == kEncoding_UInt) {
        type = kJavaScriptParameterType_Int32;
    } else if (parameterType->BitEncoding() == kEncoding_S2CInt) {
        type = kJavaScriptParameterType_UInt32;
    } else if (parameterType->BitEncoding() == kEncoding_Boolean) {
        type = kJavaScriptParameterType_Boolean;
    } else if (parameterType->IsString()) {
        type = kJavaScriptParameterType_String;
    }
    return type;
}

//------------------------------------------------------------
//! Return parameter pointer for the given element(index) in the parameters array
VIREO_EXPORT void* Data_GetParameterPointer(StaticTypeAndData *parameters, Int32 index)
{
    void *pData = parameters[index]._pData;
    TypeRef parameterType = parameters[index]._paramType;
    if (parameterType->IsString()) {
        // We a have pointer to a StringRef, we just need the StringRef.
        // So we can use functions that already work with StringRef on the JavaScript side.
        pData = *(StringRef*)pData;
    }
    return pData;
}

//------------------------------------------------------------
// arguments: functionName, errorCheckingEnabled, errorCluster, then variable number of inputs that can be null or any type
struct JavaScriptInvokeParamBlock : public VarArgInstruction
{
    _ParamDef(StringRef, functionName);
    _ParamDef(Boolean, errorCheckingEnabled);
    _ParamDef(ErrorCluster, errorCluster);
    _ParamImmediateDef(StaticTypeAndData, Parameters[1]);
    NEXT_INSTRUCTION_METHODV()
};

extern void AddCallChainToSourceIfErrorPresent(ErrorCluster *errorCluster, ConstCStr methodName);
extern void GenerateNotSupportedOnPlatformError(ErrorCluster *errorCluster, ConstCStr methodName);

//------------------------------------------------------------
// Function for calling user defined JavaScript functions
VIREO_FUNCTION_SIGNATUREV(JavaScriptInvoke, JavaScriptInvokeParamBlock)
{
    ErrorCluster *errorClusterPtr = _ParamPointer(errorCluster);
#if kVireoOS_emscripten
    StringRef functionName = _Param(functionName);
    Boolean errorCheckingEnabled = _Param(errorCheckingEnabled);
    const Int32 configurationParameters = 3;  // functionName, errorCheckingEnabled & errorCluster
    const Int32 staticTypeAndDataElements = 2;  // Two elements, one for type another for data. See StaticTypeAndData definition.
    Int32 parametersCount = (_ParamVarArgCount() - configurationParameters) / staticTypeAndDataElements;
    StaticTypeAndData *parameters = _ParamImmediate(Parameters);

    if (!errorClusterPtr->status) {
        jsJavaScriptInvoke(
            functionName,
            parameters,
            parametersCount,
            errorCheckingEnabled,
            &errorClusterPtr->status,
            &errorClusterPtr->code,
            errorClusterPtr->source);
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, "JavaScriptInvoke");
    }
#else
    GenerateNotSupportedOnPlatformError(errorClusterPtr, "JavaScriptInvoke");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(JavaScriptInvoke)
    DEFINE_VIREO_FUNCTION(JavaScriptInvoke, "p(i(VarArgCount argumentCount) i(String functionName) i(Boolean errorCheckingEnabled) "
        "io(ErrorCluster errorCluster) io(StaticTypeAndData functionParameters))")
DEFINE_VIREO_END()

}  // namespace Vireo
#endif  // VIREO_TYPE_JavaScriptInvoke
