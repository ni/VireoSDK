// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Timestamp class definition.
 */

#ifndef Timestamp_h
#define Timestamp_h

#include "DataTypes.h"

namespace Vireo {
//------------------------------------------------------------
//! A 64.64 bit fixed point use to represent seconds since Jan 1, 1904 GMT
class Timestamp {
 private:
    Int64 _integer;
    UInt64 _fraction;

 public:
    Timestamp()
        { _integer = 0; _fraction = 0;}
    Timestamp(Int64 integer, UInt64 fraction)
        { _integer = integer; _fraction = fraction;}
    explicit Timestamp(Double seconds);
    Timestamp(Double fracSecs, Int32 sec, Int32 min, Int32 hour, Int32 day, Int32 month, Int32 year);

    static void GetCurrentTimestamp(Timestamp *t);

    Int64 Integer() const { return _integer; }
    UInt64 Fraction() const { return _fraction; }

    //! Add two timestamps, one operand should be relative.
    Timestamp operator+(const Timestamp & value) const;

    //! Add integer number of seconds to a timestamp.
    Timestamp operator+(const Int64 & value) const;
    Timestamp operator-(const Int64 & value) const;

    //! Subtract two timestamps, result is a relative value.
    Timestamp operator-(const Timestamp & value) const;
    Boolean operator==(const Timestamp & value) const {
        return ((_integer == value._integer) && (_fraction == value._fraction));
    }
    Boolean operator>(const Timestamp & value) const {
        return ((_integer > value._integer) || ((_integer == value._integer) && (_fraction > value._fraction)));
    }
    Boolean operator<(const Timestamp & value) const {
        return ((_integer < value._integer) || ((_integer == value._integer) && (_fraction < value._fraction)));
    }
    Boolean operator>=(const Timestamp & value) const {
        return (*this > value) || (value == *this);
    }
    Boolean operator<=(const Timestamp & value) const {
        return (*this < value) || (value == *this);
    }
    Double ToDouble() const;
};

}  // namespace Vireo
#endif  // Timestamp_h
