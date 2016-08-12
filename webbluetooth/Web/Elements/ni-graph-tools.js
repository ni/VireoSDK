//****************************************
// Graph Tools Element
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.GraphTools = function () {
    'use strict';
};

// Static Public Variables
NationalInstruments.HtmlVI.Elements.GraphTools.ModeEnum = Object.freeze({
    LOCKED: 'locked',
    PAN: 'pan',
    ZOOM: 'zoom'
});

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var MODE_ENUM = NationalInstruments.HtmlVI.Elements.GraphTools.ModeEnum;
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    var navigationStates = {};
    navigationStates[MODE_ENUM.LOCKED] = [true, false, false];
    navigationStates[MODE_ENUM.PAN] = [false, true, false];
    navigationStates[MODE_ENUM.ZOOM] = [false, false, true];

    //Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'graphName',
            defaultValue: '',
            fireEvent: false,
            addNonSignalingProperty: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'isInEditMode',
            defaultValue: false,
            fireEvent: false,
            addNonSignalingProperty: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'mode',
            defaultValue: MODE_ENUM.PAN,
            fireEvent: false,
            addNonSignalingProperty: false
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);
        this._parentGraph = undefined;
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            childElement,
            that = this;

        if (firstCall === true) {
            childElement = document.createElement('div');
            childElement.id = 'div' + NI_SUPPORT.uniqueId();
            childElement.style.width = '100%';
            childElement.style.height = '100%';
            this.appendChild(childElement);
            this.table = document.createElement('table');
            this.table.className = 'ni-graph-tools-box';
            childElement.appendChild(this.table);
            this.createRow(this.table);
            var graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
            if (graph !== null) {
                if (graph instanceof NationalInstruments.HtmlVI.Elements.CartesianGraphBase) {
                    graph.registerGraphTools(this);
                    this._parentGraph = graph;
                }
            }

            this.addEventListener('ni-cartesian-graph-box-selected', function (evt) {
                // a rectangle selection was made on the graph, zoom into that selection
                // info about the selection box is passed in the event details (ranges)
                var ranges = evt.detail.originalSource.ranges;
                var plot = that._parentGraph.graph;

                // set the visible ranges for x axes
                $.each(plot.getXAxes(), function (_, axis) {
                    var opts = axis.options;
                    opts.min = ranges.xaxis.from;
                    opts.max = ranges.xaxis.to;
                });
                // set the visible ranges for y axes
                $.each(plot.getYAxes(), function (_, axis) {
                    var opts = axis.options;
                    opts.min = ranges.yaxis.from;
                    opts.max = ranges.yaxis.to;
                });
                // redraw plot
                plot.setupGrid();
                plot.draw();
                plot.clearSelection();

                that._parentGraph.axes.forEach(function (axis) {
                    axis.syncWithFlot();
                });
            });

            this.addEventListener('ni-cartesian-graph-interaction', function () {
                that._parentGraph.axes.forEach(function (axis) {
                    axis.syncWithFlot();
                });
            });
        }

        return firstCall;
    };

    proto.createRow = function (tbl) {
        var that = this;
        var tr, td1, td2, td3, td4, navNone, btnPan, btnZoom, btnZoomOut;

        function setNavButtonsState(locked, pan, zoom) {
            $(navNone).jqxToggleButton({ disabled: locked });
            $(btnPan).jqxToggleButton({ disabled: pan });
            $(btnZoom).jqxToggleButton({ disabled: zoom });
        }

        function setMode(mode) {
            var states =  navigationStates[mode];

            if (states) {
                setNavButtonsState.apply(null, states);
                that.mode = mode;
            }
        }

        tr = document.createElement('tr');
        tbl.appendChild(tr);
        td1 = document.createElement('td');
        td1.className = 'ni-button-box';
        tr.appendChild(td1);
        navNone = document.createElement('button');
        navNone.type = 'button';
        navNone.className = 'ni-navigation-locked-button ni-button';
        $(navNone).jqxToggleButton();
        $(navNone).on('click', function () {
            setMode(MODE_ENUM.LOCKED);
        });
        td1.appendChild(navNone);

        td2 = document.createElement('td');
        td2.className = 'ni-button-box';
        tr.appendChild(td2);
        btnPan = document.createElement('button');
        btnPan.type = 'button';
        btnPan.className = 'ni-navigation-pan-button ni-button';
        $(btnPan).jqxToggleButton();
        $(btnPan).on('click', function () {
            setMode(MODE_ENUM.PAN);
        });
        td2.appendChild(btnPan);

        td3 = document.createElement('td');
        td3.className = 'ni-button-box';
        tr.appendChild(td3);
        btnZoom = document.createElement('button');
        btnZoom.type = 'button';
        btnZoom.className = 'ni-navigation-zoom-button ni-button';
        $(btnZoom).on('click', function () {
            setMode(MODE_ENUM.ZOOM);
        });
        td3.appendChild(btnZoom);

        setMode(this.mode); // initialize the "navigation radio butons" in the default mode
        td4 = document.createElement('td');
        td4.className = 'ni-button-box';
        tr.appendChild(td4);
        btnZoomOut = document.createElement('button');
        btnZoomOut.type = 'button';
        btnZoomOut.className = 'ni-navigation-zoom-out-button ni-button';
        $(btnZoomOut).jqxButton({ disabled: false });
        $(btnZoomOut).on('click', function () {
            that._parentGraph.axes.forEach(function (axis) {
                axis.scaleOnce();
            });
        });
        td4.appendChild(btnZoomOut);
    };

    proto.allowsScrollWheelZoom = function () {
        return this.mode === MODE_ENUM.PAN || this.mode === MODE_ENUM.ZOOM;
    };

    proto.allowsPan = function () {
        return this.mode === MODE_ENUM.PAN;
    };

    proto.sendEventToParentGraph = function (name) {
        var eventConfig;

        if (this._parentGraph !== undefined) {
            eventConfig = {
                bubbles: true,
                cancelable: true,
                detail: {
                    element: this
                }
            };

            this._parentGraph.dispatchEvent(new CustomEvent(name, eventConfig));
        }
    };

    proto.propertyUpdated = function (propertyName) {
        var that = this;
        parent.prototype.propertyUpdated.call(this, propertyName);

        switch (propertyName) {
            case 'graphName':
                // should never change
                //this.helpers.graphName = this.graphName;
                break;
            case 'isInEditMode':
                // this changes once after the element is created

                $(this.table).find('.ni-navigation-locked-button').each(function () {
                    $(this).jqxToggleButton({ disabled: that.isInEditMode });
                });
                $(this.table).find('.ni-navigation-pan-button').each(function () {
                    $(this).prop('disabled', that.isInEditMode);
                });
                $(this.table).find('.ni-navigation-zoom-button').each(function () {
                    $(this).prop('disabled', that.isInEditMode);
                });
                break;
            case 'mode':
                this.sendEventToParentGraph('ni-graph-tools-changed');
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-graph-tools', 'HTMLNIGraphTools');
}(NationalInstruments.HtmlVI.Elements.GraphTools, NationalInstruments.HtmlVI.Elements.Visual));
