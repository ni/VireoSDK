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
        }
    };

    /* var formatMessageWithException = function (messageText, exception) {
        if (typeof exception.message === 'string' && exception.message.length !== 0) {
            return messageText + ', Additional information: ' + exception.message;
        }

        return messageText;
    }; */

    // Vireo Core Mixin Function
    var assignPropertyNode = function (Module, publicAPI) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'JavaScriptInvoke_GetParameterPointer',
            'JavaScriptInvoke_GetParameterType',
            'NationalInstruments',
            'DispatchMessagetToHTMLPanel'
        ]}], */

        Module.property = {};
        publicAPI.property = {};

        // Private Instance Variables (per vireo instance)
        var JavaScriptInvoke_GetParameterType = Module.cwrap('JavaScriptInvoke_GetParameterType', 'number', ['number', 'number']);
        var JavaScriptInvoke_GetParameterPointer = Module.cwrap('JavaScriptInvoke_GetParameterPointer', 'number', ['number', 'number']);

        var getParameterTypeString = function (parametersPointer, index) {
            var typeNamePointer = JavaScriptInvoke_GetParameterType(parametersPointer, index);
            var responseLength = Module.coreHelpers.findCStringLength(Module.HEAPU8, typeNamePointer);
            var typeName = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, typeNamePointer, responseLength);
            return typeName;
        };

        // Private Instance Variables (per vireo instance)

        Module.property.jsPropertyNodeWrite = function (
            viNamePointer,
            controlIdPointer,
            propertyNamePointer,
            valuePointer,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            /* eslint-disable no-undef */
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var viName = Module.eggShell.dataReadString(viNamePointer);
            var controlId = Module.eggShell.dataReadString(controlIdPointer);
            var propertyName = Module.eggShell.dataReadString(propertyNamePointer);
            var valueDataPointer = JavaScriptInvoke_GetParameterPointer(valuePointer, 0);
            var value = undefined;
            switch (getParameterTypeString(value, 0)) {
            case 'Int8':
                value = Module.eggShell.dataReadInt8(valueDataPointer);
                break;
            case 'Int16':
                value = Module.eggShell.dataReadInt16(valueDataPointer);
                break;
            case 'Int32':
                value = Module.eggShell.dataReadInt32(valueDataPointer);
                break;
            case 'UInt8':
                value = Module.eggShell.dataReadUInt8(valueDataPointer);
                break;
            case 'UInt16':
                value = Module.eggShell.dataReadUInt16(valueDataPointer);
                break;
            case 'UInt32':
                value = Module.eggShell.dataReadUInt32(valueDataPointer);
                break;
            case 'Single':
                value = Module.eggShell.dataReadSingle(valueDataPointer);
                break;
            case 'Double':
                value = Module.eggShell.dataReadDouble(valueDataPointer);
                break;
            case 'String':
                value = Module.eggShell.dataReadString(valueDataPointer);
                break;
            case 'Boolean':
                value = Module.eggShell.dataReadBoolean(valueDataPointer);
                break;
            default:
                throw new Error('Unsupported type for value.');
            }
            var messageData = {};
            messageData[propertyName] = value;

            NationalInstruments.HtmlVI.LocalUpdateService.DispatchMessagetToHTMLPanel(viName, controlId, messageData);

            Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);

            return;
        };

        Module.property.jsPropertyNodeRead = function (
            viNamePointer,
            controlIdPointer,
            propertyNamePointer,
            valuePointer,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
            console.log('We are in jsPropertyNodeRead');

            return;
        };
    };

    return assignPropertyNode;
}));
