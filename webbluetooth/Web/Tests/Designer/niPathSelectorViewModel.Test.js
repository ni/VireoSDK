//****************************************
// Tests for PathSelectorViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A PathSelectorViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'PathSelectorViewModelId';

    var viModel, frontPanelControls, controlModel, controlElement, settings, updateSettings, updateSettingsNullPath;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.PathSelectorModel.MODEL_KIND,
            visible: true,
            path: {components: [''], type: 'absolute'},
            readOnly: false,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            left: '272px',
            top: '166px',
            width: '90px',
            height: '22px'
        };

        updateSettings = {
            path: { components: ['home'], type: 'absolute' },
            readOnly: true,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };

        updateSettingsNullPath = {
            path: { components: [], type: 'absolute' },
            readOnly: true,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
        Object.freeze(updateSettingsNullPath);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-path-selector ni-control-id="' + controlId + '"></ni-path-selector>');
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
                internalControl = controlElement.firstElementChild;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.path).toEqual(settings.path);
            expect(controlModel.readOnly).toEqual(settings.readOnly);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.path).toEqual(updateSettings.path);
                expect(controlModel.readOnly).toEqual(updateSettings.readOnly);
                expect(controlModel.fontSize).toEqual(updateSettings.fontSize);
                expect(controlModel.fontFamily).toEqual(updateSettings.fontFamily);
                expect(controlModel.fontWeight).toEqual(updateSettings.fontWeight);
                expect(controlModel.fontStyle).toEqual(updateSettings.fontStyle);
            });
        });

        it('and updates the Model when properties change, even with null values.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettingsNullPath);
            testHelpers.runAsync(done, function () {
                expect(controlModel.path).toEqual(updateSettingsNullPath.path);
                expect(controlModel.readOnly).toEqual(updateSettingsNullPath.readOnly);
                expect(controlModel.fontSize).toEqual(updateSettingsNullPath.fontSize);
                expect(controlModel.fontFamily).toEqual(updateSettingsNullPath.fontFamily);
                expect(controlModel.fontWeight).toEqual(updateSettingsNullPath.fontWeight);
                expect(controlModel.fontStyle).toEqual(updateSettingsNullPath.fontStyle);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };

            webAppHelper.dispatchMessage(controlId, unknownSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.path).toEqual(settings.path);
                expect(controlModel.readOnly).toEqual(settings.readOnly);
            });
        });

        it('allows calls to the change event listener to update value.', function () {
            var oldValue = controlModel.path;
            expect(oldValue).toEqual(settings.path);
            $(internalControl).val('home:\\');
            $(internalControl).trigger('change'); // Normally this happens when the pathcontrol loses focus

            var newValue = controlModel.path;
            expect(newValue).toEqual(updateSettings.path);
        });
    });
});
