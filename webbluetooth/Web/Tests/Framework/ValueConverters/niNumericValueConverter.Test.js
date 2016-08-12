describe('A numeric value converter', function () {
    'use strict';

    var NUM_VALUE_TYPES = NationalInstruments.HtmlVI.NINumerics.ValueTypes;

    var numValueConverter = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

    describe('convert returns an object with the key "stringValue" mapping to a string value with ', function () {

        it('an INT64 value type.', function () {
            var value = '5000';
            var convertedValue = numValueConverter.convert(value, NUM_VALUE_TYPES.INT64);
            var expectedValue = {stringValue: '5000'};

            expect(expectedValue).toEqual(convertedValue);
        });

        it('an UINT64 value type', function () {
            var value = '5000';
            var convertedValue = numValueConverter.convert(value, NUM_VALUE_TYPES.UINT64);
            var expectedValue = {stringValue: '5000'};

            expect(expectedValue).toEqual(convertedValue);
        });

        it('a Complex Single type', function () {
            var value = '1+i';
            var convertedValue = numValueConverter.convert(value, NUM_VALUE_TYPES.COMPLEXSINGLE);
            var expectedValue = {stringValue: '1+i'};

            expect(expectedValue).toEqual(convertedValue);
        });

        it('a Complex Double type', function () {
            var value = '1+i';
            var convertedValue = numValueConverter.convert(value, NUM_VALUE_TYPES.COMPLEXDOUBLE);
            var expectedValue = {stringValue: '1+i'};

            expect(expectedValue).toEqual(convertedValue);
        });
    });

    describe('convert returns an object with the key "numberValue" mapping to ', function () {

        it('value if "parseNumberValue" is not true', function () {
            var value = 5000;
            var convertedValue = numValueConverter.convert(value, NUM_VALUE_TYPES.INT32, false);
            var expectedValue = { numberValue: 5000 };

            expect(expectedValue).toEqual(convertedValue);
        });

        it('parsed numeric value if "parseNumberValue" is true', function () {
            var value = '5000';
            var convertedValue = numValueConverter.convert(value, NUM_VALUE_TYPES.INT32, true);
            var expectedValue = { numberValue: 5000 };
            expect(expectedValue).toEqual(convertedValue);
        });
    });

    // Type validation.
    describe('convert throws error if ', function () {

        it('valueType is a large NumericValueType and value is not a string', function () {
            var convertingAction = function () {
                numValueConverter.convert(5000, NUM_VALUE_TYPES.INT64);
            };

            expect(convertingAction).toThrow();
        });

        it('valueType is not a large NumericValueType and value is not a numeric', function () {
            var convertingAction = function () {
                numValueConverter.convert('5000', NUM_VALUE_TYPES.INT32, false);
            };

            expect(convertingAction).toThrow();
        });
    });

    describe('convertBack returns "stringValue" from "obj" if "valueType" is a large number', function () {
        it('like an INT64', function () {
            var obj = {stringValue: '5000'};
            var convertedaBackVal = numValueConverter.convertBack(obj, NUM_VALUE_TYPES.INT64);
            var expectedBackVal = '5000';

            expect(expectedBackVal).toEqual(convertedaBackVal);
        });

        it('like an UINT64', function () {
            var obj = {stringValue: '5000'};
            var convertedaBackVal = numValueConverter.convertBack(obj, NUM_VALUE_TYPES.UINT64);
            var expectedBackVal = '5000';

            expect(expectedBackVal).toEqual(convertedaBackVal);
        });
        it('like a Complex Single', function () {
            var obj = {stringValue: '1+i'};
            var convertedaBackVal = numValueConverter.convertBack(obj, NUM_VALUE_TYPES.COMPLEXSINGLE);
            var expectedBackVal = '1+i';

            expect(expectedBackVal).toEqual(convertedaBackVal);
        });

        it('like a Complex Double', function () {
            var obj = {stringValue: '1+i'};
            var convertedaBackVal = numValueConverter.convertBack(obj, NUM_VALUE_TYPES.COMPLEXDOUBLE);
            var expectedBackVal = '1+i';

            expect(expectedBackVal).toEqual(convertedaBackVal);
        });

    });

    describe('convertBack returns "numberValue" from "obj" if "valueType" is not a large number', function () {
        it('like an Int32', function () {
            var obj = {numberValue: 0};
            var convertedaBackVal = numValueConverter.convertBack(obj, NUM_VALUE_TYPES.INT32);
            var expectedBackVal = 0;

            expect(expectedBackVal).toEqual(convertedaBackVal);
        });

        it('even undefined', function () {
            var obj = {numberValue: 0};
            var convertedaBackVal = numValueConverter.convertBack(obj, undefined);
            var expectedBackVal = 0;

            expect(expectedBackVal).toEqual(convertedaBackVal);
        });
    });

    // Exceptional cases
    describe('convertBack throws error when', function () {
        it('"obj" is not an "object"', function () {
            var convertingAction = function () {
                numValueConverter.convertBack(1000, NUM_VALUE_TYPES.INT64);
            };

            expect(convertingAction).toThrow();
        });

        it('"value" in {stringValue: value} is not a "string"', function () {
            var convertingAction = function () {
                numValueConverter.convertBack({stringValue : 1000}, NUM_VALUE_TYPES.INT64);
            };

            expect(convertingAction).toThrow();
        });
        it('"value" in {numberValue: value} is not a "number"', function () {
            var convertingAction = function () {
                numValueConverter.convertBack({numberValue: '1000'}, NUM_VALUE_TYPES.INT32);
            };

            expect(convertingAction).toThrow();
        });
    });
});
