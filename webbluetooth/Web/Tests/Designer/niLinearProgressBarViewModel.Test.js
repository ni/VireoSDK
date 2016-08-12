//****************************************
// Tests for LinearProgressBarViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A LinearProgressBarViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';

    var viModel, frontPanelControls, controlModel, controlElement, settings, updateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.LinearProgressBarModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            value: 5.0,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            orientation: NationalInstruments.HtmlVI.Models.ProgressBarModel.OrientationEnum.VERTICAL
        };

        updateSettings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.LinearProgressBarModel.MODEL_KIND,
            minimum: 1.0,
            maximum: 11.0,
            value: 6.0,
            orientation: NationalInstruments.HtmlVI.Models.ProgressBarModel.OrientationEnum.HORIZONTAL
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-linear-progress-bar ni-control-id="' + controlId + '"></ni-linear-progress-bar>');
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

        it('and has the correct initial values', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.minimum).toEqual(settings.minimum);
            expect(controlModel.maximum).toEqual(settings.maximum);
            expect(controlModel.value).toEqual(settings.value);
            expect(controlModel.orientation).toEqual(settings.orientation);
        });

        it('and updates the Model when properties change', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.minimum).toEqual(updateSettings.minimum);
                expect(controlModel.maximum).toEqual(updateSettings.maximum);
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.orientation).toEqual(updateSettings.orientation);
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
                expect(controlModel.value).toEqual(settings.value);
                expect(controlModel.orientation).toEqual(settings.orientation);
            });
        });
    });
});
