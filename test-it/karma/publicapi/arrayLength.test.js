describe('Arrays in Vireo', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();

    it('expose their length in the public api', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromTestItDir('ArrayDemo.via');
        var viName = 'ArrayDemo';

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(vireo.eggShell.getArrayDimLength(viName, 'variableArray1d', 0)).toBe(0);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray1d', 0)).toBe(5);
            expect(vireo.eggShell.getArrayDimLength(viName, 'boundedArray1d', 0)).toBe(0);
            expect(vireo.eggShell.getArrayDimLength(viName, 'variableArray1dwithDefaults', 0)).toBe(4);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray1dwithDefaults', 0)).toBe(5);
            expect(vireo.eggShell.getArrayDimLength(viName, 'boundedArray1dwithDefaults', 0)).toBe(4);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray2d', 0)).toBe(2);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray2d', 1)).toBe(3);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray2d', 2)).toBe(-1);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray3d', 0)).toBe(1);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray3d', 1)).toBe(2);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray3d', 2)).toBe(3);
            expect(vireo.eggShell.getArrayDimLength(viName, 'fixedArray3d', -1)).toBe(-1);
            done();
        });
    });
});
