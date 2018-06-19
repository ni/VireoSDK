describe('The Vireo EggShell Double api can', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var find = function (path) {
        return vireo.eggShell.findValueRef(viName, path);
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
            expect(vireo.eggShell.readDouble(find('dataItem_NumericDouble'))).toMatchIEEE754Number(123.456);
            expect(vireo.eggShell.readDouble(find('dataItem_NumericDoubleNaN'))).toMatchIEEE754Number(NaN);
            expect(vireo.eggShell.readDouble(find('dataItem_NumericDoublePositiveInfinity'))).toMatchIEEE754Number(Infinity);
            expect(vireo.eggShell.readDouble(find('dataItem_NumericDoubleNegativeInfinity'))).toMatchIEEE754Number(-Infinity);
            expect(vireo.eggShell.readDouble(find('dataItem_NumericDoublePositiveZero'))).toMatchIEEE754Number(0);
            expect(vireo.eggShell.readDouble(find('dataItem_NumericDoubleNegativeZero'))).toMatchIEEE754Number(-0);
        });

        it('to read different integer types from memory', function () {
            expect(vireo.eggShell.readDouble(find('int8MinValue'))).toMatchIEEE754Number(-128);
            expect(vireo.eggShell.readDouble(find('int8MaxValue'))).toMatchIEEE754Number(127);
            expect(vireo.eggShell.readDouble(find('int16MinValue'))).toMatchIEEE754Number(-32768);
            expect(vireo.eggShell.readDouble(find('int16MaxValue'))).toMatchIEEE754Number(32767);
            expect(vireo.eggShell.readDouble(find('int32MinValue'))).toMatchIEEE754Number(-2147483648);
            expect(vireo.eggShell.readDouble(find('int32MaxValue'))).toMatchIEEE754Number(2147483647);
            expect(vireo.eggShell.readDouble(find('int64MinSafeInteger'))).toMatchIEEE754Number(-9007199254740991);
            expect(vireo.eggShell.readDouble(find('int64MaxSafeInteger'))).toMatchIEEE754Number(9007199254740991);
            expect(vireo.eggShell.readDouble(find('int64MinValue'))).toMatchIEEE754Number(-9223372036854776000); // Expected precision loss, full value -9223372036854775808
            expect(vireo.eggShell.readDouble(find('int64MaxValue'))).toMatchIEEE754Number(9223372036854776000); // Expected precision loss, full value 9223372036854775807
            expect(vireo.eggShell.readDouble(find('uInt8MinValue'))).toMatchIEEE754Number(0);
            expect(vireo.eggShell.readDouble(find('uInt8MaxValue'))).toMatchIEEE754Number(255);
            expect(vireo.eggShell.readDouble(find('uInt16MinValue'))).toMatchIEEE754Number(0);
            expect(vireo.eggShell.readDouble(find('uInt16MaxValue'))).toMatchIEEE754Number(65535);
            expect(vireo.eggShell.readDouble(find('uInt32MinValue'))).toMatchIEEE754Number(0);
            expect(vireo.eggShell.readDouble(find('uInt32MaxValue'))).toMatchIEEE754Number(4294967295);
            expect(vireo.eggShell.readDouble(find('uInt64MinSafeInteger'))).toMatchIEEE754Number(0);
            expect(vireo.eggShell.readDouble(find('uInt64MaxSafeInteger'))).toMatchIEEE754Number(9007199254740991);
            expect(vireo.eggShell.readDouble(find('uInt64MinValue'))).toMatchIEEE754Number(0);
            expect(vireo.eggShell.readDouble(find('uInt64MaxValue'))).toMatchIEEE754Number(18446744073709552000); // Expected precision loss, full value 18446744073709551615
        });
    });
});
