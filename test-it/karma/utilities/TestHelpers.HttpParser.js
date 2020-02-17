// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var parseResponseHeader = function (header) {
        var responseLines = header.split(/\r?\n/);

        var statusLine = responseLines[0];
        var statusLineParts = statusLine.split(' ');
        var httpVersion = statusLineParts[0];
        var statusCode = parseInt(statusLineParts[1], 10);
        var reasonPhrase = statusLineParts.slice(2).join(' ');

        var headerLines = responseLines.slice(1);
        var headers = {};

        // TODO mraj this overrides duplicate headers, which is not a spec compliant
        // way to handle duplicate headers
        // Should either allow multiple or merge in-order comma seperated
        // https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
        headerLines.forEach(function (headerLine) {
            var headerName = headerLine.substring(0, headerLine.indexOf(':'));
            var headerValue = headerLine.slice(headerName.length + 1).trim();
            headers[headerName] = headerValue;
        });

        return {
            httpVersion: httpVersion,
            statusCode: statusCode,
            reasonPhrase: reasonPhrase,
            headers: headers
        };
    };

    var parseUrlElement = document.createElement('a');

    var parseUrl = function (url) {
        // Add and remove the element to workaround behavior in legacy browsers, no longer required
        document.body.appendChild(parseUrlElement);
        parseUrlElement.href = url;

        // idea from https://gist.github.com/jlong/2428561
        // ex: http://example.com:3000/pathname/?search=test#hash
        var data = {
            protocol: parseUrlElement.protocol, // => "http:"
            hostname: parseUrlElement.hostname, // => "example.com"
            port: parseUrlElement.port, // => "3000"
            pathname: parseUrlElement.pathname, // => "/pathname/"
            search: parseUrlElement.search, // => "?search=test"
            hash: parseUrlElement.hash, // => "#hash"
            host: parseUrlElement.host // => "example.com:3000"
        };

        document.body.removeChild(parseUrlElement);
        return data;
    };

    window.testHelpers.httpParser = {
        parseResponseHeader: parseResponseHeader,
        parseUrl: parseUrl
    };
}());
