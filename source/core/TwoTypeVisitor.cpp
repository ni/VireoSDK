/**
Copyright (c) 2018 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Variant data type and variant attribute support functions
*/

#include "TwoTypeVisitor.h"

namespace Vireo
{
    //------------------------------------------------------------
    Boolean TwoTypeVisitor::Visit(TypeRef typeRefA, TypeRef typeRefB, TwoTypeOperation* operation)
    {
        Boolean canContinue = false;
        if (operation)
            canContinue = operation->Apply(typeRefA, typeRefB);
        return canContinue;
    };
};  // namespace Vireo
