describe('Arrays in Vireo', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();
    var viaPath = fixtures.convertToAbsoluteFromTestItDir('ArrayDemo.via');
    var viName = 'ArrayDemo';
    var runSlicesAsync;

    beforeEach(function () {
        runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
    });

    it('can be resized when they are variable size 1D array', function (done) {
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            var resized = vireo.eggShell.resizeArray(viName, 'variableArray1d', [5]);
            console.log(resized);
            expect(vireo.eggShell.getArrayDimLength(viName, 'variableArray1d', 0)).toBe(5);
            done();
        });
    });

    it('can be resized when they are 1d array with defaults', function (done) {
        var variableName = 'variableArray1dwithDefaults';
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            var resized = vireo.eggShell.resizeArray(viName, variableName, [6]);

            expect(resized).toBe(0);
            expect(vireo.eggShell.getArrayDimLength(viName, variableName, 0)).toBe(6);

            done();
        });
    });

    it('returns error code 1 if the array does not exist', function (done) {
        var variableName = 'imaginaryArrayThatDoesNotExist';
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            var resized = vireo.eggShell.resizeArray(viName, variableName, [6]);
            expect(resized).toBe(1);
            done();
        });
    });

    it('cannot be resized if they are fixed 2d arrays', function (done) {
        var variableName = 'fixedArray2d';
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            var resized = vireo.eggShell.resizeArray(viName, variableName, [3, 4]);

            expect(resized).toBe(2);
            expect(vireo.eggShell.getArrayDimLength(viName, variableName, 0)).toBe(2);
            expect(vireo.eggShell.getArrayDimLength(viName, variableName, 1)).toBe(3);

            done();
        });
    });

    it('can be resized when they are variable 2d array', function (done) {
        var variableName = 'variableArray2d';
        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            var resized = vireo.eggShell.resizeArray(viName, variableName, [3, 4]);

            expect(resized).toBe(0);
            expect(vireo.eggShell.getArrayDimLength(viName, variableName, 0)).toBe(3);
            expect(vireo.eggShell.getArrayDimLength(viName, variableName, 1)).toBe(4);

            done();
        });
    });
});
