// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief Control refnum management

 Control references are defined in the Locals: block of a VI (or inside an EventSpec),
 and define a named, statically-bound reference to a control on a specific VI.
 
 Example:
 
 define(MyVI dv(.VirtualInstrument (
 Locals: c(
 e(ControlReference("controlID1") ctlref1)  // static control ref linked to controlID1
 // -or-
 e(dv(ControlRefNum ControlReference("controlID2")) ctlref2)  // more explicit syntax
 ) ...
 
 The actual Type of ctlref1 is ControlRefNum and stores a refnum (cookie) which
 opaquely holds onto the VI and control tag (control id).
 The VI isn't passed directly, it's implicitly taken from the context,
 whatever VI the ControlReference is defined in.
 ControlRefNums defined with ControlReference() exist during the entire
 lifetime of the VI and are only deallocated when the last clump of the last
 top-level VI finishes.
 
 Non-statically-bound ControlRefNums variables can also be declared in the Params:
 or Locals: sections, e.g.  e(ControlRefNum ref).
 These can be used in subVIs to refer to a reference passed in by a caller.
*/

#ifndef ControlRef_h
#define ControlRef_h

#include "TypeAndDataManager.h"
#include "RefNum.h"

namespace Vireo
{
typedef RefNum ControlRefNum;  // RefNum to be used with Control Ref Num API (or underlying RefNumManager class)

// Control RefNum API: create, lookup, and destroy control refnums
ControlRefNum ControlReferenceCreate(VirtualInstrument *vi, const StringRef &controlTag);
ControlRefNum ControlReferenceCreate(RefNumVal *pRefNumVal, VirtualInstrument *vi, const SubString &controlTag);

NIError ControlReferenceLookup(ControlRefNum refnum, VirtualInstrument **pVI, StringRef *pControlTag);

NIError ControlReferenceDestroy(ControlRefNum refnum);
NIError ControlReferenceAppendDescription(StringRef str, ControlRefNum refnum);

}  // namespace Vireo

#endif  // ControlRef_h
