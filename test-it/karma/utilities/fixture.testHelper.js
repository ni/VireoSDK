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

    var loadTestItVia = function (relativePath) {
        var absoluteUrl = basePathTestIt + relativePath;
        return checkCache(absoluteUrl);
    };

    var loadFixture = function (relativePath) {
        var absoluteUrl = basePathFixture + relativePath;
        return checkCache(absoluteUrl);
    };

    var loadAbsoluteUrl = function (absoluteUrl) {
        return checkCache(absoluteUrl);
    };

    window.testHelpers.fixtures = {
        loadTestItVia: loadTestItVia,
        loadFixture: loadFixture,
        loadAbsoluteUrl: loadAbsoluteUrl
    };
}());
