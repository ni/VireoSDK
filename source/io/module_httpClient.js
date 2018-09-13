var assignHttpClient;
(function () {
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
            var emptyBody = new Uint8Array(0);
            var request = new XMLHttpRequestImplementation();

            // Save a reference to the request
            that._requestTracker.addRequest(request);

            // Create event listeners
            var eventListeners = {};

            // Even though we are rigorous with removing event listeners there is at least one case where completeRequest will be run twice
            // In legacy browsers if a bad url is provided the send() function will throw an error triggering a catch statement in addition to the error event handler
            // However, only in legacy browsers will the error event handler run before the catch statement
            // So while most browsers will completeRequest in the catch statement and remove the event handlers to prevent further triggers,
            // legacy browsers will run the error event handler first to completeRequest and then attempt to completeRequest again in the catch statement
            // So begrudgingly a requestCompleted flag is added to prevent multiple calls of completeRequest.
            // This flag is no longer required.
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
                // So far only legacy browsers return a status codes of 0, so this check is no longer needed.
                if (request.status === 0) {
                    completeRequest({
                        header: '',
                        body: emptyBody,
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
                    body: emptyBody,
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
                    body: emptyBody,
                    status: 0,
                    labviewCode: ERRORS.ncTimeOutErr.CODE,
                    errorMessage: ERRORS.ncTimeOutErr.MESSAGE,
                    requestException: undefined
                });
            };

            eventListeners.abort = function () {
                completeRequest({
                    header: '',
                    body: emptyBody,
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
                    body: emptyBody,
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
                    body: emptyBody,
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

            // In legacy browsers timeout property may only be set after calling open and before calling send, no longer required
            request.timeout = requestData.xhrTimeout;

            // Send request
            // Legacy browsers throw on send() if an invalid url is provided. Spec compliant browsers throw on open() for invalid urls.
            // Not sure if this is the only reason for send to throw, so using more generic network error
            // The exception handling is likely no longer required.
            try {
                if (requestData.buffer === undefined) {
                    request.send();
                } else {
                    request.send(requestData.buffer);
                }
            } catch (ex) {
                completeRequest({
                    header: '',
                    body: emptyBody,
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
    assignHttpClient = function (Module, publicAPI) {
        Module.httpClient = {};
        publicAPI.httpClient = {};

        // Private Instance Variables (per vireo instance)
        var httpClientManager = new HttpClientManager();

        var METHOD_NAMES = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'];

        var findhttpClientOrWriteError = function (handle, errorValueRef) {
            var httpClient = httpClientManager.get(handle);
            var newError;

            if (httpClient === undefined) {
                newError = {
                    status: true,
                    code: ERRORS.mgArgErr.CODE,
                    source: Module.coreHelpers.createSourceFromMessage(ERRORS.mgArgErr.MESSAGE)
                };

                Module.coreHelpers.mergeErrors(errorValueRef, newError);
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
        Module.httpClient.jsHttpClientOpen = function (
            cookieFileTypeRef, cookieFileDataRef,
            usernameTypeRef, usernameDataRef,
            passwordTypeRef, passwordDataRef,
            verifyServerTypeRef, verifyServerDataRef,
            handleTypeRef, handleDataRef,
            errorTypeRef, errorDataRef) {
            var cookieFileValueRef = Module.eggShell.createValueRef(cookieFileTypeRef, cookieFileDataRef);
            var usernameValueRef = Module.eggShell.createValueRef(usernameTypeRef, usernameDataRef);
            var passwordValueRef = Module.eggShell.createValueRef(passwordTypeRef, passwordDataRef);
            var verifyServerValueRef = Module.eggShell.createValueRef(verifyServerTypeRef, verifyServerDataRef);
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);

            var setDefaultOutputs = function () {
                Module.eggShell.writeDouble(handleValueRef, DEFAULT_INVALID_HANDLE);
            };

            var newError;
            var cookieFile = Module.eggShell.readString(cookieFileValueRef);
            if (cookieFile !== '') {
                newError = {
                    status: true,
                    code: ERRORS.kNIHttpWebVICookieFileUnsupported.CODE,
                    source: Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpWebVICookieFileUnsupported.MESSAGE)
                };

                Module.coreHelpers.mergeErrors(errorValueRef, newError);
                setDefaultOutputs();
                return;
            }

            var verifyServer = Module.eggShell.readDouble(verifyServerValueRef) !== FALSE;
            if (verifyServer !== true) {
                newError = {
                    status: true,
                    code: ERRORS.kNIHttpWebVIVerifyServerUnsupported.CODE,
                    source: Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpWebVIVerifyServerUnsupported.MESSAGE)
                };

                Module.coreHelpers.mergeErrors(errorValueRef, newError);
                setDefaultOutputs();
                return;
            }

            var username = Module.eggShell.readString(usernameValueRef);
            var password = Module.eggShell.readString(passwordValueRef);
            var newHandle = httpClientManager.create(username, password);
            Module.eggShell.writeDouble(handleValueRef, newHandle);
        };

        Module.httpClient.jsHttpClientClose = function (
            handleTypeRef, handleDataRef,
            errorTypeRef, errorDataRef) {
            // This function should be called irregardless of an existing error to clean-up resources
            var newError;
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var handle = Module.eggShell.readDouble(handleValueRef);
            var handleExists = httpClientManager.get(handle) !== undefined;

            if (handleExists === false) {
                newError = {
                    status: true,
                    code: ERRORS.InvalidRefnum.CODE,
                    source: Module.coreHelpers.createSourceFromMessage(ERRORS.InvalidRefnum.MESSAGE)
                };

                Module.coreHelpers.mergeErrors(errorValueRef, newError);
                // Do not return if an error is written, need to still destroy any existing handles
            }

            // Always destroy the handle
            httpClientManager.destroy(handle);
        };

        Module.httpClient.jsHttpClientAddHeader = function (
            handleTypeRef, handleDataRef,
            headerTypeRef, headerDataRef,
            valueTypeRef, valueDataRef,
            errorTypeRef, errorDataRef) {
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var headerValueRef = Module.eggShell.createValueRef(headerTypeRef, headerDataRef);
            var valueValueRef = Module.eggShell.createValueRef(valueTypeRef, valueDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);

            var handle = Module.eggShell.readDouble(handleValueRef);
            var httpClient = findhttpClientOrWriteError(handle, errorValueRef);
            if (httpClient === undefined) {
                return;
            }

            var header = Module.eggShell.readString(headerValueRef);
            var value = Module.eggShell.readString(valueValueRef);
            httpClient.addHeader(header, value);
        };

        Module.httpClient.jsHttpClientRemoveHeader = function (
            handleTypeRef, handleDataRef,
            headerTypeRef, headerDataRef,
            errorTypeRef, errorDataRef) {
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var headerValueRef = Module.eggShell.createValueRef(headerTypeRef, headerDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var handle = Module.eggShell.readDouble(handleValueRef);
            var httpClient = findhttpClientOrWriteError(handle, errorValueRef);
            if (httpClient === undefined) {
                return;
            }

            var header = Module.eggShell.readString(headerValueRef);
            httpClient.removeHeader(header);
        };

        Module.httpClient.jsHttpClientGetHeader = function (
            handleTypeRef, handleDataRef,
            headerTypeRef, headerDataRef,
            valueTypeRef, valueDataRef,
            errorTypeRef, errorDataRef) {
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var headerValueRef = Module.eggShell.createValueRef(headerTypeRef, headerDataRef);
            var valueValueRef = Module.eggShell.createValueRef(valueTypeRef, valueDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var setDefaultOutputs = function () {
                Module.eggShell.writeString(valueValueRef, '');
            };
            var handle = Module.eggShell.readDouble(handleValueRef);
            var httpClient = findhttpClientOrWriteError(handle, errorValueRef);
            if (httpClient === undefined) {
                setDefaultOutputs();
                return;
            }

            var newError;
            var header = Module.eggShell.readString(headerValueRef);
            var value = httpClient.getHeaderValue(header);
            if (value === undefined) {
                newError = {
                    status: true,
                    code: ERRORS.kNIHttpResultRequestHeaderDoesNotExist.CODE,
                    source: Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpResultRequestHeaderDoesNotExist.MESSAGE + '\nheader:' + header)
                };

                Module.coreHelpers.mergeErrors(errorValueRef, newError);
                setDefaultOutputs();
                return;
            }

            Module.eggShell.writeString(valueValueRef, value);
        };

        Module.httpClient.jsHttpClientHeaderExists = function (
            handleTypeRef, handleDataRef,
            headerTypeRef, headerDataRef,
            headerExistsTypeRef, headerExistsDataRef,
            valueTypeRef, valueDataRef,
            errorTypeRef, errorDataRef) {
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var headerValueRef = Module.eggShell.createValueRef(headerTypeRef, headerDataRef);
            var headerExistsValueRef = Module.eggShell.createValueRef(headerExistsTypeRef, headerExistsDataRef);
            var valueValueRef = Module.eggShell.createValueRef(valueTypeRef, valueDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var setDefaultOutputs = function () {
                Module.eggShell.writeDouble(headerExistsValueRef, FALSE);
                Module.eggShell.writeString(valueValueRef, '');
            };
            var handle = Module.eggShell.readDouble(handleValueRef);
            var httpClient = findhttpClientOrWriteError(handle, errorValueRef);
            if (httpClient === undefined) {
                setDefaultOutputs();
                return;
            }

            var header = Module.eggShell.readString(headerValueRef);
            var valueOrUndefined = httpClient.getHeaderValue(header);
            var headerExists = valueOrUndefined !== undefined;
            if (headerExists === false) {
                setDefaultOutputs();
                return;
            }

            Module.eggShell.writeDouble(headerExistsValueRef, TRUE);
            Module.eggShell.writeString(valueValueRef, valueOrUndefined);
        };

        Module.httpClient.jsHttpClientListHeaders = function (
            handleTypeRef, handleDataRef,
            headerListTypeRef, headerListDataRef,
            errorTypeRef, errorDataRef) {
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var headerListValueRef = Module.eggShell.createValueRef(headerListTypeRef, headerListDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var setDefaultOutputs = function () {
                Module.eggShell.writeString(headerListValueRef, '');
            };
            var handle = Module.eggShell.readDouble(handleValueRef);
            var httpClient = findhttpClientOrWriteError(handle, errorValueRef);
            if (httpClient === undefined) {
                setDefaultOutputs();
                return;
            }

            var list = httpClient.listHeaders();
            Module.eggShell.writeString(headerListValueRef, list);
        };

        Module.httpClient.jsHttpClientMethod = function (
            methodId,
            handleTypeRef, handleDataRef,
            urlTypeRef, urlDataRef,
            outputFilePathTypeRef, outputFilePathDataRef,
            bufferTypeRef, bufferDataRef,
            timeoutTypeRef, timeoutDataRef,
            headersTypeRef, headersDataRef,
            bodyTypeRef, bodyDataRef,
            statusCodeTypeRef, statusCodeDataRef,
            errorTypeRef, errorDataRef,
            occurrencePointer) {
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var urlValueRef = Module.eggShell.createValueRef(urlTypeRef, urlDataRef);
            var outputFilePathValueRef = Module.eggShell.createValueRef(outputFilePathTypeRef, outputFilePathDataRef);
            var timeoutValueRef = Module.eggShell.createValueRef(timeoutTypeRef, timeoutDataRef);
            var headersValueRef = Module.eggShell.createValueRef(headersTypeRef, headersDataRef);
            var bodyValueRef = Module.eggShell.createValueRef(bodyTypeRef, bodyDataRef);
            var statusCodeValueRef = Module.eggShell.createValueRef(statusCodeTypeRef, statusCodeDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var handle = Module.eggShell.readDouble(handleValueRef);
            var setDefaultOutputs = function () {
                Module.eggShell.writeString(headersValueRef, '');
                Module.eggShell.writeDouble(statusCodeValueRef, 0);

                if (bodyValueRef !== undefined) {
                    Module.eggShell.writeString(bodyValueRef, '');
                }

                Module.eggShell.setOccurrenceAsync(occurrencePointer);
            };

            var newError;
            var method = METHOD_NAMES[methodId];

            // Nullable input parameters: handle, outputFile, buffer
            // Nullable output parameter: body

            var outputFile;
            if (outputFilePathValueRef !== undefined) {
                outputFile = Module.eggShell.readString(outputFilePathValueRef);

                if (outputFile !== '') {
                    newError = {
                        status: true,
                        code: ERRORS.kNIHttpWebVIOutputFileUnsupported.CODE,
                        source: Module.coreHelpers.createSourceFromMessage(ERRORS.kNIHttpWebVIOutputFileUnsupported.MESSAGE)
                    };

                    Module.coreHelpers.mergeErrors(errorValueRef, newError);
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
                    // TODO(mraj) would like to use the typed array in all browsers but not supported in iOS with XHR.send
                    // Blob type property not set to determine Content-Type for XHR as Edge seem to ignore it.
                    buffer = new Blob([typedArrayBuffer]);
                }
            }

            var httpClient;
            if (handle === NULL) {
                httpClient = httpClientManager.createHttpClientWithoutHandle('', '');
            } else {
                httpClient = findhttpClientOrWriteError(handle, errorValueRef);
                if (httpClient === undefined) {
                    setDefaultOutputs();
                    return;
                }
            }

            var xhrTimeout;
            var timeout;

            if (timeoutValueRef === undefined) {
                xhrTimeout = DEFAULT_TIMEOUT_MS;
            } else {
                timeout = Module.eggShell.readDouble(timeoutValueRef);

                // In LabVIEW timeout -1 means wait forever, in xhr timeout 0 means wait forever
                if (timeout < 0) {
                    xhrTimeout = 0;
                } else if (timeout === 0) {
                    xhrTimeout = TIMEOUT_IMMEDIATELY_MS;
                } else {
                    xhrTimeout = timeout;
                }
            }

            var url = Module.eggShell.readString(urlValueRef);
            var requestData = {
                method: method,
                url: url,
                xhrTimeout: xhrTimeout,
                buffer: buffer
            };

            httpClient.createRequest(requestData, function (responseData) {
                Module.eggShell.writeString(headersValueRef, responseData.header);
                Module.eggShell.writeDouble(statusCodeValueRef, responseData.status);

                if (bodyValueRef !== undefined) {
                    Module.eggShell.resizeArray(bodyValueRef, [responseData.body.length]);
                    Module.eggShell.writeTypedArray(bodyValueRef, responseData.body);
                }

                var errorMessage = Module.coreHelpers.formatMessageWithException(responseData.errorMessage, responseData.requestException);
                var newError = {
                    status: responseData.labviewCode !== ERRORS.NO_ERROR.CODE,
                    code: responseData.labviewCode,
                    source: Module.coreHelpers.createSourceFromMessage(errorMessage)
                };

                Module.coreHelpers.mergeErrors(errorValueRef, newError);
                Module.eggShell.setOccurrenceAsync(occurrencePointer);
            });
        };

        Module.httpClient.jsHttpClientConfigCORS = function (
            handleTypeRef, handleDataRef,
            includeCredentialsDuringCORSTypeRef, includeCredentialsDuringCORSDataRef,
            errorTypeRef, errorDataRef) {
            var handleValueRef = Module.eggShell.createValueRef(handleTypeRef, handleDataRef);
            var includeCredentialsDuringCORSValueRef = Module.eggShell.createValueRef(includeCredentialsDuringCORSTypeRef, includeCredentialsDuringCORSDataRef);
            var errorValueRef = Module.eggShell.createValueRef(errorTypeRef, errorDataRef);
            var handle = Module.eggShell.readDouble(handleValueRef);
            var includeCredentialsDuringCORS = Module.eggShell.readDouble(includeCredentialsDuringCORSValueRef) !== FALSE;
            var httpClient = findhttpClientOrWriteError(handle, errorValueRef);
            if (httpClient === undefined) {
                return;
            }
            httpClient.setIncludeCredentialsDuringCORS(includeCredentialsDuringCORS);
        };
    };
}());
export default assignHttpClient;
