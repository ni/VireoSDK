//****************************************
// Hyperlink View Model
// National Instruments Copyright 2015
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.ViewModels.HyperlinkViewModel = function (element, model) {
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
    var child = NationalInstruments.HtmlVI.ViewModels.HyperlinkViewModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerViewModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addViewModelProperty(targetPrototype, { propertyName: 'href' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'content' });
    });

    proto.modelPropertyChanged = function (propertyName) {
        var renderBuffer = parent.prototype.modelPropertyChanged.call(this, propertyName);

        switch (propertyName) {
            case 'foreground':
                renderBuffer.cssStyles.color = this.model.foreground;
                this.element.firstChild.style.color = this.model.foreground; // APD temporary
                break;
            case 'fontSize':
                renderBuffer.cssStyles.fontSize = this.model.fontSize;
                break;
            case 'fontFamily':
                renderBuffer.cssStyles.fontFamily = this.model.fontFamily;
                break;
        }

        return renderBuffer;
    };

    proto.updateModelFromElement = function () {
        parent.prototype.updateModelFromElement.call(this);

        this.model.defaultValue = this.element.href;
    };

    NationalInstruments.HtmlVI.NIModelProvider.registerViewModel(child, NationalInstruments.HtmlVI.Elements.Hyperlink, NationalInstruments.HtmlVI.Models.HyperlinkModel);
}(NationalInstruments.HtmlVI.ViewModels.VisualViewModel));
