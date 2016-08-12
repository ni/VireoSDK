describe('A Data Grid has a defined CSS API', function () {
    'use strict';

    var $ = NationalInstruments.Globals.jQuery;
    var element, controlId = 'DataGridCSSId', viModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();
    var borderRadius = '45px';

    beforeAll(function (done) {

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;

            var cssRules = '<style> ' +
                    'ni-data-grid .ni-groups-header            { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-add-rows-toolbar         { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-row-count-text-field-box { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-row-count-text-field     { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-pager-box                { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-pager-text-field         { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-filter-row-box           { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-status-bar               { border-radius: ' + borderRadius + ';}' +
                    'ni-data-grid .ni-aggregate-box            { border-radius: ' + borderRadius + ';}' +
                '</style>';

            $(document.head).append(cssRules);

            var dataGridHtml = '<ni-data-grid data-ni-base-style="uninitialized" ni-control-id="' + controlId + '" label-id="228" read-only="false" value="[]" column-header-visible="true" row-header-visible="true" show-add-rows-tool-bar="true" allow-sorting="true" allow-paging="true" allow-filtering="true" allow-grouping="true" row-height="40" alt-row-colors="true" alt-row-start="1" alt-row-step="1">' +
                        '<ni-data-grid-column data-ni-base-style="uninitialized" ni-control-id="1226" index="0" header="Strings" width="120" field-name="Strings" pinned="false" aggregates="{}"><ni-string-control data-ni-base-style="uninitialized" ni-control-id="10227" text="" read-only="false" accepts-return="false" type-to-replace="false"></ni-string-control></ni-data-grid-column>' +
                    '</ni-data-grid>';

            $(document.body).append(dataGridHtml);
            testHelpers.runAsync(done, function () {
                element = document.querySelector('ni-data-grid[ni-control-id="' + controlId + '"]');
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
    it('that exposes class "ni-groups-header"', function () {
        var exposedTag = element.querySelector('.ni-groups-header');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-add-rows-toolbar"', function () {
        var exposedTag = element.querySelector('.ni-add-rows-toolbar');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-row-count-text-field-box"', function () {
        var exposedTag = element.querySelector('.ni-row-count-text-field-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-row-count-text-field"', function () {
        var exposedTag = element.querySelector('.ni-row-count-text-field');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-pager-box"', function () {
        var exposedTag = element.querySelector('.ni-pager-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-pager-text-field"', function () {
        var exposedTag = element.querySelector('.ni-pager-text-field');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-filter-row-box"', function () {
        var exposedTag = element.querySelector('.ni-filter-row-box');
        expect(exposedTag).not.toBeNull();
    });

    it('that exposes class "ni-status-bar"', function () {
        var exposedTag = element.querySelector('.ni-status-bar');
        expect(exposedTag).not.toBeNull();
    });

    // Aggregate box not available on first creation?
    // Defect: DE8948
    /*it('that exposes class "ni-aggregate-box"', function () {
        var exposedTag = element.querySelector('.ni-aggregate-box');
        expect(exposedTag).not.toBeNull();
    });*/

    // ----------------------------------
    // Verify CSS properties were updated
    // ----------------------------------
    it('that updates the border-radius of "ni-groups-header"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-groups-header'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-add-rows-toolbar"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-add-rows-toolbar'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-row-count-text-field-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-row-count-text-field-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-row-count-text-field"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-row-count-text-field'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-pager-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-pager-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-pager-text-field"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-pager-text-field'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-filter-row-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-filter-row-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    it('that updates the border-radius of "ni-status-bar"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-status-bar'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });

    // Aggregate box not available on first creation?
    // Defect: DE8948
    /*it('that updates the border-radius of "ni-aggregate-box"', function () {
        var targetStyle = window.getComputedStyle(element.querySelector('.ni-aggregate-box'));
        expect(targetStyle.borderRadius).toEqual(borderRadius);
    });*/

});
