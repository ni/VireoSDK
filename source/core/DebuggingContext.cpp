// Copyright(c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
	\brief helper foe debugging class
 */
#include "DebuggingContext.h"

#if kVireoOS_emscripten
#include <emscripten.h>
extern "C" {
    extern void jsDebuggingContextDebugPointInterrupt(StringRef)
}
#endif

namespace Vireo {
}  // namespace Vireo
