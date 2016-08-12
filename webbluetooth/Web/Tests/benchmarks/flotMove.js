/*global suite: false, benchmark: false, createChart, generateChartData, setChartPosition, setImmediate */

suite('Flot Chart raw move performance', function () {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;

    var outerDiv = '<div id="outerDiv" style="display:inline-block;width:1000px;height:800px;"> </div>';
    var chartDiv = '<div id="chartDiv" style="display:inline-block;width:600px;height:350px;border: 1px solid black;"> </div>';

    var ChartPosition = {
        x: 0,
        y: 0,
        increment: 1
    };
    var chart;

    function createChartDiv(div) {
        $('body').append(outerDiv);
        $('#outerDiv').html(chartDiv);
        var chartData = generateChartData(100);
        return createChart(div, chartData);
    }

    function moveChart() {
        ChartPosition.x += ChartPosition.increment;

        if (ChartPosition.x > 200) {
            ChartPosition.increment = -1;
        }

        if (ChartPosition.x < 1) {
            ChartPosition.increment = 1;
        }

        setChartPosition('chartDiv', chart, ChartPosition.x, ChartPosition.y);
    }

    benchmark('raw Flot move speed',
              function (deferred) {
        if (!chart) {
            chart = createChartDiv('chartDiv');
        }

        moveChart(); // move the chart
        setImmediate(function () { // yield to the browser so it can actually render the chart
            deferred.resolve();
        });
    }, {
        defer: true
    });

}, {
    onComplete: function () {
        'use strict';
        // Static Private Reference Aliases
        var $ = NationalInstruments.Globals.jQuery;
        $('#outerDiv').remove();
    }
});
