// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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

        var runTest = async function () {
            var viaCode = document.getElementById('viacode').textContent;
            var vireo = await vireoHelpers.createInstance({
                wasmUrl: '../../dist/wasm32-unknown-emscripten/release/vireo.core.wasm'
            });
            vireo.eggShell.loadVia(viaCode);
            await vireo.eggShell.executeSlicesUntilClumpsFinished();
            console.log('finished :D');
        };

        domReady(runTest);
    });
}());
