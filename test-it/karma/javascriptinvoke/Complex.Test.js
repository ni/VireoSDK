// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsComplexFunctionsViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ComplexFunctions.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsComplexFunctionsViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    beforeEach(async function () {
        // Add functions to exercise JavaScriptInvoke behavior
        window.NI_ConcatenateValue = function (fieldName, value) {
            var returnString = fieldName + value;
            return returnString;
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
            expect(viPathParser('returnString')).toBe('Gravity: 10');
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });
});
