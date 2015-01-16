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
    
    TypeManagerRef pParentTADM = parent ? parent->TheTypeManager() : null;
    
    TypeManagerRef pTADM = TypeManager::New(pParentTADM);
    
    // Once the TADM exists use it to create the rest
    {
        // Set it up as the active scope, allocations will now go through this TADM.
        TypeManagerScope scope(pTADM);

        if (!parent) {
            
            TypeDefiner::DefineStandardTypes(pTADM);
            TypeDefiner::DefineTypes(pTADM);
        }
        
        // Once standard types have been loaded the execution system can be constructed
        ExecutionContextRef pExecutionContext = TADM_NEW_PLACEMENT(ExecutionContext)(pTADM);
        
        // Last step create the shell.
        pShell = TADM_NEW_PLACEMENT(EggShell)(pTADM, pExecutionContext);
    }
    return pShell;
}
//------------------------------------------------------------
EggShell::EggShell(TypeManagerRef typeManager, ExecutionContextRef execContext)
{
    _commandCount = 0;
    _typeManger     = typeManager;
    _execContext    = execContext;
    _mallocBuffer   = null;
}
//------------------------------------------------------------
NIError EggShell::Delete()
{
    TypeManagerRef pTADM = _typeManger;
    if (ShowStats) {
        pTADM->PrintMemoryStat("ES Delete begin", false);
    }

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
void EggShell::ParseDefine(TDViaParser *parser)
{
    SubString symbolName;
    
    if (!parser->TheString()->ReadChar('('))
        return parser->LogEvent(EventLog::kHardDataError, "'(' missing");
    
    parser->TheString()->ReadToken(&symbolName);
    
    TypeRef t = parser->ParseType();

    if (!parser->TheString()->ReadChar(')'))
        return parser->LogEvent(EventLog::kHardDataError,  "')' missing");
    
    TypeRef namedType = _execContext->TheTypeManager()->Define(&symbolName, t);
    if (!namedType)
        return parser->LogEvent(EventLog::kHardDataError,  "Can't define symbol");    
}
//------------------------------------------------------------
void EggShell::ParseEnqueueVI(TDViaParser* parser)
{
    SubString viName;
    
    if (! parser->TheString()->ReadChar('('))
        return parser->LogEvent(EventLog::kHardDataError, "'(' missing");
    
     parser->TheString()->ReadToken(&viName);
    
    if (! parser->TheString()->ReadChar(')'))
        return parser->LogEvent(EventLog::kHardDataError, "')' missing");

    VirtualInstrument *vi;
    TypeRef t = _execContext->TheTypeManager()->FindNamedObject(&viName, (void**)&vi);
    
    if (vi != null) {
        vi->PressGo();
    } else {
        return parser->LogEvent(EventLog::kHardDataError, "VI not found '%.*s'", FMT_LEN_BEGIN(&viName));
    }
}
//------------------------------------------------------------
NIError EggShell::REPL(SubString *commandBuffer)
{
    ExecutionContextScope scope(_execContext);
    
    STACK_VAR(String, errorLog);
    EventLog log(errorLog.Value);
    
    TDViaParser parser(_execContext->TheTypeManager(), commandBuffer, &log, 1);
    SubString command;
    
    while((parser.TheString()->Length() > 0) && (log.TotalErrorCount() == 0)) {
        parser.TheString()->ReadToken(&command);
        _commandCount++;
        if (command.CompareCStr("define")) {
            ParseDefine(&parser);
        } else if (command.CompareCStr("enqueue")) {
            ParseEnqueueVI(&parser);
        } else if (command.CompareCStr("clear")) {
            _typeManger->DeleteTypes(false);
        } else if (command.CompareCStr("exit")) {
            log.LogEvent(EventLog::kTrace, 0, "chirp chirp");
            return kNIError_kResourceNotFound;
        } else {
            log.LogEvent(EventLog::kHardDataError, 0, "bad egg");
            break;
        }
        parser.TheString()->EatLeadingSpaces();
        parser.RepinLineNumberBase();
    }
    
    TDViaParser::FinalizeModuleLoad(_execContext->TheTypeManager(), &log);
    
    if (errorLog.Value->Length() > 0) {
        printf("%.*s", (int)errorLog.Value->Length(), errorLog.Value->Begin());
    }
    
    return log.TotalErrorCount() == 0 ? kNIError_Success : kNIError_kCantDecode;
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
#else 
	#include <unistd.h>
	#include <fcntl.h>
	#include <sys/stat.h>
	#define POSIX_NAME(_name_) _name_ 
#endif
//------------------------------------------------------------
NIError EggShell::ReadFile(ConstCStr name, SubString *string)
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
        size_t bytesToRead = (size_t)fileInfo.st_size;
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
            // Free the old buffer.
            _typeManger->Free(_mallocBuffer);
        }
        _mallocBuffer = (char*) _typeManger->Malloc((size_t)packetSize);
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
        // Hangs when reading large buffers from debug console.
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

