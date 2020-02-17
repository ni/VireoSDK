// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
\brief Analog waveform
*/

#ifndef Waveform_h
#define Waveform_h

#include "DataTypes.h"
#include "Timestamp.h"

namespace Vireo {

struct AnalogWaveform {
    Timestamp _t0;
    Double _dt;
    TypedArrayCoreRef _Y;
    // TODO(sanmut): Add attributes
};

}

#endif
