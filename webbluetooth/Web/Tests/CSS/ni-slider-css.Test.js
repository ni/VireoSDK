/*globals xit*/
describe('A Numeric Slider has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'SliderId123123', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var cssSheetId = 'niSliderCSSId';
    var cssRules =
             '<style id="' + cssSheetId + '">' +
                'ni-slider .ni-thumb { ' +
                    'background-color: rgb(0, 230, 0);' +
                    'border-radius: 0%;' +
                '}' +

                'ni-slider .ni-tick {' +
                    'background-color: rgb(128, 100, 100);' +
                '}' +

                'ni-slider .ni-track {' +
                    'background-color: rgb(255, 250, 0);' +
                '}' +

                'ni-slider .ni-range-bar {' +
                    'background-color: rgb(45, 68, 99);' +
                '}' +
              '</style>';

    beforeAll(function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            $(document.head).append(cssRules);
            $(document.body).append('<ni-slider ni-control-id="' + controlId + '"></ni-slider>');
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-slider[ni-control-id="' + controlId + '"]');
            });
        });

    });

    afterAll(function (done) {
        element.remove();
        $(document.head).find('style[id="' + cssSheetId + '"]').remove();
        webAppHelper.removeWebAppFixture(done);
    });

    it('exposes class "ni-thumb"', function () {
        var exposedTag = element.querySelector('.ni-thumb');
        expect(exposedTag).not.toBeNull();
    });

    it('updates the ni-thumb background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-thumb'));
        expect(targetStyle.backgroundColor).toEqual('rgb(0, 230, 0)');
        expect(targetStyle.borderRadius).toEqual('0%');
    });

    // TODO: Fix this test, jquery doesn't seem to find. jqx-slider-tick when the
    // control is created. Pretty jqWidgets is creating the ticks after control
    // initialization: DE8926
    xit('exposes class "ni-tick"', function () {
        var exposedTag = element.querySelector('.ni-tick');
        expect(exposedTag).not.toBeNull();
    });

    xit('updates "ni-tick" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-tick'));
        expect(targetStyle.backgroundColor).toEqual('rgb(128, 100, 100)');
    });

    it('exposes class "ni-track"', function () {
        var exposedTag = element.querySelector('.ni-track');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-track" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-track'));
        expect(targetStyle.backgroundColor).toEqual('rgb(255, 250, 0)');
    });

    it('exposes class "ni-range-bar"', function () {
        var exposedTag = element.querySelector('.ni-range-bar');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-range-bar" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-range-bar'));
        expect(targetStyle.backgroundColor).toEqual('rgb(45, 68, 99)');
    });
});
