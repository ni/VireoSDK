
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
        var doneText = 'done';
        var successCallback = function (request) {
            // Return Headers
            var headersText = request.getAllResponseHeaders();
            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);

            // Return body
            var bodyText = request.responseText;
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var errorCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var timeOutCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };

        NationalInstruments.Vireo.makeRequest(userHandle, 'GET', Pointer_stringify(url, urlLength), timeOut, undefined, successCallback, errorCallback, timeOutCallback);

        return 0;
    },

    jsHttpClientHead: function (userHandle, url, urlLength, timeOut, headers, errorCodePointer, errorMessage, occurrenceRef) {
        var doneText = 'done';
        var successCallback = function (request) {
            // Return Headers
            var headersText = request.getAllResponseHeaders();
            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var errorCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var timeOutCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };

        NationalInstruments.Vireo.makeRequest(userHandle, 'HEAD', Pointer_stringify(url, urlLength), timeOut, undefined, successCallback, errorCallback, timeOutCallback);

        return 0;
    },

    jsHttpClientPutBuffer: function (userHandle, url, urlLength, outputFile, outputFileLength, buffer, bufferLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
        var doneText = 'done';
        var successCallback = function (request) {
            // Return Headers
            var headersText = request.getAllResponseHeaders();
            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);

            // Return body
            var bodyText = request.responseText;
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
            console.log("Success with Put for " + Pointer_stringify(url, urlLength));
        };
        var errorCallback = function (request) {
            console.log("errorCallback was called with " + request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var timeOutCallback = function (request) {
            console.log("timeOutCallback was called with " + request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };

        NationalInstruments.Vireo.makeRequest(userHandle, 'PUT', Pointer_stringify(url, urlLength), timeOut, Pointer_stringify(buffer, bufferLength), successCallback, errorCallback, timeOutCallback);

        return 0;
    },

    jsHttpClientDelete: function (userHandle, url, urlLength, outputFile, outputFileLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
        var doneText = 'done';
        var successCallback = function (request) {
            // Return Headers
            var headersText = request.getAllResponseHeaders();
            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);

            // Return body
            var bodyText = request.responseText;
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var errorCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var timeOutCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };

        NationalInstruments.Vireo.makeRequest(userHandle, 'DELETE', Pointer_stringify(url, urlLength), timeOut, undefined, successCallback, errorCallback, timeOutCallback);

        return 0;
    },

    jsHttpClientPostBuffer: function (userHandle, url, urlLength, outputFile, outputFileLength, buffer, bufferLength, timeOut, headers, body, errorCodePointer, errorMessage, occurrenceRef) {
        var doneText = 'done';
        var successCallback = function (request) {
            // Return Headers
            var headersText = request.getAllResponseHeaders();
            NationalInstruments.Vireo.dataWriteString(headers, headersText, headersText.length);

            // Return body
            var bodyText = request.responseText;
            NationalInstruments.Vireo.dataWriteString(body, bodyText, bodyText.length);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var errorCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };
        var timeOutCallback = function (request) {
            console.log(request.statusText);
            NationalInstruments.Vireo.dataWriteString(done, doneText, doneText.length);
        };

        NationalInstruments.Vireo.makeRequest(userHandle, 'POST', Pointer_stringify(url, urlLength), timeOut, Pointer_stringify(buffer, bufferLength), successCallback, errorCallback, timeOutCallback);

        return 0;
    }
};

mergeInto(LibraryManager.library, HttpClient);