// Copyright (c) 2021 National Instruments
#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"

#if kVireoOS_emscripten
#include <emscripten.h>
#endif

#ifdef DebugPoint_Enabled
namespace Vireo {
    InstructionCore* EmitValueNeedsUpdateForLocals(ClumpParseState* instructionBuilder)
    {
        InstructionCore* setValueNeedsUpdateInstruction = nullptr;
        int argCount = instructionBuilder->_argCount;

        // Initial 2 arguments are not locals
        for (int argNumber = 2; argNumber < argCount; argNumber++)
        {
            TypeRef typeOfLocal = instructionBuilder->_argTypes[argNumber];
            void* localAddress = instructionBuilder->_argPointers[argNumber];
            SubString valueHasUpdateToken("SetValueNeedsUpdate");
            instructionBuilder->StartInstruction(&valueHasUpdateToken);
            instructionBuilder->InternalAddArgBack(nullptr, typeOfLocal);
            instructionBuilder->InternalAddArgBack(typeOfLocal, localAddress);
            setValueNeedsUpdateInstruction = instructionBuilder->EmitInstruction();
        }
        return setValueNeedsUpdateInstruction;
    }

    InstructionCore* EmitDebugPointInstruction(ClumpParseState* instructionBuilder)
    {
        return EmitValueNeedsUpdateForLocals(instructionBuilder);
        // We will add breakpoint related instruction here
    }

    VIREO_FUNCTION_SIGNATURE1(DebugPoint, StringRef)
    {
        return _NextInstruction();
    }

    DEFINE_VIREO_BEGIN(Execution)
        DEFINE_VIREO_GENERIC(DebugPoint, "p(i(VarArgCount) i(String) i(*))", EmitDebugPointInstruction)
        DEFINE_VIREO_FUNCTION(DebugPoint, "p(i(String))")
        DEFINE_VIREO_END()
}  // namespace Vireo
#endif  // DebugPoint_Enabled
