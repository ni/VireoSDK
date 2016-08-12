//****************************************
// NumericValueSelector Model
// National Instruments Copyright 2015
//****************************************
(function (parent) {
    'use strict';
    // Static private reference aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.NumericValueSelectorModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.NumericValueSelectorModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addModelProperty(targetPrototype, { propertyName: 'value', defaultValue: 0 });
        proto.addModelProperty(targetPrototype, { propertyName: 'valueType', defaultValue: NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT32 });
        proto.addModelProperty(targetPrototype, { propertyName: 'items', defaultValue: [] });
    });

    proto.controlChanged = function () {
        parent.prototype.controlChanged.call(this, 'value', this.value);
    };

}(NationalInstruments.HtmlVI.Models.VisualModel));
