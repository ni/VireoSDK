describe('A Text control has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'TextControlId123123', viModel;
    var elementName = 'ni-text';
    var cssSheetId = 'niTextCSSId';
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var cssRules =
            '<style id="' + cssSheetId + '">' +
                elementName + ' {' +
                    'background-color: rgb(100, 128, 255);' +
                    'border-radius: 25px;' +
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

    it('updates "ni-text" background-color', function () {
        var targetStyle = window.getComputedStyle(element);
        expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
    });
});
