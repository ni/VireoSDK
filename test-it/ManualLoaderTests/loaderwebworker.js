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

    var main = function () {
        var viaCode = document.getElementById('viacode').textContent;
        var viaCodeHttp = document.getElementById('viacodehttp').textContent;
        var worker = new Worker('loaderwebworker_workerhost.js');

        worker.postMessage({
            fn: 'init',
            params: [
                '../../dist/wasm32-unknown-emscripten/release/vireo.js'
            ]
        });

        worker.postMessage({
            fn: 'loadAndRun',
            params: [
                '../../dist/wasm32-unknown-emscripten/release/vireo.core.wasm',
                viaCode
            ]
        });

        worker.postMessage({
            fn: 'loadAndRun',
            params: [
                '../../dist/wasm32-unknown-emscripten/release/vireo.core.wasm',
                viaCodeHttp
            ]
        });
    };

    domReady(main);
}());
