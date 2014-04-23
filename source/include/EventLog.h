/**
 
Copyright (c) 2014 National Instruments Corp.
 
This software is subject to the terms described in the LICENSE.TXT file
 
SDG
*/

/*! \file
    \brief A mechanism for Vireo sub systems to report errors.
 */

#ifndef EventLog_h
#define EventLog_h

#include "TypeAndDataManager.h"

namespace Vireo {

class EventLog {
private:
    StringRef       _errorLog;
    Int32           _softErrorCount;
    Int32           _hardErrorCount;
    Int32           _warningCount;
    Boolean         _traceEnabled;
public:
    enum EventSeverity {
        // Diagnostic trace notice, these are only recorded is tracing is turned on.
        kTrace = 0,
        
        // The data being processed is outside the range expected, but a default interpretation
        // has been defined for the giving situation.
        kWarning = 1,
        
        // Some of the inputs do not make sense but this does not prevent processing remaining data
        kSoftDataError = 2,
        
        // Some of the inputs do not make sense and the function cannot proceed
        kHardDataError = 3,
        
        // Internal state of the system has been compromised
        kAssetFailure = 4,
    };
    
    EventLog(StringRef stringRef);
    Int32 TotalErrorCount()                 { return _softErrorCount + _hardErrorCount; };
    Int32 HardErrorCount()                  { return  _hardErrorCount; };
    Boolean TraceEnabled()                  { return _traceEnabled; }
    void SetTraceEnabled(Boolean value)     { _traceEnabled = value; }
    void LogEvent(EventSeverity severity, Int32 lineNumber, const char *message, SubString *extra = null);
};

} // namespace Vireo

#endif //EventLog_h
