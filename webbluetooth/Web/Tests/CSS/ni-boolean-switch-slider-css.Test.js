describe('A Slider Boolean Switch has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'BooleanSwitchSliderCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderWidth = '10px';
    var borderRadius = '45px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-boolean-switch[shape="slider"] .ni-boolean-box        { border-width: ' + borderWidth + ';}' +
                    'ni-boolean-switch[shape="slider"][value] .ni-boolean-box { border-radius: ' + borderRadius + ';}' +
                    'ni-boolean-switch[shape="slider"] .ni-thumb-box          { border-radius: ' + borderRadius + ';}' +
                    'ni-boolean-switch[shape="slider"] .ni-thumb              { border-radius: ' + borderRadius + ';}' +
                    'ni-boolean-switch[shape="slider"] .ni-on-label           { border-radius: ' + borderRadius + ';}' +
                    'ni-boolean-switch[shape="slider"] .ni-off-label          { border-radius: ' + borderRadius + ';}' +
                '</style>';
            $(document.head).append(cssRules);

            $(document.body).append('<ni-boolean-switch value shape="slider" content="Button" ni-control-id="' + controlId + '"></ni-boolean-switch');
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

    it('that exposes class "ni-thumb-box"', function () {
        var exposedTag = element.querySelector('.ni-thumb-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-thumb"', function () {
        var exposedTag = element.querySelector('.ni-thumb');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-on-label"', function () {
        var exposedTag = element.querySelector('.ni-on-label');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-off-label"', function () {
        var exposedTag = element.querySelector('.ni-off-label');
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

    it('that updates the border-radius of "ni-thumb-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-thumb-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-thumb"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-thumb'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-on-label"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-on-label'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-off-label"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-off-label'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});
