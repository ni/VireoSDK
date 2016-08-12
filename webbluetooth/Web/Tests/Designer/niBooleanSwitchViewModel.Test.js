//****************************************
// Tests for BooleanSwitchViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A BooleanSwitchViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';
    var viModel, frontPanelControls, buttonElement, controlModel, controlElement, settings, updateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.BooleanSwitchModel.MODEL_KIND,
            visible: true,
            shape: NationalInstruments.HtmlVI.Models.BooleanSwitchModel.ShapeEnum.SLIDER,
            orientation: 'vertical',
            value: false,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            contentVisible: true,
            trueContent: 'On',
            falseContent: 'Off'
        };

        updateSettings = {
            orientation: 'horizontal',
            value: true,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic',
            contentVisible: false,
            trueContent: 'On-',
            falseContent: 'Off-'
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-boolean-switch ni-control-id="' + controlId + '"></ni-boolean-switch>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('exists after the custom element is created with the slider shape', function () {
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
            expect(controlModel.contentVisible).toEqual(settings.contentVisible);
            expect(controlModel.orientation).toEqual(settings.orientation);
            expect(controlModel.trueContent).toEqual(settings.trueContent);
            expect(controlModel.falseContent).toEqual(settings.falseContent);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.contentVisible).toEqual(updateSettings.contentVisible);
                expect(controlModel.orientation).toEqual(updateSettings.orientation);
                expect(controlModel.trueContent).toEqual(updateSettings.trueContent);
                expect(controlModel.falseContent).toEqual(updateSettings.falseContent);
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
                expect(controlModel.orientation).toEqual(settings.orientation);
                expect(controlModel.trueContent).toEqual(settings.trueContent);
                expect(controlModel.falseContent).toEqual(settings.falseContent);
            });
        });
    });

    it('can be created with contentVisible set to false.', function (done) {
        settings.contentVisible = false;
        webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            controlElement = viewModel.element;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            var innerControl = controlElement.firstElementChild;

            expect(controlModel.contentVisible).toEqual(settings.contentVisible);
            var onLabel = $(innerControl).jqxSwitchButton('onLabel');
            expect(onLabel).toEqual('');
            var offLabel = $(innerControl).jqxSwitchButton('offLabel');
            expect(offLabel).toEqual('');

            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('exists after the custom element is created with the power shape', function () {
        var viewModel;

        beforeEach(function (done) {
            settings.shape = NationalInstruments.HtmlVI.Models.BooleanSwitchModel.ShapeEnum.POWER;
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

        it('and the correct shape is applied to the element.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlElement.shape).toEqual(NationalInstruments.HtmlVI.Models.BooleanSwitchModel.ShapeEnum.POWER);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.contentVisible).toEqual(updateSettings.contentVisible);
                expect(controlModel.orientation).toEqual(updateSettings.orientation);
                expect(controlModel.trueContent).toEqual(updateSettings.trueContent);
                expect(controlModel.falseContent).toEqual(updateSettings.falseContent);
            });
        });
    });

    describe('exists after the custom element is created with the round shape', function () {
        var viewModel;

        beforeEach(function (done) {
            settings.shape = NationalInstruments.HtmlVI.Models.BooleanSwitchModel.ShapeEnum.ROUND;
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

        it('and the correct shape is applied to the element.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlElement.shape).toEqual(NationalInstruments.HtmlVI.Models.BooleanSwitchModel.ShapeEnum.ROUND);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.contentVisible).toEqual(updateSettings.contentVisible);
                expect(controlModel.orientation).toEqual(updateSettings.orientation);
                expect(controlModel.trueContent).toEqual(updateSettings.trueContent);
                expect(controlModel.falseContent).toEqual(updateSettings.falseContent);
            });
        });
    });

    it('allows calls to the click event to update the value when the shape is set to power.', function (done) {
        settings.shape = NationalInstruments.HtmlVI.Models.BooleanSwitchModel.ShapeEnum.POWER;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            expect(controlModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            controlElement = viewModel.element;
            expect(viewModel).toBeDefined();

            var val = controlModel.value;
            expect(val).toEqual(settings.value);

            $(buttonElement).simulate('mousedown');
            $(buttonElement).simulate('mouseup');

            var newVal = controlModel.value;
            expect(newVal).toEqual(!settings.value);
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows calls to the click event to update the value when the shape is set to round.', function (done) {
        settings.shape = NationalInstruments.HtmlVI.Models.BooleanSwitchModel.ShapeEnum.ROUND;
        buttonElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            expect(controlModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            controlElement = viewModel.element;
            expect(viewModel).toBeDefined();

            var val = controlModel.value;
            expect(val).toEqual(settings.value);

            $(buttonElement).simulate('mousedown');
            $(buttonElement).simulate('mouseup');

            var newVal = controlModel.value;
            expect(newVal).toEqual(!settings.value);
            webAppHelper.removeNIElement(controlId);
        });
    });
});
