// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#ifdef kVireoOS_windows
    #include <windows.h>
    #include <io.h>
    #include <share.h>
    #include <codecvt>
    #include <string>
    #include <vector>
    #include <algorithm>
    #include <regex>     // NOLINT(build/c++11)
    #include <iostream>  // REMOVE
    typedef size_t ssize_t;
    #define POSIX_NAME(_name_) _##_name_
    #ifndef STDIN_FILENO
        #define STDIN_FILENO 0
        #define STDOUT_FILENO 1
        #define STDERR_FILENO 2
    #endif
#else
    #include <unistd.h>
    #include <stdlib.h>
    #ifdef VIREO_FILESYSTEM_DIRLIST
       #include <dirent.h>
    #endif
    #define POSIX_NAME(_name_) _name_
#endif

#include <fcntl.h>
#include <sys/stat.h>
#include <utility>
#include <cstdio>

namespace Vireo {

#if kVireoOS_emscripten
extern "C" {
    extern void jsSystemLogging_WriteMessageUTF8(
        TypeRef messageType, StringRef * message,
        TypeRef severityType, Int32 * severity);
}
#endif

typedef Int32 FileHandle;

#ifdef VIREO_FILESYSTEM

struct FileOpenInstruction : InstructionCore
{
    _ParamDef(StringRef, path);

    /*  operation:  0 - open
                    1 - replace
                    2 - create
                    3 - open or create
                    4 - replace or create
                    5 - replace or create with confirmation */
    _ParamDef(Int32, operation);

    /*  access:     0 - read/write
                    1 - read-only
                    2 - write-only  */
    _ParamDef(Int32, access);

    _ParamDef(FileHandle, fileHandle);
    NEXT_INSTRUCTION_METHOD()
};

    enum OperationMode
    {
        OperationModes_openOnly = 0,
        OperationModes_replace = 1,
        OperationModes_create = 2,
        OperationModes_openOrCreate = 3,
        OperationModes_replaceOrCreate = 4,
    };

    enum AccessMode
    {
        AccessModes_readWrite = 0,
        AccessModes_readOnly = 1,
        AccessModes_writeOnly = 2,
    };

VIREO_FUNCTION_SIGNATURET(FileOpen, FileOpenInstruction)
{
    AccessMode access = (AccessMode)_Param(access);

    // Set flags for access mode.
    int flags = 0;
    switch (access) {
        case AccessModes_readWrite:
            flags |= O_RDWR;
            break;
        case AccessModes_readOnly:
            flags |= O_RDONLY;
            break;
        case AccessModes_writeOnly:
            flags |= O_WRONLY;
        default:
            break;
    }

    OperationMode operation = (OperationMode)_Param(operation);

    switch (operation) {
        case OperationModes_openOnly:
            break;
        case OperationModes_replace:
            flags |= O_TRUNC;
            break;
        case OperationModes_create:
            flags |= O_CREAT | O_EXCL;
            break;
        case OperationModes_openOrCreate:
            flags |= O_CREAT;
            break;
        case OperationModes_replaceOrCreate:
            flags |= O_TRUNC | O_CREAT;
            break;
        default:
            break;
    }

    // Get the path in char* form
    TempStackCStringFromString    cString(_Param(path));

    // TODO(fileio): What permissions should created files have?  Currently, all permissions are given.
#ifdef kVireoOS_windows
    // TODO(fileio) error handling
    int refnum;
    _sopen_s(&refnum, cString.BeginCStr(), flags, _SH_DENYWR, 0);
    _Param(fileHandle) = refnum;
#else
    _Param(fileHandle) = open(cString.BeginCStr(), flags, 0777);
#endif
    return _NextInstruction();
}

VIREO_FUNCTION_SIGNATURE2(StreamClose, FileHandle, Int32)
{
#ifdef VIREO_POSIX_FILEIO
    _Param(1) = POSIX_NAME(close)(_Param(0));
#else
    #error platform not supported
#endif
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(FileSize, FileHandle, Int32)
{
    struct stat fileInfo;
    fstat(_Param(0), &fileInfo);
    _Param(1) = (Int32) fileInfo.st_size;
    return _NextInstruction();
}
#endif  // VIREO_POSIX_FILESYSTEM
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(StreamRead, FileHandle, TypedArrayCoreRef, Int32, Int32)
{
    FileHandle handle = _Param(0);
    TypedArrayCoreRef array = _Param(1);
    Int32 numElts = _Param(2);
    Int32 bytesToRead = 0;

    if (numElts == -1) {
        struct stat fileInfo;
        fstat(handle, &fileInfo);
        bytesToRead = (Int32) fileInfo.st_size;
        // TODO(fileio) is rounding correct here?
        // Only read full elements from the file
        numElts = bytesToRead / array->ElementType()->TopAQSize();
    }

    if (array->Resize1DOrEmpty(numElts)) {
        // Final count is determined by how big the array ended up.
        bytesToRead = array->AQBlockLength(array->Length());

#ifdef VIREO_POSIX_FILEIO
        ssize_t bytesRead = POSIX_NAME(read)(handle, array->RawBegin(), bytesToRead);
#else
        #error platform not supported
#endif

        if (bytesRead < 0) {
            _Param(3) = (Int32) bytesRead;  // TODO(fileio) error processing
            array->Resize1D(0);
        } else if (bytesToRead != bytesRead) {
            // size the array to the number of full elements read.
            array->Resize1D((IntIndex) (bytesRead / array->ElementType()->TopAQSize()) );
        }
    }
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE3(StreamWrite, FileHandle, TypedArrayCoreRef, Int32)
{
    FileHandle handle = _Param(0);
    TypedArrayCoreRef array = _Param(1);

    Int32 eltsToWrite = array->Length();
    Int32 bytesToWrite = array->AQBlockLength(eltsToWrite);

#ifdef VIREO_POSIX_FILEIO
    ssize_t result = POSIX_NAME(write)(handle, array->RawBegin(), bytesToWrite);
#else
    #error platform not supported
#endif

    _Param(2) = (Int32) result;  // TODO(fileio) process errors
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(StreamSetPosition, FileHandle, IntIndex, IntIndex, Int32)
{
    enum StartPositions
    {
        StartPositions_start,
        StartPositions_end,
        StartPositions_current
    } from;
    int fd = _Param(0);
    int offset = _Param(1);

    from = (StartPositions)_Param(2);
    int startPosition = 0;

    switch (from) {
        case StartPositions_start:
            startPosition = SEEK_SET;
            break;
        case StartPositions_end:
            startPosition = SEEK_END;
            break;
        case StartPositions_current:
            startPosition = SEEK_CUR;
            break;
        default:
            break;
    }
    _Param(3) = (Int32)POSIX_NAME(lseek)(fd, offset, startPosition);
    return _NextInstruction();
}
#ifdef VIREO_FILESYSTEM
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(FileDelete, StringRef, Int32)
{
    TempStackCStringFromString    cString(_Param(0));
    // TODO(fileio) error support
    _Param(1) = remove(cString.BeginCStr());
    return _NextInstruction();
}
#endif
//------------------------------------------------------------
#ifdef VIREO_FILESYSTEM_DIRLIST
// A start at directory listing. This will be a good test case
// for passing in a VI as a comparison proc
VIREO_FUNCTION_SIGNATURE2(ListDirectory, StringRef, TypedArray1D<StringRef>*)
{
    TempStackCStringFromString    cString(_Param(0));
    TypedArray1D<StringRef>* fileNames = _Param(1);
#if kVireoOS_windows
    HANDLE dir_handle = INVALID_HANDLE_VALUE;
    WIN32_FIND_DATA ffd;
    std::string directory_path = std::string(cString.BeginCStr());

    // Replace the '/' with '\' in the folder path
    std::regex rx("/");
    directory_path = std::regex_replace(directory_path, rx, "\\", std::regex_constants::match_any);
    directory_path = directory_path + "\\*";  // append a wildcard to search for all files in folder
    dir_handle = FindFirstFile(directory_path.c_str(), &ffd);

    if (dir_handle == INVALID_HANDLE_VALUE) {
        // No place to handle possible errors, just dump the output
        printf("Error: %d\n", GetLastError());
        FindClose(dir_handle);  // close the HANDLE
        fileNames->Resize1D(0);
        return _NextInstruction();
    }

    // Get the total count of filenames to resize the array
    std::vector<WIN32_FIND_DATA> filenames;
    do {
        filenames.push_back(std::move(ffd));
    } while (FindNextFile(dir_handle, &ffd) != 0);

    // Check for any errors
    DWORD err = GetLastError();
    if (err != ERROR_NO_MORE_FILES) {
        // No place to handle possible errors, just dump the output
        printf("Error: %d\n", err);
        FindClose(dir_handle);  // close the HANDLE
        fileNames->Resize1D(0);
        return _NextInstruction();
    }

    // Sort the vector alphabetically be filename
    std::sort(filenames.begin(), filenames.end(), [](WIN32_FIND_DATA dataA, WIN32_FIND_DATA dataB) {
        return std::string(dataA.cFileName) < std::string(dataB.cFileName);
    });

    // Add filenames to array
    Int32 file_count = filenames.size();
    fileNames->Resize1DOrEmpty(file_count);
    for (Int32 i = 0; i < file_count; i++) {
        (*fileNames->BeginAt(i))->CopyFrom(
            (IntIndex)strlen(filenames[i].cFileName),
            reinterpret_cast<Utf8Char*>(filenames[i].cFileName));
    }

    FindClose(dir_handle);  // close the HANDLE
#elif kVireoOS_linuxU || kVireoOS_macosxU
    struct dirent **dirInfos;
    Int32 count = scandir(cString.BeginCStr(), &dirInfos, 0, alphasort);

    if (count >= 0) {
        // For now get all the names
        fileNames->Resize1DOrEmpty(count);
        Int32 eltCount = fileNames->Length();
        for (Int32 i = 0; i < eltCount; i++) {
            (*fileNames->BeginAt(i))->CopyFrom(
                (IntIndex)strlen(dirInfos[i]->d_name),
                reinterpret_cast<Utf8Char*>(dirInfos[i]->d_name));
        }

        for (Int32 i = 0; i < count; i++) {
            free(dirInfos[i]);
        }
        free(dirInfos);
    } else {
        fileNames->Resize1D(0);
    }
#endif
    return _NextInstruction();
}
#endif

//------------------------------------------------------------
// TODO(fileio) in a StaticTypeAndData function the TypeRef is directly stored in the instruction
// not a pointer to TypeRef held in the data space.   There needs to be a way to
// express that in the signature. What is really important is that the
// correct API is used to pick up the parameter.

#if defined(VIREO_VIA_FORMATTER)
//------------------------------------------------------------
struct PrintfParamBlock : VarArgInstruction
{
    _ParamDef(StringRef, format);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(Printf, PrintfParamBlock)
{
    STACK_VAR(String, tempString);

    // Ignore begin & end, then div 2 since each argument is passed via two arguments.
    Int32       count = (_ParamVarArgCount() - 1) / 2;
    SubString   format = _Param(format)->MakeSubStringAlias();
    StaticTypeAndData *arguments =  _ParamImmediate(argument1);

    Format(&format, count, arguments, tempString.Value, nullptr);
    gPlatform.IO.Print(tempString.Value->Length(), (const char*)tempString.Value->Begin());
    return _NextInstruction();
}
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(Println, StaticType, void)
{
    STACK_VAR(String, tempString);
    if (tempString.Value) {
        TDViaFormatter formatter(tempString.Value, false);
        formatter.FormatData(_ParamPointer(0), _ParamPointer(1));
        tempString.Value->Append('\n');

        gPlatform.IO.Print(tempString.Value->Length(), (const char*)tempString.Value->Begin());
    }
    return _NextInstruction();
}
#endif
//------------------------------------------------------------
#if kVireoOS_emscripten
struct SystemLogging_WriteMessageUTF8ParamBlock : InstructionCore
{
    _ParamDef(StringRef, Ignored0In);
    _ParamDef(StringRef, Ignored1In);
    _ParamDef(StringRef, MessageIn);
    _ParamDef(Int32, SeverityIn);
    _ParamDef(ErrorCluster, ErrorInOut);
    NEXT_INSTRUCTION_METHOD()
};

// An instruction to enable the Write to System Log VI which uses an SLI call to SystemLogging_WriteMessageUTF8
VIREO_FUNCTION_SIGNATURET(SystemLogging_WriteMessageUTF8, SystemLogging_WriteMessageUTF8ParamBlock)
{
    TypeRef typeRefInt32 = TypeManagerScope::Current()->FindType("Int32");

    if (!_Param(ErrorInOut).status) {
        jsSystemLogging_WriteMessageUTF8(
            _Param(MessageIn)->Type(), _ParamPointer(MessageIn),
            typeRefInt32, _ParamPointer(SeverityIn));
    }
    return _NextInstruction();
}
#endif
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(FileSystem)
    // Types
    DEFINE_VIREO_TYPE(FileHandle, "Int32")
    // Values
    DEFINE_VIREO_VALUE(StdIn, STDIN_FILENO, "FileHandle")
    DEFINE_VIREO_VALUE(StdOut, STDOUT_FILENO, "FileHandle")
    DEFINE_VIREO_VALUE(StdErr, STDERR_FILENO, "FileHandle")
    // Primitives
#if defined(VIREO_VIA_FORMATTER)
    DEFINE_VIREO_FUNCTION(Println, "p(i(StaticTypeAndData))")
    DEFINE_VIREO_FUNCTION(Printf, "p(i(VarArgCount)i(String)i(StaticTypeAndData))")
#endif
    //--------
#if kVireoOS_emscripten
    DEFINE_VIREO_FUNCTION(SystemLogging_WriteMessageUTF8, "p(i(.String) i(.String) i(.String) i(.Int32) io(ErrorCluster))")
#endif
    //--------
#ifdef VIREO_FILESYSTEM
    DEFINE_VIREO_FUNCTION(FileOpen, "p(i(String)i(Int32)i(Int32)o(FileHandle))")
    DEFINE_VIREO_FUNCTION(FileSize, "p(i(FileHandle)o(Int32))")
    DEFINE_VIREO_FUNCTION(FileDelete, "p(i(String)o(Int32))")
    DEFINE_VIREO_FUNCTION(StreamClose, "p(i(FileHandle)o(Int32))")
#endif
    //--------
    DEFINE_VIREO_FUNCTION(StreamSetPosition, "p(i(FileHandle)i(Int32)i(Int32)o(Int32))")
    DEFINE_VIREO_FUNCTION(StreamRead, "p(i(FileHandle)o(String)o(Int32)o(Int32))")
    DEFINE_VIREO_FUNCTION(StreamWrite, "p(i(FileHandle)i(String)i(Int32)o(Int32))")

#ifdef VIREO_FILESYSTEM_DIRLIST
    DEFINE_VIREO_FUNCTION(ListDirectory, "p(i(String)o(a(String *)))")
#endif

DEFINE_VIREO_END()

}  // namespace Vireo

