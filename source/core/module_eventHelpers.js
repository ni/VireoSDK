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
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignEventHelpers', function () {
    'use strict';

    /* global Map */

    // Static Private Variables (all vireo instances)

    var assignEventHelpers = function (Module, publicAPI) {
        Module.eventHelpers = {};
        publicAPI.eventHelpers = {};

        var registerForControlEvent = function () {
            throw new Error('No event registration callback was supplied');
        };
        var unRegisterForControlEvent = function () {
            throw new Error('No event un-registration callback was supplied');
        };

        Module.eventHelpers.jsRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var viName = Module.eggShell.dataReadString(viNamePointer);
            registerForControlEvent(viName, controlId, eventId, eventOracleIndex);
        };

        Module.eventHelpers.jsUnRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var viName = Module.eggShell.dataReadString(viNamePointer);
            unRegisterForControlEvent(viName, controlId, eventId, eventOracleIndex);
        };

        publicAPI.eventHelpers.setRegisterForControlEventsFunction = Module.eventHelpers.setRegisterForControlEventsFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('RegisterForControlEvents must be a callable function');
            }

            registerForControlEvent = fn;
        };

        publicAPI.eventHelpers.setUnRegisterForControlEventsFunction = Module.eventHelpers.setUnRegisterForControlEventsFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('UnRegisterForControlEvents must be a callable function');
            }

            unRegisterForControlEvent = fn;
        };

        publicAPI.eventHelpers.occurEvent = Module.eventHelpers.occurEvent = function (eventOracleIndex, controlId, eventType, writeCallback, eventDataTypeValueRef, eventData) {
            // Allocate space for the event data using the type information passed in to occurEvent
            var allocatedDataValueRef = Module.eggShell.allocateData(eventDataTypeValueRef.typeRef);
            writeCallback(allocatedDataValueRef, eventData);
            Module._OccurEvent(Module.eggShell.v_userShell, eventOracleIndex, controlId, eventType, allocatedDataValueRef.typeRef, allocatedDataValueRef.dataRef);
            // Now that the data has been passed to Vireo, which should copy it, deallocate the memory
            Module.eggShell.deallocateData(allocatedDataValueRef);
        };
    };

    return assignEventHelpers;
}));
