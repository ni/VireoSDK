//****************************************
// Tests for CartesianGraphViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A CartesianGraphViewModel', function () {
    'use strict';

    var controlId = 'Function1';
    var axis1, axis2, graph;
    var axis1Id = 'Function13',
        axis2Id = 'Function12';

    var viModel, frontPanelControls, graphModel, settings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        graph = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.CartesianGraphModel.MODEL_KIND,
            left: '270px',
            top: '150px',
            width: '750px',
            height: '300px',
            visible: true
        };

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
        settings = {
            niControlId: controlId,
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

    it('allows creation of graph with default settings and no axes', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);

            expect(viewModel).toBeDefined();

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows creation of axes and then of the graph', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(axis2, controlId);
        webAppHelper.createNIElement(axis1, controlId);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);

            expect(viewModel).toBeDefined();
            expect(axis1ViewModel).toBeDefined();
            expect(axis2ViewModel).toBeDefined();

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows creation of a graph and then adding nested axes', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(axis1, controlId);
        webAppHelper.createNIElement(axis2, controlId);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);

            expect(viewModel).toBeDefined();
            expect(axis1ViewModel).toBeDefined();
            expect(axis2ViewModel).toBeDefined();

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows removing of the nested axes', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(axis2, controlId);
        webAppHelper.createNIElement(axis1, controlId);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.removeNIElement(axis1Id);
        }, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);

            expect(viewModel).toBeDefined();
            expect(axis1ViewModel).not.toBeDefined();
            expect(axis2ViewModel).toBeDefined();

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows to call the ModelPropertyChanged method with a property update', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            graphModel.setMultipleProperties(settings);

            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows to change the value of the graph', function (done) {
        var value1D = [7, 9, 30];
        var updateSettings = { value: value1D };

        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.dispatchMessage(controlId, updateSettings);
        }, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel.value).toEqual(value1D);

            webAppHelper.removeNIElement(controlId);
        });
    });
});
