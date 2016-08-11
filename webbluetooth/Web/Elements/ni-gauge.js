//****************************************
//Numeric TextBox Prototype
// DOM Registration: HTMLGauge
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.Gauge = function () {
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
    var ENDPOINTS_ONLY = 1;
    var MINORTICKS_FOR_ENDPOINTS_ONLY = 5;
    var MAJOR_TICK_SIZE = '10%';
    var MINOR_TICK_SIZE = '5%';

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
            widgetSettings.width = '100%';
            widgetSettings.height = '100%';
            widgetSettings.animationDuration = 0;
            widgetSettings.border = {size: '1%', showGradient: false};
            // Update the model
            var labels = {
                interval: 1,
                visible: true,
                distance: '30%',
                fontSize: $(this).css('font-size'),
                fontFamily: $(this).css('font-family'),
                fontStyle: $(this).css('font-style'),
                fontWeight: $(this).css('font-weight'),
                formatSettings: {
                    outputNotation: this.format === 'floating point' ? 'decimal' : 'exponential',
                    radix: this.convertFormatToRadix(this.format),
                    digits: this.precisionDigits > 0 ? undefined : this.significantDigits,
                    decimalDigits: this.significantDigits > 0 ? undefined : this.precisionDigits
                }
            };
            var ticksMajor = {
                visible: this.majorTicksVisible && this.scaleVisible,
                size: MAJOR_TICK_SIZE
            };
            var ticksMinor = {
                visible: this.minorTicksVisible && this.scaleVisible,
                size: MINOR_TICK_SIZE
            };

            labels.interval = NUM_VAL_CONVERTER.convertBack(this.interval, this.valueType);
            labels.visible = this.labelsVisible && this.scaleVisible;
            widgetSettings.labels = labels;
            if (this.rangeDivisionsMode === 'auto') {
                widgetSettings.tickMode = 'default';
                widgetSettings.niceInterval = true;
            } else {
                widgetSettings.tickMode = 'tickNumber';
                widgetSettings.niceInterval = false;
                ticksMajor.number = ENDPOINTS_ONLY;
                ticksMinor.number = MINORTICKS_FOR_ENDPOINTS_ONLY;
                labels.number = ENDPOINTS_ONLY;
            }

            widgetSettings.ticksMajor = ticksMajor;
            widgetSettings.ticksMinor = ticksMinor;
            widgetSettings.ticksDistance = '5%';

            widgetSettings.max = NUM_VAL_CONVERTER.convertBack(this.maximum, this.valueType);
            widgetSettings.min = NUM_VAL_CONVERTER.convertBack(this.minimum, this.valueType);

            widgetSettings.startAngle = this.startAngle;
            widgetSettings.endAngle = this.endAngle;

            widgetSettings.value = NUM_VAL_CONVERTER.convertBack(this.value, this.valueType);
            widgetSettings.int64 = this.valueType === NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64 ? 's' : this.valueType === NationalInstruments.HtmlVI.NINumerics.ValueTypes.UINT64 ? 'u' : false;

            childElement = document.createElement('div');
            childElement.style.width = '100%';
            childElement.style.height = '100%';

            this.appendChild(childElement);

            jqref = $(childElement);

            jqref.jqxGauge(widgetSettings);
            jqref.on('resize', function (event) {
                event.stopPropagation();
            });

            // Adding CSS class names
            jqref.addClass('ni-gauge-box');
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        $(this.firstElementChild).jqxGauge(size);
    };

    proto.updateRange = function (jqref) {
        var settings = { int64: this.valueType === NationalInstruments.HtmlVI.NINumerics.ValueTypes.INT64 ? 's' : this.valueType === NationalInstruments.HtmlVI.NINumerics.ValueTypes.UINT64 ? 'u' : false };
        settings.min = NUM_VAL_CONVERTER.convertBack(this.minimum, this.valueType);
        settings.max = NUM_VAL_CONVERTER.convertBack(this.maximum, this.valueType);
        settings.value = NUM_VAL_CONVERTER.convertBack(this.value, this.valueType);

        jqref.jqxGauge(settings);
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild;

        var labels = {
            interval: NUM_VAL_CONVERTER.convertBack(this.interval, this.valueType),
            visible: this.labelsVisible && this.scaleVisible,
            distance: '30%',
            fontSize: fontSize,
            fontFamily: fontFamily,
            fontStyle: fontStyle,
            fontWeight: fontWeight
        };

        $(childElement).jqxGauge({ labels: labels });
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        var childElement = this.firstElementChild,
            ticksMajor,
            ticksMinor,
            jqref = $(childElement);

        switch (propertyName) {
            case 'valueType':
                this.updateRange(jqref);
                break;
            case 'startAngle':
                jqref.jqxGauge({startAngle: this.startAngle});
                break;
            case 'endAngle':
                jqref.jqxGauge({endAngle: this.endAngle});
                break;
            case 'maximum':
                this.updateRange(jqref);
                break;
            case 'minimum':
                this.updateRange(jqref);
                break;
            case 'value':
                jqref.jqxGauge({ value: NUM_VAL_CONVERTER.convertBack(this.value, this.valueType) });
                break;
            case 'interval':
                this.updateRange(jqref);
                break;
            case 'scaleVisible':
                jqref.jqxGauge({ labels: { visible: this.labelsVisible && this.scaleVisible }});
                ticksMajor = jqref.jqxGauge('ticksMajor');
                jqref.jqxGauge({ ticksMajor: { interval: ticksMajor.interval, visible: this.majorTicksVisible && this.scaleVisible, size: MAJOR_TICK_SIZE } });
                ticksMinor = jqref.jqxGauge('ticksMinor');
                jqref.jqxGauge({ ticksMinor: { interval: ticksMinor.interval, visible: this.minorTicksVisible && this.scaleVisible, size: MINOR_TICK_SIZE } });
                break;
            case 'labelsVisible':
                jqref.jqxGauge({ labels: { visible: this.labelsVisible && this.scaleVisible } });
                break;
            case 'majorTicksVisible':
                ticksMajor = jqref.jqxGauge('ticksMajor');
                jqref.jqxGauge({ ticksMajor: { interval: ticksMajor.interval, visible: this.majorTicksVisible && this.scaleVisible, size: MAJOR_TICK_SIZE } });
                break;
            case 'minorTicksVisible':
                ticksMinor = jqref.jqxGauge('ticksMinor');
                jqref.jqxGauge({ ticksMinor: { interval: ticksMinor.interval, visible: this.minorTicksVisible && this.scaleVisible, size: MINOR_TICK_SIZE } });
                break;
            case 'rangeDivisionsMode':
                if (this.rangeDivisionsMode === 'auto') {
                    jqref.jqxGauge({ labels: { visible: this.labelsVisible && this.scaleVisible } });
                    ticksMajor = jqref.jqxGauge('ticksMajor');
                    jqref.jqxGauge({ ticksMajor: { interval: ticksMajor.interval, visible: this.majorTicksVisible && this.scaleVisible, size: MAJOR_TICK_SIZE } });
                    ticksMinor = jqref.jqxGauge('ticksMinor');
                    jqref.jqxGauge({ ticksMinor: { interval: ticksMinor.interval, visible: this.minorTicksVisible && this.scaleVisible, size: MINOR_TICK_SIZE } });
                    jqref.jqxGauge({ tickMode: 'default' });
                    jqref.jqxGauge({ niceInterval: true });
                } else {
                    var interval = this.getRange();
                    jqref.jqxGauge({ labels: { interval: interval, visible: this.labelsVisible && this.scaleVisible, number: ENDPOINTS_ONLY } });
                    ticksMajor = jqref.jqxGauge('ticksMajor');
                    jqref.jqxGauge({ ticksMajor: { interval: interval, visible: this.majorTicksVisible && this.scaleVisible, size: MAJOR_TICK_SIZE, number: ENDPOINTS_ONLY } });
                    ticksMinor = jqref.jqxGauge('ticksMinor');
                    jqref.jqxGauge({ ticksMinor: { interval: interval, visible: this.minorTicksVisible && this.scaleVisible, size: MINOR_TICK_SIZE, number: MINORTICKS_FOR_ENDPOINTS_ONLY } });
                    jqref.jqxGauge({ tickMode: 'tickNumber' });
                    jqref.jqxGauge({ niceInterval: false });
                }

                break;
            case 'format':
            case 'significantDigits':
            case 'precisionDigits':
                jqref.jqxGauge({
                    labels: {
                        fontSize: $(this).css('font-size'),
                        fontFamily: $(this).css('font-family'),
                        fontStyle: $(this).css('font-style'),
                        fontWeight: $(this).css('font-weight'),
                        visible: this.labelsVisible && this.scaleVisible,
                        formatSettings: {
                            outputNotation: this.format === 'floating point' ? 'decimal' : 'exponential',
                            radix: this.convertFormatToRadix(this.format),
                            digits: this.significantDigits > 0 ? this.significantDigits : undefined,
                            decimalDigits: this.precisionDigits > 0 ? this.precisionDigits : undefined
                        }
                    }
                });
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-gauge', 'HTMLNIGauge');
}(NationalInstruments.HtmlVI.Elements.Gauge, NationalInstruments.HtmlVI.Elements.RadialNumericPointer));
