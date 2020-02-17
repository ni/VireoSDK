// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var convertToAbsoluteUrl = function (relativePath) {
        // For some reason resolving localhost on Windows 7 can be slow, so use home ip directly
        // Also some processes were on port 5000 so switched to higher port
        var host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        return 'http://' + host + ':64526/' + relativePath;
    };

    var serverOnline;
    var serverWarningShown = false;
    var queryHttpBinStatus = function (done) {
        var loadFailed = function () {
            serverOnline = false;
            done();
        };
        var loadPassed = function () {
            serverOnline = true;
            done();
        };

        if (typeof serverOnline === 'boolean') {
            if (serverOnline) {
                loadPassed();
            } else {
                loadFailed();
            }
            return;
        }

        var url = convertToAbsoluteUrl('get?show_env=1');
        var request = new XMLHttpRequest();
        request.addEventListener('load', function () {
            if (request.status === 200) {
                loadPassed();
            } else {
                loadFailed();
            }
        });
        request.addEventListener('error', loadFailed);
        request.addEventListener('timeout', loadFailed);
        request.addEventListener('abort', loadFailed);
        request.open('GET', url);
        request.send();
    };

    var forceHttpBinQuery = function (relativePath, done) {
        var loadPassed = function () {
            done();
        };
        var loadFailed = function () {
            done.fail('Could not communicate with httpbin');
        };

        var url = convertToAbsoluteUrl(relativePath);
        var request = new XMLHttpRequest();
        request.addEventListener('load', function () {
            if (request.status === 200) {
                loadPassed();
            } else {
                loadFailed();
            }
        });
        request.addEventListener('error', loadFailed);
        request.addEventListener('timeout', loadFailed);
        request.addEventListener('abort', loadFailed);
        request.open('GET', url);
        request.withCredentials = true; // httpCORS.Test.js relies on this being set
        request.send();
    };

    // Calling pending was not working right for async functions, probably related to https://github.com/jasmine/jasmine/issues/937
    var makeTestPendingIfHttpBinOffline = function () {
        if (typeof serverOnline !== 'boolean') {
            throw new Error('queryHttpBinStatus must be called before makeTestPendingIfHttpBinOffline');
        }
        if (serverOnline === false) {
            if (serverWarningShown === false) {
                console.warn('HTTPBin Server offline, skipping HTTP tests. Attempted to query the url: ' + convertToAbsoluteUrl('get?show_env=1'));
                serverWarningShown = true;
            }
            pending();
        }
    };

    var parseBody = function (body) {
        var httpBinBody = JSON.parse(body);

        var headersLowerCase = Object.keys(httpBinBody.headers).reduce(function (obj, header) {
            obj[header.toLowerCase()] = httpBinBody.headers[header];
            return obj;
        }, {});

        httpBinBody.headersLowerCase = headersLowerCase;
        return httpBinBody;
    };

    window.testHelpers.httpBinHelpers = {
        convertToAbsoluteUrl: convertToAbsoluteUrl,
        makeTestPendingIfHttpBinOffline: makeTestPendingIfHttpBinOffline,
        queryHttpBinStatus: queryHttpBinStatus,
        parseBody: parseBody,
        forceHttpBinQuery: forceHttpBinQuery
    };
}());
