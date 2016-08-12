/*jslint nomen: true, devel:true*/
/*global NationalInstruments*/
//****************************************
// Cartesian Axis Custom Element
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.CartesianAxis = function () {
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

    var isTimeAxis = function (format) {
        return (format.indexOf('LVTime') === 0) || (format.indexOf('LVRelativeTime') === 0);
    };

    var toFlotTimeFormat = function (format) {
        if (format.indexOf('LVTime') === 0) {
            return '%A';
        }

        if (format.indexOf('LVRelativeTime') === 0) {
            return '%r';
        }

        return null;
    };

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'show',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'label',
            defaultValue: ''
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'axisPosition',
            defaultValue: 'left'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'showLabel',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'minimum',
            defaultValue: 0
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'maximum',
            defaultValue: 1
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'autoScale',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'logScale',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'format',
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

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);

        if (this.parentElement instanceof NationalInstruments.HtmlVI.Elements.CartesianGraphBase) {
            this._parentGraph = this.parentElement;
            this.sendEventToParentGraph('ni-cartesian-axis-attached');
        } else {
            NI_SUPPORT.error('Axis with following id does not have a parentGraph', this.niControlId);
            this._parentGraph = undefined;
        }

        return firstCall;
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        this.sendEventToParentGraph('ni-axis-changed');
    };

    proto.detachedCallback = function () {
        parent.prototype.detachedCallback.call(this);

        this.sendEventToParentGraph('ni-cartesian-axis-detached');
        this._parentGraph = undefined;
    };

    // here we transform the configuration from the one used by the custom element to the one understood by Flot
    proto.getViewConfig = function () {
        return {
            'axisLabel': this.showLabel ? this.label : undefined,
            'show': this.show,
            'position': this.axisPosition,
            'min': this.autoScale ? undefined : this.minimum,
            'max': this.autoScale ? undefined : this.maximum,
            'mode': this.logScale ? 'log' : 'linear',
            'element': this,
            'format': isTimeAxis(this.format) ? 'time' : null,
            'timeformat': toFlotTimeFormat(this.format)
        };
    };

    // get the flot axis coresponding to this element
    proto.getFlotAxis = function () {
        var graph = this._parentGraph.graph;
        var axes = graph.getAxes();
        var that = this;

        var key =  Object.keys(axes).filter(function (axis) {
            return axes[axis].options.element === that;
        })[0];

        return axes[key];
    };

    // set the axis min and max to the data min and max
    proto.scaleOnce = function () {
        var axis = this.getFlotAxis();

        this.minimum = typeof axis.datamin === 'number' ? axis.datamin : this.minimum;
        this.maximum = typeof axis.datamax === 'number' ? axis.datamax : this.maximum;
    };

    // called after an user interacts with the plot so the attributes of the element are in sync with the plot
    proto.syncWithFlot = function () {
        var axis = this.getFlotAxis();

        // if axis.options.min isn't set it means this axis is in autoscale mode
        if (typeof axis.options.min === 'number') {
            this._autoScale = false;
            this._minimum = axis.options.min;
            this._maximum = axis.options.max;
        } else {
            this._autoScale = true;
        }
    };

    proto.defineElementInfo(proto, 'ni-cartesian-axis', 'HTMLNICartesianAxis');
}(NationalInstruments.HtmlVI.Elements.CartesianAxis, NationalInstruments.HtmlVI.Elements.Visual));
