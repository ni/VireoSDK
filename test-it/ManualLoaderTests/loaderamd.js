/* global requirejs */
(function () {
    'use strict';
    requirejs.config({
        paths: {
            vireoHelpers: '../../dist/wasm32-unknown-emscripten/release/vireo'
        }
    });

    requirejs(['vireoHelpers'], function (vireoHelpers) {
        var domReady = function (callback) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', callback);
            } else {
                callback();
            }
        };

        var runTest = function () {
            var viaCode = document.getElementById('viacode').textContent;
            vireoHelpers.createInstance({
                wasmUrl: '../../dist/wasm32-unknown-emscripten/release/vireo.core.wasm'
            }).then(function (vireo) {
                vireo.eggShell.loadVia(viaCode);
                return vireo.eggShell.executeSlicesUntilClumpsFinished();
            }).then(function () {
                console.log('finished :D');
            });
        };

        domReady(runTest);
    });
}());
