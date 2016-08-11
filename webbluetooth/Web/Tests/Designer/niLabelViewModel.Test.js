//****************************************
// Tests for LabelViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A LabelViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'LabelViewModelId';

    var viModel, frontPanelControls, controlModel, controlElement, settings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.LabelModel.MODEL_KIND,
            visible: true,
            text: 'Text',
            foreground: '#4D5359',
            fontSize: '12px',
            fontFamily: 'sans-serif'
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    describe('dynamically updates properties triggering ModelPropertyChanged', function () {
        var viewModel, control;

        beforeEach(function (done) {
            controlElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                control = $(controlElement.firstElementChild);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('first verifies initial values', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlElement.firstChild).toBeDefined();
            expect(controlElement.firstChild.innerHTML).toBeDefined();
            expect(controlElement.firstChild.innerHTML).toEqual(settings.text);
            expect(controlElement.style.color).toEqual('rgb(77, 83, 89)');
        });

        it('updates text', function (done) {
            var updateSettings = {};
            updateSettings.text = 'OtherText';
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlElement.firstChild.innerHTML).toEqual('OtherText');
            });
        });

        it('updates font color', function (done) {
            var updateSettings = {};
            updateSettings.foreground = '#3AB878';
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlElement.style.color).toEqual('rgb(58, 184, 120)');
            });
        });

        it('ignores an unknown property update', function (done) {
            var updateSettings = {};
            updateSettings.anUnknownProperty = '{An unknown value}';
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel).toBeDefined();
                expect(viewModel).toBeDefined();
                expect(controlElement.firstChild).toBeDefined();
                expect(controlElement.firstChild.innerHTML).toBeDefined();
                expect(controlElement.firstChild.innerHTML).toEqual(settings.text);
                expect(controlElement.style.color).toEqual('rgb(77, 83, 89)');
            });
        });
    });
});
