// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
\brief Close Reference
*/

#include "TypeDefiner.h"
#include "RefNum.h"
#include "JavaScriptRef.h"

namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    extern void jsCloseJavaScriptRefNum(TypeRef, void*, TypeRef errorClusterType, ErrorCluster* errorClusterData);
}
#endif

extern void AddCallChainToSourceIfErrorPresent(ErrorCluster *errorCluster, ConstCStr methodName);

enum { kCloseReferenceArgErr = 1 };

//------------------------------------------------------------
struct CloseReferenceParamBlock : public InstructionCore
{
    _ParamImmediateDef(StaticTypeAndData, Reference);
    _ParamDef(ErrorCluster, ErrorClust);
    NEXT_INSTRUCTION_METHOD()
};

// NOTE: JavaScriptStaticRefNum (Control references) aren't closed and don't return close reference errors
VIREO_FUNCTION_SIGNATURET(CloseReference, CloseReferenceParamBlock)
{
    ErrorCluster *errorClusterPtr = _ParamPointer(ErrorClust);
    TypeRef type = _ParamImmediate(Reference._paramType);
    void* pData = _ParamImmediate(Reference)._pData;

    // Check for supported types
    TypeRef elementType = type;
    Boolean isSupportedType = true;
    TypedArrayCoreRef pArray = nullptr;
    if (type->IsArray())
    {
        elementType = type->GetSubElement(0);
        pArray = *(TypedArrayCoreRef*)pData;
        Int32 rank = pArray->Rank();
        isSupportedType = isSupportedType && rank == 1;
    }
    isSupportedType =
        isSupportedType &&
        (elementType->IsJavaScriptDynamicRefNum() ||
            elementType->IsJavaScriptStaticRefNum());

    // Return argument error for unsupported types
    if (!isSupportedType)
    {
        if (errorClusterPtr && !errorClusterPtr->status)
            errorClusterPtr->SetErrorAndAppendCallChain(true, kCloseReferenceArgErr, "CloseReference");
        return _NextInstruction();
    }

    // Run close reference code regardless of current error on wire
    Boolean errorAlreadyPresent = (errorClusterPtr && errorClusterPtr->status);
    TypeRef typeRefErrorCluster = TypeManagerScope::Current()->FindType("ErrorCluster");
#if kVireoOS_emscripten
    if (elementType->IsJavaScriptDynamicRefNum()) {
        if (type->IsArray()) {
            for (IntIndex i = 0; i < pArray->Length(); i++) {
                jsCloseJavaScriptRefNum(elementType, pArray->BeginAt(i), typeRefErrorCluster, errorClusterPtr);
            }
        } else {
            jsCloseJavaScriptRefNum(elementType, pData, typeRefErrorCluster, errorClusterPtr);
        }
    }
#endif

    // Report close reference error if there is not an error already present
    if (!errorAlreadyPresent)
        AddCallChainToSourceIfErrorPresent(errorClusterPtr, "CloseReference");

    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(CloseReferenceModule)
    DEFINE_VIREO_REQUIRE(JavaScriptRefs)

    DEFINE_VIREO_FUNCTION(CloseReference, "p(i(StaticTypeAndData reference) io(ErrorCluster error))");
DEFINE_VIREO_END()
}  // namespace Vireo
