// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

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
        },

        kNIInvalidReference: {
            CODE: 1556,
            MESSAGE: 'The reference is invalid. This error might occur because the reference has been deleted.'
        }
    };

    // Vireo Core Mixin Function
    assignJavaScriptInvoke = function (Module, publicAPI) {
        Module.javaScriptInvoke = {};
        publicAPI.javaScriptInvoke = {};

        // Private Instance Variables (per vireo instance)
        // Every call to mergeNewError should be preceeded by the behavior for internalFunctions
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

        var generateUniqueRefNumCookie = (function () {
            var jsRefNumCookieCounter = 0;
            return function () {
                jsRefNumCookieCounter += 1;
                return jsRefNumCookieCounter;
            };
        }());

        class StaticRefnumManager {
            constructor () {
                this._cookieToJsValueMap = new Map();
                this._jsValueToCookieCache = new Map();
            }

            createCookie (jsValue) {
                // assume static references are never undefined or null
                if (jsValue === undefined || jsValue === null) {
                    throw new Error('Attempted to set a static JavaScript Refnum to undefined or null. This is not a valid operation.');
                }
                var existingCookie = this._jsValueToCookieCache.get(jsValue);
                if (existingCookie !== undefined) {
                    return existingCookie;
                }
                var cookie = generateUniqueRefNumCookie();
                this._cookieToJsValueMap.set(cookie, jsValue);
                this._jsValueToCookieCache.set(jsValue, cookie);
                return cookie;
            }

            lookupValue (cookie) {
                var jsValue = this._cookieToJsValueMap.get(cookie);
                if (jsValue === undefined) {
                    throw new Error('Attempted to get a Static JavaScript Refnum with a cookie that has not been set.');
                }
                return jsValue;
            }

            isCookieValid (cookie) {
                return this._cookieToJsValueMap.has(cookie);
            }

            get size () {
                return this._cookieToJsValueMap.size;
            }
        }

        class DynamicRefnumManager {
            constructor () {
                this._cookieToJsValueMap = new Map();
            }

            createCookie (jsValue) {
                // Any value allowed and always creates a new cookie
                var cookie = generateUniqueRefNumCookie();
                this._cookieToJsValueMap.set(cookie, jsValue);
                return cookie;
            }

            createCookies (values, cookies) {
                var i, cookie;
                for (i = 0; i < values.length; i += 1) {
                    cookie = generateUniqueRefNumCookie();
                    this._cookieToJsValueMap.set(cookie, values[i]);
                    cookies[i] = cookie;
                }
            }

            lookupValue (cookie) {
                // Have to check the map because undefined and null are possible values for dynamic references
                if (!this._cookieToJsValueMap.has(cookie)) {
                    throw new Error('Attempted to get a Dynamic JavaScript Refnum with a cookie that has not been set.');
                }
                var jsValue = this._cookieToJsValueMap.get(cookie);
                return jsValue;
            }

            lookupValues (cookies, values) {
                var i;
                for (i = 0; i < cookies.length; i += 1) {
                    if (this._cookieToJsValueMap.has(cookies[i])) {
                        values[i] = this._cookieToJsValueMap.get(cookies[i]);
                    } else {
                        return false;
                    }
                }
                return true;
            }

            isCookieValid (cookie) {
                return this._cookieToJsValueMap.has(cookie);
            }

            deleteCookie (cookie) {
                return this._cookieToJsValueMap.delete(cookie);
            }

            get size () {
                return this._cookieToJsValueMap.size;
            }
        }

        var staticRefnumManager = new StaticRefnumManager();
        var dynamicRefnumManager = new DynamicRefnumManager();

        Module.javaScriptInvoke.do_not_use_debug_only_static_refnum_manager = staticRefnumManager;
        Module.javaScriptInvoke.do_not_use_debug_only_dynamic_refnum_manager = dynamicRefnumManager;

        Module.javaScriptInvoke.readJavaScriptRefNum = function (javaScriptValueRef) {
            var cookie = Module.eggShell.readDouble(javaScriptValueRef);
            var isStaticReference = Module.typeHelpers.isJSObjectStaticRefnum(javaScriptValueRef.typeRef);
            if (isStaticReference) {
                return staticRefnumManager.lookupValue(cookie);
            }

            return dynamicRefnumManager.lookupValue(cookie);
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
            var cookie;
            if (isStaticReference) {
                cookie = staticRefnumManager.createCookie(jsValue);
                Module.eggShell.writeDouble(javaScriptValueRef, cookie);
                return;
            }

            cookie = dynamicRefnumManager.createCookie(jsValue);
            Module.eggShell.writeDouble(javaScriptValueRef, cookie);
        };

        Module.javaScriptInvoke.isJavaScriptRefNumValid = function (javaScriptValueRef) {
            var cookie = Module.eggShell.readDouble(javaScriptValueRef);
            var isStaticReference = Module.typeHelpers.isJSObjectStaticRefnum(javaScriptValueRef.typeRef);
            if (isStaticReference) {
                return staticRefnumManager.isCookieValid(cookie);
            }
            return dynamicRefnumManager.isCookieValid(cookie);
        };

        // static reference (static control reference) always returns true (the operation was successful, which for static references is a no-op)
        // dynamic reference (JS opaque reference from JSLI) returns true if the reference was found + cleared and false if the reference was invalid
        Module.javaScriptInvoke.clearJavaScriptRefNum = function (javaScriptValueRef) {
            var isStaticReference = Module.typeHelpers.isJSObjectStaticRefnum(javaScriptValueRef.typeRef);
            if (isStaticReference) {
                // Static references are never closed so do not remove from map
                return true;
            }
            var cookie = Module.eggShell.readDouble(javaScriptValueRef);
            return dynamicRefnumManager.deleteCookie(cookie);
        };

        var createJavaScriptInvokeParameterValueVisitor = function () {
            var reportInvalidReference = function (data) {
                data.errorOccurred = true;
                // Internal check not needed because peeker is not used for internal calls
                mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNIInvalidReference);
            };

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

                visitArray: function (valueRef, data) {
                    var foundAllCookies, returnValue, cookies;
                    var subTypeRef = Module.typeHelpers.subElementByIndex(valueRef.typeRef, 0);
                    if (Module.typeHelpers.isJSObjectDynamicRefnum(subTypeRef)) {
                        cookies = Module.eggShell.readTypedArray(valueRef);
                        returnValue = [];
                        foundAllCookies = dynamicRefnumManager.lookupValues(cookies, returnValue);
                        if (!foundAllCookies) {
                            reportInvalidReference(data);
                            return undefined;
                        }
                        return returnValue;
                    }

                    // duplicate typedArray so user cannot accidentally manipulate vireo memory space directly
                    var typedArray = Module.eggShell.readTypedArray(valueRef);
                    var TypedArrayConstructor = typedArray.constructor;
                    var clonedArray = new TypedArrayConstructor(typedArray);
                    return clonedArray;
                },

                visitJSObjectRefnum: function (valueRef, data) {
                    var isJavaScriptRefNumValid = Module.javaScriptInvoke.isJavaScriptRefNumValid(valueRef);
                    if (!isJavaScriptRefNumValid) {
                        reportInvalidReference(data);
                        return undefined;
                    }
                    return Module.javaScriptInvoke.readJavaScriptRefNum(valueRef);
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
                    var cookies;
                    var subTypeRef = Module.typeHelpers.subElementByIndex(valueRef.typeRef, 0);
                    if (Module.typeHelpers.isJSObjectDynamicRefnum(subTypeRef)) {
                        if (Array.isArray(data.returnValue)) {
                            cookies = new Uint32Array(data.returnValue.length);
                            dynamicRefnumManager.createCookies(data.returnValue, cookies);
                            Module.eggShell.resizeArray(valueRef, [cookies.length]);
                            Module.eggShell.writeTypedArray(valueRef, cookies);
                            return;
                        }
                        // If not array falls through to report type mismatch
                    } else if (Module.eggShell.isSupportedAndCompatibleArrayType(valueRef, data.returnValue)) {
                        Module.eggShell.resizeArray(valueRef, [data.returnValue.length]);
                        Module.eggShell.writeTypedArray(valueRef, data.returnValue);
                        return;
                    }
                    reportTypeMismatch(data);
                    return;
                }),

                visitJSObjectRefnum: reportReturnSetException(function (valueRef, data) {
                    Module.javaScriptInvoke.writeJavaScriptRefNum(valueRef, data.returnValue);
                })
            };
        };

        var returnValueVisitor = createJavaScriptInvokeReturnValueVisitor();

        var getGlobal = function () {
            // Normally we do not use typeof checks to see if a value is undefined
            // however in this case it is used to prevent ReferenceErrors when probing global objects
            if (typeof window !== 'undefined') {
                return window;
            } else if (typeof self !== 'undefined') {
                return self;
            } else if (typeof global !== 'undefined') {
                return global;
            }
            return {};
        };
        var internalFunctionsMap = new Map();
        var jsInvokeGlobal = getGlobal();

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

        publicAPI.javaScriptInvoke.registerCustomGlobal = function (customGlobal) {
            if (typeof customGlobal !== 'object' || customGlobal === null) {
                throw new Error('Registered custom global must be an object.');
            }

            jsInvokeGlobal = customGlobal;
        };

        var lookupFunctionAndContext = function (functionName, initialContext) {
            var names = functionName.split('.');
            var context = initialContext;
            var functionToCall = context[names[0]];
            var namesIndex;
            for (namesIndex = 1; namesIndex < names.length; namesIndex += 1) {
                if (functionToCall === undefined || functionToCall === null) {
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

        var findJavaScriptFunctionToCall = function (functionName, isInternalFunction) {
            if (isInternalFunction) {
                return {
                    functionToCall: internalFunctionsMap.get(functionName),
                    context: undefined
                };
            }

            var functionAndContext = lookupFunctionAndContext(functionName, jsInvokeGlobal);

            return functionAndContext;
        };

        var addToJavaScriptParametersArray = function (functionName, parameters, parametersPointer, parametersCount, errorValueRef, isInternalFunction) {
            var data = {
                errorOccurred: false,
                errorValueRef: errorValueRef,
                functionName: functionName
            };
            var parametersArraySize = parameters.length;
            for (var index = 0; index < parametersCount; index += 1) {
                var parameterValueRef = createValueRefFromPointerArray(parametersPointer, index);
                if (isInternalFunction) {
                    parameters[parametersArraySize + index] = parameterValueRef;
                } else {
                    // Inputs are always wired for user calls so if this errors because parameterValueRef is undefined then we have DFIR issues
                    parameters[parametersArraySize + index] = Module.eggShell.reflectOnValueRef(parameterValueVisitor, parameterValueRef, data);
                    if (data.errorOccurred) {
                        break;
                    }
                }
            }
            return !data.errorOccurred;
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
            var jsapi = {};
            var getCompletionCallback = function () {
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
                jsapi.setLabVIEWError = function (status, code, source) {
                    var newError = {
                        status: status,
                        code: code,
                        source: source
                    };
                    Module.coreHelpers.mergeErrors(errorValueRef, newError);
                };
            }
            return {jsapi, getCompletionCallback};
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

            var parameters = [];
            var returnValueRef = createValueRefFromPointerArray(returnPointer, 0);
            if (isInternalFunction) {
                parameters.push(returnValueRef);
            }
            var success = addToJavaScriptParametersArray(functionName, parameters, parametersPointer, parametersCount, errorValueRef, isInternalFunction);
            if (!success) {
                Module.eggShell.setOccurrence(occurrencePointer);
                return;
            }

            var completionCallbackStatus = {
                retrievalState: completionCallbackRetrievalEnum.AVAILABLE,
                invocationState: completionCallbackInvocationEnum.PENDING
            };

            var generateAPIResults;
            if (isInternalFunction) {
                generateAPIResults = generateAPI(occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction);
                parameters.push(generateAPIResults.jsapi);
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

                if (generateAPIResults === undefined) {
                    generateAPIResults = generateAPI(occurrencePointer, functionName, returnValueRef, errorValueRef, completionCallbackStatus, isInternalFunction);
                }

                completionCallback = generateAPIResults.getCompletionCallback();
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
            var isJavaScriptRefNumValid = Module.javaScriptInvoke.isJavaScriptRefNumValid(javaScriptRefNumValueRef);
            var isNotAJavaScriptRefnum = !isJavaScriptRefNumValid;
            Module.eggShell.writeDouble(returnValueRef, isNotAJavaScriptRefnum ? 1 : 0);
        };

        /**
         * Static references (ie, control reference) aren't closed and not removed from the map
         */
        Module.javaScriptInvoke.jsCloseJavaScriptRefNum = function (javaScriptRefnumTypeRef, javaScriptRefnumDataRef, errorTypeRef, errorDataRef) {
            var javaScriptValueRef = Module.eggShell.createValueRef(javaScriptRefnumTypeRef, javaScriptRefnumDataRef);
            var operationSuccessful = Module.javaScriptInvoke.clearJavaScriptRefNum(javaScriptValueRef);
            if (!operationSuccessful) {
                var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
                var newError = {
                    status: true,
                    code: ERRORS.kNIInvalidReference.CODE,
                    source: ERRORS.kNIInvalidReference.MESSAGE
                };
                Module.coreHelpers.mergeErrors(errorValueRef, newError);
            }
        };
    };
}());
export default assignJavaScriptInvoke;
