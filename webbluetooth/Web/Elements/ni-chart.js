//****************************************
// Chart Prototype
// DOM Registration: HTMLNIChart
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.Chart = function () {
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
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.setHistoryBuffer = function (historyBuffer) {
        this.historyBuffer = historyBuffer;
    };

    proto.getHistoryBuffer = function () {
        return this.historyBuffer;
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        this.historyBuffer = null;

        // Private Instance Properties
        // None
    };

    proto.getSettings = function () {
        var settings = parent.prototype.getSettings.call(this);

        settings.series.historyBuffer = this.historyBuffer;

        return settings;
    };

    proto.createData = function (plots, data) {
        var plotConfig = [];

        plots.forEach(function (plot) {
            plotConfig.push(plot.getViewConfig());

        });

        plots.forEach(function (plot, i) {
            plotConfig[i] = plot.getViewConfig();
            plotConfig[i].data = data.length > 0 ? data[i] : [];
        });

        return plotConfig;
    };

    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'bufferSize',
            defaultValue: 1024
        });
    };

    proto.defineElementInfo(proto, 'ni-chart', 'HTMLNIChart');
}(NationalInstruments.HtmlVI.Elements.Chart, NationalInstruments.HtmlVI.Elements.CartesianGraphBase));
