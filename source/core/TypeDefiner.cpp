/**

Copyright (c) 2014-2015 National Instruments Corp.

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
TypeDefiner* TypeDefiner::_gpTypeDefinerList = null;

//------------------------------------------------------------
//! Constructor used by DEFINE_VIREO_BEGIN blocks
TypeDefiner::TypeDefiner(TypeDefinerCallback callback, ConstCStr pModuleName, Int32 version)
{
    VIREO_ASSERT(version == kVireoABIVersion)
    
    // Append to end since constructors called in the order
    // they occurr in  a file.
    TypeDefiner** ppNext = &_gpTypeDefinerList;
    while (*ppNext) {
        ppNext = &(*ppNext)->_pNext;
    }
    _pNext = null;
    *ppNext = this;
    _pCallback = callback;
    _pModuleName = pModuleName;
}
//------------------------------------------------------------
//! Call all registered module functions. Move items down the list as needed.
void TypeDefiner::DefineTypes(TypeManagerRef tm)
{
    TypeDefiner** ppNext = &_gpTypeDefinerList;
    while (*ppNext) {
        TypeDefiner *pCurrent = *ppNext;
        ConstCStr missingModule = (pCurrent)->_pCallback(pCurrent, tm);
        // have it return a pointer to what it was missing, null if nothing.
        if (missingModule != null) {
            // 1. Pull the current item out of the list.
            *ppNext = pCurrent->_pNext;
            pCurrent->_pNext = null;
            
            // 2. Find the right place to insert it.
            InsertPastRequirement(ppNext, pCurrent, missingModule);
        } else {
            ppNext = &(*ppNext)->_pNext;
        }
    }
}
//------------------------------------------------------------
//! Insert a module registration past an element it requires.
void TypeDefiner::InsertPastRequirement(TypeDefiner** ppNext, TypeDefiner* module, ConstCStr requirementName)
{
    while (*ppNext) {
        if (strcmp(requirementName, (*ppNext)->_pModuleName) == 0) {
            module->_pNext = (*ppNext)->_pNext;
            (*ppNext)->_pNext = module;
            return;
        } else {
            ppNext = &(*ppNext)->_pNext;
        }
    }
}
//------------------------------------------------------------
//! Verifiy a required module has been loaded. Called by registration visitor callbacks.
Boolean TypeDefiner::HasRequiredModule(TypeDefiner* _this, ConstCStr name)
{
    TypeDefiner* pDefiner = _gpTypeDefinerList;
    // Walk down the list until found, or the
    // the one making the query is encountered.
    while (pDefiner && pDefiner != _this) {
        if (strcmp(name, pDefiner->_pModuleName) == 0) {
            return true;
        }
        pDefiner = pDefiner->_pNext;
    }
    return false;
}
//------------------------------------------------------------
//! Define an anonymous type.
TypeRef TypeDefiner::ParseAndBuidType(TypeManagerRef tm, SubString* typeString)
{
    TypeManagerScope scope(tm);
    
    EventLog log(EventLog::StdOut);
    TDViaParser parser(tm, typeString, &log, 1);
    return parser.ParseType();
}
//------------------------------------------------------------
//! Define a namned type from C strings.
TypeRef TypeDefiner::Define(TypeManagerRef tm, ConstCStr name, ConstCStr typeString)
{
    SubString typeName(name);
    SubString wrappedTypeString(typeString);
    return Define(tm, &typeName, &wrappedTypeString);
}
//------------------------------------------------------------
//! Define a namned type from SubStrings.
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
void TypeDefiner::DefineCustomPointerTypeWithValue(TypeManagerRef tm, ConstCStr name, void* pointer, ConstCStr typeCStr, PointerTypeEnum pointerType, ConstCStr cname)
{
    SubString typeString(typeCStr);
    TypeRef type = ParseAndBuidType(tm, &typeString);

    tm->DefineCustomPointerTypeWithValue(name, (void*)pointer, type, pointerType, cname);
}
#else
void TypeDefiner::DefineCustomPointerTypeWithValue(TypeManagerRef tm, ConstCStr name, void* pointer, ConstCStr typeCStr, PointerTypeEnum pointerType)
{
    SubString typeString(typeCStr);
    TypeRef type = ParseAndBuidType(tm, &typeString);

    tm->DefineCustomPointerTypeWithValue(name, (void*)pointer, type, pointerType);
}
#endif
//------------------------------------------------------------
void TypeDefiner::DefineCustomDataProcs(TypeManagerRef tm, ConstCStr name, IDataProcs* pDataProcs, ConstCStr typeCStr)
{
    SubString typeString(typeCStr);
    TypeRef type = ParseAndBuidType(tm, &typeString);

    tm->DefineCustomDataProcs(name, pDataProcs, type);
}
//------------------------------------------------------------
void TypeDefiner::DefineCustomValue(TypeManagerRef tm, ConstCStr name, Int32 value, ConstCStr typeString)
{
    SubString string(typeString);

    TDViaParser parser(tm, &string, null, 1);
    TypeRef t = parser.ParseType();

    DefaultValueType *cdt = DefaultValueType::New(tm, t, false);

    if (cdt->BitEncoding() == kEncoding_SInt2C && cdt->TopAQSize() == 4) {
        *(Int32*)cdt->Begin(kPAInit) = value;

        string.AliasAssignCStr(name);
        tm->Define(&string, cdt);
    }
}
//------------------------------------------------------------
//! Parse a value from a stream to set the value of a DefaulValueType.
void TypeDefiner::ParseData(TypeManagerRef tm, DefaultValueType* defaultValueType, EventLog* log, Int32 lineNumber, SubString* valueString)
{
    TDViaParser parser(tm, valueString, log, lineNumber);
    parser.ParseData(defaultValueType, defaultValueType->Begin(kPAInit));
}
//------------------------------------------------------------
//! Parse a value to creaate a literal constant.
TypeRef TypeDefiner::ParseLiteral(TypeManagerRef tm, TypeRef patternType, EventLog* log, Int32 lineNumber, SubString* valueString)
{
    TDViaParser parser(tm, valueString, log, lineNumber);
    // ParseType supports value literals and type literals (that also have a value)  
    return parser.ParseType(patternType);
}
//------------------------------------------------------------
void TypeDefiner::DefineStandardTypes(TypeManagerRef tm)
{
    // Numeric types and Boolean
    Define(tm, "Boolean",       "c(e(bb(1 Boolean)))");
    Define(tm, tsWildCard,      "c(e(bb(* Generic)))");
    // Integer
    Define(tm, "UInt8",         "c(e(bb(8 UInt)))");
    Define(tm, "Int8",          "c(e(bb(8 SInt2c)))");
    Define(tm, "UInt16",        "c(e(bb(16 UInt)))");
    Define(tm, "Int16",         "c(e(bb(16 SInt2c)))");
    // UInt32
    Define(tm, "UInt32Atomic",  "c(e(bb(32 UInt)))");
    Define(tm, "UInt32Cluster", "c(e(.UInt16 HiWord) e(.UInt16 LoWord))");
    Define(tm, "UInt32",        "eq(e(.UInt32Atomic) e(.UInt32Cluster))");
    // Integer Int32
    Define(tm, "Int32",         "c(e(bb(32 SInt2c)))");
    Define(tm, "UInt64",        "c(e(bb(64 UInt)))");
    Define(tm, "Int64",         "c(e(bb(64 SInt2c)))");
    
    Define(tm, "Block128",      "c(e(bb(128 Bits)))");
    Define(tm, "Block256",      "c(e(bb(256 Bits)))");

    // String and character types
    Define(tm, "Utf8Char", "c(e(bb(8 Unicode)))");  // A single octet of UTF-8, may be lead or continutation octet
    Define(tm, "Utf32Char", ".Int32");              // A single Unicode codepoint (no special encoding or escapes)
    Define(tm, "Utf8Array1D", "a(.Utf8Char *)");    // Should bevalid UTF-8 encoding. No partial or overlong elements
    Define(tm, "String", ".Utf8Array1D");
    Define(tm, "StringArray1D", "a(.String *)");

    // Special types for the execution system.
    Define(tm, "CodePointer", "c(e(bb(HostPointerSize Pointer)))");
    Define(tm, "DataPointer", "c(e(bb(HostPointerSize Pointer)))");
    Define(tm, "BranchTarget", ".DataPointer");
    Define(tm, "Instruction", ".DataPointer");
    Define(tm, "VI", ".DataPointer");  // Parameter is name, it gets resolved to first clump for SubVI

    // Type - describes a variable that is of type Type. (e.g. pointer to TypeRef)
    Define(tm, tsTypeType, ".DataPointer");
//    Define(tm, tsTypeManagerType, ".DataPointer");

    Define(tm, "Object", ".DataPointer");
    Define(tm, "Array", ".DataPointer");    // Object with Rank > 0
    Define(tm, "Array1D", ".DataPointer");
    Define(tm, "Variant", ".DataPointer");  // TODO is this any different from the Type type if the type has a default value?

    // VarArgCount - Used in prototypes for vararg functions.
    // This parameter will be constant number, not a pointer to a number
    Define(tm, "VarArgCount", ".DataPointer");

    // StaticType - describes type determined at load/compile time. Not found on user diagrams (e.g. A TypeRef)
    Define(tm, "StaticType", ".DataPointer");
    
    // StaticTypeAndData - Used in prototypes for polymorphic functions.
    // Static type paired with a pointer to runtime data.
    // The Compiler/Assembler will pass both a TypeRef and a DataPointer
    // for each parameter of this type.
    Define(tm, "StaticTypeAndData", "c(e(.StaticType) e(.DataPointer))");
 
    Define(tm, "SubString", "c(e(.DataPointer begin)e(.DataPointer end))");
}

}  // namespace Vireo
