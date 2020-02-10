// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var createAndRun = async function (vireoHelpers, viaCode) {
        var vireo = await vireoHelpers.createInstance();
        vireo.eggShell.loadVia(viaCode);
        await vireo.eggShell.executeSlicesUntilClumpsFinished();
        var valueRef = vireo.eggShell.findValueRef('MyVI', 'body');
        console.log(JSON.parse(vireo.eggShell.readJSON(valueRef)));
        console.log('finished :D');
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;
        createAndRun(window.vireoHelpers, viaCode);
    };

    domReady(runTest);
}());
