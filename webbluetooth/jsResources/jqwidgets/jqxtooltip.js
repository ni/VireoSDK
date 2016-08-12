/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/



(function ($) {

    $.jqx.jqxWidget("jqxTooltip", "", {});

    $.extend($.jqx._jqxTooltip.prototype, {
        defineInstance: function () {
            var settings = {
                //// properties
                width: 'auto',
                height: 'auto',
                position: 'default', // possible values: top, bottom, left, right, top-left, bottom-left, top-right, bottom-right, absolute, mouse, mouseenter, default
                enableBrowserBoundsDetection: true, // possible values: true, false
                content: '',
                left: 0,
                top: 0,
                absolutePositionX: 0,
                absolutePositionY: 0,
                trigger: 'hover', // possible values: hover, click, none
                showDelay: 100,
                autoHide: true, // possible values: true, false
                autoHideDelay: 3000,
                closeOnClick: true, // possible values: true, false
                disabled: false, // possible values: true, false
                animationShowDelay: 200,
                animationHideDelay: 'fast',
                showArrow: true, // possible values: true, false
                name: '',
                opacity: 0.9,
                rtl: false,
                _isOpen: false,
                opening: null,
                value: null,
                _eventsMap: {
                    'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                    'mouseup': $.jqx.mobile.getTouchEventName('touchend')
                },

                //// events
                events: ['open', 'close', 'opening', 'closing']
            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();

            // creates an array based on the name property for storing tooltip IDs
            var id_array = $.data(document.body, "_tooltipIDArray" + this.name);
            if (!id_array) {
                this.ID_Array = new Array();
                $.data(document.body, "_tooltipIDArray" + this.name, this.ID_Array);
            } else {
                this.ID_Array = id_array;
            };

            // generates a new ID and adds it to an array, based on the name property
            var key = this._generatekey();
            var newID = 'jqxtooltip' + key;
            this.ID_Array.push({ tooltipID: newID, tooltipHost: this.host });

            // appends the tooltip div to the body
            var tooltipHTML = $('<div id="' + newID + '"><div id ="' + newID + 'Main"><div id="' + newID + 'Text"></div></div><div id="' + newID + 'Arrow"></div></div>');
            if ($.jqx.browser.msie) {
                tooltipHTML.addClass(this.toThemeProperty('jqx-noshadow'));
            }

            $("body").append(tooltipHTML);

            // sets the tooltips theme and classes
            this._setTheme();

            // hides the tooltip divs
            var $newID = $("#" + newID);
            $newID.css("visibility", "hidden");
            $newID.css("display", "none");
            $newID.css("opacity", 0);
            $newID.css("z-index", 99999);

            // hides the tooltip's arrow
            if (this.showArrow == false) {
                $("#" + newID + "Arrow").css("visibility", "hidden");
                $("#" + newID + "Arrow").css("display", "none");
            };

            // sets the width and height of the tooltip
            this._setSize();

            // sets the content of the tooltip
            this._setContent();

            //sets the initial position of the tooltip
            //            this._initialPosition();

            // triggers the tooltip
            if (this.disabled == false) {
                this._trigger();
                if (this.closeOnClick == true) {
                    this._clickHide();
                };
            };
        },

        //// public methods

        // opens (shows) the tooltip
        open: function () {
            if (arguments) {
                if (arguments.length) {
                    if (arguments.length == 2) {
                        this.position = "absolute";
                        this.left = arguments[0];
                        this.top = arguments[1];
                        this.absolutePositionX = arguments[0];
                        this.absolutePositionY = arguments[1];
                    }
                }
            }

            if (this.disabled == false && this._id() != "removed") {
                if (this.position == 'mouse' || this.position == 'mouseenter') {
                    var tempPosition = this.position;
                    this.position = 'default';
                    this._raiseEvent('2');
                    this._setPosition();
                    this._animateShow();
                    this.position = tempPosition;
                } else {
                    this._raiseEvent('2');
                    this._setPosition();
                    this._animateShow();
                };
            };
        },

        close: function (delay) {
            var me = this;
            if (typeof(delay) === 'object' && $.isEmptyObject(delay)) {
                delay = this.animationHideDelay;
            };
            var opacityValue = new Number($(this._id()).css("opacity")).toFixed(2);

            var hide = function () {
                clearTimeout(me.autoHideTimeout);
                me._raiseEvent('3');
                $(me._id()).animate({
                    opacity: 0
                }, delay, function () {
                    $(me._id()).css("visibility", "hidden");
                    $(me._id()).css("display", "none");
                    me._raiseEvent('1');
                    me._isOpen = false;
                });
            }

            if (this._isOpen == false && opacityValue != 0) {
                $(me._id()).stop();
                hide();
                return;
            }

            if (this._isOpen == true && opacityValue == this.opacity) {
                hide();
            };
        },

        // removes the tooltip
        destroy: function () {
            var length = this.ID_Array.length;
            this._removeHandlers();
            $(this._id()).remove();
            for (var i = 0; i < length; i++) {
                if (this.ID_Array[i].tooltipHost === this.host) {
                    this.ID_Array.splice(i, 1);
                    break;
                };
            };
            $(this.element).removeData('jqxTooltip');
        },

        //// private methods

        // refreshes the tooltip
        refresh: function (initialRefresh) {
            if (initialRefresh == true) {
                return;
            };

            if (this.rtl) {
                $(this._id() + 'Text').addClass(this.toThemeProperty('jqx-rtl'));
                $(this._id() + 'Text').css({ direction: 'rtl' });
            };

            var me = this;
            var opacityValue = new Number($(this._id()).css("opacity")).toFixed(2);
            if (this._id() != "removed") {
                if (this.disabled == true && this._isOpen == true && opacityValue == this.opacity) {
                    clearTimeout(this.autoHideTimeout);
                    $(this._id()).stop();
                    $(this._id()).animate({
                        opacity: 0
                    }, this.animationHideDelay, function () {
                        $(me._id()).css("visibility", "hidden");
                        $(me._id()).css("display", "none");
                        me._isOpen = false;
                    });
                };
                this._setTheme();
                this._setContent();
                this._setSize();
                if (this.position != 'mouse' && this.position != 'mouseenter') {
                    this._setPosition();
                };
                this._removeHandlers();
                if (this.disabled == false) {
                    this._trigger();
                    if (this.closeOnClick == true) {
                        this._clickHide();
                    };
                };
            };
        },

        // executed when a property is changed
        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key == "content") {
                this.changeContentFlag = true;
            };
            object.refresh();
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

        // generates a random number, used for unique id
        _generatekey: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };
            return (S4() + S4());
        },

        // selects the id of the current tooltip
        _id: function () {
            var ID_tmp, True_ID;
            var length = this.ID_Array.length;
            for (var i = 0; i < length; i++) {
                if (this.ID_Array[i].tooltipHost === this.host) {
                    ID_tmp = this.ID_Array[i].tooltipID;
                    True_ID = "#" + ID_tmp;
                    break;
                };
            };
            if (True_ID == undefined) {
                True_ID = "removed";
            };
            return True_ID;
        },

        // positions the tooltip
        _setPosition: function (event) {
            if ((this._isOpen == false && $(this._id()).css("opacity") == 0) || this.changeContentFlag == true) {
                if (!event && (this.position == "mouse" || this.position == "mouseenter")) {
                    return;
                };
                $(this._id()).css('display', 'block');
                this.changeContentFlag = false;
                this.documentTop = $(document).scrollTop();
                this.documentLeft = $(document).scrollLeft();
                this.windowWidth = $(window).width();
                this.windowHeight = $(window).height();

                this.host_width = this.host.outerWidth();
                this.host_height = this.host.outerHeight();
                this.tooltip_width = $(this._id()).width();
                this.tooltip_height = $(this._id()).height();
                this.host_offset = this.host.offset();
                this.tooltip_offset = $(this._id()).offset();
                this.default_offset = 30;

                this.offset_horizontal = parseInt(this.left); // horizontal offset
                this.offset_vertical = parseInt(this.top); // vertical offset

                var $arrow = $(this._id() + 'Arrow');
                var $main = $(this._id() + 'Main');

                this.arrow_size = 5; // defines the size of the tooltip arrow
                this.tooltip_main_offset = $main.offset();
                this.tooltip_arrow_offset;

                switch (this.position) {
                    case 'top':
                        this.tooltip_offset.left = this.host_offset.left + this.host_width / 2 - this.tooltip_width / 2 + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top - this.tooltip_height - this.arrow_size + this.offset_vertical;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.css({ "border-width": this.arrow_size + "px " + this.arrow_size + "px  0px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + (($main.width()) / 2 - this.arrow_size);
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + $main.height();
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'bottom':
                        this.tooltip_offset.left = this.host_offset.left + this.host_width / 2 - this.tooltip_width / 2 + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top + this.host_height + this.arrow_size + this.offset_vertical;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.css({ "border-width": "0 " + this.arrow_size + "px " + this.arrow_size + "px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + (($main.width()) / 2 - this.arrow_size);
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top - this.arrow_size;
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'left':
                        this.tooltip_offset.left = -1 + this.host_offset.left - this.tooltip_width - this.arrow_size + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top + this.host_height / 2 - this.tooltip_height / 2 + this.offset_vertical;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.css({ "border-width": this.arrow_size + "px 0px " + this.arrow_size + "px " + this.arrow_size + "px" });
                        this.tooltip_main_offset = $main.offset();
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = 1 + this.tooltip_main_offset.left + $main.width();
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + ($main.height()) / 2 - this.arrow_size;
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'right':
                        this.tooltip_offset.left = this.host_offset.left + this.host_width + this.arrow_size + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top + this.host_height / 2 - this.tooltip_height / 2 + this.offset_vertical;
                        this.tooltip_offset.top = parseInt(this.tooltip_offset.top);
                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.css({ "border-width": this.arrow_size + "px " + this.arrow_size + "px " + this.arrow_size + "px 0px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = (this.tooltip_main_offset.left - this.arrow_size);
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + ($main.height()) / 2 - this.arrow_size;
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'top-left':
                        this.tooltip_offset.left = this.host_offset.left + this.default_offset - this.tooltip_width + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top - this.tooltip_height - this.arrow_size + this.offset_vertical;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.css({ "border-width": this.arrow_size + "px " + this.arrow_size + "px  0px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + $main.width() - 6 * this.arrow_size;
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + $main.height();
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'bottom-left':
                        this.tooltip_offset.left = this.host_offset.left + this.default_offset - this.tooltip_width + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top + this.host_height + this.arrow_size + this.offset_vertical;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.css({ "border-width": "0 " + this.arrow_size + "px " + this.arrow_size + "px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + $main.width() - 6 * this.arrow_size;
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top - this.arrow_size;
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'top-right':
                        this.tooltip_offset.left = this.host_offset.left + this.host_width - this.default_offset + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top - this.tooltip_height - this.arrow_size + this.offset_vertical;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.css({ "border-width": this.arrow_size + "px " + this.arrow_size + "px  0px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + 4 * this.arrow_size;
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + $main.height();
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'bottom-right':
                        this.tooltip_offset.left = this.host_offset.left + this.host_width - this.default_offset + this.offset_horizontal;
                        this.tooltip_offset.top = this.host_offset.top + this.host_height + this.arrow_size + this.offset_vertical;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.css({ "border-width": "0 " + this.arrow_size + "px " + this.arrow_size + "px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + 4 * this.arrow_size;
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top - this.arrow_size;
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;

                    case 'absolute':
                        $(this._id()).offset({ top: this.absolutePositionY, left: this.absolutePositionX });

                        // arrow specifications, NO arrow
                        $arrow.css({ "border-width": "0px" });
                        break;

                    case 'mouse':
                        var me = this;
                        if (this._isTouchDevice == false) {
                            switch (this.trigger) {
                                case 'hover':
                                    if (this.mouseHoverTimeout) {
                                        clearTimeout(this.mouseHoverTimeout);
                                    }
                                    this.mouseHoverTimeout = setTimeout(function () {
                                        me.tooltip_offset.left = event.pageX + 10;
                                        me.tooltip_offset.top = event.pageY + 10;
                                        me._detectBrowserBounds();
                                    }, this.showDelay);
                                    break;
                                case 'click':
                                    this.tooltip_offset.left = event.pageX + 10;
                                    this.tooltip_offset.top = event.pageY + 10;
                                    this._detectBrowserBounds();
                                    break;
                            };
                        } else {
                            var x = event.pageX;
                            var y = event.pageY;
                            if (event.originalEvent) {
                                var touch = null;
                                if (event.originalEvent.touches && event.originalEvent.touches.length) {
                                    var touch = event.originalEvent.touches[0];
                                } else if (event.originalEvent.changedTouches && event.originalEvent.changedTouches.length) {
                                    var touch = event.originalEvent.changedTouches[0];
                                }
                                if (touch != undefined) {
                                    x = touch.pageX;
                                    y = touch.pageY;
                                }
                            }

                            this.tooltip_offset.left = x + 10;
                            this.tooltip_offset.top = y + 10;
                            this._detectBrowserBounds();
                        };

                        // arrow specifications, NO arrow
                        $arrow.css({ "border-width": "0px" });

                        break;

                    case 'mouseenter':
                        var mousecoordinates = { top: event.pageY, left: event.pageX };

                        // mouse from TOP
                        if ((mousecoordinates.top < (this.host_offset.top + 10)) && (mousecoordinates.top > (this.host_offset.top - 10))) {
                            this.tooltip_offset.left = mousecoordinates.left - this.tooltip_width / 2;
                            this.tooltip_offset.top = this.host_offset.top - this.tooltip_height - this.arrow_size;

                            this._detectBrowserBounds();

                            // arrow specifications, the same as TOP arrow
                            this.tooltip_main_offset = $main.offset();
                            $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                            $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                            $arrow.css({ "border-width": this.arrow_size + "px " + this.arrow_size + "px  0px" });
                            this.tooltip_arrow_offset = $arrow.offset();
                            this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + (($main.width()) / 2 - this.arrow_size);
                            this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + $main.height();
                            $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        }
                            // mouse from BOTTOM
                        else if ((mousecoordinates.top < ((this.host_offset.top + this.host_height) + 10)) && (mousecoordinates.top > ((this.host_offset.top + this.host_height) - 10))) {
                            this.tooltip_offset.left = mousecoordinates.left - this.tooltip_width / 2;
                            this.tooltip_offset.top = this.host_offset.top + this.host_height + this.arrow_size;

                            this._detectBrowserBounds();

                            // arrow specifications, the same as BOTTOM arrow
                            this.tooltip_main_offset = $main.offset();
                            $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                            $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                            $arrow.css({ "border-width": "0 " + this.arrow_size + "px " + this.arrow_size + "px" });
                            this.tooltip_arrow_offset = $arrow.offset();
                            this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + (($main.width()) / 2 - this.arrow_size);
                            this.tooltip_arrow_offset.top = this.tooltip_main_offset.top - this.arrow_size;
                            $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        }
                            // mouse from LEFT
                        else if ((mousecoordinates.left < (this.host_offset.left + 10)) && (mousecoordinates.left > (this.host_offset.left - 10))) {
                            this.tooltip_offset.left = this.host_offset.left - this.tooltip_width - this.arrow_size;
                            this.tooltip_offset.top = mousecoordinates.top - this.tooltip_height / 2;

                            this._detectBrowserBounds();

                            // arrow specifications, the same as LEFT arrow
                            this.tooltip_main_offset = $main.offset();
                            $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                            $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                            $arrow.css({ "border-width": this.arrow_size + "px 0px " + this.arrow_size + "px " + this.arrow_size + "px" });
                            this.tooltip_main_offset = $main.offset();
                            this.tooltip_arrow_offset = $arrow.offset();
                            this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + $main.width();
                            this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + ($main.height()) / 2 - this.arrow_size;
                            $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        }
                            // mouse from RIGHT
                        else if ((mousecoordinates.left < (this.host_offset.left + this.host_width + 10)) && (mousecoordinates.left > (this.host_offset.left + this.host_width - 10))) {
                            this.tooltip_offset.left = this.host_offset.left + this.host_width + this.arrow_size;
                            this.tooltip_offset.top = mousecoordinates.top - this.tooltip_height / 2;

                            this._detectBrowserBounds();

                            // arrow specifications, the same as RIGHT arrow
                            this.tooltip_main_offset = $main.offset();
                            $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                            $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                            $arrow.css({ "border-width": this.arrow_size + "px " + this.arrow_size + "px " + this.arrow_size + "px 0px" });
                            this.tooltip_main_offset = $main.offset();
                            this.tooltip_arrow_offset = $arrow.offset();
                            this.tooltip_arrow_offset.left = (this.tooltip_main_offset.left - this.arrow_size);
                            this.tooltip_arrow_offset.top = this.tooltip_main_offset.top + ($main.height()) / 2 - this.arrow_size;
                            $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        };
                        break;

                    case 'default':

                        // similar to 'bottom-right' but without this.offset_horizontal and this.offset_vertical
                        this.tooltip_offset.left = this.host_offset.left + this.host_width - this.default_offset;
                        this.tooltip_offset.top = this.host_offset.top + this.host_height + this.arrow_size;

                        this._detectBrowserBounds();

                        // arrow specifications
                        this.tooltip_main_offset = $main.offset();
                        $arrow.removeClass(this.toThemeProperty("jqx-tooltip-arrow-l-r"));
                        $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow-t-b"));
                        $arrow.css({ "border-width": "0 " + this.arrow_size + "px " + this.arrow_size + "px" });
                        this.tooltip_arrow_offset = $arrow.offset();
                        this.tooltip_arrow_offset.left = this.tooltip_main_offset.left + 4 * this.arrow_size;
                        this.tooltip_arrow_offset.top = this.tooltip_main_offset.top - this.arrow_size;
                        $arrow.offset({ top: this.tooltip_arrow_offset.top, left: this.tooltip_arrow_offset.left });
                        break;
                };
            };
        },

        // sets the content of the tooltip
        _setContent: function () {
            $(this._id() + 'Text').html(this.content);
        },

        opened: function () {
            return this._isOpen && this.host.css('display') == 'block' && this.host.css('visibility') == 'visible';
        },

        // shows the tooltip with animation
        _animateShow: function () {
            this._closeAll();
            clearTimeout(this.autoHideTimeout);
            var opacityValue = new Number($(this._id()).css("opacity")).toFixed(2);
            if (this._isOpen == false && opacityValue == 0) {
                var me = this;
                var $id = $(this._id());
                $id.css("visibility", "visible");
                $id.css("display", "block");
                $id.stop();
                $id.css('opacity', 0);
                if (this.opening) {
                    var canOpen = this.opening(this);
                    if (canOpen === false)
                        return;
                }

                $id.animate({
                    opacity: this.opacity
                }, this.animationShowDelay, function () {
                    me._raiseEvent('0');
                    me._isOpen = true;

                    // creates a variable, showing the instance of the opened tooltip
                    var opened_tooltip = $.data(document.body, "_openedTooltip" + me.name);

                    me.openedTooltip = me;
                    $.data(document.body, "_openedTooltip" + me.name, me);
                    if (me.autoHideTimeout) clearTimeout(me.autoHideTimeout);
                    if (me.autoHideDelay > 0 && me.autoHide === true) {
                        me.autoHideTimeout = setTimeout(function () {
                            me._autoHide();
                        }, me.autoHideDelay);
                    }
                });
            };
        },

        // triggers the tooltip
        _trigger: function () {
            if (this._id() != "removed") {
                this._enterFlag;
                this._leaveFlag;
                var me = this;
                if (this._isTouchDevice == false) {
                    switch (this.trigger) {
                        case 'hover':
                            if (this.position == 'mouse') {
                                this.addHandler(this.host, 'mousemove.tooltip', function (event) {
                                    if (me._enterFlag == 1) {
                                        me._raiseEvent('2');
                                        me._setPosition(event);
                                        clearTimeout(me.hoverShowTimeout);
                                        me.hoverShowTimeout = setTimeout(function () {
                                            me._animateShow();
                                            me._enterFlag = 0;
                                        }, me.showDelay);
                                    }
                                });
                                this.addHandler(this.host, 'mouseenter.tooltip', function () {
                                    if (me._leaveFlag != 0) {
                                        me._enterFlag = 1;
                                    };
                                });
                                this.addHandler(this.host, 'mouseleave.tooltip', function (event) {
                                    me._leaveFlag = 1;
                                    clearTimeout(me.hoverShowTimeout);

                                    var tooltipbounds = $(me._id()).offset();
                                    var width = $(me._id()).width();
                                    var height = $(me._id()).height();

                                    if (parseInt(event.pageX) < parseInt(tooltipbounds.left) || parseInt(event.pageX) > parseInt(tooltipbounds.left) + width) {
                                        me.close();
                                    }
                                    if (parseInt(event.pageY) < parseInt(tooltipbounds.top) || parseInt(event.pageY) > parseInt(tooltipbounds.top) + height) {
                                        me.close();
                                    }
                                });
                                this.addHandler($(this._id()), 'mouseleave.tooltip', function (event) {
                                    me._checkBoundariesAuto(event);
                                    if (me._clickFlag != 0 && me._autoFlag != 0) {
                                        me._leaveFlag = 0;
                                    } else {
                                        me._leaveFlag = 1;
                                        me.close();
                                    };
                                });
                            } else {
                                this.addHandler(this.host, 'mouseenter.tooltip', function (event) {
                                    clearTimeout(me.hoverShowTimeout);
                                    me.hoverShowTimeout = setTimeout(function () {
                                        me._raiseEvent('2');
                                        me._setPosition(event);
                                        me._animateShow();
                                    }, me.showDelay);
                                });
                                this.addHandler(this.host, 'mouseleave.tooltip', function (event) {
                                    me._leaveFlag = 1;
                                    clearTimeout(me.hoverShowTimeout);

                                    if (me.autoHide) {
                                        var x = event.pageX;
                                        var y = event.pageY;
                                        var tooltipbounds = $(me._id()).offset();
                                        var left = tooltipbounds.left;
                                        var top = tooltipbounds.top;
                                        var width = $(me._id()).width();
                                        var height = $(me._id()).height();

                                        if (parseInt(x) < parseInt(left) || parseInt(x) > parseInt(left) + width || parseInt(y) < parseInt(top) || parseInt(y) > parseInt(top) + height) {
                                            me.close();
                                        };
                                    };
                                });
                                this.addHandler($(this._id()), 'mouseleave.tooltip', function (event) {
                                    me._checkBoundariesAuto(event);
                                    if (me._clickFlag != 0 && me._autoFlag != 0) {
                                        me._leaveFlag = 0;
                                    } else {
                                        me._leaveFlag = 1;
                                        if (me.autoHide) {
                                            me.close();
                                        }
                                    };
                                });
                            };
                            break;
                        case 'click':
                            this.addHandler(this.host, 'click.tooltip', function (event) {
                                if (me.position == 'mouseenter') {
                                    me.position = 'mouse';
                                };
                                me._raiseEvent('2');
                                me._setPosition(event);
                                me._animateShow();
                            });
                            break;
                        case 'none':
                            break;
                    };
                } else {
                    // if the device is touch
                    if (this.trigger != "none") {
                        this.addHandler(this.host, 'touchstart.tooltip', function (event) {
                            if (me.position == 'mouseenter') {
                                me.position = 'mouse';
                            };
                            me._raiseEvent('2');
                            me._setPosition(event);
                            me._animateShow();
                        });
                    };
                };
            };
        },

        // automatically hides the tooltip
        _autoHide: function () {
            var me = this;

            var opacityValue = new Number($(this._id()).css("opacity")).toFixed(2);
            if (this.autoHide == true && this._isOpen == true && opacityValue >= this.opacity) {
                me._raiseEvent('3');
                $(me._id()).animate({
                    opacity: 0
                }, me.animationHideDelay, function () {
                    $(me._id()).css("visibility", "hidden");
                    $(me._id()).css("display", "none");
                    me._raiseEvent('1');
                    me._isOpen = false;
                });
            };
        },

        // hides the tooltip when it is clicked
        _clickHide: function () {
            var me = this;
            this.addHandler($(this._id()), 'click.tooltip', function (event) {
                me._checkBoundariesClick(event);
                me.close();
            });
        },

        // sets the width and height of the tooltip
        _setSize: function () {
            $(this._id()).css({ "width": this.width, "height": this.height });
        },

        resize: function () {
            this._setSize();
        },

        // sets the tooltips theme and classes
        _setTheme: function () {
            var id = this._id();
            var $main = $(id + 'Main');
            var $text = $(id + 'Text');
            var $arrow = $(id + 'Arrow');

            $main.addClass(this.toThemeProperty("jqx-widget"));
            $text.addClass(this.toThemeProperty("jqx-widget"));
            $arrow.addClass(this.toThemeProperty("jqx-widget"));

            $main.addClass(this.toThemeProperty("jqx-fill-state-normal"));
            $text.addClass(this.toThemeProperty("jqx-fill-state-normal"));
            $arrow.addClass(this.toThemeProperty("jqx-fill-state-normal"));

            $(id).addClass(this.toThemeProperty("jqx-tooltip"));
            $(id).addClass(this.toThemeProperty("jqx-popup"));
            $main.addClass(this.toThemeProperty("jqx-tooltip-main"));
            $text.addClass(this.toThemeProperty("jqx-tooltip-text"));
            $arrow.addClass(this.toThemeProperty("jqx-tooltip-arrow"));
        },

        // sets the initial position of the tooltip as 'default'
        _initialPosition: function () {
            var tempPosition = this.position;
            this.position = 'default';
            this._setPosition();
            this.position = tempPosition;
        },

        // checks the tooltip for browser bounds conflicts and sets the tooltip's offset accordingly (if enableBrowserBoundsDetection == true), otherwise just sets the tooltip's offset
        _detectBrowserBounds: function () {
            var id = this._id();
            if (this.enableBrowserBoundsDetection) {
                // top and left
                if (this.tooltip_offset.top < this.documentTop && this.tooltip_offset.left < 0) {
                    $(id).offset({ top: this.documentTop, left: this.documentLeft });
                    // top and right
                } else if (this.tooltip_offset.top < this.documentTop && (this.tooltip_offset.left + this.tooltip_width) > this.windowWidth + this.documentLeft) {
                    $(id).offset({ top: this.documentTop, left: (this.windowWidth + this.documentLeft - this.tooltip_width) });
                    // top
                } else if (this.tooltip_offset.top < this.documentTop) {
                    $(id).offset({ top: this.documentTop, left: this.tooltip_offset.left });
                    // bottom and left
                } else if ((this.tooltip_offset.top + this.tooltip_height) > (this.windowHeight + this.documentTop) && this.tooltip_offset.left < 0) {
                    $(id).offset({ top: (this.windowHeight + this.documentTop - this.tooltip_height), left: this.documentLeft });
                    // bottom and right
                } else if ((this.tooltip_offset.top + this.tooltip_height) > (this.windowHeight + this.documentTop) && (this.tooltip_offset.left + this.tooltip_width) > this.windowWidth + this.documentLeft) {
                    $(id).offset({ top: (this.windowHeight + this.documentTop - this.tooltip_height), left: (this.windowWidth + this.documentLeft - this.tooltip_width) });
                    // bottom
                } else if ((this.tooltip_offset.top + this.tooltip_height) > (this.windowHeight + this.documentTop)) {
                    $(id).offset({ top: (this.windowHeight + this.documentTop - this.tooltip_height), left: this.tooltip_offset.left });
                    // left
                } else if (this.tooltip_offset.left < 0) {
                    $(id).offset({ top: this.tooltip_offset.top, left: this.documentLeft });
                    // right
                } else if ((this.tooltip_offset.left + this.tooltip_width) > this.windowWidth + this.documentLeft) {
                    $(id).offset({ top: this.tooltip_offset.top, left: (this.windowWidth + this.documentLeft - this.tooltip_width) });
                    // no conflict
                } else {
                    $(id).offset({ top: this.tooltip_offset.top, left: this.tooltip_offset.left });
                };
                // if enableBrowserBoundsDetection == false, the same as no conflict case
            } else {
                $(id).offset({ top: this.tooltip_offset.top, left: this.tooltip_offset.left });
            };
        },

        // checks if a mouseevent was within the boundaries of the host
        _checkBoundaries: function (event) {
            if (event.pageX >= this.host_offset.left && event.pageX <= (this.host_offset.left + this.host_width) && event.pageY >= this.host_offset.top && event.pageY <= (this.host_offset.top + this.host_height)) {
                return true;
            } else {
                return false;
            };
        },

        // checks if a click was within the boundaries of the host
        _checkBoundariesClick: function (event) {
            if (this._checkBoundaries(event)) {
                this._clickFlag = 1;
            } else {
                this._clickFlag = 0;
            };
        },

        // checks if the mouse was was within the boundaries of the host when the tooltip was automatically closed
        _checkBoundariesAuto: function (event) {
            if (this._checkBoundaries(event)) {
                this._autoFlag = 1;
            } else {
                this._autoFlag = 0;
            };
        },

        // removes all event handlers
        _removeHandlers: function () {
            this.removeHandler(this.host, 'mouseenter.tooltip');
            this.removeHandler(this.host, 'mousemove.tooltip');
            this.removeHandler(this.host, 'mouseleave.tooltip');
            this.removeHandler(this.host, 'click.tooltip');
            this.removeHandler(this.host, 'touchstart.tooltip');
            this.removeHandler($(this._id()), 'click.tooltip');
            this.removeHandler($(this._id()), 'mouseleave.tooltip');
        },

        // closes all tooltips, created together
        _closeAll: function () {
            var length = this.ID_Array.length;
            for (var i = 0; i < length; i++) {
                var itterationID = "#" + this.ID_Array[i].tooltipID;
                if (itterationID != this._id()) {
                    $(itterationID).css({ opacity: 0, visibility: "hidden", display: "none" });
                    this._isOpen = false;
                };
            };
        }
    });
})(jqxBaseFramework);
