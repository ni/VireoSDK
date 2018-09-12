(function () {
    'use strict';
    var coreHelpersCAPI = {
        jsExecutionContextFPSync: function () {
            Module.coreHelpers.jsExecutionContextFPSync.apply(undefined, arguments);
        },

        jsCurrentBrowserFPS: function () {
            return Module.coreHelpers.jsCurrentBrowserFPS.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, coreHelpersCAPI);
}());
