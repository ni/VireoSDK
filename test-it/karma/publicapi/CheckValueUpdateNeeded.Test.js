describe('The Vireo needsUpdate flag check api', function () {
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

    it('can perform a simple fpsync', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiCheckValueRefUpdateNeededUrl);

        const {rawPrint, rawPrintError} = await runSlicesAsync();

        var outputValueRef = vireo.eggShell.findValueRef('MyVI', 'output');
        var doubleValueRef = vireo.eggShell.findValueRef('MyVI', 'myDouble');
        var otherDoubleValueRef = vireo.eggShell.findValueRef('MyVI', 'myOtherDouble');
        expect(internalModule.eggShell.testNeedsUpdateFlagWithoutReset(outputValueRef)).toBeTrue();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(outputValueRef)).toBeTrue();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(doubleValueRef)).toBeTrue();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(otherDoubleValueRef)).toBeFalse();

        var integerValueRef = vireo.eggShell.findValueRef('MySubVI', 'myInteger');
        var myOutputValueRef = vireo.eggShell.findValueRef('MySubVI', 'myOutput');
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(integerValueRef)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(myOutputValueRef)).toBeFalse();

        // previous testAndResetNeedsUpdateFlag should have reset all flags to be false
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(doubleValueRef)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(otherDoubleValueRef)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(outputValueRef)).toBeFalse();

        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(integerValueRef)).toBeFalse();
        expect(vireo.eggShell.testAndResetNeedsUpdateFlag(myOutputValueRef)).toBeFalse();

        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
    });
});
