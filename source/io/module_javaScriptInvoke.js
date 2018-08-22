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
            MESSAGE: 'An exception occurred within the external JavaScript function called by a JavaScript Library Interface node. Verify your JavaScript code is valid.'
        },

        kNIUnsupportedParameterTypeInJavaScriptInvoke: {
            CODE: 44301,
            MESSAGE: 'JavaScript function contains a parameter of an unsupported data type. Convert unsupported JavaScript types to types supported by the JavaScript Library Interface.'
        },

        kNIUnableToFindFunctionForJavaScriptInvoke: {
            CODE: 44302,
            MESSAGE: 'Function not found. Verify the function name in the external JavaScript file matches the function name in the JavaScript Library Interface.'
        },

        kNIUnableToSetReturnValueInJavaScriptInvoke: {
            CODE: 44303,
            MESSAGE: 'Unable to set return value for JavaScript Library Interface node parameter.'
        },

        kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke: {
            CODE: 44305,
            MESSAGE: 'Unsupported return type for JavaScript Library Interface node parameter.'
        },

        kNITypeMismatchForReturnTypeInJavaScriptInvoke: {
            CODE: 44306,
            MESSAGE: 'Return type mismatch. Verify the return type in the JavaScript Library Interface matches the return type in the external JavaScript function.'
        }
    };

    // Vireo Core Mixin Function
    var assignJavaScriptInvoke = function (Module, publicAPI) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'JavaScriptInvoke_GetParameterPointer',
            'JavaScriptInvoke_GetParameterType',
            'JavaScriptInvoke_GetArrayElementType',
            'Data_ReadJavaScriptRefNum',
            'Data_WriteJavaScriptRefNum'
        ]}], */

        Module.javaScriptInvoke = {};
        publicAPI.javaScriptInvoke = {};

        // Private Instance Variables (per vireo instance)
        var internalFunctionsMap = new Map();
        var JavaScriptInvoke_GetParameterType = Module.cwrap('JavaScriptInvoke_GetParameterType', 'number', ['number', 'number']);
        var JavaScriptInvoke_GetParameterPointer = Module.cwrap('JavaScriptInvoke_GetParameterPointer', 'number', ['number', 'number']);
        var JavaScriptInvoke_GetArrayElementType = Module.cwrap('JavaScriptInvoke_GetArrayElementType', 'number', ['number']);
        var Data_ReadJavaScriptRefNum = Module.cwrap('Data_ReadJavaScriptRefNum', 'number', ['number']);
        var Data_WriteJavaScriptRefNum = Module.cwrap('Data_WriteJavaScriptRefNum', 'void', ['number', 'number']);

        var getParameterTypeString = function (parametersPointer, index) {
            var typeNamePointer = JavaScriptInvoke_GetParameterType(parametersPointer, index);
            var responseLength = Module.coreHelpers.findCStringLength(Module.HEAPU8, typeNamePointer);
            var typeName = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, typeNamePointer, responseLength);
            return typeName;
        };

        var getArrayElementTypeString = function (arrayPointer) {
            var typeNamePointer = JavaScriptInvoke_GetArrayElementType(arrayPointer);
            var responseLength = Module.coreHelpers.findCStringLength(Module.HEAPU8, typeNamePointer);
            var typeName = Module.coreHelpers.sizedUtf8ArrayToJSString(Module.HEAPU8, typeNamePointer, responseLength);
            return typeName;
        };

        var isJavaScriptNumber = function (value) {
            return typeof value === 'number';
        };

        var jsRefNumToJsValueMap = new Map();
        var jsValueToJsRefNumCache = new Map();
        var jsRefNumCookieCounter = 0;

        var isPrimitiveType = function (jsValue) {
            return ((typeof jsValue !== 'object' || jsValue === null) && typeof jsValue !== 'function' && typeof jsValue !== 'symbol');
        };

        var cacheRefNum = function (cookie, jsValue) {
            jsRefNumToJsValueMap.set(cookie, jsValue);
            if (!isPrimitiveType(jsValue)) { // we don't want to share refnum for js primitives
                jsValueToJsRefNumCache.set(jsValue, cookie);
            }
        };

        var hasCachedRefNum = function (cookie) {
            var refNumExists = (jsRefNumToJsValueMap.get(cookie) !== undefined);
            if (!refNumExists && cookie !== 0) {
                throw new Error('RefNum cookie should be 0 if refnum has not been set yet.');
            }
            return refNumExists;
        };

        var getCachedRefNum = function (jsValue) {
            return jsValueToJsRefNumCache.get(jsValue);
        };

        var getCachedJsValue = function (cookie) {
            return jsRefNumToJsValueMap.get(cookie);
        };

        var generateUniqueRefNumCookie = function () {
            jsRefNumCookieCounter += 1;
            return jsRefNumCookieCounter;
        };

        var dataReadJavaScriptRefNum = function (javaScriptRefNumPointer) {
            var cookie = Data_ReadJavaScriptRefNum(javaScriptRefNumPointer);
            return jsRefNumToJsValueMap.get(cookie);
        };

        var dataWriteJavaScriptRefNum = function (javaScriptRefNumPointer, jsValue) {
            var cookie = Data_ReadJavaScriptRefNum(javaScriptRefNumPointer);
            if (hasCachedRefNum(cookie)) { // refnum was already set to something
                if (getCachedJsValue(cookie) !== jsValue) {
                    throw new Error('JavaScriptRefNum[' + cookie + '] already set to ' + getCachedJsValue(cookie) + ' and can not be set to new value' + jsValue);
                }
                return; // nothing to do, tried to set the same object to the same reference
            }

            var cachedCookie = getCachedRefNum(jsValue);
            if (cachedCookie !== undefined) { // this object already has a refnum, we must share the refnum value for the same object
                Data_WriteJavaScriptRefNum(javaScriptRefNumPointer, cachedCookie); // set the VIA local to be this refnum value
                return;
            }

            var newCookie = generateUniqueRefNumCookie();
            Data_WriteJavaScriptRefNum(javaScriptRefNumPointer, newCookie);
            cacheRefNum(newCookie, jsValue);
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
                isValidReturnType: function (value) {
                    return typeof value === 'string';
                }
            },
            Boolean: {
                reader: Module.eggShell.dataReadBoolean,
                writer: Module.eggShell.dataWriteBoolean,
                isValidReturnType: function (value) {
                    return typeof value === 'boolean';
                }
            },
            ArrayInt8: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Int8Array;
                }
            },
            ArrayInt16: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Int16Array;
                }
            },
            ArrayInt32: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Int32Array;
                }
            },
            ArrayUInt8: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Uint8Array;
                }
            },
            ArrayUInt16: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Uint16Array;
                }
            },
            ArrayUInt32: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Uint32Array;
                }
            },
            ArraySingle: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Float32Array;
                }
            },
            ArrayDouble: {
                reader: Module.eggShell.dataReadTypedArray,
                writer: Module.eggShell.dataWriteTypedArray,
                isValidReturnType: function (value) {
                    return value instanceof Float64Array;
                }
            },
            JavaScriptRefNum: {
                reader: dataReadJavaScriptRefNum,
                writer: dataWriteJavaScriptRefNum,
                isValidReturnType: function () {
                    return true;
                }
            }
        };

        var createJavaScriptParametersArray = function (parametersPointer, parametersCount) {
            var parameters = new Array(parametersCount);
            for (var index = 0; index < parametersCount; index += 1) {
                var typeName = getParameterTypeString(parametersPointer, index);
                var parameterPointer = JavaScriptInvoke_GetParameterPointer(parametersPointer, index);
                if (typeName === 'Array') {
                    typeName += getArrayElementTypeString(parameterPointer);
                }

                var parameterValue = undefined;
                var readFunction = typeFunctions[typeName].reader;
                if (readFunction === undefined) {
                    throw new Error(' Unsupported type = ' + typeName + ' for parameter with index = ' + index);
                } else {
                    parameterValue = readFunction(parameterPointer);
                }

                parameters[index] = parameterValue;
            }

            return parameters;
        };

        var findJavaScriptFunctionToCall = function (functionName, isInternalFunction) {
            if (isInternalFunction) {
                return {
                    functionToCall: internalFunctionsMap.get(functionName),
                    context: undefined
                };
            }
            var names = functionName.split('.');
            var jsSelfScope = typeof self !== 'undefined' ? self : {};
            var jsGlobalScope = typeof global !== 'undefined' ? global : jsSelfScope;
            var context = typeof window !== 'undefined' ? window : jsGlobalScope;
            var functionToCall = context[names[0]];
            var namesIndex;
            for (namesIndex = 1; namesIndex < names.length; namesIndex += 1) {
                if (functionToCall === undefined) {
                    break;
                }

                context = functionToCall;
                functionToCall = context[names[namesIndex]];
            }
            if (typeof functionToCall !== 'function') {
                functionToCall = undefined;
                context = undefined;
            }
            return {
                functionToCall: functionToCall,
                context: context
            };
        };

        var completionCallbackRetrievalEnum = {
            AVAILABLE: 'AVAILABLE',
            RETRIEVED: 'RETRIEVED',
            UNRETRIEVABLE: 'UNRETRIEVABLE'
        };
        var completionCallbackInvocationEnum = {
            PENDING: 'PENDING',
            FULFILLED: 'FULFILLED',
            REJECTED: 'REJECTED'
        };

        var updateReturnValue = function (
            functionName,
            returnTypeName,
            returnValuePointer,
            returnUserValue,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            if (returnTypeName === 'StaticTypeAndData') {
                // User doesn't want return value. If we're passing '*' for the return in VIA code, we get StaticTypeAndData
                return;
            }

            var typeConfig = typeFunctions[returnTypeName];

            var source;
            var code;
            if (typeConfig === undefined) {
                source = ERRORS.kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke.MESSAGE + '\nfunction: ' + functionName;
                source = Module.coreHelpers.createSourceFromMessage(source);
                code = ERRORS.kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke.CODE;
                Module.coreHelpers.mergeErrors(true, code, source, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            } else if (!typeConfig.isValidReturnType(returnUserValue)) {
                source = ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke.MESSAGE + '\nfunction: ' + functionName;
                source = Module.coreHelpers.createSourceFromMessage(source);
                code = ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke.CODE;
                Module.coreHelpers.mergeErrors(true, code, source, errorStatusPointer, errorCodePointer, errorSourcePointer);
                return;
            }

            typeConfig.writer(returnValuePointer, returnUserValue);
        };

        var tryUpdateReturnValue = function (
            functionName,
            returnTypeName,
            returnValuePointer,
            returnValue,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer,
            completionCallbackStatus) {
            try {
                updateReturnValue(functionName, returnTypeName, returnValuePointer, returnValue, errorStatusPointer, errorCodePointer, errorSourcePointer);
                completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
                completionCallbackStatus.invocationState = completionCallbackInvocationEnum.FULFILLED;
            } catch (ex) {
                var newErrorStatus = true;
                var newErrorCode = ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke.CODE;
                var errorMessage = Module.coreHelpers.formatMessageWithException(ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke.MESSAGE + '\nfunction: ' + functionName, ex);
                var newErrorSource = Module.coreHelpers.createSourceFromMessage(errorMessage);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
                completionCallbackStatus.invocationState = completionCallbackInvocationEnum.REJECTED;
            }
        };

        var generateCompletionCallback = function (occurrencePointer, functionName, returnTypeName, returnValuePointer, errorStatusPointer, errorCodePointer, errorSourcePointer, completionCallbackStatus, isInternalFunction) {
            var completionCallback = function (returnValue) {
                if (completionCallbackStatus.invocationState === completionCallbackInvocationEnum.FULFILLED) {
                    throw new Error('The completion callback was invoked more than once for ' + functionName + '.');
                }
                if (completionCallbackStatus.invocationState === completionCallbackInvocationEnum.REJECTED) {
                    throw new Error('The call to ' + functionName + ' threw an error, so this callback cannot be invoked.');
                }
                if (!(returnValue instanceof Error)) {
                    tryUpdateReturnValue(functionName, returnTypeName, returnValuePointer, returnValue, errorStatusPointer, errorCodePointer, errorSourcePointer, completionCallbackStatus);
                } else {
                    if (isInternalFunction) {
                        throw returnValue;
                    }
                    var newErrorStatus = true;
                    var newErrorCode = ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke.CODE;
                    var errorMessage = Module.coreHelpers.formatMessageWithException(ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke.MESSAGE + '\nfunction: ' + functionName, returnValue);
                    var newErrorSource = Module.coreHelpers.createSourceFromMessage(errorMessage);
                    Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                }
                Module.eggShell.setOccurrenceAsync(occurrencePointer);
            };
            return completionCallback;
        };

        var generateAPI = function (occurrencePointer, functionName, returnTypeName, returnValuePointer, errorStatusPointer, errorCodePointer, errorSourcePointer, completionCallbackStatus, isInternalFunction) {
            var api = {};
            api.getCompletionCallback = function () {
                if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.RETRIEVED) {
                    throw new Error('The completion callback was retrieved more than once for ' + functionName + '.');
                }
                if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.UNRETRIEVABLE) {
                    throw new Error('The API being accessed for ' + functionName + ' is not valid anymore.');
                }
                completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.RETRIEVED;
                return generateCompletionCallback(occurrencePointer, functionName, returnTypeName, returnValuePointer, errorStatusPointer, errorCodePointer, errorSourcePointer, completionCallbackStatus, isInternalFunction);
            };

            if (isInternalFunction) {
                api.setLabVIEWError = function (status, code, source) {
                    Module.coreHelpers.mergeErrors(status, code, source, errorStatusPointer, errorCodePointer, errorSourcePointer);
                };
            }
            return api;
        };

        publicAPI.javaScriptInvoke.registerInternalFunctions = function (functionsToAdd) {
            Object.keys(functionsToAdd).forEach(function (name) {
                if (internalFunctionsMap.has(name)) {
                    throw new Error('Internal function already registered for name:' + name);
                }
                if (typeof functionsToAdd[name] !== 'function') {
                    throw new Error('Cannot add non-function ' + name + ' as a function.');
                }
                internalFunctionsMap.set(name, functionsToAdd[name]);
            });
        };

        Module.javaScriptInvoke.jsJavaScriptInvoke = function (
            occurrencePointer,
            functionNamePointer,
            returnPointer,
            parametersPointer,
            parametersCount,
            isInternalFunction,
            errorStatusPointer,
            errorCodePointer,
            errorSourcePointer) {
            var newErrorStatus = false;
            var newErrorCode = ERRORS.NO_ERROR.CODE;
            var newErrorSource = ERRORS.NO_ERROR.MESSAGE;

            var functionName = Module.eggShell.dataReadString(functionNamePointer);
            var parameters = undefined;
            var errorMessage;
            try {
                parameters = createJavaScriptParametersArray(parametersPointer, parametersCount);
            } catch (ex) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnsupportedParameterTypeInJavaScriptInvoke.CODE;
                errorMessage = Module.coreHelpers.formatMessageWithException(ERRORS.kNIUnsupportedParameterTypeInJavaScriptInvoke.MESSAGE + '\nfunction: ' + functionName, ex);
                newErrorSource = Module.coreHelpers.createSourceFromMessage(errorMessage);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            var functionAndContext = findJavaScriptFunctionToCall(functionName, isInternalFunction);
            var functionToCall = functionAndContext.functionToCall;
            var context = functionAndContext.context;
            if (functionToCall === undefined) {
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke.CODE;
                newErrorSource = ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke.MESSAGE + '\nfunction: ' + functionName;
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            var returnTypeName = getParameterTypeString(returnPointer, 0);
            var returnValuePointer = undefined;
            if (returnTypeName !== 'StaticTypeAndData') {
                // User doesn't want return value. We're passing '*' for the return in VIA code, we get StaticTypeAndData
                returnValuePointer = JavaScriptInvoke_GetParameterPointer(returnPointer, 0);
            }
            if (returnTypeName === 'Array') {
                returnTypeName += getArrayElementTypeString(returnValuePointer);
            }

            var completionCallbackStatus = {
                retrievalState: completionCallbackRetrievalEnum.AVAILABLE,
                invocationState: completionCallbackInvocationEnum.PENDING
            };

            var returnValue = undefined;
            var api;
            if (functionToCall.length === parameters.length + 1) {
                api = generateAPI(occurrencePointer, functionName, returnTypeName, returnValuePointer, errorStatusPointer, errorCodePointer, errorSourcePointer, completionCallbackStatus, isInternalFunction);
                parameters.push(api);
            }

            try {
                returnValue = functionToCall.apply(context, parameters);
            } catch (ex) {
                if (isInternalFunction) {
                    throw ex;
                }
                newErrorStatus = true;
                newErrorCode = ERRORS.kNIUnableToInvokeAJavaScriptFunction.CODE;
                errorMessage = Module.coreHelpers.formatMessageWithException(ERRORS.kNIUnableToInvokeAJavaScriptFunction.MESSAGE + '\nfunction: ' + functionName, ex);
                newErrorSource = Module.coreHelpers.createSourceFromMessage(errorMessage);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
                completionCallbackStatus.invocationState = completionCallbackInvocationEnum.REJECTED;
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            // assume synchronous invocation since the completion callback was never retrieved
            if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.AVAILABLE) {
                tryUpdateReturnValue(functionName, returnTypeName, returnValuePointer, returnValue, errorStatusPointer, errorCodePointer, errorSourcePointer, completionCallbackStatus);
                Module.eggShell.setOccurrence(occurrencePointer);
            }
            return;
        };

        Module.javaScriptInvoke.jsIsNotAJavaScriptRefnum = function (returnPointer, javaScriptRefNumPointer) {
            var cookie = Data_ReadJavaScriptRefNum(javaScriptRefNumPointer);
            var isNotAJavaScriptRefnum = !hasCachedRefNum(cookie);
            Module.eggShell.dataWriteBoolean(returnPointer, isNotAJavaScriptRefnum);
        };
    };

    return assignJavaScriptInvoke;
}));
