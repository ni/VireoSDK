/**
 
Copyright (c) 2014 National Instruments Corp.
 
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

#include "stdlib.h"


#include "DataTypes.h"
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
    EggShell *pShell = null;
    
    TypeManager *pParentTADM = parent ? parent->TheTypeManager() : null;
    
    TypeManager *pTADM = TypeManager::New(pParentTADM);
    
    // Once the TADM exists use it to create the rest
    {
        // Set it up as the active scope, allocations will now go through this TADM.
        TypeManagerScope scope(pTADM);

        if (!parent) {
            
            TypeDefiner::DefineStandardTypes(*pTADM);
            TypeDefiner::DefineTypes(*pTADM);
        }
        
        // Once standard types have been loaded the execution system can be constructed
        ExecutionContext *pExecutionContext = TADM_NEW_PLACEMENT(ExecutionContext)(pTADM);
        
        // Last step create the shell.
        pShell = TADM_NEW_PLACEMENT(EggShell)(pTADM, pExecutionContext);
    }
    return pShell;
}
//------------------------------------------------------------
EggShell::EggShell(TypeManager *typeManager, ExecutionContext *execContext)
{
    _commandCount = 0;
    _typeManger     = typeManager;
    _execContext    = execContext;
    _mallocBuffer   = null;
}
//------------------------------------------------------------
NIError EggShell::Delete()
{
    TypeManager* pTADM = _typeManger;
    if(ShowStats) {
        pTADM->PrintMemoryStat("ES Delete begin", false);
    }

    // Nothing should be running when its deleted.
    if (_mallocBuffer) {
        _typeManger->Free(_mallocBuffer);
        _mallocBuffer = null;
    }
    
    pTADM->DeleteTypes(true);
    pTADM->Free(_execContext);
    pTADM->Free(this);
    pTADM->PrintMemoryStat("ES Delete end", true);

    TypeManager::Delete(pTADM);
    
    return kNIError_Success;
}
//------------------------------------------------------------
NIError EggShell::ParseDefine(TDViaParser *parser)
{
    NIError err = kNIError_Success;
    SubString symbolName;
    
    if (!parser->TheString()->ReadChar('('))
        return kNIError_kCantDecode;
    
    parser->TheString()->ReadToken(&symbolName);
    parser->TheString()->EatOptionalComma();
    
    TypeRef t = parser->ParseType();

    if (parser->ErrorCount() > 0)
        err = kNIError_kCantDecode;
    
    if (!parser->TheString()->ReadChar(')'))
        return kNIError_kCantDecode;
    
    _execContext->TheTypeManager()->Define(&symbolName, t);
    
    return err;
}
//------------------------------------------------------------
NIError EggShell::ParseEnqueueVI()
{
    SubString viName;
    
    if (!_pString->ReadChar('('))
        return kNIError_kCantDecode;
    
    _pString->ReadToken(&viName);
    
    if (!_pString->ReadChar(')'))
        return kNIError_kCantDecode;

    VirtualInstrument *vi = (VirtualInstrument*) _execContext->TheTypeManager()->FindNamedObject(&viName);
    
    if (vi != null) {
        vi->PressGo();
    } else {
        printf("(Error \"VI %.*s not found.\")\n", FMT_LEN_BEGIN(&viName));
    }
    
    return kNIError_Success;
}
//------------------------------------------------------------
NIError EggShell::REPL(SubString *commandBuffer)
{
    ExecutionContextScope scope(_execContext);
    
    STACK_VAR(String, errorLog);
    EventLog log(errorLog.Value);
    
    TDViaParser parser(_execContext->TheTypeManager(), commandBuffer, &log, 1);
    _pString = parser.TheString();
    SubString command;
    NIError err = kNIError_Success;
    while((_pString->Length() > 0) && (err == kNIError_Success)) {
        _pString->ReadToken(&command);
        _commandCount++;
        if (command.CompareCStr("define")) {
            err = ParseDefine(&parser);
        } else if (command.CompareCStr("trace")) {
            log.SetTraceEnabled(true);  // No way to turn it off right now
        } else if (command.CompareCStr("enqueue")) {
            err = ParseEnqueueVI();
        } else if (command.CompareCStr("clear")) {
            _typeManger->DeleteTypes(false);
        } else if (command.CompareCStr("exit")) {
            printf("chirp chirp\n");
            return kNIError_kResourceNotFound;
        } else {
            printf("bad egg\n");
            break;
        }
        _pString->EatLeadingSpaces();
        parser.RepinLineNumberBase();
    }
    TDViaParser::FinalizeModuleLoad(_execContext->TheTypeManager(), &log);
    
    if (errorLog.Value->Length() > 0)
        printf("%.*s", (int)errorLog.Value->Length(), errorLog.Value->Begin());

    _pString = null;
    return err;
}
//------------------------------------------------------------
#include <fcntl.h>
#include <stdio.h>
#ifdef _WIN32
	#include <io.h>
	#include <sys/stat.h>
    #define POSIX_NAME(_name_) _##_name_ 
	typedef size_t ssize_t;
	#include <share.h>
#else 
	#include <unistd.h>
	#include <fcntl.h>
	#include <sys/stat.h>
	#define POSIX_NAME(_name_) _name_ 
#endif

NIError EggShell::ReadFile(const char* name, SubString *string)
{
    struct stat fileInfo;
#if (kVireoOS_win32U || kVireoOS_win64U)
    // This will go away once its written as a VI, then it will be hidden the FileIO functions
    int h = 0;
	_sopen_s(&h, name, O_RDONLY, _SH_DENYWR, 0);
#else
    int h = open(name, O_RDONLY, 0777);
#endif
    if (h<0) {
        printf("(Error \"file <%s> not found\")\n", name);
    } else {
        fstat(h, &fileInfo);
        size_t bytesToRead = fileInfo.st_size;    
        _mallocBuffer =  (char*) _typeManger->Malloc(bytesToRead);
        if (h && _mallocBuffer) {
            
            ssize_t bytesRead = POSIX_NAME(read)(h, _mallocBuffer, (UInt32)bytesToRead);

            string->AliasAssign((Utf8Char*)_mallocBuffer, (Utf8Char*)_mallocBuffer+bytesRead);
            
            if (string->ComparePrefixCStr("#!")) {
                // Files can start with a shabang if they are used as  script files.
                // skip the rest of the line.
                string->EatToEol();
            }
            if (ShowStats) {
                printf(" Total bytes read %ld\n", (long) bytesRead);
            }
            return kNIError_Success;
        }
    }
    string->AliasAssign(null, null);
    return kNIError_kResourceNotFound;
}
//------------------------------------------------------------
NIError EggShell::ReadStdinLine(SubString *string)
{
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
            _typeManger->Free(_mallocBuffer);
        }
        _mallocBuffer = (char*) _typeManger->Malloc(packetSize);
        printf("packet size %d\n", (int) packetSize);

#if 1
        for (i = 0; i < packetSize; i++) {
            c = fgetc(stdin);
            _mallocBuffer[i] = c;
            if ((i % 2000) == 0) {
            	printf(".");
            }
        }
    	printf("\n");

#else
        // hangs when reading large buffers from debug console.
        size_t sz = fread(_mallocBuffer, sizeof(char), packetSize, stdin);
#endif
        string->AliasAssign((Utf8Char*)_mallocBuffer, (Utf8Char*)_mallocBuffer + packetSize);
        printf("packet read complete <%d>\n", (int)packetSize);
        return kNIError_Success;
    } else {
        const int MaxCommandLine = 20000;
        if (!_mallocBuffer) {
            _mallocBuffer = (char*) _typeManger->Malloc(MaxCommandLine);
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
}
    
} // namespace Vireo

