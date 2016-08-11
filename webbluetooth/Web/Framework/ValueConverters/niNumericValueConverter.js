(function () {
    'use strict';

    // Static private reference aliases
    var NUMVALUETYPES = NationalInstruments.HtmlVI.NINumerics.ValueTypes;

    NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter = function () {

    };

    // Prototype creation
    var numericValueConverter = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

    // Private static methods
    var isStringNumeric = function (valueType) {
        return (valueType === NUMVALUETYPES.INT64 ||
            valueType === NUMVALUETYPES.UINT64 ||
            valueType === NUMVALUETYPES.COMPLEXSINGLE ||
            valueType === NUMVALUETYPES.COMPLEXDOUBLE);
    };

    // Public prototype methods
    // Given a primitive number value (float or string), and a value type, converts it into an object of the form
    // { numberValue: x } or { stringValue: y }.
    // If the parseNumberValue parameter is true, then value can be a string even if the value type implies it should
    // be represented as a float, and therefore parseFloat will be called on the input primitive first.
    numericValueConverter.convert = function (value, valueType, parseNumberValue) {
        var numberValue = value;

        if (isStringNumeric(valueType)) {
            if (typeof value !== 'string') {
                throw new Error('value should be a string');
            }

            return { stringValue: value };
        }

        if (parseNumberValue === true) {
            numberValue = parseFloat(value);
        }

        if (typeof numberValue !== 'number') {
            throw new Error('value should be a number');
        }

        return {numberValue: numberValue};
    };

    // Given an object of the form { numberValue: x } or { stringValue: y } (depending on the
    // value type), extracts the primitive value (float or string) from it.
    numericValueConverter.convertBack = function (obj, valueType) {

        if (typeof obj !== 'object') {
            throw new Error('obj must be an object');
        }

        if (isStringNumeric(valueType)) {
            if (typeof obj.stringValue !== 'string') {
                throw new Error('obj.stringValue must be a string');
            }

            return obj.stringValue;
        }

        if (typeof obj.numberValue !== 'number') {
            throw new Error('obj.numberValue must be a number');
        }

        return obj.numberValue;
    };

}());
