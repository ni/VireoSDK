/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

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
    // TODO Add attributes
};

}

#endif
