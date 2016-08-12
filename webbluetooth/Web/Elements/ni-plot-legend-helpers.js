//****************************************
// Plot Legend Helpers Prototype
// DOM Registration: Not an element
// National Instruments Copyright 2015
//****************************************

(function () {
    'use strict';

    // Constructor Function
    NationalInstruments.HtmlVI.Elements.PlotLegendHelpers = function () {
        this.graphName = '';
        this.isInEditMode = false;
        this.defaultPlotColors = [
           '#7B161A',
           '#008EE4',
           '#E2B683',
           '#B7AC1F',
           '#AEDCEF',
           '#A08BB0',
           '#7F7F7F',
           '#3C0726'
        ];
        this.renderers = [];
    };

    // Static Public Variables
    // None

    var child = NationalInstruments.HtmlVI.Elements.PlotLegendHelpers;
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.menu = [
        {
            name: 'Plot Style', tag: 'msg_plotstyle', type: 'buttons', children: [
                { name: 'Line', tag: 'msg_line', cssClass: 'ni-line-style-button' },
                { name: 'Point', tag: 'msg_point', cssClass: 'ni-point-style-button' },
                { name: 'Line & Point', tag: 'msg_lineandpoint', cssClass: 'ni-line-and-point-style-button' },
                { name: 'Bar', tag: 'msg_bar', cssClass: 'ni-bar-style-button' },
                { name: 'Fill', tag: 'msg_fill', cssClass: 'ni-fill-style-button' }
            ]
        },
        {
            name: 'Point Style', tag: 'msg_pointstyle', type: 'buttons', children: [
                { name: 'Ellipse', tag: 'msg_ellipse', cssClass: 'ni-ellipse-point-style-button' },
                { name: 'Rectangle', tag: 'msg_rectangle', cssClass: 'ni-rect-point-style-button' },
                { name: 'Diamond', tag: 'msg_diamond', cssClass: 'ni-diamond-point-style-button' },
                { name: 'Cross', tag: 'msg_cross', cssClass: 'ni-cross-point-style-button' },
                { name: 'Plus', tag: 'msg_plus', cssClass: 'ni-plus-point-style-button' }
            ]
        },
        {
            name: 'Line Width', tag: 'msg_linewidth', type: 'combobox', children: [
                { name: 'No line', tag: 'msg_noline', cssClass: '' },
                { name: '1-pixel', tag: 'msg_1pixel', cssClass: 'ni-1-pixel-line-width-icon' },
                { name: '2-pixels', tag: 'msg_2pixels', cssClass: 'ni-2-pixels-line-width-icon' },
                { name: '3-pixels', tag: 'msg_3pixels', cssClass: 'ni-3-pixels-line-width-icon' },
                { name: '4-pixels', tag: 'msg_4pixels', cssClass: 'ni-4-pixels-line-width-icon' },
                { name: '5-pixels', tag: 'msg_5pixels', cssClass: 'ni-5-pixels-line-width-icon' }
            ]
        },
        {
            name: 'Line Style', tag: 'msg_linestyle', type: 'combobox', children: [
                { name: 'No style', tag: 'msg_nostyle', cssClass: '' },
                { name: 'Solid', tag: 'msg_solid', cssClass: 'ni-solid-line-style-icon' },
                { name: 'Dot', tag: 'msg_dot', cssClass: 'ni-dot-line-style-icon' },
                { name: 'Dot-dash', tag: 'msg_dashdot', cssClass: 'ni-dot-dash-line-style-icon' },
                { name: 'Medium dash', tag: 'msg_mediumdash', cssClass: 'ni-medium-dash-line-style-icon' },
                { name: 'Large dash', tag: 'msg_largedash', cssClass: 'ni-large-dash-line-style-icon' }
            ]
        },
        {
            name: 'Fill Baseline', tag: 'msg_fillbaseline', type: 'buttons', children: [
                { name: 'No baseline', tag: 'msg_nobaseline', cssClass: 'ni-fill-base-line-none-button' },
                { name: 'Zero', tag: 'msg_zero', cssClass: 'ni-fill-to-zero-style-button' },
                { name: '-Inf', tag: 'msg_neginf', cssClass: 'ni-fill-base-line-negative-infinity-button' },
                { name: 'Inf', tag: 'msg_inf', cssClass: 'ni-fill-base-line-positive-infinity-button' }
            ]
        },
        {
            name: 'Color', tag: 'msg_color', type: 'colorbox', children: [
            ]
        },
        {
            name: 'Hover', tag: 'msg_hover', type: 'checkbox', children: [

            ]
        }
    ];

    proto.addRenderer = function () {
    };

    proto.clearRenderer = function (index) {
        this.renderers[index] = null;
    };

    proto.getPlot = function (index) {
        var i = 0;
        var plot = null;
        var graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');

        if (graph !== null) {
            for (child in graph.childNodes) {
                if (graph.childNodes[child].localName === 'ni-cartesian-plot') {
                    if (i === index) {
                        plot = graph.childNodes[child];
                        break;
                    }

                    i++;
                }
            }
        }

        return plot;
    };

    proto.getRenderer = function (index) {
        var plot = null;
        var renderer = null;
        if (this.renderers[index] === null || this.renderers[index] === undefined) {
            plot = this.getPlot(index);

            if (plot !== null) {
                renderer = plot.lastElementChild;
            }

            if (renderer === null) {
                return null;
            }

            this.renderers[index] = renderer;
        }

        return this.renderers[index];
    };

    proto.rendererToIndex = function (renderer) {
        var i = 0, index, graph, child, currentRenderer;
        graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
        if (graph !== null) {
            for (child in graph.childNodes) {
                if (graph.childNodes[child].localName === 'ni-cartesian-plot') {
                    currentRenderer = graph.childNodes[child].lastElementChild;
                    if (currentRenderer === renderer) {
                        index = i;
                        break;
                    }

                    i++;
                }
            }
        }

        return index;
    };

    proto.handleClick = function (itemName, arg, index) {
        if (this.isInEditMode !== true) {
            var initialColor = '';
            var plot;
            var renderer = this.getRenderer(index);
            if (renderer === null) {
                return;
            }

            if (renderer.lineStroke !== '') {
                initialColor = renderer.lineStroke;
            }

            if (renderer.pointColor !== '') {
                initialColor = renderer.pointColor;
            }

            if (renderer.barFill !== '') {
                initialColor = renderer.barFill;
            }

            if (renderer.areaFill !== '') {
                initialColor = renderer.areaFill;
            }

            switch (itemName) {
                case 'No line':
                    renderer.lineWidth = 0;
                    break;
                case '1-pixel':
                    renderer.lineWidth = 1;
                    break;
                case '2-pixels':
                    renderer.lineWidth = 2;
                    break;
                case '3-pixels':
                    renderer.lineWidth = 3;
                    break;
                case '4-pixels':
                    renderer.lineWidth = 4;
                    break;
                case '5-pixels':
                    renderer.lineWidth = 5;
                    break;
                case 'Line':
                    renderer.lineStroke = initialColor;
                    renderer.pointColor = '';
                    renderer.barFill = '';
                    renderer.areaFill = '';
                    break;
                case 'Point':
                    renderer.lineStroke = '';
                    renderer.pointColor = initialColor;
                    renderer.barFill = '';
                    renderer.areaFill = '';
                    break;
                case 'Line & Point':
                    renderer.lineStroke = initialColor;
                    renderer.pointColor = initialColor;
                    renderer.barFill = '';
                    renderer.areaFill = '';
                    break;
                case 'Bar':
                    renderer.lineStroke = '';
                    renderer.pointColor = '';
                    renderer.barFill = initialColor;
                    renderer.areaFill = '';
                    break;
                case 'Fill':
                    renderer.lineStroke = '';
                    renderer.pointColor = '';
                    renderer.barFill = '';
                    renderer.areaFill = initialColor;
                    break;
                case 'Ellipse':
                    renderer.pointShape = 'ellipse';
                    break;
                case 'Rectangle':
                    renderer.pointShape = 'rectangle';
                    break;
                case 'Diamond':
                    renderer.pointShape = 'diamond';
                    break;
                case 'Cross':
                    renderer.pointShape = 'cross';
                    break;
                case 'Plus':
                    renderer.pointShape = 'plus';
                    break;
                case 'No style':
                    renderer.lineStyle = '';
                    break;
                case 'Solid':
                    renderer.lineStyle = 'solid';
                    break;
                case 'Dot':
                    renderer.lineStyle = 'dot';
                    break;
                case 'Dot-dash':
                    renderer.lineStyle = 'dashdot';
                    break;
                case 'Medium dash':
                    renderer.lineStyle = 'mediumdash';
                    break;
                case 'Large dash':
                    renderer.lineStyle = 'largedash';
                    break;
                case 'No baseline':
                    break;
                case 'Zero':
                    break;
                case '-Inf':
                    break;
                case 'Inf':
                    break;
                case 'Color':
                    if (renderer.lineStroke !== '') {
                        renderer.lineStroke = '#' + arg.hex;
                    } else if (renderer.pointColor !== '') {
                        renderer.pointColor = '#' + arg.hex;
                    } else if (renderer.barFill !== '') {
                        renderer.barFill = '#' + arg.hex;
                    } else if (renderer.areaFill !== '') {
                        renderer.areaFill = '#' + arg.hex;
                    }

                    break;
                case 'Hover':
                    plot = this.getPlot(index);
                    plot.enableHover = arg;
                    break;
            }
        }
    };

    proto.getState = function (itemName, index) {
        var plot;
        var renderer = this.getRenderer(index);
        if (renderer === null) {
            return undefined;
        }

        var state;
        switch (itemName) {
            case 'No line':
                state = renderer.lineWidth === 0;
                break;
            case '1-pixel':
                state = renderer.lineWidth === 1;
                break;
            case '2-pixels':
                state = renderer.lineWidth === 2;
                break;
            case '3-pixels':
                state = renderer.lineWidth === 3;
                break;
            case '4-pixels':
                state = renderer.lineWidth === 4;
                break;
            case '5-pixels':
                state = renderer.lineWidth === 5;
                break;
            case 'Line':
                state = renderer.lineStroke !== '' && renderer.pointColor === '';
                break;
            case 'Point':
                state = renderer.lineStroke === '' && renderer.pointColor !== '';
                break;
            case 'Line & Point':
                state = renderer.lineStroke !== '' && renderer.pointColor !== '';
                break;
            case 'Bar':
                state = renderer.barFill !== '';
                break;
            case 'Fill':
                state = renderer.areaFill !== '';
                break;
            case 'Ellipse':
                state = renderer.pointShape === 'ellipse';
                break;
            case 'Rectangle':
                state = renderer.pointShape === 'rectangle';
                break;
            case 'Diamond':
                state = renderer.pointShape === 'diamond';
                break;
            case 'Cross':
                state = renderer.pointShape === 'cross';
                break;
            case 'Plus':
                state = renderer.pointShape === 'plus';
                break;
            case 'No style':
                state = renderer.lineStyle === '';
                break;
            case 'Solid':
                state = renderer.lineStyle === 'solid';
                break;
            case 'Dot':
                state = renderer.lineStyle === 'dot';
                break;
            case 'Dot-dash':
                state = renderer.lineStyle === 'dashdot';
                break;
            case 'Medium dash':
                state = renderer.lineStyle === 'mediumdash';
                break;
            case 'Large dash':
                state = renderer.lineStyle === 'largedash';
                break;
            case 'No baseline':
                break;
            case 'Zero':
                break;
            case '-Inf':
                break;
            case 'Inf':
                break;
            case 'Color':
                state = this.getPlotColorFromRenderer(renderer);
                break;
            case 'Hover':
                plot = this.getPlot(index);
                state = plot.enableHover;
                break;
        }

        return state;
    };

    proto.getPlotColor = function (index) {
        var renderer = this.getRenderer(index);
        if (renderer !== null) {
            return this.getPlotColorFromRenderer(renderer);
        }

        return this.defaultPlotColors[index % this.defaultPlotColors.length];
    };

    proto.getPlotColorFromRenderer = function (renderer) {
        var state;
        if (renderer.lineStroke !== '') {
            state = renderer.lineStroke;
        } else if (renderer.pointColor !== '') {
            state = renderer.pointColor;
        } else if (renderer.barFill !== '') {
            state = renderer.barFill;
        } else if (renderer.areaFill !== '') {
            state = renderer.areaFill;
        }

        return state;
    };

    proto.getLineWidth = function (index) {
        var renderer = this.getRenderer(index);
        if (renderer !== null) {
            return renderer.lineWidth;
        }

        // Return the default line width if there is no renderer.
        return 1;
    };

    proto.getLineShape = function (index) {
        var lineShape = 'line';
        var renderer = this.getRenderer(index);
        if (renderer !== null) {
            if (renderer.lineStroke !== '' && renderer.pointColor === '') {
                lineShape = 'line';
            } else if (renderer.lineStroke === '' && renderer.pointColor !== '') {
                lineShape = 'point';
            } else if (renderer.lineStroke !== '' && renderer.pointColor !== '') {
                lineShape = 'line & point';
            } else if (renderer.barFill !== '') {
                lineShape = 'bar';
            } else if (renderer.areaFill !== '') {
                lineShape = 'fill';
            }
        }

        // Return the default line shape if there is no renderer.
        return lineShape;
    };

    proto.getPointShape = function (index) {
        var renderer = this.getRenderer(index);
        if (renderer !== null) {
            return renderer.pointShape;
        }

        // Return the default point shape if there is no renderer.
        return 'ellipse';
    };
}());
