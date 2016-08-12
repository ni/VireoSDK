//****************************************
// Tests for ColorScaleViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A ColorScaleViewModel', function () {
    'use strict';

    var graphId = 'Function1';
    var axis1, axis1Settings, axis1ElementSettings;
    var axis1Id = 'Function13';

    var viModel, frontPanelControls, graphModel, graph;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        axis1 = {
            label: 'Color scale',
            showAxis: true,
            showLabel: true,
            axisPosition: 'right',
            autoScale: false,
            highColor: '#ff0000',
            lowColor: '#00ff00',
            markers: '[{"value":0,"color":"#000000"},{"value":50,"color":"#0000FF"},{"value":100,"color":"#FFFFFF"}]',
            niControlId: axis1Id,
            kind: NationalInstruments.HtmlVI.Models.ColorScaleModel.MODEL_KIND
        };

        axis1Settings = {
            label: 'Color scale 1',
            showAxis: false,
            showLabel: false,
            axisPosition: 'left',
            highColor: '#ffaa00',
            lowColor: '#00ffaa',
            markers: '[{"value":0,"color":"#000000"},{"value":50,"color":"#AA00FF"},{"value":100,"color":"#FFFFFF"}]',
            autoScale: true
        };

        axis1ElementSettings = {
            'label': 'Color scale 1',
            showAxis: false,
            'show-label': false,
            'axis-position': 'right',
            'auto-scale': true,
            'high-color': '#ffaa00',
            'low-color': '#00ffaa',
            markers: '[{"value":0,"color":"#000000"},{"value":50,"color":"#00AAFF"},{"value":100,"color":"#FFFFFF"}]',
            niControlId: axis1Id
        };

        graph = {
            niControlId: graphId,
            kind: NationalInstruments.HtmlVI.Models.IntensityGraphModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows creation with default settings', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(axis1, graphId);

        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(graphId);
            expect(viewModel).toBeDefined();

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('allows to call the setMultipleProperties method with a property update', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(axis1, graphId);

        testHelpers.runMultipleAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[graphId];
            var axisModel = frontPanelControls[axis1Id];
            axisModel.setMultipleProperties({highColor: '#ccaacc'});
        }, function () {
            var axisModel = frontPanelControls[axis1Id];
            expect(axisModel).toBeDefined();
            expect(axisModel.highColor).toBe('#ccaacc');

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('updates the Model when properties change.', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(axis1, graphId);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.dispatchMessage(axis1Id, axis1Settings);
        }, function () {
            var model = viModel.getControlModel(axis1Id);
            Object.keys(axis1Settings).forEach(function (key) {
                expect(model[key]).toBe(axis1Settings[key]);
            });

            webAppHelper.removeNIElement(graphId);
        });
    });
});
