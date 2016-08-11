//****************************************
// Tests for CartesianAxisViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A CartesianAxisViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var graphElement;
    var graphId = 'Function1';
    var axis1, axis2, axis1Settings, axis1ElementSettings;
    var axis1Id = 'Function13',
        axis2Id = 'Function12';

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
            minimum: 0,
            maximum: 10,
            autoScale: false,
            logScale: false,
            niControlId: axis1Id,
            kind: NationalInstruments.HtmlVI.Models.CartesianAxisModel.MODEL_KIND
        };

        axis1Settings = {
            label: 'Amplitude1',
            show: false,
            showLabel: false,
            axisPosition: 'right',
            minimum: 10,
            maximum: 100,
            autoScale: true,
            logScale: true
        };

        axis1ElementSettings = {
            'label': 'Amplitude1',
            show: false,
            'show-label': false,
            'axis-position': 'right',
            minimum: 10,
            maximum: 100,
            'auto-scale': true,
            'log-scale': true,
            'ni-control-id': axis1Id
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
            axisModel.setMultipleProperties({label: 'newName'});
        }, function () {
            var axisModel = frontPanelControls[axis1Id];
            expect(axisModel).toBeDefined();
            expect(axisModel.label).toBe('newName');
            var axisViewModel = viModel.getControlViewModel(axis1Id);
            expect(axisViewModel).toBeDefined();

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('updates the Model when properties change.', function (done) {
        webAppHelper.createNIElement(graph);
        webAppHelper.createNIElement(axis1, graphId);
        webAppHelper.createNIElement(axis2, graphId);

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

    it('allows an axis element to be added directly to the page.', function (done) {
        graphElement = webAppHelper.createNIElement(graph);

        var axisElementStr =  '<ni-cartesian-axis ' +
        Object.keys(axis1ElementSettings).map(function (key) {
            return key + '=' + axis1ElementSettings[key];
        }).join(' ') +
        '></ni-cartesian-axis>';

        $(graphElement).append(axisElementStr);

        testHelpers.runAsync(done, function () {
            var model = viModel.getControlModel(axis1Id);
            expect(model.label).toBe('Amplitude1');
            expect(model.show).toBe(false);
            expect(model.showLabel).toBe(false);
            expect(model.minimum).toBe(10);
            expect(model.maximum).toBe(100);
            expect(model.autoScale).toBe(true);
            expect(model.logScale).toBe(true);

            webAppHelper.removeNIElement(graphId);
        });
    });
});
