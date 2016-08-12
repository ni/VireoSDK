//****************************************
// Time Stamp Text Box Prototype
// DOM Registration: No
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.TimeStampTextBox = function () {
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
    var serialisedTSToJsDate = function (value) {
        return (new NationalInstruments.HtmlVI.NITimestamp(value)).toDate();
    };

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'value',
            defaultValue: '0:0',
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'minimum',
            defaultValue: '-9223372036854775808:0'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'maximum',
            defaultValue: '9223372036854775807:0'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'showCalendarButtonOnControl',
            defaultValue: false
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings,
            childElement,
            jqref,
            that = this;

        if (firstCall === true) {
            var format = 'MM/dd/yyyy hh:mm:ss tt';
            var culture = Globalize.culture(window.NIEmbeddedBrowser.formatLanguage);
            if (culture !== undefined) {
                var calendar = culture.calendar;
                format = calendar.patterns.d + ' ' + calendar.patterns.T;
            }

            widgetSettings = {
                disabled: this.readOnly,
                culture: window.NIEmbeddedBrowser.formatLanguage,
                formatString: format,
                min: serialisedTSToJsDate(this.minimum),
                max: serialisedTSToJsDate(this.maximum),
                showCalendarButton: !this.readOnly
            };
            childElement = document.createElement('div');
            childElement.style.width = '100%';
            childElement.style.height = '100%';

            this.appendChild(childElement);

            jqref = $(childElement);
            jqref.jqxDateTimeInput(widgetSettings);
            jqref.jqxDateTimeInput('setDate', serialisedTSToJsDate(this.value));
            jqref.on('valueChanged', function (event) {
                that.value = (new NationalInstruments.HtmlVI.NITimestamp(event.args.date)).toString();
            });

            if (this.showCalendarButtonOnControl === false) {
                jqref.find(' .jqx-icon-calendar').parent().addClass('ni-disable');
            }

            $('#' + childElement.id + ' .jqx-widget-content').css('font-size', $(this).css('font-size'));
            $('#' + childElement.id + ' .jqx-widget-content').css('font-family', $(this).css('font-family'));
            $('#' + childElement.id + ' .jqx-widget-content').css('font-weight', $(this).css('font-weight'));
            $('#' + childElement.id + ' .jqx-widget-content').css('font-style', $(this).css('font-style'));

            // Adding CSS class names
            jqref.addClass('ni-time-stamp-box');
            jqref.find(' input').addClass('ni-text-field');
            jqref.find(' .jqx-action-button').addClass('ni-calendar-button');
            jqref.find(' .jqx-icon-calendar').addClass('ni-calendar-icon');
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        $(this.firstElementChild).jqxDateTimeInput(size);
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild,
            jqrefContent = $('#' + childElement.id + ' .jqx-widget-content');

        jqrefContent.css({
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
            case 'value':
                jqref.jqxDateTimeInput('setDate', serialisedTSToJsDate(this.value));
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-time-stamp-text-box', 'HTMLNITimeStampTextBox');
    // Inheritance is different from C# view (where time stamp is a numeric) so that min/max/value properties can have a different datatype
}(NationalInstruments.HtmlVI.Elements.TimeStampTextBox, NationalInstruments.HtmlVI.Elements.Visual));
