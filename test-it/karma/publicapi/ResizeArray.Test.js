describe('Arrays in Vireo', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();
    var viaPath = fixtures.convertToAbsoluteFromViaTestsDir('ArrayDemo.via');
    var viName = 'ArrayDemo';
    var runSlicesAsync;

    var resizeArray = function (path, dimensions) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        vireo.eggShell.resizeArray(valueRef, dimensions);
    };

    var getArrayDimensions = function (path) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        return vireo.eggShell.getArrayDimensions(valueRef);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            viaPath
        ], done);
    });

    beforeEach(function () {
        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
    });

    it('can be resized when they are variable size 1D array', function (done) {
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            resizeArray('variableArray1d', [5]);
            expect(getArrayDimensions('variableArray1d')).toEqual([5]);
            done();
        });
    });

    it('can be resized when they are 1d array with defaults', function (done) {
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();
            resizeArray('variableArray1dwithDefaults', [6]);
            expect(getArrayDimensions('variableArray1dwithDefaults')).toEqual([6]);

            done();
        });
    });

    it('cannot be resized if they are fixed 2d arrays', function (done) {
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(resizeArray.bind(undefined, 'fixedArray2d', [3, 4])).toThrowError(/UnableToCreateReturnBuffer/);

            done();
        });
    });

    it('can be resized when they are variable 2d array', function (done) {
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            resizeArray('variableArray2d', [3, 4]);
            expect(getArrayDimensions('variableArray2d')).toEqual([3, 4]);

            done();
        });
    });
});
