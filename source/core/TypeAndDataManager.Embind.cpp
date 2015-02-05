/**
 
 Copyright (c) 2015 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

/*! \file
 */

#include <emscripten/bind.h>

#include "ExecutionContext.h"
#include "TypeAndDataManager.h"

using namespace emscripten;
using namespace Vireo;

#if 0
/*
EMSCRIPTEN_BINDINGS(TypeManager_Bindings) {
    class_<TypeManager>("TypeManager")
    .function("typeList", &TypeManager::TypeList)
    ;
}
*/

EMSCRIPTEN_BINDINGS(TypeCommon_Bindings) {
    class_<TypeCommon>("TypeCommon")
    .function("topAQSize", &TypeCommon::TopAQSize)
    .function("hasGenericType", &TypeCommon::HasGenericType)
    .function("next", &TypeCommon::Next)
    .function("typeManager", &TypeCommon::TheTypeManager)
    ;
}

#endif

