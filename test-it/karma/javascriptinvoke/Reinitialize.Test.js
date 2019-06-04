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
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = await vireoHelpers.createInstance();

        // Add functions to exercise JavaScriptInvoke behavior
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
