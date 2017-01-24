describe('Performing a GET test', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    // Skip test if httpbin offline
    httpBinHelpers.makeTestPendingIfHttpBinOffline();

    // Sharing Vireo instances across tests make them run soooo much faster
    // var vireo = new Vireo();

    // TODO mraj using the same vireo instance causes an abort when one http call results in a none 200 response code
    // See https://github.com/ni/VireoSDK/issues/163
    var vireo;

    beforeEach(function () {
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

    it('validating an unusual response code', function (done) {
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
});
