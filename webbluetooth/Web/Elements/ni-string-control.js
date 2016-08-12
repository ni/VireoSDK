//****************************************
// String Control Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.StringControl = function () {
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

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'text',
            defaultValue: '',
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });
        proto.addProperty(targetPrototype, {
            propertyName: 'acceptsReturn',
            defaultValue: false
        });
        proto.addProperty(targetPrototype, {
            propertyName: 'typeToReplace',
            defaultValue: false
        });
    };

    proto.attachedCallback = function () {
        var childElement,
            jqref,
            that = this,
            editingContent = false;
        var firstCall = parent.prototype.attachedCallback.call(this);

        if (firstCall === true) {
            childElement = document.createElement('textarea');
            childElement.style.width = '100%';
            childElement.style.height = '100%';

            this.appendChild(childElement);

            jqref = $(childElement);
            jqref.text(this.text);
            jqref.attr('disabled', this.readOnly);
            jqref.css('font-size', $(this).css('font-size'));
            jqref.css('font-family', $(this).css('font-family'));
            jqref.css('font-weight', $(this).css('font-weight'));
            jqref.css('font-style', $(this).css('font-style'));
            jqref.css('resize', 'none');
            jqref.on('change', function () {
                var newVal = jqref.val();
                if (that.text !== newVal) {
                    that.text = newVal;
                }
            });
            jqref.on('click', function () {
                if (that.typeToReplace && !editingContent) {
                    editingContent = true;
                    this.focus();
                    this.select();
                }
            });
            jqref.on('blur', function () {
                var newVal = jqref.val();
                editingContent = false;
                if (that.text !== newVal) {
                    that.text = newVal;
                }
            });
            jqref.on('keydown', function (e) {
                if (that.acceptsReturn === false && e.keyCode === 13) {
                    jqref.blur();
                    return false;
                }
            });

            // Adding CSS class names
            jqref.addClass('ni-text-field');
        }

        return firstCall;
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        jqref.css({ 'font-size': fontSize,
                   'font-family': fontFamily,
                   'font-weight': fontWeight,
                   'font-style': fontStyle });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        switch (propertyName) {
            case 'readOnly':
                jqref.attr({disabled: this.readOnly});
                break;
            case 'text':
                jqref.text(this.text);
                break;
            case 'acceptsReturn':
                break;
            case 'typeToReplace':
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-string-control', 'HTMLNIStringControl');
}(NationalInstruments.HtmlVI.Elements.StringControl, NationalInstruments.HtmlVI.Elements.Visual));
