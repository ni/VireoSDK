/* globals xit */
// TODO mraj remove when test enabled

//****************************************
// Tests for CursorLegendModel class
// National Instruments Copyright 2014
//****************************************

describe('A CursorLegendViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';
    var graphId = 'graph1';
    var axis1Id = 'axis1';
    var axis2Id = 'axis2';
    var cursor1Id = 'cursor1';
    var plot1Id = 'plot1';
    var renderer1Id = 'renderer';
    var axis1;
    var axis2;
    var cursor1;
    var plot1;
    var renderer1;
    var graph;

    var viModel, frontPanelControls, cursorLegendModel, cursorLegendElement, settings, updateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.CursorLegendModel.MODEL_KIND,
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
            autoCursor: false,
            logCursor: false,
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
            autoCursor: false,
            logCursor: false,
            niControlId: axis2Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianAxisModel.MODEL_KIND
        };
        plot1 = {
            xaxis: axis1Id,
            yaxis: axis2Id,
            niControlId: plot1Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianPlotModel.MODEL_KIND
        };

        cursor1 = {
            label: cursor1Id,
            show: true,
            showLabel: true,
            showValue: false,
            cursorColor: 'black',
            targetShape: 'ellipse',
            snapToData: false,
            crosshairStyle: 'vertical',
            niControlId: cursor1Id,
            kind: NationalInstruments.HtmlVI.Models.CursorModel.MODEL_KIND
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
        $(document.body).append('<ni-cursor-legend ni-control-id="' + controlId + '" graph-name="' + graphId + '"></ni-cursor-legend>');
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
        cursorLegendElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            cursorLegendModel = frontPanelControls[controlId];
            var val = cursorLegendModel.isInEditMode;
            expect(val).toEqual(false);
            cursorLegendModel.isInEditMode = true;
            val = cursorLegendModel.isInEditMode;
            expect(val).toEqual(true);

            var name = cursorLegendModel.graphName;
            expect(name).toEqual('graph1');
            cursorLegendModel.graphName = 'fred';
            name = cursorLegendModel.graphName;
            expect(name).toEqual('fred');

            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('dynamically updates properties triggering ModelPropertyChanged', function () {
        var viewModel;

        beforeEach(function (done) {
            cursorLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                cursorLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function (done) {
            webAppHelper.removeNIElement(controlId);

            testHelpers.runAsync(done, function () {
                expect(Object.keys(viModel.getAllControlModels()).length).toBe(0);
            });
        });

        it('verifies initial values', function () {
            expect(cursorLegendModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(cursorLegendElement.isInEditMode).toEqual(false);
        });

        it('updates graphName and isInEditMode', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(cursorLegendElement.isInEditMode).toEqual(true);
                expect(cursorLegendElement.graphName).toEqual('graph2');
                expect(cursorLegendModel.fontSize).toEqual('20px');
                expect(cursorLegendModel.fontFamily).toEqual('sans-serif');
                expect(cursorLegendModel.fontWeight).toEqual('bold');
                expect(cursorLegendModel.fontStyle).toEqual('italic');
            });
        });
    });

    describe('add and remove rows', function () {
        var viewModel;

        beforeEach(function (done) {
            cursorLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                cursorLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        xit('verifies add and remove row', function () {
            cursorLegendElement.cursorAdded();
            expect(cursorLegendElement.nCursors).toEqual(1);
            cursorLegendElement.cursorRemoved({ label: '' });
            expect(cursorLegendElement.nCursors).toEqual(0);
        });

    });

    describe('test the helpers', function () {
        it('inner', function (done) {
            var cursorLegendElement;

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
            webAppHelper.createNIElement(cursor1, graphId);
            cursorLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runMultipleAsync(done, function () {
                var frontPanelControls = viModel.getAllControlModels();
                var cursorLegendModel = frontPanelControls[controlId];
                var graphModel = frontPanelControls[graphId];

                expect(graphModel).toBeDefined();
                expect(cursorLegendModel).toBeDefined();

                var helpers = cursorLegendElement.helpers;
                var cursor = helpers.getCursor(0);
                var index = helpers.cursorToIndex(cursor);
                expect(index).toEqual(0);
                // target shape
                helpers.handleClick('Ellipse', null, 0);
                expect(cursor.targetShape).toEqual('ellipse');
                var isStyle = helpers.getState('Ellipse', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Rectangle', null, 0);
                expect(cursor.targetShape).toEqual('rectangle');
                isStyle = helpers.getState('Rectangle', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Diamond', null, 0);
                expect(cursor.targetShape).toEqual('diamond');
                isStyle = helpers.getState('Diamond', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Cross', null, 0);
                expect(cursor.targetShape).toEqual('cross');
                isStyle = helpers.getState('Cross', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Plus', null, 0);
                expect(cursor.targetShape).toEqual('plus');
                isStyle = helpers.getState('Plus', 0);
                expect(isStyle).toEqual(true);
                var shape = helpers.getTargetShape(0);
                expect(shape).toEqual('plus');

                // cross hair style
                helpers.handleClick('No style', null, 0);
                expect(cursor.crosshairStyle).toEqual('none');
                isStyle = helpers.getState('No style', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Vertical', null, 0);
                expect(cursor.crosshairStyle).toEqual('vertical');
                isStyle = helpers.getState('Vertical', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Horizontal', null, 0);
                expect(cursor.crosshairStyle).toEqual('horizontal');
                isStyle = helpers.getState('Horizontal', 0);
                expect(isStyle).toEqual(true);
                helpers.handleClick('Both', null, 0);
                expect(cursor.crosshairStyle).toEqual('both');
                isStyle = helpers.getState('Both', 0);
                expect(isStyle).toEqual(true);
                var crosshair = helpers.getCrosshair(0);
                expect(crosshair).toEqual('both');

                helpers.handleClick('Color', { hex: 'ff00ff' }, 0);
                expect(cursor.cursorColor).toEqual('#ff00ff');
                var color = helpers.getState('Color', 0);
                expect(color).toEqual('#ff00ff');

                helpers.handleClick('visible', null, 0);
                expect(cursor.show).toEqual(false);
                var visible = helpers.getState('visible', 0);
                expect(visible).toEqual(false);
                helpers.handleClick('visible', null, 0);

                helpers.handleClick('snap', null, 0);
                expect(cursor.snapToData).toEqual(true);
                visible = helpers.getState('snap', 0);
                expect(visible).toEqual(true);

                helpers.handleClick('center', null, 0);
                expect(cursor.x).toEqual(0.5);
                expect(cursor.y).toEqual(0.5);

                webAppHelper.removeNIElement(controlId);
                webAppHelper.removeNIElement(graphId);

            }, function () {
                expect(Object.keys(viModel.getAllControlModels()).length).toBe(0);
            });
        });
    });

    describe('test the helpers add and remove cursors', function () {
        it('inner add and remove', function (done) {
            var cursorLegendElement;

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
            webAppHelper.createNIElement(cursor1, graphId);
            cursorLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runMultipleAsync(done, function () {
                var helpers = cursorLegendElement.helpers;
                helpers.addCursor();
            }, function () {
                var helpers = cursorLegendElement.helpers;
                expect(cursorLegendElement.nCursors).toEqual(2);
                helpers.deleteCursor(1);
            }, function () {
                expect(cursorLegendElement.nCursors).toEqual(1);
            }, function () {
                webAppHelper.removeNIElement(controlId);
                webAppHelper.removeNIElement(graphId);
            }, function () {
                expect(Object.keys(viModel.getAllControlModels()).length).toBe(0);
            });
        });
    });
});
