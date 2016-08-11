/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget("jqxPanel", "", {});

    $.extend($.jqx._jqxPanel.prototype, {

        defineInstance: function () {
            var settings = {
                //Type: String.
                //Default: null.
                //Sets the panel width.
                width: null,
                //Type: String.
                //Default: null.
                //Sets the panel height.
                height: null,
                // gets or sets whether the panel is disabled.
                disabled: false,
                // Type: Number
                // Default: 15
                // gets or sets the scrollbars size.
                scrollBarSize: $.jqx.utilities.scrollBarSize,
                // Type: String
                // Default: 'fixed'
                // Sets the sizing mode. In the 'fixed' mode, the panel displays scrollbars, if its content requires it. 
                // In the wrap mode, the scrollbars are not displayed and the panel automatically changes its size.
                // Possible Values: 'fixed', 'wrap'
                sizeMode: 'fixed',
                // Type: Boolean
                // Default: false
                // Automatically updates the panel, if its children size is changed.
                autoUpdate: false,
                // Type: Number
                // Default: 500
                // Gets or sets the autoUpdate interval.
                autoUpdateInterval: 500,
                touchMode: 'auto',
                horizontalScrollBarMax: null,
                verticalScrollBarMax: null,
                touchModeStyle: 'auto',
                rtl: false,
                // jqxPanel events.
                events:
                [
                // occurs when the layout is performed.
                   'layout'
                ]
            };
            $.extend(true, this, settings);
            return settings;
        },

        // creates a new jqxPanel instance.
        createInstance: function (args) {
            this.render();
        },

        render: function () {
            var self = this;
            if ($.jqx.utilities.scrollBarSize != 15) {
                this.scrollBarSize = $.jqx.utilities.scrollBarSize;
            }
            this.host.addClass(this.toThemeProperty("jqx-panel"));
            this.host.addClass(this.toThemeProperty("jqx-widget"));
            this.host.addClass(this.toThemeProperty("jqx-widget-content"));
            this.host.addClass(this.toThemeProperty("jqx-rc-all"));

            var panelStructure = $("<div id='panelWrapper' style='overflow: hidden; width: 100%; height: 100%; background-color: transparent; -webkit-appearance: none; outline: none; align:left; border: 0px; padding: 0px; margin: 0px; left: 0px; top: 0px; valign:top; position: relative;'>" +
                "<div id='panelContent' style='-webkit-appearance: none; -moz-box-sizing: border-box; box-sizing: border-box; width: 100%; height: 100%; outline: none; border: none; padding: 0px; position: absolute; margin: 0px; align:left; valign:top; left: 0px; top: 0px;'/>" +
                "<div id='verticalScrollBar' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'/>" +
                "<div id='horizontalScrollBar' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'/>" +
                "<div id='bottomRight' style='align:left; valign:top; left: 0px; top: 0px; position: absolute;'/>" +
                "</div>");

            if (!this.host.jqxButton) {
                throw new Error("jqxPanel: Missing reference to jqxbuttons.js.");
            }
            if (!this.host.jqxScrollBar) {
                throw new Error("jqxPanel: Missing reference to jqxscrollbar.js.");
            }

            var children = this.host.children();
            this._rtl = false;
            if (children.length > 0 && children.css('direction') == 'rtl') {
                this.rtl = true;
                this._rtl = true;
            }

            this.host.wrapInner(panelStructure);
            var verticalScrollBar = this.host.find("#verticalScrollBar");
            verticalScrollBar[0].id = this.element.id + 'verticalScrollBar';

            this.vScrollBar = verticalScrollBar.jqxScrollBar({ 'vertical': true, rtl: this.rtl, touchMode: this.touchMode, theme: this.theme });
            var horizontalScrollBar = this.host.find("#horizontalScrollBar");
            horizontalScrollBar[0].id = this.element.id + 'horizontalScrollBar';
            this.hScrollBar = horizontalScrollBar.jqxScrollBar({ 'vertical': false, rtl: this.rtl, touchMode: this.touchMode, theme: this.theme });
            this.content = this.host.find("#panelContent");
            this.wrapper = this.host.find("#panelWrapper");
            this.content.addClass(this.toThemeProperty('jqx-widget-content'));
            this.wrapper[0].id = this.wrapper[0].id + this.element.id;
            this.content[0].id = this.content[0].id + this.element.id;
            this.bottomRight = this.host.find("#bottomRight").addClass(this.toThemeProperty('jqx-panel-bottomright')).addClass(this.toThemeProperty('jqx-scrollbar-state-normal'));
            this.bottomRight[0].id = 'bottomRight' + this.element.id;

            this.vScrollBar.css('visibility', 'inherit');
            this.hScrollBar.css('visibility', 'inherit');
            this.vScrollInstance = $.data(this.vScrollBar[0], 'jqxScrollBar').instance;
            this.hScrollInstance = $.data(this.hScrollBar[0], 'jqxScrollBar').instance;

            var me = this;
            this.propertyChangeMap['disabled'] = function (instance, key, oldVal, value) {
                me.vScrollBar.jqxScrollBar({ disabled: me.disabled });
                me.hScrollBar.jqxScrollBar({ disabled: me.disabled });
            };

            this.vScrollBar.jqxScrollBar({ disabled: this.disabled });
            this.hScrollBar.jqxScrollBar({ disabled: this.disabled });

            this._addHandlers();

            if (this.width == null) this.width = this.content.width();
            if (this.height == null) this.height = this.content.height();

            this._arrange();

            this.contentWidth = me.content[0].scrollWidth;
            this.contentHeight = me.content[0].scrollHeight;

            if (this.autoUpdate) {
                me._autoUpdate();
            }

            this.propertyChangeMap['autoUpdate'] = function (instance, key, oldVal, value) {
                if (me.autoUpdate) {
                    me._autoUpdate();
                }
                else {
                    clearInterval(me.autoUpdateId);
                    me.autoUpdateId = null;
                }
            }

            // unload
            this.addHandler($(window), 'unload', function () {
                if (me.autoUpdateId != null) {
                    clearInterval(me.autoUpdateId);
                    me.autoUpdateId = null;
                    me.destroy();
                }
            });

            this._updateTouchScrolling();
            this._render();
        },

        hiddenParent: function () {
            return $.jqx.isHidden(this.host);
        },

        _updateTouchScrolling: function () {
            var self = this;
            if (this.touchMode == true) {
                $.jqx.mobile.setMobileSimulator(this.element);
            }

            var isTouchDevice = this.isTouchDevice();
            if (isTouchDevice) {
                $.jqx.mobile.touchScroll(this.element, self.vScrollInstance.max, function (left, top) {
                    if (self.vScrollBar.css('visibility') != 'hidden') {
                        var oldValue = self.vScrollInstance.value;
                        self.vScrollInstance.setPosition(oldValue + top);
                    }
                    if (self.hScrollBar.css('visibility') != 'hidden') {
                        var oldValue = self.hScrollInstance.value;
                        self.hScrollInstance.setPosition(oldValue + left);
                    }
                }, this.element.id, this.hScrollBar, this.vScrollBar);
                this._arrange();
            }

            this.vScrollBar.jqxScrollBar({ touchMode: this.touchMode });
            this.hScrollBar.jqxScrollBar({ touchMode: this.touchMode });
        },

        isTouchDevice: function () {
            var isTouchDevice = $.jqx.mobile.isTouchDevice();
            if (this.touchMode == true) {
                isTouchDevice = true;
            }
            else if (this.touchMode == false) {
                isTouchDevice = false;
            }
            if (isTouchDevice && this.touchModeStyle != false) {
                this.scrollBarSize = $.jqx.utilities.touchScrollBarSize;
            }
            return isTouchDevice;
        },

        // append element.
        // @param element
        append: function (element) {
            if (element != null) {
                this.content.append(element);
                this._arrange();
            }
        },

        setcontent: function (html) {
            this.content[0].innerHTML = html;
            this._arrange();
            var that = this;
            setTimeout(function () {
                that._arrange();
            }, 100);
        },

        // prepend element.
        // @param element
        prepend: function (element) {
            if (element != null) {
                this.content.prepend(element);
                this._arrange();
            }
        },

        // clears the content.
        clearcontent: function () {
            this.content.text('');
            this.content.children().remove();
            this._arrange();
        },

        // remove element.
        // @param element
        remove: function (element) {
            if (element != null) {
                $(element).remove();
                this._arrange();
            }
        },

        _autoUpdate: function () {
            var me = this;
            this.autoUpdateId = setInterval(function () {
                var newWidth = me.content[0].scrollWidth;
                var newHeight = me.content[0].scrollHeight;
                var doarrange = false;
                if (me.contentWidth != newWidth) {
                    me.contentWidth = newWidth;
                    doarrange = true;
                }

                if (me.contentHeight != newHeight) {
                    me.contentHeight = newHeight;
                    doarrange = true;
                }

                //    if ($.jqx.browser.mozilla) doarrange = true;
                if (doarrange) {
                    me._arrange();
                }
            }, this.autoUpdateInterval);
        },

        _addHandlers: function () {
            var self = this;
            this.addHandler(this.vScrollBar, 'valueChanged', function (event) {
                self._render(self);
            });

            this.addHandler(this.hScrollBar, 'valueChanged', function (event) {
                self._render(self);
            });

            this.addHandler(this.host, 'mousewheel', function (event) {
                self.wheel(event, self);
            });

            this.addHandler(this.wrapper, 'scroll', function (event) {
                if (self.wrapper[0].scrollTop != 0) {
                    self.wrapper[0].scrollTop = 0;
                }

                if (self.wrapper[0].scrollLeft != 0) {
                    self.wrapper[0].scrollLeft = 0;
                }
            });

            this.addHandler(this.host, 'mouseleave', function (event) {
                self.focused = false;
            });

            this.addHandler(this.host, 'focus', function (event) {
                self.focused = true;
            });

            this.addHandler(this.host, 'blur', function (event) {
                self.focused = false;
            });

            this.addHandler(this.host, 'mouseenter', function (event) {
                self.focused = true;
            });
            $.jqx.utilities.resize(this.host, function () {
                if ($.jqx.isHidden(self.host))
                    return;

                self._arrange(false);
            });
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this._arrange(false);
        },

        _removeHandlers: function () {
            var self = this;
            this.removeHandler(this.vScrollBar, 'valueChanged');
            this.removeHandler(this.hScrollBar, 'valueChanged');
            this.removeHandler(this.host, 'mousewheel');
            this.removeHandler(this.host, 'mouseleave');
            this.removeHandler(this.host, 'focus');
            this.removeHandler(this.host, 'blur');
            this.removeHandler(this.host, 'mouseenter');
            this.removeHandler(this.wrapper, 'scroll');
            this.removeHandler($(window), 'resize.' + this.element.id);
        },

        // performs mouse wheel.
        wheel: function (event, self) {
            var delta = 0;
            // fix for IE8 and IE7
            if (event.originalEvent && $.jqx.browser.msie && event.originalEvent.wheelDelta) {
                delta = event.originalEvent.wheelDelta / 120;
            }

            if (!event) /* For IE. */
                event = window.event;
            if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta / 120;
            } else if (event.detail) { /** Mozilla case. */
                delta = -event.detail / 3;
            }

            if (delta) {
                var result = self._handleDelta(delta);

                if (!result) {
                    if (event.preventDefault)
                        event.preventDefault();
                }

                if (!result) {
                    return result;
                }
                else return false;
            }

            if (event.preventDefault)
                event.preventDefault();
            event.returnValue = false;
        },

        // scrolls down.
        scrollDown: function () {
            if (this.vScrollBar.css('visibility') == 'hidden')
                return false;

            var vScrollInstance = this.vScrollInstance;
            if (vScrollInstance.value + vScrollInstance.largestep <= vScrollInstance.max) {
                vScrollInstance.setPosition(vScrollInstance.value + vScrollInstance.largestep);
                return true;
            }
            else {
                if (vScrollInstance.value + vScrollInstance.largestep != vScrollInstance.max) {
                    vScrollInstance.setPosition(vScrollInstance.max);
                    return true;
                }
            }

            return false;
        },

        // scrolls up.
        scrollUp: function () {
            if (this.vScrollBar.css('visibility') == 'hidden')
                return false;

            var vScrollInstance = this.vScrollInstance;
            if (vScrollInstance.value - vScrollInstance.largestep >= vScrollInstance.min) {
                vScrollInstance.setPosition(vScrollInstance.value - vScrollInstance.largestep);
                return true;
            }
            else {
                if (vScrollInstance.value - vScrollInstance.largestep != vScrollInstance.min) {
                    vScrollInstance.setPosition(vScrollInstance.min);
                    return true;
                }
            }
            return false;
        },

        _handleDelta: function (delta) {
            if (this.focused) {
                var oldvalue = this.vScrollInstance.value;
                if (delta < 0) {
                    this.scrollDown();
                }
                else this.scrollUp();
                var newvalue = this.vScrollInstance.value;
                if (oldvalue != newvalue) {
                    return false;
                }
            }

            return true;
        },

        _render: function (self) {
            if (self == undefined) self = this;
            var vScroll = self.vScrollInstance.value;
            var hScroll = self.hScrollInstance.value;
            if (this.rtl) {
                if (this.hScrollBar[0].style.visibility != 'hidden') {
                    if (this._rtl == false) {
                        hScroll = self.hScrollInstance.max - hScroll;
                    }
                    else {
                        hScroll = -self.hScrollInstance.value;
                    }
                }
            }
            self.content.css({ left: -hScroll + 'px', top: -vScroll + 'px' });
        },

        // Moves the scrollbars to a specific position.
        // @param left. Specifies the horizontal scrollbar position.
        // @param top. Specifies the vertical scrollbar position.
        scrollTo: function (left, top) {
            if (left == undefined || top == undefined)
                return;

            this.vScrollInstance.setPosition(top);
            this.hScrollInstance.setPosition(left);
        },

        // Gets scrollable height.
        getScrollHeight: function () {
            return this.vScrollInstance.max;
        },

        // Gets vertical scroll position.
        getVScrollPosition: function () {
            return this.vScrollInstance.value;
        },

        // Gets scrollable width.
        getScrollWidth: function () {
            return this.hScrollInstance.max;
        },

        // gets the horizontal scroll position.
        getHScrollPosition: function () {
            return this.hScrollInstance.value;
        },

        _getScrollSize: function () {
            // scrollbar Size.
            var scrollSize = this.scrollBarSize;
            if (isNaN(scrollSize)) {
                scrollSize = parseInt(scrollSize);
                if (isNaN(scrollSize)) {
                    scrollSize = '17px';
                }
                else scrollSize = scrollSize + 'px';
            }

            if (this.isTouchDevice()) {
                scrollSize = $.jqx.utilities.touchScrollBarSize;
            }

            scrollSize = parseInt(scrollSize);
            return scrollSize;
        },

        _getScrollArea: function () {
            var contentLeft = 0;
            this.content.css('margin-right', '0px');
            this.content.css('max-width', '9999999px');
            if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                contentLeft = parseInt(this.content.css('left'));
                this.content.css('left', 0);
            }
            this.content.css('overflow', 'auto');
            if (this.rtl) {
                this.content.css('direction', 'rtl');
            }
            var contentWidth = parseInt(this.content[0].scrollWidth);
            $.each(this.content.children(), function () {
                contentWidth = Math.max(contentWidth, this.scrollWidth);
                contentWidth = Math.max(contentWidth, $(this).outerWidth());
            });
            if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                this.content.css('left', contentLeft);
            }

            var contentHeight = parseInt(this.content[0].scrollHeight);
            this.content.css('overflow', 'visible');

            if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                var contentHeight = parseInt(this.content[0].scrollHeight);

                switch (this.sizeMode) {
                    case "wrap":
                        var contentHeight = parseInt(this.content[0].scrollHeight);
                        var contentWidth = parseInt(this.content[0].scrollWidth);
                        break;
                    case "horizontalWrap":
                    case "horizontalwrap":
                        break;
                    case "verticalWrap":
                    case "verticalwrap":
                        var contentHeight = parseInt(this.content[0].scrollHeight);
                        break;
                }
            }
            if (this.rtl) {
                this.content.css('direction', 'ltr');
            }

            return { width: contentWidth, height: contentHeight };
        },

        _arrange: function (updateDefaultSize) {
            if (updateDefaultSize !== false) {
                if (this.width != null) {
                    this.host.width(this.width);
                }
                if (this.height != null) {
                    this.host.height(this.height);
                }
            }

            var scrollSize = this._getScrollSize();
            var width = this.host.width();
            var height = this.host.height();
            var contentArea = this._getScrollArea();
            var contentWidth = contentArea.width;
            var contentHeight = contentArea.height;
            var vScrollMaximum = contentHeight - parseInt(Math.round(this.host.height()));
            var hScrollMaximum = contentWidth - parseInt(Math.round(this.host.width()));
            // sync with user defined horizontalScrollBarMax and verticalScrollBarMax
            if (this.horizontalScrollBarMax != undefined) {
                hScrollMaximum = this.horizontalScrollBarMax;
            }
            if (this.verticalScrollBarMax != undefined) {
                vScrollMaximum = this.verticalScrollBarMax;
            }

            var updateVScrollVisibility = function (that, vScrollMaximum) {
                var borderOffset = 5;
                // update vertical scroll's visibility.
                if (vScrollMaximum > borderOffset) {
                    that.vScrollBar.jqxScrollBar({ 'max': vScrollMaximum });
                    that.vScrollBar.css('visibility', 'inherit');
                }
                else {
                    that.vScrollBar.jqxScrollBar('setPosition', 0);
                    that.vScrollBar.css('visibility', 'hidden');
                }
            }

            var updateHScrollVisibility = function (that, hScrollMaximum) {
                // update horizontal scroll's visibility.
                if (hScrollMaximum > 0) {
                    if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                        if (hScrollMaximum - 10 <= scrollSize) {
                            that.hScrollBar.css('visibility', 'hidden');
                            that.hScrollBar.jqxScrollBar('setPosition', 0);
                        }
                        else {
                            that.hScrollBar.jqxScrollBar({ 'max': hScrollMaximum + 4 });
                            that.hScrollBar.css('visibility', 'inherit');
                        }
                    }
                    else {
                        that.hScrollBar.jqxScrollBar({ 'max': hScrollMaximum + 4 });
                        that.hScrollBar.css('visibility', 'inherit');
                    }
                }
                else {
                    that.hScrollBar.css('visibility', 'hidden');
                    that.hScrollBar.jqxScrollBar('setPosition', 0);
                }
            }

            switch (this.sizeMode) {
                case "wrap":
                    this.host.width(contentWidth);
                    this.host.height(contentHeight);
                    this.vScrollBar.css('visibility', 'hidden');
                    this.hScrollBar.css('visibility', 'hidden');
                    return;
                case "horizontalWrap":
                case "horizontalwrap":
                    this.host.width(contentWidth);
                    this.hScrollBar.css('visibility', 'hidden');
                    updateVScrollVisibility(this, vScrollMaximum);
                    this._arrangeScrollbars(scrollSize, contentWidth, height);
                    return;
                case "verticalWrap":
                case "verticalwrap":
                    this.host.height(contentHeight);
                    this.vScrollBar.css('visibility', 'hidden');
                    updateHScrollVisibility(this, hScrollMaximum);
                    this._arrangeScrollbars(scrollSize, width, height);
                    return;
            }

            updateVScrollVisibility(this, vScrollMaximum);

            var borderSize = 2;
            // set maximum values.
            if (this.vScrollBar.css('visibility') != 'hidden') {
                if (this.horizontalScrollBarMax == undefined) {
                    if ((!this.isTouchDevice() && hScrollMaximum > 0) || (hScrollMaximum > 0)) {
                        hScrollMaximum += scrollSize + borderSize;
                    }
                }
            }
            updateHScrollVisibility(this, hScrollMaximum);

            if (this.hScrollBar.css('visibility') != 'hidden') {
                this.vScrollBar.jqxScrollBar({ 'max': vScrollMaximum + scrollSize + borderSize });
            }

            this._arrangeScrollbars(scrollSize, width, height);
        },

        _arrangeScrollbars: function (scrollSize, width, height) {
            var vscrollVisible = this.vScrollBar[0].style.visibility != 'hidden';
            var hscrollVisible = this.hScrollBar[0].style.visibility != 'hidden';

            var borderSize = 2;
            var scrollBorderSize = 2;

            this.hScrollBar.height(scrollSize);
            this.hScrollBar.css({ top: height - scrollSize - borderSize - scrollBorderSize + 'px', left: '0px' });
            this.hScrollBar.width(width - borderSize + 'px');

            this.vScrollBar.width(scrollSize);
            this.vScrollBar.height(parseInt(height) - borderSize + 'px');
            this.vScrollBar.css({ left: parseInt(width) - parseInt(scrollSize) - borderSize - scrollBorderSize + 'px', top: '0px' });
            if (this.rtl) {
                this.vScrollBar.css({ left: '0px' });
                var leftMargin = vscrollVisible ? parseInt(scrollSize) + 'px' : 0;
                if (this.content.children().css('direction') != 'rtl') {
                    var ie7 = false;
                    if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                        ie7 = true;
                    }
                    if (!ie7) {
                        this.content.css('padding-left', leftMargin);
                    }
                }
            }
            else {
                if (this.vScrollBar.css('visibility') != 'hidden') {
                    this.content.css('max-width', this.host.width() - this.vScrollBar.outerWidth());
                }
            }

            if ((this.vScrollBar.css('visibility') != 'hidden') && (this.hScrollBar.css('visibility') != 'hidden')) {
                this.bottomRight.css('visibility', 'inherit');
                this.bottomRight.css({ left: 1 + parseInt(this.vScrollBar.css('left')), top: 1 + parseInt(this.hScrollBar.css('top')) });
                this.bottomRight.width(parseInt(scrollSize) + 3);
                this.bottomRight.height(parseInt(scrollSize) + 3);
                if (this.rtl) {
                    this.bottomRight.css({ left: '0px' });
                    this.hScrollBar.css({ left: scrollSize + scrollBorderSize + 'px' });
                }
                this.hScrollBar.width(width - (1 * scrollSize) - borderSize - scrollBorderSize + 'px');
                this.vScrollBar.height(parseInt(height) - borderSize - scrollSize - scrollBorderSize + 'px');
            }
            else this.bottomRight.css('visibility', 'hidden');
            this.hScrollInstance.refresh();
            this.vScrollInstance.refresh();
        },

        destroy: function () {
            clearInterval(this.autoUpdateId);
            this.autoUpdateId = null;
            this.autoUpdate = false;
            $.jqx.utilities.resize(this.host, null, true);
            this._removeHandlers();
            this.removeHandler($(window), 'unload');
            this.vScrollBar.jqxScrollBar('destroy');
            this.hScrollBar.jqxScrollBar('destroy');
            this.host.remove();
        },

        _raiseevent: function (id, oldValue, newValue) {
            if (this.isInitialized != undefined && this.isInitialized == true) {
                var evt = this.events[id];
                var event = new $.Event(evt);
                event.previousValue = oldValue;
                event.currentValue = newValue;
                event.owner = this;
                var result = this.host.trigger(event);
                return result;
            }
        },

        beginUpdateLayout: function () {
            this.updating = true;
        },

        resumeUpdateLayout: function () {
            this.updating = false;
            this.vScrollInstance.value = 0;
            this.hScrollInstance.value = 0;
            this._arrange();
            this._render();
        },

        propertyChangedHandler: function (object, key, oldValue, value) {
            if (!object.isInitialized)
                return;

            if (key == 'rtl') {
                this.vScrollBar.jqxScrollBar({ rtl: value });
                this.hScrollBar.jqxScrollBar({ rtl: value });
                object._arrange();
            }

            if (!object.updating) {
                if (key == 'scrollBarSize' || key == 'width' || key == 'height') {
                    if (oldValue != value) {
                        object._arrange();
                    }
                }
            }
            if (key == 'touchMode') {
                if (value != 'auto') {
                    object._updateTouchScrolling();
                }
            }
            if (key == 'theme') {
                object.host.removeClass();
                object.host.addClass(this.toThemeProperty("jqx-panel"));
                object.host.addClass(this.toThemeProperty("jqx-widget"));
                object.host.addClass(this.toThemeProperty("jqx-widget-content"));
                object.host.addClass(this.toThemeProperty("jqx-rc-all"));
                object.vScrollBar.jqxScrollBar({ theme: this.theme });
                object.hScrollBar.jqxScrollBar({ theme: this.theme });
                object.bottomRight.removeClass();
                object.bottomRight.addClass(this.toThemeProperty('jqx-panel-bottomright'));
                object.bottomRight.addClass(this.toThemeProperty('jqx-scrollbar-state-normal'));
                object.content.removeClass();
                object.content.addClass(this.toThemeProperty('jqx-widget-content'));
            }
        },

        invalidate: function () {
            if ($.jqx.isHidden(this.host))
                return;

            this.refresh();
        },

        refresh: function (initialRefresh) {
            this._arrange();
        }
    });
})(jqxBaseFramework);
