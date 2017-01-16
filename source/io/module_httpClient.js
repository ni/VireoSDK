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

    var CODES = {
        NO_ERROR: 0,
        INVALID_HANDLE: -1967362020,
        TIMEOUT: -12345,
        ABORT: -12345,
        NETWORK_ERROR: -12345
    };

    var HttpClient;
    (function () {
        // Static private reference aliases
        // None

        // Constructor Function
        HttpClient = function (username, password) {
            // Public Instance Properties
            // None

            // Private Instance Properties
            this._username = username;
            this._password = password;
            this._headers = new Map();
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

        proto.headerExists = function (header) {
            return this._headers.has(header);
        };

        proto.listHeaders = function () {
            var outputHeaders = [];

            this._headers.forEach(function (header, value) {
                outputHeaders.push(header.trim() + ': ' + value.trim());
            });

            // Avoid a trailing \r\n append
            return outputHeaders.join('\r\n');
        };

        proto.createRequest = function (requestData, cb) {
            var request = new XMLHttpRequest();

            // withCredentials allows cookies (to be sent / set), HTTP Auth, and TLS Client certs when sending requests Cross Origin
            request.withCredentials = true;

            // TODO mraj attempt to use 'ArrayBuffer' for the transfer type to get binary data
            request.responseType = 'text';

            request.timeout = requestData.xhrTimeout;

            // Create event listeners
            var eventListeners = {};

            var completeRequest = function (header, text, labviewCode, errorMessage) {
                // Unregister event listeners
                Object.keys(eventListeners).forEach(function (eventName) {
                    request.removeEventListener(eventName, eventListeners[eventName]);
                });

                var responseData = {
                    header: header,
                    text: text,
                    labviewCode: labviewCode,
                    errorMessage: errorMessage
                };

                cb(responseData);
            };

            eventListeners.load = function () {
                // TODO mraj is there a way to get the HTTP version from the request?
                var httpVersion = 'HTTP/1.1';
                var statusLine = httpVersion + ' ' + request.status + ' ' + request.statusText + '\r\n';
                var allResponseHeaders = request.getAllResponseHeaders();

                var header = statusLine + allResponseHeaders;
                var text = request.response;

                completeRequest(header, text, CODES.NO_ERROR, '');
            };

            eventListeners.error = function () {
                completeRequest('', '', CODES.NETWORK_ERROR, 'Network Error');
            };

            eventListeners.timeout = function () {
                completeRequest('', '', CODES.TIMEOUT, 'Timeout');
            };

            eventListeners.abort = function () {
                completeRequest('', '', CODES.ABORT, 'Request Aborted');
            };

            // Register event listeners
            Object.keys(eventListeners).forEach(function (eventName) {
                request.addEventListener(eventName, eventListeners[eventName]);
            });

            // Add request headers
            this._headers.forEach(function (header, value) {
                request.setRequestHeader(header, value);
            });

            // Open and send the request
            request.open(requestData.method, requestData.url, true, this._username, this._password);

            if (requestData.buffer === undefined) {
                request.send();
            } else {
                request.send(requestData.buffer);
            }
        };
    }());

    var HttpClientManager;
    (function () {
        // Static private reference aliases
        var noop = function () {
            // Intentionally left blank
        };

        // Constructor Function
        HttpClientManager = function () {
            // Public Instance Properties
            // None

            // Private Instance Properties
            this._httpClients = new Map();
            this._log = noop;
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
        proto.enableHttpDebugging = function (enable) {
            this._log = enable ? console.info.bind(console) : noop;
        };

        proto.create = function (username, password) {
            var httpClient = new HttpClient(username, password);
            var handle = createHandle();

            this._httpClients.set(handle, httpClient);
            this._log('[HTTPClient] Created handle:', handle);
            return handle;
        };

        proto.handleExists = function (handle) {
            return this._httpClients.has(handle);
        };

        proto.destroy = function (handle) {
            var httpClient = this._httpClients.get(handle);
            if (httpClient === undefined) {
                return;
            }

            this._httpClients.delete(handle);
            this._log('[HTTPClient] Deleted handle:', handle);
        };

        proto.get = function (handle) {
            return this._httpClients.get(handle);
        };
    }());

    // Vireo Core Mixin Function
    var assignHttpClient = function (Module, publicAPI) {
        Module.httpClient = {};
        publicAPI.httpClient = {};

        // Private Instance Variables (per vireo instance)
        var httpClientManager = new HttpClientManager();

        var METHOD_NAMES = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'];

        // TODO mraj switch to this after error handling corrected
        // var findhttpClientOrWriteError = function (handle, sourceIfError, statusPointer, codePointer, sourcePointer) {
        //     var httpClient = httpClientManager.get(handle);

        //     if (httpClient === undefined) {
        //         Module.eggShell.dataWriteUInt32(statusPointer, TRUE);
        //         Module.eggShell.dataWriteUInt32(codePointer, CODES.INVALID_HANDLE);
        //         Module.eggShell.dataWriteString(sourcePointer, potentialSourceMessage);
        //     }

        //     return httpClient;
        // };

        var findhttpClientOrWriteError = function (handle, errorSourceIfError) {
            // statusPointer unused
            var errorCode = 0;
            var errorSource = '';
            var httpClient = httpClientManager.get(handle);

            if (httpClient === undefined) {
                errorCode = CODES.INVALID_HANDLE;
                errorSource = errorSourceIfError + ', Handle Not Found';
            }

            return {
                httpClient: httpClient,
                code: errorCode,
                source: errorSource
            };
        };

        // Exported functions
        publicAPI.httpClient.enableHttpDebugging = function (enable) {
            if (typeof enable !== 'boolean') {
                throw new Error('Must set HTTP debugging flag to either true or false');
            }

            httpClientManager.enableHttpDebugging(enable);
        };

        Module.httpClient.jsHttpClientOpen = function (cookieFilePointer, usernamePointer, passwordPointer, verifyServer, handlePointer, errorSourcePointer) {
            var username = Module.eggShell.dataReadString(usernamePointer);
            var password = Module.eggShell.dataReadString(passwordPointer);
            var returnValue = CODES.NO_ERROR;
            var errorString = '';

            // TODO mraj if error in then return handle as 0, error passthrough
            var handle = httpClientManager.create(username, password);

            Module.eggShell.dataWriteUInt32(handlePointer, handle);
            Module.eggShell.dataWriteString(errorSourcePointer, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientClose = function (handle, errorMessage) {
            var returnValue = CODES.NO_ERROR;
            var errorString = '';

            // TODO mraj check if handle exists
            // if error and exists, close handle and pass error through
            // if error and no exists, pass error through
            // if no error and exists, close handle
            // if no error and no exists, error -1967362020
            httpClientManager.destroy(handle);

            Module.eggShell.dataWriteString(errorMessage, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientAddHeader = function (handle, headerPointer, valuePointer, errorSourcePointer) {
            var header = Module.eggShell.dataReadString(headerPointer);
            var value = Module.eggShell.dataReadString(valuePointer);
            var returnValue = CODES.NO_ERROR;
            var errorString = '';

            var results = findhttpClientOrWriteError(handle, 'LabVIEWHTTPClient:AddHeader');
            var httpClient = results.httpClient;

            if (httpClient === undefined) {
                returnValue = results.code;
                errorString = results.source;
            } else {
                httpClient.addHeader(header, value);
            }

            Module.eggShell.dataWriteString(errorSourcePointer, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientRemoveHeader = function (handle, headerPointer, errorSourcePointer) {
            var header = Module.eggShell.dataReadString(headerPointer);
            var returnValue = CODES.NO_ERROR;
            var errorString = '';

            var results = findhttpClientOrWriteError(handle, 'LabVIEWHTTPClient:RemoveHeader');
            var httpClient = results.httpClient;

            if (httpClient === undefined) {
                returnValue = results.code;
                errorString = results.source;
            } else {
                httpClient.removeHeader(handle, header);
            }

            Module.eggShell.dataWriteString(errorSourcePointer, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientGetHeader = function (handle, headerPointer, value, errorSourcePointer) {
            var header = Module.eggShell.dataReadString(headerPointer);
            var valueText = '';
            var returnValue = CODES.NO_ERROR;
            var errorString = '';

            var results = findhttpClientOrWriteError(handle, 'LabVIEWHTTPClient:GetHeader');
            var httpClient = results.httpClient;

            if (httpClient === undefined) {
                returnValue = results.code;
                errorString = results.source;
            } else {
                valueText = httpClient.getHeaderValue(handle, header);
            }

            Module.eggShell.dataWriteString(value, valueText);
            Module.eggShell.dataWriteString(errorSourcePointer, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientHeaderExists = function (handle, headerPointer, headerExistPointer, errorSourcePointer) {
            var header = Module.eggShell.dataReadString(headerPointer);
            var headerExist = false;
            var returnValue = CODES.NO_ERROR;
            var errorString = '';

            var results = findhttpClientOrWriteError(handle, 'LabVIEWHTTPClient:HeaderExist');
            var httpClient = results.httpClient;

            if (httpClient === undefined) {
                returnValue = results.code;
                errorString = results.source;
            } else {
                headerExist = httpClient.headerExist(handle, header);
            }

            Module.eggShell.dataWriteUInt32(headerExistPointer, headerExist ? TRUE : FALSE);
            Module.eggShell.dataWriteString(errorSourcePointer, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientListHeaders = function (handle, list, errorSourcePointer) {
            var listText = '';
            var returnValue = CODES.NO_ERROR;
            var errorString = '';

            var results = findhttpClientOrWriteError(handle, 'LabVIEWHTTPClient:ListHeaders');
            var httpClient = results.httpClient;

            if (httpClient === undefined) {
                returnValue = results.code;
                errorString = results.source;
            } else {
                listText = httpClient.listHeaders(handle);
            }

            Module.eggShell.dataWriteString(list, listText);
            Module.eggShell.dataWriteString(errorSourcePointer, errorString);
            return returnValue;
        };

        var setOccurenceAndError = function (errorCode, errorSource, errorCodePointer, errorSourcePointer, occurrencePointer) {
            // TODO mraj, check codePointer for any existing error, dont override existing error

            // TODO mraj, check status and code pointer to implement the merge errors behavior https://zone.ni.com/reference/en-XX/help/371361H-01/glang/merge_errors_function/
            // ie error overrides warning, but error does not override error, and warning does not override warning?
            if (errorCode !== CODES.NO_ERROR) {
                Module.eggShell.dataWriteInt32(errorCodePointer, errorCode);
                Module.eggShell.dataWriteString(errorSourcePointer, errorSource);
            }

            // Regardless of error set the occurrence
            Module.eggShell.setOccurrence(occurrencePointer);
        };

        Module.httpClient.jsHttpClientMethod = function (methodId, handle, urlPointer, outputFilePointer, bufferPointer, timeout, headersPointer, bodyPointer, codePointer, sourcePointer, occurrencePointer) {
            var method = METHOD_NAMES[methodId];
            var url = Module.eggShell.dataReadString(urlPointer);

            // Nullable input parameters: handle, outputFile, buffer
            // Nullable output parameter: body

            var outputFile;
            if (outputFilePointer !== NULL) {
                outputFile = Module.eggShell.dataReadString(outputFilePointer);

                if (outputFile !== '') {
                    setOccurenceAndError(-1, 'LabVIEWHTTPClient:' + method + ', outputFile is not a supported feature', codePointer, sourcePointer, occurrencePointer);
                    return;
                }
            }

            var buffer;
            if (bufferPointer !== NULL) {
                buffer = Module.eggShell.dataReadString(bufferPointer);
            }

            var httpClient, results;
            if (handle === NULL) {
                httpClient = new HttpClient('', '');
            } else {
                results = findhttpClientOrWriteError(handle, 'LabVIEWHTTPClient:' + method);
                httpClient = results.httpClient;

                if (httpClient === undefined) {
                    setOccurenceAndError(results.code, results.source, codePointer, sourcePointer, occurrencePointer);
                    return;
                }
            }

            // In LabVIEW timeout -1 means wait forever, in xhr timeout 0 means wait forever
            // TODO mraj check if functions can have default values. Until then assume 0 was meant to be the default 10000
            // Vireo does have a concept of unwired values, have to use _ParamPointer and check if it is null
            // then in viaCode a * is used for unwired values
            var xhrTimeout;

            if (timeout < 0) {
                xhrTimeout = 0;
            } else if (timeout === 0) {
                xhrTimeout = 10000;
            } else {
                xhrTimeout = timeout;
            }

            var requestData = {
                method: method,
                url: url,
                xhrTimeout: xhrTimeout,
                buffer: buffer
            };

            httpClient.createRequest(requestData, function (responseData) {
                Module.eggShell.dataWriteString(headersPointer, responseData.header);

                if (bodyPointer !== NULL) {
                    Module.eggShell.dataWriteString(bodyPointer, responseData.text);
                }

                setOccurenceAndError(responseData.labviewCode, 'LabVIEWHTTPClient:' + method + ', ' + responseData.errorMessage, codePointer, sourcePointer, occurrencePointer);
            });
        };
    };

    return assignHttpClient;
}));
