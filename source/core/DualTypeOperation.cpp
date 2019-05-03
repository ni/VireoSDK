/**
Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Two type operation mostly for variant support
*/

#include "DualTypeOperation.h"

namespace Vireo
{
    //------------------------------------------------------------
    bool DualTypeOperation::DoTypesHaveSameEncodingAndSize(TypeRef typeRefX, TypeRef typeRefY)
    {
        EncodingEnum encodingX = typeRefX->BitEncoding();
        EncodingEnum encodingY = typeRefY->BitEncoding();
        bool sameEnconding = (encodingX == encodingY);
        bool sameSize = typeRefX->TopAQSize() == typeRefY->TopAQSize();
        return sameEnconding && sameSize;
    }
};  // namespace Vireo
