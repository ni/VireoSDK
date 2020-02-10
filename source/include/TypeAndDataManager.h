// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Tools to define data types, manage their data, and a TypeManager to manage those types.
 */

/*_____        ____    ____
 |   |       /   /   /   /  ====|\
 |   |      /   /   /   /       |X}==================
 |   |     /   /   /   /  ======|/
 |   |    /   /   /   /  ___ __   ________   ________
 |   |   /   /   /   /  /  //_ / /  __   /  /  _    /
 |   |  /   /   /   /  /   /    /  /_/  /  /  / /  /
 |   | /   /   /   /  /  /     /  ____ /  /  / /  /
 |   |/   /   /   /  /  /     /  /____   /  /_/  /
 |_______/   /___/  /__/     /_______/  /_______/SDG
 */

#ifndef TypeAndDataManager_h
#define TypeAndDataManager_h

#define STL_MAP

#include <cstdlib>  // abs()
#include <cmath>
#include <new>       // for new placement
#include <limits>

#ifdef STL_MAP
    #include <map>
#endif

#include "DataTypes.h"
#include "Thread.h"
#include "StringUtilities.h"
#include "Instruction.h"

// Anytime an observable change to the data structures or inline functions descried in the header files is made this
// version should be changed.
#define kVireoABIVersion 2

namespace Vireo
{

class TypeCommon;
class BitBlockType;
class BitClusterType;
class ClusterType;
class BitBlockType;
class ParamBlockType;
class EquivalenceType;
class NamedType;
class ArrayType;
class ElementType;
class PointerType;
class EnumType;
class DefaultValueType;
class DefaultPointerType;
class CustomDataProcType;
class RefNumValType;
class TypeManager;
class ExecutionContext;
class IDataProcs;
class String;

typedef NamedType *NamedTypeRef;
typedef ElementType *ElementTypeRef;
typedef ExecutionContext* ExecutionContextRef;
typedef String *StringRef;
typedef TypeCommon  *TypeRef;
typedef TypeManager *TypeManagerRef;

// StaticType is used for functions the take types determined at load time.
// specifying StaticType for the parameter will result in the instruction holding a TypeCommon*
// Instead of a TypeRef*
typedef TypeCommon StaticType;

//------------------------------------------------------------
//! Names for some cores types.
#define tsInvalidIntrinsicClusterType       ""
#define tsBooleanType       "Boolean"
#define tsJavaScriptStaticRefNumType  "JavaScriptStaticRefNum"
#define tsJavaScriptDynamicRefNumType  "JavaScriptDynamicRefNum"
#define tsInt32Type         "Int32"
#define tsInt64Type         "Int64"
#define tsDoubleType        "Double"
#define tsStringType        "String"
#define tsVariantType       "Variant"
#define tsTypeType          "Type"
#define tsStringArrayType   "StringArray1D"
#define tsWildCard          "*"

//------------------------------------------------------------
class TypedArrayCore;
typedef TypedArrayCore *TypedArrayCoreRef, *TypedObjectRef, TypedBlock;
    // TODO(PaulAustin): get rid of TypedBlock   ->TypeBlock ObjectRef??
typedef TypedBlock *TypedBlockRef;  // TODO(PaulAustin): merge into ArrayCoreRef

template <class T>
class TypedArray1D;

#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // TODO(PaulAustin): Type manager needs single instance global option like that used by execution context.
    #error
    #define THREAD_TADM()  // TBD
#else
    #define THREAD_TADM() TypeManagerScope::Current()
#endif

#define TADM_NEW_PLACEMENT(_class_) new (THREAD_TADM()->Malloc(sizeof(_class_))) _class_
#define TADM_NEW_PLACEMENT_DYNAMIC(_class_, _d_) \
    new (TypeManagerScope::Current()->Malloc(_class_::StructSize(_d_))) _class_

// EncodingEnum defines the base set of encodings that describe the semantics
// of bits in bitblock. Some good background information includes:
// * Integer encodings: https://en.wikipedia.org/wiki/Signed_number_representations
enum EncodingEnum {
    kEncoding_None = 0,

    // Aggregates and References
    kEncoding_Cluster,          // Inlined aggregate of other structures
    kEncoding_ParameterBlock,   // Like cluster except each element is a pointer to the sub type
    kEncoding_Array,            // Inline or reference to array of a sub stype
    kEncoding_Generic,          // Open, place-holder definition used for genetic types
    kEncoding_Stream,           // TBD Like array but can't assume random access

    // Bitblock encodings
    kEncoding_Boolean,
    kEncoding_Enum,             // TBD
    kEncoding_UInt,             // Simple non negative whole numbers
    kEncoding_S2CInt,           // Signed 2s complement integer (AKA signed)
    kEncoding_DimInt,           // Like S2CInt, also includes variable and sentinels ($n, *)
    kEncoding_IEEE754Binary,    // https://en.wikipedia.org/wiki/IEEE_floating_point
    kEncoding_Ascii,            // 7-BIT Ascii
    kEncoding_Unicode,          // UTF-8, UTF-16, UTF-32 based on block size
    kEncoding_Pointer,          // platform specific data memory address
    kEncoding_Q,                // 0.bbb fixed point
    kEncoding_Q1,               // 1.bbb fixed point
    kEncoding_BiasedInt,        // Used for IEEE754 exponents
    kEncoding_ZigZagInt,        // Protocol buffers
    kEncoding_S1CInt,           // In case we ever run on a CDC 170 Cyber mainframe ;)
    kEncoding_RefNum,           // LV-style refnum, holds type and Int value
    kEncoding_Variant,           // Variant (holds data and attributes)

    kEncodingBitFieldSize = 5,  // Room for up to 32 primitive encoding types
};

// UsageTypeEnum defines how parameters in a native instruction or VIs ParamBlock will be used.
// Note, kUsageTypeInput..kUsageTypeAlias are all forms of alias'
enum UsageTypeEnum {
    kUsageTypeSimple = 0,       // Default for clusters, code assumed to read/write at will,
                                //  (not allowed in ParamBlock)
    kUsageTypeInput = 1,        // Caller copies in value, VI will not change it.
    kUsageTypeOutput = 2,       // Caller provides storage(if array) VI sets value, ignores incoming value
    kUsageTypeInputOutput = 3,  // Like output, but VI uses initial value.
    kUsageTypeAlias = 4,        // Non flat value that that is owned by by another element.
    kUsageTypeStatic = 5,       // Allocated value persists from call to call
    kUsageTypeTemp = 6,         // Storage typically carried from call to call but can be freed up.
    kUsageTypeConst = 7,        // Constant cluster elements; VI cannot write.
};

//! PointerTypeEnum defines the type of internal pointer stored in DefaultPointer type.
enum PointerTypeEnum {
    kPTNotAPointer = 0,
    kPTInstructionFunction,
    kPTGenericFunctionCodeGen,
    kPTTypeManager,
};

//! PointerAccessEnum defines how a pointer to data will be used.
enum PointerAccessEnum {
    kPAInit = 0,                // for object construction
    kPARead = 1,                // for read only operations (some constants allocate on demand)
    kPAWrite = 2,               // for write with no care about previous value
    kPAReadWrite = 3,           // for read or write with
    kPAClear = 4,               // for object destruction
    kPASoftRead = 5,            // for read, but only if it exists. Will not trigger allocation.
};

//------------------------------------------------------------
// When an instruction has a StaticTypeAndData parameter there will be two
// pointers. Instructions that take a VarArg set of StaticTypeAndData arguments
// can treat the block of pointer-pairs as an array of this type.
struct StaticTypeAndData
{
    TypeRef  _paramType;
    void*    _pData;
};
typedef StaticTypeAndData* StaticTypeAndDataRef;

#ifdef STL_MAP
#else
class DictionaryElt
{
 public:
    SubString   first;
    TypeRef     second;
};
//------------------------------------------------------------
// Dictionary a bit more hardcoded than map for smaller worlds
class SimpleDictionary
{
 public:
    void clear() { }
    DictionaryElt* begin() { return nullptr; }
    DictionaryElt* end() { return nullptr; }
    DictionaryElt* find(const SubString& value) { return nullptr; }
    TypeRef& operator[] (const SubString& k) { return _t; }
    Int32 size() { return nullptr; }

 private:
    TypeRef _t;
};
#endif

inline IntIndex Min(IntIndex a, IntIndex b) { return a < b ? a : b; }
inline IntIndex Max(IntIndex a, IntIndex b) { return a > b ? a : b; }

//------------------------------------------------------------
//! Keeps track of Types used within a ExecutionContext.
class TypeManager
{
 public:
    //! Create a Execution and Typemanager pair.
    static TypeManagerRef New(TypeManagerRef parentTADM);
    void Delete();

 private:
    TypeManagerRef      _baseTypeManager;   // Base is nullptr when the instance is a root.
    ExecutionContextRef _executionContext;
#ifdef STL_MAP
    typedef std::map<SubString, NamedTypeRef, CompareSubString>::iterator  TypeDictionaryIterator;
    std::map<SubString, NamedTypeRef, CompareSubString>  _typeNameDictionary;
    std::map<SubString, TypeRef, CompareSubString>  _typeInstanceDictionary;
#else
    typedef DictionaryElt* TypeDictionaryIterator;
    SimpleDictionary    _typeNameDictionary;
#endif

#if defined(VIREO_INSTRUCTION_REFLECTION)
    struct CPrimtitiveInfo {
        TypeRef _type;
        ConstCStr _cName;
    };
    std::map<void*, CPrimtitiveInfo>  _cPrimitiveDictionary;
#endif

    Int32   _aqBitLength;
    MUTEX_CLASS_MEMBER
    TypeRef _badType;
    TypeRef _typeList;                  // List of all Types allocated by this TypeManager

    friend class TDViaParser;

    // TODO(PaulAustin): The manager needs to define the Addressable Quantum size (bit in an addressable item, often a octet
    // but some times it is larger (e.g. 16 or 32) the CDC 7600 was 60
    // also defines alignment rules. Each element in a cluster is addressable
 private:
    explicit TypeManager(TypeManagerRef parentTm);
    NamedTypeRef NewNamedType(const SubString* typeName, TypeRef type, NamedTypeRef existingOverload);
 public:
    ExecutionContextRef TheExecutionContext() const { return _executionContext; }
    void    SetExecutionContext(ExecutionContextRef exec) { _executionContext = exec; }
    void    DeleteTypes(Boolean finalTime);
    void    TrackType(TypeCommon* type);
    TypeRef ResolveToUniqueInstance(TypeRef type, SubString *binaryName);

    void    UntrackLastType(TypeCommon* type);
    void    GetTypes(TypedArray1D<TypeRef>*);
    TypeRef TypeList() const { return _typeList; }
    void    PrintMemoryStat(ConstCStr, Boolean bLast) const;

    TypeManagerRef BaseTypeManager() const { return _baseTypeManager; }
    TypeRef Define(const SubString* typeName, TypeRef type);

    TypeRef FindType(ConstCStr name);
    TypeRef FindType(const SubString* name, Boolean decode = false);
    NamedTypeRef FindTypeCore(const SubString* name, Boolean decode = false);
    TypeRef BadType() const;

    static Int32   AQAlignment(Int32 size);
    static Int32   AlignAQOffset(Int32 offset, Int32 size) {
        if (size != 0) {
            Int32 remainder  = offset % size;
            if (remainder)
                offset += size - remainder;
        }
        return offset;
    }

    Int32   BitLengthToAQSize(IntIndex length) const;
    static Int32   HostPointerToAQSize() { return sizeof(void*); }
    Int32   AQBitLength() const { return _aqBitLength; }

    //! Parse through a path, digging through Aggregate element names, references and array indexes.
    TypeRef GetObjectElementAddressFromPath(SubString* objectName, SubString* path, void** ppData,
                                            Boolean allowDynamic);
#if defined (VIREO_INSTRUCTION_REFLECTION)
    TypeRef DefineCustomPointerTypeWithValue(ConstCStr name, void* pointer, TypeRef typeRef,
                                             PointerTypeEnum pointerType, ConstCStr cName);
    TypeRef FindCustomPointerTypeFromValue(void*, SubString *cName);
    TypeRef PointerToSymbolPath(TypeRef t, DataPointer p, StringRef path, Boolean* foundInVI = nullptr);
    Boolean PointerToTypeConstRefName(TypeRef*, SubString* name);
    void DumpPrimitiveDictionary();
#else
    TypeRef DefineCustomPointerTypeWithValue(ConstCStr name, void* pointer, TypeRef type, PointerTypeEnum pointerType);
#endif
    TypeRef DefineCustomDataProcs(ConstCStr name, IDataProcs* pDataProcs, TypeRef typeRef);

    // Low level allocation functions
    // TODO(PaulAustin): pull out into its own class.
    void* Malloc(size_t countAQ);
    void* Realloc(void* pBuffer, size_t countAQ, size_t preserveAQ);
    void Free(void* pBuffer);

    Boolean AllocationPermitted(size_t countAQ);
    void TrackAllocation(void* id, size_t countAQ, Boolean bAlloc);

    Int32  _totalAllocations;
    Int32  _totalAllocationFailures;
    size_t _totalAQAllocated;
    size_t _maxAllocated;
    size_t _allocationLimit;

    size_t TotalAQAllocated() const { return _totalAQAllocated; }
    Int32 TotalAllocations() const { return _totalAllocations; }
    size_t MaxAllocated() const { return _maxAllocated; }

    // Read or write values accessible to this TM as described by a symbolic path
    NIError ReadValue(SubString* objectName, SubString* path, Double * pValue);
    NIError WriteValue(SubString* objectName, SubString* path, Double value);
    NIError ReadValue(SubString* objectName, SubString* path, StringRef);
    NIError WriteValue(SubString* objectName, SubString* path, SubString*);

#ifdef VIREO_PERF_COUNTERS
    Int32 _typesShared;
#endif
};

//------------------------------------------------------------
// Utility functions to read and write numbers to non aligned memory based on size and encoding
IntMax ReadIntFromMemory(TypeRef type, void* pData);
NIError WriteIntToMemory(TypeRef type, void* pData, IntMax value);
Double ReadDoubleFromMemory(TypeRef type, const void* pData, NIError* errResult = nullptr);
NIError WriteDoubleToMemory(TypeRef type, void* pData, Double value);
IntMax ConvertNumericRange(EncodingEnum encoding, Int32 size, IntMax value);
//------------------------------------------------------------
//! Banker's rounding for Doubles.
inline Double RoundToEven(Double value)
{
    return rint(value);
}
//------------------------------------------------------------
//! Banker's rounding for Singles.
inline EMSCRIPTEN_NOOPT Single RoundToEven(Single value)
{
#if kVireoOS_emscripten
    return rint((Double)value);
#else
    return rintf(value);
#endif
}

template <typename TSource, typename TDest>
TDest ConvertFloatToInt(TSource src)
{
    TDest dest;
    if (std::isnan(src)) {
        dest = std::numeric_limits<TDest>::max();
    } else if (std::isinf(src)) {
        dest = src < 0 ? std::numeric_limits<TDest>::min() : std::numeric_limits<TDest>::max();
    } else if (src < std::numeric_limits<TDest>::min()) {
        dest = std::numeric_limits<TDest>::min();
    } else if (src > std::numeric_limits<TDest>::max()) {
        dest = std::numeric_limits<TDest>::max();
    } else {
        dest = static_cast<TDest>(RoundToEven(src));
    }
    return dest;
}

//------------------------------------------------------------
//! Stack based class to manage a threads active TypeManager.
class TypeManagerScope
{
#ifndef VIREO_SINGLE_GLOBAL_CONTEXT
 private:
    TypeManagerRef _saveTypeManager;
    VIVM_THREAD_LOCAL static TypeManagerRef ThreadsTypeManager;

 public:
    explicit TypeManagerScope(TypeManagerRef typeManager) {
      _saveTypeManager = ThreadsTypeManager;
      ThreadsTypeManager = typeManager;
    }

    ~TypeManagerScope() {
        ThreadsTypeManager = _saveTypeManager;
    }

    static TypeManagerRef Current() {
        VIREO_ASSERT(TypeManagerScope::ThreadsTypeManager != nullptr);
        return ThreadsTypeManager;
    }
#else
    explicit TypeManagerScope(TypeManagerRef typeManager) {}
    ~TypeManagerScope() = default;
#endif
};

//------------------------------------------------------------
//! A class to help dynamic classes/structures that end with an
// array whose size is set at construction time.
template <class T>
class InlineArray
{
 private:
    IntIndex _length;
    T _array[1];
 public:
    static size_t ExtraStructSize(Int32 count)   { return (count - 1) * sizeof(T); }
    explicit InlineArray(Int32 length)           { _length = length; }
    T* Begin()                                  { return _array; }
    T* End()                                    { return &_array[_length]; }
    void Assign(const T* source, Int32 count)    { memcpy(Begin(), source, count * sizeof(T)); }
    T& operator[] (const Int32 index)            { VIREO_ASSERT(index <= _length); return _array[index]; }
    IntIndex Length() const { return static_cast<IntIndex>(_length); }
};

//------------------------------------------------------------
//! Visitor class for types.
class TypeVisitor
{
 public:
    virtual ~TypeVisitor() = default;
    virtual void VisitBad(TypeRef type) = 0;
    virtual void VisitBitBlock(BitBlockType* type) = 0;
    virtual void VisitBitCluster(BitClusterType* type) = 0;
    virtual void VisitCluster(ClusterType* type) = 0;
    virtual void VisitParamBlock(ParamBlockType* type) = 0;
    virtual void VisitEquivalence(EquivalenceType* type) = 0;
    virtual void VisitArray(ArrayType* type) = 0;
    virtual void VisitElement(ElementType* type) = 0;
    virtual void VisitNamed(NamedType* type) = 0;
    virtual void VisitPointer(PointerType* type) = 0;
    virtual void VisitRefNumVal(RefNumValType* type) = 0;
    virtual void VisitEnum(EnumType* type) = 0;
    virtual void VisitDefaultValue(DefaultValueType* type) = 0;
    virtual void VisitDefaultPointer(DefaultPointerType* type) = 0;
    virtual void VisitCustomDataProc(CustomDataProcType* type) = 0;
};

//------------------------------------------------------------
//! Base class for all type definition types.
class TypeCommon
{
// Core internal methods are for keeping track of Type objects in separate
// TypeManager layers
    friend class TypeManager;
 private:
    TypeRef         _next;              // Linked list of all Types in a TypeManager
    TypeManagerRef  _typeManager;       // TypeManger that owns this type

 public:
    static const SubString TypeInt8;
    static const SubString TypeInt16;
    static const SubString TypeInt32;
    static const SubString TypeInt64;
    static const SubString TypeUInt8;
    static const SubString TypeUInt16;
    static const SubString TypeUInt32;
    static const SubString TypeUInt64;
    static const SubString TypeDouble;
    static const SubString TypeSingle;
    static const SubString TypeBoolean;
    static const SubString TypeString;
    static const SubString TypeVariant;
    static const SubString TypeTimestamp;
    static const SubString TypeComplexSingle;
    static const SubString TypeComplexDouble;
    static const SubString TypeJavaScriptStaticRefNum;
    static const SubString TypeJavaScriptDynamicRefNum;
    static const SubString TypePath;
    static const SubString TypeAnalogWaveform;
    static const SubString TypeStaticTypeAndData;
    static const SubString TypeStaticType;

    explicit TypeCommon(TypeManagerRef typeManager);
    TypeManagerRef TheTypeManager() const { return _typeManager; }
    TypeRef Next() const { return _next; }

    // Internal to the TypeManager, but this is hard to specify in C++
    virtual ~TypeCommon() = default;

 protected:
    /// @name Storage for core property
    /// Members use a common type (UInt16) to maximize packing.

    Int32   _topAQSize;

    // UInt16 bitfield
    UInt16  _rank:8;            // (0-7) 0 for scalar, 0 or greater for arrays room for rank up to 16 (for now
    UInt16  _aqAlignment:8;     // (8-15)

    // UInt16 bitfield
    UInt16  _encoding:kEncodingBitFieldSize;  // (0-4) aggregate or single format
    UInt16  _isFlat:1;          // (5) All data is contained in TopAQ elements ( e.g. no pointers)
    UInt16  _isValid:1;         // (6) Contains no invalid types
    UInt16  _isBitLevel:1;      // (7) Is a bitblock or bitcluster

    UInt16  _hasCustomDefault:1;  // (8) A non 0 non nullptr value
    UInt16  _isMutableValue:1;    // (9) "default" value can be changed after creation.
    UInt16  _isTemplate:1;        // (10) The type contains some generic types
    UInt16  _hasPadding:1;        // (11) To satisfy alignment req. for elements TopAQSize() includes some padding

    //  properties unique to prototype elements. they are never merged up
    UInt16  _elementUsageType:3;  // (12-14) ElementType::UsageType
    UInt16  _isDataItem:1;        // (15) Element keeps track of updatedNeeded state for read/writes

    // UInt16 bitfield
    UInt16  _needsUpdate:1;      // (0) Value has been written, needs display (tested by JS)
    //  properties unique to DefaultPointerType objects
    UInt16  _pointerType:3;       // (1-3)
    UInt16  _ownsDefDefData:1;    // (4) Owns DefaultDefault data (clusters and arrays)
    UInt16  _opaqueReference:1;   // (5) Data is not an instance of the type it wraps or is templated from (e.g. refnum(Queue))

 public:
    /// @name Core Property Methods
    /// Core type properties are stored in each object so they can be directly accessed.

    //! How the data as a whole is encoded, either a simple encoding like "2s complement binary"
    //  or an Aggregate encoding.
    EncodingEnum BitEncoding() const { return static_cast<EncodingEnum>(_encoding); }
    //! Memory alignment required for values of this type.
    Int32   AQAlignment() const { return _aqAlignment; }
    //! Amount of memory needed for the top level data structure for the type including any padding if needed.
    Int32   TopAQSize() const { return _topAQSize; }
    //! True if the initial value for data of this type is not just zeroed out memory.
    Boolean HasCustomDefault() const { return _hasCustomDefault != 0; }
    //! True if the initial value can be changed.
    Boolean IsMutableValue() const { return _isMutableValue != 0; }
    //! Dimensionality of the type. Simple Scalars are Rank 0, arrays can be rank 0 as well.
    Int32   Rank() const { return _rank; }
    //! True if the type is an indexable container that contains another type.
    Boolean IsArray() const { return BitEncoding() == kEncoding_Array; }
    //! True if the type is an indexable container that contains another type.
    Boolean IsZDA() const { return (IsArray() && Rank() == 0); }
    //! True if the type is an aggregate of other types.
    Boolean IsCluster() const { return BitEncoding() == kEncoding_Cluster; }
    //! True if type is an enum
    Boolean IsEnum() const { return BitEncoding() == kEncoding_Enum; }
    //! True if type is an enum
    Boolean IsRefnum() const { return BitEncoding() == kEncoding_RefNum; }
    //! True if data can be copied by a simple block copy.
    Boolean IsFlat() const { return _isFlat != 0; }
    //! True if all types the type is composed of have been resolved to valid types.
    Boolean IsValid() const { return _isValid != 0; }
    //! True if the type a BitBlock or a BitClusters.
    Boolean IsBitLevel() const { return _isBitLevel != 0; }
    //! True if TopAQSize includes internal or external padding necessary for proper alignment of multiple elements.
    Boolean HasPadding() const { return _hasPadding != 0; }
    //! True if the type contains one or more template parameter types.
    Boolean IsTemplate() const { return _isTemplate != 0; }
    //! True if type is a wrapped type that doens't expose its contained type
    Boolean IsOpaqueReference() const { return _opaqueReference != 0; }
    //! True if type is a dataItem (keeps track of needsUpdate state on reads/writes)
    Boolean IsDataItem() const { return _isDataItem != 0; }
    //! True (for data items) if value has been written to by Vireo but not read by JS
    Boolean NeedsUpdate() const { return _needsUpdate != 0; }
    //! Set needsUpdate flag for a data item
    void SetNeedsUpdate(Boolean b) { if (_isDataItem != 0) _needsUpdate = b?1:0; }
    //! True if aggregate element is used as an input parameter.
    Boolean IsInputParam() const
    {
        return (_elementUsageType == kUsageTypeInput) || (_elementUsageType == kUsageTypeInputOutput);
    }
    //! True if aggregate element is used as an output parameter.
    Boolean IsOutputParam() const
    {
        return (_elementUsageType == kUsageTypeOutput) || (_elementUsageType == kUsageTypeInputOutput);
    }
    //! True if aggregate element is owned elsewhere (e.g. its an i ,o ,io, or alias) .
    Boolean IsAlias() const
    {
        return (_elementUsageType >= kUsageTypeInput) && (_elementUsageType <= kUsageTypeAlias);
    }
    //! True if the parameter is only visible to the callee, and is preserved between calls.
    Boolean IsStaticParam() const { return _elementUsageType == kUsageTypeStatic; }
    //! True is the parameter is only visible to the callee, but may be cleared between calls.
    Boolean IsTempParam() const { return _elementUsageType == kUsageTypeTemp; }
    //! True if the parameter is not required. For non flat values nullptr may be passed in.
    static Boolean IsOptionalParam() { return true; }  // TODO(PaulAustin): {return _elementUsageType == kUsageTypeOptionalInput ;}
    UsageTypeEnum ElementUsageType() const { return static_cast<UsageTypeEnum>(_elementUsageType); }
 private:
    //! True if the type owns data that needs to be freed when the TypeManager is cleared.
    Boolean OwnsDefDefData() const { return _ownsDefDefData != 0; }
 public:
    //! What type of internal pointer is this type. Only used for CustomValuePointers.
    PointerTypeEnum PointerType() const { return static_cast<PointerTypeEnum>(_pointerType); }
    //! Accept a TypeVisitor algorithm.
    virtual void    Accept(TypeVisitor *tv)             { tv->VisitBad(this); }
    //! For a wrapped type, return the type that was wrapped, nullptr otherwise.
    virtual TypeRef BaseType()                          { return nullptr; }
    //! How many element in an Aggregate, 0 if the type is not an Aggregate.
    virtual Int32   SubElementCount()                   { return 0; }
    //! Get an element of an Aggregate using it index.
    virtual TypeRef GetSubElement(Int32 index)          { return nullptr; }
    //! Parse through a path, digging through Aggregate element names. Calculates the cumulative offset.
    virtual TypeRef GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic);

    //! Set the SubString to the name if the type is not anonymous.
    virtual SubString Name()                            { return {nullptr, nullptr}; }
    //! Set the SubString to the aggregates elements field name.
    virtual SubString ElementName()                     { return {nullptr, nullptr}; }
    //! Return a pointer to the raw vector of dimension lengths.
    virtual IntIndex* DimensionLengths()                { return nullptr; }

    //! Offset in AQs in the containing aggregate
    virtual IntIndex ElementOffset()                    { return 0; }

    // Methods for working with individual elements
    virtual void*    Begin(PointerAccessEnum mode)      { return nullptr; }

    //! Zero out a buffer that will hold a value of the type without consideration for the existing bits.
    void ZeroOutTop(void* pData) const;
    //! Initialize (re)initialize a value to the default value for the Type. Buffer must be well formed.
    virtual NIError InitData(void* pData, TypeRef pattern = nullptr);
    //! May a deep copy fom the source to the copy.
    virtual NIError CopyData(const void* pData, void* pDataCopy);
    //! Free up any storage and put value to nullptr/zero state.
    virtual NIError ClearData(void* pData);
    virtual StringRef GetEnumItemName(IntIndex index) { return nullptr; }
    virtual IntIndex GetEnumItemCount()              { return 0; }

    //! Initialize a linear block to the default value for the type.
    NIError InitData(void* pTarget, IntIndex count);
    //! Deep copy a linear block of values from one locatio to another.
    NIError CopyData(const void* pSource, void* pDest, IntIndex count);
    //! Deallocate and nullptr out a linear block of value of the type.
    NIError ClearData(void* pTarget, IntIndex count);
    //! Make multiple copies of a single instance to a linear block.
    NIError MultiCopyData(const void* pSource, void* pDest, IntIndex count);

    Boolean CompareType(TypeRef otherType);
    Boolean IsA(const SubString* otherTypeName);
    Boolean IsA(ConstCStr typeNameCstr)                 { SubString typeName(typeNameCstr); return IsA(&typeName); }
    Boolean IsA(TypeRef otherType);
    Boolean IsA(TypeRef otherType, Boolean compatibleStructure);
    Boolean IsStaticTypeWildcard();
    Boolean IsStaticTypeAndDataWildcard();
    Boolean IsNumeric();
    Boolean IsInteger();
    Boolean IsSignedInteger();
    Boolean IsInteger64();
    Boolean IsFloat();
    Boolean IsBoolean();
    Boolean IsString();
    Boolean IsPath();
    Boolean IsTimestamp();
    Boolean IsComplex();
    Boolean IsJavaScriptStaticRefNum();
    Boolean IsJavaScriptDynamicRefNum();
    Boolean IsAnalogWaveform();
    Boolean IsIntrinsicClusterDataType(SubString *foundTypeName);  // Returns true for builtin data types such as Timestamp, Complex, etc
    Boolean IsVariant();
    Boolean IsBadType();

    //! Size of the type in bits including padding. If the type is bit level it's the raw bit size with no padding.
    virtual IntIndex BitLength()  {
        return _topAQSize * _typeManager->AQBitLength(); }  // TODO(PaulAustin): defer to type manager for scale factor
    void Dump(void *pData);  // Debugging aid
};

//------------------------------------------------------------
//! Base class for all type definition types that wrap types with some attribute
class WrappedType : public TypeCommon
{
 protected:
    // The WrappedType class may be followed by arbitrary POD so make sure the
    // the class size will maintain proper alignment.
    union {
        TypeRef _wrapped;
        MaxAlignedType _alignment;
    };
    WrappedType(TypeManagerRef typeManager, TypeRef type);
 public:
    // Type operations
    TypeRef BaseType() override { return _wrapped; }
    Int32   SubElementCount() override { return _wrapped->SubElementCount(); }
    TypeRef GetSubElement(Int32 index) override { return _wrapped->GetSubElement(index); }
    TypeRef GetSubElementAddressFromPath(SubString* name, void *start, void **end, Boolean allowDynamic) override;
    IntIndex BitLength() override { return _wrapped->BitLength(); }
    SubString Name() override { return _wrapped->Name(); }
    IntIndex* DimensionLengths() override { return _wrapped->DimensionLengths(); }
    StringRef GetEnumItemName(IntIndex index) override { return _wrapped->GetEnumItemName(index); }
    IntIndex GetEnumItemCount() override { return _wrapped->GetEnumItemCount(); }

    // Data operations
    void*   Begin(PointerAccessEnum mode) override { return _wrapped->Begin(mode); }

    NIError InitData(void* pData, TypeRef pattern = nullptr) override
    { return _wrapped->InitData(pData, pattern ? pattern : this); }

    NIError CopyData(const void* pData, void* pDataCopy) override { return _wrapped->CopyData(pData, pDataCopy); }
    NIError ClearData(void* pData) override { return _wrapped->ClearData(pData); }
};

// TODO(PaulAustin): forward declarations (this covers asynchronous resolution of sub VIs as well)
// for the most part types are not mutable.
// here might be the exceptions
// 1. if a name is not resolved it can be kept on a short list. when the name is introduced
// the the type tree knows it need to be patched. The node in question replaced the pointer to the bad node to the
// the newly introduced type and marks itself as wasModified = true;
// then the list of type is sweeped and those that refer to modified types re finalize them selves ( fix name?)
// and mark them selves as wasModified. This repeats it self until no nodes are modified.
// the scan is O(n) with a small C for n Types at that level of the type manager and Type Mangers that
// the derive from it.
// 2. for the Named Type node the value may be changed. This does not change the type, only the result of what
// the type->InitValue method does. For a variant type this means the type of the value may change
// but not notion that the value is a variant. A bit tenuous perhaps.


//------------------------------------------------------------
//! Gives a type a name ( .e.g "Int32")
class NamedType : public WrappedType
{
 private:
    NamedTypeRef            _nextOverload;  // May point to one in current or root type manager.
    InlineArray<Utf8Char>   _name;
    NamedType(TypeManagerRef typeManager, const SubString* name, TypeRef wrappedType, NamedTypeRef nextOverload);
 public:
    static size_t   StructSize(const SubString* name)
        { return sizeof(NamedType) + InlineArray<Utf8Char>::ExtraStructSize(name->Length()); }
    static NamedType* New(TypeManagerRef typeManager, const SubString* name, TypeRef wrappedType, NamedTypeRef nextOverload);

    NamedTypeRef    NextOverload() const { return _nextOverload; }
    void    Accept(TypeVisitor *tv) override { tv->VisitNamed(this); }
    SubString Name() override { return {_name.Begin(), _name.End()}; }
    SubString ElementName() override { return {nullptr, nullptr}; }
};
//------------------------------------------------------------
//! Give a type a field name and offset properties. Used inside an aggregateType
class ElementType : public WrappedType
{
 private:
    ElementType(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType,
                UsageTypeEnum usageType, Int32 offset, bool isDataItem);

 public:
    Int32                   _offset;  // Relative to the beginning of the aggregate
    InlineArray<Utf8Char>   _elementName;

 public:
    static size_t   StructSize(SubString* name) {
        return sizeof(ElementType) + InlineArray<Utf8Char>::ExtraStructSize(name->Length());
    }
    static ElementType* New(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType,
                            UsageTypeEnum usageType, Int32 offset, bool isDataItem);

    void    Accept(TypeVisitor *tv) override { tv->VisitElement(this); }
    SubString ElementName() override { return {_elementName.Begin(), _elementName.End()}; }
    IntIndex ElementOffset() override { return _offset; }
};
//------------------------------------------------------------
//! A type that is a raw block of bits in a single encoding.
class BitBlockType : public TypeCommon
{
 private:
    IntIndex   _blockLength;
    BitBlockType(TypeManagerRef typeManager, IntIndex length, EncodingEnum encoding);
 public:
    static BitBlockType* New(TypeManagerRef typeManager, Int32 length, EncodingEnum encoding);
    void    Accept(TypeVisitor *tv) override { tv->VisitBitBlock(this); }
    IntIndex BitLength() override { return _blockLength; }
};
//------------------------------------------------------------
//! A type that is a collection of sub types.
class AggregateType : public TypeCommon
{
 protected:
    /// Since this class is variable size, classes that derive from it can not
    /// have member variables  as they would be stomped on.
    IntIndex _blockLength;  // only used by BitCluster

 protected:
    // The default value for the type, may be used
    // At this point only used by the ClusterType class but it needs to come
    // before the inlined array, so it is in this class.
    enum   { kSharedNullsBufferLength = 32 };
    static UInt32 _sharedNullsBuffer[kSharedNullsBufferLength];
    // ^this is a UInt32 instead of UInt8 to avoid aliasing compiler bugs in emcc
    void*   _pDefault;

 protected:
    InlineArray<ElementType*>   _elements;

    AggregateType(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
    : TypeCommon(typeManager), _elements(count) {
        _pDefault = nullptr;
        _elements.Assign(reinterpret_cast<ElementTypeRef*>(elements), count);
    }
    static size_t   StructSize(Int32 count) {
        return sizeof(AggregateType) + InlineArray<ElementType*>::ExtraStructSize(count);
    }

 public:
    virtual ~AggregateType() = default;
    Int32   SubElementCount() override;
    TypeRef GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic) override;
    TypeRef GetSubElement(Int32 index) override;
};
//------------------------------------------------------------
//! A type that is an aggregate of BitBlockTypes.
class BitClusterType : public AggregateType
{
 private:
    BitClusterType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    static size_t   StructSize(Int32 count) { return AggregateType::StructSize(count); }
 public:
    static BitClusterType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    void    Accept(TypeVisitor *tv) override { tv->VisitBitCluster(this); }
    NIError InitData(void* pData, TypeRef pattern = nullptr) override { return kNIError_Success; }
    IntIndex BitLength() override { return _blockLength; }
};
//------------------------------------------------------------
//! A type that permits its data to be looked at though more than one perspective.
class EquivalenceType : public AggregateType
{
 private:
    EquivalenceType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    static size_t   StructSize(Int32 count) { return AggregateType::StructSize(count); }
 public:
    static EquivalenceType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    void    Accept(TypeVisitor *tv) override { tv->VisitEquivalence(this); }
    void*   Begin(PointerAccessEnum mode) override;
    NIError InitData(void* pData, TypeRef pattern = nullptr) override;
    NIError CopyData(const void* pData, void* pDataCopy) override;
    NIError ClearData(void* pData) override;
};
//------------------------------------------------------------
//! A type that is an aggregate of other types.
class ClusterType : public AggregateType
{
 private:
    ClusterType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    virtual ~ClusterType();
    static size_t   StructSize(Int32 count) { return AggregateType::StructSize(count); }
 public:
    static ClusterType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    void    Accept(TypeVisitor *tv) override { tv->VisitCluster(this); }
    void*   Begin(PointerAccessEnum mode) override;
    NIError InitData(void* pData, TypeRef pattern = nullptr) override;
    NIError CopyData(const void* pData, void* pDataCopy) override;
    NIError ClearData(void* pData) override;
};
//------------------------------------------------------------
//! Base class for calculating core properties for aggregate types.
class AggregateAlignmentCalculator
{
    /// When aggregate types are parsed by a codec the decoder needs to calculate
    /// core properties as the elements are parsed and created. This class and
    /// its descendants keep the details internal to the TypeManager.
 protected:
    TypeManagerRef  _tm;
    Int32           _aqOffset;
 public:
    virtual ~AggregateAlignmentCalculator() = default;
    Int32   ElementCount;
    Int32   AggregateAlignment;
    Int32   AggregateSize;
    Boolean IncludesPadding;
    Boolean IsValid;
    Boolean IsFlat;
 public:
    explicit AggregateAlignmentCalculator(TypeManagerRef tm);
    virtual Int32  AlignNextElement(TypeRef element) = 0;
    void   Finish();
};
//------------------------------------------------------------
//! Calculates core properties for ClusterTypes
class ClusterAlignmentCalculator : public AggregateAlignmentCalculator
{
 public:
    explicit ClusterAlignmentCalculator(TypeManagerRef tm) : AggregateAlignmentCalculator(tm) { }
    Int32  AlignNextElement(TypeRef element) override;
};
//------------------------------------------------------------
//! Calculates core properties for ClusterTypes
class ParamBlockAlignmentCalculator :  public AggregateAlignmentCalculator
{
 public:
    explicit ParamBlockAlignmentCalculator(TypeManagerRef tm);
    Int32  AlignNextElement(TypeRef element) override;
};
//------------------------------------------------------------
//! Calculates core properties for EquivalenceTypes
class EquivalenceAlignmentCalculator :  public AggregateAlignmentCalculator
{
 public:
    explicit EquivalenceAlignmentCalculator(TypeManagerRef tm) : AggregateAlignmentCalculator(tm) { }
    Int32  AlignNextElement(TypeRef element) override;
};
//------------------------------------------------------------
//! A type that describes the parameter block used by a native InstructionFunction
class ParamBlockType : public AggregateType
{
 private:
    ParamBlockType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    static size_t   StructSize(Int32 count) { return AggregateType::StructSize(count); }
 public:
    static ParamBlockType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    void    Accept(TypeVisitor *tv) override { tv->VisitParamBlock(this); }

    NIError InitData(void* pData, TypeRef pattern = nullptr) override
    {
            return kNIError_Success;
    }

    NIError CopyData(const void* pData, void* pDataCopy) override
    {
            VIREO_ASSERT(false);  // TODO(PaulAustin): Is this needed? (spathiwa)
            return kNIError_kInsufficientResources;
    }

    NIError ClearData(void* pData) override
    {
            return kNIError_kInsufficientResources;
    }
};
//------------------------------------------------------------
//! A type that is a multi-dimension collection of another type.
class ArrayType : public WrappedType
{
 private:
    ArrayType(TypeManagerRef typeManager, TypeRef elementType, IntIndex rank, IntIndex* dimensionLengths);
    static size_t   StructSize(Int32 rank) { return sizeof(ArrayType) + ((rank-1) * sizeof(IntIndex)); }

 public:
    static ArrayType* New(TypeManagerRef typeManager, TypeRef elementType, IntIndex rank,
                          IntIndex* dimensionLengths);

    // _pDefault is a singleton for each instance of an ArrayType used as the default
    // value, allocated on demand
    void*   _pDefault;

    // In the type dimension is described as follows:
    // negative=bounded, positive=fixed, zero=fix with no elements
    // negative VariableDimensionSentinel means variable, and will not be preallocated.
    IntDim    _dimensionLengths[1];

    void    Accept(TypeVisitor *tv) override { tv->VisitArray(this); }
    TypeRef BaseType() override { return nullptr; }  // arrays are a more advanced
                                                                        // wrapping of a type.
    Int32   SubElementCount() override { return 1; }
    TypeRef GetSubElement(Int32 index) override { return index == 0 ? _wrapped : nullptr; }
    TypeRef GetSubElementAddressFromPath(SubString* path, void *start, void **end, Boolean allowDynamic) override;
    SubString Name() override { return SubString("Array"); }
    IntDim* DimensionLengths() override { return &_dimensionLengths[0]; }

    void*   Begin(PointerAccessEnum mode) override;
    NIError InitData(void* pData, TypeRef pattern = nullptr) override;
    NIError CopyData(const void* pData, void* pDataCopy) override;
    NIError ClearData(void* pData) override;
};
//------------------------------------------------------------
//! A type that has a custom ( e.g. non 0) value. Requires a base type.
class DefaultValueType : public WrappedType
{
 private:
    DefaultValueType(TypeManagerRef typeManager, TypeRef type, Boolean mutableValue);
    static size_t   StructSize(TypeRef type)            { return sizeof(DefaultValueType) + type->TopAQSize(); }
 public:
    //! Create a default value for a pointer and set the value in one operation.
    static DefaultValueType* New(TypeManagerRef typeManager, TypeRef valuesType, Boolean mutableValue, void* pointerValue);
    //!
    static DefaultValueType* New(TypeManagerRef typeManager, TypeRef valuesType, Boolean mutableValue);
    DefaultValueType* FinalizeDVT();
    void    Accept(TypeVisitor *tv) override { tv->VisitDefaultValue(this); }
    void*           Begin(PointerAccessEnum mode) override;
    NIError InitData(void* pData, TypeRef pattern = nullptr) override;
};
//------------------------------------------------------------
//! A type describes a pointer to another type. Initial value will be nullptr.
class PointerType : public WrappedType
{
 protected:
    PointerType(TypeManagerRef typeManager, TypeRef type);
 public:
    static PointerType* New(TypeManagerRef typeManager, TypeRef type);
    void    Accept(TypeVisitor *tv) override { tv->VisitPointer(this); }
    TypeRef GetSubElement(Int32 index) override { return index == 0 ? _wrapped : nullptr; }
    Int32   SubElementCount() override { return 1; }
    // TODO(PaulAustin): Add GetSubElementAddressFromPath
};

typedef UInt32 RefNum;

class RefNumVal {
 public:
    explicit RefNumVal(RefNum ref = 0) : _refnum(ref) { }
    RefNum GetRefNum() const { return _refnum; }
    void SetRefNum(RefNum refNum) { _refnum = refNum; }
 private:
    RefNum   _refnum;
};

//------------------------------------------------------------
//! A type describes a refnum to another type.
class RefNumValType : public WrappedType
{
 protected:
    RefNumValType(TypeManagerRef typeManager, TypeRef type);
 public:
    static RefNumValType* New(TypeManagerRef typeManager, TypeRef type);
    void    Accept(TypeVisitor *tv) override { tv->VisitRefNumVal(this); }
    TypeRef GetSubElement(Int32 index) override { return index == 0 ? _wrapped : nullptr; }
    Int32   SubElementCount() override { return 1; }
    NIError InitData(void* pData, TypeRef pattern = nullptr) override;
    NIError CopyData(const void* pData, void* pDataCopy) override;
    NIError ClearData(void* pData) override;
};
//------------------------------------------------------------
//! A type describes a pointer to another type. Initial value will be nullptr.
class EnumType : public WrappedType
{
 private:
    TypedArray1D<StringRef> *_items;
 protected:
    EnumType(TypeManagerRef typeManager, TypeRef type);
 public:
    static EnumType* New(TypeManagerRef typeManager, TypeRef type);
    void    Accept(TypeVisitor *tv) override { tv->VisitEnum(this); }
    TypeRef GetSubElement(Int32 index) override { return index == 0 ? _wrapped : nullptr; }
    void AddEnumItem(SubString *name) const;
    Int32   SubElementCount() override { return 1; }
    StringRef GetEnumItemName(IntIndex i) override;
    IntIndex GetEnumItemCount() override;
    virtual ~EnumType();

    // TODO(spathiwa): Add GetSubElementAddressFromPath
};
//------------------------------------------------------------
//! A type describes a pointer with a predefined value. For example, the address to a C function.
class DefaultPointerType : public PointerType
{
 private:
    DefaultPointerType(TypeManagerRef typeManager, TypeRef type, void* pointer, PointerTypeEnum pointerType);
 public:
    void*           _defaultPointerValue;
 public:
    static DefaultPointerType* New(TypeManagerRef typeManager, TypeRef type, void* pointer,
                                   PointerTypeEnum pointerType);

    NIError InitData(void* pData, TypeRef pattern = nullptr) override
    {
        *static_cast<void**>(pData) = _defaultPointerValue;
        return kNIError_Success;
    }

    void*   Begin(PointerAccessEnum mode) override { return &_defaultPointerValue; }
};
//------------------------------------------------------------
//! An interface used a CustomDataProcType instance.
class IDataProcs {
 public:
    virtual ~IDataProcs() = default;

    virtual NIError InitData(TypeRef type, void* pData, TypeRef pattern = nullptr)  {
        return type->InitData(pData, pattern);
    }
    virtual NIError CopyData(TypeRef type, const void* pData, void* pDataCopy) {
        return type->CopyData(pData, pDataCopy);
    }
    virtual NIError ClearData(TypeRef type, void* pData) { return type->ClearData(pData); }
    virtual TypeRef GetSubElementAddressFromPath(TypeRef type, SubString* name, void *start,
                                                 void **end, Boolean allowDynamic)
        { return type->GetSubElementAddressFromPath(name, start, end, allowDynamic); }
};
//------------------------------------------------------------
//! A type that has custom Init/Copy/Clear/GetSubElement functions
class CustomDataProcType : public WrappedType
{
 protected:
    CustomDataProcType(TypeManagerRef typeManager, TypeRef type, IDataProcs * pDataProcs);
    IDataProcs*    _pDataProcs;
 public:
    static CustomDataProcType* New(TypeManagerRef typeManager, TypeRef type, IDataProcs * pDataProcs);
    void    Accept(TypeVisitor *tv) override
    { tv->VisitCustomDataProc(this); }
    NIError InitData(void* pData, TypeRef pattern = nullptr) override
    { return _pDataProcs->InitData(_wrapped, pData, pattern); }
    NIError CopyData(const void* pData, void* pDataCopy) override
    { return _pDataProcs->CopyData(_wrapped, pData, pDataCopy); }
    NIError ClearData(void* pData) override
    { return _pDataProcs->ClearData(_wrapped, pData); }
    TypeRef GetSubElementAddressFromPath(SubString* name, void *start, void **end, Boolean allowDynamic) override
    { return _pDataProcs->GetSubElementAddressFromPath(_wrapped, name, start, end, allowDynamic); }
};
//------------------------------------------------------------
//! The core C++ implementation for ArrayType typed data's value.
class TypedArrayCore
{
 protected:
    //! Pointer to the array's first element.
    AQBlock1*               _pRawBufferBegin;

    //! Array's type.
    TypeRef                 _typeRef;

    //! Specific type an instance is an array of.
    TypeRef                 _eltTypeRef;

    //! Total number of elements there is capacity for in the managed block of memory.
    IntIndex                _capacity;

    // _dimensionAndSlabLengths works as follows:
    // In an array of Rank 2, there will be 2 DimensionLengths followed by
    // 2 slabLengths. slabLengths are precalculated in AQSize used for indexing.
    // For the inner most dimension the slab length is the length of the element.
    // Final offset is the dot product of the index vector and the slabLength vector.
 private:
    IntIndex                _dimensionAndSlabLengths[2];
 public:
    IntIndex  Rank() const { return _typeRef->Rank(); }
    IntIndex* DimensionLengths()    { return _dimensionAndSlabLengths; }
    IntIndex* SlabLengths()         { return &_dimensionAndSlabLengths[0] + Rank(); }

    virtual ~TypedArrayCore() = default;

 protected:
    static size_t   StructSize(Int32 rank)  { return sizeof(TypedArrayCore) + ((rank-1) * sizeof(IntIndex) * 2); }
    explicit TypedArrayCore(TypeRef type);
 public:
    static TypedArrayCoreRef New(TypeRef type);
    static void Delete(TypedArrayCoreRef);

 public:
    AQBlock1* BeginAt(IntIndex index) const
    {
        VIREO_ASSERT(index >= 0)
        VIREO_ASSERT(ElementType() != nullptr)
        AQBlock1* begin = (RawBegin() + (index * ElementType()->TopAQSize()));
        return begin;
    }
    AQBlock1* BeginAtND(Int32, IntIndex*);
    AQBlock1* BeginAtNDIndirect(Int32 rank, IntIndex* ppDimIndexes[]);

    void* RawObj() const
    { VIREO_ASSERT(Rank() == 0); return RawBegin(); }  // some extra asserts fo  ZDAs
    AQBlock1* RawBegin() const { return _pRawBufferBegin; }
    template<typename CT> CT BeginAtAQ(IntIndex index) { return reinterpret_cast<CT>(RawBegin() + index); }
    BlockItr RawItr()               { return BlockItr(RawBegin(), ElementType()->TopAQSize(), Length()); }

    //! Array's type.
    TypeRef Type() const { return _typeRef; }

    //! The element type of this array instance. This type may be more specific than the element in Array's Type.
    TypeRef ElementType() const { return _eltTypeRef; }
    Boolean SetElementType(TypeRef, Boolean preserveElements);

 protected:
    Boolean AQAlloc(IntIndex countBytes);
    Boolean AQRealloc(IntIndex countBytes, IntIndex preserveBytes);
    void AQFree();

 public:
    //! A minimal sanity check, it could do more.
    static Boolean ValidateHandle(TypedArrayCoreRef block) {
        return (block != nullptr);
    }

    IntIndex GetLength(IntIndex i);

    // Total Length  (product of all dimension lengths)
    // For actual arrays (not types) this will always be regular whole number.
    // Types may be variable, fixed, or bounded.
    IntIndex InternalCalculateLength();
    IntIndex Length()       { return Rank() == 1 ? *DimensionLengths() :  InternalCalculateLength(); }

    //! Returns the maximum number of elements the current underlying storage could hold.
    IntIndex Capacity() const { return abs(_capacity); }

    //! Attempt to grow the capacity of the array so that resizing the dimensions will not need
    // to realloc the underlying storage. This is a soft request and underlying system may reclaim the memory.
    // This method has no effect on fixed or bounded arrays. Returns true if the array capacity
    // is greater than or equal to the amount requested.
    Boolean Reserve(IntIndex length) const { return length <= Capacity(); }

    //! Calculate the length of a contiguous chunk of elements
    IntIndex AQBlockLength(IntIndex count) const { return ElementType()->TopAQSize() * count; }

    //! Resize for multi dim arrays
    Boolean ResizeDimensions(Int32 rank, IntIndex *dimensionLengths, Boolean preserveElements, Boolean noInit = false);

    //! Make this array match the shape of the reference type.
    Boolean ResizeToMatchOrEmpty(TypedArrayCoreRef pReference);

    //! Resize for 1d arrays, if not enough memory leave as is.
    Boolean Resize1D(IntIndex length)       { return ResizeDimensions(1, &length, true); }

    //! Resize for 1d arrays, if not enough memory leave as is. Leave new memory uninit (for insert to copy over).
    Boolean Resize1DNoInit(IntIndex length) { return ResizeDimensions(1, &length, true, true); }

    //! Resize, if not enough memory, then size to zero
    Boolean Resize1DOrEmpty(IntIndex length);

 private:
    //! Resize the underlying block of memory. It DOES NOT update any dimension information. Returns true if success.
    Boolean ResizeCapacity(IntIndex countAQ, IntIndex currentCapacity, IntIndex newCapacity, Boolean reserveExists);

 public:
    NIError Replace1D(IntIndex position, IntIndex count, const void* pSource, Boolean truncate);
    NIError Insert1D(IntIndex position, IntIndex count, const void* pSource = nullptr);
    NIError Remove1D(IntIndex position, IntIndex count);
};

//------------------------------------------------------------
//! A template class to allow C++ type safe access to select ArrayType values
template <class T>
class TypedArray1D : public TypedArrayCore
{
 public:
    T* Begin()                  { return reinterpret_cast<T*>(RawBegin()); }
    T* End()                    { return reinterpret_cast<T*>(Begin()) + Length(); }
    T  At(IntIndex index)       { return *reinterpret_cast<T*>(BeginAt(index));}
    T* BeginAt(IntIndex index)  { return reinterpret_cast<T*>(TypedArrayCore::BeginAt(index)); }
    T* BeginAtNDIndirect(Int32 rank, IntIndex* pDimIndexes) {
        return reinterpret_cast<T*>(TypedArrayCore::BeginAtNDIndirect(rank, pDimIndexes));
    }

    template <class T2> T2 AtAQ(IntIndex index)         { return *BeginAtAQ<T2*>(index); }

    NIError Append(T element)                           { return Insert1D(Length(), 1, &element); }
    NIError Append(IntIndex count, const T* pElements)  {
        return Insert1D(Length(), count, pElements);
    }
    NIError Insert(IntIndex position, IntIndex count, const T* pElements) {
        return Insert1D(position, count, pElements);
    }
    NIError Append(TypedArray1D* array) { return Insert1D(Length(), array->Length(), array->Begin()); }
    NIError CopyFrom(IntIndex count, const T* pElements){ return Replace1D(0, count, pElements, true); }
};

//------------------------------------------------------------
//! A template class to allow C++ type safe access to a Vireo object values
template <class T>
class TypedObject : public TypedArrayCore
{
 public:
    T* ObjBegin() { return static_cast<T*>(RawObj()); }
};

AQBlock1* ArrayToArrayCopyHelper(TypeRef elementType, AQBlock1* pDest, IntIndex* destSlabLengths,
                                 AQBlock1 *pSource, IntIndex* sourceDimLengths, IntIndex* sourceSlabLengths,
                                 Int32 destRank, Int32 sourceRank, bool preinit = false);

//------------------------------------------------------------
//! Vireo string type. Must be allocated by TypeManager not raw C++
class String : public TypedArray1D< Utf8Char >
{
 public:
    SubString MakeSubStringAlias()              { return {Begin(), End()}; }
    void CopyFromSubString(const SubString* str)   {
        if (str->Length())
            CopyFrom(str->Length(), str->Begin());
        else
            Resize1D(0);
    }
    void AppendCStr(ConstCStr cstr)             { Append(static_cast<IntIndex>(strlen(cstr)), (Utf8Char*)cstr); }
    void AppendUtf8Str(Utf8Char* begin, IntIndex length) { Append(length, begin); }
    void AppendSubString(SubString* str)     { Append(static_cast<IntIndex>(str->Length()), str->Begin()); }
    void AppendStringRef(StringRef stringRef)           {
        Append(static_cast<IntIndex>(stringRef->Length()), stringRef->Begin());
    }
    void InsertCStr(IntIndex position, ConstCStr cstr)
         { Insert(position, static_cast<IntIndex>(strlen(cstr)), (Utf8Char*)cstr); }
    void AppendViaDecoded(SubString *str);
    void AppendEscapeEncoded(const Utf8Char* source, IntIndex len);

    void InsertSubString(IntIndex position, SubString* str) {
        Insert(position, static_cast<IntIndex>(str->Length()), str->Begin());
    }
    Boolean IsEqual(String *rhs) {
        return Length() == rhs->Length() && memcmp(Begin(), rhs->Begin(), Length()) == 0;
    }
};

typedef String *StringRef;
typedef TypedArray1D< UInt8 > BinaryBuffer, *BinaryBufferRef;
typedef TypedArray1D< Int32 > Int32Array1D;
typedef TypedArray1D< TypeRef > TypeRefArray1D;
typedef TypedArray1D< StringRef > StringRefArray1D;

struct ErrorCluster {
    Boolean status;
    Int32 code;
    StringRef source;

    ErrorCluster() : status(false), code(0), source(nullptr) { }
    void SetErrorAndAppendCallChain(Boolean status, Int32 code, ConstCStr source);
    void SetError(Boolean status, Int32 ccode, ConstCStr source);
    void SetError(ErrorCluster error);
    void AddAppendixPreamble() const { source->AppendCStr("<APPEND>\n"); }
    static void AddAppendixPostamble() { }  // no postamble
    Boolean hasError() const { return status; }
    Boolean hasWarning() const { return !status && code != 0; }
};

#define ERROR_CLUST_TYPE_STRING "c(e(Boolean status) e(Int32 code) e(String source))"

struct NIPath {
    StringRefArray1D *components;
    StringRef type;
};
typedef NIPath *NIPathRef;

//------------------------------------------------------------
//! Stack class to create a CString from Vireo String.
class TempStackCStringFromString : public TempStackCString
{
 public:
    explicit TempStackCStringFromString(StringRef str)
    : TempStackCString(str->Begin(), str->Length()) { }
};

//------------------------------------------------------------
//! Create a specialization of a template type.
TypeRef InstantiateTypeTemplate(TypeManagerRef tm, TypeRef typeTemplate, SubVector<TypeRef>*);

//------------------------------------------------------------
//! Template class to dynamically create an instance of a Vireo typed variable.
template <class T>
class StackVar
{
 public:
    T *Value;

    //! Construct and instance of the type using the name passed by the macro.
    explicit StackVar(ConstCStr name) {
        TypeRef type = TypeManagerScope::Current()->FindType(name);
        VIREO_ASSERT(type->IsArray() && !type->IsFlat());
        Value = nullptr;
        if (type) {
            type->InitData(&Value);
        }
    }

    //! Remove ownership of the managed value.
    T* DetachValue() {
        T* temp = Value;
        Value = nullptr;
        return temp;
    }

    //! Free any storage used by the value if it is still managed.
    ~StackVar() {
        if (Value) {
            Value->Type()->ClearData(&Value);
        }
    }
};

struct StringRefCmp {
    bool operator()(const StringRef& a, const StringRef &b) const {
        Int32 cmp = memcmp(a->Begin(), b->Begin(), Min(a->Length(), b->Length()));
        if (cmp < 0) {
            return true;
        } else if (cmp > 0) {
            return false;
        } else if (a->Length() < b->Length()) {
            return true;
        } else {
            return false;
        }
    }
};

bool inline IsStringEmpty(StringRef str)
{
    return (!str || str->Length() == 0);
}

//! Declare a variable using a Vireo type.
#define STACK_VAR(_t_, _v_) StackVar<_t_> _v_(#_t_)

}  // namespace Vireo

#endif  // TypeAndDataManager_h
