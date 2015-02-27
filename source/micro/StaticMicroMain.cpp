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


//prototype are necessary for functions. However these prototype are
// stripped down to the bare minimum. which is OK since they are
// extern "C" exports with no C++ type speciic name mangling.
VIREO_FUNCTION_SIGNATURE0(AddInt32);
VIREO_FUNCTION_SIGNATURE0(MulInt32);
VIREO_FUNCTION_SIGNATURE0(MulSingle);
VIREO_FUNCTION_SIGNATURE0(AddSingle);


#define I3(_I, _A1, _A2, _A3)  ((void*)_I) , (&_DS._A1) , (&_DS._A2), (&_DS._A3),


InstructionCore oneInstruction;

struct Vi1_DSType{
    Int32 a;
    Int32 b;
    Int32 c;
};

Vi1_DSType  ds1 = {21, 2, 1};

#undef _DS
#define _DS ds1
void* InstrucitonBlock[] =
{
    I3(AddInt32, a, b, c)
    (void*)AddInt32, &ds1.a, &ds1.b, &ds1.c,
    (void*)MulInt32, &ds1.a, &ds1.b, &ds1.c,
    //  If the functions are not referenced they will be stripped by the linker.
    //  (void*)MulSingle, &ds1.a, &ds1.b, &ds1.c,
    //  (void*)AddSingle, &ds1.a, &ds1.b, &ds1.c,
};

extern "C" int main(int argc, const char * argv[])
{

//    TypeManagerRef tm = TypeManager::New(null);
//    printf("Helo %p\n", tm->TypeList());
    InstructionCore *ip = (InstructionCore*) InstrucitonBlock;

    printf("First %p\n", ip);
    printf("IP:%p A<%d> B<%d> C<%d>\n", ip,  ds1.a, ds1.b, ds1.c);
    ip = ip->_function(ip);
    printf("IP:%p A<%d> B<%d> C<%d>\n", ip,  ds1.a, ds1.b, ds1.c);
    ip = ip->_function(ip);
    printf("IP:%p A<%d> B<%d> C<%d>\n", ip,  ds1.a, ds1.b, ds1.c);

}


#if 0

//VIREO_FUNCTION_SIGNATURE2(StringToUpper, StringRef, StringRef)
extern void StringToUpper();
extern void AddInt32();
extern void AddInt16();

typedef struct  {
    Int32 a;
    Int32 b;
    Int32 c;
    Boolean b;
    Double d;
    Double *pD;
} DSType;

DSType ds = {
    4,
    5,
    6,
    true,
    56.2,
    &ds.d;
    };


#define I3(_I, _A1, _A2, _A3)  ((void*)_I) , (&ds. _A1) , (&ds. _A2), (&ds. _A3)

void* GlobalInstructions[] = {
    I3(AddInt32, a, b, c),
    I3(AddInt16, a, b, c),
    I3(AddInt32, a, b, c),
    I3(StringToUpper, a, b, c),
    I3(AddInt32, a, b, c),
};


int main()
{

}
/*
 0,
 0,
 (void*) StringToUpper,
 ((void*) AddInt32),
 (&ds.a),
 &ds.b,
 &ds.c,
 (void*) AddInt16,
 GlobalData,
 GlobalData +2,
 &ds,
 GlobalInstructions+4,
 (void*) 1,*/

#endif
