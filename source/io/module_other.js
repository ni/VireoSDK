// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, arr) {
            var nextValue = currentIndex === arr.length - 1 ? factory() : {};
            return currObj[subNamespace] === undefined ? currObj[subNamespace] = nextValue : currObj[subNamespace];
        }, root);
  }
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignOtherAPIs', function () {
    'use strict';
    var assignOtherAPIs = function (vireoCore) {
        var Module = vireoCore.Module;
        var MODULE_OTHER_APIS = vireoCore.Module.otherAPIs = {};
        var PUBLIC_OTHER_APIS = vireoCore.publicAPI.otherAPIs = {};
    };

    return assignOtherAPIs;
}));
