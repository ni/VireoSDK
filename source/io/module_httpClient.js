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
}(this, 'NationalInstruments.Vireo.ModuleBuilders.assignHttpClient', function () {
    'use strict';

    /* global Map */

    // Static Private Variables (all vireo instances)
    var TRUE = 1;
    var FALSE = 0;

    var NULL = 0;

    var DEFAULT_INVALID_HANDLE = 0;

    var ERRORS = {
        // Shared
        NO_ERROR: {
            CODE: 0,
            MESSAGE: ''
        },

        // penguin\lvaddon\errors\osnetwork\trunk\17.0\source\errors.nimxl
        InvalidRefnum: {
            CODE: -1967362020,
            MESSAGE: 'The provided refnum is invalid.'
        },

        // penguin\lvaddon\errors\lv\trunk\17.0\source\errors.nimxl
        mgArgErr: {
            CODE: 1,
            MESSAGE: 'An input parameter is invalid. For example if the input is a path, the path might contain a character not allowed by the OS such as ? or @.'
        },
        ncTimeOutErr: {
            CODE: 56,
            MESSAGE: 'The network operation exceeded the user-specified or system time limit.'
        },
        kNIHttpResultCouldNotConnect: {
            CODE: 363500,
            MESSAGE: 'Failed to connect to the specified hostname.  Be sure the specified hostname is correct, the server is running and configured to accept remote requests.'
        },
        kNIHttpResultAbortedByCallback: {
            CODE: 363508,
            MESSAGE: 'The request was aborted by the caller.'
        },
        kNIHttpResultRequestHeaderDoesNotExist: {
            CODE: 363528,
            MESSAGE: 'The specified request header does not exist.'
        },

        kNIHttpWebVINetworkError: {
            CODE: 363650,
            MESSAGE: 'A network error has occurred. Possible reasons for this error include Cross-Origin Resource Sharing (CORS) configuration issues between the client and the target server or that the client cannot reach the target server. Due to browser security restrictions, detailed information about the cause of the network error cannot be provided. You may find specific details about the cause of the network error in the browser development tools console or in the LabVIEW output window.'
        },
        kNIHttpWebVIHeaderInvalid: {
            CODE: 363651,
            MESSAGE: 'Setting a header or header value resulted in an error, possibly due to an invalid character in a header or header value. Verify that each header and header value contains only valid characters.'
        },
        kNIHttpWebVICookieFileUnsupported: {
            CODE: 363652,
            MESSAGE: 'This target does not support modification of the cookie file input. The browser manages saving cookies from an HTTP response and including cookies in HTTP requests on behalf of the user. The HTTP Client VIs cannot manipulate cookies directly. Set the cookie file input as either Not a path or an empty path for this target.'
        },
        kNIHttpWebVIVerifyServerUnsupported: {
            CODE: 363653,
            MESSAGE: 'This target does not support modification of the verify server input. The browser manages settings related to validation of a server\'s identity and establishing secure connections. Set the verify server input to True for this target.'
        },
        kNIHttpWebVIOutputFileUnsupported: {
            CODE: 363654,
            MESSAGE: 'This target does not support usage of an output file. Set output file as either Not a path or an empty path for this target.'
        },
        kNIHttpCORSNotRequired: {
            CODE: 363655,
            MESSAGE: 'This target is not subject to Cross-Origin Resource Sharing (CORS) restrictions and cannot perform CORS configuration. Do not attempt to perform CORS configuration on this target.'
        },
        kNIHttpWebVIProxyConfigUnsupported: {
            CODE: 363656,
            MESSAGE: 'This target does not support proxy server configuration using the HTTP Client VIs. The host browser or environment must be configured directly to change proxy server settings. Do not attempt to perform proxy server configuration on this target.'
        },
        kNIHttpWebVISSLConfigUnsupported: {
            CODE: 363657,
            MESSAGE: 'This target does not support SSL configuration using the HTTP Client VIs. The host browser or environment must be configured directly to change SSL settings. Do not attempt to perform SSL configuration on this target.'
        },

        kNIHttpResultInternalUndefinedError: {
            CODE: 363798,
            MESSAGE: 'The HTTP client produced an unknown error.'
        }
    };

    var DEFAULT_TIMEOUT_MS = 10000;
    var TIMEOUT_IMMEDIATELY_MS = 1;

    var RunningRequestsTracker;
    (function () {
        // Static private reference aliases
        // None

        // Constructor Function
        RunningRequestsTracker = function () {
            // Public Instance Properties
            // None

            // Private Instance Properties
            this._runningRequests = [];
        };

        // Static Public Variables
        // None

        // Static Public Functions
        // None

        // Prototype creation
        var child = RunningRequestsTracker;
        var proto = child.prototype;

        // Static Private Variables
        // None

        // Static Private Functions
        // None

        // Public Prototype Methods
        proto.addRequest = function (request) {
            this._runningRequests.push(request);
        };

        proto.removeRequest = function (request) {
            var index = this._runningRequests.indexOf(request);
            if (index > -1) {
                this._runningRequests.splice(index, 1);
            }
        };

        proto.abortAllRunningRequests = function () {
            // Abort event handlers seem to run synchronously
            // So run on a copy to prevent mutating while aborting
            var runningRequestsCopy = this._runningRequests.slice();
            runningRequestsCopy.forEach(function (request) {
                request.abort();
            });
        };
    }());

    var HttpClient;
    (function () {
        // Static private reference aliases
        // None

        // Constructor Function
        HttpClient = function (username, password, requestTracker, xmlHttpRequestImplementation) {
            // Public Instance Properties
            // None

            // Private Instance Properties
            this._username = username;
            this._password = password;
            this._headers = new Map();
            this._includeCredentialsDuringCORS = false;
            this._requestTracker = requestTracker;
            this._xmlHttpRequestImplementation = xmlHttpRequestImplementation;
        };

        // Static Public Variables
        // None

        // Static Public Functions
        // None

        // Prototype creation
        var child = HttpClient;
        var proto = child.prototype;

        // Static Private Variables
        // None

        // Static Private Functions
        // None

        // Public Prototype Methods
        proto.addHeader = function (header, value) {
            this._headers.set(header, value);
        };

        proto.removeHeader = function (header) {
            this._headers.delete(header);
        };

        // Returns the header with whitespace trimmed if found or undefined if not found
        proto.getHeaderValue = function (header) {
            var ret;

            if (this._headers.has(header)) {
                ret = this._headers.get(header).trim();
            }

            return ret;
        };

        proto.listHeaders = function () {
            var outputHeaders = [];

            this._headers.forEach(function (value, header) {
                outputHeaders.push(header.trim() + ': ' + value.trim());
            });

            // Avoid a trailing \r\n append
            return outputHeaders.join('\r\n');
        };

        proto.createRequest = function (requestData, cb) {
            var that = this;
            var XMLHttpRequestImplementation = that._xmlHttpRequestImplementation;
            var errorMessage;
            var request = new XMLHttpRequestImplementation();

            // Save a reference to the request
            that._requestTracker.addRequest(request);

            // Create event listeners
            var eventListeners = {};

            // Even though we are rigorous with removing event listeners there is at least one case where completeRequest will be run twice
            // In PhantomJS 2.0.1 if a bad url is provided the send() function will throw an error triggering a catch statement in addition to the error event handler
            // However, only in PhantomJS will the error event handler run before the catch statement
            // So while most browsers will completeRequest in the catch statement and remove the event handlers to prevent further triggers,
            // PhantomJS will run the error event handler first to completeRequest and then attempt to completeRequest again in the catch statement
            // So begrudgingly a requestCompleted flag is added to prevent multiple calls of completeRequest.
            var requestCompleted = false;

            var completeRequest = function (responseData) {
                // Make sure completeRequest is not called twice
                if (requestCompleted === true) {
                    return;
                }
                requestCompleted = true;

                // Unregister event listeners
                Object.keys(eventListeners).forEach(function (eventName) {
                    request.removeEventListener(eventName, eventListeners[eventName]);
                });

                // Remove reference to complete request
                that._requestTracker.removeRequest(request);

                cb(responseData);
            };

            // load, error, timeout, and abort are mutually exclusive and one will fire after send
            // See https://xhr.spec.whatwg.org/#suggested-names-for-events-using-the-progressevent-interface
            eventListeners.load = function () {
                // A status code of 0 is an invalid status code and indicative of a failure
                // So far the only browser returning status codes of 0 is PhantomJS
                if (request.status === 0) {
                    completeRequest({
                        header: '',
                        body: [],
                        status: 0,
                        labviewCode: ERRORS.kNIHttpResultInternalUndefinedError.CODE,
                        errorMessage: ERRORS.kNIHttpResultInternalUndefinedError.MESSAGE,
                        requestException: undefined
                    });
                    return;
                }

                // TODO mraj is there a way to get the HTTP version from the request?
                var httpVersion = 'HTTP/1.1';
                var statusLine = httpVersion + ' ' + request.status + ' ' + request.statusText + '\r\n';
                var allResponseHeaders = request.getAllResponseHeaders();

                var header = statusLine + allResponseHeaders;
                var body = new Uint8Array(request.response);
                completeRequest({
                    header: header,
                    body: body,
                    status: request.status,
                    labviewCode: ERRORS.NO_ERROR.CODE,
                    errorMessage: ERRORS.NO_ERROR.MESSAGE,
                    requestException: undefined
                });
            };

            eventListeners.error = function () {
                completeRequest({
                    header: '',
                    body: [],
                    status: 0,
                    labviewCode: ERRORS.kNIHttpWebVINetworkError.CODE,
                    errorMessage: ERRORS.kNIHttpWebVINetworkError.MESSAGE,
                    requestException: undefined
                });
            };

            // Desktop does not try and return partial response data in timeout scenarios so do not attempt to here
            eventListeners.timeout = function () {
                completeRequest({
                    header: '',
                    body: [],
                    status: 0,
                    labviewCode: ERRORS.ncTimeOutErr.CODE,
                    errorMessage: ERRORS.ncTimeOutErr.MESSAGE,
                    requestException: undefined
                });
            };

            eventListeners.abort = function () {
                completeRequest({
                    header: '',
                    body: [],
                    status: 0,
                    labviewCode: ERRORS.kNIHttpResultAbortedByCallback.CODE,
                    errorMessage: ERRORS.kNIHttpResultAbortedByCallback.MESSAGE,
                    requestException: undefined
                });
            };

            // Register event listeners
            Object.keys(eventListeners).forEach(function (eventName) {
                request.addEventListener(eventName, eventListeners[eventName]);
            });

            // Open request to set properties
            try {
                request.open(requestData.method, requestData.url, true, that._username, that._password);
            } catch (ex) {
                // Spec says open should throw SyntaxError but some browsers seem to throw DOMException.
                // Instead of trying to detect, always say invalid url and add message to source
                completeRequest({
                    header: '',
                    body: [],
                    status: 0,
                    labviewCode: ERRORS.kNIHttpResultCouldNotConnect.CODE,
                    errorMessage: ERRORS.kNIHttpResultCouldNotConnect.MESSAGE,
                    requestException: ex
                });
                return;
            }

            // Add request headers
            var currentHeaderName, currentHeaderValue;
            var hasContentType = false;

            try {
                that._headers.forEach(function (value, header) {
                    currentHeaderName = header;
                    currentHeaderValue = value;

                    request.setRequestHeader(header, value);

                    if (header.toLowerCase() === 'content-type') {
                        hasContentType = true;
                    }
                });
            } catch (ex) {
                errorMessage = ERRORS.kNIHttpWebVIHeaderInvalid.MESSAGE + '\nheader:' + currentHeaderName + '\nvalue:' + currentHeaderValue;
                completeRequest({
                    header: '',
                    body: [],
                    status: 0,
                    labviewCode: ERRORS.kNIHttpWebVIHeaderInvalid.CODE,
                    errorMessage: errorMessage,
                    requestException: ex
                });
                return;
            }

            // Set the Content-Type to application/x-www-form-urlencoded to match the default on Desktop
            // User can add a Content-Type header to override this default
            // Only add the default Content-Type header to requests that include a buffer
            if (hasContentType === false && requestData.buffer !== undefined) {
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            }

            // withCredentials allows cookies (to be sent / set), HTTP Auth, and TLS Client certs when sending requests Cross Origin
            // See https://w3c.github.io/webappsec-cors-for-developers/#anonymous-requests-or-access-control-allow-origin
            request.withCredentials = that._includeCredentialsDuringCORS;

            // Receive the response as an ArrayBuffer. Relies on the server to send data as UTF-8 encoded text for text transmission.
            request.responseType = 'arraybuffer';

            // In IE 11 the timeout property may only be set after calling open and before calling send
            request.timeout = requestData.xhrTimeout;

            // Send request
            // IE11 and PhatomJS will both throw on send() if an invalid url is provided. Spec compliant browsers throw on open() for invalid urls.
            // Not sure if this is the only reason for send to throw in IE11, so using more generic network error
            try {
                if (requestData.buffer === undefined) {
                    request.send();
                } else {
                    request.send(requestData.buffer);
                }
            } catch (ex) {
                completeRequest({
                    header: '',
                    body: [],
                    status: 0,
                    labviewCode: ERRORS.kNIHttpWebVINetworkError.CODE,
                    errorMessage: ERRORS.kNIHttpWebVINetworkError.MESSAGE,
                    requestException: ex
                });
                return;
            }
        };

        proto.setIncludeCredentialsDuringCORS = function (includeCredentialsDuringCORS) {
            this._includeCredentialsDuringCORS = includeCredentialsDuringCORS;
        };
    }());

    var HttpClientManager;
    (function () {
        // Static private reference aliases
        // None

        // Constructor Function
        HttpClientManager = function () {
            // Public Instance Properties
            // None

            // Private Instance Properties
            this._httpClients = new Map();
            this._runningRequestsTracker = new RunningRequestsTracker();

            if (typeof XMLHttpRequest === 'undefined') {
                this._xmlHttpRequestImplementation = function () {
                    throw new Error('Vireo could not find a global implementation of XMLHttpRequest Level 2. Please provide one to vireo.httpClient.setXMLHttpRequestImplementation to use the Vireo HTTP Client');
                };
            } else {
                this._xmlHttpRequestImplementation = XMLHttpRequest;
            }
        };

        // Static Public Variables
        // None

        // Static Public Functions
        // None

        // Prototype creation
        var child = HttpClientManager;
        var proto = child.prototype;

        // Static Private Variables
        // None

        // Static Private Functions
        var createHandle = (function () {
            // A handle of zero implies an invalid handle
            var currentHandle = 1;

            return function () {
                var handle = currentHandle;
                currentHandle += 1;
                return handle;
            };
        }());

        // Public Prototype Methods
        proto.create = function (username, password) {
            var httpClient = new HttpClient(username, password, this._runningRequestsTracker, this._xmlHttpRequestImplementation);
            var handle = createHandle();

            this._httpClients.set(handle, httpClient);
            return handle;
        };

        proto.createHttpClientWithoutHandle = function (username, password) {
            var httpClient = new HttpClient(username, password, this._runningRequestsTracker, this._xmlHttpRequestImplementation);
            return httpClient;
        };

        proto.destroy = function (handle) {
            var httpClient = this._httpClients.get(handle);
            if (httpClient === undefined) {
                return;
            }

            // Currently we do not abort any existing requests that were made with this handle
            this._httpClients.delete(handle);
        };

        proto.get = function (handle) {
            return this._httpClients.get(handle);
        };

        proto.abortAllRunningRequests = function () {
            this._runningRequestsTracker.abortAllRunningRequests();
        };

        proto.setXMLHttpRequestImplementation = function (fn) {
            if (typeof fn !== 'function') {
                throw new Error('A valid function must be provided');
            }

            // This does not have an effect on already instanced HttpClients or running requests, only on new HttpClient instances
            this._xmlHttpRequestImplementation = fn;
        };
    }());

    // Vireo Core Mixin Function
    var assignHttpClient = function (Module, publicAPI) {
        Module.httpClient = {};
        publicAPI.httpClient = {};

        // Private Instance Variables (per vireo instance)
        var httpClientManager = new HttpClientManager();

        var METHOD_NAMES = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'];

        var findhttpClientOrWriteError = function (handle, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var httpClient = httpClientManager.get(handle);
            var newErrorSource;

            if (httpClient === undefined) {
                newErrorSource = Module.coreHelpers.createSourceFromMessage(ERRORS.mgArgErr.MESSAGE);
                Module.coreHelpers.mergeErrors(true, ERRORS.mgArgErr.CODE, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
            }

            return httpClient;
        };

        // Exported functions
        publicAPI.httpClient.abortAllRunningRequests = function () {
            httpClientManager.abortAllRunningRequests();
        };

        publicAPI.httpClient.setXMLHttpRequestImplementation = function (fn) {
            httpClientManager.setXMLHttpRequestImplementation(fn);
        };

        // NOTE: All of the Module.js* functions  in this file should be called from Vireo only if there is not an existing error
        // unless otherwise stated in the function below
        Module.httpClient.jsHttpClientOpen = function (cookieFilePointer, usernamePointer, passwordPointer, verifyServerInt32, handlePointer, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var setDefaultOutputs = function () {
                Module.eggShell.dataWriteUInt32(handlePointer, DEFAULT_INVALID_HANDLE);
            };

            var newErrorSource;
            var cookieFile = Module.eggShell.dataReadString(cookieFilePointer);
            if (cookieFile !== '') {
                newErrorSource = Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpWebVICookieFileUnsupported.MESSAGE);
                Module.coreHelpers.mergeErrors(true, ERRORS.kNIHttpWebVICookieFileUnsupported.CODE, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                setDefaultOutputs();
                return;
            }

            var verifyServer = verifyServerInt32 !== FALSE;
            if (verifyServer !== true) {
                newErrorSource = Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpWebVIVerifyServerUnsupported.MESSAGE);
                Module.coreHelpers.mergeErrors(true, ERRORS.kNIHttpWebVIVerifyServerUnsupported.CODE, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                setDefaultOutputs();
                return;
            }

            var username = Module.eggShell.dataReadString(usernamePointer);
            var password = Module.eggShell.dataReadString(passwordPointer);
            var newHandle = httpClientManager.create(username, password);
            Module.eggShell.dataWriteUInt32(handlePointer, newHandle);
        };

        Module.httpClient.jsHttpClientClose = function (handle, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            // This function should be called irregardless of an existing error to clean-up resources
            var newErrorSource;
            var handleExists = httpClientManager.get(handle) !== undefined;

            if (handleExists === false) {
                newErrorSource = Module.coreHelpers.createSourceFromMessage(ERRORS.InvalidRefnum.MESSAGE);
                Module.coreHelpers.mergeErrors(true, ERRORS.InvalidRefnum.CODE, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                // Do not return if an error is written, need to still destroy any existing handles
            }

            // Always destroy the handle
            httpClientManager.destroy(handle);
        };

        Module.httpClient.jsHttpClientAddHeader = function (handle, headerPointer, valuePointer, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var httpClient = findhttpClientOrWriteError(handle, errorStatusPointer, errorCodePointer, errorSourcePointer);
            if (httpClient === undefined) {
                return;
            }

            var header = Module.eggShell.dataReadString(headerPointer);
            var value = Module.eggShell.dataReadString(valuePointer);
            httpClient.addHeader(header, value);
        };

        Module.httpClient.jsHttpClientRemoveHeader = function (handle, headerPointer, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var httpClient = findhttpClientOrWriteError(handle, errorStatusPointer, errorCodePointer, errorSourcePointer);
            if (httpClient === undefined) {
                return;
            }

            var header = Module.eggShell.dataReadString(headerPointer);
            httpClient.removeHeader(header);
        };

        Module.httpClient.jsHttpClientGetHeader = function (handle, headerPointer, valuePointer, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var setDefaultOutputs = function () {
                Module.eggShell.dataWriteString(valuePointer, '');
            };

            var httpClient = findhttpClientOrWriteError(handle, errorStatusPointer, errorCodePointer, errorSourcePointer);
            if (httpClient === undefined) {
                setDefaultOutputs();
                return;
            }

            var newErrorSource;
            var header = Module.eggShell.dataReadString(headerPointer);
            var value = httpClient.getHeaderValue(header);
            if (value === undefined) {
                newErrorSource = Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpResultRequestHeaderDoesNotExist.MESSAGE + '\nheader:' + header);
                Module.coreHelpers.mergeErrors(true, ERRORS.kNIHttpResultRequestHeaderDoesNotExist.CODE, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                setDefaultOutputs();
                return;
            }

            Module.eggShell.dataWriteString(valuePointer, value);
        };

        Module.httpClient.jsHttpClientHeaderExists = function (handle, headerPointer, headerExistsPointer, valuePointer, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var setDefaultOutputs = function () {
                Module.eggShell.dataWriteUInt32(headerExistsPointer, FALSE);
                Module.eggShell.dataWriteString(valuePointer, '');
            };

            var httpClient = findhttpClientOrWriteError(handle, errorStatusPointer, errorCodePointer, errorSourcePointer);
            if (httpClient === undefined) {
                setDefaultOutputs();
                return;
            }

            var header = Module.eggShell.dataReadString(headerPointer);
            var valueOrUndefined = httpClient.getHeaderValue(header);
            var headerExists = valueOrUndefined !== undefined;
            if (headerExists === false) {
                setDefaultOutputs();
                return;
            }

            Module.eggShell.dataWriteUInt32(headerExistsPointer, TRUE);
            Module.eggShell.dataWriteString(valuePointer, valueOrUndefined);
        };

        Module.httpClient.jsHttpClientListHeaders = function (handle, listPointer, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var setDefaultOutputs = function () {
                Module.eggShell.dataWriteString(listPointer, '');
            };

            var httpClient = findhttpClientOrWriteError(handle, errorStatusPointer, errorCodePointer, errorSourcePointer);
            if (httpClient === undefined) {
                setDefaultOutputs();
                return;
            }

            var list = httpClient.listHeaders();
            Module.eggShell.dataWriteString(listPointer, list);
        };

        Module.httpClient.jsHttpClientMethod = function (methodId, handle, urlPointer, outputFilePointer, bufferTypeRef, bufferDataRef, timeoutPointer, headersPointer, bodyPointer, statusCodePointer, errorStatusPointer, errorCodePointer, errorSourcePointer, occurrencePointer) {
            var setDefaultOutputs = function () {
                Module.eggShell.dataWriteString(headersPointer, '');
                Module.eggShell.dataWriteUInt32(statusCodePointer, 0);

                if (bodyPointer !== NULL) {
                    Module.eggShell.dataWriteString(bodyPointer, '');
                }

                Module.eggShell.setOccurrenceAsync(occurrencePointer);
            };

            var newErrorSource, errorMessage;
            var method = METHOD_NAMES[methodId];

            // Nullable input parameters: handle, outputFile, buffer
            // Nullable output parameter: body

            var outputFile;
            if (outputFilePointer !== NULL) {
                outputFile = Module.eggShell.dataReadString(outputFilePointer);

                if (outputFile !== '') {
                    newErrorSource = Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpWebVIOutputFileUnsupported.MESSAGE);
                    Module.coreHelpers.mergeErrors(true, ERRORS.kNIHttpWebVIOutputFileUnsupported.CODE, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                    setDefaultOutputs();
                    return;
                }
            }

            var valueRef, buffer, typedArrayBuffer;
            if (bufferDataRef !== NULL) {
                valueRef = Module.eggShell.createValueRef(bufferTypeRef, bufferDataRef);
                typedArrayBuffer = Module.eggShell.readTypedArray(valueRef);

                // Blob API does not exist in node.js
                if (typeof Blob === 'undefined') {
                    buffer = typedArrayBuffer;
                } else {
                    // TODO(mraj) would like to use the typed array in all browsers but not supported in iOS and PhantomJS with XHR.send
                    // Blob type property not set to determine Content-Type for XHR as IE and Edge seem to ignore it.
                    buffer = new Blob([typedArrayBuffer]);
                }
            }

            var httpClient;
            if (handle === NULL) {
                httpClient = httpClientManager.createHttpClientWithoutHandle('', '');
            } else {
                httpClient = findhttpClientOrWriteError(handle, errorStatusPointer, errorCodePointer, errorSourcePointer);
                if (httpClient === undefined) {
                    setDefaultOutputs();
                    return;
                }
            }

            var xhrTimeout;
            var timeout;

            if (timeoutPointer === NULL) {
                xhrTimeout = DEFAULT_TIMEOUT_MS;
            } else {
                timeout = Module.eggShell.dataReadInt32(timeoutPointer);

                // In LabVIEW timeout -1 means wait forever, in xhr timeout 0 means wait forever
                if (timeout < 0) {
                    xhrTimeout = 0;
                } else if (timeout === 0) {
                    xhrTimeout = TIMEOUT_IMMEDIATELY_MS;
                } else {
                    xhrTimeout = timeout;
                }
            }

            var url = Module.eggShell.dataReadString(urlPointer);
            var requestData = {
                method: method,
                url: url,
                xhrTimeout: xhrTimeout,
                buffer: buffer
            };

            httpClient.createRequest(requestData, function (responseData) {
                Module.eggShell.dataWriteString(headersPointer, responseData.header);
                Module.eggShell.dataWriteUInt32(statusCodePointer, responseData.status);

                if (bodyPointer !== NULL) {
                    Module.eggShell.dataWriteStringFromArray(bodyPointer, responseData.body);
                }

                var newErrorStatus = responseData.labviewCode !== ERRORS.NO_ERROR.CODE;
                var newErrorCode = responseData.labviewCode;
                errorMessage = Module.coreHelpers.formatMessageWithException(responseData.errorMessage, responseData.requestException);
                var newErrorSource = Module.coreHelpers.createSourceFromMessage(errorMessage);
                Module.coreHelpers.mergeErrors(newErrorStatus, newErrorCode, newErrorSource, errorStatusPointer, errorCodePointer, errorSourcePointer);
                Module.eggShell.setOccurrenceAsync(occurrencePointer);
            });
        };

        Module.httpClient.jsHttpClientConfigCORS = function (handle, includeCredentialsDuringCORS, errorStatusPointer, errorCodePointer, errorSourcePointer) {
            var httpClient = findhttpClientOrWriteError(handle, errorStatusPointer, errorCodePointer, errorSourcePointer);
            if (httpClient === undefined) {
                return;
            }
            httpClient.setIncludeCredentialsDuringCORS(includeCredentialsDuringCORS !== FALSE);
        };
    };

    return assignHttpClient;
}));
