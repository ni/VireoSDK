//****************************************
// Boolean Button Prototype
// DOM Registration: HTMLNIBooleanButton
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.BooleanButton = function () {
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
            propertyName: 'glyph',
            defaultValue: 0
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

            NationalInstruments.HtmlVI.UIActivityService.unregister(this.niControlId); // unbind the "press" event

            childElement = document.createElement('button');
            childElement.type = 'button';
            var glyphSpan = document.createElement('span');
            $(glyphSpan).css({ 'font-family': 'FontAwesome', 'font-size': $(this).css('font-size') });
            var glyph = document.createTextNode(this.glyph > 0 ? String.fromCharCode(this.glyph) + ' ' : '');
            glyphSpan.appendChild(glyph);
            childElement.appendChild(glyphSpan);

            var contentSpan = document.createElement('span');
            $(contentSpan).css({ 'font-family': $(this).css('font-family'), 'font-size': $(this).css('font-size') });
            var content = document.createTextNode(this.content);
            contentSpan.appendChild(content);
            childElement.appendChild(contentSpan);
            childElement.style.width = '100%';
            childElement.style.height = '100%';
            widgetSettings.disabled = this.readOnly;
            childElement.style.fontWeight = $(this).css('font-weight');
            childElement.style.fontStyle = $(this).css('font-style');
            this.appendChild(childElement);

            jqref = $(childElement);
            // jqref.jqxToggleButton(widgetSettings);
            // jqref.jqxToggleButton('_removeHandlers');
            var that = this;
            childElement.onclick = function() {
                that.value = !that.value;
                that.valueChanged();
            };

            // Adding CSS class names
            jqref.addClass('ni-boolean-box');
            this.updateOnCSSClass();
        }

        return firstCall;
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild;
        var glyphSpan, contentSpan;
        glyphSpan = childElement.childNodes[0];
        contentSpan = childElement.childNodes[1];

        $(glyphSpan).css('font-size', fontSize);

        $(contentSpan).css({ 'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            jqref = $(childElement);
        var glyphSpan, contentSpan;
        glyphSpan = childElement.childNodes[0];
        contentSpan = childElement.childNodes[1];

        switch (propertyName) {
        case 'content':
            $(contentSpan).text(this.content);
            break;
        case 'contentVisible':
            $(contentSpan).text(this.contentVisible ? this.content : '');
            break;
        case 'value':
            jqref.jqxToggleButton({
                toggled: this.value
            });
            this.updateOnCSSClass();
            break;
        case 'readOnly':
            jqref.jqxToggleButton({ disabled: this.readOnly });
            break;
        case 'glyph':
            $(glyphSpan).text(this.contentVisible && this.glyph > 0 ? String.fromCharCode(this.glyph) + ' ' : '');
            break;
        default:
            break;
        }
    };

    proto.defineElementInfo(proto, 'ni-boolean-button', 'HTMLNIBooleanButton');
}(NationalInstruments.HtmlVI.Elements.BooleanButton, NationalInstruments.HtmlVI.Elements.BooleanControl));
