// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

#include "TypeDefiner.h"
#include "Instruction.h"

#if defined (kVireoOS_ZynqARM)
#include <xgpiops.h>
#define kuZED_LED_PIN 47
#define kuZED_Button_PIN 51

static XGpioPs _gGPIO;
static XGpioPs_Config *_gpGPIOPsConfig = nullptr;

void InitGPIO()
{
    int status;
    _gpGPIOPsConfig = XGpioPs_LookupConfig(XPAR_PS7_GPIO_0_DEVICE_ID);
    status = XGpioPs_CfgInitialize(&_gGPIO, _gpGPIOPsConfig, _gpGPIOPsConfig->BaseAddr);
    if (status != XST_SUCCESS) {
        PlatformIO::Print(" Zynq GPIO init failure\n");
    }

     XGpioPs_SetDirectionPin(&_gGPIO, kuZED_LED_PIN, 1);
     XGpioPs_SetOutputEnablePin(&_gGPIO, kuZED_LED_PIN, 1);
     XGpioPs_SetDirectionPin(&_gGPIO, kuZED_Button_PIN, 0x0);
}
#endif

namespace Vireo {

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(DebugLED, Boolean)
{
#if defined (VIREO_DEBUG_GPIO_STDIO)

    const char* s = _Param(0) ? "t\n" : "f\n";
    gPlatform.IO.Print(s);

#elif defined(kVireoOS_ZynqARM)
    if (!_gpGPIOPsConfig)
        InitGPIO();

    int value =  _Param(0);
    XGpioPs_WritePin(&_gGPIO, kuZED_LED_PIN, value);
#endif
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(DebugButton, Boolean)
{
#if defined (VIREO_DEBUG_GPIO_STDIO)

//    int value = getc();
//    _Param(0) = (value == 't');

#elif defined(kVireoOS_ZynqARM)
    if (!_gpGPIOPsConfig)
        InitGPIO();

    _Param(0) = XGpioPs_ReadPin(&_gGPIO, kuZED_Button_PIN);
#endif
    return _NextInstruction();
}

DEFINE_VIREO_BEGIN(DebugGPIO)
    DEFINE_VIREO_FUNCTION(DebugLED, "p(i(Boolean))")
    DEFINE_VIREO_FUNCTION(DebugButton, "p(o(Boolean))")
DEFINE_VIREO_END()

}  // namespace Vireo
