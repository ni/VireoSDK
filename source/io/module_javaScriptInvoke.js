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
            'JavaScriptInvoke_GetParameterPointer',
            'JavaScriptInvoke_GetParameterTypeName',
            'JavaScriptInvoke_GetParameterTypeRef',
            'JavaScriptInvoke_GetParameterDataRef',
            'JavaScriptInvoke_GetArrayElementType',
            'Data_ReadJavaScriptRefNum',
            'Data_WriteJavaScriptRefNum'
        ]}], */

        Module.javaScriptInvoke = {};
        publicAPI.javaScriptInvoke = {};

        // Private Instance Variables (per vireo instance)
        var internalFunctionsMap = new Map();
        var JavaScriptInvoke_GetParameterTypeRef = Module.cwrap('JavaScriptInvoke_GetParameterTypeRef', 'number', ['number', 'number']);
        var JavaScriptInvoke_GetParameterDataRef = Module.cwrap('JavaScriptInvoke_GetParameterDataRef', 'number', ['number', 'number']);
        var Data_ReadJavaScriptRefNum = Module.cwrap('Data_ReadJavaScriptRefNum', 'number', ['number']);
        var Data_WriteJavaScriptRefNum = Module.cwrap('Data_WriteJavaScriptRefNum', 'void', ['number', 'number']);

        var mergeNewError = function (errorValueRef, functionName, errorToSet, exception) {
            var newError = {
                status: true
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

        Module.javaScriptInvoke.dataReadJavaScriptRefNum = function (javaScriptValueRef) {
            var cookie = Data_ReadJavaScriptRefNum(javaScriptValueRef.dataRef);
            return jsRefNumToJsValueMap.get(cookie);
        };

        Module.javaScriptInvoke.dataWriteJavaScriptRefNum = function (javaScriptValueRef, jsValue) {
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

        var jsInvokePeeker = function () {
            var PeekVisitor = function () {
                // Nothing here. Refer prototype
            };

            var proto = PeekVisitor.prototype;

            proto.visitBoolean = function (valueRef) {
                return Module.eggShell.readDouble(valueRef) !== 0;
            };

            var visitNumeric = function (valueRef) {
                return Module.eggShell.readDouble(valueRef);
            };

            var visitNumeric64 = function (valueRef) {
                return JSON.parse(Module.eggShell.readJSON(valueRef));
            };

            proto.visitInt8 = visitNumeric;
            proto.visitInt16 = visitNumeric;
            proto.visitInt32 = visitNumeric;
            proto.visitInt64 = visitNumeric64;
            proto.visitUInt8 = visitNumeric;
            proto.visitUInt16 = visitNumeric;
            proto.visitUInt32 = visitNumeric;
            proto.visitUInt64 = visitNumeric64;
            proto.visitSingle = visitNumeric;
            proto.visitDouble = visitNumeric;
            proto.visitEnum8 = visitNumeric;
            proto.visitEnum16 = visitNumeric;
            proto.visitEnum32 = visitNumeric;

            proto.visitString = function (valueRef) {
                return Module.eggShell.readString(valueRef);
            };

            proto.visitArray = function (valueRef) {
                return Module.eggShell.readTypedArray(valueRef);
            };

            proto.visitJSObjectRefnum = function (valueRef) {
                return Module.eggShell.readJavaScriptRefNum(valueRef);
            };

            var peekVisitor = new PeekVisitor();

            return function (valueRef) {
                return Module.eggShell.reflectOnValueRef(peekVisitor, valueRef);
            };
        };

        var peekValueRef = jsInvokePeeker();

        var jsInvokePoker = function () {
            var PokeVisitor = function () {
                // Nothing here. Refer prototype
            };

            var proto = PokeVisitor.prototype;

            proto.visitBoolean = function (valueRef, data) {
                if (typeof data.userValue !== 'boolean') {
                    mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
                    return;
                }
                Module.eggShell.writeDouble(valueRef, data.userValue ? 1 : 0);
            };

            var visitNumeric = function (valueRef, data) {
                // TODO-san anything to do for this?
                // Looks like the data-grid ends up pushing the string value "-Infinity"
                // instead of the numeric value -Infinity to the model so perform parseFloat
                // in-case a string is passed instead of a number
                if (typeof data.userValue !== 'number') {
                    mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
                    return;
                }
                var dataNum = parseFloat(data.userValue);
                Module.eggShell.writeDouble(valueRef, dataNum);
            };

            proto.visitInt8 = visitNumeric;
            proto.visitInt16 = visitNumeric;
            proto.visitInt32 = visitNumeric;
            proto.visitUInt8 = visitNumeric;
            proto.visitUInt16 = visitNumeric;
            proto.visitUInt32 = visitNumeric;
            proto.visitSingle = visitNumeric;
            proto.visitDouble = visitNumeric;
            proto.visitEnum8 = visitNumeric;
            proto.visitEnum16 = visitNumeric;
            proto.visitEnum32 = visitNumeric;

            proto.visitString = function (valueRef, data) {
                if (typeof data.userValue !== 'string') {
                    mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke);
                    return;
                }
                Module.eggShell.writeString(valueRef, data.userValue);
            };

            proto.visitArray = function (valueRef, data) {
                try {
                    Module.eggShell.resizeArray(valueRef, [data.userValue.length]);
                    Module.eggShell.writeTypedArray(valueRef, data.userValue);
                    return;
                } catch (ex) {
                    mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNITypeMismatchForReturnTypeInJavaScriptInvoke, ex);
                }
            };

            proto.visitJSObjectRefnum = function (valueRef, data) {
                try {
                    Module.eggShell.writeJavaScriptRefNum(valueRef, data.userValue);
                } catch (ex) {
                    mergeNewError(data.errorValueRef, data.functionName, ERRORS.kNIUnableToSetReturnValueInJavaScriptInvoke, ex);
                }
            };

            var pokeVisitor = new PokeVisitor();

            return function (valueRef, data) {
                return Module.eggShell.reflectOnValueRef(pokeVisitor, valueRef, data);
            };
        };

        var pokeValueRef = jsInvokePoker();

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

        var createJavaScriptParametersArray = function (isInternalFunction, parametersPointer, parametersCount) {
            var parameters = new Array(parametersCount);
            for (var index = 0; index < parametersCount; index += 1) {
                var parameterValueRef = createValueRefFromPointerArray(parametersPointer, index);
                if (!isInternalFunction) {
                    parameters[index] = peekValueRef(parameterValueRef);
                } else {
                    parameters[index] = parameterValueRef;
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
            if (returnValueRef.dataRef === 0) {
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

        var shouldUpdateReturnValue = function (isInternalFunction, returnTypeRef) {
            return !isInternalFunction || Module.typeHelpers.isJSObjectRefnum(returnTypeRef);
        };

        Module.javaScriptInvoke.jsJavaScriptInvoke = function (
            occurrencePointer,
            functionNamePointer,
            returnPointer,
            parametersPointer,
            parametersCount,
            isInternalFunction,
            errorTypeRef,
            errorDataRef) {
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var functionName = Module.eggShell.dataReadString(functionNamePointer);
            var parameters = new Array(0);

            var returnValueRef = createValueRefFromPointerArray(returnPointer, 0);
            var shouldReturnValueBeUpdated = shouldUpdateReturnValue(isInternalFunction, returnValueRef.typeRef);
            if (!shouldReturnValueBeUpdated) {
                parameters = parameters.concat(returnValueRef);
            }

            try {
                parameters = parameters.concat(createJavaScriptParametersArray(isInternalFunction, parametersPointer, parametersCount));
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
                if (shouldReturnValueBeUpdated) {
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
