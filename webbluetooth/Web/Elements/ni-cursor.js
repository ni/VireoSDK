//****************************************
// Cursor Custom Element
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.Cursor = function () {
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
    var _cachedFont = '';

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'label',
            defaultValue: ''
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'targetShape',
            defaultValue: 'ellipse'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'cursorColor',
            defaultValue: '#d42243'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'crosshairStyle',
            defaultValue: 'both'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'show',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'showLabel',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'showValue',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'snapToData',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'x',
            defaultValue: 0.5
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'y',
            defaultValue: 0.5
        });
    };

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);

        // Public Instance Properties
        this.cursor = null;

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

        if (this.parentElement instanceof NationalInstruments.HtmlVI.Elements.CartesianGraph ||
            this.parentElement instanceof NationalInstruments.HtmlVI.Elements.Chart) {
            this._parentGraph = this.parentElement;
            _cachedFont = window.getComputedStyle(this).font;
            this.sendEventToParentGraph('ni-cursor-attached');
        } else {
            NI_SUPPORT.error('Cursor with the following id does not have a parentGraph', this.niControlId);
            this._parentGraph = undefined;
        }

        return firstCall;
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        this.sendEventToParentGraph('ni-cursor-changed');
    };

    proto.detachedCallback = function () {
        parent.prototype.detachedCallback.call(this);

        this.sendEventToParentGraph('ni-cursor-detached');
        this._parentGraph = undefined;
    };

    proto.setCursor = function (cursor) {
        this.cursor = cursor;
    };

    proto.updateCursorElement = function (data) {
        // TODO mraj this._x and this._y are underlying private properties and should not be assigned to directly
        this._x = this.cursor.position.relativeX;
        this._y = this.cursor.position.relativeY;
        $(this).trigger('cursorUpdated', data);
    };

    proto.getViewConfig = function () {
        var crosshairStyle =  this.crosshairStyle;
        var mode;

        if (crosshairStyle === 'both') {
            mode = 'xy';
        } else if (crosshairStyle === 'horizontal') {
            mode = 'y';
        } else if (crosshairStyle === 'vertical') {
            mode = 'x';
        } else {
            mode = null;
        }

        return {
            'show': this.show,
            'showLabel': this.showLabel,
            'showValuesRelativeToSeries': this.showValue ? 0 : undefined,
            'name': this.label,
            'color': this.cursorColor,
            'snapToPlot': this.snapToData ? 0 : undefined,
            'mode': mode,
            'symbol': this.targetShape,
            'font': _cachedFont,
            'position': {
                'relativeX': this.x,
                'relativeY': this.y
            }
        };
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);
        _cachedFont = this.style.font;
        this.sendEventToParentGraph('ni-cursor-changed');
    };

    proto.defineElementInfo(proto, 'ni-cursor', 'HTMLNICursor');
}(NationalInstruments.HtmlVI.Elements.Cursor, NationalInstruments.HtmlVI.Elements.Visual));
