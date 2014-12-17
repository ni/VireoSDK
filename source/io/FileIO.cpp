/**
 
 Copyright (c) 2014 National Instruments Corp.
 
 This software is subject to the terms described in the LICENSE.TXT file
 
 SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "StringUtilities.h"
#include "TDCodecVia.h"

#ifdef _WIN32
	//#define _CRT_SECURE_NO_WARNINGS
	#include <io.h>
	#include <fcntl.h>
	#include <share.h>
	#include <sys/stat.h>
	#include <stdio.h>
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
	#include <fcntl.h>
	#include <sys/stat.h>
	#define POSIX_NAME(_name_) _name_ 
	#include <stdio.h>
#endif

using namespace Vireo;

typedef Int32 FileHandle;

#ifdef VIREO_FILESYSTEM

struct OpenStruct : public InstructionCore
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
    } ;
    
VIREO_FUNCTION_SIGNATURET(FileOpen, OpenStruct)
{
    AccessMode access = (AccessMode)_Param(access);

    //Set flags for access mode.
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
    
    //Get the path in char* form
    TempStackCStringFromString    cString(_Param(path));
    
    //TODO: What permissions should created files have?  Currently, all permissions are given.
#ifdef kVireoOS_win32U
	// TODO errors
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
	#error paltfrom not supported
#endif
    //TODO: This should also return the path of the closed file.
    return _NextInstruction();
}

//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE2(FileSize, FileHandle, Int32)
{
    struct stat fileInfo;
    fstat( _Param(0), &fileInfo);
    _Param(1) = (Int32) fileInfo.st_size;
    return _NextInstruction();
}
#endif //VIREO_POSIX_FILESYSTEM
//------------------------------------------------------------
VIREO_FUNCTION_SIGNATURE4(StreamRead, FileHandle, TypedArrayCoreRef, Int32, Int32)
{
    FileHandle handle   = _Param(0);
    TypedArrayCoreRef array   = _Param(1);
    Int32 numElts       = _Param(2);
    Int32 bytesToRead = 0;
    
    if (numElts == -1) {
        struct stat fileInfo;
        fstat(handle, &fileInfo);
        bytesToRead = (Int32) fileInfo.st_size;
        // TODO is rounding correct here?
        // Only read full elements from the file
        numElts = bytesToRead / array->ElementType()->TopAQSize();
    }
    
    if (array->Resize1DOrEmpty(numElts)) {
        
        // Final count is determined by how big the array ended up.
        bytesToRead = array->AQBlockLength(array->Length());

#ifdef VIREO_POSIX_FILEIO
        ssize_t bytesRead = POSIX_NAME(read)(handle, array->RawBegin(), bytesToRead);
#else
        #error paltfrom not supported
#endif

        if (bytesRead < 0) {
            _Param(3) = (Int32) bytesRead; // TODO error processing
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
    FileHandle handle   = _Param(0);
    TypedArrayCoreRef array   = _Param(1);
    
    Int32 eltsToWrite = array->Length();
    Int32 bytesToWrite = array->AQBlockLength(eltsToWrite);

#ifdef VIREO_POSIX_FILEIO
    ssize_t result = POSIX_NAME(write)(handle, array->RawBegin(), bytesToWrite);
#else
	#error paltfrom not supported
#endif
    
    _Param(2) = (Int32) result;  // TODO process errors
    return _NextInstruction();
}
//------------------------------------------------------------
struct SetFilePositionStruct : public InstructionCore
{
    _ParamDef(FileHandle, refnum);
    _ParamDef(Int32, offset);
    
    // from options:
    // 0 - start
    // 1 - end
    // 2 - current
    _ParamDef(Int32, from);
    
    _ParamDef(Int32, error);
};
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
    // TODO error support
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
    StringArray1D* fileNames = _Param(1);

    struct dirent **dirInfos;
    Int32 count = scandir(cString.BeginCStr(), &dirInfos, 0, alphasort);
    
    if (count >= 0) {
        // For now get all the names
        fileNames->Resize1DOrEmpty(count);
        Int32 eltCount = fileNames->Length();
        for (Int32 i = 0; i < eltCount; i++) {
            (*fileNames->BeginAt(i))->CopyFrom((IntIndex)strlen(dirInfos[i]->d_name), (Utf8Char*)dirInfos[i]->d_name);
        }
        
        for (Int32 i = 0; i < count; i++) {
            free(dirInfos[i]);
        }
        free(dirInfos);
    } else {
        fileNames->Resize1D(0);
    }
    return _NextInstruction();
}
#endif

//------------------------------------------------------------
// TODO in a StaticTypeAndData function the TypeRef is directly stored in the instruction
// not a pointer to TypeRef held in the data space.   There needs to be a way to
// express that in the signature. What is really important is that the
// correct API is used to pick up the parameter.

//------------------------------------------------------------
struct PrintfParamBlock : public VarArgInstruction
{
    _ParamDef(StringRef, format);
    _ParamImmediateDef(StaticTypeAndData, argument1[1]);
    NEXT_INSTRUCTION_METHODV()
};

VIREO_FUNCTION_SIGNATUREV(Printf, PrintfParamBlock)
{
    STACK_VAR(String, tempString);
    
    // Ignore begin & end, then div 2 since each argument is passed via two arguments.
    Int32       count = (_ParamVarArgCount() - 2) / 2;
    SubString   format = _Param(format)->MakeSubStringAlias();
    StaticTypeAndData *arguments =  _ParamImmediate(argument1);
    
    Format(&format, count, arguments, tempString.Value);
    POSIX_NAME(write)(STDOUT_FILENO,(const char*)tempString.Value->Begin(),tempString.Value->Length());
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
        POSIX_NAME(write)(STDOUT_FILENO,(const char*)tempString.Value->Begin(),tempString.Value->Length());
    }
    
    return _NextInstruction();
}
//------------------------------------------------------------
DEFINE_VIREO_BEGIN(LabVIEW_FileIO)
    // Types
    DEFINE_VIREO_TYPE(FileHandle, ".Int32")
    // Values
    DEFINE_VIREO_VALUE(StdIn, STDIN_FILENO, ".FileHandle");
    DEFINE_VIREO_VALUE(StdOut, STDOUT_FILENO, ".FileHandle");
    DEFINE_VIREO_VALUE(StdErr, STDERR_FILENO, ".FileHandle");
    // Primitives
    // Print is like PrintLn
    DEFINE_VIREO_FUNCTION(Println, "p(i(.StaticTypeAndData))");
    DEFINE_VIREO_FUNCTION(Printf, "p(i(.VarArgCount)i(.String)i(.StaticTypeAndData))");
    //--------
#ifdef VIREO_FILESYSTEM
    DEFINE_VIREO_FUNCTION(FileOpen, "p(i(.String)i(.String)i(.Int32)i(.Int32)i(.Boolean)i(.FileHandle)i(.Boolean)o(.Int32))");
    DEFINE_VIREO_FUNCTION(FileSize, "p(i(.FileHandle)o(.Int32))");
    DEFINE_VIREO_FUNCTION(FileDelete, "p(i(.String)o(.Int32))");
    DEFINE_VIREO_FUNCTION(StreamClose, "p(i(.FileHandle)o(.Int32))");
#endif
    //--------
    DEFINE_VIREO_FUNCTION(StreamSetPosition, "p(i(.FileHandle)i(.Int32)i(.Int32)o(.Int32))");
    DEFINE_VIREO_FUNCTION(StreamRead, "p(i(.FileHandle)o(.String)o(.Int32)o(.Int32))");
    DEFINE_VIREO_FUNCTION(StreamWrite, "p(i(.FileHandle)i(.String)i(.Int32)o(.Int32))");

#ifdef VIREO_FILESYSTEM_DIRLIST
    DEFINE_VIREO_FUNCTION(ListDirectory, "p(i(.String)o(a(.String *)))");
#endif

DEFINE_VIREO_END()


