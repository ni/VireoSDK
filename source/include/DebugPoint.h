// Copyright (c) 2021 National Instruments
#ifdef DebugPoint_Enabled
#ifndef  _DEBUGPOINT_H
#define _DEBUGPOINT_H

namespace Vireo
{
    //------------------------------------------------------------
    //! A wrapper that gives a raw block of elements a Begin(), End(), and Length() method. It does not own the data.
class DebugPoint {
 public:
    DebugPoint();
    InstructionCore* EmitValueHasUpdateForLocals(ClumpParseState* instructionBuilder);
};
}

#endif  // ! _DEBUGPOINT_H
#endif  // DebugPoint_Enabled
