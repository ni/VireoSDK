describe('A Plot Legend has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, divElement, controlId = 'PlotLegendCSSId', graphId = 'PlotLegendGraphCSSId', divId = 'PlotLegendDivId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderRadius = '46px';
    var marginLeft = '2px';
    var paddingLeft = '2px';

    beforeAll (function (done) {

        var otherDone = function () {
        }; // We need to ensure the expander has expanded before we can continue testing.

        webAppHelper.installWebAppFixture(otherDone, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-cartesian-graph[ni-control-id="' + graphId + '"] {left: 67px; top: 47px; width: 464px; height: 304px;}' +
                    'ni-plot-legend .ni-plot-legend-box                         { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-master-row                              { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-plot-display                            { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-plot-title                              { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-details-box                             { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-details                                 { margin-left: ' + marginLeft + '; }' +
                    'ni-plot-legend .ni-details-row                             { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-detail-row-title-box                    { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-details-row-operations-box              { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-button                                  { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-line-style-button                       { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-point-style-button                      { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-line-and-point-style-button             { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-bar-style-button                        { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-fill-style-button                       { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-ellipse-point-style-button              { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-rect-point-style-button                 { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-diamond-point-style-button              { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-cross-point-style-button                { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-plus-point-style-button                 { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-1-pixel-line-width-icon                 { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-2-pixels-line-width-icon                { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-3-pixels-line-width-icon                { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-4-pixels-line-width-icon                { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-5-pixels-line-width-icon                { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-solid-line-style-icon                   { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-dot-line-style-icon                     { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-dot-dash-line-style-icon                { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-medium-dash-line-style-icon             { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-large-dash-line-style-icon              { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-fill-base-line-none-button              { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-fill-to-zero-style-button               { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-fill-base-line-negative-infinity-button { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-fill-base-line-positive-infinity-button { padding-left: ' + paddingLeft + '; }' +
                    'ni-plot-legend .ni-selector                                { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-selector-title                          { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-selector-icon                           { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-colorbox-content                        { border-radius: ' + borderRadius + '; }' +
                    'ni-plot-legend .ni-colorbox-selector                       { border-radius: ' + borderRadius + '; }' +
                '</style>';

            $(document.head).append(cssRules);

            var controlHtml = '<div id="' + divId + '"><ni-cartesian-graph data-ni-base-style="uninitialized" ni-control-id="' + graphId + '" label-id="" value="[]">' +
                        '<ni-cartesian-axis data-ni-base-style="uninitialized" ni-control-id="' + graphId + '1" axis-label="Time" show="true" show-label="true" axis-position="bottom" minimum="0" maximum="100" format="" auto-scale="true" log-scale="false"></ni-cartesian-axis>' +
                        '<ni-cartesian-axis data-ni-base-style="uninitialized" ni-control-id="' + graphId + '2" axis-label="Amplitude" show="true" show-label="true" axis-position="left" minimum="0" maximum="10" format="" auto-scale="true" log-scale="false"></ni-cartesian-axis>' +
                        '<ni-cartesian-plot data-ni-base-style="uninitialized" ni-control-id="' + graphId + '3" xaxis="' + graphId + '1" yaxis="' + graphId + '2" enable-hover="false" hover-format="{0}, {1}">' +
                            '<ni-cartesian-plot-renderer data-ni-base-style="uninitialized" ni-control-id="' + graphId + '4" line-width="1" line-stroke="#1F8AAD" line-style="solid" point-color="" area-fill="" area-base-line="negativeinfinity" bar-fill="" point-size="7.0710678118654755" point-shape="ellipse"></ni-cartesian-plot-renderer>' +
                        '</ni-cartesian-plot>' +
                    '</ni-cartesian-graph>' +
                    '<ni-plot-legend data-ni-base-style="uninitialized" ni-control-id="' + controlId + '" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-plot-legend>' +
                    '<ni-cursor-legend data-ni-base-style="uninitialized" ni-control-id="' + graphId + '6" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-cursor-legend>' +
                    '<ni-scale-legend data-ni-base-style="uninitialized" ni-control-id="' + graphId + '7" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-scale-legend>' +
                    '<ni-graph-tools data-ni-base-style="uninitialized" ni-control-id="' + graphId + '8" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-graph-tools></div>';
            $(document.body).append(controlHtml);
            window.requestAnimationFrame(function () {
                divElement = document.querySelector('div[id="' + divId + '"]');
                element = document.querySelector('ni-plot-legend[ni-control-id="' + controlId + '"]');
                var expander = document.querySelector('ni-plot-legend[ni-control-id="' + controlId + '"] .ni-plot-legend-box');
                $(expander).jqxExpander('expand');
                window.requestAnimationFrame (function waitingForUpdate() {
                    var exposedTag = element.querySelector('.ni-details');
                    if (exposedTag !== null) {
                        done();
                    } else {
                        window.requestAnimationFrame(waitingForUpdate);
                    }
                });
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
    it('that exposes class "ni-plot-legend-box"', function () {
        var exposedTag = element.querySelector('.ni-plot-legend-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-master-row"', function () {
        var exposedTag = element.querySelector('.ni-master-row');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-plot-display"', function () {
        var exposedTag = element.querySelector('.ni-plot-display');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-plot-title"', function () {
        var exposedTag = element.querySelector('.ni-plot-title');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-details-box"', function () {
        var exposedTag = element.querySelector('.ni-details-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-details"', function () {
        var exposedTag = element.querySelector('.ni-details');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-details-row"', function () {
        var exposedTag = element.querySelector('.ni-details-row');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-detail-row-title-box"', function () {
        var exposedTag = element.querySelector('.ni-detail-row-title-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-details-row-operations-box"', function () {
        var exposedTag = element.querySelector('.ni-details-row-operations-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-button"', function () {
        var exposedTag = element.querySelector('.ni-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-line-style-button"', function () {
        var exposedTag = element.querySelector('.ni-line-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-point-style-button"', function () {
        var exposedTag = element.querySelector('.ni-point-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-line-and-point-style-button"', function () {
        var exposedTag = element.querySelector('.ni-line-and-point-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-bar-style-button"', function () {
        var exposedTag = element.querySelector('.ni-bar-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-fill-style-button"', function () {
        var exposedTag = element.querySelector('.ni-fill-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-ellipse-point-style-button"', function () {
        var exposedTag = element.querySelector('.ni-ellipse-point-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-rect-point-style-button"', function () {
        var exposedTag = element.querySelector('.ni-rect-point-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-diamond-point-style-button"', function () {
        var exposedTag = element.querySelector('.ni-diamond-point-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-cross-point-style-button"', function () {
        var exposedTag = element.querySelector('.ni-cross-point-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-plus-point-style-button"', function () {
        var exposedTag = element.querySelector('.ni-plus-point-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-1-pixel-line-width-icon"', function () {
        var exposedTag = element.querySelector('.ni-1-pixel-line-width-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-2-pixels-line-width-icon"', function () {
        var exposedTag = element.querySelector('.ni-2-pixel-line-width-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-3-pixel-line-width-icon"', function () {
        var exposedTag = element.querySelector('.ni-3-pixel-line-width-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-4-pixel-line-width-icon"', function () {
        var exposedTag = element.querySelector('.ni-4-pixel-line-width-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-5-pixel-line-width-icon"', function () {
        var exposedTag = element.querySelector('.ni-5-pixel-line-width-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-solid-line-style-icon"', function () {
        var exposedTag = element.querySelector('.ni-solid-line-style-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-dot-line-style-icon"', function () {
        var exposedTag = element.querySelector('.ni-dot-line-style-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-dot-dash-line-style-icon"', function () {
        var exposedTag = element.querySelector('.ni-dot-dash-line-style-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-medium-dash-line-style-icon"', function () {
        var exposedTag = element.querySelector('.ni-medium-dash-line-style-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-large-dash-line-style-icon"', function () {
        var exposedTag = element.querySelector('.ni-large-dash-line-style-icon');
        expect(exposedTag).toBeNull(); // Icon is not present in the selector
    });

    it('that exposes class "ni-fill-base-line-none-button"', function () {
        var exposedTag = element.querySelector('.ni-fill-base-line-none-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class ni-fill-to-zero-style-button"', function () {
        var exposedTag = element.querySelector('.ni-fill-to-zero-style-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-fill-base-line-negative-infinity-button"', function () {
        var exposedTag = element.querySelector('.ni-fill-base-line-negative-infinity-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-fill-base-line-positive-infinity-button"', function () {
        var exposedTag = element.querySelector('.ni-fill-base-line-positive-infinity-button');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-selector-title"', function () {
        var exposedTag = element.querySelector('.ni-selector-title');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-selector-icon"', function () {
        var exposedTag = element.querySelector('.ni-selector-icon');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-colorbox-content"', function () {
        var exposedTag = element.querySelector('.ni-colorbox-content');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-colorbox-selector"', function () {
        var exposedTag = element.querySelector('.ni-colorbox-selector');
        expect(exposedTag).not.toBeNull();
    });

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of the "ni-plot-legend-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-plot-legend-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-master-row"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-master-row'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-plot-display"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-plot-display'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-plot-title"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-plot-title'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-details-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the margin-left of the "ni-details"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-details'));
        expect(targetStyle.marginLeft).toEqual(marginLeft);
    });

    it('that updates the border-radius of the "ni-details-row"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-row'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-detail-row-title-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-detail-row-title-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-details-row-operations-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-row-operations-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-button'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the padding-left of the "ni-line-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-line-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-point-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-point-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-line-and-point-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-line-and-point-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-bar-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-bar-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-fill-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-fill-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-ellipse-point-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-ellipse-point-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-rect-point-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-rect-point-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-diamond-point-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-diamond-point-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-cross-point-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-cross-point-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-plus-point-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-plus-point-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the border-radius of the "ni-1-pixel-line-width-icon"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-1-pixel-line-width-icon'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-solid-line-style-icon"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-solid-line-style-icon'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the padding-left of the "ni-fill-base-line-none-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-fill-base-line-none-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-fill-to-zero-style-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-fill-to-zero-style-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-fill-base-line-negative-infinity-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-fill-base-line-negative-infinity-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the padding-left of the "ni-fill-base-line-positive-infinity-button"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-fill-base-line-positive-infinity-button'));
        expect(targetStyle.paddingLeft).toEqual(paddingLeft);
    });

    it('that updates the border-radius of the "ni-selector"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-selector'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-selector-title"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-selector-title'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-selector-icon"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-selector-icon'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-colorbox-content"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-colorbox-content'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of the "ni-colorbox-selector"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-colorbox-selector'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });
});

