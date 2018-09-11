
import createVireoCore from '../../dist/asmjs-unknown-emscripten/release/vireo.js';
import assignCoreHelpers from '../../source/core/module_coreHelpers.js';
import assignTypeHelpers from '../../source/core/module_typeHelpers.js';
import assignEggShell from '../../source/io/module_eggShell.js';
import assignHttpClient from '../../source/io/module_httpClient.js';
import assignJavaScriptInvoke from '../../source/io/module_javaScriptInvoke.js';
import assignPropertyNode from '../../source/io/module_propertyNode.js';
import assignEventHelpers from '../../source/core/module_eventHelpers.js';

var requestVireoInstance;
(function () {
    // Static Private Variables (all vireo instances)
    var moduleBuilders = [
        assignCoreHelpers,
        assignTypeHelpers,
        assignEggShell,
        assignHttpClient,
        assignJavaScriptInvoke,
        assignPropertyNode,
        assignEventHelpers
    ];

    // Vireo Class
    var Vireo = function (Module) {
        var that = this;

        moduleBuilders.forEach(function (currBuilder) {
            currBuilder(Module, that);
        });
    };

    Vireo.encodeIdentifier = function (str) {
        if (typeof str !== 'string' || str === '') {
            throw new Error('Identifier must be a non-empty string. Found: ' + str);
        }

        var encoded = '',
            codePoint = str.charCodeAt(0),
            ch = str.charAt(0);

        // First character must be encoded if is not a letter [A-Za-z]
        if (!(codePoint >= 0x41 && codePoint <= 0x5A) && !(codePoint >= 0x61 && codePoint <= 0x7A)) {
            encoded += '%' + codePoint.toString(16).toUpperCase();
        } else {
            encoded += ch;
        }

        for (var i = 1; i < str.length; i += 1) {
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

    Vireo.decodeIdentifier = function (str) {
        if (typeof str !== 'string' || str === '') {
            throw new Error('Identifier must be a non-empty string. Found: ' + str);
        }

        return decodeURIComponent(str);
    };


    var createModuleBase = function (config) {
        var isObject = function (obj) {
            return typeof obj === 'object' && obj !== null;
        };

        var Module;
        if (isObject(config) && isObject(config.customModule)) {
            Module = config.customModule;
        } else {
            Module = {};
        }

        // TODO https://github.com/kripken/emscripten/pull/6756
        // Module.print behavior has changed. Not sure if impacted
        // Functions that must be on Module prior to construction
        // I think we need to replace Module.print with our own function. If we need to swap it (like during vireo load) that is our new functions behavior to proxy output.
        // Also to pass file locations to vireo use Module.locateFile: https://kripken.github.io/emscripten-site/docs/api_reference/module.html#Module.locateFile
        // Maybe instead use instantiateWasm so we keep control over how the file is fetched: https://kripken.github.io/emscripten-site/docs/api_reference/module.html#Module.instantiateWasm
        // Yea looks good: https://github.com/kripken/emscripten/blob/incoming/tests/manual_wasm_instantiate.html#L170
        var ttyout = [];
        Module.stdout = function (val) {
            if (val === null || val === 0x0A) {
                Module.print(Module.coreHelpers.sizedUtf8ArrayToJSString(ttyout, 0, ttyout.length));
                ttyout = [];
            } else {
                ttyout.push(val);
            }
        };

        if (typeof createVireoCore !== 'function') {
            throw new Error('createVireoCore could not be found, make sure to build and include vireo.js before using');
        }

        // Save a Vireo class reference on the module instance so the instance can access static functions on the class
        // TODO(mraj) Instead use the static functions directly when we switch to ES6 modules and can resolve the Vireo class correctly
        Module.Vireo = Vireo;

        return Module;
    };

    requestVireoInstance = function (config) {
        return new Promise(function (resolve, reject) {
            // DO NOT USE the then method exposed on createVireoCore()
            // See https://github.com/kripken/emscripten/issues/5820
            try {
                let Module = createModuleBase(config);
                Module.onRuntimeInitialized = function () {
                    // If you dont resolve with a wrapper you end up stuck in a loop
                    // https://github.com/kripken/emscripten/issues/5820#issuecomment-390946487
                    let wrappedModule = {
                        wrapped: Module
                    };
                    resolve(wrappedModule);
                };
                createVireoCore(Module);
            } catch (ex) {
                reject(ex);
            }
        }).then(function (wrappedModule) {
            return new Vireo(wrappedModule.wrapped);
        });
    };
}());

export default requestVireoInstance;
