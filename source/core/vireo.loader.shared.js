import assignCoreHelpers from '../core/module_coreHelpers.js';
import assignTypeHelpers from '../core/module_typeHelpers.js';
import assignEggShell from '../io/module_eggShell.js';
import assignHttpClient from '../io/module_httpClient.js';
import assignJavaScriptInvoke from '../io/module_javaScriptInvoke.js';
import assignPropertyNode from '../io/module_propertyNode.js';
import assignEventHelpers from '../core/module_eventHelpers.js';

const moduleBuilders = [
    assignCoreHelpers,
    assignTypeHelpers,
    assignEggShell,
    assignHttpClient,
    assignJavaScriptInvoke,
    assignPropertyNode,
    assignEventHelpers
];

class Vireo {
    constructor (Module) {
        let that = this;
        moduleBuilders.forEach(function (currBuilder) {
            currBuilder(Module, that);
        });
    }
}

const isObject = function (obj) {
    return typeof obj === 'object' && obj !== null;
};

const createModuleBase = function (config) {
    let Module = {};
    if (isObject(config)) {
        Module = isObject(config.customModule) ? config.customModule : Module;

        if (typeof config.wasmUrl === 'string') {
            Module.locateFile = function (path, prefix) {
                if (path.endsWith('.wasm')) {
                    return config.wasmUrl;
                }
                return prefix + path;
            };
        }
    }

    // TODO https://github.com/kripken/emscripten/pull/6756
    // Module.print behavior has changed. Not sure if impacted
    // Functions that must be on Module prior to construction
    // I think we need to replace Module.print with our own function. If we need to swap it (like during vireo load) that is our new functions behavior to proxy output.
    // Also to pass file locations to vireo use Module.locateFile: https://kripken.github.io/emscripten-site/docs/api_reference/module.html#Module.locateFile
    // Maybe instead use instantiateWasm so we keep control over how the file is fetched: https://kripken.github.io/emscripten-site/docs/api_reference/module.html#Module.instantiateWasm
    // Yea looks good: https://github.com/kripken/emscripten/blob/incoming/tests/manual_wasm_instantiate.html#L170
    let ttyout = [];
    Module.stdout = function (val) {
        if (val === null || val === 0x0A) {
            Module.print(Module.coreHelpers.sizedUtf8ArrayToJSString(ttyout, 0, ttyout.length));
            ttyout = [];
        } else {
            ttyout.push(val);
        }
    };

    Module.vireoWasmReady = new Promise(function (resolve) {
        Module.onRuntimeInitialized = function () {
            // If you dont resolve with a wrapper you end up stuck in a loop
            // https://github.com/kripken/emscripten/issues/5820#issuecomment-390946487
            resolve();
        };
    });

    // Block creation of the then method
    // When createVireoCore is run on Module it tries to set a then method
    // The then method when used with Promises can easily get stuck in a loop:
    // See https://github.com/kripken/emscripten/issues/5820
    Object.defineProperty(Module, 'then', {
        set: function () {
            // intentionally blank
        },
        get: function () {
            return undefined;
        }
    });

    return Module;
};

const createInstance = function (createVireoCore, config) {
    const Module = createModuleBase(config);
    createVireoCore(Module);

    return Module.vireoWasmReady.then(function () {
        return new Vireo(Module);
    });
};

export default createInstance;
