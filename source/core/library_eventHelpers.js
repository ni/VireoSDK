(function () {
    'use strict';
    var eventHelpersCAPI = {
        jsRegisterForControlEvent: function () {
            Module.eventHelpers.jsRegisterForControlEvent.apply(undefined, arguments);
        },
        jsUnRegisterForControlEvent: function () {
            Module.eventHelpers.jsUnRegisterForControlEvent.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, eventHelpersCAPI);
}());
