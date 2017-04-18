describe('Tests that fail to run on PhantomJS', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    var vireo;

    var httpGetMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/GetMethod.via');
    var httpPutMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/PutMethod.via');
    var httpDeleteMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/DeleteMethod.via');
    var httpPostMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('http/PostMethod.via');

    var WEBVI_INVALID_URL = 363500;
    var WEBVI_NETWORK_ERROR = -1967370240;
    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            httpGetMethodViaUrl,
            httpPutMethodViaUrl,
            httpDeleteMethodViaUrl,
            httpPostMethodViaUrl
        ], done);
    });

    beforeAll(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();
    });

    // All 404 tests, except for HEAD, wtf PhantomJS lol
    // PhantomJS triggers a failure with status code 0 for this 404 request. No way to distinguish from actual network failure
    it('validating a 404 response with empty response body during get', function (done) {
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

    it('validating a 404 response with empty response body during delete', function (done) {
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

    it('validating a 404 response with empty response body during post', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpPostMethodViaUrl);
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

    it('validating a 404 response with empty response body during put', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpPutMethodViaUrl);
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

    // Specific Bad URL Tests
    // This causes PhatomJS to never trigger completion callbacks (load, readystatechange, etc)
    // The test will eventually timeout in PhantomJS
    it('errors with a bad url during delete', function (done) {
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

    it('errors with a bad url during put', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, httpPutMethodViaUrl);
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
            expect(viPathParser('error.source')).toMatch(/HttpClientPut in MyVI/);
            done();
        });
    });
});
