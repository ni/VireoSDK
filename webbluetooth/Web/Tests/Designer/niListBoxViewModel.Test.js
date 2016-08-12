//****************************************
// Tests for ListBoxViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A ListBoxViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'ListBoxViewModelId';

    var viModel, frontPanelControls, controlModel, controlElement, settings, zeroOrOneSettings, multiSelectSettings, updateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.ListBoxModel.MODEL_KIND,
            visible: true,
            readOnly: false,
            selectedIndex: -1,
            selectionMode: 'One',
            source: ['alpha', 'beta', 'charlie'],
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };

        zeroOrOneSettings = $.extend(true, {}, settings);
        zeroOrOneSettings.selectionMode = 'ZeroOrOne';
        zeroOrOneSettings.selectedIndex = 1;

        multiSelectSettings = $.extend(true, {}, settings);
        multiSelectSettings.selectionMode = 'OneOrMore';
        multiSelectSettings.selectedIndex = [];

        updateSettings = {
            selectionMode: 'ZeroOrMore',
            selectedIndex: [1, 2],
            source: ['zero', 'one', 'two']
        };

        Object.freeze(settings);
        Object.freeze(updateSettings);
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page', function (done) {
        $(document.body).append('<ni-list-box ni-control-id="' + controlId + '"></ni-list-box>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('exists after the custom element is created', function () {
        var viewModel;

        beforeEach(function (done) {
            webAppHelper.createNIElement(settings);
            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                controlElement = viewModel.element;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.selectionMode).toEqual(settings.selectionMode);
            expect(controlModel.selectedIndex).toEqual(settings.selectedIndex);
            expect(controlModel.source).toEqual(settings.source);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);
            testHelpers.runAsync(done, function () {
                expect(controlModel.selectionMode).toEqual(updateSettings.selectionMode);
                expect(controlModel.selectedIndex).toEqual(updateSettings.selectedIndex);
                expect(controlModel.source).toEqual(updateSettings.source);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };
            webAppHelper.dispatchMessage(controlId, unknownSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.selectionMode).toEqual(settings.selectionMode);
                expect(controlModel.selectedIndex).toEqual(settings.selectedIndex);
                expect(controlModel.source).toEqual(settings.source);
            });
        });
    });

    it('responds to the jqx change event, and does nothing if the selection does not change.', function (done) {
        controlElement = webAppHelper.createNIElement(settings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).trigger($.Event('change', {
                args: { }
            }));

            expect(controlModel.selectedIndex).toEqual(-1);
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('responds to the jqx selectIndex method and sets the new selected index (selectionMode One).', function (done) {
        controlElement = webAppHelper.createNIElement(settings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).jqxListBox('selectIndex', 2);

            expect(controlModel.selectedIndex).toEqual(2);
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('responds to the jqx selectIndex method and reverts invalid selections (selectionMode One).', function (done) {
        controlElement = webAppHelper.createNIElement(settings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            // Normally if selectionMode = 'One', the jqx listbox is not in multi-select mode, so we can't set multiple selected indices.
            // We're overriding that here just so we can get more code coverage, and verify that even if the control was in multi select
            // mode, our listbox custom element would override that to keep the selected indices valid.
            $(internalControl).jqxListBox('multipleextended', true);
            $(internalControl).jqxListBox('selectIndex', 2);
            $(internalControl).jqxListBox('selectIndex', 1);

            expect(controlModel.selectedIndex).toEqual(1);

            $(internalControl).jqxListBox('clearSelection');
            expect(controlModel.selectedIndex).toEqual(1);

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('responds to the jqx selectIndex method and sets the new selected index (selectionMode ZeroOrOne).', function (done) {
        controlElement = webAppHelper.createNIElement(zeroOrOneSettings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).jqxListBox('selectIndex', 0);

            expect(controlModel.selectedIndex).toEqual(0);
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('responds to the jqx selectIndex method and and reverts invalid selections (selectionMode ZeroOrOne).', function (done) {
        controlElement = webAppHelper.createNIElement(zeroOrOneSettings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).jqxListBox('selectIndex', 1);
            $(internalControl).jqxListBox('selectIndex', 2);

            expect(controlModel.selectedIndex).toEqual(2);
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('responds to the jqx selectIndex method and sets the new selected index (multiple selection).', function (done) {
        controlElement = webAppHelper.createNIElement(multiSelectSettings);
        testHelpers.runAsync(done, function () {
            var internalControl = controlElement.firstElementChild;
            frontPanelControls = viModel.getAllControlModels();
            controlModel = frontPanelControls[controlId];
            $(internalControl).jqxListBox('selectIndex', 1);
            $(internalControl).jqxListBox('selectIndex', 2);

            expect(controlModel.selectedIndex).toEqual([1, 2]);

            $(internalControl).jqxListBox('unselectIndex', 1);
            $(internalControl).jqxListBox('unselectIndex', 2);
            expect(controlModel.selectedIndex).toEqual([2]);

            webAppHelper.removeNIElement(controlId);
        });
    });
});
