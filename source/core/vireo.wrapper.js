// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? (currObj[subNamespace] = nextValue) : currObj[subNamespace];
        }, root);
    };

    if (typeof define === 'function' && define.amd) {
        // AMD. Register as a named module.
        define(globalName, [], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. "CommonJS-like" for environments like Node but not strict CommonJS
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        buildGlobalNamespace();
    }
}(this, 'NationalInstruments.Vireo.Core.createVireoCore', /* eslint-disable strict */ function () {
    // The applyVireoEmscriptenModule function cannot have 'use strict' because Vireo generated code
    // fails strict mode checks when built with debug flags ie -g4
    var applyVireoEmscriptenModule = function (Module) {
        if (typeof Module !== 'object') {
            throw new Error('Must be provided an object to apply vireo');
        }
        // Emscripten code starts here
        // {{insert_vireojs_here}}
        // Emscripten code ends here
    };

    var createVireoCore = function (optionalModule) {
        'use strict';
        var Module = optionalModule || {};

        // Need to cache exports because emscripten overrides exports during applyVireoEmscriptenModule()
        var cachedNodeExports;
        if (typeof module === 'object' && module.exports) {
            cachedNodeExports = module.exports;
        }

        applyVireoEmscriptenModule(Module);

        // Restore exports
        if (cachedNodeExports !== undefined) {
            module.exports = cachedNodeExports;
        }

        return Module;
    };

    return createVireoCore;
}));
