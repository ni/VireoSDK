//****************************************
// Tests for TabItemViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A TabItemViewModel', function () {
    'use strict';

    var viModel;

    var settingsTab0, updateSettingsTab0, updateSettingsTab0Reverse, updateSettingsTab0Header,
        settingsTab1, updateSettingsTab1, updateSettingsTab1Reverse,
        settingsTabControl;

    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settingsTab0 = {
            niControlId: 'FunctionTab0',
            kind: NationalInstruments.HtmlVI.Models.TabItemModel.MODEL_KIND,
            header: 'Banana for Scale',
            tabPosition: 0
        };
        updateSettingsTab0 = {
            tabPosition: 1
        };
        updateSettingsTab0Reverse = {
            tabPosition: 0
        };
        updateSettingsTab0Header = {
            header: 'Hello World'
        };

        settingsTab1 = {
            niControlId: 'FunctionTab1',
            kind: NationalInstruments.HtmlVI.Models.TabItemModel.MODEL_KIND,
            header: 'Grumpy Cat Dislikes',
            tabPosition: 1
        };
        updateSettingsTab1 = {
            tabPosition: 0
        };
        updateSettingsTab1Reverse = {
            tabPosition: 1
        };

        settingsTabControl = {
            niControlId: 'FunctionTabControl',
            kind: NationalInstruments.HtmlVI.Models.TabControlModel.MODEL_KIND,
            tabStripPlacement: 'Bottom',
            selectedIndex: 0,
            visible: true
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    describe('exists after it is created with a parent tab control and sibling tab item', function () {
        var ModelTab0, viewModelTab0,
            ModelTab1, viewModelTab1,
            ModelTabControl, viewModelTabControl;

        beforeEach(function (done) {
            var frontPanelControls;

            webAppHelper.createNIElement(settingsTabControl);
            webAppHelper.createNIElement(settingsTab0, settingsTabControl.niControlId);
            webAppHelper.createNIElement(settingsTab1, settingsTabControl.niControlId);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                ModelTab0 = viModel.getControlModel(settingsTab0.niControlId);
                ModelTab1 = viModel.getControlModel(settingsTab1.niControlId);
                ModelTabControl = viModel.getControlModel(settingsTabControl.niControlId);
                viewModelTab0 = viModel.getControlViewModel(settingsTab0.niControlId);
                viewModelTab1 = viModel.getControlViewModel(settingsTab1.niControlId);
                viewModelTabControl = viModel.getControlViewModel(settingsTabControl.niControlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(settingsTabControl.niControlId);
        });

        it('and has the correct initial values.', function () {
            expect(ModelTab0).toBeDefined();
            expect(ModelTab1).toBeDefined();
            expect(ModelTabControl).toBeDefined();
            expect(viewModelTab0).toBeDefined();
            expect(viewModelTab1).toBeDefined();
            expect(viewModelTabControl).toBeDefined();
            expect(ModelTab0.header).toEqual(settingsTab0.header);
            expect(ModelTab1.header).toEqual(settingsTab1.header);
            expect(ModelTab0.tabPosition).toEqual(settingsTab0.tabPosition);
            expect(ModelTab1.tabPosition).toEqual(settingsTab1.tabPosition);
            expect(ModelTabControl.tabStripPlacement).toEqual(settingsTabControl.tabStripPlacement);
            expect(ModelTabControl.selectedIndex).toEqual(settingsTabControl.selectedIndex);
        });

        it('and updates the Model when tabPosition property changes.', function (done) {

            testHelpers.runMultipleAsync(done, function () {
                webAppHelper.dispatchMessage(settingsTab0.niControlId, updateSettingsTab0);
            }, function () {
                expect(ModelTab0.tabPosition).toEqual(updateSettingsTab0.tabPosition);
            }, function () {
                webAppHelper.dispatchMessage(settingsTab1.niControlId, updateSettingsTab1);
            }, function () {
                expect(ModelTab1.tabPosition).toEqual(updateSettingsTab1.tabPosition);
            }, function () {
                webAppHelper.dispatchMessage(settingsTab0.niControlId, updateSettingsTab0Reverse);
            }, function () {
                expect(ModelTab0.tabPosition).toEqual(updateSettingsTab0Reverse.tabPosition);
            }, function () {
                webAppHelper.dispatchMessage(settingsTab1.niControlId, updateSettingsTab1Reverse);
            }, function () {
                expect(ModelTab1.tabPosition).toEqual(updateSettingsTab1Reverse.tabPosition);
            });
        });

        it('and updates the Model when header property changes.', function (done) {
            webAppHelper.dispatchMessage(settingsTab0.niControlId, updateSettingsTab0Header);

            testHelpers.runAsync(done, function () {
                expect(ModelTab0.header).toEqual(updateSettingsTab0Header.header);
            });
        });

        it('and handles unknown property changes.', function (done) {
            var unknownSettings = {
                unknown: 'unknown'
            };
            webAppHelper.dispatchMessage(settingsTab0.niControlId, unknownSettings);

            testHelpers.runAsync(done, function () {
                expect(ModelTab0.header).toEqual(settingsTab0.header);
                expect(ModelTab0.tabPosition).toEqual(settingsTab0.tabPosition);
            });
        });
    });
});
