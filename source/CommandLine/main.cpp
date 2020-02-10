// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

#include "ExecutionContext.h"
#include "TDCodecVia.h"
#include "UnitTest.h"
#include "DebuggingToggles.h"

#if kVireoOS_emscripten
    #include <emscripten.h>
#endif

namespace Vireo {

static struct {
    TypeManagerRef _pRootShell;
    TypeManagerRef _pUserShell;
    Boolean _keepRunning;
} gShells;

void RunExec();

}  // namespace Vireo

//------------------------------------------------------------
int VIREO_MAIN(int argc, const char * argv[])
{
    using namespace Vireo;  // NOLINT(build/namespaces)

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
        gShells._pRootShell = TypeManager::New(nullptr);

        for (Int32 arg = 1; arg < argc; ++arg) {
            if (strcmp(argv[arg], "-D") == 0) {
                gShells._pRootShell->DumpPrimitiveDictionary();
                continue;
            }

            gShells._pUserShell = TypeManager::New(gShells._pRootShell);
            TypeManagerScope scope(gShells._pUserShell);
            fileName.AliasAssignCStr(argv[arg]);
            if (fileName.Length() && argv[arg][0] != '-') {
                // Nested scope so that buffer is cleaned up before userShell continues running.
                {
                    STACK_VAR(String, fileBuffer);
                    gPlatform.IO.ReadFile(&fileName, fileBuffer.Value);
                    if (fileBuffer.Value->Length() == 0) {
                        gPlatform.IO.Printf("(Error \"file <%.*s> empty\")\n", FMT_LEN_BEGIN(&fileName));
                    }

                    SubString fileString = fileBuffer.Value->MakeSubStringAlias();
                    gShells._keepRunning = true;
                    if (TDViaParser::StaticRepl(gShells._pUserShell, &fileString) != kNIError_Success) {
                        gShells._keepRunning = false;
                    }

                    // Destructor will clear out the data, but just in case let's fill it out
                    // with something that looks like stale data.
                    memset(fileBuffer.Value->Begin(), 0xFE, fileBuffer.Value->Length());
                }

                LOG_PLATFORM_MEM("Mem after load")
#if defined(kVireoOS_emscripten)
                emscripten_set_main_loop(RunExec, 40, nullptr);
#else
                while (gShells._keepRunning) {
                    RunExec();  // deletes TypeManagers on exit
                }
#endif
            }
            LOG_PLATFORM_MEM("Mem after execution")
            gShells._pUserShell->Delete();
        }
        gShells._pRootShell->Delete();
        LOG_PLATFORM_MEM("Mem after cleanup")
    } else {
        // Interactive mode is experimental.
        // the core loop should be processed by by a vireo program
        // once IO primitives are all there.
        gShells._pRootShell = TypeManager::New(nullptr);
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
void Vireo::RunExec() {
    TypeManagerRef tm = gShells._pUserShell;
    TypeManagerScope scope(tm);
    // These numbers may need further tuning (numSlices and millisecondsToRun).
    // They should match the values for VJS in io/module_eggShell.js
    Int32 state = tm->TheExecutionContext()->ExecuteSlices(10000, 4);
    Int32 delay = state > 0 ? state : 0;
    gShells._keepRunning = (state != kExecSlices_ClumpsFinished);
    if (delay)
        gPlatform.Timer.SleepMilliseconds(delay);
    if (!gShells._keepRunning) {
        // No more to execute
#if defined(kVireoOS_emscripten)
        emscripten_cancel_main_loop();
#endif
    }
}

