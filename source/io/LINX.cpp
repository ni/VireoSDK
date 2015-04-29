/**
 
 Copyright (c) 2014-2015 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"


#ifdef VIREO_LINX
#include "LINX/device/LINX_Device.h"

using namespace Vireo;


//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(LinxDeviceName, StringRef)
{
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(LinxDigitalChannels, TypedArray1D<UInt8>*)
{
//    _Param(0)->Replace1D(0, LINXDev.numDIOChans, LINXDev.DIOChans, true);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(LinxDigitalWrite, TypedArray1D<UInt8>*, TypedArray1D<Boolean>*)
{
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(LinxDigitalRead, TypedArray1D<UInt8>*, TypedArray1D<Boolean>*)
{
    return _NextInstruction();
}

//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_Linx)

// Primitives
DEFINE_VIREO_FUNCTION(LinxDeviceName, "p(o(.String name))");
    DEFINE_VIREO_FUNCTION(LinxDigitalChannels, "p(o(.Int32 chanelIds))");
    DEFINE_VIREO_FUNCTION(LinxDigitalWrite, "p(i(a(.Int32 *) chanelIds) i(a(.Int32 *) values))");
    DEFINE_VIREO_FUNCTION(LinxDigitalRead, "p(i(a(.Int32 *) chanelIds) o(a(.Int32 *) values))");
DEFINE_VIREO_END()

#endif
