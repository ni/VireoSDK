(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var cache = {};
    var basePathViaTests = '/base/test-it/ViaTests/';
    var basePathFixture = '/base/test-it/karma/fixtures/';

    var makeRequest = function (absoluteUrl) {
        var request = new XMLHttpRequest();
        var urlCacheAvoid = absoluteUrl + '?' + new Date().getTime();
        request.open('GET', urlCacheAvoid, false);
        request.send();
        if (request.status !== 200) {
            throw new Error('cannot find fixture at path: ' + absoluteUrl);
        }
        return request.responseText;
    };

    var checkCache = function (absoluteUrl) {
        if (cache.hasOwnProperty(absoluteUrl) === false) {
            cache[absoluteUrl] = makeRequest(absoluteUrl);
        }
        return cache[absoluteUrl];
    };

    var convertToAbsoluteFromViaTestsDir = function (relativePath) {
        return basePathViaTests + relativePath;
    };

    var convertToAbsoluteFromFixturesDir = function (relativePath) {
        return basePathFixture + relativePath;
    };

    var loadAbsoluteUrl = function (absoluteUrl) {
        return checkCache(absoluteUrl);
    };

    var matchNamesFromPaths = function (regexMatchName) {
        var files = {};
        Object.keys(window.__karma__.files).forEach(function (file) {
            var fileParts = file.match(regexMatchName);
            if (fileParts !== null) {
                files[fileParts[1]] = file;
            }
        });
        return files;
    };

    window.testHelpers.fixtures = {
        convertToAbsoluteFromViaTestsDir: convertToAbsoluteFromViaTestsDir,
        convertToAbsoluteFromFixturesDir: convertToAbsoluteFromFixturesDir,
        loadAbsoluteUrl: loadAbsoluteUrl,
        matchNamesFromPaths: matchNamesFromPaths
    };
}());
