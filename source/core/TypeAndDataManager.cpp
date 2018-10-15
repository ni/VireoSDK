/**

Copyright (c) 2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
 */

#include "ExecutionContext.h"
#include "TypeAndDataManager.h"
#include "TDCodecVia.h"  // for TDViaFormatter
#include <math.h>
#include <limits>
#if defined(VIREO_INSTRUCTION_REFLECTION)
#include <map>
#endif
// Set VIREO_TRACK_MEMORY_ALLLOC_COUNTER to record monotonically increasing allocation number
// with each allocation, to aid leak tracking, etc.
#define VIREO_TRACK_MEMORY_ALLLOC_COUNTER 0

namespace Vireo
{

void ErrorCluster::SetError(Boolean s, Int32 c, ConstCStr str, Boolean appendCallChain/*= true*/) {
    status = s;
    code = c;
    if (source) {
        source->Resize1D(0);
        source->AppendCStr(str);
        if (appendCallChain) {
            source->AppendCStr(" in ");
            AppendCallChainString(source);
        }
    }
}

void ErrorCluster::SetError(ErrorCluster error) {
    status = error.status;
    code = error.code;
    if (source) {
        source->Resize1D(0);
        source->AppendStringRef(error.source);
    }
}

#ifdef VIREO_TRACK_MEMORY_QUANTITY
// Optional header added to blocks allocated from the system
struct MallocInfo {
    size_t          _length;        // how big the block is
    TypeManagerRef  _manager;       // which TypeManager was used to allocate it.
#if VIREO_TRACK_MEMORY_ALLLOC_COUNTER
    size_t  _allocNum;
#endif
};
#endif

//------------------------------------------------------------
// TypeManager
//------------------------------------------------------------
// TODO(PaulAustin): each thread can have one active TypeManager at a time.
// this is not thread local so the runtime is not ready for
// multi-threaded execution.
VIVM_THREAD_LOCAL TypeManagerRef TypeManagerScope::ThreadsTypeManager;

//------------------------------------------------------------
void TypeManager::Delete()
{
    TypeManagerRef tm = this;

    // Delete all types owned bye the tm.
    tm->DeleteTypes(true);
    tm->PrintMemoryStat("ES Delete end", true);

    // Give C++ an chance to clean up any member data.
    tm->~TypeManager();
    gPlatform.Mem.Free(tm);
}
//------------------------------------------------------------
void TypeManager::PrintMemoryStat(ConstCStr message, Boolean bLast)
{
#ifdef VIREO_PERF_COUNTERS
    if (bLast && (_totalAllocations == 1) && (_totalAQAllocated == sizeof(TypeManager))) {
        // If bLast is true then silence is success.
    } else {
        gPlatform.IO.Printf("LEAKS: Allocations %4d, AQCount %5zd, ShareTypes %d (%s)\n", (int)_totalAllocations, _totalAQAllocated, _typesShared, message);
    }
#endif
}
//------------------------------------------------------------
TypeManager::TypeManager(TypeManagerRef parentTm)
{
#ifdef VIREO_PERF_COUNTERS
    _typesShared = 0;
#endif
    _totalAllocations = 0;
    _totalAQAllocated = 0;
    _totalAllocationFailures = 0;
    _maxAllocated = 0;
    _allocationLimit = ((2 * 1024) - 16) * 1024 * 1024;  // 2 GB - 16 MB (current wasm limit with some headroom)

    _typeList = nullptr;
    _baseTypeManager = parentTm;
    _executionContext = parentTm ? parentTm->TheExecutionContext() : nullptr;
    _aqBitLength = 8;

    // Once the object is constructed set up the source temporarily
    // and create the bad-type singleton
    {
        TypeManagerScope scope(this);
        _badType = TADM_NEW_PLACEMENT(TypeCommon)(this);
    }
}
#ifdef VIREO_TRACK_MEMORY_QUANTITY
#if VIREO_TRACK_MEMORY_ALLLOC_COUNTER
static size_t s_MemAllocCounter = 0;
#endif
#endif

#if VIREO_TRACK_MEMORY_ALLLOC_COUNTER
size_t gAllocNumWatch = 0;
#endif
//------------------------------------------------------------
//! Private static Malloc used by TM.
void* TypeManager::Malloc(size_t countAQ)
{
    VIREO_ASSERT(countAQ != 0);
    size_t allocationCount = 1;

#ifdef VIREO_TRACK_MEMORY_QUANTITY
    if ((_totalAQAllocated + countAQ) > _allocationLimit) {
        _totalAllocationFailures++;
        THREAD_EXEC()->ClearBreakout();
        gPlatform.IO.Print("Exceeded allocation limit\n");
        return nullptr;
    }
    // Task is charged size of MallocInfo
    countAQ += sizeof(MallocInfo);
    allocationCount = countAQ;
#endif

    void* pBuffer = gPlatform.Mem.Malloc(countAQ);
    if (pBuffer) {
        TrackAllocation(pBuffer, allocationCount, true);

#ifdef VIREO_TRACK_MEMORY_QUANTITY
        ((MallocInfo*)pBuffer)->_length = allocationCount;
        ((MallocInfo*)pBuffer)->_manager = this;
#if VIREO_TRACK_MEMORY_ALLLOC_COUNTER
        if (gAllocNumWatch && s_MemAllocCounter == gAllocNumWatch)
            gPlatform.IO.Printf("[mem break]\n");
        ((MallocInfo*)pBuffer)->_allocNum = s_MemAllocCounter++;
#endif
        pBuffer = (MallocInfo*)pBuffer + 1;
#endif
        return pBuffer;
    } else {
        _totalAllocationFailures++;
        THREAD_EXEC()->ClearBreakout();
        gPlatform.IO.Printf("Failed to perform allocation: %5zu\n", countAQ);
        return nullptr;
    }
}
//------------------------------------------------------------
//! Private static Realloc used by TM.
void* TypeManager::Realloc(void* pBuffer, size_t countAQ, size_t preserveAQ)
{
    VIREO_ASSERT(countAQ != 0);
    VIREO_ASSERT(pBuffer != nullptr);

#ifdef VIREO_TRACK_MEMORY_QUANTITY
    pBuffer = (MallocInfo*)pBuffer - 1;
    size_t currentSize = ((MallocInfo*)pBuffer)->_length;
#if VIREO_TRACK_MEMORY_ALLLOC_COUNTER
    ((MallocInfo*)pBuffer)->_allocNum = -((MallocInfo*)pBuffer)->_allocNum;
#endif

    countAQ += sizeof(MallocInfo);
    preserveAQ += sizeof(MallocInfo);
#endif

    void* pNewBuffer = gPlatform.Mem.Realloc(pBuffer, countAQ);

    if (pNewBuffer != nullptr) {
        if (preserveAQ < countAQ) {
            memset((AQBlock1*)pNewBuffer + preserveAQ, 0, countAQ - preserveAQ);
        }
#ifdef VIREO_TRACK_MEMORY_QUANTITY
        TrackAllocation(pBuffer, currentSize, false);
        TrackAllocation(pNewBuffer, countAQ, true);
        ((MallocInfo*)pNewBuffer)->_length = countAQ;
        VIREO_ASSERT(this == ((MallocInfo*)pNewBuffer)->_manager);
#if VIREO_TRACK_MEMORY_ALLLOC_COUNTER
        ((MallocInfo*)pNewBuffer)->_allocNum = s_MemAllocCounter++;
#endif
        pNewBuffer = (MallocInfo*)pNewBuffer + 1;
#else
        TrackAllocation(pBuffer, 1, false);
        TrackAllocation(pNewBuffer, 1, true);  // could be same pointer
#endif
    }
    // else realloc failed, old block is still there, same size
    // failure processed by caller.

    return pNewBuffer;
}
//------------------------------------------------------------
//! Private static Free used by TM.
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
        return gPlatform.Mem.Free(pBuffer);
    }
}
//------------------------------------------------------------
//! Delete all types allocated within a TypeManager.
void TypeManager::DeleteTypes(Boolean finalTime)
{
    MUTEX_SCOPE()
    TypeManagerScope scope(this);

    // Any type managers that had this instance
    // as their parent should be cleaned up by now.

    // Clear out any default values. They may depend on types
    // The OwnsDefDef property does not forward the query
    // to wrapped types. The prevents base types in on TADM
    // from being cleared by wraps from derived TADMs.

    TypeRef type = _typeList;
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

    _typeList = nullptr;
    _typeNameDictionary.clear();
    _typeInstanceDictionary.clear();

    if (!finalTime) {
        // If just a temporary reset then restore the BadType instance.
        _badType = TADM_NEW_PLACEMENT(TypeCommon)(this);
    } else {
        if (!_baseTypeManager) {
            Free(_executionContext);
            _executionContext = nullptr;
        }
    }
}
//------------------------------------------------------------
TypeRef TypeManager::GetObjectElementAddressFromPath(SubString* objectName, SubString* path, void** ppData, Boolean allowDynamic)
{
    TypeRef type = FindType(objectName, true);
    if (type) {
        void* pData = type->Begin(kPARead);
        return type->GetSubElementAddressFromPath(path, pData, ppData, allowDynamic);
    } else {
        *ppData = nullptr;
        return nullptr;
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
        // When instruction reflection is enabled the name of the c entry point is recorded as well
        // to assist generation of C code that references the same symbols.
        CPrimtitiveInfo cpi;
        cpi._cName = cName;
        cpi._type = type;
        _cPrimitiveDictionary.insert(std::make_pair(pointer, cpi));
#endif
        return type;
    } else {
        return nullptr;
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
        return nullptr;
    }
}
//------------------------------------------------------------
//! Add a newly created type to the TM list of types it owns.
void TypeManager::TrackType(TypeRef type)
{
    VIREO_ASSERT(nullptr != type)
    type->_next = _typeList;
    _typeList = type;
}
//------------------------------------------------------------
//! Remove the last type added to the TM list of types it owns.
void TypeManager::UntrackLastType(TypeRef type)
{
    // Used when the last type created is determined to already exist.
    VIREO_ASSERT(_typeList == type)
    _typeList = type->_next;
    type->_next = nullptr;
}
//------------------------------------------------------------
//! Debit or credit an allocation against a TM's quota.
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
//! Fill an array with all types a TM owns.
void TypeManager::GetTypes(TypedArray1D<TypeRef>* pArray)
{
    MUTEX_SCOPE()

    IntIndex length = (IntIndex)_typeNameDictionary.size();
    pArray->Resize1DOrEmpty(length);
    // If it gets emptied the following works fine

    if (pArray->Length() == length) {
        TypeRef* pBegin = pArray->Begin();
        TypeDictionaryIterator iter;
        iter = _typeNameDictionary.begin();

        while (iter != _typeNameDictionary.end()) {
            *pBegin = iter->second;
            pBegin++;
            iter++;
        }
    } else {
        pArray->Resize1D(0);
    }
}
//------------------------------------------------------------
//! Define a new symbol by adding a type to the symbol table.
TypeRef TypeManager::Define(const SubString* typeName, TypeRef type)
{
    MUTEX_SCOPE()

    // Though overloads are allowed, it is still necessary to make a name wrapper for each unique type.
    // This allows the resolved type to be passed with its name wrapper, and allows functions to see the name
    // of the resolved symbol.

    NamedTypeRef existingOverload = FindTypeCore(typeName);
    return NewNamedType(typeName, type, existingOverload);
}
//------------------------------------------------------------
//! Private method to add a new symbol table entry or link it into an existing entry.
NamedTypeRef TypeManager::NewNamedType(const SubString* typeName, TypeRef type, NamedTypeRef existingOverload)
{
    // Storage for the string used by the dictionary is the same
    // buffer that is embedded at the end of the NamedType instance.
    // Once the object is created then obj->Name() is used to
    // get pointers to the internal name. This storage
    // sharing works since the types last as long as the
    // the dictionary does.

    Boolean bNewInThisTM = existingOverload ? (existingOverload->TheTypeManager() != this) : true;

    NamedTypeRef namedType = NamedType::New(this, typeName, type, existingOverload);
    if (bNewInThisTM) {
        SubString permanentTypeName = namedType->Name();
        _typeNameDictionary.insert(std::make_pair(permanentTypeName, namedType));
    } else {
        // If it is already in this TypeManager the new type is
        // threaded off of the first one defined.
    }
    return namedType;
}
//------------------------------------------------------------
//! Find a type by is symbol name in nullptr terminated C string form.
TypeRef TypeManager::FindType(ConstCStr name)
{
    SubString ssName(name);
    return FindType(&ssName);
}
//------------------------------------------------------------
//! Find a type by is symbol name.
TypeRef TypeManager::FindType(const SubString* name, Boolean decode /*= false*/)
{
    MUTEX_SCOPE()

    SubString pathHead;
    SubString pathTail;
    name->SplitString(&pathHead, &pathTail, '.');

    TypeRef type = FindTypeCore(&pathHead, decode);

    if (type && pathTail.Length()) {
        void* temp;
        TypeRef subType = type->GetSubElementAddressFromPath(&pathTail, &temp, nullptr, false);
        type = subType;
    }

    if (!type && name->ComparePrefix(*tsMetaIdPrefix)) {
        // Names that start with $ are template parameters.
        // They are all named derivatives of the common wild card
        // type named "*". This means template fields can be replaced
        // by any type.
        // FUTURE: It could also be reasonable to make parameters that
        // have a stricter IsA relationship with a designated base type.

        TypeRef genericType = FindType(tsWildCard);
        type = NewNamedType(name, genericType, nullptr);
    }

    return type;
}
//------------------------------------------------------------
NamedTypeRef TypeManager::FindTypeCore(const SubString* name, Boolean decode /*=false*/)
{
    MUTEX_SCOPE()

    // Why return a references to a TypeRef?
    // When instructions use a type constant, the instructions need to point to a variable
    // that has the TypeRef as the value. The dictionary serves as that variable so the address
    // to the entry is returned. The Symbol cannot be deleted until instructions (VIs) are cleared.
    // Since a referenced type must exist before the instruction can reference it,
    // this works out fine.
    PercentDecodedSubString decodedStr;
    SubString decodedSubStr;
    if (decode) {
        decodedStr.Init(*name, true, false);
        decodedSubStr = decodedStr.GetSubString();
        name = &decodedSubStr;
    }
    TypeDictionaryIterator iter;
    iter = _typeNameDictionary.find(*name);
    NamedTypeRef type = (iter != _typeNameDictionary.end()) ? iter->second : nullptr;

    if (type == nullptr && _baseTypeManager) {
        type = _baseTypeManager->FindTypeCore(name);
    }

    return type;
}
//------------------------------------------------------------
TypeRef TypeManager::ResolveToUniqueInstance(TypeRef type, SubString* binaryName)
{
    std::map<SubString, TypeRef, CompareSubString>::iterator  iter;

    for (TypeManagerRef tm = this; tm ; tm = tm->BaseTypeManager()) {
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
    // subject to be conditional to architecture
    if (size < 2)
        return 1;
    if (size < 4)
        return 2;
    if (size < 8)
        return 4;
    else
#if VIREO_32_BIT_LONGLONGWORD_ALIGNMENT
        return 4;
#else
        return 8;
#endif
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
    void *pData = nullptr;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == nullptr) {
        *pValue = 0;
        return kNIError_kResourceNotFound;
    }

    *pValue = ReadDoubleFromMemory(actualType, pData);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeManager::WriteValue(SubString* objectName, SubString* path, Double value)
{
    void *pData = nullptr;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == nullptr) {
        return kNIError_kResourceNotFound;
    }

    WriteDoubleToMemory(actualType, pData, value);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeManager::ReadValue(SubString* objectName, SubString* path, StringRef)
{
    void *pData = nullptr;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == nullptr) {
//        *pValue = 0;
        return kNIError_kResourceNotFound;
    }

//    ReadDoubleFromMemory(actualType->BitEncoding(), actualType->TopAQSize(), pData, pValue);
    return kNIError_Success;
}
//------------------------------------------------------------
NIError TypeManager::WriteValue(SubString* objectName, SubString* path, SubString* value)
{
    void *pData = nullptr;
    TypeRef actualType = this->GetObjectElementAddressFromPath(objectName, path, &pData, true);
    if (actualType == nullptr) {
        return kNIError_kResourceNotFound;
    }

//    WriteDoubleToMemory(actualType->BitEncoding(), actualType->TopAQSize(), pData, value);
    return kNIError_Success;
}

//------------------------------------------------------------
// TypeCommon
//------------------------------------------------------------
const SubString TypeCommon::TypeInt8 = SubString("Int8");
const SubString TypeCommon::TypeInt16 = SubString("Int16");
const SubString TypeCommon::TypeInt32 = SubString("Int32");
const SubString TypeCommon::TypeInt64 = SubString("Int64");
const SubString TypeCommon::TypeUInt8 = SubString("UInt8");
const SubString TypeCommon::TypeUInt16 = SubString("UInt16");
const SubString TypeCommon::TypeUInt32 = SubString("UInt32");
const SubString TypeCommon::TypeUInt64 = SubString("UInt64");
const SubString TypeCommon::TypeSingle = SubString("Single");
const SubString TypeCommon::TypeDouble = SubString(tsDoubleType);
const SubString TypeCommon::TypeBoolean = SubString(tsBooleanType);
const SubString TypeCommon::TypeString = SubString(tsStringType);
const SubString TypeCommon::TypeTimestamp = SubString("Timestamp");
const SubString TypeCommon::TypeComplexSingle = SubString("ComplexSingle");
const SubString TypeCommon::TypeComplexDouble = SubString("ComplexDouble");
const SubString TypeCommon::TypeJavaScriptRefNum = SubString(tsJavaScriptRefNumToken);
const SubString TypeCommon::TypePath = SubString("NIPath");
const SubString TypeCommon::TypeAnalogWaveform = SubString("AnalogWaveform");
const SubString TypeCommon::TypeStaticTypeAndData = SubString("StaticTypeAndData");

TypeCommon::TypeCommon(TypeManagerRef typeManager)
{
    _typeManager = typeManager;
    _typeManager->TrackType(this);
    // Derived class must initialize core properties
    _topAQSize      = 0;
    _aqAlignment    = 0;        // in AQ counts
    _rank           = 0;        // 0 for scalar
    _isFlat         = true;
    _isValid        = false;    // Must be reset by derived class.
    _hasCustomDefault = false;
    _hasPadding     = false;
    _isTemplate     = false;
    _isBitLevel     = false;     // Is a bit block or bit cluster
    _encoding       = kEncoding_None;
    _pointerType    = kPTNotAPointer;
    _elementUsageType = kUsageTypeSimple;
    _opaqueReference = false;
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
        // TODO(PaulAustin): if init fails, go back and clear?
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
            // TODO(PaulAustin): process errors
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
// Determine if another type is defined from this type.
// Arrays are the same if they have the same rank and their sub types compare
// TODO(PaulAustin): Consider merging this function with IsA function below.
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
        SubString thisTypeName, otherTypeName;
        Boolean isThisIntrinsicClusterType = this->IsIntrinsicClusterDataType(&thisTypeName);
        Boolean isOtherIntrinsicClusterType = otherType->IsIntrinsicClusterDataType(&otherTypeName);
        if (isThisIntrinsicClusterType && isOtherIntrinsicClusterType) {
            if (thisTypeName.Compare(&otherTypeName)) {
                return true;
            }
        } else if (!isThisIntrinsicClusterType && !isOtherIntrinsicClusterType) {
            if (this->SubElementCount() == otherType->SubElementCount()) {
                for (Int32 i = 0; i < this->SubElementCount(); i++) {
                    if (!this->GetSubElement(i)->CompareType(otherType->GetSubElement(i)))
                        return false;
                }
                return true;
            }
        }
    } else if (thisEncoding == otherEncoding && BitLength() == otherType->BitLength()
               && (thisEncoding == kEncoding_IEEE754Binary || thisEncoding == kEncoding_S2CInt
                   || thisEncoding == kEncoding_UInt
                   || thisEncoding == kEncoding_Boolean || thisEncoding == kEncoding_Ascii
                   || thisEncoding == kEncoding_Unicode)) {  // should we just check IsFlat() instead?
        return true;
    } else {
        if (this->IsA(otherType, true) || otherType->IsA(this, true))
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
            return bMatch;
        } else if (thisEncoding == kEncoding_UInt || thisEncoding == kEncoding_S2CInt ||
                   thisEncoding == kEncoding_Ascii || thisEncoding == kEncoding_Unicode) {
            if (otherEncoding == kEncoding_UInt || otherEncoding == kEncoding_S2CInt ||
                otherEncoding == kEncoding_Ascii || otherEncoding == kEncoding_Unicode) {
                bMatch = TopAQSize() == otherType->TopAQSize();
            }
        } else if (thisEncoding == kEncoding_Cluster && otherEncoding == kEncoding_Cluster) {
            SubString thisTypeName, otherTypeName;
            Boolean isThisIntrinsicClusterType = this->IsIntrinsicClusterDataType(&thisTypeName);
            Boolean isOtherIntrinsicClusterType = otherType->IsIntrinsicClusterDataType(&otherTypeName);
            if (isThisIntrinsicClusterType && isOtherIntrinsicClusterType) {
                if (thisTypeName.Compare(&otherTypeName)) {
                    bMatch = true;
                }
            } else if (!isThisIntrinsicClusterType && !isOtherIntrinsicClusterType) {
                if (this->SubElementCount() == otherType->SubElementCount()) {
                    Int32 i = 0;
                    for (; i < this->SubElementCount(); i++) {
                        if (!this->GetSubElement(i)->CompareType(otherType->GetSubElement(i)))
                            break;
                    }
                    if (i == this->SubElementCount())
                        bMatch = true;
                }
            }
        }
    }

    if (!bMatch && (otherType->Name().Length() > 0)) {
        bMatch = IsA(otherType);
        if (_encoding == kEncoding_RefNum) {
            return otherType->BitEncoding() == kEncoding_RefNum && bMatch
                && (SubElementCount() == 0 || GetSubElement(0)->IsA(otherType->GetSubElement(0), compatibleStructure));
        }
    }

    return bMatch;
}
//------------------------------------------------------------
// Dig through nested type names to see if one of the names
// matches the one provided.
Boolean TypeCommon::IsA(TypeRef otherType)
{
    SubString otherTypeName = otherType->Name();

    SubString angle("<");
    if (otherType->IsTemplate()) {
        SubString name = Name();
        IntIndex i = name.FindFirstMatch(&angle, 0, false);
        if (i > 0) {
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
        if (t->Name().Compare(otherTypeName)) {  // ??? should this really consider unnamed types equal?? -CS
            return true;
        }
        if (t->IsOpaqueReference())
            break;
        t = t->BaseType();
    }

    if (otherTypeName->CompareCStr(tsWildCard)) {
        return true;
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsNumeric()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeInt8) || t->Name().Compare(&TypeInt16) || t->Name().Compare(&TypeInt32) || t->Name().Compare(&TypeInt64)
            || t->Name().Compare(&TypeUInt8) || t->Name().Compare(&TypeUInt16) || t->Name().Compare(&TypeUInt32) || t->Name().Compare(&TypeUInt64)
            || t->Name().Compare(&TypeSingle) || t->Name().Compare(&TypeDouble)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsInteger()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeInt8) || t->Name().Compare(&TypeInt16) || t->Name().Compare(&TypeInt32) || t->Name().Compare(&TypeInt64)
            || t->Name().Compare(&TypeUInt8) || t->Name().Compare(&TypeUInt16) || t->Name().Compare(&TypeUInt32) || t->Name().Compare(&TypeUInt64)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsSignedInteger()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeInt8) || t->Name().Compare(&TypeInt16) || t->Name().Compare(&TypeInt32)
            || t->Name().Compare(&TypeInt64)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsInteger64()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeInt64) || t->Name().Compare(&TypeUInt64)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsFloat()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeSingle) || t->Name().Compare(&TypeDouble)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}

//------------------------------------------------------------
Boolean TypeCommon::IsBoolean()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeBoolean)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}

//------------------------------------------------------------
Boolean TypeCommon::IsString()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeString)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}

//------------------------------------------------------------
Boolean TypeCommon::IsPath()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypePath)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsTimestamp()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeTimestamp)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsComplex()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeComplexDouble) || t->Name().Compare(&TypeComplexSingle)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsJavaScriptRefNum()
{
    TypeRef t = this;
    while (t) {
        if (t->Name().Compare(&TypeJavaScriptRefNum)) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsAnalogWaveform()
{
    TypeRef t = this;
    while (t) {
        SubString typeName = t->Name();
        if (typeName.FindFirstMatch(&TypeAnalogWaveform, 0, false) == 0) {
            return true;
        }
        t = t->BaseType();
    }
    return false;
}
//------------------------------------------------------------
Boolean TypeCommon::IsIntrinsicClusterDataType(SubString *foundTypeName) {
    TypeRef t = this;
    while (t) {
        SubString typeName = t->Name();
        if (typeName.Compare(&TypeComplexDouble) || typeName.Compare(&TypeComplexSingle) ||
            typeName.Compare(&TypeTimestamp)) {  // TODO(sanmut) Add Waveform types also. https://github.com/ni/VireoSDK/issues/308
            foundTypeName->AliasAssign(&typeName);
            return true;
        }
        t = t->BaseType();
    }
    foundTypeName->AliasAssignCStr(tsInvalidIntrinsicClusterType);
    return false;
}

//------------------------------------------------------------
//! Parse an element path by name. Base class only knows
//! about structural attributes.
TypeRef TypeCommon::GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic)
{
    // TODO(PaulAustin): this is a bit experimental.
    // Its important to note that drilling down structural attributes
    // is not generally useful. For example
    //
    // x.$BaseType.$TopAQSize
    //
    // Does not yield the TopAQSize of X's BaseType
    // if Yields the TopAQSize of Type.

    if (path->Length() == 0) {
        *end = start;
        return this;
    }

    TypeRef subType = nullptr;
    if (path->ComparePrefix(*tsMetaIdPrefix)) {
        SubString pathHead;
        SubString pathTail;
        path->SplitString(&pathHead, &pathTail, '.');
        if (pathHead.CompareCStr("$TopAQSize")) {
            // Where is the storage allocated?
            subType = THREAD_TADM()->FindType(tsInt32Type);
            DefaultValueType *cdt = DefaultValueType::New(THREAD_TADM(), subType, false);
            Int32* pValue = (Int32*) cdt->Begin(kPAInit);
            *pValue = this->TopAQSize();
            cdt = cdt->FinalizeDVT();
            *end = cdt->Begin(kPARead);
        } else if (pathHead.CompareCStr("$Rank")) {
            // Where is the storage allocated?
            subType = THREAD_TADM()->FindType(tsInt32Type);
            DefaultValueType *cdt = DefaultValueType::New(THREAD_TADM(), subType, false);
            Int32* pValue = (Int32*) cdt->Begin(kPAInit);
            *pValue = this->Rank();
            cdt = cdt->FinalizeDVT();
            *end = cdt->Begin(kPARead);
        } else if (pathHead.CompareCStr("$IsFlat")) {
            // Where is the storage allocated?
            subType = THREAD_TADM()->FindType(tsBooleanType);
            DefaultValueType *cdt = DefaultValueType::New(THREAD_TADM(), subType, false);
            Boolean* pValue = (Boolean*) cdt->Begin(kPAInit);
            *pValue = this->IsFlat();
            cdt = cdt->FinalizeDVT();
            *end = cdt->Begin(kPARead);
        } else if (pathHead.CompareCStr("$Type")) {
            // Where is the storage allocated?
            subType = THREAD_TADM()->FindType(tsTypeType);
            DefaultValueType *cdt = DefaultValueType::New(THREAD_TADM(), subType, false);
            TypeRef* pValue = (TypeRef*) cdt->Begin(kPAInit);
            *pValue = this;
            cdt = cdt->FinalizeDVT();
            *end = cdt->Begin(kPARead);
        } else if (pathHead.CompareCStr("$BaseType")) {
            // Where is the storage allocated?
            subType = this->BaseType()->GetSubElementAddressFromPath(&pathTail, nullptr, end, allowDynamic);
            /*
             subType = THREAD_TADM()->FindType(tsTypeType);
             DefaultValueType *cdt = DefaultValueType::New(THREAD_TADM(), subType, false);
             TypeRef* pValue = (TypeRef*) cdt->Begin(kPAInit);
             *pValue = this->BaseType();
             cdt = cdt->FinalizeDVT();
             *end = cdt->Begin(kPARead);
             */
        } else if (pathHead.CompareCStr("$Name")) {
            // Where is the storage allocated?
            subType = THREAD_TADM()->FindType(tsStringType);
            DefaultValueType *cdt = DefaultValueType::New(THREAD_TADM(), subType, false);
            StringRef* pValue = (StringRef*) cdt->Begin(kPAInit);
            SubString name = this->Name();
            (*pValue)->AppendSubString(&name);
            cdt = cdt->FinalizeDVT();
            *end = cdt->Begin(kPARead);
        } else if (pathHead.CompareCStr("$ElementName")) {
            // Where is the storage allocated?
            subType = THREAD_TADM()->FindType(tsStringType);
            DefaultValueType *cdt = DefaultValueType::New(THREAD_TADM(), subType, false);
            StringRef* pValue = (StringRef*) cdt->Begin(kPAInit);
            SubString name = this->ElementName();
            (*pValue)->AppendSubString(&name);
            cdt = cdt->FinalizeDVT();
            *end = cdt->Begin(kPARead);
        }

        if (subType && pathTail.Length()) {
            subType = subType->GetSubElementAddressFromPath(&pathTail, nullptr, end, allowDynamic);
        }
    }

    return subType;
}

#ifdef VIREO_DEBUG
// Function for ease of debugging; call from debugger to print type/data
void TypeCommon::Dump(void *pData) {
    STACK_VAR(String, tempString);
    if (tempString.Value) {
        TDViaFormatter formatter(tempString.Value, false);
        formatter.FormatType(this);
        if (pData) {
            tempString.Value->Append(':');
            formatter.FormatData(this, pData);
            tempString.Value->Append('\n');
        } else {
            tempString.Value->Append('\n');
        }
        gPlatform.IO.Print(tempString.Value->Length(), (const char*)tempString.Value->Begin());
    }
}
#endif

//------------------------------------------------------------
// WrappedType
//------------------------------------------------------------
WrappedType::WrappedType(TypeManagerRef typeManager, TypeRef type)
    : TypeCommon(typeManager) {
    _wrapped = type;

    _topAQSize      = _wrapped->TopAQSize();
    _aqAlignment    = _wrapped->AQAlignment();
    _rank           = _wrapped->Rank();
    _isFlat         = _wrapped->IsFlat();
    _isValid        = _wrapped->IsValid();
    _hasCustomDefault = _wrapped->HasCustomDefault();
    _isMutableValue = _wrapped->IsMutableValue();
    _hasPadding     = _wrapped->HasPadding();
    _isTemplate     = _wrapped->IsTemplate();
    _encoding       = _wrapped->BitEncoding();
    _isBitLevel     = _wrapped->IsBitLevel();
    _pointerType    = _wrapped->PointerType();
}
//------------------------------------------------------------
TypeRef WrappedType::GetSubElementAddressFromPath(SubString* name, void *start, void **end, Boolean allowDynamic)
{
    // Names that start with a '$' may be structural attributes handled by TypeCommon.
    if (name->ComparePrefix(*tsMetaIdPrefix)) {
        TypeRef subType = TypeCommon::GetSubElementAddressFromPath(name, start, end, allowDynamic);
        if (subType)
            return subType;
    }
    return _wrapped->GetSubElementAddressFromPath(name, start, end, allowDynamic);
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
: WrappedType(typeManager, wrappedType), _elementName(name->Length()) {
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
: WrappedType(typeManager, wrappedType), _name(name->Length()) {
    if (nextOverload) {
        _nextOverload = nextOverload->_nextOverload;
        nextOverload->_nextOverload = this;
    }
    _name.Assign(name->Begin(), name->Length());
    if (name->ComparePrefix(*tsMetaIdPrefix)) {
        _isTemplate = name->ComparePrefix(*tsMetaIdPrefix);
    }
}
//------------------------------------------------------------
// AggregateType
//------------------------------------------------------------
UInt32 AggregateType::_sharedNullsBuffer[kSharedNullsBufferLength];
//------------------------------------------------------------
Int32 AggregateType::SubElementCount()
{
    return _elements.Length();
}
//------------------------------------------------------------
TypeRef AggregateType::GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic)
{
    *end = nullptr;

    // Check for structural attributes
    TypeRef type = TypeCommon::GetSubElementAddressFromPath(path, start, end, allowDynamic);
    if (type)
        return type;

    SubString pathHead;
    SubString pathTail;
    path->SplitString(&pathHead, &pathTail, '.');

    // If the head matches one of the AggregateType's elements, add the offset.
    for (ElementTypeRef* pType = _elements.Begin(); pType != _elements.End(); pType++) {
        ElementTypeRef subType = *pType;
        if ((_elements.Length() == 1) && (subType->_elementName.Length() == 0) && pathTail.Length()) {
            // Simple cluster wrappers have only one element, and that element has no name.
            // skip past cluster and look for the tail inside what it wraps.
            return subType->GetSubElementAddressFromPath(path, *end, end, allowDynamic);
        } else if ( pathHead.Compare(subType->_elementName.Begin(), subType->_elementName.Length()) ) {
            *end = (AQBlock1*)start + (subType->ElementOffset());

            // If there is a tail recurse, repin start and recurse.
            if (pathTail.Length()) {
                return subType->GetSubElementAddressFromPath(&pathTail, *end, end, allowDynamic);
            } else {
                return subType;
            }
        }
    }

    return nullptr;
}
//------------------------------------------------------------
TypeRef AggregateType::GetSubElement(Int32 index)
{
    if (index < 0 || index >= _elements.Length())
        return nullptr;  // element does not exist
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
: TypeCommon(typeManager) {
    _blockLength = length;
    _isFlat = true;
    _aqAlignment = 0;   // BitBlocks are not addressable, no alignment
    _isValid = true;
    _isBitLevel = true;
    _isTemplate = false;
    _encoding = encoding;

    if (encoding == kEncoding_None && length > 0) {
        // TODO(PaulAustin): revisit in terms of bounded and template
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
    : AggregateType(typeManager, elements, count) {
    Int32   bitLength = 0;
    Boolean isFlat = true;
    Boolean isValid = true;
    Boolean hasCustomValue = false;
    Boolean isTemplateType = false;
    Boolean isVariableSize = false;
    EncodingEnum encoding = kEncoding_None;

    for (ElementTypeRef* pType = _elements.Begin(); pType !=_elements.End(); pType++) {
        ElementTypeRef element = *pType;

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
        isTemplateType |= element->IsTemplate();
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
    _isTemplate = isTemplateType;
    if (_elements.Length() > 1)
        encoding = kEncoding_Cluster;
    _encoding = encoding;
    _pointerType = kPTNotAPointer;

    // TODO(PaulAustin): figure out total bit size and bit offsets
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
    // For example, (Double Int8) is size 16, not 9. Note the padding if added.
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
        // since Clusters are always addressable.
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
: AggregateAlignmentCalculator(tm) {
    // ParamBlock describe a native instruction parameter block.
    // This structure derives from InstructionCore and at minimum
    // includes a function pointer.
    _aqOffset = sizeof(InstructionCore);
}
//------------------------------------------------------------
Int32 ParamBlockAlignmentCalculator::AlignNextElement(TypeRef element)
{
    static SubString  stad("StaticTypeAndData");
    static SubString  etad("EnumTypeAndData");

    Int32 elementOffset = _aqOffset;
    IsValid &= element->IsValid();
    if (element->IsA(&stad) || element->IsA(&etad)) {
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
    : AggregateType(typeManager, elements, count) {
    Boolean hasCustomValue = false;
    Boolean isTemplateType = false;
    EncodingEnum encoding = kEncoding_None;
    Boolean isBitLevel = false;

    ClusterAlignmentCalculator alignmentCalculator(this->TheTypeManager());

    for (ElementTypeRef *pType = _elements.Begin(); pType != _elements.End(); pType++) {
        ElementTypeRef element = *pType;

#ifdef VIREO_USING_ASSERTS
        Int32 offset = alignmentCalculator.AlignNextElement(element);
        VIREO_ASSERT(element->_offset == offset);
#else
        alignmentCalculator.AlignNextElement(element);
#endif

        hasCustomValue |= element->HasCustomDefault();
        isTemplateType |= element->IsTemplate();
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
    _isTemplate = isTemplateType;
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
        for (ElementTypeRef *pType = _elements.Begin(); pType != _elements.End(); pType++) {
            AQBlock1* pEltData = ((AQBlock1*)pData) + (*pType)->_offset;

            if (!(*pType)->IsFlat() && (*pType)->IsAlias()) {
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
        for (ElementTypeRef *pType = _elements.Begin(); pType != _elements.End(); pType++) {
            AQBlock1* pEltData = ((AQBlock1*)pData) + (*pType)->_offset;
            // If the element is an input or output in a subVI call, the calling VI will clear
            // the data this is an alias to. For In/Out types this is normally zeroed out as
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
        for (ElementTypeRef *pType = _elements.Begin(); pType != _elements.End(); pType++) {
            // TODO(PaulAustin): errors
            Int32 offset = (*pType)->_offset;
            (*pType)->CopyData((((AQBlock1*)pData) + offset), (((AQBlock1*)pDataCopy) + offset));
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
        return nullptr;
    }
}
//------------------------------------------------------------
ClusterType::~ClusterType()
{
    if (_pDefault && (_pDefault != _sharedNullsBuffer)) {
        // Any non flat elements should have been cleared by this point,
        // however the underlying block still needs to be released.
        TheTypeManager()->Free(_pDefault);
        _pDefault = nullptr;
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
    : AggregateType(typeManager, elements, count) {
    // To be equivalence they must be flat and same bit or AQ Size
    Boolean isFlat = true;
    Int32 alignment = 0;
    Int32 aqCount = 0;
    EncodingEnum encoding = kEncoding_None;
    Boolean isValid = true;

    if (_elements.Length() > 0) {
        TypeRef element = _elements[0];
        isFlat = element->IsFlat();
        alignment = element->AQAlignment();
        aqCount = element->TopAQSize();
        // First element of Equivalence block defines encoding
        encoding = element->BitEncoding();
        isValid = element->IsValid();

        // TODO(PaulAustin): make sure all are like this one
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
    return nullptr;
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
    : WrappedType(typeManager, elementType) {
    _topAQSize = TheTypeManager()->HostPointerToAQSize();
    _aqAlignment = TheTypeManager()->AQAlignment(sizeof(void*));
    _rank = rank;
    _isFlat = false;  // TODO(PaulAustin): allow fixed / bounded arrays may be inlined
    _encoding = kEncoding_Array;
    _isBitLevel = false;
    _hasCustomDefault = false;
    _isTemplate = _wrapped->IsTemplate();

    memcpy(_dimensionLengths, dimensionLengths, rank * sizeof(IntIndex));

    IntIndexItr iDim(DimensionLengths(), Rank());
    while (iDim.HasNext()) {
        if (IsTemplateDim(iDim.Read())) {
            _isTemplate |= true;
            break;
        }
    }
}
//------------------------------------------------------------
NIError ArrayType::InitData(void* pData, TypeRef pattern)
{
    NIError err = kNIError_Success;

    TypedArrayCoreRef *pArray = (TypedArrayCoreRef*)pData;
    // Initialize the handle at pData to be a valid handle to an empty array
    // Note that if the type being inited was a named type the name will have been  peeled off
    // When it gets to this point.
    if (*pArray != nullptr) {
        // TODO(PaulAustin): for fixed arrays and ZDAs this not correct
        err = (*pArray)->Resize1D(0) ? kNIError_Success : kNIError_kInsufficientResources;
    } else {
        if (pattern == nullptr) {
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
// if target is nullptr, allocate handle.
NIError ArrayType::CopyData(const void* pData, void* pDataCopy)
{
    NIError err = kNIError_Success;
    TypedArrayCoreRef pSource = *((TypedArrayCoreRef*)pData);
    TypedArrayCoreRef pDest = *((TypedArrayCoreRef*)pDataCopy);

    if (pSource == nullptr) {
        if (pDest == nullptr) {
            return kNIError_Success;
        }
    }

    TypeRef elementType = pSource->ElementType();
    TypeRef elementTypeDest = pDest->ElementType();

    // If the destination element type pattern is generic then
    // the actual element type needs to adapt if there is a change.
    if (elementTypeDest != elementType && (elementTypeDest->BitEncoding() == kEncoding_Generic)) {
        pDest->SetElementType(elementType, false);
    }

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
    if (array != nullptr) {
        *((TypedArrayCoreRef*)pData) = nullptr;
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
        if (_pDefault == nullptr) {
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
        return _pDefault ? &_pDefault : nullptr;
    } else {
        return nullptr;
    }
}
//------------------------------------------------------------
TypeRef ArrayType::GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic)
{
    TypedArrayCoreRef array = *(TypedArrayCoreRef*)start;
    TypeRef subType = nullptr;
    *end = nullptr;

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
        TypeRef type = TypeCommon::GetSubElementAddressFromPath(path, start, end, allowDynamic);
        if (type)
            return type;

        // Check DynamicType, element Type, perhaps dynamic type is not possible?
        // it is if allow dynamic is true, byt where to store it?

        // Split the path into a head & tail
        SubString pathHead;
        SubString pathTail;
        path->SplitString(&pathHead, &pathTail, '.');
        *end = nullptr;

        // may allow end point relative as well ???
        if (allowDynamic) {  // Variable sized arrays can only be indexed if allowDynamic is true.
            IntMax index = 0;
            if (pathHead.ReadInt(&index) && index >= 0 && index < array->Length()) {
                ArrayDimensionVector dimIndex;
                IntIndex rank = array->Rank(), dim = 0;
                if (pathHead.SplitString(nullptr, &pathHead, ',')) {
                    dimIndex[rank-1 - dim++] = IntIndex(index);
                    while (dim < rank && pathHead.ReadInt(&index)) {
                        dimIndex[rank-1 - dim++] = IntIndex(index);
                        if (!pathHead.SplitString(nullptr, &pathHead, ','))
                            break;
                    }
                    while (dim < rank)
                        dimIndex[rank-1 - dim++] = 0;
                    if (pathHead.Length() == 0) {
                        *end = (AQBlock1*)array->BeginAtND(rank, dimIndex);
                    }
                } else {
                    *end = (AQBlock1*)array->BeginAt(IntIndex(index));
                }
            }
        }
        if (*end) {
            subType = array->ElementType();
            if (pathTail.Length())
                subType = subType->GetSubElementAddressFromPath(&pathTail, *end, end, allowDynamic);
        }
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
    : AggregateType(typeManager, elements, count) {
    Boolean isFlat = true;
    Boolean isTemplateType = false;
    //  Boolean hasVarArg = false;
    // TODO(PaulAustin): look for upto one and only one var arg type

    // The param block describes the structure allocated for a single instruction object
    // For a native function. The size will be base plus the storage needed for pointers
    // to each element.

    ParamBlockAlignmentCalculator alignmentCalculator(this->TheTypeManager());
    for (ElementTypeRef *pType = _elements.Begin(); pType != _elements.End(); pType++) {
        ElementTypeRef element = *pType;

#ifdef VIREO_USING_ASSERTS
        Int32 offset = alignmentCalculator.AlignNextElement(element);
        VIREO_ASSERT(element->_offset == offset);
#else
        alignmentCalculator.AlignNextElement(element);
#endif

        isTemplateType |= element->IsTemplate();
        UsageTypeEnum ute = element->ElementUsageType();
        if (ute == kUsageTypeStatic || ute == kUsageTypeTemp) {
            // static and temp values are owned by the instruction, not the VIs data space
            // and will need extra work to be inited and cleared if they are not flat
            isFlat &= element->IsFlat();
        }
    }
    alignmentCalculator.Finish();

    // Since it is a function, the size is the size of a pointer-to-a-function with that parameter list
    _isValid = alignmentCalculator.IsValid;
    _aqAlignment = alignmentCalculator.AggregateAlignment;
    _topAQSize = alignmentCalculator.AggregateSize;
    _isFlat = isFlat;  // TODO(PaulAustin): always should be false?? param blocks
    _isTemplate = isTemplateType;
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
DefaultValueType* DefaultValueType::New(TypeManagerRef typeManager, TypeRef valuesType, Boolean mutableValue, void* pointerValue)
{
    DefaultValueType* type = TADM_NEW_PLACEMENT_DYNAMIC(DefaultValueType, valuesType)(typeManager, valuesType, mutableValue);

    void** pPointerValue = (void**)type->Begin(kPAInit);
    *pPointerValue = pointerValue;
    return type->FinalizeDVT();
}
//------------------------------------------------------------
DefaultValueType* DefaultValueType::FinalizeDVT()
{
    // Constants can ( e.g. could) be shared but it has to be carefully boot strapped
    // (1) The DefaultValueType object is created. It has storage inlined in the object
    // (2) The storage in the DVT is used as a location for the parser to read in the data
    // (3) Once loaded the type can be finalized and the default value now makes up part of the binary
    // name for the type.
    //
    // Types with mutable defaults (e.g variables) can not be merged.
    // Non flat could be merged, but are not yet. To do so the entire sub-value would have to match.
    // partial matches are not currently allowed since there is not a provision for sharing ownership for sparse
    // sets of data in deeply structured data. The root of the value must own all elements beneath it.
    // That means two arrays of constant strings cannot share strings instances that happen to be the same.

    if (!IsMutableValue() && IsFlat()) {
        // The binary name is not set yet.
        AQBlock1* binaryNameEnd = (AQBlock1*)(this+1) + TopAQSize();
        SubString binaryName((AQBlock1*)&this->_topAQSize, binaryNameEnd);
        return (DefaultValueType*) this->TheTypeManager()->ResolveToUniqueInstance(this,  &binaryName);
    } else {
        // Mutable values (and non flat values for now) are not shared.
        return this;
    }
}
//------------------------------------------------------------
DefaultValueType::DefaultValueType(TypeManagerRef typeManager, TypeRef type, Boolean mutableValue)
: WrappedType(typeManager, type) {
    // Initialize the block where ever it was allocated.
    _hasCustomDefault = true;
    _isMutableValue = mutableValue;
    _ownsDefDefData = true;
    type->InitData(Begin(kPAInit), type);
}
//------------------------------------------------------------
void* DefaultValueType::Begin(PointerAccessEnum mode)
{
    if (!IsMutableValue() && (mode == kPAWrite || mode == kPAReadWrite)) {
        return nullptr;
    }

    // If pointer is needed for initialization, reading, or
    // clearing then its OK.

    // Storage for the value immediately follows the storage used for
    // the C++ object. The amount is determined by
    // DefaultValueType::StructSize when the object was constructed.

    return this + 1;
}
//------------------------------------------------------------
NIError DefaultValueType::InitData(void* pData, TypeRef pattern)
{
    if (!IsFlat() || IsRefnum()) {  // RefNumVals carry their type, which must be initialized
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
: WrappedType(typeManager, type) {
    _opaqueReference = true;  // TODO(spathiwa): This flag only makes a difference in IsA type comparisons;
    // since this is type is only used internally, this is hard to unit test but probably doesn't matter
}
//------------------------------------------------------------
// RefNumValType
//------------------------------------------------------------
RefNumValType* RefNumValType::New(TypeManagerRef typeManager, TypeRef type)
{
    return TADM_NEW_PLACEMENT(RefNumValType)(typeManager, type);
}
//------------------------------------------------------------
RefNumValType::RefNumValType(TypeManagerRef typeManager, TypeRef type)
: WrappedType(typeManager, type) {
    _isFlat = true;
    _hasCustomDefault = true;
    _topAQSize = sizeof(RefNumVal);
    // Override alignment of refnum; default for WrappedType is to take alignment of wrapped type, but we don't store
    // that type directly.
    _aqAlignment = alignof(RefNumVal);
    _encoding = kEncoding_RefNum;
    _opaqueReference = true;
}
NIError RefNumValType::InitData(void* pData, TypeRef pattern) {
    RefNumVal* pRefnumData = (RefNumVal*)pData;

    pRefnumData->SetRefNum(0);
    return kNIError_Success;
}
NIError RefNumValType::CopyData(const void* pData, void* pDataCopy)  {
    ((RefNumVal*)pDataCopy)->SetRefNum(((RefNumVal*)pData)->GetRefNum());
    return kNIError_Success;
}
NIError RefNumValType::ClearData(void* pData) {
    RefNumVal* pRefnumData = (RefNumVal*)pData;
    pRefnumData->SetRefNum(0);
    return kNIError_Success;
}
//------------------------------------------------------------
// EnumType
//------------------------------------------------------------
EnumType* EnumType::New(TypeManagerRef typeManager, TypeRef type)
{
    return TADM_NEW_PLACEMENT(EnumType)(typeManager, type);
}
//------------------------------------------------------------
EnumType::EnumType(TypeManagerRef typeManager, TypeRef type)
: WrappedType(typeManager, type) {
    TypeRef itemType = typeManager->FindType(tsStringArrayType);
    _items = (StringRefArray1D*) StringRefArray1D::New(itemType);
    _encoding = kEncoding_Enum;
}
void EnumType::AddEnumItem(SubString *name) {
    STACK_VAR(String, str);
    str.Value->CopyFromSubString(name);
    _items->Append(str.Value);
}
StringRef EnumType::GetEnumItemName(IntIndex i) {
    if (i >= 0 && i < _items->Length())
        return *_items->BeginAt(i);
    return nullptr;
}
IntIndex EnumType::GetEnumItemCount() {
    return _items ? _items->Length() : 0;
}
EnumType::~EnumType() {
    TypeRef itemType = TheTypeManager()->FindType(tsStringArrayType);
    itemType->ClearData(&_items);
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
: PointerType(typeManager, type) {
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
: WrappedType(typeManager, type) {
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
    VIREO_ASSERT(_pRawBufferBegin == nullptr);
    VIREO_ASSERT(_capacity == 0);

    this->_typeRef = type;
    this->_eltTypeRef = type->GetSubElement(0);

    // Resize it to 0, This will trigger any allocations necessary for fixed or bounded arrays
    ResizeDimensions(0, nullptr, false);
}
//------------------------------------------------------------
void TypedArrayCore::Delete(TypedArrayCoreRef pArray)
{
    VIREO_ASSERT(pArray->_eltTypeRef != nullptr);

    pArray->_eltTypeRef->ClearData(pArray->RawBegin(), pArray->Length());
    pArray->AQFree();
    THREAD_TADM()->Free(pArray);
}
//------------------------------------------------------------
Boolean TypedArrayCore::AQAlloc(IntIndex countBytes)
{
    VIREO_ASSERT(countBytes >= 0)
    VIREO_ASSERT(_pRawBufferBegin == nullptr);

    if (countBytes) {
        _pRawBufferBegin = (AQBlock1*) THREAD_TADM()->Malloc(countBytes);
        if (!_pRawBufferBegin) {
            return false;
        }
    } else {
        _pRawBufferBegin = nullptr;
    }
    return true;
}
//------------------------------------------------------------
Boolean TypedArrayCore::AQRealloc(IntIndex countBytes, IntIndex preserveBytes)
{
    VIREO_ASSERT(countBytes >= 0)
    if (_pRawBufferBegin == nullptr) {
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
            // nonempty-to-empty, free and nullptr out pointers.
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
        _pRawBufferBegin = nullptr;
    }
}
//------------------------------------------------------------
// If the array is a of a generic type then its element type
// can be set dynamically so long as the specified type maintains
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
        // TODO(PaulAustin): Resetting non-ZDA array element type not currently supported
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
    IntIndexItr iDim(DimensionLengths(), Rank());
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
        return DimensionLengths()[i];
    } else {
        return 0;
    }
}
//------------------------------------------------------------

// indexing give a vectors seems natural, but with the threaded snippet
// execution an array of pointers to dimensions is more common.
// so the BeginAtNDIndirect is used instead.
AQBlock1* TypedArrayCore::BeginAtND(Int32 rank, IntIndex* pDimIndexes)
{
    // Ignore extra outer dimension if supplied.
    if (rank > Rank()) {
        // Check extra dims to see if they are 0, if not then it's out of bounds.
        return nullptr;
    }

    AQBlock1 *pElt = RawBegin();
    IntIndex* pDimLength = DimensionLengths();
    IntIndexItr iSlab(SlabLengths(), rank);

    // Find index by calculating dot product of
    // SlabLength vector and dimension index vector.
    // Note that slabs do not need to be packed.
    while (iSlab.HasNext()) {
        IntIndex dim = *pDimIndexes;
        if ((dim < 0) || (dim >= *pDimLength)) {
            return nullptr;
        }
        pElt += dim * iSlab.Read();
        pDimIndexes++;
        pDimLength++;
    }
    return pElt;
}

//------------------------------------------------------------
AQBlock1* TypedArrayCore::BeginAtNDIndirect(Int32 rank, IntIndex* ppDimIndexes[])
{
    // Ignore extra outer dimension if supplied.
    if (rank > Rank()) {
        // Possibly check extra dims to see if they are 0,
        // if not then it's out of bounds.
        return nullptr;
    }

    AQBlock1 *pElt = RawBegin();
    IntIndex* pDimLength = DimensionLengths();
    IntIndexItr iSlab(SlabLengths(), rank);

    // Find index by calculating dot product of
    // SlabLength vector and dimension index vector.
    // Note that slabs do not need to be packed.
    while (iSlab.HasNext()) {
        IntIndex *pDim = *ppDimIndexes;
        IntIndex dim = pDim ? *pDim : 0;
        if ((dim < 0) || (dim >= *pDimLength)) {
            return nullptr;
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
// noInit=true prevents initializing non-flat data when the array is grown.  This is used by Insert, which will move elements
// upward and doesn't want to have to do extra work to deflate these new elements first.
Boolean TypedArrayCore::ResizeDimensions(Int32 rank, IntIndex *dimensionLengths, Boolean preserveElements, Boolean noInit /*=false*/)
{
    Int32 valuesRank = Rank();

    // Three sets of dimension sizes are used in this algorithm:
    //
    // (1) The requested dimension lengths.
    //
    // (2) The underlying type's dimension lengths, which may be variable fixed or bounded.
    //     Requests must be constrained to these specifications.
    //
    // (3) The current actual dimension length of the values.
    //
    // If the requested size contains a variable sentinel the existing value size will be used.
    // If the requested size if bounded (negative) the bounded size will be used.
    // Current actual dimension lengths are regular positive integers, never bounded or variable sentinels.
    //
    //

    IntIndex *pRequestedLengths;
    IntIndex *pTypesLengths = Type()->DimensionLengths();
    IntIndex *pValueLengths = DimensionLengths();
    IntIndex *pSlabLengths = SlabLengths();

    IntIndex slabLength = ElementType()->TopAQSize();
    IntIndex originalLength = Length();

    // Only used if too few dimensions passed in.
    ArrayDimensionVector tempDimensionLengths;

    if (valuesRank <= rank) {
        // If enough dimensions are supplied use them inplace
        pRequestedLengths = dimensionLengths;
    } else {
        // It too few are supplied fill out the remaining in a temporary copy.
        Int32 i = 0;
        Int32 dimsToBeFilledIn = valuesRank - rank;

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
    IntIndex newLength = 1;
    Boolean bOK = true;

    while (iRequestedDim.HasNext()) {
        *pSlabLengths++ = slabLength;
        IntIndex dimLength = iRequestedDim.Read();
        IntIndex typesDimLength = *pTypesLengths;
        IntIndex dimCapactiy = dimLength;

        // Now compare with the type's specifications
        if (typesDimLength >= 0) {
            // Fixed sized overrides request
            if (dimLength > typesDimLength)
                bOK = false;
            dimCapactiy = typesDimLength;
            dimLength = dimCapactiy;
            // TODO(PaulAustin): ignore excessive request or flag as error
        } else if (!IsVariableLengthDim(typesDimLength)) {
            // Capacity is bounded length
            // Length is request, but clipped at bounded length
            dimCapactiy = -typesDimLength;
            if (dimLength > dimCapactiy) {
                 // TODO(PaulAustin): ignore excessive request or clip
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

    // 1. If fewer actual elements are needed, clear the old ones.
    if (newLength < originalLength) {
        ElementType()->ClearData(BeginAt(newLength), (originalLength - newLength));
    }

    // 2. If underlying capacity changes, change that.
    if (bOK && ((!noInit && newCapacity != Capacity()) || (noInit && newCapacity > Capacity()))) {
        VIREO_ASSERT(newLength <= newCapacity);
        bOK = ResizeCapacity(slabLength, Capacity(), newCapacity, (newLength < newCapacity));
    }

    // 3. If more actual elements are needed, initialize the new ones (or all of them if requested)
    // TODO(PaulAustin): honor bOK status.
    if (!preserveElements) {
        ElementType()->InitData(BeginAt(0), newLength);
    } else if ((newLength > originalLength) && !noInit && bOK) {
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
        VIREO_ASSERT(_pRawBufferBegin!= nullptr);
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
//! Make the array match the shape of a reference array.
Boolean TypedArrayCore::ResizeToMatchOrEmpty(TypedArrayCoreRef pReference)
{
    if (Rank() == pReference->Rank()) {
        return ResizeDimensions(Rank(), pReference->DimensionLengths(), true);
    } else {
        return false;
    }
}
//------------------------------------------------------------
//! Resize a vector. If not enough space, make it empty.
Boolean TypedArrayCore::Resize1DOrEmpty(Int32 length)
{
    if (Resize1D(length)) {
        return true;
    }
    Resize1D(0);
    return false;
}
//------------------------------------------------------------
//! Replace elements by copying over existing ones, extend if needed.
NIError TypedArrayCore::Replace1D(IntIndex position, IntIndex count, const void* pSource, Boolean truncate)
{
    NIError err = kNIError_Success;

    if (position == -1) {
        position = Length();
    }

    // Allow resizes for count >= 0
    if (count < 0) {
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
//! Insert space for additional element(s) and optionally copy values in to the new location
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
    if (!Resize1DNoInit(neededLength))
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
    if (pSource != nullptr) {
        // Copy in new elements
        ElementType()->CopyData(pSource, pPosition, count);
    }
    return kNIError_Success;
}
//------------------------------------------------------------
//! Remove a block of elements from a vector.
NIError TypedArrayCore::Remove1D(IntIndex position, IntIndex count)
{
    // TODO(PaulAustin): error check
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

//---------------------------------------------------------------
//! Coerce value to a range. Incoming value is signed.
IntMax ConvertNumericRange(EncodingEnum encoding, Int32 size, IntMax value)
{
    if (encoding == kEncoding_UInt) {
        if (value < 0) {
            value = 0;
        } else {
            IntMax mask = ((IntMax)-1) << (size * 8);
            if (value & mask) {
                value = ~mask;
            }
        }
    } else if (encoding == kEncoding_S2CInt) {
        IntMax mask = ((IntMax)-1) << ((size * 8) - 1);
        if (value >= 0) {
            if (value & mask) {
                value = ~mask;
            }
        } else {
            // If any top bits are not set then the value is too negative.
            if ((value & mask) != mask) {
                value = mask;
            }
        }
    } else {
        value = 0;
    }
    return value;
}
//------------------------------------------------------------
//! Read an integer value from memory converting as necessary.
IntMax ReadIntFromMemory(TypeRef type, void* pData)
{
    Boolean isErr = false;
    IntMax value = 0;
    EncodingEnum encoding = type->BitEncoding();
    Int32 aqSize = type->TopAQSize();
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 0: value = 0;                              break;
                case 4: {
                    Single singleVal = RoundToEven(*(Single*)pData);
                    if (singleVal >= std::numeric_limits<IntMax>::max())
                        // >= is actually correct here because Int64 max isn't representable as a single and rounds up.
                        value = std::numeric_limits<IntMax>::max();
                    else if (singleVal <= std::numeric_limits<IntMax>::min())
                        value =  std::numeric_limits<IntMax>::min();
                    else
                        value = (IntMax)singleVal;
                    break;
                }
                case 8: {
                    Double doubleVal = RoundToEven(*(Double*)pData);
                    if (doubleVal >= std::numeric_limits<IntMax>::max())
                        // >= is actually correct here because Int64 max isn't representable as a double and rounds up.
                        value = std::numeric_limits<IntMax>::max();
                    else if (doubleVal <= std::numeric_limits<IntMax>::min())
                        value =  std::numeric_limits<IntMax>::min();
                    else
                        value = (IntMax)doubleVal;
                    break;
                }
                default: isErr = true;                          break;
            }
            break;
        case kEncoding_S2CInt:
        case kEncoding_DimInt:
            switch (aqSize) {
                case 0: value = 0;                              break;
                case 1: value = *(Int8*)pData;                  break;
                case 2: value = *(Int16*)pData;                 break;
                case 4: value = *(Int32*)pData;                 break;
                case 8: value = *(Int64*)pData;                 break;
                default: isErr = true;                          break;
            }
            break;
        case kEncoding_UInt:
        case kEncoding_Enum:
            // Use unsigned int casts to avoid sign extension
            switch (aqSize) {
                case 0: value = 0;                              break;
                case 1: value = *(UInt8*)pData;                 break;
                case 2: value = *(UInt16*)pData;                break;
                case 4: value = *(UInt32*)pData;                break;
                case 8: value = *(UInt64*)pData;                break;
                default: isErr = true;                          break;
            }
            break;
        case kEncoding_Boolean:
            switch (aqSize) {
                case 0: value = 0;                              break;
                case 1: value = (*(UInt8*)pData) ? 1 : 0;       break;
                default: isErr = true;                          break;
            }
            break;
        case kEncoding_Cluster:
            if (type->IsTimestamp()) {
                Timestamp* t = (Timestamp*) pData;
                value = t->Integer();
            }
            break;
        default:
            isErr = true;
            break;
        }

    if (isErr) {
    //    gPlatform.IO.Printf("(Error \"ReadIntFromMemory encoding:%d aqSize:%d\")\n", (int)encoding, (int)aqSize);
    }

    return value;
}
//------------------------------------------------------------
//! Write an integer value to memory converting as necessary.
NIError WriteIntToMemory(TypeRef type, void* pData, IntMax value)
{
    NIError err = kNIError_Success;
    EncodingEnum encoding = type->BitEncoding();
    Int32 aqSize = type->TopAQSize();
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 4:  *(Single*)pData = (Single)value;       break;
                case 8:  *(Double*)pData = (Double)value;       break;
                default: err = kNIError_kCantEncode;            break;
            }
            break;
        case kEncoding_S2CInt:
        case kEncoding_DimInt:
            switch (aqSize) {
                case 1:  *(Int8*)pData = (Int8)value;          break;
                case 2:  *(Int16*)pData = (Int16)value;         break;
                case 4:  *(Int32*)pData = (Int32)value;         break;
                case 8:  *(Int64*)pData = (Int64)value;         break;
                default: err = kNIError_kCantEncode;            break;
            }
            break;
        case kEncoding_UInt:
        case kEncoding_Enum:
            switch (aqSize) {
                case 1:  *(UInt8*)pData = (Int8)value;         break;
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
//! Read a IEEE754 double value from memory converting as necessary.
Double ReadDoubleFromMemory(TypeRef type, const void* pData, NIError* errResult)
{
    NIError err = kNIError_Success;
    Double value = 0.0;
    EncodingEnum encoding = type->BitEncoding();
    Int32 aqSize = type->TopAQSize();
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 4:  value = *(Single*)pData;           break;
                case 8:  value = *(Double*)pData;           break;
                default: err = kNIError_kCantDecode;        break;
            }
            break;
        case kEncoding_S2CInt:
        case kEncoding_DimInt:
            switch (aqSize) {
                case 1:  value = *(Int8*)pData;                       break;
                case 2:  value = *(Int16*)pData;                      break;
                case 4:  value = *(Int32*)pData;                      break;
                case 8:  value = static_cast<Double>(*(Int64*)pData); break;
                default: err = kNIError_kCantDecode;                  break;
            }
            break;
        case kEncoding_UInt:
        case kEncoding_Enum:
        case kEncoding_RefNum:
            switch (aqSize) {
                case 1:  value = *(UInt8*)pData;                       break;
                case 2:  value = *(UInt16*)pData;                      break;
                case 4:  value = *(UInt32*)pData;                      break;
                case 8:  value = static_cast<Double>(*(UInt64*)pData); break;
                default: err = kNIError_kCantDecode;                   break;
            }
            break;
        case kEncoding_Boolean:
            switch (aqSize) {
                case 1:  value = (*(UInt8*)pData) ? 1.0 : 0.0; break;
                default: err = kNIError_kCantDecode;           break;
            }
            break;
        case kEncoding_Cluster:
            if (type->IsTimestamp()) {
              Timestamp* t = (Timestamp*) pData;
              value = t->ToDouble();
            } else {
                err = kNIError_kCantDecode;
            }
            break;
        default:
            err = kNIError_kCantDecode;
            break;
    }

    if (err != kNIError_Success) {
        gPlatform.IO.Printf("(Error \"ReadDoubleFromMemory encoding:%d aqSize:%d\")\n", (int)encoding, (int)aqSize);
    }

    if (errResult != nullptr) {
        *errResult = err;
    }

    return value;
}
//------------------------------------------------------------
//! Write a IEEE754 double value to memory converting as necessary.
NIError WriteDoubleToMemory(TypeRef type, void* pData, const Double value)
{
    NIError err = kNIError_Success;
    EncodingEnum encoding = type->BitEncoding();
    Int32 aqSize = type->TopAQSize();
    switch (encoding) {
        case kEncoding_IEEE754Binary:
            switch (aqSize) {
                case 4:  *(Single*)pData = (Single)value;   break;
                case 8:  *(Double*)pData = (Double)value;   break;
                default: err = kNIError_kCantEncode;        break;
            }
            break;
        case kEncoding_S2CInt:
        case kEncoding_DimInt:
            switch (aqSize) {
                case 1:  *(Int8*)pData = (Int8)value;      break;
                case 2:  *(Int16*)pData = (Int16)value;     break;
                case 4:  *(Int32*)pData = (Int32)value;     break;
                case 8:  *(Int64*)pData = (Int64)value;     break;
                default: err = kNIError_kCantEncode;        break;
            }
            break;
        case kEncoding_UInt:
        case kEncoding_Enum:
        case kEncoding_RefNum:
            switch (aqSize) {
                case 1:  *(UInt8*)pData = (Int8)value;     break;
                case 2:  *(UInt16*)pData = (UInt16)value;   break;
                case 4:  *(UInt32*)pData = (UInt32)value;   break;
                case 8:  *(UInt64*)pData = (UInt64)value;   break;
                default: err = kNIError_kCantEncode;        break;
            }
            break;
        case kEncoding_Boolean:
            switch (aqSize) {
                // Beware that anything that's not exactly 0.0 will be true
                case 1:  *(UInt8*)pData = value != 0.0 ? 1 : 0;  break;
                default: err = kNIError_kCantEncode;             break;
            }
            break;
        case kEncoding_Cluster:
            if (type->IsTimestamp()) {
                Timestamp* t = (Timestamp*) pData;
                *t = Timestamp(value);
            } else {
                err = kNIError_kCantEncode;
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
// TypedAndDataManager native functions
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE1(TypeManagerCurrentTypeManager, TypeManagerRef)
{
    _Param(0) = THREAD_TADM();
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeManagerBaseTypeManager, TypeManagerRef, TypeManagerRef)
{
    if (_Param(0)) {
        _Param(1) = _Param(0)->BaseTypeManager();
    } else {
        _Param(1) = nullptr;
    }
    return _NextInstruction();
}
//------------------------------------------------------------
struct AllocationStatistics {
    Int64   _totalAllocations;
    Int64   _totalAllocated;
    Int64   _maxAllocated;
};
#define AllocationStatistics_TypeString "c(e(Int64 totalAllocations) e(Int64 totalAllocated) e(Int64 maxAllocated) )"

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
VIREO_FUNCTION_SIGNATURE2(TypeOf, TypeRef, TypeRef)
{
    // TODO(PaulAustin): Using the static StaticTypeAndData may cause the the
    // parameter to allocate a default value if one does not already exist
    // in corner cases such as very large array types.
    // This function does not need the value
    // so perhaps a StaticType argument type is in order.

    // Return the static type.
    TypeRef staticType = (TypeRef)_ParamPointer(0);
    _Param(1) = staticType;
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
VIREO_FUNCTION_SIGNATURE2(TypeElementName, TypeRef, StringRef)
{
    TypeRef t = _Param(0);
    SubString elementName = t->ElementName();
    _Param(1)->CopyFromSubString(&elementName);
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(TypeName, TypeRef, StringRef)
{
    TypeRef t = _Param(0);
    SubString name = t->Name();
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
struct TypeMakeClusterTypeParamBlock : public VarArgInstruction
{
    _ParamDef(TypeManagerRef, tm);
    _ParamDef(TypeRef, computedType);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};
#endif

#if defined(VIREO_TYPE_VARIANT)
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE5(TypeManagerObtainValueType, TypeManagerRef, StringRef, TypeRef, Boolean, TypeRef)
{
    TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
    SubString valueName = _Param(1)->MakeSubStringAlias();
    TypeRef type = _Param(2);
    Boolean bCreateIfNotFound = _ParamPointer(3) ? _Param(3) : false;

    TypeRef valueType = nullptr;
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

//------------------------------------------------------------
//! Parse through a path from a starting point to target subelement, return subelement type.
VIREO_FUNCTION_SIGNATURE4(TypeGetSubElementFromPath, StaticType, void, StringRef, TypeRef)
{
    TypeRef type = _ParamPointer(0);
    void* pValue = _ParamPointer(1);
    SubString path = _Param(2)->MakeSubStringAlias();

    void* pTargetValue;

    TypeRef targetType = type->GetSubElementAddressFromPath(&path, pValue, &pTargetValue, true);
    _Param(3) = targetType;
  //  TypeManagerRef tm = _ParamPointer(0) ? _Param(0) : THREAD_TADM();
  //  tm->PointerToSymbolPath(_Param(1), _Param(2), _Param(3));
    return _NextInstruction();
}
//------------------------------------------------------------
//! Parse through a path from a starting point to target subelement, return subelement value if it matches expected output type.
VIREO_FUNCTION_SIGNATURE5(GetSubElementFromPath, StaticType, void, StringRef, StaticType, void)
{
    TypeRef type = _ParamPointer(0);
    void* pValue = _ParamPointer(1);
    SubString path = _Param(2)->MakeSubStringAlias();
    void* pTargetValue = nullptr;

    TypeRef targetType = type->GetSubElementAddressFromPath(&path, pValue, &pTargetValue, true);
    if (pTargetValue && targetType && targetType->CompareType(_ParamPointer(3)))
        _ParamPointer(3)->CopyData(pTargetValue, _ParamPointer(4));
    else
        _ParamPointer(3)->InitData(_ParamPointer(4));
    return _NextInstruction();
}

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
    } else if (BaseTypeManager()) {
        return BaseTypeManager()->FindCustomPointerTypeFromValue(pointer, cName);
    } else {
        return BadType();
    }
}

class TypeRefDumpVisitor : public TypeVisitor
{
 public:
    TypeRefDumpVisitor() { }

 private:
    virtual void VisitBad(TypeRef type) { gPlatform.IO.Printf("<bad> "); }
    virtual void VisitBitBlock(BitBlockType* type) { gPlatform.IO.Printf("<bitblock> "); }
    virtual void VisitBitCluster(BitClusterType* type) { gPlatform.IO.Printf("<bitcluster> "); }
    virtual void VisitCluster(ClusterType* type) { gPlatform.IO.Printf("<cluster> "); }
    virtual void VisitParamBlock(ParamBlockType* type) {
        gPlatform.IO.Printf("(");
        int i = 0, n = type->SubElementCount();
        while (i < n) { type->GetSubElement(i)->Accept(this); ++i; }
        gPlatform.IO.Printf(")");
    }
    virtual void VisitEquivalence(EquivalenceType* type) { gPlatform.IO.Printf("<eq> "); }
    virtual void VisitArray(ArrayType* type) { gPlatform.IO.Printf("<array> "); }
    virtual void VisitElement(ElementType* type) { gPlatform.IO.Printf(""); type->BaseType()->Accept(this); }
    virtual void VisitNamed(NamedType* type) {}  // gPlatform.IO.Printf("<.%s>", &type->Name()); // type->BaseType()->Accept(this); gPlatform.IO.Printf(">"); }
    virtual void VisitPointer(PointerType* type) { gPlatform.IO.Printf(""); type->BaseType()->Accept(this); }
    virtual void VisitRefNumVal(RefNumValType* type) { gPlatform.IO.Printf("<rn> "); type->BaseType()->Accept(this); }
    virtual void VisitEnum(EnumType* type) { gPlatform.IO.Printf("<enum> "); type->BaseType()->Accept(this); }
    virtual void VisitDefaultValue(DefaultValueType* type)  { gPlatform.IO.Printf("<dv> "); }
    virtual void VisitDefaultPointer(DefaultPointerType* type) { gPlatform.IO.Printf("<defptr> "); }
    virtual void VisitCustomDataProc(CustomDataProcType* type) { gPlatform.IO.Printf("<customproc> "); }
};

//------------------------------------------------------------
//! Dump the primitive dictionary (debugging)
void TypeManager::DumpPrimitiveDictionary()
{
    std::map<void*, CPrimtitiveInfo>::iterator iter = _cPrimitiveDictionary.begin();
    TypeRefDumpVisitor tdv;
    while (iter != _cPrimitiveDictionary.end()) {
        CPrimtitiveInfo cpi = iter->second;
        gPlatform.IO.Printf("VIREO PRIM: %s", cpi._cName);
        cpi._type->BaseType()->Accept(&tdv);
        gPlatform.IO.Printf("\n");
        ++iter;
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
    // TODO(PaulAustin):
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
        _Param(1) = nullptr;
    } else {
        TypeRef t = THREAD_TADM()->FindCustomPointerTypeFromValue((void*)pInstruction->_function, &cName);
        t = t->GetSubElement(0);
        Int32 size = t->TopAQSize();
        _Param(1) = (InstructionCore*) ((UInt8*)pInstruction + size);
    }
    return _NextInstruction();
}
#endif
}  // namespace Vireo

//------------------------------------------------------------
// Most of the TypeManager knows nothing of the TDCodecVia
// of the type definer, but definitions cannot be parsed without them

#include "TypeDefiner.h"

namespace Vireo {
//------------------------------------------------------------
TypeManagerRef TypeManager::New(TypeManagerRef parentTADM)
{
    // Bootstrap the TADM, get memory, construct it, make it responsible for its memory
    TypeManagerRef newTADM = (TypeManagerRef) gPlatform.Mem.Malloc(sizeof(TypeManager));
    new (newTADM) TypeManager(parentTADM);
    newTADM->TrackAllocation(newTADM, sizeof(TypeManager), true);

    {
        // Set it up as the active scope, allocations will now go through this TADM.
        TypeManagerScope scope(newTADM);

        if (!parentTADM) {
            // In the beginning... creating a new universe, add some core types.
            TypeDefiner::DefineStandardTypes(newTADM);
            TypeDefiner::DefineTypes(newTADM);
            ExecutionContextRef exec = TADM_NEW_PLACEMENT(ExecutionContext)();
            newTADM->SetExecutionContext(exec);
        }

        // Once standard types have been loaded an execution context can be constructed
        return newTADM;
    }
}

DEFINE_VIREO_BEGIN(TypeManager)

#if defined(VIREO_TYPE_Double)
    DEFINE_VIREO_REQUIRE(IEEE754Math)
#endif

    DEFINE_VIREO_TYPE(TypeManager, "DataPointer");

#if defined(VIREO_TYPE_Double)
    DEFINE_VIREO_FUNCTION_CUSTOM(TypeManagerReadValue, TypeManagerReadValueDouble, "p(i(TypeManager) i(String) i(String) o(Double))");
    DEFINE_VIREO_FUNCTION_CUSTOM(TypeManagerWriteValue, TypeManagerWriteValueDouble, "p(i(TypeManager) i(String) i(String) i(Double))");
#endif

    DEFINE_VIREO_TYPE(AllocationStatistics, AllocationStatistics_TypeString);
    DEFINE_VIREO_FUNCTION(TypeManagerAllocationStatistics, "p(i(TypeManager) o(AllocationStatistics))");
    DEFINE_VIREO_FUNCTION(TypeManagerCurrentTypeManager, "p(o(TypeManager))");
    DEFINE_VIREO_FUNCTION(TypeManagerBaseTypeManager, "p(i(TypeManager) o(TypeManager))");
    DEFINE_VIREO_FUNCTION(TypeManagerGetTypes, "p(i(TypeManager) o(a(Type *)))");
    DEFINE_VIREO_FUNCTION(TypeManagerDefineType, "p(i(TypeManager) i(String) i(Type))");

#if defined(VIREO_INSTRUCTION_REFLECTION)
    DEFINE_VIREO_FUNCTION(TypeGetSubElementFromPath, "p(i(StaticTypeAndData)i(String)o(Type))");
    DEFINE_VIREO_FUNCTION(GetSubElementFromPath, "p(i(StaticTypeAndData)i(String)o(StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(TypeManagerPointerToSymbolPath, "p(i(TypeManager)i(Type)i(DataPointer)o(String)o(Int32))");
    DEFINE_VIREO_FUNCTION(InstructionType, "p(i(Instruction)o(Type )o(String))");
    DEFINE_VIREO_FUNCTION(InstructionArg, "p(i(Instruction)i(Int32)o(DataPointer))");
    DEFINE_VIREO_FUNCTION(InstructionNext, "p(i(Instruction)o(Instruction))");
#endif

#if defined(VIREO_TYPE_VARIANT)
    DEFINE_VIREO_FUNCTION(TypeManagerObtainValueType, "p(i(TypeManager) i(String) i(Type) i(Boolean) o(Type))");
    DEFINE_VIREO_FUNCTION(TypeSetValue, "p(io(Type) i(StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(TypeGetValue, "p(i(Type) o(StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(TypeWriteValue, "p(i(Type) i(String) o(Type))");
#endif

    DEFINE_VIREO_FUNCTION(TypeOf, "p(i(StaticType) o(Type))");
    DEFINE_VIREO_FUNCTION(TypeTopAQSize, "p(i(Type) o(Int32))");
    DEFINE_VIREO_FUNCTION(TypeAlignment, "p(i(Type) o(Int32))");
    DEFINE_VIREO_FUNCTION(TypeEncoding, "p(i(Type) o(Int32))");
    DEFINE_VIREO_FUNCTION(TypeIsFlat, "p(i(Type) o(Boolean))");
    DEFINE_VIREO_FUNCTION(TypeIsArray, "p(i(Type) o(Boolean))");
    DEFINE_VIREO_FUNCTION(TypeHasCustomDefault, "p(i(Type) o(Boolean))");
    DEFINE_VIREO_FUNCTION(TypeHasPadding, "p(i(Type) o(Boolean))");
    DEFINE_VIREO_FUNCTION(TypeHasGenericType, "p(i(Type) o(Boolean))");
    DEFINE_VIREO_FUNCTION(TypeName, "p(i(Type) o(String))");
    DEFINE_VIREO_FUNCTION(TypeElementName, "p(i(Type) o(String))");
    DEFINE_VIREO_FUNCTION(TypeBaseType, "p(i(Type) o(Type))");
    DEFINE_VIREO_FUNCTION(TypeUsageType, "p(i(Type) o(Int32))");
    DEFINE_VIREO_FUNCTION(TypeSubElementCount, "p(i(Type) o(Int32))");
    DEFINE_VIREO_FUNCTION(TypeGetSubElement, "p(i(Type) i(Int32) o(Type))");

#if defined(VIREO_TYPE_CONSTRUCTION)
    DEFINE_VIREO_FUNCTION(TypeMakeVectorType, "p(i(TypeManager) o(Type) i(Type) i(Int32))");
#endif

DEFINE_VIREO_END()

}  // namespace Vireo


