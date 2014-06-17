/**
 
 Copyright (c) 2014 National Instruments Corp.
 
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
    ExecutionState status;
    
    // TODO: load VI from binary data
    
    do {
        status = THREAD_EXEC()->ExecuteSlices(10, 10);
    } while (status != kExecutionState_None);
    
    return 0;
}

