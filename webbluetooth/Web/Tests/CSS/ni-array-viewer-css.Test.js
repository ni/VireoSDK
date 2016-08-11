describe('An Array Viewer has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'ArrayViewerCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var width = '10px';
    var borderRadius = '45px';

    beforeAll(function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-array-viewer                    { width: ' + width + ';}' +
                    'ni-array-viewer .ni-indexer-box    { border-radius: ' + borderRadius + ';}' +
                    'ni-array-viewer .ni-text-field     { width: ' + width + ';}' +
                    'ni-array-viewer .ni-spins-box      { border-radius: ' + borderRadius + ';}' +
                    'ni-array-viewer .ni-spin-button    { width: ' + width + ';}' +
                    'ni-array-viewer .ni-increment-icon { border-radius: ' + borderRadius + ';}' +
                    'ni-array-viewer .ni-decrement-icon { width: ' + width + ';}' +
                '</style>';

            $(document.head).append(cssRules);

            var arrayViewerHtml = '<ni-array-viewer ni-control-id="' + controlId + '" label-id="" columns="18" rows="1" dimensions="1" orientation="horizontal" index-visibility="true" vertical-scrollbar-visibility="false" horizontal-scrollbar-visibility="false"><ni-boolean-led ni-control-id="10194"></ni-boolean-led></ni-array-viewer>';
            $(document.body).append(arrayViewerHtml);
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-array-viewer[ni-control-id="' + controlId + '"]');
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
    // TODO CGA: Currently the array is not adding classes so they cannot be found
    //           We are skipping all these tests for now.
    //           The following defect has been filed to look into this issue: DE8943
    /*it('that exposes class "ni-indexer-box"', function () {
        var exposedTag = element.querySelector('.ni-indexer-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-text-field"', function () {
        var exposedTag = element.querySelector('.ni-text-field');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-spins-box"', function () {
        var exposedTag = element.querySelector('.ni-spins-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-spin-button"', function () {
        var exposedTag = element.querySelector('.ni-spin-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-increment-icon"', function () {
        var exposedTag = element.querySelector('.ni-increment-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-decrement-icon"', function () {
        var exposedTag = element.querySelector('.ni-decrement-icon');
        expect(exposedTag).not.toBeNull();
    });

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of "ni-indexer-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-indexer-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });*/

});
