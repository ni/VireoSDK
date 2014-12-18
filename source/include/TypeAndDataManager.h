/**

Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief Tools to define data types, manage their data, and a TypeManager to manage those types.
 */

#ifndef TypeAndDataManager_h
#define TypeAndDataManager_h

#define STL_MAP

#include <stdlib.h> // abs()
#include <new>      // for new placement

#ifdef STL_MAP
    #include <map>
#endif

#include <stdio.h>
#include "Thread.h"
#include "DataTypes.h"
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
class DefaultValueType;
class DefaultPointerType;
class CustomDataProcType;

class TypeManager;
class ExecutionContext;
class IDataProcs;
class String;

    
typedef TypeCommon  *TypeRef;
typedef TypeManager *TypeManagerRef;
typedef NamedType *NamedTypeRef;
typedef String *StringRef;

// StaticType is used for functions tha take types determined at load time.
// specifiying StaticType for the parameter will result in the instruction holding a TypeCommon*
// Instead of a TypeRef*
typedef TypeCommon StaticType;

class TypedArrayCore;

template <class T>
class TypedArray1D;

#ifdef VIREO_SINGLE_GLOBAL_CONTEXT
    // TODO Type manager needs single instance global option like that used by execution context.
    #error
    #define THREAD_TADM() // TBD
#else
    #define THREAD_TADM() TypeManagerScope::Current()
#endif

#define TADM_NEW_PLACEMENT(_class_) new (THREAD_TADM()->Malloc(sizeof(_class_))) _class_
#define TADM_NEW_PLACEMENT_DYNAMIC(_class_, _d_) new (TypeManagerScope::Current()->Malloc(_class_::StructSize(_d_))) _class_
    
// EncodingEnum defines the base set of encodings used to annotate the underlying semantics
// of a low level bit block. It is the key for serialization to and from binary, ASCII
// or other formats.
enum EncodingEnum {
    kEncoding_None = 0,
    // Aggregates and References
    kEncoding_Cluster,
    kEncoding_ParameterBlock,
    kEncoding_Array,
    kEncoding_Generic,
    kEncoding_Stream,           // Like array but can't assume random acess.
    
    //Bitblock
    kEncoding_Boolean,
    kEncoding_Bits,
    kEncoding_Enum,
    kEncoding_UInt,
    kEncoding_SInt,
    kEncoding_Int1sCompliment,
    kEncoding_IEEE754Binary,
    kEncoding_Ascii,
    kEncoding_Unicode,
    kEncoding_Pointer,          // Some systems may have more than one pointer type cdoe/data
    kEncoding_Q,
    kEncoding_Q1,
    kEncoding_IntBiased,
    kEncoding_ZigZag,           // For future use
    
    kEncodingBitFieldSize = 5,  // Room for up to 32 primitive encoding types
};

// UsageTypeEnum defines how parameters in a native function of VIs ParamBlock will be used.
// Note kUsageTypeInput..kUsageTypeAlias are all forms of alias'
enum UsageTypeEnum {
    kUsageTypeSimple = 0,       // Default for clusters, code assumed to read and write at will, not allowed in ParamBlock
    kUsageTypeInput = 1,        // Caller copies in value, VI will not change it.
    kUsageTypeOutput = 2,       // Caller provides storage(if array) VI sets value, ingores incomming value
    kUsageTypeInputOutput = 3,  // Like output, but VI uses initial value.
    kUsageTypeAlias = 4,        // Non flat value that that is owned by by another element.
    kUsageTypeStatic = 5,       // Allocated value persists from call to call
    kUsageTypeTemp =  6,        // Storage typically carried from call to call but can be freed up.
    kUsageTypeImmediate =  7,   // For native function value in instruction block is imediate value not a pointer
};

// PointerTypeEnum defines the type of internal pointer stored in DefaultPointer type.
enum PointerTypeEnum {
    kPTNotAPointer = 0,
    kPTInt,
    kPTInstructionFunction,
    kPTGenericFucntionPropType,
    kPTGenericFunctionCodeGen,
};

// PointerTypeEnum defines how a pointer to data will be used.
enum PointerAccessEnum {
    kPAInit = 0,
    kPARead = 1,
    kPAWrite = 2,
    kPAReadWrite = 3,
    kPAClear = 4,
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
        void clear() {};
        DictionaryElt* begin() {return null;};
        DictionaryElt* end() {return null;};
        DictionaryElt* find(SubString& value) {return null;};
        TypeRef& operator[] (const SubString& k) { return _t; };
        Int32 size() {return null;};
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
    static TypeManagerRef New(TypeManagerRef tmParent);
    static void Delete(TypeManagerRef tm);
    
private:
    TypeManagerRef    _rootTypeManager;   // Root is null when the instance is the root.

#ifdef STL_MAP
    typedef std::map<SubString, NamedTypeRef, ComapreSubString>::iterator  TypeDictionaryIterator;
    std::map<SubString, NamedTypeRef, ComapreSubString>  _typeNameDictionary;
    std::map<SubString, TypeRef, ComapreSubString>  _typeInstanceDictionary;
#else
    typedef DictionaryElt* TypeDictionaryIterator;
    SimpleDictionary       _typeNameDictionary;
#endif

#if defined(VIREO_INSTRUCTION_REFLECTION)
    struct CPrimtitiveInfo {
        TypeRef _type;
        const char* _cName;
    };
    std::map<void*, CPrimtitiveInfo>  _cPrimitiveDictionary;
#endif

    Int32   _aqBitCount;
    MUTEX_CLASS_MEMBER
    TypeRef _badType;
    TypeRef _typeList;                  // List of all Types allocated by this TypeManager
    
friend class TDViaParser;
    // TODO The manager needs to define the Addressable Quantum size (bit in an addressable item, often a octet
    // but some times it is larger (e.g. 16 or 32) the CDC 7600 was 60
    // also defines alignment rules. Each element in a cluster is addressable
private:
    TypeManager(TypeManagerRef typeManager);
    NamedTypeRef NewNamedType(const SubString* typeName, TypeRef type, NamedTypeRef existingType);
public:
    void    DeleteTypes(Boolean finalTime);
    void    TrackType(TypeCommon* type);
    TypeRef ResolveToUniqueInstance(TypeRef type, SubString *binaryName);

    void    UntrackLastType(TypeCommon* type);
    void    GetTypes(TypedArray1D<TypeRef>*);
    TypeRef TypeList() { return _typeList; }
    void    PrintMemoryStat(const char*, Boolean last);
    
    TypeManagerRef RootTypeManager() { return _rootTypeManager; }
    TypeRef Define(const SubString* name, TypeRef type);

    NamedTypeRef FindType(const char* name);
    NamedTypeRef FindType(const SubString* name);
    NamedTypeRef* FindTypeConstRef(const SubString* name);
    void*   FindNamedTypedBlock(SubString* name, PointerAccessEnum mode);
    void*   FindNamedObject(SubString* name);
    TypeRef BadType();

    Int32   AQAlignment(Int32 size);
    Int32   AlignAQOffset(Int32 offset, Int32 size);
    Int32   BitCountToAQSize(Int32 bitCount);
    Int32   PointerToAQSize() {return sizeof(void*); }
    Int32   AQBitSize() {return _aqBitCount; }
    
public:
#if defined (VIREO_INSTRUCTION_REFLECTION)
	TypeRef DefineCustomPointerTypeWithValue(const char* name, void* pointer, TypeRef type, PointerTypeEnum pointerType, const char* cName);
    TypeRef FindCustomPointerTypeFromValue(void*, SubString *cName);
    TypeRef FindSymboFromPointer(DataPointer ptr, StringRef SymbolName);
#else
    TypeRef DefineCustomPointerTypeWithValue(const char* name, void* pointer, TypeRef type, PointerTypeEnum pointerType);
#endif
	TypeRef DefineCustomDataProcs(const char* name, IDataProcs* pDataProcs, TypeRef type);

public:
    // Low level allocation functions
    // TODO pull out into its own class.
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

    size_t TotalAQAllocated()       { return _totalAQAllocated; }
    Int32 TotalAllocations()        { return _totalAllocations; }
    size_t MaxAllocated()           { return _maxAllocated; }
    
    Int32 AQBitCount() {return 8;}

public:
    static void* GlobalMalloc(size_t countAQ);
    static void GlobalFree(void* pBuffer);
    
#ifdef VIREO_PERF_COUNTERS
private:
    Int64 _lookUpsFound;
    Int64 _lookUpsRoutedToOwner;
public:
    Int32 _typesShared;

    Int64 LookUpsFound()            { return _lookUpsFound;}
    Int64 LookUpsRoutedToOwner()    { return _lookUpsRoutedToOwner;}
#endif
};

//------------------------------------------------------------
//! Stack based class to manage a threads active TypeManager.
class TypeManagerScope
{
#ifndef VIREO_SINGLE_GLOBAL_CONTEXT
private:
    TypeManagerRef _saveTypeManager;
    VIVM_THREAD_LOCAL static TypeManagerRef ThreadsTypeManager;
public:
    TypeManagerScope(TypeManagerRef typeManager)
    {
      _saveTypeManager = TypeManagerScope::ThreadsTypeManager;
      TypeManagerScope::ThreadsTypeManager = typeManager;
    }
    ~TypeManagerScope()
    {
        TypeManagerScope::ThreadsTypeManager = _saveTypeManager;
    }
    static TypeManagerRef Current()
    {
        VIREO_ASSERT(TypeManagerScope::ThreadsTypeManager != null);
        return TypeManagerScope::ThreadsTypeManager;
    }
#else
    TypeManagerScope(TypeManagerRef typeManager) {}
    ~TypeManagerScope() {}
#endif
};

//------------------------------------------------------------
//! A class to help dynamic classes/structures that end with an array whose size is set at construction time.
template <class T>
class InlineArray
{
private:
    IntIndex _length;
    T _array[1];
public:
    static IntIndex ExtraStructSize(Int32 count){ return (count - 1) * sizeof(T); }
    InlineArray(Int32 length)                   { _length = length; }
    T* Begin()                                  { return _array; }
    T* End()                                    { return &_array[_length]; }
    void Assign(const T* source, Int32 count)   { memcpy(Begin(), source, count * sizeof(T)); }
    T& operator[] (const Int32 index)           { VIREO_ASSERT(index <= _length); return _array[index]; }
    IntIndex Length()                           { return (IntIndex)_length; }
};

//------------------------------------------------------------
//! Visitor class for types.
class TypeVisitor
{
public:
    virtual void VisitBad(TypeRef type) = 0;
    virtual void VisitBitBlock(BitBlockType* type) = 0;
    virtual void VisitBitCluster(BitClusterType* type) = 0;
    virtual void VisitCluster(ClusterType* type)  = 0;
    virtual void VisitParamBlock(ParamBlockType* type)  = 0;
    virtual void VisitEquivalence(EquivalenceType* type) = 0;
    virtual void VisitArray(ArrayType* type)  = 0;
    virtual void VisitElement(ElementType* type) = 0;
    virtual void VisitNamed(NamedType* type) = 0;
    virtual void VisitPointer(PointerType* type) = 0;
    virtual void VisitDefaultValue(DefaultValueType* type) = 0;
    virtual void VisitDefaultPointer(DefaultPointerType* type) = 0;
    virtual void VisitCustomDataProc(CustomDataProcType* type) = 0;
};

//------------------------------------------------------------
//! Base class for all type definition types.
class TypeCommon
{
// Core internal methods are for keeping track of Type bjects in seperate
// TypeManager layers
    friend class TypeManager;
private:
    TypeRef         _next;              // Linked list of all Types in a TypeManager
    TypeManagerRef  _typeManager;       // TypeManger that owns this type
public:
    TypeCommon(TypeManagerRef typeManager);
    TypeManagerRef TheTypeManager()       { return _typeManager; }
    TypeRef Next()                      { return _next; }
public:
    // Internal to the TypeManager, but this is hard to secifiy in C++
    virtual ~TypeCommon() {};

protected:
    /// @name Storage for core property
    /// Members use a common type (UInt16) to maximize packing.
    
    Int32   _topAQSize;
    UInt16  _rank:8;            // (0-7) 0 for scalar, 0 or greater for arrays room for rank up to 16 (for now
    UInt16  _aqAlignment:8;     // (8-15)
   
    UInt16  _encoding:kEncodingBitFieldSize; // aggirgate or single format
    UInt16  _isFlat:1;          // ( 0) All data is contained in TopAQ elements ( e.g. no pointers)
    UInt16  _isValid:1;         // ( 1) Contains no invalid types
    UInt16  _isBitLevel:1;      // ( 2) Is a bitblock or bitcluster

    UInt16  _hasCustomDefault:1;// ( 3) A non 0 non null value
    UInt16  _isMutableValue:1;  // ( 4) "default" value can be changed after creation.
    UInt16  _hasGenericType:1;  // ( 5) The type contians some generic types
    UInt16  _hasPadding:1;      // ( 6) To satisfy alignment requirements for elements TopAQSize() includes some padding
    
    //  properties unique to prototype elements. they are never merged up
    UInt16  _elementUsageType:3;// (7-9) ElementType::UsageType
    //  properties unique to DefaultPointerType objects
    UInt16  _pointerType:3;     // (10-12)
    UInt16  _ownsDefDefData:1;  // (13) Owns DefaultDefault data (clusters and arrays)
    
public:
    /// @name Core Property Methods
    /// Core type properties are stored in each object so they can be directly accessed.

    //! How the data as a whole is encoded, either a simple encoding like "2s compliment binary" or an Aggregate encoding.
    EncodingEnum BitEncoding()      { return (EncodingEnum) _encoding; }
    //! Memory alignment required for values of this type.
    Int32   AQAlignment()             { return _aqAlignment; }
    //! Amount of memory needed for the top level data structure for the type including any padding if needed.
    Int32   TopAQSize()             { return _topAQSize; }
    //! True if the initial value for data of this type is not just zeroed out memory.
    Boolean HasCustomDefault()      { return _hasCustomDefault != 0; }
    //! True if the initial value can be changed.
    Boolean IsMutableValue()       { return _isMutableValue != 0; }
    //! Dimensionality of the type. Simple Scalars are Rank 0, arrays can be rank 0 as well.
    Int32   Rank()                  { return _rank; }
    //! True if the type is an indexable container that contains another type.
    Boolean IsArray()               { return BitEncoding() == kEncoding_Array; }
    //! True if the type is an aggregate of other types.
    Boolean IsCluster()              { return BitEncoding() == kEncoding_Cluster; }
    //! True if data can be copied by a simple block copy.
    Boolean IsFlat()                { return _isFlat != 0; }
    //! True if all types the type is composed of have been resolved to valid types.
    Boolean IsValid()               { return _isValid != 0; }
    //! True if the type a BitBlock or a BitClusters.
    Boolean IsBitLevel()            { return _isBitLevel != 0; }
    //! True if TopAQSize includes internal or external padding necessary for proper aligmnet of multiple elements.
    Boolean HasPadding()            { return _hasPadding != 0; }
    //! True if the type contains one or more generic types.
    Boolean HasGenericType()        { return _hasGenericType != 0; }

    //! True if aggregate element is used as an input parameter.
    Boolean IsInputParam()          { return (_elementUsageType == kUsageTypeInput) || (_elementUsageType == kUsageTypeInputOutput); }
    //! True if aggregate element is used as an output parameter.
    Boolean IsOutputParam()         { return (_elementUsageType == kUsageTypeOutput) || (_elementUsageType == kUsageTypeInputOutput); }
    //! True if aggregate element is owned elsewhere (e.g. its an i ,o ,io, or alias) .
    Boolean IsAlias()               { return (_elementUsageType >= kUsageTypeInput) && (_elementUsageType <= kUsageTypeAlias); }
    //! True if the parameer is only visible to the callee, and is preserved between calls.
    Boolean IsStaticParam()         { return _elementUsageType == kUsageTypeStatic; }
    //! True is the parameter is only visible to the callee, but may be cleared between calls.
    Boolean IsTempParam()           { return _elementUsageType == kUsageTypeTemp; }
    //! True if the parameter is not required. For non flat values null may be passed in.
    Boolean IsOptionalParam()       { return true; }//TODO {return _elementUsageType == kUsageTypeOptionalInput ;}
    UsageTypeEnum ElementUsageType(){ return (UsageTypeEnum)_elementUsageType; }
private:
    //! True if the type owns data that needs to be freed when the TypeManager is cleared.
    Boolean OwnsDefDefData()        { return _ownsDefDefData != 0; }
public:
    //! What type of internal pointer is this type. Only used for CustomValuePointers.
    PointerTypeEnum PointerType()   { return (PointerTypeEnum)_pointerType; }

    virtual void    Accept(TypeVisitor *tv)             { tv->VisitBad(this); }
    //! For a wrapped type, return the type that was wrapped, null otherwise.
    virtual TypeRef BaseType()                          { return null; }
    //! How many element in an Aggregate, 0 if the type is not an Aggregate.
    virtual Int32   SubElementCount()                   { return 0; }
    //! Get an element of an Aggregate using the elements field name.
    virtual TypeRef GetSubElementByName(SubString* name){ return null; }
    //! Get an element of an Aggregate using it index.
    virtual TypeRef GetSubElement(Int32 index)          { return null; }

    //! Parse through a path, digging through Aggregate element names. Calculates the cumulative offset.
    TypeRef GetSubElementOffsetFromPath(SubString* name, Int32 *offset);
    //! Parse through a path, digging through Aggregate element names, references and array indexes.
    TypeRef GetSubElementInstancePointerFromPath(SubString* name, void *start, void **end, Boolean allowDynamic);
    
    //! Set the SubString to the name if the type is not anonymous.
    virtual SubString GetName()                         { return SubString(null, null); }
    //! Set the SubString to the aggregates elements field name.
    virtual SubString GetElementName()                  { return SubString(null, null); }
    //! Return a pointer to the raw vector of dimension lengths.
    virtual IntIndex* GetDimensionLengths()             { return null; }
    
    //! Offset in AQs in the containing aggregate
    virtual IntIndex ElementOffset()                    { return 0; }

    // Methods for working with individual elements
    virtual void*   Begin(PointerAccessEnum mode)       { return null; }
    
    //! Zero out a buffer that will hold a value of the type without consideration for the existing bits.
    void ZeroOutTop(void* pData);
    //! Initialize (re)initialize a value to the default value for the Type. Buffer must be well formed.
    virtual NIError InitData(void* pData, TypeRef pattern = null);
    //! May a deep copy fom the source to the copy.
    virtual NIError CopyData(const void* pData, void* pDataCopy);
    //! Free up any storage and put value to null/zero state.
    virtual NIError ClearData(void* pData);
    
    //! Initialize a linear block to the deault value for the type.
    NIError InitData(void* pData, IntIndex count);
    //! Deep copy a linear block of values from one locatio to another.
    NIError CopyData(const void* pData, void* pDataCopy, IntIndex count);
    //! Dealocate and null out a linear block of value of the type.
    NIError ClearData(void* pData, IntIndex count);
    //! Make multiple copies of a single instance to a linear block.
    NIError MultiCopyData(const void* pSingleData, void* pDataCopy, IntIndex count);
    
    Boolean CompareType(TypeRef otherType);
    Boolean IsA(const SubString* otherTypeName);
    Boolean IsA(TypeRef otherType);
    Boolean IsA(TypeRef otherType, Boolean compatibleArrays);
    
    //! Size of the type in bits including padding. If the type is bit level it s the raw bit size wiht no padding.
    virtual Int32   BitSize()  {return _topAQSize*8;}  // TODO defer to type manager for scale factor;
    

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
        MaxAlignedType _alignent;
    };
    WrappedType(TypeManagerRef typeManager, TypeRef type);
public:
    // Type operations
    virtual TypeRef BaseType()                          { return _wrapped; }
    virtual Int32   SubElementCount()                   { return _wrapped->SubElementCount(); }
    virtual TypeRef GetSubElementByName(SubString* name){ return _wrapped->GetSubElementByName(name); }
    virtual TypeRef GetSubElement(Int32 index)          { return _wrapped->GetSubElement(index); }
    virtual Int32   BitSize()                           { return _wrapped->BitSize(); }
    virtual SubString GetName()                         { return _wrapped->GetName(); }
    virtual IntIndex* GetDimensionLengths()             { return _wrapped->GetDimensionLengths(); }
    // Data operations
    virtual void*   Begin(PointerAccessEnum mode)       { return _wrapped->Begin(mode); }
    virtual NIError InitData(void* pData, TypeRef pattern = null)
    { return _wrapped->InitData(pData, pattern ? pattern : this); }
    virtual NIError CopyData(const void* pData, void* pDataCopy)  { return _wrapped->CopyData(pData, pDataCopy); }
    virtual NIError ClearData(void* pData)              { return _wrapped->ClearData(pData); }
};

// TODO forward declarations ( this covers asynchronous resolution of sub VIs as well
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
// the type->InitValue method does. For a variante type this means the type of the value may change
// but not notiosn that the value is a variant. A bit tenious perhaps. s


//------------------------------------------------------------
//! Gives a type a name ( .e.g "Int32")
class NamedType : public WrappedType
{
private:
    NamedTypeRef            _nextOverload; // May point to one in curent or root type manager.
    InlineArray<Utf8Char>   _name;
    NamedType(TypeManagerRef typeManager, const SubString* name, TypeRef type, NamedTypeRef nextOverload);
public:
    static IntIndex StructSize(const SubString* name)
        { return sizeof(NamedType) + InlineArray<Utf8Char>::ExtraStructSize(name->Length()); }
    static NamedType* New(TypeManagerRef typeManager, const SubString* name, TypeRef type, NamedTypeRef nextOverload);
    
    NamedTypeRef    NextOverload()                  { return _nextOverload; }
    virtual void    Accept(TypeVisitor *tv)         { tv->VisitNamed(this); }
    virtual SubString GetName()                     { return SubString(_name.Begin(), _name.End()); }
    virtual SubString GetElementName()              { return SubString(null, null); }
};
//------------------------------------------------------------
//! Give a type a field name and offset properties. Used inside an aggregateType
class ElementType : public WrappedType
{
private:
    ElementType(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType, UsageTypeEnum usageType, Int32 offset);

public:
    Int32                   _offset;  // Relative to the begining of the aggregate
    InlineArray<Utf8Char>   _elementName;

public:
    static IntIndex StructSize(SubString* name) { return sizeof(ElementType) + InlineArray<Utf8Char>::ExtraStructSize(name->Length()); }
    static ElementType* New(TypeManagerRef typeManager, SubString* name, TypeRef wrappedType, UsageTypeEnum usageType, Int32 offset);
    
    virtual void    Accept(TypeVisitor *tv)         { tv->VisitElement(this); }
    virtual SubString GetElementName()              { return SubString(_elementName.Begin(), _elementName.End()); }
    virtual IntIndex ElementOffset()                { return _offset; }
};
//------------------------------------------------------------
//! A type that is a raw block of bits in a single encoding.
class BitBlockType : public TypeCommon
{
private:
    Int32   _bitSize;
    BitBlockType(TypeManagerRef typeManager, Int32 size, EncodingEnum encoding);
public:
    static BitBlockType* New(TypeManagerRef typeManager, Int32 size, EncodingEnum encoding);
    virtual void    Accept(TypeVisitor *tv)         { tv->VisitBitBlock(this); }
    virtual Int32   BitSize() {return _bitSize;};
};
//------------------------------------------------------------
//! A type that is a collection of sub types.
class AggregateType : public TypeCommon
{
protected:
    /// Since this class is variable size, classes that derive from it can not
    /// have member variables  as they would be stompped on.
    Int32 _bitSize;  // only used by BitCluster
    
protected:
    // The default value for the type, may be used
    // At this point only used by the ClusterType class but it needs to come
    // before the inlined array, so it is in this class.
    enum   { kSharedNullsBufferLength = 128 };
    static UInt8 _sharedNullsBuffer[kSharedNullsBufferLength];
    void*   _pDefault;

protected:
    InlineArray<ElementType*>   _elements;

    AggregateType(TypeManagerRef typeManager, TypeRef elements[], Int32 count)
    : TypeCommon(typeManager), _elements(count)
    {
        _pDefault = null;
        _elements.Assign((ElementType**)elements, count);
    }
    static IntIndex StructSize(Int32 count)
    {
        return sizeof(AggregateType) + InlineArray<ElementType*>::ExtraStructSize(count);
    }

public:
    virtual ~AggregateType() {};
    virtual Int32   SubElementCount();
    virtual TypeRef GetSubElementByName(SubString* name);
    virtual TypeRef GetSubElement(Int32 index);
};
//------------------------------------------------------------
//! A type that is an aggregate of BitBlockTypes.
class BitClusterType : public AggregateType
{
private:
    BitClusterType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    static IntIndex StructSize(Int32 count) { return AggregateType::StructSize(count); }
public:
    static BitClusterType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    virtual void    Accept(TypeVisitor *tv) { tv->VisitBitCluster(this); }
    virtual NIError InitData(void* pData, TypeRef pattern = null)   { return kNIError_Success; }
    virtual Int32 BitSize()                 { return _bitSize; }
};
//------------------------------------------------------------
//! A type that permits its data to be looked at though more than one perspective.
class EquivalenceType : public AggregateType
{
private:
    EquivalenceType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    static IntIndex StructSize(Int32 count) { return AggregateType::StructSize(count); }
public:
    static EquivalenceType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    virtual void    Accept(TypeVisitor *tv) { tv->VisitEquivalence(this); }
    virtual void*   Begin(PointerAccessEnum mode);
    virtual NIError InitData(void* pData, TypeRef pattern = null);
    virtual NIError CopyData(const void* pData, void* pDataCopy);
    virtual NIError ClearData(void* pData);
};
//------------------------------------------------------------
//! A type that is an aggregate of other types.
class ClusterType : public AggregateType
{
private:
    ClusterType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    virtual ~ClusterType();
    static IntIndex StructSize(Int32 count) { return AggregateType::StructSize(count); }
public:
    static ClusterType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    virtual void    Accept(TypeVisitor *tv) { tv->VisitCluster(this); }
    virtual void*   Begin(PointerAccessEnum mode);
    virtual NIError InitData(void* pData, TypeRef pattern = null);
    virtual NIError CopyData(const void* pData, void* pDataCopy);
    virtual NIError ClearData(void* pData);
};
//------------------------------------------------------------
//! Base class for calculating core properties for aggregate types.
class AggregateAlignmentCalculator
{
    /// When aggregate types are parsed by a codec the decoder needs to calculate
    /// core properties as the elements are parsed and created. This class and
    /// its decendents keep the details internal to the TypeManager.
protected:
    TypeManagerRef  _tm;
    Int32           _aqOffset;
public:
    Int32   ElementCount;
    Int32   AggregateAlignment;
    Int32   AggregateSize;
    Boolean IncludesPadding;
    Boolean IsValid;
    Boolean IsFlat;
public:
    AggregateAlignmentCalculator(TypeManagerRef tm);
    virtual Int32  AlignNextElement(TypeRef element) = 0;
    void   Finish();
};
//------------------------------------------------------------
//! Calculates core properties for ClusterTypes
class ClusterAlignmentCalculator : public AggregateAlignmentCalculator
{
public:
    ClusterAlignmentCalculator(TypeManagerRef tm) : AggregateAlignmentCalculator(tm) {}
    virtual Int32  AlignNextElement(TypeRef element);
};
//------------------------------------------------------------
//! Calculates core properties for ClusterTypes
class ParamBlockAlignmentCalculator :  public AggregateAlignmentCalculator
{
public:
    ParamBlockAlignmentCalculator(TypeManagerRef tm);
    virtual Int32  AlignNextElement(TypeRef element);
};
//------------------------------------------------------------
//! Calculates core properties for EquivalenceTypes
class EquivalenceAlignmentCalculator :  public AggregateAlignmentCalculator
{
public:
    EquivalenceAlignmentCalculator(TypeManagerRef tm) : AggregateAlignmentCalculator(tm) {}
    virtual Int32  AlignNextElement(TypeRef element);
};
//------------------------------------------------------------
//! A type that describes the parameter block used by a native InstructionFunction
class ParamBlockType : public AggregateType
{
private:
    ParamBlockType(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    static IntIndex StructSize(Int32 count) { return AggregateType::StructSize(count); }
public:
    static ParamBlockType* New(TypeManagerRef typeManager, TypeRef elements[], Int32 count);
    virtual void    Accept(TypeVisitor *tv) { tv->VisitParamBlock(this); }
    virtual NIError InitData(void* pData, TypeRef pattern = null)
        {
            return kNIError_Success;
        }
    virtual NIError CopyData(const void* pData, void* pDataCopy)
        {
            VIREO_ASSERT(false); //TODO
            return kNIError_kInsufficientResources;
        }
    virtual NIError ClearData(void* pData)
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
    static IntIndex StructSize(Int32 rank) { return sizeof(ArrayType) + ((rank-1) * sizeof(IntIndex)); }

public:
    
    static ArrayType* New(TypeManagerRef typeManager, TypeRef elementType, IntIndex rank, IntIndex* dimensionLengths);
   
    // _pDefault is a singleton for each instance of an ArrayType used as the default
    // value, allocated one demand
    void*   _pDefault;
    
    // In the type dimension is described as follows:
    // negative=bounded, positive=fixed, zero=fix with no elements
    // negative VariableDimensionSentinel means varible, and will not be prealocated.
    IntIndex    _dimensionLengths[1];
    
    virtual void    Accept(TypeVisitor *tv)             { tv->VisitArray(this); }
    virtual TypeRef BaseType()                          { return null; } // arrays are a more advanced wrapping of a type.
    virtual Int32   SubElementCount()                   { return 1; }
    virtual TypeRef GetSubElementByName(SubString* name){ return Rank() == 0 ? _wrapped->GetSubElementByName(name) : null ; }
    virtual TypeRef GetSubElement(Int32 index)          { return index == 0 ? _wrapped : null; }
    virtual SubString GetName()                         { return SubString("Array"); }
    virtual IntIndex* GetDimensionLengths()             { return &_dimensionLengths[0]; }

    virtual void*   Begin(PointerAccessEnum mode);
    virtual NIError InitData(void* pData, TypeRef pattern = null);
    virtual NIError CopyData(const void* pData, void* pDataCopy);
    virtual NIError ClearData(void* pData);

};
//------------------------------------------------------------
//! A type that has a custom ( e.g. non 0) value. Requires a base type.
class DefaultValueType : public WrappedType
{
private:
    DefaultValueType(TypeManagerRef typeManager, TypeRef type, Boolean mutableValue);
    static IntIndex StructSize(TypeRef type)            { return sizeof(DefaultValueType) + type->TopAQSize(); }
public:
    static DefaultValueType* New(TypeManagerRef typeManager, TypeRef type, Boolean mutableValue);
public:
    virtual void    Accept(TypeVisitor *tv)             { tv->VisitDefaultValue(this); }
    virtual void*   Begin(PointerAccessEnum mode);
    virtual NIError InitData(void* pData, TypeRef pattern = null);
};
//------------------------------------------------------------
//! A type describes a pointer to another type.
class PointerType : public WrappedType
{
protected:
    PointerType(TypeManagerRef typeManager, TypeRef type);
public:
    static PointerType* New(TypeManagerRef typeManager, TypeRef type);
    virtual void    Accept(TypeVisitor *tv)             { tv->VisitPointer(this); }
    virtual TypeRef GetSubElement(Int32 index)          { return index == 0 ? _wrapped : null; }
    virtual Int32   SubElementCount()                   { return 1; }
    virtual TypeRef GetSubElementByName(SubString* name){ return null; }
};
//------------------------------------------------------------
//! A type describes a pointer with a predefined value. For example the address to a C function.
class DefaultPointerType : public PointerType
{
private:
    DefaultPointerType(TypeManagerRef typeManager, TypeRef type, void* pointer, PointerTypeEnum pointerType);
    DefaultPointerType();
public:
    void*           _defaultPointerValue;
public:
    static DefaultPointerType* New(TypeManagerRef typeManager, TypeRef type, void* pointer, PointerTypeEnum pointerType);
    
    virtual NIError InitData(void* pData, TypeRef pattern = null)
    {
        *(void**)pData = _defaultPointerValue;
        return kNIError_Success;
    }
    virtual void*   Begin(PointerAccessEnum mode)       { return &_defaultPointerValue; }
};
//------------------------------------------------------------
//! An interface used a CustomDataProcType instance.
class IDataProcs {
public:
    virtual NIError InitData(TypeRef type, void* pData, TypeRef pattern = null)  { return type->InitData(pData, pattern); }
    virtual NIError CopyData(TypeRef type, const void* pData, void* pDataCopy) { return type->CopyData(pData, pDataCopy); }
    virtual NIError ClearData(TypeRef type, void* pData) { return type->ClearData(pData); }
};
//------------------------------------------------------------
//! A type that has custom Init/Copy/Clear functions
class CustomDataProcType : public WrappedType
{
protected:
    CustomDataProcType(TypeManagerRef typeManager, TypeRef type, IDataProcs *pAlloc);
    IDataProcs*    _pDataProcs;
public:
    static CustomDataProcType* New(TypeManagerRef typeManager, TypeRef type, IDataProcs *pIAlloc);
    virtual void    Accept(TypeVisitor *tv)             { tv->VisitCustomDataProc(this); }
    virtual NIError InitData(void* pData, TypeRef pattern = null)   { return _pDataProcs->InitData(_wrapped, pData, pattern ? pattern : this); }
    virtual NIError CopyData(const void* pData, void* pDataCopy) { return _pDataProcs->CopyData(_wrapped, pData, pDataCopy); }
    virtual NIError ClearData(void* pData)              { return _pDataProcs->ClearData(_wrapped, pData); }
};

//------------------------------------------------------------
typedef TypedArrayCore *TypedArrayCoreRef, *TypedObjectRef, TypedBlock; // TODO get rid of TypedBlock   ->TypeBlock ObjectRef??
typedef TypedBlock *TypedBlockRef;  // TODO => merge into ArrayCoreRef

//! The core C++ implimentation for ArrayType typed data's value.
class TypedArrayCore
{
protected:
    // Pointer to the array's first element (AFEP)
    AQBlock1*               _pRawBufferBegin;
    
    // Array's type may be more generic than a spefic instance of an array.
    TypeRef                 _typeRef;

    // Specific type an instance is an array of.
    TypeRef                 _eltTypeRef;

    // Number of total elements there is capacity for in the managed block of memory.
    IntIndex                _capacity;

    // _dimensionAndSlabLengths works as follows
    // For example, in an array of Rank 2, there will be 2 DimensionLengths followed by
    // 2 slabLengths. slabLengths are precalculated in AQSize used for indexing.
    // For the inner most dimension the slab length is the length of the element.
    // Final offset is the dot product of the index vector and the slabLength vector.
private:
    IntIndex                _dimensionAndSlabLengths[2];
public:
    IntIndex  Rank()                { return _typeRef->Rank(); }
    IntIndex* GetDimensionLengths() { return _dimensionAndSlabLengths; }
    IntIndex* GetSlabLengths()      { return &_dimensionAndSlabLengths[0] + Rank(); }
    
protected:
    static IntIndex StructSize(Int32 rank)  { return sizeof(TypedArrayCore) + ((rank-1) * sizeof(IntIndex) * 2); }
    TypedArrayCore(TypeRef type);
public:
    static TypedArrayCoreRef New(TypeRef type);
    static void Delete(TypedArrayCoreRef);

public:
    AQBlock1* BeginAt(IntIndex index)
    {
        VIREO_ASSERT(index >= 0)
        VIREO_ASSERT(ElementType() != null)
        AQBlock1* begin = (RawBegin() + (index * ElementType()->TopAQSize()));
        return begin;
    }
    AQBlock1* BeginAtNDIndirect(Int32 rank, IntIndex** pDimIndexes);

public:
    void* RawObj()                  { VIREO_ASSERT(Rank() == 0); return RawBegin(); } // some extra asserts fo  ZDAs
    AQBlock1* RawBegin()            { return _pRawBufferBegin; }
    void* BeginAtAQ(IntIndex index) { return RawBegin() + index; }
    
public:
    //! Array's type.
    TypeRef Type()                  { return _typeRef; }
    
    //! The element type of this array instance. This type may be more specific than the element in Array's Type.
    TypeRef ElementType()           { return _eltTypeRef; }
    Boolean SetElementType(TypeRef, Boolean preserveElements);
    
protected:
    Boolean AQAlloc(IntIndex countBytes);
    Boolean AQRealloc(IntIndex countBytes, IntIndex preserveBytes);
    void AQFree();
    
public:
    //! A minimal sanity check, it could do more.
    static Boolean ValidateHandle(TypedArrayCoreRef block)
    {
        return (block != null);
    }
    
    IntIndex GetLength(IntIndex i);
    
    // Total Length  (product of all dimension lengths)
    // For actual arrays (not types) this will always be regular whole number.
    // Types may be variable, fixed, or bounded.
    IntIndex InternalCalculateLength();
    IntIndex Length()       { return Rank() == 1 ? *GetDimensionLengths() :  InternalCalculateLength(); }

    //! Returns the maximum number of elements the current underlying storage could hold.
    IntIndex Capacity()     { return abs(_capacity); }
    
    //! Attempt to grow the capacity of the array so that resizing the dimensions will not need
    // to realloc the underlying storage. This is a soft request and underlying system may reclaim the memory.
    // This method has no effect on fixed or bounded arrays. Returns true if the array capacity
    // is greater than or equal to the amount requested.
    Boolean Reserve(IntIndex length)        { return length <= Capacity(); }
    
    //! Calculate the length of a contigious chunk of elements
    IntIndex AQBlockLength(IntIndex count)  { return ElementType()->TopAQSize() * count; }
    
    //! Resize for multi dim arrays
    Boolean ResizeDimensions(Int32 rank, IntIndex *dimensionLengths, Boolean preserveOld);
    
    //! Make this array match the shape of the reference type.
    Boolean ResizeToMatchOrEmpty(TypedArrayCoreRef pReference);
    
    //! Resize for 1d arrays, if not enough memory leave as is.
    Boolean Resize1D(IntIndex length)       { return ResizeDimensions(1, &length, true); }
    
    //! Resize, if not enough memory, then size to zero
    Boolean Resize1DOrEmpty(IntIndex length);

private:
    //! Resize the underlying block of memory. It DOES NOT update any dimension information. Returns true if success.
    Boolean ResizeCapacity(IntIndex aqLength, IntIndex currentLength, IntIndex length, Boolean reserveExists);
    
public:
    NIError Replace1D(IntIndex position, IntIndex count, const void* pSource, Boolean truncate);
    NIError Insert1D(IntIndex position, IntIndex count, const void* pSource = null);
    NIError Remove1D(IntIndex position, IntIndex count);    
};

//------------------------------------------------------------
//! A template class to allow C++ type safe access to select ArrayType values
template <class T>
class TypedArray1D : public TypedArrayCore
{
public:
    T* Begin()                  { return (T*) TypedArrayCore::RawBegin(); }
    T* End()                    { return (T*) Begin() + Length(); }
    T  At(IntIndex index)       { return *(T*) BeginAt(index);};
    T* BeginAt(IntIndex index)  { return (T*) TypedArrayCore::BeginAt(index); }
    T* BeginAtNDIndirect(Int32 rank, IntIndex* pDimIndexes) { return (T*) TypedArrayCore::BeginAtNDIndirect(rank, pDimIndexes); }

    template <class T2> T2 AtAQ(IntIndex index)         { return *(T2*)BeginAtAQ(index); }
    
    NIError Append(T element)                           { return Insert1D(Length(), 1, &element); }
    NIError Append(IntIndex count, const T* pElements)  { return Insert1D(Length(), count, pElements); }
    NIError Append(TypedArray1D* array) { return Insert1D(Length(), array->Length(), array->Begin()); }
    NIError CopyFrom(IntIndex count, const T* pElements){ return Replace1D(0, count, pElements, true); }
};

//------------------------------------------------------------
//! A template class to allow C++ type safe access to a Vireo object values
template <class T>
class TypedObject : public TypedArrayCore
{
public:
    T* ObjBegin()                    { return (T*) RawObj(); }
};

//------------------------------------------------------------
//! Vireo string type. Must be allocated by TypeManager not raw C++
class String : public TypedArray1D< Utf8Char >
{
public:
    SubString MakeSubStringAlias()              { return SubString(Begin(), End()); }
    void CopyFromSubString(SubString* string)   { CopyFrom(string->Length(), string->Begin()); }
    void AppendCStr(const char* cstr)           { Append((IntIndex)strlen(cstr), (Utf8Char*)cstr); }
    void AppendSubString(SubString* string)     { Append((IntIndex)string->Length(), (Utf8Char*)string->Begin()); }
};

typedef String *StringRef;
typedef TypedArray1D< UInt8 > BinaryBuffer, *BinaryBufferRef;
typedef TypedArray1D< Int32 > Int32Array1D;
typedef TypedArray1D< StringRef > StringArray1D, *StringArray1DRef;
typedef TypedArray1D< TypeRef > TypeRefArray1D;

//------------------------------------------------------------
//! Stack class to create a CString from Vireo String.
class TempStackCStringFromString : public TempStackCString
{
public:
    TempStackCStringFromString(StringRef string)
    : TempStackCString(string->Begin(), string->Length())
    { }
};

//------------------------------------------------------------
// Utility functions to read and write numbers to non aligned memory based on size and encoding
NIError ReadIntFromMemory(EncodingEnum encoding, Int32 aqSize, void* pData, IntMax* pValue);
NIError WriteIntToMemory(EncodingEnum encoding, Int32 aqSize, void* pData, IntMax value);
NIError ReadDoubleFromMemory(EncodingEnum encoding, Int32 aqSize, void* pData, Double* pValue);
NIError WriteDoubleToMemory(EncodingEnum encoding, Int32 aqSize, void* pData, Double value);

//------------------------------------------------------------
TypeRef InstantiateTypeTemplate(TypeManagerRef tm, TypeRef typeTemplate, SubVector<TypeRef>*);

} // namespace Vireo

#endif //TypeAndDataManager_h
