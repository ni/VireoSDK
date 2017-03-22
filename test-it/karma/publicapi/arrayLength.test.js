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

    it('can read arrays using the optimized functions', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ArrayTypesOptimized.via');
        var viName = 'ArrayTypesOptimized';

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeNonEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(vireo.eggShell.getNumericArray(viName, 'arrayInt8')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, -128, 127]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayInt16')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, -32768, 32767]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayInt32')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, -2147483648, 2147483647]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayUInt8')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, 255]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayUInt16')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, 65535]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayUInt32')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, 4294967295]);
            expect(vireo.eggShell.getNumericArray(viName, 'arraySingle')).toEqual([Math.fround(1.1), Math.fround(2.2), Infinity, NaN, -Infinity, -16777216, 16777216]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayDouble')).toEqual([1.1, 2.2, Infinity, NaN, -Infinity, -9007199254740992, 9007199254740992]);

            expect(function () {
                vireo.eggShell.getNumericArray(viName, 'variableArrayString');
            }).toThrow();
            done();
        });
    });
});
