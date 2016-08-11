//****************************************
// Scale Legend Helpers Prototype
// DOM Registration: Not an element
// National Instruments Copyright 2015
//****************************************

(function () {
    'use strict';

    // Constructor Function
    NationalInstruments.HtmlVI.Elements.ScaleLegendHelpers = function () {
        this.graphName = '';
        this.isInEditMode = false;
        this.scales = [];
    };

    // Static Public Variables
    // None

    var child = NationalInstruments.HtmlVI.Elements.ScaleLegendHelpers;
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.addScale = function () {
    };

    proto.clearScale = function (index) {
        this.scales[index] = null;
    };

    proto.getScale = function (index) {
        var i = 0;
        var graph;
        var scale = null;
        var child;
        if (this.scales[index] === null || this.scales[index] === undefined) {
            graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');

            if (graph !== null) {
                for (child in graph.childNodes) {
                    if (graph.childNodes[child].localName === 'ni-cartesian-axis' ||
                        graph.childNodes[child].localName === 'ni-color-scale') {
                        if (i === index) {
                            scale = graph.childNodes[child];
                            break;
                        }

                        i++;
                    }
                }
            }

            if (scale === null) {
                return null;
            }

            this.scales[index] = scale;
        }

        return this.scales[index];
    };

    proto.scaleToIndex = function (scale) {
        var i = 0, index = 0, graph, child, currentScale;
        graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
        if (graph !== null) {
            for (child in graph.childNodes) {
                if (graph.childNodes[child].localName === 'ni-cartesian-axis' ||
                    graph.childNodes[child].localName === 'ni-color-scale') {
                    currentScale = graph.childNodes[child];
                    if (currentScale === scale) {
                        index = i;
                        break;
                    }

                    i++;
                }
            }
        }

        return index;
    };

    proto.handleClick = function (itemName, index) {
        if (this.isInEditMode !== true) {
            var scale = this.getScale(index);
            if (scale === null) {
                return;
            }

            switch (itemName) {
                case 'lock':
                    if (scale.autoScale) {
                        // turns off autoscale and sets axis min and max
                        // at the current "autoscaled" values
                        scale.scaleOnce();
                    } else {
                        scale.autoScale = true;
                    }

                    break;
                case 'scaleonce':
                    scale.scaleOnce();
                    break;
            }
        }
    };

    proto.getState = function (itemName, index) {
        var scale = this.getScale(index);
        if (scale === null) {
            return undefined;
        }

        var state;
        switch (itemName) {
            case 'canLock':
                state = scale.localName !== 'ni-color-scale';
                break;
            case 'lock':
                state = scale.autoScale;
                break;
            case 'scaleonce':
                break;
            case 'name':
                state = scale.label;
                break;
        }

        return state;
    };
}());
