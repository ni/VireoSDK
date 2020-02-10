// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var cache = {};
    var basePathViaTests = '/base/test-it/ViaTests/';
    var basePathExpectedResults = '/base/test-it/ExpectedResults/';
    var basePathFixture = '/base/test-it/karma/fixtures/';

    var convertToAbsoluteFromViaTestsDir = function (relativePath) {
        return basePathViaTests + relativePath;
    };

    var convertToAbsoluteFromExpectedResultsDir = function (relativePath) {
        return basePathExpectedResults + relativePath;
    };

    var convertToAbsoluteFromFixturesDir = function (relativePath) {
        return basePathFixture + relativePath;
    };

    var fileNotLoaded = function (absoluteUrl) {
        return cache.hasOwnProperty(absoluteUrl) === false;
    };

    var preloadAbsoluteUrls = function (absoluteUrls, done) {
        var startTime = window.performance.now();

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

        window.Promise.all(filesToLoad).then(function () {
            var loadTime = window.performance.now() - startTime;
            if (loadTime > 2000) {
                console.warn('Preload of files took longer that 2000ms', 'actual time', loadTime, 'files', filesToLoad);
            }
        }).then(done).catch(function (message) {
            done.fail('Failed because of the following reason: ' + message);
        });
    };

    var loadAbsoluteUrl = function (absoluteUrl) {
        if (fileNotLoaded(absoluteUrl)) {
            throw new Error('Make sure to preload fixture files before attempting to load them, cannot find: ' + absoluteUrl);
        }

        return cache[absoluteUrl];
    };

    window.testHelpers.fixtures = {
        convertToAbsoluteFromViaTestsDir: convertToAbsoluteFromViaTestsDir,
        convertToAbsoluteFromExpectedResultsDir: convertToAbsoluteFromExpectedResultsDir,
        convertToAbsoluteFromFixturesDir: convertToAbsoluteFromFixturesDir,
        loadAbsoluteUrl: loadAbsoluteUrl,
        preloadAbsoluteUrls: preloadAbsoluteUrls
    };
}());
