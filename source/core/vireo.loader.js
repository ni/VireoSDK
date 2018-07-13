// Using a modified UMD module format. Specifically a modified returnExports (with dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var vireoCore;

    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? (currObj[subNamespace] = nextValue) : currObj[subNamespace];
        }, root);
    };

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a named module.
        define(globalName, [
            'NationalInstruments.Vireo.Core.createVireoCore',
            'NationalInstruments.Vireo.Core.assignCoreHelpers',
            'NationalInstruments.Vireo.Core.assignTypeHelpers',
            'NationalInstruments.Vireo.ModuleBuilders.assignEggShell',
            'NationalInstruments.Vireo.ModuleBuilders.assignHttpClient',
            'NationalInstruments.Vireo.ModuleBuilders.assignJavaScriptInvoke',
            'NationalInstruments.Vireo.ModuleBuilders.assignPropertyNode',
            'NationalInstruments.Vireo.ModuleBuilders.assignEventHelpers'
        ], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        try {
            vireoCore = require('../../dist/asmjs-unknown-emscripten/release/vireo.js');
        } catch (ex) {
            console.error('\n\nFailed to load Vireo core, make sure that vireo.js is built first\n\n');
            throw ex;
        }
        module.exports = factory(
            vireoCore,
            require('../../source/core/module_coreHelpers.js'),
            require('../../source/core/module_typeHelpers.js'),
            require('../../source/io/module_eggShell.js'),
            require('../../source/io/module_httpClient.js'),
            require('../../source/io/module_javaScriptInvoke.js'),
            require('../../source/io/module_propertyNode.js'),
            require('../../source/core/module_eventHelpers.js')
        );
    } else {
        // Browser globals (root is window)
        buildGlobalNamespace(
            root.NationalInstruments.Vireo.Core.createVireoCore,
            root.NationalInstruments.Vireo.Core.assignCoreHelpers,
            root.NationalInstruments.Vireo.Core.assignTypeHelpers,
            root.NationalInstruments.Vireo.ModuleBuilders.assignEggShell,
            root.NationalInstruments.Vireo.ModuleBuilders.assignHttpClient,
            root.NationalInstruments.Vireo.ModuleBuilders.assignJavaScriptInvoke,
            root.NationalInstruments.Vireo.ModuleBuilders.assignPropertyNode,
            root.NationalInstruments.Vireo.ModuleBuilders.assignEventHelpers
        );
    }
}(this, 'NationalInstruments.Vireo.Vireo', function () {
    'use strict';
    // Static Private Variables (all vireo instances)
    var createVireoCore = arguments[0];
    var moduleBuilders = Array.prototype.slice.call(arguments, 1);

    // Vireo Class
    var Vireo = function (config) {
        var that = this;

        var isObject = function (obj) {
            return typeof obj === 'object' && obj !== null;
        };

        var Module;
        if (isObject(config) && isObject(config.customModule)) {
            Module = config.customModule;
        } else {
            Module = {};
        }

        // Functions that must be on Module prior to construction
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

        createVireoCore(Module);
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

    return Vireo;
}));
