//****************************************
// Tests for GaugeViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A GaugeViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';

    var viModel, frontPanelControls, controlModel, controlElement, settings, updateSettings, int64Settings, int64UpdateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.GaugeModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            interval: 2.0,
            majorTicksVisible: true,
            minorTicksVisible: true,
            labelsVisible: true,
            decimalDigits: 2,
            precisionDigits: 4,
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
            majorTicksVisible: false,
            minorTicksVisible: false,
            labelsVisible: false,
            decimalDigits: 3,
            precisionDigits: 5,
            value: 6.0,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };

        int64Settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.GaugeModel.MODEL_KIND,
            valueType: NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64,
            minimum: '0.0',
            maximum: '10.0',
            interval: '2.0',
            majorTicksVisible: true,
            minorTicksVisible: true,
            labelsVisible: true,
            decimalDigits: 2,
            precisionDigits: 4,
            value: '5.0',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        int64UpdateSettings = {
            majorTicksVisible: false,
            minorTicksVisible: false,
            labelsVisible: false,
            minimum: '1.0',
            maximum: '9223372036854775807',
            interval: '3.0',
            decimalDigits: 3,
            precisionDigits: 5,
            value: '9223372036854775807'
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-gauge ni-control-id="' + controlId + '"></ni-gauge>');
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
            expect(controlModel.minimum).toEqual(0.0);
            expect(controlModel.maximum).toEqual(10.0);
            expect(controlModel.interval).toEqual(2.0);
            expect(controlModel.majorTicksVisible).toEqual(true);
            expect(controlModel.minorTicksVisible).toEqual(true);
            expect(controlModel.labelsVisible).toEqual(true);
            expect(controlModel.decimalDigits).toEqual(2);
            expect(controlModel.precisionDigits).toEqual(4);
            expect(controlModel.value).toEqual(5.0);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(1.0);
                expect(controlModel.maximum).toEqual(11.0);
                expect(controlModel.interval).toEqual(3.0);
                expect(controlModel.majorTicksVisible).toEqual(false);
                expect(controlModel.minorTicksVisible).toEqual(false);
                expect(controlModel.labelsVisible).toEqual(false);
                expect(controlModel.decimalDigits).toEqual(3);
                expect(controlModel.precisionDigits).toEqual(5);
                expect(controlModel.value).toEqual(6.0);
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
                expect(controlModel.minimum).toEqual(0.0);
                expect(controlModel.maximum).toEqual(10.0);
                expect(controlModel.interval).toEqual(2.0);
                expect(controlModel.majorTicksVisible).toEqual(true);
                expect(controlModel.minorTicksVisible).toEqual(true);
                expect(controlModel.labelsVisible).toEqual(true);
                expect(controlModel.decimalDigits).toEqual(2);
                expect(controlModel.precisionDigits).toEqual(4);
                expect(controlModel.value).toEqual(5.0);
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
            expect(controlModel.minimum).toEqual('0.0');
            expect(controlModel.maximum).toEqual('10.0');
            expect(controlModel.interval).toEqual('2.0');
            expect(controlModel.majorTicksVisible).toEqual(true);
            expect(controlModel.minorTicksVisible).toEqual(true);
            expect(controlModel.labelsVisible).toEqual(true);
            expect(controlModel.decimalDigits).toEqual(2);
            expect(controlModel.precisionDigits).toEqual(4);
            expect(controlModel.value).toEqual('5.0');
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, int64UpdateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual('1.0');
                expect(controlModel.maximum).toEqual('9223372036854775807');
                expect(controlModel.interval).toEqual('3.0');
                expect(controlModel.majorTicksVisible).toEqual(false);
                expect(controlModel.minorTicksVisible).toEqual(false);
                expect(controlModel.labelsVisible).toEqual(false);
                expect(controlModel.decimalDigits).toEqual(3);
                expect(controlModel.precisionDigits).toEqual(5);
                expect(controlModel.value).toEqual('9223372036854775807');
            });
        });
    });
});
