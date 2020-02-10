// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
 \brief Classes for RefNum API, used to manage references to queues and other reference-based objects.
*/

#include "TypeDefiner.h"
#include "RefNum.h"
#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include <vector>
#include <algorithm>

namespace Vireo {

#define kNumberOfIndexBits  20
#define kNumberOfMagicBits  (32 - kNumberOfIndexBits)    // 12 bits of magic number 4K
#define IndexFromRefNum(mc) (UInt32(mc) & kMaxIndex)     // retrieves the pouch index portion of the refnum
#define kMagicNumberShift   kNumberOfIndexBits           // bits magic number is shifted  2^20 possible refnums
#define kMaxIndex           ((1U << kNumberOfIndexBits) - 1)  // 1M
#define kMaxMagicNumber     ((1U << kNumberOfMagicBits) - 1)

#define MagicMask(mn) (UInt32(mn) & kMaxMagicNumber)                      // retrieves the magic number portion of the refnum
#define MagicFromRefNum(mc) (MagicMask(UInt32(mc) >> kMagicNumberShift))  // retrieves magic number portion of the refnum, but shifted back to being a number
#define MakeRefNum(index, magicNum) (RefNum(((index) & kMaxIndex) | (MagicMask(magicNum) << kMagicNumberShift)))
#define MakePackedMagicNum(refCount, magicNum) MakeRefNum(refCount, magicNum)
#define CountFromMagicNum(mn) IndexFromRefNum(mn)  // retrieves the refCount portion of the magicNumber field

NIError RefNumStorageBase::Init(Int32 size, Int32 totalSize, bool isRefCounted) {
    _nextMagicNum = MagicMask(gPlatform.Timer.TickCount());  // must be non-zero
    if (_nextMagicNum == 0)
        _nextMagicNum = 1;
    _dataSize = size;
    _cookieSize = totalSize;
    _firstFree = 0;
    _numUsed = 0;
    _isRefCounted = isRefCounted;

    return kNIError_Success;
}

NIError RefNumStorageBase::Uninit() {
    VIREO_ASSERT(_numUsed == 0);
    Clear();
    return kNIError_Success;
}

/**
Determine the index of a given refnum in a given RefNumStorage.
*/
RefNumStorageBase::RefNumHeaderAndData* RefNumStorageBase::ValidateRefNumIndex(RefNum refnum)
{
    UInt32 index = static_cast<UInt32>(IndexFromRefNum(refnum));
    RefNumHeaderAndData* rnp = ValidateRefNumIndexT(index);
    if (rnp) {
        UInt32 x = UInt32(MagicFromRefNum(refnum));
        if (rnp->_refHeader.nextFree >= 0 || !x || (MagicFromRefNum(rnp->_refHeader.magicNum) != x))
            return nullptr;
    }
    return rnp;
}

RefNumStorageBase::RefNumHeaderAndData* RefNumStorageBase::CreateRefNumIndex(RefNum refnum)
{
    bool isNew;
    UInt32 index = static_cast<UInt32>(IndexFromRefNum(refnum));
    RefNumHeaderAndData* rnp = CreateRefNumIndexT(index, &isNew);
    if (isNew)
        ++_firstFree;
    else if (rnp->_refHeader.nextFree >= 0)
        _firstFree = rnp->_refHeader.nextFree;
    else
        rnp = nullptr;
    return rnp;
}

/**
 Clone a refnum, but with a different magic number.  Resulting refnum is not
 valid to look up storage but can be used by an outside manager to
 maintain refnum alias (e.g. for named Queues).
s*/
RefNum RefNumStorageBase::CloneRefNum(RefNum refnum) {
    UInt32 index = IndexFromRefNum(refnum);
    UInt32 refnumMagic = UInt32(MagicFromRefNum(refnum));
    ++refnumMagic;
    RefNum newRefNum = MakeRefNum(index, refnumMagic);
    return newRefNum;
}

RefNum RefNumStorageBase::RefNumFromIndexAndExistingHeader(UInt32 index, const RefNumCommonHeader &header) {
    UInt32 magicNum = MagicFromRefNum(header.magicNum);
    return MakeRefNum(index, magicNum);
}

/**
 Create a new refnum with the given info
*/
RefNum RefNumStorageBase::NewRefNum(RefNumDataPtr info) {
#ifdef VIREO_MULTI_THREAD
    MutexedScope mutexScope(&_mutex);
#endif
    RefNumHeaderAndData* rnp = nullptr;
    UInt32 newIndex = _firstFree;
    if (newIndex != IndexFromRefNum(newIndex))  // refnum overflow; max 1M refnums
        return kNotARefNum;
    rnp = CreateRefNumIndex(newIndex);
    if (rnp == nullptr)
        return kNotARefNum;

    UInt32 mn = MagicMask(_nextMagicNum);
    if (MagicMask(++_nextMagicNum) == 0)
        _nextMagicNum = 1;

    RefNum newRefNum = MakeRefNum(newIndex, mn);
    rnp->_refHeader.nextFree = -1;
    _numUsed++;

    UInt32 refCount = _isRefCounted ? 1 : 0;
    UInt32 magicNum_refCount = MakePackedMagicNum(refCount, mn);
    rnp->_refHeader.magicNum = magicNum_refCount;
    if (_dataSize == sizeof(RefNumDataBase))
        rnp->_refData = *info;
    else
        memmove(&rnp->_refData, info, _dataSize);
    return newRefNum;
}

NIError RefNumStorageBase::DisposeRefNum(const RefNum &refnum, RefNumDataPtr info) {
    RefNumHeaderAndData* rnp;
    NIError err = kNIError_Success;

#ifdef VIREO_MULTI_THREAD
    MutexedScope mutexScope(&_mutex);
#endif
    rnp = ValidateRefNumIndex(refnum);
    if (!rnp) {
        err = kNIError_kResourceNotFound;
    } else {
        if (info)
            memmove(info, &rnp->_refData, _dataSize);
        rnp->_refHeader.magicNum = 0;
        rnp->_refHeader.nextFree = _firstFree;
        _numUsed--;
        memset(&rnp->_refData, 0, _dataSize);
        // _refData.erase(it);  // leave storage allocated to be reused by next allocation
        _firstFree = IndexFromRefNum(refnum);
    }
    return err;
}

NIError RefNumStorageBase::GetRefNumData(const RefNum &refnum, RefNumDataPtr info) {
    NIError err = kNIError_Success;
    RefNumHeaderAndData* rnp = ValidateRefNumIndex(refnum);
    if (!rnp) {
        err = kNIError_kResourceNotFound;
    } else {
        if (_isRefCounted && (CountFromMagicNum(rnp->_refHeader.magicNum) <= 0)) {
            err = kNIError_kResourceNotFound;
        } else if (info) {
            if (_dataSize == sizeof(RefNumDataBase))
                *info = rnp->_refData;
            else
                memmove(info, &rnp->_refData, _dataSize);
        }
    }
    return err;
}

NIError RefNumStorageBase::SetRefNumData(const RefNum &refnum, RefNumDataPtr info) {
    NIError err = kNIError_Success;
    RefNumHeaderAndData* rnp = ValidateRefNumIndex(refnum);
    if (!rnp) {
        err = kNIError_kResourceNotFound;
    } else {
        if (_isRefCounted && (CountFromMagicNum(rnp->_refHeader.magicNum) <= 0)) {
            err = kNIError_kResourceNotFound;
        } else if (info) {
            if (_dataSize == sizeof(RefNumDataBase))
                rnp->_refData = *info;
            else
                memmove(&rnp->_refData, info, _dataSize);
        }
    }
    return err;
}

bool RefNumStorageBase::IsARefNum(const RefNum &refnum) {
    return ValidateRefNumIndex(refnum) != nullptr;
}

Int32 RefNumStorageBase::GetRefNumCount() const {
    return Int32(_numUsed);
}

NIError RefNumStorageBase::GetRefNumList(RefNumList *list) {
    list->clear();
#if 0  // TODO(spathiwa): finish
    list->reserve(_refStorage.size());
    typename RefNumMap::iterator it = _refStorage.begin(), ite = _refStorage.end();
    while (it != ite) {
        list->push_back(it->first);
        ++it;
    }
#endif
    return kNIError_Success;
}

bool RefNumStorageBase::AcquireRefNumRights(const RefNum &refnum, RefNumDataPtr info) {
    RefNumHeaderAndData* rnp = nullptr;
    bool rightsWereAcquired = false;

    if (_isRefCounted) {
        rnp = ValidateRefNumIndex(refnum);
        if (rnp) {
            UInt32 refnumMagic = UInt32(MagicFromRefNum(refnum));
            for (;;) {
                UInt32 oldRefCount = rnp->_refHeader.magicNum;  // magic and refCount combined
                UInt32 refCount = UInt32(CountFromMagicNum(oldRefCount));
                UInt32 internalMagic = UInt32(MagicFromRefNum(oldRefCount));

                if (refCount > 0 && internalMagic == refnumMagic) {
                    UInt32 newRefCount = MakePackedMagicNum(refCount+1, refnumMagic);
                    if (CompareAndSwapUInt32(&rnp->_refHeader.magicNum, newRefCount, oldRefCount)) {
                        // Performance here is crucial; it runs for each read/write
                        if (info) {
                            if (_dataSize == sizeof(RefNumDataBase))
                                *info = rnp->_refData;
                            else
                                memmove(info, &rnp->_refData, _dataSize);
                        }
                        rightsWereAcquired = true;
                        break;
                    }
                } else {
                    memset(info, 0, _dataSize);
                    break;
                }
            }
        } else {
            memset(info, 0, _dataSize);
        }
    } else {
        memset(info, 0, _dataSize);
    }
    return rightsWereAcquired;
}

Int32 RefNumStorageBase::ReleaseRefNumRights(const RefNum &refnum) {
    RefNumHeaderAndData* rnp = nullptr;
    Int32 previousRefCount = 0;

    if (_isRefCounted) {
        rnp = ValidateRefNumIndex(refnum);
        if (rnp) {
            UInt32 refnumMagic = UInt32(MagicFromRefNum(refnum));
            for (;;) {
                Int32 oldRefCount = rnp->_refHeader.magicNum;  // magic and refCount combined
                Int32 refCount = UInt32(CountFromMagicNum(oldRefCount));
                UInt32 internalMagic = UInt32(MagicFromRefNum(oldRefCount));

                if (refCount > 0 && internalMagic == refnumMagic) {
                    Int32 newRefCount = MakePackedMagicNum(refCount-1, refnumMagic);
                    if (CompareAndSwapUInt32(&rnp->_refHeader.magicNum, newRefCount, oldRefCount)) {
                        if (1 == refCount) {
                            // we want to delete our object, since the refcount just dropped to zero.
                            DisposeRefNum(refnum, nullptr);
                        }
                        previousRefCount = refCount;
                        break;
                    }
                } else {
                    previousRefCount = 0;
                    break;
                }
            }
        }
    }
    return previousRefCount;
}

RefNumManager::CleanupMap RefNumManager::_s_CleanupMap;  // Singleton for refnum cleanup procs

void RefNumManager::AddCleanupProc(VirtualInstrument *vi, CleanupProc proc, intptr_t arg) {
    CleanupRecord cleanupRec(proc, arg);
    std::vector<CleanupRecord> &cleanupVec = _s_CleanupMap[vi];
    if (std::find(cleanupVec.begin(), cleanupVec.end(), cleanupRec) == cleanupVec.end())
        cleanupVec.push_back(cleanupRec);
}

void RefNumManager::RemoveCleanupProc(VirtualInstrument *vi, CleanupProc proc, intptr_t arg) {
    CleanupMap::iterator viIter = _s_CleanupMap.find(vi);
    if (viIter != _s_CleanupMap.end()) {
        CleanupRecord cleanupRec(proc, arg);
        std::vector<CleanupRecord>::iterator it = viIter->second.begin(), itEnd = viIter->second.end();
        if ((it = std::find(it, itEnd, cleanupRec)) != itEnd) {
            // don't erase, just leave holes, whole vector will be deallocated when VI finishes
            it->proc = nullptr;
            it->arg = 0;
        }
    }
}

void RefNumManager::RunCleanupProcs(VirtualInstrument *vi) {
    CleanupMap::iterator viIter = _s_CleanupMap.find(vi);
    if (viIter != _s_CleanupMap.end()) {
        std::vector<CleanupRecord>::iterator it = viIter->second.begin(), ite = viIter->second.end();
        while (it != ite) {
            if (it->proc)
                (*it->proc)(it->arg);
            ++it;
        }
        _s_CleanupMap.erase(viIter);
    }
}

void RunCleanupProcs(VirtualInstrument *vi) {
    RefNumManager::RunCleanupProcs(vi);
}

}  // namespace Vireo
