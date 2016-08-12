describe('A Power Boolean Switch has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'BooleanSwitchPowerCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var paddingLeft = '2px';
    var borderRadius = '45px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-boolean-switch[shape="power"] .ni-boolean-box        { padding-left: ' + paddingLeft + ';}' +
                    'ni-boolean-switch[shape="power"][value] .ni-boolean-box { border-radius: ' + borderRadius + ';}' +
                '</style>';
            $(document.head).append(cssRules);

            $(document.body).append('<ni-boolean-switch value shape="power" content="Button" ni-control-id="' + controlId + '"></ni-boolean-switch');
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-boolean-switch[ni-control-id="' + controlId + '"]');
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
    it('that updates the padding left of "ni-boolean-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-boolean-box'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the border-radius of "ni-boolean-box" when value is present', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-boolean-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});
