// Emscripten code ends here
};
// End var applyVireoEmscriptenModule = function (Module)

    var createVireoCore = function () {
        var Module = {};

        // Need to cache and restore exports because emscripten overrides exports during applyVireoEmscriptenModule().
        // If we do not cache and restore exports then when createVireoCore is require() and invoked by the user,
        // subsequent require() calls will return [Emscripten Module object] instead of [Function: createVireoCore]
        var cachedNodeExports;
        if (typeof module === 'object' && module.exports) {
            cachedNodeExports = module.exports;
        }

        applyVireoEmscriptenModule(Module);

        if (cachedNodeExports !== undefined) {
            module.exports = cachedNodeExports;
        }

        return Module;
    };

    return createVireoCore;
}));
