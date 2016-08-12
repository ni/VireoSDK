/* Flot plugin that makes charting easier and more efficient.

Copyright (c) 2007-2015 National Instruments
Licensed under the MIT license.
*/
/*global jQuery, requestAnimationFrame*/

(function ($) {
    'use strict';

    // flot hook which decimates the data from the historyBuffer and converts it into a format that flot understands
    function processRawData(plot, dataSeries) {
        var indexMap; // this a "dictionary" from 0 based indexes in the history buffer to target values
        if (dataSeries.historyBuffer) {
            var hb = dataSeries.historyBuffer;
            var size = hb.buffer.size;
            indexMap = hb.indexMap;
            var width = plot.width();
            var step;

            if (width > 0) {
                step = Math.floor(size / plot.width());
            } else {
                step = Math.floor(size / 500);
            }

            var index = plot.getData().indexOf(dataSeries);
            dataSeries.data = dataSeries.historyBuffer.query(hb.startIndex(), hb.lastIndex(), step, index);
            if (indexMap) {
                dataSeries.data.forEach(function (sample) {
                    sample[0] = indexMap[sample[0]];
                });
            }
        }
    }

    // remove old data series and trigger the computation of a new one from the history buffer
    function updateSeries(plot, historyBuffer) {
        var dataSeries = plot.getData();
        for (var i = 0; i < historyBuffer.width; i++) {
            if (typeof dataSeries[i] === 'object') {
                dataSeries[i].data = [];
            } else {
                dataSeries[i] = [];
            }
        }

        plot.setData(dataSeries);
    }

    // draw the chart
    function drawChart(plot) {
        plot.setupGrid();
        plot.draw();
    }

    // called on every history buffer change.
    function triggerDataUpdate(plot, historyBuffer) {
        if (!plot.dataUpdateTriggered) {
            plot.dataUpdateTriggered = requestAnimationFrame(function () { // throttle charting computation/drawing to the browser frame rate
                updateSeries(plot, historyBuffer);
                drawChart(plot);
                plot.dataUpdateTriggered = null;
            });
        }
    }

    // plugin entry point
    function init(plot) {
        plot.hooks.processOptions.push(function (plot) {
            var historyBuffer = plot.getOptions().series.historyBuffer; // looks for the historyBuffer option
            if (historyBuffer) {
                plot.hooks.processRawData.push(processRawData); // enable charting plugin for this flot chart
                historyBuffer.onChange(function () {
                    triggerDataUpdate(plot, historyBuffer); // call triggerDataUpdate on every historyBuffer modification
                });
                updateSeries(plot, historyBuffer);
            }
        });
    }

    $.plot.plugins.push({
        init: init,
        name: 'charting',
        version: '0.3'
    });
})(jQuery);
