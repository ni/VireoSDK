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
        Object.defineProperty(proto, 'username', {
            get: function () {
                return this._username;
            }
        });

        Object.defineProperty(proto, 'password', {
            get: function () {
                return this._password;
            }
        });

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
            return this._headers.ha(header);
        };

        proto.listHeaders = function () {
            var outputHeaders = [];

            this._headers.forEach(function (header, value) {
                outputHeaders.push(header.trim() + ': ' + value.trim());
            });

            return outputHeaders.join('\r\n');
        };

        // // Iterates across the headers cb(header, value)
        // proto.forEachHeader = function (cb) {
        //     this._headers.forEach(cb);
        // };
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

        // Exported functions
        publicAPI.httpClient.enableHttpDebugging = function (enable) {
            if (typeof enable !== 'boolean') {
                throw new Error('Must set HTTP debugging flag to either true or false');
            }

            httpClientManager.enableHttpDebugging(enable);
        };

        Module.httpClient.jsHttpClientOpen = function (cookieFileStart, cookieFileLength, usernameStart, usernameLength, passwordStart, passwordLength, verifyServer, handlePointer, errorMessage) {
            var username = Module.Pointer_stringify(usernameStart, usernameLength);
            var password = Module.Pointer_stringify(passwordStart, passwordLength);
            var returnValue = 0;
            var errorString = '';

            // TODO mraj if error in then return handle as 0, error passthrough
            var handle = httpClientManager.create(username, password);

            Module.eggShell.dataWriteUInt32(handlePointer, handle);
            Module.eggShell.dataWriteString(errorMessage, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientClose = function (handle, errorMessage) {
            var returnValue = 0;
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

        Module.httpClient.jsHttpClientAddHeader = function (userHandle, headerStart, headerLength, valueStart, valueLength, errorMessage) {
            var header = Module.Pointer_stringify(headerStart, headerLength);
            var value = Module.Pointer_stringify(valueStart, valueLength);
            var returnValue = 0;
            var errorString = '';
            try {
                httpUsers.addHeader(userHandle, header, value);
            } catch (error) {
                returnValue = -1;
                errorString = 'Unable to add header to HTTP handle: ' + error.message;
            }

            Module.eggShell.dataWriteString(errorMessage, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientRemoveHeader = function (userHandle, headerStart, headerLength, errorMessage) {
            var header = Module.Pointer_stringify(headerStart, headerLength);
            var returnValue = 0;
            var errorString = '';
            try {
                httpUsers.removeHeader(userHandle, header);
            } catch (error) {
                returnValue = -1;
                errorString = 'Unable to remove header from HTTP handle: ' + error.message;
            }

            Module.eggShell.dataWriteString(errorMessage, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientGetHeader = function (userHandle, headerStart, headerLength, value, errorMessage) {
            var header = Module.Pointer_stringify(headerStart, headerLength);
            var valueText = '';
            var returnValue = 0;
            var errorString = '';
            try {
                valueText = httpUsers.getHeaderValue(userHandle, header);
            } catch (error) {
                valueText = '';
                returnValue = -1;
                errorString = 'Unable to get header value from HTTP handle: ' + error.message;
            }

            Module.eggShell.dataWriteString(value, valueText);
            Module.eggShell.dataWriteString(errorMessage, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientHeaderExist = function (userHandle, headerStart, headerLength, headerExistPointer, errorMessage) {
            var header = Module.Pointer_stringify(headerStart, headerLength);
            var headerExist = false;
            var returnValue = 0;
            var errorString = '';
            try {
                headerExist = httpUsers.headerExist(userHandle, header);
            } catch (error) {
                headerExist = false;
                returnValue = -1;
                errorString = 'Unable to verify if header exists in HTTP handle: ' + error.message;
            }

            Module.eggShell.dataWriteUInt32(headerExistPointer, headerExist ? 1 : 0);
            Module.eggShell.dataWriteString(errorMessage, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientListHeaders = function (userHandle, list, errorMessage) {
            var listText = '';
            var returnValue = 0;
            var errorString = '';
            try {
                listText = httpUsers.listHeaders(userHandle);
            } catch (error) {
                listText = '';
                returnValue = -1;
                errorString = 'Unable to list headers for HTTP handle: ' + error.message;
            }

            Module.eggShell.dataWriteString(list, listText);
            Module.eggShell.dataWriteString(errorMessage, errorString);
            return returnValue;
        };

        Module.httpClient.jsHttpClientMethod = function (methodId, userHandle, url, urlLength, outputFileStart, outputFileLength, buffer, bufferLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
            var methodNames = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'];
            var methodName = methodNames[methodId];

            // Setup parameters
            var urlString = Module.Pointer_stringify(url, urlLength);
            // var outputFile = Module.Pointer_stringify(outputFileStart, outputFileLength);
            var bufferString;
            if (buffer) {
                bufferString = Module.Pointer_stringify(buffer, bufferLength);
            }

            var occurrenceHasBeenSet = false;
            var setErrorAndOccurrence = function (errorCode, operation, additionalErrorText) {
                var fullErrorText = '';
                if (errorCode !== 0) {
                    fullErrorText = 'Unable to complete ' + operation + ' operation. Look at your browser console log for more details : ' + additionalErrorText;
                    // console.log(fullErrorText);
                }

                Module.eggShell.dataWriteInt32(errorCodePointer, errorCode);
                Module.eggShell.dataWriteString(errorMessage, fullErrorText);
                Module.eggShell.setOccurrence(occurrenceRef);
                if (!occurrenceHasBeenSet) {
                    occurrenceHasBeenSet = true;
                    Module.eggShell.setOccurrence(occurrenceRef);
                }
            };

            try {
                var httpUser = httpUsers.get(userHandle);

                var request = new XMLHttpRequest();
                request.open(methodName, urlString);
                request.timeout = timeOut;

                // Set the headers
                if (httpUser instanceof HttpUser) {
                    var allHeaders = httpUser.getHeaders();
                    for (var key in allHeaders) {
                        if (allHeaders.hasOwnProperty(key)) {
                            request.setRequestHeader(key, allHeaders[key]);
                        }
                    }
                }

                request.onreadystatechange = function (/* event*/) {
                    if (request.readyState === 4) {
                        if (request.status === 200) {
                            // Success!
                            // var errorString = '';
                            var headersText = request.getAllResponseHeaders();
                            var bodyText = request.responseText;

                            Module.eggShell.dataWriteString(headers, headersText);
                            if (body) {
                                Module.eggShell.dataWriteString(body, bodyText);
                            }

                            setErrorAndOccurrence(0, '');
                        } else {
                            setErrorAndOccurrence(-1, methodName, request.statusText + '(' + request.status + ').');
                        }
                    }
                };

                request.onerror = function (event) {
                    setErrorAndOccurrence(-1, methodName, event.target.statusText + '(' + event.target.status + ').');
                };

                request.ontimeout = function (/* event*/) {
                    setErrorAndOccurrence(-1, methodName, 'The time out value of ' + timeOut + ' was exceeded.');
                };

                if (bufferString === undefined) {
                    request.send();
                } else {
                    request.send(bufferString);
                }
            } catch (error) {
                setErrorAndOccurrence(-1, methodName, error.message);
            }
        };
    };

    return assignHttpClient;
}));
