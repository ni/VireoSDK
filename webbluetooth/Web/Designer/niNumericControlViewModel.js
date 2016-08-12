//****************************************
// Visual View Model
// National Instruments Copyright 2014
//****************************************
(function (parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var VALUE_CONVERTER = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

    // Constructor Function
    NationalInstruments.HtmlVI.ViewModels.NumericControlViewModel = function (element, model) {
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
    var child = NationalInstruments.HtmlVI.ViewModels.NumericControlViewModel;
    var proto = NI_SUPPORT.inheritFromParent(child, parent);

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.registerViewModelProperties(proto, function (targetPrototype, parentMethodName) {
        parent.prototype[parentMethodName].call(this, targetPrototype, parentMethodName);

        proto.addViewModelProperty(targetPrototype, { propertyName: 'valueType' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'significantDigits' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'precisionDigits' });
        proto.addViewModelProperty(targetPrototype, { propertyName: 'format' });
    });

    proto.modelPropertyChanged = function (propertyName) {
        var renderBuffer = parent.prototype.modelPropertyChanged.call(this, propertyName);

        switch (propertyName) {
            case 'maximum':
                if (this.model.maximum !== null) {
                    renderBuffer.properties.maximum = VALUE_CONVERTER.convert(this.model.maximum, this.model.valueType);
                }

                break;
            case 'minimum':
                if (this.model.minimum !== null) {
                    renderBuffer.properties.minimum = VALUE_CONVERTER.convert(this.model.minimum, this.model.valueType);
                }

                break;
            case 'interval':
                if (this.model.interval !== null) {
                    renderBuffer.properties.interval = VALUE_CONVERTER.convert(this.model.interval, this.model.valueType);
                }

                break;
            case 'value':
                renderBuffer.properties.valueNonSignaling = VALUE_CONVERTER.convert(this.model.value, this.model.valueType);
                break;
        }

        return renderBuffer;
    };

    proto.updateModelFromElement = function () {
        parent.prototype.updateModelFromElement.call(this);

        var model = this.model,
            element = this.element;

        model.value = VALUE_CONVERTER.convertBack(element.value, element.valueType);
        model.defaultValue = VALUE_CONVERTER.convertBack(element.value, element.valueType);
        model.maximum = VALUE_CONVERTER.convertBack(element.maximum, element.valueType);
        model.minimum = VALUE_CONVERTER.convertBack(element.minimum, element.valueType);
        model.interval = VALUE_CONVERTER.convertBack(element.interval, element.valueType);
    };

    proto.applyModelToElement = function () {
        parent.prototype.applyModelToElement.call(this);

        var model = this.model,
            element = this.element;

        element.valueNonSignaling = VALUE_CONVERTER.convert(model.value, model.valueType);
        element.maximum = VALUE_CONVERTER.convert(model.maximum, model.valueType);
        element.minimum = VALUE_CONVERTER.convert(model.minimum, model.valueType);
        element.interval = VALUE_CONVERTER.convert(model.interval, model.valueType);
    };
}(NationalInstruments.HtmlVI.ViewModels.VisualViewModel));
