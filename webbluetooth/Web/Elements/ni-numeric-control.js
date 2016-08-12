//****************************************
// Boolean Control Prototype
// DOM Registration: No
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.NumericControl = function () {
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
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'value',
            defaultValue: { stringValue: '0', numberValue: 0 },
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'valueType',
            defaultValue: NationalInstruments.HtmlVI.NINumerics.ValueTypes.DOUBLE
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'minimum',
            defaultValue: { stringValue: '0', numberValue: 0 }
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'maximum',
            defaultValue: { stringValue: '10', numberValue: 10 }
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'interval',
            defaultValue: { stringValue: '1', numberValue: 1 }
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'significantDigits',
            defaultValue: 6
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'precisionDigits',
            defaultValue: -1
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'format',
            defaultValue: 'floating point'
        });
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqrefContent = $('#' + childElement.id + ' .jqx-widget-content');

        jqrefContent.css({ 'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle });
    };

    proto.getRange = function () {
        if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64 && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.UINT64) {
            return this.maximum.numberValue - this.minimum.numberValue;
        } else {
            var max = new BigNumber(this.maximum.stringValue);
            return max.subtract(new BigNumber(this.minimum.stringValue)).toString();
        }
    };

}(NationalInstruments.HtmlVI.Elements.NumericControl, NationalInstruments.HtmlVI.Elements.Visual));
