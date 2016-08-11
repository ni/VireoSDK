//****************************************
// CheckBox Prototype
// DOM Registration: HTMLNICheckBox
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.CheckBox = function () {
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
            childElement,
            jqref;

        if (firstCall === true) {
            widgetSettings = {};
            widgetSettings.checked = this.value;

            childElement = document.createElement('div');
            this.appendChild(childElement);

            var textContent = document.createElement('label');
            this.appendChild(textContent);
            textContent.innerHTML = this.contentVisible ? this.content : '';
            textContent.style.fontSize = $(this).css('font-size');
            textContent.style.fontFamily =  $(this).css('font-family');
            textContent.style.fontWeight =  $(this).css('font-weight');
            textContent.style.fontStyle =  $(this).css('font-style');
            jqref = $(childElement);
            jqref.jqxCheckBox(widgetSettings);
            jqref.jqxCheckBox('_removeHandlers');

            // Associate the textContent with the jqxWidget
            textContent.setAttribute('for', childElement.id);

            if (this.value === true) {
                jqref.jqxCheckBox('check');
                jqref.find(' .jqx-checkbox-check-checked').addClass('ni-check-mark-icon');
            } else {
                jqref.jqxCheckBox('unCheck');
                jqref.find(' .jqx-checkbox-check-checked').removeClass('ni-check-mark-icon');
            }

            // Adding CSS class names
            jqref.addClass('ni-boolean-box');
            jqref.find(' .jqx-checkbox-default').addClass('ni-check-mark-box');
        }

        return firstCall;
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var textContent = this.lastElementChild;

        $(textContent).css({ 'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            textContent = this.lastElementChild,
            jqref = $(childElement),
            that = this;

        switch (propertyName) {
        case 'content':
            textContent.innerHTML = this.contentVisible ? this.content : '';
            break;
        case 'contentVisible':
            textContent.innerHTML = this.contentVisible ? this.content : '';
            break;
        case 'value':
            jqref.jqxCheckBox({
                checked: that.value
            });
            if (that.value === true) {
                jqref.find(' .jqx-checkbox-check-checked').addClass('ni-check-mark-icon');
            } else {
                jqref.find(' .jqx-checkbox-check-checked').removeClass('ni-check-mark-icon');
            }

            break;
        default:
            break;
        }
    };

    proto.defineElementInfo(proto, 'ni-check-box', 'HTMLNICheckBox');
}(NationalInstruments.HtmlVI.Elements.CheckBox, NationalInstruments.HtmlVI.Elements.BooleanControl));
