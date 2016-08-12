//****************************************
// Tests for ScaleLegendModel class
// National Instruments Copyright 2014
//****************************************
/*globals xit*/
describe('A ScaleLegendViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';
    var graphId = 'graph1';
    var axis1Id = 'axis1';
    var axis2Id = 'axis2';
    var axis1;
    var axis2;
    var graph;

    var viModel, frontPanelControls, scaleLegendModel, scaleLegendElement, settings, updateSettings;
    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        settings = {
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.ScaleLegendModel.MODEL_KIND,
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
            height: '400px'
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows elements to be added directly to the page.', function (done) {
        $(document.body).append('<ni-scale-legend ni-control-id="' + controlId + '" graph-name="' + graphId + '"></ni-scale-legend>');
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
        scaleLegendElement = webAppHelper.createNIElement(settings);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            scaleLegendModel = frontPanelControls[controlId];
            var val = scaleLegendModel.isInEditMode;
            expect(val).toEqual(false);
            scaleLegendModel.isInEditMode = true;
            val = scaleLegendModel.isInEditMode;
            expect(val).toEqual(true);

            var name = scaleLegendModel.graphName;
            expect(name).toEqual('graph1');
            scaleLegendModel.graphName = 'fred';
            name = scaleLegendModel.graphName;
            expect(name).toEqual('fred');

            webAppHelper.removeNIElement(controlId);
        });
    });

    describe('dynamically updates properties triggering ModelPropertyChanged', function () {
        var viewModel;

        beforeEach(function (done) {
            scaleLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                scaleLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('verifies initial values', function () {
            expect(scaleLegendModel).toBeDefined();
            expect(viewModel).toBeDefined();
            expect(scaleLegendElement.isInEditMode).toEqual(false);
        });

        it('updates content, value, momentary, and clickMode', function (done) {
            webAppHelper.dispatchMessage(controlId, updateSettings);

            testHelpers.runAsync(done, function () {
                expect(scaleLegendElement.isInEditMode).toEqual(true);
                expect(scaleLegendElement.graphName).toEqual('graph2');
                expect(scaleLegendModel.fontSize).toEqual('20px');
                expect(scaleLegendModel.fontFamily).toEqual('sans-serif');
                expect(scaleLegendModel.fontWeight).toEqual('bold');
                expect(scaleLegendModel.fontStyle).toEqual('italic');
            });
        });
    });

    describe('add and remove rows', function () {
        var viewModel;

        beforeEach(function (done) {
            scaleLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                scaleLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        it('verifies add and remove row', function () {
            scaleLegendElement.scaleAdded();
            expect(scaleLegendElement.nScales).toEqual(1);
            scaleLegendElement.scaleRemoved({ label: '' });
            expect(scaleLegendElement.nScales).toEqual(0);
        });

    });

    describe('test the helpers', function () {
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
            scaleLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                var frontPanelControls = viModel.getAllControlModels();
                var scaleLegendModel = frontPanelControls[controlId];
                var graphModel = frontPanelControls[graphId];
                var axis1ViewModel = viModel.getControlViewModel(axis1Id);

                expect(graphModel).toBeDefined();
                expect(scaleLegendModel).toBeDefined();

                var helpers = scaleLegendElement.helpers;
                var scale = helpers.getScale(0);
                expect(scale.niControlId).toEqual(axis1ViewModel.model.niControlId);
                var index = helpers.scaleToIndex(scale);
                expect(index).toEqual(0);
                var autoscale = scale.autoScale;
                helpers.handleClick('lock', 0);
                expect(scale.autoScale).toEqual(!autoscale);
                var name = helpers.getState('name', 0);
                expect(name).toEqual('Amplitude');

                webAppHelper.removeNIElement(controlId);
                webAppHelper.removeNIElement(graphId);
            });
        });
    });

    describe('content not added until legend is first visible', function () {
        var viewModel;

        beforeEach(function (done) {
            settings.visible = false;
            scaleLegendElement = webAppHelper.createNIElement(settings);

            testHelpers.runAsync(done, function () {
                frontPanelControls = viModel.getAllControlModels();
                scaleLegendModel = frontPanelControls[controlId];
                viewModel = viModel.getControlViewModel(controlId);
            });
        });

        afterEach(function () {
            webAppHelper.removeNIElement(controlId);
        });

        xit('verifies add and remove row', function (done) {
            scaleLegendElement.scaleAdded();

            testHelpers.runMultipleAsync(done, function () {
                expect(scaleLegendElement.nScales).toEqual(1);
                var div = scaleLegendElement.firstChild;
                var tbl = div.firstChild;
                expect(tbl.childNodes.length).toEqual(0);
                webAppHelper.dispatchMessage(controlId, { visible: true });

            }, function () {
                var div = scaleLegendElement.firstChild;
                var tbl = div.firstChild;
                expect(tbl.childNodes.length).toEqual(1);
            });
        });

    });
});
