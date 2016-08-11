//****************************************
// Cartesian Axis Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.CartesianAxisModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.Models.CartesianAxisModel.MODEL_KIND = 'niCartesianAxis';

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.CartesianAxisModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addModelProperty(targetPrototype, { propertyName: 'autoScale', defaultValue: true });
        proto.addModelProperty(targetPrototype, { propertyName: 'maximum', defaultValue: 0 });
        proto.addModelProperty(targetPrototype, { propertyName: 'minimum', defaultValue: 0 });
        proto.addModelProperty(targetPrototype, { propertyName: 'axisPosition', defaultValue: 'left' });
        proto.addModelProperty(targetPrototype, { propertyName: 'showLabel', defaultValue: true });
        proto.addModelProperty(targetPrototype, { propertyName: 'label', defaultValue: '' });
        proto.addModelProperty(targetPrototype, { propertyName: 'logScale', defaultValue: false });
        proto.addModelProperty(targetPrototype, { propertyName: 'show', defaultValue: true });
        proto.addModelProperty(targetPrototype, { propertyName: 'format', defaultValue: '' });
    });

    NationalInstruments.HtmlVI.NIModelProvider.registerModel(child);
}(NationalInstruments.HtmlVI.Models.VisualComponentModel));
