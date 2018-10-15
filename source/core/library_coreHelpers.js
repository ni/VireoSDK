(function () {
    'use strict';
    var coreHelpersCAPI = {
        jsExecutionContextFPSync: function () {
            Module.coreHelpers.jsExecutionContextFPSync.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, coreHelpersCAPI);
}());
