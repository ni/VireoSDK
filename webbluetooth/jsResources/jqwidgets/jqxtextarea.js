/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxTextArea', '', {});

    $.extend($.jqx._jqxTextArea.prototype, {

        defineInstance: function () {
            var self = this;
            var settings = {
                disabled: false,
                filter: self._filter,
                sort: self._sort,
                highlight: self._highlight,
                dropDownWidth: null,
                renderer: self._renderer,
                opened: false,
                $popup: $('<ul></ul>'),
                source: [],
                roundedCorners: true,
                searchMode: 'default',
                placeHolder: '',
                width: null,
                height: null,
                rtl: false,
                displayMember: '',
                valueMember: '',
                popupZIndex: 20000,
                items: 8,
                item: '<li><a href="#"></a></li>',
                minLength: 1,
                maxLength: null,
                scrollBarSize: $.jqx.utilities.scrollBarSize,
                query: '',
                changeType: null,
                events: [
                // occurs when the text in the textarea is changed
                    'change',
                // occurs when an item from the pop-up is selected
                    'select',
                // occurs when the pop-up is shown
                    'open',
                // occurs when the pop-up is hidden
                    'close'
                ]
            };

            $.extend(true, self, settings);
        },

        // creates a new jqxPanel instance.
        createInstance: function () {
            var self = this;

            self.render();
            self.isInitialized = true;
        },

        render: function () {
            var self = this,
                id = self.element.id;

            if (self.isInitialized === true) {
                self.refresh();
                return;
            }

            if ($.jqx.utilities.scrollBarSize !== 15) {
                self.scrollBarSize = $.jqx.utilities.scrollBarSize;
            }

            var panelWrapper = $('<div id="panelWrapper' + id + '" style="overflow: hidden; width: 100%; height: 100%; background-color: transparent; -webkit-appearance: none; outline: none; align:left; border: 0px; padding: 0px; margin: 0px; left: 0px; top: 0px; valign:top; position: relative;"></div>');
            var scrollBar = $('<div id="verticalScrollBar' + id + '" style="align: left; valign: top; left: 0px; top: 0px; position: absolute;"></div>');

            self._id = self.element.id;

            // creates the widget structure based on the type of the initialization element
            if (self.element.tagName.toLowerCase() === 'div') {
                self._baseHost = self.host;
                self.host.append(panelWrapper);
                panelWrapper.append('<textarea id="area' + id + '" class="' + self.toThemeProperty('jqx-text-area-element') + '"></textarea>');
                panelWrapper.append(scrollBar);
            } else if (self.element.tagName.toLowerCase() === 'textarea') {
                self._baseHost = $(self.element);
                self._baseHost.wrap('<div></div>');
                self._baseHost.wrap(panelWrapper);
                self._baseHost.after(scrollBar);
                var data = self.host.data();
                self.host = self._baseHost.parent().parent();
                self.host.data(data);
                self.host[0].style.cssText = self.element.style.cssText;
                self.element.style.cssText = '';
                self._baseHost.addClass(self.toThemeProperty('jqx-text-area-element'));
            }

            var host = self.host;
            self.wrapper = panelWrapper;
            self.textarea = host.find('textarea');

            self._addClasses();

            if (!host.jqxButton) {
                throw new Error('jqxTextArea: Missing reference to jqxbuttons.js.');
            }
            if (!host.jqxScrollBar) {
                throw new Error('jqxTextArea: Missing reference to jqxscrollbar.js.');
            }

            if (null === self.width && host[0].style && null !== host[0].style.width) {
                self.width = host[0].style.width;
            }
            if (null === self.height && host[0].style && null !== host[0].style.height) {
                self.height = host[0].style.height;
            }

            // sets the width and height of the widget
            self._setSize();

            self.vScrollBar = scrollBar;
            scrollBar.jqxScrollBar({
                vertical: true,
                width: 15,
                height: '100%',
                max: self.height,
                theme: self.theme
            });

            if ($.trim(self.textarea.val()) === '') {
                self.textarea.val('');
            }

            self.textarea.attr('placeholder', self.placeHolder);
            if (self.maxLength !== null) {
                self.textarea.attr('maxlength', self.maxLength);
            }

            // placeHolder fix for Internet Explorer 9 and older
            if ($.jqx.browser.msie && $.jqx.browser.version < 10 && self.textarea.val() === '') {
                self.textarea.val(self.placeHolder);
            }

            if ((self.source instanceof Array && self.source.length) || self.source._source || $.isFunction(self.source)) {
                self._oldsource = self.source;
                self._updateSource();
                self._addPopupClasses();
                $.jqx.aria(self, 'aria-haspopup', true);
            }

            self._arrange();

            self._addHandlers();
        },

        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                var self = this;
                self._setSize();
                self._arrange();
                self._removeHandlers();
                self._addHandlers();
                if (self.opened === true) {
                    self.open();
                }
            }
        },

        _arrange: function () {
            var self = this;
            var area = self.textarea;

            var height = area[0].scrollHeight - area.height();

            var scrollMax = area[0].scrollHeight - area.height();
            if (scrollMax < 0) {
                scrollMax = 0;
            }

            self.vScrollBar.jqxScrollBar({
                max: scrollMax,
                value: area[0].scrollTop
            });

            if (height < 5) {
                area.width(self.host.width());
                self.vScrollBar.css('visibility', 'hidden');
            } else {
                area.width(self.host.width() - self.scrollBarSize);
                self.vScrollBar.css('visibility', 'visible');
                self._arrangeScrollbars(self.scrollBarSize);
            }
        },

        val: function (value) {
            var self = this,
                textarea = self.textarea,
                text = textarea[0].value,
                result;

            if ($.jqx.browser.msie && $.jqx.browser.version < 10 && text === self.placeHolder) {
                text = '';
            }

            if (arguments.length === 0 || (typeof value === 'object' && $.isEmptyObject(value) === true)) {
                if (self.displayMember !== '' && self.valueMember !== '' && self.selectedItem) {
                    if (text === '') {
                        return '';
                    }
                    return self.selectedItem;
                }
                return text;
            }

            if (value && value.label) {
                if (self.selectedItem && value.label === self.selectedItem.label && value.value === self.selectedItem.value) {
                    return value.label;
                }
                self.selectedItem = { 'label': value.label, 'value': value.value };
                self.host.attr('data-value', value.value);
                self.host.attr('data-label', value.label);
                textarea[0].value = value.label;
                result = value.label;
            } else {
                if (text === value) {
                    return value;
                }
                textarea[0].value = value;
                self.host.attr('data-value', value);
                self.host.attr('data-label', value);
                result = value;
            }

            self._arrange();

            self._raiseEvent('0'); // 'change' event
            return result;
        },

        focus: function () {
            this.textarea.focus();
        },

        // selects all text in the textarea
        selectAll: function () {
            var textbox = this.textarea;
            setTimeout(function () {
                if ('selectionStart' in textbox[0]) {
                    textbox[0].focus();
                    textbox[0].setSelectionRange(0, textbox[0].value.length);
                } else {
                    var range = textbox[0].createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', textbox[0].value.length);
                    range.moveStart('character', 0);
                    range.select();
                }
            }, 10);
        },

        _arrangeScrollbars: function (scrollSize) {
            var self = this;
            var width = self.host.width();
            var height = self.host.height();

            var vScrollBar = self.vScrollBar;
            var vscrollVisible = vScrollBar[0].style.visibility !== 'hidden';

            var borderSize = 2;
            var scrollBorderSize = 2;

            vScrollBar.width(scrollSize);
            vScrollBar.height(parseInt(height, 10) - borderSize + 'px');
            vScrollBar.css({ left: parseInt(width, 10) - parseInt(scrollSize, 10) - borderSize - scrollBorderSize + 'px', top: '0px' });
            if (self.rtl) {
                vScrollBar.css({ left: '0px' });
                var leftMargin = vscrollVisible ? (parseInt(scrollSize, 10) - 2) + 'px' : 0;
                if (self.textarea.children().css('direction') !== 'rtl') {
                    var ie7 = false;
                    if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                        ie7 = true;
                    }
                    if (!ie7) {
                        self.textarea.css('padding-left', leftMargin);
                    }
                }
            }
            else {
                if (vScrollBar.css('visibility') !== 'hidden') {
                    self.textarea.css('width', self.host.width() - self.vScrollBar.outerWidth());
                }
            }

            vScrollBar.jqxScrollBar('refresh');
        },

        // destroys the widget
        destroy: function () {
            var self = this;

            if (self.opened) {
                self._removeItemHandlers();
            }
            self.$popup.remove();

            self.vScrollBar.jqxScrollBar('destroy');

            self._removeHandlers();
            self.host.remove();
        },


        propertiesChangedHandler: function (object, oldValues, newValues)
        {
            if (newValues && newValues.width && newValues.height && Object.keys(newValues).length == 2)
            {
                object.host.css('width', object.width);
                object.host.css('height', object.height);
                object._arrange();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (object.isInitialized === undefined || object.isInitialized === false) {
                return;
            }

            if (object.batchUpdate && object.batchUpdate.width && object.batchUpdate.height && Object.keys(object.batchUpdate).length == 2)
            {
                return;
            }

            if (value !== oldvalue) {
                switch (key) {
                    case 'theme':
                        object.vScrollBar.jqxScrollBar({ theme: object.theme });
                        break;
                    case 'width':
                        object.host.css('width', value);
                        object._arrange();
                        break;
                    case 'height':
                        object.host.css('height', value);
                        object._arrange();
                        break;
                    case 'source':
                        object._oldsource = value;
                        object._updateSource();
                        break;
                    case 'displayMember':
                    case 'valueMember':
                        object.source = object._oldsource;
                        object._updateSource();
                        break;
                    case 'opened':
                        if (value === true) {
                            object.open();
                        } else {
                            object.close();
                        }
                        break;
                    case 'maxLength':
                        object.textarea.attr('maxlength', value);
                        break;
                    case 'placeHolder':
                        object.textarea.attr('placeholder', value);

                        if ($.jqx.browser.msie && $.jqx.browser.version < 10 && object.textarea.val() === oldvalue) {
                            object.textarea.val(value);
                        }
                        break;
                    case 'scrollBarSize':
                        object._arrange();
                        break;
                    case 'dropDownWidth':
                        object.$popup.width(value);
                        break;
                    case 'roundedCorners':
                        if (value === true) {
                            object.host.add(object.$popup).addClass(object.toThemeProperty('jqx-rc-all'));
                        } else {
                            object.host.add(object.$popup).removeClass(object.toThemeProperty('jqx-rc-all'));
                        }
                        break;
                    case 'disabled':
                        object.vScrollBar.jqxScrollBar({ disabled: value });

                        if (value === true) {
                            object.host.addClass(object.toThemeProperty('jqx-fill-state-disabled'));
                            object.textarea.attr('disabled', '');
                        } else {
                            object.host.removeClass(object.toThemeProperty('jqx-fill-state-disabled'));
                            object.textarea.removeAttr('disabled');
                        }
                        $.jqx.aria(object, 'aria-disabled', value);
                        break;
                    case 'rtl':
                        if (value === true) {
                            object.textarea.addClass(object.toThemeProperty('jqx-text-area-element-rtl'));
                        } else {
                            object.textarea.removeClass(object.toThemeProperty('jqx-text-area-element-rtl'));
                        }
                        object._arrange();
                        break;
                    default:
                        object.refresh();
                        break;
                }
            }
        },

        // raises an event
        _raiseEvent: function (id, arg) {
            var self = this;

            if (arg === undefined) {
                arg = { owner: null };
            }

            var evt = self.events[id];
            arg.owner = self;

            var event = new $.Event(evt);
            event.owner = self;
            if (id == 0) {
                arg.type = this.changeType;
                this.changeType = null;
            }
            event.args = arg;
            if (event.preventDefault) {
                event.preventDefault();
            }

            var element;
            if (evt === 'change' || self._baseHost[0].tagName.toLowerCase() === 'div') {
                element = self.host;
            } else {
                element = self._baseHost;
            }

            var result = element.trigger(event);
            return result;
        },

        // adds event handlers
        _addHandlers: function () {
            var self = this,
            id = self.element.id,
            host = self.host,
            area = self.textarea;

            // host
            $.jqx.utilities.resize(self._baseHost, function () {
                self._ttimer = setTimeout(function () {
                    self._arrange();
                }, 100);
            }, false, true);

            var wheelEventName = $.jqx.browser.mozilla ? 'wheel' : 'mousewheel';
            self.addHandler(host, wheelEventName + '.jqxTextArea' + id, function (event) {
                self.wheel(event, self);
            });
            self.addHandler(host, 'mouseenter.jqxTextArea' + id, function () {
                self.focused = true;
            });
            self.addHandler(host, 'mouseleave.jqxTextArea' + id, function () {
                self.focused = false;
            });
            self.addHandler(host, 'focus.jqxTextArea' + id, function () {
                self.focused = true;
            });
            self.addHandler(host, 'blur.jqxTextArea' + id, function () {
                self.focused = false;
            });

            // wrapper
            self.addHandler(self.wrapper, 'scroll.jqxTextArea' + id, function () {
                if (self.wrapper[0].scrollTop !== 0) {
                    self.wrapper[0].scrollTop = 0;
                }

                if (self.wrapper[0].scrollLeft !== 0) {
                    self.wrapper[0].scrollLeft = 0;
                }
            });

            // textarea
            self.addHandler(area, 'change.jqxTextArea' + id, function (event) {
                event.stopPropagation();
                event.preventDefault();
                self._arrange();
                self._raiseEvent('0'); // 'change' event
            });
            self.addHandler(area, 'select.jqxTextArea' + id, function (event) {
                event.stopPropagation();
                event.preventDefault();
            });
            self.addHandler(area, 'scroll.jqxTextArea' + id, function () {
                self._arrange();
            });
            self.addHandler(area, 'focus.jqxTextArea' + id, function () {
                self.host.addClass(self.toThemeProperty('jqx-fill-state-focus'));

                if ($.jqx.browser.msie && $.jqx.browser.version < 10 && self.textarea.val() === self.placeHolder) {
                    self.textarea.val('');
                }
            });
            self.addHandler(area, 'blur.jqxTextArea' + id, function () {
                self.host.removeClass(self.toThemeProperty('jqx-fill-state-focus'));

                if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                    var currentValue = self.textarea.val();
                    if (currentValue === '') {
                        self.textarea.val(self.placeHolder);
                    } else if (self.maxLength !== null && currentValue.length > self.maxLength) {
                        self.textarea.val(currentValue.substr(0, self.maxLength));
                    }
                }
            });
            self.addHandler(area, 'keydown.jqxTextArea' + id, function (event) {
                self._suppressKeyPressRepeat = ~$.inArray(event.keyCode, [40, 38, 9, 13, 27]);
                self.changeType = "keyboard";
                self._move(event);
            });
            self.addHandler(area, 'keypress.jqxTextArea' + id, function (event) {
                if (self.maxLength !== null && $.jqx.browser.msie && $.jqx.browser.version < 10 && area.val().length > self.maxLength) {
                    return false;
                }

                if (self._suppressKeyPressRepeat) {
                    return;
                }
                self._move(event);
            });
            self.addHandler(area, 'keyup.jqxTextArea' + id, function (event) {
                switch (event.keyCode) {
                    case 40: // down arrow
                    case 38: // up arrow
                    case 16: // shift
                    case 17: // ctrl
                    case 18: // alt
                        break;
                    case 9: // tab
                    case 13: // enter
                        if (!self.opened) {
                            return;
                        }
                        self._select();
                        break;
                    case 27: // escape
                        if (!self.opened) {
                            return;
                        }
                        self.close();
                        break;
                    default:
                        if (self.timer) {
                            clearTimeout(self.timer);
                        }
                        self.timer = setTimeout(function () {
                            self._suggest();
                        }, 300);
                }

                event.stopPropagation();
                event.preventDefault();
                self._arrange();
            });

            // scrollbar
            self.addHandler(self.vScrollBar, 'valueChanged.jqxTextArea' + id, function (event) {
                area.scrollTop(event.currentValue);
            });

            // pop-up
            self.addHandler(self.$popup, 'mousedown.jqxTextArea' + id, function (event) {
                event.stopPropagation();
                event.preventDefault();
                self.changeType = "mouse";
                self._select();
            });
        },

        // removes event handlers
        _removeHandlers: function () {
            var self = this,
            id = self.element.id,
            host = self.host,
            area = self.textarea;

            $.jqx.utilities.resize(self._baseHost, null, true);
            self.removeHandler(host, 'mousewheel.jqxTextArea' + id);
            self.removeHandler(host, 'mouseenter.jqxTextArea' + id);
            self.removeHandler(host, 'mouseleave.jqxTextArea' + id);
            self.removeHandler(host, 'focus.jqxTextArea' + id);
            self.removeHandler(host, 'blur.jqxTextArea' + id);

            self.removeHandler(self.wrapper, 'scroll.jqxTextArea' + id);

            self.removeHandler(area, 'change.jqxTextArea' + id);
            self.removeHandler(area, 'select.jqxTextArea' + id);
            self.removeHandler(area, 'scroll.jqxTextArea' + id);
            self.removeHandler(area, 'focus.jqxTextArea' + id);
            self.removeHandler(area, 'blur.jqxTextArea' + id);
            self.removeHandler(area, 'keydown.jqxTextArea' + id);
            self.removeHandler(area, 'keypress.jqxTextArea' + id);
            self.removeHandler(area, 'keyup.jqxTextArea' + id);

            self.removeHandler(self.vScrollBar, 'valueChanged.jqxTextArea' + id);

            self.removeHandler(self.$popup, 'mousedown.jqxTextArea' + id);
        },

        // adds pop-up item handlers
        _addItemHandlers: function () {
            var self = this;

            self.addHandler(self.$popup.find('li'), 'mouseenter.jqxTextArea' + self.element.id, function (event) {
                self.$popup.find('.jqx-fill-state-pressed').removeClass(self.toThemeProperty('jqx-fill-state-pressed'));
                $(event.currentTarget).addClass(self.toThemeProperty('jqx-fill-state-pressed'));
            });
        },

        // removes pop-up item handlers
        _removeItemHandlers: function () {
            var self = this;

            self.removeHandler(self.$popup.find('li'), 'mouseenter.jqxTextArea' + self.element.id);
        },

        // performs mouse wheel.
        wheel: function (event, self) {
            var delta = 0;
            // fix for IE8 and IE7
            if (event.originalEvent && $.jqx.browser.msie && event.originalEvent.wheelDelta) {
                delta = event.originalEvent.wheelDelta / 120;
            }

            if (!event) /* For IE. */{
                event = window.event;
            }
            if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta / 120;
            } else if (event.detail) { /** Mozilla case. */
                delta = -event.detail / 3;
            } else if (event.originalEvent.wheelDelta) {
                delta = event.originalEvent.wheelDelta / 120;
            } else if (event.originalEvent.detail) {
                delta = -event.originalEvent.detail / 3;
            } else if (event.originalEvent.deltaY) { /* Firefox */
                delta = -event.originalEvent.deltaY / 3;
            }

            if (delta) {
                var result = self._handleDelta(delta);

                if (!result) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                }

                if (!result) {
                    return result;
                } else {
                    return false;
                }
            }

            if (event.preventDefault) {
                event.preventDefault();
            }

            event.returnValue = false;
        },

        _handleDelta: function (delta) {
            var self = this,
                inst = self.vScrollBar.jqxScrollBar('getInstance');

            if (self.focused) {
                var oldvalue = inst.value;
                if (delta < 0) {
                    self.scrollDown();
                } else {
                    self.scrollUp();
                }

                var newvalue = inst.value;
                if (oldvalue !== newvalue) {
                    return false;
                }
            }

            return true;
        },

        // scrolls down.
        scrollDown: function () {
            var self = this;

            if (self.vScrollBar.css('visibility') === 'hidden') {
                return false;
            }

            var inst = self.vScrollBar.jqxScrollBar('getInstance');

            var newPosition = Math.min(inst.value + inst.largestep, inst.max);
            inst.setPosition(newPosition);
            self._arrange();

            return true;
        },

        // scrolls up.
        scrollUp: function () {
            var self = this;

            if (self.vScrollBar.css('visibility') === 'hidden') {
                return false;
            }

            var inst = self.vScrollBar.jqxScrollBar('getInstance');

            var newPosition = Math.max(inst.value - inst.largestep, inst.min);
            inst.setPosition(newPosition);
            self._arrange();

            return true;
        },

        // sets the width and height of the widget
        _setSize: function () {
            var self = this;

            self.host.css('width', self.width);
            self.host.css('height', self.height);
        },

        // adds necessary classes to the widget
        _addClasses: function () {
            var self = this;

            self.host.addClass(self.toThemeProperty('jqx-panel'));
            self.host.addClass(self.toThemeProperty('jqx-widget'));
            self.host.addClass(self.toThemeProperty('jqx-widget-content'));
            self.host.addClass(self.toThemeProperty('jqx-text-area'));
            self.textarea.addClass(self.toThemeProperty('jqx-widget'));
            self.textarea.addClass(self.toThemeProperty('jqx-widget-content'));

            if (self.roundedCorners === true) {
                self.host.addClass(self.toThemeProperty('jqx-rc-all'));
            }

            if (self.disabled === true) {
                self.host.addClass(self.toThemeProperty('jqx-fill-state-disabled'));
                self.textarea.attr('disabled', '');
                $.jqx.aria(self, 'aria-disabled', true);
            } else {
                $.jqx.aria(self, 'aria-disabled', false);
            }

            if (self.rtl === true) {
                self.textarea.addClass(self.toThemeProperty('jqx-text-area-element-rtl'));
            }
        },

        // adds necessary classes to the pop-up
        _addPopupClasses: function () {
            var self = this,
                popup = self.$popup;

            popup.addClass(self.toThemeProperty('jqx-popup'));
            if ($.jqx.browser.msie) {
                popup.addClass(self.toThemeProperty('jqx-noshadow'));
            }
            popup.addClass(self.toThemeProperty('jqx-input-popup'));
            popup.addClass(self.toThemeProperty('jqx-menu'));
            popup.addClass(self.toThemeProperty('jqx-menu-vertical'));
            popup.addClass(self.toThemeProperty('jqx-menu-dropdown'));
            popup.addClass(self.toThemeProperty('jqx-widget'));
            popup.addClass(self.toThemeProperty('jqx-widget-content'));
            if (self.roundedCorners) {
                popup.addClass(self.toThemeProperty('jqx-rc-all'));
            }
        },

        _updateSource: function () {
            var that = this;

            var mapItems = function (source) {
                var items = [];
                items = $.map(source, function (item) {
                    if (item === undefined) {
                        return null;
                    }

                    if (typeof item === 'string' || item instanceof String) {
                        return { label: item, value: item };
                    }

                    if (typeof item !== 'string' && item instanceof String === false) {
                        var label = '';
                        var value = '';

                        if (that.displayMember !== '' && that.displayMember !== undefined) {
                            if (item[that.displayMember]) {
                                label = item[that.displayMember];
                            }
                        }

                        if (that.valueMember !== '' && that.valueMember !== undefined) {
                            value = item[that.valueMember];
                        }

                        if (label === '') {
                            label = item.label;
                        }
                        if (value === '') {
                            value = item.value;
                        }

                        return { label: label, value: value };
                    }

                    return item;
                });
                return items;
            };

            if (that.source && that.source._source) {
                that.adapter = that.source;
                if (that.adapter._source.localdata) {
                    that.adapter.unbindBindingUpdate(that.element.id);
                    that.adapter.bindBindingUpdate(that.element.id, function () {
                        that.source = mapItems(that.adapter.records);
                    });
                } else {
                    var postdata = {};
                    if (that.adapter._options.data) {
                        $.extend(that.adapter._options.data, postdata);
                    } else {
                        if (that.source._source.data) {
                            $.extend(postdata, that.source._source.data);
                        }
                        that.adapter._options.data = postdata;
                    }
                    that.adapter.unbindDownloadComplete(that.element.id);
                    that.adapter.bindDownloadComplete(that.element.id, function () {
                        that.source = mapItems(that.adapter.records);
                    });
                }
                that.source.dataBind();
                return;
            }

            if (!$.isFunction(that.source)) {
                that.source = mapItems(that.source);
            }
        },

        // shows the pop-up
        open: function () {
            var self = this;

            if ($.jqx.isHidden(self.host)) {
                return;
            }

            var position = $.extend({}, self.host.coord(true), {
                height: self.host[0].offsetHeight
            });

            if (self.$popup.parent().length === 0) {
                var popupId = self._id + '_popup';
                self.$popup[0].id = popupId;
                $.jqx.aria(self, 'aria-owns', popupId);
            }

            self.$popup.appendTo($(document.body)).css({
                position: 'absolute',
                zIndex: self.popupZIndex,
                top: position.top + position.height,
                left: position.left
            }).show();
            var height = 0;
            var children = self.$popup.children();
            $.each(children, function () {
                height += $(this).outerHeight(true) - 1;
            });
            self.$popup.height(height);

            self.opened = true;
            self._raiseEvent('2', { popup: self.$popup }); // 'open' event
            $.jqx.aria(self, 'aria-expanded', true);

            self._addItemHandlers();

            return self;
        },

        // hides the pop-up
        close: function () {
            var self = this;

            self._removeItemHandlers();
            self.$popup.hide();
            self.opened = false;
            self._raiseEvent('3', { popup: self.$popup }); // 'close' event
            $.jqx.aria(self, 'aria-expanded', false);
            return self;
        },

        _suggest: function () {
            var self = this,
                items;

            self.query = self.textarea[0].value;

            if (!self.query || self.query.length < self.minLength) {
                return self.opened ? self.close() : self;
            }

            if ($.isFunction(self.source)) {
                items = self.source(self.query, $.proxy(self._load, this));
            } else {
                items = self.source;
            }

            if (items) {
                return self._load(items);
            }

            return self;
        },

        _load: function (items) {
            var that = this;

            items = $.grep(items, function (item) {
                return that.filter(item);
            });

            items = that.sort(items);

            if (!items.length) {
                if (that.opened) {
                    return that.close();
                } else {
                    return that;
                }
            }

            return that._render(items.slice(0, that.items)).open();
        },

        _filter: function (item) {
            var self = this;
            var value = self.query;
            var itemValue = item;
            if (item.label !== undefined) {
                itemValue = item.label;
            } else if (self.displayMember) {
                itemValue = item[self.displayMember];
            }

            switch (self.searchMode) {
                case 'none':
                    break;
                case 'contains':
                    return $.jqx.string.contains(itemValue, value);
                case 'equals':
                    return $.jqx.string.equals(itemValue, value);
                case 'equalsignorecase':
                    return $.jqx.string.equalsIgnoreCase(itemValue, value);
                case 'startswith':
                    return $.jqx.string.startsWith(itemValue, value);
                case 'startswithignorecase':
                    return $.jqx.string.startsWithIgnoreCase(itemValue, value);
                case 'endswith':
                    return $.jqx.string.endsWith(itemValue, value);
                case 'endswithignorecase':
                    return $.jqx.string.endsWithIgnoreCase(itemValue, value);
                default:
                    return $.jqx.string.containsIgnoreCase(itemValue, value);
            }
        },

        _sort: function (items) {
            var self = this,
                bw = [],
                cs = [],
                cis = [];

            for (var i = 0; i < items.length; i++) {
                var item = items[i];

                var itemValue = item;
                if (item.label) {
                    itemValue = item.label;
                } else if (self.displayMember) {
                    itemValue = item[self.displayMember];
                }

                if (itemValue.toString().toLowerCase().indexOf(self.query.toString().toLowerCase()) === 0) {
                    bw.push(item);
                } else if (itemValue.toString().indexOf(self.query) >= 0) {
                    cs.push(item);
                } else if (itemValue.toString().toLowerCase().indexOf(self.query.toString().toLowerCase()) >= 0) {
                    cis.push(item);
                }
            }

            return bw.concat(cs, cis);
        },

        _render: function (items) {
            var that = this;

            items = $(items).map(function (i, item) {
                var itemValue = item;
                if (item.value !== undefined) {
                    if (item.label !== undefined) {
                        i = $(that.item).attr({ 'data-name': item.label, 'data-value': item.value });
                    }
                    else {
                        i = $(that.item).attr({ 'data-name': item.value, 'data-value': item.value });
                    }
                }
                else if (item.label !== undefined) {
                    i = $(that.item).attr({ 'data-value': item.label, 'data-name': item.label });
                }
                else if (that.displayMember !== undefined && that.displayMember !== '') {
                    i = $(that.item).attr({ 'data-name': item[that.displayMember], 'data-value': item[that.valueMember] });
                }
                else {
                    i = $(that.item).attr({ 'data-value': item, 'data-name': item });
                }
                if (item.label) {
                    itemValue = item.label;
                }
                else if (that.displayMember) {
                    itemValue = item[that.displayMember];
                }

                i.find('a').html(that.highlight(itemValue));
                var rcClass = '',
                    rtlClass = '';
                if (that.roundedCorners === true) {
                    rcClass = ' ' + that.toThemeProperty('jqx-rc-all');
                }
                if (that.rtl) {
                    rtlClass = ' ' + that.toThemeProperty('jqx-rtl');
                }
                i[0].className = that.toThemeProperty('jqx-item') + ' ' + that.toThemeProperty('jqx-menu-item') + rcClass + rtlClass;
                return i[0];
            });

            items.first().addClass(that.toThemeProperty('jqx-fill-state-pressed'));
            that.$popup.html(items);
            if (!that.dropDownWidth) {
                that.$popup.width(that.host.outerWidth() - 6);
            } else {
                that.$popup.width(that.dropDownWidth);
            }

            return that;
        },

        _highlight: function (item) {
            var query = this.query;
            query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

            var regex = new RegExp('(' + query + ')', 'ig');
            return item.replace(regex, function ($1, match) {
                return '<b>' + match + '</b>';
            });
        },

        // selects an item from the pop-up
        _select: function () {
            var self = this;
            var val = self.$popup.find('.jqx-fill-state-pressed').attr('data-value');
            var label = self.$popup.find('.jqx-fill-state-pressed').attr('data-name');
            self.textarea[0].value = self.renderer(label, self.textarea[0].value);
            self.selectedItem = { 'label': label, 'value': val };
            self.host.attr('data-value', val);
            self.host.attr('data-label', label);
            self._raiseEvent('1', { 'item': { 'label': label, 'value': val} }); // 'select' event
            self._arrange();
            self.textarea[0].scrollTop = self.textarea[0].scrollHeight; // scrolls to the bottom
            self._raiseEvent('0');
            return self.close();
        },

        _renderer: function (item) {
            return item;
        },

        _move: function (e) {
            var self = this;

            if (!self.opened) {
                return;
            }

            switch (e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault();
                    break;
                case 38: // up arrow
                    if (!e.shiftKey) {
                        e.preventDefault();
                        self._prev();
                    }
                    break;
                case 40: // down arrow
                    if (!e.shiftKey) {
                        e.preventDefault();
                        self._next();
                    }
                    break;
            }

            e.stopPropagation();
        },

        _next: function () {
            var self = this,
                active = self.$popup.find('.jqx-fill-state-pressed').removeClass(self.toThemeProperty('jqx-fill-state-pressed')),
                next = active.next();

            if (!next.length) {
                next = $(self.$popup.find('li')[0]);
            }

            next.addClass(self.toThemeProperty('jqx-fill-state-pressed'));
        },

        _prev: function () {
            var self = this,
                active = self.$popup.find('.jqx-fill-state-pressed').removeClass(self.toThemeProperty('jqx-fill-state-pressed')),
                prev = active.prev();

            if (!prev.length) {
                prev = self.$popup.find('li').last();
            }

            prev.addClass(self.toThemeProperty('jqx-fill-state-pressed'));
        }
    });
})(jqxBaseFramework); //ignore jslint
