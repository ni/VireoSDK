describe('Performing a GET request', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    var vireo;

    beforeEach(function (done) {
        httpBinHelpers.queryHttpBinStatus(done);
    });

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();
    });

    it('with a simple 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');
            expect(viPathParser('handle')).toBe(0);
            expect(viPathParser('headers')).toBeDefined();
            expect(viPathParser('body')).toBeDefined();
            expect(viPathParser('statusCode')).toBe(200);
            expect(viPathParser('error.status')).toBe(false);
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBe('');
            done();
        });
    });

    it('validating a simple 200 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('get');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(Object.keys(responseHeader.headers).length).toBeGreaterThan(0);

            // body
            var httpBinBody = JSON.parse(viPathParser('body'));
            var requestUrl = httpParser.parseUrl(httpBinBody.url);
            expect(httpBinBody.args).toEqual({});
            expect(httpBinBody.headers).toEqual(jasmine.any(Object));
            expect(requestUrl.pathname).toBe('/get');

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBe(false);
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBe('');

            done();
        });
    });

    // NOTE: Validation of a 404 response code was moved to a non-PhantomJS test

    it('validating an unusual 4XX response code', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('status/418');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(418);
            expect(responseHeader.reasonPhrase).toBe('I\'M A TEAPOT');
            expect(Object.keys(responseHeader.headers).length).toBeGreaterThan(0);

            // body
            expect(viPathParser('body')).not.toBe('');

            // status code
            expect(viPathParser('statusCode')).toBe(418);

            // error
            expect(viPathParser('error.status')).toBe(false);
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBe('');

            done();
        });
    });

    it('validating a response with UTF8 data', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');
        var bodyTextUrl = fixtures.convertToAbsoluteFromFixturesDir('http/utf8.txt');
        var bodyText = fixtures.loadAbsoluteUrl(bodyTextUrl);

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('encoding/utf8');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(200);
            expect(responseHeader.reasonPhrase).toBe('OK');
            expect(Object.keys(responseHeader.headers).length).toBeGreaterThan(0);

            // body
            expect(viPathParser('body')).toBe(bodyText);

            // status code
            expect(viPathParser('statusCode')).toBe(200);

            // error
            expect(viPathParser('error.status')).toBe(false);
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBe('');

            done();
        });
    });
});
