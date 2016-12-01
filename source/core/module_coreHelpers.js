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
}(this, 'NationalInstruments.Vireo.Core.assignCoreHelpers', function () {
    'use strict';
    // Static Private Variables (all vireo instances)
    // None

    // Vireo Core Mixin Function
    var assignCoreHelpers = function (Module, publicAPI) {
        Module.coreHelpers = {};
        publicAPI.coreHelpers = {};

        // Private Instance Variables (per vireo instance)
        var fpSync = function (/* fpIdStr*/) {
            // Dummy noop function user can replace by using eggShell.setFPSyncFunction
        };

        var bufferPtr, bufferSize;

        // Exported functions
        Module.coreHelpers.jsExecutionContextFPSync = function (fpStringStart, fpStringLength) {
            fpSync(Module.Pointer_stringify(fpStringStart, fpStringLength));
        };

        publicAPI.coreHelpers.setFPSyncFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('FPSync must be a callable function');
            }

            fpSync = fn;
        };

        // Creating a shared string buffer in memory for passing strings into Vireo
        // WARNING: Functions in Vireo should not expect memory to live beyond stack frame
        // https://github.com/kripken/emscripten/blob/07b87426f898d6e9c677db291d9088c839197291/src/library.js#L3669
        // Made the buffer larger: https://github.com/kripken/emscripten/issues/4766
        Module.coreHelpers.writeJSStringToSharedBuffer = function (str) {
            if (!bufferSize || bufferSize < (str.length * 4) + 1) {
                if (bufferSize) {
                    Module._free(bufferPtr);
                }
                bufferSize = (str.length * 4) + 1;
                bufferPtr = Module._malloc(bufferSize);
            }
            Module.writeStringToMemory(str, bufferPtr);
            return bufferPtr;
        };

        Module.coreHelpers.jsTimestampGetTimeZoneAbbr = function () {
            // Looks like it was taken from here http://stackoverflow.com/a/12496442/338923
            // TODO mraj this seems shady, needs more test coverage. Might fail across browsers.
            // We should probably switch to something like the following: new Intl.DateTimeFormat('en-US', {year:'numeric', timeZoneName:'short'}).format(new Date())
            // Using the Intl api: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DateTimeFormat
            // http://stackoverflow.com/a/37798868/338923
            var now = new Date().toString();
            var TZ = now.indexOf('(') > -1 ? now.match(/\([^)]+\)/)[0].match(/[A-Z]/g).join('') : now.match(/[A-Z]{3,4}/)[0];
            if (TZ === 'GMT' && (/(GMT\W*\d{4})/).test(now)) {
                TZ = RegExp.$1;
            }
            return Module.coreHelpers.writeJSStringToSharedBuffer(TZ);
        };

        Module.coreHelpers.jsTimestampGetTimeZoneOffset = function () {
            return Module.coreHelpers.writeJSStringToSharedBuffer(new Date().getTimezoneOffset());
        };
    };

    return assignCoreHelpers;
}));
