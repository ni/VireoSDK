// Using a modified UMD module format. Specifically a modified returnExports (no dependencies) version
(function (root, globalName, factory) {
    'use strict';
    var buildGlobalNamespace = function () {
        var buildArgs = Array.prototype.slice.call(arguments);
        return globalName.split('.').reduce(function (currObj, subNamespace, currentIndex, globalNameParts) {
            var nextValue = currentIndex === globalNameParts.length - 1 ? factory.apply(undefined, buildArgs) : {};
            return currObj[subNamespace] === undefined ? currObj[subNamespace] = nextValue : currObj[subNamespace];
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
    // Static Private Variables (all vireo instances)
    var HttpUser;
    (function () {
        // Static private reference aliases
        // None

        // Constructor Function
        HttpUser = function (userName, password) {
            // Public Instance Properties
            this.userName = userName;
            this.password = password;
            this.headers = {};

            // Private Instance Properties
            // None
        };

        // Static Public Variables
        // None

        // Static Public Functions
        // None

        // Prototype creation
        var child = HttpUser;
        var proto = child.prototype;

        // Static Private Variables
        // None

        // Static Private Functions
        // None

        // Public Prototype Methods
        proto.setUserName = function (userName) {
            this.userName = userName;
        };

        proto.getUserName = function () {
            return this.userName;
        };

        proto.setPassword = function (password) {
            this.password = password;
        };

        proto.getPassword = function () {
            return this.password;
        };

        proto.addHeader = function (header, value) {
            this.headers[header] = value;
        };

        proto.removeHeader = function (header) {
            if (this.headers.hasOwnProperty(header)) {
                delete this.headers[header];
            }
        };

        proto.getHeaderValue = function (header) {
            if (this.headers.hasOwnProperty(header)) {
                return this.headers[header];
            } else {
                throw new Error('"' + header + '" is not included in the client handle.');
            }
        };

        proto.headerExist = function (header) {
            if (this.headers.hasOwnProperty(header)) {
                return true;
            }

            return false;
        };

        proto.listHeaders = function () {
            var outputHeaders = '';
            for (var header in this.headers) {
                if (this.headers.hasOwnProperty(header)) {
                    outputHeaders += header + ': ' + this.headers[header];
                    outputHeaders += '\r\n';
                }
            }

            return outputHeaders;
        };

        proto.getHeaders = function () {
            return this.headers;
        };
    }());

    var HttpUsers;
    (function () {
        // Static private reference aliases
        // None

        // Constructor Function
        HttpUsers = function () {
            // Public Instance Properties
            this.httpClients = {};
            this.debuggingEnabled = false;

            // Private Instance Properties
            // None
        };

        // Static Public Variables
        // None

        // Static Public Functions
        // None

        // Prototype creation
        var child = HttpUsers;
        var proto = child.prototype;

        // Static Private Variables
        // None

        // Static Private Functions
        // None

        // Public Prototype Methods
        proto.enableHttpDebugging = function (enable) {
            this.debuggingEnabled = enable;
        };

        proto.log = function (message) {
            if (this.debuggingEnabled) {
                console.log(message);
            }
        };

        proto.add = function (userName, password) {
            var httpUser = new HttpUser(userName, password);
            var handle = Object.keys(this.httpClients).length + 1;
            var strHandle = handle.toString();
            this.httpClients[strHandle] = httpUser;
            this.log('Created handle(' + handle + ') for user: "' + userName + '".');
            return handle;
        };

        proto.remove = function (handle) {
            var strHandle = handle.toString();
            if (this.httpClients.hasOwnProperty(strHandle)) {
                var user = this.httpClients[strHandle];
                this.log('Deleted handle(' + strHandle + ') for user: "' + user.getUserName() + '".');
                delete this.httpClients[strHandle];
            } else {
                throw new Error('Unknown handle(' + handle + ').');
            }
        };

        proto.get = function (handle) {
            var strHandle = handle.toString();
            if (this.httpClients.hasOwnProperty(strHandle)) {
                var user = this.httpClients[strHandle];
                this.log('The following handle(' + strHandle + ') was requested for: "' + user.getUserName() + '".');
                return user;
            } else {
                return null;
            }
        };

        proto.addHeader = function (handle, header, value) {
            var user = this.get (handle);
            if (user instanceof HttpUser) {
                user.addHeader (header, value);
                this.log('The following header was added: ' + header + '(' + value + ') for user: "' + user.getUserName() + '".');
            } else {
                throw new Error('Unknown handle(' + handle + ').');
            }
        };

        proto.removeHeader = function (handle, header) {
            var user = this.get (handle);
            if (user instanceof HttpUser) {
                user.removeHeader (header);
                this.log('The following header was removed: ' + header);
            } else {
                throw new Error('Unknown handle(' + handle + ').');
            }
        };

        proto.getHeaderValue = function (handle, header) {
            var user = this.get (handle);
            if (user instanceof HttpUser) {
                var value = user.getHeaderValue (header);
                this.log('The following value was returned: "' + value + '" for header: "' + header + '".');
                return value;
            } else {
                throw new Error('Unknown handle(' + handle + ').');
            }
        };

        proto.headerExist = function (handle, header) {
            var user = this.get (handle);
            if (user instanceof HttpUser) {
                var exist = user.headerExist (header);
                this.log('The following headerExist value was returned: "' + exist + '" for header: "' + header + '".');
                return exist;
            } else {
                throw new Error('Unknown handle(' + handle + ').');
            }
        };

        proto.listHeaders = function (handle) {
            var user = this.get (handle);
            if (user instanceof HttpUser) {
                var value = user.listHeaders ();
                this.log('The following list of headers was returned: "' + value + '".');
                return value;
            } else {
                throw new Error('Unknown handle(' + handle + ').');
            }
        };
    }());

    // Vireo Core Mixin Function
    var assignHttpClient = function (vireoCore) {
        var PUBLIC_HTTP_CLIENT = vireoCore.publicAPI.httpClient = {};
        var Module = vireoCore.Module;
        Module.httpClient = {};

        // Private Instance Variables (per vireo instance)
        var httpUsers = new HttpUsers();

        // Exported functions
        PUBLIC_HTTP_CLIENT.enableHttpDebugging = function (enable) {
            if (typeof enable !== 'boolean') {
                throw new Error('Must set HTTP debugging flag to either true or false');
            }

            httpUsers.enableHttpDebugging(true);
        };

        Module.httpClient.jsHttpClientOpen = function (cookieFileStart, cookieFileLength, userNameStart, userNameLength, passwordStart, passwordLength, verifyServer, userHandlePointer, errorMessage) {
            //var cookieFile = Module.Pointer_stringify(cookieFileStart, cookieFileLength);
            var userName = Module.Pointer_stringify(userNameStart, userNameLength);
            var password = Module.Pointer_stringify(passwordStart, passwordLength);
            var userHandle = 0;
            var returnValue = 0;
            var errorString = '';
            try {
                userHandle = httpUsers.add(userName, password);
            } catch (error) {
                userHandle = 0;
                returnValue = -1;
                errorString = 'Unable to open HTTP handle: ' + error.message;
            }

            Module.eggShell.dataWriteUInt32(userHandlePointer, userHandle);
            Module.eggShell.dataWriteString(errorMessage, errorString, errorString.length);
            return returnValue;
        };

        Module.httpClient.jsHttpClientClose = function (userHandle, errorMessage) {
            var returnValue = 0;
            var errorString = '';
            try {
                httpUsers.remove(userHandle);
            } catch (error) {
                returnValue = -1;
                errorString = 'Unable to close HTTP handle: ' + error.message;
            }

            Module.eggShell.dataWriteString(errorMessage, errorString, errorString.length);
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

            Module.eggShell.dataWriteString(errorMessage, errorString, errorString.length);
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

            Module.eggShell.dataWriteString(errorMessage, errorString, errorString.length);
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

            Module.eggShell.dataWriteString(value, valueText, valueText.length);
            Module.eggShell.dataWriteString(errorMessage, errorString, errorString.length);
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
            Module.eggShell.dataWriteString(errorMessage, errorString, errorString.length);
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

            Module.eggShell.dataWriteString(list, listText, listText.length);
            Module.eggShell.dataWriteString(errorMessage, errorString, errorString.length);
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
                    //console.log(fullErrorText);
                }

                Module.eggShell.dataWriteInt32(errorCodePointer, errorCode);
                Module.eggShell.dataWriteString(errorMessage, fullErrorText, fullErrorText.length);
                Module.eggShell.setOccurrence(occurrenceRef);
                if (!occurrenceHasBeenSet) {
                    occurrenceHasBeenSet = true;
                    Module.eggShell.setOccurrence(occurrenceRef);
                }
            };

            try {
                //NationalInstruments.Vireo.makeRequest(userHandle, methodName, urlString, timeOut, bufferString, successCallback, errorCallback, timeOutCallback);
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

                request.onreadystatechange = function (/*event*/) {
                    if (request.readyState === 4) {
                        if (request.status === 200) {
                            // Success!
                            // var errorString = '';
                            var headersText = request.getAllResponseHeaders();
                            var bodyText = request.responseText;

                            Module.eggShell.dataWriteString(headers, headersText, headersText.length);
                            if (body) {
                                Module.eggShell.dataWriteString(body, bodyText, bodyText.length);
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

                request.ontimeout = function (/*event*/) {
                    setErrorAndOccurrence(-1, methodName, 'The time out value of ' + timeOut + ' was exceeded.');
                };

                if (bufferString === undefined) {
                    request.send();
                } else {
                    request.send(bufferString);
                }
            }
            catch (error) {
                setErrorAndOccurrence(-1, methodName, error.message);
            }
        };

    };

    return assignHttpClient;
}));
