describe('The Vireo EggShell Double api can', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var readDouble = function (path) {
        return vireo.eggShell.readDouble(vireo.eggShell.findValueRef(viName, path));
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    describe('use readDouble', function () {
        it('to read different double values from memory', function () {
            expect(readDouble('dataItem_NumericDouble')).toMatchIEEE754Number(123.456);
            expect(readDouble('dataItem_NumericDoubleNaN')).toMatchIEEE754Number(NaN);
            expect(readDouble('dataItem_NumericDoublePositiveInfinity')).toMatchIEEE754Number(Infinity);
            expect(readDouble('dataItem_NumericDoubleNegativeInfinity')).toMatchIEEE754Number(-Infinity);
            expect(readDouble('dataItem_NumericDoublePositiveZero')).toMatchIEEE754Number(0);
            expect(readDouble('dataItem_NumericDoubleNegativeZero')).toMatchIEEE754Number(-0);
        });

        it('to read different integer types from memory', function () {
            expect(readDouble('int8MinValue')).toBe(-128);
            expect(readDouble('int8MaxValue')).toBe(127);
            expect(readDouble('int16MinValue')).toBe(-32768);
            expect(readDouble('int16MaxValue')).toBe(32767);
            expect(readDouble('int32MinValue')).toBe(-2147483648);
            expect(readDouble('int32MaxValue')).toBe(2147483647);
            expect(readDouble('int64MinSafeInteger')).toBe(-9007199254740991);
            expect(readDouble('int64MaxSafeInteger')).toBe(9007199254740991);
            expect(readDouble('int64MinValue')).toBe(-9223372036854776000); // Expected precision loss, full value -9223372036854775808
            expect(readDouble('int64MaxValue')).toBe(9223372036854776000); // Expected precision loss, full value 9223372036854775807
            expect(readDouble('uInt8MinValue')).toBe(0);
            expect(readDouble('uInt8MaxValue')).toBe(255);
            expect(readDouble('uInt16MinValue')).toBe(0);
            expect(readDouble('uInt16MaxValue')).toBe(65535);
            expect(readDouble('uInt32MinValue')).toBe(0);
            expect(readDouble('uInt32MaxValue')).toBe(4294967295);
            expect(readDouble('uInt64MinSafeInteger')).toBe(0);
            expect(readDouble('uInt64MaxSafeInteger')).toBe(9007199254740991);
            expect(readDouble('uInt64MinValue')).toBe(0);
            expect(readDouble('uInt64MaxValue')).toBe(18446744073709552000); // Expected precision loss, full value 18446744073709551615
        });

        it('to read different enum types from memory', function () {
            expect(readDouble('enum8alphabet')).toBe(6);
            expect(readDouble('enum16numbers')).toBe(3);
            expect(readDouble('enum32colors')).toBe(2);
            expect(readDouble('enum64releases')).toBe(5);
        });

        it('to read different boolean types from memory', function () {
            expect(readDouble('booleanTrueValue')).toBe(1);
            expect(readDouble('booleanFalseValue')).toBe(0);
        });

        it('to read different timestamp values from memory', function () {
            expect(readDouble('dataItem_Timestamp')).toBe(3564057536.423476);
        });

        it('to error for unsupported types', function () {
            var unsupportedTypeCheck = function (path) {
                return function () {
                    readDouble(path);
                };
            };

            expect(unsupportedTypeCheck('dataItem_Complex')).toThrow();
            expect(unsupportedTypeCheck('dataItem_String')).toThrow();
        });
    });
});
