import requestVireoInstance from './source/core/vireo.loader.js';


(async function () {
    let config = {
        customModule: {
            locateFile: (path, prefix) => {
                if (path.endsWith('.wasm')) {
                    return './dist/asmjs-unknown-emscripten/release/vireo.wasm';
                }
                return prefix + path;
            }
        }
    };
    
    var vireo = await requestVireoInstance(config);
    
    console.log(vireo);
}());
