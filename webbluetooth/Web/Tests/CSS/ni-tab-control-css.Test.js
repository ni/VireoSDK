describe('A Tab Control has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'TabControlCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderRadius = '46px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-tab-control .ni-headers-box { border-radius: ' + borderRadius + '; }' +
                '</style>';
            $(document.head).append(cssRules);

            var tabControlHtml = '<ni-tab-control ni-control-id="' + controlId + '">' +
                    '<ni-tab-item data-ni-base-style="uninitialized" ni-control-id="19" tab-position="0" header="Numerics">' +
                        '<ni-layout-panel data-ni-base-style="uninitialized" ni-control-id="21" label-id="">' +
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
    it('that exposes class "ni-headers-box"', function () {
        var exposedTag = element.querySelector('.ni-headers-box');
        expect(exposedTag).not.toBeNull();
    });

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of the "ni-headers-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-headers-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});
