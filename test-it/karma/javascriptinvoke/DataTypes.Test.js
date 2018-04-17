describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsDataTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/DataTypes.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsDataTypesViaUrl
        ], done);
    });

    beforeEach(function () {
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = new Vireo();

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
            return value;
        };

        window.NI_Int16ArrayFunction = function (value) {
            return value;
        };

        window.NI_Int32ArrayFunction = function (value) {
            return value;
        };

        window.NI_UInt8ArrayFunction = function (value) {
            return value;
        };

        window.NI_UInt16ArrayFunction = function (value) {
            return value;
        };

        window.NI_UInt32ArrayFunction = function (value) {
            return value;
        };

        window.NI_SingleArrayFunction = function (value) {
            return value;
        };

        window.NI_DoubleArrayFunction = function (value) {
            return value;
        };
    });

    afterEach(function () {
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
    });

    it('succesfully pass different data types', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsDataTypesViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        spyOn(window, 'NI_BooleanFunction');
        spyOn(window, 'NI_Int8Function');
        spyOn(window, 'NI_Int16Function');
        spyOn(window, 'NI_Int32Function');
        spyOn(window, 'NI_UInt8Function');
        spyOn(window, 'NI_UInt16Function');
        spyOn(window, 'NI_UInt32Function');
        spyOn(window, 'NI_SingleFunction');
        spyOn(window, 'NI_DoubleFunction');
        spyOn(window, 'NI_StringFunction');
        spyOn(window, 'NI_Int8ArrayFunction');
        spyOn(window, 'NI_Int16ArrayFunction');
        spyOn(window, 'NI_Int32ArrayFunction');
        spyOn(window, 'NI_UInt8ArrayFunction');
        spyOn(window, 'NI_UInt16ArrayFunction');
        spyOn(window, 'NI_UInt32ArrayFunction');
        spyOn(window, 'NI_SingleArrayFunction');
        spyOn(window, 'NI_DoubleArrayFunction');

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
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeFalse();
            expect(viPathParser('error.code')).toBe(0);
            expect(viPathParser('error.source')).toBeEmptyString();
            done();
        });
    });
});
