//****************************************
// Tests for BooleangraphModel class
// National Instruments Copyright 2014
//****************************************

describe('A IntensityGraphViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var controlId = 'Function1';
    var axis1, axis2, axis3;
    var axis1Id = 'Function13',
        axis2Id = 'Function12',
        axis3Id = 'Function14';

    var viModel, frontPanelControls, graphModel, graphElement, settings;
    var value1 = [
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0],
                    [0, 0, 0, 0]
    ];

    var value2 = [
                    [2, 2, 2, 2],
                    [2, 2, 2, 2],
                    [2, 2, 2, 2],
                    [2, 2, 2, 2]
    ];

    var webAppHelper = testHelpers.createWebAppTestHelper();

    beforeAll(function (done) {
        webAppHelper.installWebAppFixture(done, function (newVIModel) {
            viModel = newVIModel;
        });
    });

    beforeEach(function () {
        axis1 = {
            label: 'Y',
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
            label: 'X',
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
        axis3 = {
            label: 'Color scale',
            show: true,
            showLabel: false,
            axisPosition: 'right',
            autoScale: false,
            lowColor: '#ffaacc',
            highColor: '#aaccff',
            markers: '[{"value":0,"color":"#000000"},{"value":50,"color":"#0000FF"},{"value":100,"color":"#FFFFFF"}]',
            niControlId: axis3Id,
            kind: NationalInstruments.HtmlVI.Models.ColorScaleModel.MODEL_KIND
        };
        settings = {
            niControlId: controlId,
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

    it('allows creation of graph with default settings and no axes', function (done) {
        graphElement = webAppHelper.createNIElement({
            niControlId: controlId,
            kind: NationalInstruments.HtmlVI.Models.IntensityGraphModel.MODEL_KIND,
            left: '270px',
            top: '150px',
            width: '750px',
            height: '300px',
            visible: true
        });

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(controlId);

            expect(viewModel).toBeDefined();
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows to call the ModelPropertyChanged method with a property update', function (done) {
        testHelpers.runMultipleAsync(done, function () {
            graphElement = webAppHelper.createNIElement({
                niControlId: controlId,
                kind: NationalInstruments.HtmlVI.Models.IntensityGraphModel.MODEL_KIND,
                left: '270px',
                top: '150px',
                width: '750px',
                height: '300px',
                visible: true
            });
        }, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            graphModel.setMultipleProperties({ value: value1 });
            var viewModel = viModel.getControlViewModel(controlId);
            expect(viewModel).toBeDefined();
            graphModel.setMultipleProperties(settings);

        }, function () {
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows creation of full graph', function (done) {
        testHelpers.runMultipleAsync(done, function () {
            graphElement = webAppHelper.createNIElement({
                niControlId: controlId,
                kind: NationalInstruments.HtmlVI.Models.IntensityGraphModel.MODEL_KIND,
                left: '270px',
                top: '150px',
                width: '750px',
                height: '300px',
                visible: true
            });
        }, function () {
            webAppHelper.createNIElement(axis2, controlId);
        }, function () {
            webAppHelper.createNIElement(axis3, controlId);
        }, function () {
            webAppHelper.createNIElement(axis1, controlId);
        }, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            expect(graphModel).toBeDefined();
            graphModel.setMultipleProperties({ value: value2 });
            var viewModel = viModel.getControlViewModel(controlId);
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);
            var axis3ViewModel = viModel.getControlViewModel(axis3Id);
            var element = viewModel.element;
            var axisX = $(element).find('.flot-x-axis');
            expect(axisX).toBeDefined();
            var tickLabels = $(axisX).find('.flot-tick-label');
            expect($(tickLabels).length).toBe(11);
            var axisY = $(element).find('.flot-y-axis');
            expect(axisY).toBeDefined();
            tickLabels = $(axisY).find('.flot-tick-label');
            expect($(tickLabels).length).toBe(12); // two axes the y and the color scale
            expect(viewModel).toBeDefined();
            expect(axis1ViewModel).toBeDefined();
            expect(axis2ViewModel).toBeDefined();
            expect(axis3ViewModel).toBeDefined();
        }, function () {
            webAppHelper.removeNIElement(axis1Id);
        }, function () {
            webAppHelper.removeNIElement(axis2Id);
        }, function () {
            webAppHelper.removeNIElement(axis3Id);
        }, function () {
            webAppHelper.removeNIElement(controlId);
        });
    });

    it('allows autoscaling of data', function (done) {
        axis1.autoScale = true;
        axis2.autoScale = true;

        testHelpers.runMultipleAsync(done, function () {
            graphElement = webAppHelper.createNIElement({
                niControlId: controlId,
                kind: NationalInstruments.HtmlVI.Models.IntensityGraphModel.MODEL_KIND,
                left: '270px',
                top: '150px',
                width: '750px',
                height: '300px',
                visible: true
            });
        }, function () {
            webAppHelper.createNIElement(axis2, controlId);
            webAppHelper.createNIElement(axis3, controlId);
            webAppHelper.createNIElement(axis1, controlId);
        }, function () {
            frontPanelControls = viModel.getAllControlModels();
            graphModel = frontPanelControls[controlId];
            graphModel.setMultipleProperties({ value: value2 });
        }, function () {
            var axis1ViewModel = viModel.getControlViewModel(axis1Id);
            var axis2ViewModel = viModel.getControlViewModel(axis2Id);
            var axis1Min = axis1ViewModel.element.getFlotAxis().min,
                axis1Max = axis1ViewModel.element.getFlotAxis().max,
                axis2Min = axis2ViewModel.element.getFlotAxis().min,
                axis2Max = axis2ViewModel.element.getFlotAxis().max;

            expect(axis1Min).toBe(0);
            expect(axis1Max >= 4 && axis1Max < 6).toBe(true);
            expect(axis2Min).toBe(0);
            expect(axis2Max >= 4 && axis2Max < 6).toBe(true);
        }, function () {
            webAppHelper.removeNIElement(axis1Id);
            webAppHelper.removeNIElement(axis2Id);
            webAppHelper.removeNIElement(axis3Id);
        }, function () {
            webAppHelper.removeNIElement(controlId);
        });
    });

});
