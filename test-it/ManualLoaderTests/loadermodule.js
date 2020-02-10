// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

import vireoHelpers from '../../source/core/vireo.loader.wasm32-unknown-emscripten.release.js';

(async function () {
    var vireo = await vireoHelpers.createInstance({
        wasmUrl: '../../dist/wasm32-unknown-emscripten/release/vireo.core.wasm'
    });

    var viaCode = document.getElementById('viacode').textContent;
    vireo.eggShell.loadVia(viaCode);
    await vireo.eggShell.executeSlicesUntilClumpsFinished();
    console.log('finished :D');
}());
