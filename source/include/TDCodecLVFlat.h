// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief A Vireo codec for the LV binary flattened data format.
 */

namespace Vireo
{

NIError FlattenData(TypeRef type, void *pData, StringRef pString, Boolean prependArrayLength);

IntIndex UnflattenData(SubBinaryBuffer *pBuffer, Boolean prependArrayLength, IntIndex stringIndex,
                       void *pDefaultData, TypeRef type, void *pData);

}  // namespace Vireo
