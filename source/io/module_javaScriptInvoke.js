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
            CODE: 44300,
            MESSAGE: 'An exception occurred within the external JavaScript function called by a JavaScript Library Interface Node. Verify the values you wired to the node. Exception thrown when calling: '
        },

        kNIUnsupportedParameterTypeInJavaScriptInvoke: {
            CODE: 44301,
            MESSAGE: 'Unsupported data type for JavaScript Library interface node parameter when calling: '
        },

        kNIUnableToFindFunctionForJavaScriptInvoke: {
            CODE: 44302,
            MESSAGE: 'The function name for the JavaScript Library interface node cannot be found: '
        },

        kNIUnableToSetReturnValueInJavaScriptInvoke: {
            CODE: 44303,
            MESSAGE: 'Unable to set return value for JavaScript Library interface node parameter when calling: '
        },

        kNIUnsupportedJavaScriptReturnTypeInJavaScriptInvoke: {
            CODE: 44304,
            MESSAGE: 'Unsupported JavaScript return type for JavaScript Library interface node parameter when calling: '
        },

        kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke: {
            CODE: 44305,
            MESSAGE: 'Unsupported LabVIEW return type for JavaScript Library interface node parameter when calling: '
        },

        kNITypeMismatchForReturnTypeInJavaScriptInvoke: {
            CODE: 44306,
            MESSAGE: 'Type mismatch in return type for JavaScript Library interface node parameter when calling: '
        }
    };

    // Vireo Core Mixin Function
    var assignJavaScriptInvoke = function (Module, publicAPI) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'JavaScriptInvoke_GetParameterPointer',
            'JavaScriptInvoke_GetParameterType'
        ]}], */

        Module.javaScriptInvoke = {};
        publicAPI.javaScriptInvoke = {};

        // Private Instance Variables (per vireo instance)
        var JavaScriptInvoke_GetParameterType = Module.cwrap('JavaScriptInvoke_GetParameterType', 'number', ['number', 'number']);
        var JavaScriptInvoke_GetParameterPointer = Module.cwrap('JavaScriptInvoke_GetParameterPointer', 'number', ['number', 'number']);

        var getParameterTypeString = function (parametersPointer, index) {
            var typeNamePointer = JavaScriptInvoke_GetParameterType(parametersPointer, index);
            var responseLength = Module.coreHelpers.findCStringLength(Module.HEAPU8, typeNamePointer);
            var typeName = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, typeNamePointer, responseLength);
            return typeName;
        };

        var createJavaScriptParametersArray = function (parametersPointer, parametersCount) {
            var parameters = new Array(parametersCount);
            for (var index = 0; index < parametersCount; index += 1) {
                var typeName = getParameterTypeString(parametersPointer, index);
                var parameterPointer = JavaScriptInvoke_GetParameterPointer(parametersPointer, index);
                var parameterValue = undefined;
                switch (typeName) {
                case 'Int8':
                    parameterValue = Module.eggShell.dataReadInt8(parameterPointer);
                    break;
                case 'Int16':
                    parameterValue = Module.eggShell.dataReadInt16(parameterPointer);
                    break;
                case 'Int32':
                    parameterValue = Module.eggShell.dataReadInt32(parameterPointer);
                    break;
                case 'UInt8':
                    parameterValue = Module.eggShell.dataReadUInt8(parameterPointer);
                    break;
                case 'UInt16':
                    parameterValue = Module.eggShell.dataReadUInt16(parameterPointer);
                    break;
                case 'UInt32':
                    parameterValue = Module.eggShell.dataReadUInt32(parameterPointer);
                    break;
                case 'Single':
                    parameterValue = Module.eggShell.dataReadSingle(parameterPointer);
                    break;
                case 'Double':
                    parameterValue = Module.eggShell.dataReadDouble(parameterPointer);
                    break;
                case 'String':
                    parameterValue = Module.eggShell.dataReadString(parameterPointer);
                    break;
                case 'Boolean':
                    parameterValue = Module.eggShell.dataReadBoolean(parameterPointer);
                    break;
                case 'ArrayInt8':
                    parameterValue = Module.eggShell.dataReadInt8Array(parameterPointer);
                    break;
                case 'ArrayInt16':
                    parameterValue = Module.eggShell.dataReadInt16Array(parameterPointer);
                    break;
                case 'ArrayInt32':
                    parameterValue = Module.eggShell.dataReadInt32Array(parameterPointer);
                    break;
                case 'ArrayUInt8':
                    parameterValue = Module.eggShell.dataReadUInt8Array(parameterPointer);
                    break;
                case 'ArrayUInt16':
                    parameterValue = Module.eggShell.dataReadUInt16Array(parameterPointer);
                    break;
                case 'ArrayUInt32':
                    parameterValue = Module.eggShell.dataReadUInt32Array(parameterPointer);
                    break;
                case 'ArraySingle':
                    parameterValue = Module.eggShell.dataReadSingleArray(parameterPointer);
                    break;
                case 'ArrayDouble':
                    parameterValue = Module.eggShell.dataReadDoubleArray(parameterPointer);
                    break;
                default:
                    throw new Error(' Unsupported type for parameter with index = ' + index);
                }
                parameters[index] = parameterValue;
            }
            return parameters;
        };

        var findJavaScriptFunctionToCall = function (functionName) {
            var names = functionName.split('.');
            var jsSelfScope = typeof self !== 'undefined' ? self : {};
            var jsGlobalScope = typeof global !== 'undefined' ? global : jsSelfScope;
            var jsWindowScope = typeof window !== 'undefined' ? window : jsGlobalScope;
            var functionToCall = jsWindowScope[names[0]];
            for (var namesIndex = 1; namesIndex < names.length; namesIndex += 1) {
                if (functionToCall === undefined) {
                    break;
                }
                functionToCall = functionToCall[names[namesIndex]];
            }
            if (typeof functionToCall !== 'function') {
                functionToCall = undefined;
            }
            return functionToCall;
        };

        var throwTypeMismatchException = function () {
            var e = new Error(ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke.MESSAGE);
            e.name = ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke.CODE;
            throw e;
        };

        var updateInt8ReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteInt8(returnValuePointer, returnValue);
        };

        var updateInt16ReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteInt16(returnValuePointer, returnValue);
        };

        var updateInt32ReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteInt32(returnValuePointer, returnValue);
        };

        var updateUInt8ReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteUInt8(returnValuePointer, returnValue);
        };

        var updateUInt16ReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteUInt16(returnValuePointer, returnValue);
        };

        var updateUInt32ReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteUInt32(returnValuePointer, returnValue);
        };

        var updateSingleReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteSingle(returnValuePointer, returnValue);
        };

        var updateDoubleReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'number') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteDouble(returnValuePointer, returnValue);
        };

        var updateStringReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'string') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteString(returnValuePointer, returnValue);
        };

        var updateBooleanReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (javaScriptReturnTypeName !== 'boolean') {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteBoolean(returnValuePointer, returnValue);
        };

        var updateInt8ArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Int8Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteInt8Array(returnValuePointer, returnValue);
        };

        var updateInt16ArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Int16Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteInt16Array(returnValuePointer, returnValue);
        };

        var updateInt32ArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Int32Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteInt32Array(returnValuePointer, returnValue);
        };

        var updateUInt8ArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Uint8Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteUInt8Array(returnValuePointer, returnValue);
        };

        var updateUInt16ArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Uint16Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteUInt16Array(returnValuePointer, returnValue);
        };

        var updateUInt32ArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Uint32Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteUInt32Array(returnValuePointer, returnValue);
        };

        var updateSingleArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Float32Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteSingleArray(returnValuePointer, returnValue);
        };

        var updateDoubleArrayReturnValue = function (
            javaScriptReturnTypeName,
            returnValuePointer,
            returnValue) {
            if (!(returnValue instanceof Float64Array)) {
                throwTypeMismatchException();
            }

            Module.eggShell.dataWriteDoubleArray(returnValuePointer, returnValue);
        };

        var isTypedArray = function (
            value) {
            if (value instanceof Int8Array ||
                value instanceof Int16Array ||
                value instanceof Int32Array ||
                value instanceof Uint8Array ||
                value instanceof Uint16Array ||
                value instanceof Uint32Array ||
                value instanceof Float32Array ||
                value instanceof Float64Array) {
                return true;
            }

            return false;
        };

        var isValidJavaScriptReturnType = function (
            returnValue) {
            var returnTypeName = typeof returnValue;
            return (returnTypeName === 'number') ||
            (returnTypeName === 'boolean') ||
            (returnTypeName === 'string') ||
            (returnTypeName === 'undefined') ||
            (isTypedArray(returnValue));
        };

        var updateReturnValueGivenType = function (
            returnTypeName,
            returnValuePointer,
            returnValue) {
            var javaScriptReturnTypeName = typeof returnValue;
            switch (returnTypeName) {
            case 'Int8':
                updateInt8ReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'Int16':
                updateInt16ReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'Int32':
                updateInt32ReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'UInt8':
                updateUInt8ReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'UInt16':
                updateUInt16ReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'UInt32':
                updateUInt32ReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'Single':
                updateSingleReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'Double':
                updateDoubleReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'String':
                updateStringReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'Boolean':
                updateBooleanReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArrayInt8':
                updateInt8ArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArrayInt16':
                updateInt16ArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArrayInt32':
                updateInt32ArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArrayUInt8':
                updateUInt8ArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArrayUInt16':
                updateUInt16ArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArrayUInt32':
                updateUInt32ArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArraySingle':
                updateSingleArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'ArrayDouble':
                updateDoubleArrayReturnValue(javaScriptReturnTypeName, returnValuePointer, returnValue);
                break;
            case 'StaticTypeAndData': {
                break;
            }
            default: {
                var e = new Error(ERRORS.kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke.MESSAGE);
                e.name = ERRORS.kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke.CODE;
                throw e;
            }
            }
        };

        var updateReturnValue = function (
            functionName,
            returnPointer,
            returnValue,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            if (!isValidJavaScriptReturnType(returnValue)) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnsupportedJavaScriptReturnTypeInJavaScriptInvoke.CODE;
                newErrorSource = ERRORS.kNIUnsupportedJavaScriptReturnTypeInJavaScriptInvoke.MESSAGE + '\'' + functionName + '\'.';
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }

            var returnValueIndex = 0;
            var returnTypeName = getParameterTypeString(returnPointer, returnValueIndex);
            var returnValuePointer = undefined;

            if (returnTypeName !== 'StaticTypeAndData') { // User doesn't want return value. We're passing '*' for the return in VIA code, we get StaticTypeAndData
                returnValuePointer = JavaScriptInvoke_GetParameterPointer(returnPointer, 0);
            }

            try {
                updateReturnValueGivenType(returnTypeName, returnValuePointer, returnValue);
            } catch (e) {
                var errorSource = e.message + '\'' + functionName + '\'.';
                Module.coreHelpers.mergeErrors(true, e.name, errorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
            }
        };

        Module.javaScriptInvoke.jsJavaScriptInvoke = function (
            functionNamePointer,
            returnPointer,
            parametersPointer,
            parametersCount,
            errorCheckingEnabled,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var functionName = Module.eggShell.dataReadString(functionNamePointer);
            var parameters = undefined;
            try {
                parameters = createJavaScriptParametersArray(parametersPointer, parametersCount);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnsupportedParameterTypeInJavaScriptInvoke.CODE;
                newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIUnsupportedParameterTypeInJavaScriptInvoke.MESSAGE + '\'' + functionName + '\'.', ex);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }

            var functionToCall = findJavaScriptFunctionToCall(functionName);
            if (functionToCall === undefined) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke.CODE;
                newErrorSource = ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke.MESSAGE + '\'' + functionName + '\'.';
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }

            var context = undefined;
            var returnValue = undefined;
            try {
                returnValue = functionToCall.apply(context, parameters);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnableToInvokeAJavaScriptFunction.CODE;
                newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIUnableToInvokeAJavaScriptFunction.MESSAGE + '\'' + functionName + '\'.', ex);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }

            try {
                updateReturnValue(functionName, returnPointer, returnValue, errorStatusPointer, errorCodePointer, errorSourcePointer);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke.CODE;
                newErrorSource = Module.coreHelpers.formatMessageWithException(ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke.MESSAGE + '\'' + functionName + '\'.', ex);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
            }

            return;
        };
    };

    return assignJavaScriptInvoke;
}));
