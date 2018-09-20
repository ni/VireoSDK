/* global requirejs */
(function () {
    'use strict';

    var domReady = function (callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    var createAndRun = function (vireoHelpers, viaCode) {
        vireoHelpers.createInstance({
            wasmUrl: '../../dist/wasm32-unknown-emscripten/release/vireo.core.wasm'
        }).then(function (vireo) {
            vireo.eggShell.loadVia(viaCode);
            return vireo.eggShell.executeSlicesUntilClumpsFinished();
        }).then(function () {
            console.log('finished :D');
        });
    };

    var runTest = function () {
        var viaCode = document.getElementById('viacode').textContent;

        // Assume amd if NI namespace not loaded
        if (window.vireoHelpers === undefined) {
            console.log('using amd module');
            requirejs(['vireoHelpers'], function (vireoHelpers) {
                createAndRun(vireoHelpers, viaCode);
            });
        } else {
            console.log('using global');
            createAndRun(window.vireoHelpers, viaCode);
        }
    };

    domReady(runTest);
}());
