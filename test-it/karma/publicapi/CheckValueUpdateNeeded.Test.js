describe('The Vireo testAndResetNeedsUpdateFlag api', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    var internalModule;

    var publicApiCheckValueRefUpdateNeededUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/CheckValueRefUpdateNeeded.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiCheckValueRefUpdateNeededUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
        internalModule = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired;
    });

    afterEach(function () {
        vireo = undefined;
        internalModule = undefined;
    });

    it('can mark data items as update needed and clear', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiCheckValueRefUpdateNeededUrl);

        var outputParameter = vireo.eggShell.findValueRef('MyVI', 'outputParameter');
        var inputParameter = vireo.eggShell.findValueRef('MyVI', 'inputParameter');
        var inputOutputParameter = vireo.eggShell.findValueRef('MyVI', 'inputOutputParameter');
        var localDataItem = vireo.eggShell.findValueRef('MyVI', 'localDataItem');
        var local = vireo.eggShell.findValueRef('MyVI', 'local');
        var localDataItemArray = vireo.eggShell.findValueRef('MyVI', 'localDataItemArray');
        var localArray = vireo.eggShell.findValueRef('MyVI', 'localArray');
        var subVIOutputParameter = vireo.eggShell.findValueRef('MySubVI', 'subVIOutputParameter');
        var subVILocalDataItem = vireo.eggShell.findValueRef('MySubVI', 'subVILocalDataItem');

        // Before running expect no updates needed
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(outputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(inputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(inputOutputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(localDataItem)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(local)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(localDataItemArray)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(localArray)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(subVIOutputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(subVILocalDataItem)).toBeFalse();

        // Run the VI
        var {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();

        // After running expect dataItem updates needed
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(outputParameter)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(inputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(inputOutputParameter)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(localDataItem)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(local)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(localDataItemArray)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(localArray)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(subVIOutputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(subVILocalDataItem)).toBeFalse();

        // Test the needs update flags
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(outputParameter)).toBeTrue();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(inputParameter)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(inputOutputParameter)).toBeTrue();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(localDataItem)).toBeTrue();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(local)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(localDataItemArray)).toBeTrue();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(localArray)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(subVIOutputParameter)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(subVILocalDataItem)).toBeFalse();

        // expect all needs update flags to be reset
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(outputParameter)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(inputParameter)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(inputOutputParameter)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(localDataItem)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(local)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(localDataItemArray)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(localArray)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(subVIOutputParameter)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(subVILocalDataItem)).toBeFalse();
    });
});
