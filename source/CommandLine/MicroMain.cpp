/**
 
 Copyright (c) 2014-2015 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "DataTypes.h"
#include "ExecutionContext.h"

using namespace Vireo;

#ifndef VIREO_MICRO
#error this main is for the single context micro vireo
#endif

int VIREO_MAIN(int argc, const char * argv[])
{
    ExecutionState state = HREAD_EXEC()->State();
    PlatformIO::Print("start\n");
    
    // TODO: load VI from binary data
    
    while (state != kExecutionState_None) {
        status = THREAD_EXEC()->ExecuteSlices(10, 10);
    }
    
    PlatformIO::Print("done\n");
    return 0;
}

