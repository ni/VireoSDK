/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief JavaScript refnum

 JavaScript references are defined in the Params or Locals section of a VI,
 and define a named, non-statically-bound reference to a JavaScript opaque object.
 
 Example:
 
 define(MyVI dv(.VirtualInstrument (
 Locals: c(
 e(JavaScriptRefNum  jsref)  // JavaScript ref that is not statically linked
 ) ...
 
 The actual Type of jsref is JavaScriptRefNum and stores a refnum (cookie) which
 opaquely holds onto the javascript object.
 
 These can be used in subVIs to refer to a reference passed in by a caller.
*/

#ifndef JavaScriptRef_h
#define JavaScriptRef_h

#include "TypeAndDataManager.h"
#include "RefNum.h"

namespace Vireo
{

typedef RefNum JavaScriptRefNum;  // RefNum to be used with JavaScript Ref Num API 

}  // namespace Vireo

#endif  // JavaScriptRef_h
