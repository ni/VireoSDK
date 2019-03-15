describe('The Vireo dirty check api', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiMarkValueDirtyUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MarkValueDirty.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMarkValueDirtyUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    it('can perform a simple fpsync', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiMarkValueDirtyUrl);

        const {rawPrint, rawPrintError} = await runSlicesAsync();

        var doubleValueRef = vireo.eggShell.findValueRef('MyVI', 'myDouble');
        expect(vireo.coreHelpers.isValueDirty(doubleValueRef)).toBeTrue();

        var integerValueRef = vireo.eggShell.findValueRef('MySubVI', 'myInteger');
        expect(vireo.coreHelpers.isValueDirty(integerValueRef)).toBeFalse();

        vireo.coreHelpers.clearDirtyValues();
        expect(vireo.coreHelpers.isValueDirty(doubleValueRef)).toBeFalse();
        expect(vireo.coreHelpers.isValueDirty(integerValueRef)).toBeFalse();

        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
    });
});
