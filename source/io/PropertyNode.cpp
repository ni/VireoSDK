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
    // Parameters: controlRefVIName, dataItemName, propertyName, propertyTypeName, tempVariableVIName, tempVariablePath, errorStatus*, errorCode*, errorSource*
    extern void jsPropertyNodeWrite(StringRef, StringRef, StringRef, StringRef, StringRef, StringRef, Boolean *, Int32 *, StringRef);
    // Parameters: controlRefVIName, dataItemName, propertyName, propertyTypeName, tempVariableVIName, tempVariablePath, errorStatus*, errorCode*, errorSource*
    extern void jsPropertyNodeRead(StringRef, StringRef, StringRef, StringRef, StringRef, StringRef, Boolean *, Int32 *, StringRef);
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
                                           StringRef viName, StringRef *dataItemId, ConstCStr propNodeName) {
    VirtualInstrument *vi;
    if (ControlReferenceLookup(refNumPtr->GetRefNum(), &vi, dataItemId) != kNIError_Success) {
        errorClusterPtr->SetError(true, kNIError_ObjectReferenceIsInvalid, propNodeName);
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, propNodeName);
        return false;
    }
    PercentEncodedSubString encodedStr(vi->VIName(), true, false);
    SubString encodedSubstr = encodedStr.GetSubString();
    viName->AppendSubString(&encodedSubstr);
    return true;
}

static bool FindVINameAndPropertyPathForValue(StaticTypeAndData *value, ErrorCluster *errorClusterPtr,
                                            StringRef viName, StringRef path, ConstCStr propNodeName)
{
    TypeManagerRef typeManager = value->_paramType->TheTypeManager();

    STACK_VAR(String, pathRef);
    StringRef symbolPath = pathRef.Value;
    Boolean foundInVI = false;
    typeManager->PointerToSymbolPath(value->_paramType, value->_pData, symbolPath, &foundInVI);

    SubString symbolPathSubStr = symbolPath->MakeSubStringAlias();
    if (symbolPathSubStr.CompareCStr("*pointer-not-found*")) {
        errorClusterPtr->SetError(true, kNIError_ObjectReferenceIsInvalid, propNodeName);
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, propNodeName);
        return false;
    }

    if (foundInVI) {
       SubString pathHead;
       SubString pathTail;
       symbolPathSubStr.SplitString(&pathHead, &pathTail, '.');
       viName->AppendSubString(&pathHead);
       SubString localsTail;
       pathTail.SplitString(&pathHead, &localsTail, '.');
       path->AppendSubString(&localsTail);
    } else {
       viName->AppendCStr("");
       path->AppendStringRef(pathRef.Value);
    }

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

    STACK_VAR(String, controlRefVINameVar);
    StringRef controlRefVIName = controlRefVINameVar.Value;
    StringRef controlRefDataItemId = nullptr;
    if (!LookupControlRefForPropertyNode(refNumPtr, errorClusterPtr, controlRefVIName, &controlRefDataItemId, propNodeWriteName))
        return _NextInstruction();  // control refnum lookup failed and set errorCluster

    STACK_VAR(String, tempVariableVINameStackVar);
    STACK_VAR(String, tempVariablePathStackVar);
    StringRef tempVariableVIName = tempVariableVINameStackVar.Value;
    StringRef tempVariablePath = tempVariablePathStackVar.Value;
    if (!FindVINameAndPropertyPathForValue(value, errorClusterPtr, tempVariableVIName, tempVariablePath, propNodeWriteName))
        return _NextInstruction();

    STACK_VAR(String, typeNameStackVar);
    StringRef propertyTypeName = typeNameStackVar.Value;
    SubString typeNameSubStr = value->_paramType->Name();
    propertyTypeName->AppendSubString(&typeNameSubStr);

    ErrorCluster internalErrorCluster;
    if (!errorClusterPtr)
        errorClusterPtr = &internalErrorCluster;

    if (!errorClusterPtr->status) {
        jsPropertyNodeWrite(
            controlRefVIName,
            controlRefDataItemId,
            propertyName,
            propertyTypeName,
            tempVariableVIName,
            tempVariablePath,
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

    STACK_VAR(String, controlRefVINameVar);
    StringRef controlRefVIName = controlRefVINameVar.Value;
    StringRef controlRefDataItemId = nullptr;
    if (!LookupControlRefForPropertyNode(refNumPtr, errorClusterPtr, controlRefVIName, &controlRefDataItemId, propNodeReadName))
        return _NextInstruction();  // control refnum lookup failed and set errorCluster

    STACK_VAR(String, tempVariableVINameStackVar);
    STACK_VAR(String, tempVariablePathStackVar);
    StringRef tempVariableVIName = tempVariableVINameStackVar.Value;
    StringRef tempVariablePath = tempVariablePathStackVar.Value;
    if (!FindVINameAndPropertyPathForValue(value, errorClusterPtr, tempVariableVIName, tempVariablePath, propNodeReadName))
        return _NextInstruction();

    STACK_VAR(String, typeNameStackVar);
    StringRef propertyTypeName = typeNameStackVar.Value;
    SubString typeNameSubStr = value->_paramType->Name();
    propertyTypeName->AppendSubString(&typeNameSubStr);

    ErrorCluster internalErrorCluster;
    if (!errorClusterPtr)
        errorClusterPtr = &internalErrorCluster;

    if (!errorClusterPtr->status) {
        jsPropertyNodeRead(
            controlRefVIName,
            controlRefDataItemId,
            propertyName,
            propertyTypeName,
            tempVariableVIName,
            tempVariablePath,
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
