/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include <stdio.h>          // printf()
#include <stdlib.h>         // exit()
#include "DataTypes.h"

namespace Vireo
{

#ifdef VIREO_USING_ASSERTS
#ifdef VIREO_MICRO

void VireoAssert_Hidden(Boolean test, ConstCStr file, int line)
{
    if (!test) {
        exit(1);
    }
}

#else

void VireoAssert_Hidden(Boolean test, ConstCStr message, ConstCStr file, int line)
{
    if (!test) {
        ConstCStr filename = (strrchr(file, '/') ? strrchr(file, '/') + 1 : strrchr(file, '\\') ? strrchr(file, '\\') + 1 : file);
        printf("assert %s failed in %s, line %d\n", message, filename, line);
#ifdef VIREO_DYNAMIC_LIB
        // When called as a DLL/Shared library throwing a C++ exception
        // may be prefered.
        throw(1);
#else
        exit(1);
#endif
    }
}

#endif
#endif

}



