// Copyright (c) 2020 National Instruments
#include "DebugPoint.h"
#include "TypeDefiner.h"

#if kVireoOS_emscripten
#include <emscripten.h>
#endif

namespace Vireo {
    //------------------------------------------------------------
    // Debug node which will check if breakpoint is set or not
    VIREO_FUNCTION_SIGNATURE1(DebugPoint, StringRef)
    {
        return _NextInstruction();
    }

    DEFINE_VIREO_BEGIN(Execution)
        DEFINE_VIREO_FUNCTION(DebugPoint, "p(i(String))")
        DEFINE_VIREO_END()
}  // namespace Vireo
