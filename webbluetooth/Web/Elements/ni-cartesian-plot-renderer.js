/*jslint nomen: true, devel:true*/
/*global NationalInstruments*/
//****************************************
// Boolean Content Control Prototype
// DOM Registration: No
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.CartesianPlotRenderer = function () {
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
            propertyName: 'lineWidth',
            defaultValue: 1
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'lineStyle',
            defaultValue: 'solid'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'lineStroke',
            defaultValue: '#ff0000'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'pointColor',
            defaultValue: ''
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'areaFill',
            defaultValue: ''
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'barFill',
            defaultValue: ''
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'areaBaseLine',
            defaultValue: 'zero'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'pointSize',
            defaultValue: 1
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'pointShape',
            defaultValue: 'ellipse'
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        // None

        // Private Instance Properties
        this._parentPlot = undefined;
    };

    proto.sendEventToParentPlot = function (name) {
        var eventConfig;

        if (this._parentPlot !== undefined) {
            eventConfig = {
                bubbles: true,
                cancelable: true,
                detail: {
                    element: this
                }
            };

            this._parentPlot.dispatchEvent(new CustomEvent(name, eventConfig));
        }
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);

        if (this.parentElement instanceof NationalInstruments.HtmlVI.Elements.CartesianPlot) {
            this._parentPlot = this.parentElement;
            this.sendEventToParentPlot('ni-cartesian-plot-renderer-attached');
        } else {
            NI_SUPPORT.error('Plot renderer with following id does not have a parentPlot', this.niControlId);
            this._parentPlot = undefined;
        }

        return firstCall;
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        this.sendEventToParentPlot('ni-cartesian-plot-renderer-changed');
    };

    proto.detachedCallback = function () {
        parent.prototype.detachedCallback.call(this);

        this.sendEventToParentPlot('ni-cartesian-plot-renderer-detached');
    };

    proto.toFlotLineStyle = function (style) {
        switch (style) {
            case 'solid':
                return undefined;
            case 'dot':
                return [this.lineWidth, this.lineWidth * 2];
            case 'mediumdash':
                return [this.lineWidth * 3, this.lineWidth * 2];
            case 'dashdot':
                return [this.lineWidth * 3, this.lineWidth * 2, this.lineWidth, this.lineWidth * 2];
            case 'largedash':
                return [this.lineWidth * 5, this.lineWidth * 3];
            default:
                return undefined;
        }
    };

    var areaFillOpacity = 0.6;

    proto.getViewConfig = function () {
        return {
            color: this.lineStroke || this.pointColor || this.areaFill || this.barFill,
            lines: {
                show: this.lineStroke !== '' || this.areaFill !== '',
                lineWidth: this.lineWidth,
                fill: this.areaFill !== '' ? areaFillOpacity : false,
                zero: false,
                dashes: this.toFlotLineStyle(this.lineStyle)
            },
            points: {
                show: this.pointColor !== '',
                radius: this.pointSize ? this.pointSize / 2 : 2,
                symbol: this.pointShape
            },
            bars: {
                show: this.barFill !== '',
                barWidth: 0.75, // TODO this is only valid if the distance between points is 1
                align: 'center',
                zero: false
            }
        };
    };

    proto.defineElementInfo(proto, 'ni-cartesian-plot-renderer', 'HTMLNICartesianPlotRenderer');
}(NationalInstruments.HtmlVI.Elements.CartesianPlotRenderer, NationalInstruments.HtmlVI.Elements.Visual));
