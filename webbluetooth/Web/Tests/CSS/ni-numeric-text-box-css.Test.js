describe('A Numeric Textbox has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'NumericTextBoxId123123', viModel;
    var cssSheetId = 'niNumericTextboxCSSId';
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var cssRules =
        '<style id="' + cssSheetId + '">' +
            'ni-numeric-text-box .ni-text-field {' +
                'background-color: rgb(100, 128, 255);' +
                'border-radius: 25px;' +
            '}' +

            'ni-numeric-text-box .ni-numeric-box {' +
                'background-color: rgb(100, 128, 255);' +
            '}' +

            'ni-numeric-text-box .ni-spins-box {' +
                'background-color: rgb(100, 128, 255);' +
            '}' +

            'ni-numeric-text-box .ni-spin-button {' +
                'background-color: rgb(100, 128, 255);' +
            '}' +

            'ni-numeric-text-box .ni-increment-icon {' +
                'background-color: rgb(100, 128, 255);' +
            '}' +

            'ni-numeric-text-box .ni-decrement-icon {' +
                'background-color: rgb(100, 128, 255);' +
            '}' +
        '</style>';

    beforeAll(function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            $(document.head).append(cssRules);
            $(document.body).append('<ni-numeric-text-box ni-control-id="' + controlId + '"></ni-numeric-text-box>');
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-numeric-text-box[ni-control-id="' + controlId + '"]');
            });
        });

    });

    afterAll(function (done) {
        element.remove();
        $(document.head).find('style[id="' + cssSheetId + '"]').remove();
        webAppHelper.removeWebAppFixture(done);
    });

    it('exposes class "ni-numeric-box"', function () {
        var exposedTag = element.querySelector('.ni-numeric-box');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-numeric-box" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-numeric-box'));
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

    it('exposes class "ni-spins-box"', function () {
        var exposedTag = element.querySelector('.ni-spins-box');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-spins-box" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-spins-box'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

    it('exposes class "ni-spin-button"', function () {
        var exposedTag = element.querySelector('.ni-spin-button');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-spin-button" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-spin-button'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

    it('exposes class "ni-increment-icon"', function () {
        var exposedTag = element.querySelector('.ni-increment-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-increment-icon" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-increment-icon'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });

    it('exposes class "ni-decrement-icon"', function () {
        var exposedTag = element.querySelector('.ni-decrement-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('updates "ni-decrement-icon" background-color', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-decrement-icon'));
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });
});
