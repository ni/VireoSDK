// Using a modified UMD module format. Specifically a modified returnExports (with dependencies) version
(function (root, globalName, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        // The following must be a static string array for optimizers and build tools to work
        define(['../../dist/vireo', '../../source/io/module_vireoapi'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        // The following must be a static string array for optimizers and build tools to work
        module.exports = factory(require('../../dist/vireo.js'), require('../../source/io/module_vireoapi.js'));
    } else {
        // Browser globals (root is window)
        globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, arr) {
            var nextValue = currentIndex === arr.length - 1 ? factory(root.NationalInstruments.Vireo.Core.createVireoCore, NationalInstruments.Vireo.ModuleBuilders.assignVireoAPI) : {};
            return currObj[subNamespace] === undefined ? currObj[subNamespace] = nextValue : currObj[subNamespace];
        }, root);
  }
}(this, 'NationalInstruments.Vireo.buildVireoInstance', function (createVireoCore, assignVireoAPI) {
    'use strict';

    var buildVireoInstance = function () {
        var vireoCore = createVireoCore();
        assignVireoAPI(vireoCore);
        return vireoCore.publicAPI;
    };

    return buildVireoInstance;
}));