// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo EggShell findValueRef api can', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';
    var pathName = 'dataItem_NumericDouble';

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    it('find a value in memory', function () {
        var valueRef = vireo.eggShell.findValueRef(viName, pathName);
        expect(valueRef).toBeNonEmptyObject();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.typeRef).not.toBe(0);
        expect(valueRef.dataRef).toBeNumber();
        expect(valueRef.dataRef).not.toBe(0);
    });

    it('to return undefined for a nonexistant vi name', function () {
        var valueRef = vireo.eggShell.findValueRef('nonexistantvi', pathName);
        expect(valueRef).toBeUndefined();
    });

    it('to return undefined for an empty vi name', function () {
        var valueRef = vireo.eggShell.findValueRef('', pathName);
        expect(valueRef).toBeUndefined();
    });

    it('to return undefined for a nonexistant path', function () {
        var valueRef = vireo.eggShell.findValueRef(viName, 'nonexistantvalue');
        expect(valueRef).toBeUndefined();
    });

    it('to return a typeRef for the the local scope of a VI for an empty path', function () {
        var valueRef = vireo.eggShell.findValueRef(viName, '');
        expect(valueRef).toBeNonEmptyObject();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.typeRef).not.toBe(0);
        expect(valueRef.dataRef).toBeNumber();
        expect(valueRef.dataRef).not.toBe(0);
    });
});
