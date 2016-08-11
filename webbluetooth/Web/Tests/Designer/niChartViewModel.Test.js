//****************************************
// Tests for the ChartViewModel class
// National Instruments Copyright 2014
//****************************************

describe('A ChartViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var chartId = 'Function1';
    var axis1, axis2, chart, chartElementSettings;
    var axis1Id = 'Function13',
        axis2Id = 'Function12';

    var viModel, frontPanelControls, chartModel, chartElement, chartSettings;
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
        chart = {
            niControlId: chartId,
            kind: NationalInstruments.HtmlVI.Models.ChartModel.MODEL_KIND,
            left: '270px',
            top: '150px',
            width: '750px',
            height: '300px',
            visible: true
        };

        chartSettings = {
            niControlId: chartId,
            kind: NationalInstruments.HtmlVI.Models.ChartModel.MODEL_KIND,
            left: '100px',
            top: '200px',
            width: '300px',
            height: '400px',
            visible: true
        };

        chartElementSettings = {
            'ni-control-id': chartId,
            'buffer-size': 123,
            style: '\"left: 100px; top: 200px; width: 300px; height: 400px;\"',
            visible: true
        };
    });

    afterAll(function (done) {
        webAppHelper.removeWebAppFixture(done);
    });

    it('allows creation with default chartSettings', function (done) {
        chartElement = webAppHelper.createNIElement(chart);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            chartModel = frontPanelControls[chartId];
            expect(chartModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(chartId);
            expect(viewModel).toBeDefined();

            webAppHelper.removeNIElement(chartId);
        });
    });

    it('allows creation of a chart with a different history buffer size', function (done) {
        chartElement = webAppHelper.createNIElement({
            niControlId: chartId,
            kind: NationalInstruments.HtmlVI.Models.ChartModel.MODEL_KIND,
            left: '270px',
            top: '150px',
            width: '750px',
            height: '300px',
            bufferSize: 128
        });
        webAppHelper.createNIElement(axis1, chartId);
        webAppHelper.createNIElement(axis2, chartId);

        testHelpers.runAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            chartModel = frontPanelControls[chartId];
            expect(chartModel.historySize).toBe(128);
            expect(chartElement.getHistoryBuffer().capacity).toBe(128);

            webAppHelper.removeNIElement(chartId);
        });
    });

    it('allows to call the setMultipleProperties method with a property update', function (done) {
        chartElement = webAppHelper.createNIElement({
            niControlId: chartId,
            kind: NationalInstruments.HtmlVI.Models.ChartModel.MODEL_KIND,
            left: '270px',
            top: '150px',
            width: '750px',
            height: '300px'
        });

        testHelpers.runMultipleAsync(done, function () {
            frontPanelControls = viModel.getAllControlModels();
            chartModel = frontPanelControls[chartId];
            expect(chartModel).toBeDefined();
            var viewModel = viModel.getControlViewModel(chartId);
            expect(viewModel).toBeDefined();
            chartModel.setMultipleProperties(chartSettings);
        }, function () {
            // TODO mraj it never verifies any chartSettings after calling setMultipleProperties

            webAppHelper.removeNIElement(chartId);
        });
    });

    it('allows a chart element to be added directly to the page.', function (done) {
        var chartElementStr =  '<ni-chart ' +
            Object.keys(chartElementSettings).map(function (key) {
                return key + '=' + chartElementSettings[key];
            }).join(' ') +
            '></ni-chart>';

        $(document.body).append(chartElementStr);

        testHelpers.runAsync(done, function () {
            var model = viModel.getControlModel(chartId);
            expect(model.historySize).toBe(123);

            webAppHelper.removeNIElement(chartId);
        });
    });
});
