// Copyright (c) 2020 National Instruments
#include "DebugPoint.h"
#include "TypeDefiner.h"
#include "DebuggingContext.h"
#include "ExecutionContext.h"

#if kVireoOS_emscripten
#include <emscripten.h>
#endif

namespace Vireo {
    //------------------------------------------------------------
    // Debug node which will check if breakpoint is set or not
    VIREO_FUNCTION_SIGNATURE1(DebugPoint, StringRef)
    {
        if (THREAD_EXEC()->debuggingContext->GetDebugPointState(_Param(0)->MakeSubStringAlias())) {
#if kVireoOS_emscripten
            jsDebuggingContextDebugPointInterrupt(_Param(0));
#endif
        }
        return _NextInstruction();
    }

    DEFINE_VIREO_BEGIN(Execution)
        DEFINE_VIREO_FUNCTION(DebugPoint, "p(i(String))")
        DEFINE_VIREO_END()
}  // namespace Vireo
