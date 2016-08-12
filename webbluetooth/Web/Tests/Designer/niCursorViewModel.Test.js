//****************************************
// Tests for CursorViewModel class
// National Instruments Copyright 2014
//****************************************
/*globals xit*/
// TODO gleon Remove xit global.
describe('A CursorViewModel', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var graphId = 'Function1';
    var viModel, axis1, axis2, cursor1, graph1, cursor2ElementSettings, cursor1Settings;

    var axis1Id = 'Function13',
        axis2Id = 'Function12',
        cursor1Id = 'Function20',
        cursor2Id = 'Function21';

    var webAppHelper = testHelpers.createWebAppTestHelper();

    /* flot redraw overlay is triggered on a 1000/60 ms timeout.
    runMultipleAsync is scheduled on rafs and that means that the next animation frame
    can (and will ussualy) occur before the redraw overlay. This function forces a redraw overlay*/
    var forceCursorsUpdate = function () {
        var viewModel = viModel.getControlViewModel(graphId);
        var element = viewModel.element;
        var plot = $(element).data('chart');
        var ocontext = plot.getPlaceholder().find('.flot-overlay')[0].getContext('2d');
        plot.hooks.drawOverlay.forEach(function (hook) {
            hook.apply(plot, [plot].concat([ocontext]));
        });
    };

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

        cursor1 = {
            label: 'cursor1',
            show: true,
            showLabel: false,
            showValue: false,
            cursorColor: '#ff0000',
            targetShape: 'square',
            snapToData: false,
            crosshairStyle: 'both',
            x: 0.5,
            y: 0.5,
            fontSize: '16px',
            fontFamily: 'sans-serif',
            fontWeight: 'normal',
            fontStyle: 'normal',
            niControlId: cursor1Id,
            kind: NationalInstruments.HtmlVI.Models.CursorModel.MODEL_KIND
        };

        cursor1Settings = {
            label: 'cursor2',
            show: false,
            showLabel: true,
            showValue: true,
            cursorColor: '#ffff00',
            targetShape: 'ellipse',
            snapToData: true,
            crosshairStyle: 'vertical',
            x: 0.2,
            y: 0.3,
            fontSize: '20px',
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic'
        };

        cursor2ElementSettings = {
            'label': 'cursor2',
            show: false,
            'show-label': true,
            'show-value': true,
            'cursor-color': '#ffff00',
            'target-shape': 'ellipse',
            'snap-to-data': false,
            'crosshair-style': 'vertical',
            x: 0.2,
            y: 0.3,
            'ni-control-id': cursor2Id
        };

        graph1 = {
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
        webAppHelper.createNIElement(graph1);
        webAppHelper.createNIElement(cursor1, graphId);

        testHelpers.runAsync(done, function () {
            var viewModel = viModel.getControlViewModel(graphId);
            expect(viewModel).toBeDefined();

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('is positioned according to x and y coordinates', function (done) {
        webAppHelper.createNIElement(graph1);
        webAppHelper.createNIElement(axis1, graphId);
        webAppHelper.createNIElement(axis2, graphId);
        webAppHelper.createNIElement(cursor1, graphId);

        testHelpers.runMultipleAsync(done, function () {
            forceCursorsUpdate();
        }, function () {
            var viewModel = viModel.getControlViewModel(graphId);
            var element = viewModel.element;
            var plot = $(element).data('chart');

            var cursor = plot.getCursors()[0];
            expect(cursor.x).toBe(plot.width() / 2);
            expect(cursor.y).toBe(plot.height() / 2);

            webAppHelper.removeNIElement(graphId);
        });
    });

    // TODO DE7872 gleon Test disabled. There's a race condition between requestAnimationFrame
    // and a setTimeOut inside jquery.flot
    xit('can be moved programatically', function (done) {
        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
            webAppHelper.createNIElement(cursor1, graphId);
        }, function () {
            webAppHelper.createNIElement(graph1);
        }, function () {
            var model = viModel.getControlModel(cursor1Id);
            model.setMultipleProperties({x: 0.25, y: 0.75});
        }, function () {
            forceCursorsUpdate();
        }, function () {
            var viewModel = viModel.getControlViewModel(graphId);
            var element = viewModel.element;
            var plot = $(element).data('chart');

            var cursor = plot.getCursors()[0];
            expect(cursor.x).toBe(plot.width() * 0.25);
            expect(cursor.y).toBe(plot.height() * 0.75);
        }, function () {
            webAppHelper.removeNIElement(cursor1Id);
            webAppHelper.removeNIElement(axis2Id);
            webAppHelper.removeNIElement(axis1Id);
        }, function () {
            webAppHelper.removeNIElement(graphId);
        });
    });

    it('triggers cursorUpdated events on changes', function (done) {
        var triggered = false;
        var currentX = 0;
        var currentY = 0;

        webAppHelper.createNIElement(graph1);
        webAppHelper.createNIElement(axis1, graphId);
        webAppHelper.createNIElement(axis2, graphId);
        webAppHelper.createNIElement(cursor1, graphId);

        testHelpers.runMultipleAsync(done, function () {
            var viewModel = viModel.getControlViewModel(graphId);
            var element = viewModel.element;

            $(element).on('cursorUpdated', function (e, data) {
                triggered = true;
                currentX = data.x;
                currentY = data.y;
            });

            var model = viModel.getControlModel(cursor1Id);
            model.setMultipleProperties({x: 0.25, y: 0.75});
        }, function () {
            forceCursorsUpdate();
        }, function () {
            expect(triggered).toBe(true);

            webAppHelper.removeNIElement(graphId);
        });
    });

    // TODO DE7872 gleon Test disabled. There's a race condition between requestAnimationFrame
    // and a setTimeOut inside jquery.flot
    xit('the Model is updated when the cursor is moved', function (done) {
        testHelpers.runMultipleAsync(done, function () {
            webAppHelper.createNIElement(axis1, graphId);
            webAppHelper.createNIElement(axis2, graphId);
            webAppHelper.createNIElement(cursor1, graphId);
        }, function () {
            webAppHelper.createNIElement(graph1);
        }, function () {
            var viewModel = viModel.getControlViewModel(cursor1Id);
            var element = viewModel.element;
            element.x = 0.1234;
        }, function () {
            forceCursorsUpdate();
        }, function () {
            var model = viModel.getControlModel(cursor1Id);
            expect(model.x).toBe(0.1234);
        }, function () {
            webAppHelper.removeNIElement(cursor1Id);
            webAppHelper.removeNIElement(axis2Id);
            webAppHelper.removeNIElement(axis1Id);
        }, function () {
            webAppHelper.removeNIElement(graphId);
        });
    });

    // TODO DE7872 mraj there is a race condition that causes this test to intermitently fail on chrome, firefox, and phantonjs when updating x and y
    // It appears if Chrome dev tools is open the issue does not appear
    xit('updates the Model when properties change.', function (done) {
        webAppHelper.createNIElement(graph1);
        webAppHelper.createNIElement(axis1, graphId);
        webAppHelper.createNIElement(axis2, graphId);
        webAppHelper.createNIElement(cursor1, graphId);

        testHelpers.runMultipleAsync(done, function () {
            forceCursorsUpdate();
        }, function () {
            webAppHelper.dispatchMessage(cursor1Id, cursor1Settings);
        }, function () {
            var model = viModel.getControlModel(cursor1Id);
            Object.keys(cursor1Settings).forEach(function (key) {
                expect(model[key]).toBe(cursor1Settings[key]);
            });

            webAppHelper.removeNIElement(graphId);
        });
    });

    it('allows cursor element to be added directly to the page.', function (done) {
        webAppHelper.createNIElement(graph1);

        testHelpers.runMultipleAsync(done, function () {
            var viewModel = viModel.getControlViewModel(graphId);
            var element = viewModel.element;

            var cursorElementStr =  '<ni-cursor ' +
            Object.keys(cursor2ElementSettings).map(function (key) {
                return key + '=' + cursor2ElementSettings[key];
            }).join(' ') +
            '></ni-cursor>';

            $(element).append(cursorElementStr);
        }, function () {
            var model = viModel.getControlModel(cursor2Id);
            expect(model.label).toBe('cursor2');
            expect(model.show).toBe(false);
            expect(model.showValue).toBe(true);
            expect(model.cursorColor).toBe('#ffff00');
            expect(model.targetShape).toBe('ellipse');
            expect(model.snapToData).toBe(false);
            expect(model.crosshairStyle).toBe('vertical');
            expect(model.x).toBe(0.2);
            expect(model.y).toBe(0.3);

            webAppHelper.removeNIElement(graphId);
        });
    });

});
