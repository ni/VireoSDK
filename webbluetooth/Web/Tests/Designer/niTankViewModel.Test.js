//****************************************
// Tests for TankViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A TankViewModel', function () {
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
            kind: NationalInstruments.HtmlVI.Models.TankModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            interval: 2.0,
            orientation: 'horizontal',
            majorTicksVisible: true,
            minorTicksVisible: true,
            labelsVisible: true,
            value: 5.0,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        updateSettings = {
            minimum: 1.0,
            maximum: 11.0,
            interval: 3.0,
            orientation: 'vertical',
            majorTicksVisible: false,
            minorTicksVisible: false,
            labelsVisible: false,
            value: 6.0
        };

        int64Settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.TankModel.MODEL_KIND,
            valueType: NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64,
            minimum: '0.0',
            maximum: '10.0',
            interval: '2.0',
            majorTicksVisible: true,
            minorTicksVisible: true,
            labelsVisible: true,
            value: '5.0',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        int64UpdateSettings = {
            minimum: '1.0',
            maximum: '1000000000000', // It should be 9223372036854775807, more info: https://rally1.rallydev.com/#/21281616947d/detail/defect/45999361906
            interval: '3.0',
            majorTicksVisible: false,
            minorTicksVisible: false,
            labelsVisible: false,
            value: '1000000000000'
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
        $(document.body).append('<ni-tank ni-control-id="' + controlId + '"></ni-tank>');
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
            expect(controlModel.majorTicksVisible).toEqual(settings.majorTicksVisible);
            expect(controlModel.minorTicksVisible).toEqual(settings.minorTicksVisible);
            expect(controlModel.labelsVisible).toEqual(settings.labelsVisible);
            expect(controlModel.value).toEqual(settings.value);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(updateSettings.minimum);
                expect(controlModel.maximum).toEqual(updateSettings.maximum);
                expect(controlModel.interval).toEqual(updateSettings.interval);
                expect(controlModel.majorTicksVisible).toEqual(updateSettings.majorTicksVisible);
                expect(controlModel.minorTicksVisible).toEqual(updateSettings.minorTicksVisible);
                expect(controlModel.labelsVisible).toEqual(updateSettings.labelsVisible);
                expect(controlModel.value).toEqual(updateSettings.value);
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
                expect(controlModel.majorTicksVisible).toEqual(settings.majorTicksVisible);
                expect(controlModel.minorTicksVisible).toEqual(settings.minorTicksVisible);
                expect(controlModel.labelsVisible).toEqual(settings.labelsVisible);
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
            expect(controlModel.majorTicksVisible).toEqual(int64Settings.majorTicksVisible);
            expect(controlModel.minorTicksVisible).toEqual(int64Settings.minorTicksVisible);
            expect(controlModel.labelsVisible).toEqual(int64Settings.labelsVisible);
            expect(controlModel.value).toEqual(int64Settings.value);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, int64UpdateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(int64UpdateSettings.minimum);
                expect(controlModel.maximum).toEqual(int64UpdateSettings.maximum);
                expect(controlModel.interval).toEqual(int64UpdateSettings.interval);
                expect(controlModel.majorTicksVisible).toEqual(int64UpdateSettings.majorTicksVisible);
                expect(controlModel.minorTicksVisible).toEqual(int64UpdateSettings.minorTicksVisible);
                expect(controlModel.labelsVisible).toEqual(int64UpdateSettings.labelsVisible);
                expect(controlModel.value).toEqual(int64UpdateSettings.value);
            });
        });
    });
});
