
/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
 */

#include <cstdlib>         // exit()
#include "DataTypes.h"

namespace Vireo
{

#ifdef VIREO_USING_ASSERTS
void VireoAssert_Hidden(Boolean test, ConstCStr message, ConstCStr file, const int line)
{
    if (!test) {
        ConstCStr filename = (strrchr(file, '/') ? strrchr(file, '/') + 1 : strrchr(file, '\\') ? strrchr(file, '\\') + 1 : file);
        gPlatform.IO.Printf("assert %s failed in %s, line %d\n", message, filename, line);
#ifdef VIREO_DYNAMIC_LIB
        // When called as a DLL/Shared library throwing a C++ exception
        // may be preferred.
        throw(1);
#else
        exit(1);
#endif
    }
}
#endif

}  // namespace Vireo



