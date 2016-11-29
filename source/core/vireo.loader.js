// Using a modified UMD module format. Specifically a modified returnExportsGlobal (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? currObj[subNamespace] = nextValue : currObj[subNamespace];
        }, root);
    };

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a named module.
        define(globalName, [
            'NationalInstruments.Vireo.Core.createVireoCore',
            'NationalInstruments.Vireo.ModuleBuilders.assignVireoAPI',
            'NationalInstruments.Vireo.ModuleBuilders.assignHttpClient'
        ], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        module.exports = factory(
            require('../../dist/vireo.js'),
            require('../../source/io/module_vireoapi.js'),
            require('../../source/io/module_httpClient.js')
        );
    } else {
        // Browser globals (root is window)
        buildGlobalNamespace(
            root.NationalInstruments.Vireo.Core.createVireoCore,
            root.NationalInstruments.Vireo.ModuleBuilders.assignVireoAPI,
            root.NationalInstruments.Vireo.ModuleBuilders.assignHttpClient
        );
    }
}(this, 'NationalInstruments.Vireo.buildVireoInstance', function () {
    'use strict';
    // Static Private Variables (all vireo instances)
    var createVireoCore = arguments[0];
    var moduleBuilders = Array.prototype.slice.call(arguments, 1);

    // Vireo Core Mixin Function
    var buildVireoInstance = function () {
        var vireoCore = createVireoCore();
        moduleBuilders.forEach(function (currBuilder) {
            currBuilder.call(undefined, vireoCore);
        });
        return vireoCore.publicAPI;
    };

    return buildVireoInstance;
}));
