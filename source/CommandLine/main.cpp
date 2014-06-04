//
//  main.cpp
//  TestCL
//
//  Created by Paul Austin on 4/4/13.
//  Copyright (c) 2013 Paul Austin. All rights reserved.
//

#include "DataTypes.h"
#include "TypeAndDataManager.h"
#include "TDCodecVia.h"
#include "ExecutionContext.h"
#include "EggShell.h"

#include "CEntryPoints.h"

#if kVireoOS_emscripten
    #include <emscripten.h>
#endif

using namespace Vireo;

struct  {
    EggShell *_pRootShell;
    EggShell *_pShell;
    ExecutionState _eState;
} gShells;

void RunExec();

int VIREO_MAIN(int argc, const char * argv[])
{
    Boolean showStats = false;
    Boolean noShell = false;
    const char* fileName = null;
    
    Int32 i = 1;
    while ( i < argc) {
        if (strcmp(argv[i],"-s") == 0) {
            showStats = true;
        } else if (strcmp(argv[i],"-h") == 0) {
            printf(" Vireo SDG\n");
            printf("  -v  version \n");
            printf("  -h  help \n");
            printf("  -s  show stats \n");
        } else if (strcmp(argv[i],"-dl") == 0) {
            // dl option is ignored now
        } else if (strcmp(argv[i],"-v") == 0) {
            printf(" Vireo EggShell built %s\n",__TIME__ );
        } else {
            fileName = argv[i];
        }
        i++;
    }
    
    gShells._pRootShell = EggShell::Create(null);
    gShells._pRootShell->ShowStats = showStats;
    gShells._pShell = EggShell::Create(gShells._pRootShell);
    gShells._pShell->ShowStats = showStats;
    
    SubString  input;
    if (fileName) {
        gShells._pShell->ReadFile(fileName, &input);

        NIError err = gShells._pShell->REPL(&input);
        
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
        gShells._pShell->Delete();
        gShells._pRootShell->Delete();
#endif

    } else if (!noShell) {
        // Interactive mode is experimental.
        // the core loop should be processed by by a vireo program
        // once IO primitivs are al there.
        NIError err = kNIError_Success;
        while (err == kNIError_Success) {
            printf(">");
            err = gShells._pShell->ReadStdinLine(&input);
            if (err == kNIError_Success) {
                err = gShells._pShell->REPL(&input);
            }
            
            do {
                RunExec();
            } while(gShells._eState != kExecutionState_None);
        }

        gShells._pShell->Delete();
        gShells._pRootShell->Delete();
    }
    return 0;
}


void RunExec() {
    gShells._eState = gShells._pShell->TheExecutionContext()->ExecuteSlices(400, 10000000);
    // TODO control frame rate based on time till next thing to exec

    if (gShells._eState == kExecutionState_None) {
        // No more to execute
#if kVireoOS_emscripten
        emscripten_cancel_main_loop();
        gShells._pShell->Delete();
        gShells._pRootShell->Delete();
#endif
    }
}

