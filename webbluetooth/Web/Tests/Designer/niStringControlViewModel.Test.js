//****************************************
// Tests for StringControlViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A StringControlViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'StringControlViewModelId';

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
            kind: NationalInstruments.HtmlVI.Models.StringControlModel.MODEL_KIND,
            visible: true,
            text: 'Editable',
            readOnly: false,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            acceptsReturn: true,
            typeToReplace: false,
            left: '272px',
            top: '166px',
            width: '90px',
            height: '22px'
        };

        updateSettings = {
            text: 'ReadOnly',
            readOnly: true,
            acceptsReturn: false,
            typeToReplace: true,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-string-control ni-control-id="' + controlId + '"></ni-string-control>');
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
            expect(controlModel.text).toEqual(settings.text);
            expect(controlModel.readOnly).toEqual(settings.readOnly);
            expect(controlModel.acceptsReturn).toEqual(settings.acceptsReturn);
            expect(controlModel.typeToReplace).toEqual(settings.typeToReplace);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.text).toEqual(updateSettings.text);
                expect(controlModel.readOnly).toEqual(updateSettings.readOnly);
                expect(controlModel.acceptsReturn).toEqual(updateSettings.acceptsReturn);
                expect(controlModel.typeToReplace).toEqual(updateSettings.typeToReplace);
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
                expect(controlModel.text).toEqual(settings.text);
                expect(controlModel.readOnly).toEqual(settings.readOnly);
                expect(controlModel.acceptsReturn).toEqual(settings.acceptsReturn);
                expect(controlModel.typeToReplace).toEqual(settings.typeToReplace);
            });
        });

        it('allows calls to the change event listener to update value.', function () {
            var oldValue = controlModel.text;
            expect(oldValue).toEqual('Editable');
            $(internalControl).text('Testing');
            $(internalControl).trigger('change'); // Normally this happens when the textbox loses focus

            var newValue = controlModel.text;
            expect(newValue).toEqual('Testing');
        });
    });
});
