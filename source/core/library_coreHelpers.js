/* global Module, mergeInto, LibraryManager */
(function () {
    'use strict';
    var coreHelpersCAPI = {
        jsTimestampGetTimeZoneAbbr: function () {
            return Module.coreHelpers.jsTimestampGetTimeZoneAbbr.apply(undefined, arguments);
        },

        jsTimestampGetTimeZoneOffset: function () {
            return Module.coreHelpers.jsTimestampGetTimeZoneOffset.apply(undefined, arguments);
        },

        jsExecutionContextFPSync: function () {
            Module.coreHelpers.jsExecutionContextFPSync.apply(undefined, arguments);
        },

        jsCurrentBrowserFPS: function () {
            return Module.coreHelpers.jsCurrentBrowserFPS.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, coreHelpersCAPI);
}());
