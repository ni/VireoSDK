describe('Tests that fail to run on PahntomJS', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;
    var httpBinHelpers = window.testHelpers.httpBinHelpers;
    var httpParser = window.testHelpers.httpParser;

    // Sharing Vireo instances across tests make them run soooo much faster
    // var vireo = new Vireo();

    // TODO mraj using the same vireo instance causes an abort when one http call results in a none 200 response code
    // See https://github.com/ni/VireoSDK/issues/163
    var vireo;

    beforeEach(function () {
        httpBinHelpers.makeTestPendingIfHttpBinOffline();
        vireo = new Vireo();
    });

    it('validating a 404 response', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('http/Get.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        var url = httpBinHelpers.convertToAbsoluteUrl('status/404');
        viPathWriter('url', url);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');

            // handle
            expect(viPathParser('handle')).toBe(0);

            // header
            var responseHeader = httpParser.parseResponseHeader(viPathParser('headers'));
            expect(responseHeader.httpVersion).toBe('HTTP/1.1');
            expect(responseHeader.statusCode).toBe(404);
            expect(responseHeader.reasonPhrase).toBe('NOT FOUND');
            expect(Object.keys(responseHeader.headers).length).toBeGreaterThan(0);

            // body
            expect(viPathParser('body')).toBe('');

            // error
            expect(viPathParser('error.status')).toBe(false);
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBe('');

            done();
        });
    });
});
