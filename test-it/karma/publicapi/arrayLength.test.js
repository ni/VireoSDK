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
            expect(vireo.eggShell.get1DArrayLength(viName, 'variableArray1d')).toBe(0);
            expect(vireo.eggShell.get1DArrayLength(viName, 'fixedArray1d')).toBe(5);
            expect(vireo.eggShell.get1DArrayLength(viName, 'boundedArray1d')).toBe(0);
            expect(vireo.eggShell.get1DArrayLength(viName, 'variableArray1dwithDefaults')).toBe(4);
            expect(vireo.eggShell.get1DArrayLength(viName, 'fixedArray1dwithDefaults')).toBe(5);
            expect(vireo.eggShell.get1DArrayLength(viName, 'boundedArray1dwithDefaults')).toBe(4);
            expect(vireo.eggShell.get1DArrayLength(viName, 'fixedArray2d')).toBe(-1);
            expect(vireo.eggShell.get1DArrayLength(viName, 'fixedArray3d')).toBe(-1);
            done();
        });
    });
});
