/**

Copyright (c) 2014-2016 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Defines a LabVIEW DateTime record.
 */

#ifndef LVDateTimeRecord_h
#define LVDateTimeRecord_h

#include "DataTypes.h"

namespace Vireo {
    struct LVDateTimeRec {
        Double fractional_secs;
        Int32 second, minute, hour;
        Int32 day_of_month, month, year;
        Int32 day_of_week, day_of_year, dst;

        LVDateTimeRec() : fractional_secs(0), second(0), minute(0), hour(0), day_of_month(0), month(0), year(0),
            day_of_week(0), day_of_year(0), dst(0) {}
    };
}
#endif // LVDateTimeRecord_h
