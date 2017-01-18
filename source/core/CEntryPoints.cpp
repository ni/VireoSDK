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
using namespace Vireo;

//------------------------------------------------------------
VIREO_EXPORT Int32 Vireo_Version()
{
    // TODO(paul) need to tie into semantic version numbers
    return 0x00020003;
}
//------------------------------------------------------------
//! Create a new shell with a designated parent, or null for a new root.
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
VIREO_EXPORT Int32 EggShell_ExecuteSlices(TypeManagerRef tm, Int32 numSlices)
{
    TypeManagerScope scope(tm);
    return tm->TheExecutionContext()->ExecuteSlices(numSlices, 20);
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
    if (tm != null)
        tm->Delete();
}
//------------------------------------------------------------
VIREO_EXPORT Int32 EggShell_PeekMemory(TypeManagerRef tm,
        const char* viName, const char* eltName, Int32 bufferSize, char* buffer)
{
    memset(buffer, 0, bufferSize);

    void *pData = null;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == null)
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
    void *pData = null;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == null)
        return -1;

    TypeManagerScope scope(tm);
    SubBinaryBuffer subBuffer(reinterpret_cast<UInt8*>(buffer), reinterpret_cast<UInt8*>(buffer)+bufferSize);

    // Write unflattened data to the element
    if (UnflattenData(&subBuffer, true, 0, null, actualType, pData) == -1) {
        return -1;
    } else {
        return bufferSize;
    }
}
//------------------------------------------------------------
//! Write a numeric value to a symbol. Value will be coerced as needed.
VIREO_EXPORT void EggShell_WriteDouble(TypeManagerRef tm, const char* viName, const char* eltName, Double d)
{
    void *pData = null;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == null)
        return;

    WriteDoubleToMemory(actualType, pData, d);
}
//------------------------------------------------------------
//! Read a numeric value from a symbol. Value will be coerced as needed.
VIREO_EXPORT Double EggShell_ReadDouble(TypeManagerRef tm, const char* viName, const char* eltName)
{
    void *pData = null;
    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == null)
        return -1;

    return ReadDoubleFromMemory(actualType, pData);
}
//------------------------------------------------------------
// Write a string value to a symbol. Value will be parsed according to format designated.
VIREO_EXPORT void EggShell_WriteValueString(TypeManagerRef tm,
        const char* viName, const char* eltName, const char* format, const char* value)
{
    TypeManagerScope scope(tm);

    void *pData = null;

    SubString objectName(viName);
    SubString path(eltName);
    SubString valueString(value);

    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == null)
        return;

    EventLog log(EventLog::DevNull);
    SubString formatss(format);
    TDViaParser parser(tm, &valueString, &log, 1, &formatss);
    parser.ParseData(actualType, pData);
}
//------------------------------------------------------------
//! Read a symbol's value as a string. Value will be formatted according to the format designated.
VIREO_EXPORT const char* EggShell_ReadValueString(TypeManagerRef tm,
        const char* viName, const char* eltName, const char* format)
{
    TypeManagerScope scope(tm);
    void *pData = null;

    SubString objectName(viName);
    SubString path(eltName);
    TypeRef actualType = tm->GetObjectElementAddressFromPath(&objectName, &path, &pData, true);
    if (actualType == null)
        return null;

    static StringRef returnBuffer = null;
    if (returnBuffer == null) {
        // Allocate a string the first time it is used.
        // After that it will be resized as needed.
        STACK_VAR(String, tempReturn);
        returnBuffer = tempReturn.DetachValue();
    } else {
        returnBuffer->Resize1D(0);
    }

    if (returnBuffer) {
        SubString formatss(format);
        TDViaFormatter formatter(returnBuffer, true, 0, &formatss);
        formatter.FormatData(actualType, pData);
        // Add an explicit null terminator so it looks like a C string.
        returnBuffer->Append((Utf8Char)'\0');
        return (const char*) returnBuffer->Begin();
    }
    return "";
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
VIREO_EXPORT void Data_WriteString(TypeManagerRef tm, StringRef stringObject, const unsigned char* buffer, Int32 length)
{
    VIREO_ASSERT(String::ValidateHandle(stringObject));
    // Scope needs to be setup for allocations
    TypeManagerScope scope(tm);
    stringObject->CopyFrom(length, buffer);
}
//------------------------------------------------------------
VIREO_EXPORT Int32 Data_ReadBoolean(Boolean* booleanPointer) {
    return *booleanPointer;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteBoolean(Boolean* destination, Int32 value) {
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteInt32(Int32* destination, Int32 value)
{
    *destination = value;
}
//------------------------------------------------------------
VIREO_EXPORT void Data_WriteUInt32(UInt32* destination, UInt32 value)
{
    *destination = value;
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
VIREO_EXPORT void TypeRef_Name(TypeRef typeRef, Int32* bufferSize, char* buffer)
{
    SubString name = typeRef->Name();
    *bufferSize = name.CopyToBoundedBuffer(*bufferSize, reinterpret_cast<Utf8Char*>(buffer));
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
#endif
