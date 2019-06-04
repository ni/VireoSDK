describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsComplexFunctionsViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ReinitializeToDefault.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsComplexFunctionsViaUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();

        window.NI_InternalFunctionReinitialize = function (viName, path) {
            var valueRef = vireo.eggShell.findValueRef(viName, path);
            vireo.eggShell.reinitializeToDefaultData(valueRef);
        };
    });

    afterEach(function () {
        // Cleanup functions
        window.NI_ConcatenateValue = undefined;
    });

    it('with no parameters succesfully works', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsComplexFunctionsViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('dataItem_Numeric')).toBe(1280);
            done();
        });
    });
});
