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
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignJavaScriptInvoke', function () {
    'use strict';

    /* global Map */

    // Static Private Variables (all vireo instances)
    var ERRORS = {
        // Shared
        NO_ERROR: {
            CODE: 0,
            MESSAGE: ''
        },

        kNIUnableToInvokeAJavaScriptFunction: {
            CODE: 363656, // TO_DO (CGA): We need to generate a new error code
            MESSAGE: 'Unable to make JavaScript call for function'
        },

        kNIUnsupportedTypeInJavaScriptInvoke: {
            CODE: 363657, // TO_DO (CGA): We need to generate a new error code
            MESSAGE: 'Unsupported parameter type in JavaScript invoke.'
        },

        kNIUnableToFindFunctionForJavaScriptInvoke: {
            CODE: 363658, // TO_DO (CGA): We need to generate a new error code
            MESSAGE: 'Unable to find JavaScript function'
        }
    };

    // Keep in synchrony with JavaScriptParameterTypeEnum in JavaScriptInvoke.cpp
    var JAVASCRIPT_PARAMETER_TYPE = Object.freeze({
        kNone: 0,
        kInt32: 1,
        kUInt32: 2,
        kString: 3,
        kBoolean: 4,
        kDouble: 5
    });

    var formatMessageWithException = function (messageText, exception) {
        if (typeof exception.message === 'string' && exception.message.length !== 0) {
            return messageText + ', Additional information: ' + exception.message;
        }

        return messageText;
    };

    // Vireo Core Mixin Function
    var assignJavaScriptInvoke = function (Module, publicAPI) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'Data_GetParameterPointer',
            'Data_GetParameterType'
        ]}], */

        Module.javaScriptInvoke = {};
        publicAPI.javaScriptInvoke = {};

        // Private Instance Variables (per vireo instance)
        var Data_GetParameterType = Module.cwrap('Data_GetParameterType', 'number', ['number', 'number']);
        var Data_GetParameterPointer = Module.cwrap('Data_GetParameterPointer', 'number', ['number', 'number']);

        var createJavaScriptParametersArray = function (parametersPointer, parametersCount) {
            var parameters = new Array(parametersCount);
            for (var index = 0; index < parametersCount; index += 1) {
                var type = Data_GetParameterType(parametersPointer, index);
                var parameterPointer = Data_GetParameterPointer(parametersPointer, index);
                var parameterValue = undefined;
                if (type === JAVASCRIPT_PARAMETER_TYPE.kInt32) {
                    parameterValue = Module.eggShell.dataReadInt32(parameterPointer);
                } else if (type === JAVASCRIPT_PARAMETER_TYPE.kUInt32) {
                    parameterValue = Module.eggShell.dataReadUInt32(parameterPointer);
                } else if (type === JAVASCRIPT_PARAMETER_TYPE.kString) {
                    parameterValue = Module.eggShell.dataReadString(parameterPointer);
                } else if (type === JAVASCRIPT_PARAMETER_TYPE.kBoolean) {
                    parameterValue = Module.eggShell.dataReadBoolean(parameterPointer);
                } else {
                    throw new Error(ERRORS.kNIUnsupportedTypeInJavaScriptInvoke.CODE + ' ' + ERRORS.kNIUnsupportedTypeInJavaScriptInvoke.MESSAGE + ' For type: ' + type + ' with index = ' + index);
                }
                parameters[index] = parameterValue;
            }
            return parameters;
        };

        var findJavaScriptFunctionToCall = function (functionNameString) {
            var names = functionNameString.split('.');
            var functionToCall = window[names[0]];
            for (var namesIndex = 1; namesIndex < names.length; namesIndex += 1) {
                functionToCall = functionToCall[names[namesIndex]];
            }
            if (typeof functionToCall !== 'function') {
                functionToCall = undefined;
            }
            return functionToCall;
        };

        Module.javaScriptInvoke.jsJavaScriptInvoke = function (
            functionNamePointer,
            parametersPointer,
            parametersCount,
            errorCheckingEnabled,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var functionNameString = Module.eggShell.dataReadString(functionNamePointer);
            var parameters = createJavaScriptParametersArray(parametersPointer, parametersCount);

            var functionToCall = findJavaScriptFunctionToCall(functionNameString);
            if (functionToCall === undefined) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke.CODE;
                newErrorSource = ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke.MESSAGE + ': \'' + functionNameString + '\'.';
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }

            var context = undefined;
            try {
                functionToCall.apply(context, parameters);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnableToInvokeAJavaScriptFunction.CODE;
                newErrorSource = formatMessageWithException(ERRORS.kNIUnableToInvokeAJavaScriptFunction.MESSAGE + ': \'' + functionNameString + '\'.', ex);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
            }

            return;
        };
    };

    return assignJavaScriptInvoke;
}));
