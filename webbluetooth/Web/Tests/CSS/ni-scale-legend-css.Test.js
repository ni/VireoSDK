describe('A Scale Legend has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, divElement, controlId = 'ScaleLegendCSSId', graphId = 'ScaleLegendGraphCSSId', divId = 'ScaleLegendDivId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderRadius = '46px';
    var marginLeft = '2px';

    beforeAll (function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-cartesian-graph[ni-control-id="' + graphId + '"] {left: 67px; top: 47px; width: 464px; height: 304px;}' +
                    'ni-scale-legend .ni-scale-legend-box { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-row-title-box    { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-row-title        { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-lock-box         { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-scaleonce-box    { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-button           { margin-left: ' + marginLeft + '; }' +
                    'ni-scale-legend .ni-lock-button      { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-unlocked-icon    { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-locked-icon      { border-radius: ' + borderRadius + '; }' +
                    'ni-scale-legend .ni-scaleonce-button { border-radius: ' + borderRadius + '; }' +
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
                    '<ni-scale-legend data-ni-base-style="uninitialized" ni-control-id="' + controlId + '" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-scale-legend>' +
                    '<ni-graph-tools data-ni-base-style="uninitialized" ni-control-id="' + graphId + '8" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-graph-tools></div>';
            $(document.body).append(controlHtml);
            testHelpers.runAsync(done, function () {
                divElement = document.querySelector('div[id="' + divId + '"]');
                element = document.querySelector('ni-scale-legend[ni-control-id="' + controlId + '"]');
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
    it('that exposes class "ni-scale-legend-box"', function () {
        var exposedTag = element.querySelector('.ni-scale-legend-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-row-title-box"', function () {
        var exposedTag = element.querySelector('.ni-row-title-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-row-title"', function () {
        var exposedTag = element.querySelector('.ni-row-title');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-lock-box"', function () {
        var exposedTag = element.querySelector('.ni-lock-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-scaleonce-box"', function () {
        var exposedTag = element.querySelector('.ni-scaleonce-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-button"', function () {
        var exposedTag = element.querySelector('.ni-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-lock-button"', function () {
        var exposedTag = element.querySelector('.ni-lock-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-unlocked-icon"', function () {
        var exposedTag = element.querySelector('.ni-unlocked-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-locked-icon"', function () {
        var exposedTag = element.querySelector('.ni-locked-icon');
        expect(exposedTag).toBeNull(); // The default state is to be unlocked
    });

    it('that exposes class "ni-scaleonce-button"', function () {
        var exposedTag = element.querySelector('.ni-scaleonce-button');
        expect(exposedTag).not.toBeNull();
    });

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of the "ni-scale-legend-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-scale-legend-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-row-title-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-row-title-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-row-title-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-row-title-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-row-title"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-row-title'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-lock-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-lock-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-scaleonce-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-scaleonce-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the margin-left of the "ni-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-button'));
        expect(targetStyle.marginLeft).toEqual(marginLeft);
    });

    it('that updates the border-radius of the "ni-lock-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-lock-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-unlocked-icon"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-unlocked-icon'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-scaleonce-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-scaleonce-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

});
