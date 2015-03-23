/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
 */

#include "TypeAndDataManager.h"
#include "EventLog.h"

using namespace Vireo;

//------------------------------------------------------------
StringRef EventLog::DevNull = (StringRef) null;
StringRef EventLog::StdOut = (StringRef) 1;

//------------------------------------------------------------
EventLog::EventLog(StringRef string)
{
    _errorLog = string;
    _softErrorCount = 0;
    _hardErrorCount = 0;
    _warningCount = 0;
}
//------------------------------------------------------------
void EventLog::LogEventV(EventSeverity severity, Int32 lineNumber, ConstCStr message, va_list args)
{
    char buffer[200];
    
    vsnprintf (buffer, sizeof(buffer), message, args);
    LogEventCore( severity, lineNumber, buffer);
}
//------------------------------------------------------------
void EventLog::LogEvent(EventSeverity severity, Int32 lineNumber, ConstCStr message, ...)
{
    char buffer[200];
    
    va_list args;
    va_start (args, message);
    vsnprintf (buffer, sizeof(buffer), message, args);
    va_end (args);
    
    LogEventCore( severity, lineNumber, buffer);
}
//------------------------------------------------------------
void EventLog::LogEventCore(EventSeverity severity, Int32 lineNumber, ConstCStr message)
{
    char buffer[200];

    ConstCStr preamble;
    
    switch (severity) {
        case kTrace:
            preamble = "Trace";
            break;
        case kWarning:
            preamble = "Warning";
            break;
        case kSoftDataError:
            preamble = "Error";
            _softErrorCount++;
            break;
        case kHardDataError:
            preamble = "HardError";
            _hardErrorCount++;
            break;
        case kAssertFailure:
            preamble = "Assert";
            _hardErrorCount++;
            break;
        default:
            preamble = "Event";
            break;
    }
    
    if (_errorLog == DevNull)
        return;
    
    Int32 length;
    
    if (lineNumber > 0) {
        length = snprintf(buffer, sizeof(buffer), "(Line %d %s \"%s.\")\n", lineNumber, preamble, message);
    } else {
        length = snprintf(buffer, sizeof(buffer), "(%s \"%s.\")\n", preamble, message);
    }
    
    if (_errorLog == StdOut) {
        printf("%s", buffer);
    } else if (_errorLog) {
        _errorLog->Append(length, (const Utf8Char*)buffer);
    }
}

#if 0
DEFINE_VIREO_BEGIN(Vireo_EventLog)
    DEFINE_VIREO_FUNCTION(EventLogRecordEvent, "p(i(.String))")
DEFINE_VIREO_END()
#endif
