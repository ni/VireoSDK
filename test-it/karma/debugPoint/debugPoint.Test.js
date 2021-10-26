// Copyright (c) 2021 National Instruments
// SPDX-License-Identifier: MIT

describe('A via file with debug point ', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var simpleAddNodeViaUrl = fixtures.convertToAbsoluteFromFixturesDir('debugpoint/SimpleAddNode.via');
    var addNodeWithCaseStructureViaUrl = fixtures.convertToAbsoluteFromFixturesDir('debugpoint/AddNodeWithCaseStructure.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            simpleAddNodeViaUrl,
            addNodeWithCaseStructureViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    it('on executing succesfully set the needs update property on corresponding local ', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, simpleAddNodeViaUrl);
        var sumIndicator = vireo.eggShell.findValueRef('MyVI', 'dataItem_Sum');
        expect(vireo.eggShell.testNeedsUpdateAndReset(sumIndicator)).toBeFalse();
        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(vireo.eggShell.testNeedsUpdateAndReset(sumIndicator)).toBeTrue();
    });

    it('on not executing will not set the needs update property on corresponding local', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, addNodeWithCaseStructureViaUrl);
        var sumIndicator = vireo.eggShell.findValueRef('MyVI', 'dataItem_Sum');
        expect(vireo.eggShell.testNeedsUpdateAndReset(sumIndicator)).toBeFalse();
        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        expect(vireo.eggShell.testNeedsUpdateAndReset(sumIndicator)).toBeFalse();
    });
});
