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
    const Module = (isObject(config) && isObject(config.customModule)) ? config.customModule : {};

    // If the size of TOTAL_MEMORY does not match compile size then Emscripten aborts asynchronously
    // Because the asynchronous abort can be observed but the default behavior cannot be stopped
    // we instead detect this case early to provide a better message
    if (Module.TOTAL_MEMORY !== undefined) {
        throw new Error('Vireo no longer supports configuration of TOTAL_MEMORY. As growable memory is always enabled, configuration of TOTAL_MEMORY is no longer allowed.');
    }

    if (isObject(config)) {
        if (typeof config.wasmUrl === 'string') {
            Module.locateFile = function (path, prefix) {
                if (path.endsWith('.wasm')) {
                    return config.wasmUrl;
                }
                return prefix + path;
            };
        }
    }

    let ttyout = [];
    Module.stdout = function (val) {
        if (val === null || val === 0x0A) {
            Module.print(Module.coreHelpers.sizedUtf8ArrayToJSString(ttyout, 0, ttyout.length));
            ttyout = [];
        } else {
            ttyout.push(val);
        }
    };

    Module.vireoWasmReady = new Promise(function (resolve, reject) {
        Module.onRuntimeInitialized = function () {
            Module.onAbort = undefined;
            // DO NOT resolve with the Module object. The default behavior will cause an infinite Promise resolve loop
            // https://github.com/kripken/emscripten/issues/5820#issuecomment-390946487
            resolve();
        };

        // The lifetime of this abort handler is only until onRuntimeInitialized
        // After onRuntimeInitialized different operations should register their own onAbort handler as needed
        Module.onAbort = function () {
            reject();
        };
    });

    // Block creation of the then method
    // When createVireoCore is run on Module it tries to set a then method
    // The then method when used with Promises can easily get stuck in a loop:
    // See https://github.com/kripken/emscripten/issues/5820
    // We avoid resolving promises with the Module object so this shouldn't be necessary
    // but added as a guard to prevent the behavior from being introduced unexpectedly
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
