// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief Tools for registering Vireo types defined in C++ modules
 */

#ifndef TypeDefiner_h
#define TypeDefiner_h

#include "TypeAndDataManager.h"

//------------------------------------------------------------
namespace Vireo {

class EventLog;
class TypeDefiner;
typedef ConstCStr (*TypeDefinerCallback)(TypeDefiner* _this, TypeManagerRef typeManager);

//------------------------------------------------------------
//! Facilitate the registration of Vireo types that are defined in C++ code.
class TypeDefiner
{
 private:
    TypeDefiner*            _pNext;
    TypeDefinerCallback     _pCallback;
    ConstCStr               _pModuleName;
 public:
    //! Add core primitive types to the specified TypeManager
    static void DefineStandardTypes(TypeManagerRef tm);

    //! Add registered types to the specified TypeManager
    static void DefineTypes(TypeManagerRef tm);

    //! Use the TypeDefiners parser to parse data according to specified type.
    static void ParseData(TypeManagerRef tm, DefaultValueType* defaultValueType, EventLog* log,
                          Int32 lineNumber, SubString* valueString);

    //! Use the TypeDefiners parser to parse a stand alone literal value with type inferred from grammar.
    static TypeRef ParseLiteral(TypeManagerRef tm, TypeRef patternType, EventLog* log,
                                Int32 lineNumber, SubString* valueString);

    //@{
    /** Methods used by C++ modules to register Vireo type definitions. */
    TypeDefiner(TypeDefinerCallback callback, ConstCStr pModuleName, Int32 version);
    static TypeRef Define(TypeManagerRef tm, ConstCStr name, ConstCStr typeString);
    static TypeRef Define(TypeManagerRef tm, SubString* typeName, SubString* typeString);
    static TypeRef ParseAndBuildType(TypeManagerRef tm, SubString* typeString);
    static Boolean HasRequiredModule(TypeDefiner* _this, ConstCStr name);
    static void InsertPastRequirement(TypeDefiner** ppNext, TypeDefiner* module, ConstCStr requirementName);

#if defined(VIREO_INSTRUCTION_REFLECTION)
    static void DefineCustomPointerTypeWithValue(TypeManagerRef tm, ConstCStr name, void* pointer,
                                                 ConstCStr typeCStr, PointerTypeEnum pointerType,
                                                 ConstCStr cname);
#else
    static void DefineCustomPointerTypeWithValue(TypeManagerRef tm, ConstCStr name, void* pointer,
                                                 ConstCStr typeString, PointerTypeEnum pointerType);
#endif
    static void DefineCustomValue(TypeManagerRef tm, ConstCStr name, Int32 value, ConstCStr typeString);
    static void DefineCustomDataProcs(TypeManagerRef tm, ConstCStr name, IDataProcs* pDataProcs,
                                      ConstCStr typeCStr);
 private:
    static TypeDefiner* _gpTypeDefinerList;
    //@}

    //! Basic PackageResolver
 public:
    static void ResolvePackage(SubString* packageName, StringRef packageContents);
};

}  // namespace Vireo

#define TOKENPASTE(x, y, z)    x ## y ## z
#define TOKENPASTE2(x, y, z)   TOKENPASTE(x, y, z)

#ifdef VIREO_STATIC_LINK

    // In static link mode there is no symbol table so all the symbol table registration
    // code disappears.

    #define DEFINE_VIREO_BEGIN(_module_)

    #define DEFINE_VIREO_END()

    #define DEFINE_VIREO_REQUIRE(_module_)

    #define DEFINE_VIREO_TYPE(_name_, _type_)

    #define DEFINE_VIREO_FUNCTION(_name_, _typeTypeString_)

    #define DEFINE_VIREO_FUNCTION_CUSTOM(_symbol_, _name_, _typeTypeString_)

    #define DEFINE_VIREO_VALUE(_name_, value, _typeTypeString_)

    #define DEFINE_VIREO_GENERIC(_name_, _typeTypeString_, _genericEmitProc_)

    #define DEFINE_VIREO_CUSTOM_DP(_name_, _type_, _dataProcs_)

#else

    // With non-unique names(AKA overloaded) only the C entry points are appended.
    #define DEFINE_VIREO_FUNCTION_TYPED(_root_, _type_, _proto_)  DEFINE_VIREO_FUNCTION_CUSTOM(_root_, _root_##_type_, _proto_)
    #define DEFINE_VIREO_FUNCTION_2TYPED(_root_, _type1_, _type2_, _proto_)  DEFINE_VIREO_FUNCTION_CUSTOM(_root_, _type1_##_root_##_type2_, _proto_)

    #define DEFINE_VIREO_BEGIN_DYNAMIC_MODULE(_module_) \
    static ConstCStr TOKENPASTE2(DefineTypes, _module_, __LINE__) (TypeDefiner* _this, TypeManagerRef tm); \
    extern "C" RegisterDynamicVireoModule() {} \
    static TypeDefiner TOKENPASTE2(TheTypeDefiner, _module_, __LINE__) ( \
        TOKENPASTE2(DefineTypes, _module_, __LINE__), #_module_, kVireoABIVersion); \
    static ConstCStr TOKENPASTE2(DefineTypes, _module_, __LINE__) (TypeDefiner* _this, TypeManagerRef tm) {
    #define DEFINE_VIREO_BEGIN(_module_) \
      static ConstCStr TOKENPASTE2(DefineTypes, _module_, __LINE__) (TypeDefiner* _this, TypeManagerRef tm); \
      static TypeDefiner TOKENPASTE2(TheTypeDefiner, _module_, __LINE__) ( \
        TOKENPASTE2(DefineTypes, _module_, __LINE__), #_module_, kVireoABIVersion); \
      static ConstCStr TOKENPASTE2(DefineTypes, _module_, __LINE__) (TypeDefiner* _this, TypeManagerRef tm) {
    #define DEFINE_VIREO_END()  return nullptr; }

    // Used immediately after the BEGIN
    #define DEFINE_VIREO_REQUIRE(_module_) \
      { ConstCStr moduleName = #_module_;   \
      if (!TypeDefiner::HasRequiredModule(_this, moduleName)) { return moduleName; } }

    #define DEFINE_VIREO_TYPE(_name_, _type_) \
      (TypeDefiner::Define(tm, #_name_, _type_));

#if defined(VIREO_INSTRUCTION_REFLECTION)
    #define DEFINE_VIREO_FUNCTION(_name_, _typeTypeString_) \
      (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_name_, _typeTypeString_, \
        kPTInstructionFunction, #_name_));

    #define DEFINE_VIREO_FUNCTION_CUSTOM(_name_, _cfunction_, _typeTypeString_) \
      (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_cfunction_, _typeTypeString_, \
        kPTInstructionFunction, #_cfunction_));

    #define DEFINE_VIREO_GENERIC(_name_, _typeTypeString_, _genericEmitProc_) \
      (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_genericEmitProc_, _typeTypeString_, \
        kPTGenericFunctionCodeGen, #_name_));

#else
    #define DEFINE_VIREO_FUNCTION(_name_, _typeTypeString_) \
      (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_name_, _typeTypeString_, \
        kPTInstructionFunction));

    #define DEFINE_VIREO_FUNCTION_CUSTOM(_name_, _cfunction_, _typeTypeString_) \
      (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_cfunction_, _typeTypeString_, \
        kPTInstructionFunction));

    #define DEFINE_VIREO_GENERIC(_name_, _typeTypeString_, _genericEmitProc_) \
      (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_genericEmitProc_, _typeTypeString_, \
        kPTGenericFunctionCodeGen));

#endif  // defined(VIREO_INSTRUCTION_REFLECTION)

    #define DEFINE_VIREO_VALUE(_name_, value, _typeTypeString_) \
      (TypeDefiner::DefineCustomValue(tm, #_name_, value, _typeTypeString_));

    #define DEFINE_VIREO_CUSTOM_DP(_name_, _type_, _dataProcs_) \
      (TypeDefiner::DefineCustomDataProcs(tm, #_name_, _dataProcs_, _type_));

#endif  // else VIREO_STATIC_LINK

#endif  // TypeDefiner_h

