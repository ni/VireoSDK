// Copyright (c) 2021 National Instruments
#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"

#ifdef VIREO_DEBUGPOINT
namespace Vireo {
    InstructionCore* EmitValueNeedsUpdateForLocals(ClumpParseState* instructionBuilder)
    {
        InstructionCore* setValueNeedsUpdateInstruction = nullptr;
        int argCount = instructionBuilder->_argCount;

        std::vector<TypeRef> localTypes;
        std::vector<void*> localPointers;

        // Initial 2 arguments are not locals
        for (int i = 2; i < argCount; i++)
        {
            localTypes.push_back(instructionBuilder->_argTypes[i]);
            localPointers.push_back(instructionBuilder->_argPointers[i]);
        }

        for (int argNumber = 0; argNumber < argCount - 2; argNumber++)
        {
            TypeRef typeOfLocal = localTypes.at(argNumber);
            void* localAddress = localPointers.at(argNumber);
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
#endif  // VIREO_DEBUGPOINT
