// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief JavaScript dynamic reference
 */

#include "TypeDefiner.h"
#include "RefNum.h"
#include "JavaScriptRef.h"

namespace Vireo {

VIREO_FUNCTION_SIGNATURE2(IsNotAJavaScriptDynamicRefnum, JavaScriptDynamicRefNum, Boolean)
{
    Boolean isNotARefnum = false;
    JavaScriptDynamicRefNum* refnumPtr = _ParamPointer(0);
#if kVireoOS_emscripten
    TypeRef typeRefJavaScriptRefNum = TypeManagerScope::Current()->FindType(tsJavaScriptDynamicRefNumType);
    TypeRef typeRefIsNotARefNum = TypeManagerScope::Current()->FindType(tsBooleanType);
        jsIsNotAJavaScriptRefnum(typeRefJavaScriptRefNum, refnumPtr, typeRefIsNotARefNum, &isNotARefnum);
#else
        isNotARefnum = *refnumPtr == 0;
#endif
    _Param(1) = isNotARefnum;
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE3(IsEQRefnum, RefNumVal, RefNumVal, Boolean);
VIREO_FUNCTION_SIGNATURE3(IsNERefnum, RefNumVal, RefNumVal, Boolean);

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(JavaScriptRefs)
    DEFINE_VIREO_REQUIRE(VirtualInstrument)

    DEFINE_VIREO_TYPE(JavaScriptDynamicRefNum, "refnum(UInt32)")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAJavaScriptDynamicRefnum, "p(i(JavaScriptDynamicRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(JavaScriptDynamicRefNum) i(JavaScriptDynamicRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(JavaScriptDynamicRefNum) i(JavaScriptDynamicRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQSearch, IsEQRefnum, "p(i(JavaScriptDynamicRefNum) i(JavaScriptDynamicRefNum) o(Boolean))")

DEFINE_VIREO_END()
}  // namespace Vireo
