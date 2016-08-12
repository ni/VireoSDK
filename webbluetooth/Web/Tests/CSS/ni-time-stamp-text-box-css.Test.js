describe('A Timestamp TextBox has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'TimestampTextboxId123123', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var cssSheetId = 'niTimestampTextboxCSSId';
    var cssRules =
            '<style id="' + cssSheetId + '">' +
                'ni-time-stamp-text-box .ni-time-stamp-box {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                'ni-time-stamp-text-box .ni-text-field {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                'ni-time-stamp-text-box .ni-calendar-button {' +
                    'background-color: rgb(100, 128, 255);' +
                    'border-color: #00a3cc;' +
                '}' +

                'ni-time-stamp-text-box .ni-calendar-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                    'background-size: 16px 16px;' +
                '}' +
              '</style>';

    beforeAll(function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            $(document.head).append(cssRules);
            $(document.body).append('<ni-time-stamp-text-box ni-control-id="' + controlId + '"></ni-time-stamp-text-box>');
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-time-stamp-text-box[ni-control-id="' + controlId + '"]');
            });
        });

    });

    afterAll(function (done) {
        element.remove();
        $(document.head).find('style[id="' + cssSheetId + '"]').remove();
        webAppHelper.removeWebAppFixture(done);
    });

    it('exposes class "ni-time-stamp-box"', function () {
        var exposedTag = element.querySelector('.ni-time-stamp-box');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-time-stamp-box" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-time-stamp-box'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

    it('exposes class "ni-text-field"', function () {
        var exposedTag = element.querySelector('.ni-text-field');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-text-field" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-text-field'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

    it('exposes class "ni-calendar-button"', function () {
        var exposedTag = element.querySelector('.ni-calendar-button');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-calendar-button" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-calendar-button'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

    it('exposes class "ni-calendar-icon"', function () {
        var exposedTag = element.querySelector('.ni-calendar-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-calendar-icon" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-calendar-icon'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

});
