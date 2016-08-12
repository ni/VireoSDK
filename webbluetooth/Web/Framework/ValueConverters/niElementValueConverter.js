(function () {
    'use strict';

    // Static private reference aliases.
    // None

    // Static private variables.
    // None

    // Static private methods.
    var findConverterForElementName = function (elemName) {
        elemName = elemName.toLowerCase();
        switch (elemName) {

            // Numerics
            case 'ni-numeric-text-box':
            case 'ni-gauge':
            case 'ni-ring-selector':
            case 'ni-enum-selector':
            case 'ni-tank':
            case 'ni-slider':
                return NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

            case 'ni-array-viewer':
            case 'ni-cluster':
            case 'ni-data-grid':
            case 'ni-list-box':
            case 'ni-path-selector':
                return NationalInstruments.HtmlVI.ValueConverters.JsonValueConverter;

            default:
                return NationalInstruments.HtmlVI.ValueConverters.ValueConverter;
        }
    };

    NationalInstruments.HtmlVI.ValueConverters.ElementValueConverter = {};

    NationalInstruments.HtmlVI.ValueConverters.ElementValueConverter.FindValueConverter = function (element) {
        return findConverterForElementName(element.tagName);
    };

    NationalInstruments.HtmlVI.ValueConverters.ElementValueConverter.Convert = function (element, value, param) {
        var elementName = element.tagName,
            converter = findConverterForElementName(elementName);

        return converter.convert(value, param);
    };

    NationalInstruments.HtmlVI.ValueConverters.ElementValueConverter.ConvertBack = function (element, value, param) {
        var elementName = element.tagName,
            converter = findConverterForElementName(elementName);

        return converter.convertBack(value, param);
    };

}());
