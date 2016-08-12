/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget('jqxSplitter', '', {});

    $.extend($.jqx._jqxSplitter.prototype, {

        defineInstance: function () {
            var settings = {
                // Type: Number
                // Default: null
                // Gets or sets the splitter's width.
                width: 300,
                // Type: height
                // Default: null
                // Gets or sets the splitter's height.
                height: 300,
                // Type: Array
                // Default: []
                // Sets or gets properties for all the panels
                panels: [],
                // Type: String
                // Default: vertical
                // Sets or gets splitter's orientation
                orientation: 'vertical',
                // Type: Bool
                // Default: false
                // Sets or gets whether the splitter is disabled
                disabled: false,
                // Type: Number/String
                // Default: 5
                // Sets or gets splitbar's size
                splitBarSize: 5,
                // Type: Number
                // Default: 15
                // Sets or gets splitter's split bar size when a touch device is used
                touchSplitBarSize: 15,
                panel1: null,
                panel2: null,
                _eventsMap: {
                    'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                    'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
                    'mousemove': $.jqx.mobile.getTouchEventName('touchmove'),
                    'mouseenter': 'mouseenter',
                    'mouseleave': 'mouseleave'
                },
                _isTouchDevice: false,
                _isNested: false,
                resizable: true,
                touchMode: 'auto',
                showSplitBar: true,
                initContent: null,
                _events: ['resize', 'expanded', 'collapsed', 'resizeStart', 'layout']
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            this.render();
        },

        _initOverlay: function (create) {
            if (this.overlay || create == 'undefined') {
                this.overlay.remove();
                this.overlay = null;
            }
            else if (create == true) {
                this.overlay = $("<div style='z-index: 100; background: #fff;'></div>");
                this.overlay.css('opacity', 0.01);
                this.overlay.css('position', 'absolute');
                this.overlay.appendTo($(document.body));
                var offset = this.host.coord();
                this.overlay.css('left', "0px");
                this.overlay.css('top', "0px");
                this.overlay.width($(window).width());
                this.overlay.height($(window).height());

                this.overlay.addClass('jqx-disableselect');
                if (this.orientation == "horizontal") {
                    this.overlay.css('cursor', 'row-resize');
                }
                else {
                    this.overlay.css('cursor', 'col-resize');
                }
            }
        },

        _startDrag: function (event) {
            if (event.target == this.splitBarButton[0] || this.disabled)
                return true;

            if (this.panels[0].collapsed || this.panels[1].collapsed || !this.resizable)
                return true;

            if (this.overlay == null) {
                this._dragging = true;
                this._initOverlay(true);
                this._dragStart = $.jqx.position(event);
                return false;
            }
            return true;
        },

        _drag: function (event) {
            if (this.panels[0].collapsed || this.panels[1].collapsed || this.disabled)
                return true;

            if (!this._dragging)
                return true;

            var positionProperty = this.orientation == "horizontal" ? "top" : "left";
            var sizeProperty = this.orientation == "vertical" ? "width" : "height";
            this._position = $.jqx.position(event);

            if (this.overlay && !this._splitBarClone) {
                if (Math.abs(this._position[positionProperty] - this._dragStart[positionProperty]) >= 3) {
                    var cloneOffset = this.splitBar.coord();
                    this._cloneStart = { left: cloneOffset.left, top: cloneOffset.top };
                    this._splitBarClone = this._createSplitBarClone();
                    this._raiseEvent(3, { panels: this.panels });
                    return;
                }
            }
            if (this._splitBarClone) {
                var firstMin, secondMin;
                var hostSize = this.host[sizeProperty]();
                var onePercent = hostSize / 100;
                var onePixelToPercentage = 1 / onePercent; // one pixel is equal to this amount of percentages.
                var hostPosition = 0;
                var splitterSize = this._splitBarClone[sizeProperty]() + 2;
                var hostOffset = parseInt(this.host.coord()[positionProperty]);

                var position = this._position[positionProperty] - this._dragStart[positionProperty] + this._cloneStart[positionProperty] - hostOffset;

                if (hostPosition > position) {
                    position = hostPosition;
                }
                if (position > hostSize + hostPosition - splitterSize) {
                    position = hostSize + hostPosition - splitterSize;
                }

                firstMin = this.panels[0].min;
                secondMin = this.panels[1].min;

                if (secondMin.toString().indexOf("%") != -1) {
                    secondMin = parseFloat(secondMin) * onePercent;
                }
                if (firstMin.toString().indexOf("%") != -1) {
                    firstMin = parseFloat(firstMin) * onePercent;
                }

                this._splitBarClone.removeClass(this.toThemeProperty("jqx-splitter-splitbar-invalid"));

                if (position < firstMin) {
                    this._splitBarClone.addClass(this.toThemeProperty("jqx-splitter-splitbar-invalid"));
                    position = firstMin;
                }

                if (position > hostSize + hostPosition - splitterSize - secondMin) {
                    this._splitBarClone.addClass(this.toThemeProperty("jqx-splitter-splitbar-invalid"));
                    position = hostSize + hostPosition - splitterSize - secondMin;
                }

                this._splitBarClone.css(positionProperty, position);

                if (event.preventDefault) {
                    event.preventDefault();
                }
                if (event.stopPropagation) {
                    event.stopPropagation();
                }
                return false;
            }
            return true;
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this._arrange();
        },

        _resize: function () {
            var sizeProperty = this.orientation == "horizontal" ? "height" : "width";
            var positionProperty = this.orientation == "horizontal" ? "top" : "left";
            var splitBarPosition = this._splitBarClone.css(positionProperty);
            var hostSize = this.host[sizeProperty]();
            var onePercent = hostSize / 100;
            var onePixelToPercentage = 1 / onePercent; // one pixel is equal to this amount of percentages.
            var size = this.panels[0].size;

            if (size.toString().indexOf('%') != -1) {
                this.panels[0].size = parseFloat(splitBarPosition) * onePixelToPercentage + '%';
            }
            else {
                this.panels[0].size = parseFloat(splitBarPosition);
            }
            this._layoutPanels();
            this._raiseEvent(0, { panels: this.panels });
        },

        _stopDrag: function () {
            if (this._dragging) {
                this._initOverlay();
            }
            this._dragging = false;
            if (this._splitBarClone) {
                if (this.panels[0].collapsed || this.panels[1].collapsed || this.disabled)
                    return true;

                this._resize();
                this._splitBarClone.remove();
                this._splitBarClone = null;
            }
        },

        _createSplitBarClone: function () {
            var clone = this.splitBar.clone();

            clone.fadeTo(0, 0.7);
            clone.css('z-index', 99999);
            if (this.orientation == "vertical") {
                clone.css('cursor', 'col-resize');
            }
            else {
                clone.css('cursor', 'row-resize');
            }

            this.host.append(clone);
            return clone;
        },

        _eventName: function (name) {
            if (this._isTouchDevice) {
                return this._eventsMap[name];
            } else {
                return name;
            }
        },

        _addHandlers: function () {
            var that = this;
            $.jqx.utilities.resize(this.host, function () {
                that._layoutPanels();
            });

            this.addHandler(this.splitBar, 'dragstart.' + this.element.id, function (event) {
                return false;
            });

            if (this.splitBarButton) {
                this.addHandler(this.splitBarButton, 'click.' + this.element.id, function () {
                    var toggle = function (panel) {
                        if (!panel.collapsed) {
                            that.collapse();
                        }
                        else {
                            that.expand();
                        }
                    }

                    if (that.panels[0].collapsible) {
                        toggle(that.panels[0]);
                    }
                    else if (that.panels[1].collapsible) {
                        toggle(that.panels[1]);
                    }
                });
                this.addHandler(this.splitBarButton, this._eventName('mouseenter'), function () {
                    that.splitBarButton.addClass(that.toThemeProperty('jqx-splitter-collapse-button-hover'));
                    that.splitBarButton.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                });
                this.addHandler(this.splitBarButton, this._eventName('mouseleave'), function () {
                    that.splitBarButton.removeClass(that.toThemeProperty('jqx-splitter-collapse-button-hover'));
                    that.splitBarButton.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                });
            }

            this.addHandler($(document), this._eventName('mousemove') + '.' + this.element.id, function (event) {
                return that._drag(event);
            });

            this.addHandler($(document), this._eventName('mouseup') + '.' + this.element.id, function () {
                return that._stopDrag();
            });

            this.addHandler(this.splitBar, this._eventName('mousedown'), function (event) {
                return that._startDrag(event);
            });

            this.addHandler(this.splitBar, this._eventName('mouseenter'), function () {
                if (that.resizable && !that.disabled) {
                    that.splitBar.addClass(that.toThemeProperty('jqx-splitter-splitbar-hover'));
                    that.splitBar.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                }
            });
            this.addHandler(this.splitBar, this._eventName('mouseleave'), function () {
                if (that.resizable && !that.disabled) {
                    that.splitBar.removeClass(that.toThemeProperty('jqx-splitter-splitbar-hover'));
                    that.splitBar.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                }
            });

            if (document.referrer != "" || window.frameElement) {
                if (window.top != null && window.top != window.self) {
                    var parentLocation = null;
                    if (window.parent && document.referrer) {
                        parentLocation = document.referrer;
                    }

                    if (parentLocation && parentLocation.indexOf(document.location.host) != -1) {
                        var eventHandle = function (event) {
                            that._stopDrag();
                        };

                        if (window.top.document.addEventListener) {
                            window.top.document.addEventListener('mouseup', eventHandle, false);

                        } else if (window.top.document.attachEvent) {
                            window.top.document.attachEvent("on" + 'mouseup', eventHandle);
                        }
                    }
                }
            }
        },

        _removeHandlers: function () {
            this.removeHandler($(window), 'resize.' + this.element.id);
            if (this.splitBarButton) {
                this.removeHandler(this.splitBarButton, 'click.' + this.element.id);
                this.removeHandler(this.splitBarButton, this._eventName('mouseenter'));
                this.removeHandler(this.splitBarButton, this._eventName('mouseleave'));
            }
            this.removeHandler($(document), this._eventName('mousemove') + '.' + this.element.id);
            this.removeHandler($(document), this._eventName('mouseup') + '.' + this.element.id);
            if (this.splitBar) {
                this.removeHandler(this.splitBar, 'dragstart.' + this.element.id);
                this.removeHandler(this.splitBar, this._eventName('mousedown'));
                this.removeHandler(this.splitBar, this._eventName('mouseenter'));
                this.removeHandler(this.splitBar, this._eventName('mouseleave'));
            }
        },

        render: function () {
            if (this.splitBar) {
                this.splitBar.remove();
            }

            var children = this.host.children();
            if (children.length != 2) {
                throw "Invalid HTML Structure! jqxSplitter requires 1 container DIV tag and 2 nested DIV tags.";
            }

            if (children.length == 2) {
                var classNames = children[0].className.split(' ');
                var classNames2 = children[1].className.split(' ');
                if (classNames.indexOf('jqx-reset') != -1 && classNames.indexOf('jqx-splitter') != -1 && classNames.indexOf('jqx-widget') != -1) {
                    throw "Invalid HTML Structure! Nested jqxSplitter cannot be initialized from a Splitter Panel. You need to add a new DIV tag inside the Splitter Panel and initialize the nested jqxSplitter from it!";
                }
                if (classNames2.indexOf('jqx-reset') != -1 && classNames2.indexOf('jqx-splitter') != -1 && classNames2.indexOf('jqx-widget') != -1) {
                    throw "Invalid HTML Structure! Nested jqxSplitter cannot be initialized from a Splitter Panel. You need to add a new DIV tag inside the Splitter Panel and initialize the nested jqxSplitter from it!";
                }
            }

            if (this.host.parent().length > 0 && this.host.parent()[0].className.indexOf('jqx-splitter') != -1) {
                if (this.element.className.indexOf('jqx-splitter-panel') != -1) {
                    throw "Invalid HTML Structure! Nested jqxSplitter cannot be initialized from a Splitter Panel. You need to add a new DIV tag inside the Splitter Panel and initialize the nested jqxSplitter from it!";
                }
                this._isNested = true;
                if (this.width == 300) this.width = "100%";
                if (this.height == 300) this.height = "100%";
                if (this.width == '100%' && this.height == '100%') {
                    this.host.addClass('jqx-splitter-nested');
                    if (this.host.parent()[0].className.indexOf('jqx-splitter-panel') != -1) {
                        this.host.parent().addClass('jqx-splitter-panel-nested');
                    }
                }
            }

            this._hasBorder = (this.host.hasClass('jqx-hideborder') == false) || this.element.style.borderTopWidth != "";
            this._removeHandlers();
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();

            this._validate();

            this.panel1.css('left', '0px');
            this.panel1.css('top', '0px');
            this.panel2.css('left', '0px');
            this.panel2.css('top', '0px');

            this.splitBar = $("<div><div></div></div>");
            if (!this.resizable) {
                this.splitBar.css('cursor', 'default');
            }
            this.splitBarButton = this.splitBar.find('div:last');
            this._setTheme();
            this.splitBar.insertAfter(this.panel1);
            this._arrange();

            if (this.panels[0].collapsible == false && this.panels[1].collapsible == false) {
                this.splitBarButton.hide();
            }

            var that = this;
            this._addHandlers();

            if (this.initContent) {
                this.initContent();
            }
            if (this.disabled) {
                this.disable();
            }
        },

        _hiddenParent: function () {
            return $.jqx.isHidden(this.host);
        },

        _setTheme: function () {
            this.panel1.addClass(this.toThemeProperty('jqx-widget-content'));
            this.panel2.addClass(this.toThemeProperty('jqx-widget-content'));
            this.panel1.addClass(this.toThemeProperty('jqx-splitter-panel'));
            this.panel2.addClass(this.toThemeProperty('jqx-splitter-panel'));
            this.panel1.addClass(this.toThemeProperty('jqx-reset'));
            this.panel2.addClass(this.toThemeProperty('jqx-reset'));
            this.host.addClass(this.toThemeProperty('jqx-reset'));
            this.host.addClass(this.toThemeProperty('jqx-splitter'));
            this.host.addClass(this.toThemeProperty('jqx-widget'));
            this.host.addClass(this.toThemeProperty('jqx-widget-content'));
            this.splitBar.addClass(this.toThemeProperty('jqx-splitter-splitbar-' + this.orientation));
            this.splitBar.addClass(this.toThemeProperty('jqx-fill-state-normal'));
            this.splitBarButton.addClass(this.toThemeProperty('jqx-splitter-collapse-button-' + this.orientation));
            this.splitBarButton.addClass(this.toThemeProperty('jqx-fill-state-pressed'));
        },

        _validate: function () {
            var children = this.host.children();
            if (children.length != 2) {
                throw "Invalid HTML Structure! jqxSplitter requires two nested DIV tags!";
            }

            if (this.panels && !this.panels[1]) {
                if (!this.panels[0]) {
                    this.panels = [{ size: '50%' }, { size: '50%' }];
                }
                else {
                    this.panels[1] = {};
                }
            }
            else if (this.panels == undefined) {
                this.panels = [{ size: '50%' }, { size: '50%' }];
            }

            var children = this.host.children();
            this.panel1 = this.panels[0].element = $(children[0]);
            this.panel2 = this.panels[1].element = $(children[1]);
            this.panel1[0].style.minWidth = "";
            this.panel1[0].style.maxWidth = "";
            this.panel2[0].style.minWidth = "";
            this.panel2[0].style.maxWidth = "";

            $.each(this.panels, function () {
                if (this.min == undefined) this.min = 0;
                if (this.size == undefined) this.size = 0;
                if (this.size < 0) this.size = 0;
                if (this.min < 0) this.min = 0;
                if (this.collapsible == undefined) this.collapsible = true;
                if (this.collapsed == undefined) this.collapsed = false;

                if (this.size != 0) {
                    if (this.size.toString().indexOf('px') != -1) {
                        this.size = parseInt(this.size);
                    }

                    if (this.size.toString().indexOf('%') == -1) {
                        if (parseInt(this.min) > parseInt(this.size)) {
                            this.min = this.size;
                        }
                    }
                    else if (this.min.toString().indexOf('%') != -1) {
                        if (parseInt(this.min) > parseInt(this.size)) {
                            this.min = this.size;
                        }
                    }
                }
            });
        },

        _arrange: function () {
            if (this.width != null) {
                var width = this.width;
                if (typeof width != "string") width = parseInt(this.width) + 'px';
                this.host.css('width', width);
            }
            if (this.height != null) {
                var height = this.height;
                if (typeof height != "string") height = parseInt(this.height) + 'px';
                this.host.css('height', height);
            }
            this._splitBarSize = !this._isTouchDevice ? this.splitBarSize : this.touchSplitBarSize;
            if (!this.showSplitBar) {
                this._splitBarSize = 0;
                this.splitBar.hide();
            }
            var sizeProperty = this.orientation == "horizontal" ? "width" : "height";

            this.splitBar.css(sizeProperty, '100%');
            this.panel1.css(sizeProperty, '100%');
            this.panel2.css(sizeProperty, '100%');

            if (this.orientation == "horizontal") {
                this.splitBar.height(this._splitBarSize);
            }
            else {
                this.splitBar.width(this._splitBarSize);
            }

            if (this.orientation === 'vertical') {
                this.splitBarButton.width(this._splitBarSize);
                this.splitBarButton.height(45);
            }
            else {
                this.splitBarButton.height(this._splitBarSize);
                this.splitBarButton.width(45);
            }

            this.splitBarButton.css('position', 'relative');
            if (this.orientation === 'vertical') {
                this.splitBarButton.css('top', '50%');
                this.splitBarButton.css('left', '0');
                this.splitBarButton.css('margin-top', '-23px');
                this.splitBarButton.css('margin-left', '-0px');
            }
            else {
                this.splitBarButton.css('left', '50%');
                this.splitBarButton.css('top', '0');
                this.splitBarButton.css('margin-left', '-23px');
                this.splitBarButton.css('margin-top', '-0px');
            }

            this._layoutPanels();
        },

        collapse: function () {
            if (this.disabled) return;

            var index = -1;
            this.panels[0].collapsed = this.panels[1].collapsed = false;
            this.panels[0].element[0].style.visibility = "inherit";
            this.panels[1].element[0].style.visibility = "inherit";

            if (this.panels[0].collapsible) {
                index = 0;
            }
            else if (this.panels[1].collapsible) {
                index = 1;
            }

            if (index != -1) {
                this.panels[index].collapsed = true;
                this.panels[index].element[0].style.visibility = "hidden";
                this.splitBar.addClass(this.toThemeProperty('jqx-splitter-splitbar-collapsed'));
                this._layoutPanels();
                this._raiseEvent(2, { index: index, panels: this.panels });
                this._raiseEvent(0, { panels: this.panels });
            }
        },

        expand: function () {
            if (this.disabled) return;

            var index = -1;
            this.panels[0].collapsed = this.panels[1].collapsed = false;
            this.panels[0].element[0].style.visibility = "inherit";
            this.panels[1].element[0].style.visibility = "inherit";

            if (this.panels[0].collapsible) {
                index = 0;
            }
            else if (this.panels[1].collapsible) {
                index = 1;
            }

            if (index != -1) {
                this.panels[index].collapsed = false;
                this.panels[index].element[0].style.visibility = "inherit";
                this.splitBar.removeClass(this.toThemeProperty('jqx-splitter-splitbar-collapsed'));
                this._layoutPanels();
                this._raiseEvent(1, { index: index, panels: this.panels });
                this._raiseEvent(0, { panels: this.panels });
            }
        },

        disable: function () {
            this.disabled = true;
            this.host.addClass(this.toThemeProperty('jqx-fill-state-disabled'));
            this.splitBar.addClass(this.toThemeProperty('jqx-splitter-splitbar-collapsed'));
            this.splitBarButton.addClass(this.toThemeProperty('jqx-splitter-splitbar-collapsed'));
        },

        enable: function () {
            this.disabled = false;
            this.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
            this.splitBar.removeClass(this.toThemeProperty('jqx-splitter-splitbar-collapsed'));
            this.splitBarButton.removeClass(this.toThemeProperty('jqx-splitter-splitbar-collapsed'));
        },

        refresh: function (initialRefresh) {
            if (initialRefresh != true) {
                this._arrange();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key === 'panels' || key === "orientation" || key === "showSplitBar") {
                object.render();
                return;
            }
            if (key === 'touchMode') {
                object._isTouchDevice = value;
            }
            if (key === 'disabled') {
                if (value) {
                    object.disable();
                } else {
                    object.enable();
                }
            } else if (key === 'theme') {
                $.jqx.utilities.setTheme(oldvalue, value, object.host);
            } else {
                object.refresh();
            }
        },

        _layoutPanels: function () {
            var that = this;
            var sizeProperty = this.orientation == "horizontal" ? "height" : "width";
            var positionProperty = this.orientation == "horizontal" ? "top" : "left";
            var firstMin, secondMin, firstCollapsed, secondCollapsed;
            var splitBarSize = parseInt(this._splitBarSize) + 2;
            if (!this.showSplitBar) {
                splitBarSize = 0;
            }
            var hostSize = this.host[sizeProperty]();
            var onePercent = hostSize / 100;
            var onePixelToPercentage = 1 / onePercent; // one pixel is equal to this amount of percentages.
            var splitBarSizeToPercentages = onePixelToPercentage * splitBarSize;

            var firstPanel = this.panel1;
            var secondPanel = this.panel2;
            var size = this.panels[0].size;
            if (this.panels[0].collapsed) {
                firstCollapsed = true;
            }
            if (this.panels[1].collapsed) {
                secondCollapsed = true;
            }
            firstMin = this.panels[0].min;
            secondMin = this.panels[1].min;

            if (secondMin.toString().indexOf("%") != -1) {
                secondMin = parseFloat(secondMin) * onePercent;
            }
            if (firstMin.toString().indexOf("%") != -1) {
                firstMin = parseFloat(firstMin) * onePercent;
            }

            if (this._isNested && this._isTouchDevice) {
                if (this.orientation == "horizontal") {
                    firstPanel.width(this.host.width());
                    secondPanel.width(this.host.width());
                }
                else {
                    firstPanel.height(this.host.height());
                    secondPanel.height(this.host.height());
                }
            }

            var positionPanels = function () {
                var position = that.panel1[sizeProperty]();
                if (that.splitBar[0].style[positionProperty] != position + 'px') {
                    var splitBarPosition = position;
                    if (that.orientation == "vertical") {
                        that.splitBar[0].style.borderLeftColor = "";
                        that.splitBar[0].style.borderRightColor = "";
                        that.splitBarButton[0].style.width = parseInt(that._splitBarSize) + 'px';
                        that.splitBarButton[0].style.left = '0px';
                    }
                    else {
                        that.splitBar[0].style.borderTopColor = "";
                        that.splitBar[0].style.borderBottomColor = "";
                        that.splitBarButton[0].style.height = parseInt(that._splitBarSize) + 'px';
                        that.splitBarButton[0].style.top = '0px';
                    }
                    if (that._hasBorder) {
                        if (hostSize - splitBarSize == position) {
                            if (that.orientation == "vertical") {
                                that.splitBar[0].style.borderRightColor = "transparent";
                                that.splitBarButton[0].style.width = parseInt(that._splitBarSize + 1) + 'px';
                            }
                            else {
                                that.splitBar[0].style.borderBottomColor = "transparent";
                                that.splitBarButton[0].style.height = parseInt(that._splitBarSize + 1) + 'px';
                            }
                        }
                        else if (position == 0) {
                            if (that.orientation == "vertical") {
                                that.splitBar[0].style.borderLeftColor = "transparent";
                                that.splitBarButton[0].style.width = parseInt(that._splitBarSize + 1) + 'px';
                                that.splitBarButton[0].style.left = '-1px';
                            }
                            else {
                                that.splitBar[0].style.borderTopColor = "transparent";
                                that.splitBarButton[0].style.height = parseInt(that._splitBarSize + 1) + 'px';
                                that.splitBarButton[0].style.top = '-1px';
                            }
                        }
                    }

                    that.splitBar[0].style[positionProperty] = splitBarPosition + 'px';
                }
                if (that.panel2[0].style[positionProperty] != position + splitBarSize + 'px') {
                    that.panel2[0].style[positionProperty] = position + splitBarSize + 'px';
                }
            }

            if (firstCollapsed) {
                var newSize = Math.max(secondMin, hostSize - splitBarSize);
                firstPanel[sizeProperty](0);
                secondPanel[sizeProperty](newSize);
            }
            else if (secondCollapsed) {
                var newSize = Math.max(firstMin, hostSize - splitBarSize);
                secondPanel[sizeProperty](0);
                firstPanel[sizeProperty](newSize);
            }
            else {
                if (size.toString().indexOf('%') != -1) {
                    var totalPercentages = 100 - parseFloat(size);
                    firstPanel.css(sizeProperty, parseFloat(size) + '%');
                    totalPercentages -= splitBarSizeToPercentages;
                    secondPanel.css(sizeProperty, totalPercentages + "%");

                    var secondPanelSize = secondPanel[sizeProperty]();

                    if (secondPanelSize < secondMin) {
                        var newSize = secondPanelSize - secondMin;
                        var newSizeInPercentages = newSize * onePixelToPercentage;
                        size = parseFloat(size) + parseFloat(newSizeInPercentages);
                        var totalPercentages = 100 - parseFloat(size);
                        firstPanel.css(sizeProperty, parseFloat(size) + '%');
                        totalPercentages -= splitBarSizeToPercentages;
                        secondPanel.css(sizeProperty, totalPercentages + "%");
                    }
                    var firstPanelSize = firstPanel[sizeProperty]();
                    if (firstPanelSize < firstMin) {
                        var newSizeInPercentages = firstMin * onePixelToPercentage;
                        firstPanel.css(sizeProperty, parseFloat(newSizeInPercentages) + '%');
                    }
                }
                else {
                    var secondPanelSize = hostSize - size - splitBarSize;
                    if (firstPanel[0].style[sizeProperty] != size + "px") {
                        firstPanel[sizeProperty](size);
                    }
                    if (secondPanel[0].style[sizeProperty] != secondPanelSize + "px") {
                        secondPanel[sizeProperty](secondPanelSize);
                    }

                    if (secondPanelSize < secondMin) {
                        size += secondPanelSize - secondMin;
                        secondPanel[sizeProperty](secondMin);
                        firstPanel[sizeProperty](size);
                    }
                    if (size < firstMin) {
                        firstPanel[sizeProperty](firstMin);
                    }
                }
            }

            positionPanels();
            this._raiseEvent(4, { panels: this.panels });
        },

        destroy: function () {
            this._removeHandlers();
            $.jqx.utilities.resize(this.host, null, true);
            this.host.remove();
        },

        _raiseEvent: function (eventId, data) {
            var event = new $.Event(this._events[eventId]);
            event.owner = this;
            event.args = data;
            var sizeProperty = this.orientation == "vertical" ? "width" : "height";
            var panels = new Array();
            panels[0] = {};
            panels[1] = {};
            panels[0].size = this.orientation == "vertical" ? this.panel1[0].offsetWidth : this.panel1[0].offsetHeight;
            panels[1].size = this.orientation == "vertical" ? this.panel2[0].offsetWidth : this.panel2[0].offsetHeight;
            panels[0].min = this.panels[0].min;
            panels[1].min = this.panels[1].min;
            panels[0].collapsible = this.panels[0].collapsible;
            panels[1].collapsible = this.panels[1].collapsible;
            panels[0].collapsed = this.panels[0].collapsed;
            panels[1].collapsed = this.panels[1].collapsed;
            event.args.panels = panels;

            return this.host.trigger(event);
        }
    });
}(jqxBaseFramework));