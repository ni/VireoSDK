//****************************************
// Tests for SliderViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A SliderViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';

    var viModel, frontPanelControls, controlModel, controlElement,
        settings, updateSettings, int64Settings, int64UpdateSettings;

    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.SliderModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            interval: 2.0,
            value: 5.0,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            scaleVisible: true,
            majorTicksVisible: true,
            minorTicksVisible: true,
            labelsVisible: true,
            coercionMode: false
        };

        updateSettings = {
            minimum: 1.0,
            maximum: 11.0,
            interval: 3.0,
            value: 6.0,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic',
            scaleVisible: false,
            majorTicksVisible: false,
            minorTicksVisible: false,
            labelsVisible: false,
            coercionMode: true
        };

        int64Settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.SliderModel.MODEL_KIND,
            valueType: NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            minimum: '0.0',
            maximum: '10.0',
            interval: '2.0',
            value: '5.0'
        };

        // APD Temp workaround for jqx bug
        int64UpdateSettings = {
            minimum: '1.0',
            maximum: '9223372036854775807',
            interval: '3.0',
            value: '9223372036854775807'
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
        Object.freeze(int64Settings);
        Object.freeze(int64UpdateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-slider ni-control-id="' + controlId + '"></ni-slider>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('exists after the custom element is created', function () {
        var viewModel;

        beforeEach(function (done) {
            webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                controlElement = viewModel.element;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.minimum).toEqual(settings.minimum);
            expect(controlModel.maximum).toEqual(settings.maximum);
            expect(controlModel.interval).toEqual(settings.interval);
            expect(controlModel.value).toEqual(settings.value);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(updateSettings.minimum);
                expect(controlModel.maximum).toEqual(updateSettings.maximum);
                expect(controlModel.interval).toEqual(updateSettings.interval);
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.fontSize).toEqual('20px');
                expect(controlModel.fontFamily).toEqual('sans-serif');
                expect(controlModel.fontWeight).toEqual('bold');
                expect(controlModel.fontStyle).toEqual('italic');
                expect(controlModel.scaleVisible).toEqual(false);
                expect(controlModel.majorTicksVisible).toEqual(false);
                expect(controlModel.minorTicksVisible).toEqual(false);
                expect(controlModel.labelsVisible).toEqual(false);
                expect(controlModel.coercionMode).toEqual(true);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };

            webAppHelper.dispatchMessage(controlId, unknownSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(settings.minimum);
                expect(controlModel.maximum).toEqual(settings.maximum);
                expect(controlModel.interval).toEqual(settings.interval);
                expect(controlModel.value).toEqual(settings.value);
            });
        });
    });

    describe('exists after the custom element is created using the int64 data type', function () {
        var viewModel;

        beforeEach(function (done) {
            webAppHelper.createNIElement(int64Settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                controlElement = viewModel.element;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.minimum).toEqual(int64Settings.minimum);
            expect(controlModel.maximum).toEqual(int64Settings.maximum);
            expect(controlModel.interval).toEqual(int64Settings.interval);
            expect(controlModel.value).toEqual(int64Settings.value);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, int64UpdateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(int64UpdateSettings.minimum);
                expect(controlModel.maximum).toEqual(int64UpdateSettings.maximum);
                expect(controlModel.interval).toEqual(int64UpdateSettings.interval);
                expect(controlModel.value).toEqual(int64UpdateSettings.value);
            });
        });
    });
});
