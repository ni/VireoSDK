//****************************************
//Numeric TextBox Prototype
// DOM Registration: HTMLNumericTextBox
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.NumericTextBox = function () {
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
    var convertFormatToOutputNotation = function (format) {
        switch (format) {
            case 'floating point':
                return 'default';
            case 'exponential':
                return 'exponential';
            case 'engineering':
                return 'engineering';
            case 'systeminternational':
                break;
        }

        return 'default';
    };

    // Public Prototype Methods
    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);
        this._valueChanging = false;
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            childElement,
            widgetSettings,
            divElement,
            textElement,
            jqref,
            that = this;

        if (firstCall === true) {
            widgetSettings = {};
            var language = window.engine !== undefined && window.engine.IsAttached && window.NIEmbeddedBrowser !== undefined ? window.NIEmbeddedBrowser.language : window.navigator.language;
            var culture = Globalize.culture(language);
            if (culture !== undefined) {
                var numberFormat = culture.numberFormat;
                widgetSettings.decimalSeparator = numberFormat['.'];
            }

            if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                widgetSettings.int64 = this.valueType === NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64 ? 's' : this.valueType === NationalInstruments.HtmlVI.NINumerics.ValueTypes.UINT64 ? 'u' : false;
            }

            widgetSettings.readOnly = this.readOnly;
            widgetSettings.spinButtons = !this.readOnly;
            if (this.format === 'floating point' || this.format === 'exponential') {
                widgetSettings.outputNotation = convertFormatToOutputNotation(this.format);
            } else {
                widgetSettings.radix = this.format;
            }

            widgetSettings.value = NUM_VAL_CONVERTER.convertBack(this.value, this.valueType);
            widgetSettings.max = NUM_VAL_CONVERTER.convertBack(this.maximum, this.valueType);
            widgetSettings.min = NUM_VAL_CONVERTER.convertBack(this.minimum, this.valueType);
            if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                widgetSettings.spinButtonsStep = NUM_VAL_CONVERTER.convertBack(this.interval, this.valueType);
            } else {
                widgetSettings.interval = NUM_VAL_CONVERTER.convertBack(this.interval, this.valueType);
            }

            if (this.precisionDigits > 0) {
                widgetSettings.digits = null;
                widgetSettings.decimalDigits = this.precisionDigits;
            }

            if (this.significantDigits > 0) {
                widgetSettings.decimalDigits = null;
                widgetSettings.digits = this.significantDigits;
            }

            widgetSettings.width = '100%';
            widgetSettings.height = '100%';

            childElement = document.createElement('div');
            this.appendChild(childElement);
            textElement = document.createElement('input');
            textElement.type = 'text';
            childElement.appendChild(textElement);
            if (widgetSettings.spinButtons) {
                divElement = document.createElement('div');
                childElement.appendChild(divElement);
            }

            jqref = $(childElement);
            if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                jqref.jqxFormattedInput(widgetSettings);
            } else {
                widgetSettings.spinMode = 'advanced';
                jqref.jqxComplexInput(widgetSettings);
            }

            $('#' + childElement.id + ' .jqx-widget-content').css('font-size', $(this).css('font-size'));
            $('#' + childElement.id + ' .jqx-widget-content').css('font-family', $(this).css('font-family'));
            $('#' + childElement.id + ' .jqx-widget-content').css('font-weight', $(this).css('font-weight'));
            $('#' + childElement.id + ' .jqx-widget-content').css('font-style', $(this).css('font-style'));
            jqref.on('valueChanged', function (event) {
                that._valueChanging = true;
                that.value = NUM_VAL_CONVERTER.convert(event.args.value, that.valueType, true);
                that._valueChanging = false;
            });

            jqref.on('resize', function (e) {
                e.stopPropagation();
            });

            // Adding CSS class names
            jqref.addClass('ni-numeric-box');
            jqref.find(' input').addClass('ni-text-field');
            jqref.find(' .jqx-formatted-input-spin-button').addClass('ni-spin-button');
            jqref.find(' .jqx-input').addClass('ni-spins-box');
            jqref.find(' .jqx-icon-arrow-up').addClass('ni-increment-icon');
            jqref.find(' .jqx-icon-arrow-down').addClass('ni-decrement-icon');
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        var jqref = $(this.firstElementChild);

        if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
            // TODO gleon we should call jqxFormattedInput just once for setting the size of a widget.
            jqref.jqxFormattedInput({ width: size.width });
            jqref.jqxFormattedInput({ height: size.height });
        } else {
            jqref.jqxComplexInput({ width: size.width });
            jqref.jqxComplexInput({ height: size.height });
        }
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            jqref = $(childElement),
            widgetSetting = {},
            isSet = false;

        switch (propertyName) {
            case 'maximum':
                widgetSetting = {
                    max: NUM_VAL_CONVERTER.convertBack(this.maximum, this.valueType)
                };
                isSet = true;
                break;
            case 'minimum':
                widgetSetting = {
                    min: NUM_VAL_CONVERTER.convertBack(this.minimum, this.valueType)
                };
                isSet = true;
                break;
            case 'interval':
                if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                    jqref.jqxFormattedInput({ spinButtonsStep: NUM_VAL_CONVERTER.convertBack(this.interval, this.valueType) });
                } else {
                    jqref.jqxComplexInput({ interval: NUM_VAL_CONVERTER.convertBack(this.interval, this.valueType) });
                }

                break;
            case 'precisionDigits':
                if (this.precisionDigits >= 0) {
                    if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                        jqref.jqxFormattedInput({ decimalDigits: this.precisionDigits });
                        jqref.jqxFormattedInput({ digits: null });
                    } else {
                        jqref.jqxComplexInput({ decimalDigits: this.precisionDigits });
                        jqref.jqxComplexInput({ digits: null });
                    }
                }

                break;
            case 'readOnly':
                jqref.jqxFormattedInput({
                    spinButtons: !this.readOnly,
                    readOnly: this.readOnly
                });
                break;
            case 'significantDigits':
                if (this.significantDigits >= 0) {
                    if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                        jqref.jqxFormattedInput({ digits: this.significantDigits });
                        jqref.jqxFormattedInput({ decimalDigits: null });
                    } else {
                        jqref.jqxComplexInput({ digits: this.significantDigits });
                        jqref.jqxComplexInput({ decimalDigits: null });
                    }
                }

                break;
            case 'format':
                if (this.format === 'floating point' || this.format === 'exponential') {
                    widgetSetting.outputNotation = convertFormatToOutputNotation(this.format);
                } else {
                    widgetSetting.radix = this.format;
                }

                isSet = true;
                break;
            case 'value':
                if (this._valueChanging === false) {
                    var value = NUM_VAL_CONVERTER.convertBack(this.value, this.valueType);
                    if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                        jqref.jqxFormattedInput('setValue', value);
                    } else {
                        jqref.val(value);
                    }
                }

                break;
            default:
                break;
        }

        if (isSet === true) {
            if (this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXSINGLE && this.valueType !== NationalInstruments.HtmlVI.NINumerics.ValueTypes.COMPLEXDOUBLE) {
                jqref.jqxFormattedInput(widgetSetting);
            } else {
                jqref.jqxComplexInput(widgetSetting);
            }
        }
    };

    proto.defineElementInfo(proto, 'ni-numeric-text-box', 'HTMLNINumericTextBox');
}(NationalInstruments.HtmlVI.Elements.NumericTextBox, NationalInstruments.HtmlVI.Elements.NumericControl));
