/*jslint nomen: true, devel:true*/
/*global NationalInstruments*/
//****************************************
// Color scale Custom Element
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.ColorScale = function () {
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
            propertyName: 'show',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'axisPosition',
            defaultValue: 'right'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'highColor',
            defaultValue: '#ffffff'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'lowColor',
            defaultValue: '#000000'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'markers',
            defaultValue: '' // json string for array of markers
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'autoScale',
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
            propertyName: 'axisLabel',
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

        if (this.parentElement instanceof NationalInstruments.HtmlVI.Elements.IntensityGraph) {
            this._parentGraph = this.parentElement;
            this.sendEventToParentGraph('ni-cartesian-axis-attached');
        } else {
            NI_SUPPORT.error('Color scale with following id does not have a parentGraph', this.niControlId);
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

    // getViewConfig transforms the configuration from the one used by the custom element to the one understood by Flot */
    proto.getViewConfig = function () {
        return {
            'show': this.show,
            'autoScale': this.autoScale,
            'min': this.minimum,
            'max': this.maximum,
            'position': this.axisPosition,
            'lowColor': this.lowColor,
            'highColor': this.highColor,
            'markers': this.markers
        };
    };

    proto.defineElementInfo(proto, 'ni-color-scale', 'HTMLNIColorScale');
}(NationalInstruments.HtmlVI.Elements.ColorScale, NationalInstruments.HtmlVI.Elements.Visual));
