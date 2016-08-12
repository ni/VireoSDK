describe('A Json value converter', function () {
    'use strict';

    var jsonValueConverter;

    beforeEach(function () {
        jsonValueConverter = NationalInstruments.HtmlVI.ValueConverters.JsonValueConverter;
    });

    it('converts a json object to string', function () {
        var obj = {numberValue: 5};
        var convertedVal = jsonValueConverter.convert(obj);
        var expectedVal = '{"numberValue":5}';

        expect(expectedVal).toEqual(convertedVal);
    });

    it('convertsBack a json-encoded string to a json object', function () {
        var jsonString = '{"stringValue":"1231242315255"}';
        var convertedBackVal = jsonValueConverter.convertBack(jsonString);
        var expectedBackVal = { stringValue: '1231242315255' };

        expect(expectedBackVal).toEqual(convertedBackVal);
    });
});
