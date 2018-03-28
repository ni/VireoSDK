/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief Control refnum management
  */

#ifndef ControlRef_h
#define ControlRef_h

#include "TypeAndDataManager.h"
#include "RefNum.h"

namespace Vireo
{
class ControlRefInfo {
 public:
    VirtualInstrument *vi;
    StringRef dataItemName;
};

class ControlRefNumManager : public RefNumManager {
 private:
    typedef TypedRefNum<ControlRefInfo*, true> ControlRefNumType;
    ControlRefNumType _refStorage;  // manages refnum storage

    static ControlRefNumManager _s_singleton;
 public:
    static ControlRefNumManager &ControlRefManager() { return _s_singleton; }
    static ControlRefNumType &RefNumStorage() { return _s_singleton.RefNumManager(); }

    ControlRefNumType &RefNumManager() { return _refStorage; }
};

}  // namespace Vireo

#endif  // ControlRef_h
