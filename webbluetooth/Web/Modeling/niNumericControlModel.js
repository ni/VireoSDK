//****************************************
// Numeric Control Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static private reference aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.NumericControlModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    // None

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.NumericControlModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addModelProperty(targetPrototype, { propertyName: 'minimum', defaultValue: 0 });
        proto.addModelProperty(targetPrototype, { propertyName: 'maximum', defaultValue: 10 });
        proto.addModelProperty(targetPrototype, { propertyName: 'interval', defaultValue: 1 });
        proto.addModelProperty(targetPrototype, { propertyName: 'value', defaultValue: 0 });
        proto.addModelProperty(targetPrototype, { propertyName: 'valueType', defaultValue: NationalInstruments.HtmlVI.NINumerics.ValueTypes.DOUBLE });
        proto.addModelProperty(targetPrototype, { propertyName: 'significantDigits', defaultValue: 2 });
        proto.addModelProperty(targetPrototype, { propertyName: 'precisionDigits', defaultValue: -1 });
        proto.addModelProperty(targetPrototype, { propertyName: 'format', defaultValue: 'floating point' });
    });

    proto.controlChanged = function () {
        parent.prototype.controlChanged.call(this, 'value', this.value);
    };

}(NationalInstruments.HtmlVI.Models.VisualModel));
