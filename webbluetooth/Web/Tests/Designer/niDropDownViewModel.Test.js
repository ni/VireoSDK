//****************************************
// Tests for DropDownViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A DropDownViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'DropDownViewModelId';

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
            kind: NationalInstruments.HtmlVI.Models.DropDownModel.MODEL_KIND,
            visible: true,
            selectedIndex: 0,
            source: ['alpha', 'beta', 'charlie'],
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        updateSettings = {
            selectedIndex: 1,
            source: ['zero', 'one', 'two']
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page', function (done) {
        $(document.body).append('<ni-drop-down ni-control-id="' + controlId + '"></ni-drop-down>');
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
            expect(controlModel.selectedIndex).toEqual(settings.selectedIndex);
            expect(controlModel.source).toEqual(settings.source);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.selectedIndex).toEqual(updateSettings.selectedIndex);
                expect(controlModel.source).toEqual(updateSettings.source);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };
            webAppHelper.dispatchMessage(controlId, unknownSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.selectedIndex).toEqual(settings.selectedIndex);
                expect(controlModel.source).toEqual(settings.source);
            });
        });
    });

    it('responds to the select event and sets the new selected index.', function (done) {
        controlElement = webAppHelper.createNIElement(settings);

        testHelpers.runMultipleAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).jqxDropDownList({selectedIndex: 2});
        }, function () {
            expect(controlModel.selectedIndex).toEqual(2);

            webAppHelper.removeNIElement(controlId);
        });
    });
});
