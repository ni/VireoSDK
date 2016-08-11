//****************************************
// Legend Helpers Prototype
// DOM Registration: Not an element
// National Instruments Copyright 2015
//****************************************

(function () {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var $ = NationalInstruments.Globals.jQuery;

    // Constructor Function
    NationalInstruments.HtmlVI.Elements.LegendHelpers = function (helpers, legendItemDisplay) {
        this.helpers = helpers;
        this.legendItemDisplay = legendItemDisplay;
    };

    // Static Public Variables
    // None

    var child = NationalInstruments.HtmlVI.Elements.LegendHelpers;
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.addButtons = function (menuItem, div, index) {
        var that = this;
        var btn, current;
        menuItem.children.forEach(function (children) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ni-button';
            $(btn).jqxToggleButton({ toggled: false });
            if (children.cssClass !== '') {
                btn.classList.add(children.cssClass);
            }

            $(btn).on('click', function () {
                if (this !== current) {
                    $(current).jqxToggleButton('toggle');
                    current = this;
                }

                that.helpers.handleClick(children.name, null, index);
                that.legendItemDisplay.updateShape(index);
            });
            var state = that.helpers.getState(children.name, index);
            if (state !== undefined) {
                $(btn).jqxToggleButton({ 'toggled': state });
                if (state === true) {
                    current = btn;
                }
            }

            div.appendChild(btn);
        });
    };

    proto.addComboBox = function (menuItem, div, index, iconWidth) {
        var that = this;
        var i, selectedIndex = 0, init = true;
        $(div).jqxDropDownList(
                {
                    width: 'inherit',
                    dropDownHeight: menuItem.children.length * 26
                }
                );
        for (i = 0; i < menuItem.children.length; i++) {
            var text = NI_SUPPORT.i18n(menuItem.children[i].tag);
            if (text.substring(0, 5) === '[msg_') { // in case server is not running
                text = menuItem.name;
            }

            $(div).jqxDropDownList('addItem', { id: menuItem.children[i].name, html: '<div style="width: 100%"><span class="ni-selector-title">' + text + '</span><div class="ni-selector-icon ' + menuItem.children[i].cssClass + '"' + ' style="background-size: ' + iconWidth + 'px 16px; width: ' + (iconWidth + 4) + 'px; "></div></div>' });
            var itemState = this.helpers.getState(menuItem.children[i].name, index);
            if (itemState === true) {
                selectedIndex = i;
            }
        }

        $(div).on('select', function (event) {
            var args = event.args;
            if (init === true) {
                return;
            }

            that.helpers.handleClick(args.item.label.id, null, index);
            that.legendItemDisplay.updateShape(index);
        });
        $(div).jqxDropDownList({ 'selectedIndex': selectedIndex });
        init = false;
    };

    proto.getTextElementByColor = function (color) {
        if (color === 'transparent' || color.hex === '') {
            return $('<div class="ni-colorbox-content">transparent</div>');
        }

        var element = $('<div class="ni-colorbox-content">#' + color.hex + '</div>');
        var nThreshold = 105;
        var bgDelta = (color.r * 0.299) + (color.g * 0.587) + (color.b * 0.114);
        var foreColor = (255 - bgDelta < nThreshold) ? 'Black' : 'White';
        element.css('color', foreColor);
        element.css('background', '#' + color.hex);
        element.addClass('jqx-rc-all');
        return element;
    };

    proto.addColorBox = function (menuItem, div, index) {
        var that = this;
        var dropList = document.createElement('div');
        $(div).append(dropList);
        var colorbox = document.createElement('div');
        colorbox.className = 'legend-colorbox-colorbox';
        dropList.appendChild(colorbox);
        $(colorbox).jqxColorPicker({
            width: '200px', height: '220px',
            colorMode: 'hue'
        });
        $(colorbox).on('colorchange', function (e) {
            $(div).jqxDropDownButton('setContent', that.getTextElementByColor(e.args.color));
            that.helpers.handleClick(menuItem.name, e.args.color, index);
            that.legendItemDisplay.updateShape(index);
        });
        $(div).jqxDropDownButton(
            { width: 'inherit'}
            );
        var color = this.helpers.getState(menuItem.name, index);
        if (color !== undefined) {
            if (color.charAt(0) === '#') {
                color = color.substring(1);
            }
        } else {
            color = 'ff0000';
        }

        $(div).jqxDropDownButton('setContent', this.getTextElementByColor(new $.jqx.color({ hex: color })));
    };

    proto.addCheckBox = function (menuItem, div, index) {
        var that = this;
        var btn = $(div).jqxCheckBox();
        btn.className = 'legend-checkbox';
        $(btn).on('change', function (e) {
            that.helpers.handleClick(menuItem.name, e.args.checked, index);
        });
        var state = that.helpers.getState(menuItem.name, index);
        if (state !== undefined) {
            $(btn).jqxCheckBox({ checked: state });
        }
    };
}());
