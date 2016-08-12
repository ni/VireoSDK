describe('A Graph Tools has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, divElement, controlId = 'GraphToolsCSSId', graphId = 'GraphToolsGraphCSSId', divId = 'GraphToolsDivId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderRadius = '46px';
    var marginLeft = '2px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-cartesian-graph[ni-control-id="' + graphId + '"] {left: 67px; top: 47px; width: 464px; height: 304px;}' +
                    'ni-graph-tools .ni-graph-tools-box            { border-radius: ' + borderRadius + '; }' +
                    'ni-graph-tools .ni-button-box                 { border-radius: ' + borderRadius + '; }' +
                    'ni-graph-tools .ni-button                     { border-radius: ' + borderRadius + '; }' +
                    'ni-graph-tools .ni-navigation-locked-button   { margin-left: ' + marginLeft + '; }' +
                    'ni-graph-tools .ni-navigation-pan-button      { margin-left: ' + marginLeft + '; }' +
                    'ni-graph-tools .ni-navigation-zoom-button     { margin-left: ' + marginLeft + '; }' +
                    'ni-graph-tools .ni-navigation-zoom-out-button { margin-left: ' + marginLeft + '; }' +
                '</style>';

            $(document.head).append(cssRules);
            var controlHtml = '<div id="' + divId + '"><ni-cartesian-graph data-ni-base-style="uninitialized" ni-control-id="' + graphId + '" label-id="" value="[]">' +
                        '<ni-cartesian-axis data-ni-base-style="uninitialized" ni-control-id="' + graphId + '1" axis-label="Time" show="true" show-label="true" axis-position="bottom" minimum="0" maximum="100" format="" auto-scale="true" log-scale="false"></ni-cartesian-axis>' +
                        '<ni-cartesian-axis data-ni-base-style="uninitialized" ni-control-id="' + graphId + '2" axis-label="Amplitude" show="true" show-label="true" axis-position="left" minimum="0" maximum="10" format="" auto-scale="true" log-scale="false"></ni-cartesian-axis>' +
                        '<ni-cartesian-plot data-ni-base-style="uninitialized" ni-control-id="' + graphId + '3" xaxis="' + graphId + '1" yaxis="' + graphId + '2" enable-hover="false" hover-format="{0}, {1}">' +
                            '<ni-cartesian-plot-renderer data-ni-base-style="uninitialized" ni-control-id="' + graphId + '4" line-width="1" line-stroke="#1F8AAD" line-style="solid" point-color="" area-fill="" area-base-line="negativeinfinity" bar-fill="" point-size="7.0710678118654755" point-shape="ellipse"></ni-cartesian-plot-renderer>' +
                        '</ni-cartesian-plot>' +
                    '</ni-cartesian-graph>' +
                    '<ni-plot-legend data-ni-base-style="uninitialized" ni-control-id="' + graphId + '5" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-plot-legend>' +
                    '<ni-cursor-legend data-ni-base-style="uninitialized" ni-control-id="' + graphId + '6" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-cursor-legend>' +
                    '<ni-scale-legend data-ni-base-style="uninitialized" ni-control-id="' + graphId + '7" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-scale-legend>' +
                    '<ni-graph-tools data-ni-base-style="uninitialized" ni-control-id="' + controlId + '" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-graph-tools></div>';
            $(document.body).append(controlHtml);

            testHelpers.runAsync(done, function () {
                divElement = document.querySelector('div[id="' + divId + '"]');
                element = document.querySelector('ni-graph-tools[ni-control-id="' + controlId + '"]');
            });
        });

    });

    afterAll(function (done) {
        divElement.remove();
        webAppHelper.removeWebAppFixture(done);
    });

    // ----------------------------------
    // Verify classes are available
    // ----------------------------------
    it('that exposes class "ni-graph-tools-box"', function () {
        var exposedTag = element.querySelector('.ni-graph-tools-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-button-box"', function () {
        var exposedTag = element.querySelector('.ni-button-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-button"', function () {
        var exposedTag = element.querySelector('.ni-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-navigation-locked-button"', function () {
        var exposedTag = element.querySelector('.ni-navigation-locked-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-navigation-pan-button"', function () {
        var exposedTag = element.querySelector('.ni-navigation-pan-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-navigation-zoom-button"', function () {
        var exposedTag = element.querySelector('.ni-navigation-zoom-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-navigation-zoom-out-button"', function () {
        var exposedTag = element.querySelector('.ni-navigation-zoom-out-button');
        expect(exposedTag).not.toBeNull();
    });

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of the "ni-graph-tools-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-graph-tools-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-button-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-button-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the margin-left of the "ni-navigation-locked-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-navigation-locked-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
        expect(targetStyle.marginLeft).toEqual(marginLeft);
    });

    it('that updates the margin-left of the "ni-navigation-pan-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-navigation-pan-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
        expect(targetStyle.marginLeft).toEqual(marginLeft);
    });

    it('that updates the margin-left of the "ni-navigation-zoom-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-navigation-zoom-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
        expect(targetStyle.marginLeft).toEqual(marginLeft);
    });

    it('that updates the margin-left of the "ni-navigation-zoom-out-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-navigation-zoom-out-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
        expect(targetStyle.marginLeft).toEqual(marginLeft);
    });

});
