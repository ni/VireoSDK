/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

/*_____        ____    ____
  |   |       /   /   /   /  ====|\
  |   |      /   /   /   /       |X}==================
  |   |     /   /   /   /  ======|/
  |   |    /   /   /   /  ___ __   ________   ________
  |   |   /   /   /   /  /  //_ / /  __   /  /  _    /
  |   |  /   /   /   /  /   /    /  /_/  /  /  / /  /
  |   | /   /   /   /  /  /     /  ____ /  /  / /  /
  |   |/   /   /   /  /  /     /  /____   /  /_/  /
  |_______/   /___/  /__/     /_______/  /_______/SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "EggShell.h"
#include "VirtualInstrument.h"
#include "TDCodecVia.h"

namespace Vireo
{
//------------------------------------------------------------
EggShell* EggShell::Create(EggShell* parent)
{
    TypeManagerRef parentTADM = parent ? parent->TheTypeManager() : null;
    TypeManagerRef newTADM = ConstructTypeManagerAndExecutionContext(parentTADM);
    {
        TypeManagerScope scope(newTADM);
        return TADM_NEW_PLACEMENT(EggShell)(newTADM);
    }
}
//------------------------------------------------------------
EggShell::EggShell(TypeManagerRef tm)
{
    _typeManager     = tm;
}
//------------------------------------------------------------
void EggShell::Delete()
{
    TypeManagerRef pTADM = _typeManager;
    if (ShowStats) {
        pTADM->PrintMemoryStat("ES Delete begin", false);
    }

    pTADM->DeleteTypes(true);
    pTADM->Free(this);
    pTADM->PrintMemoryStat("ES Delete end", true);

    TypeManager::Delete(pTADM);
}
//------------------------------------------------------------
NIError EggShell::REPL(SubString *commandBuffer)
{
    TypeManagerScope scope(_typeManager);
    
    STACK_VAR(String, errorLog);
    EventLog log(errorLog.Value);
    
    if (commandBuffer->ComparePrefixCStr("#!")) {
        // Files can start with a shabang if they are used as  script files.
        // skip the rest of the line.
        commandBuffer->EatToEol();
    }

    TDViaParser parser(_typeManager, commandBuffer, &log, 1);
    NIError err = parser.ParseREPL();

    if (errorLog.Value->Length() > 0) {
        gPlatform.IO.Printf("%.*s", (int)errorLog.Value->Length(), errorLog.Value->Begin());
    }
    return err;
}
} // namespace Vireo

