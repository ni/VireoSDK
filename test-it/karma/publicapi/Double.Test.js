describe('The Vireo EggShell Double api can', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var readDouble = function (path) {
        return vireo.eggShell.readDouble(vireo.eggShell.findValueRef(viName, path));
    };

    var tryReadDouble = function (path) {
        return function () {
            readDouble(path);
        };
    };

    var writeDouble = function (path, value) {
        vireo.eggShell.writeDouble(vireo.eggShell.findValueRef(viName, path), value);
    };

    var tryWriteDouble = function (path, value) {
        return function () {
            writeDouble(path, value);
        };
    };

    var testWriteDouble = function (path, initialValue, newValue) {
        expect(readDouble(path)).toMatchIEEE754Number(initialValue);
        writeDouble(path, newValue);
        expect(readDouble(path)).toMatchIEEE754Number(newValue);
        writeDouble(path, initialValue);
        expect(readDouble(path)).toMatchIEEE754Number(initialValue);
    };

    var testWriteDoubleCoerced = function (path, initialValue, attemptedNewValue, coercedNewValue) {
        expect(readDouble(path)).toMatchIEEE754Number(initialValue);
        writeDouble(path, attemptedNewValue);
        expect(readDouble(path)).toMatchIEEE754Number(coercedNewValue);
        writeDouble(path, initialValue);
        expect(readDouble(path)).toMatchIEEE754Number(initialValue);
    };

    // Expected coerced values of Doubles in Vireo should have the same behavior as assignment to typed arrays
    // This is so a user assigning a double to a typedarray using getTypedArray will see the same effect as writing to a double using writeDouble
    var expectedCoercedValue = function (TypedArrayConstructor, value) {
        return (new TypedArrayConstructor([value])[0]);
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

        it('to read different integer values from memory', function () {
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

        it('to read different enum values from memory', function () {
            expect(readDouble('enum8alphabet')).toBe(6);
            expect(readDouble('enum16numbers')).toBe(3);
            expect(readDouble('enum32colors')).toBe(2);
            expect(readDouble('enum64releases')).toBe(5);
        });

        it('to read different boolean values from memory', function () {
            expect(readDouble('booleanTrueValue')).toBe(1);
            expect(readDouble('booleanFalseValue')).toBe(0);
        });

        it('to read different timestamp values from memory', function () {
            expect(readDouble('dataItem_Timestamp')).toBe(3564057536.423476);
        });

        it('to error for unsupported types', function () {
            expect(tryReadDouble('dataItem_Complex')).toThrowError(/UnexpectedObjectType/);
            expect(tryReadDouble('dataItem_String')).toThrowError(/UnexpectedObjectType/);
        });
    });

    describe('use writeDouble', function () {
        it('to write double values to memory', function () {
            testWriteDouble('dataItem_NumericDouble', 123.456, 42);
            testWriteDouble('dataItem_NumericDouble', 123.456, NaN);
            testWriteDouble('dataItem_NumericDouble', 123.456, Infinity);
            testWriteDouble('dataItem_NumericDouble', 123.456, -Infinity);
            testWriteDouble('dataItem_NumericDouble', 123.456, 0);
            testWriteDouble('dataItem_NumericDouble', 123.456, -0);
        });

        it('to write integer values to memory', function () {
            testWriteDoubleCoerced('int8MinValue', -128, 812, expectedCoercedValue(Int8Array, 812));
            testWriteDoubleCoerced('int8MinValue', -128, -812, expectedCoercedValue(Int8Array, -812));
            testWriteDoubleCoerced('int16MinValue', -32768, 81234, expectedCoercedValue(Int16Array, 81234));
            testWriteDoubleCoerced('int16MinValue', -32768, -81234, expectedCoercedValue(Int16Array, -81234));
            testWriteDoubleCoerced('int32MinValue', -2147483648, 8123456789, expectedCoercedValue(Int32Array, 8123456789));
            testWriteDoubleCoerced('int32MinValue', -2147483648, -8123456789, expectedCoercedValue(Int32Array, -8123456789));
            testWriteDoubleCoerced('uInt8MinValue', 0, 812, expectedCoercedValue(Uint8Array, 812));
            testWriteDoubleCoerced('uInt8MinValue', 0, -812, expectedCoercedValue(Uint8Array, -812));
            testWriteDoubleCoerced('uInt16MinValue', 0, 81234, expectedCoercedValue(Uint16Array, 81234));
            testWriteDoubleCoerced('uInt16MinValue', 0, -81234, expectedCoercedValue(Uint16Array, -81234));
            testWriteDoubleCoerced('uInt32MinValue', 0, 8123456789, expectedCoercedValue(Uint32Array, 8123456789));
            testWriteDoubleCoerced('uInt32MinValue', 0, -8123456789, expectedCoercedValue(Uint32Array, -8123456789));

            expect(expectedCoercedValue(Int8Array, 812)).toBe(44);
            expect(expectedCoercedValue(Int8Array, -812)).toBe(-44);
            expect(expectedCoercedValue(Int16Array, 81234)).toBe(15698);
            expect(expectedCoercedValue(Int16Array, -81234)).toBe(-15698);
            expect(expectedCoercedValue(Int32Array, 8123456789)).toBe(-466477803);
            expect(expectedCoercedValue(Int32Array, -8123456789)).toBe(466477803);
            expect(expectedCoercedValue(Uint8Array, 812)).toBe(44);
            expect(expectedCoercedValue(Uint8Array, -812)).toBe(212);
            expect(expectedCoercedValue(Uint16Array, 81234)).toBe(15698);
            expect(expectedCoercedValue(Uint16Array, -81234)).toBe(49838);
            expect(expectedCoercedValue(Uint32Array, 8123456789)).toBe(3828489493);
            expect(expectedCoercedValue(Uint32Array, -8123456789)).toBe(466477803);
        });

        it('to coerce iee754 special values to memory', function () {
            testWriteDoubleCoerced('int8MinValue', -128, NaN, expectedCoercedValue(Int8Array, NaN));
            testWriteDoubleCoerced('int8MinValue', -128, Infinity, expectedCoercedValue(Int8Array, Infinity));
            testWriteDoubleCoerced('int8MinValue', -128, -Infinity, expectedCoercedValue(Int8Array, -Infinity));
            testWriteDoubleCoerced('int8MinValue', -128, -0, expectedCoercedValue(Int8Array, -0));
            testWriteDoubleCoerced('int8MinValue', -128, 0, expectedCoercedValue(Int8Array, 0));

            expect(expectedCoercedValue(Int8Array, NaN)).toBe(0);
            expect(expectedCoercedValue(Int8Array, Infinity)).toBe(0);
            expect(expectedCoercedValue(Int8Array, -Infinity)).toBe(0);
            expect(expectedCoercedValue(Int8Array, -0)).toBe(0);
            expect(expectedCoercedValue(Int8Array, 0)).toBe(0);
        });

        it('to write different enum values to memory', function () {
            testWriteDouble('enum8alphabet', 6, 4);
            testWriteDouble('enum16numbers', 3, 4);
            testWriteDouble('enum32colors', 2, 4);
            testWriteDouble('enum64releases', 5, 4);
        });

        it('to write different boolean values to memory', function () {
            testWriteDouble('booleanTrueValue', 1, 0);
            testWriteDoubleCoerced('booleanTrueValue', 1, 70, 1);
            testWriteDoubleCoerced('booleanTrueValue', 1, -70, 1);
        });

        it('to write different timestamp values to memory', function () {
            testWriteDouble('dataItem_Timestamp', 3564057536.423476, 7);
        });

        it('to error for unsupported types', function () {
            expect(tryWriteDouble('dataItem_Complex', 42)).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteDouble('dataItem_String', 42)).toThrowError(/UnexpectedObjectType/);
        });
    });
});
