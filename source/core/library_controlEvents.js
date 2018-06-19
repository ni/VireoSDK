/* global Module, mergeInto, LibraryManager */
(function () {
    'use strict';
    var controlEventsCAPI = {
        jsRegisterForControlEvent: function() {
            Module.controlEvents.jsRegisterForControlEvent.apply(undefined, arguments);
        },
        jsUnRegisterForControlEvent: function() {
            Module.controlEvents.jsUnRegisterForControlEvent.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, controlEventsCAPI);
}());
