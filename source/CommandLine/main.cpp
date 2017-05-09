/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

#include "ExecutionContext.h"
#include "TDCodecVia.h"
#include "UnitTest.h"

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
    gShells._keepRunning = true;
    LOG_PLATFORM_MEM("Mem after init")

    SubString fileName;
    bool pass;
    if (VireoUnitTest::RunTests(&pass)) {
        // runs tests and returns true if in unit test build; else does nothing and returns false
        gPlatform.IO.Printf("Unit Tests %s\n", pass ? "Passed" : "Failed");
        return pass ? 0 : 1;
    }

    if (argc >= 2) {
        for (Int32 arg = 1; arg < argc; ++arg) {
            gShells._pRootShell = TypeManager::New(null);
            if (strcmp(argv[arg], "-d") == 0)
                gShells._pRootShell->DumpPrimitiveDictionary();

            gShells._pUserShell = TypeManager::New(gShells._pRootShell);

            {   // Braces scope STACK_VAR buffer so its destructor runs before the shells are deleted below.
                TypeManagerScope scope(gShells._pUserShell);
                STACK_VAR(String, buffer);
                fileName.AliasAssignCStr(argv[arg]);
                if (fileName.Length() && argv[arg][0] != '-') {
                    gPlatform.IO.ReadFile(&fileName, buffer.Value);
                    if (buffer.Value->Length() == 0) {
                        gPlatform.IO.Printf("(Error \"file <%.*s> empty\")\n", FMT_LEN_BEGIN(&fileName));
                    }

                    SubString input = buffer.Value->MakeSubStringAlias();
                    gShells._keepRunning = true;
                    if (TDViaParser::StaticRepl(gShells._pUserShell, &input) != kNIError_Success) {
                        gShells._keepRunning = false;
                    }

                    LOG_PLATFORM_MEM("Mem after load")
    #if defined(kVireoOS_emscripten)
                    emscripten_set_main_loop(RunExec, 40, null);
    #else
                    while (gShells._keepRunning) {
                        RunExec();  // deletes TypeManagers on exit
                    }
    #endif
                }
            }
            LOG_PLATFORM_MEM("Mem after execution")
            gShells._pUserShell->Delete();
            gShells._pRootShell->Delete();
            LOG_PLATFORM_MEM("Mem after cleanup")
        }
    } else {
        // Interactive mode is experimental.
        // the core loop should be processed by by a vireo program
        // once IO primitives are all there.
        gShells._pRootShell = TypeManager::New(null);
        gShells._pUserShell = TypeManager::New(gShells._pRootShell);
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
    }
}
