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

    it('to throw for a nonexistant vi name', function () {
        var invalidViName = function () {
            vireo.eggShell.findValueRef('nonexistantvi', pathName);
        };
        expect(invalidViName).toThrowError(/ObjectNotFoundAtPath/);
    });

    it('to throw for an empty vi name', function () {
        var invalidViName = function () {
            vireo.eggShell.findValueRef('', pathName);
        };
        expect(invalidViName).toThrowError(/ObjectNotFoundAtPath/);
    });

    it('to throw for a nonexistant path', function () {
        var invalidPath = function () {
            vireo.eggShell.findValueRef(viName, 'nonexistantvalue');
        };
        expect(invalidPath).toThrowError(/ObjectNotFoundAtPath/);
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
