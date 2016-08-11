//****************************************
// Tests for BooleanButtonModel class
// National Instruments Copyright 2014
//****************************************

describe('A BooleanLEDViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';
    var viModel, frontPanelControls, buttonModel, buttonElement, settings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.BooleanLEDModel.MODEL_KIND,
            trueContent: 'trueContent',
            falseContent: 'falseContent',
            contentVisible: true,
            shape: NationalInstruments.HtmlVI.Models.BooleanLEDModel.ShapeEnum.ROUND,
            value: false,
            clickMode: NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.PRESS,
            momentary: false
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows creation with false value to create falseContent', function (done) {
        settings.value = false;
        settings.falseContent = 'falseContent';
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];
            expect(buttonModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();

            var internalControl = $(buttonElement.firstElementChild);
            var content = internalControl.attr('value');
            expect(content).toEqual('falseContent');
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows creation with true value to create trueContent', function (done) {
        settings.value = true;
        settings.trueContent = 'trueContent';
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];
            expect(buttonModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();

            var content = $(buttonElement.firstElementChild).attr('value');
            expect(content).toEqual('trueContent');
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows creation with shape set to square', function (done) {
        settings.value = true;
        settings.shape = NationalInstruments.HtmlVI.Models.BooleanLEDModel.ShapeEnum.SQUARE;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];
            expect(buttonModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();

            expect(buttonModel.shape).toEqual(NationalInstruments.HtmlVI.Models.BooleanLEDModel.ShapeEnum.SQUARE);
            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('dynamically updates properties triggering ModelPropertyChanged', function () {
        var viewModel, control;

        beforeEach(function (done) {
            buttonElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                buttonModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                control = $(buttonElement.firstElementChild);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('first verifies initial values', function () {
            expect(buttonModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(control.attr('value')).toEqual('falseContent');
            expect(control.jqxToggleButton('toggled')).toEqual(false);
            expect(buttonModel.momentary).toEqual(false);
            expect(buttonModel.clickMode).toEqual(NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.PRESS);
        });

        it('updates value', function (done) {
            var updateSettings = {};
            updateSettings.value = true;
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(control.attr('value')).toEqual('trueContent');
            });
        });

        it('updates true content', function (done) {
            var updateSettings = {};
            updateSettings.value = true;
            updateSettings.trueContent = 'this is all true';
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(control.attr('value')).toEqual('this is all true');
            });
        });

        it('updates content visible to false', function (done) {
            var updateSettings = {};
            updateSettings.contentVisible = false;
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(control.attr('value')).toEqual('');
            });
        });

        it('updates content visible to true', function (done) {
            var updateSettings = {};
            updateSettings.value = true;
            updateSettings.contentVisible = true;
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(control.attr('value')).toEqual('trueContent');
            });
        });

        it('updates shape to square', function (done) {
            var updateSettings = {};
            updateSettings.shape = NationalInstruments.HtmlVI.Models.BooleanLEDModel.ShapeEnum.SQUARE;
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(buttonModel.shape).toEqual(NationalInstruments.HtmlVI.Models.BooleanLEDModel.ShapeEnum.SQUARE);
            });
        });

        it('updates value, clickMode, momentary', function (done) {
            var updateSettings = {};
            updateSettings.value = false;
            updateSettings.clickMode = NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE;
            updateSettings.momentary = true;
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(control.jqxToggleButton('toggled')).toEqual(false);
                expect(buttonModel.momentary).toEqual(true);
                expect(buttonModel.clickMode).toEqual(NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE);
            });
        });
    });

    it('allows to call the click event updates value', function (done) {
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];
            var val = buttonModel.value;
            expect(val).toEqual(false);

            // Need to use simulate since mechanical actions fires on addEventListener events, not bind events
            $(buttonElement).simulate('mousedown');
            $(buttonElement).simulate('mouseup');

            var newVal = buttonModel.value;
            expect(newVal).toEqual(true);
            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('with contentVisible starting false', function () {
        var control;

        beforeEach(function (done) {
            settings.contentVisible = false;
            buttonElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                buttonModel = frontPanelControls[controlId];
                control = buttonElement.firstElementChild;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('starts with invisible content', function () {
            expect($(control).attr('value')).toEqual('');
        });

        it('can change to show the content', function (done) {
            var updateSettings = {};
            updateSettings.contentVisible = true;
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect($(control).attr('value')).toEqual('falseContent');
            });
        });

    });
});
