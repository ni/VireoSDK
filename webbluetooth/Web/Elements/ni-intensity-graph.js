//****************************************
// IntensityGraph Prototype
// DOM Registration: HTMLNIIntensityGraph
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.IntensityGraph = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static Private Variables
    var h = 50;
    var w = 100;
    var max = Math.sqrt(h * h + w * w);
    var count = 0;
    var parsedData = null;

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.dataRange = function () {
        if (parsedData === null || parsedData.length === 0) {
            return { dataMin: 0, dataMax: Math.sqrt(h * h + w * w) };
        } else {
            var tempMin = Math.min();
            var tempMax = Math.max();
            for (var i = 0; i < parsedData.length; i++) {
                var buf = parsedData[i];
                for (var j = 0; j < buf.length; j++) {
                    if (buf[j] > tempMax) {
                        tempMax = buf[j];
                    }

                    if (buf[j] < tempMin) {
                        tempMin = buf[j];
                    }
                }
            }

            return { dataMin: tempMin, dataMax: tempMax };
        }
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        this.autoScaleColor = false;

        // Private Instance Properties
        // None
    };

    proto.getSettings = function () {
        var settings = {
            series: {
                intensitymap: {
                    show: true,
                    legend: true
                }
            },
            axisLabels: {
                show: true
            },
            xaxes: [{}],
            yaxes: [{}]
        };

        return settings;
    };

    proto.configureGraph = function () {
        var i, j, gradient = [];
        var colorScaleMin, colorScaleMax;
        var cartesianGraphSettings = this.getSettings();
        var data = JSON.parse(this.value);
        cartesianGraphSettings.series.intensitymap.data =  data.length > 0 ? data : this.defaultData();
        cartesianGraphSettings.xaxes = [];
        cartesianGraphSettings.yaxes = [];
        for (i = 0; i < this.axes.length; i++) {
            var axis = this.axes[i];
            var a = axis.getViewConfig();

            if (a) {
                if (a.position && a.position === 'left') {
                    cartesianGraphSettings.yaxes.push(a);
                }

                if (a.position && a.position === 'bottom') {
                    cartesianGraphSettings.xaxes.push(a);
                }

                if (a.position && a.position === 'right') {
                    // this is the color scale
                    var markers = JSON.parse(a.markers);
                    for (j = 0; j < markers.length; j++) {
                        gradient[j] = { value: markers[j].value, color: markers[j].color };
                    }

                    if (a.autoScale === false) {
                        colorScaleMin = markers[0].value;
                        colorScaleMax = markers[markers.length - 1].value;
                        cartesianGraphSettings.series.intensitymap.min = colorScaleMin;
                        cartesianGraphSettings.series.intensitymap.max = colorScaleMax;
                    } else {
                        this.autoScaleColor = true;
                        var range = this.dataRange();
                        colorScaleMin = range.dataMin;
                        colorScaleMax = range.dataMax;
                        cartesianGraphSettings.series.intensitymap.min = range.dataMin;
                        cartesianGraphSettings.series.intensitymap.max = range.dataMax;
                    }

                    cartesianGraphSettings.series.intensitymap.gradient = gradient;
                    cartesianGraphSettings.series.intensitymap.lowColor = a.lowColor;
                    cartesianGraphSettings.series.intensitymap.highColor = a.highColor;
                }
            }
        }

        // add color scale
        cartesianGraphSettings.yaxes.push({
            position: 'right',
            show: false,
            min: -0,
            max: 50,
            reserveSpace: true,
            labelWidth: 50,
            labelHeight: 50
        });
        cartesianGraphSettings.yaxes.push({
            position: 'right',
            show: true,
            min: colorScaleMin,
            max: colorScaleMax
        });
        return cartesianGraphSettings;
    };

    proto.createArray = function (length) {
        var arr = new Array(length || 0),
            i = length;

        if (arguments.length > 1) {
            var args = Array.prototype.slice.call(arguments, 1);
            while (i--) {
                arr[length - 1 - i] = this.createArray.apply(this, args);
            }
        }

        return arr;
    };

    proto.rainbow = function (i, j, count) {
        var res = count + Math.sqrt(i * i + j * j);

        if (res > max) {
            res -= max;
        }

        return res;
    };

    proto.defaultData = function () {
        var iMap = this.createArray(w, h);
        for (var i = 0; i < w; i++) {
            for (var j = 0; j < h; j++) {
                if (i === w / 2) { // temporary to show hi and low color
                    iMap[i][j] = -1;
                } else if (i === w / 4) {
                    iMap[i][j] = max + 10;
                } else {
                    iMap[i][j] = this.rainbow(i, j, count);
                }
            }
        }

        count++;
        if (count > max) {
            count = 0;
        }

        return iMap;
    };

    proto.createData = function (plots, data) {
        var plotConfig = {};

        if (plots.length > 0) {
            plotConfig = plots[0].getViewConfig();
        }

        // the data is placed in the config not the series because it does not match the series data type (and converting it might be expensive)
        var graphdata = data.length > 0 ? data : this.defaultData();
        parsedData = graphdata;
        plotConfig.data = graphdata;
        var cartesianGraphData = [plotConfig];

        return cartesianGraphData;
    };

    proto.updateData = function () {
        var graph = this.graph;
        var data = this.createData(this.plots, JSON.parse(this.value));

        if (!this.autoScaleColor) {
            graph.setData(data);
            graph.setupGrid();
        } else {
            this.updateGraphConfig();
        }

        graph.draw();
    };

    proto.convertToFlotFormat = function (data) {
        return data;
    };

    proto.defineElementInfo(proto, 'ni-intensity-graph', 'HTMLNIIntensityGraph');
}(NationalInstruments.HtmlVI.Elements.IntensityGraph, NationalInstruments.HtmlVI.Elements.CartesianGraphBase));
