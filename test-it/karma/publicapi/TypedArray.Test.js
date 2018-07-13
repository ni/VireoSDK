describe('The Vireo EggShell Typed Array api', function () {
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

    var viName = 'ArrayTypesOptimized';
    var readTypedArray = function (path) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        var typedArray = vireo.eggShell.readTypedArray(valueRef);
        return typedArray;
    };

    it('can read arrays for specific optimized types', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(readTypedArray('arrayInt8') instanceof Int8Array).toBeTrue();
            expect(readTypedArray('arrayInt8')).toEqual(new Int8Array([8, 6, 7, 5, 3, 0, 9, 0, -128, 127]));
            expect(readTypedArray('arrayInt16') instanceof Int16Array).toBeTrue();
            expect(readTypedArray('arrayInt16')).toEqual(new Int16Array([8, 6, 7, 5, 3, 0, 9, 0, -32768, 32767]));
            expect(readTypedArray('arrayInt32') instanceof Int32Array).toBeTrue();
            expect(readTypedArray('arrayInt32')).toEqual(new Int32Array([8, 6, 7, 5, 3, 0, 9, 0, -2147483648, 2147483647]));
            expect(readTypedArray('arrayUInt8') instanceof Uint8Array).toBeTrue();
            expect(readTypedArray('arrayUInt8')).toEqual(new Uint8Array([8, 6, 7, 5, 3, 0, 9, 0, 255]));
            expect(readTypedArray('arrayUInt16') instanceof Uint16Array).toBeTrue();
            expect(readTypedArray('arrayUInt16')).toEqual(new Uint16Array([8, 6, 7, 5, 3, 0, 9, 0, 65535]));
            expect(readTypedArray('arrayUInt32') instanceof Uint32Array).toBeTrue();
            expect(readTypedArray('arrayUInt32')).toEqual(new Uint32Array([8, 6, 7, 5, 3, 0, 9, 0, 4294967295]));
            expect(readTypedArray('arraySingle') instanceof Float32Array).toBeTrue();
            expect(readTypedArray('arraySingle')).toEqual(new Float32Array([Math.fround(1.1), Math.fround(2.2), +0, -0, Infinity, NaN, -Infinity, -16777216, 16777216]));
            expect(readTypedArray('arrayDouble') instanceof Float64Array).toBeTrue();
            expect(readTypedArray('arrayDouble')).toEqual(new Float64Array([1.1, 2.2, +0, -0, Infinity, NaN, -Infinity, -9007199254740992, 9007199254740992]));
            expect(readTypedArray('array2DInt32') instanceof Int32Array).toBeTrue();
            expect(readTypedArray('array2DInt32')).toEqual(new Int32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
            expect(readTypedArray('array3DInt32') instanceof Int32Array).toBeTrue();
            expect(readTypedArray('array3DInt32')).toEqual(new Int32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]));
            expect(readTypedArray('arrayInt8Empty') instanceof Int8Array).toBeTrue();
            expect(readTypedArray('arrayInt8Empty')).toEqual(new Int8Array([]));
            expect(readTypedArray('array2DInt8Empty') instanceof Int8Array).toBeTrue();
            expect(readTypedArray('array2DInt8Empty')).toEqual(new Int8Array([]));
            expect(readTypedArray('array3DInt8Empty') instanceof Int8Array).toBeTrue();
            expect(readTypedArray('array3DInt8Empty')).toEqual(new Int8Array([]));
            expect(readTypedArray('arrayEnum8') instanceof Uint8Array).toBeTrue();
            expect(readTypedArray('arrayEnum8')).toEqual(new Uint8Array([3, 2, 1]));
            expect(readTypedArray('arrayEnum16') instanceof Uint16Array).toBeTrue();
            expect(readTypedArray('arrayEnum16')).toEqual(new Uint16Array([3, 2, 1]));
            expect(readTypedArray('arrayEnum32') instanceof Uint32Array).toBeTrue();
            expect(readTypedArray('arrayEnum32')).toEqual(new Uint32Array([3, 2, 1]));
            expect(readTypedArray('arrayBoolean') instanceof Uint8Array).toBeTrue();
            expect(readTypedArray('arrayBoolean')).toEqual(new Uint8Array([1, 0, 1, 0]));
            expect(readTypedArray('stringHello') instanceof Uint8Array).toBeTrue();
            expect(readTypedArray('stringHello')).toEqual(new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]));
            expect(readTypedArray('stringControlCharacters') instanceof Uint8Array).toBeTrue();
            expect(readTypedArray('stringControlCharacters')).toEqual(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]));
            done();
        });
    });

    it('errors with unsupported types', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(function () {
                readTypedArray('arrayString');
            }).toThrowError(/UnexpectedObjectType/);

            expect(function () {
                readTypedArray('nonExistantPath');
            }).toThrowError(/ObjectNotFoundAtPath/);

            expect(function () {
                readTypedArray('scalarUInt32');
            }).toThrowError(/UnexpectedObjectType/);

            done();
        });
    });
});
