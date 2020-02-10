// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief JavaScript static reference
 */

#include "TypeDefiner.h"
#include "RefNum.h"
#include "JavaScriptRef.h"

namespace Vireo {

VIREO_FUNCTION_SIGNATURE2(IsNotAJavaScriptStaticRefnum, JavaScriptStaticRefNum, Boolean)
{
    Boolean isNotARefnum = false;
    JavaScriptStaticRefNum* refnumPtr = _ParamPointer(0);
#if kVireoOS_emscripten
    TypeRef typeRefJavaScriptRefNum = TypeManagerScope::Current()->FindType(tsJavaScriptStaticRefNumType);
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

    DEFINE_VIREO_TYPE(JavaScriptStaticRefNum, "refnum(UInt32)")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAJavaScriptStaticRefnum, "p(i(JavaScriptStaticRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(JavaScriptStaticRefNum) i(JavaScriptStaticRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(JavaScriptStaticRefNum) i(JavaScriptStaticRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQSearch, IsEQRefnum, "p(i(JavaScriptStaticRefNum) i(JavaScriptStaticRefNum) o(Boolean))")

DEFINE_VIREO_END()
}  // namespace Vireo
