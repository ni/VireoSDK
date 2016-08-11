//****************************************
// Progress Bar Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static private reference aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.ProgressBarModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.Models.ProgressBarModel.MODEL_KIND = 'niLinearProgressBar';
    NationalInstruments.HtmlVI.Models.ProgressBarModel.OrientationEnum = Object.freeze({
        VERTICAL: 'vertical',
        HORIZONTAL: 'horizontal'
    });

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.ProgressBarModel;
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
        proto.addModelProperty(targetPrototype, { propertyName: 'orientation', defaultValue: NationalInstruments.HtmlVI.Models.ProgressBarModel.OrientationEnum.HORIZONTAL });
        proto.addModelProperty(targetPrototype, { propertyName: 'value', defaultValue: 0 });
    });

    proto.controlChanged = function () {
        parent.prototype.controlChanged.call(this, 'value', this.value);
    };

}(NationalInstruments.HtmlVI.Models.VisualModel));
