describe('A value converter', function () {
    'use strict';

    var valueConverter = NationalInstruments.HtmlVI.ValueConverters.ValueConverter;

    it('convert returns original value', function () {
        var value = 5;
        var convertedValue = valueConverter.convert(value);
        expect(convertedValue).toBe(value);
    });

    it('convertBack returns original value', function () {
        var value = 5;
        var convertedBackValue = valueConverter.convert(value);
        expect(convertedBackValue).toBe(value);
    });
});
