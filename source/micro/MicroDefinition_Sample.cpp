// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/**
Sample of a machine generated function table for micro Vireo

SDG
*/
//---- SHA1 hash is for all text below this line ----
#include "DataTypes.h"
#include "ExecutionContext.h"
#include "Instruction.h"

#ifndef VIREO_MICRO
#error this main is for the single context micro vireo
#endif

namespace Vireo {
// prototype for function need to be declared so linker can find them.

VIREO_FUNCTION_SIGNATURE3(AddInt8, Int8, Int8, Int8);
VIREO_FUNCTION_SIGNATURE3(SubInt8, Int8, Int8, Int8);
VIREO_FUNCTION_SIGNATURE3(MulInt8, Int8, Int8, Int8);
VIREO_FUNCTION_SIGNATURE3(QuotientInt8, Int8, Int8, Int8);
VIREO_FUNCTION_SIGNATURE3(RemainderInt8, Int8, Int8, Int8);

VIREO_FUNCTION_SIGNATURE3(AddInt32, Int32, Int32, Int32);

FunctonTableEntry FunctionTable[] = {
    VIREO_FTE(AddInt8, 3),
    VIREO_FTE(SubInt8, 3),
    VIREO_FTE(MulInt8, 3),
    VIREO_FTE(QuotientInt8, 3),
    VIREO_FTE(RemainderInt8, 3),
    VIREO_FTE_END(),
};

Int8 FunctionTableLength = ((sizeof(FunctionTable) / sizeof(FunctonTableEntry)) - 1);
}
