/**

Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Functions to write and read property values on controls
*/

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"
#include "VirtualInstrument.h"
#include <stdio.h>


#define VIREO_MODULE_PropertyNode 1

#if defined (VIREO_MODULE_PropertyNode)
namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    // JavaScript function prototypes
    // Parameters: viName, dataItemId, propertyName, propertyType, propertyPath, errorStatus*, errorCode*, errorSource*
    extern void jsPropertyNodeWrite(StringRef, StringRef, StringRef, StringRef, StringRef, Boolean *, Int32 *, StringRef);
    // Parameters: viName, dataItemId, propertyName, propertyType, propertyPath, errorStatus*, errorCode*, errorSource*
    extern void jsPropertyNodeRead(StringRef, StringRef, StringRef, StringRef, StringRef, Boolean *, Int32 *, StringRef);
}
#endif

extern void AddCallChainToSourceIfErrorPresent(ErrorCluster *errorCluster, ConstCStr methodName);
extern void GenerateNotSupportedOnPlatformError(ErrorCluster *errorCluster, ConstCStr methodName);

//------------------------------------------------------------
struct PropertyNodeWriteParamBlock : public VarArgInstruction
{
    _ParamDef(StringRef, viName);
    _ParamDef(StringRef, dataItemId);
    _ParamDef(StringRef, propertyName);
    _ParamImmediateDef(StaticTypeAndData, value[1]);
    _ParamDef(ErrorCluster, errorCluster);
    NEXT_INSTRUCTION_METHODV()
};

//------------------------------------------------------------
// Function for setting a property in a control
VIREO_FUNCTION_SIGNATUREV(PropertyNodeWrite, PropertyNodeWriteParamBlock)
{
    ErrorCluster *errorClusterPtr = _ParamPointer(errorCluster);
#if kVireoOS_emscripten
    StringRef viName = _Param(viName);
    StringRef dataItemId = _Param(dataItemId);
    StringRef propertyName = _Param(propertyName);
    StaticTypeAndData *value = _ParamImmediate(value);

    TypeManagerRef typeManager = value->_paramType->TheTypeManager();

    STACK_VAR(String, pathRef);
    typeManager->PointerToSymbolPath(value->_paramType, value->_pData, pathRef.Value);

    STACK_VAR(String, typeRef);
    SubString typeName = value->_paramType->Name();
    typeRef.Value->AppendSubString(&typeName);

    if (!errorClusterPtr->status) {
        jsPropertyNodeWrite(
            viName,
            dataItemId,
            propertyName,
            typeRef.Value,
            pathRef.Value,
            &errorClusterPtr->status,
            &errorClusterPtr->code,
            errorClusterPtr->source);
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, "PropertyNodeWrite");
    }
#else
    GenerateNotSupportedOnPlatformError(errorClusterPtr, "PropertyNodeWrite");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
struct PropertyNodeReadParamBlock : public VarArgInstruction
{
    _ParamDef(StringRef, viName);
    _ParamDef(StringRef, dataItemId);
    _ParamDef(StringRef, propertyName);
    _ParamImmediateDef(StaticTypeAndData, value[1]);
    _ParamDef(ErrorCluster, errorCluster);
    NEXT_INSTRUCTION_METHODV()
};

//------------------------------------------------------------
// Function for setting a property in a control
VIREO_FUNCTION_SIGNATUREV(PropertyNodeRead, PropertyNodeReadParamBlock)
{
    ErrorCluster *errorClusterPtr = _ParamPointer(errorCluster);
#if kVireoOS_emscripten
    StringRef viName = _Param(viName);
    StringRef dataItemId = _Param(dataItemId);
    StringRef propertyName = _Param(propertyName);
    StaticTypeAndData *value = _ParamImmediate(value);

    TypeManagerRef typeManager = value->_paramType->TheTypeManager();

    STACK_VAR(String, pathRef);
    typeManager->PointerToSymbolPath(value->_paramType, value->_pData, pathRef.Value);

    STACK_VAR(String, typeRef);
    SubString typeName = value->_paramType->Name();
    typeRef.Value->AppendSubString(&typeName);

    if (!errorClusterPtr->status) {
        jsPropertyNodeRead(
            viName,
            dataItemId,
            propertyName,
            typeRef.Value,
            pathRef.Value,
            &errorClusterPtr->status,
            &errorClusterPtr->code,
            errorClusterPtr->source);
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, "PropertyNodeRead");
    }
#else
    GenerateNotSupportedOnPlatformError(errorClusterPtr, "PropertyNodeRead");
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(Property)
    DEFINE_VIREO_FUNCTION(PropertyNodeWrite, "p(i(VarArgCount argumentCount) i(String viName) i(String controlId) i(String propertyName) "
        "i(StaticTypeAndData value) io(ErrorCluster errorCluster))")
    DEFINE_VIREO_FUNCTION(PropertyNodeRead, "p(i(VarArgCount argumentCount) i(String viName) i(String controlId) i(String propertyName) "
        "o(StaticTypeAndData value) io(ErrorCluster errorCluster))")
DEFINE_VIREO_END()

}  // namespace Vireo
#endif  // VIREO_MODULE_PropertyNode
