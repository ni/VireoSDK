/*globals xit*/
describe('A Cursor Legend has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'CursorLegendId123123', viModel;
    var divContainer;
    var elementName = 'ni-cursor-legend';
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var graphId = 'graph1';
    var controlHtml = '<ni-cartesian-graph data-ni-base-style="uninitialized" ni-control-id="' + graphId + '" label-id="" value="[]">' +
                       '<ni-cartesian-axis data-ni-base-style="uninitialized" ni-control-id="16700" axis-label="Time" show="true" show-label="true" axis-position="bottom" minimum="0" maximum="100" format="" auto-scale="true" log-scale="false"></ni-cartesian-axis>' +
                       '<ni-cartesian-axis data-ni-base-style="uninitialized" ni-control-id="16800" axis-label="Amplitude" show="true" show-label="true" axis-position="left" minimum="0" maximum="10" format="" auto-scale="true" log-scale="false"></ni-cartesian-axis>' +
                       '<ni-cartesian-plot data-ni-base-style="uninitialized" ni-control-id="16900" xaxis="16700" yaxis="16800" enable-hover="false" hover-format="{0}, {1}">' +
                           '<ni-cartesian-plot-renderer data-ni-base-style="uninitialized" ni-control-id="17000" line-width="1" line-stroke="#1F8AAD " line-style="solid" point-color="" area-fill="" area-base-line="negativeinfinity" bar-fill="" point-size="7.0710678118654755" point-shape="ellipse"></ni-cartesian-plot-renderer>' +
                       '</ni-cartesian-plot>' +
                    '</ni-cartesian-graph>' +
                    '<ni-plot-legend data-ni-base-style="uninitialized" ni-control-id="17100" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-plot-legend>' +
                    '<ni-cursor-legend data-ni-base-style="uninitialized" ni-control-id="' + controlId + '" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-cursor-legend>' +
                    '<ni-scale-legend data-ni-base-style="uninitialized" ni-control-id="17300" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-scale-legend>' +
                    '<ni-graph-tools data-ni-base-style="uninitialized" ni-control-id="17400" binding-info="{"prop":"value","sync":false}" label-id="" graph-name="' + graphId + '"></ni-graph-tools>';
    var cssSheetId = 'niCursorLegendCSSId';
    var cssRules =
            '<style id="' + cssSheetId + '">' +
                'ni-cartesian-graph {' +
                    'width: 400px;' +
                    'height: 400px;' +
                '}' +

                elementName + ' {' +
                    'background-color: rgb(100, 128, 255);' +
                    'border-radius: 25px;' +
                '}' +

                /* Commands section */
                elementName + ' .ni-command-button {' +
                    'background-repeat: no-repeat;' +
                '}' +

                elementName + ' .ni-delete-button {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-add-button {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-center-button {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                /* Master/Detail section */
                elementName + ' .ni-cursor-box {' +
                    'border-collapse: collapse;' +
                '}' +

                /* Master section */
                elementName + ' .ni-master-row {' +
                    'border: 3px solid #e9f7fb;' +
                    'border-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-master-row {' +
                    'border: 3px solid #e9f7fb;' +
                    'border-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-selected-row {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-expand-box {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-expand-button {' +
                    'width: 20px;' +
                    'height: 20px;' +
                    'margin: 2px;' +
                    'background-color: rgba(0, 0, 0, 0);' +
                    'border: 0;' +
                '}' +

                elementName + ' .ni-open-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-closed-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-cursor-box {' +
                    'border-right: 0;' +
                    'border-left: 0;' +
                '}' +

                elementName + ' .ni-cursor-display {' +
                    'border: 1px solid black;' +
                    'background-color: white;' +
                '}' +

                elementName + ' .ni-cursor-title {' +
                    'margin-left: 4px;' +
                '}' +

                elementName + ' .ni-x-box {' +
                    'border-right: 0;' +
                    'border-left: 0;' +
                '}' +

                elementName + ' .ni-y-box {' +
                    'border-right: 0;' +
                    'border-left: 0;' +
                '}' +

                elementName + ' .ni-actions-box {' +
                    'border-right: 0;' +
                    'border-left: 0;' +
                '}' +

                elementName + ' .ni-action-button {' +
                    'width: 20px;' +
                    'height: 20px;' +
                    'margin: 2px;' +
                    'background-repeat: no-repeat;' +
                    'background-position: center;' +
                '}' +

                elementName + ' .ni-visibility-on-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-visibility-off-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-snap-button {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                /* Detail section */
                elementName + ' .ni-details-box {' +
                    'display: table-row;' +
                    'border: 3px solid rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-details {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-details-row {' +
                    'margin-top: 2px;' +
                    'margin-bottom: 2px;' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-details-row-title-box {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-details-row-title {' +
                    'margin-left: 2px;' +
                '}' +

                elementName + ' .ni-details-row-control-box {' +
                    'padding: 1px;' +
                '}' +

                elementName + ' .ni-colorbox-content {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-selector {' +
                    'background-color: rgb(100, 128, 255);' +
                    'border: 1px solid #229bc3;' +
                '}' +

                elementName + ' .ni-selector-title {' +
                    'font-size: 20px;' +
                '}' +

                elementName + ' .ni-selector-icon {' +
                    'width: 80px;' +
                    'height: 16px;' +
                    'display: inline-block;' +
                    'background-color: rgb(100, 128, 255);' +
                    'float: right;' +
                '}' +

                elementName + ' .ni-ellipse-point-style-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-rect-point-style-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-diamond-point-style-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-cross-point-style-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-plus-point-style-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-no-crosshair-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-vertical-crosshair-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-horizontal-crosshair-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +

                elementName + ' .ni-both-crosshair-icon {' +
                    'background-color: rgb(100, 128, 255);' +
                '}' +
            '</style>';

    beforeAll(function (done) {
        var intDone = function () {
            testHelpers.runMultipleAsync(done, function () {
                element = document.querySelector(elementName + '[ni-control-id="' + controlId + '"]');
                element.helpers.addCursor();
            }, function () {
                // Left blank to give more time to create internals correctly before
                // testing
            });
        };

        webAppHelper.installWebAppFixture(intDone, function (newVIModel) {
            viModel = newVIModel;
            $(document.head).append(cssRules);
            divContainer = document.createElement('div');
            divContainer.innerHTML = controlHtml;
            $(document.body).append(divContainer);
        });

    });

    afterAll(function (done) {
        divContainer.remove();
        $(document.head).find('style[id="' + cssSheetId + '"]').remove();
        webAppHelper.removeWebAppFixture(done);
    });

    describe('with a Command section that', function () {

        it('exposes class "ni-command-button"', function () {
            var exposedTag = element.querySelector('.ni-command-button');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-command-button" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-command-button'));
            expect(targetStyle.backgroundRepeat).toEqual('no-repeat');
        });

        it('exposes class "ni-delete-button"', function () {
            var exposedTag = element.querySelector('.ni-delete-button');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-delete-button" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-delete-button'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-add-button"', function () {
            var exposedTag = element.querySelector('.ni-add-button');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-add-button" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-add-button'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-center-button"', function () {
            var exposedTag = element.querySelector('.ni-center-button');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-center-button" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-center-button'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

    });

    describe('with a Master section that', function () {

        it('exposes class "ni-master-row"', function () {
            var exposedTag = element.querySelector('.ni-master-row');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // WE either select different rules or solve conflicts.
        xit('updates "ni-master-row" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-master-row'));
            expect(targetStyle.borderColor).toEqual('rgb(100, 128, 255)');
            expect(targetStyle.borderWidth).toEqual('3px');
        });

        it('exposes class "ni-selected-row"', function () {
            var exposedTag = element.querySelector('.ni-selected-row');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // WE either select different rules or solve conflicts.
        xit('updates "ni-selected-row" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-selected-row'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-expand-box"', function () {
            var exposedTag = element.querySelector('.ni-expand-box');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-expand-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-expand-box'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-expand-button"', function () {
            var exposedTag = element.querySelector('.ni-expand-button');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // WE either select different rules or solve conflicts.
        xit('updates "ni-expand-button" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-expand-button'));
            expect(targetStyle.backgroundColor).toEqual('rgba(0, 0, 0, 0)');
        });

        // TODO: DE8926 Find a way to test this. Because it depends on user interaction
        // in order to be exposed.
        xit('exposes class "ni-open-icon"', function () {
            var exposedTag = element.querySelector('.ni-open-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-open-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-open-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-closed-icon"', function () {
            var exposedTag = element.querySelector('.ni-closed-icon');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // We either select different rules or solve conflicts.
        xit('updates "ni-closed-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-closed-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-cursor-box"', function () {
            var exposedTag = element.querySelector('.ni-cursor-box');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-cursor-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-cursor-box'));
            expect(targetStyle.borderRight).toEqual('0px none rgb(0, 0, 0)');
            expect(targetStyle.borderLeft).toEqual('0px none rgb(0, 0, 0)');
        });

        it('exposes class "ni-cursor-display"', function () {
            var exposedTag = element.querySelector('.ni-cursor-display');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-cursor-display" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-cursor-display'));
            expect(targetStyle.backgroundColor).toEqual('rgb(255, 255, 255)');
            expect(targetStyle.borderWidth).toEqual('1px');
        });

        it('exposes class "ni-cursor-title"', function () {
            var exposedTag = element.querySelector('.ni-cursor-title');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-cursor-title" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-cursor-title'));
            expect(targetStyle.marginLeft).toEqual('4px');
        });

        it('exposes class "ni-x-box"', function () {
            var exposedTag = element.querySelector('.ni-x-box');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-x-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-x-box'));
            expect(targetStyle.borderRight).toEqual('0px none rgb(0, 0, 0)');
            expect(targetStyle.borderLeft).toEqual('0px none rgb(0, 0, 0)');
        });

        it('exposes class "ni-x-title"', function () {
            var exposedTag = element.querySelector('.ni-x-title');
            expect(exposedTag).not.toBeNull();
        });

        it('exposes class "ni-y-box"', function () {
            var exposedTag = element.querySelector('.ni-y-box');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-y-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-y-box'));
            expect(targetStyle.borderRight).toEqual('0px none rgb(0, 0, 0)');
            expect(targetStyle.borderLeft).toEqual('0px none rgb(0, 0, 0)');
        });

        it('exposes class "ni-y-title"', function () {
            var exposedTag = element.querySelector('.ni-y-title');
            expect(exposedTag).not.toBeNull();
        });

        it('exposes class "ni-actions-box"', function () {
            var exposedTag = element.querySelector('.ni-actions-box');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-actions-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-actions-box'));
            expect(targetStyle.borderRight).toEqual('0px none rgb(0, 0, 0)');
            expect(targetStyle.borderLeft).toEqual('0px none rgb(0, 0, 0)');
        });

        it('exposes class "ni-action-button"', function () {
            var exposedTag = element.querySelector('.ni-action-button');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-action-button" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-action-button'));
            expect(targetStyle.backgroundRepeat).toEqual('no-repeat');
            expect(targetStyle.margin).toEqual('2px');
        });

        it('exposes class "ni-visibility-button"', function () {
            var exposedTag = element.querySelector('.ni-visibility-button');
            expect(exposedTag).not.toBeNull();
        });

        it('exposes class "ni-visibility-off-icon"', function () {
            var exposedTag = element.querySelector('.ni-visibility-off-icon');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-visibility-off-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-visibility-off-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-visibility-on-icon"', function () {
            var exposedTag = element.querySelector('.ni-visibility-on-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-visibility-on-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-visibility-on-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-snap-button"', function () {
            var exposedTag = element.querySelector('.ni-snap-button');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-snap-button" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-snap-button'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });
    });

    describe('with a Detail section that', function () {

        it('exposes class "ni-details-box"', function () {
            var exposedTag = element.querySelector('.ni-details-box');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // We either select different rules or solve conflicts.
        xit('updates "ni-details-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-box'));
            expect(targetStyle.border).toEqual('3px solid rgb(100, 128, 255)');
        });

        it('exposes class "ni-details"', function () {
            var exposedTag = element.querySelector('.ni-details');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // We either select different rules or solve conflicts.
        xit('updates "ni-details" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-details'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-details-row"', function () {
            var exposedTag = element.querySelector('.ni-details-row');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // We either select different rules or solve conflicts.
        xit('updates "ni-details-row" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-row'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
            expect(targetStyle.marginTop).toEqual('2px');
            expect(targetStyle.marginBottom).toEqual('2px');
        });

        it('exposes class "ni-details-row-title-box"', function () {
            var exposedTag = element.querySelector('.ni-details-row-title-box');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-details-row-title-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-row-title-box'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-details-row-title"', function () {
            var exposedTag = element.querySelector('.ni-details-row-title');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 Find a way to test this.
        xit('updates "ni-details-row-title" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-row-title'));
            expect(targetStyle.marginLeft).toEqual('2px');
        });

        it('exposes class "ni-details-row-control-box"', function () {
            var exposedTag = element.querySelector('.ni-details-row-control-box');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-details-row-control-box" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-details-row-control-box'));
            expect(targetStyle.padding).toEqual('1px');
        });

        it('exposes class "ni-colorbox-content"', function () {
            var exposedTag = element.querySelector('.ni-colorbox-content');
            expect(exposedTag).not.toBeNull();
        });

        // TODO: DE8926 maybe for the selected properties there are other rules conflicting.
        // We either select different rules or solve conflicts.
        xit('updates "ni-colorbox-content" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-colorbox-content'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-selector"', function () {
            var exposedTag = element.querySelector('.ni-selector');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-selector" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-selector'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-selector-title"', function () {
            var exposedTag = element.querySelector('.ni-selector-title');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-selector-title" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-selector-title'));
            expect(targetStyle.fontSize).toEqual('20px');
        });

        it('exposes class "ni-selector-icon"', function () {
            var exposedTag = element.querySelector('.ni-selector-icon');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-selector-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-selector-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-ellipse-point-style-icon"', function () {
            var exposedTag = element.querySelector('.ni-ellipse-point-style-icon');
            expect(exposedTag).not.toBeNull();
        });

        it('updates "ni-ellipse-point-style-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-ellipse-point-style-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-rect-point-style-icon"', function () {
            var exposedTag = element.querySelector('.ni-rect-point-style-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-rect-point-style-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-rect-point-style-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-diamond-point-style-icon"', function () {
            var exposedTag = element.querySelector('.ni-diamond-point-style-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-diamond-point-style-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-diamond-point-style-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-cross-point-style-icon"', function () {
            var exposedTag = element.querySelector('.ni-cross-point-style-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-cross-point-style-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-cross-point-style-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-plus-point-style-icon"', function () {
            var exposedTag = element.querySelector('.ni-plus-point-style-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-plus-point-style-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-plus-point-style-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-no-crosshair-icon"', function () {
            var exposedTag = element.querySelector('.ni-no-crosshair-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-no-crosshair-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-no-crosshair-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-vertical-crosshair-icon"', function () {
            var exposedTag = element.querySelector('.ni-vertical-crosshair-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-vertical-crosshair-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-vertical-crosshair-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        // TODO: DE8926 Find a way to test this.
        xit('exposes class "ni-horizontal-crosshair-icon"', function () {
            var exposedTag = element.querySelector('.ni-horizontal-crosshair-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-horizontal-crosshair-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-horizontal-crosshair-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

        it('exposes class "ni-both-crosshair-icon"', function () {
            var exposedTag = element.querySelector('.ni-both-crosshair-icon');
            expect(exposedTag).not.toBeNull();
        });

        xit('updates "ni-both-crosshair-icon" properties', function () {
            var targetStyle = window.getComputedStyle(element.querySelector('.ni-both-crosshair-icon'));
            expect(targetStyle.backgroundColor).toEqual('rgb(100, 128, 255)');
        });

    });
});
