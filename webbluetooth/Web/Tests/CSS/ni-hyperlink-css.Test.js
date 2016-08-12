describe('A Hyperlink Control has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'HyperlinkControlId123123', viModel;
    var elementName = 'ni-hyperlink';
    var cssSheetId = 'niHyperlinkCSSiId';
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var cssRules =
            '<style id="' + cssSheetId + '">' +
                elementName + '{' +
                    'color: rgb(100, 128, 255);' +
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

    it('updates "ni-hyperlink" color', function () {
        var targetStyle = window.getComputedStyle(element);
        expect(targetStyle.color).toEqual('rgb(100, 128, 255)');
    });
});
