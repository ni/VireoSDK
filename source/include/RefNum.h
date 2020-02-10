// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

#ifndef RefNum_H
#define RefNum_H

/*! \file
 \brief Classes for RefNum API
 */

#include "TypeAndDataManager.h"
#include "Thread.h"

#include <vector>
#include <map>

namespace Vireo {

/* Manage storage of refnum-associated typed data */
typedef intptr_t RefNumDataBase;
typedef void* RefNumData;

struct RefNumCommonHeader {
    volatile UInt32 magicNum;    // Non-zero unique id to compare with hi word of cookie.
    volatile Int32  nextFree;
};

typedef std::vector<RefNum> RefNumList;

static const RefNum kNotARefNum = RefNum(0);

typedef intptr_t *RefNumDataPtr;

// template <typename T, bool _isRefCounted>
class RefNumStorageBase
{
 protected:
    UInt32    _nextMagicNum = 0;  // Magic Number to be used for creating next requested cookie
    UInt32    _dataSize = 0;      // Size of user-provided cookie info
    UInt32    _cookieSize = 0;    // Size of entire cookie including info
    Int32    _firstFree = 0;      // Index of first free cookie record
    Int32   _numUsed = 0;         // Total number of used cookies
#ifdef  VIREO_MULTI_THREAD
    Mutex _mutex;    // Must have Acquired this mutex before read/writing to fields
#endif
    bool _isRefCounted = false;
    struct RefNumHeaderAndData {
        RefNumCommonHeader _refHeader;
        intptr_t _refData;
    };
    NIError    Init(Int32 size, Int32 totalSize, bool isRefCounted);
    NIError    Uninit();

    RefNum      NewRefNum(RefNumDataPtr info);
    NIError    DisposeRefNum(const RefNum &refnum, RefNumDataPtr info);
    NIError    SetRefNumData(const RefNum &refnum, RefNumDataPtr info);
    NIError    GetRefNumData(const RefNum &refnum, RefNumDataPtr info);

    bool    AcquireRefNumRights(const RefNum &refnum, RefNumDataPtr info);
    RefNumHeaderAndData* ValidateRefNumIndex(RefNum refnum);
    RefNumHeaderAndData* CreateRefNumIndex(RefNum refnum);
    virtual RefNumHeaderAndData* ValidateRefNumIndexT(RefNum cookie) = 0;
    virtual RefNumHeaderAndData* CreateRefNumIndexT(RefNum cookie, bool *isNew) = 0;

    virtual void Clear() = 0;

    virtual ~RefNumStorageBase() { }

 public:
    static RefNum  CloneRefNum(RefNum refnum);
    Int32   ReleaseRefNumRights(const RefNum &refnum);
    bool    IsARefNum(const RefNum &refnum);
    Int32    GetRefNumCount() const;
    static NIError    GetRefNumList(RefNumList *list);

    static RefNum RefNumFromIndexAndExistingHeader(UInt32 index, const RefNumCommonHeader &header);
};

template <typename T, bool _isRefCounted>
class TypedRefNum : public RefNumStorageBase {
 protected:
    typedef T* RefNumActualDataPtr;
    struct RefNumHeaderAndTypedData {
        RefNumCommonHeader _refHeader;
        T _refData;
    };
    typedef std::map<RefNum, RefNumHeaderAndTypedData> RefNumMap;

    RefNumMap _refStorage;

    RefNumHeaderAndData* ValidateRefNumIndexT(UInt32 index) override;
    RefNumHeaderAndData* CreateRefNumIndexT(UInt32 index, bool *isNew) override;
    void Clear() override { _refStorage.clear(); }

 public:
    typedef typename RefNumMap::iterator RefNumIterator;

    RefNumIterator Begin() { return _refStorage.begin(); }
    RefNumIterator End() { return _refStorage.end(); }

    RefNum      NewRefNum(RefNumActualDataPtr info) {
        return RefNumStorageBase::NewRefNum(reinterpret_cast<RefNumDataPtr>(info));
    }
    NIError    DisposeRefNum(const RefNum &refnum, RefNumActualDataPtr info)  {
        return RefNumStorageBase::DisposeRefNum(refnum, reinterpret_cast<RefNumDataPtr>(info));
    }
    NIError    SetRefNumData(const RefNum &refnum, RefNumActualDataPtr info)  {
        return RefNumStorageBase::SetRefNumData(refnum, reinterpret_cast<RefNumDataPtr>(info));
    }
    NIError    GetRefNumData(const RefNum &refnum, RefNumActualDataPtr info)  {
        return RefNumStorageBase::GetRefNumData(refnum, reinterpret_cast<RefNumDataPtr>(info));
    }

    bool    AcquireRefNumRights(const RefNum &refnum, RefNumActualDataPtr info)  {
        return RefNumStorageBase::AcquireRefNumRights(refnum, reinterpret_cast<RefNumDataPtr>(info));
    }

    TypedRefNum() { Init(Int32(sizeof(T)), Int32(sizeof(RefNumHeaderAndTypedData)), true); }
    virtual ~TypedRefNum() { Uninit(); }
};


/**
 Retrieve the refnum data at index in RefNumStorage.
 */
template <typename T, bool _isRefCounted>
RefNumStorageBase::RefNumHeaderAndData* TypedRefNum<T, _isRefCounted>::ValidateRefNumIndexT(UInt32 index)
{
    typename RefNumMap::iterator it = _refStorage.find(index);
    if (it != _refStorage.end())
        return reinterpret_cast<RefNumHeaderAndData*>(&it->second);
    return nullptr;
}

/**
  Create new refnum data at index in RefNumStorage
 */
template <typename T, bool _isRefCounted>
RefNumStorageBase::RefNumHeaderAndData* TypedRefNum<T, _isRefCounted>::CreateRefNumIndexT(UInt32 index,
    bool *isNew)
{
    typename RefNumMap::iterator it = _refStorage.find(index);
    if (it == _refStorage.end()) {
        *isNew = true;
        return reinterpret_cast<RefNumHeaderAndData*>(&_refStorage[index]);
    } else {
        *isNew = false;
        return reinterpret_cast<RefNumHeaderAndData*>(&it->second);
    }
}

// ---------------------
/* Manage automatic cleanup of Queue refnums when a top-level VI completes.
 */
class VirtualInstrument;

class RefNumManager {
 public:
    typedef void (*CleanupProc)(intptr_t);
    struct CleanupRecord {
        CleanupProc proc;
        intptr_t arg;
        CleanupRecord(CleanupProc p, intptr_t a) : proc(p), arg(a) { }
        bool operator==(const CleanupRecord& that) const { return proc == that.proc && arg == that.arg; }
    };
 private:
    // Move this to a data structure hanging off of the VirtualInstrument?
    // There won't be many top-level VIs so this is not expensive, and may
    // be cheaper than adding permanent fields to the VirtualInstrument structure
    // since subVI don't need it.
    typedef std::map<VirtualInstrument*, std::vector<CleanupRecord> > CleanupMap;
    static CleanupMap _s_CleanupMap;
 public:
    static void AddCleanupProc(VirtualInstrument *vi, CleanupProc proc, intptr_t arg);
    static void RemoveCleanupProc(VirtualInstrument *vi, CleanupProc proc, intptr_t arg);
    static void RunCleanupProcs(VirtualInstrument *vi);
};

}  // namespace Vireo

#endif /* RefNum_H */
