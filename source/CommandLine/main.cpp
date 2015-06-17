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
    ConstCStr fileName = null;
    
    if (argc == 2) {
        fileName = argv[1];
    }
    
    gShells._pRootShell = EggShell::Create(null);
    gShells._pRootShell->ShowStats = false;
    gShells._pUserShell = EggShell::Create(gShells._pRootShell);
    gShells._pUserShell->ShowStats = false;
    gShells._keepRunning = true;
    
    if (fileName) {
        {
            TypeManagerScope scope(gShells._pUserShell->TheTypeManager());
            STACK_VAR(String, buffer);
            
            PlatformIO::ReadFile(fileName, buffer.Value);
            SubString input = buffer.Value->MakeSubStringAlias();
            if (gShells._pUserShell->REPL(&input) != kNIError_Success) {
                gShells._keepRunning = false;
            }
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
            PlatformIO::Print(">");
            {
            TypeManagerScope scope(gShells._pUserShell->TheTypeManager());
            STACK_VAR(String, buffer);
            PlatformIO::ReadStdin(buffer.Value);
            SubString input = buffer.Value->MakeSubStringAlias();
            gShells._pUserShell->REPL(&input);
            }
            
            while (gShells._keepRunning) {
                RunExec();
            }
        }
    }
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
        gShells._pUserShell->Delete();
        gShells._pRootShell->Delete();
    }
}

