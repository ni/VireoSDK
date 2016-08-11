/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {

    $.jqx.jqxWidget("jqxButtonGroup", "", {});

    $.extend($.jqx._jqxButtonGroup.prototype, {
        defineInstance: function () {
            var settings =
            {
                //Possible values: checkbox, radio, default
                mode: 'default',
                roundedCorners:true,
                disabled:false,
                enableHover:false,
                orientation:'horizontal',
                width:null,
                height:null,
                _eventsMap:{
                    'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                    'mouseup': $.jqx.mobile.getTouchEventName('touchend')
                },
                _events:['selected', 'unselected', 'buttonclick'],
                _buttonId:{},
                _selected:null,
                _pressed:null,
                rtl: false,
                template: "",
                _baseId:'group_button',
                aria:
                {
                    "aria-disabled": { name: "disabled", type: "boolean" }
                }
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            var that = this;
            that._isTouchDevice = $.jqx.mobile.isTouchDevice();
            $.jqx.aria(that);
            that.addHandler(that.host, 'selectstart', function (event) {
                if (!that.disabled) {
                    event.preventDefault();
                }
            });
        },

        refresh: function () {
            var that = this;
            if (that.width) {
                if (that.width.toString() && that.width.indexOf('%') >= 0) {
                    that.element.style.width = that.width;
                }
                else {
                    that.host.width(that.width);
                }
            }
            if (that.height) that.host.height(that.height);
            that._refreshButtons();
        },

        render: function () {
            this.refresh();
        },

        resize: function()
        {
            this.refresh();
        },

        _getEvent: function (event) {
            var that = this;
            if (that._isTouchDevice) {
                var e = that._eventsMap[event] || event;
                e += "." + that.element.id;
                return e;
            }
            event += "." + that.element.id;
            return event;
        },

        _refreshButtons: function () {
            var that = this;
            if (that.lastElement)
                that.lastElement.remove();
            
            that.lastElement = $("<div style='clear: both;'></div>");
            var children = that.host.children(),
                count = children.length,
                current;

            switch (that.mode) {
                case "radio":
                    that.host.attr('role', 'radiogroup');
                    break;
                case "checkbox":
                case "default":
                    that.host.attr('role', 'group');
                    break;
            }

            var width = new Number(100 / count).toFixed(2);
            for (var i = 0; i < count; i += 1) {
                current = $(children[i]);
                if (that.width) {
                    if (that.orientation === "horizontal") {
                        current.css('width', width + '%');
                        current.css('box-sizing', 'border-box');
                        current.css('-moz-box-sizing', 'border-box');
                        current.css('white-space', 'nowrap');
                        current.css('text-overflow', 'ellipsis');
                        current.css('overflow', 'hidden');
                    }
                    else {
                        current.css('box-sizing', 'border-box');
                        current.css('-moz-box-sizing', 'border-box');
                        current.css('width', '100%');
                    }
                }

                that._refreshButton(current, i, count);
            }
            that.lastElement.appendTo(that.host);
        },

        _refreshButton: function (btn, counter, count) {
            (function (btn) {
                var that = this;
                btn = that._render(btn);
                that._removeStyles(btn);
                that._addStyles(btn, counter, count);
                that._performLayout(btn);
                that._removeButtonListeners(btn);
                that._addButtonListeners(btn);
                that._handleButtonId(btn, counter);
             
                if (that.mode == "radio") {
                    btn.attr('role', 'radio');
                }
                else {
                    btn.attr('role', 'button');
                }
                btn.attr('disabled', that.disabled);
                if (that.disabled) {
                    btn.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
                }
                else {
                    btn.removeClass(that.toThemeProperty('jqx-fill-state-disabled'));
                }
            }).apply(this, [btn]);
        },

        destroy: function (removeFromDom) {
            var that = this;
            var children = that.host.children(),
            count = children.length,
            current;

            for (var i = 0; i < count; i += 1) {
                current = $(children[i]);
                that._removeStyles(current);
                that._removeButtonListeners(current);
            }

           if (removeFromDom != false) {
                that.host.remove();
            }
        },

        _render: function (btn) {
            var that = this;
            if (btn[0].tagName.toLowerCase() === 'button') {
                return that._renderFromButton(btn);
            } else {
                return that._renderButton(btn);
            }
        },

        _renderButton: function (btn) {
            var content;
            btn.wrapInner('<div/>');
            return btn;
        },

        _removeStyles: function (btn) {
            var that = this;
            var tp = that.toThemeProperty;
            that.host.removeClass('jqx-widget');
            that.host.removeClass('jqx-rc-all');
            btn.removeClass(tp.call(this, 'jqx-fill-state-normal'));
            btn.removeClass(tp.call(this, 'jqx-group-button-normal'));
            btn.removeClass(tp.call(this, 'jqx-rc-tl'));
            btn.removeClass(tp.call(this, 'jqx-rc-bl'));
            btn.removeClass(tp.call(this, 'jqx-rc-tr'));
            btn.removeClass(tp.call(this, 'jqx-rc-br'));
            btn.css('margin-left', 0);
        },

        _addStyles: function (btn, counter, count) {
            var that = this;
            var tp = this.toThemeProperty;
            that.host.addClass(tp.call(this, 'jqx-widget'));
            that.host.addClass(tp.call(this, 'jqx-rc-all'));
            that.host.addClass(tp.call(this, 'jqx-buttongroup'));
            btn.addClass(tp.call(this, 'jqx-button'));
            btn.addClass(tp.call(this, 'jqx-group-button-normal'));
            btn.addClass(tp.call(this, 'jqx-fill-state-normal'));
            if (that.template)
            {
                btn.addClass(tp.call(this, 'jqx-' + that.template));
            }
            if (that.roundedCorners)
            {
                if (counter === 0) {
                    that._addRoundedCorners(btn, true);
                } else if (counter === count - 1) {
                    that._addRoundedCorners(btn, false);
                }
            }
            if (that.orientation == 'horizontal') {
                btn.css('margin-left', -parseInt(btn.css('border-left-width'), 10));
            }
            else {
                btn.css('margin-top', -parseInt(btn.css('border-left-width'), 10));
            }
        },

        _addRoundedCorners: function (button, left) {
            var that = this;
            var tp = that.toThemeProperty;
            if (that.orientation == 'horizontal') {
                if (left) {
                    button.addClass(tp.call(this, 'jqx-rc-tl'));
                    button.addClass(tp.call(this, 'jqx-rc-bl'));
                } else {
                    button.addClass(tp.call(this, 'jqx-rc-tr'));
                    button.addClass(tp.call(this, 'jqx-rc-br'));
                }
            }
            else {
                if (left) {
                    button.addClass(tp.call(this, 'jqx-rc-tl'));
                    button.addClass(tp.call(this, 'jqx-rc-tr'));
                } else {
                    button.addClass(tp.call(this, 'jqx-rc-bl'));
                    button.addClass(tp.call(this, 'jqx-rc-br'));
                }
            }
        },

        _centerContent: function (content, parent) {
            content.css({
                'margin-top': (parent.height() - content.height()) / 2,
                'margin-left': (parent.width() - content.width()) / 2
            });
            return content;
        },

        _renderFromButton: function (btn) {
            var content = btn.val();
            if (content == "") {
                content = btn.html();
            }

            var div;
            var id = btn[0].id;
            btn.wrap('<div/>');
            div = btn.parent();
            div.attr('style', btn.attr('style'));
            btn.remove();
            $.jqx.utilities.html(div, content);
            div[0].id = id;
            return div;
        },

        _performLayout: function (btn) {
            if (this.orientation == 'horizontal') {
                if (this.rtl) {
                    btn.css('float', 'right');
                }
                else {
                    btn.css('float', 'left');
                }
            }
            else {
                btn.css('float', 'none');
            }

            this._centerContent($(btn.children()), btn);
        },

        _mouseEnterHandler: function (e) {
            var self = e.data.self,
                btn = $(e.currentTarget);
            if (self._isDisabled(btn) || !self.enableHover) {
                return;
            }
            var tp = self.toThemeProperty;
            btn.addClass(tp.call(self, 'jqx-group-button-hover'));
            btn.addClass(tp.call(self, 'jqx-fill-state-hover'));
        },

        _mouseLeaveHandler: function (e) {
            var self = e.data.self,
                btn = $(e.currentTarget);
            if (self._isDisabled(btn) || !self.enableHover) {
                return;
            }
            var tp = self.toThemeProperty;
            btn.removeClass(tp.call(self, 'jqx-group-button-hover'));
            btn.removeClass(tp.call(self, 'jqx-fill-state-hover'));
        },

        _mouseDownHandler: function (e) {
            var self = e.data.self,
                btn = $(e.currentTarget);
            if (self._isDisabled(btn)) {
                return;
            }
            self._pressed = btn;
            var tp = self.toThemeProperty;
            btn.addClass(tp.call(self, 'jqx-group-button-pressed'));
            btn.addClass(tp.call(self, 'jqx-fill-state-pressed'));
        },

        _mouseUpHandler: function (e) {
            var self = e.data.self,
                btn = $(e.currentTarget);
            if (self._isDisabled(btn)) {
                return;
            }
            self._handleSelection(btn);
            self._pressed = null;
            btn = self._buttonId[btn[0].id];
            self._raiseEvent(2, { index: btn.num, button: btn.btn });
        },

        _isDisabled: function (btn) {
            if (!btn || !btn[0]) {
                return false;
            }
            return this._buttonId[btn[0].id].disabled;
        },

        _documentUpHandler: function (e) {
            var self = e.data.self,
                pressedButton = self._pressed;
            if (pressedButton && !self._buttonId[pressedButton[0].id].selected) {
                pressedButton.removeClass(self.toThemeProperty('jqx-fill-state-pressed'));
                self._pressed = null;
            }
        },

        _addButtonListeners: function (btn) {
            var that = this;
            var ah = that.addHandler;
            var ge = that._getEvent;

            ah(btn, ge.call(that, 'mouseenter'), that._mouseEnterHandler, { self: that });
            ah(btn, ge.call(that, 'mouseleave'), that._mouseLeaveHandler, { self: that });
            ah(btn, ge.call(that, 'mousedown'), that._mouseDownHandler, { self: that });
            ah(btn, ge.call(that, 'mouseup'), that._mouseUpHandler, { self: that });
            ah($(document), ge.call(that, 'mouseup'), that._documentUpHandler, { self: that });
        },

        _removeButtonListeners: function (btn) {
            var that = this;
            var rh = that.removeHandler;
            var ge = that._getEvent;
            rh(btn, ge.call(that, 'mouseenter'), that._mouseEnterHandler);
            rh(btn, ge.call(that, 'mouseleave'), that._mouseLeaveHandler);
            rh(btn, ge.call(that, 'mousedown'), that._mouseDownHandler);
            rh(btn, ge.call(that, 'mouseup'), that._mouseUpHandler);
            rh($(document), ge.call(that, 'mouseup'), that._documentUpHandler);
        },

        _handleSelection: function (btn) {
            var that = this;
            if (that.mode === 'radio') {
                that._handleRadio(btn);
            } else if (that.mode === 'checkbox') {
                that._handleCheckbox(btn);
            } else {
                that._handleDefault(btn);
            }
        },

        _handleRadio: function (btn) {
            var that = this;
            var selected = that._getSelectedButton();
            if (selected && selected.btn[0].id !== btn[0].id) {
                that._unselectButton(selected.btn, true);
            }
            for (var data in that._buttonId) {
                that._buttonId[data].selected = true;
                that._unselectButton(that._buttonId[data].btn, false);
            }

            that._selectButton(btn, true);
        },

        _handleCheckbox: function (btn) {
            var that = this;
            var btnInfo = that._buttonId[btn[0].id];
            if (btnInfo.selected) {
                that._unselectButton(btnInfo.btn, true);
            } else {
                that._selectButton(btn, true);
            }
        },

        _handleDefault: function (btn) {
            var that = this;
            that._selectButton(btn, false);
            for (var data in that._buttonId) {
                that._buttonId[data].selected = true;
                that._unselectButton(that._buttonId[data].btn, false);
            }
        },

        _getSelectedButton: function () {
            var that = this;
            for (var data in that._buttonId) {
                if (that._buttonId[data].selected) {
                    return that._buttonId[data];
                }
            }
            return null;
        },

        _getSelectedButtons: function () {
            var that = this;
            var selected = [];
            for (var data in that._buttonId) {
                if (that._buttonId[data].selected) {
                    selected.push(that._buttonId[data].num);
                }
            }
            return selected;
        },

        _getButtonByIndex: function (index) {
            var that = this;
            var current;
            for (var data in that._buttonId) {
                if (that._buttonId[data].num === index) {
                    return that._buttonId[data];
                }
            }
            return null;
        },

        _selectButton: function (btn, raiseEvent) {
            var that = this;
            var btnInfo = that._buttonId[btn[0].id];
            if (btnInfo.selected) {
                return;
            }
            var tp = that.toThemeProperty;
            btnInfo.btn.addClass(tp.call(this, 'jqx-group-button-pressed'));
            btnInfo.btn.addClass(tp.call(this, 'jqx-fill-state-pressed'));
            btnInfo.selected = true;
            if (raiseEvent) {
                that._raiseEvent(0, { index: btnInfo.num, button: btnInfo.btn });
            }
            $.jqx.aria(btnInfo.btn, 'aria-checked', true);
        },

        _unselectButton: function (btn, raiseEvent) {
            var that = this;
            var btnInfo = that._buttonId[btn[0].id];
            if (!btnInfo.selected) {
                return;
            }
            var tp = that.toThemeProperty;
            btnInfo.btn.removeClass(tp.call(this, 'jqx-group-button-pressed'));
            btnInfo.btn.removeClass(tp.call(this, 'jqx-fill-state-pressed'));
            btnInfo.selected = false;
            if (raiseEvent) {
                that._raiseEvent(1, { index: btnInfo.num, button: btnInfo.btn });
            }
            $.jqx.aria(btnInfo.btn, 'aria-checked', false);
        },

        setSelection: function (index) {
            var that = this;
            if (index === -1) {
                that.clearSelection();
                return;
            }

            if (that.mode === 'checkbox') {
                if (typeof index === 'number') {
                    that._setSelection(index);
                } else {
                    for (var i = 0; i < index.length; i += 1) {
                        that._setSelection(index[i]);
                    }
                }
            } else if (typeof index === 'number' && that.mode === 'radio') {
                that._setSelection(index);
            }
        },

        _setSelection: function (index) {
            var that = this;
            var btn = that._getButtonByIndex(index);
            if (btn) {
                that._handleSelection(btn.btn);
            }
        },

        getSelection: function () {
            var that = this;
            if (that.mode === 'radio') {
                if (that._getSelectedButton()) {
                    return that._getSelectedButton().num;
                }
            } else if (that.mode === 'checkbox') {
                return that._getSelectedButtons();
            }
            return undefined;
        },

        disable: function () {
            var that = this;
            that.disabled = true;
            var current;
            for (var btn in that._buttonId) {
                current = that._buttonId[btn];
                that.disableAt(current.num);
            }
            $.jqx.aria(that, "aria-disabled", true);
        },

        enable: function () {
            var that = this;
            that.disabled = false;
            var current;
            for (var btn in that._buttonId) {
                current = that._buttonId[btn];
                that.enableAt(current.num);
            }
            $.jqx.aria(that, "aria-disabled", false);
        },

        disableAt: function (index) {
            var that = this;
            var btn = that._getButtonByIndex(index);
            if (!btn.disabled) {
                btn.disabled = true;
                btn.btn.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }
        },

        enableAt: function (index) {
            var that = this;
            var btn = that._getButtonByIndex(index);
            if (btn.disabled) {
                btn.disabled = false;
                btn.btn.removeClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }
        },

        _handleButtonId: function (btn, number) {
            var id = btn[0].id,
                btnId = { btn: btn, num: number, selected: false },
                widgetId;
            if (!id) {
                id = this._baseId + btn.index();
            }
            btn[0].id = id;
            this._buttonId[id] = btnId;
            return id;
        },

        _raiseEvent: function (id, data) {
            var event = $.Event(this._events[id]);
            event.args = data;
            return this.host.trigger(event);
        },

        _unselectAll: function () {
            for (var data in this._buttonId) {
                this._unselectButton(this._buttonId[data].btn, false);
            }
        },

        clearSelection: function()
        {
            this._unselectAll();
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key == 'theme' && value != null) {
                $.jqx.utilities.setTheme(oldvalue, value, object.host);
            }

            if (key == "template")
            {
                object.refresh();
            }
            if (key === 'mode') {
                object._unselectAll();
                object.refresh();
                return;
            } else if (key === 'disabled') {
                if (value) {
                    object.disable();
                } else {
                    object.enable();
                }
            } else {
                object.refresh();
            }
        }
    });
})(jqxBaseFramework);
