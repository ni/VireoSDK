// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief JavaScript refnum

 JavaScript references are defined in the Params or Locals section of a VI,
 and define a named, non-statically-bound reference to a JavaScript opaque object.
 
 Example:
 
    define(MyVI dv(.VirtualInstrument (
    Locals: c(
        e(JavaScriptStaticRefNum  jsref)  // JavaScript ref that is not statically linked
    ) ...
 
 The actual Type of jsref is JavaScriptStaticRefNum or JavaScriptDynamicRefNum and stores a refnum (cookie) which
 opaquely holds onto the javascript object. The refnum is managed on the JS side 
 and does not use the Vireo RefNumManager.
  
 These can be used in subVIs to refer to a reference passed in by a caller.
*/

#ifndef JavaScriptRef_h
#define JavaScriptRef_h

#include "TypeAndDataManager.h"
#include "RefNum.h"

namespace Vireo
{

typedef RefNum JavaScriptStaticRefNum;  // RefNum to be used with JavaScript Ref Num API
typedef RefNum JavaScriptDynamicRefNum;  // RefNum to be used with JavaScript Ref Num API


#if kVireoOS_emscripten
extern "C" {
    extern void jsIsNotAJavaScriptRefnum(TypeRef, JavaScriptStaticRefNum*, TypeRef, Boolean*);
}
#endif

}  // namespace Vireo

#endif  // JavaScriptRef_h
