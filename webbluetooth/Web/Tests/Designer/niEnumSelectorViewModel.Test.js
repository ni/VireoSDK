//****************************************
// Tests for EnumSelectorViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A EnumSelectorViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'EnumSelectorViewModelId';

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
            kind: NationalInstruments.HtmlVI.Models.EnumSelectorModel.MODEL_KIND,
            visible: true,
            readOnly: false,
            value: 0,
            items: [{ value: 0, displayValue: 'first' }, { value: 1, displayValue: 'second' }, { value: 2, displayValue: 'third' }],
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };
        updateSettings = {
            value: 2,
            items: [{ value: 0, displayValue: 'a' }, { value: 1, displayValue: 'b' }, { value: 2, displayValue: 'c' }]
        };
        Object.freeze(settings);
        Object.freeze(updateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page', function (done) {
        $(document.body).append('<ni-enum-selector ni-control-id="' + controlId + '"></ni-enum-selector>');
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
            expect(controlModel.value).toEqual(settings.value);
            expect(controlModel.items).toEqual(settings.items);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.value).toEqual(updateSettings.value);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };
            webAppHelper.dispatchMessage(controlId, unknownSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.value).toEqual(settings.value);
                expect(controlModel.items).toEqual(settings.items);
            });
        });
    });

    it('responds to the jqx selectIndex method and sets the new selected index.', function (done) {
        controlElement = webAppHelper.createNIElement(settings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).jqxDropDownList('selectIndex', 2);

            expect(controlModel.value).toEqual(2);
            webAppHelper.removeNIElement(controlId);
        });
    });
});
