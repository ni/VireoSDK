/* global setFixtures */

describe('A Flot Navigation plugin', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var plot;
    var placeholder;
    var plotOptions;
    var defaultData = [[[0, 0], [5, 10]]];

    beforeEach(function () {
        var fixture = setFixtures('<div style="width: 600px;height: 400px; position: absolute;">').get(0);
        placeholder = $('<div id="placeholder" style="width: 100%; height: 100%;">');
        placeholder.appendTo(fixture.children[0]);
        plotOptions = {
            xaxis: {
                show: true
            },
            yaxis: {
                show: true
            },
            pan: {
                interactive: false
            },
            zoom: {
                interactive: false
            }
        };
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
    });

    it('is available by default and the navigation methods are present', function () {
        plot = $.plot(placeholder, [[]], {});

        expect(typeof (plot.zoom)).toBe('function');
        expect(typeof (plot.zoomOut)).toBe('function');
        expect(typeof (plot.pan)).toBe('function');
    });

    describe('will pan if panning is enabled', function () {
        it('horizontally', function () {
            plotOptions.pan.interactive = true;
            plot = $.plot(placeholder, defaultData, plotOptions);

            var xmin = plot.getXAxes()[0].min,
                xmax = plot.getXAxes()[0].max,
                ymin = plot.getYAxes()[0].min,
                ymax = plot.getYAxes()[0].max;

            /*simulate pan with the mouse*/
            $(placeholder).find('.flot-overlay').simulate('drag', {dx: 300, dy: 0});

            expect(plot.getYAxes()[0].min).toBe(ymin);
            expect(plot.getYAxes()[0].max).toBe(ymax);
            expect(plot.getXAxes()[0].min).toBeLessThan(xmin);
            expect(plot.getXAxes()[0].max).toBeLessThan(xmax);
        });

        it('vertically', function () {
            plotOptions.pan.interactive = true;
            plot = $.plot(placeholder, defaultData, plotOptions);

            var xmin = plot.getXAxes()[0].min,
                xmax = plot.getXAxes()[0].max,
                ymin = plot.getYAxes()[0].min,
                ymax = plot.getYAxes()[0].max;

            /*simulate pan with the mouse*/
            $(placeholder).find('.flot-overlay').simulate('drag', {dx: 0, dy: 300});

            expect(plot.getXAxes()[0].min).toBe(xmin);
            expect(plot.getXAxes()[0].max).toBe(xmax);
            expect(plot.getYAxes()[0].min).toBeGreaterThan(ymin);
            expect(plot.getYAxes()[0].max).toBeGreaterThan(ymax);
        });
    });

    it('will not pan if pan is disabled', function () {
        plot = $.plot(placeholder, defaultData, plotOptions);

        var xmin = plot.getXAxes()[0].min,
            xmax = plot.getXAxes()[0].max,
            ymin = plot.getYAxes()[0].min,
            ymax = plot.getYAxes()[0].max;

        /*simulate pan with the mouse*/
        $(placeholder).find('.flot-overlay').simulate('drag', {dx: 300, dy: 300});

        expect(plot.getYAxes()[0].min).toBe(ymin);
        expect(plot.getYAxes()[0].max).toBe(ymax);
        expect(plot.getXAxes()[0].min).toBe(xmin);
        expect(plot.getXAxes()[0].max).toBe(xmax);
    });

    it('will zoom with the mouse scrollwheel if zoom enabled', function () {
        plotOptions.zoom.interactive = true;
        plot = $.plot(placeholder, defaultData, plotOptions);
        var offset = plot.offset();
        var w = plot.width();
        var h = plot.height();

        var xmin = plot.getXAxes()[0].min,
            xmax = plot.getXAxes()[0].max,
            ymin = plot.getYAxes()[0].min,
            ymax = plot.getYAxes()[0].max;

        /*simulate scrollwheel zoom with the mouse*/
        $(placeholder).find('.flot-overlay')
            .simulate('mousewheel', {clientX: offset.left + w / 2, clientY: offset.top + h / 2});

        expect(plot.getYAxes()[0].min).toBeGreaterThan(ymin);
        expect(plot.getYAxes()[0].max).toBeLessThan(ymax);
        expect(plot.getXAxes()[0].min).toBeGreaterThan(xmin);
        expect(plot.getXAxes()[0].max).toBeLessThan(xmax);
    });

    it('will not zoom with the mouse scrollwheel if zoom is disabled', function () {
        plot = $.plot(placeholder, defaultData, plotOptions);
        var offset = plot.offset();
        var w = plot.width();
        var h = plot.height();

        var xmin = plot.getXAxes()[0].min,
            xmax = plot.getXAxes()[0].max,
            ymin = plot.getYAxes()[0].min,
            ymax = plot.getYAxes()[0].max;

        /*simulate scrollwheel zoom with the mouse*/
        $(placeholder).find('.flot-overlay')
            .simulate('mousewheel', {clientX: offset.left + w / 2, clientY: offset.top + h / 2});

        expect(plot.getYAxes()[0].min).toBe(ymin);
        expect(plot.getYAxes()[0].max).toBe(ymax);
        expect(plot.getXAxes()[0].min).toBe(xmin);
        expect(plot.getXAxes()[0].max).toBe(xmax);
    });

    describe('smart mode', function () {
        it('will not disable autoscaling on the Y axis when panning on the horizontal direction', function () {
            plotOptions.pan.interactive = true;
            plotOptions.pan.mode = 'smart';
            plot = $.plot(placeholder, defaultData, plotOptions);

            /*simulate pan with the mouse*/
            $(placeholder).find('.flot-overlay').simulate('drag', {dx: 300});

            expect(plot.getOptions().yaxes[0].min).toBeUndefined();
            expect(plot.getOptions().yaxes[0].max).toBeUndefined();
        });

        it('will not disable autoscaling on the X axis when panning on the vertical direction', function () {
            plotOptions.pan.interactive = true;
            plotOptions.pan.mode = 'smart';
            plot = $.plot(placeholder, defaultData, plotOptions);

            /*simulate pan with the mouse*/
            $(placeholder).find('.flot-overlay').simulate('drag', {dy: 300});

            expect(plot.getOptions().xaxes[0].min).toBeNull();
            expect(plot.getOptions().xaxes[0].max).toBeNull();
        });

    });

});
