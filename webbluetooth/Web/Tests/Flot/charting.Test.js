/* global HistoryBuffer, setFixtures */
/* brackets-xunit: includes=../lib/cbuffer.js,../jquery.flot.historybuffer.js*,../jquery.flot.js,../jquery.flot.charting.js */

describe('A Flot chart', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var plot;
    var placeholder;

    beforeEach(function () {
        var fixture = setFixtures('<div style="width: 800px;height: 600px">').find('.demo-container').get(0);
        placeholder = $('<div id="placeholder" style="width: 100%;height: 100%">');
        placeholder.appendTo(fixture);
    });

    afterEach(function () {
        if (plot) {
            plot.shutdown();
        }
    });

    it('allows to specify a historyBuffer when creating the plot', function () {
        var hb = new HistoryBuffer(10, 1);
        hb.push(33);
        plot = $.plot(placeholder, [[]], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].data).toEqual([[0, 33]]);
    });

    it('keeps track of the total number of elements introduced in the buffer', function () {
        var hb = new HistoryBuffer(1, 1);
        hb.push(33);
        hb.push(34);
        plot = $.plot(placeholder, [[]], {
            series: {
                historyBuffer: hb
            }
        });

        expect(plot.getData()[0].data).toEqual([[1, 34]]);
    });
});
