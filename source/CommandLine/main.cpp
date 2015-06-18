/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

#include "ExecutionContext.h"
#include "EggShell.h"

#if kVireoOS_emscripten
    #include <emscripten.h>
#endif

using namespace Vireo;

static struct {
    EggShell *_pRootShell;
    EggShell *_pUserShell;
    Boolean _keepRunning;
} gShells;

void RunExec();


//------------------------------------------------------------
int VIREO_MAIN(int argc, const char * argv[])
{
    gPlatform.Setup();

	ConstCStr fileName = null;
    
    if (argc == 2) {
        fileName = argv[1];
    }
    
    gShells._pRootShell = EggShell::Create(null);
    gShells._pRootShell->ShowStats = false;
    gShells._pUserShell = EggShell::Create(gShells._pRootShell);
    gShells._pUserShell->ShowStats = false;
    gShells._keepRunning = true;
    LOG_PLATFORM_MEM("Mem after init")

    if (fileName) {
        {
            TypeManagerScope scope(gShells._pUserShell->TheTypeManager());
            STACK_VAR(String, buffer);
            
            gPlatform.IO.ReadFile(fileName, buffer.Value);
            if (buffer.Value->Length() == 0) {
                gPlatform.IO.Printf("(Error \"file <%s> empty\")\n", fileName);
            }
            
            SubString input = buffer.Value->MakeSubStringAlias();
            if (gShells._pUserShell->REPL(&input) != kNIError_Success) {
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
            TypeManagerScope scope(gShells._pUserShell->TheTypeManager());
            STACK_VAR(String, buffer);
            gPlatform.IO.ReadStdin(buffer.Value);
            SubString input = buffer.Value->MakeSubStringAlias();
            gShells._pUserShell->REPL(&input);
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
    TypeManagerRef tm = gShells._pUserShell->TheTypeManager();
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

