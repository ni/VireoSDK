/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

#include "TypeAndDataManager.h"
#include "EggShell.h"
#include "ExecutionContext.h"

#if kVireoOS_emscripten
    #include <emscripten.h>
#endif

using namespace Vireo;

#if 1
const char* VireoProgram = "\
define (Loop  v(.VirtualInstrument (\
 c(\
   e(v(.UInt32 1)    one)\
   e(v(.UInt32 1000) oneThousand)\
   e(.UInt32         x)\
   )\
 clump(1\
   Perch(0)\
   Print(x)\
   Add(x one x)\
   WaitMilliseconds(oneThousand)\
   Branch(0)\
   )\
)))\
enqueue (Loop)\
";
#else
const char* VireoProgram = "\
define (Loop  v(.VirtualInstrument (\
c(\
    e(dv(.Int32 20) framePause)\
    e(dv(.Double 400) width)\
    e(dv(.Double 400) height)\
    e(dv(.Double 0) cZero)\
    e(dv(.Double 1) cOne)\
    e(dv(.Double -40) cNeg40)\
    e(dv(.Double 0) angle)\
)\
1\
 clump(1\
 SdlInit(width height)\
 Perch(0)\
   SdlGLLoadIdentity()\
   SdlGLClear()\
   SdlGLTranslate(cZero cZero cNeg40)\
   SdlGLRotateRef(angle cZero cOne cZero)\
   SdlGLBeginTriangles()\
   SdlRender(angle angle)\
   SdlGLEnd()\
   SdlGLSwapBuffers()\
   WaitMilliseconds(framePause)\
 Branch(0)\
 )\
)))\
enqueue (Loop)\
";
#endif

void RunExec();
EggShell        *gpShell;
ExecutionState  gState;

int VIREO_MAIN(int argc, const char * argv[])
{
    PlatformIO::Printf("Simple Counting Vireo Egg Shell built %s\n",__TIME__ );
    SubString  subString(VireoProgram);
    
    gpShell = EggShell::Create(null);
    gpShell->REPL(&subString);
    
#if kVireoOS_emscripten
    // To learn more about event loops and emscripten
    // https://github.com/kripken/emscripten/wiki/Emscripten-browser-environment
    emscripten_set_main_loop(RunExec, 50, null);
#else
    do {
        RunExec();
    } while(gState != kExecutionState_None);
#endif
    return 0;
}

void RunExec() {

    gState = ((EggShell*)gpShell)->TheExecutionContext()->ExecuteSlices(400);
    
#if kVireoOS_emscripten
    if (gState == kExecutionState_None) {
        emscripten_cancel_main_loop();
    }
#endif
}
