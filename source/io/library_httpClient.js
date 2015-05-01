
var HttpClient =
{
    jsHttpClientOpen: function (cookieFile, cookieFileLength, userName, userNameLength, password, passwordLength, verifyServer, userHandlePointer, errorMessage) {
        return NationalInstruments.Vireo.addHttpUser(userHandlePointer, Pointer_stringify(userName, userNameLength), Pointer_stringify(password, passwordLength), errorMessage);
    },

    jsHttpClientClose: function (userHandle, errorMessage) {
        return NationalInstruments.Vireo.removeHttpUser(userHandle, errorMessage);
    },

    jsHttpClientAddHeader: function (userHandle, header, headerLength, value, valueLength, errorMessage) {
        return NationalInstruments.Vireo.addHeader(userHandle, Pointer_stringify(header, headerLength), Pointer_stringify(value, valueLength), errorMessage);
    },

    jsHttpClientRemoveHeader: function (userHandle, header, headerLength, errorMessage) {
        return NationalInstruments.Vireo.removeHeader(userHandle, Pointer_stringify(header, headerLength), errorMessage);
    },

    jsHttpClientGetHeader: function (userHandle, header, headerLength, value, errorMessage) {
        return NationalInstruments.Vireo.getHeaderValue(userHandle, Pointer_stringify(header, headerLength), value, errorMessage);
    },

    jsHttpClientHeaderExist: function (userHandle, header, headerLength, headerExistPointer, errorMessage) {
        return NationalInstruments.Vireo.headerExist(userHandle, Pointer_stringify(header, headerLength), headerExistPointer, errorMessage);
    },

    jsHttpClientListHeaders: function (userHandle, list, errorMessage) {
        return NationalInstruments.Vireo.listHeaders(userHandle, list, errorMessage);
    },

    jsHttpClientGet: function (userHandle, url, urlLength, outputFile, outputFileLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
        var occurrenceHasBeenSet = false;
        function setErrorAndOccurrence(errorCode, operation, additionalErrorText) {
            var fullErrorText = '';
            if (errorCode !== 0) {
                fullErrorText = 'Unable to complete ' + operation + ' operation. Look at your browser console log for more details : ' + additionalErrorText;
            }
            NationalInstruments.Vireo.dataWriteInt32(errorCodePointer, errorCode);
            NationalInstruments.Vireo.dataWriteString(errorMessage, fullErrorText, fullErrorText.length);
            NationalInstruments.Vireo.setOccurence(occurrenceRef);
            if (!occurrenceHasBeenSet) {
                occurrenceHasBeenSet = true;
                NationalInstruments.Vireo.setOccurence(occurrenceRef);
            }
        };

        var successCallback = function (request) {
            var headersText = request.getAllResponseHeaders();
            var bodyText = request.responseText;

            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            setErrorAndOccurrence(0, '');
        };
        var errorCallback = function (status, statusText) {
            setErrorAndOccurrence(-1, 'GET', statusText + '(' + status + ').');
        };
        var timeOutCallback = function (request) {
            setErrorAndOccurrence(-1, 'GET', 'The time out value of ' + timeOut + ' was exceeded.');
        };

        try
        {
            NationalInstruments.Vireo.makeRequest(userHandle, 'GET', Pointer_stringify(url, urlLength), timeOut, undefined, successCallback, errorCallback, timeOutCallback);
        }
        catch (error)
        {
            setErrorAndOccurrence(-1, 'GET', error.message);
        }
    },

    jsHttpClientHead: function (userHandle, url, urlLength, timeOut, headers, errorCodePointer, errorMessage, occurrenceRef) {
        var occurrenceHasBeenSet = false;
        function setErrorAndOccurrence(errorCode, operation, additionalErrorText) {
            var fullErrorText = '';
            if (errorCode !== 0) {
                fullErrorText = 'Unable to complete ' + operation + ' operation. Look at your browser console log for more details : ' + additionalErrorText;
            }
            NationalInstruments.Vireo.dataWriteInt32(errorCodePointer, errorCode);
            NationalInstruments.Vireo.dataWriteString(errorMessage, fullErrorText, fullErrorText.length);
            NationalInstruments.Vireo.setOccurence(occurrenceRef);
            if (!occurrenceHasBeenSet) {
                occurrenceHasBeenSet = true;
                NationalInstruments.Vireo.setOccurence(occurrenceRef);
            }
        };

        var successCallback = function (request) {
            var errorString = '';
            var headersText = request.getAllResponseHeaders();

            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);
            setErrorAndOccurrence(0, '');
        };
        var errorCallback = function (status, statusText) {
            setErrorAndOccurrence(-1, 'HEAD', statusText + '(' + status + ').');
        };
        var timeOutCallback = function (request) {
            setErrorAndOccurrence(-1, 'HEAD', 'The time out value of ' + timeOut + ' was exceeded.');
        };

        try {
            NationalInstruments.Vireo.makeRequest(userHandle, 'HEAD', Pointer_stringify(url, urlLength), timeOut, undefined, successCallback, errorCallback, timeOutCallback);
        }
        catch (error) {
            setErrorAndOccurrence(-1, 'HEAD', error.message);
        }
    },

    jsHttpClientPutBuffer: function (userHandle, url, urlLength, outputFile, outputFileLength, buffer, bufferLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
        var occurrenceHasBeenSet = false;
        function setErrorAndOccurrence(errorCode, operation, additionalErrorText) {
            var fullErrorText = '';
            if (errorCode !== 0) {
                fullErrorText = 'Unable to complete ' + operation + ' operation. Look at your browser console log for more details : ' + additionalErrorText;
            }
            NationalInstruments.Vireo.dataWriteInt32(errorCodePointer, errorCode);
            NationalInstruments.Vireo.dataWriteString(errorMessage, fullErrorText, fullErrorText.length);
            NationalInstruments.Vireo.setOccurence(occurrenceRef);
            if (!occurrenceHasBeenSet) {
                occurrenceHasBeenSet = true;
                NationalInstruments.Vireo.setOccurence(occurrenceRef);
            }
        };

        var successCallback = function (request) {
            var errorString = '';
            var headersText = request.getAllResponseHeaders();
            var bodyText = request.responseText;

            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            setErrorAndOccurrence(0, '');
        };
        var errorCallback = function (status, statusText) {
            setErrorAndOccurrence(-1, 'PUT', statusText + '(' + status + ').');
        };
        var timeOutCallback = function (request) {
            setErrorAndOccurrence(-1, 'PUT', 'The time out value of ' + timeOut + ' was exceeded.');
        };

        try {
            NationalInstruments.Vireo.makeRequest(userHandle, 'PUT', Pointer_stringify(url, urlLength), timeOut, Pointer_stringify(buffer, bufferLength), successCallback, errorCallback, timeOutCallback);
        }
        catch (error) {
            setErrorAndOccurrence(-1, 'PUT', error.message);
        }
    },

    jsHttpClientDelete: function (userHandle, url, urlLength, outputFile, outputFileLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
        var occurrenceHasBeenSet = false;
        function setErrorAndOccurrence(errorCode, operation, additionalErrorText) {
            var fullErrorText = '';
            if (errorCode !== 0) {
                fullErrorText = 'Unable to complete ' + operation + ' operation. Look at your browser console log for more details : ' + additionalErrorText;
            }
            NationalInstruments.Vireo.dataWriteInt32(errorCodePointer, errorCode);
            NationalInstruments.Vireo.dataWriteString(errorMessage, fullErrorText, fullErrorText.length);
            NationalInstruments.Vireo.setOccurence(occurrenceRef);
            if (!occurrenceHasBeenSet) {
                occurrenceHasBeenSet = true;
                NationalInstruments.Vireo.setOccurence(occurrenceRef);
            }
        };

        var successCallback = function (request) {
            var errorString = '';
            var headersText = request.getAllResponseHeaders();
            var bodyText = request.responseText;

            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            setErrorAndOccurrence(0, '');
        };
        var errorCallback = function (status, statusText) {
            setErrorAndOccurrence(-1, 'DELETE', statusText + '(' + status + ').');
        };
        var timeOutCallback = function (request) {
            setErrorAndOccurrence(-1, 'DELETE', 'The time out value of ' + timeOut + ' was exceeded.');
        };

        try {
            NationalInstruments.Vireo.makeRequest(userHandle, 'DELETE', Pointer_stringify(url, urlLength), timeOut, undefined, successCallback, errorCallback, timeOutCallback);
        }
        catch (error) {
            setErrorAndOccurrence(-1, 'DELETE', error.message);
        }
    },

    jsHttpClientPostBuffer: function (userHandle, url, urlLength, outputFile, outputFileLength, buffer, bufferLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
        var occurrenceHasBeenSet = false;
        function setErrorAndOccurrence(errorCode, operation, additionalErrorText) {
            var fullErrorText = '';
            if (errorCode !== 0) {
                fullErrorText = 'Unable to complete ' + operation + ' operation. Look at your browser console log for more details : ' + additionalErrorText;
            }
            NationalInstruments.Vireo.dataWriteInt32(errorCodePointer, errorCode);
            NationalInstruments.Vireo.dataWriteString(errorMessage, fullErrorText, fullErrorText.length);
            NationalInstruments.Vireo.setOccurence(occurrenceRef);
            if (!occurrenceHasBeenSet) {
                occurrenceHasBeenSet = true;
                NationalInstruments.Vireo.setOccurence(occurrenceRef);
            }
        };

        var successCallback = function (request) {
            var errorString = '';
            var headersText = request.getAllResponseHeaders();
            var bodyText = request.responseText;

            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            setErrorAndOccurrence(0, '');
        };
        var errorCallback = function (status, statusText) {
            setErrorAndOccurrence(-1, 'POST', statusText + '(' + status + ').');
        };
        var timeOutCallback = function (request) {
            setErrorAndOccurrence(-1, 'POST', 'The time out value of ' + timeOut + ' was exceeded.');
        };

        try {
            NationalInstruments.Vireo.makeRequest(userHandle, 'POST', Pointer_stringify(url, urlLength), timeOut, Pointer_stringify(buffer, bufferLength), successCallback, errorCallback, timeOutCallback);
        }
        catch (error) {
            setErrorAndOccurrence(-1, 'POST', error.message);
        }
    }
};

mergeInto(LibraryManager.library, HttpClient);
