//****************************************
// Tests for GraphToolsViewModel class
// National Instruments Copyright 2015
//****************************************

describe('A GraphToolsViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var graphToolsId = 'Function1';
    var graphId = 'graph1';
    var axis1Id = 'axis1';
    var axis2Id = 'axis2';
    var plot1Id = 'plot1';
    var renderer1Id = 'renderer1';

    var axis1, axis2, plot1, renderer1, graph;

    var viModel, frontPanelControls, graphToolsModel, graphToolsElement, graphTools;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        graphTools = {
            niControlId: graphToolsId,
            kind: NationalInstruments.HtmlVI.Models.GraphToolsModel.MODEL_KIND,
            isInEditMode: false,
            graphName: graphId,
            mode: 'pan',
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            top: '450px',
            width: '150px',
            height: '30px',
            left: '270px',
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
        graph = {
            niControlId: graphId,
            kind: NationalInstruments.HtmlVI.Models.CartesianGraphModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            value: [0, 1]
        };
        plot1 = {
            xaxis: axis1Id,
            yaxis: axis2Id,
            niControlId: plot1Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianPlotModel.MODEL_KIND
        };

        renderer1 = {
            lineWidth: 2,
            color: '#FF0000',
            pointColor: '#00FF00',
            pointSize: 1,
            pointShape: 'square',
            niControlId: renderer1Id,
            kind: NationalInstruments.HtmlVI.Models.PlotRendererModel.MODEL_KIND
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-graph-tools ni-control-id="' + graphToolsId + '" graph-name="' + graphId + '"></ni-graph-tools>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(graphToolsId);
            expect(viewModel).toBeDefined();
            var model = viewModel.model;
            expect(model).toBeDefined();
            expect(model.graphName).toEqual('graph1');
            webAppHelper.removeNIElement(graphToolsId);
        });
    });

    it('allows creating an instance with values set', function (done) {
        webAppHelper.createNIElement(graphTools);

        testHelpers.runAsync(done, function () {
            graphToolsElement = document.getElementById(graphToolsId);
            frontPanelControls = viModel.getAllControlModels();
            graphToolsModel = frontPanelControls[graphToolsId];
            var val = graphToolsModel.isInEditMode;
            expect(val).toEqual(false);

            var name = graphToolsModel.graphName;
            expect(name).toEqual('graph1');

            webAppHelper.removeNIElement(graphToolsId);
        });
    });

    it('verify that default interaction mode is pan', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
            $(document.body).append('<ni-graph-tools ni-control-id="' + graphToolsId + '" graph-name="' + graphId + '"></ni-graph-tools>');
        }, function () {
            var viewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = viewModel.element;

            var graphOptions = viewModel.element._parentGraph.graph.getOptions();

            expect(graphElement.mode).toBe('pan');
            expect(graphOptions.zoom.interactive).toBe(true);
            expect(graphOptions.selection.mode).toBe(null);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('verify that the element can be initialized in zoom mode ', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
            $(document.body).append('<ni-graph-tools ni-control-id="' + graphToolsId + '" graph-name="' + graphId + '" mode="zoom"></ni-graph-tools>');
        }, function () {
            var viewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = viewModel.element;

            var graphOptions = viewModel.element._parentGraph.graph.getOptions();

            expect(graphElement.mode).toBe('zoom');
            expect(graphOptions.zoom.interactive).toBe(true);
            expect(graphOptions.selection.mode).toBe('smart');
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('verify that the element can be initialized in locked mode ', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
            $(document.body).append('<ni-graph-tools ni-control-id="' + graphToolsId + '" graph-name="' + graphId + '" mode="locked"></ni-graph-tools>');
        }, function () {
            var viewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = viewModel.element;

            var graphOptions = viewModel.element._parentGraph.graph.getOptions();

            expect(graphElement.mode).toBe('locked');
            expect(graphOptions.zoom.interactive).toBe(false);
            expect(graphOptions.selection.mode).toBe(null);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('locks interaction when the lock button is pressed.', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.createNIElement(graphTools);
        }, function () {
            var viewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = viewModel.element;

            var lockButtonElement = $(graphElement).find('.ni-navigation-locked-button');
            lockButtonElement.trigger('click');

            var graphOptions = graphElement._parentGraph.graph.getOptions();

            expect(graphElement.mode).toBe('locked');
            expect(graphOptions.zoom.interactive).toBe(false);
            expect(graphOptions.selection.mode).toBe(null);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('enables box zoom mode when when the box zoom button is pressed.', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.createNIElement(graphTools);
        }, function () {
            var viewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = viewModel.element;
            var boxZoomButtonElement = $(graphElement).find('.ni-navigation-zoom-button');
            boxZoomButtonElement.trigger('click');

            var graphOptions = graphElement._parentGraph.graph.getOptions();
            expect(graphElement.mode).toBe('zoom');
            expect(graphOptions.zoom.interactive).toBe(true);
            expect(graphOptions.selection.mode).toBe('smart');
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('enables pan mode when when the pan button is pressed.', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
            graphTools.mode = 'locked';
            webAppHelper.createNIElement(graphTools);
        }, function () {
            var viewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = viewModel.element;
            var panButtonElement = $(graphElement).find('.ni-navigation-pan-button');
            panButtonElement.trigger('click');

            var graphOptions = graphElement._parentGraph.graph.getOptions();
            expect(graphElement.mode).toBe('pan');
            expect(graphOptions.zoom.interactive).toBe(true);

            expect(graphOptions.selection.mode).toBe(null);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('zoomOut button will call scaleOnce on all axes when pressed', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
        }, function () {
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
        }, function () {
            webAppHelper.createNIElement(graphTools);
        }, function () {
            var graphViewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = graphViewModel.element;
            var zoomOutButtonElement = $(graphElement).find('.ni-navigation-zoom-out-button');
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis1Element = axis1ViewModel.element;
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);
            var axis2Element = axis2ViewModel.element;

            spyOn(axis1Element, 'scaleOnce').and.callThrough();
            spyOn(axis2Element, 'scaleOnce').and.callThrough();

            zoomOutButtonElement.trigger('click');

            expect(axis1Element.scaleOnce).toHaveBeenCalled();
            expect(axis2Element.scaleOnce).toHaveBeenCalled();
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('zoomOut works as expected', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
        }, function () {
            webAppHelper.createNIElement(graphTools);
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
            webAppHelper.createNIElement(plot1, graphId);
            webAppHelper.createNIElement(renderer1, plot1Id);
        }, function () {
            var graphViewModel = viModel.getControlViewModel(graphToolsId);
            var graphElement = graphViewModel.element;
            var zoomOutButtonElement = $(graphElement).find('.ni-navigation-zoom-out-button');
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis1Element = axis1ViewModel.element;
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);
            var axis2Element = axis2ViewModel.element;

            zoomOutButtonElement.trigger('click');

            expect(axis1Element.minimum).toBe(0);
            expect(axis1Element.maximum).toBe(1);
            expect(axis2Element.minimum).toBe(0);
            expect(axis2Element.maximum).toBe(1);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('ensures the axis elements are kept up to date on pan', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
        }, function () {
            webAppHelper.createNIElement(graphTools);
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
            webAppHelper.createNIElement(plot1, graphId);
            webAppHelper.createNIElement(renderer1, plot1Id);
        }, function () {
            var graphElement = viModel.getControlViewModel(graphId).element;
            var flotGraph = graphElement.graph;
            flotGraph.getPlaceholder().find('.flot-overlay').simulate('drag', {dx: 300});
        }, function () {
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis1Element = axis1ViewModel.element;
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);
            var axis2Element = axis2ViewModel.element;
            expect(axis1Element.minimum).toBe(0);
            expect(axis1Element.maximum).toBe(10);
            expect(axis2Element.minimum).toBeLessThan(-5);
            expect(axis2Element.maximum).toBeLessThan(5);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('ensures the axis elements are kept up to date on box zoom', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
        }, function () {
            graphTools.mode = 'zoom';
            webAppHelper.createNIElement(graphTools);
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
            webAppHelper.createNIElement(plot1, graphId);
            webAppHelper.createNIElement(renderer1, plot1Id);
        }, function () {
            var graphElement = viModel.getControlViewModel(graphId).element;
            var plot = graphElement.graph;

            plot.getPlaceholder().find('.flot-overlay')
                .simulate('drag', {dx: 100, dy: 100});

            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis1Element = axis1ViewModel.element;
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);
            var axis2Element = axis2ViewModel.element;

            expect(axis1Element.minimum).toBeGreaterThan(0);
            expect(axis1Element.maximum).toBeLessThan(10);
            expect(axis2Element.minimum).toBeGreaterThan(0);
            expect(axis2Element.maximum).toBeLessThan(10);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });

    });

    it('ensures the axis elements are kept up to date on scrollwheel zoom', function (done) {
        webAppHelper.createNIElement(graph);

        testHelpers.runMultipleAsync(done, function () {
        }, function () {
            webAppHelper.createNIElement(graphTools);
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
            webAppHelper.createNIElement(plot1, graphId);
            webAppHelper.createNIElement(renderer1, plot1Id);
        }, function () {
            var graphElement = viModel.getControlViewModel(graphId).element;
            var plot = graphElement.graph;
            var offset = plot.offset();
            var w = plot.width();
            var h = plot.height();

            plot.getPlaceholder().find('.flot-overlay')
                .simulate('mousewheel', {clientX: offset.left + w / 2, clientY: offset.top + h / 2});

            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis1Element = axis1ViewModel.element;
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);
            var axis2Element = axis2ViewModel.element;

            expect(axis1Element.minimum).toBeGreaterThan(0);
            expect(axis1Element.maximum).toBeLessThan(10);
            expect(axis2Element.minimum).toBeGreaterThan(0);
            expect(axis2Element.maximum).toBeLessThan(10);
        }, function () {
            webAppHelper.removeNIElement(graphToolsId);
            webAppHelper.removeNIElement(graphId);
        });
    });
});
