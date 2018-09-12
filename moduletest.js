import vireoHelpers from './source/core/vireo.loader.js';


(async function () {
    var vireo = await vireoHelpers.requestInstance({
        wasmUrl: './dist/wasm32-unknown-emscripten/release/vireo.wasm'
    });

    var viaCode = document.getElementById('viacode').textContent;
    vireo.eggShell.loadVia(viaCode);
    vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
        console.log('finished :D');
    });
}());
