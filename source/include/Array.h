/**

Copyright (c) 2017-2017 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Array iterator
*/
#pragma once

#include "TypeAndDataManager.h"

namespace Vireo {

// Array Iterator
class ArrayIterator
{
 private:
    TypedArrayCoreRef _array;
    IntIndex  _rank;
    IntIndex*  _dimensionLengths;
    ArrayDimensionVector _indexes;

 private:
    void ResetIndexes() {
        for (IntIndex i = 0; i < _rank; i++) {
            _indexes[i] = 0;
        }
    }

 public:
    explicit ArrayIterator(TypedArrayCoreRef array) {
        _array = array;
        _rank = array->Rank();
        _dimensionLengths = array->DimensionLengths();
        ResetIndexes();
    }

    void* Begin() {
        ResetIndexes();
        return _array->BeginAtND(_rank, _indexes);
    }

    void* Next() {
        IntIndex dimensionIndex = 0;
        while (dimensionIndex < _rank) {
            _indexes[dimensionIndex]++;
            if (_indexes[dimensionIndex] >= _dimensionLengths[dimensionIndex]) {
                _indexes[dimensionIndex] = 0;
                dimensionIndex++;
            } else {
                break;
            }
        }

        if (dimensionIndex >= _rank) {
            return NULL;
        }

        return _array->BeginAtND(_rank, _indexes);
    }
};

}  // namespace Vireo
