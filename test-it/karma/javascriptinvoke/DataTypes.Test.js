describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsDataTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/DataTypes.via');
    var jsObjectTypeViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/ObjectType.via');

    var jsObjectMap = new Map(); // to share javascript objects for JavaScriptRefNum types. <key,value>=<uniquifier, jsObject>

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsDataTypesViaUrl,
            jsObjectTypeViaUrl
        ], done);
    });

    beforeEach(async function () {
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = await vireoHelpers.createInstance();

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
            return value;
        };

        window.NI_Int16ArrayFunction = function (value) {
            expect(value instanceof Int16Array).toBeTrue();
            return value;
        };

        window.NI_Int32ArrayFunction = function (value) {
            expect(value instanceof Int32Array).toBeTrue();
            return value;
        };

        window.NI_UInt8ArrayFunction = function (value) {
            expect(value instanceof Uint8Array).toBeTrue();
            return value;
        };

        window.NI_UInt16ArrayFunction = function (value) {
            expect(value instanceof Uint16Array).toBeTrue();
            return value;
        };

        window.NI_UInt32ArrayFunction = function (value) {
            expect(value instanceof Uint32Array).toBeTrue();
            return value;
        };

        window.NI_SingleArrayFunction = function (value) {
            expect(value instanceof Float32Array).toBeTrue();
            return value;
        };

        window.NI_DoubleArrayFunction = function (value) {
            expect(value instanceof Float64Array).toBeTrue();
            return value;
        };

        window.NI_GetObjectFunction = function (name) {
            var existingObject = jsObjectMap.get(name);
            if (existingObject === undefined) { // create new object
                var myObject = {};
                myObject.name = name;
                myObject.getLengthOfName = function () {
                    return this.name.length;
                };
                jsObjectMap.set(name, myObject);
                return myObject;
            }
            return existingObject; // share object
        };

        window.NI_UseObjectFunction = function (myObject) {
            return myObject.getLengthOfName();
        };

        window.NI_GetPrimitiveFunction = function () {
            return 'foo';
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
        window.NI_GetObjectFunction = undefined;
        window.NI_UseObjectFunction = undefined;
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

    it('succesfully create and use an object type', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsObjectTypeViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error1.status')).toBeFalse();
            expect(viPathParser('error1.code')).toBe(0);
            expect(viPathParser('error1.source')).toBeEmptyString();
            expect(viPathParser('error2.status')).toBeFalse();
            expect(viPathParser('error2.code')).toBe(0);
            expect(viPathParser('error2.source')).toBeEmptyString();
            expect(viPathParser('error3.status')).toBeFalse();
            expect(viPathParser('error3.code')).toBe(0);
            expect(viPathParser('error3.source')).toBeEmptyString();
            expect(viPathParser('error4.status')).toBeFalse();
            expect(viPathParser('error4.code')).toBe(0);
            expect(viPathParser('error4.source')).toBeEmptyString();
            expect(viPathParser('length1')).toBe(3);
            expect(viPathParser('length2')).toBe(6);
            expect(viPathParser('isEqual')).toBeFalse();
            expect(viPathParser('isNotEqual')).toBeTrue();
            expect(viPathParser('isNotANumPathRefnum1')).toBeFalse();
            expect(viPathParser('isNotANumPathRefnum2')).toBeFalse();
            expect(viPathParser('error5.code')).toBe(0);
            expect(viPathParser('error5.status')).toBeFalse();
            expect(viPathParser('error5.source')).toBeEmptyString();
            expect(viPathParser('isSharedRef')).toBeTrue();
            expect(viPathParser('isSharedPrimRef')).toBeFalse();
            expect(viPathParser('error6.code')).toBe(0);
            expect(viPathParser('error6.status')).toBeFalse();
            expect(viPathParser('error6.source')).toBeEmptyString();
            expect(viPathParser('error7.code')).toBe(0);
            expect(viPathParser('error7.status')).toBeFalse();
            expect(viPathParser('error7.source')).toBeEmptyString();
            expect(viPathParser('isNotANumPathRefnum3')).toBeTrue();
            expect(viPathParser('error8.code')).toBe(44300);
            expect(viPathParser('error8.status')).toBeTrue();
            expect(viPathParser('error8.source')).toMatch(/undefined/);
            expect(viPathParser('error9.code')).toBe(0);
            expect(viPathParser('error9.status')).toBeFalse();
            expect(viPathParser('error9.source')).toBeEmptyString();
            expect(viPathParser('error10.code')).toBe(44303);
            expect(viPathParser('error10.status')).toBeTrue();
            expect(viPathParser('error10.source')).toMatch(/already set to/);
            expect(viPathParser('error11.code')).toBe(44303);
            expect(viPathParser('error11.status')).toBeTrue();
            expect(viPathParser('error11.source')).toMatch(/already set to/);
            done();
        });
    });
});
