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
#include "ControlRef.h"
#include <stdio.h>


#define VIREO_MODULE_PropertyNode 1

#if defined (VIREO_MODULE_PropertyNode)
namespace Vireo {

enum { kNIError_ObjectReferenceIsInvalid = 1055 };  // TODO(spathiwa) move to common error header file when issue #384 fixed

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
    _ParamDef(RefNumVal, refNum);
    _ParamDef(StringRef, propertyName);
    _ParamImmediateDef(StaticTypeAndData, value[1]);
    _ParamDef(ErrorCluster, errorCluster);
    NEXT_INSTRUCTION_METHODV()
};

#if kVireoOS_emscripten
static bool LookupControlRefForPropertyNode(RefNumVal *refNumPtr, ErrorCluster *errorClusterPtr,
                                           StringRef viName, StringRef dataItemId, ConstCStr propNodeName) {
    VirtualInstrument *vi;
    SubString dataItemIdSubString;
    if (ControlReferenceLookup(refNumPtr->GetRefNum(), &vi, &dataItemIdSubString) != kNIError_Success) {
        errorClusterPtr->SetError(true, kNIError_ObjectReferenceIsInvalid, propNodeName);
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, propNodeName);
        return false;
    }
    viName->AppendCStr(vi->VINameCStr());
    dataItemId->AppendSubString(&dataItemIdSubString);
    return true;
}
#endif

//------------------------------------------------------------
// Function for setting a property in a control
VIREO_FUNCTION_SIGNATUREV(PropertyNodeWrite, PropertyNodeWriteParamBlock)
{
    ErrorCluster *errorClusterPtr = _ParamPointer(errorCluster);
    const char *propNodeWriteName = "PropertyNodeWrite";
#if kVireoOS_emscripten
    RefNumVal *refNumPtr = _ParamPointer(refNum);
    StringRef propertyName = _Param(propertyName);
    StaticTypeAndData *value = _ParamImmediate(value);

    STACK_VAR(String, viNameVar);
    StringRef viName = viNameVar.Value;
    STACK_VAR(String, dataItemIdVar);
    StringRef dataItemId = dataItemIdVar.Value;
    if (!LookupControlRefForPropertyNode(refNumPtr, errorClusterPtr, viName, dataItemId, propNodeWriteName))
        return _NextInstruction();  // control refnum lookup failed and set errorCluter

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
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, propNodeWriteName);
    }
#else
    GenerateNotSupportedOnPlatformError(errorClusterPtr, propNodeWriteName);
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
struct PropertyNodeReadParamBlock : public VarArgInstruction
{
    _ParamDef(RefNumVal, refNum);
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
    const char *propNodeReadName = "PropertyNodeRead";
#if kVireoOS_emscripten
    RefNumVal *refNumPtr = _ParamPointer(refNum);
    StringRef propertyName = _Param(propertyName);
    StaticTypeAndData *value = _ParamImmediate(value);

    STACK_VAR(String, viNameVar);
    StringRef viName = viNameVar.Value;
    STACK_VAR(String, dataItemIdVar);
    StringRef dataItemId = dataItemIdVar.Value;
    if (!LookupControlRefForPropertyNode(refNumPtr, errorClusterPtr, viName, dataItemId, propNodeReadName))
        return _NextInstruction();  // control refnum lookup failed and set errorCluter

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
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, propNodeReadName);
    }
#else
    GenerateNotSupportedOnPlatformError(errorClusterPtr, propNodeReadName);
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(Property)
    DEFINE_VIREO_REQUIRE(ControlRefs)

    DEFINE_VIREO_FUNCTION(PropertyNodeWrite, "p(i(VarArgCount argumentCount) i(ControlRefNum controlRef) i(String propertyName) "
                          "i(StaticTypeAndData value) io(ErrorCluster errorCluster))")
    DEFINE_VIREO_FUNCTION(PropertyNodeRead, "p(i(VarArgCount argumentCount) i(ControlRefNum controlRef) i(String propertyName) "
                          "o(StaticTypeAndData value) io(ErrorCluster errorCluster))")

DEFINE_VIREO_END()

}  // namespace Vireo
#endif  // VIREO_MODULE_PropertyNode
