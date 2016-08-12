//****************************************
// Tests for PlotRendererViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A PlotRendererViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var graphId = 'Function1';
    var graph, axis1, axis2, plot1, renderer1, renderer1Settings, renderer1ElementSettings;
    var axis1Id = 'Function13',
        axis2Id = 'Function12',
        plot1Id = 'Function15',
        renderer1Id = 'Function18';

    var viModel, frontPanelControls, graphModel;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    // TODO mraj these tests are really slow on IE 11, should figure out why
    var originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

    beforeAll(function (done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        axis1 = {
            label: 'Amplitude',
            show: true,
            showLabel: true,
            axisPosition: 'left',
            minimum: 0,
            maximum: 10,
            autoScale: false,
            logScale: false,
            niControlId: axis1Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianAxisModel.MODEL_KIND
        };

        axis2 = {
            label: 'Time',
            show: true,
            showLabel: true,
            axisPosition: 'bottom',
            minimum: 0,
            maximum: 10,
            autoScale: false,
            logScale: false,
            niControlId: axis2Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianAxisModel.MODEL_KIND
        };

        plot1 = {
            xaxis: axis1Id,
            yaxis: axis2Id,
            niControlId: plot1Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianPlotModel.MODEL_KIND
        };

        renderer1 = {
            lineWidth: 4,
            lineStyle: 'solid',
            pointColor: '#FFFF00',
            pointSize: 3,
            pointShape: 'ellipse',
            lineStroke: 'blue',
            niControlId: renderer1Id,
            kind: NationalInstruments.HtmlVI.Models.PlotRendererModel.MODEL_KIND
        };

        renderer1Settings = {
            lineWidth: 2,
            lineStyle: 'dashdot',
            pointColor: '#FF00FF',
            pointSize: 5,
            pointShape: 'diamond',
            lineStroke: 'green',
            areaFill: 'yellow',
            barFill: 'red'
        };

        renderer1ElementSettings = {
            'line-width': 2,
            'line-style': 'dashdot',
            'point-color': '#FF00FF',
            'point-size': 5,
            'point-shape': 'diamond',
            'line-stroke': 'green',
            'area-fill': 'yellow',
            'bar-fill': 'red',
            'ni-control-id': renderer1Id
        };

        graph = {
            niControlId: graphId,
            kind: NationalInstruments.HtmlVI.Models.CartesianGraphModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px'
        };
    });

    afterAll(function (done) {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;

        webAppHelper.removeWebAppFixture(done);
    });

    it('allows to call the setMultipleProperties method with a property update', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(plot1, graphId);
        webAppHelper.createNIElement(renderer1, plot1Id);

        testHelpers.runMultipleAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[graphId];
            var rendererModel = frontPanelControls[renderer1Id];
            rendererModel.setMultipleProperties(renderer1Settings);
        }, function () {
            var rendererModel = frontPanelControls[renderer1Id];
            expect(rendererModel).toBeDefined();
            var rendererViewModel = viModel.getControlViewModel(renderer1Id);
            expect(rendererViewModel).toBeDefined();
            Object.keys(renderer1Settings).forEach(function (key) {
                expect(rendererModel[key]).toBe(renderer1Settings[key]);
            });

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('updates the Model when properties change.', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(plot1, graphId);
        webAppHelper.createNIElement(renderer1, plot1Id);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.dispatchMessage(renderer1Id, renderer1Settings);
        }, function () {
            var model = viModel.getControlModel(renderer1Id);
            Object.keys(renderer1Settings).forEach(function (key) {
                expect(model[key]).toBe(renderer1Settings[key]);
            });

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('allows a renderer element to be added directly to the page.', function (done) {
        webAppHelper.createNIElement(graph);
        var element = webAppHelper.createNIElement(plot1, graphId);

        var rendererElementStr =  '<ni-cartesian-plot-renderer ' +
        Object.keys(renderer1ElementSettings).map(function (key) {
            return key + '=' + renderer1ElementSettings[key];
        }).join(' ') +
        '></ni-cartesian-plot-renderer>';

        $(element).append(rendererElementStr);

        testHelpers.runAsync(done, function () {
            var model = viModel.getControlModel(renderer1Id);
            Object.keys(renderer1Settings).forEach(function (key) {
                expect(model[key]).toBe(renderer1Settings[key]);
            });

            webAppHelper.removeNIElement(graphId);
        });
    });
});
