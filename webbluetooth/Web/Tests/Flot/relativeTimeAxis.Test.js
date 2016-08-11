/* global describe, it, beforeEach, afterEach, expect, setFixtures */
/* jshint browser: true*/

describe('A Flot chart with relative time axes', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var plot;
    var placeholder;

    beforeEach(function () {
        var fixture = setFixtures('<div id="demo-container" style="width: 800px;height: 600px">').find('#demo-container').get(0);

        placeholder = $('<div id="placeholder" style="width: 100%;height: 100%">');
        placeholder.appendTo(fixture);
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
    });

    var firstAndLast = function (arr) {
        return [arr[0], arr[arr.length - 1]];
    };

    var createPlotWithRelativeTimeAxis = function (placeholder, data) {
        return $.plot(placeholder, data, {
            xaxis: {
                format: 'time',
                timeformat: '%r'
            },
            yaxis: {}
        });
    };

    it('shows time ticks', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[0, 1], [1, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: 0, label: '00:00:00.000'}, {v: 1, label: '00:00:01.000'}]);
    });

    it('shows time bigger than 1 second correctly', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[1, 1], [2, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: 1, label: '00:00:01.000'}, {v: 2, label: '00:00:02.000'}]);
    });

    it('shows time bigger than 1 minute correctly', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[60, 1], [70, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: 60, label: '00:01:00'}, {v: 70, label: '00:01:10'}]);
    });

    it('shows time bigger than 1 hour correctly', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[3600, 1], [3610, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: 3600, label: '01:00:00'}, {v: 3610, label: '01:00:10'}]);
    });

    it('shows time bigger than 1 day correctly', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[86400, 1], [86410, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: 86400, label: '1.00:00:00'}, {v: 86410, label: '1.00:00:10'}]);
    });

    it('shows time bigger than 1 month correctly', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[2764800, 1], [2764810, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: 2764800, label: '32.00:00:00'}, {v: 2764810, label: '32.00:00:10'}]);
    });

    it('shows time with milliseconds resolution correctly', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[0.001, 0.1], [0.002, 0.2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: 0.001, label: '00:00:00.001'}, {v: 0.002, label: '00:00:00.002'}]);
    });

    it('shows negative time correctly', function () {
        plot = createPlotWithRelativeTimeAxis(placeholder, [[[-0.001, 0.1], [-0.002, 0.2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([{v: -0.002, label: '-00:00:00.002'}, {v: -0.001, label: '-00:00:00.001'}]);
    });
});
