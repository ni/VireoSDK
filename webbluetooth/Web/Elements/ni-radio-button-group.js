//****************************************
// Radio Button Group Prototype
// DOM Registration: HTMLNIRadioButtonGroup
// National Instruments Copyright 2014
//****************************************

NationalInstruments.HtmlVI.Elements.RadioButtonGroup = function () {
    'use strict';
};

// Static Public Variables
NationalInstruments.HtmlVI.Elements.RadioButtonGroup.Orientation = {
    horizontal: 'horizontal',
    vertical: 'vertical'
};

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var radioButtonClassName = 'ni-radio-item';
    var thisClass = NationalInstruments.HtmlVI.Elements.RadioButtonGroup;
    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;
    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    // Public Prototype Methods
    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'orientation',
            defaultValue: thisClass.Orientation.vertical
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this),
            widgetSettings;

        if (firstCall === true) {
            widgetSettings = {};
            var radioButtonGroupElement = document.createElement('div');
            radioButtonGroupElement.style.width = '100%';
            radioButtonGroupElement.style.height = '100%';
            radioButtonGroupElement.style.fontSize = $(this).css('font-size');
            radioButtonGroupElement.style.fontFamily = $(this).css('font-family');
            radioButtonGroupElement.style.fontWeight = $(this).css('font-weight');
            radioButtonGroupElement.style.fontStyle = $(this).css('font-style');
            this.appendChild(radioButtonGroupElement);
            this.setRadioButtons();
        }

        return firstCall;
    };

    proto.forceResize = function (size) {
        parent.prototype.forceResize.call(this, size);
        var radioButtonGroupElement = this.firstElementChild;
        var buttonCnt = $(radioButtonGroupElement).children('.' + radioButtonClassName).length;
        var height, width;
        if (this.orientation === thisClass.Orientation.horizontal) {
            width = size.width / buttonCnt;
            height = size.height;
        } else {
            height = size.height / buttonCnt;
            width = size.width;
        }

        $(radioButtonGroupElement).children('.' + radioButtonClassName).width(width);
        $(radioButtonGroupElement).children('.' + radioButtonClassName).height(height);
    };

    proto.setOrientation = function () {
        if (this.orientation === thisClass.Orientation.horizontal) {
            $(this).addClass('ni-horizontal');
        } else {
            $(this).removeClass('ni-horizontal');
        }

        var size = { width: $(this).width(), height: $(this).height() };
        this.forceResize(size);
    };

    proto.setFont = function (fontSize, fontFamily, fontWeight, fontStyle) {
        parent.prototype.setFont.call(this, fontSize, fontFamily, fontWeight, fontStyle);
        this.setChildrenButtonFont();
    };

    proto.setChildrenButtonFont = function () {
        var fontObject = $(this).css(['font-family', 'font-weight', 'font-style', 'font-size']);
        $(this.firstElementChild).children('.' + radioButtonClassName).css(fontObject);
    };

    proto.createCheckedHandler = function (displayValue) {
        var that = this;
        return function () {
            that.selectChangedHandler(displayValue);
        };
    };

    proto.setRadioButtons = function () {
        var radioButtonGroupElement = this.firstElementChild;
        $(radioButtonGroupElement).empty();
        var data = this.getSourceAndSelectedIndexFromSource();
        var selectedIndex = data.selectedIndex;
        var source = data.source;
        var groupId = NI_SUPPORT.uniqueId();
        var that = this;
        var disabled = this.readOnly;
        for (var i = 0; i < source.length; i++) {
            var displayValue = source[i];
            var radioButtonElement = document.createElement('div');
            $(radioButtonElement).text(displayValue);
            $(radioButtonElement).jqxRadioButton({
                groupName: groupId,
                disabled: disabled
            });
            $(radioButtonElement).addClass(radioButtonClassName);
            if (selectedIndex === i) {
                $(radioButtonElement).jqxRadioButton({ checked: true });
            }

            $(radioButtonElement).on('checked', that.createCheckedHandler(displayValue));
            radioButtonGroupElement.appendChild(radioButtonElement);
        }

        this.setChildrenButtonFont();
        this.setOrientation();
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);
        var data, source, selectedIndex;
        switch (propertyName) {
            case 'items':
                this.itemsCache().cacheDirty();
                this.setRadioButtons();
                break;
            case 'value':
                data = this.getSourceAndSelectedIndexFromSource(true);
                source = data.source;
                selectedIndex = data.selectedIndex;
                var radioButtonGroupElement = this.firstElementChild;
                var radioButtonElement = $(radioButtonGroupElement).children()[selectedIndex];
                $(radioButtonElement).jqxRadioButton({ checked: true });
                break;
            case 'orientation':
                this.setOrientation();
                break;
            case 'readOnly':
                radioButtonGroupElement = this.firstElementChild;
                $(radioButtonGroupElement).children('.' + radioButtonClassName).jqxRadioButton({ disabled: this.readOnly });
                break;
            default:
                break;
        }
    };

    proto.defineElementInfo(proto, 'ni-radio-button-group', 'HTMLNIRadioButtonGroup');
}(NationalInstruments.HtmlVI.Elements.RadioButtonGroup, NationalInstruments.HtmlVI.Elements.NumericValueSelector));
