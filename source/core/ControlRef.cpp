
/**

 Copyright (c) 2018 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

/*! \file
 \brief Control reference management
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "RefNum.h"
#include "ControlRef.h"

namespace Vireo {

ControlRefNumManager ControlRefNumManager::_s_singleton;

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(ControlRefs)
    DEFINE_VIREO_REQUIRE(VirtualInstrument)

    DEFINE_VIREO_TYPE(ControlRefNumInfo, "c(e(VirtualInstrument vi) e(String controlTag))")
    DEFINE_VIREO_TYPE(ControlRefNum, "refnum(ControlRefNumInfo)")

DEFINE_VIREO_END()
}  // namespace Vireo

