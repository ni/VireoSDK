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

        var isJavaScriptNumber = function (value) {
            return typeof value === 'number';
        };

        var isJavaScriptString = function (value) {
            return typeof value === 'string';
        };

        var isJavaScriptBoolean = function (value) {
            return typeof value === 'boolean';
        };

        var isInt8Array = function (value) {
            return value instanceof Int8Array;
        };

        var isInt16Array = function (value) {
            return value instanceof Int16Array;
        };

        var isInt32Array = function (value) {
            return value instanceof Int32Array;
        };

        var isUInt8Array = function (value) {
            return value instanceof Uint8Array;
        };

        var isUInt16Array = function (value) {
            return value instanceof Uint16Array;
        };

        var isUInt32Array = function (value) {
            return value instanceof Uint32Array;
        };

        var isSingleArray = function (value) {
            return value instanceof Float32Array;
        };

        var isDoubleArray = function (value) {
            return value instanceof Float64Array;
        };

        var typeFunctions = {
            Int8: {
                reader: Module.eggShell.dataReadInt8,
                writer: Module.eggShell.dataWriteInt8,
                isValidReturnType: isJavaScriptNumber
            },
            Int16: {
                reader: Module.eggShell.dataReadInt16,
                writer: Module.eggShell.dataWriteInt16,
                isValidReturnType: isJavaScriptNumber
            },
            Int32: {
                reader: Module.eggShell.dataReadInt32,
                writer: Module.eggShell.dataWriteInt32,
                isValidReturnType: isJavaScriptNumber
            },
            UInt8: {
                reader: Module.eggShell.dataReadUInt8,
                writer: Module.eggShell.dataWriteUInt8,
                isValidReturnType: isJavaScriptNumber
            },
            UInt16: {
                reader: Module.eggShell.dataReadUInt16,
                writer: Module.eggShell.dataWriteUInt16,
                isValidReturnType: isJavaScriptNumber
            },
            UInt32: {
                reader: Module.eggShell.dataReadUInt32,
                writer: Module.eggShell.dataWriteUInt32,
                isValidReturnType: isJavaScriptNumber
            },
            Single: {
                reader: Module.eggShell.dataReadSingle,
                writer: Module.eggShell.dataWriteSingle,
                isValidReturnType: isJavaScriptNumber
            },
            Double: {
                reader: Module.eggShell.dataReadDouble,
                writer: Module.eggShell.dataWriteDouble,
                isValidReturnType: isJavaScriptNumber
            },
            String: {
                reader: Module.eggShell.dataReadString,
                writer: Module.eggShell.dataWriteString,
                isValidReturnType: isJavaScriptString
            },
            Boolean: {
                reader: Module.eggShell.dataReadBoolean,
                writer: Module.eggShell.dataWriteBoolean,
                isValidReturnType: isJavaScriptBoolean
            },
            ArrayInt8: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteInt8Array,
                isValidReturnType: isInt8Array
            },
            ArrayInt16: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteInt16Array,
                isValidReturnType: isInt16Array
            },
            ArrayInt32: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteInt32Array,
                isValidReturnType: isInt32Array
            },
            ArrayUInt8: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteUInt8Array,
                isValidReturnType: isUInt8Array
            },
            ArrayUInt16: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteUInt16Array,
                isValidReturnType: isUInt16Array
            },
            ArrayUInt32: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteUInt32Array,
                isValidReturnType: isUInt32Array
            },
            ArraySingle: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteSingleArray,
                isValidReturnType: isSingleArray
            },
            ArrayDouble: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteDoubleArray,
                isValidReturnType: isDoubleArray
            }
        };

        var createJavaScriptParametersArray = function (parametersPointer, parametersCount) {
            var parameters = new Array(parametersCount);
            for (var index = 0; index < parametersCount; index += 1) {
                var typeName = getParameterTypeString(parametersPointer, index);
                var parameterPointer = JavaScriptInvoke_GetParameterPointer(parametersPointer, index);
                var parameterValue = undefined;
                var readFunction = typeFunctions[typeName].reader;
                if (readFunction === undefined) {
                    throw new Error(' Unsupported type for parameter with index = ' + index);
                } else {
                    parameterValue = readFunction(parameterPointer);
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
            if (returnTypeName === 'StaticTypeAndData') {
                return;
            }

            var typeConfig = typeFunctions[returnTypeName];

            var exception;
            if (typeConfig === undefined) {
                exception = new Error(ERRORS.kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke.MESSAGE);
                exception.name = ERRORS.kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke.CODE;
                throw exception;
            } else if (typeConfig.isValidReturnType(returnValue) === false) {
                exception = new Error(ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke.MESSAGE);
                exception.name = ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke.CODE;
                throw exception;
            }

            var writer = typeFunctions[returnTypeName].writer;
            writer(returnValuePointer, returnValue);
        };

        var updateReturnValue = function (
            functionName,
            returnPointer,
            returnValue,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var returnValueIndex = 0;

            if (!isValidJavaScriptReturnType(returnValue)) {
                var code = ERRORS.kNIUnsupportedJavaScriptReturnTypeInJavaScriptInvoke.CODE;
                var source = ERRORS.kNIUnsupportedJavaScriptReturnTypeInJavaScriptInvoke.MESSAGE + '\'' + functionName + '\'.';
                Module.coreHelpers.mergeErrors(true, code, source, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }

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
