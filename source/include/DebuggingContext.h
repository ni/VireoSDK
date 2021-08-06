// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
	\brief Tools to implement a debugging context
 */

#ifndef  _DEBUGGINGCONTEXT_H
#define _DEBUGGINGCONTEXT_H

#include "TypeAndDataManager.h"
#include "map"

namespace Vireo
{

#if kVireoOS_emscripten
#include <emscripten.h>
    extern "C" {
        extern void jsDebuggingContextDebugPointInterrupt(StringRef);
    }
#endif

class DebuggingContext
{
 private:
    std::map<SubString, bool, CompareSubString> _debugPointState;
 public:
    bool GetDebugPointState(SubString objectID)
    {
         typedef std::map<SubString, bool>::iterator iterator;
         iterator it = _debugPointState.find(objectID);

         if (it == _debugPointState.end()) {
         // error out:  std::cout << "Key-value pair not present in map";
              return false;
         }
        return it->second;
    }
    void SetDebugPointState(SubString objectID, bool state)
    {
         _debugPointState[objectID] = state;
    }
};
}  // namespace Vireo

#endif // ! _DEBUGGINGCONTEXT_H
