// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

//
//  SampleStaticLinkProgram.cpp
//  VireoEggShell
//

#include "DataTypes.h"
#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "TDCodecVia.h"

using namespace Vireo;

// Prototype are necessary for functions. However these prototype are
// stripped down to the bare minimum. which is OK since they are
// extern "C" exports with no C++ type speciic name mangling.
// The prototype could be generated with the source.

VIREO_FUNCTION_C_PROTO(AddInt32);
VIREO_FUNCTION_C_PROTO(MulInt32);
VIREO_FUNCTION_C_PROTO(MulSingle);
VIREO_FUNCTION_C_PROTO(AddSingle);
VIREO_FUNCTION_C_PROTO(NotBoolean);

VIREO_FUNCTION_C_PROTO(DebugLED);
VIREO_FUNCTION_C_PROTO(DebugButton);

VIREO_FUNCTION_C_PROTO(Branch);

#define I(_I, ...)      ((void*)_I), __VA_ARGS__
#define G(_a_)          // Global TBD ...

InstructionCore oneInstruction;

// Struct for VI's dataspace
struct Vi1_DSType{
    struct {
        Int32 in1;
        Int32 out1;
    } Params;
    struct {
        Int32 a;
        Int32 b;
        Int32 c;
        Boolean bit;
    } Locals;
};

// Initializer for VI's dataspace
Vi1_DSType  ds1 = {
    {   // Params
        0,      // in1
        0,      // out1
    },
    {   // Locals
        21,     // a
        2,      // b
        1,      // c
        true    // bit
    },
};

//Instructions for VI

#undef P
#undef L
#define P(_a_) (&ds1.Params._a_)
#define L(_a_) (&ds1.Locals._a_)
#define PERCH(_a_)  (&InstructionBlock[_a_])

void* InstructionBlock[] =
{
 /* Clump 0 ----------------------*/
 /* 0000 */    I(AddInt32, P(in1), L(b), P(out1)),
 /* 0004 */    I(MulInt32, L(a), L(b), L(c)),
 /* 0008 */    I(DebugLED, L(bit)),
 /* 000A */    I(NotBoolean, L(bit), L(bit)),
 /* 000D */    I(Branch, PERCH(0x0008)),
 ///* 000F */    I(Done) //Not quite ready.
};

// Break out flag.
Boolean gKeepRunning = true;

extern "C" int main(int argc, const char * argv[])
{
    InstructionCore *ip = (InstructionCore*) InstructionBlock;

    while (gKeepRunning) {
        // Unrolled execution loop;
        ip = ip->_function(ip);
        ip = ip->_function(ip);
        ip = ip->_function(ip);
        ip = ip->_function(ip);
    }
    return 0;
}
