// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Performing a GET request', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;
    var textFormat = window.testHelpers.textFormat;

    var kNIHttpWebVIOutputFileUnsupported = 363654;
    var kNIHttpResultInternalUndefinedError = 363798;
    var WEBVI_RECEIVE_INVALID_HANDLE = 1;
    var WEBVI_INVALID_URL = 363500;
    var WEBVI_INVALID_HEADER = 363651;
    var WEBVI_NETWORK_ERROR = 363650;
    var WEBVI_TIMEOUT = 56;
    var vireo;

    var httpGetMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/GetMethod.via');
    var httpUtf8DemoUrl = fixtures.convertToAbsoluteFromFixturesDir('http/Utf8Demo.txt');
    var httpUtf8TestUrl = fixtures.convertToAbsoluteFromFixturesDir('http/Utf8Test.txt');
    var httpGetOpenMethodCloseViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/GetOpenMethodClose.via');
    var httpGetOpenAddMethodCloseViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/GetOpenAddMethodClose.via');
    var httpGetParallelViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/GetParallel.via');
    var httpGetOpenAddMethodAddMethodCloseViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/GetOpenAddMethodAddMethodClose.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            httpGetMethodViaUrl,
            httpUtf8DemoUrl,
            httpGetOpenMethodCloseViaUrl,
            httpGetOpenAddMethodCloseViaUrl,
            httpGetParallelViaUrl,
            httpGetOpenAddMethodAddMethodCloseViaUrl
        ], done);
    });

    beforeAll(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
    });

    it('with a simple 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toMatch(/200/);
            expect(viPathParser('body')).toBeNonEmptyString();
            expect(viPathParser('statusCode')).toBe(200);
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('errors with a bad handle', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        viPathWriter('url', url);
        viPathWriter('handle', 13371337);
        viPathWriter('headers', 'Bad Value');
        viPathWriter('body', 'Bad Value');
        viPathWriter('statusCode', 1337);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(13371337);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(WEBVI_RECEIVE_INVALID_HANDLE);
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            done();
        });
    });

    it('errors with a bad url', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('url', 'http://bad:-90');
        viPathWriter('headers', 'Bad Value');
        viPathWriter('body', 'Bad Value');
        viPathWriter('statusCode', 1337);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect([WEBVI_INVALID_URL, WEBVI_NETWORK_ERROR]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            done();
        });
    });

    it('errors connecting to a secure context form an insecure context to test network errors', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        // This test assumes that we are serving from http so a connection to https will fail
        viPathWriter('url', 'https://nonexistant');
        viPathWriter('headers', 'Bad Value');
        viPathWriter('body', 'Bad Value');
        viPathWriter('statusCode', 1337);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect([WEBVI_TIMEOUT, WEBVI_NETWORK_ERROR, kNIHttpResultInternalUndefinedError]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            expect(viPathParser('error.source').length).toBeGreaterThan(255);
            expect(viPathParser('error.source')).toContain('Due to browser security restrictions');
            done();
        });
    });

    it('errors with an output file parameter', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        var invalidOutputFile = 'C:\\any\\path';
        viPathWriter('url', url);
        viPathWriter('outputFile', invalidOutputFile);
        viPathWriter('headers', 'Bad Value');
        viPathWriter('body', 'Bad Value');
        viPathWriter('statusCode', 1337);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(kNIHttpWebVIOutputFileUnsupported);
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            done();
        });
    });

    it('validating a simple 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var httpBinBody = httpBinHelpers.parseBody(viPathParser('body'));
            var requestUrl = httpParser.parseUrl(httpBinBody.url);
            expect(httpBinBody.args).toBeEmptyObject();
            expect(httpBinBody.headers).toBeNonEmptyObject();
            expect(requestUrl.pathname).toBe('/get');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a 404 response with empty response body', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('status/404');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(404);
            expect(responseHeader.reasonPhrase).toBe('NOT FOUND');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            expect(viPathParser('body')).toBeEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(404);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating an unusual 4XX response code', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('status/418');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(418);
            expect(responseHeader.reasonPhrase).toBe('I\'M A TEAPOT');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            expect(viPathParser('body')).toBeNonEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(418);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a response with UTF8 data', function (done) {
        var bodyText = textFormat.normalizeLineEndings(fixtures.loadAbsoluteUrl(httpUtf8DemoUrl));

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('encoding/utf8');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var responseBody = textFormat.normalizeLineEndings(viPathParser('body'));
            expect(responseBody).toBe(bodyText);

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a response with binary data from UTF stress test', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        viPathWriter('url', httpUtf8TestUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var responseBody = textFormat.normalizeLineEndings(viPathParser('body'));
            expect(responseBody).toBeNonEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a response with binary data seeded bytes', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('bytes/8?seed=6');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            // Body bytes: '\xCB\xD2\x7C\x42\x00\xA9\x78\xC2';
            // var bodyReadAsString = '\uFFFD\uFFFD\x7C\x42\x00\uFFFD\x78\uFFFD';
            // var responseBody = textFormat.normalizeLineEndings(viPathParser('body'));

            // Httpbin seed not stable between Python versions. See https://github.com/postmanlabs/httpbin/issues/598
            // Need an alternate endpoint to test null values in responses. See https://github.com/postmanlabs/httpbin/issues/599
            // expect(responseBody).toBe(bodyReadAsString);

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a response with binary data image png', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('image/png');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var responseBody = textFormat.normalizeLineEndings(viPathParser('body'));
            expect(responseBody).toBeNonEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a response with binary data image jpeg', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('image/jpeg');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var responseBody = textFormat.normalizeLineEndings(viPathParser('body'));
            expect(responseBody).toBeNonEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a response with binary data image webp', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('image/webp');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var responseBody = textFormat.normalizeLineEndings(viPathParser('body'));
            expect(responseBody).toBeNonEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('validating a response with binary data image svg', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('image/svg');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var responseBody = textFormat.normalizeLineEndings(viPathParser('body'));
            expect(responseBody).toBeNonEmptyString();

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();

            done();
        });
    });

    it('with open, get, close and a simple 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetOpenMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('handle')).toBeGreaterThan(0);
            expect(viPathParser('headers')).toMatch(/200/);
            expect(viPathParser('body')).toBeNonEmptyString();
            expect(viPathParser('statusCode')).toBe(200);
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with open, get, close and validates a 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetOpenMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBeGreaterThan(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var httpBinBody = httpBinHelpers.parseBody(viPathParser('body'));
            var requestUrl = httpParser.parseUrl(httpBinBody.url);
            expect(httpBinBody.args).toBeEmptyObject();
            expect(httpBinBody.headers).toBeNonEmptyObject();
            expect(requestUrl.pathname).toBe('/get');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with open, add invalid header, get, close results in an error', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetOpenAddMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        var header = 'headers cannot have spaces';
        var value = 'in bird culture this is considered a dick move';
        viPathWriter('url', url);
        viPathWriter('header', header);
        viPathWriter('value', value);
        viPathWriter('headers', 'Bad Value');
        viPathWriter('body', 'Bad Value');
        viPathWriter('statusCode', 1337);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBeGreaterThan(0);
            expect(viPathParser('headers')).toBeEmptyString();
            expect(viPathParser('body')).toBeEmptyString();
            expect(viPathParser('statusCode')).toBe(0);
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(WEBVI_INVALID_HEADER);
            expect(viPathParser('error.source')).toMatch(/HttpClientGet in MyVI/);
            done();
        });
    });

    it('with open, add header, get, close and validates a 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetOpenAddMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        var header = 'birdperson';
        var value = 'in bird culture this is considered a dick move';
        viPathWriter('url', url);
        viPathWriter('header', header);
        viPathWriter('value', value);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBeGreaterThan(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(responseHeader.headers).toBeNonEmptyObject();

            // body
            var httpBinBody = httpBinHelpers.parseBody(viPathParser('body'));
            var requestUrl = httpParser.parseUrl(httpBinBody.url);
            expect(httpBinBody.args).toBeEmptyObject();
            expect(httpBinBody.headers).toBeNonEmptyObject();
            expect(httpBinBody.headersLowerCase[header]).toBe(value);
            expect(requestUrl.pathname).toBe('/get');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('in parallel and validates a 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetParallelViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url1 = httpBinHelpers.convertToAbsoluteUrl('get');
        var header1 = 'birdperson';
        var value1 = 'in bird culture this is considered a dick move';
        viPathWriter('url1', url1);
        viPathWriter('header1', header1);
        viPathWriter('value1', value1);

        var url2 = httpBinHelpers.convertToAbsoluteUrl('get');
        var header2 = 'mrmeeseeks';
        var value2 = 'look at me';
        viPathWriter('url2', url2);
        viPathWriter('header2', header2);
        viPathWriter('value2', value2);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle 1
            expect(viPathParser('handle1')).toBeGreaterThan(0);

            // header 1
            var responseHeader1 = httpParser.parseResponseHeader(viPathParser('headers1'));
            expect(responseHeader1.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader1.statusCode).toBe(200);
            expect(responseHeader1.reasonPhrase).toBe('OK');
            expect(responseHeader1.headers).toBeNonEmptyObject();

            // body 1
            var httpBinBody1 = httpBinHelpers.parseBody(viPathParser('body1'));
            var requestUrl1 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody1.args).toBeEmptyObject();
            expect(httpBinBody1.headers).toBeNonEmptyObject();
            expect(httpBinBody1.headersLowerCase).toHaveMember(header1);
            expect(httpBinBody1.headersLowerCase).not.toHaveMember(header2);
            expect(httpBinBody1.headersLowerCase[header1]).toBe(value1);
            expect(requestUrl1.pathname).toBe('/get');

            // status code 1
            expect(viPathParser('statusCode1')).toBe(200);

            // error 1
            expect(viPathParser('error1.status')).toBeFalse();
            expect(viPathParser('error1.code')).toBe(0);
            expect(viPathParser('error1.source')).toBeEmptyString();

            // handle 2
            expect(viPathParser('handle2')).toBeGreaterThan(0);

            // header 2
            var responseHeader2 = httpParser.parseResponseHeader(viPathParser('headers2'));
            expect(responseHeader2.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader2.statusCode).toBe(200);
            expect(responseHeader2.reasonPhrase).toBe('OK');
            expect(responseHeader2.headers).toBeNonEmptyObject();

            // body 2
            var httpBinBody2 = httpBinHelpers.parseBody(viPathParser('body2'));
            var requestUrl2 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody2.args).toBeEmptyObject();
            expect(httpBinBody2.headers).toBeNonEmptyObject();
            expect(httpBinBody2.headersLowerCase).not.toHaveMember(header1);
            expect(httpBinBody2.headersLowerCase).toHaveMember(header2);
            expect(httpBinBody2.headersLowerCase[header2]).toBe(value2);
            expect(requestUrl2.pathname).toBe('/get');

            // status code 2
            expect(viPathParser('statusCode2')).toBe(200);

            // error 2
            expect(viPathParser('error2.status')).toBeFalse();
            expect(viPathParser('error2.code')).toBe(0);
            expect(viPathParser('error2.source')).toBeEmptyString();
            done();
        });
    });

    // Tests with serial connections to the same endpoint run slowly sometimes, not sure what conditions
    it('with multiple serial requests doing open, add header, get, add header, get, close and validates a 200 response #Slow', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpGetOpenAddMethodAddMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url1 = httpBinHelpers.convertToAbsoluteUrl('get');
        var header1 = 'birdperson';
        var value1 = 'in bird culture this is considered a dick move';
        viPathWriter('url1', url1);
        viPathWriter('header1', header1);
        viPathWriter('value1', value1);

        var url2 = httpBinHelpers.convertToAbsoluteUrl('get');
        var header2 = 'mrmeeseeks';
        var value2 = 'look at me';
        viPathWriter('url2', url2);
        viPathWriter('header2', header2);
        viPathWriter('value2', value2);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            // handle
            expect(viPathParser('handle')).toBeGreaterThan(0);

            // header 1
            var responseHeader1 = httpParser.parseResponseHeader(viPathParser('headers1'));
            expect(responseHeader1.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader1.statusCode).toBe(200);
            expect(responseHeader1.reasonPhrase).toBe('OK');
            expect(responseHeader1.headers).toBeNonEmptyObject();

            // body 1
            var httpBinBody1 = httpBinHelpers.parseBody(viPathParser('body1'));
            var requestUrl1 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody1.args).toBeEmptyObject();
            expect(httpBinBody1.headers).toBeNonEmptyObject();
            expect(httpBinBody1.headersLowerCase).toHaveMember(header1);
            expect(httpBinBody1.headersLowerCase).not.toHaveMember(header2);
            expect(httpBinBody1.headersLowerCase[header1]).toBe(value1);
            expect(requestUrl1.pathname).toBe('/get');

            // status code 1
            expect(viPathParser('statusCode1')).toBe(200);

            // header 2
            var responseHeader2 = httpParser.parseResponseHeader(viPathParser('headers2'));
            expect(responseHeader2.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader2.statusCode).toBe(200);
            expect(responseHeader2.reasonPhrase).toBe('OK');
            expect(responseHeader2.headers).toBeNonEmptyObject();

            // body 2
            var httpBinBody2 = httpBinHelpers.parseBody(viPathParser('body2'));
            var requestUrl2 = httpParser.parseUrl(httpBinBody1.url);
            expect(httpBinBody2.args).toBeEmptyObject();
            expect(httpBinBody2.headers).toBeNonEmptyObject();
            expect(httpBinBody2.headersLowerCase).toHaveMember(header1);
            expect(httpBinBody2.headersLowerCase).toHaveMember(header2);
            expect(httpBinBody2.headersLowerCase[header1]).toBe(value1);
            expect(httpBinBody2.headersLowerCase[header2]).toBe(value2);
            expect(requestUrl2.pathname).toBe('/get');

            // status code 2
            expect(viPathParser('statusCode2')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });
});
