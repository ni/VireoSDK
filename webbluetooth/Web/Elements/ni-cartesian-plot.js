/*jslint nomen: true, devel:true*/
/*global NationalInstruments*/
//****************************************
// Boolean Content Control Prototype
// DOM Registration: No
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.CartesianPlot = function () {
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
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'xaxis',
            defaultValue: ''
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'yaxis',
            defaultValue: ''
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'enableHover',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'hoverFormat',
            defaultValue: ''
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        // None

        // Private Instance Properties
        this._parentGraph = undefined;
    };

    proto.sendEventToParentGraph = function (name, originalSource) {
        var eventConfig;

        if (this._parentGraph !== undefined) {
            eventConfig = {
                bubbles: true,
                cancelable: true,
                detail: {
                    element: this,
                    originalSource: originalSource
                }
            };

            this._parentGraph.dispatchEvent(new CustomEvent(name, eventConfig));
        }
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);

        if (this.parentElement instanceof NationalInstruments.HtmlVI.Elements.CartesianGraph || this.parentElement instanceof NationalInstruments.HtmlVI.Elements.Chart) {
            this._parentGraph = this.parentElement;
            this.addPlotItemListeners();
            this.sendEventToParentGraph('ni-cartesian-plot-attached');
        } else {
            NI_SUPPORT.error('Plot with following id does not have a parentGraph', this.niControlId);
            this._parentGraph = undefined;
        }

        return firstCall;
    };

    proto.addPlotItemListeners = function () {
        var that = this;
        that.addEventListener('ni-cartesian-plot-renderer-attached', function (evt) {
            if (evt.target === that) {
                this.plotRenderer = evt.detail.element;
                this.sendEventToParentGraph('ni-cartesian-plot-renderer-attached');
            }
        });

        that.addEventListener('ni-cartesian-plot-renderer-detached', function (evt) {
            if (evt.target === that) {
                this.plotRenderer = undefined;
                this.sendEventToParentGraph('ni-cartesian-plot-renderer-detached');
            }
        });

        that.addEventListener('ni-cartesian-plot-renderer-changed', function (evt) {
            if (evt.target === that) {
                this.sendEventToParentGraph('ni-cartesian-plot-changed', evt.detail.element);
            }
        });
    };

    proto.detachedCallback = function () {
        parent.prototype.detachedCallback.call(this);

        this.sendEventToParentGraph('ni-cartesian-plot-detached');
        this._parentGraph = undefined;
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        this.sendEventToParentGraph('ni-cartesian-plot-changed');
    };

    proto.getViewConfig = function () {
        var plotConfig = {};
        if (this.plotRenderer !== undefined) {
            plotConfig = this.plotRenderer.getViewConfig();
        }

        plotConfig.hoverable = this.enableHover;

        return plotConfig;
    };

    proto.defineElementInfo(proto, 'ni-cartesian-plot', 'HTMLNICartesianPlot');
}(NationalInstruments.HtmlVI.Elements.CartesianPlot, NationalInstruments.HtmlVI.Elements.Visual));
