(function () {
    'use strict';
    var javaScriptInvokeCAPI = {
        jsJavaScriptInvoke: function () {
            Module.javaScriptInvoke.jsJavaScriptInvoke.apply(undefined, arguments);
        }
    };

    var isNotAJavaScriptRefnumCAPI = {
        jsIsNotAJavaScriptRefnum: function () {
            Module.javaScriptInvoke.jsIsNotAJavaScriptRefnum.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, javaScriptInvokeCAPI);
    mergeInto(LibraryManager.library, isNotAJavaScriptRefnumCAPI);
}());
