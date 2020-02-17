// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';

    var handlers = [];

    handlers.init = function () {
        self.importScripts.apply(self, arguments);
    };

    handlers.loadAndRun = async function (wasmUrl, viaCode) {
        var vireo = await self.vireoHelpers.createInstance({
            wasmUrl: wasmUrl
        });
        vireo.eggShell.loadVia(viaCode);
        await vireo.eggShell.executeSlicesUntilClumpsFinished();
    };

    self.addEventListener('message', function (evt) {
        handlers[evt.data.fn].apply(undefined, evt.data.params);
    });
}());
