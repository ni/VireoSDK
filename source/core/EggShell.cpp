/**
 
Copyright (c) 2014-2015 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

/*_____        ____    ____
  |   |       /   /   /   /  ====|\
  |   |      /   /   /   /       |X}==================
  |   |     /   /   /   /  ======|/
  |   |    /   /   /   /  ___ __   ________   ________
  |   |   /   /   /   /  /  //_ / /  __   /  /  _    /
  |   |  /   /   /   /  /   /    /  /_/  /  /  / /  /
  |   | /   /   /   /  /  /     /  ____ /  /  / /  /
  |   |/   /   /   /  /  /     /  /____   /  /_/  /
  |_______/   /___/  /__/     /_______/  /_______/SDG
 */

#include "TypeDefiner.h"
#include "ExecutionContext.h"
#include "EggShell.h"
#include "VirtualInstrument.h"
#include "TDCodecVia.h"

namespace Vireo
{
//------------------------------------------------------------
EggShell* EggShell::Create(EggShell* parent)
{
    TypeManagerRef parentTADM = parent ? parent->TheTypeManager() : null;
    TypeManagerRef newTADM = ConstructTypeManagerAndExecutionContext(parentTADM);
    {
        TypeManagerScope scope(newTADM);
        return TADM_NEW_PLACEMENT(EggShell)(newTADM);
    }
}
//------------------------------------------------------------
EggShell::EggShell(TypeManagerRef tm)
{
    _typeManager     = tm;
    _mallocBuffer   = null;
}
//------------------------------------------------------------
NIError EggShell::Delete()
{
    TypeManagerRef pTADM = _typeManager;
    if (ShowStats) {
        pTADM->PrintMemoryStat("ES Delete begin", false);
    }

    if (_mallocBuffer) {
        _typeManager->Free(_mallocBuffer);
        _mallocBuffer = null;
    }
    
    pTADM->DeleteTypes(true);
    pTADM->Free(this);
    pTADM->PrintMemoryStat("ES Delete end", true);

    TypeManager::Delete(pTADM);
    
    return kNIError_Success;
}
//------------------------------------------------------------
NIError EggShell::REPL(SubString *commandBuffer)
{
    TypeManagerScope scope(_typeManager);
    
    STACK_VAR(String, errorLog);
    EventLog log(errorLog.Value);
    
    TDViaParser parser(_typeManager, commandBuffer, &log, 1);
    NIError err = parser.ParseREPL();

    if (errorLog.Value->Length() > 0) {
        PlatformIO::Printf("%.*s", (int)errorLog.Value->Length(), errorLog.Value->Begin());
    }
    
    return err;
}
//------------------------------------------------------------
// TODO Eventually Vireo should use a a Vireo program to process file io
#include <fcntl.h>
#include <stdio.h>
#ifdef _WIN32
	#include <io.h>
	#include <sys/stat.h>
    #define POSIX_NAME(_name_) _##_name_ 
	typedef size_t ssize_t;
	#include <share.h>
#elif defined (VIREO_STDIO)
	#include <unistd.h>
	#include <fcntl.h>
	#include <sys/stat.h>
	#define POSIX_NAME(_name_) _name_ 
#endif
//------------------------------------------------------------
NIError EggShell::ReadFile(ConstCStr name, SubString *string)
{
#if defined(VIREO_STDIO)
    struct stat fileInfo;
#if (kVireoOS_win32U || kVireoOS_win64U)
    // This will go away once its written as a VI, then it will be hidden the FileSystem functions
    int h = 0;
	_sopen_s(&h, name, O_RDONLY, _SH_DENYWR, 0);
#else
    int h = open(name, O_RDONLY, 0777);
#endif
    if (h<0) {
        PlatformIO::Printf("(Error \"file <%s> not found\")\n", name);
    } else {
        fstat(h, &fileInfo);
        size_t bytesToRead = (size_t)fileInfo.st_size;
        _mallocBuffer =  (char*) _typeManager->Malloc(bytesToRead);
        if (h && _mallocBuffer) {
            
#if defined(VIREO_STDIO)
            ssize_t bytesRead = POSIX_NAME(read)(h, _mallocBuffer, (UInt32)bytesToRead);
#else
            ssize_t bytesRead = 0;
#endif
            string->AliasAssign((Utf8Char*)_mallocBuffer, (Utf8Char*)_mallocBuffer+bytesRead);
            
            if (string->ComparePrefixCStr("#!")) {
                // Files can start with a shabang if they are used as  script files.
                // skip the rest of the line.
                string->EatToEol();
            }
            if (ShowStats) {
                PlatformIO::Printf(" Total bytes read %ld\n", (long) bytesRead);
            }
            return kNIError_Success;
        }
    }
#endif
    string->AliasAssign(null, null);
    return kNIError_kResourceNotFound;
}
//------------------------------------------------------------
NIError EggShell::ReadStdinLine(SubString *string)
{
#if defined (VIREO_STDIO)
    const int lenlen = 10;
    Int32 i = 0;
    char c;
    
    c = fgetc(stdin);
    if (c == '<') {
        //  <count>xxxxxxxx "<4>exit"
        // comand starts with a size
        char packetHeader[lenlen];
        do {
            c = fgetc(stdin);
            if (i < lenlen) {
                packetHeader[i++] = c;
            }
        } while ( c !=  '>' );
        SubString packet((Utf8Char*)packetHeader, (Utf8Char*)packetHeader+i);
        IntMax packetSize = 0;
        packet.ReadInt(&packetSize);
        
        if (_mallocBuffer) {
            // Free the old buffer.
            _typeManager->Free(_mallocBuffer);
        }
        _mallocBuffer = (char*) _typeManager->Malloc((size_t)packetSize);
        PlatformIO::Printf("packet size %d\n", (int) packetSize);

        for (i = 0; i < packetSize; i++) {
            c = fgetc(stdin);
            _mallocBuffer[i] = c;
            if ((i % 2000) == 0) {
                PlatformIO::Print(".");
            }
        }
        PlatformIO::Print("\n");

        string->AliasAssign((Utf8Char*)_mallocBuffer, (Utf8Char*)_mallocBuffer + packetSize);
        PlatformIO::Printf("packet read complete <%d>\n", (int)packetSize);
        return kNIError_Success;
    } else {
        const int MaxCommandLine = 20000;
        if (!_mallocBuffer) {
            _mallocBuffer = (char*) _typeManager->Malloc(MaxCommandLine);
        }
        while(true) {
            if ((c == (char)EOF) || (c == '\n') || i >= MaxCommandLine) {
                break;
            }
            _mallocBuffer[i++] = c;
            c = fgetc(stdin);
        }
        string->AliasAssign((Utf8Char*)_mallocBuffer, (Utf8Char*)_mallocBuffer + i);
        return ((c == (char)EOF) && (0 == i)) ? kNIError_kResourceNotFound : kNIError_Success;
    }
#endif
    return kNIError_Success;
}
    
} // namespace Vireo

