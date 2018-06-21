/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief  C entry points for core Vireo functions. Used when the runtime is built and loaded as a library
 */

#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "TypeDefiner.h"
#include "TDCodecLVFlat.h"
#include "TDCodecVia.h"
#include "CEntryPoints.h"

#if defined (VIREO_C_ENTRY_POINTS)
namespace Vireo {

//------------------------------------------------------------
VIREO_EXPORT Int32 Vireo_Version()
{
    // TODO(paul) need to tie into semantic version numbers
    return 0x00020003;
}

VIREO_EXPORT Int32 Vireo_MaxExecWakeUpTime()
{
    return kMaxExecWakeUpTime;
}

//------------------------------------------------------------
//! Create a new shell with a designated parent, or nullptr for a new root.
VIREO_EXPORT void* EggShell_Create(TypeManagerRef parent)
{
    return TypeManager::New(parent);
}
//------------------------------------------------------------
VIREO_EXPORT NIError EggShell_REPL(TypeManagerRef tm, const Utf8Char* commands, Int32 length)
{
    if (length == -1) {
        length = (Int32)strlen((const char*)commands);
    }
    SubString  input(commands, commands + length);
    NIError err = TDViaParser::StaticRepl(tm, &input);
    return err;
}
//------------------------------------------------------------
//! Run the vireo execution system for a few slices.
VIREO_EXPORT Int32 EggShell_ExecuteSlices(TypeManagerRef tm, Int32 numSlices, Int32 millisecondsToRun)
{
    TypeManagerScope scope(tm);
    return tm->TheExecutionContext()->ExecuteSlices(numSlices, millisecondsToRun);
}
//------------------------------------------------------------
VIREO_EXPORT TypeRef EggShell_GetTypeList(TypeManagerRef tm)
{
    return tm->TypeList();
}
//------------------------------------------------------------
//! Delete a shell and all the types it owns.
VIREO_EXPORT void EggShell_Delete(TypeManagerRef tm)
{
    if (tm != nullptr)
        tm->Delete();
}
//------------------------------------------------------------
VIREO_EXPORT Int32 EggShell_PeekMemory(TypeManagerRef tm,
        const char* viName, const char* eltName, Int32 bufferSize, char* buffer)
{
    memset(buffer, 0, bufferSize);

    void *pData = nullptr;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == nullptr)
        return -1;

    TypeManagerScope scope(tm);
    STACK_VAR(String, flatDataString);

    // Write flattened data to the string
    FlattenData(actualType, pData, flatDataString.Value, true);

    // Copy data to buffer
    Int32 flatDataSize = flatDataString.Value->Length();
    memcpy(buffer, flatDataString.Value->Begin(), Min(bufferSize, flatDataSize));

    return flatDataSize;
}
//------------------------------------------------------------
VIREO_EXPORT Int32 EggShell_PokeMemory(TypeManagerRef tm,
        const char* viName, const char* eltName, Int32 bufferSize, char* buffer)
{
    void *pData = nullptr;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == nullptr)
        return -1;

    TypeManagerScope scope(tm);
    SubBinaryBuffer subBuffer(reinterpret_cast<UInt8*>(buffer), reinterpret_cast<UInt8*>(buffer)+bufferSize);

    // Write unflattened data to the element
    if (UnflattenData(&subBuffer, true, 0, nullptr, actualType, pData) == -1) {
        return -1;
    } else {
        return bufferSize;
    }
}
//------------------------------------------------------------
//! Get a reference to the type pointer and data for a symbol.
VIREO_EXPORT EggShellResult EggShell_FindValue(TypeManagerRef tm, const char* viName, const char* eltName, TypeRef* typeRefLocation, void** dataRefLocation)
{
    SubString objectName(viName);
    SubString path(eltName);
    *typeRefLocation = tm->GetObjectElementAddressFromPath(&objectName, &path, dataRefLocation, true);
    if (*typeRefLocation == nullptr)
        return kEggShellResult_ObjectNotFoundAtPath;

    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Write a numeric value to a symbol. Value will be coerced as needed.
VIREO_EXPORT void EggShell_WriteDouble(TypeManagerRef tm, const char* viName, const char* eltName, Double d)
{
    void *pData = nullptr;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == nullptr)
        return;

    WriteDoubleToMemory(actualType, pData, d);
}
//------------------------------------------------------------
//! Read a numeric value from a symbol. Value will be coerced as needed.
VIREO_EXPORT NIError EggShell_ReadDouble(TypeManagerRef tm, const TypeRef actualType, const void* pData, Double* result)
{
    NIError err = kNIError_Success;
    *result = ReadDoubleFromMemory(actualType, pData, &err);
    return err;
}
//------------------------------------------------------------
// Write a string value to a symbol. Value will be parsed according to format designated.
VIREO_EXPORT void EggShell_WriteValueString(TypeManagerRef tm,
        const char* viName, const char* eltName, const char* format, const char* value)
{
    TypeManagerScope scope(tm);

    void *pData = nullptr;

    SubString objectName(viName);
    SubString path(eltName);
    SubString valueString(value);

    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == nullptr)
        return;

    EventLog log(EventLog::DevNull);
    SubString formatss(format);
    TDViaParser parser(tm, &valueString, &log, 1, &formatss, true, true, true);
    parser.ParseData(actualType, pData);
}
//------------------------------------------------------------
//! Read a symbol's value as a string. Value will be formatted according to the format designated.
VIREO_EXPORT const char* EggShell_ReadValueString(TypeManagerRef tm,
        const char* viName, const char* eltName, const char* format)
{
    TypeManagerScope scope(tm);
    void *pData = nullptr;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == nullptr)
        return nullptr;

    static StringRef returnBuffer = nullptr;
    if (returnBuffer == nullptr) {
        // Allocate a string the first time it is used.
        // After that it will be resized as needed.
        STACK_VAR(String, tempReturn);
        returnBuffer = tempReturn.DetachValue();
    } else {
        returnBuffer->Resize1D(0);
    }

    if (returnBuffer) {
        SubString formatss(format);
        TDViaFormatter formatter(returnBuffer, true, 0, &formatss, kJSONEncodingEggShell);
        formatter.FormatData(actualType, pData);
        // Add an explicit nullptr terminator so it looks like a C string.
        returnBuffer->Append((Utf8Char)'\0');
        return (const char*) returnBuffer->Begin();
    }
    return "";
}
void CopyArrayTypeNameStringToBuffer(StringRef arrayTypeNameBuffer, SubString arrayTypeName)
{
    arrayTypeNameBuffer->Append(arrayTypeName.Length(), (Utf8Char*)arrayTypeName.Begin());
    arrayTypeNameBuffer->Append((Utf8Char)'\0');
}

unsigned char* GetArrayBeginAt(TypedArrayCoreRef arrayObject)
{
    if (arrayObject->GetLength(0) <= 0) {
        return nullptr;
    } else {
        return arrayObject->BeginAt(0);
    }
}
//------------------------------------------------------------
//! Get the Vireo pointer given a path.
VIREO_EXPORT EggShellResult EggShell_GetPointer(TypeManagerRef tm, const char* viName, const char* elementName, void** dataPointer, void** typePointer)
{
    SubString objectName(viName);
    SubString path(elementName);
    void *pData = nullptr;

    TypeRef objectType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (objectType == nullptr)
        return kEggShellResult_ObjectNotFoundAtPath;

    if (objectType->IsArray()) {
        pData = *(TypedArrayCoreRef*)pData;
    } else {
        // calling this function for other data types has not been implemented yet.
        return kEggShellResult_UnexpectedObjectType;
    }

    *dataPointer = pData;
    *typePointer = objectType;

    return kEggShellResult_Success;
}

//------------------------------------------------------------
//! Get the Length of a dimension in an Array Symbol. Returns -1 if the Symbol is not found or not
//! an Array or dimension requested is out of the bounds of the rank.
VIREO_EXPORT Int32 EggShell_GetArrayDimLength(TypeManagerRef tm, const char* viName, const char* eltName, Int32 dim)
{
    SubString objectName(viName);
    SubString path(eltName);
    void *pData = nullptr;

    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == nullptr || !actualType->IsArray())
        return -1;

    TypedArrayCoreRef actualArray = *(TypedArrayCoreRef*)pData;
    return Data_GetArrayDimLength(tm, actualArray, dim);
}
//------------------------------------------------------------
//! Resizes a variable size Array symbol to have new dimension lengths specified by newLengths, it also initializes cells for non-flat data.
//! Returns -1 if the symbols is not found, -2 if was not possible to resize the array and 0 if resizing was successful.
VIREO_EXPORT Int32 EggShell_ResizeArray(TypeManagerRef tm, const char* viName, const char* eltName, Int32 rank, Int32* newLengths)
{
    SubString objectName(viName);
    SubString path(eltName);
    void *pData = nullptr;

    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == nullptr || !actualType->IsArray()) {
        return kLVError_ArgError;
    }

    TypedArrayCoreRef actualArray = *(TypedArrayCoreRef*)pData;
    return Data_ResizeArray(tm, actualArray, rank, newLengths);
}
//------------------------------------------------------------
VIREO_EXPORT void* Data_GetStringBegin(StringRef stringObject)
{
    VIREO_ASSERT(String::ValidateHandle(stringObject));
    return stringObject->Begin();
}
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_GetStringLength(StringRef stringObject)
{
    VIREO_ASSERT(String::ValidateHandle(stringObject));
    return stringObject->Length();
}
//------------------------------------------------------------
// Verify that a type is an array.
VIREO_EXPORT EggShellResult Data_ValidateArrayType(TypeManagerRef tm, TypeRef typeRef)
{
    if (!typeRef->IsArray() || typeRef->Rank() <= 0)
        return kEggShellResult_UnexpectedObjectType;

    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Get information about an Array such as the type of its subtype, the array rank,
//! and the memory location of the first element (or nullptr if there are zero elements)
VIREO_EXPORT EggShellResult Data_GetArrayMetadata(TypeManagerRef tm,
        TypedArrayCoreRef arrayObject, char** arrayTypeName, Int32* arrayRank, unsigned char** arrayBegin)
{
    VIREO_ASSERT(TypedArrayCore::ValidateHandle(arrayObject));
    TypeManagerScope scope(tm);

    if (arrayTypeName == nullptr || arrayRank == nullptr || arrayBegin == nullptr)
        return kEggShellResult_InvalidResultPointer;

    static StringRef arrayTypeNameBuffer = nullptr;
    if (arrayTypeNameBuffer == nullptr) {
        // Allocate a string the first time it is used.
        // After that it will be resized as needed.
        STACK_VAR(String, tempReturn);
        arrayTypeNameBuffer = tempReturn.DetachValue();
    } else {
        arrayTypeNameBuffer->Resize1D(0);
    }

    if (arrayTypeNameBuffer == nullptr) {
        return kEggShellResult_UnableToCreateReturnBuffer;
    }

    TypeRef arrayElementType = arrayObject->ElementType();
    CopyArrayTypeNameStringToBuffer(arrayTypeNameBuffer, arrayElementType->Name());
    *arrayTypeName = (char*) arrayTypeNameBuffer->Begin();

    *arrayRank = arrayObject->Rank();
    *arrayBegin = GetArrayBeginAt(arrayObject);

    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Get the Length of a dimension in an Array Symbol. Returns -1 if the Symbol is not found or not
//! an Array or dimension requested is out of the bounds of the rank.
VIREO_EXPORT Int32 Data_GetArrayDimLength(TypeManagerRef tm, TypedArrayCoreRef arrayObject, Int32 dim)
{
    VIREO_ASSERT(TypedArrayCore::ValidateHandle(arrayObject));
    TypeManagerScope scope(tm);

    if (dim >= arrayObject->Rank() || dim < 0)
        return -1;

    return arrayObject->GetLength(dim);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteString(TypeManagerRef tm, StringRef stringObject, const unsigned char* buffer, Int32 length)
{
    VIREO_ASSERT(String::ValidateHandle(stringObject));
    // Scope needs to be setup for allocations
    TypeManagerScope scope(tm);
    stringObject->CopyFrom(length, buffer);
}
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_ReadBoolean(Boolean* booleanPointer)
{
    return *booleanPointer;
}
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_ReadInt8(Int8* intPointer)
{
    return *intPointer;
}
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_ReadInt16(Int16* intPointer)
{
    return *intPointer;
}
//------------------------------------------------------------
VIREO_EXPORT Double Data_ReadInt32(Int32* intPointer)
{
    return *intPointer;
}
//------------------------------------------------------------
VIREO_EXPORT UInt32 Data_ReadUInt8(UInt8* intPointer)
{
    return *intPointer;
}
//------------------------------------------------------------
VIREO_EXPORT UInt32 Data_ReadUInt16(UInt16* intPointer)
{
    return *intPointer;
}
//------------------------------------------------------------
VIREO_EXPORT Double Data_ReadUInt32(UInt32* intPointer)
{
    return *intPointer;
}
//------------------------------------------------------------
VIREO_EXPORT Double Data_ReadSingle(Single* singlePointer)
{
    return *singlePointer;
}
//------------------------------------------------------------
VIREO_EXPORT Double Data_ReadDouble(Double* doublePointer)
{
    return *doublePointer;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteBoolean(Boolean* destination, Int32 value)
{
    *destination = (value != 0);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteInt8(Int8* destination, Int32 value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteInt16(Int16* destination, Int32 value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteInt32(Int32* destination, Int32 value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteUInt8(UInt8* destination, Int32 value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteUInt16(UInt16* destination, Int32 value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteUInt32(UInt32* destination, UInt32 value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteSingle(Single* destination, Single value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteDouble(Double* destination, Double value)
{
    *destination = value;
}

VIREO_EXPORT Int32 Data_ResizeArray(TypeManagerRef tm, TypedArrayCoreRef arrayObject, Int32 rank, Int32* newLengths)
{
    VIREO_ASSERT(TypedArrayCore::ValidateHandle(arrayObject));
    TypeManagerScope scope(tm);

    if (!arrayObject->ResizeDimensions(rank, newLengths, true, false)) {
        return kLVError_MemFull;
    }

    return 0;
}

//------------------------------------------------------------
VIREO_EXPORT TypeRef TypeManager_Define(TypeManagerRef typeManager, const char* typeName, const char* typeString)
{
    // TypeManagerScope scope(typeManager);
    return TypeDefiner::Define(typeManager, typeName, typeString);
}
//------------------------------------------------------------
VIREO_EXPORT TypeRef TypeManager_FindType(TypeManagerRef typeManager, const char* typeName)
{
    SubString temp(typeName);
    return typeManager->FindType(&temp);
}
//------------------------------------------------------------
VIREO_EXPORT Int32 TypeRef_TopAQSize(TypeRef typeRef)
{
    return typeRef->TopAQSize();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsFlat(TypeRef typeRef)
{
    return typeRef->IsFlat();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsValid(TypeRef typeRef)
{
    return typeRef->IsValid();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_HasCustomDefault(TypeRef typeRef)
{
    return typeRef->HasCustomDefault();
}
//------------------------------------------------------------
VIREO_EXPORT EncodingEnum TypeRef_BitEncoding(TypeRef typeRef)
{
    return typeRef->BitEncoding();
}
//------------------------------------------------------------
VIREO_EXPORT Int32 TypeRef_Alignment(TypeRef typeRef)
{
    return typeRef->AQAlignment();
}
//------------------------------------------------------------
VIREO_EXPORT const char* TypeRef_Name(TypeRef typeRef)
{
    TypeManagerScope scope(typeRef->TheTypeManager());
    SubString name = typeRef->Name();

    static StringRef returnBuffer = nullptr;
    if (returnBuffer == nullptr) {
        // Allocate a string the first time it is used.
        // After that it will be resized as needed.
        STACK_VAR(String, tempReturn);
        returnBuffer = tempReturn.DetachValue();
    } else {
        returnBuffer->Resize1D(0);
    }

    if (returnBuffer) {
        returnBuffer->AppendSubString(&name);
        // Add an explicit nullptr terminator so it looks like a C string.
        returnBuffer->Append((Utf8Char)'\0');
        return (const char*) returnBuffer->Begin();
    }

    return "";
}
//------------------------------------------------------------
VIREO_EXPORT Int32 TypeRef_ElementOffset(TypeRef typeRef)
{
    return typeRef->ElementOffset();
}
//------------------------------------------------------------
VIREO_EXPORT Int32 TypeRef_Rank(TypeRef typeRef)
{
    return typeRef->Rank();
}
//------------------------------------------------------------
VIREO_EXPORT PointerTypeEnum TypeRef_PointerType(TypeRef typeRef)
{
    return typeRef->PointerType();
}
//------------------------------------------------------------
VIREO_EXPORT TypeRef TypeRef_Next(TypeRef typeRef)
{
    return typeRef->Next();
}
//------------------------------------------------------------
VIREO_EXPORT UsageTypeEnum TypeRef_ElementUsageType(TypeRef typeRef)
{
    return typeRef->ElementUsageType();
}
//------------------------------------------------------------
VIREO_EXPORT Int32 TypeRef_SubElementCount(TypeRef typeRef)
{
    return typeRef->SubElementCount();
}
//------------------------------------------------------------
VIREO_EXPORT TypeRef TypeRef_GetSubElementByIndex(TypeRef typeRef, Int32 index)
{
    return typeRef->GetSubElement(index);
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsCluster(TypeRef typeRef)
{
    return typeRef->IsCluster();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsArray(TypeRef typeRef)
{
    return typeRef->IsArray();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsBoolean(TypeRef typeRef)
{
    return typeRef->IsBoolean();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsInteger(TypeRef typeRef)
{
    return typeRef->IsInteger();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsSigned(TypeRef typeRef)
{
    return typeRef->IsSignedInteger();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsEnum(TypeRef typeRef)
{
    return typeRef->IsEnum();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsFloat(TypeRef typeRef)
{
    return typeRef->IsFloat();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsString(TypeRef typeRef)
{
    return typeRef->IsString();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsPath(TypeRef typeRef)
{
    return typeRef->IsPath();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsTimestamp(TypeRef typeRef)
{
    return typeRef->IsTimestamp();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsComplex(TypeRef typeRef)
{
    return typeRef->IsComplex();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsAnalogWaveform(TypeRef typeRef)
{
    return typeRef->IsAnalogWaveform();
}
//------------------------------------------------------------
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_RawBlockSize(TypedBlock* object)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    return object->AQBlockLength(object->Length());
}
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_Length(TypedBlock* object)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    return object->Length();
}
//------------------------------------------------------------
VIREO_EXPORT TypeRef Data_Type(TypedBlock* object)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    return object->Type();
}
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_GetLength(TypedBlock* object, Int32 dimension)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    return object->GetLength(dimension);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Resize1D(TypedBlock* object, Int32 size)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    object->Resize1D(size);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_ResizeDimensions(TypedBlock* object, Int32 rank, IntIndex* sizes)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    object->ResizeDimensions(rank, sizes, false);
}
//------------------------------------------------------------
VIREO_EXPORT void* Data_RawPointerFromOffset(TypedBlock* object, Int32 offset)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    return object->RawBegin() + offset;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Read1Byte(TypedBlock* object, Int32 offset, Int8* value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *value = *object->BeginAtAQ<Int8*>(offset);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Write1Byte(TypedBlock* object, Int32 offset, Int8 value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *object->BeginAtAQ<Int8*>(offset) = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Read2Bytes(TypedBlock* object, Int32 offset, Int16* value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *value = *object->BeginAtAQ<Int16*>(offset);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Write2Bytes(TypedBlock* object, Int32 offset, Int16 value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *object->BeginAtAQ<Int16*>(offset) = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Read4Bytes(TypedBlock* object, Int32 offset, Int32* value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *value = *object->BeginAtAQ<Int32*>(offset);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Write4Bytes(TypedBlock* object, Int32 offset, Int32 value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *object->BeginAtAQ<Int32*>(offset) = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Read8Bytes(TypedBlock* object, Int32 offset, Int64* value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *value = *object->BeginAtAQ<Int64*>(offset);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_Write8Bytes(TypedBlock* object, Int32 offset, Int64 value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *object->BeginAtAQ<Int64*>(offset) = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_ReadPointer(TypedBlock* object, Int32 offset, void** value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *value = *object->BeginAtAQ<void**>(offset);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WritePointer(TypedBlock* object, Int32 offset, void* value)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    *object->BeginAtAQ<void**>(offset) = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_ReadBytes(TypedBlock* object, Int32 offset, Int32 count, Int32* buffer)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    memcpy(buffer, object->BeginAtAQ<void*>(offset), count);
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteBytes(TypedBlock* object, Int32 offset, Int32 count, Int32* buffer)
{
    VIREO_ASSERT(TypedBlock::ValidateHandle(object));
    memcpy(object->BeginAtAQ<void*>(offset), buffer, count);
}
//------------------------------------------------------------
VIREO_EXPORT void Occurrence_Set(OccurrenceRef occurrence)
{
    OccurrenceCore *pOcc = occurrence->ObjBegin();
    pOcc->SetOccurrence();
}

}  // namespace Vireo
#endif  // VIREO_C_ENTRY_POINTS

