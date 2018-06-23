describe('The Vireo EggShell getNumericArray api', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiArrayTypesOptimizedViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ArrayTypesOptimized.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiArrayTypesOptimizedViaUrl
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    it('can read arrays for specific optimized types', function (done) {
        var viName = 'ArrayTypesOptimized';

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(vireo.eggShell.getNumericArray(viName, 'arrayInt8')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, -128, 127]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayInt16')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, -32768, 32767]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayInt32')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, -2147483648, 2147483647]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayUInt8')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, 255]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayUInt16')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, 65535]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayUInt32')).toEqual([8, 6, 7, 5, 3, 0, 9, 0, 4294967295]);
            expect(vireo.eggShell.getNumericArray(viName, 'arraySingle')).toEqual([Math.fround(1.1), Math.fround(2.2), +0, -0, Infinity, NaN, -Infinity, -16777216, 16777216]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayDouble')).toEqual([1.1, 2.2, +0, -0, Infinity, NaN, -Infinity, -9007199254740992, 9007199254740992]);
            expect(vireo.eggShell.getNumericArray(viName, 'array2DInt32')).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
            expect(vireo.eggShell.getNumericArray(viName, 'array3DInt32')).toEqual([[[1, 2, 3], [4, 5, 6], [7, 8, 9]], [[10, 11, 12], [13, 14, 15], [16, 17, 18]]]);
            expect(vireo.eggShell.getNumericArray(viName, 'arrayInt8Empty')).toEqual([]);
            expect(vireo.eggShell.getNumericArray(viName, 'array2DInt8Empty')).toEqual([[]]);
            expect(vireo.eggShell.getNumericArray(viName, 'array3DInt8Empty')).toEqual([[[]]]);

            done();
        });
    });

    it('errors with unsupported types', function (done) {
        var viName = 'ArrayTypesOptimized';

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(function () {
                vireo.eggShell.getNumericArray(viName, 'arrayString');
            }).toThrowError(/Unsupported type/);

            expect(function () {
                vireo.eggShell.getNumericArray(viName, 'arrayBoolean');
            }).toThrowError(/Unsupported type/);

            expect(function () {
                vireo.eggShell.getNumericArray(viName, 'nonExistantPath');
            }).toThrowError(/ObjectNotFoundAtPath/);

            expect(function () {
                vireo.eggShell.getNumericArray(viName, 'scalarUInt32');
            }).toThrowError(/UnexpectedObjectType/);

            done();
        });
    });
});
