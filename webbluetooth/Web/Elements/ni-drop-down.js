//****************************************
// DropDown Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.DropDown = function () {
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
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'selectedIndex',
            defaultValue: -1,
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            childElement,
            jqref,
            that = this;

        if (firstCall === true) {
            widgetSettings = {};

            childElement = document.createElement('div');
            childElement.style.width = '100%';
            childElement.style.height = '100%';
            childElement.style.fontSize = $(this).css('font-size');
            childElement.style.fontFamily = $(this).css('font-family');
            childElement.style.fontWeight = $(this).css('font-weight');
            childElement.style.fontStyle = $(this).css('font-style');
            this.appendChild(childElement);

            jqref = $(childElement);
            jqref.jqxDropDownList(widgetSettings);
            jqref.jqxDropDownList({ source: JSON.parse(this.source), selectedIndex: this.selectedIndex, autoDropDownHeight: true, disabled: this.readOnly });
            jqref.on('change', function (event) {
                that.selectedIndex = event.args.index;
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

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        switch (propertyName) {
            case 'source':
                jqref.jqxDropDownList({ source: JSON.parse(this.source) });
                break;
            case 'selectedIndex':
                jqref.jqxDropDownList({ selectedIndex: this.selectedIndex });
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-drop-down', 'HTMLNIDropDown');
}(NationalInstruments.HtmlVI.Elements.DropDown, NationalInstruments.HtmlVI.Elements.Selector));
