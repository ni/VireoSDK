
var HttpClient =
{
    js_ni_httpClient_Open: function (cookieFile, cookieFileLength, userName, userNameLength, password, passwordLength, errorCode, verifyServer) {
        return NationalInstruments.Vireo.addHttpUser(Pointer_stringify(userName, userNameLength), Pointer_stringify(password, passwordLength));
    },

    js_ni_httpClient_Close: function (userHandle) {
        var user = NationalInstruments.Vireo.getHttpUser(userHandle);
        return NationalInstruments.Vireo.removeHttpUser(userHandle);
    },

    js_ni_httpClient_AddHeader: function (userHandle, header, headerLength, value, valueLength) {
        return NationalInstruments.Vireo.addHeader(userHandle, Pointer_stringify(header, headerLength), Pointer_stringify(value, valueLength));
    },

    js_ni_httpClient_RemoveHeader: function (userHandle, header, headerLength) {
        return NationalInstruments.Vireo.removeHeader(userHandle, Pointer_stringify(header, headerLength));
    },

    js_ni_httpClient_GetHeader: function (userHandle, header, headerLength, value) {
        return NationalInstruments.Vireo.getHeaderValue(userHandle, Pointer_stringify(header, headerLength), value);
    },

    js_ni_httpClient_HeaderExist: function (userHandle, header, headerLength) {
        return NationalInstruments.Vireo.headerExist(userHandle, Pointer_stringify(header, headerLength));
    },

    js_ni_httpClient_ListHeaders: function (userHandle, list) {
        return NationalInstruments.Vireo.listHeaders(userHandle, list);
    },

    js_ni_httpClient_Get: function (userHandle, url, urlLength, outputFile, outputFileLength, timeOut, headers, body, done) {
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

    js_ni_httpClient_Head: function (userHandle, url, urlLength, timeOut, headers, done) {
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

    js_ni_httpClient_PutBuffer: function (userHandle, url, urlLength, outputFile, outputFileLength, buffer, bufferLength, timeOut, headers, body, done) {
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

    js_ni_httpClient_Delete: function (userHandle, url, urlLength, outputFile, outputFileLength, timeOut, headers, body, done) {
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

    js_ni_httpClient_PostBuffer: function (userHandle, url, urlLength, outputFile, outputFileLength, buffer, bufferLength, timeOut, headers, body, done) {
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