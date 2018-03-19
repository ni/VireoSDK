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
            'NationalInstruments.Vireo.ModuleBuilders.assignEggShell',
            'NationalInstruments.Vireo.ModuleBuilders.assignHttpClient',
            'NationalInstruments.Vireo.ModuleBuilders.assignJavaScriptInvoke',
            'NationalInstruments.Vireo.ModuleBuilders.assignPropertyNode'
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
            require('../../source/io/module_eggShell.js'),
            require('../../source/io/module_httpClient.js'),
            require('../../source/io/module_javaScriptInvoke.js'),
            require('../../source/io/module_propertyNode.js')
        );
    } else {
        // Browser globals (root is window)
        buildGlobalNamespace(
            root.NationalInstruments.Vireo.Core.createVireoCore,
            root.NationalInstruments.Vireo.Core.assignCoreHelpers,
            root.NationalInstruments.Vireo.ModuleBuilders.assignEggShell,
            root.NationalInstruments.Vireo.ModuleBuilders.assignHttpClient,
            root.NationalInstruments.Vireo.ModuleBuilders.assignJavaScriptInvoke,
            root.NationalInstruments.Vireo.ModuleBuilders.assignPropertyNode
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
        createVireoCore(Module);
        moduleBuilders.forEach(function (currBuilder) {
            currBuilder(Module, that);
        });
    };

    return Vireo;
}));
