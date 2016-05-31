/**

 Copyright (c) 2014-2015 National Instruments Corp.

 This software is subject to the terms described in the LICENSE.TXT file

 SDG
 */

#include "TypeDefiner.h"
#include "Instruction.h"

#ifdef VIREO_LINX
// Stubbing out functions for now.
// #include "LINX/device/LINX_Device.h"

using namespace Vireo;
typedef Int32 LinxHandle;

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(Open, LinxHandle)
{
    _Param(0) = 42;  // Just for now.
    // Initialization code should go here.
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(Close, LinxHandle)
{
    _Param(0) = 0;  // Just for now.
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(DigitalRead, LinxHandle, UInt8, Boolean)
{
    _Param(2) = 0;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(DigitalWrite, LinxHandle, UInt8, Boolean)
{
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(DigitalReadN, LinxHandle, TypedArray1D<UInt8>*, TypedArray1D<Boolean>*)
{
    _Param(2)->Resize1D(0);
    _Param(2)->Resize1D(_Param(1)->Length());
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(DigitalWriteN, LinxHandle, TypedArray1D<UInt8>*, TypedArray1D<Boolean>*)
{
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(PWMWrite, LinxHandle, UInt8, Double)
{
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(PWMWriteN, LinxHandle, TypedArray1D<UInt8>*, TypedArray1D<Double>*)
{
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AnalogRead, LinxHandle, UInt8, Double)
{
    _Param(2) = 0.0;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AnalogWrite, LinxHandle, UInt8, Double)
{
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AnaloglReadN, LinxHandle, TypedArray1D<UInt8>*, TypedArray1D<Double>*)
{
    _Param(2)->Resize1D(0);
    _Param(2)->Resize1D(_Param(1)->Length());
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(AnalogWriteN, LinxHandle, TypedArray1D<UInt8>*, TypedArray1D<Double>*)
{
    return _NextInstruction();
}
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(Linx)
    DEFINE_VIREO_REQUIRE(IEEE754Math)

    // Linx Handle
    DEFINE_VIREO_TYPE(LinxHandle, "Int32")
    DEFINE_VIREO_FUNCTION(Open, "p(o(LinxHandle))");
    DEFINE_VIREO_FUNCTION(Close, "p(i(LinxHandle))");

    // DIO - Single channel and multichannel
    DEFINE_VIREO_FUNCTION(DigitalRead, "p(i(LinxHandle) i(UInt8 channel) i(UInt8 value))");
    DEFINE_VIREO_FUNCTION(DigitalWrite, "p(i(LinxHandle) i(UInt8 channel) o(UInt8 value))");
    DEFINE_VIREO_FUNCTION_CUSTOM(DigitalRead, DigitalReadN, "p(i(LinxHandle) i(a(UInt8 *) channels) i(a(Int32 *) values))");
    DEFINE_VIREO_FUNCTION_CUSTOM(DigitalWrite, DigitalWriteN, "p(i(LinxHandle) i(a(UInt8 *) channels) o(a(Int32 *) values))");

    // PWM - Single channel and multichannel
    DEFINE_VIREO_FUNCTION(PWMWrite, "p(i(LinxHandle) i(UInt8 channel) o(Double value))");
    DEFINE_VIREO_FUNCTION_CUSTOM(PWMWrite, PWMWriteN, "p(i(LinxHandle) i(a(UInt8 *) channels) o(a(Double *) values))");

    // AIO - Single channel and multichannel
    DEFINE_VIREO_FUNCTION(AnalogRead, "p(i(LinxHandle) i(UInt8 channel) i(Double value))");
    DEFINE_VIREO_FUNCTION(AnalogWrite, "p(i(LinxHandle) i(UInt8 channel) o(Double value))");
    DEFINE_VIREO_FUNCTION_CUSTOM(AnalogRead, AnaloglReadN, "p(i(LinxHandle) i(a(UInt8 *) channels) i(a(Double *) values))");
    DEFINE_VIREO_FUNCTION_CUSTOM(AnalogWrite, AnalogWriteN, "p(i(LinxHandle) i(a(UInt8 *) channels) o(a(Double *) values))");
DEFINE_VIREO_END()

#endif
