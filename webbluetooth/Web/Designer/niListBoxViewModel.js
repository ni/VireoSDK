//****************************************
// ListBox View Model
// National Instruments Copyright 2015
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var SELECTION_MODE_ENUM = NationalInstruments.HtmlVI.Elements.ListBox.SelectionModeEnum;

    // Constructor Function
    NationalInstruments.HtmlVI.ViewModels.ListBoxViewModel = function (element, model) {
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
    var child = NationalInstruments.HtmlVI.ViewModels.ListBoxViewModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    var convertSelectedIndexFromModel = function (selectedIndex) {
        var result = selectedIndex;
        if (!Array.isArray(selectedIndex)) {
            result = selectedIndex === -1 ? [] : [selectedIndex];
        }

        return JSON.stringify(result);
    };

    var convertSelectedIndexToModel = function (selectedIndex, selectionMode) {
        var result = JSON.parse(selectedIndex);
        if (selectionMode === SELECTION_MODE_ENUM.ZERO_OR_ONE || selectionMode === SELECTION_MODE_ENUM.ONE) {
            return result.length > 0 ? result[0] : -1;
        } else {
            return result;
        }
    };

    // Public Prototype Methods
    proto.registerViewModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addViewModelProperty(targetPrototype, { propertyName: 'selectionMode' });
    });

    proto.bindToView = function () {
        parent.prototype.bindToView.call(this);
        var that = this;

        that.enableResizeHack();

        that.element.addEventListener('selected-index-changed', function (evt) {
            that.model.selectedIndex = convertSelectedIndexToModel(evt.detail.selectedIndex, that.element.selectionMode);
            that.model.controlChanged();
        });
    };

    proto.modelPropertyChanged = function (propertyName) {
        var renderBuffer = parent.prototype.modelPropertyChanged.call(this, propertyName);

        switch (propertyName) {
            case 'selectedIndex':
                renderBuffer.properties.selectedIndexNonSignaling = convertSelectedIndexFromModel(this.model.selectedIndex);
                break;
        }

        return renderBuffer;
    };

    proto.updateModelFromElement = function () {
        parent.prototype.updateModelFromElement.call(this);

        var selectedIndex = convertSelectedIndexToModel(this.element.selectedIndex, this.element.selectionMode);

        this.model.selectedIndex = selectedIndex;
        this.model.defaultValue = selectedIndex;
    };

    proto.applyModelToElement = function () {
        parent.prototype.applyModelToElement.call(this);

        this.element.selectedIndex = convertSelectedIndexFromModel(this.model.selectedIndex);
    };

    NationalInstruments.HtmlVI.NIModelProvider.registerViewModel(child, NationalInstruments.HtmlVI.Elements.ListBox, NationalInstruments.HtmlVI.Models.ListBoxModel);
}(NationalInstruments.HtmlVI.ViewModels.SelectorViewModel));
