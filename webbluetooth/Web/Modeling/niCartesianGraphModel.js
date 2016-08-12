//****************************************
// Cartesian Graph Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.CartesianGraphModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.Models.CartesianGraphModel.MODEL_KIND = 'niCartesianGraph';

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.CartesianGraphModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addModelProperty(targetPrototype, {
            propertyName: 'value',
            defaultValue: [],
            customSetter: function (oldValue, newValue) {
                if (typeof newValue === 'string') {
                    return JSON.parse(newValue);
                } else {
                    return newValue;
                }
            }
        });
        proto.addModelProperty(targetPrototype, { propertyName: 'plotAreaMargin', defaultValue: '' });
    });

    NationalInstruments.HtmlVI.NIModelProvider.registerModel(child);
}(NationalInstruments.HtmlVI.Models.GraphBaseModel));
