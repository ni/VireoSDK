/**
 
Copyright (c) 2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include <math.h>

namespace Vireo
{

#ifdef VIREO_TRACK_MEMORY_QUANTITY
// Optional header added to blocks allocated from the system
struct MallocInfo {
    size_t          _length;        // how big the block is
    TypeManagerRef  _manager;       // which TypeManaer was used to allocate it.
};
#endif

//------------------------------------------------------------
// TypeManager
//------------------------------------------------------------
// TODO each thread can have one active TypeManager at a time.
// this is not thread local so the rutime is not ready for
// multithread execution.
VIVM_THREAD_LOCAL TypeManagerRef TypeManagerScope::ThreadsTypeManager;
//------------------------------------------------------------    
TypeManagerRef TypeManager::New(TypeManagerRef tmParent)
{
    // Bootstrap the TADM, get memeory, construct it, make it responsible for its memeory
    TypeManagerRef tm = (TypeManagerRef) TypeManager::GlobalMalloc(sizeof(TypeManager));
    new (tm) TypeManager(tmParent);
    tm->TrackAllocation(tm, sizeof(TypeManager), true);
    return tm;
}
//------------------------------------------------------------
void TypeManager::Delete(TypeManagerRef tm)
{    
    // Free up mutex, and any other members with destructors.
    tm->~TypeManager();
    TypeManager::GlobalFree(tm);
}
//------------------------------------------------------------
void TypeManager::PrintMemoryStat(ConstCStr message, Boolean bLast)
{
#ifdef VIREO_PERF_COUNTERS
    if (bLast && (_totalAllocations == 1) && (_totalAQAllocated == sizeof(TypeManager))) {
        // If bLast is true then silence is success.
    } else {
        printf("Allocations %4d, AQCount %5zd, ShareTypes %d (%s)\n", (int)_totalAllocations, _totalAQAllocated, _typesShared, message);
    }
#endif
}
//------------------------------------------------------------
TypeManager::TypeManager(TypeManagerRef rootTypeManager)
{
#ifdef VIREO_PERF_COUNTERS
    _lookUpsFound = 0;
    _lookUpsRoutedToOwner = 0;
    _typesShared = 0;
#endif
    _totalAllocations = 0;
    _totalAQAllocated = 0;
    _totalAllocationFailures = 0;
    _maxAllocated = 0;
    _allocationLimit = 16777216;  //16 meg for starters
    
    _typeList = null;
    _rootTypeManager = rootTypeManager;
    _aqBitLength = 8;
    
    // Once the object is constructed set up the source temporarily
    // and create the bad-type singleton
    {
        TypeManagerScope scope(this);
        _badType = TADM_NEW_PLACEMENT(TypeCommon)(this);
    }
}
//------------------------------------------------------------
void* TypeManager::GlobalMalloc(size_t countAQ)
{
    void* pBuffer = malloc(countAQ);
    if (pBuffer) {
        memset(pBuffer, 0, countAQ);
    }
    return pBuffer;
}
//------------------------------------------------------------
void TypeManager::GlobalFree(void* pBuffer)
{
    free(pBuffer);
}
//------------------------------------------------------------
void* TypeManager::Malloc(size_t countAQ)
{
    VIREO_ASSERT(countAQ != 0);

    if ((_totalAQAllocated + countAQ) > _allocationLimit) {
        _totalAllocationFailures ++;
        THREAD_EXEC()->ClearBreakout();
        printf("Exceeded allocation limit\n");
        return null;
    }

    size_t allocationCount = 1;
    
#ifdef VIREO_TRACK_MEMORY_QUANTITY
    // Task is charged size of MallocInfo
    countAQ += sizeof(MallocInfo);
    allocationCount = countAQ;
#endif

    void* pBuffer =  GlobalMalloc(countAQ);
    if (pBuffer) {
        TrackAllocation(pBuffer, allocationCount, true);

#ifdef VIREO_TRACK_MEMORY_QUANTITY
        ((MallocInfo*)pBuffer)->_length = allocationCount;
        ((MallocInfo*)pBuffer)->_manager = this;
        pBuffer = (MallocInfo*)pBuffer + 1;
#endif

    }
    return pBuffer;
}
//------------------------------------------------------------
void* TypeManager::Realloc(void* pBuffer, size_t countAQ, size_t preserveAQ)
{
    VIREO_ASSERT(countAQ != 0);
    VIREO_ASSERT(pBuffer != null);
    
#ifdef VIREO_TRACK_MEMORY_QUANTITY
    pBuffer = (MallocInfo*)pBuffer - 1;
    size_t currentSize = ((MallocInfo*)pBuffer)->_length;
    
    countAQ += sizeof(MallocInfo);
    preserveAQ += sizeof(MallocInfo);
#endif

    void* pNewBuffer = realloc(pBuffer, countAQ);
    
    if (pNewBuffer != null) {
        if (preserveAQ < countAQ) {
            memset((AQBlock1*)pNewBuffer + preserveAQ, 0, countAQ - preserveAQ);
        }
#ifdef VIREO_TRACK_MEMORY_QUANTITY
        TrackAllocation(pBuffer, currentSize, false);
        TrackAllocation(pNewBuffer, countAQ, true);
        ((MallocInfo*)pNewBuffer)->_length = countAQ;
        VIREO_ASSERT(this == ((MallocInfo*)pNewBuffer)->_manager);
        pNewBuffer = (MallocInfo*)pNewBuffer + 1;
#else
        TrackAllocation(pBuffer, 1, false);
        TrackAllocation(pNewBuffer, 1, true); // could be same pointer
#endif
    }
    // else realloc failed, old block is still there, same size
    // failure processed by caller.

    return pNewBuffer;
}
//------------------------------------------------------------
void TypeManager::Free(void* pBuffer)
{
    if (pBuffer) {
        size_t allocationCount = 1;
        
#ifdef VIREO_TRACK_MEMORY_QUANTITY
        pBuffer = (MallocInfo*)pBuffer - 1;
        allocationCount = ((MallocInfo*)pBuffer)->_length;
        VIREO_ASSERT(this == ((MallocInfo*)pBuffer)->_manager);
#endif
    
        TrackAllocation(pBuffer, allocationCount, false);
        return GlobalFree(pBuffer);
    }
}
//------------------------------------------------------------
// Delete all types allocated within a TypeManager.
// no type managers should refere to this instance as their root
void TypeManager::DeleteTypes(Boolean finalTime)
{
    MUTEX_SCOPE()
    
    TypeManagerScope scope(this);

    TypeRef type = _typeList;
    // Clear out any default values. They may depend on types
    // The OwnsDefDef property does not forward the the query
    // to wrapped types. The prevents base types in on TADM
    // from being being cleared by wraps from derived TADMs.
    while (type) {
        TypeRef  nextType = type->_next;
        if (type->OwnsDefDefData()) {
            void *begin = type->Begin(kPAClear);
            type->ClearData(begin);
        }
        type = nextType;
    }

    // Now free up the type objects
    type = _typeList;
    while (type) {
        TypeRef  nextType = type->Next();
        type->~TypeCommon();
        this->Free(type);
        type = nextType;
    }
    
    _typeList = null;
    _typeNameDictionary.clear();
    _typeInstanceDictionary.clear();
    
    if (!finalTime) {
        _badType = TADM_NEW_PLACEMENT(TypeCommon)(this);
    }
}
//------------------------------------------------------------
TypeRef TypeManager::GetObjectElementAddressFromPath(SubString* objectName, SubString* path, void** ppData, Boolean allowDynamic)
{
    TypeRef type = FindType(objectName);
    if (type) {
        void* pData = type->Begin(kPARead);
        return type->GetSubElementAddressFromPath(path, pData, ppData, allowDynamic);
    } else {
        *ppData = null;
        return null;
    }
}
//------------------------------------------------------------
#if defined (VIREO_INSTRUCTION_REFLECTION)
TypeRef TypeManager::DefineCustomPointerTypeWithValue(ConstCStr name, void* pointer, TypeRef typeRef, PointerTypeEnum pointerType, ConstCStr cName)
#else
TypeRef TypeManager::DefineCustomPointerTypeWithValue(ConstCStr name, void* pointer, TypeRef typeRef, PointerTypeEnum pointerType)
#endif
{
    DefaultPointerType *valueTypeNode = DefaultPointerType::New(this, typeRef, pointer, pointerType);
    
    if (valueTypeNode) {
        SubString typeName(name);
        TypeRef type =  Define(&typeName, valueTypeNode);
#if defined (VIREO_INSTRUCTION_REFLECTION)
        CPrimtitiveInfo cpi;
        cpi._cName = cName;
        cpi._type = type;
        _cPrimitiveDictionary.insert(std::make_pair(pointer, cpi));
#endif
        return type;
    } else {
        return null;
    }
}
//------------------------------------------------------------
TypeRef TypeManager::DefineCustomDataProcs(ConstCStr name, IDataProcs* pDataProcs, TypeRef typeRef)
{
    CustomDataProcType *allocTypeNode = CustomDataProcType::New(this, typeRef, pDataProcs);
    
    if (allocTypeNode) {
        SubString typeName(name);
        return Define(&typeName, allocTypeNode);
    } else {
        return null;
    }
}
//------------------------------------------------------------
void TypeManager::TrackType(TypeRef type)
{
    VIREO_ASSERT(null != type)
    type->_next = _typeList;
    _typeList = type;
}
//------------------------------------------------------------
void TypeManager::UntrackLastType(TypeRef type)
{
    VIREO_ASSERT(_typeList == type)
    _typeList = type->_next;
    type->_next = null;
}
//------------------------------------------------------------
void TypeManager::TrackAllocation(void* id, size_t countAQ, Boolean bAlloc)
{
    VIREO_ASSERT(countAQ != 0)
    
    if (bAlloc) {
        _totalAQAllocated += countAQ;
        _totalAllocations++;
    } else {
        _totalAQAllocated -= countAQ;
        _totalAllocations--;
    }
    
    if (_totalAQAllocated >_maxAllocated) {
        _maxAllocated = _totalAQAllocated;
    }
}
//------------------------------------------------------------
void TypeManager::GetTypes(TypedArray1D<TypeRef>* pArray)
{
    MUTEX_SCOPE()
    
    IntIndex length = (IntIndex)_typeNameDictionary.size();
    pArray->Resize1DOrEmpty(length);
    // If it gets emptied the follwing works fine
    
    if (pArray->Length() == length) {
        TypeRef* pBegin = pArray->Begin();
        TypeDictionaryIterator iter;
        iter = _typeNameDictionary.begin();
        
        while(iter != _typeNameDictionary.end()) {
            *pBegin = iter->second;
            pBegin++;
            iter++;
        }
    } else {
        pArray->Resize1D(0);
    }
}
//------------------------------------------------------------
TypeRef TypeManager::Define(const SubString* typeName, TypeRef type)
{
    MUTEX_SCOPE()

    // Though overloads are allowed, it is still necessary to make a name wrapper for each unique type.
    // This allows the resolved type to be passed with its name wrapper, and allows funtions to see the name
    // of the resolved symbol.

    NamedTypeRef existingType = FindType(typeName);
    return NewNamedType(typeName, type, existingType);
}
//------------------------------------------------------------
NamedTypeRef TypeManager::NewNamedType(const SubString* typeName, TypeRef type, NamedTypeRef existingType)
{
    // Storage for the string used by the dictionary is part of
    // NamedType so once it is created GetName() is used to
    // get pointers to the storage types internal name. The local is temporary, but the
    // pointers in it last as long as the type, which is longer than
    // the map entry that poionts to it.
    Boolean bNewInThisTM = existingType ? (existingType->TheTypeManager() != this) : true;
    
    NamedTypeRef namedType = NamedType::New(this, typeName, type, existingType);
    if (bNewInThisTM) {
        SubString permanentTypeName = namedType->GetName();
        _typeNameDictionary.insert(std::make_pair(permanentTypeName, namedType));
    } else {
        // If it is already in this TypeManager the new type is threaded of of the
        // Original one define.
    }
    return namedType;
}
//------------------------------------------------------------
NamedTypeRef TypeManager::FindType(ConstCStr name)
{
    SubString ssName(name);
    return FindType(&ssName);
}
//------------------------------------------------------------
NamedTypeRef TypeManager::FindType(const SubString* name)
{
    MUTEX_SCOPE()

    NamedTypeRef *pType = FindTypeConstRef(name);
    NamedTypeRef type = pType ? *pType : null;
    
    if (!type && name->ComparePrefixCStr(tsTemplatePrefix)) {
        // Names that start with $ are parameters.
        // They are all direct derivatives of "*" and are allocated as needed.
        NamedTypeRef genericType = FindType(tsWildCard);
        type = NewNamedType(name, genericType, null);
    }
    
    return type;
}
//------------------------------------------------------------
// A value stored in a ZDA is a bit more of a traditional "object"
// that is, it is an entity with an address that multiple observers
// can access and it has a name. FindNamedObject returns a pointer to
// the inner value. TODO add access mode
TypedObjectRef TypeManager::FindObject(SubString* name)
{
    TypeRef type = FindType(name);
    if (type && type->IsZDA()) {
        return *(TypedObjectRef*) type->Begin(kPARead);
    }
    return null;
}
//------------------------------------------------------------
NamedTypeRef* TypeManager::FindTypeConstRef(const SubString* name)
{
    MUTEX_SCOPE()

    // Why return a references to a TypeRef?
    // When instructions use a type constant, the instructions need to point to a variable
    // that has the TypeRef as the value. The dictionary serves as that variable so the address
    // to the entry is returned. The Symbol cannot be deleted until instructions (VIs) are cleared.
    // Since a referenced type must exist before the instruction can reference it,
    // this works out fine.

    TypeDictionaryIterator iter;
    iter = _typeNameDictionary.find(*name);
    NamedTypeRef* pFoundTypeRef = (iter != _typeNameDictionary.end()) ? &iter->second : null;
    
    if (pFoundTypeRef == null && _rootTypeManager) {
#ifdef VIREO_PERF_COUNTERS
        _lookUpsRoutedToOwner++;
#endif
        pFoundTypeRef = _rootTypeManager->FindTypeConstRef(name);
    } else {
#ifdef VIREO_PERF_COUNTERS
        _lookUpsFound++;
#endif
    }

    return pFoundTypeRef;
}
//------------------------------------------------------------
TypeRef TypeManager::ResolveToUniqueInstance(TypeRef type, SubString* binaryName)
{
    std::map<SubString, TypeRef, ComapreSubString>::iterator  iter;
    
    for (TypeManagerRef tm = this; tm ; tm = tm->RootTypeManager()) {
        iter = _typeInstanceDictionary.find(*binaryName);
        if (iter != _typeInstanceDictionary.end()) {
            // Existing instance has been found;
            UntrackLastType(type);
            Free(type);
            type = iter->second;
#ifdef VIREO_PERF_COUNTERS
            _typesShared++;
#endif
            return type;
        }
    }
    _typeInstanceDictionary[*binaryName] = type;
    return type;
}
//------------------------------------------------------------
TypeRef TypeManager::BadType()
{
    return _badType;
}
//------------------------------------------------------------
Int32  TypeManager::AQAlignment(Int32 size)
{
    // subject to be conditional to archtechure
    if (size<2)
        return 1;
    if (size<4)
        return 2;
    if (size<8)
        return 4;
    else
    return 8;
}
//------------------------------------------------------------
Int32 TypeManager::AlignAQOffset(Int32 offset, Int32 size)
{
    if (size != 0) {
        Int32 remainder  = offset % size;
        if (remainder) {
            offset = offset + size - remainder;
        }
    }
    return offset;
}
//------------------------------------------------------------
Int32 TypeManager::BitLengthToAQSize(IntIndex length)
{
    if (IsVariableLengthDim(length)) {
        // All templates turn into anonymous variable sizes
        return kArrayVariableLengthSentinel;
    } else {
        return (length + (_aqBitLength-1)) / _aqBitLength;
    }
}
//------------------------------------------------------------
NIError TypeManager::ReadValue(SubString* objectName, SubString* path, Double *pValue)
{
    void *pData = null;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == null) {
        *pValue = 0;
        return kNIError_kResourceNotFound;
    }
    
    ReadDoubleFromMemory(actualType->BitEncoding(), actualType->TopAQSize(), pData, pValue);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeManager::WriteValue(SubString* objectName, SubString* path, Double value)
{
    void *pData = null;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == null) {
        return kNIError_kResourceNotFound;
    }
    
    WriteDoubleToMemory(actualType->BitEncoding(), actualType->TopAQSize(), pData, value);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeManager::ReadValue(SubString* objectName, SubString* path, StringRef)
{
    void *pData = null;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == null) {
//        *pValue = 0;
        return kNIError_kResourceNotFound;
    }
    
//    ReadDoubleFromMemory(actualType->BitEncoding(), actualType->TopAQSize(), pData, pValue);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeManager::WriteValue(SubString* objectName, SubString* path, SubString* value)
{
    void *pData = null;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == null) {
        return kNIError_kResourceNotFound;
    }
    
//    WriteDoubleToMemory(actualType->BitEncoding(), actualType->TopAQSize(), pData, value);
    return kNIError_Success;
}

//------------------------------------------------------------
// TypeCommon
//------------------------------------------------------------
TypeCommon::TypeCommon(TypeManagerRef typeManager)
{
    _typeManager = typeManager;
    _typeManager->TrackType(this);
    // Derived class must initialize core properties
    _topAQSize      = 0;
    _aqAlignment      = 0;        // in AQ counts
    _rank           = 0;        // 0 for scalar
    _isFlat         = true;
    _isValid        = false;    // Must be reset by derived class.
    _hasCustomDefault = false;
    _hasPadding     = false;
    _hasGenericType = false;
    _isBitLevel     = false;     // Is a bit block or bit cluster
    _encoding       = kEncoding_None;
    _pointerType    = kPTNotAPointer;
    _elementUsageType = kUsageTypeSimple;
}
//------------------------------------------------------------
void TypeCommon::ZeroOutTop(void* pData)
{
    memset(pData, 0, _topAQSize);
}
//------------------------------------------------------------
NIError TypeCommon::InitData(void* pData, TypeRef pattern)
{
    memset(pData, 0, _topAQSize);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeCommon::InitData(void* pTarget, IntIndex count)
{
    NIError err = kNIError_Success;
    // non virtual method can cover simple cases as a a block
    if (IsFlat()) {
        memset(pTarget, 0, TopAQSize() * count);
    } else {
        BlockItr iTarget(pTarget, TopAQSize(), count);
        while (iTarget.HasNext()) {
            err = InitData(iTarget.ReadP());
            if (err != kNIError_Success) {
                break;
            }
        }
        // TODO if init fails, go back and clear?
    }
    return err;
}
//------------------------------------------------------------
NIError TypeCommon::ClearData(void* pTarget, IntIndex count)
{
    // non virtual method can cover simple cases as a a block
    if (IsFlat()) {
        memset(pTarget, 0, TopAQSize() * count);
    } else {
        BlockItr iTarget(pTarget, TopAQSize(), count);
        while (iTarget.HasNext()) {
            // use virtual method
            ClearData(iTarget.ReadP());
        }
    }
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeCommon::CopyData(const void* pData, void* pDataCopy)
{
    VIREO_ASSERT(IsFlat())
    memcpy(pDataCopy, pData, _topAQSize);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeCommon::CopyData(const void* pSource, void* pDest, IntIndex count)
{
    NIError err = kNIError_Success;
    if (IsFlat()) {
        memmove(pDest, pSource, count * TopAQSize());
    } else {
        BlockItr iDest(pDest, TopAQSize(), count);
        Int32 step = TopAQSize();
        AQBlock1 *pSourceElt = (AQBlock1*)pSource;
        while (iDest.HasNext()) {
            err = CopyData(pSourceElt, iDest.ReadP());
            pSourceElt += step;
            if (err != kNIError_Success)
                break;
        }
    }    
    return err;
}
//------------------------------------------------------------
NIError TypeCommon::MultiCopyData(const void* pSource, void* pDest, IntIndex count)
{
    if (IsFlat() && TopAQSize() == 1) {
        memset(pDest, (int)*(AQBlock1*)pSource, count);
    } else {
        BlockItr iDest(pDest, TopAQSize(), count);
        while (iDest.HasNext()) {
            // TODO process errors
            CopyData(pSource, iDest.ReadP());
        }
    }
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeCommon::ClearData(void* pData)
{
    // put something non zero to highlight using stale data.
    memset(pData, 0xFE, _topAQSize);
    return kNIError_Success;
}
//------------------------------------------------------------
//Determine if another type is defined from this type.
//Arrays are the same if they have the same rank and their sub types compare
//TODO: Consider merging this function with IsA function below.
Boolean TypeCommon::CompareType(TypeRef otherType)
{
    EncodingEnum thisEncoding = BitEncoding();
    EncodingEnum otherEncoding = otherType->BitEncoding();
    
    if (this == otherType) {
        return true;
    } else if (thisEncoding == kEncoding_Array && otherEncoding == kEncoding_Array) {
        if (this->Rank() == otherType->Rank())
            return this->GetSubElement(0)->CompareType(otherType->GetSubElement(0));
    } else if (thisEncoding == kEncoding_Cluster && otherEncoding == kEncoding_Cluster) {
        if (this->SubElementCount() == otherType->SubElementCount()) {
            for (int i = 0; i < this->SubElementCount(); i++) {
                if (!this->GetSubElement(i)->CompareType(otherType->GetSubElement(i)))
                    return false;
            }
            return true;
        }
    } else {
        if (this->IsA(otherType) || otherType->IsA(this))
            return true;
    } 
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsA(TypeRef otherType, Boolean compatibleStructure)
{
    Boolean bMatch = false;

    if (this == otherType) {
        bMatch = true;
    } else if (compatibleStructure) {
        EncodingEnum thisEncoding = BitEncoding();
        EncodingEnum otherEncoding = otherType->BitEncoding();
        
        if (thisEncoding == kEncoding_Array && otherEncoding == kEncoding_Array && this->Rank() == otherType->Rank()) {
            bMatch = this->GetSubElement(0)->IsA(otherType->GetSubElement(0), compatibleStructure);
        } else if (thisEncoding == kEncoding_UInt || thisEncoding == kEncoding_SInt || thisEncoding == kEncoding_Ascii || thisEncoding == kEncoding_Unicode) {
            if (otherEncoding == kEncoding_UInt || otherEncoding == kEncoding_SInt || otherEncoding == kEncoding_Ascii || otherEncoding == kEncoding_Unicode) {
                bMatch = TopAQSize() == otherType->TopAQSize();
            }
        } else if (thisEncoding == kEncoding_Cluster && otherEncoding == kEncoding_Cluster) {
            if (this->SubElementCount() == otherType->SubElementCount()) {
                for (int i = 0; i < this->SubElementCount(); i++) {
                    if (!this->GetSubElement(i)->CompareType(otherType->GetSubElement(i)))
                        break;
                }
                bMatch = true;
            }
        }
    }
  
#if 0
    if (!bMatch && otherType->GetName().Length() == 0) {
        printf(" whoas!!\n");
    }
#endif

    if (!bMatch  && (otherType->GetName().Length() > 0)) {
        bMatch = IsA(otherType);
    }

    return bMatch;
}
//------------------------------------------------------------
// Dig throught nested type names to see if one of the names
// matches the one provided.
Boolean TypeCommon::IsA(TypeRef otherType)
{
    SubString otherTypeName = otherType->GetName();
    
    SubString angle("<");
    if (otherType->HasGenericType()) {
        SubString name = GetName();
        int i = name.FindFirstMatch(&angle, 0, false);
        if (i>0) {
            name = SubString(name.Begin(), name.Begin() + i);
            if (name.Compare(&otherTypeName))
                return true;
        }
    }
    
    return IsA(&otherTypeName);
}
//------------------------------------------------------------
Boolean TypeCommon::IsA(const SubString *otherTypeName)
{
#if 0
// clusters in arrays are often anonymous, compare structurally
    if (otherTypeName->Length() == 0) {
        return false;
    }
#endif
    TypeRef t = this;
    while (t) {
        if (t->GetName().Compare(otherTypeName))
            return true;
        t = t->BaseType();
    }
    
    if (otherTypeName->CompareCStr(tsWildCard)) {
        return true;
    }
    return false;
}
//------------------------------------------------------------
//! Parse an element path by name. Base class knows nothing about sub elements.
TypeRef TypeCommon::GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic)
{
    *end = null;
    return null;
}
//------------------------------------------------------------
// WrappedType
//------------------------------------------------------------
WrappedType::WrappedType(TypeManagerRef typeManager, TypeRef type)
    : TypeCommon(typeManager)
{
    _wrapped = type;
    
    _topAQSize      = _wrapped->TopAQSize();
    _aqAlignment    = _wrapped->AQAlignment();
    _rank           = _wrapped->Rank();
    _isFlat         = _wrapped->IsFlat();
    _isValid        = _wrapped->IsValid();
    _hasCustomDefault = _wrapped->HasCustomDefault();
    _isMutableValue = _wrapped->IsMutableValue();
    _hasPadding     = _wrapped->HasPadding();
    _hasGenericType = _wrapped->HasGenericType();
    _encoding       = _wrapped->BitEncoding();
    _isBitLevel     = _wrapped->IsBitLevel();
    _pointerType    = _wrapped->PointerType();
}
//------------------------------------------------------------
// ElementType
//------------------------------------------------------------
ElementType* ElementType::New(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType, UsageTypeEnum usageType, Int32 offset)
{
    ElementType* type = TADM_NEW_PLACEMENT_DYNAMIC(ElementType, name)(typeManager, name, wrappedType, usageType, offset);
    
    SubString binaryName((AQBlock1*)&type->_topAQSize, type->_elementName.End());
    
    return (ElementType*) typeManager->ResolveToUniqueInstance(type,  &binaryName);
}
//------------------------------------------------------------
ElementType::ElementType(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType, UsageTypeEnum usageType, Int32 offset)
: WrappedType(typeManager, wrappedType), _elementName(name->Length())
{
    _elementName.Assign(name->Begin(), name->Length());
    _elementUsageType = (UInt16)usageType;
    _offset = offset;
}
//------------------------------------------------------------
// NamedType
//------------------------------------------------------------
NamedType* NamedType::New(TypeManagerRef typeManager, const SubString* name, TypeRef wrappedType, NamedTypeRef nextOverload)
{
    return TADM_NEW_PLACEMENT_DYNAMIC(NamedType, name)(typeManager, name, wrappedType, nextOverload);
}
//------------------------------------------------------------
NamedType::NamedType(TypeManagerRef typeManager, const SubString* name, TypeRef wrappedType, NamedTypeRef nextOverload)
: WrappedType(typeManager, wrappedType), _name(name->Length())
{
    if (nextOverload) {
        _nextOverload = nextOverload->_nextOverload;
        nextOverload->_nextOverload = this;
    }
    _name.Assign(name->Begin(), name->Length());
}
//------------------------------------------------------------
// AggregateType
//------------------------------------------------------------
UInt8 AggregateType::_sharedNullsBuffer[kSharedNullsBufferLength];
//------------------------------------------------------------
Int32 AggregateType::SubElementCount()
{
    return _elements.Length();
}
//------------------------------------------------------------
TypeRef AggregateType::GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic)
{
    TypeRef subType = null;
    *end = null;
    
    if (path->Length() == 0) {
        *end = start;
        return this;
    }
    
    SubString pathHead;
    SubString pathTail;
    path->SplitString(&pathHead, &pathTail, '.');

    // If the head matches one of the AggregateType's elements, add the offset.
    for (ElementType** pType = _elements.Begin(); pType != _elements.End(); pType++) {
        if ( pathHead.Compare((*pType)->_elementName.Begin(), (*pType)->_elementName.Length()) ) {
            subType = (*pType);
            *end = (AQBlock1*)start + ((*pType)->ElementOffset());
            
            // If there is a tail recurse, repin start and recurse.
            if (pathTail.ReadChar('.')) {
                return subType->GetSubElementAddressFromPath(&pathTail, *end, end, allowDynamic);
            }
            break;
        }
    }
    return subType;
}
//------------------------------------------------------------
TypeRef AggregateType::GetSubElement(Int32 index)
{
    if (index < 0 || index >= _elements.Length())
        return null; // element does not exist
    return _elements[index];
}
//------------------------------------------------------------
// BitBlockType
//------------------------------------------------------------
BitBlockType* BitBlockType::New(TypeManagerRef typeManager, IntIndex length, EncodingEnum encoding)
{
    return TADM_NEW_PLACEMENT(BitBlockType)(typeManager, length, encoding);
}
//------------------------------------------------------------
BitBlockType::BitBlockType(TypeManagerRef typeManager, IntIndex length, EncodingEnum encoding)
: TypeCommon(typeManager)
{
    _blockLength = length;
    _isFlat = true;
    _aqAlignment = 0;   // BitBlocks are not addressable, no alignment
    _isValid = true;
    _isBitLevel = true;
    _hasGenericType = false;
    _encoding = encoding;

    if (encoding == kEncoding_Generic) {
        _hasGenericType = true;
    } else if (encoding == kEncoding_None && length > 0) {
        // TODO revisit interms of bounded and template
        _isValid = false;
    }
}
//------------------------------------------------------------
// BitClusterType
//------------------------------------------------------------
BitClusterType* BitClusterType::New(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
{
    BitClusterType* type = TADM_NEW_PLACEMENT_DYNAMIC(BitClusterType, count)(typeManager, elements, count);
    
    SubString binaryName((AQBlock1*)&type->_topAQSize, (AQBlock1*)type->_elements.End());
    
    return (BitClusterType*) typeManager->ResolveToUniqueInstance(type,  &binaryName);
}
//------------------------------------------------------------
BitClusterType::BitClusterType(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
    : AggregateType(typeManager, elements, count)
{
    Int32   bitLength = 0;
    Boolean isFlat = true;
    Boolean isValid = true;
    Boolean hasCustomValue = false;
    Boolean hasGenericType = false;
    Boolean isVariableSize = false;
    EncodingEnum encoding = kEncoding_None;
    
    for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++) {
        ElementType* element = *pType;
        
        element->_offset = bitLength;
        IntIndex elementLength = element->BitLength();
        if (IsVariableLengthDim(elementLength) || isVariableSize) {
            bitLength = kArrayVariableLengthSentinel;
            isVariableSize = true;
        } else {
            bitLength += elementLength;
        }
        isFlat  &= element->IsFlat();
        isValid  |= element->IsValid();
        hasCustomValue |= element->HasCustomDefault();
        hasGenericType |= element->HasGenericType();
        
        encoding = element->BitEncoding();
    }
    
    _topAQSize = 0;
    _aqAlignment = 0;
    _rank = 0;
    _blockLength = bitLength;
    _isFlat = isFlat;
    _isValid = isValid;
    _isBitLevel = true;
    _hasCustomDefault = hasCustomValue;
    _hasGenericType = hasGenericType;
    if (_elements.Length() > 1)
        encoding = kEncoding_Cluster;
    _encoding = encoding;
    _pointerType = kPTNotAPointer;
    
    // TODO figure out total bit size and bit offsets
}
//------------------------------------------------------------
// ClusterElementAlignmentCalculator
//------------------------------------------------------------
AggregateAlignmentCalculator::AggregateAlignmentCalculator(TypeManagerRef tm)
{
    _tm = tm;
    _aqOffset = 0;
    ElementCount = 0;
    AggregateAlignment = 0;
    AggregateSize = 0;
    IncludesPadding = false;
    IsFlat = true;
    IsValid = true;
}
//------------------------------------------------------------
void AggregateAlignmentCalculator::Finish()
{
    // Round up the size of the aggregate to a multiple the largest alignment requirement
    // For example, (.Double .Int8) is size 16, not 9. Note the padding if added.
    AggregateSize = _tm->AlignAQOffset(_aqOffset, AggregateAlignment);
    IncludesPadding |= AggregateSize != _aqOffset;
}
//------------------------------------------------------------
Int32 ClusterAlignmentCalculator::AlignNextElement(TypeRef element)
{
    ElementCount++;
    IsValid &= element->IsValid();
    Int32 elementAlignment = 0;
    Int32 elementOffset = 0;

    Int32 subAQSize = element->TopAQSize();
    IncludesPadding |= element->HasPadding();
    IsFlat &= element->IsFlat();

    if (subAQSize == 0) {
        // For subtypes that have not been promoted to being addressable
        // determine the size of the addressable block that can contain it
        // since Clusters are alwasy addressable.
        subAQSize = _tm->BitLengthToAQSize(element->BitLength());
        if (IsVariableLengthDim(subAQSize))
            subAQSize = 0;
        
        // Alignment for BitBlocks/BitClusters assumes block will
        // be read/written as one atomic operation
        elementAlignment = _tm->AQAlignment(subAQSize);
    } else {
        elementAlignment = element->AQAlignment();
    }
    AggregateAlignment = Max(AggregateAlignment, elementAlignment);

    // See if any padding is needed before this element. Round up as needed.
    elementOffset = _tm->AlignAQOffset(_aqOffset, elementAlignment);
    IncludesPadding |= (elementOffset != _aqOffset);
    _aqOffset = elementOffset;
    
    // Now move to offset for next element
    _aqOffset += subAQSize;
    return elementOffset;
}
//------------------------------------------------------------
// ParamBlockAlignmentCalculator
//------------------------------------------------------------
ParamBlockAlignmentCalculator::ParamBlockAlignmentCalculator(TypeManagerRef tm)
: AggregateAlignmentCalculator(tm)
{
    // ParamBlock describe a native instruction parameter block.
    // This structure derives from InstructionCore and at minimum
    // includes a function pointer.
    _aqOffset = sizeof(InstructionCore);
}
//------------------------------------------------------------
Int32 ParamBlockAlignmentCalculator::AlignNextElement(TypeRef element)
{
    static SubString  stad("StaticTypeAndData");

    Int32 elementOffset = _aqOffset;
    IsValid &= element->IsValid();
    if (element->IsA(&stad)) {
        // The StaticTypeAndData parameter is two pointers
        _aqOffset += 2 * sizeof(void*);
    } else {
        _aqOffset += sizeof(void*);
    }
    AggregateAlignment = sizeof(void*);
    ElementCount++;
    return elementOffset;
}
//------------------------------------------------------------
// EquivalenceBlockAlignmentCalculator
//------------------------------------------------------------
Int32 EquivalenceAlignmentCalculator::AlignNextElement(TypeRef element)
{
    IsValid &= element->IsValid();
    if (ElementCount == 0) {
        AggregateSize = element->TopAQSize();
    } else {
        VIREO_ASSERT(AggregateSize == element->TopAQSize())
    }
    if (element->AQAlignment() > AggregateAlignment) {
        AggregateAlignment = element->AQAlignment();
    }
    ElementCount++;
    
    // All elements are overlayed, so they start where element does, which is at 0
    return 0;
}
//------------------------------------------------------------
// ClusterType
//------------------------------------------------------------
ClusterType* ClusterType::New(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
{
    ClusterType* type = TADM_NEW_PLACEMENT_DYNAMIC(ClusterType, count)(typeManager, elements, count);
    
    SubString binaryName((AQBlock1*)&type->_topAQSize, (AQBlock1*)type->_elements.End());
    
    return (ClusterType*) typeManager->ResolveToUniqueInstance(type,  &binaryName);
}
//------------------------------------------------------------
ClusterType::ClusterType(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
    : AggregateType(typeManager, elements, count)
{
    Boolean hasCustomValue = false;
    Boolean hasGenericType = false;
    EncodingEnum encoding = kEncoding_None;
    Boolean isBitLevel = false;
    
    ClusterAlignmentCalculator alignmentCalculator(this->TheTypeManager());
    
    for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++) {
        ElementType* element = *pType;
        
#ifdef VIREO_USING_ASSERTS
        Int32 offset = alignmentCalculator.AlignNextElement(element);
        VIREO_ASSERT(element->_offset == offset);
#else
        alignmentCalculator.AlignNextElement(element);
#endif
        
        hasCustomValue |= element->HasCustomDefault();
        hasGenericType |= element->HasGenericType();
        encoding = element->BitEncoding();
        isBitLevel = element->IsBitLevel();
    }
    alignmentCalculator.Finish();
    
    _isValid = alignmentCalculator.IsValid;
    _aqAlignment = alignmentCalculator.AggregateAlignment;
    _topAQSize = alignmentCalculator.AggregateSize;
    _isFlat = alignmentCalculator.IsFlat;
    _hasCustomDefault = hasCustomValue;
    _hasPadding = alignmentCalculator.IncludesPadding;
    _hasGenericType = hasGenericType;
    if (_elements.Length() == 1 && isBitLevel) {
        _encoding = encoding;
    } else {
        _encoding = kEncoding_Cluster;
    }
}
//------------------------------------------------------------
NIError ClusterType::InitData(void* pData, TypeRef pattern)
{
    if (!IsFlat() || HasCustomDefault()) {
        // For non trivial cases visit each element
        for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++) {
            AQBlock1* pEltData = ((AQBlock1*)pData) + (*pType)->_offset;

            if ( !(*pType)->IsFlat() && (*pType)->IsAlias()) {
                // If the element type is a parameter then the value will be top copied.
                // the only initialization that should be done is to zero-out the block
                // arrays and custom defaults will be copied/initialized at call time.
                (*pType)->ZeroOutTop(pEltData);
            } else {
                (*pType)->InitData(pEltData);
            }
        }
        return kNIError_Success;
    } else {
        // If the structure is flat, we can treat it like a flat block
        return TypeCommon::InitData(pData);
    }
}
//------------------------------------------------------------
NIError ClusterType::ClearData(void* pData)
{
    if (IsFlat()) {
        // If the structure is flat it can be treated as a single block
        return TypeCommon::ClearData(pData);
    } else {
        // For non trivial cases visit each element
        for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++)
        {
            AQBlock1* pEltData = ((AQBlock1*)pData) + (*pType)->_offset;
            // If the element is an input or output in a subVI call, the calling VI will clear
            // the data this is an alias to. For In/Out types this is normarly zeroed out as
            // part of the call sequence unless the VI is aborted.
            if ((*pType)->IsAlias()) {
                (*pType)->ZeroOutTop(pEltData);
            } else {
                (*pType)->ClearData(pEltData);
            }
        }
        return kNIError_Success;
    }
}
//------------------------------------------------------------
NIError ClusterType::CopyData(const void* pData, void *pDataCopy)
{
    if (IsFlat()) {
        // If the structure is flat, we can treated as a single block.
        return TypeCommon::CopyData(pData, pDataCopy);
    } else {
        // For non trivial cases visit each element
        for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++)
        {
            // TODO errors
            Int32 offset = (*pType)->_offset;
            (*pType)->CopyData( (((AQBlock1*)pData) + offset), (((AQBlock1*)pDataCopy) + offset) );
        }
        return kNIError_Success;
    }
}
//------------------------------------------------------------
void* ClusterType::Begin(PointerAccessEnum mode)
{
    // Default-Defaults are generated as needed on demand and should
    // only be accessed in read mode or clear mode
    if (mode == kPARead) {
        if (IsFlat() && !HasCustomDefault() && (TopAQSize() < kSharedNullsBufferLength)) {
            // Small flat blocks of zeros can be shared
            _pDefault = _sharedNullsBuffer;
        } else {
            // If is too big to use the shared one, or its not
            // trivial then alloc a buffer for this specific instance.
            _ownsDefDefData = true;
            _pDefault = TheTypeManager()->Malloc(TopAQSize());
            InitData(_pDefault);
        }
        return _pDefault;
    } else if ((mode == kPAClear) && (_pDefault != _sharedNullsBuffer)) {
        // If its for clearing then only the contents will be cleared
        // the block is freed in ClusterType's destructor
        return _pDefault;
    } else if (mode == kPASoftRead) {
        // Soft reads just use what currently exists, they never allocate
        return _pDefault;
    } else {
        // This includes mode == kPAWrite mode == kPAReadWrite, not allowed
        return null;
    }
}
//------------------------------------------------------------
ClusterType::~ClusterType()
{
    if (_pDefault && (_pDefault != _sharedNullsBuffer)) {
        // Any non flat elements should have been cleared by this point,
        // however the underlying block still needs to be released.
        TheTypeManager()->Free(_pDefault);
        _pDefault = null;
    }
}
//------------------------------------------------------------
// EquivalenceType
//------------------------------------------------------------
EquivalenceType* EquivalenceType::New(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
{
    return TADM_NEW_PLACEMENT_DYNAMIC(EquivalenceType, count)(typeManager, elements, count);
}
//------------------------------------------------------------
EquivalenceType::EquivalenceType(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
    : AggregateType(typeManager, elements, count)
{
    // To be equivalence they must be flat and same bit or AQ Size
    Boolean isFlat = true;
    Int32 alignment = 0;
    Int32 aqCount = 0;
    EncodingEnum encoding = kEncoding_None;
    Boolean isValid = true;
    
    if (_elements.Length()>0) {
        TypeRef element = _elements[0];
        isFlat  = element->IsFlat();
        alignment = element->AQAlignment();
        aqCount = element->TopAQSize();
        // First element of Equivalence block defines encoding
        encoding = element->BitEncoding();
        isValid = element->IsValid();
        
        //         // TODO make sure all are like this one
        //        for (int i=0; i<_elements.size(); i++) {
        //            element = _elements[i];
        //        }
    }
    
    _isFlat = isFlat;
    _aqAlignment = alignment;
    _topAQSize = aqCount;
    _encoding = encoding;
    _isValid = isValid;
}
//------------------------------------------------------------
void* EquivalenceType::Begin(PointerAccessEnum mode)
{
    if (_elements.Length() > 0) {
        return _elements[0]->Begin(mode);
    }
    return null;
}
//------------------------------------------------------------
NIError EquivalenceType::InitData(void* pData, TypeRef pattern)
{
    if (_elements.Length() > 0) {
        return _elements[0]->InitData(pData, pattern);
    }
    return kNIError_Success;
}
//------------------------------------------------------------
NIError EquivalenceType::CopyData(const void* pData, void *pDataCopy)
{
    if (_elements.Length() > 0) {
        return _elements[0]->CopyData(pData, pDataCopy);
    }
    return kNIError_Success;
}
//------------------------------------------------------------
NIError EquivalenceType::ClearData(void* pData)
{
    if (_elements.Length() > 0) {
        return _elements[0]->ClearData(pData);
    }
    return kNIError_Success;
}
//------------------------------------------------------------
// ArrayType
//------------------------------------------------------------
ArrayType* ArrayType::New(TypeManagerRef typeManager, TypeRef elementType, IntIndex rank, IntIndex* dimensionLengths)
{
    ArrayType* type = TADM_NEW_PLACEMENT_DYNAMIC(ArrayType, rank)(typeManager, elementType, rank, dimensionLengths);

    SubString binaryName((AQBlock1*)&type->_topAQSize, (AQBlock1*)(&type->_dimensionLengths[0] + rank));
    
    return (ArrayType*) typeManager->ResolveToUniqueInstance(type,  &binaryName);
}
//------------------------------------------------------------
ArrayType::ArrayType(TypeManagerRef typeManager, TypeRef elementType, IntIndex rank, IntIndex* dimensionLengths)
    : WrappedType(typeManager, elementType)
{
    _topAQSize = TheTypeManager()->HostPointerToAQSize();
    _aqAlignment = TheTypeManager()->AQAlignment(sizeof(void*));
    _rank = rank;
    _isFlat = false;  // TODO allow fixed / bounded arrays may be inlined
    _encoding = kEncoding_Array;
    _isBitLevel = false;
    _hasCustomDefault = false;
    _hasGenericType = _wrapped->HasGenericType();

    memcpy(_dimensionLengths, dimensionLengths, rank * sizeof(IntIndex));
}
//------------------------------------------------------------
NIError ArrayType::InitData(void* pData, TypeRef pattern)
{
    NIError err = kNIError_Success;
    
    TypedArrayCoreRef *pArray = (TypedArrayCoreRef*)pData;
    // Initialize the handle at pData to be a valid handle to an empty array
    // Note that if the type being inited was a named type the name will have been  peeled off
    // When it gets to this point.
    if (*pArray != null) {
        // TODO for fixed arrays and ZDAs this not correct
        err = (*pArray)->Resize1D(0) ? kNIError_Success : kNIError_kInsufficientResources;
    } else {
        if (pattern == null) {
            pattern = this;
        }
        TypedArrayCoreRef newArray = TypedArrayCore::New(pattern);
        *(TypedArrayCoreRef*)pArray = newArray;
        if (!newArray) {
            err = kNIError_kInsufficientResources;
        } else if (pattern->HasCustomDefault()) {
            // The top part has been setup, now the code needs to be finished
            err = CopyData(pattern->Begin(kPARead), pData);
        }
    }
    return err;
}
//------------------------------------------------------------
// Copy the elements from the handle at pData to the one at pDataCopy
// if target is null, alocate handle.
NIError ArrayType::CopyData(const void* pData, void* pDataCopy)
{
    NIError err = kNIError_Success;
    TypedArrayCoreRef pSource = *((TypedArrayCoreRef*)pData);
    TypedArrayCoreRef pDest = *((TypedArrayCoreRef*)pDataCopy);
    
    if (pSource == null) {
        if (pDest == null) {
            return kNIError_Success;
        }
    }
    
    TypeRef elementType = pSource->ElementType();
    TypeRef elementTypeDest = pDest->ElementType();
    
    // Update generic destination if its different.
    // Otherwise the source and dest are assumed to match. That should have been
    // determined when the instruction was generated.
    if (elementTypeDest != elementType && elementTypeDest->HasGenericType())
        pDest->SetElementType(elementType, false);

    if (!pDest->ResizeToMatchOrEmpty(pSource)) {
        return kNIError_kInsufficientResources;
    }
    
    if (elementType->IsFlat()) {
        size_t aqLength = pSource->Length() * elementType->TopAQSize();
        memmove(pDest->RawBegin(), pSource->RawBegin(), aqLength);
    } else {
        AQBlock1 *pSourceElt = pSource->RawBegin();
        AQBlock1 *pDestElt = pDest->RawBegin();
        IntIndex stride = elementType->TopAQSize();
        IntIndex count = pSource->Length();
        for (Int32 i = 0; i < count; i++) {
            err = elementType->CopyData(pSourceElt, pDestElt);
            if (err != kNIError_Success) {
                pDest->Resize1D(0);
                break;
            }
            pSourceElt += stride;
            pDestElt += stride;
        }
    }
    return err;
}
//------------------------------------------------------------
NIError ArrayType::ClearData(void* pData)
{
    // Free up the elements and delete the array handle at pData
    TypedArrayCoreRef array = *(TypedArrayCoreRef*) pData;
    if (array != null) {
        *((TypedArrayCoreRef*)pData) = null;
        TypedArrayCore::Delete(array);
    }
    return kNIError_Success;
}
//------------------------------------------------------------
void* ArrayType::Begin(PointerAccessEnum mode)
{
    if (mode == kPARead) {
        // Default-Defaults are generated as needed on demand and should
        // only be accessed in read mode
        if (_pDefault == null) {
            TypeManagerScope scope(TheTypeManager());
            // On demand allocations for defdef data belong
            // to the TM that the type is owned by
            _ownsDefDefData = true;
            this->InitData(&_pDefault);
        }
        return &_pDefault;
    } else if (mode == kPAClear) {
        // Unlike the cluster which may have an extra block, arrays
        // just have one pointer and its part of the object.
        // The clear operation will free the entire array, so the
        // ArrayType class does not need a destructor
        return &_pDefault;
    } else if (mode == kPASoftRead) {
        // Soft reads just use what currently exists, they never allocate
        return _pDefault ? &_pDefault : null;
    } else {
        return null;
    }
}
//------------------------------------------------------------
TypeRef ArrayType::GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic)
{
    TypedArrayCoreRef array = *(TypedArrayCoreRef*)start;
    TypeRef subType = null;
    *end = null;
    
    if (Rank() == 0) {
        // ZDAs automatically hop into the object. That means an empty path will
        // still dereference the pointer and get an address to the element itself
        subType = array->ElementType();
        *end = array->RawObj();
        
        // If there is a path it applies to the object it self,  Repin start and recurse.
        if (path->Length() > 0) {
            subType = subType->GetSubElementAddressFromPath(path, *end, end, allowDynamic);
        }
    } else {
        // Split the path into a head & tail
        SubString pathHead;
        SubString pathTail;
        path->SplitString(&pathHead, &pathTail, '.');

        printf(" Using array indexes in paths\n");
        // If the path has a tail it needs to index the array.
        // There may be more than one way to do so raw1d indexes, or multidim
        // may allow end point relative as well ???
        if (pathTail.ReadChar('.')) {
            subType = GetSubElementAddressFromPath(path, start, end, allowDynamic);
        }
        // TODO parse indexes.
        // Variable sized arrays can only be indexed if allowDynamic is true.
        subType = null;
        *end = null;
    }
    return subType;
}
//------------------------------------------------------------
// ParamBlockType
//------------------------------------------------------------
ParamBlockType* ParamBlockType::New(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
{
    ParamBlockType* type = TADM_NEW_PLACEMENT_DYNAMIC(ParamBlockType, count)(typeManager, elements, count);

    SubString binaryName((AQBlock1*)&type->_topAQSize, (AQBlock1*)type->_elements.End());
    
    return (ParamBlockType*) typeManager->ResolveToUniqueInstance(type,  &binaryName);
}
//------------------------------------------------------------
ParamBlockType::ParamBlockType(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
    : AggregateType(typeManager, elements, count)
{
    Boolean isFlat = true;
    Boolean hasGenericType = false;
    //  Boolean hasVarArg = false; TODO look for upto one and only one var arg type
    
    // The param block describes the structure allocated for a single instuction object
    // For a native function. The size will be base plus the storage needed for pointers
    // to each element.
    
    ParamBlockAlignmentCalculator alignmentCalculator(this->TheTypeManager());
    for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++) {
        ElementType* element = *pType;
        
#ifdef VIREO_USING_ASSERTS
        Int32 offset = alignmentCalculator.AlignNextElement(element);
        VIREO_ASSERT(element->_offset == offset);
#else
        alignmentCalculator.AlignNextElement(element);
#endif

        hasGenericType |= element->HasGenericType();
        UsageTypeEnum ute = element->ElementUsageType();
        if (ute == kUsageTypeStatic || ute == kUsageTypeTemp) {
            // static and temp values are owned by the instruction, not the VIs data space
            // and will need extra work to be inited and cleared if they are not flat
            isFlat &= element->IsFlat();
        }
    }
    alignmentCalculator.Finish();
    
    // Since it is a funnction, the size is the size of a pointer-to-a-function with that parameter list
    _isValid = alignmentCalculator.IsValid;
    _aqAlignment = alignmentCalculator.AggregateAlignment;
    _topAQSize = alignmentCalculator.AggregateSize;
    _isFlat = isFlat;  //should be false ??
    _hasGenericType = hasGenericType;
    _encoding = kEncoding_ParameterBlock;
}
//------------------------------------------------------------
// DefaultValueType
//------------------------------------------------------------
DefaultValueType* DefaultValueType::New(TypeManagerRef typeManager, TypeRef valuesType, Boolean mutableValue)
{
    DefaultValueType* type = TADM_NEW_PLACEMENT_DYNAMIC(DefaultValueType, valuesType)(typeManager, valuesType, mutableValue);

    return type;
}
//------------------------------------------------------------
DefaultValueType* DefaultValueType::FinalizeConstant()
{
    // Constants can ( e.g. could)  be shared but it has to be carefully boot strapped
    // (1) The DefaultValueType object is created. It has storage inlined in the object
    // (2) The storage in the DVT is used as a location to for the parser to read in the data
    //
    // (3) Once loaded the type can be finialized and the default value now makes up part of the binary
    // name for the type.
    //
    // Types with mutable defaults ( e.g variables) can not be merged.
    // Non flat could be merged, but are not yet. To do so the entire sub value would have to match.
    // partial mathces are not currently allowed since ther is not a provision for sharing ownership for sparse
    // sets of data in deeply structured data. The root of the value must own all elements beneath it.
    
    if (!IsMutableValue() && IsFlat()) {
        // The binary name is not set yet.
        AQBlock1* binaryNameEnd = (AQBlock1*)(this+1) + TopAQSize();
        SubString binaryName((AQBlock1*)&this->_topAQSize, binaryNameEnd);
        return (DefaultValueType*) this->TheTypeManager()->ResolveToUniqueInstance(this,  &binaryName);
    } else {
        return this;
    }
}
//------------------------------------------------------------
DefaultValueType::DefaultValueType(TypeManagerRef typeManager, TypeRef type, Boolean mutableValue)
: WrappedType(typeManager, type)
{
    // Initialize the block where ever it was allocated.
    _hasCustomDefault = true;
    _isMutableValue = mutableValue;
    _ownsDefDefData = true;
    type->InitData(Begin(kPAInit), type);
}
//------------------------------------------------------------
void* DefaultValueType::Begin(PointerAccessEnum mode)
{
    if (!IsMutableValue() && (mode == kPAWrite || mode == kPAReadWrite) ) {
        return null;
    }
    
    // If pointer is neeeded for initialization, reading, or
    // clearing then its OK.
    
    // Storage for the value immediately follows the storeage used for
    // the C++ object. The ammount is determined by
    // DefaultValueType::StructSize when the object was constructed.
    
    return this + 1;
}
//------------------------------------------------------------
NIError DefaultValueType::InitData(void* pData, TypeRef pattern)
{
    if (!IsFlat()) {
        _wrapped->InitData(pData, pattern);
    }
    return CopyData(Begin(kPARead), pData);
}
//------------------------------------------------------------
// PointerType
//------------------------------------------------------------
PointerType* PointerType::New(TypeManagerRef typeManager, TypeRef type)
{
    return TADM_NEW_PLACEMENT(PointerType)(typeManager, type);
}
//------------------------------------------------------------
PointerType::PointerType(TypeManagerRef typeManager, TypeRef type)
: WrappedType(typeManager, type)
{
}
//------------------------------------------------------------
// DefaultPointerType
//------------------------------------------------------------
DefaultPointerType* DefaultPointerType::New(TypeManagerRef typeManager, TypeRef type, void* pointer, PointerTypeEnum pointerType)
{
    return TADM_NEW_PLACEMENT(DefaultPointerType)(typeManager, type, pointer, pointerType);
}
//------------------------------------------------------------
DefaultPointerType::DefaultPointerType(TypeManagerRef typeManager, TypeRef type, void* pointer, PointerTypeEnum pointerType)
: PointerType(typeManager, type)
{
    _hasCustomDefault = true;
    _topAQSize = sizeof(void*);
    _encoding = kEncoding_Pointer;
    _defaultPointerValue = pointer;
    _pointerType = pointerType;
}
//------------------------------------------------------------
// CustomDataProcType
//------------------------------------------------------------
CustomDataProcType* CustomDataProcType::New(TypeManagerRef typeManager, TypeRef type, IDataProcs* pDataProcs)
{
    return TADM_NEW_PLACEMENT(CustomDataProcType)(typeManager, type, pDataProcs);
}
//------------------------------------------------------------
CustomDataProcType::CustomDataProcType(TypeManagerRef typeManager, TypeRef type, IDataProcs* pDataProcs)
: WrappedType(typeManager, type)
{
    _isFlat = false;    // Force calls to the alloc functions
    _pDataProcs = pDataProcs;
}
//------------------------------------------------------------
// TypedArrayCore
//------------------------------------------------------------
TypedArrayCoreRef TypedArrayCore::New(TypeRef type)
{
    return TADM_NEW_PLACEMENT_DYNAMIC(TypedArrayCore, type->Rank())(type);
}
//------------------------------------------------------------
TypedArrayCore::TypedArrayCore(TypeRef type)
{
    VIREO_ASSERT(_pRawBufferBegin == null);
    VIREO_ASSERT(_capacity == 0);

    this->_typeRef = type;
    this->_eltTypeRef = type->GetSubElement(0);

    // Resize it to 0, This will trigger any allocatons necesary for fixed or ounded arrays
    ResizeDimensions(0, null, false);
}
//------------------------------------------------------------
void TypedArrayCore::Delete(TypedArrayCoreRef pArray)
{
    VIREO_ASSERT(pArray->_eltTypeRef != null);
    
    pArray->_eltTypeRef->ClearData(pArray->RawBegin(), pArray->Length());
    pArray->AQFree();
    THREAD_TADM()->Free(pArray);
}
//------------------------------------------------------------
Boolean TypedArrayCore::AQAlloc(IntIndex countBytes)
{
    VIREO_ASSERT(countBytes >= 0)
    VIREO_ASSERT(_pRawBufferBegin == null);

    if (countBytes) {
        _pRawBufferBegin = (AQBlock1*) THREAD_TADM()->Malloc(countBytes);
        if (!_pRawBufferBegin) {
            return false;
        }
    } else {
        _pRawBufferBegin = null;
    }
    return true;
}
//------------------------------------------------------------
Boolean TypedArrayCore::AQRealloc(IntIndex countBytes, IntIndex preserveBytes)
{
    VIREO_ASSERT(countBytes >= 0)
    if (_pRawBufferBegin == null) {
        // Going from empty to possibly non empty, AQAlloc will
        // test for empty-to-empty no-ops
        return AQAlloc(countBytes);
    } else {
        if (countBytes) {
            // resize existing allocation.
            AQBlock1 *newBegin = (AQBlock1*) THREAD_TADM()->Realloc(_pRawBufferBegin, countBytes, preserveBytes);
            if (newBegin) {
                _pRawBufferBegin = newBegin;
            } else {
                return false;
            }            
        } else {
            // nonempty-to-empty, free and null out pointers.
            AQFree();
        }
    }
    return true;
}
//------------------------------------------------------------
void TypedArrayCore::AQFree()
{
    if (_pRawBufferBegin) {
        THREAD_TADM()->Free(_pRawBufferBegin);
        _pRawBufferBegin = null;
    }
}
//------------------------------------------------------------
// If the array is a of a generic type then its element type
// can be set dynamicaly so long as the specified type maintains
// a an IsA() relationship with the Array's Type ElementType.
Boolean TypedArrayCore::SetElementType(TypeRef type, Boolean preserveValues)
{
    if (Rank() == 0) {
        // Out with the old
        _eltTypeRef->ClearData(RawBegin());
        // In with the new
        AQRealloc(type->TopAQSize(), 0);
        _eltTypeRef = type;
        _capacity = 1;
        _eltTypeRef->InitData(RawBegin());
    } else {
        // TODO: Resetting non ZDA array element type not currently supported
        VIREO_ASSERT(false);
    }
    return true;
}
//------------------------------------------------------------
IntIndex TypedArrayCore::InternalCalculateLength()
{
    // Calculate how many elements are in the array based on the
    // current length of each dimension.
    IntIndex length = 1;
    IntIndexItr iDim( GetDimensionLengths(), Rank());
    while (iDim.HasNext()) {
        length *= iDim.Read();
    }
    return length;
}
//------------------------------------------------------------
IntIndex TypedArrayCore::GetLength(IntIndex i)
{
    VIREO_ASSERT((i >= 0) && (i < Rank()));
    if ((i >= 0) && (i < Rank())) {
        return GetDimensionLengths()[i];
    } else {
        return 0;
    }
}
//------------------------------------------------------------
#if 0
// indexing give a vectors seems natural, but with the threaded snippet
// execution an array of pointers to dimensions is more common.
// so the BeginAtNDIndirect is used instead.
AQBlock1* TypedArrayCore::BeginAtND(Int32 rank, IntIndex* pDimIndexes)
{
    // Ignore extra outer dimension if supplied.
    if (rank > Rank()) {
        // Check extra dims to see if they are 0, if not then it's out of bounds.
        return null;
    }
    
    AQBlock1 *pElt = RawBegin();
    IntIndex* pDimLength = GetDimensionLengths();
    IntIndexItr iSlab(GetSlabLengths(), rank);
    
    // Find index by calculating dot product of
    // SlabLength vector and dimension index vector.
    // Note that slabs do not need to be packed.
    while (iSlab.HasNext()) {
        IntIndex dim = *pDimIndexes;
        if ((dim < 0) || (dim >= *pDimLength)) {
            return null;
        }
        pElt += dim * iSlab.NextV();
        
        pDimIndexes++;
        pDimLength++;
    }
    return pElt;
}
#endif

//------------------------------------------------------------
AQBlock1* TypedArrayCore::BeginAtNDIndirect(Int32 rank, IntIndex** ppDimIndexes)
{
    // Ignore extra outer dimension if supplied.
    if (rank > Rank()) {
        // Possibly check extra dims to see if they are 0,
        // if not then it's out of bounds.
        return null;
    }
    
    AQBlock1 *pElt = RawBegin();
    IntIndex* pDimLength = GetDimensionLengths();
    IntIndexItr iSlab(GetSlabLengths(), rank);
    
    // Find index by calculating dot product of
    // SlabLength vector and dimension index vector.
    // Note that slabs do not need to be packed.
    while (iSlab.HasNext()) {
        IntIndex *pDim = *ppDimIndexes;
        IntIndex dim = pDim ? *pDim : 0;
        if ((dim < 0) || (dim >= *pDimLength)) {
            return null;
        }
        pElt += dim * iSlab.Read();
        ppDimIndexes++;
        pDimLength++;
    }
    return pElt;
}
//------------------------------------------------------------
// Resize an array to match an existing pattern. The pattern
// may be an existing array or array type definition. The latter may
// contain variable or bounded dimension lengths.
Boolean TypedArrayCore::ResizeDimensions(Int32 rank, IntIndex *dimensionLengths, Boolean preserveElements)
{
    Int32 valuesRank = Rank();
    
    // Three sets of dimension sizes are used in this algorithm:
    //
    // (1) The requested dimension lenghts.
    //
    // (2) The underlying type's dimension lenghts, which may be variable fixed or bounded.
    //     Requests must be constrained to these specifications.
    //
    // (3) The current actual dimension lenght of the values.
    //
    // If the requested size contains a variable sentinel the existing value size will be used.
    // If the requested size if bounded (negative) the bounded size will be used.
    // Current actual dimension lenghts are regular positive integers, never bounded or variable sentinels.
    //
    //

    IntIndex *pRequestedLengths;
    IntIndex *pTypesLengths = Type()->GetDimensionLengths();
    IntIndex *pValueLengths = GetDimensionLengths();
    IntIndex *pSlabLengths = GetSlabLengths();
    
    IntIndex slabLength = ElementType()->TopAQSize();
    IntIndex originalLength = Length();

    // Only used if too few dimensions passed in.
    ArrayDimensionVector tempDimensionLengths;
    
    if (valuesRank <= rank) {
        // If enough dimensions are supplied use them inplace
        pRequestedLengths = dimensionLengths;
    } else {
        // It too few are supplied fill out the remaining in a temporary copy.
        int i=0;
        int dimsToBeFilledIn = valuesRank - rank;
        
        for (; i < dimsToBeFilledIn ; i++) {
            // Inner dimensions stay the same so copy from value's.
            tempDimensionLengths[i] = pValueLengths[i];
        }
        for (; i < valuesRank ; i++) {
            // Use supplied dims for outer.
            tempDimensionLengths[i] = dimensionLengths[i - dimsToBeFilledIn];
        }
        pRequestedLengths = tempDimensionLengths;
    }
    IntIndexItr  iRequestedDim(pRequestedLengths, valuesRank);
    
    IntIndex newCapacity = 1;
    Int32    newLength = 1;
    
    while(iRequestedDim.HasNext()) {
        *pSlabLengths++ = slabLength;
        IntIndex dimLength = iRequestedDim.Read();
        IntIndex typesDimLength = *pTypesLengths;
        IntIndex dimCapactiy = dimLength;
        
        // Now compare with the type's specifications
        if (typesDimLength >= 0) {
            // Fixed trumps request
            dimCapactiy = typesDimLength;
            dimLength = dimCapactiy;
            // TODO ignore excessive request or flag as error
        } else if (!IsVariableLengthDim(typesDimLength)) {
            // Capacity is bounded length
            // Length is request, but clipped at bounded length
            dimCapactiy = -typesDimLength;
            if (dimLength > dimCapactiy) {
                 // TODO ignore excessive request or clip
                 // dimLength = *pValueLengths;
                 dimLength = dimCapactiy;
            }
        }
        newCapacity *= dimCapactiy;
        slabLength *= dimCapactiy;
        newLength *= dimLength;
        // This commits the new length, perhaps too early.
        *pValueLengths++ = dimLength;
        pTypesLengths++;
    }
    
    Boolean bOK = true;

    // 1. If fewer actual elements are needed, clear the old ones.
    if (newLength < originalLength) {
        ElementType()->ClearData(BeginAt(newLength), (originalLength - newLength));
    }
    
    // 2. If underlying capacity changes, change that.
    if (newCapacity != Capacity()) {
        VIREO_ASSERT(newLength <= newCapacity);
        bOK = ResizeCapacity(slabLength, Capacity(), newCapacity, (newLength < newCapacity));
    }
    
    // 3. If more actual elements are needed, initialize the new ones (or all of them if requested)
    // TODO honor bOK status.
    if (!preserveElements) {
        ElementType()->InitData(BeginAt(0), newLength);
    } else if ((newLength > originalLength) && bOK) {
        ElementType()->InitData(BeginAt(originalLength), (newLength - originalLength));
    }

    return bOK;
}
//------------------------------------------------------------
Boolean TypedArrayCore::ResizeCapacity(IntIndex countAQ, IntIndex currentCapactiy, IntIndex newCapacity, Boolean reserveExists)
{
    // Resize the underlying block of bytes as needed.
    
    Boolean bOK = true;
    if (newCapacity < currentCapactiy) {
        // Shrinking
        VIREO_ASSERT(_pRawBufferBegin!= null);
        bOK = AQRealloc(countAQ, countAQ);
    } else if (newCapacity > currentCapactiy) {
        // Growing
        Int32 eltSize = _eltTypeRef->TopAQSize();
        bOK = AQRealloc(countAQ, (eltSize * currentCapactiy));
    }
    _capacity = reserveExists ? -newCapacity :  newCapacity;
    return bOK;
}
//------------------------------------------------------------
// Make this array match the shape of the reference type.
Boolean TypedArrayCore::ResizeToMatchOrEmpty(TypedArrayCoreRef pReference)
{
    if (Rank() == pReference->Rank()) {
        return ResizeDimensions(Rank(), pReference->GetDimensionLengths(), true);
    } else {
        return false;
    }
}
//------------------------------------------------------------
Boolean TypedArrayCore::Resize1DOrEmpty(Int32 length)
{
    if (Resize1D(length)) {
        return true;
    }
    Resize1D(0);
    return false;
}
//------------------------------------------------------------
// Replace elements by copying exisitng one exend if needed.
NIError TypedArrayCore::Replace1D(IntIndex position, IntIndex count, const void* pSource, Boolean truncate)
{
    NIError err = kNIError_Success;
    
    if (position == -1) {
        position = Length();
    }
    if (count <= 0) {
        return kNIError_Success;
    }
    
    IntIndex currentLength = Length();
    IntIndex neededLength = position + count;
    
    if (neededLength > currentLength) {
        // Add elements at the end
        err = Insert1D(currentLength, neededLength - currentLength);
    } else if (truncate && (neededLength < currentLength)) {
        // If truncating to new size, shrink, and free up any structured data
        err = Remove1D(neededLength, currentLength - neededLength);
    }

    if (err == kNIError_Success) {
        ElementType()->CopyData(pSource, BeginAt(position), count);
    }
    return err;
}
//------------------------------------------------------------
// Insert space for additional element(s) and optionally copy values in to the new location
NIError TypedArrayCore::Insert1D(IntIndex position, IntIndex count, const void* pSource)
{
    if (position == -1) {
        position = Length();
    }
    if (count <= 0) {
        return kNIError_Success;
    }
    
    // Add room, initially at the end of the block
    IntIndex currentLength = Length();
    IntIndex neededLength = currentLength + count;
    if (!Resize1D(neededLength))
        return kNIError_kInsufficientResources;
    
    // Move elements after insertion point down
    IntIndex tailElementCount = currentLength - position;
    void* pPosition = BeginAt(position);
    if (tailElementCount) {
        void* pDest = BeginAt(position + count);
        IntIndex countBytes = AQBlockLength(tailElementCount);
        memmove(pDest, pPosition, countBytes);
    }
    if (!ElementType()->IsFlat()) {
        memset(pPosition, 0, AQBlockLength(count));
        ElementType()->InitData(pPosition, count);
    }
    if (pSource != null) {
        // Copy in new elements
        ElementType()->CopyData(pSource, pPosition, count);
    }
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypedArrayCore::Remove1D(IntIndex position, IntIndex count)
{
    // TODO error check
    void* pPosition = BeginAt(position);
    void* pTail = BeginAt(position + count);
    IntIndex currentLength = Length();
    IntIndex countBytes = AQBlockLength(currentLength - (position + count));
    
    // Cleanup old Elements
    if (!ElementType()->IsFlat()) {
        ElementType()->ClearData(pPosition, count);
    }
    
    // Move trailing elements to new location
    memmove(pPosition, pTail, countBytes);
    
    // Make it smaller
    Resize1D(currentLength - count);
    return kNIError_Success;
}
//------------------------------------------------------------
// Simple numeric conversions
//------------------------------------------------------------
inline IntMax RoundToEven(Double value)
{
    // By default lrint uses Bankers (aka round to even)
    // the default for IEEE754 and the one usd by LaBVIEW
    return (IntMax)lrint(value);
}
//------------------------------------------------------------
inline IntMax RoundToEven(Single value)
{
    // See above.
    return (IntMax)lrintf(value);
}
//------------------------------------------------------------
NIError ReadIntFromMemory(EncodingEnum encoding, Int32 aqSize, void* pData, IntMax *pValue)
{
    NIError err = kNIError_Success;
    IntMax value = 0;
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch(aqSize) {
                case 4: value = RoundToEven(*(Single*)pData);  break;
                case 8: value = RoundToEven(*(Double*)pData);  break;
                default: err = kNIError_kCantDecode;            break;
            }
            break;
        case kEncoding_SInt:
        case kEncoding_MetaInt:
            switch(aqSize) {
                case 1: value = *(Int8*)pData;                 break;
                case 2: value = *(Int16*)pData;                break;
                case 4: value = *(Int32*)pData;                break;
                case 8: value = *(Int64*)pData;                break;
                default: err = kNIError_kCantDecode;            break;
            }
            break;
        case kEncoding_UInt:
            // Use unsigned int casts to avoid sign extension
            switch(aqSize) {
                case 1:  value = *(UInt8*)pData;               break;
                case 2:  value = *(UInt16*)pData;              break;
                case 4:  value = *(UInt32*)pData;              break;
                case 8:  value = *(UInt64*)pData;              break;
                default: err = kNIError_kCantDecode;            break;
            }
            break;
        case kEncoding_Boolean:
            switch(aqSize) {
                case 1:  value = (*(UInt8*)pData) ? 1:0;        break;
                default: err = kNIError_kCantDecode;            break;
            }
            break;
        default: err = kNIError_kCantDecode; break;
        }
    *pValue = value;
    return err;
}
//------------------------------------------------------------
NIError WriteIntToMemory(EncodingEnum encoding, Int32 aqSize, void* pData, IntMax value)
{
    NIError err = kNIError_Success;
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 4:  *(Single*)pData = (Single)value;       break;
                case 8:  *(Double*)pData = (Double)value;       break;
                default: err = kNIError_kCantEncode;            break;
            }
            break;
        case kEncoding_SInt:
        case kEncoding_MetaInt:
            switch (aqSize) {
                case 1:  *(Int8*)pData  = (Int8)value;          break;
                case 2:  *(Int16*)pData = (Int16)value;         break;
                case 4:  *(Int32*)pData = (Int32)value;         break;
                case 8:  *(Int64*)pData = (Int64)value;         break;
                default: err = kNIError_kCantEncode;            break;
            }
            break;
        case kEncoding_UInt:
            switch (aqSize) {
                case 1:  *(UInt8*)pData  = (Int8)value;         break;
                case 2:  *(UInt16*)pData = (UInt16)value;       break;
                case 4:  *(UInt32*)pData = (UInt32)value;       break;
                case 8:  *(UInt64*)pData = (UInt64)value;       break;
                default: err = kNIError_kCantEncode;            break;
            }
            break;
        case kEncoding_Boolean:
            switch (aqSize) {
                case 1:  *(UInt8*)pData = value ? 1 : 0;        break;
                default: err = kNIError_kCantEncode;            break;
            }
            break;

        default: err = kNIError_kCantDecode;                    break;
    }
    if (err != kNIError_Success) {
        memset(pData, 0, aqSize);
    }
    return err;
}
//------------------------------------------------------------
NIError ReadDoubleFromMemory(EncodingEnum encoding, Int32 aqSize, void* pData, Double *pValue)
{
    NIError err = kNIError_Success;
    Double value = 0.0;
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 4:  value = *(Single*)pData;           break;
                case 8:  value = *(Double*)pData;           break;
                default: err = kNIError_kCantDecode;        break;
            }
            break;
        case kEncoding_SInt:
        case kEncoding_MetaInt:
            switch (aqSize) {
                case 1:  value = *(Int8*)pData;             break;
                case 2:  value = *(Int16*)pData;            break;
                case 4:  value = *(Int32*)pData;            break;
                case 8:  value = *(Int64*)pData;            break;
                default: err = kNIError_kCantDecode;        break;
            }
            break;
        case kEncoding_UInt:
            switch (aqSize) {
                case 1:  value = *(UInt8*)pData;            break;
                case 2:  value = *(UInt16*)pData;           break;
                case 4:  value = *(UInt32*)pData;           break;
                case 8:  value = *(UInt64*)pData;           break;
                default: err = kNIError_kCantDecode;        break;
            }
            break;
        case kEncoding_Boolean:
            switch(aqSize) {
                case 1:  value = (*(UInt8*)pData) ? 1.0:0.0;break;
                default: err = kNIError_kCantDecode;        break;
            }
        default: err = kNIError_kCantDecode; break;
    }
    *pValue = value;
    return err;
}
//------------------------------------------------------------
NIError WriteDoubleToMemory(EncodingEnum encoding, Int32 aqSize, void* pData, Double value)
{
    NIError err = kNIError_Success;
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 4:  *(Single*)pData = (Single)value;   break;
                case 8:  *(Double*)pData = (Double)value;   break;
                default: err = kNIError_kCantEncode;        break;
            }
            break;
        case kEncoding_SInt:
        case kEncoding_MetaInt:
            switch (aqSize) {
                case 1:  *(Int8*)pData  = (Int8)value;      break;
                case 2:  *(Int16*)pData = (Int16)value;     break;
                case 4:  *(Int32*)pData = (Int32)value;     break;
                case 8:  *(Int64*)pData = (Int64)value;     break;
                default: err = kNIError_kCantEncode;        break;
            }
            break;
        case kEncoding_UInt:
            switch (aqSize) {
                case 1:  *(UInt8*)pData  = (Int8)value;     break;
                case 2:  *(UInt16*)pData = (UInt16)value;   break;
                case 4:  *(UInt32*)pData = (UInt32)value;   break;
                case 8:  *(UInt64*)pData = (UInt64)value;   break;
                default: err = kNIError_kCantEncode;        break;
            }
            break;
        case kEncoding_Boolean:
            switch (aqSize) {
                // Beware that anything that's not exactly 0.0 will be true
                case 1:  *(UInt8*)pData = value!=0.0 ? 1 : 0;break;
                default: err = kNIError_kCantEncode;        break;
            }
        default: err = kNIError_kCantDecode; break;
    }
    if (err != kNIError_Success) {
        memset(pData, 0, aqSize);
    }
    return err;
}
//------------------------------------------------------------
// TypedAndDataManager native functions
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(TypeManagerCurrentTypeManager, TypeManagerRef)
{
    _Param(0) = THREAD_TADM();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeManagerRootTypeManager, TypeManagerRef, TypeManagerRef)
{
    if (_Param(0)) {
        _Param(1) = _Param(0)->RootTypeManager();
    } else {
        _Param(1) = null;
    }
    return _NextInstruction();
}

//------------------------------------------------------------
struct AllocationStatistics {
    Int64   _totalAllocations;
    Int64   _totalAllocated;
    Int64   _maxAllocated;
};
#define AllocationStatistics_TypeString "c(e(.Int64 totalAllocations) e(.Int64 totalAllocated) e(.Int64 maxAllocated) )"

VIREO_FUNCTION_SIGNATURE2(TypeManagerAllocationStatistics, TypeManagerRef, AllocationStatistics)
{
    TypeManagerRef     pTM = _Param(0);
    AllocationStatistics* pStats = _ParamPointer(1);
    pStats->_totalAllocations = pTM->TotalAllocations();
    pStats->_totalAllocated = pTM->TotalAQAllocated();
    pStats->_maxAllocated = pTM->MaxAllocated();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeManagerGetTypes, TypeManagerRef, TypedArray1D<TypeRef>*)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    if (tm) {
        tm->GetTypes(_Param(1));
    } else {
        _Param(1)->Resize1D(0);
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(TypeManagerDefineType, TypeManagerRef, StringRef, TypeRef)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    SubString typeName = _Param(1)->MakeSubStringAlias();
    if (tm) {
        tm->Define(&typeName, _Param(2));
    }
    return _NextInstruction();
}
#if defined(VIREO_TYPE_Double)
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(TypeManagerReadValueDouble, TypeManagerRef, StringRef, StringRef, Double)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    SubString objectName = _Param(1)->MakeSubStringAlias();
    SubString path = _Param(2)->MakeSubStringAlias();
    tm->ReadValue(&objectName, &path, _ParamPointer(3));
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(TypeManagerWriteValueDouble, TypeManagerRef, StringRef, StringRef, Double)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    SubString objectName = _Param(1)->MakeSubStringAlias();
    SubString path = _Param(2)->MakeSubStringAlias();
    tm->WriteValue(&objectName, &path, _Param(3));
    return _NextInstruction();
}
#endif
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(TypeOf, TypeRef, void, TypeRef)
{
    // TODO Using the static StaticTypeAndData may cause the the
    // parameter to allocate a default value if one does not already exist
    // in corner cases such as very large array types.
    // This function does not need the value
    // so perhaps a StaticType argument type is in order.
    
    // Return the static type.
    TypeRef staticType = (TypeRef)_ParamPointer(0);
    _Param(2) = staticType;
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeTopAQSize, TypeRef, Int32)
{
    _Param(1) = _Param(0)->TopAQSize();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeIsFlat, TypeRef, Boolean)
{
    _Param(1) = _Param(0)->IsFlat();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeIsArray, TypeRef, Boolean)
{
    _Param(1) = _Param(0)->IsArray();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeAlignment, TypeRef, Int32)
{
    _Param(1) = _Param(0)->AQAlignment();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeEncoding, TypeRef, Int32)
{
    _Param(1) = _Param(0)->BitEncoding();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeBaseType, TypeRef, TypeRef)
{
    _Param(1) = _Param(0)->BaseType();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeHasCustomDefault, TypeRef, Boolean)
{
    _Param(1) = _Param(0)->HasCustomDefault();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeHasPadding, TypeRef, Boolean)
{
    _Param(1) = _Param(0)->HasPadding();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeHasGenericType, TypeRef, Boolean)
{
    _Param(1) = _Param(0)->HasCustomDefault();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeUsageType, TypeRef, Int32)
{
    _Param(1) = _Param(0)->ElementUsageType();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeGetElementName, TypeRef, StringRef)
{
    TypeRef t = _Param(0);
    SubString elementName = t->GetElementName();
    _Param(1)->CopyFromSubString(&elementName);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeGetName, TypeRef, StringRef)
{
    TypeRef t = _Param(0);
    SubString name = t->GetName();
    _Param(1)->CopyFromSubString(&name);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeSubElementCount, TypeRef, Int32)
{
    _Param(1) = _Param(0)->SubElementCount();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(TypeGetSubElement, TypeRef, Int32,  TypeRef)
{
    _Param(2) = _Param(0)->GetSubElement(_Param(1));
    return _NextInstruction();
}

#if defined(VIREO_TYPE_CONSTRUCTION)
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(TypeMakeVectorType, TypeManagerRef, TypeRef, TypeRef, Int32)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    
    _Param(1) = ArrayType::New(tm, _Param(2), 1, _ParamPointer(3));
    return _NextInstruction();
}
//------------------------------------------------------------
struct TypeMakeClusterType : public VarArgInstruction
{
    _ParamDef(TypeManagerRef, tm);
    _ParamDef(TypeRef, computedType);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(TypeMakeClusterType, TypeMakeClusterType)
{
//  TypeManagerRef tm = _ParamPointer(tm) ? _Param(tm) : THREAD_TADM();
//   _Param(3) = ArrayType::New(tm, _Param(1), 1, _ParamPointer(2));
    return _NextInstruction();
}
#endif

#if defined(VIREO_TYPE_VARIANT)
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(TypeManagerObtainValueType, TypeManagerRef, StringRef, TypeRef, Boolean, TypeRef)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    SubString valueName = _Param(1)->MakeSubStringAlias();
    TypeRef type = _Param(2);
    Boolean bCreateIfNotFound = _ParamPointer(3) ? _Param(3) : false;
    
    TypeRef valueType = null;
    if (valueName.Length()) {
        // If there is a name try to find one.
        valueType = tm->FindType(&valueName);
        if (!valueType && bCreateIfNotFound) {
            // Not found?, make it and give it a name.
            valueType = DefaultValueType::New(tm, type, true);
            valueType = tm->Define(&valueName, valueType);
        }
    } else {
        // Empty name? make an anonymous one.
        valueType = DefaultValueType::New(tm, type, true);
    }
    
    _Param(4) = valueType;
    return _NextInstruction();
}
//------------------------------------------------------------
//! Set the value of a dynamically allocated variable
VIREO_FUNCTION_SIGNATURE3(TypeSetValue, TypeRef, StaticType, void)
{
    TypeRef type = _Param(0);
    TypeRef secondType = _ParamPointer(1);
    
    if (type->IsA(secondType)) {
        type->CopyData(_ParamPointer(2), type->Begin(kPAWrite));
    }
    return _NextInstruction();
}
//------------------------------------------------------------
//! Get the value of a dynamically allocated variable
VIREO_FUNCTION_SIGNATURE3(TypeGetValue, TypeRef, StaticType, void)
{
    TypeRef type = _Param(0);
    TypeRef secondType = _ParamPointer(1);
    
    if (type->IsA(secondType)) {
        type->CopyData(type->Begin(kPARead), _ParamPointer(2));
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(TypeWriteValue, TypeRef, Int32,  TypeRef)
{
    _Param(2) = _Param(0)->GetSubElement(_Param(1));
    return _NextInstruction();
}
#endif

#if defined(VIREO_INSTRUCTION_REFLECTION)
//------------------------------------------------------------
//! Map a native primtitive function pointer to its TypeRef and its native name.
TypeRef TypeManager::FindCustomPointerTypeFromValue(void* pointer, SubString *cName)
{
    std::map<void*, CPrimtitiveInfo>::iterator iter = _cPrimitiveDictionary.find(pointer);
    
    if (iter != _cPrimitiveDictionary.end()) {
        CPrimtitiveInfo cpi = iter->second;
        cName->AliasAssignCStr(cpi._cName);
        return cpi._type;
    } else if (RootTypeManager()) {
        return RootTypeManager()->FindCustomPointerTypeFromValue(pointer, cName);
    } else {
        return BadType();
    }
}
//------------------------------------------------------------
//! Map a native primtitive function pointer to its TypeRef and its native name.
VIREO_FUNCTION_SIGNATURE3(InstructionType, const InstructionRef, TypeRef, StringRef)
{
    InstructionCore* pInstruction = _Param(0);
    SubString cName;
    _Param(1) = THREAD_TADM()->FindCustomPointerTypeFromValue((void*)pInstruction->_function, &cName);
    _Param(2)->CopyFromSubString(&cName);
    return _NextInstruction();
}
//------------------------------------------------------------
//! Determine the type that described the actual argument passed and its allocation origin
VIREO_FUNCTION_SIGNATURE3(InstructionArg, const InstructionRef, const Int32, DataPointer)
{
    _Param(2) = ((GenericInstruction*)_Param(0))->_args[_Param(1)];
    // TODO
    // Look up the type of this specific parameter
    // for simple args this works since it is just indexing into the ParamBlock list
    // for VarArgs there is a bit more work.
    return _NextInstruction();
}
//------------------------------------------------------------
//! Determine the type that described the actual argument passed and its allocation origin
VIREO_FUNCTION_SIGNATURE4(TypeManagerPointerToSymbolPath, const TypeManagerRef, const TypeRef, const DataPointer, StringRef)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    tm->PointerToSymbolPath(_Param(1), _Param(2), _Param(3));
    return _NextInstruction();
}
//------------------------------------------------------------
//! Determine the next instruction in the instruction list.
VIREO_FUNCTION_SIGNATURE2(InstructionNext, const InstructionRef, InstructionRef)
{
    InstructionCore* pInstruction = _Param(0);
    SubString cName;
    
    if (ExecutionContext::IsDone(pInstruction)) {
        _Param(1) = null;
    } else {
        TypeRef t = THREAD_TADM()->FindCustomPointerTypeFromValue((void*)pInstruction->_function, &cName);
        t = t->GetSubElement(0);
        Int32 size = t->TopAQSize();
        _Param(1) = (InstructionCore*) ((UInt8*)pInstruction + size);
    }
    return _NextInstruction();
}
#endif
}

//------------------------------------------------------------
#include "TypeDefiner.h"
using namespace Vireo;
DEFINE_VIREO_BEGIN(LabVIEW_Types)
    DEFINE_VIREO_TYPE(AllocationStatistics, AllocationStatistics_TypeString);
    DEFINE_VIREO_FUNCTION(TypeManagerAllocationStatistics, "p(i(.TypeManager) o(.AllocationStatistics))");
    DEFINE_VIREO_FUNCTION(TypeManagerCurrentTypeManager, "p(o(.TypeManager))");
    DEFINE_VIREO_FUNCTION(TypeManagerRootTypeManager, "p(i(.TypeManager) o(.TypeManager))");
    DEFINE_VIREO_FUNCTION(TypeManagerGetTypes, "p(i(.TypeManager) o(a(.Type *)))");
    DEFINE_VIREO_FUNCTION(TypeManagerDefineType, "p(i(.TypeManager) i(.String) i(.Type))");

#if defined(VIREO_TYPE_Double)
    DEFINE_VIREO_FUNCTION_CUSTOM(TypeManagerReadValue, TypeManagerReadValueDouble, "p(i(.TypeManager) i(.String) i(.String) o(.Double))");
    DEFINE_VIREO_FUNCTION_CUSTOM(TypeManagerWriteValue, TypeManagerWriteValueDouble, "p(i(.TypeManager) i(.String) i(.String) i(.Double))");
#endif
 //   DEFINE_VIREO_FUNCTION(TypeManagerWriteString, "p(i(.TypeManager) i(.String) i(.String))");
 //   DEFINE_VIREO_FUNCTION(TypeManagerReadString, "p(i(.TypeManager) i(.String) o(.String))");

#if defined(VIREO_INSTRUCTION_REFLECTION)
    DEFINE_VIREO_FUNCTION(TypeManagerPointerToSymbolPath, "p(i(.TypeManager)i(.Type)i(.DataPointer)o(.String)o(.Int32))");
    DEFINE_VIREO_FUNCTION(InstructionType, "p(i(.Instruction)o(.Type )o(.String))");
    DEFINE_VIREO_FUNCTION(InstructionArg, "p(i(.Instruction)i(.Int32)o(.DataPointer))");
    DEFINE_VIREO_FUNCTION(InstructionNext, "p(i(.Instruction)o(.Instruction))");
#endif

#if defined(VIREO_TYPE_VARIANT)
    DEFINE_VIREO_FUNCTION(TypeManagerObtainValueType, "p(i(.TypeManager) i(.String) i(.Type) i(.Boolean) o(.Type))");
    DEFINE_VIREO_FUNCTION(TypeSetValue, "p(io(.Type) i(.StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(TypeGetValue, "p(i(.Type) o(.StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(TypeWriteValue, "p(i(.Type) i(.String) o(.Type))");
#endif

    DEFINE_VIREO_FUNCTION(TypeOf, "p(i(.StaticTypeAndData) o(.Type))");
    DEFINE_VIREO_FUNCTION(TypeTopAQSize, "p(i(.Type) o(.Int32))");
    DEFINE_VIREO_FUNCTION(TypeAlignment, "p(i(.Type) o(.Int32))");
    DEFINE_VIREO_FUNCTION(TypeEncoding, "p(i(.Type) o(.Int32))");
    DEFINE_VIREO_FUNCTION(TypeIsFlat, "p(i(.Type) o(.Boolean))");
    DEFINE_VIREO_FUNCTION(TypeIsArray, "p(i(.Type) o(.Boolean))");
    DEFINE_VIREO_FUNCTION(TypeHasCustomDefault, "p(i(.Type) o(.Boolean))");
    DEFINE_VIREO_FUNCTION(TypeHasPadding, "p(i(.Type) o(.Boolean))");
    DEFINE_VIREO_FUNCTION(TypeHasGenericType, "p(i(.Type) o(.Boolean))");
    DEFINE_VIREO_FUNCTION(TypeGetName, "p(i(.Type) o(.String))");
    DEFINE_VIREO_FUNCTION(TypeGetElementName, "p(i(.Type) o(.String))");
    DEFINE_VIREO_FUNCTION(TypeBaseType, "p(i(.Type) o(.Type))");
    DEFINE_VIREO_FUNCTION(TypeUsageType, "p(i(.Type) o(.Int32))");
    DEFINE_VIREO_FUNCTION(TypeSubElementCount, "p(i(.Type) o(.Int32))");
    DEFINE_VIREO_FUNCTION(TypeGetSubElement, "p(i(.Type) i(.Int32) o(.Type))");

#if defined(VIREO_TYPE_CONSTRUCTION)
    DEFINE_VIREO_FUNCTION(TypeMakeVectorType, "p(i(.TypeManager) o(.Type) i(.Type) i(.Int32))");
  //  DEFINE_VIREO_FUNCTION(TypeMakeClusterType, "p(i(.VarArgCount) i(.TypeManager) o(.Type) i(.Type))");
#endif

DEFINE_VIREO_END()



