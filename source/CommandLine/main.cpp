/**
 
 Copyright (c) 2014 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "DataTypes.h"
#include "TypeAndDataManager.h"
#include "TDCodecVia.h"
#include "ExecutionContext.h"
#include "EggShell.h"
#include "Instruction.h"

#if kVireoOS_emscripten
    #include <emscripten.h>
#endif

using namespace Vireo;

#define VIREO_MINI 1

#if !defined(VIREO_MINI)
static struct {
    EggShell *_pRootShell;
    EggShell *_pShell;
    ExecutionState _eState;
} gShells;
void RunExec();

#endif

//prototype are necessary for functions. However these prototype are
// stripped down to the bare minimum. which is OK since they are
// extern "C" exports with no C++ type speciic name mangling.
VIREO_FUNCTION_SIGNATURE0(AddInt32);
VIREO_FUNCTION_SIGNATURE0(MulInt32);
VIREO_FUNCTION_SIGNATURE0(MulSingle);
VIREO_FUNCTION_SIGNATURE0(AddSingle);

InstructionCore oneInstruction;

struct Vi1_DSType{
    Int32 a;
    Int32 b;
    Int32 c;
};

Vi1_DSType  ds1 = {21, 2, 1};

void* InstrucitonBlock[] =
{
    (void*)AddInt32, &ds1.a, &ds1.b, &ds1.c,
    (void*)MulInt32, &ds1.a, &ds1.b, &ds1.c,
//  If the functions are not referenced they will be stripped by the linker.
//  (void*)MulSingle, &ds1.a, &ds1.b, &ds1.c,
//  (void*)AddSingle, &ds1.a, &ds1.b, &ds1.c,
};

int VIREO_MAIN(int argc, const char * argv[])
{
#if defined(VIREO_MINI)

    TypeManagerRef tm = TypeManager::New(null);
    printf("Helo %p\n", tm->TypeList());
    InstructionCore *ip = (InstructionCore*) InstrucitonBlock;
    
    printf("First %p\n", ip);
    printf("IP:%p A<%d> B<%d> C<%d>\n", ip,  ds1.a, ds1.b, ds1.c);
    ip = ip->_function(ip);
    printf("IP:%p A<%d> B<%d> C<%d>\n", ip,  ds1.a, ds1.b, ds1.c);
    ip = ip->_function(ip);
    printf("IP:%p A<%d> B<%d> C<%d>\n", ip,  ds1.a, ds1.b, ds1.c);

#else

    Boolean showStats = false;
    Boolean noShell = false;
    ConstCStr fileName = null;
    
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
#endif
    return 0;
}

#if !defined(VIREO_MINI)
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
#endif

