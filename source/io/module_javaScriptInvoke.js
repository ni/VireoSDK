var assignJavaScriptInvoke;
(function () {
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
    assignJavaScriptInvoke = function (Module, publicAPI) {
        // Disable new-cap for the cwrap functions so the names can be the same in C and JS
        /* eslint 'new-cap': ['error', {'capIsNewExceptions': [
            'JavaScriptInvoke_GetParameterTypeRef',
            'JavaScriptInvoke_GetParameterDataRef',
            'Data_ReadJavaScriptRefNum',
            'Data_WriteJavaScriptRefNum'
        ]}], */

        Module.javaScriptInvoke = {};
        publicAPI.javaScriptInvoke = {};

        // Private Instance Variables (per vireo instance)
        var internalFunctionsMap = new Map();
        var JavaScriptInvoke_GetParameterTypeRef = function (pointerArray, index) {
            return Module._JavaScriptInvoke_GetParameterTypeRef(pointerArray, index);
        };
        var JavaScriptInvoke_GetParameterDataRef = function (pointerArray, index) {
            return Module._JavaScriptInvoke_GetParameterDataRef(pointerArray, index);
        };
        var Data_ReadJavaScriptRefNum = function (jsRefnumDataRef) {
            return Module._Data_ReadJavaScriptRefNum(jsRefnumDataRef);
        };
        var Data_WriteJavaScriptRefNum = function (jsRefnumDataRef, cookie) {
            return Module._Data_WriteJavaScriptRefNum(jsRefnumDataRef, cookie);
        };

        var mergeNewError = function (errorValueRef, functionName, errorToSet, exception) {
            var newError = {
                status: true,
                code: undefined,
                source: undefined
            };
            newError.source = Module.coreHelpers.formatMessageWithException(errorToSet.MESSAGE + '\nfunction: ' + functionName, exception);
            newError.source = Module.coreHelpers.createSourceFromMessage(newError.source);
            newError.code = errorToSet.CODE;
            Module.coreHelpers.mergeErrors(errorValueRef, newError);
        };

        var createValueRefFromPointerArray = function (pointerArray, index) {
            var typeRef = JavaScriptInvoke_GetParameterTypeRef(pointerArray, index);
            var dataRef = JavaScriptInvoke_GetParameterDataRef(pointerArray, index);
            var returnValueRef = Module.eggShell.createValueRef(typeRef, dataRef);
            return returnValueRef;
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

        Module.javaScriptInvoke.readJavaScriptRefNum = function (javaScriptValueRef) {
            var cookie = Data_ReadJavaScriptRefNum(javaScriptValueRef.dataRef);
            return jsRefNumToJsValueMap.get(cookie);
        };

        Module.javaScriptInvoke.writeJavaScriptRefNum = function (javaScriptValueRef, jsValue) {
            var cookie = Data_ReadJavaScriptRefNum(javaScriptValueRef.dataRef);
            if (hasCachedRefNum(cookie)) { // refnum was already set to something
                if (getCachedJsValue(cookie) !== jsValue) {
                    throw new Error('JavaScriptRefNum[' + cookie + '] already set to ' + getCachedJsValue(cookie) + ' and can not be set to new value' + jsValue);
                }
                return; // nothing to do, tried to set the same object to the same reference
            }

            var cachedCookie = getCachedRefNum(jsValue);
            if (cachedCookie !== undefined) { // this object already has a refnum, we must share the refnum value for the same object
                Data_WriteJavaScriptRefNum(javaScriptValueRef.dataRef, cachedCookie); // set the VIA local to be this refnum value
                return;
            }

            var newCookie = generateUniqueRefNumCookie();
            Data_WriteJavaScriptRefNum(javaScriptValueRef.dataRef, newCookie);
            cacheRefNum(newCookie, jsValue);
        };

        var createJavaScriptInvokePeeker = function () {
            var visitNumeric = function (valueRef) {
                return Module.eggShell.readDouble(valueRef);
            };

            return {
                visitInt8: visitNumeric,
                visitInt16: visitNumeric,
                visitInt32: visitNumeric,
                visitUInt8: visitNumeric,
                visitUInt16: visitNumeric,
                visitUInt32: visitNumeric,
                visitSingle: visitNumeric,
                visitDouble: visitNumeric,
                visitBoolean: function (valueRef) {
                    return Module.eggShell.readDouble(valueRef) !== 0;
                },

                visitString: function (valueRef) {
                    return Module.eggShell.readString(valueRef);
                },

                visitArray: function (valueRef) {
                    return Module.eggShell.readTypedArray(valueRef);
                },

                visitJSObjectRefnum: function (valueRef) {
                    return Module.eggShell.readJavaScriptRefNum(valueRef);
                }
            };
        };

        var jsInvokePeeker = createJavaScriptInvokePeeker();
        var peekValueRef = function (valueRef) {
            return Module.eggShell.reflectOnValueRef(jsInvokePeeker, valueRef);
        };

        var createJavaScriptInvokePoker = function () {
            var callVisitFuncAndSetError = function (fn) {
                return function (valueRef, data) {
                    try {
                        fn(valueRef, data);
                    } catch (ex) {
                        mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke, ex);
                    }
                };
            };
            var visitNumeric = function (valueRef, data) {
                if (typeof data.userValue !== 'number') {
                    mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
                    return;
                }
                Module.eggShell.writeDouble(valueRef, data.userValue);
            };

            return {
                visitInt8: callVisitFuncAndSetError(visitNumeric),
                visitInt16: callVisitFuncAndSetError(visitNumeric),
                visitInt32: callVisitFuncAndSetError(visitNumeric),
                visitUInt8: callVisitFuncAndSetError(visitNumeric),
                visitUInt16: callVisitFuncAndSetError(visitNumeric),
                visitUInt32: callVisitFuncAndSetError(visitNumeric),
                visitSingle: callVisitFuncAndSetError(visitNumeric),
                visitDouble: callVisitFuncAndSetError(visitNumeric),
                visitBoolean: callVisitFuncAndSetError(function (valueRef, data) {
                    if (typeof data.userValue !== 'boolean') {
                        mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
                        return;
                    }
                    Module.eggShell.writeDouble(valueRef, data.userValue ? 1 : 0);
                }),

                visitString: callVisitFuncAndSetError(function (valueRef, data) {
                    if (typeof data.userValue !== 'string') {
                        mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
                        return;
                    }
                    Module.eggShell.writeString(valueRef, data.userValue);
                }),

                visitArray: callVisitFuncAndSetError(function (valueRef, data) {
                    if (!Module.eggShell.isSupportedAndCompatibleArrayType(valueRef, data.userValue)) {
                        mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
                        return;
                    }
                    Module.eggShell.resizeArray(valueRef, [data.userValue.length]);
                    Module.eggShell.writeTypedArray(valueRef, data.userValue);
                }),

                visitJSObjectRefnum: callVisitFuncAndSetError(function (valueRef, data) {
                    Module.eggShell.writeJavaScriptRefNum(valueRef, data.userValue);
                })
            };
        };

        var jsInvokePoker = createJavaScriptInvokePoker();

        var pokeValueRef = function (valueRef, data) {
            Module.eggShell.reflectOnValueRef(jsInvokePoker, valueRef, data);
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

        var addToJavaScriptParametersArray = function (parameters, isInternalFunction, parametersPointer, parametersCount) {
            var parametersArraySize = parameters.length;
            for (var index = 0; index < parametersCount; index += 1) {
                var parameterValueRef = createValueRefFromPointerArray(parametersPointer, index);
                if (isInternalFunction) {
                    parameters[parametersArraySize + index] = parameterValueRef;
                } else {
                    parameters[parametersArraySize + index] = peekValueRef(parameterValueRef);
                }
            }
            return parameters;
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

        var updateReturnValue = function (functionName, returnValueRef, returnUserValue, errorValueRef) {
            if (returnValueRef === undefined) {
                // User doesn't want to return value. We get here, if we're passing '*' for return parameter in VIA code
                return;
            }
            var valueAndError = {
                userValue: returnUserValue,
                errorValueRef: errorValueRef,
                functionName: functionName
            };
            pokeValueRef(returnValueRef, valueAndError);
        };

        var tryUpdateReturnValue = function (functionName, returnValueRef, returnValue, errorValueRef, completionCallbackStatus) {
            updateReturnValue(functionName, returnValueRef, returnValue, errorValueRef);
            completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
            completionCallbackStatus.invocationState = completionCallbackInvocationEnum.FULFILLED;
        };

        var generateCompletionCallback = function (occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction) {
            var completionCallback = function (returnValue) {
                if (completionCallbackStatus.invocationState === completionCallbackInvocationEnum.FULFILLED) {
                    throw new Error('The completion callback was invoked more than once for ' + functionName + '.');
                }
                if (completionCallbackStatus.invocationState === completionCallbackInvocationEnum.REJECTED) {
                    throw new Error('The call to ' + functionName + ' threw an error, so this callback cannot be invoked.');
                }
                if (!(returnValue instanceof Error)) {
                    tryUpdateReturnValue(functionName, returnValueRef, returnValue, errorValueRef, completionCallbackStatus);
                } else {
                    if (isInternalFunction) {
                        throw returnValue;
                    }
                    mergeNewError(errorValueRef, functionName, ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke, returnValue);
                }
                Module.eggShell.setOccurrenceAsync(occurrencePointer);
            };
            return completionCallback;
        };

        var generateAPI = function (occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction) {
            var api = {};
            api.getCompletionCallback = function () {
                if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.RETRIEVED) {
                    throw new Error('The completion callback was retrieved more than once for ' + functionName + '.');
                }
                if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.UNRETRIEVABLE) {
                    throw new Error('The API being accessed for ' + functionName + ' is not valid anymore.');
                }
                completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.RETRIEVED;
                return generateCompletionCallback(occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction);
            };

            if (isInternalFunction) {
                api.setLabVIEWError = function (status, code, source) {
                    var newError = {
                        status: status,
                        code: code,
                        source: source
                    };
                    Module.coreHelpers.mergeErrors(errorValueRef, newError);
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
            functionNameTypeRef,
            functionNameDataRef,
            returnPointer,
            parametersPointer,
            parametersCount,
            isInternalFunction,
            errorTypeRef,
            errorDataRef) {
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var functionNameValueRef = Module.eggShell.createValueRef(functionNameTypeRef, functionNameDataRef);
            var functionName = Module.eggShell.readString(functionNameValueRef);
            var parameters = [];

            var returnValueRef = createValueRefFromPointerArray(returnPointer, 0);
            if (isInternalFunction) {
                parameters.push(returnValueRef);
            }

            try {
                addToJavaScriptParametersArray(parameters, isInternalFunction, parametersPointer, parametersCount);
            } catch (ex) {
                mergeNewError(errorValueRef, functionName, ERRORS.kNIUnsupportedParameterTypeInJavaScriptInvoke, ex);
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            var functionAndContext = findJavaScriptFunctionToCall(functionName, isInternalFunction);
            var functionToCall = functionAndContext.functionToCall;
            var context = functionAndContext.context;
            if (functionToCall === undefined) {
                mergeNewError(errorValueRef, functionName, ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke);
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            var completionCallbackStatus = {
                retrievalState: completionCallbackRetrievalEnum.AVAILABLE,
                invocationState: completionCallbackInvocationEnum.PENDING
            };

            var returnValue = undefined;
            var api;
            if (functionToCall.length === parameters.length + 1) {
                api = generateAPI(occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction);
                parameters.push(api);
            }

            try {
                returnValue = functionToCall.apply(context, parameters);
            } catch (ex) {
                if (isInternalFunction) {
                    throw ex;
                }

                mergeNewError(errorValueRef, functionName, ERRORS.kNIUnableToInvokeAJavaScriptFunction, ex);
                completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
                completionCallbackStatus.invocationState = completionCallbackInvocationEnum.REJECTED;
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            // assume synchronous invocation since the completion callback was never retrieved
            if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.AVAILABLE) {
                if (!isInternalFunction) {
                    tryUpdateReturnValue(functionName, returnValueRef, returnValue, errorValueRef, completionCallbackStatus);
                }
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
}());
export default assignJavaScriptInvoke;
