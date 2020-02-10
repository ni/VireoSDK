// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo EggShell Typed Array api', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiArrayTypesOptimizedViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ArrayTypesOptimized.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiArrayTypesOptimizedViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    var viName = 'ArrayTypesOptimized';
    var readTypedArray = function (path) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        var typedArray = vireo.eggShell.readTypedArray(valueRef);
        return typedArray;
    };

    var writeTypedArrayTest = function (path, value) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        vireo.eggShell.writeTypedArray(valueRef, value);
        var valueRead = vireo.eggShell.readTypedArray(valueRef);
        expect(valueRead).toEqual(value);
    };

    var resizeAndWriteTypedArrayTest = function (path, value, newDimensions) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        vireo.eggShell.resizeArray(valueRef, newDimensions);
        vireo.eggShell.writeTypedArray(valueRef, value);
        var valueRead = vireo.eggShell.readTypedArray(valueRef);
        expect(valueRead).toEqual(value);
    };

    var tryWriteTypedArrayTest = function (path, value) {
        return function () {
            writeTypedArrayTest(path, value);
        };
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

            expect(vireo.eggShell.findValueRef(viName, 'nonExistantPath')).toBeUndefined();

            expect(function () {
                readTypedArray('scalarUInt32');
            }).toThrowError(/UnexpectedObjectType/);

            done();
        });
    });

    it('errors while trying to write an array of different size', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            expect(tryWriteTypedArrayTest('arrayInt8Empty', new Int8Array([255]))).toThrowError(/length/);
            expect(tryWriteTypedArrayTest('array2DInt8Empty', new Int8Array([255]))).toThrowError(/length/);
            expect(tryWriteTypedArrayTest('array3DInt8Empty', new Int8Array([255]))).toThrowError(/length/);
            expect(tryWriteTypedArrayTest('arrayBoolean', new Uint8Array([1, 0]))).toThrowError(/length/);

            done();
        });
    });

    it('can write arrays for specific optimized types with same length', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            writeTypedArrayTest('arrayInt8', new Int8Array([4, 3, 2, 1, 8, 6, 7, 0, -128, 127]));
            writeTypedArrayTest('arrayInt16', new Int16Array([-8, -6, 7, 5, -3, 0, 9, 0, -32768, 32767]));
            writeTypedArrayTest('arrayInt32', new Int32Array([-2147483648, 2147483647, 5, 3, 0, 9, 0, 1024, 9000, 11]));
            writeTypedArrayTest('arrayUInt8', new Uint8Array([255, 8, 6, 7, 5, 3, 9, 0, 255]));
            writeTypedArrayTest('arrayUInt16', new Uint16Array([1, 2, 3, 8, 3, 0, 9, 0, 65535]));
            writeTypedArrayTest('arrayUInt32', new Uint32Array([4294967295, 6, 7, 7, 9, 111, 5, 3, 4294967295]));
            writeTypedArrayTest('arraySingle', new Float32Array([Infinity, NaN, -Infinity, -16777216, 16777216, Math.fround(1.1), Math.fround(2.2), +0, -0]));
            writeTypedArrayTest('arrayDouble', new Float64Array([3.14, 6.28, +0, -0, Infinity, NaN, -Infinity, -9007199254740992, 9007199254740992]));
            writeTypedArrayTest('arrayEnum8', new Uint8Array([10, 9, 8]));
            writeTypedArrayTest('arrayEnum16', new Uint16Array([7, 6, 5]));
            writeTypedArrayTest('arrayEnum32', new Uint32Array([4, 3, 2]));
            writeTypedArrayTest('arrayBoolean', new Uint8Array([1, 1, 1, 1]));
            writeTypedArrayTest('stringHello', new Uint8Array([0x48, 0x6F, 0x6C, 0x61, 0x00]));
            writeTypedArrayTest('stringControlCharacters', new Uint8Array([31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]));

            done();
        });
    });

    it('can write arrays for specific optimized types with different lengths after resizing array', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();

            resizeAndWriteTypedArrayTest('arrayInt8Empty', new Int8Array([1, 2, 3, 4, 5]), [5]);
            resizeAndWriteTypedArrayTest('array2DInt8Empty', new Int8Array([0, 1, 2, 3]), [2, 2]);
            resizeAndWriteTypedArrayTest('array3DInt8Empty', new Int8Array([1, 2, 3, 4, 5, 6, 7, 8]), [2, 2, 2]);

            done();
        });
    });

    it('errors when writing mismatched types', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiArrayTypesOptimizedViaUrl);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(tryWriteTypedArrayTest('arrayInt8', [])).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayInt8', new Int16Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayInt16', new Uint16Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayInt32', new Int8Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayUInt8', new Int16Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayUInt16', new Int32Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayUInt32', new Uint16Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arraySingle', new Int16Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayDouble', new Float32Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayEnum8', new Float32Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayEnum16', new Int16Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayEnum32', new Float64Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('arrayBoolean', new Int32Array())).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteTypedArrayTest('stringHello', new Uint16Array())).toThrowError(/UnexpectedObjectType/);
            done();
        });
    });
});
