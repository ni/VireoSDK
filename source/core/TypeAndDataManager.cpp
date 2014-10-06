/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include <stdlib.h>
#include "ExecutionContext.h"
#include "TypeAndDataManager.h"

namespace Vireo
{

#ifdef VIREO_TRACK_MEMORY_QUANTITY
// Optional header added to blocks allocated from the system
struct MallocInfo {
    size_t          _length;        // how big the block is
    TypeManagerRef  _manager;       // which TypeManaer was sued to allocate it.
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
void TypeManager::PrintMemoryStat(const char* message, Boolean bLast)
{
    if (bLast && (_totalAllocations == 1) && (_totalAQAllocated == sizeof(TypeManager))) {
        // If bLast is true then silence is success.
    } else {
        printf("Allocations %4d, AQCount %5zd, ShareTypes %d (%s)\n", (int)_totalAllocations, _totalAQAllocated, _typesShared, message);
    }
}
//------------------------------------------------------------
TypeManager::TypeManager(TypeManagerRef rootTypeManager)
{
#ifdef VIREO_PERF_COUNTERS
    _lookUpsFound = 0;
    _lookUpsRoutedToOwner = 0;
    _lookUpsNotResolved = 0;
    _typesShared = 0;
#endif
    _totalAllocations = 0;
    _totalAQAllocated = 0;
    _totalAllocationFailures = 0;
    _maxAllocated = 0;
    _allocationLimit = 16777216;  //16 meg for starters
    
    _typeList = null;
    _rootTypeManager = rootTypeManager;
    _aqBitCount = AQBitCount();
    
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
        TypeRef  nextType = type->_next;
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
NIError TypeManager::DefineCustomPointerTypeWithValue(const char* name, void* pointer, TypeRef typeRef, PointerTypeEnum pointerType)
{
    CustomPointerType *valueTypeNode = CustomPointerType::New(this, typeRef, pointer, pointerType);
    
    if (valueTypeNode) {
        SubString typeName(name);
        Define(&typeName, valueTypeNode);
        return kNIError_Success;
    } else {
        return kNIError_kInsufficientResources;
    }
}
//------------------------------------------------------------
NIError TypeManager::DefineCustomDataProcs(const char* name, IDataProcs* pDataProcs, TypeRef typeRef)
{
    CustomDataProcType *allocTypeNode = CustomDataProcType::New(this, typeRef, pDataProcs);
    
    if (allocTypeNode) {
        SubString typeName(name);
        Define(&typeName, allocTypeNode);
        return kNIError_Success;
    } else {
        return kNIError_kInsufficientResources;
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
TypeRef TypeManager::GetTypeList()
{
    return _typeList;
}
//------------------------------------------------------------
TypeRef TypeManager::Define(SubString* typeName, TypeRef type)
{
    MUTEX_SCOPE()

    // Though overloads are allowed, it is still necessary to Make a names Wrapper for each unique type.
    // This allows teh resolved type to be passed with its name wrapper, enable funtions to see the external name
    // of the symbol. This does mean that the string will be replicated in each NameTypeObject.
    // Though the map object will still just hold substrings.

    // See if one exist in the current TM or a root TM.
    NamedTypeRef existingType = FindType(typeName);
    
#ifndef VIREO_ALLOW_SYMBOL_OVERLOADS
    if (existingType != null)
        return null;
#endif

    Boolean bNewAtThisLevel = existingType ? (existingType->TheTypeManager() != this) : true;
    
    NamedTypeRef namedType = NamedType::New(this, typeName, type, existingType);

    if (bNewAtThisLevel) {
       // printf("New symbol at this level %.*s\n", FMT_LEN_BEGIN(typeName));
        // Storage for the string used by the dictionary is part of
        // NamedType so once it is created a GetName() is done to
        // get pointers to the storage. The local is temporary, but the
        // pointer in it last longer than the map entry tha poionts to it.
        SubString permanentTypeName;
        namedType->GetName(&permanentTypeName);
        _typeNameDictionary.insert(std::make_pair(permanentTypeName, namedType));
    } else {
       // printf("Overloaded symbol at this level %.*s\n", FMT_LEN_BEGIN(typeName));
        // If this TM already has an entry then this one will be inserted into the
        // list owned by the existing one. That list will can include links to overloads in
        // TM's root chain.
     }

    return namedType;
}
//------------------------------------------------------------
NamedTypeRef TypeManager::FindType(const SubString* name)
{
    MUTEX_SCOPE()

    NamedTypeRef *typeValue = FindTypeConstRef(name);
    return typeValue ? *typeValue : null;
}
//------------------------------------------------------------
// Look up the pointer to a default value of a type.
void* TypeManager::FindNamedTypedBlock(SubString* name, PointerAccessEnum mode)
{    
    TypeRef t = FindType(name);
    return t ? t->Begin(mode) : null;
}
//------------------------------------------------------------
// Look up the pointer to a a default objects avalue. This Method
// digs through the ZDA wrapper and returns a pointer to the element.
void* TypeManager::FindNamedObject(SubString* name)
{
    TypedArrayCoreRef* pObj = (TypedArrayCoreRef*) FindNamedTypedBlock(name, kPARead);
    if (pObj)
        return (*pObj)->RawObj();
    else
        return null;
}
//------------------------------------------------------------
NamedTypeRef* TypeManager::FindTypeConstRef(const SubString* name)
{
    MUTEX_SCOPE()

    // When instructions use a type constant, they need to point the intrution to a variable
    // that has the TypeRef and the value. The dictionary serves as that variable so the address
    // to the entry is returned. The Symbol cannot deleted until instructions (VIs) are cleared.
    // Since a referenced type mus t exist before the instruction can reference it this works
    // works out fine.

    TypeDictionaryIterator iter;
    iter = _typeNameDictionary.find(*name);
    NamedTypeRef* pFoundTypeRef = (iter != _typeNameDictionary.end()) ? &iter->second : null;
    
    if (pFoundTypeRef == null && _rootTypeManager) {
        _lookUpsRoutedToOwner++;
        pFoundTypeRef = _rootTypeManager->FindTypeConstRef(name);
    } else {
        _lookUpsFound++;
    }
    if (!pFoundTypeRef) {
        //printf(" ** Symbol '%.*s' not found\n", FMT_LEN_BEGIN(name));
        _lookUpsNotResolved++;
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
            _typesShared++;
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
Int32 TypeManager::BitCountToAQSize(Int32 bitCount)
{
    return (bitCount + (_aqBitCount-1)) / _aqBitCount;
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
        Int32 step = TopAQSize();
        AQBlock1 *pTargetElt = (AQBlock1*)pTarget;
        AQBlock1 *pTargetEnd = (AQBlock1*)pTarget + (step * count);
        while (pTargetElt < pTargetEnd) {
            err = InitData(pTargetElt);
            if (err != kNIError_Success) {
                break;
            }
            pTargetElt += step;
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
        size_t step = TopAQSize();
        AQBlock1 *pTargetElt = (AQBlock1*)pTarget;
        AQBlock1 *pTargetEnd = (AQBlock1*)pTarget + (step * count);
        while (pTargetElt < pTargetEnd) {
            // use virtual method
            ClearData(pTargetElt);
            pTargetElt += step;
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
        Int32 step = TopAQSize();
        AQBlock1 *pSourceElt = (AQBlock1*)pSource;
        AQBlock1 *pSourceEnd = (AQBlock1*)pSource + (step * count);
        AQBlock1 *pDestElt = (AQBlock1*)pDest;
        while (pSourceElt < pSourceEnd) {
            err = CopyData(pSourceElt, pDestElt);
            if (err != kNIError_Success)
                break;
            pSourceElt += step;
            pDestElt += step;
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
        Int32 step = TopAQSize();
        AQBlock1 *pSourceElt = (AQBlock1*)pSource;
        AQBlock1 *pDestElt = (AQBlock1*)pDest;
        AQBlock1 *pDestEnd = (AQBlock1*)pDest + (step * count);
        while (pDestElt < pDestEnd) {
            // TODO process errors
            CopyData(pSourceElt, pDestElt);
            pDestElt += step;
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
            }  return true;
        }
    } else {
        SubString thisTypeName;
        this->GetName(&thisTypeName);
        SubString otherTypeName;
        otherType->GetName(&otherTypeName);
        if (this->IsA(&otherTypeName) || otherType->IsA(&thisTypeName))
            return true;
    } 
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsA(TypeRef otherType, Boolean compatibleStructure)
{
    Boolean bMatch = false;

    SubString otherTypeName;
    otherType->GetName(&otherTypeName);

    if (IsA(&otherTypeName)) {
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
        }
    }
    return bMatch;
}
//------------------------------------------------------------
// Dig throught nested type names to see if one of the names
// matches the one provided.
Boolean TypeCommon::IsA(const SubString* otherTypeName)
{
    TypeRef t = this;
    while (t) {
        SubString name;
        t->GetName(&name);
        if (name.Compare(otherTypeName))
            return true;
        t = t->BaseType();
    }
    
    if (otherTypeName->CompareCStr("*")) {
        return true;
    }
    return false;
}
//------------------------------------------------------------
//! Walk down a dotted cluster field path
TypeRef TypeCommon::GetSubElementOffsetFromPath(SubString* name, Int32* offset)
{
    SubString pathElement;
    TypeRef currentRef = this;
    SubString path(name); // local copy we can edit
    *offset = 0;
    while(path.Length() > 0 )
    {
        path.SplitString(&pathElement, &path, '.');	
        currentRef = currentRef->GetSubElementByName(&pathElement);
        if (null == currentRef)
            break;   
        *offset += currentRef->ElementOffset();
        path.ReadChar('.');
    }
    return currentRef;
}
//------------------------------------------------------------
//! Walk down a dotted path inlcuding hops through arrays
TypeRef TypeCommon::GetSubElementInstancePointerFromPath(SubString* name, void *start, void **end, Boolean allowDynamic)
{
    TypeRef subType;
    if (!IsArray()) {
        Int32 offset = 0;
        subType = GetSubElementOffsetFromPath(name, &offset);
        if (subType && subType->IsValid()) {
            *end = (AQBlock1*)start + offset;
        } else {
            subType = null;
            *end = null;
        }
    } else if (Rank() == 0) {
        TypedArrayCoreRef array = *(TypedArrayCoreRef*)start;
        subType = array->ElementType();
        void* newStart = array->RawObj();
        subType = subType->GetSubElementInstancePointerFromPath(name, newStart, end, allowDynamic);
    } else {
        // TODO parse indexes.
        // Variable sized arrays can only be indexed if allowDynamic is true.
        subType = null;
        *end = null;
    }
    return subType;
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
NamedType* NamedType::New(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType, NamedTypeRef nextOverload)
{
    return TADM_NEW_PLACEMENT_DYNAMIC(NamedType, name)(typeManager, name, wrappedType, nextOverload);
}
//------------------------------------------------------------
NamedType::NamedType(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType, NamedTypeRef nextOverload)
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
TypeRef AggregateType::GetSubElementByName(SubString* name)
{
    // Find first part of string (look for '.')
    // find element in collection
    // if more in string repeat find on part found
    
    if (name->Length() == 0)
        return null;
    
    for (ElementType** pType = _elements.Begin(); pType != _elements.End(); pType++)
    {
        if ( name->Compare((*pType)->_elementName.Begin(), (*pType)->_elementName.Length()) )
        {
            return (*pType);
        }
    }
    return null;
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
BitBlockType* BitBlockType::New(TypeManagerRef typeManager, Int32 size, EncodingEnum encoding)
{
    return TADM_NEW_PLACEMENT(BitBlockType)(typeManager, size, encoding);
}
//------------------------------------------------------------
BitBlockType::BitBlockType(TypeManagerRef typeManager, Int32 size, EncodingEnum encoding)
: TypeCommon(typeManager)
{
    if (size == kVariableSizeSentinel) {
        size = 0;       // Variable means generic-size, 0 by definition
    } else if (size < 0) {
        size = -size;   // Bounded get treated as fixed
    }
    _bitSize = size;
    _isFlat = true;
    _aqAlignment = 0;         // BitBlocks are not addressable, no alignment
    _isValid = true;
    _isBitLevel = true;
    _hasGenericType = false;
    _encoding = encoding;

    if (encoding == kEncoding_Generic) {
        _hasGenericType = true;
    } else if (encoding == kEncoding_None && size > 0) {
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
    Int32 bitCount = 0;
    Boolean isFlat = true;
    Boolean isValid = true;
    Boolean hasCustomValue = false;
    Boolean hasGenericType = false;
    EncodingEnum encoding = kEncoding_None;
    
    for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++) {
        ElementType* element = *pType;
        
        element->_offset = bitCount;
        bitCount += element->BitSize();
        isFlat  &= element->IsFlat();
        isValid  |= element->IsValid();
        hasCustomValue |= element->HasCustomDefault();
        hasGenericType |= element->HasGenericType();;
        
        encoding = element->BitEncoding();
    }
    
    _topAQSize = 0;
    _aqAlignment = 0;
    _rank = 0;
    _bitSize = bitCount;
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
Int32 ClusterAlignmentCalculator::AlignNextElement(TypeRef element)
{
    ElementCount++;
    IsValid &= element->IsValid();
    Int32 elementAlignment = 0;
    Int32 elementOffset = 0;

    Int32 subAQCount = element->TopAQSize();
    IncludesPadding |= element->HasPadding();
    IsFlat &= element->IsFlat();

    if (subAQCount == 0) {
        // For subtypes that have not been promoted to being addressable
        // determine the size of the addressable block that can contain it
        // since Clusters are alwasy addressable.
        subAQCount = _tm->BitCountToAQSize(element->BitSize());
        
        // Alignment for BitBlocks/BitClusters assumes block will
        // be read/written as one atomic operation
        elementAlignment = _tm->AQAlignment(subAQCount);
    } else {
        elementAlignment = element->AQAlignment();
    }
    AggregateAlignment = Max(AggregateAlignment, elementAlignment);

    // See if any padding is needed before this element. Round up as needed.
    elementOffset = _tm->AlignAQOffset(_aqOffset, elementAlignment);
    IncludesPadding |= (elementOffset != _aqOffset);
    _aqOffset = elementOffset;
    
    // Now move to offset for next element
    _aqOffset += subAQCount;
    return elementOffset;
}
//------------------------------------------------------------
void ClusterAlignmentCalculator::Finish()
{
    // Round up the size of the cluster to a multiple the largest alignmnent requirement
    // For example, (.Double .Int8) is size 16, not 9. Note the padding if added.
    AggregateSize = _aqOffset;
    AggregateSize = _tm->AlignAQOffset(_aqOffset, AggregateAlignment);
    IncludesPadding |= AggregateSize != _aqOffset;
}
//------------------------------------------------------------
// ParamBlockAlignmentCalculator
//------------------------------------------------------------
Int32 ParamBlockAlignmentCalculator::AlignNextElement(TypeRef element)
{
    IsValid &= element->IsValid();
    Int32 elementOffset = sizeof(InstructionCore) + (ElementCount * sizeof(void*));
    ElementCount++;
    return elementOffset;
}
//------------------------------------------------------------
void ParamBlockAlignmentCalculator::Finish()
{
    // Round up the size of the cluster to a multiple the largest alignmnent requirement
    // For example, (.Double .Int8) is size 16, not 9. Note the padding if added.
    AggregateSize = sizeof(InstructionCore) + (ElementCount * sizeof(void*));
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
    ElementCount++;
    
    // All elements are overlayed, so they staret where element does, which is at 0
    return 0;
}
//------------------------------------------------------------
void EquivalenceAlignmentCalculator::Finish()
{
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
        // If its for clearing the block will released once the destructor is called
        return _pDefault;
    } else if (mode == kPAWrite || mode == kPAReadWrite) {
        VIREO_ASSERT(false);
    }
    return null;
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
    _topAQSize = TheTypeManager()->PointerToAQSize();
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
    TypedBlock* pSource = *((TypedBlock**)pData);
    TypedBlock* pDest = *((TypedBlock**)pDataCopy);
    
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
    TypedBlock* array = *(TypedBlock**) pData;
    if (array != null) {
        *((TypedBlock**)pData) = null;
        TypedArrayCore::Delete(array);
    }
    return kNIError_Success;
}
//------------------------------------------------------------
void* ArrayType::Begin(PointerAccessEnum mode)
{
    // Default-Defaults are generated as needed on demand and should
    // only be accessed in read mode
    if (mode == kPARead) {
        if (_pDefault == null) {
            TypeManagerScope scope(TheTypeManager());
            // On demand allocations for defdef data
            // belong to the TM the type is owned by
            _ownsDefDefData = true;
            this->InitData(&_pDefault);
        }
        return &_pDefault;
    } else if (mode == kPAClear) {
        // Unlike the cluster which may have any extra block, arrays
        // just have one pointer and its part of the object.
        // The clear operation will free the entire array, so the
        // ArrayType class doe not need a destructor
        return &_pDefault;
    } else {
        return null;
    }
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
    Int32 aqCount = 0;
    Boolean isFlat = true;
    Boolean isValid = true;
    Boolean hasGenericType = false;
    //  Boolean hasVarArg = false; TODO look for upto one and only one var arg type
    
    // The param block describes the structure allocated for a single instuction object
    // For a native function. The size will be base plus the storage needed for pointers
    // to each element.

    aqCount = sizeof(InstructionCore);

    for (ElementType **pType = _elements.Begin(); pType!=_elements.End(); pType++) {
        ElementType* element = *pType;
        Int32 subAQCount = 0;
        
        VIREO_ASSERT(element->_offset == aqCount)
        UsageTypeEnum ute = element->ElementUsageType();
        
        if (ute >=  kUsageTypeInput && ute <=  kUsageTypeTemp) {
            subAQCount = sizeof(void*);
        } else if (ute == kUsageTypeImmediate) {
            if (element->TopAQSize() <= (Int32)sizeof(void*)) {
                subAQCount = sizeof(void*);
            } else {
                printf("(Error Immediate Mode Type is too large for param block)\n"); // TODO:Report error
            }
        } else if (ute == kUsageTypeSimple) {
            printf("(Error simple element type not allowed in ParamBlock)\n"); // TODO:Report error
        } else {
            printf("(Error invalid usage type <%d> in ParamBlock)\n", (int)ute); // TODO:Report error
        }
        
        if (ute == kUsageTypeStatic || ute == kUsageTypeTemp) {
            // static and temp values are owned by the instruction, not the VIs data space
            // and will need extra work to be inited and cleared if they are not flat
            isFlat &= element->IsFlat();
        }
        
        // Now add room for this element.
        aqCount += subAQCount;
        
        isValid |= element->IsValid();
        hasGenericType |= element->HasGenericType();
    }

    // Since it is a funnction, the size is the size of a pointer-to-a-function with that parameter list
    _encoding = kEncoding_ParameterBlock;
    _topAQSize =  aqCount;
    _isFlat = isFlat;
    _hasGenericType = hasGenericType;
    _aqAlignment = sizeof(void*);
    _isValid = isValid;
}
//------------------------------------------------------------
// DefaultValueType
//------------------------------------------------------------
DefaultValueType* DefaultValueType::New(TypeManagerRef typeManager, TypeRef valuesType, Boolean mutableValue)
{
    DefaultValueType* type = TADM_NEW_PLACEMENT_DYNAMIC(DefaultValueType, valuesType)(typeManager, valuesType, mutableValue);

#if 0
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
    
    if (!mutableValue && type->IsFlat()) {
        // The binary name is not set yet.
        AQBlock1* binaryNameLength = (AQBlock1*)(type+1) + type->TopAQSize();
        SubString binaryName((AQBlock1*)&type->_topAQSize, binaryNameLength);
        type = (DefaultValueType*) typeManager->ResolveToUniqueInstance(type,  &binaryName);
    }
#endif

    return type;
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
        VIREO_ASSERT(false)
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
// CustomPointerType
//------------------------------------------------------------
CustomPointerType* CustomPointerType::New(TypeManagerRef typeManager, TypeRef type, void* pointer, PointerTypeEnum pointerType)
{
    return TADM_NEW_PLACEMENT(CustomPointerType)(typeManager, type, pointer, pointerType);
}
//------------------------------------------------------------
CustomPointerType::CustomPointerType(TypeManagerRef typeManager, TypeRef type, void* pointer, PointerTypeEnum pointerType)
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
    this->_typeRef = type;
    this->_eltTypeRef = type->GetSubElement(0);
    
    VIREO_ASSERT(_pRawBufferBegin == null);
    VIREO_ASSERT(_pRawBufferEnd == null);
    ResizeDimensions(type->Rank(), type->GetDimensionLengths(), false, true);
}
//------------------------------------------------------------
void TypedArrayCore::Delete(TypedArrayCoreRef pArray)
{
    //
    VIREO_ASSERT(pArray->_eltTypeRef != null);
    IntIndex i = pArray->Length();
 //   PrintType(pArray->_eltTypeRef, "an array is clearing out it contents");
    pArray->_eltTypeRef->ClearData(pArray->RawBegin(), i);
    pArray->AQFree();
    TypeManagerScope::Current()->Free(pArray);
}
//------------------------------------------------------------
Boolean TypedArrayCore::AQAlloc(IntIndex countBytes)
{
    VIREO_ASSERT(countBytes >= 0)
    VIREO_ASSERT(_pRawBufferBegin == null);
    VIREO_ASSERT(_pRawBufferEnd == null);
    if (countBytes) {
        _pRawBufferBegin = (AQBlock1*) TypeManagerScope::Current()->Malloc(countBytes);
        if (_pRawBufferBegin) {
            _pRawBufferEnd = _pRawBufferBegin + countBytes;
        } else {
            _pRawBufferEnd = _pRawBufferBegin;
            return false;
        }
    } else {
        _pRawBufferBegin = _pRawBufferEnd = null;
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
            AQBlock1 *newBegin = (AQBlock1*) TypeManagerScope::Current()->Realloc(_pRawBufferBegin, countBytes, preserveBytes);
            if (newBegin) {
                _pRawBufferBegin = newBegin;
                _pRawBufferEnd = _pRawBufferBegin + countBytes;
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
        VIREO_ASSERT(_pRawBufferEnd != null);
        TypeManagerScope::Current()->Free(_pRawBufferBegin);
        _pRawBufferBegin = null;
        _pRawBufferEnd = null;
    } else {
        VIREO_ASSERT(_pRawBufferEnd == null);
    }
}
//------------------------------------------------------------
// If the array is a of a generic type then it element type
// can be set dynamicaly so long as the specified type maintains
// a an IsA() relationship
Boolean TypedArrayCore::SetElementType(TypeRef type, Boolean preserveValues)
{
    if (_typeRef->Rank() == 0) {
        // Out with the old
        _eltTypeRef->ClearData(RawBegin());
        // In with the new
        _eltTypeRef = type;
        AQRealloc(_eltTypeRef->TopAQSize(), 0);
        _eltTypeRef->InitData(RawBegin());
    } else {
        // TODO: Resetting non ZDA array element type not currently supported
        VIREO_ASSERT(false);
    }
    return true;
}
//------------------------------------------------------------
#if 0
// indexing give a vectors seems natural, but with the threaded snippet
// execution an array of pointers to dimensions is more common.
AQBlock1* TypedArrayCore::BeginAtND(Int32 rank, IntIndex* pDimIndexes)
{
    // Ignore extra outer dimension if supplied.
    if (rank > Type()->Rank()) {
        // Check extra dims to see if they are 0, if not then it's out of bounds.
        return null;
    }
    
    AQBlock1 *pElt = RawBegin();
    IntIndex* pDimLenght = GetDimensionLengths();
    IntIndex* pSlab = GetSlabLengths();
    IntIndex* pEndSlab = pSlab + rank;
    
    // Find index by calculating dot product of
    // SlabLength vector and dimension index vector.
    // Note that slabs do not need to be packed.
    for (;pSlab < pEndSlab; pSlab++) {
        IntIndex dim = *pDimIndexes;
        if ((dim < 0) || (dim >= *pDimLenght)) {
            return null;
        }
        pElt += (*pSlab) * dim;
        
        pDimIndexes++;
        pDimLenght++;
    }
    return pElt;
}
#endif
//------------------------------------------------------------
AQBlock1* TypedArrayCore::BeginAtNDIndirect(Int32 rank, IntIndex** ppDimIndexes)
{
    // Ignore extra outer dimension if supplied.
    if (rank > Type()->Rank()) {
        // Possibly check extra dims to see if they are 0,
        // if not then it's out of bounds.
        return null;
    }
    
    AQBlock1 *pElt = RawBegin();
    IntIndex* pDimLenght = GetDimensionLengths();
    IntIndex* pSlab = GetSlabLengths();
    IntIndex* pEndSlab = pSlab + rank;
    
    // Find index by calculating dot product of
    // SlabLength vector and dimension index vector.
    // Note that slabs do not need to be packed.
    for (;pSlab < pEndSlab; pSlab++) {
        IntIndex *pDim = *ppDimIndexes;
        IntIndex dim = pDim ? *pDim : 0;
        if ((dim < 0) || (dim >= *pDimLenght)) {
            return null;
        }
        pElt += (*pSlab) * dim;
        
        ppDimIndexes++;
        pDimLenght++;
    }
    return pElt;
}
//------------------------------------------------------------
// Resize an array to match an existing pattern. The pattern
// may be an existing array or array type definition. The latter may
// contain variable or bounded dimension lengths.
Boolean TypedArrayCore::ResizeDimensions(Int32 rank, IntIndex *dimensionLengths, Boolean preserveElements, Boolean init)
{
    Int32 valuesRank = Type()->Rank();
    
    // Three sets of dimension sizes are used in this algorithm:
    //
    // (1) The requested dimension lenghts.
    //
    // (2) The underlying types dimension lenghts. The may include variable fixed and bounded)
    //     requests must be constrained to the the these specifications.
    //
    // (3) The actual values dimension lenghts. These are alwasy whole numbers.
    //
    // If the requested size contains a variable sentinel the existing value size will be used.
    // If the requested size if bounded (negative) the bounded size will be used.
    //

    IntIndex *pRequestedLength;
    IntIndex *pEndRequestedLengths;
    IntIndex *pTypesLengths = Type()->GetDimensionLengths();
    IntIndex *pValueLengths = GetDimensionLengths();
    IntIndex *pSlabLengths = GetSlabLengths();

    // Only used if too few dimensions passed in.
    ArrayDimensionVector tempDimensionLengths;
    
    IntIndex slabLength = ElementType()->TopAQSize();
    IntIndex originalCoreLength = Length();

    if (valuesRank <= rank) {
        // If enough dimensions are supplied use them inplace
        pRequestedLength = dimensionLengths;
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
        pRequestedLength = tempDimensionLengths;
    }
    pEndRequestedLengths = pRequestedLength + valuesRank;
    
    while(pRequestedLength < pEndRequestedLengths)
    {
        *pSlabLengths++ = slabLength;
        Boolean zeroOutLogicalDim = false;

        IntIndex dimLength = *pRequestedLength;
        IntIndex typesDimLength = *pTypesLengths;

        // Sanitize the requested sizes. The size requested
        // cannot override the specification defined by the type.
        if (dimLength == kVariableSizeSentinel) {
            // If the array is resized to "variable" then the existing size is used.
            dimLength = *pValueLengths;
        } else if (dimLength < 0) {
            dimLength = -dimLength;
            if (init) {
                // When initializing, the array will be structurally sized to
                // to the bounded size, logically the dimension will be 0.
                zeroOutLogicalDim = true;
            }
        }
        
        // Now compare with the type's specifications
        if (typesDimLength == kVariableSizeSentinel) {
            // Let the sanitized request pass through.
        } else if (typesDimLength >= 0) {
            // Fixed trumps request
            dimLength = typesDimLength;
        } else {
             if (dimLength > -typesDimLength) {
                 // If beyond bounded size make it the bounded size.
                 // TODO logical must set after resizing.
                 // TODO In general arrays that have mix of variable with bounded or fixed is not done yet
                 dimLength = -typesDimLength;
             }
        }
        slabLength *= dimLength;

        if (zeroOutLogicalDim)
            dimLength = 0;
        *pValueLengths++ = dimLength;
        pRequestedLength++;
        pTypesLengths++;
    }
    
    // The array is not been resized yet, but the sims and slabs have, so use
    // the length function to calculate the new length.
    IntIndex newLength = Length();
    
    return ResizeCore(slabLength, originalCoreLength, newLength, preserveElements);
}
//------------------------------------------------------------
// Make this array match the shape of the reference type.
Boolean TypedArrayCore::ResizeToMatchOrEmpty(TypedArrayCoreRef pReference)
{
    if (Type()->Rank() == pReference->Type()->Rank()) {
        return ResizeDimensions(_typeRef->Rank(), pReference->GetDimensionLengths(), true, false);
    } else {
        return false;
    }
}
//------------------------------------------------------------
Boolean TypedArrayCore::Resize1D(IntIndex length)
{
    Boolean bOK = true;
    IntIndex currentLength = Length();
    IntIndex refDimensionLength = *_typeRef->GetDimensionLengths();

    if (_typeRef->Rank()!=1)
        return false;

    if (refDimensionLength >= 0) {
        // TODO figure out how many elements are affected and re init them
        // Fixed size array no changes will be made.
        return length <= refDimensionLength;
    } else if (refDimensionLength != kVariableSizeSentinel) {
        // Bounded size size upto bounded size, no further.
        if (length > -refDimensionLength) {
            return false;
        } 
    } // else its variable size, do nothing.

    if (length != currentLength) {
        bOK = ResizeCore(length * _eltTypeRef->TopAQSize(), currentLength, length, true);
        if (bOK)
            *GetDimensionLengths() = length;
    }
    return bOK;
}
//------------------------------------------------------------
Boolean TypedArrayCore::ResizeCore(IntIndex countAQ, IntIndex currentLength, IntIndex newLength, Boolean preserveElements)
{
    Boolean bOK = true;
    
    // Resize the underlying block of bytes.
    
    IntIndex startInitPoistion = preserveElements ? currentLength : 0;
    
    if (newLength < currentLength) {
        // Shrinking
        if (!ElementType()->IsFlat()) {
            // Clear disappearing elements
            ElementType()->ClearData(BeginAt(newLength), currentLength-newLength);
        }
        bOK = AQRealloc(countAQ, countAQ);
    } else if (newLength > currentLength) {
        // Growing
        Int32 eltSize = _eltTypeRef->TopAQSize();
        bOK = AQRealloc(countAQ, (eltSize * currentLength));
    } else if (countAQ && (_pRawBufferBegin == null)) {
        // Initializing fixed/bounded arrays and ZDAs
        // will take this path when initializing
        bOK = AQRealloc(countAQ, 0);
    }

    if (bOK && (startInitPoistion < newLength)) {
        // Init new elements, if this fails then some will be initialize
        NIError err = ElementType()->InitData(BeginAt(startInitPoistion), newLength-startInitPoistion);
        bOK = (err == kNIError_Success);
    }
    return bOK;
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
NIError WriteIntToMemory(EncodingEnum encoding, Int32 aqSize, void* pData, IntMax value)
{
    if (!((encoding == kEncoding_UInt) || (encoding == kEncoding_SInt)))
        return kNIError_kCantEncode;

    if (aqSize==8) {
        *(AQBlock8*)pData = (AQBlock8)value;  //TODO support parsing 64 bit numbes
    } else if (aqSize==4) {
        *(AQBlock4*)pData = (AQBlock4)value;
    } else if (aqSize==2) {
        *(AQBlock2*)pData = (AQBlock2)value;
    } else if (aqSize==1) {
        *(AQBlock1*)pData = (AQBlock1)value;
    } else {
        return kNIError_kCantDecode;
    }
    return kNIError_Success;
}
//------------------------------------------------------------
NIError ReadIntFromMemory(EncodingEnum encoding, Int32 aqSize, void* pData, IntMax *pValue)
{
    IntMax value;
    if (encoding == kEncoding_SInt) {
        // Use signed int casts to get sign extension
        switch(aqSize) {
            case 1:
                value = *(Int8*) pData;
                break;
            case 2:
                value = *(Int16*) pData;
                break;
            case 4:
                value = *(Int32*) pData;
                break;
            case 8:
                value = *(Int64*) pData;
                break;
            default:
                *pValue = 0;
                return  kNIError_kCantDecode;
                break;
        }
    } else if (encoding == kEncoding_UInt) {
        // Use unsigned int casts to avoid sign extension
        switch(aqSize) {
            case 1:
                value = *(UInt8*) pData;
                break;
            case 2:
                value = *(UInt16*) pData;
                break;
            case 4:
                value = *(UInt32*) pData;
                break;
            case 8:
                value = *(UInt64*) pData;
                break;
            default:
                *pValue = 0;
                return  kNIError_kCantDecode;
                break;
        }
    } else {
        *pValue = 0;
        return kNIError_kCantDecode;
    }
    *pValue = value;
    return kNIError_Success;
}
//------------------------------------------------------------
NIError ReadDoubleFromMemory(EncodingEnum encoding, Int32 aqSize, void* pData, Double *pValue)
{
    NIError err = kNIError_Success;
    Double value = 0.0;
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 4:  value = *(Single*) pData;      break;
                case 8:  value = *(Double*) pData;      break;
                default: err = kNIError_kCantDecode;    break;
            }
            break;
        case kEncoding_SInt:
            switch (aqSize) {
                case 1:  value = *(Int8*) pData;        break;
                case 2:  value = *(Int16*) pData;       break;
                case 4:  value = *(Int32*) pData;       break;
                case 8:  value = *(Int64*) pData;       break;
                default: err = kNIError_kCantDecode;    break;
            }
            break;
        case kEncoding_UInt:
            switch (aqSize) {
                case 1:  value = *(UInt8*) pData;       break;
                case 2:  value = *(UInt16*) pData;      break;
                case 4:  value = *(UInt32*) pData;      break;
                case 8:  value = *(UInt64*) pData;      break;
                default: err = kNIError_kCantDecode;    break;
            }
            break;
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
                case 4:  *(Single*)pData = (Single)value; break;
                case 8:  *(Double*)pData = (Double)value; break;
                default: err = kNIError_kCantEncode; break;
            }
            break;
        case kEncoding_SInt:
            switch (aqSize) {
                case 1:  *(Int8*)pData  = (Int8)value; break;
                case 2:  *(Int16*)pData = (Int16)value; break;
                case 4:  *(Int32*)pData = (Int32)value; break;
                case 8:  *(Int64*)pData = (Int64)value; break;
                default: err = kNIError_kCantEncode; break;
            }
            break;
        case kEncoding_UInt:
            switch (aqSize) {
                case 1:  *(UInt8*)pData  = (Int8)value; break;
                case 2:  *(UInt16*)pData = (UInt16)value; break;
                case 4:  *(UInt32*)pData = (UInt32)value; break;
                case 8:  *(UInt64*)pData = (UInt64)value; break;
                default: err = kNIError_kCantEncode; break;
            }
            break;
        default: err = kNIError_kCantDecode; break;
    }
    if (err != kNIError_Success) {
        memset(pData, 0, aqSize);
    }
    return err;
}
//------------------------------------------------------------
void PrintType(TypeRef type, const char* message)
{
    SubString ss1;
    SubString ss2;
    type->GetName(&ss1);
    type->GetElementName(&ss2);
    printf("Type <%.*s> <%.*s> %s\n", FMT_LEN_BEGIN(&ss1), FMT_LEN_BEGIN(&ss2), message);
}
//------------------------------------------------------------
// TypedAndDataManager native functions
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(TypeManagerCurrentTypeManager, TypeManagerRef)
{
    _Param(0) = THREAD_EXEC()->TheTypeManager();
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
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_EXEC()->TheTypeManager();
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
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_EXEC()->TheTypeManager();
    SubString typeName = _Param(1)->MakeSubStringAlias();
    if (tm) {
        tm->Define(&typeName, _Param(2));
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(TypeOf, TypeRef, TypedArrayCoreRef, TypeRef)
{
    // Return the static type.
    // TODO what about a function that returns run-time type
    // This is not needed until dynamic types esixt.
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
    SubString elementName;
    t->GetElementName(&elementName);
    _Param(1)->CopyFromSubString(&elementName);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeGetName, TypeRef, StringRef)
{
    TypeRef t = _Param(0);
    SubString name;
    t->GetName(&name);
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
VIREO_FUNCTION_SIGNATURE3(TypeGetSubElementByName, TypeRef, StringRef,  TypeRef)
{
    SubString name = _Param(1)->MakeSubStringAlias();
    _Param(2) = _Param(0)->GetSubElementByName(&name);
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
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_EXEC()->TheTypeManager();
    
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
//  TypeManagerRef tm = _ParamPointer(tm) ? _Param(tm) : THREAD_EXEC()->TheTypeManager();
//   _Param(3) = ArrayType::New(tm, _Param(1), 1, _ParamPointer(2));
    return _NextInstruction();
}
#endif

#if defined(VIREO_TYPE_VARIANT)
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(TypeManagerObtainValueType, TypeManagerRef, StringRef, TypeRef, Boolean, TypeRef)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_EXEC()->TheTypeManager();
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
    
    SubString otherTypeName;
    secondType->GetName(&otherTypeName);
    
    if (type->IsA(&otherTypeName)) {
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
    
    SubString otherTypeName;
    secondType->GetName(&otherTypeName);
    
    if (type->IsA(&otherTypeName)) {
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
    DEFINE_VIREO_FUNCTION(TypeGetSubElementByName, "p(i(.Type) i(.String) o(.Type))");

#if defined(VIREO_TYPE_CONSTRUCTION)
    DEFINE_VIREO_FUNCTION(TypeMakeVectorType, "p(i(.TypeManager) o(.Type) i(.Type) i(.Int32))");
  //  DEFINE_VIREO_FUNCTION(TypeMakeClusterType, "p(i(.VarArgCount) i(.TypeManager) o(.Type) i(.Type))");
#endif

DEFINE_VIREO_END()



