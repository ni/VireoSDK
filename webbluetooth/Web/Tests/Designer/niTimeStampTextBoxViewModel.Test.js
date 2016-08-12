//****************************************
// Tests for TimeStampTextBoxViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A TimeStampTextBoxViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'TimeStampTextBoxViewModelId';
    var viModel, frontPanelControls, controlModel, controlElement, settings, updateSettings, indicatorSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.TimeStampTextBoxModel.MODEL_KIND,
            visible: true,
            value: '2714018400:0',
            readOnly: false,
            configuration: {
                formatString: 'F'
            },
            left: '272px',
            top: '166px',
            width: '90px',
            height: '22px'
        };

        updateSettings = {
            value: '2714012345:0',
            readOnly: true
        };

        indicatorSettings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.TimeStampTextBoxModel.MODEL_KIND,
            visible: true,
            value: '2714018400:0',
            readOnly: true,
            configuration: {
                formatString: 'F'
            },
            left: '272px',
            top: '166px',
            width: '90px',
            height: '22px'
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
        Object.freeze(indicatorSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-time-stamp-text-box ni-control-id="' + controlId + '"></ni-time-stamp-text-box>');
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
            expect(controlModel.visible).toEqual(settings.visible);
            expect(controlModel.value).toEqual(settings.value);
            expect(controlModel.configuration).toEqual(settings.configuration);
            expect(controlModel.readOnly).toEqual(settings.readOnly);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.value).toEqual(updateSettings.value);
                expect(controlModel.readOnly).toEqual(updateSettings.readOnly);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };

            webAppHelper.dispatchMessage(controlId, unknownSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.visible).toEqual(settings.visible);
                expect(controlModel.value).toEqual(settings.value);
                expect(controlModel.configuration).toEqual(settings.configuration);
                expect(controlModel.readOnly).toEqual(settings.readOnly);
            });
        });

        it('allows calls to the change event to update the value.', function () {
            var internalControl = controlElement.firstElementChild;
            var oldValue = controlModel.value;
            expect(oldValue).toEqual('2714018400:0');
            var newDate = new Date(Date.UTC(2010, 11, 31, 11, 59, 59));
            $(internalControl)[0].value = newDate;
            // Note: event name changes from valuechanged to valueChanged in different versions of jqwidgets
            // http://www.jqwidgets.com/community/topic/cannot-bind-to-events/
            $(internalControl).trigger($.Event('valueChanged', {
                args: {
                    date: newDate
                }
            }));

            var newValue = controlModel.value;
            expect(newValue).toEqual('3376641599:0');
        });
    });

    it('is created when the element is an indicator and has the correct initial values.', function (done) {
        webAppHelper.createNIElement(indicatorSettings);

        testHelpers.runAsync(done, function () {
            var viewModel;

            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            viewModel = viModel.getControlViewModel(controlId);
            controlElement = viewModel.element;

            expect(controlModel.value).toEqual(settings.value);
            expect(controlModel.readOnly).toEqual(true);
            webAppHelper.removeNIElement(controlId);
        });
    });
});
