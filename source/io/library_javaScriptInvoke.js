/* global Module, mergeInto, LibraryManager */
(function () {
    'use strict';
    var javaScriptCallCAPI = {
        jsJavaScriptInvoke: function () {
            Module.javaScriptInvoke.jsJavaScriptInvoke.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, javaScriptCallCAPI);
}());
