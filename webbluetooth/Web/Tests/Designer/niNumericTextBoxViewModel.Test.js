//****************************************
// Tests for NumericTextBoxViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A NumericTextBoxViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';

    var viModel, frontPanelControls, controlModel, controlElement, settings, updateSettings, int64Settings, int64UpdateSettings, complexSettings, complexUpdateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            interval: 2,
            significantDigits: 6,
            precisionDigits: -1,
            format: 'floating point',
            value: 5.0,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        updateSettings = {
            minimum: 1.0,
            maximum: 11.0,
            interval: 3,
            significantDigits: -1,
            precisionDigits: 6,
            format: 'exponential',
            value: 6.0,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };

        int64Settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND,
            valueType: NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64,
            minimum: '0.0',
            maximum: '10.0',
            interval: '2',
            value: '5.0',
            significantDigits: 2,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        int64UpdateSettings = {
            minimum: '1.0',
            maximum: '9223372036854775807',
            interval: '3',
            value: '9223372036854775807',
            decimalDeigits: 3
        };

        complexSettings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND,
            valueType: NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE,
            minimum: '0.0 + 0.0i',
            maximum: '10.0 + 10.0i',
            interval: '2 + 2i',
            value: '5.0 + 5.0i',
            significantDigits: 6,
            precisionDigits: -1,
            format: 'floating point',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        complexUpdateSettings = {
            minimum: '1.0 + 1i',
            maximum: '11 + 11i',
            interval: '3',
            value: '6.000000 + 6.000000i',
            significantDigits: -1,
            precisionDigits: 6,
            format: 'exponential'
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
        Object.freeze(int64Settings);
        Object.freeze(int64UpdateSettings);
        Object.freeze(complexSettings);
        Object.freeze(complexUpdateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-numeric-text-box ni-control-id="' + controlId + '"></ni-numeric-text-box>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('exists after the custom element is created', function () {
        var viewModel, internalControl;

        beforeEach(function (done) {
            webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                controlElement = viewModel.element;
                internalControl = $(controlElement.firstElementChild);
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
            expect(controlModel.significantDigits).toEqual(settings.significantDigits);
            expect(controlModel.precisionDigits).toEqual(settings.precisionDigits);
            expect(controlModel.format).toEqual(settings.format);
            expect(controlModel.value).toEqual(settings.value);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(updateSettings.minimum);
                expect(controlModel.maximum).toEqual(updateSettings.maximum);
                expect(controlModel.interval).toEqual(updateSettings.interval);
                expect(controlModel.significantDigits).toEqual(updateSettings.significantDigits);
                expect(controlModel.precisionDigits).toEqual(updateSettings.precisionDigits);
                expect(controlModel.format).toEqual(updateSettings.format);
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.fontSize).toEqual('20px');
                expect(controlModel.fontFamily).toEqual('sans-serif');
                expect(controlModel.fontWeight).toEqual('bold');
                expect(controlModel.fontStyle).toEqual('italic');
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
                expect(controlModel.significantDigits).toEqual(settings.significantDigits);
                expect(controlModel.precisionDigits).toEqual(settings.precisionDigits);
                expect(controlModel.format).toEqual(settings.format);
                expect(controlModel.value).toEqual(settings.value);
            });
        });
    });

    describe('exists after the custom element is created using the int64 data type', function () {
        var viewModel, internalControl;

        beforeEach(function (done) {
            webAppHelper.createNIElement(int64Settings);
            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                controlElement = viewModel.element;
                internalControl = controlElement.firstElementChild;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel.minimum).toEqual(int64Settings.minimum);
            expect(controlModel.maximum).toEqual(int64Settings.maximum);
            expect(controlModel.interval).toEqual(int64Settings.interval);
            expect(controlModel.value).toEqual(int64Settings.value);
            expect(controlModel.valueType).toEqual(int64Settings.valueType);
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
    describe('exists after the custom element is created using the complex data type', function () {
        var viewModel, internalControl;

        beforeEach(function (done) {
            webAppHelper.createNIElement(complexSettings);
            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                controlElement = viewModel.element;
                internalControl = controlElement.firstElementChild;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel.minimum).toEqual(complexSettings.minimum);
            expect(controlModel.maximum).toEqual(complexSettings.maximum);
            expect(controlModel.interval).toEqual(complexSettings.interval);
            expect(controlModel.value).toEqual(complexSettings.value);
            expect(controlModel.valueType).toEqual(complexSettings.valueType);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, complexUpdateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(complexUpdateSettings.minimum);
                expect(controlModel.maximum).toEqual(complexUpdateSettings.maximum);
                expect(controlModel.interval).toEqual(complexUpdateSettings.interval);
                expect(controlModel.value).toEqual(complexUpdateSettings.value);
            });
        });
    });
});
