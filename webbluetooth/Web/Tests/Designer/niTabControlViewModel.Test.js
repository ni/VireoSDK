//****************************************
// Tests for TabControlViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A TabControlViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var viModel, frontPanelControls, controlModel, controlElement;
    var settings, updateSettings,
        settingsTab0, updateSettingsTab0,
        settingsTab1, updateSettingsTab1;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: 'FunctionTabControl0',
            kind: NationalInstruments.HtmlVI.Models.TabControlModel.MODEL_KIND,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            tabStripPlacement: 'Top',
            selectedIndex: 0
        };
        updateSettings = {
            tabStripPlacement: 'Right',
            selectedIndex: 1,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };

        settingsTab0 = {
            niControlId: 'FunctionTab0',
            kind: NationalInstruments.HtmlVI.Models.TabItemModel.MODEL_KIND,
            header: 'Banana for Scale',
            tabPosition: 0
        };
        updateSettingsTab0 = {
            header: 'Apples for Sale',
            tabPosition: 1
        };

        settingsTab1 = {
            niControlId: 'FunctionTab1',
            kind: NationalInstruments.HtmlVI.Models.TabItemModel.MODEL_KIND,
            header: 'Grumpy Cat Dislikes',
            tabPosition: 1
        };
        updateSettingsTab1 = {
            header: 'Oh You!',
            tabPosition: 0
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-tab-control ni-control-id="' + settings.niControlId + '"></ni-tab-control>');

        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('allows elements to be added directly to the page via DOM functions', function (done) {
        var tabControl, tabItem0;

        tabControl = document.createElement('ni-tab-control');
        tabControl.niControlId = settings.niControlId;

        tabItem0 = document.createElement('ni-tab-item');
        tabItem0.niControlId = settingsTab0.niControlId;
        tabItem0.tabPosition = settingsTab0.tabPosition;

        tabControl.appendChild(tabItem0);
        document.body.appendChild(tabControl);

        testHelpers.runAsync(done, function () {
            var viewModelTabControl = viModel.getControlViewModel(settings.niControlId),
                viewModelTabItem0 = viModel.getControlViewModel(settingsTab0.niControlId);
            expect(viewModelTabControl).toBeDefined();
            expect(viewModelTabItem0).toBeDefined();

            webAppHelper.removeNIElement(settings.niControlId);

        });
    });

    it('responds to a click to change tabs', function (done) {
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settingsTab0, settings.niControlId);
        webAppHelper.createNIElement(settingsTab1, settings.niControlId);

        testHelpers.runMultipleAsync(done, function () {
            var jqxTabToClick = $(viModel.getControlViewModel(settings.niControlId).element.querySelector('[ni-data-headers]').children[1]);
            jqxTabToClick.simulate('click');
        }, function () {
            expect(viModel.getControlModel(settings.niControlId).selectedIndex).toBe(1);
        }, function () {
            var jqxTabToClick = $(viModel.getControlViewModel(settings.niControlId).element.querySelector('[ni-data-headers]').children[0]);
            jqxTabToClick.simulate('click');
        }, function () {
            expect(viModel.getControlModel(settings.niControlId).selectedIndex).toBe(0);
        }, function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('allows elements to be added directly to the page via jQuery functions', function (done) {
        var str =   '<ni-tab-control ni-control-id="' + settings.niControlId + '">' +
                        '<div></div>' +
                        '<ni-tab-item ni-control-id="' + settingsTab0.niControlId + '" tab-position="' + settingsTab0.tabPosition + '" ></ni-tab-item>' +
                        '<ni-tab-item ni-control-id="' + settingsTab1.niControlId + '" tab-position="' + settingsTab1.tabPosition + '" ></ni-tab-item>' +
                    '</ni-tab-control>';

        $(document.body).append(str);

        testHelpers.runAsync(done, function () {
            expect(viModel.getControlModel(settings.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsTab0.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsTab1.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settings.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsTab0.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsTab1.niControlId)).toBeDefined();

            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('prints errors when duplicate and missing tab items occur', function (done) {
        var tabControl, tabItem0, tabItem1;

        tabControl = document.createElement('ni-tab-control');
        tabControl.niControlId = settings.niControlId;

        tabItem0 = document.createElement('ni-tab-item');
        tabItem0.niControlId = settingsTab0.niControlId;
        tabItem0.tabPosition = 1;

        tabItem1 = document.createElement('ni-tab-item');
        tabItem1.niControlId = settingsTab1.niControlId;
        tabItem1.tabPosition = 1;

        tabControl.appendChild(tabItem0);
        tabControl.appendChild(tabItem1);
        document.body.appendChild(tabControl);

        testHelpers.runAsync(done, function () {
            expect(viModel.getControlModel(settings.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsTab0.niControlId)).toBeDefined();
            expect(viModel.getControlModel(settingsTab1.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settings.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsTab0.niControlId)).toBeDefined();
            expect(viModel.getControlViewModel(settingsTab1.niControlId)).toBeDefined();

            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    describe('exists after creation with tabStripPlacement on Top', function () {
        var viewModel;

        beforeEach(function (done) {
            webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                controlModel = frontPanelControls[settings.niControlId];
                viewModel = viModel.getControlViewModel(settings.niControlId);
                controlElement = viewModel.element;
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });

        it('and has the correct initial values.', function () {
            expect(controlModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(controlModel.selectedIndex).toEqual(settings.selectedIndex);
            expect(controlModel.tabStripPlacement).toEqual(settings.tabStripPlacement);
        });

        it('and updates the Model when properties change.', function (done) {
            webAppHelper.dispatchMessage(settings.niControlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.selectedIndex).toEqual(updateSettings.selectedIndex);
                expect(controlModel.tabStripPlacement).toEqual(updateSettings.tabStripPlacement);
                expect(controlModel.fontSize).toEqual('20px');
                expect(controlModel.fontFamily).toEqual('sans-serif');
                expect(controlModel.fontWeight).toEqual('bold');
                expect(controlModel.fontStyle).toEqual('italic');
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };
            webAppHelper.dispatchMessage(settings.niControlId, unknownSettings);

            testHelpers.runAsync(done, function () {
                expect(controlModel.selectedIndex).toEqual(settings.selectedIndex);
                expect(controlModel.tabStripPlacement).toEqual(settings.tabStripPlacement);
            });
        });
    });

    it('updated all of its properties expected to be updated', function () {
        var uncoveredProperties = [
            'readOnly',
            'bindingInfo',
            'labelId',
            'niControlId',
            'viRef'
        ];
        var propertiesUpdated = testHelpers.customElementMonitor.uncalledPropertiesExceptFor(settings.kind, uncoveredProperties);

        expect(propertiesUpdated).toEqual(testHelpers.customElementMonitor.EVERYTHING_CALLED);
    });
});
