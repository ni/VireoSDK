/**

Copyright (c) 2014-2015 National Instruments Corp.

This software is subject to the terms described in the LICENSE.TXT file

SDG
*/

/*! \file
    \brief A mechanism for Vireo sub systems to report errors.
 */

#ifndef EventLog_h
#define EventLog_h

#include <stdarg.h>
#include "TypeAndDataManager.h"

namespace Vireo {

//------------------------------------------------------------
//! A Class to collect trace, warning and error events when processing a data set.
class EventLog {
private:
    StringRef       _errorLog;
    Int32           _softErrorCount;
    Int32           _hardErrorCount;
    Int32           _warningCount;
public:
    enum EventSeverity {
        //! Diagnostic trace notice, these are only recorded if tracing is turned on.
        kTrace = 0,

        //! An unexpected input was detected and ignored.
        kWarning = 1,

        //! An error in the input was detected but the operation can continue in order to determine if other errors exist.
        kSoftDataError = 2,

        //! An error in the input was detected and the operation cannot continue.
        kHardDataError = 3,
    };

    EventLog(StringRef stringRef);
    Int32 TotalErrorCount()                 { return _softErrorCount + _hardErrorCount; };
    Int32 HardErrorCount()                  { return  _hardErrorCount; };
    Int32 WarningCount()                    { return _warningCount; };
    void LogEventV(EventSeverity severity, Int32 lineNumber, ConstCStr message, va_list args);
    void LogEvent(EventSeverity severity, Int32 lineNumber, ConstCStr message, ...);
    void LogEventCore(EventSeverity severity, Int32 lineNumber, ConstCStr message);

    // TODO: change to use streams
    //! Special string instance for constructor to skip all messages (counts still tallied)
    static StringRef DevNull;
    //! Special string instance for constructor to direct messages to stdout
    static StringRef StdOut;
};

} // namespace Vireo

#endif //EventLog_h
