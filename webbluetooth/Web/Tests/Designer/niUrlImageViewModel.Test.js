//****************************************
// Tests for UrlImageViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A  UrlImageViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;
    var controlId = 'UrlImageViewModelId';

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
            kind: NationalInstruments.HtmlVI.Models.UrlImageModel.MODEL_KIND,
            visible: true,
            source: '../Utilities/found.png',
            alternate: 'alternate',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            stretch: NationalInstruments.HtmlVI.Elements.UrlImage.StretchEnum.UNIFORM
        };
        updateSettings = {
            source: '../Utilities/other.png',
            alternate: 'other',
            stretch: NationalInstruments.HtmlVI.Elements.UrlImage.StretchEnum.FILL
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-url-image ni-control-id="' + controlId + '"></ni-url-image>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('dynamically updates properties triggering ModelPropertyChanged', function () {
        var viewModel, internalControl;

        // Can't directly check if background image loaded, so instead verify the computed image source is valid
        // urlString format should be 'url(some_url)'
        var testCSSBackgroundUrlString = function (urlString, successCB) {
            var backgroundImageUrl = urlString.match(/url\(['"]?(.*?)['"]?\)/i)[1];

            expect(typeof backgroundImageUrl).toBe('string');

            var testImage = new Image();
            testImage.addEventListener('load', function () {
                successCB.call(undefined);
            });
            testImage.src = backgroundImageUrl;
        };

        beforeEach(function (done) {
            controlElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('verifies initial values', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
        });

        it('updates multiple properties', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            var fakeDone = function () {};

            testHelpers.runAsync(fakeDone, function () {
                internalControl = controlElement.firstElementChild;
                expect(internalControl.title).toEqual(updateSettings.alternate);

                testCSSBackgroundUrlString(internalControl.style.backgroundImage, function () {
                    done();
                });
            });
        });

        it('handles unknown properties', function (done) {
            var unknownSettings = updateSettings;
            unknownSettings.unknown = 'unknown';

            webAppHelper.dispatchMessage(controlId, unknownSettings);

            var fakeDone = function () {};

            testHelpers.runAsync(fakeDone, function () {
                internalControl = controlElement.firstElementChild;
                expect(internalControl.title).toEqual(updateSettings.alternate);

                testCSSBackgroundUrlString(internalControl.style.backgroundImage, function () {
                    done();
                });
            });
        });
    });
});
