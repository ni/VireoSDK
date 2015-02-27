/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief Tools for registering Vireo types defined in C++ modules
 */

#ifndef TypeDefiner_h
#define TypeDefiner_h

#include "TypeAndDataManager.h"

//------------------------------------------------------------
namespace Vireo {

typedef void (*TypeDefinerCallback)(TypeManagerRef typeManager);

class EventLog;

//! Facilitate the registration of Vireo types that are defined in C++ code.
class TypeDefiner
{
private:
    TypeDefiner*            _pNext;
    TypeDefinerCallback     _pCallback;
    ConstCStr               _pNameSpace;
public :
    //! Add core primitive types to the specified TypeManager
    static void DefineStandardTypes(TypeManagerRef tm);
    //! Add registered types to the specified TypeManager
    static void DefineTypes(TypeManagerRef tm);
    
    //! Use the TypeDefiners parser to parse data according to specified type.
    static void ParseValue(TypeManagerRef tm, TypeRef defaultValueType, EventLog* log, Int32 lineNumber, SubString* valueString);

    //@{
    /** Methods used by C++ modules to register Vireo type definitions. */
    TypeDefiner(TypeDefinerCallback pCallback, ConstCStr pNameSapce, Int32 version);
    static TypeRef Define(TypeManagerRef tm, ConstCStr name, ConstCStr typeCStr);
    static TypeRef Define(TypeManagerRef tm, SubString* name, SubString* wrappedTypeString);
    static TypeRef ParseAndBuidType(TypeManagerRef tm, SubString* typeString);
    // static void RequireType(ConstCStr name);
#if defined(VIREO_INSTRUCTION_REFLECTION)
    static void DefineCustomPointerTypeWithValue(TypeManagerRef tm, ConstCStr name, void* instruction, ConstCStr typeString,PointerTypeEnum pointerType, ConstCStr cname);
#else
    static void DefineCustomPointerTypeWithValue(TypeManagerRef tm, ConstCStr name, void* instruction, ConstCStr typeString,PointerTypeEnum pointerType);
#endif
    static void DefineCustomValue(TypeManagerRef tm, ConstCStr name, Int32 value, ConstCStr typeString);
    static void DefineCustomDataProcs(TypeManagerRef tm, ConstCStr name, IDataProcs* pDataProcs, ConstCStr typeString);
    //@}
    
};

}

#define TOKENPASTE(x, y, z)    x ## y ## z
#define TOKENPASTE2(x, y, z)   TOKENPASTE(x, y, z)


#ifdef VIREO_STATIC_LINK

    // In static link mode there is no symbol table so all the symbol table registration
    // code disappears.

    #define DEFINE_VIREO_BEGIN(_section_)
    #define DEFINE_VIREO_END()

    #define DEFINE_VIREO_TYPE(_name_, _type_) \

    #define DEFINE_VIREO_FUNCTION(_name_, _typeTypeString_)

    #define DEFINE_VIREO_FUNCTION_CUSTOM(_symbol_, _name_, _typeTypeString_)

    #define DEFINE_VIREO_VALUE(_name_, value, _typeTypeString_)

    #define DEFINE_VIREO_GENERIC(_name_, _typeTypeString_, _genericEmitProc_)

    #define DEFINE_VIREO_CUSTOM_DP(_name_, _type_, _allocClass_)

#else

#define DEFINE_VIREO_BEGIN(_section_) \
static void TOKENPASTE2(DefineTypes, _section_, __LINE__) (TypeManagerRef tm); \
static TypeDefiner TOKENPASTE2(TheTypeDefiner, _section_, __LINE__) (TOKENPASTE2(DefineTypes, _section_, __LINE__), #_section_, kVireoABIVersion); \
static void TOKENPASTE2(DefineTypes, _section_, __LINE__) (TypeManagerRef tm) {

#define DEFINE_VIREO_END()   }


    #define DEFINE_VIREO_TYPE(_name_, _type_) \
    (TypeDefiner::Define(tm, #_name_, _type_));

#if defined(VIREO_INSTRUCTION_REFLECTION)
    #define DEFINE_VIREO_FUNCTION(_name_, _typeTypeString_) \
    (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_name_, _typeTypeString_, kPTInstructionFunction, #_name_));

    #define DEFINE_VIREO_FUNCTION_CUSTOM(_name_, _cfunction_, _typeTypeString_) \
    (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_cfunction_, _typeTypeString_, kPTInstructionFunction, #_cfunction_));

    #define DEFINE_VIREO_GENERIC(_name_, _typeTypeString_, _genericEmitProc_) \
    (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_genericEmitProc_, _typeTypeString_, kPTGenericFunctionCodeGen, #_name_));
#else
    #define DEFINE_VIREO_FUNCTION(_name_, _typeTypeString_) \
    (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_name_, _typeTypeString_, kPTInstructionFunction));

    #define DEFINE_VIREO_FUNCTION_CUSTOM(_name_, _cfunction_, _typeTypeString_) \
    (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_cfunction_, _typeTypeString_, kPTInstructionFunction));

    #define DEFINE_VIREO_GENERIC(_name_, _typeTypeString_, _genericEmitProc_) \
    (TypeDefiner::DefineCustomPointerTypeWithValue(tm, #_name_, (void*)_genericEmitProc_, _typeTypeString_, kPTGenericFunctionCodeGen));
#endif

    #define DEFINE_VIREO_VALUE(_name_, value, _typeTypeString_) \
    (TypeDefiner::DefineCustomValue(tm, #_name_, value, _typeTypeString_));


    #define DEFINE_VIREO_CUSTOM_DP(_name_, _type_, _allocClass_) \
    (TypeDefiner::DefineCustomDataProcs(tm, #_name_, _allocClass_, _type_));

#endif

#endif // TypeDefiner_h

