(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var cache = {};
    var basePathTestIt = '/base/test-it/';
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

    var convertToAbsoluteFromTestItDir = function (relativePath) {
        return basePathTestIt + relativePath;
    };

    var convertToAbsoluteFromFixturesDir = function (relativePath) {
        return basePathFixture + relativePath;
    };

    var loadAbsoluteUrl = function (absoluteUrl) {
        return checkCache(absoluteUrl);
    };

    window.testHelpers.fixtures = {
        convertToAbsoluteFromTestItDir: convertToAbsoluteFromTestItDir,
        convertToAbsoluteFromFixturesDir: convertToAbsoluteFromFixturesDir,
        loadAbsoluteUrl: loadAbsoluteUrl
    };
}());
