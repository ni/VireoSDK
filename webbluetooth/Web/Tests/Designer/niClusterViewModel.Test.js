//****************************************
// Tests for BooleanclusterModel class
// National Instruments Copyright 2014
//****************************************
/*globals xit*/
describe('A ClusterViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var viModel, settings, settings2, settings2Label, numericSettings, numericSettingsLabel, stringSettings, stringSettingsLabel;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: 'Cluster1',
            kind: NationalInstruments.HtmlVI.Models.ClusterModel.MODEL_KIND,
            left: '10px',
            top: '20px',
            width: '800px',
            height: '1200px'
        };
        settings2 = {
            niControlId: 'Cluster2',
            kind: NationalInstruments.HtmlVI.Models.ClusterModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            labelId: 'Cluster2Label',
            width: '80px',
            height: '120px'
        };
        settings2Label = {
            niControlId: 'Cluster2Label',
            text: 'Cluster2',
            kind: NationalInstruments.HtmlVI.Models.LabelModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '80px',
            height: '120px'
        };

        numericSettings = {
            niControlId: 'Function10',
            kind: NationalInstruments.HtmlVI.Models.NumericTextBoxModel.MODEL_KIND,
            minimum: 0.0,
            maximum: 10.0,
            value: 5.0,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            labelId: 'Function10Label'
        };
        numericSettingsLabel = {
            niControlId: 'Function10Label',
            text: 'Function10',
            kind: NationalInstruments.HtmlVI.Models.LabelModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '80px',
            height: '120px'
        };

        stringSettings = {
            niControlId: 'function22',
            kind: NationalInstruments.HtmlVI.Models.StringControlModel.MODEL_KIND,
            visible: true,
            text: 'Editable',
            readOnly: false,
            configuration: {},
            left: '272px',
            top: '166px',
            width: '90px',
            height: '22px',
            labelId: 'function22Label'
        };
        stringSettingsLabel = {
            niControlId: 'function22Label',
            text: 'function22',
            kind: NationalInstruments.HtmlVI.Models.LabelModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '80px',
            height: '120px'
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    // intitalizing a nested cluster
    /*
        settings.niControlId
               | ----- settings2.niControlId
                               | ---- numericSettings.niControlId
                               | ---- stringSettings.niControlId
    */
    it('allows initializing nested cluster', function (done) {
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settings2, settings.niControlId);
        webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        webAppHelper.createNIElement(stringSettings, settings2.niControlId);

        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            var viewModel2 = viModel.getControlViewModel(settings2.niControlId);
            var viewModel3 = viModel.getControlViewModel(numericSettings.niControlId);
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(4);
            expect(viewModel).toBeDefined();
            expect(viewModel2.model.getOwner()).toBe(viewModel.model);
            expect(viewModel3.model.getOwner()).toBe(viewModel2.model);
            expect(viewModel2.model.childModels.length).toBe(2);

            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    // TODO mraj The following tests are trying to observe behavior of the reparenting buffer which is not available for the test update service
    // Should be moved to an editor update service test
    // settings.niControlId contains settings2.niControlId, settings2.niControlId contains numericSettings.niControlId
    xit('allows creating nested cluster dynamiclly', function (done) {
        webAppHelper.createNIElement(settings2);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        }, function () {
            webAppHelper.createNIElement(settings);
        }, function () {
            webAppHelper.removeNIElement(numericSettings.niControlId);
            webAppHelper.removeNIElement(settings2.niControlId);
            webAppHelper.createNIElement(settings2, settings.niControlId);
        }, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            var viewModel2 = viModel.getControlViewModel(settings2.niControlId);
            var viewModel3 = viModel.getControlViewModel(numericSettings.niControlId);
            expect(viewModel2.model.getOwner()).toBe(viewModel.model);
            expect(viewModel3.model.getOwner()).toBe(viewModel2.model);
            expect(viewModel2.model.childModels.length).toBe(1);
            webAppHelper.removeNIElement(numericSettings.niControlId);
            webAppHelper.removeNIElement(stringSettings.niControlId);
            webAppHelper.removeNIElement(settings2.niControlId);
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    xit('allows to move elements from topviModel to cluster', function (done) {
        expect(Object.keys(viModel.getAllControlModels()).length).toBe(0);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.createNIElement(numericSettings);
        }, function () {
            webAppHelper.createNIElement(stringSettings, settings2.niControlId);
        }, function () {
            webAppHelper.createNIElement(settings2, settings.niControlId);
        }, function () {
            webAppHelper.createNIElement(settings);
        }, function () {
            webAppHelper.removeNIElement(numericSettings.niControlId);
        }, function () {
            webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        }, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            var viewModel2 = viModel.getControlViewModel(settings2.niControlId);
            var viewModel3 = viModel.getControlViewModel(numericSettings.niControlId);
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(4);
            expect(viewModel).toBeDefined();
            expect(viewModel2.model.getOwner()).toBe(viewModel.model);
            expect(viewModel3.model.getOwner()).toBe(viewModel2.model);
            expect(viewModel2.model.childModels.length).toBe(2);
        }, function () {
            webAppHelper.removeNIElement(numericSettings.niControlId);
        }, function () {
            webAppHelper.removeNIElement(stringSettings.niControlId);
        }, function () {
            webAppHelper.removeNIElement(settings2.niControlId);
        }, function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    xit('allows to move elements from one cluster to topviModel', function (done) {
        webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        webAppHelper.createNIElement(stringSettings, settings2.niControlId);
        webAppHelper.createNIElement(settings2, settings.niControlId);

        webAppHelper.createNIElement(settings);
        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.removeNIElement(numericSettings.niControlId);
            webAppHelper.createNIElement(numericSettings);
        }, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            var viewModel2 = viModel.getControlViewModel(settings2.niControlId);
            var viewModel3 = viModel.getControlViewModel(numericSettings.niControlId);
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(4);
            expect(viewModel).toBeDefined();
            expect(viewModel2.model.getOwner()).toBe(viewModel.model);
            expect(viewModel3.model.getOwner()).toBe(viModel);
            expect(viewModel2.model.childModels.length).toBe(1);
            webAppHelper.removeNIElement(numericSettings.niControlId);
            webAppHelper.removeNIElement(stringSettings.niControlId);
            webAppHelper.removeNIElement(settings2.niControlId);
            webAppHelper.removeNIElement(settings.niControlId);
        });

    });

    xit('allows to move elements from its parent cluster  to a sibling cluster ', function (done) {
        webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        webAppHelper.createNIElement(stringSettings, settings2.niControlId);
        webAppHelper.createNIElement(settings2, settings.niControlId);

        webAppHelper.createNIElement(settings);
        testHelpers.runMultipleAsync(done, function () {

            webAppHelper.removeNIElement(numericSettings.niControlId);
            webAppHelper.createNIElement(numericSettings);

        }, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            var viewModel2 = viModel.getControlViewModel(settings2.niControlId);
            var viewModel3 = viModel.getControlViewModel(numericSettings.niControlId);
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(4);
            expect(viewModel).toBeDefined();
            expect(viewModel2.model.getOwner()).toBe(viewModel.model);
            expect(viewModel3.model.getOwner()).toBe(viModel);
            expect(viewModel2.model.childModels.length).toBe(1);
            webAppHelper.removeNIElement(numericSettings.niControlId);
            webAppHelper.removeNIElement(stringSettings.niControlId);
            webAppHelper.removeNIElement(settings2.niControlId);
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('allows to delete the whole cluster', function (done) {
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settings2, settings.niControlId);
        webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        webAppHelper.createNIElement(stringSettings, settings2.niControlId);

        testHelpers.runMultipleAsync(done, function () {
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(4);
            webAppHelper.removeNIElement(numericSettings.niControlId);
            webAppHelper.removeNIElement(stringSettings.niControlId);
            webAppHelper.removeNIElement(settings2.niControlId);
            webAppHelper.removeNIElement(settings.niControlId);
        }, function () {
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(0);
        });
    });

    it('allows to delete the whole cluster', function (done) {
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settings2, settings.niControlId);
        webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        webAppHelper.createNIElement(stringSettings, settings2.niControlId);

        testHelpers.runMultipleAsync(done, function () {
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(4);
            webAppHelper.removeNIElement(settings.niControlId);
        }, function () {
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(0);
        });
    });

    it('and updates the Model when properties change.', function (done) {
        var updateSettings2 = {
            text: 'Fred'
        };
        var updateSettings1 = {
            value: 6.66
        };
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settings2, settings.niControlId);
        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.createNIElement(settings2Label, settings.niControlId);
            webAppHelper.createNIElement(numericSettings, settings2.niControlId);
            webAppHelper.createNIElement(numericSettingsLabel, settings2.niControlId);
            webAppHelper.createNIElement(stringSettings, settings2.niControlId);
            webAppHelper.createNIElement(stringSettingsLabel, settings2.niControlId);
        }, function () {
            var viewModel3 = viModel.getControlViewModel(numericSettings.niControlId);
            var viewModel4 = viModel.getControlViewModel(stringSettings.niControlId);
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(7);
            var stringControl = viewModel4.element;
            var internalControl = stringControl.firstElementChild;
            $(internalControl).text('Fred');
            $(internalControl).trigger('change');
            var numericControl = viewModel3.element;
            var internalControl2 = numericControl.firstElementChild;
            $(internalControl2).val(6.66);
            $(internalControl).trigger('change');
        }, function () {
            var viewModel3 = viModel.getControlViewModel(numericSettings.niControlId);
            var viewModel4 = viModel.getControlViewModel(stringSettings.niControlId);
            expect(viewModel4.model.text).toEqual(updateSettings2.text);
            expect(viewModel3.model.value).toEqual(updateSettings1.value);
        }, function () {
            webAppHelper.removeNIElement(stringSettings.niControlId);
            webAppHelper.removeNIElement(stringSettingsLabel.niControlId);
        }, function () {
            expect(Object.keys(viModel.getAllControlModels()).length).toBe(5);
        }, function () {
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });

    it('and handles unknown property changes.', function (done) {
        var unknownSettings = {
            unknown: 'unknown'
        };
        webAppHelper.createNIElement(settings);
        webAppHelper.createNIElement(settings2, settings.niControlId);
        webAppHelper.createNIElement(numericSettings, settings2.niControlId);
        webAppHelper.createNIElement(stringSettings, settings2.niControlId);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.dispatchMessage(settings.niControlId, unknownSettings);
        }, function () {
            var viewModel = viModel.getControlViewModel(settings.niControlId);
            expect(viewModel.model.width).toEqual(settings.width);
            expect(viewModel.model.height).toEqual(settings.height);
            webAppHelper.removeNIElement(settings.niControlId);
        });
    });
});
