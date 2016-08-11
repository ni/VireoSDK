//****************************************
// Tests for CheckBoxViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A CheckBoxViewModel', function () {
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
            kind: NationalInstruments.HtmlVI.Models.CheckBoxModel.MODEL_KIND,
            visible: true,
            value: false,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            contentVisible: true,
            content: 'Off/On',
            clickMode: NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.PRESS,
            momentary: false
        };

        updateSettings = {
            value: true,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic',
            contentVisible: false,
            content: 'none',
            clickMode: NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE,
            momentary: true
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-check-box ni-control-id="' + controlId + '"></ni-check-box>');

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
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.value).toEqual(settings.value);
            expect(controlModel.contentVisible).toEqual(settings.contentVisible);
            expect(controlModel.content).toEqual(settings.content);
            expect(controlModel.clickMode).toEqual(settings.clickMode);
            expect(controlModel.momentary).toEqual(settings.momentary);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.contentVisible).toEqual(updateSettings.contentVisible);
                expect(controlModel.content).toEqual(updateSettings.content);
                expect(controlModel.clickMode).toEqual(updateSettings.clickMode);
                expect(controlModel.momentary).toEqual(updateSettings.momentary);
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
                expect(controlModel.value).toEqual(settings.value);
                expect(controlModel.contentVisible).toEqual(settings.contentVisible);
                expect(controlModel.content).toEqual(settings.content);
            });
        });
    });

    it('allows calls to the click event to update the value.', function (done) {
        controlElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];

            var val = controlModel.value;
            expect(val).toEqual(settings.value);

            // Need to use simulate since mechanical actions fires on addEventListener events, not bind events
            $(controlElement).simulate('mousedown');
            $(controlElement).simulate('mouseup');
            var newVal = controlModel.value;
            expect(newVal).toEqual(!settings.value);
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('can be created with contentVisible set to false.', function (done) {
        settings.contentVisible = false;
        controlElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];

            expect(controlModel.contentVisible).toEqual(false);
            var labelText = controlElement.lastElementChild;
            expect(labelText.innerHTML).toEqual('');

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('can be created with the value set to false.', function (done) {
        settings.value = true;
        controlElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            var internalControl = controlElement.firstElementChild;

            expect($(internalControl).jqxCheckBox('checked')).toEqual(true);

            webAppHelper.removeNIElement(controlId);
        });
    });
});
