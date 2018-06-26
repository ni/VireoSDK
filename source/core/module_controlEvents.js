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
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignControlEvents', function () {
    'use strict';

    /* global Map */

    // Static Private Variables (all vireo instances)

    var assignControlEvents = function (Module, publicAPI) {
        Module.controlEvents = {};
        publicAPI.controlEvents = {};

        var registerForControlEvent = function () {
            // Dummy no-op function
        };
        var unRegisterForControlEvent = function () {
            // Dummy no-op function
        };

        Module.controlEvents.jsRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var viName = Module.eggShell.dataReadString(viNamePointer);
            registerForControlEvent(viName, controlId, eventId, eventOracleIndex);
        };

        Module.controlEvents.jsUnRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var viName = Module.eggShell.dataReadString(viNamePointer);
            unRegisterForControlEvent(viName, controlId, eventId, eventOracleIndex);
        };

        publicAPI.controlEvents.setRegisterForControlEventsFunction = Module.controlEvents.setRegisterForControlEventsFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('RegisterForControlEvents must be a callable function');
            }

            registerForControlEvent = fn;
        };

        publicAPI.controlEvents.setUnRegisterForControlEventsFunction = Module.controlEvents.setUnRegisterForControlEventsFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('UnRegisterForControlEvents must be a callable function');
            }

            unRegisterForControlEvent = fn;
        };
    };

    return assignControlEvents;
}));
