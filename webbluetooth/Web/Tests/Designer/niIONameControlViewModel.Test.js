//****************************************
// Tests for IONameControlViewModel class
// National Instruments Copyright 2015
//****************************************

/* TODO mraj see comment below*/
/*global xit */

describe('A IONameControlViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'IONameControlViewModelId';

    var viModel, frontPanelControls, controlModel, controlElement, settings, updateSettings, reversedUpdateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.IONameControlModel.MODEL_KIND,
            visible: true,
            source: ['channel 1', 'channel 2', 'channel3'],
            selectedValue: 'channel 1',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        updateSettings = {
            source: ['channelOne', 'channelTwo', 'channelThree'],
            selectedValue: 'channelOne'
        };

        reversedUpdateSettings = {
            selectedValue: 'channelOne',
            source: ['channelOne', 'channelTwo', 'channelThree']
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page', function (done) {
        $(document.body).append('<ni-io-name-control ni-control-id="' + controlId + '"></ni-io-name-control>');
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
            expect(controlModel.selectedValue).toEqual(settings.selectedValue);
            expect(controlModel.source).toEqual(settings.source);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.selectedValue).toEqual(updateSettings.selectedValue);
                expect(controlModel.source).toEqual(updateSettings.source);
            });
        });

        // TODO: This fails in Chrome.  We need to make sure the source gets updated first regardless of
        // the order of the properties in the object.
        /* global xit */
        xit('and updates the Model when properties change with source modified last.', function (done) {
            webAppHelper.dispatchMessage(controlId, reversedUpdateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.selectedValue).toEqual(updateSettings.selectedValue);
                expect(controlModel.source).toEqual(updateSettings.source);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };

            webAppHelper.dispatchMessage(controlId, unknownSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.selectedValue).toEqual(settings.selectedValue);
                expect(controlModel.source).toEqual(settings.source);
            });
        });
    });

    it('responds to the select event and sets the new selected index.', function (done) {
        controlElement = webAppHelper.createNIElement(settings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).trigger($.Event('select', {
                args: {
                    item : {value: 'channel3'}
                }
            }));

            expect(controlModel.selectedValue).toEqual('channel3');
            webAppHelper.removeNIElement(controlId);
        });
    });
});
