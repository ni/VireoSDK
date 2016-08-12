/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {

    $.jqx.jqxWidget("jqxExpander", "", {});

    $.extend($.jqx._jqxExpander.prototype, {

        defineInstance: function () {
            var settings =
            {
                //// properties
                width:'auto',
                height:'auto',
                expanded:true, // possible values: true, false
                expandAnimationDuration:259,
                collapseAnimationDuration:250,
                animationType:'slide', // possible values: 'slide', 'fade', 'none'
                toggleMode:'click', //possible values: 'click', 'dblclick', 'none'
                showArrow:true, // possible values: true, false
                arrowPosition:'right', // possible values: 'left', 'right'
                headerPosition:'top', // possible values: 'top', 'bottom'
                disabled:false, // possible values: true, false
                initContent:null, // callback function
                rtl:false, // possible values: true, false
                easing:'easeInOutSine', // possible values: easeOutBack, easeInQuad, easeInOutCirc, easeInOutSine, easeInCubic, easeOutCubic, easeInOutCubic, easeInSine, easeOutSine, easeInOutSine
                aria:
                 {
                     "aria-disabled": { name: "disabled", type: "boolean" }
                 },
                //// events
                events:['expanding', 'expanded', 'collapsing', 'collapsed', 'resize']
            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            $.jqx.aria(this);
            // saves the initial HTML structure in a variable
            this._cachedHTMLStructure = this.host.html();

            // renders the widget
            this.render();
        },

        //// methods

        //// public methods

        // expands the content
        expand: function () {
            if (this.disabled == false && this.expanded == false && this._expandChecker == 1) {
                var me = this;
                this._expandChecker = 0;
                this._raiseEvent('0');
                this._header.removeClass(this.toThemeProperty("jqx-fill-state-normal"));
                this._header.addClass(this.toThemeProperty("jqx-fill-state-pressed"));
                this._header.addClass(this.toThemeProperty("jqx-expander-header-expanded"));
                if (this.headerPosition == 'top') {
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-hover"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-hover"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-selected"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-top"));
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up"));
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up-selected"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-expanded"));
                } else if (this.headerPosition == 'bottom') {
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-selected"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-hover"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-hover"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-expanded-top"));
                };
                switch (this.animationType) {
                    case 'slide':
                        if (this.headerPosition == 'top') {
                            this._content.slideDown(this.expandAnimationDuration, this.easing, function () {
                                me.expanded = true;
                                $.jqx.aria(me._header, "aria-expanded", true);
                                $.jqx.aria(me._content, "aria-hidden", false);

                                me._raiseEvent('1');
                                if (me.initContent && me._initialized == false) {
                                    me.initContent();
                                    me._initialized = true;
                                };
                            });
                        } else if (this.headerPosition == 'bottom') {
                            this._content.css({ "display": "inherit", "height": 0 });
                            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                                this._content.css('display', 'block');
                            }

                            if (this._cntntEmpty == true) {
                                this._content.animate({
                                    height: 0
                                }, this.expandAnimationDuration, this.easing, function () {
                                    me.expanded = true;
                                    $.jqx.aria(me._header, "aria-expanded", true);
                                    $.jqx.aria(me._content, "aria-hidden", false);
                                    me._raiseEvent('1');
                                    if (me.initContent && me._initialized == false) {
                                        me.initContent();
                                        me._initialized = true;
                                    };
                                });
                            } else {
                                this._content.animate({
                                    height: this._contentHeight
                                }, this.expandAnimationDuration, this.easing, function () {
                                    me.expanded = true;
                                    $.jqx.aria(me._header, "aria-expanded", true);
                                    $.jqx.aria(me._content, "aria-hidden", false);
                                    me._raiseEvent('1');
                                    if (me.initContent && me._initialized == false) {
                                        me.initContent();
                                        me._initialized = true;
                                    };
                                });
                            };
                        };
                        break;
                    case 'fade':
                        this._content.fadeIn(this.expandAnimationDuration, this.easing, function () {
                            me.expanded = true;
                            $.jqx.aria(me._header, "aria-expanded", true);
                            $.jqx.aria(me._content, "aria-hidden", false);
                            me._raiseEvent('1');
                            if (me.initContent && me._initialized == false) {
                                me.initContent();
                                me._initialized = true;
                            };
                        });
                        break;
                    case 'none':
                        this._content.css("display", "inherit");
                        this.expanded = true;
                        $.jqx.aria(me._header, "aria-expanded", true);
                        $.jqx.aria(me._content, "aria-hidden", false);
                        this._raiseEvent('1');
                        if (this.initContent && this._initialized == false) {
                            this.initContent();
                            this._initialized = true;
                        };
                        break;
                };
            };
        },

        // collapses the content
        collapse: function () {
            if (this.disabled == false && this.expanded == true && this._expandChecker == 0) {
                var me = this;
                this._expandChecker = 1;
                this._raiseEvent('2');
                this._header.removeClass(this.toThemeProperty("jqx-fill-state-pressed"));
                this._header.removeClass(this.toThemeProperty("jqx-expander-header-expanded"));
                this._header.addClass(this.toThemeProperty("jqx-fill-state-normal"));
                if (this.headerPosition == 'top') {
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-selected"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-expanded"));
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down"));
                    if (me._hovered) {
                        this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down-hover"));
                    }

                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top"));
                } else if (this.headerPosition == 'bottom') {
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-selected"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-top"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-expanded-top"));
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                    if (me._hovered) {
                        this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up-hover"));
                    }
                };
                switch (this.animationType) {
                    case 'slide':
                        if (this.headerPosition == 'top') {
                            this._content.slideUp(this.collapseAnimationDuration, this.easing, function () {
                                me.expanded = false;
                                $.jqx.aria(me._header, "aria-expanded", false);
                                $.jqx.aria(me._content, "aria-hidden", true);
                                me._raiseEvent('3');
                            });
                        } else if (this.headerPosition == 'bottom') {
                            this._content.animate({
                                height: 0
                            }, this.expandAnimationDuration, function () {
                                me._content.css("display", "none");
                                me.expanded = false;
                                $.jqx.aria(me._header, "aria-expanded", false);
                                $.jqx.aria(me._content, "aria-hidden", true);
                                me._raiseEvent('3');
                            });
                        };
                        break;
                    case 'fade':
                        this._content.fadeOut(this.collapseAnimationDuration, this.easing, function () {
                            me.expanded = false;
                            $.jqx.aria(me._header, "aria-expanded", false);
                            $.jqx.aria(me._content, "aria-hidden", true);
                            me._raiseEvent('3');
                        });
                        break;
                    case 'none':
                        this._content.css("display", "none");
                        this.expanded = false;
                        $.jqx.aria(me._header, "aria-expanded", false);
                        $.jqx.aria(me._content, "aria-hidden", true);
                        this._raiseEvent('3');
                        break;
                };
            };
        },

        // sets the header's content
        setHeaderContent: function (headerContent) {
            this._header_text.html(headerContent);
            this.invalidate();
        },

        // gets the header's content
        getHeaderContent: function () {
            return this._header_text.html();
        },

        // sets the content
        setContent: function (content) {
            this._content.html(content);
            this._checkContent();
            this.invalidate();
        },

        // gets the content
        getContent: function () {
            return this._content.html();
        },

        // enables the widget
        enable: function () {
            this.disabled = false;
            this.refresh();
            $.jqx.aria(this, "aria-disabled", false);
        },

        // disables the widget
        disable: function () {
            this.disabled = true;
            this.refresh();
            $.jqx.aria(this, "aria-disabled", true);
        },

        // refreshes the widget
        invalidate: function () {
            if ($.jqx.isHidden(this.host))
                return;

            this._setSize();
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh == true) {
                return;
            };

            this._removeHandlers();
            if (this.showArrow == true) {
                this._arrow.css("display", "inherit");
            } else {
                this._arrow.css("display", "none");
            };
            this._setTheme();
            this._setSize();
            if (this.disabled == false) {
                this._toggle();
            };
            this._keyBoard();
        },

        // renders the widget
        render: function () {
            this.widgetID = this.element.id;

            if (this._header) {
                this._header.removeClass(this.toThemeProperty('jqx-expander-header-content'));
                this._header.removeClass(this.toThemeProperty('jqx-expander-header'));
                this._header.removeClass(this.toThemeProperty('jqx-expander-header-expanded'));
                this._header.removeClass(this.toThemeProperty('jqx-widget-header'));
                this._header_text.removeClass(this.toThemeProperty('jqx-expander-header-content'));
                this._header_text.removeClass(this.toThemeProperty('jqx-expander-header'));
                this._header_text.removeClass(this.toThemeProperty('jqx-widget-header'));
                this._header_text.removeClass(this.toThemeProperty('jqx-expander-header-expanded'));

                this._header.attr("tabindex", null);
                this._content.attr("tabindex", null);
                this._header.css("margin-top", 0);
                this._header[0].innerHTML = this._header_text[0].innerHTML;
                if (this.headerPosition == "bottom") {
                    this._header.detach();
                    this.host.prepend(this._header);
                }
            }
            // selects the initial header and creates a header wrapper
            this._header_temp = this.host.children("div:eq(0)");
            this._header_temp.wrap("<div></div>");

            // defines which div element is the header and which - the content
            this._header = this.host.children("div:eq(0)");
            this._content = this.host.children("div:eq(1)");
            if (this.headerPosition == "bottom") {
                this._header.detach();
                this.host.append(this._header);
            }

            // defines the header text section
            this._header_text = this._header.children("div:eq(0)");
            var className = this._header_text[0].className;
            this._header.addClass(className);
            this._header_text.removeClass();
            if (!this.rtl) {
                this._header_text.addClass(this.toThemeProperty('jqx-expander-header-content'));
            }
            else {
                this._header_text.addClass(this.toThemeProperty('jqx-expander-header-content-rtl'));
            }

            // appends an arrow to the header
            this._header.append("<div></div>");
            this._arrow = this._header.children("div:eq(1)");
            if (this.showArrow == true) {
                this._arrow.css("display", "inherit");
            } else {
                this._arrow.css("display", "none");
            };

            // sets the tabindex attribute of the header and conten if it is not already set
            this.tI = -1;
            if (this._header.attr("tabindex") == undefined) {
                this.tI++;
                this._header.attr("tabindex", this.tI);
            };
            if (this._content.attr("tabindex") == undefined) {
                this.tI++;
                this._content.attr("tabindex", this.tI);
            };

            // sets the expander's theme and classes
            this._setTheme();

            // checks if the content is empty
            this._checkContent();

            // checks whether the HTML structure of the widget is valid and alerts the user if not
            var exceptionMessage = "Invalid jqxExpander structure. Please add only two child div elements to your jqxExpander div that will represent the expander's header and content.";
            try {
                if (this._header.length == 0 || this._content.length == 0 || this.host.children().length < 2 || this.host.children().length > 2) {
                    throw exceptionMessage;
                };
            } catch (exception) {
                alert(exception);
            };

            // checks if content is expanded initially
            this._expandChecker;
            this._initialized;
            if (this.expanded == true) {
                if (this.headerPosition == "top") {
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up"));
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up-selected"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-expanded"));
                } else if (this.headerPosition == "bottom") {
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down"));
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down-selected"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-expanded-top"));
                };
                if (this.initContent) {
                    this._setSize();
                    this.initContent();
                };
                this._initialized = true;
                this._expandChecker = 0;
            } else if (this.expanded == false) {
                this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-down-selected"));
                this._arrow.removeClass(this.toThemeProperty("jqx-icon-arrow-up-selected"));
                if (this.headerPosition == "top") {
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-down"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top"));
                } else if (this.headerPosition == "bottom") {
                    this._arrow.addClass(this.toThemeProperty("jqx-icon-arrow-up"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-bottom"));
                };
                this._initialized = false;
                this._expandChecker = 1;
                this._content.css("display", "none");
            };

            // sets the width and height of the widget
            this._setSize();

            // toggles the widget
            if (this.disabled == false) {
                this._toggle();
            };

            // adds keyboard interaction
            this._keyBoard();
            var that = this;

            $.jqx.utilities.resize(this.host, function () {
                that.invalidate();
            });
        },

        // removes the widget
        destroy: function () {
            this.removeHandler($(window), 'resize.expander' + this.widgetID);
            this.host.remove();
            $(this.element).removeData('jqxExpander');
        },

        // focuses on the widget
        focus: function () {
            try {
                if (this.disabled == false) {
                    this._header.focus();
                };
            }
            catch (error) {
            }
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

            if (key == "expanded")
            {
                if (value == true && oldvalue == false) {
                    this.expanded = false;
                    this.expand();
                } else if (value == false && oldvalue == true) {
                    this.expanded = true;
                    this.collapse();
                };
            } else {
                this.refresh();
            };
        },

        // raises an event
        _raiseEvent: function (id, args) {
            var evt = this.events[id];
            var event = new $.Event(evt);
            event.owner = this;
            event.args = args;

            try {
                var result = this.host.trigger(event);
            }
            catch (error) {
            }

            return result;
        },

        resize: function(width, height)
        {
            this.width = width;
            this.height = height;
            this._setSize();
        },

        // sets the width and height of the widget
        _setSize: function () {
            this.host.width(this.width);
            this.host.height(this.height);

            this._header.height("auto");
            this._header.css("min-height", this._arrow.height());

            // sets the arrow position
            //    this._arrow.css("top", "50%");
            //  this._arrow.css("margin-top", -this._arrow.height() / 2);
            var arrowPosition = this.arrowPosition;
            if (this.rtl) {
                switch (arrowPosition) {
                    case 'left':
                        arrowPosition = 'right';
                        break;
                    case 'right':
                        arrowPosition = 'left';
                        break;
                }
            }
            if (arrowPosition == "right") {
                this._header_text.css({ "float": "left", "margin-left": "0px" });
                this._arrow.css({ "float": "right", "position": "relative" });
            } else if (arrowPosition == "left") {
                if (this.width == "auto") {
                    this._header_text.css({ "float": "left", "margin-left": "17px" });
                    this._arrow.css({ "float": "left", "position": "absolute" });
                } else {
                    this._header_text.css({ "float": "right", "margin-left": "0px" });
                    this._arrow.css({ "float": "left", "position": "relative" });
                };
            };
            this._arrow.css("margin-top", this._header_text.height() / 2 - this._arrow.height() / 2);

            if (this.height == "auto") {
                this._content.height("auto");
                this._contentHeight = this._content.height();
            } else {
                this._content.height("auto");
                var newHeight = Math.round(this.host.height()) - Math.round(this._header.outerHeight()) - 1;
                if (newHeight < 0) newHeight = 0;
                if (!this._contentHeight) {
                    this._contentHeight = this._content.height();
                }
                if (newHeight != this._contentHeight) {
                    this._content.height(newHeight);
                    this._contentHeight = Math.round(this._content.outerHeight());
                }
                else this._content.height(this._contentHeight);
                
            };
        },

        // toggles the expander
        _toggle: function () {
            var me = this;
            if (this._isTouchDevice == false) {
                this._header.removeClass(this.toThemeProperty("jqx-expander-header-disabled"));
                switch (this.toggleMode) {
                    case 'click':
                        this.addHandler(this._header, 'click.expander' + this.widgetID, function () {
                            me._animate();
                        });
                        break;
                    case 'dblclick':
                        this.addHandler(this._header, 'dblclick.expander' + this.widgetID, function () {
                            me._animate();
                        });
                        break;
                    case 'none':
                        this._header.addClass(this.toThemeProperty("jqx-expander-header-disabled"));
                        break;
                };
            } else {
                if (this.toggleMode != "none") {
                    this.addHandler(this._header, $.jqx.mobile.getTouchEventName('touchstart') + "." + this.widgetID, function () {
                        me._animate();
                    });
                } else {
                    return;
                };
            };
        },

        // calls for either expand() or collapse()
        _animate: function () {
            if (this.expanded == true) {
                this.collapse();
                this._header.addClass(this.toThemeProperty("jqx-fill-state-hover"));
                this._header.addClass(this.toThemeProperty("jqx-expander-header-hover"));
                if (this.headerPosition == "top") {
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-top-hover"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-down-hover"));
                } else if (this.headerPosition == "bottom") {
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-bottom-hover"));
                    this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow-up-hover"));
                };
            } else {
                this.expand();
                this._header.removeClass(this.toThemeProperty("jqx-fill-state-hover"));
                this._header.removeClass(this.toThemeProperty("jqx-expander-header-hover"));
                if (this.headerPosition == "top") {
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-top-hover"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-down-hover"));
                } else if (this.headerPosition == "bottom") {
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-bottom-hover"));
                    this._arrow.removeClass(this.toThemeProperty("jqx-expander-arrow-up-hover"));
                };
            };
        },

        // removes event handlers
        _removeHandlers: function () {
            this.removeHandler(this._header, 'click.expander' + this.widgetID);
            this.removeHandler(this._header, 'dblclick.expander' + this.widgetID);
            this.removeHandler(this._header, 'mouseenter.expander' + this.widgetID);
            this.removeHandler(this._header, 'mouseleave.expander' + this.widgetID);
        },

        // sets the expander's theme and classes
        _setTheme: function () {
            var me = this;
            this.host.addClass(this.toThemeProperty("jqx-widget"));
            this._header.addClass(this.toThemeProperty("jqx-widget-header"));
            this._content.addClass(this.toThemeProperty("jqx-widget-content"));
            if (this.rtl == true) {
                this.host.addClass(this.toThemeProperty("jqx-rtl"));
            };

            if (this.disabled == false) {
                this._header.removeClass(this.toThemeProperty("jqx-expander-header-disabled"));
                this.host.removeClass(this.toThemeProperty("jqx-fill-state-disabled"));
                if (this.expanded == true) {
                    this._header.addClass(this.toThemeProperty("jqx-fill-state-pressed"));
                    this._header.addClass(this.toThemeProperty("jqx-expander-header-expanded"));
                } else {
                    this._header.addClass(this.toThemeProperty("jqx-fill-state-normal"));
                    this._header.removeClass(this.toThemeProperty("jqx-expander-header-expanded"));
                };

                this._hovered = false;
                if (!me._isTouchDevice) {
                    // adds events on hover over header
                    this.addHandler(this._header, 'mouseenter.expander' + this.widgetID, function () {
                        me._hovered = true;
                        if (me._expandChecker == 1) {
                            me._header.removeClass(me.toThemeProperty("jqx-fill-state-normal"));
                            me._header.removeClass(me.toThemeProperty("jqx-fill-state-pressed"));
                            me._header.addClass(me.toThemeProperty("jqx-fill-state-hover"));
                            me._header.addClass(me.toThemeProperty("jqx-expander-header-hover"));
                            if (me.headerPosition == "top") {
                                if (me.expanded) {
                                    me._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-up-hover"));
                                }
                                else {
                                    me._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-down-hover"));
                                }

                                me._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-top-hover"));
                                me._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-down-hover"));
                            } else if (me.headerPosition == "bottom") {
                                if (me.expanded) {
                                    me._arrow.addClass(me.toThemeProperty("jqx-icon-arrow-down-hover"));
                                }
                                me._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-bottom-hover"));
                                me._arrow.addClass(me.toThemeProperty("jqx-expander-arrow-up-hover"));
                            };
                        };
                    });
                    this.addHandler(this._header, 'mouseleave.expander' + this.widgetID, function () {
                        me._hovered = false;
                        me._header.removeClass(me.toThemeProperty("jqx-fill-state-hover"));
                        me._arrow.removeClass(me.toThemeProperty("jqx-icon-arrow-up-hover"));
                        me._arrow.removeClass(me.toThemeProperty("jqx-icon-arrow-down-hover"));

                        me._header.removeClass(me.toThemeProperty("jqx-expander-header-hover"));
                        if (me.headerPosition == "top") {
                            me._arrow.removeClass(me.toThemeProperty("jqx-expander-arrow-top-hover"));
                            me._arrow.removeClass(me.toThemeProperty("jqx-expander-arrow-down-hover"));
                        } else if (me.headerPosition == "bottom") {
                            me._arrow.removeClass(me.toThemeProperty("jqx-expander-arrow-bottom-hover"));
                            me._arrow.removeClass(me.toThemeProperty("jqx-expander-arrow-up-hover"));
                        };
                        if (me._expandChecker == 1) {
                            me._header.addClass(me.toThemeProperty("jqx-fill-state-normal"));
                        } else {
                            me._header.addClass(me.toThemeProperty("jqx-fill-state-pressed"));
                        };
                    });
                }
            } else {
                this.host.addClass(this.toThemeProperty("jqx-fill-state-disabled"));
                this._header.addClass(this.toThemeProperty("jqx-expander-header-disabled"));
            };

            this.host.addClass(this.toThemeProperty("jqx-expander"));
            this._header.addClass(this.toThemeProperty("jqx-expander-header"));
            this._content.addClass(this.toThemeProperty("jqx-expander-content"));
            if (this.headerPosition == "top") {
                this._content.addClass(this.toThemeProperty("jqx-expander-content-bottom"));
            } else if (this.headerPosition == "bottom") {
                this._content.addClass(this.toThemeProperty("jqx-expander-content-top"));
            };
            this._arrow.addClass(this.toThemeProperty("jqx-expander-arrow"));
        },

        // checks if the content is empty
        _checkContent: function () {
            this._cntntEmpty = /^\s*$/.test(this._content.html());
            if (this._cntntEmpty == true) {
                this._content.height(0);
                this._content.addClass(this.toThemeProperty("jqx-expander-content-empty"));
            } else {
                this._content.height(this._contentHeight);
                this._content.removeClass(this.toThemeProperty("jqx-expander-content-empty"));
            };
        },

        // adds keyboard interaction
        _keyBoard: function () {
            var me = this;
            this._focus();

            this.addHandler(this.host, 'keydown.expander' + this.widgetID, function (event) {
                var handled = false;
                if ((me.focusedH == true || me.focusedC == true) && me.disabled == false) {

                    // functionality for different keys
                    switch (event.keyCode) {
                        case 13:
                        case 32:
                            if (me.toggleMode != 'none') {
                                if (me.focusedH == true) {
                                    me._animate();
                                };
                                handled = true;
                            }
                            break;
                        case 38:
                            if (event.ctrlKey == true && me.focusedC == true) {
                                me._header.focus();
                            };
                            handled = true;
                            break;
                        case 40:
                            if (event.ctrlKey == true && me.focusedH == true) {
                                me._content.focus();
                            };
                            handled = true;
                            break;
                            //                        case 9:                         
                            //                            me._header.focus();                         
                            //                            handled = true;                         
                            //                            break;                         
                    };
                    return true;
                };

                if (handled && event.preventDefault) {
                    event.preventDefault();
                };

                return !handled;
            });
        },

        // focuses/blurs the headers and contents
        _focus: function () {
            var me = this;
            this.addHandler(this._header, 'focus.expander' + this.widgetID, function () {
                me.focusedH = true;
                $.jqx.aria(me._header, "aria-selected", true);
                me._header.addClass(me.toThemeProperty("jqx-fill-state-focus"));
            });
            this.addHandler(this._header, 'blur.expander' + this.widgetID, function () {
                me.focusedH = false;
                $.jqx.aria(me._header, "aria-selected", false);
                me._header.removeClass(me.toThemeProperty("jqx-fill-state-focus"));
            });
            this.addHandler(this._header_text, 'focus.expander' + this.widgetID, function () {
                me._header.focus();
            });
            this.addHandler(this._arrow, 'focus.expander' + this.widgetID, function () {
                me._header.focus();
            });
            this.addHandler(this._content, 'focus.expander' + this.widgetID, function () {
                me.focusedC = true;
                me._content.addClass(me.toThemeProperty("jqx-fill-state-focus"));
            });
            this.addHandler(this._content, 'blur.expander' + this.widgetID, function () {
                me.focusedC = false;
                me._content.removeClass(me.toThemeProperty("jqx-fill-state-focus"));
            });
        }
    });
})(jqxBaseFramework);
