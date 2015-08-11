/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

#include "ExecutionContext.h"
#include "TDCodecVia.h"

#if kVireoOS_emscripten
    #include <emscripten.h>
#endif

using namespace Vireo;

static struct {
    TypeManagerRef _pRootShell;
    TypeManagerRef _pUserShell;
    Boolean _keepRunning;
} gShells;

void RunExec();


//------------------------------------------------------------
int VIREO_MAIN(int argc, const char * argv[])
{
    gPlatform.Setup();
    SubString fileName;
    
    if (argc == 2) {
        fileName.AliasAssignCStr(argv[1]);
    }
    
    gShells._pRootShell = TypeManager::New(null);
    gShells._pUserShell = TypeManager::New(gShells._pRootShell);
    gShells._keepRunning = true;
    LOG_PLATFORM_MEM("Mem after init")

    if (fileName.Length()) {
        {
            TypeManagerScope scope(gShells._pUserShell);
            STACK_VAR(String, buffer);
            
            gPlatform.IO.ReadFile(&fileName, buffer.Value);
            if (buffer.Value->Length() == 0) {
                gPlatform.IO.Printf("(Error \"file <%.*s> empty\")\n", FMT_LEN_BEGIN(&fileName));
            }
            
            SubString input = buffer.Value->MakeSubStringAlias();
            if (TDViaParser::StaticRepl(gShells._pUserShell, &input) != kNIError_Success) {
                gShells._keepRunning = false;
            }
            
            LOG_PLATFORM_MEM("Mem after load")
        }
#if defined(kVireoOS_emscripten)
        emscripten_set_main_loop(RunExec, 40, null);
#else
        while (gShells._keepRunning) {
            RunExec();
        }
#endif
    } else {
        // Interactive mode is experimental.
        // the core loop should be processed by by a vireo program
        // once IO primitives are all there.
        while (gShells._keepRunning) {
            gPlatform.IO.Print(">");
            {
            TypeManagerScope scope(gShells._pUserShell);
            STACK_VAR(String, buffer);
            gPlatform.IO.ReadStdin(buffer.Value);
            SubString input = buffer.Value->MakeSubStringAlias();
            TDViaParser::StaticRepl(gShells._pUserShell, &input);
            }
            
            while (gShells._keepRunning) {
                RunExec();
            }
        }
    }
    
    gPlatform.Shutdown();
    return 0;
}
//------------------------------------------------------------
//! Execution pump.
void RunExec() {
    TypeManagerRef tm = gShells._pUserShell;
    TypeManagerScope scope(tm);
    gShells._keepRunning = tm->TheExecutionContext()->ExecuteSlices(400, 10000000) != kExecutionState_None;

    if (!gShells._keepRunning) {
        // No more to execute
#if defined(kVireoOS_emscripten)
        emscripten_cancel_main_loop();
#endif
        LOG_PLATFORM_MEM("Mem after execution")
        gShells._pUserShell->Delete();
        gShells._pRootShell->Delete();
        LOG_PLATFORM_MEM("Mem after cleanup")
    }
}

