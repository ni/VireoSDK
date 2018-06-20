
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


VIREO_FUNCTION_SIGNATURE2(IsNotAJavaScriptRefnum, JavaScriptRefNum, Boolean)
{
    JavaScriptRefNum* refnumPtr = _ParamPointer(0);
    bool result = *refnumPtr == 0; // this will be changed to call into JS to validate reference.
    _Param(1) = result;
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

