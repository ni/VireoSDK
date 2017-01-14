(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var convertToAbsoluteUrl = function (relativePath) {
        // For some reason resolving localhost on Windows 7 can be slow, so use home ip directly
        // Also some processes were on port 5000 so switched to higher port
        return 'http://127.0.0.1:64526/' + relativePath;
    };

    var showWarningAndMakePending = function () {
        console.warn('HTTPBin Server offline, skipping HTTP tests');
        pending();
    };

    var makeTestPendingIfHttpBinOffline = function () {
        var request = new XMLHttpRequest();
        var url = convertToAbsoluteUrl('get?show_env=1');
        request.open('GET', url, false);
        try {
            request.send();
        } catch (e) {
            showWarningAndMakePending();
        }
        if (request.status !== 200) {
            showWarningAndMakePending();
        }
    };

    window.testHelpers.httpBinHelpers = {
        convertToAbsoluteUrl: convertToAbsoluteUrl,
        makeTestPendingIfHttpBinOffline: makeTestPendingIfHttpBinOffline
    };
}());
