/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget("jqxDocking", "", {});

    $.extend($.jqx._jqxDocking.prototype, {

        defineInstance: function () {
            var settings = {
                // Type: String
                // Default: 'horizontal'
                // Sets or gets docking's orientation
                orientation: 'horizontal',
                // Type: String
                // Default: default
                // Sets or gets docking's mode. Possible values - default, floating, docked
                mode: 'default',
                // Type: Number
                // Default: 0.3
                // Sets or gets docking's floating window's opacity
                floatingWindowOpacity: 0.3,
                // Type: Bool
                // Default: true
                // Sets or gets whether the panel's corners are rounded
                panelsRoundedCorners: true,
                // Type: Bool
                // Default: false
                // Sets or gets whether the dicking is disabled
                disabled: false,
                // Type: String/Number
                // Default: auto
                // Sets or gets docking's width
                width: 'auto',
                // Type: String/Number
                // Default: auto
                // Sets or gets docking's height
                height: 'auto',
                // Type: Object
                // Default: null
                // Sets or gets docking window's modes (each one could be in floating or default mode)
                windowsMode: null,
                // Type: Bool
                // Default: true
                // Sets or gets whether the current layout would be saved into cookies
                cookies: false,
                // Type: Object
                // Default: {}
                // Sets or gets cookie options
                cookieOptions: {},
                // Type: Number
                // Default: 5
                // Sets or gets window's offset
                windowsOffset: 5,
                rtl: false,
                keyboardNavigation: false,
                _windowOptions: {},
                _draggedFired: false,
                _dragging: false,
                _draggingItem: null,
                _panels: [],
                _windows: [],
                _indicator: null,
                _events: ['dragEnd', 'dragStart']
            };
           $.extend(true, this, settings);
           return settings;
        },

        createInstance: function () {
            if (!this.host.jqxWindow) {
                throw new Error("jqxDocking: Missing reference to jqxwindow.js.");
            }

            this._refresh(true);
            if (this.disabled) {
                this.disabled = false;
                this.disable();
            }
        },

        refresh: function (initialRefresh) {
            if (initialRefresh == true)
                return;

            this._performLayout();
        },

        _refresh: function (startup) {
            this._render();
            this._removeClasses();
            this._addClasses();
            this._setWindowsOptions(true);
            this._performLayout();
            this._cookieHandler();
            this._cookieExporter();
            this._removeEventListeners();
            this._addEventListeners();
            var event = $.Event('resize');
            this.host.trigger(event);
        },

        resize: function()
        {
            this._refresh();
        },

        _addClasses: function () {
            this.host.addClass('jqx-docking');
            for (var i = 0; i < this._panels.length; i += 1) {
                this._panels[i].addClass(this.toThemeProperty('jqx-docking-panel'));
                if (this.panelsRoundedCorners) {
                    this._panels[i].addClass(this.toThemeProperty('jqx-rc-all'));
                }
            }
            for (var i = 0; i < this._windows.length; i += 1) {
                this._windows[i].addClass(this.toThemeProperty('jqx-docking-window'));
            }
        },

        _removeClasses: function () {
            this.host.removeClass('jqx-docking');
            for (var i = 0; i < this._panels.length; i += 1) {
                this._panels[i].removeClass(this.toThemeProperty('jqx-docking-panel'));
                this._panels[i].removeClass(this.toThemeProperty('jqx-rc-all'));
            }
            for (var i = 0; i < this._windows.length; i += 1) {
                this._windows[i].removeClass(this.toThemeProperty('jqx-docking-window'));
            }
        },

        _render: function () {
            var panels = this.host.children('div'), windows;
            for (var i = 0; i < panels.length; i += 1) {
                this._panels.push($(panels[i]));
                this._renderWindows($(panels[i]));
            }
        },

        focus: function(window)
        {
            if (this.focusedWindow) {
                $(this.focusedWindow).removeClass(this.toThemeProperty('jqx-fill-state-focus'));
            }

            if (!$.isEmptyObject(window) && $.type(window) === "string" && $("#" + window).length > 0) {
                this.focusedWindow = $("#" + window)[0];
            }
            else {
                this.focusedWindow = this._windows[0][0];
            }
            $(this.focusedWindow).addClass(this.toThemeProperty('jqx-fill-state-focus'));
            this.host.focus();
        },

        _renderWindows: function (panel) {
            var windows = panel.children('div');
            for (var j = 0; j < windows.length; j += 1) {
                this._windows.push($(windows[j]));
                $(windows[j]).jqxWindow({ keyboardNavigation: false, rtl: this.rtl, theme: this.theme, enableResize: false, width: $(windows[j]).css('width'), maxWidth: Number.MAX_VALUE });
                $(windows[j]).detach();
                panel.append($(windows[j]));
            }
            panel.append('<div class="spacer" style="clear: both;"></div>');

            var that = this;
            if (this.keyboardNavigation) {
                var handleKeyDown = function (event) {
                    if (event.keyCode === 13) {
                        if (that.focusedWindow && $(that.focusedWindow).jqxWindow('showCollapseButton')) {
                            $(that.focusedWindow).jqxWindow('_collapseButton').trigger('click');
                        }
                    }
                    else if ((that.focusedWindow && event.keyCode === 27 && $(that.focusedWindow).jqxWindow('keyboardCloseKey') === "esc") || (that.focusedWindow && $(that.focusedWindow).jqxWindow('keyboardCloseKey') == event.keyCode)) {
                        $(that.focusedWindow).jqxWindow('closeWindow', event);
                    }

                    if (event.keyCode === 9) {
                        if (that.focusedWindow == null) {
                            that.focusedWindow = that._windows[0];
                            $(that.focusedWindow).focus();
                            event.stopPropagation();
                        }
                        else {
                            var index = -1;
                            $.each(that._windows, function (indx, value) {
                                if (this[0] == that.focusedWindow) {
                                    index = indx;
                                }
                            });
                            if (event.shiftKey) {
                                index--;
                            }
                            else {
                                index++;
                            }

                            if (index >= that._windows.length || index < 0) {
                                $(that.focusedWindow).removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                                that.focusedWindow = null;
                                event.stopPropagation();
                             
                                return true;
                            }

                            var window = that._windows[index];
                            if (!window) window = that._windows[0];
                            $(that.focusedWindow).removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                            that.focusedWindow = window[0];
                            $(that.focusedWindow).focus();
                        }
                        $(that.focusedWindow).addClass(that.toThemeProperty('jqx-fill-state-focus'));
                        if (event.preventDefault) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                    }
                }

                $.each(that._windows, function (indx, value) {
                    var window = $(this);
                    that.removeHandler(window, "focus");
                    that.removeHandler(window, "blur");

                    that.removeHandler(window, "mousedown");
                    that.addHandler(window, "mousedown", function (event) {
                        if (that.focusedWindow)
                        {
                            $(that.focusedWindow).removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                        }
                            
                        that.focusedWindow = window[0];
                        $(that.focusedWindow).addClass(that.toThemeProperty('jqx-fill-state-focus'));
                        $(that.focusedWindow).focus();
                    });

                    that.addHandler(window, "focus", function (event) {
                        if (that.focusedWindow) {
                            $(that.focusedWindow).removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                        }

                        that.focusedWindow = window[0];
                        $(that.focusedWindow).addClass(that.toThemeProperty('jqx-fill-state-focus'));
                    });

                    that.addHandler(window, "blur", function (event) {
                        if ($(document.activeElement).ischildof($(window)))
                            return true;

                        $(window).removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                    });
                    that.removeHandler(window, 'keydown');
                    that.addHandler(window, 'keydown', function (event) {
                        handleKeyDown(event);
                    });
                });
                
                this.removeHandler(this.host, 'keydown');
                this.addHandler(this.host, 'keydown', function (event) {
                    handleKeyDown(event);
                });
                this.removeHandler(this.host, 'blur');
                this.addHandler(this.host, 'blur', function (event) {
                    if (that.focusedWindow) {
                        $(that.focusedWindow).removeClass(that.toThemeProperty('jqx-fill-state-focus'));
                        that.focusedWindow = null;
                    }
                });
            }
        },

        _performLayout: function () {
            this.host.css('width', this.width);
            this.host.css('height', this.height);
            this._performWindowsLayout();
            this._performPanelsLayout();
            this._performWindowsLayout();
        },

        _performPanelsLayout: function () {
            var panel, hostWidth = this.host.width(), sizeSum = 0;
            for (var i = 0; i < this._panels.length; i += 1) {
                panel = this._panels[i];
                panel.css('height', 'auto');
                panel.css('min-width', 'auto');
                if (this.orientation === 'vertical') {
                    panel.css('width', 'auto');
                    panel.css('float', 'none');
                } else {
                    sizeSum += this._handleHorizontalSize(panel, sizeSum, hostWidth);
                    if (i > 0)
                        panel.css('margin-left', -this.windowsOffset);
                }
                panel.css('min-width', panel.width());
            }
            if (this.orientation === 'horizontal') {
                if (sizeSum < hostWidth) {
                    this._fillContainer(hostWidth, sizeSum);
                }
            }
        },

        _handleHorizontalSize: function (panel, sizeSum, hostWidth) {
            var midWidth = hostWidth / this._panels.length,
                size,
                difference = (panel.outerWidth() - panel.width());
            panel.css('float', 'left');
            if (panel.css('width') === 'auto' || parseInt(panel.css('width'), 10) === 0) {
                panel.width(midWidth - difference);
            }
            if (sizeSum + panel.outerWidth() >= hostWidth) {
                if (sizeSum + midWidth < hostWidth) {
                    size = midWidth - difference;
                    panel.css('min-width', size);
                    panel.width(size);
                } else {
                    size = panel.width() - ((sizeSum + panel.outerWidth()) - hostWidth);
                    panel.css('min-width', size);
                    panel.width(size);
                }
            }
            return panel.outerWidth();
        },

        _fillContainer: function (hostWidth, sizeSum) {
            var count = this._panels.length, lastPanel = this._panels[count - 1],
                size = hostWidth - sizeSum + lastPanel.width();
            if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                size -= this._panels.length;
            }
            lastPanel.width(size);
        },

        _performWindowsLayout: function () {
            var options;
            for (var i = 0; i < this._windows.length; i += 1) {
                options = this._getWindowOptions(this._windows[i]);
                if (this._windows[i].ischildof(this.host)) {
                    if (options) {
                        if (options.mode !== 'floating') {
                            this._windows[i].css('margin', this.windowsOffset);
                            this._windows[i].css('position', 'static');
                        }
                    } else {
                        if (this.mode !== 'floating') {
                            this._windows[i].css('position', 'static');
                            this._windows[i].css('margin', this.windowsOffset);
                        }
                    }
                }
                this._setWindowSize(this._windows[i], options);
            }
        },

        _setWindowSize: function (window, options) {
            if (options.mode !== 'floating') {
                if (window.ischildof(this.host)) {
                    var newSize = window.parent().width() - (window.outerWidth() - window.width()) - 2 * this.windowsOffset;
                    if (this.orientation === 'vertical') {
                        window.jqxWindow('width', newSize);
                    } else {
                        window.jqxWindow('width', newSize);
                    }
                }
            }
            this._setWindowOption(window, 'size', {
                width: window.width(),
                height: window.height()
            });
        },

        _setWindowsOptions: function (fullOptions) {
            for (var i = 0; i < this._windows.length; i += 1) {
                var mode,
                    windowId = this._windows[i].attr('id'),
                    options = this._getWindowOptions(windowId);
                if (!fullOptions) {
                    var t = 'TEDX';
                }

                mode = null;
                if (this.windowsMode && this.windowsMode.hasOwnProperty(windowId)) {
                    mode = this.windowsMode[windowId];
                    this._setWindowOption(this._windows[i], 'mode', mode);
                } else if (typeof options !== 'undefined' && typeof options['mode'] === 'undefined') {
                    mode = this.mode;
                    this._setWindowOption(this._windows[i], 'mode', mode);
                }
                if (fullOptions) {
                    this._setWindowOption(this._windows[i], 'resizable', true);
                    if (mode == 'floating') {
                        this._windows[i].jqxWindow({ enableResize: true });
                    }
                    else {
                        this._windows[i].jqxWindow({ enableResize: false });
                    }

                    this._setWindowOption(this._windows[i], 'size', { height: this._windows[i].height(), width: this._windows[i].width() });
                }
            }
        },

        _removeEventListeners: function () {
            for (var i = 0; i < this._windows.length; i += 1) {
                this.removeHandler(this._windows[i], 'moving', this._itemDragging);
                this.removeHandler(this._windows[i], 'moved', this._itemDrop);
                this.removeHandler(this._windows[i], 'resized', this._itemResized);
                this.removeHandler(this._windows[i], 'collapse', this._collapsed);
                this.removeHandler(this._windows[i], 'expand', this._expanded);
            }
        },

        _addEventListeners: function () {
            for (var i = 0; i < this._windows.length; i += 1) {
                this._addEventListenersTo(this._windows[i]);
            }

            var me = this;
            $.jqx.utilities.resize(this.host, function () {
                me._performLayout();
            });
        },

        _addEventListenersTo: function (window) {
            this.addHandler(window, 'moving', this._itemDragging, { self: this });
            this.addHandler(window, 'moved', this._itemDrop, { self: this });
            this.addHandler(window, 'resized', this._itemResized, { self: this });
            this.addHandler(window, 'collapse', this._collapsed, { self: this });
            this.addHandler(window, 'expand', this._expanded, { self: this });
        },

        _itemDragging: function (event) {
            var self = event.data.self,
                window = $(event.target),
                options = self._getWindowOptions(window);
            window.removeClass(self.toThemeProperty('jqx-docking-window'));
            window.css('margin', '0px');
            if (!self._dragging) {
                self._prepareForDragging(window);
            }
            if (options.mode === 'floating') {
                return;
            }
            var position = { x: event.args.pageX, y: event.args.pageY },
                panel = self._getMouseOverPanel(position);
            if (panel) {
                self._mouseOverPanel(panel, position);
            } else {
                self._mouseLeavePanel();
            }
            if (!self._draggedFired) {
                self._raiseEvent(1, { window: $(window).attr('id') });
                self._draggedFired = true;
            }
          //  window.focus();
            return true;
        },

        _prepareForDragging: function (window) {
            this._dragging = true;
            var lastPosition = {
                parent: window.parent(),
                next: window.next(),
                prev: window.prev()
            };
            this._setWindowOption(window, 'lastPosition', lastPosition);
            window.detach();
            $(document.body).append(window);
            this._setDraggingStyles(window);
            this._draggingItem = window;
        },

        _setDraggingStyles: function (window) {
            window.css({
                'position': 'absolute',
                'left': window.offset().left,
                'top': window.offset().top
            });
            window.fadeTo(0, this.floatingWindowOpacity);
        },

        _getMouseOverPanel: function (cursorPosition) {
            var width, height, top, left;
            for (var i = 0; i < this._panels.length; i += 1) {
                if (this._isMouseOverItem(this._panels[i], cursorPosition, false)) {
                    return this._panels[i];
                }
            }
            return null;
        },

        _mouseOverPanel: function (panel, position) {
            if (this._dragging) {
                var windows = panel.children('div'),
                    window = this._getHoverWindow(position, windows);
                if (window === 'indicator') {
                    return;
                }
                var indicatorPosition = this._centerOffset(window, position);
                this._handleIndicator(panel, window, indicatorPosition);
            }
        },

        _getHoverWindow: function (position, windows) {
            var width, height, left, top;
            if (this._isMouseOverItem(this._indicator, position, true)) {
                return 'indicator';
            }
            for (var i = 0; i < windows.length; i += 1) {
                if (this._isMouseOverItem($(windows[i]), position, true)) {
                    return $(windows[i]);
                }
            }
            return null;
        },

        _centerOffset: function (window, position) {
            if (window) {
                var windowPosition = { x: window.offset().left, y: window.offset().top },
                    windowHeight = window.height(),
                    windowWidth = window.width(), middle;
                middle = windowPosition.y + windowHeight / 2;
                if (position.y > middle) {
                    return 'next';
                }
                return 'prev';
            }
            return 'all';
        },

        _handleIndicator: function (panel, window, indicatorPosition) {
            var indicator = this._getIndicator(window);
            if (indicatorPosition === 'all') {
                if (this.orientation === 'vertical') {
                    indicator.insertBefore(panel.children('.spacer'));
                } else {
                    panel.append(indicator);
                }
            } else {
                if (indicatorPosition === 'prev') {
                    indicator.insertBefore(window);
                } else {
                    indicator.insertAfter(window);
                }
            }
            this._resizeIndicator(indicator, panel);
        },

        _getIndicator: function () {
            var indicator = this._indicator;
            if (!indicator) {
                indicator = $('<div class="' + this.toThemeProperty('jqx-docking-drop-indicator') + '"></div>');
            }
            this._indicator = indicator;
            this._indicator.css('margin', this.windowsOffset);
            if (this.orientation === 'vertical') {
                this._indicator.css('float', 'left');
            }
            return indicator;
        },

        _resizeIndicator: function (indicator, panel) {
            if (this.orientation === 'horizontal') {
                indicator.width(panel.width() - (indicator.outerWidth(true) - indicator.width()));
                indicator.height(this._draggingItem.height());
            } else {
                indicator.width(this._draggingItem.width());
                indicator.height(this._draggingItem.height());
            }
        },

        _mouseLeavePanel: function (event) {
            if (this._indicator) {
                this._indicator.remove();
                this._indicator = null;
            }
        },

        _itemDrop: function (event) {
            var self = event.data.self,
                window = $(event.currentTarget);
            self._dragging = false;
            if (self._indicator) {
                window.detach();
                window.insertAfter(self._indicator);
                self._indicator.remove();
                self._dropFixer(window);
            } else {
                self._dropHandler(window);
            }
            window.fadeTo(0, 1);
            window.focus();
            self._indicator = null;
            self._cookieExporter();
            self._draggedFired = false;
            self._raiseEvent(0, { window: window.attr('id') });
        },

        _dropFixer: function (window) {
            window.css('position', 'static');
            window.addClass(this.toThemeProperty('jqx-docking-window'));
            window.css('margin', this.windowsOffset);
            window.jqxWindow('enableResize', false);
            if (this.orientation === 'horizontal') {
                this._fixWindowSize(window);
            }
        },

        _dropHandler: function (window) {
            var options = this._getWindowOptions(window);
            if (this.mode === 'docked') {
                this._dropDocked(window);
            } else {
                this._dropFloating(window);
            }
        },

        _dropDocked: function (window) {
            var options = this._getWindowOptions(window),
                lastPosition = options.lastPosition;
            window.detach();
            if (lastPosition.next[0]) {
                window.insertBefore(lastPosition.next);
            } else if (lastPosition.prev[0]) {
                window.insertAfter(lastPosition.prev);
            } else {
                lastPosition.parent.append(window);
            }
            this._dropFixer(window);
        },

        _fixWindowSize: function (window) {
            $(window).jqxWindow({
                width: window.parent().width() - (window.outerWidth() - window.width()) - 2 * parseInt(this.windowsOffset, 10)
            });
        },

        _itemResized: function (event) {
            var self = event.data.self,
                window = $(event.currentTarget);
            self._setWindowOption(window, 'size', { width: event.args.width, height: event.args.height });
            self._cookieExporter();
        },

        _dropFloating: function (window) {
            var options;
            if (!$(window).jqxWindow('collapsed')) {
                options = this._getWindowOptions(window);
                $(window).jqxWindow('enableResize', options.resizable);
            }
            $(document.body).append(window);
            this._restoreWindowSize(window);
        },

        _restoreWindowSize: function (window) {
            var options = this._getWindowOptions(window);
            $(window).jqxWindow({ width: options.size.width });
        },

        _isMouseOverItem: function (item, position, outerSize) {
            if (!item) {
                return false;
            }
            var outerWidth = item.outerWidth(true), outerHeight = item.outerHeight(true),
                width = item.width(), height = item.height(),
                top = item.offset().top, left = item.offset().left;
            if (outerSize) {
                top -= (outerHeight - height) / 2;
                left -= (outerWidth - width) / 2;
                width = outerWidth;
                height = outerHeight;
            }
            if ((left <= position.x && left + width >= position.x) &&
                (top <= position.y && top + height + 2 * this._draggingItem.height() / 3 >= position.y)) {
                return true;
            }
            return false;
        },

        _cookieHandler: function () {
            if (this.cookies) {
                var layout = $.jqx.cookie.cookie("jqxDocking" + this.element.id);
                if (layout !== null) {
                    this.importLayout(layout);
                    layoutImported = true;
                }
            }
        },

        _cookieExporter: function () {
            if (this.cookies) {
                $.jqx.cookie.cookie("jqxDocking" + this.element.id, this.exportLayout(), this.cookieOptions);
            }
        },

        _indexOf: function (item, collection) {
            for (var i = 0; i < collection.length; i += 1) {
                if (item[0] === collection[i][0]) {
                    return i;
                }
            }
            return -1;
        },

        _exportFixed: function () {
            var children = [], JSON = '', currentChildren, currentChild;
            for (var i = 0; i < this._panels.length; i += 1) {
                JSON += '"panel' + i + '": {';
                currentChildren = this._panels[i].children();
                for (var j = 0; j < currentChildren.length; j += 1) {
                    currentChild = $(currentChildren[j]);
                    if (currentChild.attr('id')) {
                        children.push(currentChild);
                        JSON += '"' + currentChild.attr('id') + '":{"collapsed":' + currentChild.jqxWindow('collapsed') + '},';
                    }
                }
                if (currentChildren.length > 1) {
                    JSON = JSON.substring(0, JSON.length - 1);
                }
                JSON += '},';
            }
            JSON = JSON.substring(0, JSON.length - 1);
            return { JSON: JSON, children: children };
        },

        _exportFloating: function (children) {
            var JSON = '', currentWindow;
            JSON += '"floating":{'
            for (var i = 0; i < this._windows.length; i += 1) {
                currentWindow = $(this._windows[i]);
                if (this._indexOf(currentWindow, children) === -1) {
                    JSON += '"' + currentWindow.attr('id') +
                        '":{"x":"' + currentWindow.css('left') + '","y":"' + currentWindow.css('top') + '",' +
                        '"width":"' + currentWindow.jqxWindow('width') + '","height":' + '"' + currentWindow.jqxWindow('height') + '",' +
                        '"collapsed":' + currentWindow.jqxWindow('collapsed') + '},';
                }
            }
            if (JSON.substring(JSON.length - 1, JSON.length) === ',') {
                JSON = JSON.substring(0, JSON.length - 1);
            }
            JSON += '}';
            return JSON;
        },

        _importFixed: function (imported) {
            for (var child in imported) {
                if (child !== 'orientation' && child !== 'floating' && imported.hasOwnProperty(child)) {
                    order = child.substring(child.length - 1, child.length);
                    order = parseInt(order, 10);
                    children = imported[child];
                    for (var child in children) {
                        $('#' + child).css('position', 'static');
                        if (children[child].collapsed) {
                            (function (child) {
                                setTimeout(function () {
                                    $('#' + child).jqxWindow('collapsed', true);
                                }, 0);
                            } (child));
                        }
                        this._panels[order].append($('#' + child));
                        if (this.orientation === 'horizontal') {
                            this._fixWindowSize($('#' + child));
                        }
                    }
                }
            }
        },

        _importFloating: function (imported) {
            var floating = imported['floating'],
                currentWindow,
                temp;
            for (var id in floating) {
                if (floating.hasOwnProperty(id)) {
                    $('#' + id).css('position', 'absolute');
                    $(document.body).append($('#' + id));
                    temp = this._dragging;
                    $('#' + id).jqxWindow('move', floating[id].x, floating[id].y);
                    this._dragging = temp;
                    $('#' + id).jqxWindow('width', floating[id].width);
                    $('#' + id).jqxWindow('height', floating[id].height);
                    $('#' + id).jqxWindow('enableResize', true);
                    this._setWindowsOptions(true);
                    (function (id) {
                        setTimeout(function () {
                            $('#' + id).jqxWindow('collapsed', floating[id].collapsed);
                        }, 0);
                    } (id));
                    $('#' + id).fadeTo(0, 1);
                }
            }
        },

        _getWindowOptions: function (window) {
            if (typeof window === 'object' && window !== null) {
                if (window.length > 0) {
                    window = window.attr('id');
                } else {
                    window = window.id;
                }
            }
            return this._windowOptions[window];
        },

        _setWindowOption: function (window, option, value) {
            if (typeof window === 'object' && window !== null) {
                if (window.length > 0) {
                    window = window.attr('id');
                } else {
                    window = window.id;
                }
            }
            if (typeof this._windowOptions[window] === 'undefined') {
                this._windowOptions[window] = {};
            }
            this._windowOptions[window][option] = value;
            if (option === 'mode') {
                this.setWindowMode(window, value);
            }
        },

        _expanded: function (event) {
            var self = event.data.self;
            self._cookieExporter();
        },

        _collapsed: function (event) {
            var self = event.data.self;
            self._cookieExporter();
        },

        _raiseEvent: function (eventId) {
            var event = $.Event(this._events[eventId]);
            event.args = arguments[1];
            return this.host.trigger(event);
        },

        _moveWindow: function (window, panel, position) {
            var children = panel.children();
            var child = null;
            var pos = 0;
            $.each(children, function (i) {
                if ($(this).css('position') == 'static') {
                    if (pos == position && this != window[0]) {
                        child = this;
                    }
                    pos++;
                }
            });

            if (pos <= position) {
                window.appendTo(panel);
            }
            else if (child != null) {
                window.insertBefore(child);
            }

            window.css('position', 'static');
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            switch (key) {
                case 'rtl':
                    $.each(object._windows, function () {
                        this.jqxWindow({ rtl: value });
                    });
                    break;
                case 'theme':
                    $.each(object._windows, function () {
                        this.jqxWindow({ theme: value });
                    });
                    break;
                case 'orientation':
                case 'height':
                case 'width':
                    object._performLayout();
                    object._cookieExporter();
                    break;
                case 'panelsRoundedCorners':
                    object._removeClasses();
                    object._addClasses();
                    break;
                case 'disabled':
                    if (value) {
                        object.disabled = false;
                        object.disable();
                    } else {
                        object.disabled = true;
                        object.enable();
                    }
                    break;
                case 'windowsMode':
                case 'mode':
                    object._setWindowsOptions(false);
                    break;
                case 'cookies':
                    object._cookieExporter();
                    break;
                case 'windowsOffset':
                    object._performLayout();
                    break;
            }
        },

        destroy: function () {
            this._removeEventListeners();
            this.host.remove();
            this.windowsMode = null;
            this.cookieOptions = null;
            this._windowOptions = null;
            this._panels = null;
            this._windows = null;
            this._events = null;
        },

        disable: function () {
            if (!this.disabled) {
                this.disabled = true;
                this._removeEventListeners();
                for (var i = 0; i < this._windows.length; i += 1) {
                    this._windows[i][0].style.opacity = "";
                    $(this._windows[i]).jqxWindow('disable');
                }
            }
        },

        enable: function () {
            if (this.disabled) {
                this.disabled = false;
                this._addEventListeners();
                for (var i = 0; i < this._windows.length; i += 1) {
                    $(this._windows[i]).jqxWindow('enable');
                }
            }
        },

        move: function (window, panel, position) {
            var panel = this._panels[panel];
            if (!panel) {
                return;
            }
            var spacer = $(panel.children('.spacer')), options;
            spacer.detach();
            window = $('#' + window);
            options = this._getWindowOptions(window);
            if (options.mode === 'floating') {
                return;
            } else {
                this._moveWindow(window, panel, position);
            }
            panel.append(spacer);
            this._cookieExporter();
            this._dropFixer(window);
        },

        exportLayout: function () {
            var JSON = '{', fixed = this._exportFixed();
            JSON += fixed.JSON + ',' + this._exportFloating(fixed.children) + ',' + '"orientation": ' + '"' + this.orientation + '"';
            JSON += '}';
            return JSON;
        },

        importLayout: function (JSON) {
            try {
                var imported = $.parseJSON(JSON), order, children;
                this.orientation = imported['orientation'];
                this._performLayout();
                this._importFixed(imported);
                this._importFloating(imported);
            } catch (e) {
                alert('Invalid JSON string.');
            }
        },

        setWindowMode: function (window, mode) {
            var window = $('#' + window),
                options = this._getWindowOptions(window);
            if (mode === 'floating') {
                window.css('position', 'absolute');
                this._windowOptions[window.attr('id')]['mode'] = mode;
            } else {
                if (options.mode === 'floating' &&
                window.css('position') === 'absolute') {
                    if (options.lastPosition) {
                        this._dropDocked(window);
                    } else {
                        this._panels[0].append(window);
                        this._dropFixer(window);
                    }
                }
            }
            this._windowOptions[window.attr('id')]['mode'] = mode;
        },

        hideCloseButton: function (window) {
            $('#' + window).jqxWindow('showCloseButton', false);
        },

        showCloseButton: function (window) {
            $('#' + window).jqxWindow('showCloseButton', true);
        },

        hideCollapseButton: function (window) {
            $('#' + window).jqxWindow('showCollapseButton', false);
        },

        showCollapseButton: function (window) {
            $('#' + window).jqxWindow('showCollapseButton', true);
        },

        expandWindow: function (window, duration) {
            $('#' + window).jqxWindow('expand', duration);
        },

        collapseWindow: function (window, duration) {
            $('#' + window).jqxWindow('collapse', duration);
        },

        setWindowProperty: function (window, propertyName, value) {
            $('#' + window).jqxWindow(propertyName, value);
        },

        getWindowProperty: function (window, propertyName) {
            return $('#' + window).jqxWindow(propertyName);
        },

        setWindowPosition: function (window, x, y) {
            var window = $('#' + window),
                options = this._getWindowOptions(window);
            if (options.mode === 'floating') {
                window.css('position', 'absolute');
                $(window).jqxWindow('move', x, y, null, false);
            }
        },

        hideAllCloseButtons: function () {
            for (var i = 0; i < this._windows.length; i += 1) {
                this._windows[i].jqxWindow('showCloseButton', false);
            }
        },

        hideAllCollapseButtons: function () {
            for (var i = 0; i < this._windows.length; i += 1) {
                this._windows[i].jqxWindow('showCollapseButton', false);
            }
        },

        showAllCloseButtons: function () {
            for (var i = 0; i < this._windows.length; i += 1) {
                this._windows[i].jqxWindow('showCloseButton', true);
            }
        },

        showAllCollapseButtons: function () {
            for (var i = 0; i < this._windows.length; i += 1) {
                this._windows[i].jqxWindow('showCollapseButton', true);
            }
        },

        pinWindow: function (window) {
            $('#' + window).jqxWindow('draggable', false);
        },

        unpinWindow: function (window) {
            $('#' + window).jqxWindow('draggable', true);
        },

        setDraggingMode: function (window) {
            var dockingWindow = $('#' + window);
            this._prepareForDragging(dockingWindow);
            dockingWindow.fadeTo(0, 1);
        },

        enableWindowResize: function (window) {
            window = $('#' + window);
            if (window.css('position') === 'absolute') {
                this._setWindowOption(window, 'resizable', true);
                window.jqxWindow('enableResize', true);
            }
        },

        disableWindowResize: function (window) {
            window = $('#' + window);
            this._setWindowOption(window, 'resizable', false);
            window.jqxWindow('enableResize', false);
        },

        addWindow: function (window, mode, panel, position) {
            var selector = '#' + window;
            $(selector).jqxWindow({ keyboardNavigation: false, rtl: this.rtl, theme: this.theme, enableResize: false, width: $(selector).css('width'), maxWidth: Number.MAX_VALUE });
            this._panels[0].append($(selector));
            this._windows.push($(selector));
            if (mode) {
                this._setWindowOption($(selector), 'mode', mode);
            } else {
                this._setWindowOption($(selector), 'mode', this.mode);
            }
            this._setWindowOption($(selector), 'resizable', true);
            this._setWindowOption($(selector), 'size', { width: $(selector).width(), height: $(selector).height() });
            if (mode == 'floating') {
                $(selector).jqxWindow({ enableResize: true });
            }
            else {
                $(selector).jqxWindow({ enableResize: false });
            }
            if (this._panels[panel] != null) {
                this._setWindowOption($(selector), 'size', { width: this._panels[panel].width(), height: this._panels[panel].height() });
            }

            this._addEventListenersTo($(selector));
            if (typeof panel !== 'undefined' && typeof position !== 'undefined') {
                this.move(window, panel, position);
            }
            this._dropFixer($(selector));
        },

        closeWindow: function (window) {
            $('#' + window).jqxWindow('closeWindow');
        }
    });
})(jqxBaseFramework);
