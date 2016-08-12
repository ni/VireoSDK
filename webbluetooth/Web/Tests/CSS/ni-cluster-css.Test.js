describe('A Cluster has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'ClusterCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderRadius = '4px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-cluster { border-radius: ' + borderRadius + '; }' +
                '</style>';
            $(document.head).append(cssRules);

            $(document.body).append('<ni-cluster ni-control-id="' + controlId + '"></ni-cluster');
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-cluster[ni-control-id="' + controlId + '"]');
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
    // The ni-cluster doesn't have specific classes available

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of the element', function () {
        var targetStyle = window.getComputedStyle(element);
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});
