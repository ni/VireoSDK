/* global Module, mergeInto, LibraryManager */
(function () {
    'use strict';
    var javaScriptInvokeCAPI = {
        jsJavaScriptInvoke: function () {
            Module.javaScriptInvoke.jsJavaScriptInvoke.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, javaScriptInvokeCAPI);
}());
