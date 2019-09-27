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

    var closeJavaScriptRefNumCAPI = {
        jsCloseJavaScriptRefNumCAPI: function () {
            Module.javaScriptInvoke.closeJavaScriptRefNum.apply(undefined, arguments);
        }
    }

    mergeInto(LibraryManager.library, javaScriptInvokeCAPI);
    mergeInto(LibraryManager.library, isNotAJavaScriptRefnumCAPI);
    mergeInto(LibraryManager.library, closeJavaScriptRefNumCAPI);
}());
