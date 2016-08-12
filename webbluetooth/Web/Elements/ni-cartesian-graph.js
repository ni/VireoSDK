//****************************************
// Cartesian Graph Prototype
// DOM Registration: HTMLNICartesianGraph
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.CartesianGraph = function () {
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
    proto.createData = function (plots, data) {
        var plotConfig = [];

        var defaultSampleCartesianGraphData = [
            [
                [0, 1],
                [1, 5],
                [2, 3],
                [3, 6]
            ],
            [
                [0, 2],
                [1, 6],
                [2, 2],
                [3, 3]
            ],
            [
                [0, 6],
                [1, 3],
                [2, 5],
                [3, 1]
            ],
            [
                [0, 3],
                [1, 7],
                [2, 0],
                [3, 4]
            ],
            [
                [0, 3],
                [1, -1],
                [2, 7],
                [3, -2]
            ]
        ];

        plots.forEach(function (plot, i) {
            plotConfig[i] = plot.getViewConfig();
            plotConfig[i].data = data.length > 0 ? data[i] : defaultSampleCartesianGraphData[i] || [];
        });

        return plotConfig;
    };

    proto.updateGraphConfig = function () {
        var childElement = this.graphdiv;
        if (childElement === undefined) {
            return; // not ready yet
        }

        var cartesianGraphData = this.createData(this.plots, this.convertToFlotFormat(JSON.parse(this.value)));
        var cartesianGraphSettings = this.configureGraph();
        this.setHover(cartesianGraphData, cartesianGraphSettings);
        try {
            this.graph = $.plot(childElement, cartesianGraphData, cartesianGraphSettings);
            var that = this;
            this.graph.getCursors().forEach(function (cursor, i) {
                /* place a cookie on the cursor */
                cursor.cookie = that.cursors[i];
                that.cursors[i].setCursor(cursor);
            });
        } catch (error) {}

        $(this).data('chart', this.graph);
    };

    proto.onCursorUpdates = function (event, cursordata) {
        cursordata.forEach(function (cursor, i) {
            cursor.target.cookie.updateCursorElement(cursordata[i]);
        });
    };

    proto.updateData = function () {
        var graph = this.graph;

        graph.setData(this.createData(this.plots, this.convertToFlotFormat(JSON.parse(this.value))));
        graph.setupGrid();
        graph.draw();
    };

    proto.createGraph = function () {
        parent.prototype.createGraph.call(this);
        try {
            this.graph.getPlaceholder().bind('cursorupdates', this.onCursorUpdates);
            var that = this;
            this.graph.getCursors().forEach(function (cursor, i) {
                /* place a cookie on the cursor */
                cursor.cookie = that.cursors[i];
                that.cursors[i].setCursor(cursor);
            });
        } catch (e) { }
    };

    proto.defineElementInfo(proto, 'ni-cartesian-graph', 'HTMLNICartesianGraph');
}(NationalInstruments.HtmlVI.Elements.CartesianGraph, NationalInstruments.HtmlVI.Elements.CartesianGraphBase));
