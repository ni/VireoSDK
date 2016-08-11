//****************************************
// Boolean LED Prototype
// DOM Registration: HTMLNIBooleanLED
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.BooleanLED = function () {
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

        // Valid values:
        // round, square
        proto.addProperty(targetPrototype, {
            propertyName: 'shape',
            defaultValue: 'round'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'highlight',
            defaultValue: ''
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            childElement,
            jqref;

        if (firstCall === true) {
            widgetSettings = {};
            widgetSettings.toggled = this.value;

            childElement = document.createElement('input');
            childElement.type = 'button';
            childElement.style.width = '100%';
            childElement.style.height = '100%';
            widgetSettings.disabled = this.readOnly;
            this.appendChild(childElement);

            jqref = $(childElement);
            jqref.jqxToggleButton(widgetSettings);
            jqref.jqxToggleButton('_removeHandlers');

            this.updateContent(this, jqref);

            if (this.value === true) {
                jqref.jqxToggleButton('check');
            } else {
                jqref.jqxToggleButton('unCheck');
            }

            this.updateColors(childElement);

            // Adding CSS class names
            jqref.addClass('ni-boolean-box');
            this.updateOnCSSClass();
        }

        return firstCall;
    };

    proto.updateContent = function (that, jqref) {
        if (that.contentVisible === true) {
            jqref.attr('value', that.value ? that.trueContent : that.falseContent);
        } else {
            jqref.attr('value', '');
        }
    };

    proto.updateColors = function (childElement) {
        if (this.value === true) {
            $(childElement).css({ 'background-color': this.highlight, 'border-color': '#000000' });
        } else {
            $(childElement).css({ 'border-color': this.highlight, 'background-color': '#ffffff' });
        }
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        switch (propertyName) {
            case 'value':
                jqref.jqxToggleButton({
                    toggled: this.value
                });
                this.updateContent(this, jqref);
                this.updateColors(childElement);
                this.updateOnCSSClass();
                break;
            case 'readOnly':
                jqref.jqxToggleButton({ disabled: this.readOnly });
                break;
            case 'contentVisible':
            case 'trueContent':
            case 'falseContent':
                this.updateContent(this, jqref);
                break;
            case 'highlight':
                this.updateColors(childElement);
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-boolean-led', 'HTMLNIBooleanLED');
})(NationalInstruments.HtmlVI.Elements.BooleanLED, NationalInstruments.HtmlVI.Elements.BooleanContentControl);
