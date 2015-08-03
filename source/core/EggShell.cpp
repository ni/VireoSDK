/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
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

    pTADM->DeleteTypes(true);
    pTADM->Free(this);
    pTADM->PrintMemoryStat("ES Delete end", true);
    TypeManager::Delete(pTADM);
}
//------------------------------------------------------------
NIError EggShell::REPL(SubString *commandBuffer)
{
    return TDViaParser::StaticRepl(_typeManager, commandBuffer);
}
} // namespace Vireo

