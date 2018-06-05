/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief Opaque Object refnum management

 Object references are defined in the Locals: block of a VI,
 and define a named, statically-bound reference to a javascript object on a specific VI.
 
 Example://TODO
 
 define(MyVI dv(.VirtualInstrument (
 Locals: c(
 e(ObjectReference() objref1)  // static opaque object ref
 // -or-
 e(dv(ObjectRefNum ObjectReference()) objref2)  // more explicit syntax
 ) ...
 
 The actual Type of objref1 is ObjectRefNum and stores a refnum (cookie) which
 opaquely holds onto the VI and object tag (TODO).
 The VI isn't passed directly, it's implicitly taken from the context,
 whatever VI the ObjectReference is defined in.
 ObjectRefNums defined with ObjectReference() exist during the entire
 lifetime of the VI and are only deallocated when the last clump of the last
 top-level VI finishes.
 
 Non-statically-bound ObjectRefNums variables can also be declared in the Params:
 or Locals: sections, e.g.  e(ObjectRefNum ref).
 These can be used in subVIs to refer to a reference passed in by a caller.
*/

#ifndef ObjectRef_h
#define ObjectRef_h

#include "TypeAndDataManager.h"
#include "RefNum.h"
//TODO
namespace Vireo
{
typedef RefNum ObjectRefNum;  // RefNum to be used with Object Ref Num API (or underlying RefNumManager class)

// Object RefNum API: create, lookup, and destroy object refnums
ObjectRefNum ObjectReferenceCreate(VirtualInstrument *vi, const StringRef &objectTag);
ObjectRefNum ObjectReferenceCreate(RefNumVal *pRefNumVal, VirtualInstrument *vi, const SubString &objectTag);

NIError ObjectReferenceLookup(ObjectRefNum refnum, VirtualInstrument **pVI, StringRef *pObjectTag);

NIError ObjectReferenceDestroy(ObjectRefNum refnum);
NIError ObjectReferenceAppendDescription(StringRef str, ObjectRefNum refnum);

}  // namespace Vireo

#endif  // ObjectRef_h
