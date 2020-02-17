// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var kNITypeMismatchForReturnTypeInJavaScriptInvoke = 44306;

    var vireo;

    var jsReturnDataTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ReturnDataTypes.via');
    var jsUnsupportedJSReturnTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/UnsupportedJSReturnTypes.via');
    var jsUnsupportedVireoReturnTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/UnsupportedVireoReturnTypes.via');
    var jsReturnDataTypesMismatchViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ReturnDataTypesMismatch.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsReturnDataTypesViaUrl,
            jsUnsupportedJSReturnTypesViaUrl,
            jsUnsupportedVireoReturnTypesViaUrl,
            jsReturnDataTypesMismatchViaUrl
        ], done);
    });

    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    beforeEach(async function () {
        // Add functions to exercise JavaScriptInvoke behavior with parameters of different types
        window.NI_TrueBooleanFunction = function () {
            return true;
        };

        window.NI_FalseBooleanFunction = function () {
            return false;
        };

        window.NI_MinInt8Function = function () {
            return -128;
        };

        window.NI_MaxInt8Function = function () {
            return 127;
        };

        window.NI_MinInt16Function = function () {
            return -32768;
        };

        window.NI_MaxInt16Function = function () {
            return 32767;
        };

        window.NI_MinInt32Function = function () {
            return -2147483648;
        };

        window.NI_MaxInt32Function = function () {
            return 2147483647;
        };

        window.NI_MinUInt8Function = function () {
            return 0;
        };

        window.NI_MaxUInt8Function = function () {
            return 255;
        };

        window.NI_MinUInt16Function = function () {
            return 0;
        };

        window.NI_MaxUInt16Function = function () {
            return 65535;
        };

        window.NI_MinUInt32Function = function () {
            return 0;
        };

        window.NI_MaxUInt32Function = function () {
            return 4294967295;
        };

        window.NI_SingleFunction = function () {
            return 3.0;
        };

        window.NI_DoubleFunction = function () {
            return 6.0;
        };

        window.NI_StringFunction = function () {
            return 'National Instruments';
        };

        window.NI_Int8ArrayFunction = function () {
            return Int8Array.from([-128, 0, 127]);
        };

        window.NI_Int16ArrayFunction = function () {
            return Int16Array.from([-32768, 0, 32767]);
        };

        window.NI_Int32ArrayFunction = function () {
            return Int32Array.from([-2147483648, 0, 2147483647]);
        };

        window.NI_UInt8ArrayFunction = function () {
            return Uint8Array.from([0, 1, 255]);
        };

        window.NI_UInt16ArrayFunction = function () {
            return Uint16Array.from([0, 1, 65535]);
        };

        window.NI_UInt32ArrayFunction = function () {
            return Uint32Array.from([0, 1, 4294967295]);
        };

        window.NI_SingleArrayFunction = function () {
            return Float32Array.from([-1.0, 0.0, 1.0]);
        };

        window.NI_DoubleArrayFunction = function () {
            return Float64Array.from([-1.0, 0.0, 1.0]);
        };

        window.NI_JSRefNullValueFunction = function () {
            return null;
        };

        window.NI_JSRefUndefinedValueFunction = function () {
            return this.undefined;
        };

        window.NI_JSRefPrimitiveValueFunction = function () {
            return 'hello world';
        };

        var testObj = {some: 'object'};
        window.NI_JSRefObjectValue = testObj;
        window.NI_JSRefObjectValueFunction = function () {
            return testObj;
        };

        window.NI_JSRefArrayEmptyValueFunction = function () {
            return [];
        };

        window.NI_JSRefArrayWithOneValueFunction = function () {
            return ['hello world'];
        };

        window.NI_JSRefArrayWithMultiplePrimitiveValuesFunction = function () {
            return [null, undefined, 'hello', true, 7];
        };

        var testArrayObj = Object.freeze([
            {},
            function () {
                // intentionally empty

            },
            document.createElement('div')
        ]);
        window.NI_JSRefArrayWithMultipleObjectValues = testArrayObj;
        window.NI_JSRefArrayWithMultipleObjectValuesFunction = function () {
            return testArrayObj;
        };

        window.NI_ReturnFunction = function () {
            var myFunction = function () {
                return;
            };
            return myFunction;
        };

        window.NI_ReturnString = function () {
            return 'myString';
        };

        window.NI_MismatchBoolean = function () {
            return 'myString';
        };

        window.NI_MismatchInt8 = function () {
            return 'myString';
        };

        window.NI_MismatchInt16 = function () {
            return 'myString';
        };

        window.NI_MismatchInt32 = function () {
            return 'myString';
        };

        window.NI_MismatchUInt8 = function () {
            return 'myString';
        };

        window.NI_MismatchUInt16 = function () {
            return 'myString';
        };

        window.NI_MismatchUInt32 = function () {
            return 'myString';
        };

        window.NI_MismatchSingle = function () {
            return 'myString';
        };

        window.NI_MismatchDouble = function () {
            return 'myString';
        };

        window.NI_MismatchString = function () {
            return false;
        };

        window.NI_MismatchInt8ArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchInt16ArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchInt32ArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchUInt8ArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchUInt16ArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchUInt32ArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchSingleArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchDoubleArrayFunction = function () {
            return 'myString';
        };

        window.NI_MismatchJavaScriptReferenceArrayFunction = function () {
            return 'myString';
        };

        window.NI_ExceptionInUpdateReturnValue = function () {
            var notReallyAnArrayPrototype = Object.create(Int16Array.prototype);
            Object.defineProperty(notReallyAnArrayPrototype, 'length', {
                get: function () {
                    throw new Error('Not really a typed array length');
                }
            });
            var notReallyAnArray = Object.create(notReallyAnArrayPrototype);
            expect(notReallyAnArray instanceof Int16Array).toBeTrue();
            return notReallyAnArray;
        };
    });

    afterEach(function () {
        // Cleanup functions
        window.NI_TrueBooleanFunction = undefined;
        window.NI_FalseBooleanFunction = undefined;
        window.NI_MinInt8Function = undefined;
        window.NI_MaxInt8Function = undefined;
        window.NI_MinInt16Function = undefined;
        window.NI_MaxInt16Function = undefined;
        window.NI_MinInt32Function = undefined;
        window.NI_MaxInt32Function = undefined;
        window.NI_MinUInt8Function = undefined;
        window.NI_MaxUInt8Function = undefined;
        window.NI_MinUInt16Function = undefined;
        window.NI_MaxUInt16Function = undefined;
        window.NI_MinUInt32Function = undefined;
        window.NI_MaxUInt32Function = undefined;
        window.NI_SingleFunction = undefined;
        window.NI_DoubleFunction = undefined;
        window.NI_StringFunction = undefined;
        window.NI_Int8ArrayFunction = undefined;
        window.NI_Int16ArrayFunction = undefined;
        window.NI_Int32ArrayFunction = undefined;
        window.NI_UInt8ArrayFunction = undefined;
        window.NI_UInt16ArrayFunction = undefined;
        window.NI_UInt32ArrayFunction = undefined;
        window.NI_SingleArrayFunction = undefined;
        window.NI_DoubleArrayFunction = undefined;
        window.NI_JSRefNullValueFunction = undefined;
        window.NI_JSRefUndefinedValueFunction = undefined;
        window.NI_JSRefPrimitiveValueFunction = undefined;
        window.NI_JSRefObjectValue = undefined;
        window.NI_JSRefObjectValueFunction = undefined;
        window.NI_JSRefArrayEmptyValueFunction = undefined;
        window.NI_JSRefArrayWithOneValueFunction = undefined;
        window.NI_JSRefArrayWithMultiplePrimitiveValuesFunction = undefined;
        window.NI_JSRefArrayWithMultipleObjectValues = undefined;
        window.NI_JSRefArrayWithMultipleObjectValuesFunction = undefined;
        window.NI_ReturnFunction = undefined;
        window.NI_ReturnString = undefined;
        window.NI_MismatchBoolean = undefined;
        window.NI_MismatchInt8 = undefined;
        window.NI_MismatchInt16 = undefined;
        window.NI_MismatchInt32 = undefined;
        window.NI_MismatchUInt8 = undefined;
        window.NI_MismatchUInt16 = undefined;
        window.NI_MismatchUInt32 = undefined;
        window.NI_MismatchSingle = undefined;
        window.NI_MismatchDouble = undefined;
        window.NI_MismatchString = undefined;
        window.NI_MismatchInt8ArrayFunction = undefined;
        window.NI_MismatchInt16ArrayFunction = undefined;
        window.NI_MismatchInt32ArrayFunction = undefined;
        window.NI_MismatchUInt8ArrayFunction = undefined;
        window.NI_MismatchUInt16ArrayFunction = undefined;
        window.NI_MismatchUInt32ArrayFunction = undefined;
        window.NI_MismatchSingleArrayFunction = undefined;
        window.NI_MismatchDoubleArrayFunction = undefined;
        window.NI_MismatchJavaScriptReferenceArrayFunction = undefined;
        window.NI_ExceptionInUpdateReturnValue = undefined;
    });

    it('succesfully returns different data types', function (done) {
        var viName = 'MyVI';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsReturnDataTypesViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);

        var jsReferenceReader = function (path) {
            var valueRef = vireo.eggShell.findValueRef(viName, path);
            return vireo.eggShell.readJavaScriptRefNum(valueRef);
        };

        var jsArrayReferenceReader = function (path) {
            var valueRef = vireo.eggShell.findValueRef(viName, path);
            var length = vireo.eggShell.getArrayDimensions(valueRef)[0];
            var subValueRef, i;
            var result = [];
            for (i = 0; i < length; i += 1) {
                subValueRef = vireo.eggShell.findSubValueRef(valueRef, String(i));
                result[i] = vireo.eggShell.readJavaScriptRefNum(subValueRef);
            }
            return result;
        };

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(viPathParser('returnTrueBoolean')).toBeTrue();
            expect(viPathParser('returnFalseBoolean')).toBeFalse();
            expect(viPathParser('returnMinInt8')).toBe(-128);
            expect(viPathParser('returnMaxInt8')).toBe(127);
            expect(viPathParser('returnMinInt16')).toBe(-32768);
            expect(viPathParser('returnMaxInt16')).toBe(32767);
            expect(viPathParser('returnMinInt32')).toBe(-2147483648);
            expect(viPathParser('returnMaxInt32')).toBe(2147483647);
            expect(viPathParser('returnMinUInt8')).toBe(0);
            expect(viPathParser('returnMaxUInt8')).toBe(255);
            expect(viPathParser('returnMinUInt16')).toBe(0);
            expect(viPathParser('returnMaxUInt16')).toBe(65535);
            expect(viPathParser('returnMinUInt32')).toBe(0);
            expect(viPathParser('returnMaxUInt32')).toBe(4294967295);
            expect(viPathParser('returnSingle')).toBe(3.0);
            expect(viPathParser('returnDouble')).toBe(6.0);
            expect(viPathParser('returnString')).toBe('National Instruments');
            expect(viPathParser('returnInt8Array')).toEqual([-128, 0, 127]);
            expect(viPathParser('returnInt16Array')).toEqual([-32768, 0, 32767]);
            expect(viPathParser('returnInt32Array')).toEqual([-2147483648, 0, 2147483647]);
            expect(viPathParser('returnUInt8Array')).toEqual([0, 1, 255]);
            expect(viPathParser('returnUInt16Array')).toEqual([0, 1, 65535]);
            expect(viPathParser('returnUInt32Array')).toEqual([0, 1, 4294967295]);
            expect(viPathParser('returnSingleArray')).toEqual([-1.0, 0.0, 1.0]);
            expect(viPathParser('returnDoubleArray')).toEqual([-1.0, 0.0, 1.0]);
            expect(jsReferenceReader('jsRefNullValue')).toBe(null);
            expect(jsReferenceReader('jsRefUndefinedValue')).toBe(undefined);
            expect(jsReferenceReader('jsRefPrimitiveValue')).toBe('hello world');
            expect(jsReferenceReader('jsRefObjectValue')).toBe(window.NI_JSRefObjectValue);
            expect(jsArrayReferenceReader('jsRefArrayEmptyValue')).toEqual([]);
            expect(jsArrayReferenceReader('jsRefArrayWithOneValue')).toEqual(['hello world']);
            expect(jsArrayReferenceReader('jsRefArrayWithMultiplePrimitiveValues')).toEqual([null, undefined, 'hello', true, 7]);
            var testArrayObj = jsArrayReferenceReader('jsRefArrayWithMultipleObjectValues');
            expect(testArrayObj.length).toBe(3);
            expect(testArrayObj[0]).toBe(window.NI_JSRefArrayWithMultipleObjectValues[0]);
            expect(testArrayObj[1]).toBe(window.NI_JSRefArrayWithMultipleObjectValues[1]);
            expect(testArrayObj[2]).toBe(window.NI_JSRefArrayWithMultipleObjectValues[2]);
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });

    it('returns an error for unsupported JavaScript data types', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsUnsupportedJSReturnTypesViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('error.code'));
            expect(viPathParser('error.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });

    it('returns an error for unsupported LabVIEW data types', async function () {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsUnsupportedVireoReturnTypesViaUrl);

        var exception;
        try {
            await runSlicesAsync();
        } catch (ex) {
            exception = ex;
        }
        expect(exception.rawPrint).toBeEmptyString();
        expect(exception.rawPrintError).toBeEmptyString();
        expect(exception instanceof Error).toBeTrue();
        expect(exception.message).toMatch(/Visitor must have a method named/);
    });

    it('returns an error for type mismatch on return values', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsReturnDataTypesMismatchViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('errorBoolean.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorBoolean.code'));
            expect(viPathParser('errorBoolean.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorInt8.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorInt8.code'));
            expect(viPathParser('errorInt8.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorInt16.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorInt16.code'));
            expect(viPathParser('errorInt16.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorInt32.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorInt32.code'));
            expect(viPathParser('errorInt32.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorUInt8.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorUInt8.code'));
            expect(viPathParser('errorUInt8.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorUInt16.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorUInt16.code'));
            expect(viPathParser('errorUInt16.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorUInt32.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorUInt32.code'));
            expect(viPathParser('errorUInt32.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorSingle.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorSingle.code'));
            expect(viPathParser('errorSingle.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorDouble.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorDouble.code'));
            expect(viPathParser('errorDouble.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorString.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorString.code'));
            expect(viPathParser('errorString.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorInt8Array.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorInt8Array.code'));
            expect(viPathParser('errorInt8Array.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorInt16Array.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorInt16Array.code'));
            expect(viPathParser('errorInt16Array.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorInt32Array.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorInt32Array.code'));
            expect(viPathParser('errorInt32Array.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorUInt8Array.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorUInt8Array.code'));
            expect(viPathParser('errorUInt8Array.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorUInt16Array.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorUInt16Array.code'));
            expect(viPathParser('errorUInt16Array.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorUInt32Array.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorUInt32Array.code'));
            expect(viPathParser('errorUInt32Array.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorSingleArray.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorSingleArray.code'));
            expect(viPathParser('errorSingleArray.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorDoubleArray.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorDoubleArray.code'));
            expect(viPathParser('errorDoubleArray.source')).toMatch(/JavaScriptInvoke in MyVI/);
            expect(viPathParser('errorJavaScriptReferenceArray.status')).toBeTrue();
            expect([kNITypeMismatchForReturnTypeInJavaScriptInvoke]).toContain(viPathParser('errorJavaScriptReferenceArray.code'));
            expect(viPathParser('errorJavaScriptReferenceArray.source')).toMatch(/JavaScriptInvoke in MyVI/);
            done();
        });
    });

    it('Exception thrown in UpdateReturnValue is handled and reported', function (done) {
        var viName = 'ExceptionInUpdateReturnValue';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsReturnDataTypesViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);
        runSlicesAsync(function () {
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(44303);
            expect(viPathParser('error.source')).toMatch(/Unable to set return value/);
            done();
        });
    });
});
