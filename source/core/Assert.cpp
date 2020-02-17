// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 */

#include <stdlib.h>         // exit()
#include "DataTypes.h"

namespace Vireo
{

#ifdef VIREO_USING_ASSERTS
void VireoAssert_Hidden(Boolean test, ConstCStr message, ConstCStr file, int line)
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



