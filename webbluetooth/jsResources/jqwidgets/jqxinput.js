/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {

    $.jqx.jqxWidget("jqxInput", "", {});

    $.extend($.jqx._jqxInput.prototype, {
        defineInstance: function () {
            var that = this;
            var settings = {
                disabled: false,
                filter: that._filter,
                sort: that._sort,
                highlight: that._highlight,
                dropDownWidth: null,
                renderer: that._renderer,
                opened: false,
                $popup: $('<ul></ul>'),
                source: [],
                roundedCorners: true,
                searchMode: 'default',
                placeHolder: "",
                width: null,
                height: null,
                value: "",
                rtl: false,
                displayMember: "",
                valueMember: "",
                events: ['select', 'open', 'close', 'change'],
                popupZIndex: 20000,
                items: 8,
                item: '<li><a href:"#"></a></li>',
                minLength: 1,
                maxLength: null
            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            this.render();
        },

        render: function () {
            if (this.element.nodeName.toLowerCase() == "textarea") {
                this.element.style.overflow = "auto";
            }
            else
                if (this.element.nodeName.toLowerCase() == "div") {
                    this.baseHost = this.element;
                    var input = this.host.find("input");
                    var hasTextInput = false;
                    $.each(input, function () {
                        var type = this.type;
                        if (type == null || type == "text" || type == "textarea") {
                            input = $(this);
                            hasTextInput = true;
                            return false;
                        }
                    });
                    if (!hasTextInput) {
                        throw new Error("jqxInput: Missing Text Input in the Input Group");
                    }

                    if (input.length > 0) {
                        this.baseHost = $(this.element);
                        var data = this.host.data();
                        this.host = input;
                        this.element = input[0];
                        this.host.data(data);
                        this.baseHost.addClass(this.toThemeProperty('jqx-widget'));
                        this.baseHost.addClass(this.toThemeProperty('jqx-rc-all'));
                        this.baseHost.addClass(this.toThemeProperty('jqx-input-group'));
                        var children = this.baseHost.children();
                        var that = this;
                        $.each(children, function (index) {
                            $(this).addClass(that.toThemeProperty('jqx-input-group-addon'));
                            $(this).removeClass(that.toThemeProperty('jqx-rc-all'));
                            if (index == 0) {
                                $(this).addClass(that.toThemeProperty('jqx-rc-l'));
                            }
                            if (index == children.length - 1) {
                                $(this).addClass(that.toThemeProperty('jqx-rc-r'));
                            }
                            if (this != that.element) {
                                $(this).addClass(that.toThemeProperty('jqx-fill-state-normal'));
                            }
                        });
                    }
                }

            this.addHandlers();
            if (this.rtl) {
                this.host.addClass(this.toThemeProperty('jqx-rtl'));
            }
            this.host.attr('role', 'textbox');
            $.jqx.aria(this, "aria-autocomplete", "both");
            $.jqx.aria(this, "aria-disabled", this.disabled);
            $.jqx.aria(this, "aria-readonly", false);
            $.jqx.aria(this, "aria-multiline", false);
            if (this.source && this.source.length) {
                $.jqx.aria(this, "aria-haspopup", true);
            }
            if (this.value != "") {
                this.element.value = this.value;
            }

            this._oldsource = this.source;
            this._updateSource();
        },

        _updateSource: function () {
            var that = this;
            var mapItems = function (source) {
                var items = new Array();
                items = $.map(source, function (item) {
                    if (item == undefined)
                        return null;

                    if (typeof item === "string" || item instanceof String) {
                        return { label: item, value: item };
                    }

                    if (typeof item != "string" && item instanceof String == false) {
                        var label = "";
                        var value = "";

                        if (that.displayMember != "" && that.displayMember != undefined) {
                            if (item[that.displayMember]) {
                                label = item[that.displayMember];
                            }
                        }

                        if (that.valueMember != "" && that.valueMember != undefined) {
                            value = item[that.valueMember];
                        }

                        if (label == "") label = item.label;
                        if (value == "") value = item.value;

                        return { label: label, value: value };
                    }

                    return item;
                });
                return items;
            }

            if (this.source && this.source._source) {
                this.adapter = this.source;
                if (this.adapter._source.localdata != null) {
                    this.adapter.unbindBindingUpdate(this.element.id);
                    this.adapter.bindBindingUpdate(this.element.id, function (updatetype) {
                        that.source = mapItems(that.adapter.records);
                    });
                }
                else {
                    var postdata = {};
                    if (this.adapter._options.data) {
                        $.extend(that.adapter._options.data, postdata);
                    }
                    else {
                        if (this.source._source.data) {
                            $.extend(postdata, this.source._source.data);
                        }
                        this.adapter._options.data = postdata;
                    }
                    this.adapter.unbindDownloadComplete(this.element.id);
                    this.adapter.bindDownloadComplete(this.element.id, function (updatetype) {
                        that.source = mapItems(that.adapter.records);
                    });
                }
                this.source.dataBind();
                return;
            }

            if (!$.isFunction(this.source)) {
                this.source = mapItems(this.source);
            }
        },

        _refreshClasses: function (add) {
            var func = add ? 'addClass' : 'removeClass';
            this.host[func](this.toThemeProperty('jqx-widget-content'));
            this.host[func](this.toThemeProperty('jqx-input'));
            this.host[func](this.toThemeProperty('jqx-widget'));
            this.$popup[func](this.toThemeProperty('jqx-popup'));
            if ($.jqx.browser.msie) {
                this.$popup[func](this.toThemeProperty('jqx-noshadow'));
            }
            this.$popup[func](this.toThemeProperty('jqx-input-popup'));
            this.$popup[func](this.toThemeProperty('jqx-menu'));
            this.$popup[func](this.toThemeProperty('jqx-menu-vertical'));
            this.$popup[func](this.toThemeProperty('jqx-menu-dropdown'));
            this.$popup[func](this.toThemeProperty('jqx-widget'));
            this.$popup[func](this.toThemeProperty('jqx-widget-content'));
            if (this.roundedCorners) {
                this.host[func](this.toThemeProperty('jqx-rc-all'));
                this.$popup[func](this.toThemeProperty('jqx-rc-all'));
            }
            if (this.disabled) {
                this.host[func](this.toThemeProperty('jqx-fill-state-disabled'));
            }
            else {
                this.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
            }
        },

        selectAll: function () {
            var textbox = this.host;
            setTimeout(function () {
                if ('selectionStart' in textbox[0]) {
                    textbox[0].focus();
                    textbox[0].setSelectionRange(0, textbox[0].value.length);
                }
                else {
                    var range = textbox[0].createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', textbox[0].value.length);
                    range.moveStart('character', 0);
                    range.select();
                }
            }, 10);
        },

        selectLast: function () {
            var textbox = this.host;
            this.selectStart(textbox[0].value.length);
        },

        selectFirst: function () {
            var textbox = this.host;
            this.selectStart(0);
        },

        selectStart: function (index) {
            var textbox = this.host;
            setTimeout(function () {
                if ('selectionStart' in textbox[0]) {
                    textbox[0].focus();
                    textbox[0].setSelectionRange(index, index);
                }
                else {
                    var range = textbox[0].createTextRange();
                    range.collapse(true);
                    range.moveEnd('character', index);
                    range.moveStart('character', index);
                    range.select();
                }
            }, 10);
        },

        focus: function () {
            try {
                this.host.focus();
                var that = this;
                setTimeout(function () {
                    that.host.focus();
                }, 25);

            }
            catch (error) {
            }
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.refresh();
        },

        refresh: function () {
            this._refreshClasses(false);
            this._refreshClasses(true);

            if (!this.baseHost) {
                if (this.width) this.host.width(this.width);
                if (this.height) this.host.height(this.height);
            }
            else {
                if (this.width) this.baseHost.width(this.width);
                if (this.height) {
                    this.baseHost.height(this.height);
                    var that = this;
                    var totalWidth = 0;
                    var height = this.baseHost.height() - 2;
                    if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                        this.baseHost.css('display', 'inline-block');
                    }
                    $.each(this.baseHost.children(), function () {
                        $(this).css('height', '100%');
                        if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                            $(this).css('height', height + 'px');
                        }
                        if (this !== that.element) {
                            totalWidth += $(this).outerWidth() + 2;
                        }
                    });
                    this.host.css('width', this.baseHost.width() - totalWidth - 4 + 'px');
                    if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                        this.host.css('min-height', height + 'px');
                        this.host.css('line-height', height + 'px');
                    }
                }
            }

            this.host.attr('disabled', this.disabled);
            if (this.maxLength) {
                this.host.attr("maxlength", this.maxLength);
            };

            if (!this.host.attr('placeholder')) {
                this._refreshPlaceHolder();
            }
        },

        _refreshPlaceHolder: function () {
            if ('placeholder' in this.element) {
                this.host.attr('placeHolder', this.placeHolder);
            }
            else {
                var that = this;
                if (this.element.value == "") {
                    this.element.value = this.placeHolder;

                    this.host.focus(function () {
                        if (that.element.value == that.placeHolder) {
                            that.element.value = "";
                        }
                    });

                    this.host.blur(function () {
                        if (that.element.value == '' || that.element.value == that.placeHolder) {
                            that.element.value = that.placeHolder;
                        }
                    });
                }
            }
        },

        destroy: function () {
            this.removeHandlers();
            if (this.baseHost) {
                this.baseHost.remove();
            } else {
                this.host.remove();
            }
            if (this.$popup) {
                this.$popup.remove();
            }
        },

        propertiesChangedHandler: function (object, key, value)
        {
            if (value.width && value.height && Object.keys(value).length == 2)
            {
                object.refresh();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key == 'placeHolder') {
                object._refreshPlaceHolder();
                return;
            }

            if (object.batchUpdate && object.batchUpdate.width && object.batchUpdate.height && Object.keys(object.batchUpdate).length == 2)
            {
                return;
            }

            if (key === 'theme') {
                $.jqx.utilities.setTheme(oldvalue, value, object.host);
            }

            if (key == "opened") {
                if (value) object.open();
                else object.close();
                return;
            }
            if (key == "source") {
                object._oldsource = value;
                object._updateSource();
            }
            if (key == "displayMember" || key == "valueMember") {
                object.source = object._oldsource;
                object._updateSource();
            }
            if (key == "disabled") {
                $.jqx.aria(object, "aria-disabled", object.disabled);
            }

            if (key == "value") {
                object.element.value = value;
            }

            object.refresh();
        },

        select: function (event, ui, changeType) {
            var val = this.$popup.find('.jqx-fill-state-pressed').attr('data-value')
            var label = this.$popup.find('.jqx-fill-state-pressed').attr('data-name');
            this.element.value = this.renderer(label, this.element.value);
            this.selectedItem = { 'label': label, 'value': val };
            this.host.attr('data-value', val);
            this.host.attr('data-label', label);
            this._raiseEvent('0', { 'item': { 'label': label, 'value': val }, 'label': label, 'value': val });
            this._raiseEvent('3', {type: changeType, 'item': { 'label': label, 'value': val }, 'label': label, 'value': val });
            return this.close();
        },

        val: function (value) {
            if (arguments.length == 0 || (value != null && typeof (value) == "object" && !value.label && !value.value)) {
                if (this.displayMember != "" && this.valueMember != "" && this.selectedItem) {
                    if (this.element.value === "") {
                        return "";
                    }
                    return this.selectedItem;
                }

                return this.element.value;
            }

            if (value && value.label) {
                this.selectedItem = { 'label': value.label, 'value': value.value };
                this.host.attr('data-value', value.value);
                this.host.attr('data-label', value.label);
                this.value = value;
                this.element.value = value.label;
                return this.element.value;
            }

            this.value = value;
            this.element.value = value;
            this.host.attr('data-value', value);
            this.host.attr('data-label', value);
            if (value && value.label) {
                this._raiseEvent('3', {type: null, 'item': { 'label': value.label, 'value': value.value }, 'label': value.label, 'value': value.value });
            }
            else {
                this._raiseEvent('3', { type: null, 'item': { 'label': value, 'value': value }, 'label': value, 'value': value });
            }
            return this.element.value;
        },

        _raiseEvent: function (id, arg) {
            if (arg == undefined)
                arg = { owner: null };

            var evt = this.events[id];
            arg.owner = this;

            var event = new $.Event(evt);
            event.owner = this;
            event.args = arg;
            if (event.preventDefault)
                event.preventDefault();

            var result = this.host.trigger(event);
            return result;
        },

        _renderer: function (item) {
            return item;
        },

        open: function () {
            if ($.jqx.isHidden(this.host)) {
                return;
            }

            var position = $.extend({}, this.host.coord(true), {
                height: this.host[0].offsetHeight
            })

            if (this.$popup.parent().length == 0) {
                var popupId = this.element.id + "_" + "popup";
                this.$popup[0].id = popupId;
                $.jqx.aria(this, "aria-owns", popupId);
            }

            this.$popup
            .appendTo($(document.body))
            .css({
                position: 'absolute',
                zIndex: this.popupZIndex,
                top: position.top + position.height
            , left: position.left
            })
            .show();
            var height = 0;
            var children = this.$popup.children();
            $.each(children, function () {
                height += $(this).outerHeight(true) - 1;
            });
            this.$popup.height(height);

            this.opened = true;
            this._raiseEvent('1', { popup: this.$popup });
            $.jqx.aria(this, "aria-expanded", true);
            return this
        },

        close: function () {
            this.$popup.hide();
            this.opened = false;
            this._raiseEvent('2', { popup: this.$popup });
            $.jqx.aria(this, "aria-expanded", false);
            return this;
        },

        suggest: function (event) {
            var items;
            this.query = this.element.value;

            if (!this.query || this.query.length < this.minLength) {
                return this.opened ? this.close() : this
            }

            if ($.isFunction(this.source)) {
                items = this.source(this.query, $.proxy(this.load, this));
            }
            else {
                items = this.source;
            }

            if (items) {
                return this.load(items);
            }

            return this;
        },

        load: function (items) {
            var that = this;

            items = $.grep(items, function (item) {
                return that.filter(item);
            })

            items = this.sort(items)

            if (!items.length) {
                if (this.opened) {
                    return this.close();
                }
                else {
                    return this;
                }
            }

            return this._render(items.slice(0, this.items)).open();
        },

        _filter: function (item) {
            var value = this.query;
            var itemValue = item;
            if (item.label != null) {
                itemValue = item.label;
            }
            else if (this.displayMember) {
                itemValue = item[this.displayMember];
            }

            switch (this.searchMode) {
                case 'none':
                    break;
                case 'containsignorecase':
                default:
                    return $.jqx.string.containsIgnoreCase(itemValue, value);
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
            }
        },

        _sort: function (items) {
            var bw = []
            , cs = []
            , cis = []
            , item

            for (var i = 0; i < items.length; i++) {
                var item = items[i];

                var itemValue = item;
                if (item.label) {
                    itemValue = item.label;
                }
                else if (this.displayMember) {
                    itemValue = item[this.displayMember];
                }

                if (itemValue.toString().toLowerCase().indexOf(this.query.toString().toLowerCase()) === 0) {
                    bw.push(item);
                }
                else if (itemValue.toString().indexOf(this.query) >= 0) {
                    cs.push(item);
                }
                else if (itemValue.toString().toLowerCase().indexOf(this.query.toString().toLowerCase()) >= 0) {
                    cis.push(item);
                }
            }

            return bw.concat(cs, cis);
        },

        _highlight: function (item) {
            var query = this.query;
            query = query.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

            var regex = new RegExp('(' + query + ')', 'ig');
            return item.replace(regex, function ($1, match) {
                return '<b>' + match + '</b>'
            })
        },

        _render: function (items) {
            var that = this

            items = $(items).map(function (i, item) {
                var itemValue = item;
                if (item.value != undefined) {
                    if (item.label != undefined) {
                        i = $(that.item).attr({ 'data-name': item.label, 'data-value': item.value });
                    }
                    else {
                        i = $(that.item).attr({ 'data-name': item.value, 'data-value': item.value });
                    }
                }
                else if (item.label != undefined) {
                    i = $(that.item).attr({ 'data-value': item.label, 'data-name': item.label });
                }
                else if (that.displayMember != undefined && that.displayMember != "") {
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
                var rtlClass = "";
                if (that.rtl) {
                    rtlClass = " " + that.toThemeProperty('jqx-rtl');
                }
                i[0].className = that.toThemeProperty('jqx-item') + " " + that.toThemeProperty('jqx-menu-item') + " " + that.toThemeProperty('jqx-rc-all') + rtlClass;
                return i[0];
            })

            items.first().addClass(this.toThemeProperty('jqx-fill-state-pressed'));
            this.$popup.html(items);
            if (!this.dropDownWidth) {
                this.$popup.width(this.host.outerWidth() - 6);
            }
            else {
                this.$popup.width(this.dropDownWidth);
            }

            return this;
        },

        next: function (event) {
            var active = this.$popup.find('.jqx-fill-state-pressed').removeClass(this.toThemeProperty('jqx-fill-state-pressed'))
            , next = active.next();

            if (!next.length) {
                next = $(this.$popup.find('li')[0]);
            }

            next.addClass(this.toThemeProperty('jqx-fill-state-pressed'));
        },

        prev: function (event) {
            var active = this.$popup.find('.jqx-fill-state-pressed').removeClass(this.toThemeProperty('jqx-fill-state-pressed'))
        , prev = active.prev()

            if (!prev.length) {
                prev = this.$popup.find('li').last()
            }

            prev.addClass(this.toThemeProperty('jqx-fill-state-pressed'));
        },

        addHandlers: function () {
            var that = this;
            that.addHandler(that.host, 'focus', $.proxy(that.onFocus, that));
            that.addHandler(that.host, 'blur', $.proxy(that.onBlur, that));
            that.addHandler(that.host, 'change.jqxinput' + that.element.id, function (event) {
                if (!event.args) {
                    event.stopPropagation();
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    var item = that.val();
                    if (item && item.label) {
                        var label = item.label;
                        var val = item.val;
                    }
                    else {
                        var label = item;
                        var val = item;
                    }
                    that._raiseEvent('3', { type: "keyboard", 'item': { 'label': label, 'value': val }, 'label': label, 'value': val });

                }
            });

            that.addHandler(that.host, 'keypress', $.proxy(that.keypress, that));
            that.addHandler(that.host, 'keyup', $.proxy(that.keyup, that));
            that.addHandler(that.host, 'keydown', $.proxy(that.keydown, that));
            that.addHandler(that.$popup, 'mousedown', $.proxy(that.click, that));
            if (that.host.on) {
                that.$popup.on('mouseenter', 'li', $.proxy(that.mouseenter, that));
            }
            else {
                that.$popup.bind('mouseenter', 'li', $.proxy(that.mouseenter, that));
            }
        },

        removeHandlers: function () {
            var that = this;
            that.removeHandler(that.host, 'change.jqxinput' + that.element.id);
            that.removeHandler(that.host, 'focus', $.proxy(that.onFocus, this));
            that.removeHandler(that.host, 'blur', $.proxy(that.onBlur, this));
            that.removeHandler(that.host, 'keypress', $.proxy(that.keypress, this));
            that.removeHandler(that.host, 'keyup', $.proxy(that.keyup, this));
            that.removeHandler(that.host, 'keydown', $.proxy(that.keydown, this));
            that.removeHandler(that.$popup, 'mousedown', $.proxy(that.click, this));
            if (that.host.off) {
                that.$popup.off('mouseenter', 'li', $.proxy(that.mouseenter, this));
            }
            else {
                that.$popup.unbind('mouseenter', 'li', $.proxy(that.mouseenter, this));
            }
        },

        move: function (e) {
            if (!this.opened) return

            switch (e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault()
                    break

                case 38: // up arrow
                    if (!e.shiftKey) {
                        e.preventDefault()
                        this.prev()
                    }
                    break

                case 40: // down arrow
                    if (!e.shiftKey) {
                        e.preventDefault()
                        this.next()
                    }
                    break
            }

            e.stopPropagation()
        },

        keydown: function (e) {
            this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40, 38, 9, 13, 27])
            this.move(e)
        },

        keypress: function (e) {
            if (this.suppressKeyPressRepeat) return
            this.move(e)
        },

        keyup: function (e) {
            switch (e.keyCode) {
                case 40: // down arrow
                case 38: // up arrow
                case 16: // shift
                case 17: // ctrl
                case 18: // alt
                    break

                case 9: // tab
                case 13: // enter
                    if (!this.opened) return;
                    this.select(e, this, "keyboard")
                    break

                case 27: // escape
                    if (!this.opened) return;
                    this.close()
                    break

                default:
                    {
                        var me = this;
                        if (this.timer) clearTimeout(this.timer);
                        this.timer = setTimeout(function () {
                            me.suggest();
                        }, 300);
                    }
            }

            e.stopPropagation()
            e.preventDefault()
        },

        clear: function () {
            this.host.val("");
        },

        onBlur: function (e) {
            var that = this;
            setTimeout(function () { that.close() }, 150)
            that.host.removeClass(that.toThemeProperty('jqx-fill-state-focus'));
            this.value = this.host.val();
        },

        onFocus: function (e) {
            var that = this;
            that.host.addClass(that.toThemeProperty('jqx-fill-state-focus'));
        },

        click: function (e) {
            e.stopPropagation()
            e.preventDefault()
            this.select(e, this, "mouse")
        },

        mouseenter: function (e) {
            this.$popup.find('.jqx-fill-state-pressed').removeClass(this.toThemeProperty('jqx-fill-state-pressed'));
            $(e.currentTarget).addClass(this.toThemeProperty('jqx-fill-state-pressed'));
        }

    });
})(jqxBaseFramework);
