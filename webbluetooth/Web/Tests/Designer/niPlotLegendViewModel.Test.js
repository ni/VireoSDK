//****************************************
// Tests for PlotLegendModel class
// National Instruments Copyright 2014
//****************************************
/*globals xit*/
describe('A PlotLegendViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';
    var graphId = 'graph1';
    var axis1Id = 'axis1';
    var axis2Id = 'axis2';
    var plot1Id = 'plot1';
    var renderer1Id = 'renderer';
    var axis1;
    var axis2;
    var plot1;
    var renderer1;
    var graph;

    var viModel, frontPanelControls, plotLegendModel, plotLegendElement, settings, updateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.PlotLegendModel.MODEL_KIND,
            isInEditMode: false,
            graphName: graphId,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            visible: true
        };

        updateSettings = {
            isInEditMode: true,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic',
            graphName: 'graph2'
        };
        axis1 = {
            label: 'Amplitude',
            show: true,
            showLabel: true,
            axisPosition: 'left',
            minimum: 0,
            maximum: 10,
            autoPlot: false,
            logPlot: false,
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
            autoPlot: false,
            logPlot: false,
            niControlId: axis2Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianAxisModel.MODEL_KIND
        };
        plot1 = {
            xaxis: axis1Id,
            yaxis: axis2Id,
            enableHover: false,
            hoverFormat: '',
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

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-plot-legend ni-control-id="' + controlId + '" graph-name="' + graphId + '"></ni-plot-legend>');
        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            var model = viewModel.model;
            expect(model).toBeDefined();
            expect(model.graphName).toEqual('graph1');
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows creating an instance with values set', function (done) {
        plotLegendElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            plotLegendModel = frontPanelControls[controlId];
            var val = plotLegendModel.isInEditMode;
            expect(val).toEqual(false);
            plotLegendModel.isInEditMode = true;
            val = plotLegendModel.isInEditMode;
            expect(val).toEqual(true);

            var name = plotLegendModel.graphName;
            expect(name).toEqual('graph1');
            plotLegendModel.graphName = 'fred';
            name = plotLegendModel.graphName;
            expect(name).toEqual('fred');

            webAppHelper.removeNIElement(controlId);
        });
    });
    describe('dynamically updates properties triggering ModelPropertyChanged', function () {
        var viewModel;

        beforeEach(function (done) {
            plotLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                plotLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('verifies initial values', function () {
            expect(plotLegendModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(plotLegendElement.isInEditMode).toEqual(false);
        });

        it('updates graphName and isInEditMode', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(plotLegendElement.isInEditMode).toEqual(true);
                expect(plotLegendElement.graphName).toEqual('graph2');
                expect(plotLegendModel.fontSize).toEqual('20px');
                expect(plotLegendModel.fontFamily).toEqual('sans-serif');
                expect(plotLegendModel.fontWeight).toEqual('bold');
                expect(plotLegendModel.fontStyle).toEqual('italic');
            });
        });
    });

    describe('add and remove rows', function () {
        var viewModel;

        beforeEach(function (done) {
            plotLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                plotLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('verifies add and remove row', function () {
            plotLegendElement.plotAdded();
            expect(plotLegendElement.nPlots).toEqual(1);
            plotLegendElement.plotRemoved();
            expect(plotLegendElement.nPlots).toEqual(0);
        });

    });

    describe('test the helpers', function () {
        var originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

        // TODO mraj these tests are really slow on IE 11, should figure out why
        beforeEach(function () {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
        });

        afterEach(function () {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        it('inner', function (done) {

            webAppHelper.createNIElement({
                niControlId: graphId,
                kind: NationalInstruments.HtmlVI.Models.CartesianGraphModel.MODEL_KIND,
                left: '270px',
                top: '150px',
                width: '750px',
                height: '300px',
                visible: true
            });
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
            webAppHelper.createNIElement(plot1, graphId);
            webAppHelper.createNIElement(renderer1, plot1Id);
            plotLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runMultipleAsync(done, function () {
                var frontPanelControls = viModel.getAllControlModels();
                var plotLegendModel = frontPanelControls[controlId];
                var graphModel = frontPanelControls[graphId];

                expect(graphModel).toBeDefined();
                expect(plotLegendModel).toBeDefined();

                var helpers = plotLegendElement.helpers;
                var renderer = helpers.getRenderer(0);
                var index = helpers.rendererToIndex(renderer);
                expect(index).toEqual(0);
                // line width
                helpers.handleClick('No line', null, 0);
                expect(renderer.lineWidth).toEqual(0);
                var isNone = helpers.getState('No line', 0);
                expect(isNone).toEqual(true);
                helpers.handleClick('1-pixel', null, 0);
                expect(renderer.lineWidth).toEqual(1);
                var is1Pixel = helpers.getState('1-pixel', 0);
                expect(is1Pixel).toEqual(true);
                helpers.handleClick('2-pixels', null, 0);
                expect(renderer.lineWidth).toEqual(2);
                var is2Pixels = helpers.getState('2-pixels', 0);
                expect(is2Pixels).toEqual(true);
                helpers.handleClick('3-pixels', null, 0);
                expect(renderer.lineWidth).toEqual(3);
                var is3Pixels = helpers.getState('3-pixels', 0);
                expect(is3Pixels).toEqual(true);
                helpers.handleClick('4-pixels', null, 0);
                expect(renderer.lineWidth).toEqual(4);
                var is4Pixels = helpers.getState('4-pixels', 0);
                expect(is4Pixels).toEqual(true);
                helpers.handleClick('5-pixels', null, 0);
                expect(renderer.lineWidth).toEqual(5);
                var is5Pixels = helpers.getState('5-pixels', 0);
                expect(is5Pixels).toEqual(true);

                // line style
                helpers.handleClick('Line', null, 0);
                expect(renderer.lineStroke).not.toEqual('');
                expect(renderer.pointColor).toEqual('');
                expect(renderer.barFill).toEqual('');
                expect(renderer.areaFill).toEqual('');
                var isLine = helpers.getState('Line', 0);
                expect(isLine).toEqual(true);

                helpers.handleClick('Point', null, 0);
                expect(renderer.lineStroke).toEqual('');
                expect(renderer.pointColor).not.toEqual('');
                expect(renderer.barFill).toEqual('');
                expect(renderer.areaFill).toEqual('');
                var isPoint = helpers.getState('Point', 0);
                expect(isPoint).toEqual(true);

                helpers.handleClick('Line & Point', null, 0);
                expect(renderer.lineStroke).not.toEqual('');
                expect(renderer.pointColor).not.toEqual('');
                expect(renderer.barFill).toEqual('');
                expect(renderer.areaFill).toEqual('');
                var isLineAndPoint = helpers.getState('Line & Point', 0);
                expect(isLineAndPoint).toEqual(true);

                helpers.handleClick('Bar', null, 0);
                expect(renderer.lineStroke).toEqual('');
                expect(renderer.pointColor).toEqual('');
                expect(renderer.barFill).not.toEqual('');
                expect(renderer.areaFill).toEqual('');
                var isBar = helpers.getState('Bar', 0);
                expect(isBar).toEqual(true);

                helpers.handleClick('Fill', null, 0);
                expect(renderer.lineStroke).toEqual('');
                expect(renderer.pointColor).toEqual('');
                expect(renderer.barFill).toEqual('');
                expect(renderer.areaFill).not.toEqual('');
                var isFill = helpers.getState('Fill', 0);
                expect(isFill).toEqual(true);

                // line shape
                helpers.handleClick('Ellipse', null, 0);
                expect(renderer.pointShape).toEqual('ellipse');
                var isEllipse = helpers.getState('Ellipse', 0);
                expect(isEllipse).toEqual(true);
                helpers.handleClick('Rectangle', null, 0);
                expect(renderer.pointShape).toEqual('rectangle');
                var isRect = helpers.getState('Rectangle', 0);
                expect(isRect).toEqual(true);
                helpers.handleClick('Diamond', null, 0);
                expect(renderer.pointShape).toEqual('diamond');
                var isDiamond = helpers.getState('Diamond', 0);
                expect(isDiamond).toEqual(true);
                helpers.handleClick('Cross', null, 0);
                expect(renderer.pointShape).toEqual('cross');
                var isCross = helpers.getState('Cross', 0);
                expect(isCross).toEqual(true);
                helpers.handleClick('Plus', null, 0);
                expect(renderer.pointShape).toEqual('plus');
                var isPlus = helpers.getState('Plus', 0);
                expect(isPlus).toEqual(true);

                // line style
                helpers.handleClick('No style', null, 0);
                expect(renderer.lineStyle).toEqual('');
                var isStyle = helpers.getState('No style', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Solid', null, 0);
                expect(renderer.lineStyle).toEqual('solid');
                isStyle = helpers.getState('Solid', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Dot', null, 0);
                expect(renderer.lineStyle).toEqual('dot');
                isStyle = helpers.getState('Dot', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Dot-dash', null, 0);
                expect(renderer.lineStyle).toEqual('dashdot');
                isStyle = helpers.getState('Dot-dash', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Medium dash', null, 0);
                expect(renderer.lineStyle).toEqual('mediumdash');
                isStyle = helpers.getState('Medium dash', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Large dash', null, 0);
                expect(renderer.lineStyle).toEqual('largedash');
                isStyle = helpers.getState('Large dash', 0);
                expect(isStyle).toEqual(true);

                helpers.handleClick('Color', { hex: 'ff00ff' }, 0);
                expect(renderer.areaFill).toEqual('#ff00ff');
                var color = helpers.getState('Color', 0);
                expect(color).toEqual('#ff00ff');

                helpers.handleClick('Hover', true, 0);
                expect(helpers.getPlot(0).enableHover).toEqual(true);

            }, function () {
                webAppHelper.removeNIElement(controlId);
                webAppHelper.removeNIElement(graphId);
            });
        });
    });

    describe('content not added until legend is first visible', function () {
        var viewModel;

        beforeEach(function (done) {
            settings.visible = false;
            plotLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                plotLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
                var style = window.getComputedStyle(plotLegendElement);
                expect(style.visibility).toEqual('hidden');
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        xit('verifies content', function (done) {
            plotLegendElement.plotAdded();

            testHelpers.runMultipleAsync(done, function () {
                expect(plotLegendElement.nPlots).toEqual(1);
                var div = plotLegendElement.firstChild;
                var tbl = div.firstChild;
                expect(tbl.childNodes.length).toEqual(0);

                webAppHelper.dispatchMessage(controlId, { visible: true });

            }, function () {
                var div = plotLegendElement.firstChild;
                var tbl = div.firstChild;
                expect(tbl.childNodes.length).toEqual(1);
            });
        });
    });
});
