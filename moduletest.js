import requestVireoInstance from './source/core/vireo.loader.js';


(async function () {
    var vireo = await requestVireoInstance({
        wasmUrl: './dist/asmjs-unknown-emscripten/release/vireo.wasm'
    });

    var viaCode = document.getElementById('viacode').textContent;
    vireo.eggShell.loadVia(viaCode);
    vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
        console.log('finished :D');
    });
}());
