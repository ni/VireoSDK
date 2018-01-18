describe('Performing a simple JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var kNIUnableToFindFunctionForJavaScriptInvoke = 363658;
    var vireo;

    var jsSimpleMethodViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleMethod.via');
    var jsSimpleMethodNotFoundViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/SimpleMethodNotFound.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsSimpleMethodViaUrl,
            jsSimpleMethodNotFoundViaUrl
        ], done);
    });

    beforeEach(function () {
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();
        window.NI_SimpleMethod = function () {
            return undefined;
        };
    });

    afterEach(function () {
        window.NI_SimpleMethod = undefined;
    });

    it('with no parameters', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleMethodViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('errors when JavaScript function not found', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsSimpleMethodNotFoundViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNIUnableToFindFunctionForJavaScriptInvoke]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });
});
