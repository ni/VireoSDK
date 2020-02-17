// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
\brief Analog waveform functions
*/

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "VirtualInstrument.h"
#include <vector>
#include <cmath>

#ifdef VIREO_TYPE_Waveform
namespace Vireo {
DEFINE_VIREO_BEGIN(Waveform)
    DEFINE_VIREO_REQUIRE(IEEE754Math)
    DEFINE_VIREO_REQUIRE(Timestamp)
    DEFINE_VIREO_TYPE(AnalogWaveform, "c( e(Timestamp t0) e(Double dt) e(a($0 $1)Y) e(Variant attributes) )")
    DEFINE_VIREO_TYPE(DigitalWaveform, "c(e(a(UInt8 * *) data)e(a(UInt32 *) transitions))")
DEFINE_VIREO_END()

}  // namespace Vireo
#endif  // VIREO_TYPE_Waveform
