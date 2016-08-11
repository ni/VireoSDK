describe('A Linear Progress Bar has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'LinearProgressBarId123123', viModel;
    var elementName = 'ni-linear-progress-bar';
    var cssSheetId = 'niLinearProgressBarCSSId';
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var cssRules =
            '<style id="' + cssSheetId + '">' +
                'ni-linear-progress-bar .ni-track {' +
                    'background-color: rgb(100, 128, 255);' +
                    'border-radius: 25px;' +
                '}' +

                'ni-linear-progress-bar .ni-range-bar {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

            '</style>';

    beforeAll(function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
            $(document.head).append(cssRules);
            $(document.body).append('<' + elementName + ' ni-control-id="' + controlId + '"></' + elementName + '>');
            testHelpers.runAsync(done, function () {
                element = document.querySelector(elementName + '[ni-control-id="' + controlId + '"]');
            });
        });

    });

    afterAll(function (done) {
        element.remove();
        $(document.head).find('style[id="' + cssSheetId + '"]').remove();
        webAppHelper.removeWebAppFixture(done);
    });

    it('exposes class "ni-track"', function () {
        var exposedTag = element.querySelector('.ni-track');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-track" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-track'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

    it('exposes class "ni-range-bar"', function () {
        var exposedTag = element.querySelector('.ni-range-bar');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-range-bar" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-range-bar'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });
});
