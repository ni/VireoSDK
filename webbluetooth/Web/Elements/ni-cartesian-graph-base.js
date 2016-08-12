//****************************************
// Cartesian Graph Base Prototype
// DOM Registration: HTMLNICartesianGraph
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.CartesianGraphBase = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.getSettings = function () {
        var settings = {
            lines: {
                show: true,
                lineWidth: 2
            },
            canvas: true,
            series: {
                shadowSize: 0, // Drawing is faster without shadows
                downsample: {
                    threshold: 1000
                }
            },
            axisLabels: {
                show: true
            },
            xaxes: [{}],
            yaxes: [{}],
            zoom: {
                interactive: true,
                trigger: null
            },
            pan: {
                interactive: true
            },
            selection: {
                mode: null
            }
        };

        return settings;
    };

    proto.configureGraph = function () {
        var i;
        var cartesianGraphSettings = this.getSettings();
        if (this.plotAreaMargin !== '') {
            if (cartesianGraphSettings.grid === undefined) {
                cartesianGraphSettings.grid = {};
            }

            cartesianGraphSettings.grid.margin = JSON.parse(this.plotAreaMargin);
        }

        // Apply Settings from host
        cartesianGraphSettings.xaxes = [];
        cartesianGraphSettings.yaxes = [];
        cartesianGraphSettings.cursors = [];

        for (i = 0; i < this.axes.length; i++) {
            var axis = this.axes[i];
            var a = axis.getViewConfig();

            if (a) {
                if (a.position && ((a.position === 'left') || (a.position === 'right'))) {
                    cartesianGraphSettings.yaxes.push(a);
                }

                if (a.position && ((a.position === 'top') || (a.position === 'bottom'))) {
                    cartesianGraphSettings.xaxes.push(a);
                }
            }
        }

        for (i = 0; i < this.cursors.length; i++) {
            var cursor = this.cursors[i];
            var c = cursor.getViewConfig();
            cartesianGraphSettings.cursors.push(c);
        }

        if (this.graphTools) {
            cartesianGraphSettings.zoom.interactive = this.graphTools.allowsScrollWheelZoom();
            cartesianGraphSettings.pan.interactive = this.graphTools.allowsPan();
            cartesianGraphSettings.selection.mode = this.graphTools.mode === 'zoom' ? 'smart' : null;
        }

        return cartesianGraphSettings;
    };

    proto.updateGraphConfig = function () {
        var plotConfig;
        if (this.plots.length > 0) {
            plotConfig = this.plots[0].getViewConfig();
        }

        var childElement = this.graphdiv;
        if (childElement === undefined) {
            return; // not ready yet
        }

        var cartesianGraphData = this.createData(this.plots, this.convertToFlotFormat(JSON.parse(this.value)));
        var cartesianGraphSettings = this.configureGraph();
        this.setHover(cartesianGraphData, cartesianGraphSettings);

        try {
            this.graph = $.plot(childElement, cartesianGraphData, cartesianGraphSettings);
        } catch (error) {
            NI_SUPPORT.log(error.message);
        }

        $(this).data('chart', this.graph);
    };

    var isWaveform = function (value) {
        return (!Array.isArray(value)) && typeof value === 'object' && Array.isArray(value.Y);
    };

    proto.inferDataType = function (data) {
        if (isWaveform(data)) {
            return 'niAnalogWaveform';
        }

        if (!Array.isArray(data)) {
            return 'unknown';
        }

        if (data.length === 0) {
            return 'empty';
        }

        if (typeof data[0] === 'number') {
            return '1DNumericArray';
        }

        if (Array.isArray(data[0])) {
            return '2DNumericArray';
        }

        if (data[0] instanceof Object) {
            return '1DComplexArray';
        }

        return 'unknown';
    };

    var waveformToFlotFormat = function (waveform) {
        return [waveform.toTimeAndValueArray()];
    };

    proto.convertToFlotFormat = function (data) {
        var dataValuesArray = [];
        var dataValuesArray2D;

        var i, j, coordinatesArray;

        switch (this.inferDataType(data)) {
            case 'niAnalogWaveform':
                var waveform = new NationalInstruments.HtmlVI.NIAnalogWaveform(data);
                return waveformToFlotFormat(waveform);
            case '1DNumericArray':
                for (i = 0; i < data.length; i++) {
                    coordinatesArray = [];
                    coordinatesArray.push(i);
                    coordinatesArray.push(data[i]);
                    dataValuesArray.push(coordinatesArray);
                }

                break;
            case '1DComplexArray':
                for (i = 0; i < data.length; i++) {
                    coordinatesArray = [];
                    coordinatesArray.push(i);
                    coordinatesArray.push(data[i].real);
                    dataValuesArray.push(coordinatesArray);
                }

                break;
            case '2DNumericArray':
                dataValuesArray2D = [];
                for (j = 0; j < data.length; j++) {
                    dataValuesArray = [];
                    for (i = 0; i < data[j].length; i++) {
                        coordinatesArray = [];
                        coordinatesArray.push(i);
                        coordinatesArray.push(data[j][i]);
                        dataValuesArray.push(coordinatesArray);
                    }

                    dataValuesArray2D.push(dataValuesArray);
                }

                break;
            default:

        }

        return dataValuesArray2D || [dataValuesArray];
    };

    proto.updateData = function () {
        var graph = this.graph;

        graph.setData(this.createData(this.plots, this.convertToFlotFormat(JSON.parse(this.value))));
        graph.setupGrid();
        graph.draw();
    };

    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'value',
            defaultValue: '[]'
        });
        proto.addProperty(targetPrototype, {
            propertyName: 'plotAreaMargin',
            defaultValue: ''
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        this.plots = [];
        this.axes = [];
        this.cursors = [];
        this.plotLegend = null;
        this.cursorLegend = null;
        this.scaleLegend = null;
        this.graphTools = null;
        this.graphdiv = undefined;
        this.tooltip = null;

        // Private Instance Properties
        // None
    };

    proto.findGraphItems_early = function () {
        var myChildItems = [],
            axisItemName = NationalInstruments.HtmlVI.Elements.CartesianPlot.prototype.elementInfo.tagName.toUpperCase(),
            plotItemName = NationalInstruments.HtmlVI.Elements.CartesianAxis.prototype.elementInfo.tagName.toUpperCase(),
            i;

        for (i = 0; i < this.children.length; i++) {
            if (this.children[i].tagName === plotItemName) {
                myChildItems.push(this.children[i]);
            } else if (this.children[i].tagName === axisItemName) {
                myChildItems.push(this.children[i]);
            }
        }

        return myChildItems;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        var plot = this.graph;
        if (plot !== undefined) {
            plot.resize();
            plot.setupGrid();
            plot.draw();
        }
    };

    proto.createGraph = function () {
        var that = this;
        var childElement = document.createElement('div');
        childElement.style.width = '100%';
        childElement.style.height = '100%';
        this.appendChild(childElement);
        var tooltip = document.createElement('div');
        tooltip.id = 'tooltip' + NI_SUPPORT.uniqueId();
        tooltip.className = 'ni-graph-tooltip';
        this.appendChild(tooltip);
        this.tooltip = tooltip;

        this.graphdiv = childElement;

        var cartesianGraphData = this.createData(this.plots, this.convertToFlotFormat(JSON.parse(this.value)));
        var cartesianGraphSettings = this.configureGraph();
        this.setHover(cartesianGraphData, cartesianGraphSettings);

        try {
            this.graph = $.plot(childElement, cartesianGraphData, cartesianGraphSettings);
        } catch (e) {
            NI_SUPPORT.log('Failed to create a flot chart. Make sure that the placeholder element has a non-zero size !');
        }

        $(childElement).bind('plothover', function (event, pos, item) {
            if (item) {
                var str = '';
                var hoverFormat = that.plots[item.seriesIndex].hoverFormat;
                if (hoverFormat !== undefined) {
                    str = that.format(hoverFormat, pos.x, pos.y);
                } else {
                    str = that.format('{0}, {1}', pos.x, pos.y);
                }

                $(tooltip).html(str)
                                        .css({ top: item.pageY - that.offsetTop + 5, left: item.pageX - that.offsetLeft + 5 })
                                        .fadeIn(100);
            } else {
                $(tooltip).hide();
            }
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this), graphChildElements;

        if (firstCall === true) {
            graphChildElements = this.findGraphItems_early();
            this.addGraphItemListeners(graphChildElements);
            this.createGraph();
        }

        return firstCall;
    };

    proto.addGraphItemListeners = function (childElements) {
        var that = this;
        that.addEventListener('ni-cartesian-plot-attached', function (evt) {
            var i;

            if (evt.target === that) {
                that.plots.push(evt.detail.element);
                for (i = 0; i < childElements.length; i++) {
                    if (childElements[i] === evt.detail.element) {
                        childElements.splice(i, 1);
                        break;
                    }
                }

                that.updateGraphConfig();
                that.notifyPlotLegend('ni-cartesian-plot-attached', evt.detail.element);
            }
        });

        that.addEventListener('ni-cartesian-plot-detached', function (evt) {
            var i;

            if (evt.target === that) {
                for (i = 0; i < that.plots.length; i++) {
                    if (that.plots[i] === evt.detail.element) {
                        that.plots.splice(i, 1);
                        break;
                    }
                }

                that.updateGraphConfig();
                that.notifyPlotLegend('ni-cartesian-plot-detached', evt.detail.element);
            }
        });

        that.addEventListener('ni-cartesian-axis-attached', function (evt) {
            var i;

            if (evt.target === that) {
                if (typeof that.axes === 'string') {
                    that.axes = [];
                }

                if (typeof that.plots === 'string') {
                    that.plots = [];
                }

                that.axes.push(evt.detail.element);
                for (i = 0; i < childElements.length; i++) {
                    if (childElements[i] === evt.detail.element) {
                        childElements.splice(i, 1);
                        break;
                    }
                }

                that.updateGraphConfig();
                that.notifyScaleLegend('ni-cartesian-axis-attached', evt.detail.element);
            }
        });

        that.addEventListener('ni-cartesian-axis-detached', function (evt) {
            var i;

            if (evt.target === that) {
                for (i = 0; i < that.axes.length; i++) {
                    if (that.axes[i] === evt.detail.element) {
                        that.axes.splice(i, 1);
                        break;
                    }
                }

                that.updateGraphConfig();
                that.notifyScaleLegend('ni-cartesian-axis-detached', evt.detail.element);
            }
        });

        that.addEventListener('ni-cursor-attached', function (evt) {
            var i;

            if (evt.target === that) {
                if (typeof that.cursors === 'string') {
                    that.cursors = [];
                }

                that.cursors.push(evt.detail.element);
                for (i = 0; i < childElements.length; i++) {
                    if (childElements[i] === evt.detail.element) {
                        childElements.splice(i, 1);
                        break;
                    }
                }

                that.updateGraphConfig();
                that.notifyCursorLegend('ni-cursor-attached', evt.detail.element);
            }
        });

        that.addEventListener('ni-cursor-detached', function (evt) {
            var i;

            if (evt.target === that) {
                for (i = 0; i < that.cursors.length; i++) {
                    if (that.cursors[i] === evt.detail.element) {
                        that.cursors.splice(i, 1);
                        break;
                    }
                }

                that.updateGraphConfig();
                that.notifyCursorLegend('ni-cursor-detached', evt.detail.element);
            }
        });

        that.addEventListener('ni-axis-changed', function (evt) {
            that.updateGraphConfig();
            that.notifyScaleLegend('ni-axis-changed', evt.detail.element);
        });

        that.addEventListener('ni-cartesian-plot-changed', function (evt) {
            that.updateGraphConfig();
            that.notifyPlotLegend('ni-cartesian-plot-changed', evt.detail.element);
        });

        that.addEventListener('ni-cursor-changed', function (evt) {
            that.updateGraphConfig();
            that.notifyCursorLegend('ni-cursor-changed', evt.detail.element);
        });

        that.addEventListener('ni-cartesian-plot-renderer-attached', function () {
            that.updateGraphConfig();
        });

        that.addEventListener('ni-cartesian-plot-renderer-detached', function () {
            that.updateGraphConfig();
        });

        that.addEventListener('ni-graph-tools-changed', function () {
            that.updateGraphConfig();
        });
    };

    proto.registerPlotLegend = function (plotLegend) {
        var i;
        this.plotLegend = plotLegend;
        if (this.plots.length > 0) {
            for (i = 0; i < this.plots.length; i++) {
                this.notifyPlotLegend('ni-cartesian-plot-attached', this.plots[i]);
            }
        }
    };

    proto.notifyPlotLegend = function (name, originalSource) {
        var eventConfig;

        if (this.plotLegend !== null) {
            eventConfig = {
                bubbles: true,
                cancelable: true,
                detail: {
                    element: this,
                    originalSource: originalSource
                }
            };

            this.plotLegend.dispatchEvent(new CustomEvent(name, eventConfig));
        }
    };

    proto.registerCursorLegend = function (cursorLegend) {
        var i;
        this.cursorLegend = cursorLegend;
        if (this.cursors.length > 0) {
            for (i = 0; i < this.cursors.length; i++) {
                this.notifyCursorLegend('ni-cursor-attached', this.cursors[i]);
            }
        }
    };

    proto.notifyCursorLegend = function (name, originalSource) {
        var eventConfig;

        if (this.cursorLegend !== null) {
            eventConfig = {
                bubbles: true,
                cancelable: true,
                detail: {
                    element: this,
                    originalSource: originalSource
                }
            };

            this.cursorLegend.dispatchEvent(new CustomEvent(name, eventConfig));
        }
    };

    proto.registerScaleLegend = function (scaleLegend) {
        var i;
        this.scaleLegend = scaleLegend;
        if (this.axes.length > 0) {
            for (i = 0; i < this.axes.length; i++) {
                this.notifyScaleLegend('ni-cartesian-axis-attached', this.axes[i]);
            }
        }
    };

    proto.notifyScaleLegend = function (name, originalSource) {
        var eventConfig;

        if (this.scaleLegend !== null) {
            eventConfig = {
                bubbles: true,
                cancelable: true,
                detail: {
                    element: this,
                    originalSource: originalSource
                }
            };

            this.scaleLegend.dispatchEvent(new CustomEvent(name, eventConfig));
        }
    };

    proto.registerGraphTools = function (graphTools) {
        var that = this;
        this.graphTools = graphTools;

        this.updateGraphConfig();

        $(this.graphdiv).on('plotselected', function (event, ranges) {
            that.notifyGraphTools('ni-cartesian-graph-box-selected', { ranges: ranges });
        });

        $(this.graphdiv).on('plotpan', function (event, ranges) {
            that.notifyGraphTools('ni-cartesian-graph-interaction', { ranges: ranges });
        });

        $(this.graphdiv).on('plotzoom', function (event, ranges) {
            that.notifyGraphTools('ni-cartesian-graph-interaction', { ranges: ranges });
        });

    };

    proto.notifyGraphTools = function (name, originalSource) {
        var eventConfig;

        if (this.graphTools !== null) {
            eventConfig = {
                bubbles: true,
                cancelable: true,
                detail: {
                    element: this,
                    originalSource: originalSource
                }
            };

            this.graphTools.dispatchEvent(new CustomEvent(name, eventConfig));
        }
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        switch (propertyName) {
            case 'value':
                this.updateData();
                break;
            case 'plotAreaMargin':
                this.updateGraphConfig();
                break;
        }
    };

    proto.format = function () {
        var args = arguments;
        var str = args[0];
        return str.replace(/{(\d+)}/g, function (match, number) {
            var index = parseInt(number) + 1;
            var item = args[index];

            if (typeof item !== 'undefined') {
                var len1 = item.toFixed(2).length;
                var len2 = item.toExponential(2).length;
                if (len1 < len2) {
                    return item.toFixed(2);
                } else {
                    return item.toExponential(2);
                }
            } else {
                return match;
            }
        });
    };

    proto.setHover = function (graphData, graphSettings) {
        var i,
            isHoverable = false;

        for (i = 0; i < graphData.length; i++) {
            if (graphData[i].hoverable) {
                isHoverable = true;
                break;
            }
        }

        if (isHoverable === true) {
            if (graphSettings.grid === undefined) {
                graphSettings.grid = {};
            }

            graphSettings.grid.hoverable = isHoverable;
        } else {
            if (this.tooltip !== null) {
                $(this.tooltip).hide();
            }
        }
    };
}(NationalInstruments.HtmlVI.Elements.CartesianGraphBase, NationalInstruments.HtmlVI.Elements.Visual));
