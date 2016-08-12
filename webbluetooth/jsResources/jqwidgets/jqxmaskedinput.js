/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {

    $.jqx.jqxWidget("jqxMaskedInput", "", {});

    $.extend($.jqx._jqxMaskedInput.prototype, {

        defineInstance: function () {
            var settings = {
                //Type: String
                //Default: null
                //Sets the masked input's value.
                value: null,
                //Type: String.
                //Default: null.
                //Sets the masked input's mask.
                mask: "99999",
                //Type: Number.
                //Default: 0.
                //Sets width of the masked input in pixels. Only positive values have effect.
                width: null,
                //Type: Number.
                //Default: 0.
                //Sets height of the masked input in pixels. 
                height: 25,
                // Type: String
                // Sets the text alignment.
                textAlign: "left",
                // Type: Bool
                // Default: false
                // Sets the readOnly state of the input.
                readOnly: false,
                cookies: false,
                // Type: Char
                // Default: "_"
                // Sets the prompt char displayed when an editable char is empty.
                promptChar: "_",
                // Type: String
                // Default: advanced
                // Gets or sets the input mode. When the mode is simple, the text is formatted after editing. When the mode is advanced, the text is formatted while the user is in edit mode.
                // Available values: [simple, advanced]
                inputMode: 'advanced',
                rtl: false,
                disabled: false,
                events:
                [
                   'valueChanged', 'textchanged', 'mousedown', 'mouseup', 'keydown', 'keyup', 'keypress', 'change'
                ],
                aria:
                {
                    "aria-valuenow": { name: "value", type: "string" },
                    "aria-disabled": { name: "disabled", type: "boolean" }
                }
            }
            $.extend(true, this, settings);
            return settings;
        },

        // creates the masked input's instance. 
        createInstance: function (args) {
            this.render();
        },

        render: function () {
            var that = this;
            that.host
	        .attr({
	            role: "textbox"
	        });
            that.host.attr('data-role', 'input');
            var _val = that.host.attr('value');
            if (_val != undefined && _val != "") {
                that.value = _val;
            }

            $.jqx.aria(this);
            $.jqx.aria(this, "aria-multiline", false);
            $.jqx.aria(this, "aria-readonly", that.readOnly);

            that.host.addClass(that.toThemeProperty('jqx-input'));
            that.host.addClass(that.toThemeProperty('jqx-rc-all'));
            that.host.addClass(that.toThemeProperty('jqx-widget'));
            that.host.addClass(that.toThemeProperty('jqx-widget-content'));

            maskEditor = this;
            if (that.element.nodeName.toLowerCase() == "div") {
                that.element.innerHTML = "";
                that.maskbox = $("<input autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' type='textarea'/>").appendTo(that.host);
            }
            else {
                that.maskbox = that.host;
                that.maskbox.attr('autocomplete', 'off');
                that.maskbox.attr('autocorrect', 'off');
                that.maskbox.attr('autocapitalize', 'off');
                that.maskbox.attr('spellcheck', false);
            }
            that.maskbox.addClass(that.toThemeProperty('jqx-reset'));
            that.maskbox.addClass(that.toThemeProperty('jqx-input-content'));
            that.maskbox.addClass(that.toThemeProperty('jqx-widget-content'));

            var name = that.host.attr('name');
            if (name) {
                that.maskbox.attr('name', name);
            }
            if (that.rtl) {
                that.maskbox.addClass(that.toThemeProperty('jqx-rtl'));
            }

            var me = this;
            that.propertyChangeMap['disabled'] = function (instance, key, oldVal, value) {
                if (value) {
                    instance.maskbox.addClass(me.toThemeProperty('jqx-input-disabled'));
                }
                else {
                    instance.maskbox.removeClass(me.toThemeProperty('jqx-input-disabled'));
                }
            }

            if (that.disabled) {
                that.maskbox.addClass(that.toThemeProperty('jqx-input-disabled'));
                that.maskbox.attr("disabled", true);
                that.host.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }

            that.selectedText = "";
            that.self = this;
            that.oldValue = that._value();
            that.items = new Array();
            that._initializeLiterals();
            that._render();

            if (that.value != null) {
                that.inputValue(that.value.toString());
            }

            var me = this;
            if (that.host.parents('form').length > 0) {
                that.host.parents('form').on('reset', function () {
                    setTimeout(function () {
                        me.clearValue();
                    }, 10);
                });
            }

            that.addHandlers();

            if (that.cookies) {
                var cookieResult = $.jqx.cookie.cookie("maskedInput." + that.element.id);
                if (cookieResult) {
                    that.val(cookieResult);
                }
            }
        },

        addHandlers: function () {
            var me = this;

            if ($.jqx.mobile.isTouchDevice()) {
            //    this.inputMode = "simple";
            }
            var oldVal = "";
            var doSimpleInput = function (event, key) {
                var letter = String.fromCharCode(key);
                var digit = parseInt(letter);
                var allowInput = true;

                if (!isNaN(digit)) {
                    allowInput = true;
                    var maxLength = this.maskbox.val().toString().length;
                    if (maxLength >= this.items.length && this._selection().length == 0) {
                        allowInput = false;
                    }
                }

                if (!event.ctrlKey && !event.shiftKey && !event.metaKey) {
                    if (key >= 65 && key <= 90) {
                        allowInput = false;
                    }
                }

                return allowInput;
            }

            this.addHandler(this.maskbox, 'blur',
            function (event) {
                if (me.inputMode == 'simple') {
                    me._exitSimpleInputMode(event, me, false, oldVal);
                    return false;
                }
                if (me.rtl) {
                    me.maskbox.css('direction', 'ltr');
                }
                me.host.removeClass(me.toThemeProperty('jqx-fill-state-focus'));
                if (me.maskbox.val() != oldVal) {
                    me._raiseEvent(7, { type: "keyboard" });
                    if (me.cookies) {
                        $.jqx.cookie.cookie("maskedInput." + me.element.id, me.maskbox.val());
                    }
                }
            });

            this.addHandler(this.maskbox, 'focus',
            function (event) {
                oldVal = me.maskbox.val();
                if (me.inputMode == 'simple') {
                    me.maskbox[0].value = me._getEditValue();
                    $.data(me.maskbox, "simpleInputMode", true);
                    return false;
                }
                if (me.rtl) {
                    me.maskbox.css('direction', 'rtl');
                }

                me.host.addClass(me.toThemeProperty('jqx-fill-state-focus'));
            });

            this.addHandler(this.host, 'keydown', function (event) {
                var isreadOnly = me.readOnly;
                var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
                if (isreadOnly || me.disabled) {
                    return false;
                }
                if (me.inputMode != 'simple') {
                    var result = me._handleKeyDown(event, key);
                    if (!result) {
                        if (event.preventDefault) {
                            event.preventDefault();
                        }
                        if (event.stopPropagation) {
                            event.stopPropagation();
                        }
                    }
                    return result;
                }
                else {
                    return doSimpleInput.call(me, event, key);
                }
            });

            this.addHandler(this.host, 'keyup', function (event) {
                var isreadOnly = me.readOnly;
                var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
                if (isreadOnly || me.disabled) {
                    return true;
                }
                if (me.inputMode == 'simple') {
                    return doSimpleInput.call(me, event, key);
                }
                else {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    if (event.stopPropagation) {
                        event.stopPropagation();
                    }

                    return false;
                }
            });

            this.addHandler(this.host, 'keypress', function (event) {
                var isreadOnly = me.readOnly;
                var key = event.charCode ? event.charCode : event.keyCode ? event.keyCode : 0;
                if (isreadOnly || me.disabled) {
                    return true;
                }
                if (me.inputMode == 'simple') {
                    return doSimpleInput.call(me, event, key);
                }
                else {
                    var result = me._handleKeyPress(event, key);
                    if (!result) {
                        if (event.preventDefault) {
                            event.preventDefault();
                        }
                        if (event.stopPropagation) {
                            event.stopPropagation();
                        }
                    }
                    return result;
                }
            });
        },

        focus: function () {
            try {
                this.maskbox.focus();
            }
            catch (error) {
            }
        },

        _exitSimpleInputMode: function (event, self, checkbounds, oldvalue) {
            if (self == undefined) {
                self = event.data;
            }

            if (self == null) return;

            if (checkbounds == undefined) {
                if (event.target != null && self.element != null) {
                    if ((event.target.id != undefined && event.target.id.toString().length > 0 && self.host.find('#' + event.target.id).length > 0) || event.target == self.element) {
                        return;
                    }
                }

                var offset = self.host.offset();
                var left = offset.left;
                var top = offset.top;
                var width = self.host.width();
                var height = self.host.height();

                var targetOffset = $(event.target).offset();
                if (targetOffset.left >= left && targetOffset.left <= left + width)
                    if (targetOffset.top >= top && targetOffset.top <= top + height) {
                        return;
                    }
            }

            if (self.disabled || self.readOnly)
                return;

            var enteredMode = $.data(self.maskbox, "simpleInputMode");
            if (enteredMode == null) return;

            var currentValue = self.maskbox[0].value;
            self.val(currentValue);

            $.data(self.maskbox, "simpleInputMode", null);
            return false;
        },

        _getString: function () {
            var s = "";
            for (var i = 0; i < this.items.length; i++) {
                var character = this.items[i].character;
                if ((this.items[i].character == this.promptChar) && (this.promptChar != this.items[i].defaultCharacter)) {
                    s += this.items[i].defaultCharacter;
                }
                else {
                    s += character;
                }
            }

            return s;
        },

        _initializeLiterals: function () {
            if (this.mask == undefined || this.mask == null) {
                this.items = new Array();
                return;
            }

            this.mask = this.mask.toString();
            var length = this.mask.length;
            for (var i = 0; i < length; i++) {
                var character = this.mask.substring(i, i + 1);
                var regex = "";
                var canEdit = false;

                if (character == "[") {
                    for (var j = i; j < length; j++) {
                        var closingCharacter = this.mask.substring(j, j + 1);
                        if (closingCharacter == "]") {
                            break;
                        }
                    }
                    regex = "(" + this.mask.substring(i, j + 1) + ")";
                    i = j;
                    canEdit = true;
                }

                if (character == "#") {
                    regex = "(\\d|[+]|[-])";
                    canEdit = true;
                }
                else if (character == "9" || character == "0") {
                    regex = "\\d";
                    canEdit = true;
                }
                else if (character == "$") {
                    canEdit = false;
                }
                else if (character == "/" || character == ":") {
                    canEdit = false;
                }
                else if (character == "A" || character == "a") {
                    regex = "\\w";
                    canEdit = true;
                }
                else if (character == "c" || character == "C") {
                    regex = ".";
                    canEdit = true;
                }
                else if (character == "L" || character == "l") {
                    regex = "([a-zA-Z])";
                    canEdit = true;
                }

                var self = this;
                var literal = function (character, regex, canEdit) {
                    literal.character = character;
                    literal.regex = regex;
                    literal.canEdit = canEdit;
                    literal.defaultCharacter = self.promptChar;
                }

                if (canEdit) {
                    literal(this.promptChar, regex, canEdit);
                }
                else {
                    literal(character, regex, canEdit);
                }

                this.items.push(literal);
            }
        },

        setRegex: function (index, regex, canEdit, defaultCharacter) {
            if ((index == null || index == undefined) || (regex == null || regex == undefined))
                return;

            if (index < this.items.length) {
                this.items[index].regex = regex;
                if (canEdit != null && canEdit != undefined) {
                    this.items[index].canEdit = canEdit;
                }

                if (defaultCharacter != null && defaultCharacter != undefined) {
                    this.items[index].defaultCharacter = defaultCharacter;
                }
            }
        },

        _match: function (character, regex) {
            var regExpr = new RegExp(regex, "i");
            return regExpr.test(character);
        },

        _raiseEvent: function (id, arg) {
            var evt = this.events[id];
            var args = {};
            args.owner = this;

            var key = arg.charCode ? arg.charCode : arg.keyCode ? arg.keyCode : 0;
            var result = true;
            var isreadOnly = this.readOnly;
            var event = new $.Event(evt);
            event.owner = this;
            args.value = this.inputValue();
            args.text = this.maskedValue();
            if (id == 7) {
                args.type = arg.type;
                if (args.type == undefined) {
                    args.type = null;
                }
            }
            event.args = args;

            if (id < 2 || id > 6) {
                result = this.host.trigger(event);
            }

            return result;
        },


        _handleKeyPress: function (e, key) {
            var specialKey = this._isSpecialKey(key, e);
            return specialKey;
        },


        _insertKey: function (key, e) {
            var selection = this._selection();
            var rootElement = this;

            if (selection.start >= 0 && selection.start < this.items.length) {
                var letter = String.fromCharCode(key);
                if (key >= 65 && key <= 90) {
                    if (!e.shiftKey) {
                        letter = letter.toLowerCase();
                    }
                }
                var selectedTextDeleted = false
                $.each(this.items, function (i, value) {
                    if (i < selection.start) {
                        return;
                    }

                    var item = rootElement.items[i];
                    if (!item.canEdit) {
                        return;
                    }

                    if (rootElement._match(letter, item.regex)) {
                        if (!selectedTextDeleted && selection.length > 0) {
                            for (var j = selection.start; j < selection.end; j++) {
                                if (rootElement.items[j].canEdit) {
                                    rootElement.items[j].character = rootElement.promptChar;
                                }
                            }

                            var text = rootElement._getString();
                            rootElement.maskedValue(text);
                            selectedTextDeleted = true;
                        }

                        item.character = letter;
                        var text = rootElement._getString();
                        rootElement.maskedValue(text);

                        if (selection.start < rootElement.items.length) {
                            rootElement._setSelectionStart(i + 1);
                        }

                        return false;
                    }
                    else return false;
                });
            }
        },


        _deleteSelectedText: function () {
            var selection = this._selection();
            var deleted = false;

            if (selection.start > 0 || selection.length > 0) {
                for (i = selection.start; i < selection.end; i++) {
                    if (i < this.items.length && this.items[i].canEdit && this.items[i].character != this.promptChar) {
                        this.items[i].character = this.promptChar;
                        deleted = true;
                    }
                }

                var text = this._getString();
                this.maskedValue(text);
                return deleted;
            }
        },


        _saveSelectedText: function () {
            var selection = this._selection();
            var text = "";
            if (selection.start > 0 || selection.length > 0) {
                for (i = selection.start; i < selection.end; i++) {
                    if (this.items[i].canEdit) {
                        text += this.items[i].character;
                    }
                }
            }
            if (window.clipboardData) {
                window.clipboardData.setData("Text", text);
            }
            else {
                var copyFrom = $('<textarea style="position: absolute; left: -1000px; top: -1000px;"/>');
                copyFrom.val(text);
                $('body').append(copyFrom);
                copyFrom.select();
                setTimeout(function () {
                    document.designMode = 'off';
                    copyFrom.select();
                    copyFrom.remove();
                }, 100);
            }
            return text;
        },


        _pasteSelectedText: function () {
            var selection = this._selection();
            var text = "";
            var k = 0;
            var newSelection = selection.start;
            var clipboardText = "";
            var me = this;
            var paste = function (clipboardText) {
                if (clipboardText != me.selectedText && clipboardText.length > 0) {
                    me.selectedText = clipboardText;
                    if (me.selectedText == null || me.selectedText == undefined)
                        return;
                }

                if (selection.start >= 0 || selection.length > 0) {
                    for (i = selection.start; i < me.items.length; i++) {
                        if (me.items[i].canEdit) {
                            if (k < me.selectedText.length) {
                                me.items[i].character = me.selectedText[k];
                                k++;
                                newSelection = 1 + i;
                            }
                        }
                    }
                }

                var text = me._getString();
                me.maskedValue(text);

                if (newSelection < me.items.length) {
                    me._setSelectionStart(newSelection);
                }
                else me._setSelectionStart(me.items.length);
            }
            if (window.clipboardData) {
                clipboardText = window.clipboardData.getData("Text");
                paste(clipboardText);
            }
            else {
                var pasteFrom = $('<textarea style="position: absolute; left: -1000px; top: -1000px;"/>');
                $('body').append(pasteFrom);
                pasteFrom.select();
                var that = this;
                setTimeout(function () {
                    var value = pasteFrom.val();
                    paste(value);
                    pasteFrom.remove();
                }, 100);
            }
        },

        _handleKeyDown: function (e, key) {
            var selection = this._selection();
            if (key >= 96 && key <= 105) {
                key = key - 48;
            }

            var ctrlKey = e.ctrlKey || e.metaKey;
            if ((ctrlKey && key == 97 /* firefox */) || (ctrlKey && key == 65) /* opera */) {
                return true;
            } // allow Ctrl+X (cut)
            if ((ctrlKey && key == 120 /* firefox */) || (ctrlKey && key == 88) /* opera */) {
                this.selectedText = this._saveSelectedText(e);
                this._deleteSelectedText(e);
                if ($.jqx.browser.msie)
                    return false;
                return true;
            }
            // allow Ctrl+C (copy)
            if ((ctrlKey && key == 99 /* firefox */) || (ctrlKey && key == 67) /* opera */) {
                this.selectedText = this._saveSelectedText(e);
                if ($.jqx.browser.msie)
                    return false;
                return true;
            }
            // allow Ctrl+Z (undo)
            if ((ctrlKey && key == 122 /* firefox */) || (ctrlKey && key == 90) /* opera */) return false;
            // allow or deny Ctrl+V (paste), Shift+Ins
            if ((ctrlKey && key == 118 /* firefox */) || (ctrlKey && key == 86) /* opera */
            || (e.shiftKey && key == 45)) {
                this._pasteSelectedText();
                if ($.jqx.browser.msie)
                    return false;
                return true;
            }
            if (selection.start >= 0 && selection.start < this.items.length) {
                var letter = String.fromCharCode(key);
                var item = this.items[selection.start];
            }

            // handle backspace.
            if (key == 8) {
                if (selection.length == 0) {
                    for (i = this.items.length - 1; i >= 0; i--) {
                        if (this.items[i].canEdit && i < selection.end && this.items[i].character != this.promptChar) {
                            this._setSelection(i, i + 1);
                            break;
                        }
                    }
                }

                selection = this._selection();
                var deletedText = this._deleteSelectedText();

                if (selection.start > 0 || selection.length > 0) {
                    if (selection.start <= this.items.length) {
                        if (deletedText) {
                            this._setSelectionStart(selection.start);
                        }
                        else this._setSelectionStart(selection.start - 1);
                    }
                }
                return false;
            }

            if (key == 190) {
                var start = selection.start;
                for (var i = start; i < this.items.length; i++) {
                    if (this.items[i].character == '.') {
                        this._setSelectionStart(i + 1);
                        break;
                    }
                }
            }
            if (key == 191) {
                var start = selection.start;
                for (var i = start; i < this.items.length; i++) {
                    if (this.items[i].character == '/') {
                        this._setSelectionStart(i + 1);
                        break;
                    }
                }
            }
            if (key == 189) {
                var start = selection.start;
                for (var i = start; i < this.items.length; i++) {
                    if (this.items[i].character == '-') {
                        this._setSelectionStart(i + 1);
                        break;
                    }
                }
            }
            // handle del.
            if (key == 46) {
                if (selection.length == 0) {
                    for (var i = 0; i < this.items.length; i++) {
                        if (this.items[i].canEdit && i >= selection.start && this.items[i].character != this.promptChar) {
                            this._setSelection(i, i + 1);
                            break;
                        }
                    }
                }

                var oldSelection = selection;
                selection = this._selection();
                var deleted = this._deleteSelectedText();
                if (selection.start >= 0 || selection.length >= 0) {
                    if (selection.start < this.items.length) {
                        if (selection.length <= 1) {
                            if (oldSelection.end != selection.end) {
                                this._setSelectionStart(selection.end);
                            }
                            else this._setSelectionStart(selection.end + 1);
                        }
                        else this._setSelectionStart(selection.start)
                    }
                }
                return false;
            }

            this._insertKey(key, e);

            var specialKey = this._isSpecialKey(key, e);

            return specialKey;
        },

        _isSpecialKey: function (key, event) {
            if (key == 189 /* dot */ ||
			key == 9 /* tab */ ||
			key == 13 /* enter */ ||
			key == 35 /* end */ ||
			key == 36 /* home */ ||
			key == 37 /* left */ ||
			key == 39 /* right */ ||
        	key == 46 /* del */
		    ) {
                return true;
            }
            if ((key === 16 && event.shiftKey) || event.ctrlKey || event.metaKey) {
                return true;
            }
            return false;
        },

        _selection: function () {
            if ('selectionStart' in this.maskbox[0]) {
                var e = this.maskbox[0];
                var selectionLength = e.selectionEnd - e.selectionStart;
                return { start: e.selectionStart, end: e.selectionEnd, length: selectionLength, text: e.value };
            }
            else {
                var r = document.selection.createRange();
                if (r == null) {
                    return { start: 0, end: e.value.length, length: 0 }
                }

                var re = this.maskbox[0].createTextRange();
                var rc = re.duplicate();
                re.moveToBookmark(r.getBookmark());
                rc.setEndPoint('EndToStart', re);
                var selectionLength = r.text.length;

                return { start: rc.text.length, end: rc.text.length + r.text.length, length: selectionLength, text: r.text };
            }
        },

        _setSelection: function (start, end) {
            if ('selectionStart' in this.maskbox[0]) {
                this.maskbox[0].focus();
                this.maskbox[0].setSelectionRange(start, end);
            }
            else {
                var range = this.maskbox[0].createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            }
        },

        _setSelectionStart: function (start) {
            this._setSelection(start, start);
        },

        refresh: function (internalRefresh) {
            if (!internalRefresh) {
                this._render();
            }
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.refresh();
        },

        _render: function () {
            var leftBorder = parseInt(this.host.css("border-left-width"));
            var rightBorder = parseInt(this.host.css("border-left-width"));
            var topBorder = parseInt(this.host.css("border-left-width"));
            var bottomBorder = parseInt(this.host.css("border-left-width"));

            var height = parseInt(this.host.css("height")) - topBorder - bottomBorder;
            var width = parseInt(this.host.css("width")) - leftBorder - rightBorder;
            if (this.width != null && this.width.toString().indexOf("px") != -1) {
                width = this.width;
            }
            else
                if (this.width != undefined && !isNaN(this.width)) {
                    width = this.width;
                };

            if (this.height != null && this.height.toString().indexOf("px") != -1) {
                height = this.height;
            }
            else if (this.height != undefined && !isNaN(this.height)) {
                height = this.height;
            };

            width = parseInt(width);
            height = parseInt(height);

            if (this.maskbox[0] != this.element) {
                this.maskbox.css({
                    "border-left-width": 0,
                    "border-right-width": 0,
                    "border-bottom-width": 0,
                    "border-top-width": 0
                });
            }

            this.maskbox.css("text-align", this.textAlign);
            var fontSize = this.maskbox.css("font-size");

            if (!isNaN(height)) {
                this.maskbox.css('height', parseInt(fontSize) + 4 + 'px');
            }

            if (!isNaN(width)) {
                this.maskbox.css('width', width - 2);
            }

            var top = parseInt(height) - 2 * parseInt(topBorder) - 2 * parseInt(bottomBorder) - parseInt(fontSize);
            if (isNaN(top)) top = 0;

            if (!isNaN(height)) {
                this.host.height(height);
            }
            if (!isNaN(width)) {
                this.host.width(width);
            }
            if (this.maskbox[0] != this.element) {

                var topPadding = top / 2;

                // fix for MSIE 6 and 7. These browsers double the top padding for some reason...
                if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                    topPadding = top / 4;
                }

                this.maskbox.css("padding-right", '0px');
                this.maskbox.css("padding-left", '0px');
                this.maskbox.css("padding-top", topPadding);
                this.maskbox.css("padding-bottom", top / 2);
            }
            this.maskbox[0].value = this._getString();

            if (this.width) {
                if (this.width.toString().indexOf('%') >= 0) {
                    this.element.style.width = this.width;
                }
                if (this.height.toString().indexOf('%') >= 0) {
                    this.element.style.height = this.height;
                }
            }
        },

        destroy: function () {
            this.host.remove();
        },

        // gets or sets the input's value.
        maskedValue: function (newValue) {
            if (newValue === undefined) {
                return this._value();
            }

            this.value = newValue;
            this._refreshValue();

            if (this.oldValue !== newValue) {
                this._raiseEvent(1, newValue);
                this.oldValue = newValue;
                this._raiseEvent(0, newValue);
            }

            return this;
        },

        // sets the input's value.
        _value: function () {
            var value = this.maskbox.val();
            return value;
        },

        // sets a property.
        propertyChangedHandler: function (object, key, oldValue, value) {
            if (this.isInitialized == undefined || this.isInitialized == false)
                return;

            if (key == "rtl") {
                if (object.rtl) {
                    object.maskbox.addClass(object.toThemeProperty('jqx-rtl'));
                }
                else {
                    object.maskbox.removeClass(object.toThemeProperty('jqx-rtl'));
                }
            }

            if (key === "value") {
                if (value == undefined || value == null) value = '';
                if (value === "") {
                    this.clear();
                }
                else {
                    value = value.toString();
                    this.inputValue(value);
                }
               object._raiseEvent(7, value);
            }

            if (key === 'theme') {
                $.jqx.utilities.setTheme(oldValue, value, this.host);
            }

            if (key == 'disabled') {
                if (value) {
                    object.maskbox.addClass(object.toThemeProperty('jqx-input-disabled'));
                    object.host.addClass(object.toThemeProperty('jqx-fill-state-disabled'));
                    object.maskbox.attr("disabled", true);
                }
                else {
                    object.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
                    object.host.removeClass(this.toThemeProperty('jqx-input-disabled'));
                    object.maskbox.attr("disabled", false);
                }
                $.jqx.aria(object, "aria-disabled", value);
            }

            if (key == "readOnly") {
                this.readOnly = value;
            }

            if (key == "promptChar") {
                for (i = 0; i < object.items.length; i++) {
                    if (object.items[i].character == object.promptChar) {
                        object.items[i].character = value;
                        object.items[i].defaultCharacter = value;
                    }
                }

                object.promptChar = value;
            }

            if (key == "textAlign") {
                object.maskbox.css("text-align", value);
                object.textAlign = value;
            }

            if (key == "mask") {
                object.mask = value;
                object.items = new Array();
                object._initializeLiterals();
                object.value = object._getString();
                object._refreshValue();
            }
            if (key == "width") {
                object.width = value;
                object._render();
            }
            else if (key == "height") {
                object.height = value;
                object._render();
            }
        },

        // gets the input's value.
        _value: function () {
            var val = this.value;
            return val;
        },

        _getEditStringLength: function () {
            var value = '';
            for (i = 0; i < this.items.length; i++) {
                if (this.items[i].canEdit) {
                    value += this.items[i].character;
                }
            }

            return value.length;
        },

        _getEditValue: function () {
            var value = '';
            for (i = 0; i < this.items.length; i++) {
                if (this.items[i].canEdit && this.items[i].character != this.promptChar) {
                    value += this.items[i].character;
                }
            }

            return value;
        },

        parseValue: function (value) {
            if (value == undefined || value == null)
                return null;

            var input = value.toString();
            var newValue = '';
            var x = 0;
            for (m = 0; m < input.length; m++) {
                var data = input.substring(m, m + 1);

                for (i = x; i < this.items.length; i++) {
                    if (this.items[i].canEdit && this._match(data, this.items[i].regex)) {
                        newValue += data;
                        x = i;
                        break;
                    }
                }
            }

            return newValue;
        },

        clear: function () {
            this.clearValue();
        },

        // deprecated. to be removed in the next version.
        clearValue: function () {
            this.inputValue("", true);
        },

        val: function (data) {
            if (data != undefined && typeof data != 'object') {
                if (typeof data === 'number' && isFinite(data))
                    data = data.toString();

                this.maskedValue(data);
            }

            return this.maskbox[0].value;
        },

        // gets or sets the editable input value.
        inputValue: function (data, fullRefresh) {
            if (data == undefined || data == null) {
                var value = "";
                for (var i = 0; i < this.items.length; i++) {
                    if (this.items[i].canEdit) {
                        value += this.items[i].character;
                    }
                }

                return value;
            }
            else {
                var k = 0;
                data = data.toString();

                for (var i = 0; i < this.items.length; i++) {
                    if (this.items[i].canEdit) {
                        if (this._match(data.substring(k, k + 1), this.items[i].regex)) {
                            this.items[i].character = data.substring(k, k + 1);
                            k++;
                        }
                        else if (fullRefresh) {
                            this.items[i].character = this.promptChar;
                            k++;
                        }
                    }
                }

                var newString = this._getString();
                this.maskedValue(newString);

                return this.inputValue();
            }
        },

        // applies the value to the input.
        _refreshValue: function () {
            var value = this.maskedValue();
            var k = 0;
            for (var i = 0; i < this.items.length; i++) {
                if (value.length > k) {
                    if (this.items[i].canEdit && this.items[i].character != value[k]) {
                        if ((this._match(value[k], this.items[i].regex) || value[k] == this.promptChar ) && value[k].length == 1) {
                            this.items[i].character = value[k];
                        }
                    }
                    k++;
                }
            }

            this.value = this._getString();
            value = this.value;
            this.maskbox[0].value = value;
            $.jqx.aria(this, "aria-valuenow", value);
        }
    });
})(jqxBaseFramework);
