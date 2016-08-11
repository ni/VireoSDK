//****************************************
// CheckBox View Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.ViewModels.CheckBoxViewModel = function (element, model) {
        parent.call(this, element, model);

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
    var child = NationalInstruments.HtmlVI.ViewModels.CheckBoxViewModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.bindToView = function () {
        parent.prototype.bindToView.call(this);
        var that = this;

        that.element.addEventListener('value-changed', function (evt) {
            that.model.value = evt.detail.value;
            that.model.controlChanged();
        });
    };

    NationalInstruments.HtmlVI.NIModelProvider.registerViewModel(child, NationalInstruments.HtmlVI.Elements.CheckBox, NationalInstruments.HtmlVI.Models.CheckBoxModel);
}(NationalInstruments.HtmlVI.ViewModels.BooleanControlViewModel));
