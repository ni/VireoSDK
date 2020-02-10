// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Arrays in Vireo', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    var testsArrayDemoViaUrl = fixtures.convertToAbsoluteFromViaTestsDir('ArrayDemo.via');
    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var runSlicesAsync;

    var resizeArrayHelper = function (viName, path, dimensions) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        vireo.eggShell.resizeArray(valueRef, dimensions);
    };

    var getArrayDimensionsHelper = function (viName, path) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        return vireo.eggShell.getArrayDimensions(valueRef);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            testsArrayDemoViaUrl,
            publicApiMultipleTypesViaUrl
        ], done);
    });

    describe('when using array types', function () {
        var viName = 'ArrayDemo';
        var resizeArray = resizeArrayHelper.bind(undefined, viName);
        var getArrayDimensions = getArrayDimensionsHelper.bind(undefined, viName);

        beforeAll(function () {
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, testsArrayDemoViaUrl);
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

        it('throws for dimension arrays that are invalid arrays', function (done) {
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeNonEmptyString();
                expect(rawPrintError).toBeEmptyString();

                expect(resizeArray.bind(undefined, 'variableArray2d', 'notAnArray')).toThrowError(/to be an array/);

                done();
            });
        });

        it('throws for dimension arrays with non-numeric dimensions', function (done) {
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeNonEmptyString();
                expect(rawPrintError).toBeEmptyString();

                expect(resizeArray.bind(undefined, 'variableArray2d', ['pen', 'pineapple'])).toThrowError(/numeric values/);

                done();
            });
        });

        it('throws for new dimensions with wrong rank', function (done) {
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeNonEmptyString();
                expect(rawPrintError).toBeEmptyString();

                expect(resizeArray.bind(undefined, 'variableArray2d', [1])).toThrowError(/MismatchedArrayRank/);

                done();
            });
        });
    });

    describe('when using non-array types', function () {
        var viName = 'MyVI';
        var resizeArray = resizeArrayHelper.bind(undefined, viName);

        beforeAll(function () {
            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
        });

        it('will throw for a boolean type', function (done) {
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();

                expect(resizeArray.bind(undefined, 'dataItem_Boolean', [3, 4])).toThrowError(/UnexpectedObjectType/);

                done();
            });
        });
    });
});
