// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo testNeedsUpdateAndReset api', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    var internalModule;

    var publicApiTestNeedsUpdateAndResetUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/TestNeedsUpdateAndReset.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiTestNeedsUpdateAndResetUrl
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

    it('can mark data items as needs update and clear', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiTestNeedsUpdateAndResetUrl);

        var outputParameter = vireo.eggShell.findValueRef('MyVI', 'outputParameter');
        var inputParameter = vireo.eggShell.findValueRef('MyVI', 'inputParameter');
        var inputOutputParameter = vireo.eggShell.findValueRef('MyVI', 'inputOutputParameter');
        var localDataItem = vireo.eggShell.findValueRef('MyVI', 'localDataItem');
        var local = vireo.eggShell.findValueRef('MyVI', 'local');
        var localDataItemArray = vireo.eggShell.findValueRef('MyVI', 'localDataItemArray');
        var localArray = vireo.eggShell.findValueRef('MyVI', 'localArray');
        var latchedBoolean = vireo.eggShell.findValueRef('MyVI', 'latchedBoolean');
        var subVIOutputParameter = vireo.eggShell.findValueRef('MySubVI', 'subVIOutputParameter');
        var subVILocalDataItem = vireo.eggShell.findValueRef('MySubVI', 'subVILocalDataItem');

        // Before running expect no updates needed
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(outputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(inputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(inputOutputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(localDataItem)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(local)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(localDataItemArray)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(localArray)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(latchedBoolean)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(subVIOutputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(subVILocalDataItem)).toBeFalse();

        // Run the VI
        var {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();

        // After running expect dataItem updates needed
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(outputParameter)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(inputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(inputOutputParameter)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(localDataItem)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(local)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(localDataItemArray)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(localArray)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(latchedBoolean)).toBeTrue();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(subVIOutputParameter)).toBeFalse();
        expect(internalModule.eggShell.testNeedsUpdateWithoutReset(subVILocalDataItem)).toBeFalse();

        // Test if variable needs update
        expect(vireo.eggShell.testNeedsUpdateAndReset(outputParameter)).toBeTrue();
        expect(vireo.eggShell.testNeedsUpdateAndReset(inputParameter)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(inputOutputParameter)).toBeTrue();
        expect(vireo.eggShell.testNeedsUpdateAndReset(localDataItem)).toBeTrue();
        expect(vireo.eggShell.testNeedsUpdateAndReset(local)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(localDataItemArray)).toBeTrue();
        expect(vireo.eggShell.testNeedsUpdateAndReset(localArray)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(latchedBoolean)).toBeTrue();
        expect(vireo.eggShell.testNeedsUpdateAndReset(subVIOutputParameter)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(subVILocalDataItem)).toBeFalse();

        // expect no variable needs update
        expect(vireo.eggShell.testNeedsUpdateAndReset(outputParameter)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(inputParameter)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(inputOutputParameter)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(localDataItem)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(local)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(localDataItemArray)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(localArray)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(latchedBoolean)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(subVIOutputParameter)).toBeFalse();
        expect(vireo.eggShell.testNeedsUpdateAndReset(subVILocalDataItem)).toBeFalse();
    });
});
