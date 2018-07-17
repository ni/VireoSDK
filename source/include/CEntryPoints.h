/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief  C entry points for core Vireo functions. Used when the runtime is built and loaded as a library
 */

namespace Vireo {

//------------------------------------------------------------
// Keep in sync with eggShellResultEnum in module_eggShell.js
typedef enum {
    kEggShellResult_Success = 0,
    kEggShellResult_ObjectNotFoundAtPath = 1,
    kEggShellResult_UnexpectedObjectType = 2,
    kEggShellResult_InvalidResultPointer = 3,
    kEggShellResult_UnableToCreateReturnBuffer = 4,
    kEggShellResult_InvalidTypeRef = 5,
    kEggShellResult_MismatchedArrayRank = 6,
    kEggShellResult_UnableToParseData = 7,
    kEggShellResult_UnableToAllocateData = 8,
    kEggShellResult_UnableToDeallocateData = 9,
    kEggShellResult_InvalidDataPointer = 10,
} EggShellResult;
//------------------------------------------------------------
//! TypeManager functions
VIREO_EXPORT Int32 Vireo_Version();
VIREO_EXPORT Int32 Vireo_MaxExecWakeUpTime();
VIREO_EXPORT void* EggShell_Create(TypeManagerRef tm);
VIREO_EXPORT NIError EggShell_REPL(TypeManagerRef tm, const Utf8Char* commands, Int32 length);
VIREO_EXPORT Int32 EggShell_ExecuteSlices(TypeManagerRef tm, Int32 numSlices, Int32 millisecondsToRun);
VIREO_EXPORT TypeRef EggShell_GetTypeList(TypeManagerRef tm);
VIREO_EXPORT void EggShell_Delete(TypeManagerRef tm);
VIREO_EXPORT Int32 EggShell_PeekMemory(TypeManagerRef tm, const char* viName, const char* eltName,
                                       Int32 bufferSize, char* buffer);
VIREO_EXPORT Int32 EggShell_PokeMemory(TypeManagerRef tm, const char* viName, const char* eltName,
                                       Int32 bufferSize, char* buffer);
VIREO_EXPORT EggShellResult EggShell_AllocateData(TypeManagerRef tm, const TypeRef typeRef, void** dataRefLocation);
VIREO_EXPORT EggShellResult EggShell_DeallocateData(TypeManagerRef tm, const TypeRef typeRef, void* dataRef);
VIREO_EXPORT EggShellResult EggShell_FindValue(TypeManagerRef tm, const char* viName, const char* eltName, TypeRef* typeRefLocation, void** dataRefLocation);
VIREO_EXPORT EggShellResult EggShell_FindSubValue(TypeManagerRef tm, const TypeRef type, void *start, const char* eltName,
        TypeRef* typeRefLocation, void** dataRefLocation);
VIREO_EXPORT EggShellResult EggShell_WriteDouble(TypeManagerRef tm, const TypeRef actualType, void* pData, Double value);
VIREO_EXPORT EggShellResult EggShell_ReadDouble(TypeManagerRef tm, const TypeRef actualType, const void* pData, Double* result);
VIREO_EXPORT EggShellResult EggShell_WriteValueString(TypeManagerRef tm, TypeRef typeRef, void* pData, const char* format, const char* value);
VIREO_EXPORT EggShellResult EggShell_ReadValueString(TypeManagerRef tm, TypeRef typeRef, void* pData, const char* format, UInt8** valueString);
VIREO_EXPORT EggShellResult EggShell_GetPointer(TypeManagerRef tm,
        const char* viName, const char* elementName, void** dataPointer, void** typePointer);
VIREO_EXPORT Int32 EggShell_GetArrayDimLength(TypeManagerRef tm, const char* viName, const char* eltName, Int32 dim);
VIREO_EXPORT EggShellResult EggShell_ResizeArray(TypeManagerRef tm, const TypeRef actualType, const void* pData,
                                                 Int32 rank, Int32 dimensionLengths[]);
VIREO_EXPORT EggShellResult Data_ValidateArrayType(TypeManagerRef tm, TypeRef typeRef);
VIREO_EXPORT void* Data_GetStringBegin(StringRef stringObject);
VIREO_EXPORT Int32 Data_GetStringLength(StringRef stringObject);
VIREO_EXPORT EggShellResult Data_GetArrayMetadata(TypeManagerRef tm,
        TypedArrayCoreRef arrayObject, char** arrayTypeName, Int32* arrayRank, unsigned char** arrayBegin);
VIREO_EXPORT void* Data_GetArrayBegin(const void* pData);
VIREO_EXPORT void Data_GetArrayDimensions(const void* pData, IntIndex dimensionsLengths[]);
VIREO_EXPORT Int32 Data_GetArrayLength(const void* pData);
VIREO_EXPORT Int32 Data_GetArrayDimLength(TypeManagerRef tm, TypedArrayCoreRef arrayObject, Int32 dim);
VIREO_EXPORT Int32 Data_ResizeArray(TypeManagerRef tm, TypedArrayCoreRef arrayObject, Int32 rank, Int32* newLengths);
VIREO_EXPORT void Data_WriteString(TypeManagerRef tm, StringRef stringObject, const unsigned char* buffer,
                                   Int32 length);
VIREO_EXPORT Int32 Data_ReadBoolean(Boolean* booleanPointer);
VIREO_EXPORT void Data_WriteBoolean(Boolean* destination, Int32 value);
VIREO_EXPORT void Data_WriteInt32(Int32* destination, Int32 value);
VIREO_EXPORT void Data_WriteUInt32(UInt32* destination, UInt32 value);
//------------------------------------------------------------
//! Typeref functions
VIREO_EXPORT TypeRef TypeManager_Define(TypeManagerRef typeManager, const char* typeName, const char* typeString);
VIREO_EXPORT TypeRef TypeManager_FindType(TypeManagerRef typeManager, const char* typeName);
VIREO_EXPORT Int32 TypeRef_TopAQSize(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsFlat(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsValid(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_HasCustomDefault(TypeRef typeRef);
VIREO_EXPORT EncodingEnum TypeRef_BitEncoding(TypeRef typeRef);
VIREO_EXPORT Int32 TypeRef_Alignment(TypeRef typeRef);
VIREO_EXPORT const char* TypeRef_Name(TypeManagerRef typeManager, TypeRef typeRef);
VIREO_EXPORT const char* TypeRef_ElementName(TypeManagerRef typeManager, TypeRef typeRef);
VIREO_EXPORT Int32 TypeRef_ElementOffset(TypeRef typeRef);
VIREO_EXPORT Int32 TypeRef_Rank(TypeRef typeRef);
VIREO_EXPORT PointerTypeEnum TypeRef_PointerType(TypeRef typeRef);
VIREO_EXPORT TypeRef TypeRef_Next(TypeRef typeRef);
VIREO_EXPORT UsageTypeEnum TypeRef_ElementUsageType(TypeRef typeRef);
VIREO_EXPORT Int32 TypeRef_SubElementCount(TypeRef typeRef);
VIREO_EXPORT TypeRef TypeRef_GetSubElementByIndex(TypeRef typeRef, Int32 index);
VIREO_EXPORT Boolean TypeRef_IsCluster(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsArray(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsBoolean(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsInteger(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsSigned(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsEnum(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsFloat(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsString(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsPath(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsTimestamp(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsComplex(TypeRef typeRef);
VIREO_EXPORT Boolean TypeRef_IsAnalogWaveform(TypeRef typeRef);
//------------------------------------------------------------
//! TypedBlock functions
VIREO_EXPORT Int32 Data_RawBlockSize(TypedBlock* object);
VIREO_EXPORT Int32 Data_Length(TypedBlock* object);
VIREO_EXPORT TypeRef Data_Type(TypedBlock* object);
VIREO_EXPORT Int32 Data_GetLength(TypedBlock* object, Int32 dimension);
VIREO_EXPORT void Data_Resize1D(TypedBlock* object, Int32 size);
VIREO_EXPORT void Data_ResizeDimensions(TypedBlock* object, Int32 rank, Int32* sizes);
VIREO_EXPORT void* Data_RawPointerFromOffset(TypedBlock* object, Int32 offset);
VIREO_EXPORT void Data_Read1Byte(TypedBlock* object, Int32 offset, Int8* value);
VIREO_EXPORT void Data_Write1Byte(TypedBlock* object, Int32 offset, Int8 value);
VIREO_EXPORT void Data_Read2Bytes(TypedBlock* object, Int32 offset, Int16* value);
VIREO_EXPORT void Data_Write2Bytes(TypedBlock* object, Int32 offset, Int16 value);
VIREO_EXPORT void Data_Read4Bytes(TypedBlock* object, Int32 offset, Int32* value);
VIREO_EXPORT void Data_Write4Bytes(TypedBlock* object, Int32 offset, Int32 value);
VIREO_EXPORT void Data_Read8Bytes(TypedBlock* object, Int32 offset, Int64* value);
VIREO_EXPORT void Data_Write8Bytes(TypedBlock* object, Int32 offset, Int64 value);
VIREO_EXPORT void Data_ReadPointer(TypedBlock* object, Int32 offset, void** value);
VIREO_EXPORT void Data_WritePointer(TypedBlock* object, Int32 offset, void* value);
VIREO_EXPORT void Data_ReadBytes(TypedBlock* object, Int32 offset, Int32 count, Int32* buffer);
VIREO_EXPORT void Data_WriteBytes(TypedBlock* object, Int32 offset, Int32 count, Int32* buffer);
//------------------------------------------------------------
//! Occurrence functions
VIREO_EXPORT void Occurrence_Set(OccurrenceRef occurrence);

}  // namespace Vireo
