// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    var coreHelpersCAPI = {
        jsExecutionContextFPSync: function () {
            Module.coreHelpers.jsExecutionContextFPSync.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, coreHelpersCAPI);
}());
