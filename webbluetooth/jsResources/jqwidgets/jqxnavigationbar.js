/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

/*
* Depends:
*   jqxcore.js
*/

(function ($) {

    $.jqx.jqxWidget("jqxNavigationBar", "", {});

    $.extend($.jqx._jqxNavigationBar.prototype, {

        defineInstance: function () {
            var settings = {
                //// properties common for both jqxExpander and jqxNavigationBar
                width: 'auto',
                height: 'auto',
                expandAnimationDuration: 250,
                collapseAnimationDuration: 250,
                animationType: 'slide', // possible values: 'slide', 'fade', 'none'
                toggleMode: 'click', //possible values: 'click', 'dblclick', 'none'
                showArrow: true, // possible values: true, false
                arrowPosition: 'right', // possible values: 'left', 'right'
                disabled: false, // possible values: true, false
                initContent: null, // callback function
                rtl: false, // possible values: true, false
                easing: 'easeInOutSine', // possible values: easeOutBack, easeInQuad, easeInOutCirc, easeInOutSine, easeInCubic, easeOutCubic, easeInOutCubic, easeInSine, easeOutSine, easeInOutSine
                //// jqxNavigationBar-specific properties
                expandMode: 'singleFitHeight', // possible values: 'single', 'singleFitHeight', 'multiple', 'toggle', 'none'
                expandedIndexes: [], // possible values: empty array (no expanded items) or an array of positive integers
                _expandModes: ['singleFitHeight', 'single', 'multiple', 'toggle', 'none'],
                aria:
                {
                    "aria-disabled": { name: "disabled", type: "boolean" }
                },

                //// events
                events: ['expandingItem', 'expandedItem', 'collapsingItem', 'collapsedItem']
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            // renders the widget
            $.jqx.aria(this);
            this.render();
        },

        //// methods

        val: function (value) {
            if (arguments.length == 0 || typeof (value) == "object") {
                return this.expandedIndexes;
            }

            if (typeof value == "string") {
                this.expandedIndexes.push(parseInt(value));
                this._applyExpandedIndexes();
            }
            else {
                if ($.isArray(value)) {
                    this.expandedIndexes = value;
                }
                else {
                    this.expandedIndexes = new Array();
                    this.expandedIndexes.push(value);
                }
                this._applyExpandedIndexes();
            }
            return this.expandedIndexes;
        },

        //// public methods

        // expands the content
        expandAt: function (index) {
            var me = this;
            if (this.expandMode == 'single' || this.expandMode == 'singleFitHeight' || this.expandMode == 'toggle') {
                $.each(this.items, function (itemIndex, value) {
                    if (itemIndex != index) {
                        me.collapseAt(itemIndex);
                    };
                });
            };

            var selectedItem = this.items[index];
            if (selectedItem.disabled == false && selectedItem.expanded == false && selectedItem._expandChecker == 1) {
                var me = this;
                selectedItem._expandChecker = 0;
                this._raiseEvent('0', { item: index });
                selectedItem._header.removeClass(this.toThemeProperty("jqx-fill-state-normal"));
                selectedItem._header.addClass(this.toThemeProperty("jqx-fill-state-pressed"));
                selectedItem._header.addClass(this.toThemeProperty("jqx-expander-header-expanded"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-hover"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-hover"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-selected"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-top"));
                selectedItem._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up"));
                selectedItem._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up-selected"));
                selectedItem._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                selectedItem._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-expanded"));

                if (this.heightFlag == false) {
                    this.host.css({ "overflow-x": "hidden", "overflow-y": "hidden" });
                };

                this.eCFlag = 1;

                switch (this.animationType) {
                    case 'slide':
                        var content = selectedItem._content;
                        var height = content.height();
                        var showProps = {};
                        showProps.height = showProps.paddingTop = showProps.paddingBottom =
                            showProps.borderTopWidth = showProps.borderBottomWidth = "show";
                        var adjust = 0;
                        var total = content.outerHeight();

                        if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                            var showProps = {};
                            showProps.height = showProps.paddingTop = showProps.paddingBottom =
                                "show";
                        }

                        content.animate(showProps,
                            {
                                duration: this.expandAnimationDuration,
                                easing: this.easing,
                                step: function (now, fx) {
                                    fx.now = Math.round(now);
                                    if (fx.prop !== "height") {
                                        adjust += fx.now;
                                    } else {
                                        if (me._collapseContent) {
                                            fx.now = Math.round(total - me._collapseContent.outerHeight() - adjust);
                                            adjust = 0;
                                        }
                                        else {
                                            fx.now = Math.round(now);
                                        }
                                    }
                                },
                                complete: function () {
                                    selectedItem.expanded = true;
                                    $.jqx.aria(selectedItem._header, "aria-expanded", true);
                                    $.jqx.aria(selectedItem._content, "aria-hidden", false);

                                    me._updateExpandedIndexes();
                                    me._raiseEvent('1', { item: index });
                                    me._checkHeight();
                                    if (me.heightFlag == true) {
                                        me.host.css({ "overflow-x": "hidden", "overflow-y": "auto" });
                                    };
                                    if (me.initContent && selectedItem._initialized == false) {
                                        me.initContent(index);
                                        selectedItem._initialized = true;
                                    };
                                    me.eCFlag = 0;
                                }
                            });
                        break;
                    case 'fade':
                        setTimeout(function () {
                            selectedItem._content.fadeIn(this.expandAnimationDuration, function () {
                                selectedItem.expanded = true;
                                $.jqx.aria(selectedItem._header, "aria-expanded", true);
                                $.jqx.aria(selectedItem._content, "aria-hidden", false);
                                me._updateExpandedIndexes();
                                me._raiseEvent('1', { item: index });
                                me._checkHeight();
                                if (me.heightFlag == true) {
                                    me.host.css({ "overflow-x": "hidden", "overflow-y": "auto" });
                                };
                                if (me.initContent && selectedItem._initialized == false) {
                                    me.initContent(index);
                                    selectedItem._initialized = true;
                                };
                                me.eCFlag = 0;
                            });
                        }, this.collapseAnimationDuration);
                        break;
                    case 'none':
                        selectedItem._content.css("display", "inherit");
                        selectedItem.expanded = true;
                        $.jqx.aria(selectedItem._header, "aria-expanded", true);
                        $.jqx.aria(selectedItem._content, "aria-hidden", false);
                        this._updateExpandedIndexes();
                        this._raiseEvent('1', { item: index });
                        this._checkHeight();
                        if (this.heightFlag == true) {
                            this.host.css({ "overflow-x": "hidden", "overflow-y": "auto" });
                        };
                        if (this.initContent && selectedItem._initialized == false) {
                            this.initContent(index);
                            selectedItem._initialized = true;
                        };
                        this.eCFlag = 0;
                        break;
                };
            };
        },

        // collapses the content
        collapseAt: function (index) {
            var selectedItem = this.items[index];
            if (selectedItem.disabled == false && selectedItem.expanded == true && selectedItem._expandChecker == 0) {
                var me = this;
                selectedItem._expandChecker = 1;
                this._raiseEvent('2', { item: index });
                selectedItem._header.removeClass(this.toThemeProperty("jqx-fill-state-pressed"));
                selectedItem._header.removeClass(this.toThemeProperty("jqx-expander-header-expanded"));
                selectedItem._header.addClass(this.toThemeProperty("jqx-fill-state-normal"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-selected"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-selected"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                selectedItem._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-expanded"));

                selectedItem._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down"));
                selectedItem._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top"));

                if (this.heightFlag == false) {
                    this.host.css({ "overflow-x": "hidden", "overflow-y": "hidden" });
                };

                this.eCFlag = 1;
                this._collapseContent = selectedItem._content;

                switch (this.animationType) {
                    case 'slide':
                        var hideProps = {};
                        hideProps.height = hideProps.paddingTop = hideProps.paddingBottom =
                        hideProps.borderTopWidth = hideProps.borderBottomWidth = "hide";

                        if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                            var hideProps = {};
                            hideProps.height = hideProps.paddingTop = hideProps.paddingBottom =
                            "hide";
                        }

                        var content = selectedItem._content;
                        content.animate(hideProps, {
                            duration: this.collapseAnimationDuration,
                            step: function (now, fx) {
                                fx.now = Math.round(now);
                            },
                            easing: this.easing,
                            complete: function () {
                                selectedItem.expanded = false;
                                content.hide();

                                $.jqx.aria(selectedItem._header, "aria-expanded", false);
                                $.jqx.aria(selectedItem._content, "aria-hidden", true);

                                me._updateExpandedIndexes();
                                me._raiseEvent('3', { item: index });
                                me._checkHeight();
                                if (me.heightFlag == true) {
                                    me.host.css({ "overflow-x": "hidden", "overflow-y": "auto" });
                                };
                                me.eCFlag = 0;
                                me._collapseContent = null;
                            }
                        });
                        break;
                    case 'fade':
                        selectedItem._content.fadeOut(this.collapseAnimationDuration, function () {
                            selectedItem.expanded = false;
                            $.jqx.aria(selectedItem._header, "aria-expanded", false);
                            $.jqx.aria(selectedItem._content, "aria-hidden", true);
                            me._updateExpandedIndexes();
                            me._raiseEvent('3', { item: index });
                            me._checkHeight();
                            if (me.heightFlag == true) {
                                me.host.css({ "overflow-x": "hidden", "overflow-y": "auto" });
                            };
                            me.eCFlag = 0;
                        });
                        break;
                    case 'none':
                        selectedItem._content.css("display", "none");
                        selectedItem.expanded = false;
                        $.jqx.aria(selectedItem._header, "aria-expanded", false);
                        $.jqx.aria(selectedItem._content, "aria-hidden", true);

                        this._updateExpandedIndexes();
                        this._raiseEvent('3', { item: index });
                        this._checkHeight();
                        if (this.heightFlag == true) {
                            this.host.css({ "overflow-x": "hidden", "overflow-y": "auto" });
                        };
                        this.eCFlag = 0;
                        break;
                };
            };
        },

        // sets the header content of a specific item
        setHeaderContentAt: function (index, headerContent) {
            this.items[index]._header_text.html(headerContent);
        },

        // gets the header content of a specific item
        getHeaderContentAt: function (index) {
            return this.items[index]._header_text.html();
        },

        // sets the content of a specific item
        setContentAt: function (index, content) {
            this.items[index]._content.html(content);
            this._checkContent(index);
        },

        // gets the content of a specific item
        getContentAt: function (index) {
            return this.items[index]._content.html();
        },

        // shows the arrow at a specific position
        showArrowAt: function (index) {
            this.items[index]._arrow.css("display", "block");
        },

        // hides the arrow at a specific position
        hideArrowAt: function (index) {
            this.items[index]._arrow.css("display", "none");
        },

        // enables the widget
        enable: function () {
            this.disabled = false;
            $.each(this.items, function (index, value) {
                this.disabled = false;
            });
            this._enabledDisabledCheck();
            this.refresh();
            $.jqx.aria(this, "aria-disabled", false);
        },

        // disables the widget
        disable: function () {
            this.disabled = true;
            $.each(this.items, function (index, value) {
                this.disabled = true;
            });
            this._enabledDisabledCheck();
            this.refresh();
            $.jqx.aria(this, "aria-disabled", true);
        },

        // enables a specific item
        enableAt: function (index) {
            this.items[index].disabled = false;
            this.refresh();
        },

        // disables a specific item
        disableAt: function (index) {
            this.items[index].disabled = true;
            this.refresh();
        },

        // refreshes the widget
        invalidate: function () {
            this.refresh();
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh == true) {
                return;
            };

            this._removeHandlers();
            if (this.showArrow == true) {
                $.each(this.items, function (index, value) {
                    var item = this;
                    item._arrow.css("display", "block");
                });
            } else {
                $.each(this.items, function (index, value) {
                    var item = this;
                    item._arrow.css("display", "none");
                });
            };
            this._updateExpandedIndexes();
            this._setTheme();
            this._setSize();
            this._toggle();
            this._keyBoard();
        },

        // renders the widget
        render: function () {
            this.widgetID = this.element.id;
            var me = this;
            if (this._expandModes.indexOf(this.expandMode) == -1) {
                this.expandMode = "singleFitHeight";
            }

            $.jqx.utilities.resize(this.host, function () {
                me._setSize();
            });

            this.host.attr("role", "tablist");
            // creates an array containing all items.
            if (this.items) {
                this._removeHandlers();
                $.each(this.items, function () {
                    this._header.removeClass();
                    this._header.attr("tabindex", null);
                    this._content.attr("tabindex", null);
                    this._header[0].className = "";
                    this._header_text.removeClass();
                    this._header_text[0].className = "";
                    this._header.css("margin-top", 0);
                    this._header[0].innerHTML = this._header_text[0].innerHTML;
                });
            }
            this.items = new Array();

            var childrenCount = this.host.children().length;

            // checks whether the HTML structure of the widget is valid and alerts the user if not
            var childrenCountExceptionMessage = "Invalid jqxNavigationBar structure. Please add an even number of child div elements that will represent each item's header and content.";
            try {
                if (childrenCount % 2 != 0) {
                    throw childrenCountExceptionMessage;
                };
            } catch (exception) {
                alert(exception);
            };

            var childrenTypeExceptionMessage = "Invalid jqxNavigationBar structure. Please make sure all the children elements of the navigationbar are divs.";
            try {
                var children = this.host.children();
                for (var i = 0; i < childrenCount; i++) {
                    if (children[i].tagName.toLowerCase() != "div") {
                        throw childrenTypeExceptionMessage;
                    };
                };
            } catch (exception) {
                alert(exception);
            };

            // selects each initial header and creates a header wrapper
            var _header_temp;
            for (var item = 0; item < childrenCount; item += 2) {
                _header_temp = this.host.children("div:eq(" + item + ")");
                _header_temp.wrap("<div></div>");
            };

            // populates the items array
            var i = 0;
            var k;
            for (var j = 0; j < childrenCount / 2; j++) {
                k = i + 1;
                this.items[j] = new Object();
                this.items[j]._header = this.host.children("div:eq(" + i + ")");
                this.items[j]._header.attr("role", "tab")

                this.items[j]._content = this.host.children("div:eq(" + k + ")");
                this.items[j]._content.attr("role", "tabpanel");
                i += 2;
            };

            // sets which items are expanded
            var expandedIndexesLength = this.expandedIndexes.length;
            $.each(this.items, function (index, value) {
                this.expandedFlag = false;
                this.focusedH = false;
                this.focusedC = false;
            });
            if (this.items && this.items.length == 0) return;
            if (this.expandMode == "single" || this.expandMode == "singleFitHeight" || this.expandMode == "toggle" || this.expandMode == "none") {
                $.each(this.items, function (index, value) {
                    var item = this;
                    item.expanded = false;
                });
                if (expandedIndexesLength != 0) {
                    this.items[this.expandedIndexes[0]].expanded = true;
                } else if (expandedIndexesLength == 0 && (this.expandMode == "single" || this.expandMode == "singleFitHeight")) {
                    this.items[0].expanded = true;
                };
            } else if (this.expandMode == "multiple") {
                if (expandedIndexesLength != 0) {
                    $.each(this.items, function (index, value) {
                        var item = this;
                        for (var i = 0; i < expandedIndexesLength; i++) {
                            if (me.expandedIndexes[i] == index) {
                                item.expanded = true;
                                break;
                            } else {
                                item.expanded = false;
                            };
                        };
                    });
                } else {
                    $.each(this.items, function (index, value) {
                        var item = this;
                        item.expanded = false;
                    });
                };
            } else if (this.expandMode == "none") {
                $.each(this.items, function (index, value) {
                    var item = this;
                    item.expanded = false;
                });
            };

            this._enabledDisabledCheck();

            $.each(this.items, function (index, value) {
                var item = this;
                // defines the header text section
                item._header_text = item._header.children("div:eq(0)");
                if (!me.rtl) {
                    item._header_text.addClass(me.toThemeProperty('jqx-expander-header-content'));
                }
                else {
                    item._header_text.addClass(me.toThemeProperty('jqx-expander-header-content-rtl'));
                }

                // appends an arrow to the header
                item._header.append("<div></div>");
                item._arrow = item._header.children("div:eq(1)");
                if (me.showArrow == true) {
                    item._arrow.css("display", "block");
                } else {
                    item._arrow.css("display", "none");
                };
            });

            // checks if content is expanded initially
            $.each(this.items, function (index, value) {
                var item = this;
                if (item.expanded == true) {
                    item._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-up"));
                    item._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-up-selected"));
                    item._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-bottom"));
                    item._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-expanded"));
                    if (me.initContent) {
                        setTimeout(function () {
                            me.initContent(index);
                        }
                        , 10);
                    };
                    item._initialized = true;
                    item._expandChecker = 0;
                    $.jqx.aria(item._header, "aria-expanded", true);
                    $.jqx.aria(item._content, "aria-hidden", false);
                } else if (item.expanded == false) {
                    item._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-down"));
                    item._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-top"));
                    item._initialized = false;
                    item._expandChecker = 1;
                    item._content.css("display", "none");
                    $.jqx.aria(item._header, "aria-expanded", false);
                    $.jqx.aria(item._content, "aria-hidden", true);
                };
            });

            // sets the tabindex attribute of headers and content if it is not already set
            this.tI = 0;
            $.each(this.items, function (index, value) {
                var item = this;
                if (item._header.attr("tabindex") == undefined) {
                    me.tI++;
                    item._header.attr("tabindex", me.tI);
                };
                if (item._content.attr("tabindex") == undefined) {
                    me.tI++;
                    item._content.attr("tabindex", me.tI);
                };
            });

            // sets the expander's theme and classes
            this._setTheme();

            // checks if the content is empty
            $.each(this.items, function (index, value) {
                var item = this;
                me._checkContent(index);
            });

            // sets the width and height of the widget
            this._setSize();

            // toggles the widget
            this._toggle();

            // adds keyboard interaction
            this._keyBoard();
        },

        // inserts an item at a specific index
        insert: function (index, header, content) {
            var newItemHTML = "<div>" + header + "</div><div>" + content + "</div>";
            if (index != -1) {
                $(newItemHTML).insertBefore(this.items[index]._header);
            } else {
                var lastIndex = this.items.length - 1;
                $(newItemHTML).insertAfter(this.items[lastIndex]._content);
            };

            this.render();
        },

        // inserts an item at the bottom of the navigationbar
        add: function (header, content) {
            this.insert(-1, header, content);
        },

        // updates the header and content of an item at a specific index
        update: function (index, header, content) {
            this.setHeaderContentAt(index, header);
            this.setContentAt(index, content);
        },

        // removes an item at a specific index
        remove: function (index) {
            if (isNaN(index)) {
                index = this.items.length - 1;
            };
            if (!this.items[index]) {
                return;
            }

            this.items[index]._header.remove();
            this.items[index]._content.remove();
            this.items.splice(index, 1);
            var expandedIndex = this.expandedIndexes.indexOf(index);
            if (expandedIndex > -1) {
                this.expandedIndexes.splice(expandedIndex, 1);
            }
            this.render();
        },

        // removes the widget
        destroy: function () {
            this._removeHandlers();
            this.host.remove();
        },

        // focuses on the widget
        focus: function () {
            try {
                $.each(this.items, function (index, value) {
                    var item = this;
                    if (item.disabled == false) {
                        item._header.focus();
                        return false;
                    };
                });
            }
            catch (error) {
            }
        },

        //// private methods

        _applyExpandedIndexes: function () {
            var me = this;
            var expandedIndexesCount = this.expandedIndexes.length;
            for (var i = 0; i < expandedIndexesCount; i++) {
                var eIndex = me.expandedIndexes[i];
                $.each(this.items, function (index, value) {
                    var item = this;
                    if (index == eIndex) {
                        item.expandedFlag = true;
                        if (item.expanded == false) {
                            me.expandAt(index);
                        };
                        if (me.expandMode == "single" || me.expandMode == "singleFitHeight" || me.expandMode == "toggle" || me.expandMode == "none") {
                            return false;
                        };
                    };
                });
                $.each(this.items, function (index, value) {
                    var item = this;
                    if (index != eIndex && item.expandedFlag == false) {
                        me.collapseAt(index);
                    };
                });
            };
            $.each(this.items, function (index, value) {
                this.expandedFlag = false;
            });
        },

        //// private methods
        propertiesChangedHandler: function (object, key, value)
        {
            if (value.width && value.height && Object.keys(value).length == 2)
            {
                object._setSize();
            }
        },

        // called when a property is changed
        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (object.batchUpdate && object.batchUpdate.width && object.batchUpdate.height && Object.keys(object.batchUpdate).length == 2)
            {
                return;
            }

            if (key == "width" || key == "height")
            {
                object._setSize();
                return;
            }

            var me = object;
            var newvalue = value;
            if (key == "disabled") {
                object._enabledDisabledCheck();
            } else if (key == "expandedIndexes") {
                object._applyExpandedIndexes();
            } else {
                object.refresh();
            };
        },

        // raises an event
        _raiseEvent: function (id, args) {
            var evt = this.events[id];
            var event = new $.Event(evt);
            event.owner = this;
            event.args = args;
            event.item = event.args.item;

            try {
                var result = this.host.trigger(event);
            }
            catch (error) {
            }

            return result;
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this._setSize();
        },

        // sets the width and height of the widget and the position of the arrow
        _setSize: function () {
            var me = this;
            this.headersHeight = 0;

            var paddingLeft = this.items && this.items.length > 0 ? parseInt(this.items[0]._header.css('padding-left')) : 0;
            var paddingRight = this.items && this.items.length > 0 ? parseInt(this.items[0]._header.css('padding-right')) : 0;
            var borderOffset = 2;
            var totalOffset = paddingLeft + paddingRight + borderOffset;
            if (isNaN(totalOffset)) totalOffset = 12;

            // sets the size of the widget
            if (this.width == "auto") {
                this.host.width(this.width);
            } else {
                if (this.width != null && this.width.toString().indexOf('%') != -1) {
                    this.host.width(this.width);
                }
                else {
                    this.host.width(parseInt(this.width) + totalOffset);
                };
            }
            this.host.height(this.height);

            // sets the size of each item
            $.each(this.items, function (index, value) {
                var item = this;

                var arrowPosition = me.arrowPosition;
                if (me.rtl) {
                    switch (arrowPosition) {
                        case 'left':
                            arrowPosition = 'right';
                            break;
                        case 'right':
                            arrowPosition = 'left';
                            break;
                    }
                }

                // sets the arrow position
                if (arrowPosition == "right") {
                    item._header_text.css({ "float": "left", "margin-left": "0px" });
                    item._arrow.css({ "float": "right", "position": "relative" });
                } else if (arrowPosition == "left") {
                    if (me.width == "auto") {
                        item._header_text.css({ "float": "left", "margin-left": "17px" });
                        item._arrow.css({ "float": "left", "position": "absolute" });
                    } else {
                        item._header_text.css({ "float": "right", "margin-left": "0px" });
                        item._arrow.css({ "float": "left", "position": "relative" });
                    };
                };

                // sets the height of the header
                item._header.height("auto");
                item._header_text.css("min-height", item._arrow.height());
                me.headersHeight += item._header.outerHeight();

                item._arrow.css("margin-top", item._header_text.height() / 2 - item._arrow.height() / 2);
            });

            // sets the height of the content
            $.each(this.items, function (index, value) {
                var item = this;

                if (me.height != "auto") {
                    if (me.expandMode == "single" || me.expandMode == "toggle" || me.expandMode == "multiple") {
                        me.host.css({ "overflow-x": "hidden", "overflow-y": "auto" });
                    } else if (me.expandMode == "singleFitHeight") {
                        //      item._content.css("overflow", "auto");

                        var padding = parseInt(item._content.css("padding-top")) + parseInt(item._content.css("padding-bottom"));
                        if (me.height && me.height.toString().indexOf("%") >= 0) {
                            item._content.height(me.host.height() - me.headersHeight - padding + 2);
                        }
                        else {
                            item._content.height(me.host.height() - me.headersHeight - padding);
                        }
                    };
                };
            });

            me._checkHeight();
        },

        // toggles the expander
        _toggle: function () {
            var me = this;
            if (this._isTouchDevice == false) {
                switch (this.toggleMode) {
                    case 'click':
                        $.each(this.items, function (index, value) {
                            var item = this;
                            if (item.disabled == false) {
                                me.addHandler(item._header, 'click.navigationbar' + me.widgetID, function () {
                                    me.focusedH = true;
                                    me._animate(index);
                                });
                            };
                        });
                        break;
                    case 'dblclick':
                        $.each(this.items, function (index, value) {
                            var item = this;
                            if (item.disabled == false) {
                                me.addHandler(item._header, 'dblclick.navigationbar' + me.widgetID, function () {
                                    me.focusedH = true;
                                    me._animate(index);
                                });
                            };
                        });
                        break;
                    case 'none':
                        break;
                };
            } else {
                if (this.toggleMode != "none") {
                    $.each(this.items, function (index, value) {
                        var item = this;
                        if (item.disabled == false) {
                            me.addHandler(item._header, $.jqx.mobile.getTouchEventName('touchstart') + "." + me.widgetID, function () {
                                me._animate(index);
                            });
                        };
                    });
                } else {
                    return;
                };
            };
        },

        // calls for either expand() or collapse()
        _animate: function (index, keyboard) {
            var me = this;
            this.eCFlag;
            var selectedItem = this.items[index];
            if (this.expandMode != 'none' && this.eCFlag != 1) {
                if (this.items[index].expanded == true) {
                    if (this.expandMode == 'multiple' || this.expandMode == 'toggle') {
                        this.collapseAt(index);
                    };
                } else {
                    this.expandAt(index);
                };
                if (!me._isTouchDevice) {
                    if (keyboard != true) {
                        selectedItem._header.addClass(this.toThemeProperty("jqx-fill-state-hover"));
                        selectedItem._header.addClass(this.toThemeProperty("jqx-expander-header-hover"));
                        selectedItem._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top-hover"));
                        selectedItem._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-down-hover"));
                    }
                    else {
                        selectedItem._header.removeClass(this.toThemeProperty("jqx-fill-state-hover"));
                        selectedItem._header.removeClass(this.toThemeProperty("jqx-expander-header-hover"));
                        selectedItem._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-top-hover"));
                        selectedItem._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-down-hover"));
                    }
                }
            };
        },

        // removes event handlers
        _removeHandlers: function () {
            var me = this;
            this.removeHandler(this.host, 'keydown.navigationbar' + this.widgetID);

            $.each(this.items, function (index, value) {
                var item = this;
                
                me.removeHandler(item._header, 'click.navigationbar' + me.widgetID);
                me.removeHandler(item._header, 'dblclick.navigationbar' + me.widgetID);
                me.removeHandler(item._header, 'mouseenter.navigationbar' + me.widgetID);
                me.removeHandler(item._header, 'mouseleave.navigationbar' + me.widgetID);
                me.removeHandler(item._header, 'focus.navigationbar' + me.widgetID);
                me.removeHandler(item._header, 'blur.navigationbar' + me.widgetID);
                me.removeHandler(item._content, 'focus.navigationbar' + me.widgetID);
                me.removeHandler(item._content, 'blur.navigationbar' + me.widgetID);
                me.removeHandler(item._header_text, 'focus.navigationbar' + me.widgetID);
                me.removeHandler(item._arrow, 'focus.navigationbar' + me.widgetID);
            });
        },

        // sets the expander's theme and classes
        _setTheme: function () {
            var me = this;
            this.host.addClass(this.toThemeProperty('jqx-reset'));
            this.host.addClass(this.toThemeProperty("jqx-widget"));
            if (this.rtl == true) {
                this.host.addClass(this.toThemeProperty("jqx-rtl"));
            };

            $.each(this.items, function (index, value) {
                var item = this;
                item._header.css("position", "relative");
                item._content.css("position", "relative");
                item._header.addClass(me.toThemeProperty("jqx-widget-header"));
                item._header.addClass(me.toThemeProperty("jqx-item"));
                item._content.addClass(me.toThemeProperty("jqx-widget-content"));

                if (item.disabled == false) {
                    item._header.removeClass(me.toThemeProperty("jqx-fill-state-disabled"));
                    item._content.removeClass(me.toThemeProperty("jqx-fill-state-disabled"));
                    if (item.expanded == true) {
                        item._header.addClass(me.toThemeProperty("jqx-fill-state-pressed"));
                        item._header.addClass(me.toThemeProperty("jqx-expander-header-expanded"));
                    } else {
                        item._header.addClass(me.toThemeProperty("jqx-fill-state-normal"));
                        item._header.removeClass(me.toThemeProperty("jqx-expander-header-expanded"));
                    };

                    if (!me._isTouchDevice) {
                        // adds events on hover over header
                        me.addHandler(item._header, 'mouseenter.navigationbar' + me.widgetID, function () {
                            if (item._expandChecker == 1) {
                                if (!item.focusedH) {
                                    item._header.css("z-index", 5);
                                }
                                item._header.removeClass(me.toThemeProperty("jqx-fill-state-normal"));
                                item._header.removeClass(me.toThemeProperty("jqx-fill-state-pressed"));
                                item._header.addClass(me.toThemeProperty("jqx-fill-state-hover"));
                                item._header.addClass(me.toThemeProperty("jqx-expander-header-hover"));
                                item._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-top-hover"));
                                item._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-down-hover"));
                                if (item.expanded) {
                                    item._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-up-hover"));
                                }
                                else {
                                    item._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-down-hover"));
                                }
                            };
                        });
                        me.addHandler(item._header, 'mouseleave.navigationbar' + me.widgetID, function () {
                            if (!item.focusedH) {
                                item._header.css("z-index", 0);
                            }
                            item._header.removeClass(me.toThemeProperty("jqx-fill-state-hover"));
                            item._header.removeClass(me.toThemeProperty("jqx-expander-header-hover"));
                            item._arrow.removeClass(me.toThemeProperty("jqx-expander-arrow-top-hover"));
                            item._arrow.removeClass(me.toThemeProperty("jqx-expander-arrow-down-hover"));
                            if (item._expandChecker == 1) {
                                item._header.addClass(me.toThemeProperty("jqx-fill-state-normal"));
                            } else {
                                item._header.addClass(me.toThemeProperty("jqx-fill-state-pressed"));
                            };
                            item._arrow.removeClass(me.toThemeProperty("jqx-icon-arrow-up-hover"));
                            item._arrow.removeClass(me.toThemeProperty("jqx-icon-arrow-down-hover"));
                        });
                    }
                } else {
                    item._header.addClass(me.toThemeProperty("jqx-fill-state-disabled"));
                    item._content.addClass(me.toThemeProperty("jqx-fill-state-disabled"));
                };

                me.host.addClass(me.toThemeProperty("jqx-navigationbar"));
                item._header.addClass(me.toThemeProperty("jqx-expander-header"));
                item._content.addClass(me.toThemeProperty("jqx-expander-content"));
                item._content.addClass(me.toThemeProperty("jqx-expander-content-bottom"));
                if (index != 0) {
                    item._header.css("margin-top", -1);
                };
                item._arrow.addClass(me.toThemeProperty("jqx-expander-arrow"));
            });
        },

        // checks if the content is empty
        _checkContent: function (index) {
            var item = this.items[index];
            var content = item._content;
            this._cntntEmpty = /^\s*$/.test(this.items[index]._content.html());
            if (this._cntntEmpty == true) {
                content.css("display", "none");
                content.height(0);
                content.addClass(this.toThemeProperty("jqx-expander-content-empty"));
            } else {
                if (item.expanded) {
                    content.css("display", "block");
                }
                if (this.expandMode == "singleFitHeight") {
                    var plus = 1;
                    if (index != 0) {
                        plus = 2;
                    };
                    content.height(this.host.height() - this.headersHeight + plus);
                } else {
                    content.height("auto");
                };
                content.removeClass(this.toThemeProperty("jqx-expander-content-empty"));
            };
        },

        // checks if the expanded widget's height is greater than the host element's
        _checkHeight: function () {
            var me = this;
            this.totalHeight = 0;
            this.heightFlag;
            var paddingLeft = this.items && this.items.length > 0 ? parseInt(this.items[0]._header.css('padding-left')) : 0;
            var paddingRight = this.items && this.items.length > 0 ? parseInt(this.items[0]._header.css('padding-right')) : 0;
            var borderOffset = 2;
            var totalOffset = paddingLeft + paddingRight + borderOffset;
            if (isNaN(totalOffset)) totalOffset = 12;
            var scrollWidth = 17;

            $.each(this.items, function (index, value) {
                var item = this;
                me.totalHeight += (item.expanded ? item._content.outerHeight() : 0) + item._header.outerHeight();
            });
            if (this.width != "auto" && this.height != "auto" && this.expandMode != "singleFitHeight") {
                if (this.totalHeight > this.host.height()) {
                    this.host.width(this.width + totalOffset + scrollWidth);
                    this.heightFlag = true;
                } else {
                    this.host.width(this.width + totalOffset);
                    this.heightFlag = false;
                };
            };
        },

        // checks whether the widget is disabled or enabled
        _enabledDisabledCheck: function () {
            var me = this;
            if (this.disabled == true) {
                $.each(this.items, function (index, value) {
                    var item = this;
                    item.disabled = true;
                });
            } else {
                $.each(this.items, function (index, value) {
                    var item = this;
                    item.disabled = false;
                });
            };
        },

        // updates the array of expanded indexes
        _updateExpandedIndexes: function () {
            var me = this;
            this.expandedIndexes = [];
            $.each(this.items, function (index, value) {
                var item = this;
                if (item.expanded == true) {
                    me.expandedIndexes.push(index);
                    if (me.expandMode == "single" || me.expandMode == "singleFitHeight" || me.expandMode == "toggle" || me.expandMode == "none") {
                        return false;
                    };
                };
            });
        },

        // adds keyboard interaction
        _keyBoard: function () {
            var me = this;
            this._focus();

            this.addHandler(this.host, 'keydown.navigationbar' + this.widgetID, function (event) {
                var handled = false;
                $.each(me.items, function (index, value) {
                    var item = this;
                    var length = me.items.length;
                    if ((item.focusedH == true || item.focusedC == true) && item.disabled == false) {

                        // functionality for different keys
                        switch (event.keyCode) {
                            case 13:
                            case 32:
                                if (me.toggleMode != 'none') {
                                    if (item.focusedH == true) {
                                        me._animate(index, true);
                                    };
                                    handled = true;
                                }
                                break;
                            case 37:
                                if (index != 0) {
                                    me.items[index - 1]._header.focus();
                                } else {
                                    var length = me.items.length;
                                    me.items[length - 1]._header.focus();
                                };
                                handled = true;
                                break;
                            case 38:
                                if (event.ctrlKey == false) {
                                    if (index != 0) {
                                        me.items[index - 1]._header.focus();
                                    } else {
                                        var length = me.items.length;
                                        me.items[length - 1]._header.focus();
                                    };
                                } else {
                                    if (item.focusedC == true) {
                                        item._header.focus();
                                    };
                                };
                                handled = true;
                                break;
                            case 39:
                                if (index != length - 1) {
                                    me.items[index + 1]._header.focus();
                                } else {
                                    me.items[0]._header.focus();
                                };
                                handled = true;
                                break;
                            case 40:
                                if (event.ctrlKey == false) {
                                    if (index != length - 1) {
                                        me.items[index + 1]._header.focus();
                                    } else {
                                        me.items[0]._header.focus();
                                    };
                                } else {
                                    if (item.expanded == true) {
                                        item._content.focus();
                                    };
                                };
                                handled = true;
                                break;
                            case 35:
                                if (index != length - 1) {
                                    me.items[length - 1]._header.focus();
                                };
                                handled = true;
                                break;
                            case 36:
                                if (index != 0) {
                                    me.items[0]._header.focus();
                                };
                                handled = true;
                                break;
                                //                            case 9:     
                                //                                $.each(me.items, function (index, value) {     
                                //                                    var item = this;     
                                //                                    if (item.disabled == false) {     
                                //                                        item._header.focus();     
                                //                                        return false;     
                                //                                    };     
                                //                                });     
                                //                                handled = true;     
                                //                                break;     
                        };
                        return false;
                    };
                });

                if (handled && event.preventDefault) {
                    event.preventDefault();
                };

                return !handled;
            });
        },

        // focuses/blurs the headers and contents of the items
        _focus: function () {
            var me = this;
            if (this.disabled) return;

            $.each(this.items, function (index, value) {
                var item = this;
                me.addHandler(item._header, 'focus.navigationbar' + this.widgetID, function () {
                    item.focusedH = true;
                    $.jqx.aria(item._header, "aria-selected", true);

                    item._header.addClass(me.toThemeProperty("jqx-fill-state-focus"));
                    item._header.css("z-index", 10);
                });
                me.addHandler(item._header, 'blur.navigationbar' + this.widgetID, function () {
                    item.focusedH = false;
                    $.jqx.aria(item._header, "aria-selected", false);
                    if (item._header.hasClass("jqx-expander-header-hover")) {
                        item._header.css("z-index", 5);
                    } else {
                        item._header.css("z-index", 0);
                    };
                    item._header.removeClass(me.toThemeProperty("jqx-fill-state-focus"));
                });
                me.addHandler(item._header_text, 'focus.navigationbar' + this.widgetID, function () {
                    item._header.focus();
                });
                me.addHandler(item._arrow, 'focus.navigationbar' + this.widgetID, function () {
                    item._header.focus();
                });
                me.addHandler(item._content, 'focus.navigationbar' + this.widgetID, function () {
                    item.focusedC = true;
                    item._content.addClass(me.toThemeProperty("jqx-fill-state-focus"));
                });
                me.addHandler(item._content, 'blur.navigationbar' + this.widgetID, function () {
                    item.focusedC = false;
                    item._content.removeClass(me.toThemeProperty("jqx-fill-state-focus"));
                });
            });
        }
    });
})(jqxBaseFramework);
