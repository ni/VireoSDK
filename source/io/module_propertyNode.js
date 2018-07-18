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
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignPropertyNode', function () {
    'use strict';

    /* global Map */

    // Static Private Variables (all vireo instances)
    var ERRORS = {
        // Shared
        NO_ERROR: {
            CODE: 0,
            MESSAGE: ''
        },

        kNIObjectReferenceIsInvalid: {
            CODE: 1055,
            MESSAGE: 'Object reference is invalid.'
        }
    };

    // Vireo Core Mixin Function
    var assignPropertyNode = function (Module, publicAPI) {
        Module.propertyNode = {};
        publicAPI.propertyNode = {};

        var readProperty = function () {
            // Dummy no-op function.
        };

        var writeProperty = function () {
            // Dummy no-op function.
        };

        // Private Instance Variables (per vireo instance)
        Module.propertyNode.jsPropertyNodeWrite = function (
            viNamePointer,
            controlIdPointer,
            propertyNamePointer,
            tempVariableTypePointer,
            tempVariableDataPointer,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var viName = Module.eggShell.dataReadString(viNamePointer);
            var controlId = Module.eggShell.dataReadString(controlIdPointer);
            var propertyName = Module.eggShell.dataReadString(propertyNamePointer);
            var valueRef = Module.eggShell.createValueRef(tempVariableTypePointer, tempVariableDataPointer);

            try {
                writeProperty(viName, controlId, propertyName, valueRef);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                newErrorSource = Module.coreHelpers.createSourceFromMessage(newErrorSource);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }
        };

        Module.propertyNode.jsPropertyNodeRead = function (
            viNamePointer,
            controlIdPointer,
            propertyNamePointer,
            tempVariableTypePointer,
            tempVariableDataPointer,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var viName = Module.eggShell.dataReadString(viNamePointer);
            var controlId = Module.eggShell.dataReadString(controlIdPointer);
            var propertyName = Module.eggShell.dataReadString(propertyNamePointer);
            var valueRef = Module.eggShell.createValueRef(tempVariableTypePointer, tempVariableDataPointer);

            try {
                readProperty(viName, controlId, propertyName, valueRef);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIObjectReferenceIsInvalid.CODE;
                newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIObjectReferenceIsInvalid.MESSAGE, ex);
                newErrorSource = Module.coreHelpers.createSourceFromMessage(newErrorSource);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }
        };

        publicAPI.propertyNode.setPropertyReadFunction = Module.propertyNode.setPropertyReadFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('PropertyRead must be a callable function');
            }

            readProperty = fn;
        };

        publicAPI.propertyNode.setPropertyWriteFunction = Module.propertyNode.setPropertyWriteFunction = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('PropertyWrite must be a callable function');
            }

            writeProperty = fn;
        };
    };

    return assignPropertyNode;
}));
