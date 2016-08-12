//****************************************
// Path Selector Control Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.PathSelector = function () {
    'use strict';
};

// Static Public Variables
NationalInstruments.HtmlVI.Elements.PathSelector.PathTypeEnum = Object.freeze({
    ABSOLUTE: 'absolute',
    RELATIVE: 'relative'
});

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var $ = NationalInstruments.Globals.jQuery;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype,
        pathToObject, objectToPath, filterEmptyString;

    // Static Private Variables
    var PATH_TYPE_ENUM = NationalInstruments.HtmlVI.Elements.PathSelector.PathTypeEnum;

    // Static Private Functions
    filterEmptyString = function (str) {
        return str.length !== 0;
    };

    pathToObject = function (pathString) {

        var components = pathString.split('/'), // unix format expected.
            type;
        if (components[0].length === 0) {
            type = PATH_TYPE_ENUM.ABSOLUTE;
        } else {
            type = PATH_TYPE_ENUM.RELATIVE;
        }

        components = components.filter(filterEmptyString);
        return { components: components, type: type };
    };

    objectToPath = function (pathObject) {

        pathObject = JSON.parse(pathObject);

        if (pathObject === undefined || pathObject.components === undefined) {
            return '';
        }

        var pathString = pathObject.components.join('/');
        if (pathObject.type === PATH_TYPE_ENUM.ABSOLUTE) {
            pathString = '/' + pathString;
            // jqwidgets bug. not possible to set an absolute path containing only
            // one segment in unix format.
            if (pathObject.components.length === 1) {
                pathString += '/';
            }
        }

        return pathString;
    };

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'path',
            defaultValue: JSON.stringify({ components: [], type: PATH_TYPE_ENUM.ABSOLUTE }), // not a path.
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'format',
            defaultValue: 'windows'
        });
    };

    proto.setPath = function (pathValue) {
        // We don't want to fire more events for re-setting the path
        // once we cleared the value.
        if (!(this.isNotAPath() && pathValue === '')) {
            this.path = JSON.stringify(pathToObject(pathValue));
        }
    };

    proto.setNotAPath = function () {
        this.path = JSON.stringify({ components: [], type: PATH_TYPE_ENUM.ABSOLUTE });
    };

    proto.isNotAPath = function () {
        var pathValue = JSON.parse(this.path);
        if (pathValue === undefined || pathValue === null || pathValue.components === undefined) {
            return true;
        }

        return pathValue.components.length === 0 && pathValue.type === PATH_TYPE_ENUM.ABSOLUTE;
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            childElement,
            jqref,
            popover,
            button,
            that = this;

        if (firstCall === true) {
            widgetSettings = {};
            widgetSettings.readOnly = this.readOnly;
            widgetSettings.pathFormat = this.format;
            widgetSettings.accept = '*';

            childElement = document.createElement('div');
            childElement.style.width = '100%';
            childElement.style.height = '100%';

            this.appendChild(childElement);

            jqref = $(childElement);
            jqref.jqxPathControl(widgetSettings);
            jqref.jqxPathControl('val', objectToPath(this.path));

            // Adding CSS class names
            jqref.find(' .jqx-path-control-input').addClass('ni-text-field');
            jqref.find(' .jqx-path-control-button').addClass('ni-selector-button');

            popover = document.createElement('div');
            button = document.createElement('input');

            $(button).attr('type', 'button');
            $(button).attr('value', NI_SUPPORT.i18n('msg_SET_TO_NOT_A_PATH'));
            $(button).jqxButton({template: 'link'});
            $(button).on('click', function () {
                $(popover).jqxPopover('close');
                that.setNotAPath();
            });

            popover.appendChild(button);
            $(popover).jqxPopover({ selector: jqref.find('.ni-selector-button'), position: 'right' });

            jqref.find('.ni-text-field').css({
                'font-size': $(this).css('font-size'),
                'font-family': $(this).css('font-family'),
                'font-weight': $(this).css('font-weight'),
                'font-style': $(this).css('font-style')
            });

            jqref.on('change', function () {
                that.setPath(jqref.val('unix')); // because is easier to convert to object.
            });
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        $(this.firstElementChild).jqxPathControl(size);
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        jqref.find('.ni-text-field').css({
            'font-size': fontSize,
            'font-family': fontFamily,
            'font-weight': fontWeight,
            'font-style': fontStyle
        });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            jqref = $(childElement);

        switch (propertyName) {
            case 'readOnly':
                jqref.jqxPathControl({ readOnly: this.readOnly });
                break;
            case 'path':
                if (this.isNotAPath()) {
                    jqref.jqxPathControl('clear');
                } else {
                    jqref.jqxPathControl('val', objectToPath(this.path));
                }

                break;
            case 'format':
                jqref.jqxPathControl({ pathFormat: this.format });
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-path-selector', 'HTMLNIPathSelector');
}(NationalInstruments.HtmlVI.Elements.PathSelector, NationalInstruments.HtmlVI.Elements.Visual));
