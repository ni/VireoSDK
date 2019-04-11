/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Compares if two types have the same structure and the same values
*/

#include "TwoTypeEqual.h"

namespace Vireo
{
    //------------------------------------------------------------
    TwoTypeEqual::TwoTypeEqual ()
    {
        _areEqual = true;
    }

    //------------------------------------------------------------
    Boolean TwoTypeEqual::Apply(TypeRef typeRefA, TypeRef typeRefB)
    {
        _areEqual = false;
        return false;
    };
};  // namespace Vireo
