//****************************************
// Boolean Switch Prototype
// DOM Registration: HTMLNIBooleanSwitch
// National Instruments Copyright 2015
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.BooleanSwitch = function () {
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
    var createSliderButton = function (target, params, childElement) {
        var that = target,
            jqRef;

        jqRef = $(childElement);
        params.animationDuration = 25;
        jqRef.jqxSwitchButton(params);

        // TODO use an undocumented funtion mraj
        jqRef.jqxSwitchButton('_removeEventHandlers');
        jqRef.find(' .jqx-switchbutton-label').css('font-size', $(that).css('font-size'));
        jqRef.find(' .jqx-switchbutton-label').css('font-family', $(that).css('font-family'));
        jqRef.find(' .jqx-switchbutton-label').css('font-weight', $(that).css('font-weight'));
        jqRef.find(' .jqx-switchbutton-label').css('font-style', $(that).css('font-style'));

        // Adding CSS class names
        jqRef.addClass('ni-boolean-box');
        jqRef.find(' .jqx-switchbutton-label-on').addClass('ni-on-label');
        jqRef.find(' .jqx-switchbutton-label-off').addClass('ni-off-label');
        jqRef.find(' .jqx-switchbutton-wrapper').addClass('ni-thumb-box');
        jqRef.find(' .jqx-switchbutton-thumb').addClass('ni-thumb');
    };

    // TODO gleon we shouldn't be using this function, we should use CSS directly.
    var setPowerButtonFontSize = function (jqref, height) {
        var fontSize = height * 0.67;
        jqref.css({ 'font-size': fontSize + 'px', 'line-height': height + 'px' });
    };

    var createPowerButton = function (target, params, childElement) {
        var that = target;
        var powerButton = childElement;
        powerButton.classList.add('ni-boolean-box');
        var powerChar = '\uF011';
        var text = document.createTextNode(powerChar);
        powerButton.appendChild(text);

        setPowerButtonFontSize($(powerButton), $(that).height());

        $(that).hover(function () {
            $(powerButton).toggleClass('hover');
        }, function () {
            $(powerButton).toggleClass('hover');
        });
        $(that).on('click', function (evt) {
            evt.preventDefault();
        });
    };

    var createRoundButton = function (target, params, childElement) {
        var that = target;
        var divElement = document.createElement('div'),
            labelElement = document.createElement('label');

        var roundOffLabel = document.createElement('label');
        var roundOnLabel = document.createElement('label');
        var checkbox = document.createElement('input');

        // Need to prevent default checkbox behavior so mechanical actions can takeover
        checkbox.addEventListener('click', function (evt) {
            evt.preventDefault();
        });

        // Add off and on labels
        roundOffLabel.classList.add('ni-off-label');
        roundOffLabel.innerText = params.offLabel;
        roundOffLabel.style.fontSize = $(that).css('font-size');
        roundOffLabel.style.fontFamily = $(that).css('font-family');
        roundOffLabel.style.fontWeight = $(that).css('font-weight');
        roundOffLabel.style.fontStyle = $(that).css('font-style');
        divElement.appendChild(roundOffLabel);
        roundOnLabel.classList.add('ni-on-label');
        roundOnLabel.innerText = params.onLabel;
        roundOnLabel.style.fontSize = $(that).css('font-size');
        roundOnLabel.style.fontFamily =  $(that).css('font-family');
        roundOnLabel.style.fontWeight =  $(that).css('font-weight');
        roundOnLabel.style.fontStyle = $(that).css('font-style');
        divElement.appendChild(roundOnLabel);
        childElement.appendChild(divElement);

        // Add the checkbox
        checkbox.type = 'checkbox';
        checkbox.checked = params.checked;
        childElement.appendChild(checkbox);

        // Add the label "knob"
        labelElement.classList.add('ni-knob');
        childElement.appendChild(labelElement);
    };

    var createWidgetSettings = function (target) {
        var that = target,
            widgetSettings = {};
        widgetSettings.checked = that.value;
        widgetSettings.onLabel = that.contentVisible ? that.trueContent : '';
        widgetSettings.offLabel = that.contentVisible ? that.falseContent : '';
        widgetSettings.orientation = that.orientation;
        widgetSettings.disabled = that.readOnly;
        return widgetSettings;
    };

    var createAndAddChildElement = function (target) {
        var that = target,
            childElement = document.createElement('div');
        childElement.style.width = '100%';
        childElement.style.height = '100%';
        that.appendChild(childElement);

        return childElement;
    };

    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'shape',
            defaultValue: 'slider'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'orientation',
            defaultValue: 'horizontal'
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);

        if (firstCall === true) {

            var widgetSettings = createWidgetSettings(this);
            var childElement = createAndAddChildElement(this);

            switch (this.shape) {
            case 'round':
                createRoundButton(this, widgetSettings, childElement);
                break;
            case 'slider':
                createSliderButton(this, widgetSettings, childElement);
                break;
            case 'power':
                createPowerButton(this, widgetSettings, childElement);
                break;
            }

            this.updateOnCSSClass();
        }

        return firstCall;
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);

        var childElement = this.firstElementChild, jqrefContent;

        // We do not use text content for power controls
        if (this.shape === 'round') {
            $('.ni-off-label').css({ 'font-size': fontSize,
                'font-family': fontFamily,
                'font-weight': fontWeight,
                'font-style': fontStyle });
            $('.ni-on-label').css({ 'font-size': fontSize,
                'font-family': fontFamily,
                'font-weight': fontWeight,
                'font-style': fontStyle });
        }

        if (this.shape === 'slider') {
            jqrefContent = $(childElement).find(' .jqx-switchbutton-label');
            $(jqrefContent).css({ 'font-size': fontSize,
                'font-family': fontFamily,
                'font-weight': fontWeight,
                'font-style': fontStyle });
        }
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);
        var childElement = this.firstElementChild,
            jqref = $(childElement),
            that = this;

        switch (propertyName) {
        case 'readOnly':
            if (this.shape === 'round') {
                childElement.attr({
                    disabled: that.readOnly
                });
            } else if (this.shape === 'slider') {
                jqref.jqxSwitchButton({
                    disabled: that.readOnly
                });
            } else if (this.shape === 'power') {
                childElement.attr({
                    disabled: that.readOnly
                });
            }

            break;
        case 'orientation':
            if (this.shape === 'slider') {
                // Orientation changes mess with the entire DOM and
                // reattaching it is the best option.
                this.removeChild(this.firstElementChild);

                var widgetSettings = createWidgetSettings(this);

                // Ok to use parent syle, as the removal and re-addition is completely
                // internal. Also, since the resizeHack does not fire, we need this.
                widgetSettings.width = this.style.width;
                widgetSettings.height = this.style.height;

                childElement = createAndAddChildElement(this);

                createSliderButton(this, widgetSettings, childElement);
            }

            break;
        case 'trueContent':
            // We do not use text content for power controls

            if (this.shape === 'round') {
                $('.ni-on-label').html(this.trueContent);
            }

            if (this.shape === 'slider') {
                jqref.jqxSwitchButton({
                    onLabel: that.trueContent
                });
            }

            break;
        case 'falseContent':
            // We do not use text content for power controls
            if (this.shape === 'round') {
                $('.ni-off-label').html(this.falseContent);
            }

            if (this.shape === 'slider') {
                jqref.jqxSwitchButton({
                    offLabel: that.falseContent
                });
            }

            break;
        case 'contentVisible':
            // We do not use text content for power controls
            if (this.shape === 'round') {
                $('.ni-off-label').html(this.contentVisible ? this.falseContent : '');
            }

            if (this.shape === 'round') {
                $('.ni-on-label').html(this.contentVisible ? this.trueContent : '');
            }

            if (this.shape === 'slider') {
                jqref.jqxSwitchButton({
                    onLabel: that.contentVisible ? that.trueContent : '',
                    offLabel: that.contentVisible ? that.falseContent : ''
                });
            }

            break;
        case 'value':
            if (this.shape === 'slider') {
                jqref.jqxSwitchButton({
                    checked: that.value
                });
            }

            this.updateOnCSSClass();

            break;
        default:
            break;
        }
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        var childElement = this.firstElementChild,
            jqRef = $(childElement);
        if (this.shape === 'slider') {
            jqRef.detach();
            jqRef.jqxSwitchButton(size);
            $(this).append(jqRef);
        }

        if (this.shape === 'power') {
            // TODO gleon we shouldn't be doing this. Use CSS directly.
            setPowerButtonFontSize(jqRef, size.height);
        }
    };

    proto.defineElementInfo(proto, 'ni-boolean-switch', 'HTMLNIBooleanSwitch');
})(NationalInstruments.HtmlVI.Elements.BooleanSwitch, NationalInstruments.HtmlVI.Elements.BooleanContentControl);
