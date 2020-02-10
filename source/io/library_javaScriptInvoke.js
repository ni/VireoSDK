// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
        jsCloseJavaScriptRefNum: function () {
            Module.javaScriptInvoke.jsCloseJavaScriptRefNum.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, javaScriptInvokeCAPI);
    mergeInto(LibraryManager.library, isNotAJavaScriptRefnumCAPI);
    mergeInto(LibraryManager.library, closeJavaScriptRefNumCAPI);
}());
