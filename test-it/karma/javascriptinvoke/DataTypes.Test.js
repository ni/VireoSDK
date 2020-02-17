// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    var vireoBuffer;

    var jsDataTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/DataTypes.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsDataTypesViaUrl
        ], done);
    });

    beforeEach(async function () {
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = await vireoHelpers.createInstance();
        vireoBuffer = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired.HEAP8.buffer;

        // Add functions to exercise JavaScriptInvoke behavior with parameters of different types
        window.NI_BooleanFunction = function (trueValue, falseValue) {
            var result = trueValue && falseValue;
            return result;
        };

        window.NI_Int8Function = function (minValue, maxValue) {
            var result = maxValue - minValue;
            return result;
        };

        window.NI_Int16Function = function (minValue, maxValue) {
            var result = maxValue - minValue;
            return result;
        };

        window.NI_Int32Function = function (minValue, maxValue) {
            var result = maxValue - minValue;
            return result;
        };

        window.NI_UInt8Function = function (minValue, maxValue) {
            var result = maxValue - minValue;
            return result;
        };

        window.NI_UInt16Function = function (minValue, maxValue) {
            var result = maxValue - minValue;
            return result;
        };

        window.NI_UInt32Function = function (minValue, maxValue) {
            var result = maxValue - minValue;
            return result;
        };

        window.NI_SingleFunction = function (value) {
            return value;
        };

        window.NI_DoubleFunction = function (value) {
            return value;
        };

        window.NI_StringFunction = function (value) {
            return value;
        };

        window.NI_Int8ArrayFunction = function (value) {
            expect(value instanceof Int8Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_Int16ArrayFunction = function (value) {
            expect(value instanceof Int16Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_Int32ArrayFunction = function (value) {
            expect(value instanceof Int32Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_UInt8ArrayFunction = function (value) {
            expect(value instanceof Uint8Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_UInt16ArrayFunction = function (value) {
            expect(value instanceof Uint16Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_UInt32ArrayFunction = function (value) {
            expect(value instanceof Uint32Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_SingleArrayFunction = function (value) {
            expect(value instanceof Float32Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_DoubleArrayFunction = function (value) {
            expect(value instanceof Float64Array).toBeTrue();
            expect(value.buffer).not.toBe(vireoBuffer);
            return value;
        };

        window.NI_JSRefNullValueFunction = function (value) {
            return value;
        };

        window.NI_JSRefUndefinedValueFunction = function (value) {
            return value;
        };

        window.NI_JSRefPrimitiveValueFunction = function (value) {
            return value;
        };

        var testObj = {some: 'object'};
        window.NI_JSRefObjectValue = testObj;
        window.NI_JSRefObjectValueFunction = function (value) {
            expect(value).toBe(testObj);
            return value;
        };

        window.NI_JSRefArrayEmptyValueFunction = function (value) {
            return value;
        };

        window.NI_JSRefArrayWithOneValueFunction = function (value) {
            return value;
        };

        window.NI_JSRefArrayWithMultiplePrimitiveValuesFunction = function (value) {
            return value;
        };

        var testArrayObj = Object.freeze([
            {},
            function () {
                // intentionally empty

            },
            document.createElement('div')
        ]);
        window.NI_JSRefArrayWithMultipleObjectValues = testArrayObj;
        window.NI_JSRefArrayWithMultipleObjectValuesFunction = function (value) {
            expect(Array.isArray(value)).toBeTrue();
            expect(value.length).toBe(3);
            expect(value[0]).toBe(testArrayObj[0]);
            expect(value[0]).toBeObject();
            expect(value[1]).toBe(testArrayObj[1]);
            expect(value[1]).toBeFunction();
            expect(value[2]).toBe(testArrayObj[2]);
            expect(value[2] instanceof HTMLDivElement).toBeTrue();

            return value;
        };
    });

    afterEach(function () {
        vireo = undefined;
        vireoBuffer = undefined;
        // Cleanup functions
        window.NI_BooleanFunction = undefined;
        window.NI_Int8Function = undefined;
        window.NI_Int16Function = undefined;
        window.NI_Int32Function = undefined;
        window.NI_UInt8Function = undefined;
        window.NI_UInt16Function = undefined;
        window.NI_UInt32Function = undefined;
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
    });

    it('successfully pass different data types', function (done) {
        var viName = 'MyVI';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsDataTypesViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);

        var jsReferenceWriter = function (path, value) {
            var valueRef = vireo.eggShell.findValueRef(viName, path);
            vireo.eggShell.writeJavaScriptRefNum(valueRef, value);
        };

        var jsArrayReferenceWriter = function (path, value) {
            var valueRef = vireo.eggShell.findValueRef(viName, path);
            vireo.eggShell.resizeArray(valueRef, [value.length]);
            value.forEach(function (curr, i) {
                var subValueRef = vireo.eggShell.findSubValueRef(valueRef, String(i));
                vireo.eggShell.writeJavaScriptRefNum(subValueRef, curr);
            });
        };

        jsReferenceWriter('jsRefNullValue', null);
        jsReferenceWriter('jsRefUndefinedValue', undefined);
        jsReferenceWriter('jsRefPrimitiveValue', 'hello world');
        jsReferenceWriter('jsRefObjectValue', window.NI_JSRefObjectValue);
        jsArrayReferenceWriter('jsRefArrayEmptyValue', []);
        jsArrayReferenceWriter('jsRefArrayWithOneValue', ['hello world']);
        jsArrayReferenceWriter('jsRefArrayWithMultiplePrimitiveValues', [null, undefined, 'hello', true, 7]);
        jsArrayReferenceWriter('jsRefArrayWithMultipleObjectValues', window.NI_JSRefArrayWithMultipleObjectValues);

        spyOn(window, 'NI_BooleanFunction').and.callThrough();
        spyOn(window, 'NI_Int8Function').and.callThrough();
        spyOn(window, 'NI_Int16Function').and.callThrough();
        spyOn(window, 'NI_Int32Function').and.callThrough();
        spyOn(window, 'NI_UInt8Function').and.callThrough();
        spyOn(window, 'NI_UInt16Function').and.callThrough();
        spyOn(window, 'NI_UInt32Function').and.callThrough();
        spyOn(window, 'NI_SingleFunction').and.callThrough();
        spyOn(window, 'NI_DoubleFunction').and.callThrough();
        spyOn(window, 'NI_StringFunction').and.callThrough();
        spyOn(window, 'NI_Int8ArrayFunction').and.callThrough();
        spyOn(window, 'NI_Int16ArrayFunction').and.callThrough();
        spyOn(window, 'NI_Int32ArrayFunction').and.callThrough();
        spyOn(window, 'NI_UInt8ArrayFunction').and.callThrough();
        spyOn(window, 'NI_UInt16ArrayFunction').and.callThrough();
        spyOn(window, 'NI_UInt32ArrayFunction').and.callThrough();
        spyOn(window, 'NI_SingleArrayFunction').and.callThrough();
        spyOn(window, 'NI_DoubleArrayFunction').and.callThrough();
        spyOn(window, 'NI_JSRefNullValueFunction').and.callThrough();
        spyOn(window, 'NI_JSRefUndefinedValueFunction').and.callThrough();
        spyOn(window, 'NI_JSRefPrimitiveValueFunction').and.callThrough();
        spyOn(window, 'NI_JSRefObjectValueFunction').and.callThrough();
        spyOn(window, 'NI_JSRefArrayEmptyValueFunction').and.callThrough();
        spyOn(window, 'NI_JSRefArrayWithOneValueFunction').and.callThrough();
        spyOn(window, 'NI_JSRefArrayWithMultiplePrimitiveValuesFunction').and.callThrough();
        spyOn(window, 'NI_JSRefArrayWithMultipleObjectValuesFunction').and.callThrough();

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(window.NI_BooleanFunction).toHaveBeenCalledWith(true, false);
            expect(window.NI_Int8Function).toHaveBeenCalledWith(-128, 127);
            expect(window.NI_Int16Function).toHaveBeenCalledWith(-32768, 32767);
            expect(window.NI_Int32Function).toHaveBeenCalledWith(-2147483648, 2147483647);
            expect(window.NI_UInt8Function).toHaveBeenCalledWith(0, 255);
            expect(window.NI_UInt16Function).toHaveBeenCalledWith(0, 65535);
            expect(window.NI_UInt32Function).toHaveBeenCalledWith(0, 4294967295);
            expect(window.NI_SingleFunction).toHaveBeenCalledWith(3.0);
            expect(window.NI_DoubleFunction).toHaveBeenCalledWith(6.0);
            expect(window.NI_StringFunction).toHaveBeenCalledWith('National Instruments');
            expect(window.NI_Int8ArrayFunction).toHaveBeenCalledWith(Int8Array.from([-128, 0, 127]));
            expect(window.NI_Int16ArrayFunction).toHaveBeenCalledWith(Int16Array.from([-32768, 0, 32767]));
            expect(window.NI_Int32ArrayFunction).toHaveBeenCalledWith(Int32Array.from([-2147483648, 0, 2147483647]));
            expect(window.NI_UInt8ArrayFunction).toHaveBeenCalledWith(Uint8Array.from([0, 1, 255]));
            expect(window.NI_UInt16ArrayFunction).toHaveBeenCalledWith(Uint16Array.from([0, 1, 65535]));
            expect(window.NI_UInt32ArrayFunction).toHaveBeenCalledWith(Uint32Array.from([0, 1, 4294967295]));
            expect(window.NI_SingleArrayFunction).toHaveBeenCalledWith(Float32Array.from([-1.0, 0.0, 1.0]));
            expect(window.NI_DoubleArrayFunction).toHaveBeenCalledWith(Float64Array.from([-1.0, 0.0, 1.0]));
            expect(window.NI_JSRefNullValueFunction).toHaveBeenCalledWith(null);
            expect(window.NI_JSRefUndefinedValueFunction).toHaveBeenCalledWith(undefined);
            expect(window.NI_JSRefPrimitiveValueFunction).toHaveBeenCalledWith('hello world');
            expect(window.NI_JSRefObjectValueFunction).toHaveBeenCalled();
            expect(window.NI_JSRefArrayEmptyValueFunction).toHaveBeenCalledWith([]);
            expect(window.NI_JSRefArrayWithOneValueFunction).toHaveBeenCalledWith(['hello world']);
            expect(window.NI_JSRefArrayWithMultiplePrimitiveValuesFunction).toHaveBeenCalledWith([null, undefined, 'hello', true, 7]);
            expect(window.NI_JSRefArrayWithMultipleObjectValuesFunction).toHaveBeenCalled();
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });
});
