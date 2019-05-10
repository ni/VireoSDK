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

        kNIUnsupportedParameterTypeInJavaScriptInvoke: undefined, // Code 44301 no longer used. Unsupported LabVIEW parameter types now result in runtime exception.

        kNIUnableToFindFunctionForJavaScriptInvoke: {
            CODE: 44302,
            MESSAGE: 'Function not found. Verify the function name in the external JavaScript file matches the function name in the JavaScript Library Interface.'
        },

        kNIUnableToSetReturnValueInJavaScriptInvoke: {
            CODE: 44303,
            MESSAGE: 'Unable to set return value for JavaScript Library Interface node parameter.'
        },

        kNIUnsupportedLabVIEWReturnTypeInJavaScriptInvoke: undefined, // Code 44305 no longer used. Unsupported LabVIEW return types now result in runtime exception.

        kNITypeMismatchForReturnTypeInJavaScriptInvoke: {
            CODE: 44306,
            MESSAGE: 'Return type mismatch. Verify the return type in the JavaScript Library Interface matches the return type in the external JavaScript function.'
        },

        kNIUnableToHandlePromise: {
            CODE: 44307,
            MESSAGE: 'Unable to use Promise. Verify that the getCompletionCallback API function is not used in the external JavaScript function with a Promise return value.'
        },

        kNIUnableToAcceptReturnValueDuringAsync: {
            CODE: 44308,
            MESSAGE: 'Unable to set return value after call to getCompletionCallback API function. Verify return value is provided to the completion callback and not returned.'
        }
    };

    // Vireo Core Mixin Function
    assignJavaScriptInvoke = function (Module, publicAPI) {
        Module.javaScriptInvoke = {};
        publicAPI.javaScriptInvoke = {};

        // Private Instance Variables (per vireo instance)
        var internalFunctionsMap = new Map();

        var mergeNewError = function (errorValueRef, functionName, errorToSet, exception) {
            var newError = {
                status: true,
                code: undefined,
                source: undefined
            };
            var messageWithException = Module.coreHelpers.formatMessageWithException(errorToSet.MESSAGE + '\nfunction: ' + functionName, exception);
            newError.source = Module.coreHelpers.createSourceFromMessage(messageWithException);
            newError.code = errorToSet.CODE;
            Module.coreHelpers.mergeErrors(errorValueRef, newError);
        };

        var createValueRefFromPointerArray = function (pointerArray, index) {
            var typeRef = Module._JavaScriptInvoke_GetParameterTypeRef(pointerArray, index);
            var dataRef = Module._JavaScriptInvoke_GetParameterDataRef(pointerArray, index);
            var returnValueRef = Module.eggShell.createValueRef(typeRef, dataRef);
            return returnValueRef;
        };

        var cookieToJsValueMap = new Map();
        var jsValueToCookieCache = new Map();
        var jsRefNumCookieCounter = 0;

        var cacheRefNum = function (cookie, jsValue) {
            cookieToJsValueMap.set(cookie, jsValue);
            jsValueToCookieCache.set(jsValue, cookie);
        };

        var hasCachedRefNum = function (cookie) {
            var refNumExists = cookieToJsValueMap.has(cookie);
            if (!refNumExists && cookie !== 0) {
                throw new Error('RefNum cookie should be 0 if refnum has not been set yet.');
            }
            return refNumExists;
        };

        var getCachedRefNumCookie = function (jsValue) {
            return jsValueToCookieCache.get(jsValue);
        };

        var generateUniqueRefNumCookie = function () {
            jsRefNumCookieCounter += 1;
            return jsRefNumCookieCounter;
        };

        Module.javaScriptInvoke.readJavaScriptRefNum = function (javaScriptValueRef) {
            var cookie = Module.eggShell.readDouble(javaScriptValueRef);
            return cookieToJsValueMap.get(cookie);
        };

        /**
         * Write JS value to a JS reference local
         * @param javaScriptValueRef VIA local for this JS reference
         * @param jsValue the JS value to associate with an existing or new cookie
         * Static reference (Static control reference) shares cookie for the same jsValue.
         * Dynamic reference (JS opaque reference from JSLI) always creates a new cookie even for the same jsValue.
         */
        Module.javaScriptInvoke.writeJavaScriptRefNum = function (javaScriptValueRef, jsValue) {
            var isStaticReference = Module.typeHelpers.isJSObjectStaticRefnum(javaScriptValueRef.typeRef);
            if (isStaticReference) { // static reference (ie, control reference) shares cookie for the same jsValue
                var cachedCookie = getCachedRefNumCookie(jsValue);
                if (cachedCookie !== undefined) {
                    Module.eggShell.writeDouble(javaScriptValueRef, cachedCookie); // set the VIA local to be this cookie value
                    return;
                }
            }

            var newCookie = generateUniqueRefNumCookie();
            Module.eggShell.writeDouble(javaScriptValueRef, newCookie);
            cacheRefNum(newCookie, jsValue);
        };

        var createJavaScriptInvokeParameterValueVisitor = function () {
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

        var parameterValueVisitor = createJavaScriptInvokeParameterValueVisitor();

        var createJavaScriptInvokeReturnValueVisitor = function () {
            var reportReturnSetException = function (fn) {
                return function (valueRef, data) {
                    try {
                        fn(valueRef, data);
                    } catch (ex) {
                        // Internal check not needed because poker is not used for internal calls
                        mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke, ex);
                    }
                };
            };

            var reportTypeMismatch = function (data) {
                // Internal check not needed because poker is not used for internal calls
                mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
            };

            var visitNumeric = reportReturnSetException(function (valueRef, data) {
                if (typeof data.returnValue !== 'number') {
                    reportTypeMismatch(data);
                    return;
                }
                Module.eggShell.writeDouble(valueRef, data.returnValue);
            });

            return {
                visitInt8: visitNumeric,
                visitInt16: visitNumeric,
                visitInt32: visitNumeric,
                visitUInt8: visitNumeric,
                visitUInt16: visitNumeric,
                visitUInt32: visitNumeric,
                visitSingle: visitNumeric,
                visitDouble: visitNumeric,
                visitBoolean: reportReturnSetException(function (valueRef, data) {
                    if (typeof data.returnValue !== 'boolean') {
                        reportTypeMismatch(data);
                        return;
                    }
                    Module.eggShell.writeDouble(valueRef, data.returnValue ? 1 : 0);
                }),

                visitString: reportReturnSetException(function (valueRef, data) {
                    if (typeof data.returnValue !== 'string') {
                        reportTypeMismatch(data);
                        return;
                    }
                    Module.eggShell.writeString(valueRef, data.returnValue);
                }),

                visitArray: reportReturnSetException(function (valueRef, data) {
                    if (!Module.eggShell.isSupportedAndCompatibleArrayType(valueRef, data.returnValue)) {
                        reportTypeMismatch(data);
                        return;
                    }
                    Module.eggShell.resizeArray(valueRef, [data.returnValue.length]);
                    Module.eggShell.writeTypedArray(valueRef, data.returnValue);
                }),

                visitJSObjectRefnum: reportReturnSetException(function (valueRef, data) {
                    Module.eggShell.writeJavaScriptRefNum(valueRef, data.returnValue);
                })
            };
        };

        var returnValueVisitor = createJavaScriptInvokeReturnValueVisitor();

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
                    // Inputs are always wired for user calls so if this errors because parameterValueRef is undefined then we have DFIR issues
                    parameters[parametersArraySize + index] = Module.eggShell.reflectOnValueRef(parameterValueVisitor, parameterValueRef);
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

        var coerceToError = function (returnValue) {
            if (returnValue instanceof Error === false) {
                return new Error(returnValue);
            }
            return returnValue;
        };

        var hasExecutionError = function (returnValue) {
            return returnValue instanceof Error;
        };

        var reportExecutionError = function (functionName, returnValue, errorValueRef, completionCallbackStatus, isInternalFunction) {
            if (!hasExecutionError(returnValue)) {
                return;
            }
            if (isInternalFunction) {
                // TODO mraj because this can happen asynchronously we may end up not actually
                // stopping the runtime on throw. It would be helpful to have JS api function
                // to abort the runtime at this point. https://github.com/ni/VireoSDK/issues/521
                throw returnValue;
            }

            mergeNewError(errorValueRef, functionName, ERRORS.kNIUnableToInvokeAJavaScriptFunction, returnValue);
            completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
            completionCallbackStatus.invocationState = completionCallbackInvocationEnum.REJECTED;
        };

        var updateReturnValue = function (functionName, returnValueRef, returnValue, errorValueRef, completionCallbackStatus, isInternalFunction) {
            if (isInternalFunction) {
                if (returnValue !== undefined) {
                    throw new Error('Unexpected return value, internal functions should update return values through api functions instead of relying on return values');
                }
                return;
            }

            // The returnValueRef is undefined if we're passing '*' for return parameter in VIA code
            var data;
            if (returnValueRef !== undefined) {
                data = {
                    returnValue: returnValue,
                    errorValueRef: errorValueRef,
                    functionName: functionName
                };
                Module.eggShell.reflectOnValueRef(returnValueVisitor, returnValueRef, data);
            }

            // We don't reflect write errors back on the completionCallbackStatus,
            // so regardless of write errors at this point the completionCallback is fullfilled
            completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
            completionCallbackStatus.invocationState = completionCallbackInvocationEnum.FULFILLED;
        };

        var generateCompletionCallback = function (occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction) {
            var completionCallback = function (returnValue) {
                // The following checks are not LabVIEW errors because they may happen after JavaScriptInvoke completion finishes if user holds reference
                if (completionCallbackStatus.invocationState === completionCallbackInvocationEnum.FULFILLED) {
                    throw new Error(`The completion callback was invoked more than once for ${functionName}.`);
                }
                if (completionCallbackStatus.invocationState === completionCallbackInvocationEnum.REJECTED) {
                    throw new Error(`The call to ${functionName} threw an error, so this callback cannot be invoked.`);
                }

                if (hasExecutionError(returnValue)) {
                    reportExecutionError(functionName, returnValue, errorValueRef, completionCallbackStatus, isInternalFunction);
                    Module.eggShell.setOccurrenceAsync(occurrencePointer);
                    return;
                }

                updateReturnValue(functionName, returnValueRef, returnValue, errorValueRef, completionCallbackStatus, isInternalFunction);
                Module.eggShell.setOccurrenceAsync(occurrencePointer);
                return;
            };
            return completionCallback;
        };

        var generateAPI = function (occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction) {
            var api = {};
            api.getCompletionCallback = function () {
                // The following checks are not LabVIEW errors because they may happen after JavaScriptInvoke completion finishes if user holds reference
                if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.RETRIEVED) {
                    throw new Error(`The completion callback was retrieved more than once for ${functionName}.`);
                }
                if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.UNRETRIEVABLE) {
                    throw new Error(`The API being accessed for ${functionName} is not valid anymore.`);
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
                    throw new Error(`Internal function already registered for name:${name}`);
                }
                if (typeof functionsToAdd[name] !== 'function') {
                    throw new Error(`Cannot add non-function ${name} as a function.`);
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
            isInternalFunctionIn,
            errorTypeRef,
            errorDataRef) {
            var isInternalFunction = isInternalFunctionIn !== 0;
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var functionNameValueRef = Module.eggShell.createValueRef(functionNameTypeRef, functionNameDataRef);
            var functionName = Module.eggShell.readString(functionNameValueRef);
            var parameters = [];

            var returnValueRef = createValueRefFromPointerArray(returnPointer, 0);
            if (isInternalFunction) {
                parameters.push(returnValueRef);
            }

            addToJavaScriptParametersArray(parameters, isInternalFunction, parametersPointer, parametersCount);

            var functionAndContext = findJavaScriptFunctionToCall(functionName, isInternalFunction);
            var functionToCall = functionAndContext.functionToCall;
            var context = functionAndContext.context;
            if (functionToCall === undefined) {
                if (isInternalFunction) {
                    throw new Error(`Unable to find internal JS function: ${functionName}`);
                }
                mergeNewError(errorValueRef, functionName, ERRORS.kNIUnableToFindFunctionForJavaScriptInvoke);
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            var completionCallbackStatus = {
                retrievalState: completionCallbackRetrievalEnum.AVAILABLE,
                invocationState: completionCallbackInvocationEnum.PENDING
            };

            var jsapi;
            if (isInternalFunction || functionToCall.length === parameters.length + 1) {
                jsapi = generateAPI(occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction);
                parameters.push(jsapi);
            }

            var returnValue;
            try {
                returnValue = functionToCall.apply(context, parameters);
            } catch (ex) {
                returnValue = coerceToError(ex);
            }

            if (hasExecutionError(returnValue)) {
                reportExecutionError(functionName, returnValue, errorValueRef, completionCallbackStatus, isInternalFunction);
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            var completionCallback;
            if (returnValue instanceof Promise) {
                if (completionCallbackStatus.retrievalState !== completionCallbackRetrievalEnum.AVAILABLE) {
                    if (isInternalFunction) {
                        throw new Error('Promise returned but completionCallback unavailable. Possible reason is using getCompletionCallback when returning a promise');
                    }
                    mergeNewError(errorValueRef, functionName, ERRORS.kNIUnableToHandlePromise);
                    completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
                    completionCallbackStatus.invocationState = completionCallbackInvocationEnum.FULFILLED;
                    Module.eggShell.setOccurrence(occurrencePointer);
                    return;
                }

                if (jsapi === undefined) {
                    jsapi = generateAPI(occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction);
                }

                completionCallback = jsapi.getCompletionCallback();
                returnValue.then(completionCallback).catch((returnValue) => completionCallback(coerceToError(returnValue)));
                // Do not setOccurrence when returning here since waiting asynchronously for user Promise to resolve
                return;
            }

            // synchronous invocation since the completion callback was never retrieved by the user
            if (completionCallbackStatus.retrievalState === completionCallbackRetrievalEnum.AVAILABLE) {
                updateReturnValue(functionName, returnValueRef, returnValue, errorValueRef, completionCallbackStatus, isInternalFunction);
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            // for async execution check that user did not provide a return value
            if (returnValue !== undefined) {
                if (isInternalFunction) {
                    throw new Error('Unexpected return value for function requiring asynchronous completion');
                }
                mergeNewError(errorValueRef, functionName, ERRORS.kNIUnableToAcceptReturnValueDuringAsync);
                completionCallbackStatus.retrievalState = completionCallbackRetrievalEnum.UNRETRIEVABLE;
                completionCallbackStatus.invocationState = completionCallbackInvocationEnum.FULFILLED;
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            // at this point user retrieved getCompletionCallback so we wait for completion
        };

        Module.javaScriptInvoke.jsIsNotAJavaScriptRefnum = function (javaScriptRefnumTypeRef, javaScriptRefnumDataRef, returnTypeRef, returnDataRef) {
            var javaScriptRefNumValueRef = Module.eggShell.createValueRef(javaScriptRefnumTypeRef, javaScriptRefnumDataRef);
            var returnValueRef = Module.eggShell.createValueRef(returnTypeRef, returnDataRef);
            var cookie = Module.eggShell.readDouble(javaScriptRefNumValueRef);
            var isNotAJavaScriptRefnum = !hasCachedRefNum(cookie);
            Module.eggShell.writeDouble(returnValueRef, isNotAJavaScriptRefnum ? 1 : 0);
        };
    };
}());
export default assignJavaScriptInvoke;
