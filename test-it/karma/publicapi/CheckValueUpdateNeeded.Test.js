describe('The Vireo dirty check api', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiCheckValueRefUpdateNeededUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/CheckValueRefUpdateNeeded.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiCheckValueRefUpdateNeededUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    it('can perform a simple fpsync', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiCheckValueRefUpdateNeededUrl);

        const {rawPrint, rawPrintError} = await runSlicesAsync();

        var outputValueRef = vireo.eggShell.findValueRef('MyVI', 'output');
        var doubleValueRef = vireo.eggShell.findValueRef('MyVI', 'myDouble');
        var otherDoubleValueRef = vireo.eggShell.findValueRef('MyVI', 'myOtherDouble');
        expect(vireo.eggShell.checkValueRefNeedsUpdateFlag_SkipReset_(outputValueRef)).toBeTrue();
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(outputValueRef)).toBeTrue();
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(doubleValueRef)).toBeTrue();
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(otherDoubleValueRef)).toBeFalse();

        var integerValueRef = vireo.eggShell.findValueRef('MySubVI', 'myInteger');
        var myOutputValueRef = vireo.eggShell.findValueRef('MySubVI', 'myOutput');
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(integerValueRef)).toBeFalse();
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(myOutputValueRef)).toBeFalse();

        // previous checkAndResetValueRefNeedsUpdateFlag should have reset all flags to be false
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(doubleValueRef)).toBeFalse();
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(otherDoubleValueRef)).toBeFalse();
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(outputValueRef)).toBeFalse();

        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(integerValueRef)).toBeFalse();
        expect(vireo.eggShell.checkAndResetValueRefNeedsUpdateFlag(myOutputValueRef)).toBeFalse();

        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
    });
});
