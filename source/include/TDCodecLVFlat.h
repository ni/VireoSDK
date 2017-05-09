/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief A Vireo codec for the LV binary flattened data format.
 */

namespace Vireo
{

NIError FlattenData(TypeRef type, void *pData, StringRef pString, Boolean prependArrayLength);

IntIndex UnflattenData(SubBinaryBuffer *pBuffer, Boolean prependArrayLength, IntIndex stringIndex,
                       void *pDefaultData, TypeRef type, void *pData);

}  // namespace Vireo
