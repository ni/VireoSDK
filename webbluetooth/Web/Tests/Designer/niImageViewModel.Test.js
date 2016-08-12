//****************************************
// Tests for ImageViewModel class
// National Instruments Copyright 2016
//****************************************

describe('A  ImageViewModel', function () {
    'use strict';
    var controlId = 'ImageViewModelId';

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
            kind: NationalInstruments.HtmlVI.Models.ImageModel.MODEL_KIND,
            visible: true,
            source: 'R0lGODlhEwATALMAAP///+/v7+bm5t7e3tbW1szMzMXFxZnM/729vbW1ta2traWlpZycpZmZmWaZzP///yH/C05FVFNDQVBFMi4wAwEAAAAh+QQJCgAPACwAAAAAEwATAAAEcfDJ+dpqjWq9hk9GgmyUIgQBERaEQibWmRpNSiQacjaATaAqHCXhIxhVBpqBMbEcjcloVLGoSK9YA+LCwHi/YIzr4ZiUJWfy5qBml90PuCZNN1Pe7TzejuarNXCBeht1fYZ9gnh7h4V/FGwSkHETkg8RACH5BAkKAA8ALAAAAAATABMAAARy8Mn52mqNar2GT0aCbJQiBAERFoRCJtaZGk1KJBpyNoBNoCocJeEjGFUGmoExsRyNyWhUsahIr1gD4sLAeL9gjOvheBzIZvS5fJ6UJW80fLNOs9VySnzv1tv/dW1zg3lxE4F4d4aEfISJgHiHkhKCgg8RACH5BAkKAA8ALAAAAAATABMAAARy8Mn52mqNar2GR0aCbJQiBAERFoRCJhaaGk1KJBpyNoBNoCocJeEjGFUGmoExsRyNyWhUsahIr1gD4sLAeL9gjGviIJslZfPhUV632Y/1GY6eT9xxOB6vSdP/fnqCb29zfocbe4N5gXWOgBRrknmTkw8RACH5BAkKAA8ALAAAAAATABMAAARx8Mn52mqNar2GR0aCbJQiBAERFoRCJhaaGk1KJBpyNoBNoCocJeEjGFUGmoExsRyNyWhUsahIr1gD4sLAeL9gjOtxeDjIZvS5fNa005L3O81W28sTeX6vqfvpcBR6cXyEf2uAhYOBE4d3jBJ4aJGNEhEAOw==',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            stretch: NationalInstruments.HtmlVI.Elements.Image.StretchEnum.UNIFORM
        };
        updateSettings = {
            source: 'R0lGODlhEwATAMQAAP/37//35v/v7//v5vfm1vfmzv/e3v/ezvfevffWtf/MzN7WxffOrffOnPfOpe/FlP+1tf+tpf+ZmfechP+ZZsWlc/+MjP97e2aZzP9za/9mZqV7UoxaIcwzAP///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCgAeACwDAAAADQATAAAFZ6AnesvGbcuoetXjVuv4YPMTi4z7MLcHJI8EIHbQGREig0UzMeoGno5Gk3lQrA/EozEUaCQNncMzeBA8Co0i50p4CGPP5UuX0CMizdLOp4v6gBoQKy4ehTeFhzGJNog2ioSPjZFGKiEAIfkECQoAHgAsAwAAAA0AEwAABSegJ45kaZ5oqq5s675wLHuFhyD06XhAw58+wC5wwhVqOBPA41j6YCEAIfkECQoAHgAsAwABAA0AEgAABWugJ3rLxm3LqHrV41br+GDzE4uM+zC3BySPBCB20BkRIoNFMzHqBp6ORpN5UKwPxKMxFGgkDZ3DM3gQPAqNIudKeAhjz+VLl9AjIs3SzqeL+oAaECoFWVoFNw4PAGFDMTkDkDdlDJQ3TjYjIQA7',
            alternate: 'other',
            stretch: NationalInstruments.HtmlVI.Elements.Image.StretchEnum.FILL
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
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

                testCSSBackgroundUrlString(internalControl.style.backgroundImage, function () {
                    done();
                });
            });
        });
    });
});
