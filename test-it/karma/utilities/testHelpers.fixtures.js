(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var cache = {};
    var basePathViaTests = '/base/test-it/ViaTests/';
    var basePathFixture = '/base/test-it/karma/fixtures/';

    var convertToAbsoluteFromViaTestsDir = function (relativePath) {
        return basePathViaTests + relativePath;
    };

    var convertToAbsoluteFromFixturesDir = function (relativePath) {
        return basePathFixture + relativePath;
    };

    var fileNotLoaded = function (absoluteUrl) {
        return cache.hasOwnProperty(absoluteUrl) === false;
    };

    var preloadAbsoluteUrls = function (absoluteUrls, done) {
        var filesToLoad = absoluteUrls.filter(fileNotLoaded).map(function (absoluteUrl) {
            var urlCacheAvoid = absoluteUrl + '?' + new Date().getTime();
            return fetch(urlCacheAvoid).then(function (response) {
                if (response.status === 200) {
                    return response.text();
                }

                return window.Promise.reject('Could not find file: ' + absoluteUrl);
            }).then(function (text) {
                cache[absoluteUrl] = text;
            });
        });

        window.Promise.all(filesToLoad).then(done).catch(function (message) {
            done.fail('Failed because of the following reason: ' + message);
        });
    };

    var loadAbsoluteUrl = function (absoluteUrl) {
        if (fileNotLoaded(absoluteUrl)) {
            throw new Error('Make sure to preload fixture files before attempting to load them, cannot find: ' + absoluteUrl);
        }

        return cache[absoluteUrl];
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
        preloadAbsoluteUrls: preloadAbsoluteUrls,
        matchNamesFromPaths: matchNamesFromPaths
    };
}());
