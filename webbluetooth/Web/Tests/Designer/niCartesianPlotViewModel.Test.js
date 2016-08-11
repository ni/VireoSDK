//****************************************
// Tests for CartesianPlotViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A CartesianPlotViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var graphId = 'Function1';
    var axis1, axis2, plot1, plot1Settings, plot1ElementSettings;
    var axis1Id = 'Function13',
        axis2Id = 'Function12',
        plot1Id = 'Function15';

    var viModel, frontPanelControls, graphModel, graph;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
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
            min: 0,
            max: 10,
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
            min: 0,
            max: 10,
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

        plot1Settings = {
            xaxis: axis1Id + 'test',
            yaxis: axis2Id + 'test'
        };

        plot1ElementSettings = {
            xaxis: axis1Id,
            yaxis: axis2Id,
            'ni-control-id': plot1Id
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
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows creation with default settings', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(plot1, graphId);

        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(plot1Id);
            expect(viewModel).toBeDefined();

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('allows to call the setMultipleProperties method with a property update', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(plot1, graphId);

        testHelpers.runMultipleAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[graphId];
            var plotModel = frontPanelControls[plot1Id];
            plotModel.setMultipleProperties({xaxis: 'newName'});
        }, function () {
            var plotModel = frontPanelControls[plot1Id];
            expect(plotModel).toBeDefined();
            expect(plotModel.xaxis).toBe('newName');
            var plotViewModel = viModel.getControlViewModel(plot1Id);
            expect(plotViewModel).toBeDefined();

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('updates the Model when properties change.', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(plot1, graphId);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.dispatchMessage(plot1Id, plot1Settings);
        }, function () {
            var model = viModel.getControlModel(plot1Id);
            Object.keys(plot1Settings).forEach(function (key) {
                expect(model[key]).toBe(plot1Settings[key]);
            });

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('allows a plot element to be added directly to the page.', function (done) {
        var element = webAppHelper.createNIElement(graph);

        var plotElementStr =  '<ni-cartesian-plot ' +
        Object.keys(plot1ElementSettings).map(function (key) {
            return key + '=' + plot1ElementSettings[key];
        }).join(' ') +
        '></ni-cartesian-plot>';

        $(element).append(plotElementStr);

        testHelpers.runAsync(done, function () {
            var model = viModel.getControlModel(plot1Id);
            expect(model.xaxis).toBe(axis1Id);
            expect(model.yaxis).toBe(axis2Id);

            webAppHelper.removeNIElement(graphId);
        });
    });
});
