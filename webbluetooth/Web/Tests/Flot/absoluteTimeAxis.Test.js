/* global describe, it, beforeEach, afterEach, expect, setFixtures */
/* jshint browser: true*/

describe('A Flot chart with absolute time axes', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var plot;
    var placeholder;
    var tzDiff = (new Date(2010, 1, 1)).getTimezoneOffset() * 60;

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

    var createPlotWithAbsoluteTimeAxis = function (placeholder, data) {
        return $.plot(placeholder, data, {
            xaxis: {
                format: 'time',
                timeformat: '%A'
            },
            yaxis: {}
        });
    };

    it('shows time ticks', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[0 + tzDiff, 1], [1 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 0 + tzDiff, label: '12:00:00.000 AM<br>1/1/0001'},
            {v: 1 + tzDiff, label: '12:00:01.000 AM<br>1/1/0001'}
        ]);
    });

    it('shows time bigger than 1 second correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[1 + tzDiff, 1], [2 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 1 + tzDiff, label: '12:00:01.000 AM<br>1/1/0001'},
            {v: 2 + tzDiff, label: '12:00:02.000 AM<br>1/1/0001'}
        ]);

    });

    it('shows time bigger than 1 minute correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[60 + tzDiff, 1], [70 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 60 + tzDiff, label: '12:01:00 AM<br>1/1/0001'},
            {v: 70 + tzDiff, label: '12:01:10 AM<br>1/1/0001'}
        ]);
    });

    it('shows time bigger than 1 hour correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[3600 + tzDiff, 1], [3610 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 3600 + tzDiff, label: '1:00:00 AM<br>1/1/0001'},
            {v: 3610 + tzDiff, label: '1:00:10 AM<br>1/1/0001'}
        ]);
    });

    it('shows time bigger than 1 day correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[86400 + tzDiff, 1], [86410 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 86400 + tzDiff, label: '12:00:00 AM<br>1/2/0001'},
            {v: 86410 + tzDiff, label: '12:00:10 AM<br>1/2/0001'}
        ]);
    });

    it('shows time bigger than 1 month correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[2764800 + tzDiff, 1], [2764810 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 2764800 + tzDiff, label: '12:00:00 AM<br>2/2/0001'},
            {v: 2764810 + tzDiff, label: '12:00:10 AM<br>2/2/0001'}
        ]);
    });

    it('shows time bigger than 1 year correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[31536000 + tzDiff, 1], [31536010 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 31536000 + tzDiff, label: '12:00:00 AM<br>1/1/0002'},
            {v: 31536010 + tzDiff, label: '12:00:10 AM<br>1/1/0002'}
        ]);
    });

    it('shows time with milliseconds resolution correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[0.001 + tzDiff, 0.1], [0.002 + tzDiff, 0.2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: 0.001 + tzDiff, label: '12:00:00.001 AM<br>1/1/0001'},
            {v: 0.002 + tzDiff, label: '12:00:00.002 AM<br>1/1/0001'}
        ]);
    });

    it('shows small negative time correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[-0.001 + tzDiff, 0.1], [-0.002 + tzDiff, 0.2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: -0.002 + tzDiff, label: '11:59:59.998 PM<br>12/31/0000'},
            {v: -0.001 + tzDiff, label: '11:59:59.999 PM<br>12/31/0000'}
        ]);
    });

    it('shows big negative time correctly', function () {
        plot = createPlotWithAbsoluteTimeAxis(placeholder, [[[-31536000 * 2 + tzDiff, 1], [-31536010 * 2 + tzDiff, 2]]]);

        expect(firstAndLast(plot.getAxes().xaxis.ticks)).toEqual([
            {v: -31536010 * 2 + tzDiff, label: '11:59:40 PM<br>1/1/-0001'},
            {v: -31536000 * 2 + tzDiff, label: '12:00:00 AM<br>1/2/-0001'}
        ]);
    });
});
