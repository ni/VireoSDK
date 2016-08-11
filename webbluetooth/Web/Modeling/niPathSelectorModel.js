//****************************************
// Path Selector Control Model
// National Instruments Copyright 2015
//****************************************
(function (parent) {
    'use strict';
    // Static private reference aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var PATH_TYPE_ENUM = NationalInstruments.HtmlVI.Elements.PathSelector.PathTypeEnum;

    // Constructor Function
    NationalInstruments.HtmlVI.Models.PathSelectorModel = function (id) {
        parent.call(this, id);

        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    NationalInstruments.HtmlVI.Models.PathSelectorModel.MODEL_KIND = 'niPathSelector';

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.Models.PathSelectorModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addModelProperty(targetPrototype, { propertyName: 'path', defaultValue: { components: [], type: PATH_TYPE_ENUM.ABSOLUTE } });
        proto.addModelProperty(targetPrototype, { propertyName: 'format', defaultValue: 'windows' });
    });

    proto.controlChanged = function () {
        parent.prototype.controlChanged.call(this, 'path', this.path);
    };

    NationalInstruments.HtmlVI.NIModelProvider.registerModel(child);
}(NationalInstruments.HtmlVI.Models.VisualModel));
