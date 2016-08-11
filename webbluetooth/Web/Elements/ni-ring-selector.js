//****************************************
// RingSelector Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.RingSelector = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static private reference aliases
    var NUM_VAL_CONVERTER = NationalInstruments.HtmlVI.ValueConverters.NumericValueConverter;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'allowUndefined',
            defaultValue: false
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            jqref,
            jqrefNumeric,
            that = this;

        if (firstCall === true) {
            widgetSettings = {};
            var dropDownContainer = document.createElement('div');
            dropDownContainer.classList.add('ni-dropdown-container');
            dropDownContainer.style.fontSize = $(this).css('font-size');
            dropDownContainer.style.fontFamily = $(this).css('font-family');
            dropDownContainer.style.fontWeight = $(this).css('font-weight');
            dropDownContainer.style.fontStyle = $(this).css('font-style');
            this.appendChild(dropDownContainer);

            var numericContainer = document.createElement('div');
            numericContainer.classList.add('ni-numeric-container');
            this.appendChild(numericContainer);

            var dropdownElement = document.createElement('div');
            var numericEntry = document.createElement('div');

            dropDownContainer.appendChild(dropdownElement);
            numericContainer.appendChild(numericEntry);
            jqref = $(dropdownElement);
            jqref.jqxDropDownList(widgetSettings);

            var textElement = document.createElement('input');
            textElement.type = 'text';
            numericEntry.appendChild(textElement);
            var divElement = document.createElement('div');
            numericEntry.appendChild(divElement);
            jqrefNumeric = $(numericEntry);
            var numericWidgetSettings = {};
            numericWidgetSettings.readOnly = this.readOnly;
            numericWidgetSettings.spinButtons = false;
            numericWidgetSettings.width = '100%';
            numericWidgetSettings.height = '100%';

            jqrefNumeric.jqxFormattedInput(numericWidgetSettings);

            var data = this.getSourceAndSelectedIndexFromSource();
            var selectedIndex = data.selectedIndex;
            var source = data.source;

            jqref.jqxDropDownList({ source: source, selectedIndex: selectedIndex, autoDropDownHeight: true, disabled: this.readOnly });
            jqref.on('change', function (event) {
                var args = event.args;
                if (args) {
                    var displayValue = args.item.value;
                    var numericIndex = that.selectChangedHandler(displayValue);
                    jqrefNumeric.jqxFormattedInput('val', numericIndex);
                }
            });
            jqrefNumeric.on('valueChanged', function (event) {
                that.value = NUM_VAL_CONVERTER.convert(event.args.value, that.valueType, true);
            });
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        var dropChildElem = this.children[0],
            numericChildElem = this.children[1],
            dropJqref = $(dropChildElem.firstElementChild),
            numericJqref = $(numericChildElem.firstElementChild);

        if (this.allowUndefined) {
            size.width -= 50;
            numericJqref.trigger('resize');
        }

        dropJqref.jqxDropDownList(size);
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var jqref = $(this.children[0].firstElementChild);
        var numericJqref = $(this.children[1].firstElementChild);
        switch (propertyName) {
            case 'items':
            case 'readOnly':
                this.propertyUpdatedHelper(propertyName, jqref);
                break;
            case 'value':
                this.propertyUpdatedHelper(propertyName, jqref);

                var numericWidgetSettings = {
                    value: NUM_VAL_CONVERTER.convertBack(this.value, this.valueType)
                };
                numericJqref.jqxFormattedInput(numericWidgetSettings);
                break;
            case 'allowUndefined':
                var width = $(this).width();
                if (this.allowUndefined) {
                    width -= 50;
                }

                jqref.jqxDropDownList({ width: width });
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-ring-selector', 'HTMLNIRingSelector');
}(NationalInstruments.HtmlVI.Elements.RingSelector, NationalInstruments.HtmlVI.Elements.NumericValueSelector));
