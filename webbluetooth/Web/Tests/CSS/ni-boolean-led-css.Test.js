describe('A Boolean Led has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'BooleanLedCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderWidth = '4px';
    var borderRadius = '45px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-boolean-led .ni-boolean-box        { border-width: ' + borderWidth + '; }' +
                    'ni-boolean-led[value] .ni-boolean-box { border-radius: ' + borderRadius + '; }' +
                '</style>';
            $(document.head).append(cssRules);

            $(document.body).append('<ni-boolean-led value ni-control-id="' + controlId + '"></ni-boolean-led');
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-boolean-led[ni-control-id="' + controlId + '"]');
            });
        });

    });

    afterAll(function (done) {
        element.remove();
        webAppHelper.removeWebAppFixture(done);
    });

    // ----------------------------------
    // Verify classes are available
    // ----------------------------------
    it('that exposes class "ni-boolean-box"', function () {
        var exposedTag = element.querySelector('.ni-boolean-box');
        expect(exposedTag).not.toBeNull();
    });

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-width of "ni-boolean-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-boolean-box'));
        expect(targetStyle.borderWidth).toEqual(borderWidth);
    });

    it('that updates the border-radius of "ni-boolean-box" when value is present', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-boolean-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});
