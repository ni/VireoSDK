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
    var ERRORS = {
        // Shared
        NO_ERROR: {
            CODE: 0,
            MESSAGE: ''
        }
    };

    var assignControlEvents = function(Module, publicAPI)
    {
        Module.controlEvents = {};
        publicAPI.controlEvents = {};

        var registerForControlEvent = function() {
            // Dummy no-op function.
        }
        
        var unRegisterForControlEvent = function() {
            // Dummy no-op function.
        }

        Module.controlEvents.jsRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var newErrorStatus = false;
            // var newErrorCode = ERRORS.NO_ERROR.CODE;
            // var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var viName = Module.eggShell.dataReadString(viNamePointer);
            try {
                registerForControlEvent(viName, controlId, eventId, eventOracleIndex);
            } catch (ex) {
                newErrorStatus = true;
                // This code appears to have been copied by Jared from someplace that had errorIO to write to; commented out.
                // newErrorCode = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                // newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                // newErrorSource = Module.coreHelpers.createSourceFromMessage(newErrorSource);
                // Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }
        };

        Module.controlEvents.jsUnRegisterForControlEvent = function (
            viNamePointer,
            controlId,
            eventId,
            eventOracleIndex
        ) {
            var newErrorStatus = false;
            // var newErrorCode = ERRORS.NO_ERROR.CODE;
            // var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var viName = Module.eggshell.dataReadString(viNamePointer);

            try {
                unRegisterForControlEvent(viName, controlId, eventId, eventOracleIndex);
            } catch (ex) {
                newErrorStatus = true;
                // newErrorCode = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                // newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                // newErrorSource = Module.coreHelpers.createSourceFromMessage(newErrorSource);
                // Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }
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
    }
    
    return assignControlEvents;
}));
