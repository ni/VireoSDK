//****************************************
// Chart Graph Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static private reference aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.IntensityGraphModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.Models.IntensityGraphModel.MODEL_KIND = 'niIntensityGraph';

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.IntensityGraphModel;
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
                var sourceValuesArray;
                if (typeof newValue === 'string') {
                    sourceValuesArray = JSON.parse(newValue);
                } else {
                    sourceValuesArray = newValue;
                }

                // TODO mraj is it intended for the else case to not change the value?
                if (sourceValuesArray.length > 0) {
                    return sourceValuesArray;
                } else {
                    return oldValue;
                }
            }
        });
    });

    NationalInstruments.HtmlVI.NIModelProvider.registerModel(child);
}(NationalInstruments.HtmlVI.Models.GraphBaseModel));
