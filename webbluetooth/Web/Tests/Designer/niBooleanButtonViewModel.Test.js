//****************************************
// Tests for BooleanButtonModel class
// National Instruments Copyright 2014
//****************************************

describe('A BooleanButtonViewModel', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';
    var viModel, frontPanelControls, buttonModel, buttonElement, settings, updateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.BooleanButtonModel.MODEL_KIND,
            content: 'content',
            glyph: 0,
            contentVisible: true,
            value: false,
            clickMode: NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.PRESS,
            momentary: false,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            visible: true
        };

        updateSettings = {
            content: '',
            glyph: 97,
            contentVisible: false,
            value: true,
            clickMode: NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE,
            momentary: true,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows creating an instance with value set to true', function (done) {
        settings.value = true;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            //buttonElement = document.getElementById(controlId);
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];
            var val = buttonModel.value;

            expect(val).toEqual(true);

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows creating an instance with value set to false', function (done) {
        settings.value = false;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            //buttonElement = document.getElementById(controlId);
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];
            var val = buttonModel.value;

            expect(val).toEqual(false);

            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('dynamically updates properties triggering ModelPropertyChanged', function () {
        var viewModel, internalControl, contentSpan, glyphSpan;

        beforeEach(function (done) {
            buttonElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                //buttonElement = document.getElementById(controlId);
                frontPanelControls = viModel.getAllControlModels();
                buttonModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                internalControl = $(buttonElement.firstElementChild);
                glyphSpan = buttonElement.firstElementChild.childNodes[0];
                contentSpan = buttonElement.firstElementChild.childNodes[1];
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('verifies initial values', function () {
            expect(buttonModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect($(contentSpan).text()).toEqual('content');
            expect($(glyphSpan).text()).toEqual('');
            expect(internalControl.jqxToggleButton('toggled')).toEqual(false);
            expect(buttonModel.momentary).toEqual(false);
            expect(buttonModel.clickMode).toEqual(NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.PRESS);
        });

        it('updates content, value, momentary, and clickMode', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect($(contentSpan).text()).toEqual('');
                expect($(glyphSpan).text()).toEqual('a ');
                expect(internalControl.jqxToggleButton('toggled')).toEqual(true);
                expect(buttonModel.momentary).toEqual(true);
                expect(buttonModel.clickMode).toEqual(NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE);
                expect(buttonModel.fontSize).toEqual('20px');
                expect(buttonModel.fontFamily).toEqual('sans-serif');
                expect(buttonModel.fontWeight).toEqual('bold');
                expect(buttonModel.fontStyle).toEqual('italic');
            });
        });

        it('updates contentVisible', function (done) {
            webAppHelper.dispatchMessage(controlId, {
                contentVisible: false
            });

            testHelpers.runAsync(done, function () {
                expect($(contentSpan).text()).toEqual('');
                expect($(glyphSpan).text()).toEqual('');
            });
        });
    });

    it('allows a click with mechnical action set to when released to update value', function (done) {
        settings.momentary = false;
        settings.clickMode = NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            //buttonElement = document.getElementById(controlId);
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];

            // Button not pressed
            expect(buttonModel.value).toEqual(false);

            // Button mouse down
            $(buttonElement).simulate('mousedown');
            expect(buttonModel.value).toEqual(false);

            //Button mouse up
            $(buttonElement).simulate('mouseup');
            expect(buttonModel.value).toEqual(true);

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows a click with mechnical action set to when pressed to update value', function (done) {
        settings.momentary = false;
        settings.clickMode = NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.PRESS;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            //buttonElement = document.getElementById(controlId);
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];

            // Button not pressed
            expect(buttonModel.value).toEqual(false);

            // Button mouse down
            $(buttonElement).simulate('mousedown');
            expect(buttonModel.value).toEqual(true);

            //Button mouse up
            $(buttonElement).simulate('mouseup');
            expect(buttonModel.value).toEqual(true);

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows a click with mechnical action set to until released to update value', function (done) {
        settings.momentary = true;
        settings.clickMode = NationalInstruments.HtmlVI.Models.BooleanControlModel.ClickModeEnum.RELEASE;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            //buttonElement = document.getElementById(controlId);
            frontPanelControls = viModel.getAllControlModels();
            buttonModel = frontPanelControls[controlId];

            // Button not pressed
            expect(buttonModel.value).toEqual(false);

            // Button mouse down
            $(buttonElement).simulate('mousedown');
            expect(buttonModel.value).toEqual(true);

            //Button mouse up
            $(buttonElement).simulate('mouseup');
            expect(buttonModel.value).toEqual(false);

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows to create with contentVisible false', function (done) {
        settings.contentVisible = false;
        settings.value = true;
        settings.falseContent = 'isfalse';
        settings.trueContent = 'istrue';
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            //buttonElement = document.getElementById(controlId);
            buttonModel = frontPanelControls[controlId];
            expect($(buttonElement).attr('value')).toEqual('');

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('updated all of its properties expected to be updated', function () {
        var uncoveredProperties = [
            'readOnly',
            'bindingInfo',
            'labelId',
            'niControlId',
            'viRef'
        ];
        var propertiesUpdated = testHelpers.customElementMonitor.uncalledPropertiesExceptFor(settings.kind, uncoveredProperties);

        expect(propertiesUpdated).toEqual(testHelpers.customElementMonitor.EVERYTHING_CALLED);
    });
});
