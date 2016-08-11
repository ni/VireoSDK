describe('A Check Box has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'CheckBoxCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var width = '10px';
    var borderRadius = '45px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-check-box .ni-boolean-box        { width: ' + width + ';}' +
                    'ni-check-box .ni-check-mark-box     { border-radius: ' + borderRadius + ';}' +
                    'ni-check-box .ni-check-mark-icon    { border-radius: ' + borderRadius + ';}' +
                    'ni-check-box[value] .ni-boolean-box { border-radius: ' + borderRadius + ';}' +
                '</style>';
            $(document.head).append(cssRules);

            $(document.body).append('<ni-check-box value ni-control-id="' + controlId + '"></ni-check-box');
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-check-box[ni-control-id="' + controlId + '"]');
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

    it('that exposes class "ni-check-mark-box"', function () {
        var exposedTag = element.querySelector('.ni-check-mark-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-check-mark-icon"', function () {
        var exposedTag = element.querySelector('.ni-check-mark-icon');
        expect(exposedTag).not.toBeNull();
    });

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the width of "ni-boolean-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-boolean-box'));
        expect(targetStyle.width).toEqual(width);

    });

    it('that updates the border-radius of "ni-boolean-box" when value is present', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-boolean-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-check-mark-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-check-mark-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-check-mark-icon"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-check-mark-icon'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});
