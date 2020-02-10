// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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

    // Intended to be used only in special cases where the iterator is walked for the subset of arrays (for instance,
    // polymorphic binary operations). Thus, debug mode asserts that passed in rank and dimensionlengths are smaller
    // than that of the passed in array.
    explicit ArrayIterator(TypedArrayCoreRef array, IntIndex rank, IntIndex* dimensionLengths) {
        _array = array;
        if (array != nullptr) {
            VIREO_ASSERT(rank == array->Rank());
            for (int i = 0; i < rank; i++) {
                VIREO_ASSERT(dimensionLengths[i] <= array->DimensionLengths()[i]);
            }
        }
        _rank = rank;
        _dimensionLengths = dimensionLengths;
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
            return nullptr;
        }

        return _array->BeginAtND(_rank, _indexes);
    }
};

}  // namespace Vireo
