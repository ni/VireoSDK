// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

/*! \file
    \brief  C entry points for core Vireo functions. Used when the runtime is built and loaded as a library
 */

#include "ExecutionContext.h"
#include "VirtualInstrument.h"
#include "TypeDefiner.h"
#include "TDCodecLVFlat.h"
#include "TDCodecVia.h"
#include "CEntryPoints.h"
#include "JavaScriptRef.h"

#if defined (VIREO_C_ENTRY_POINTS)
namespace Vireo {

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
VIREO_EXPORT NIError EggShell_REPL(TypeManagerRef tm, const Utf8Char* commands, Int32 length, Boolean debugging)
{
    if (length == -1) {
        length = (Int32)strlen((const char*)commands);
    }
    SubString  input(commands, commands + length);
    NIError err = TDViaParser::StaticRepl(tm, &input, debugging);
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
//! Allocates enough memory to fit a new object of TypeRef
VIREO_EXPORT EggShellResult EggShell_AllocateData(TypeManagerRef tm, const TypeRef typeRef, void** dataRefLocation)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (dataRefLocation == nullptr)
        return kEggShellResult_InvalidResultPointer;

    *dataRefLocation = nullptr;
    Int32 topSize = typeRef->TopAQSize();
    void* pData = THREAD_TADM()->Malloc(topSize);
    NIError error = typeRef->InitData(pData);
    if (error != kNIError_Success) {
        return kEggShellResult_UnableToAllocateData;
    }
    *dataRefLocation = pData;
    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Deallocates data and frees up memory in dataRef described by typeRef
VIREO_EXPORT EggShellResult EggShell_DeallocateData(TypeManagerRef tm, const TypeRef typeRef, void* dataRef)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (dataRef == nullptr)
        return kEggShellResult_InvalidDataPointer;

    NIError error = typeRef->ClearData(dataRef);
    THREAD_TADM()->Free(dataRef);
    if (error != kNIError_Success) {
        return kEggShellResult_UnableToDeallocateData;
    }

    return kEggShellResult_Success;
}

//------------------------------------------------------------
//! Clears data and reinitializes to default dataRef described by typeRef.
VIREO_EXPORT EggShellResult EggShell_ReinitializeToDefault(TypeManagerRef tm, const TypeRef typeRef, void* dataRef)
{
    TypeManagerScope scope(tm);

    if (typeRef == nullptr || !typeRef->IsValid()) {
        return kEggShellResult_InvalidTypeRef;
    }

    if (dataRef == nullptr) {
        return kEggShellResult_InvalidDataPointer;
    }

    NIError error = typeRef->ClearData(dataRef);

    if (error != kNIError_Success) {
        return kEggShellResult_UnableToDeallocateData;
    }

    error = typeRef->InitData(dataRef);

    if (error != kNIError_Success) {
        return kEggShellResult_UnableToAllocateData;
    }

    return kEggShellResult_Success;
}

//------------------------------------------------------------
//! Get a reference to the type pointer and data for a symbol.
VIREO_EXPORT EggShellResult EggShell_FindValue(TypeManagerRef tm, const char* viName, const char* eltName, TypeRef* typeRefLocation, void** dataRefLocation)
{
    TypeManagerScope scope(tm);
    if (typeRefLocation == nullptr || dataRefLocation == nullptr)
        return kEggShellResult_InvalidResultPointer;

    *typeRefLocation = nullptr;
    *dataRefLocation = nullptr;

    SubString objectName(viName);
    SubString path(eltName);
    *typeRefLocation = tm->GetObjectElementAddressFromPath(&objectName, &path, dataRefLocation, true);
    if (*typeRefLocation == nullptr)
        return kEggShellResult_ObjectNotFoundAtPath;

    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Get a reference to the type pointer and data for a sub element
VIREO_EXPORT EggShellResult EggShell_FindSubValue(TypeManagerRef tm,
        const TypeRef typeRef, void * pData, const char* eltName, TypeRef* typeRefLocation, void** dataRefLocation)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    if (typeRefLocation == nullptr || dataRefLocation == nullptr)
        return kEggShellResult_InvalidResultPointer;

    *typeRefLocation = nullptr;
    *dataRefLocation = nullptr;

    SubString path(eltName);
    *typeRefLocation = typeRef->GetSubElementAddressFromPath(&path, pData, dataRefLocation, true);
    if (*typeRefLocation == nullptr)
        return kEggShellResult_ObjectNotFoundAtPath;

    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Write a numeric value to a symbol. Value will be coerced as needed.
VIREO_EXPORT EggShellResult EggShell_WriteDouble(TypeManagerRef tm, const TypeRef typeRef, void* pData, Double value)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    NIError error = WriteDoubleToMemory(typeRef, pData, value);
    if (error)
        return kEggShellResult_UnexpectedObjectType;
    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Read a numeric value from a symbol. Value will be coerced as needed.
VIREO_EXPORT EggShellResult EggShell_ReadDouble(TypeManagerRef tm, const TypeRef typeRef, const void* pData, Double* result)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    if (result == nullptr)
        return kEggShellResult_InvalidResultPointer;

    NIError error = kNIError_Success;
    *result = ReadDoubleFromMemory(typeRef, pData, &error);
    if (error)
        return kEggShellResult_UnexpectedObjectType;
    return kEggShellResult_Success;
}
//------------------------------------------------------------
// Write a string value to a symbol. Value will be parsed according to format designated.
VIREO_EXPORT EggShellResult EggShell_WriteValueString(TypeManagerRef tm, const TypeRef typeRef, void* pData, const char* format, const char* value)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    SubString valueString(value);
    EventLog log(EventLog::DevNull);
    SubString formatss(format);
    TDViaParser parser(tm, &valueString, &log, 1, &formatss, true, true, true);
    Int32 error = parser.ParseData(typeRef, pData);
    if (error) {
        return kEggShellResult_UnableToParseData;
    }

    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Read a symbol's value as a string. Value will be formatted according to designated format.
VIREO_EXPORT EggShellResult EggShell_ReadValueString(TypeManagerRef tm, const TypeRef typeRef, void* pData, const char* format,
                                                    TypeRef responseJSONTypeRef, void* responseJSONDataRef)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    if (responseJSONTypeRef == nullptr || !responseJSONTypeRef->IsValid() || !responseJSONTypeRef->IsString() || responseJSONDataRef == nullptr)
        return kEggShellResult_InvalidResultPointer;

    StringRef returnBuffer = *(static_cast<const StringRef*>(responseJSONDataRef));
    returnBuffer->Resize1D(0);
    SubString formatss(format);
    TDViaFormatter formatter(returnBuffer, true, 0, &formatss, kJSONEncodingEggShell);
    formatter.FormatData(typeRef, pData);
    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Resizes a variable size Array symbol to have new dimension lengths specified by newLengths, it also initializes cells for non-flat data.
VIREO_EXPORT EggShellResult EggShell_ResizeArray(TypeManagerRef tm, const TypeRef typeRef, const void* pData,
                                                 Int32 rank, Int32 dimensionLengths[])
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (!typeRef->IsArray())
        return kEggShellResult_UnexpectedObjectType;

    if (typeRef->Rank() != rank)
        return kEggShellResult_MismatchedArrayRank;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    TypedArrayCoreRef arrayObject = *(static_cast<const TypedArrayCoreRef*>(pData));
    VIREO_ASSERT(TypedArrayCore::ValidateHandle(arrayObject));

    if (!arrayObject->ResizeDimensions(rank, dimensionLengths, true, false)) {
        return kEggShellResult_UnableToCreateReturnBuffer;
    }
    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Gets a variant attribute of a given type and data pointer
VIREO_EXPORT EggShellResult EggShell_GetVariantAttribute(TypeManagerRef tm, const TypeRef typeRef, void* pData, const char* attributeNameCStr,
                                                        TypeRef* typeRefLocation, void** dataRefLocation)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid() || !typeRef->IsVariant())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    if (typeRefLocation == nullptr || dataRefLocation == nullptr)
        return kEggShellResult_InvalidResultPointer;

    *typeRefLocation = nullptr;
    *dataRefLocation = nullptr;

    STACK_VAR(String, attributeSV);
    StringRef attributeName = attributeSV.Value;
    attributeName->AppendCStr(attributeNameCStr);

    VariantDataRef variant = *(static_cast<const VariantDataRef*>(pData));
    VariantDataRef attributeVariant = variant->GetAttribute(attributeName);
    if (attributeVariant == nullptr)
        return kEggShellResult_ObjectNotFoundAtPath;

    *typeRefLocation = attributeVariant->GetInnerType();
    *dataRefLocation = attributeVariant->GetInnerData();
    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Sets a variant attribute of a given type and data pointer
VIREO_EXPORT EggShellResult EggShell_SetVariantAttribute(TypeManagerRef tm, const TypeRef typeRef, void* pData, const char* attributeNameCStr,
                                                        TypeRef attributeTypeRef, void* attributeDataRef)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid() || !typeRef->IsVariant() || attributeTypeRef == nullptr || !attributeTypeRef->IsValid())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr || attributeDataRef == nullptr)
        return kEggShellResult_InvalidDataPointer;

    STACK_VAR(String, attributeSV);
    StringRef attributeName = attributeSV.Value;
    attributeName->AppendCStr(attributeNameCStr);

    VariantDataRef variant = *(static_cast<const VariantDataRef*>(pData));
    StaticTypeAndData attributeValue = {
        attributeTypeRef,
        attributeDataRef
    };
    variant->SetAttribute(attributeName, attributeValue);
    return kEggShellResult_Success;
}
//------------------------------------------------------------
//! Deletes a variant attribute of a given type and data pointer
VIREO_EXPORT EggShellResult EggShell_DeleteVariantAttribute(TypeManagerRef tm, const TypeRef typeRef, void* pData, const char* attributeNameCStr)
{
    TypeManagerScope scope(tm);
    if (typeRef == nullptr || !typeRef->IsValid() || !typeRef->IsVariant())
        return kEggShellResult_InvalidTypeRef;

    if (pData == nullptr)
        return kEggShellResult_InvalidDataPointer;

    STACK_VAR(String, attributeSV);
    StringRef attributeName = attributeSV.Value;
    attributeName->AppendCStr(attributeNameCStr);

    VariantDataRef variant = *(static_cast<const VariantDataRef*>(pData));
    Boolean found = variant->DeleteAttribute(&attributeName);
    if (!found)
        return kEggShellResult_ObjectNotFoundAtPath;

    return kEggShellResult_Success;
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
//! Get the starting location of the first element of an Array / String type in memory
// This function returns the start address of where elements would appear in memory (returns address even if length zero)
VIREO_EXPORT void* Data_GetArrayBegin(const void* pData)
{
    TypedArrayCoreRef arrayObject = *(static_cast<const TypedArrayCoreRef*>(pData));
    VIREO_ASSERT(TypedArrayCore::ValidateHandle(arrayObject));
    return arrayObject->BeginAt(0);
}
//------------------------------------------------------------
//! Get the values for dimensions of the array. Assumes dimensions target is of length equal to rank
//! Caller is expected to allocate an array dimensions of size array rank for the duration of function invocation.
VIREO_EXPORT void Data_GetArrayDimensions(const void* pData, IntIndex dimensionsLengths[])
{
    TypedArrayCoreRef arrayObject = *(static_cast<const TypedArrayCoreRef*>(pData));
    VIREO_ASSERT(TypedArrayCore::ValidateHandle(arrayObject));
    for (int i = 0; i < arrayObject->Rank(); i++) {
        dimensionsLengths[i] = arrayObject->GetLength(i);
    }
}
//------------------------------------------------------------
//! Get the total length for an array
VIREO_EXPORT Int32 Data_GetArrayLength(const void* pData)
{
    TypedArrayCoreRef arrayObject = *(static_cast<const TypedArrayCoreRef*>(pData));
    VIREO_ASSERT(TypedArrayCore::ValidateHandle(arrayObject));
    return arrayObject->Length();
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
VIREO_EXPORT void TypeRef_Name(TypeManagerRef tm, TypeRef typeRef, TypeRef responseTypeRef, void* responseDataRef)
{
    TypeManagerScope scope(tm);
    if (responseTypeRef == nullptr || !responseTypeRef->IsValid() || !responseTypeRef->IsString() || responseDataRef == nullptr)
        return;

    StringRef response = *(static_cast<const StringRef*>(responseDataRef));
    if (typeRef == nullptr || !typeRef->IsValid()) {
        response->Resize1D(0);
        return;
    }

    SubString name = typeRef->Name();
    response->Resize1D(name.Length());
    response->CopyFromSubString(&name);
}
//------------------------------------------------------------
VIREO_EXPORT void TypeRef_ElementName(TypeManagerRef tm, TypeRef typeRef, TypeRef responseTypeRef, void* responseDataRef)
{
    TypeManagerScope scope(tm);
    if (responseTypeRef == nullptr || !responseTypeRef->IsValid() || !responseTypeRef->IsString() || responseDataRef == nullptr)
        return;

    StringRef response = *(static_cast<const StringRef*>(responseDataRef));
    if (typeRef == nullptr || !typeRef->IsValid()) {
        response->Resize1D(0);
        return;
    }

    SubString elementName = typeRef->ElementName();
    response->Resize1D(elementName.Length());
    response->CopyFromSubString(&elementName);
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
VIREO_EXPORT Boolean TypeRef_IsJavaScriptStaticRefNum(TypeRef typeRef)
{
    return typeRef->IsJavaScriptStaticRefNum();
}
//------------------------------------------------------------
VIREO_EXPORT Boolean TypeRef_IsJavaScriptDynamicRefNum(TypeRef typeRef)
{
    return typeRef->IsJavaScriptDynamicRefNum();
}
//------------------------------------------------------------
//! Check if a value has been written by Vireo (and reset the state)
VIREO_EXPORT Boolean TypeRef_TestNeedsUpdateAndReset(const TypeRef typeRef)
{
    return TestNeedsUpdate(typeRef, true);
}
//------------------------------------------------------------
//! Check if a value has been written by Vireo (without resetting the state; only use for debugging)
VIREO_EXPORT Boolean TypeRef_TestNeedsUpdateWithoutReset(const TypeRef typeRef)
{
    return TestNeedsUpdate(typeRef, false);
}
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
