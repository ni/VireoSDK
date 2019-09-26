/**

Copyright (c) 2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Close Reference
*/

#include "TypeDefiner.h"
#include "RefNum.h"
#include "JavaScriptRef.h"

namespace Vireo {

    enum { kCloseReferenceArgErr = 1, kCloseReferenceInvalidReference = 1556 };

    //------------------------------------------------------------
    struct CloseReferenceParamBlock : public InstructionCore
    {
        _ParamImmediateDef(StaticTypeAndData, Reference);
        _ParamDef(ErrorCluster, ErrorClust);
        NEXT_INSTRUCTION_METHOD()
    };

    VIREO_FUNCTION_SIGNATURET(CloseReference, CloseReferenceParamBlock)
    {
        ErrorCluster *errPtr = _ParamPointer(ErrorClust);
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
        isSupportedType = isSupportedType && elementType->IsJavaScriptDynamicRefNum();

        // Return error for unsupported types
        if (!isSupportedType)
        {
            if (errPtr && !errPtr->status)
                errPtr->SetErrorAndAppendCallChain(true, kCloseReferenceArgErr, "CloseReference");
            return _NextInstruction();
        }

        // Run close reference code regardless of current error on wire
        Boolean closeReferenceError = false;
        if (type->IsArray())
        {
        }
        else if (elementType->IsJavaScriptDynamicRefNum())
        {
        }

        // Report close reference error if there is not an error already present
        if (errPtr && !errPtr->status && closeReferenceError)
            errPtr->SetErrorAndAppendCallChain(true, kCloseReferenceInvalidReference, "CloseReference");

        return _NextInstruction();
    }

    //------------------------------------------------------------
    DEFINE_VIREO_BEGIN(CloseReference)
        DEFINE_VIREO_REQUIRE(JavaScriptDynamicRefNum)

        DEFINE_VIREO_FUNCTION(CloseReference, "p(i(StaticTypeAndData reference) io(ErrorCluster error))");
    DEFINE_VIREO_END()
}  // namespace Vireo
