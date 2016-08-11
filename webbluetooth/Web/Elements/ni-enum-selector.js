//****************************************
// EnumSelector Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.EnumSelector = function () {
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

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            jqref,
            that = this;

        if (firstCall === true) {
            widgetSettings = {};
            var dropDownChildElement = document.createElement('div');
            dropDownChildElement.style.width = '100%';
            dropDownChildElement.style.height = '100%';
            dropDownChildElement.style.fontSize = $(this).css('font-size');
            dropDownChildElement.style.fontFamily = $(this).css('font-family');
            dropDownChildElement.style.fontWeight = $(this).css('font-weight');
            dropDownChildElement.style.fontStyle = $(this).css('font-style');
            this.appendChild(dropDownChildElement);
            jqref = $(dropDownChildElement);

            var data = this.getSourceAndSelectedIndexFromSource();
            var selectedIndex = data.selectedIndex;
            var source = data.source;

            jqref.jqxDropDownList({ source: source, selectedIndex: selectedIndex, autoDropDownHeight: true, disabled: this.readOnly });
            jqref.on('change', function (event) {
                var args = event.args;
                if (args) {
                    var displayValue = args.item.value;
                    that.selectChangedHandler(displayValue);
                }
            });
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        $(this.firstElementChild).jqxDropDownList(size);
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);
        var jqref = $(this.firstElementChild);
        switch (propertyName) {
            case 'items':
            case 'value':
            case 'readOnly':
                this.propertyUpdatedHelper.call(this, propertyName, jqref);
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-enum-selector', 'HTMLNIEnumSelector');
}(NationalInstruments.HtmlVI.Elements.EnumSelector, NationalInstruments.HtmlVI.Elements.NumericValueSelector));
