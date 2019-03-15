(function () {
    'use strict';
    var coreHelpersCAPI = {
        jsExecutionContextFPSync: function () {
            Module.coreHelpers.jsExecutionContextFPSync.apply(undefined, arguments);
        },
        jsMarkValueDirty: function () {
            Module.coreHelpers.jsMarkValueDirty.apply(undefined, arguments);
        },
        jsSystemLogging_WriteMessageUTF8: function () {
            Module.coreHelpers.jsSystemLogging_WriteMessageUTF8.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, coreHelpersCAPI);
}());
