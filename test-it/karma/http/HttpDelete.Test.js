describe('Performing a DELETE request', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    var kNIHttpWebVIOutputFileUnsupported = 363654;
    var kNIHttpResultInternalUndefinedError = 363798;
    var WEBVI_RECEIVE_INVALID_HANDLE = 1;
    var WEBVI_INVALID_HEADER = 363651;
    var WEBVI_INVALID_URL = 363500;
    var WEBVI_NETWORK_ERROR = 363650;
    var ncTimeOutErr = 56;
    var vireo;

    var httpDeleteMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/DeleteMethod.via');
    var httpDeleteOpenMethodCloseViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/DeleteOpenMethodClose.via');
    var httpDeleteOpenAddMethodCloseViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/DeleteOpenAddMethodClose.via');
    var httpDeleteParallelViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/DeleteParallel.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            httpDeleteMethodViaUrl,
            httpDeleteOpenMethodCloseViaUrl,
            httpDeleteOpenAddMethodCloseViaUrl,
            httpDeleteParallelViaUrl
        ], done);
    });

    beforeAll(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeEach(async function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = await vireoHelpers.createInstance();
    });

    it('with a simple 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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
            expect(viPathParser('error.source')).toMatch(/HttpClientDelete in MyVI/);
            done();
        });
    });

    it('errors with a bad url', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
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
            expect(viPathParser('error.source')).toMatch(/HttpClientDelete in MyVI/);
            done();
        });
    });

    it('errors connecting to a secure context form an insecure context to test network errors', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
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
            expect([WEBVI_NETWORK_ERROR, kNIHttpResultInternalUndefinedError, ncTimeOutErr]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/HttpClientDelete in MyVI/);
            done();
        });
    });

    it('errors with an output file parameter', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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
            expect(viPathParser('error.source')).toMatch(/HttpClientDelete in MyVI/);
            done();
        });
    });

    it('validating a simple 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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
            expect(requestUrl.pathname).toBe('/delete');

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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteMethodViaUrl);
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

    it('with open, delete, close and a simple 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteOpenMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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

    it('with open, delete, close and validates a 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteOpenMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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
            expect(requestUrl.pathname).toBe('/delete');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('with open, add invalid header, delete, close results in an error', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteOpenAddMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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
            expect(viPathParser('error.source')).toMatch(/HttpClientDelete in MyVI/);
            done();
        });
    });

    it('with open, add header, delete, close and validates a 200 response', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteOpenAddMethodCloseViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('delete');
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
            expect(requestUrl.pathname).toBe('/delete');

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
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpDeleteParallelViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url1 = httpBinHelpers.convertToAbsoluteUrl('delete');
        var header1 = 'birdperson';
        var value1 = 'in bird culture this is considered a dick move';
        viPathWriter('url1', url1);
        viPathWriter('header1', header1);
        viPathWriter('value1', value1);

        var url2 = httpBinHelpers.convertToAbsoluteUrl('delete');
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
            expect(requestUrl1.pathname).toBe('/delete');

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
            expect(requestUrl2.pathname).toBe('/delete');

            // status code 2
            expect(viPathParser('statusCode2')).toBe(200);

            // error 2
            expect(viPathParser('error2.status')).toBeFalse();
            expect(viPathParser('error2.code')).toBe(0);
            expect(viPathParser('error2.source')).toBeEmptyString();
            done();
        });
    });
});
