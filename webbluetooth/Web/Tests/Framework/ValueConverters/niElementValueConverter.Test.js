describe('An element value converter', function () {
    'use strict';

    describe('FindValueConverter gets', function () {

        var ELEMENT_VAL_CONVERTER = NationalInstruments.HtmlVI.ValueConverters.ElementValueConverter,
            expectedValueConverter;

        describe('a ValueConverter when element is', function () {

            beforeEach(function () {
                expectedValueConverter = NationalInstruments.HtmlVI.ValueConverters.ValueConverter;
            });

            it('a non NI element', function () {
                var element = document.createElement('div');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a non existant NI element', function () {
                var element = document.createElement('ni-custom-not-existant-element');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

        });

        describe('a NumericValueConverter when element is', function () {

            beforeEach(function () {
                expectedValueConverter = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;
            });

            it('a ni-numeric-text-box', function () {
                var element = document.createElement('ni-numeric-text-box');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-gauge', function () {
                var element = document.createElement('ni-gauge');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-ring-selector', function () {
                var element = document.createElement('ni-ring-selector');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-enum-selector', function () {
                var element = document.createElement('ni-enum-selector');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-tank', function () {
                var element = document.createElement('ni-tank');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-slider', function () {
                var element = document.createElement('ni-slider');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

        });

        describe('a JsonValueConverter when element is', function () {

            beforeEach(function () {
                expectedValueConverter = NationalInstruments.HtmlVI.ValueConverters.JsonValueConverter;
            });

            it('a ni-array-viewer', function () {
                var element = document.createElement('ni-array-viewer');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-cluster', function () {
                var element = document.createElement('ni-cluster');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-data-grid', function () {
                var element = document.createElement('ni-data-grid');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-list-box', function () {
                var element = document.createElement('ni-list-box');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

            it('a ni-path-selector', function () {
                var element = document.createElement('ni-path-selector');
                var valConverter = ELEMENT_VAL_CONVERTER.FindValueConverter(element);

                expect(valConverter).toBe(expectedValueConverter);
            });

        });

    });

    // We won't test Convert and ConvertBack methods here, since those are tested.
    // Per ValueConverter.
});
