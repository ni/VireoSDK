//
//  SampleStaticLinkProgram.cpp
//  VireoEggShell
//
//  Created by Paul Austin on 12/11/14.
//  Copyright (c) 2014 Paul Austin. All rights reserved.
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

// Now if a nice variadic macro can be figured out this would look nicer
#define I0(_I)                          ((void*)_I),
#define I1(_I, _A1)                     I0(_I) (&_DS._A1),
#define I2(_I, _A1, _A2)                I1(_I, _A1) (&_DS._A2),
#define I3(_I, _A1, _A2, _A3)           I2(_I, _A1, _A2) (&_DS._A3),
#define I4(_I, _A1, _A2, _A3, _A4)      I3(_I, _A1, _A2, _A3) (&_DS._A4),

#define IBranch(_perch_)               ((void*)Branch), &InstrucitonBlock[_perch_],


InstructionCore oneInstruction;

struct Vi1_DSType{
    Int32 a;
    Int32 b;
    Int32 c;
    Boolean bit;
};

Vi1_DSType  ds1 = {21, 2, 1, true};

#undef _DS
#define _DS ds1
void* InstrucitonBlock[] =
{
    #define Perch_Start (8)
    I3(AddInt32, a, b, c)
    I3(MulInt32, a, b, c)
    #define Perch_B (8)             // Raw perch offsets are voi* index of the InstructionBlock
    I1(DebugLED, bit)
    I2(NotBoolean, bit, bit)
    IBranch(Perch_B)
};

// Break out flag.
Boolean gKeepRunning = true;

extern "C" int main(int argc, const char * argv[])
{
    InstructionCore *ip = (InstructionCore*) InstrucitonBlock;

    while (gKeepRunning) {
        // Unrolled execution loop;
        ip = ip->_function(ip);
        ip = ip->_function(ip);
        ip = ip->_function(ip);
        ip = ip->_function(ip);
    }
    return 0;
}
