/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

#include "DataTypes.h"
#include "TypeAndDataManager.h"
#include "TDCodecVia.h"
#include "ExecutionContext.h"
#include "EggShell.h"

#if kVireoOS_emscripten
    #include <emscripten.h>
#endif

using namespace Vireo;

static struct {
    EggShell *_pRootShell;
    EggShell *_pUserShell;
    ExecutionState _eState;
} gShells;

void RunExec();

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
    
    SubString  input;
    if (fileName) {
        gShells._pUserShell->ReadFile(fileName, &input);
        NIError err = gShells._pUserShell->REPL(&input);
        
        if (err != kNIError_Success) {
            return 1;
        }
#if kVireoOS_emscripten
        // To learn more about event loops and emscripten
        // https://github.com/kripken/emscripten/wiki/Emscripten-browser-environment
        emscripten_set_main_loop(RunExec, 40, null);
#else
        do {
            RunExec();
        } while(gShells._eState != kExecutionState_None);
        gShells._pUserShell->Delete();
        gShells._pRootShell->Delete();
#endif

    } else {
        // Interactive mode is experimental.
        // the core loop should be processed by by a vireo program
        // once IO primitivs are all there.
        NIError err = kNIError_Success;
        while (err == kNIError_Success) {
            PlatformIO::Print(">");
            
            err = gShells._pUserShell->ReadStdinLine(&input);
            if (err == kNIError_Success) {
                err = gShells._pUserShell->REPL(&input);
            }
            
            do {
                RunExec();
            } while(gShells._eState != kExecutionState_None);
        }

        gShells._pUserShell->Delete();
        gShells._pRootShell->Delete();
    }
    return 0;
}

//------------------------------------------------------------
//! Execution pump.
void RunExec() {
    TypeManagerScope scope(gShells._pUserShell->TheTypeManager());
    gShells._eState = gShells._pUserShell->TheTypeManager()->TheExecutionContext()->ExecuteSlices(400, 10000000);

    if (gShells._eState == kExecutionState_None) {
        // No more to execute
#if kVireoOS_emscripten
        emscripten_cancel_main_loop();
        gShells._pShell->Delete();
        gShells._pRootShell->Delete();
#endif
    }
}

