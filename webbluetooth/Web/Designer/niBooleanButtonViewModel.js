//****************************************
// Boolean Button View Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.ViewModels.BooleanButtonViewModel = function (element, model) {
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
    var child = NationalInstruments.HtmlVI.ViewModels.BooleanButtonViewModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerViewModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addViewModelProperty(targetPrototype, { propertyName: 'glyph' });
    });

    proto.bindToView = function () {
        parent.prototype.bindToView.call(this);
        var that = this;

        that.element.addEventListener('value-changed', function (evt) {
            that.model.value = evt.detail.value;
            that.model.controlChanged();
        });

        that.element.addEventListener('click', function () {
            var eventType = NationalInstruments.HtmlVI.EventsEnum.BUTTON_CLICK;
            var eventData = {};
            eventData.value = this.value;
            that.model.controlEventOccurred(eventType, eventData);
        });
    };

    NationalInstruments.HtmlVI.NIModelProvider.registerViewModel(child, NationalInstruments.HtmlVI.Elements.BooleanButton, NationalInstruments.HtmlVI.Models.BooleanButtonModel);
}(NationalInstruments.HtmlVI.ViewModels.BooleanControlViewModel));
