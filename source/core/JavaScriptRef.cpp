
/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief JavaScript reference
 */

#include "TypeDefiner.h"
#include "RefNum.h"
#include "JavaScriptRef.h"

namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    extern void jsIsNotAJavaScriptRefnum(TypeRef, JavaScriptRefNum*, TypeRef, Boolean*);
}
#endif

VIREO_FUNCTION_SIGNATURE2(IsNotAJavaScriptRefnum, JavaScriptRefNum, Boolean)
{
    TypeRef typeRefJavaScriptRefNum = TypeManagerScope::Current()->FindType(tsJavaScriptRefNumType);
    TypeRef typeRefIsNotARefNum = TypeManagerScope::Current()->FindType(tsBooleanType);
    JavaScriptRefNum* refnumPtr = _ParamPointer(0);
    Boolean isNotARefnum = false;
    #if kVireoOS_emscripten
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

    DEFINE_VIREO_TYPE(JavaScriptRefNum, "refnum(UInt32)")

    DEFINE_VIREO_FUNCTION_CUSTOM(IsNotANumPathRefnum, IsNotAJavaScriptRefnum, "p(i(JavaScriptRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsEQ, IsEQRefnum, "p(i(JavaScriptRefNum) i(JavaScriptRefNum) o(Boolean))")
    DEFINE_VIREO_FUNCTION_CUSTOM(IsNE, IsNERefnum, "p(i(JavaScriptRefNum) i(JavaScriptRefNum) o(Boolean))")

DEFINE_VIREO_END()
}  // namespace Vireo
