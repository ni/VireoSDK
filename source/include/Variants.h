/**

Copyright (c) 2014-2019 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
\brief Variant data type and variant attribute support functions
*/

#ifndef Variant_h
#define Variant_h

#include "TypeAndDataManager.h"
#include <map>

namespace Vireo {

class VariantAttributeManager {
 public:
    using AttributeMapType = std::map<StringRef, TypeRef, StringRefCmp>;
    using VariantToAttributeMapType = std::map< DataPointer, AttributeMapType *>;
    VariantAttributeManager(const VariantAttributeManager&) = delete;
    VariantAttributeManager& operator=(const VariantAttributeManager&) = delete;

 private:
    VariantToAttributeMapType _variantToAttributeMap;
    VariantAttributeManager() = default;

 public:
    static VariantAttributeManager& Instance() {
        static VariantAttributeManager _instance;
        return _instance;
    }

    const VariantToAttributeMapType& GetVariantToAttributeMap() const {
        return _variantToAttributeMap;
    }

    VariantToAttributeMapType& GetVariantToAttributeMap() {
        return _variantToAttributeMap;
    }

    void CleanUp()
    {
        for (auto entry : _variantToAttributeMap) {
            for (auto attribute : *entry.second) {
                attribute.first->Delete(attribute.first);
            }
            entry.second->clear();
        }
        _variantToAttributeMap.clear();
    }

    ~VariantAttributeManager() {
        CleanUp();
    }
};

enum { kVariantArgErr = 1, kVariantIncompatibleType = 91, kUnsupportedOnTarget = 2304 };

}  // namespace Vireo

#endif
