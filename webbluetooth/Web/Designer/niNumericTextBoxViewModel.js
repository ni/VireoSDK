//****************************************
// Numeric TextBox View Model
// National Instruments Copyright 2014
//****************************************

(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var NUM_VAL_CONVERTER = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

    // Constructor Function
    NationalInstruments.HtmlVI.ViewModels.NumericTextBoxViewModel = function (element, model) {
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
    var child = NationalInstruments.HtmlVI.ViewModels.NumericTextBoxViewModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.bindToView = function () {
        parent.prototype.bindToView.call(this);
        var that = this;

        this.enableResizeHack();

        this.element.addEventListener('value-changed', function (event) {
            that.model.value = NUM_VAL_CONVERTER.convertBack(event.detail.value, that.model.valueType);

            that.model.controlChanged();
        });
    };

    NationalInstruments.HtmlVI.NIModelProvider.registerViewModel(child, NationalInstruments.HtmlVI.Elements.NumericTextBox, NationalInstruments.HtmlVI.Models.NumericTextBoxModel);
}(NationalInstruments.HtmlVI.ViewModels.NumericControlViewModel));
