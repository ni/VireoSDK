describe('A Layout panel has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'LayoutPanelCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderRadius = '7px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-layout-panel { border-radius: ' + borderRadius + '; }' +
                '</style>';
            $(document.head).append(cssRules);

            var tabControlHtml = '<ni-tab-control ni-control-id="' + controlId + '">' +
                    '<ni-tab-item data-ni-base-style="uninitialized" ni-control-id="119" tab-position="0" header="Numerics">' +
                        '<ni-layout-panel data-ni-base-style="uninitialized" ni-control-id="121" label-id="">' +
                        '</ni-layout-panel>' +
                    '</ni-tab-item>' +
                '</ni-tab-control>';
            $(document.body).append(tabControlHtml);
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-tab-control[ni-control-id="' + controlId + '"]');
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
    // The ni-layout-panel doesn't have specific classes available

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of the "ni-layout-panel"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('ni-layout-panel'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});
