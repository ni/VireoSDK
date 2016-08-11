/*global $: false, suite: false, benchmark: false, createChart, generateChartData, setChartSize, setImmediate*/

suite('Flot Chart raw resize performance', function () {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;

    var outerDiv = '<div id="outerDiv" style="display:inline-block;width:1000px;height:800px;"></div>';
    var chartDiv = '<div id="chartDiv" style="display:inline-block;width:600px;height:350px;border: 1px solid black;"></div>';

    var chartSize = {
            width: 640,
            height: 350,
            increment: 1
        },
        chart;

    function createChartDiv(div) {
        $('body').append(outerDiv);
        $('#outerDiv').html(chartDiv);
        var chartData = generateChartData(100);
        return createChart(div, chartData);
    }

    function resizeChart() {
        chartSize.width += chartSize.increment;
        chartSize.height += chartSize.increment;

        if (chartSize.width > 800) {
            chartSize.increment = -1;
        }

        if (chartSize.width < 600) {
            chartSize.increment = 1;
        }

        setChartSize('chartDiv', chart, chartSize.width, chartSize.height);
    }

    benchmark('raw Flot resize speed',
        function (deferred) {
            if (!chart) {
                chart = createChartDiv('chartDiv');
            }

            resizeChart(); // resize the chart
            setImmediate(function () { // yield to the browser so it can render the chart
                deferred.resolve();
            });
        }, {
            defer: true
        });
}, {
    onComplete: function () {
        'use strict';
        $('#outerDiv').remove();
    }
});
