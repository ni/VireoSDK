
import createVireoCore from '../../dist/wasm32-unknown-emscripten/release/vireo.js';
import assignCoreHelpers from '../../source/core/module_coreHelpers.js';
import assignTypeHelpers from '../../source/core/module_typeHelpers.js';
import assignEggShell from '../../source/io/module_eggShell.js';
import assignHttpClient from '../../source/io/module_httpClient.js';
import assignJavaScriptInvoke from '../../source/io/module_javaScriptInvoke.js';
import assignPropertyNode from '../../source/io/module_propertyNode.js';
import assignEventHelpers from '../../source/core/module_eventHelpers.js';

const encodeIdentifier = function (str) {
    if (typeof str !== 'string' || str === '') {
        throw new Error('Identifier must be a non-empty string. Found: ' + str);
    }

    let encoded = '',
        codePoint = str.charCodeAt(0),
        ch = str.charAt(0);

    // First character must be encoded if is not a letter [A-Za-z]
    if (!(codePoint >= 0x41 && codePoint <= 0x5A) && !(codePoint >= 0x61 && codePoint <= 0x7A)) {
        encoded += '%' + codePoint.toString(16).toUpperCase();
    } else {
        encoded += ch;
    }

    for (let i = 1; i < str.length; i += 1) {
        codePoint = str.charCodeAt(i);
        ch = str.charAt(i);

        // Do not encode if it is a number [0-9] or uppercase letter [A-Z] or lowercase [a-z] or any of these [*+_-$] or a non-ascii character.
        if ((codePoint >= 0x30 && codePoint <= 0x39) || (codePoint >= 0x41 && codePoint <= 0x5A) || (codePoint >= 0x61 && codePoint <= 0x7A) ||
            codePoint === 0x24 || codePoint === 0x2A || codePoint === 0x2B || codePoint === 0x2D || codePoint === 0x5F || codePoint > 0x7F) {
            encoded += ch;
        } else {
            encoded += '%' + codePoint.toString(16).toUpperCase();
        }
    }

    return encoded;
};

const decodeIdentifier = function (str) {
    if (typeof str !== 'string' || str === '') {
        throw new Error('Identifier must be a non-empty string. Found: ' + str);
    }

    return decodeURIComponent(str);
};


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

const createInstance = function (config) {
    const Module = createModuleBase(config);
    createVireoCore(Module);

    return Module.vireoWasmReady.then(function () {
        return new Vireo(Module);
    });
};

export default {
    createInstance,
    encodeIdentifier,
    decodeIdentifier
};
