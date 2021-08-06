// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    var coreHelpersCAPI = {
        jsExecutionContextFPSync: function () {
            Module.coreHelpers.jsExecutionContextFPSync.apply(undefined, arguments);
        },
        jsSystemLogging_WriteMessageUTF8: function () {
            Module.coreHelpers.jsSystemLogging_WriteMessageUTF8.apply(undefined, arguments);
        },
        jsDebuggingContextDebugPointInterrupt: function () {
            Module.coreHelpers.jsDebuggingContextDebugPointInterrupt.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, coreHelpersCAPI);
}());
