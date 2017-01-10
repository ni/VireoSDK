(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var convertToAbsoluteUrl = function (relativePath) {
        return 'http://localhost:5000/' + relativePath;
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
