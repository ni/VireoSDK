describe('The Vireo EggShell getArrayDimensions api', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var testsArrayDemoViaUrl = fixtures.convertToAbsoluteFromViaTestsDir('ArrayDemo.via');
    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viNameArrayDemo = 'ArrayDemo';
    var viNameMultipleTypes = 'MyVI';
    var getArrayDimensionsHelper = function (viName, path) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        var dimensions = vireo.eggShell.getArrayDimensions(valueRef);
        return dimensions;
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            testsArrayDemoViaUrl,
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    it('can expose array lengths', function (done) {
        var getArrayDimensions = getArrayDimensionsHelper.bind(undefined, viNameArrayDemo);
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, testsArrayDemoViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(getArrayDimensions('variableArray1d')).toEqual([0]);
            expect(getArrayDimensions('fixedArray1d')).toEqual([5]);
            expect(getArrayDimensions('boundedArray1d')).toEqual([0]);
            expect(getArrayDimensions('variableArray1dwithDefaults')).toEqual([4]);
            expect(getArrayDimensions('fixedArray1dwithDefaults')).toEqual([5]);
            expect(getArrayDimensions('boundedArray1dwithDefaults')).toEqual([4]);
            expect(getArrayDimensions('fixedArray2d')).toEqual([2, 3]);
            expect(getArrayDimensions('fixedArray3d')).toEqual([1, 2, 3]);
            done();
        });
    });

    it('errors for unsupported types', function (done) {
        var getArrayDimensions = getArrayDimensionsHelper.bind(undefined, viNameMultipleTypes);
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(getArrayDimensions.bind(undefined, 'dataItem_Boolean')).toThrowError(/UnexpectedObjectType/);
            done();
        });
    });
});
