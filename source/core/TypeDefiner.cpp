/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include "DataTypes.h"
#include "TypeAndDataManager.h"
#include "TDCodecVia.h"
#include "TypeDefiner.h"

namespace Vireo {

//------------------------------------------------------------
// TypeDefiner - class for modules to register types
//------------------------------------------------------------
// The constructor for each TypeDefiner global will link itself
// into the gpTypeDefinerList. The order can not be guaranteed.
// but all global constructors will be called before the apps
// main entry point is called.
TypeDefiner* gpTypeDefinerList = null;

void TypeDefiner::DefineTypes(TypeManagerRef tm)
{
    TypeDefiner* pItem = gpTypeDefinerList;
    while (pItem) {
        pItem->_pCallback(tm);
        pItem = pItem->_pNext;
    }
}
//------------------------------------------------------------
TypeDefiner::TypeDefiner(TypeDefinerCallback callback, const char* pNameSapce, Int32 version)
{
    VIREO_ASSERT(version == kVireoABIVersion)
    _pNext = gpTypeDefinerList;
    _pCallback = callback;
    _pNameSpace = pNameSapce;
    gpTypeDefinerList = this;
}
//------------------------------------------------------------
TypeRef TypeDefiner::Define(TypeManagerRef tm, const char* name, const char* typeString)
{
    SubString typeName(name);
    SubString wrappedTypeString(typeString);
    return Define(tm, &typeName, &wrappedTypeString);
}
//------------------------------------------------------------
TypeRef TypeDefiner::ParseAndBuidType(TypeManagerRef tm, SubString* typeString)
{
    TypeManagerScope scope(tm);

    EventLog log(EventLog::StdOut);
    TDViaParser parser(tm, typeString, &log, 1);
    return parser.ParseType();
}
//------------------------------------------------------------
TypeRef TypeDefiner::Define(TypeManagerRef tm, SubString* typeName, SubString* typeString)
{
    TypeManagerScope scope(tm);
    TypeRef type = ParseAndBuidType(tm, typeString);
    
    if (typeName->Length()) {
        // Use the name if provided, else it an anonymous type.
        type = tm->Define(typeName, type);
    }
    return type;
}
//------------------------------------------------------------
#if defined (VIREO_INSTRUCTION_REFLECTION)
void TypeDefiner::DefineCustomPointerTypeWithValue(TypeManagerRef tm, const char* name, void* instruction, const char* typeCStr, PointerTypeEnum pointerType, const char* cname)
{
    SubString typeString(typeCStr);
    TypeRef type = ParseAndBuidType(tm, &typeString);
    
    tm->DefineCustomPointerTypeWithValue(name, (void*)instruction, type, pointerType, cname);
}
#else
void TypeDefiner::DefineCustomPointerTypeWithValue(TypeManagerRef tm, const char* name, void* instruction, const char* typeCStr, PointerTypeEnum pointerType)
{
    SubString typeString(typeCStr);
    TypeRef type = ParseAndBuidType(tm, &typeString);
    
    tm->DefineCustomPointerTypeWithValue(name, (void*)instruction, type, pointerType);
}
#endif
//------------------------------------------------------------
void TypeDefiner::DefineCustomDataProcs(TypeManagerRef tm, const char* name, IDataProcs* pDataProcs, const char* typeCStr)
{
    SubString typeString(typeCStr);
    TypeRef type = ParseAndBuidType(tm, &typeString);
    
    tm->DefineCustomDataProcs(name, pDataProcs, type);
}
//------------------------------------------------------------
void TypeDefiner::DefineCustomValue(TypeManagerRef tm, const char* name, Int32 value, const char* typeString)
{
    SubString string(typeString);
    
    TDViaParser parser(tm, &string, null, 1);
    TypeRef t = parser.ParseType();

    DefaultValueType *cdt = DefaultValueType::New(tm, t, false);
    
    if (cdt->BitEncoding() == kEncoding_SInt && cdt->TopAQSize() == 4) {
        *(Int32*)cdt->Begin(kPAInit) = value;
    
        string.AliasAssignCStr(name);
        tm->Define(&string, cdt);
    }
}
//------------------------------------------------------------
void TypeDefiner::ParseValue(TypeManagerRef tm, TypeRef defaultValueType, EventLog* log, Int32 lineNumber, SubString* valueString)
{
    TDViaParser parser(tm, valueString, log, lineNumber);

    parser.ParseData(defaultValueType, defaultValueType->Begin(kPAInit));
}
//------------------------------------------------------------
void TypeDefiner::DefineStandardTypes(TypeManagerRef tm)
{
    // Numeric types and Boolean
    Define(tm, "Boolean",       "c(e(bb(1 Boolean)))");
    Define(tm, "*",             "c(e(bb(* Generic)))");
    // Integer
    Define(tm, "UInt8",         "c(e(bb(8 UInt)))");
    Define(tm, "Int8",          "c(e(bb(8 SInt)))");
    Define(tm, "UInt16",        "c(e(bb(16 UInt)))");
    Define(tm, "Int16",         "c(e(bb(16 SInt)))");
    // UInt32
    Define(tm, "UInt32Atomic",  "c(e(bb(32 UInt)))");
    Define(tm, "UInt32Cluster", "c(e(.UInt16 HiWord) e(.UInt16 LoWord))");
    Define(tm, "UInt32",        "eq(e(.UInt32Atomic) e(.UInt32Cluster))");
    // Integer Int32
    Define(tm, "Int32",         "c(e(bb(32 SInt)))");
    Define(tm, "UInt64",        "c(e(bb(64 UInt)))");
    Define(tm, "Int64",         "c(e(bb(64 SInt)))");
    Define(tm, "Block128",      "c(e(bb(128 Bits)))");
    Define(tm, "Block256",      "c(e(bb(256 Bits)))");
#if 1
    // TODO These could be moved out of the core once there is a way to order
    // module initialization
    
    // Floating-point Single
#if defined(VIREO_TYPE_Single)
    Define(tm, "SingleAtomic",  "c(e(bb(32 IEEE754B)))");
    Define(tm, "SingleCluster", "c(e(bc(e(bb(1 Boolean) sign) e(bb(8 IntBiased) exponent) e(bb(23 Q1) fraction))))");
    Define(tm, "Single",        "eq(e(.SingleAtomic) e(.SingleCluster))");
#endif
    // Floating-point Double
#if defined(VIREO_TYPE_Double)
    Define(tm, "DoubleAtomic",  "c(e(bb(64 IEEE754B)))");
    Define(tm, "DoubleCluster", "c(e(bc(e(bb(1 Boolean) sign)  e(bb(11 IntBiased)  exponent)  e(bb(52 Q1)  fraction))))");
    Define(tm, "Double",        "eq(e(.DoubleAtomic) e(.DoubleCluster))");
#endif
    // ComplexNumbers
#if defined(VIREO_TYPE_ComplexSingle)
    Define(tm, "ComplexSingle", "c(e(.Single real) e(.Single imaginary))");
#endif
#if defined(VIREO_TYPE_ComplexDouble)
    Define(tm, "ComplexDouble", "c(e(.Double real) e(.Double imaginary))");
#endif
#endif
    // Time
    Define(tm, "Time",          "c(e(.Int64 seconds) e(.UInt64 fractions))");
    // String and character types
    Define(tm, "AsciiChar", "c(e(bb(8 Ascii)))");
    Define(tm, "Utf8Char", "c(e(bb(8 Unicode)))");
    
    Define(tm, "AsciiArray1D", "a(.AsciiChar *)");   // beware multibyte encodings
    Define(tm, "Utf8Array1D", "a(.Utf8Char *)");     // beware multibyte encodings
    
    Define(tm, "String", ".Utf8Array1D");
    Define(tm, "AsciiString", ".AsciiArray1D");
    
    Define(tm, "StringArray1D", "a(.String *)");
    
    // Special types for the execution system.
    Define(tm, "CodePointer", "c(e(bb(HostPointerSize Pointer)))");
    Define(tm, "DataPointer", "c(e(bb(HostPointerSize Pointer)))");
    Define(tm, "BranchTarget", ".DataPointer");
    
    // Pointer to root clump of a VI
    Define(tm, "VI", ".DataPointer");  // Parameter is name, it gets resolved to first clump for SubVI
    Define(tm, "EmptyParameterList", "c()");  // Parameter is name, it gets resolved to first clump for SubVI
    
    // Clump - 0 based index into VIs array of clumps
    Define(tm, "Clump", ".DataPointer");  // Parameter is index
    
    // Type - describes a variable that is of type Type. (e.g. pointer to TypeRef)
    Define(tm, "Type", ".DataPointer");
    Define(tm, "TypeManager", ".DataPointer");
    
    // StaticType - describes type determined at load/compile time. Not found on user diagrams (e.g. A TypeRef)
    Define(tm, "StaticType", ".DataPointer");
    
    Define(tm, "Object", ".DataPointer");
    Define(tm, "Array", ".DataPointer");   // Object with Rank > 0
    Define(tm, "Array1D", ".DataPointer");
    Define(tm, "Variant", ".DataPointer"); // TODO is this any different from the Type type if the type has a default value?
    
    // VarArgCount - Used in prototypes for vararg functions.
    // This parameter will be constant number, not a pointer to a number
    Define(tm, "VarArgCount", ".DataPointer");
    
    // StaticTypeAndData - Used in prototypes for polymorphic functions.
    // Static type paired with a pointer to runtime data.
    // The Compiler/Assembler will pass both a TypeRef and a DataPointer
    // for each parameter of this type.
    Define(tm, "StaticTypeAndData", "c(e(.StaticType) e(.DataPointer))");
    
    Define(tm, "WaitableState", "c(e(.DataPointer object)e(.DataPointer next)e(.DataPointer clump)e(.Int64 info))");
    Define(tm, "SubString", "c(e(.DataPointer begin)e(.DataPointer end))");
}

}

 