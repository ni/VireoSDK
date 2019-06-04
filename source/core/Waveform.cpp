/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Analog waveform functions
*/

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "VirtualInstrument.h"
#include <vector>
#include <cmath>
#include "Waveform.h"

#ifdef VIREO_TYPE_Waveform
namespace Vireo {

// siddhukrs: NOTE: AnalogWaveformBuild instruction is deprecated. Please use Copy instructions on individual elements instead.
VIREO_FUNCTION_SIGNATURE4(AnalogWaveformBuild, AnalogWaveform, Timestamp, Double, TypedArrayCoreRef)
{
    _Param(0)._t0 = _ParamPointer(1) ? _Param(1) : Timestamp(0, 0);
    _Param(0)._dt = _ParamPointer(2) ? _Param(2) : 1.0;

    TypedArrayCoreRef* argY_source = _ParamPointer(3);
    TypedArrayCoreRef* waveY_dest = &_Param(0)._Y;
    if (argY_source) {
        if (!(*argY_source)->ElementType()->IsA((*waveY_dest)->ElementType())) {
            THREAD_EXEC()->LogEvent(EventLog::kHardDataError, "AnalogWaveformBuild() Type of argument-3 does not match type of output waveform");
            return THREAD_EXEC()->Stop();
        }
        TypeRef type = (*argY_source)->Type();
        type->CopyData(argY_source, waveY_dest);
    }

    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(Waveform)
    DEFINE_VIREO_REQUIRE(IEEE754Math)
    DEFINE_VIREO_REQUIRE(Timestamp)
    DEFINE_VIREO_TYPE(AnalogWaveform, "c( e(Timestamp t0) e(Double dt) e(a($0 $1)Y) e(Variant attributes) )")
    DEFINE_VIREO_TYPE(DigitalWaveform, "c(e(a(UInt8 * *) data)e(a(UInt32 *) transitions))")
    DEFINE_VIREO_FUNCTION(AnalogWaveformBuild, "p(o(AnalogWaveform) i(Timestamp) i(Double) i(Array))")
DEFINE_VIREO_END()

}  // namespace Vireo
#endif  // VIREO_TYPE_Waveform
