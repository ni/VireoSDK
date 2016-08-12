/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxLayout', '', {});

    $.extend($.jqx._jqxLayout.prototype, {
        defineInstance: function () {
            var settings = {
                // properties
                width: null,
                height: null,
                minGroupWidth: 100,
                minGroupHeight: 100,
                layout: [],
                resizable: true,
                contextMenu: false,
                rtl: false,

                // events
                events: ['create', 'resize', 'pin', 'unpin']
            };
            $.extend(true, this, settings);
        },

        createInstance: function () {
            var that = this;

            that._originalElement = that.host.clone();
            that._coordinates = [];
            that._ie7 = $.jqx.browser.msie && $.jqx.browser.version < 8;
            that._touchDevice = $.jqx.mobile.isTouchDevice();
            that._initialization = true;

            that.render();
        },

        // renders the widget
        render: function () {
            var that = this, jqxDockingLayoutOverlay, jqxDockingLayoutDropOverlay, jqxDockingLayoutEdgeOverlays;
            that._tabbedGroupsList = [];

            if (that.dockingLayout) {
                that._overlayGroups = [];

                if (that._initialization === false) {
                    jqxDockingLayoutOverlay = that.dockingLayout._overlay.detach();
                    jqxDockingLayoutDropOverlay = that.dockingLayout._dropOverlay.detach();
                    jqxDockingLayoutEdgeOverlays = that.dockingLayout._edgeOverlays.detach();
                }
            }

            if (that._rendered === true) {
                that._detachContent(that.layout[0].items);
            }

            that.host.empty();

            if (!that.host.jqxRibbon) {
                throw new Error('jqxLayout: Missing reference to jqxribbon.js.');
            }

            that._setSize();
            that._addClasses();
            that._removeHandlers();

            if (!that._rendered) {
                if (that.layout[0].type !== 'layoutGroup') {
                    throw new Error('jqxLayout: Invalid layout structure. The first member of the layout array has to be with type: "layoutGroup".');
                }

                var firstItemWidth = that.layout[0].items[0].width,
                    firstItemHeight = that.layout[0].items[0].height;
                if (!(firstItemWidth && typeof firstItemWidth === 'string' && firstItemWidth.charAt(firstItemWidth.length - 1) === '%' ||
                        firstItemHeight && typeof firstItemHeight === 'string' && firstItemHeight.charAt(firstItemHeight.length - 1) === '%')) {
                    that.layout[0].initialPxWidth = that.host.width();
                    that.layout[0].initialPxHeight = that.host.height();
                    that._pxToPercent(that.layout[0], true);
                }
            }

            that._createLayout(that.layout, that.host, { type: 'host' }, 0);

            if (that.resizable === true) {
                // resize handling
                that._addResizeFeedbacks();
                that._getGroupCoordinates();
                that._addHandlers();
            }

            if (that.contextMenu === true) {
                that._initMenu();
            }

            if (that._initialization === true) {
                that._initialization = false;
                that._raiseEvent('0'); // 'create' event
                $.jqx.utilities.resize(that.host, function () {
                    that.render();
                });
            } else if (that.dockingLayout) {
                if (!that._ie7) {
                    that.host.append(jqxDockingLayoutOverlay, jqxDockingLayoutDropOverlay, jqxDockingLayoutEdgeOverlays);
                } else {
                    $('body').append(jqxDockingLayoutOverlay, jqxDockingLayoutDropOverlay, jqxDockingLayoutEdgeOverlays);
                }

                that.dockingLayout._trackFloatGroups();
            }

            for (var i = 0; i < that._tabbedGroupsList.length; i++) {
                that._validateTabbedGroup(that._tabbedGroupsList[i]);
            }

            if (!that._rendered) {
                that._rendered = true;
            }
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                this.render();
            }
        },

        // destroys the widget
        destroy: function () {
            var that = this;

            that._mouseupHandler = null;
            that._docUP = null;
            that._removeHandlers();
            if (that.contextMenu === true) {
                that._menu.jqxMenu('destroy');
            }
            that.host.remove();
        },

        // saves the current layout
        saveLayout: function () {
            var that = this,
                savedLayout = [];
            for (var i = 0; i < that.layout.length; i++) {
                that._copyItem(that.layout[i], savedLayout);
            }
            return savedLayout;
        },

        // loads a layout
        loadLayout: function (layout) {
            if (layout !== undefined && $.isEmptyObject(layout) === false) {
                var that = this;
                that.layout = layout;
                that._rendered = false;
                that.render();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key !== 'layout') {
                if (value !== oldvalue) {
                    switch (key) {
                        case 'width':
                        case 'height':
                            object.host.css(key, value);
                            break;
                        case 'theme':
                            $.jqx.utilities.setTheme(oldvalue, value, object.host);
                            if (object._menuInitialized) {
                                $.jqx.utilities.setTheme(oldvalue, value, object._menu);
                            }
                            if (object.dockingLayout) {
                                if ($('.' + object.element.id + 'FloatGroup').length > 0) {
                                    $('.' + object.element.id + 'FloatGroup').jqxWindow({ theme: value });
                                }
                            }
                            break;
                        case 'layout':
                        case 'resizable':
                            object.render();
                            break;
                        case 'contextMenu':
                            if (value === true && !object._menuInitialized) {
                                object.render();
                            }
                            break;
                        case 'rtl':
                            var floatGroups = $('.' + object.element.id + 'FloatGroup');
                            if (floatGroups.length > 0) {
                                floatGroups.jqxWindow({ rtl: value });
                            }
                            var widget = object.host.add(floatGroups);

                            if (value === true) {
                                widget.find('.jqx-layout-pseudo-window-title-ltr').removeClass(object.toThemeProperty('jqx-layout-pseudo-window-title-ltr')).addClass(object.toThemeProperty('jqx-layout-pseudo-window-title-rtl'));
                                widget.find('.jqx-layout-pseudo-window-pin-background-ltr').removeClass(object.toThemeProperty('jqx-layout-pseudo-window-pin-background-ltr')).addClass(object.toThemeProperty('jqx-layout-pseudo-window-pin-background-rtl'));
                                widget.find('.jqx-layout-pseudo-window-close-background-ltr').removeClass(object.toThemeProperty('jqx-layout-pseudo-window-close-background-ltr')).addClass(object.toThemeProperty('jqx-layout-pseudo-window-close-background-rtl'));
                                widget.find('.jqx-layout-ribbon-header').removeClass(object.toThemeProperty('jqx-layout-ribbon-header-ltr')).addClass(object.toThemeProperty('jqx-layout-ribbon-header-rtl'));
                            } else {
                                widget.find('.jqx-layout-pseudo-window-title-rtl').removeClass(object.toThemeProperty('jqx-layout-pseudo-window-title-rtl')).addClass(object.toThemeProperty('jqx-layout-pseudo-window-title-ltr'));
                                widget.find('.jqx-layout-pseudo-window-pin-background-rtl').removeClass(object.toThemeProperty('jqx-layout-pseudo-window-pin-background-rtl')).addClass(object.toThemeProperty('jqx-layout-pseudo-window-pin-background-ltr'));
                                widget.find('.jqx-layout-pseudo-window-close-background-rtl').removeClass(object.toThemeProperty('jqx-layout-pseudo-window-close-background-rtl')).addClass(object.toThemeProperty('jqx-layout-pseudo-window-close-background-ltr'));
                                widget.find('.jqx-layout-ribbon-header').removeClass(object.toThemeProperty('jqx-layout-ribbon-header-rtl')).addClass(object.toThemeProperty('jqx-layout-ribbon-header-ltr'));
                            }

                            widget.find('.jqx-ribbon').jqxRibbon({ rtl: value });
                            break;
                    }
                }
            } else {
                object.render();
            }
        },

        // raises an event
        _raiseEvent: function (id, arg) {
            if (arg === undefined) {
                arg = { owner: null };
            }

            var evt = this.events[id];
            arg.owner = this;

            var event = new $.Event(evt);
            event.owner = this;
            event.args = arg;
            if (event.preventDefault) {
                event.preventDefault();
            }

            var result = this.host.trigger(event);
            return result;
        },

        // sets the width and height of the widget
        _setSize: function () {
            var that = this;

            that.host.css({ 'width': that.width, 'height': that.height });
        },

        // adds the necessary classes to the widget
        _addClasses: function () {
            var that = this;
            that.host.addClass(that.toThemeProperty('jqx-layout jqx-widget jqx-widget-content jqx-rc-all'));
        },

        // converts a pixel value to a percentage
        _getPercentage: function (value, parent, dim) {
            return (value / parent.widget[dim]()) * 100;
        },

        // adds event handlers
        _addHandlers: function () {
            var that = this,
                id = that.element.id,
                min, max;

            that._resize = { allowed: false };
            that._clickedToResize = false;

            function allowResize(x, y) {
                for (var i = 0; i < that._coordinates.length; i++) {
                    var current = that._coordinates[i];
                    if (x >= current.x.from && x <= current.x.to && y >= current.y.from && y <= current.y.to) {
                        if (current.orientation === 'horizontal') {
                            that.element.style.cursor = 'col-resize';
                        } else {
                            that.element.style.cursor = 'row-resize';
                        }
                        that._resize = { allowed: true, widget: current.widget, side: current.side };
                        break;
                    } else {
                        that.element.style.cursor = 'default';
                        that._resize.allowed = false;
                    }
                }
            }

            function down(event) {
                if (that._resize.allowed === true) {
                    var current = that._resize.widget,
                        parent = current.current.parent,
                        currentMinWidth = that._percentToPx('width', current.current.minWidth, parent),
                        currentMinHeight = that._percentToPx('height', current.current.minHeight, parent),
                        prev = parent.items[current.current.index - 1],
                        next = parent.items[current.current.index + 1];

                    that._resizeStartPosition = { x: event.pageX, y: event.pageY };

                    if (!currentMinWidth) {
                        currentMinWidth = that._percentToPx('width', that.minGroupWidth, parent);
                    }
                    if (!currentMinHeight) {
                        currentMinHeight = that._percentToPx('height', that.minGroupHeight, parent);
                    }

                    switch (that._resize.side) {
                        case 'left':
                            var prevMinWidth = that._percentToPx('width', prev.minWidth, parent);
                            if (!prevMinWidth) {
                                prevMinWidth = that._percentToPx('width', that.minGroupWidth, parent);
                            }

                            min = prev.widget.offset().left + prevMinWidth;
                            max = current.offset().left + current.width() - currentMinWidth;
                            break;
                        case 'right':
                            var nextMinWidth = that._percentToPx('width', next.minWidth, parent);
                            if (!nextMinWidth) {
                                nextMinWidth = that._percentToPx('width', that.minGroupWidth, parent);
                            }

                            min = current.offset().left + currentMinWidth;
                            max = next.widget.offset().left + next.widget.width() - nextMinWidth;
                            break;
                        case 'top':
                            var prevMinHeight = that._percentToPx('height', prev.minHeight, parent);
                            if (!prevMinHeight) {
                                prevMinHeight = that._percentToPx('height', that.minGroupHeight, parent);
                            }

                            min = prev.widget.offset().top + prevMinHeight;
                            max = current.offset().top + current.height() - currentMinHeight;
                            break;
                        case 'bottom':
                            var nextMinHeight = that._percentToPx('height', next.minHeight, parent);
                            if (!nextMinHeight) {
                                nextMinHeight = that._percentToPx('height', that.minGroupHeight, parent);
                            }

                            min = current.offset().top + currentMinHeight;
                            max = next.widget.offset().top + next.widget.height() - nextMinHeight;
                            break;
                    }

                    var computeFrameOffset = function (win, dims) {
                        dims = (typeof dims === 'undefined') ? { top: 0, left: 0} : dims;
                        if (win !== top) {
                            var rect = win.frameElement.getBoundingClientRect();
                            dims.left += rect.left;
                            dims.top += rect.top;
                            dims = computeFrameOffset(win.parent, dims);
                        }
                        return dims;
                    },
                        ie7Addend;

                    that._clickedToResize = true;
                    that._overlay[0].style.display = 'block';
                    if (that._resize.side === 'left' || that._resize.side === 'right') {
                        that._verticalFeedback[0].style.height = that._resize.widget.height() + 'px';
                        ie7Addend = that._ie7 ? computeFrameOffset(window).top : 0;
                        that._verticalFeedback.offset({ top: that._resize.widget.offset().top - that.host.offset().top + $(window).scrollTop() - ie7Addend });
                    } else {
                        that._horizontalFeedback[0].style.width = that._resize.widget.width() + 'px';
                        ie7Addend = that._ie7 ? computeFrameOffset(window).left : 0;
                        that._horizontalFeedback.offset({ left: that._resize.widget.offset().left - that.host.offset().left + $(window).scrollLeft() + 1 - ie7Addend });
                    }
                }
            }

            function checkBelowMinimum(enlarge, widget, neighbour, value, dim) {
                var Dim = dim.charAt(0).toUpperCase() + dim.slice(1),
                    parent = widget.parent,
                    minDim, intendedValue;

                if (enlarge) {
                    minDim = that._percentToPx(dim, neighbour['min' + Dim], parent);
                    intendedValue = parseFloat(neighbour[dim]) / 100 * widget.parent.widget[dim]() - value;
                } else {
                    minDim = that._percentToPx(dim, widget['min' + Dim], parent);
                    intendedValue = parseFloat(widget[dim]) / 100 * widget.parent.widget[dim]() - value;
                }
                if (!minDim) {
                    minDim = that._percentToPx(dim, that['minGroup' + Dim], parent);
                }

                if (intendedValue < minDim) {
                    return minDim;
                } else {
                    return intendedValue;
                }
            }

            function up(event) {
                if (that._clickedToResize === true) {
                    var clear = function () {
                        that._clickedToResize = false;
                        that._overlay[0].style.display = 'none';
                        that._verticalFeedback[0].style.display = 'none';
                        that._horizontalFeedback[0].style.display = 'none';
                    },
                        pageX = event.pageX,
                        pageY = event.pageY,
                        widgetSettings = that._resize.widget.current,
                        widgetOffset = that._resize.widget.offset(),
                        widgetLeft = widgetOffset.left,
                        widgetTop = widgetOffset.top,
                        neighbour, comparable, enlarge, value, ensmalledWidgetValue, old;

                    if (event.pageX === that._resizeStartPosition.x && event.pageY === that._resizeStartPosition.y) {
                        clear();
                        return;
                    }

                    if (that._resize.side === 'left' || that._resize.side === 'right') {
                        old = widgetSettings.width;
                        if (that._resize.side === 'left') {
                            neighbour = widgetSettings.parent.items[widgetSettings.index - 1];
                            comparable = widgetLeft;
                            enlarge = pageX < comparable;
                        } else {
                            neighbour = widgetSettings.parent.items[widgetSettings.index + 1];
                            comparable = widgetLeft + widgetSettings.widget.width();
                            enlarge = pageX >= comparable;
                        }

                        value = Math.abs(pageX - comparable);
                        if (value === 0) {
                            clear();
                            return;
                        }

                        if (enlarge) {
                            ensmalledWidgetValue = that._getPercentage(checkBelowMinimum(true, widgetSettings, neighbour, value, 'width'), widgetSettings.parent, 'width');
                            value = Math.abs(ensmalledWidgetValue - parseFloat(neighbour.width));
                            neighbour.width = ensmalledWidgetValue + '%';
                            widgetSettings.width = parseFloat(widgetSettings.width) + value + '%';
                        } else {
                            ensmalledWidgetValue = that._getPercentage(checkBelowMinimum(false, widgetSettings, neighbour, value, 'width'), widgetSettings.parent, 'width');
                            value = Math.abs(ensmalledWidgetValue - parseFloat(widgetSettings.width));
                            widgetSettings.width = ensmalledWidgetValue + '%';
                            neighbour.width = parseFloat(neighbour.width) + value + '%';
                        }

                        if (widgetSettings.width === old) {
                            clear();
                            return;
                        }
                    } else {
                        old = widgetSettings.height;
                        if (that._resize.side === 'top') {
                            neighbour = widgetSettings.parent.items[widgetSettings.index - 1];
                            comparable = widgetTop;
                            enlarge = pageY < comparable;
                        } else {
                            neighbour = widgetSettings.parent.items[widgetSettings.index + 1];
                            comparable = widgetTop + widgetSettings.widget.height();
                            enlarge = pageY >= comparable;
                        }

                        value = Math.abs(pageY - comparable);
                        if (value === 0) {
                            clear();
                            return;
                        }

                        if (enlarge) {
                            ensmalledWidgetValue = that._getPercentage(checkBelowMinimum(true, widgetSettings, neighbour, value, 'height'), widgetSettings.parent, 'height');
                            value = Math.abs(ensmalledWidgetValue - parseFloat(neighbour.height));
                            neighbour.height = ensmalledWidgetValue + '%';
                            widgetSettings.height = parseFloat(widgetSettings.height) + value + '%';
                        } else {
                            ensmalledWidgetValue = that._getPercentage(checkBelowMinimum(false, widgetSettings, neighbour, value, 'height'), widgetSettings.parent, 'height');
                            value = Math.abs(ensmalledWidgetValue - parseFloat(widgetSettings.height));
                            widgetSettings.height = ensmalledWidgetValue + '%';
                            neighbour.height = parseFloat(neighbour.height) + value + '%';
                        }

                        if (widgetSettings.height === old) {
                            clear();
                            return;
                        }
                    }

                    clear();
                    that.render();
                    that._raiseEvent('1', { item: widgetSettings }); // 'resize' event
                }
            }

            function drag(event) {
                if (that._clickedToResize === true) {
                    var x = event.pageX,
                        y = event.pageY;

                    if (that._resize.side === 'left' || that._resize.side === 'right') {
                        that._verticalFeedback[0].style.display = 'block';
                        if (x < min) {
                            x = min;
                            that._verticalFeedback.addClass(that.toThemeProperty('jqx-layout-resize-feedback-warning'));
                        } else if (x > max) {
                            x = max;
                            that._verticalFeedback.addClass(that.toThemeProperty('jqx-layout-resize-feedback-warning'));
                        } else {
                            that._verticalFeedback.removeClass(that.toThemeProperty('jqx-layout-resize-feedback-warning'));
                        }
                        that._verticalFeedback.offset({ left: x - 2 });
                    } else {
                        that._horizontalFeedback[0].style.display = 'block';
                        if (y < min) {
                            y = min;
                            that._horizontalFeedback.addClass(that.toThemeProperty('jqx-layout-resize-feedback-warning'));
                        } else if (y > max) {
                            y = max;
                            that._horizontalFeedback.addClass(that.toThemeProperty('jqx-layout-resize-feedback-warning'));
                        } else {
                            that._horizontalFeedback.removeClass(that.toThemeProperty('jqx-layout-resize-feedback-warning'));
                        }
                        that._horizontalFeedback.offset({ top: y - 2 });
                        that._horizontalFeedback.offset({ left: that._resize.widget.offset().left + $(window).scrollLeft() + 1 });
                    }
                }
            }

            that._docUP = up;
            if (!that._touchDevice) {
                that.addHandler(that.host, 'mousemove.jqxLayout' + id, function (event) {
                    if (that._clickedToResize === false && (!that.dockingLayout || that.dockingLayout && that.dockingLayout._windowDragged !== true)) {
                        var x = event.pageX,
                            y = event.pageY;
                        allowResize(x, y);
                    }
                });

                that.addHandler($(document), 'mousemove.jqxLayout' + id, function (event) {
                    drag(event);
                });

                that.addHandler(that.host, 'mousedown.jqxLayout' + id, function (event) {
                    down(event);
                });

                that.addHandler($(document), 'mouseup.jqxLayout' + id, function (event) {
                    up(event);
                });
            } else {
                that.addHandler($(document), 'touchstart.jqxDockingLayout' + id, function (event) {
                    var touchstartEventInformation = event.originalEvent.touches[0];
                    allowResize(touchstartEventInformation.pageX, touchstartEventInformation.pageY);
                    down(touchstartEventInformation);
                });

                that.addHandler($(document), 'touchmove.jqxDockingLayout' + id, function (event) {
                    var touchmoveEventInformation = event.originalEvent.touches[0];
                    drag(touchmoveEventInformation);
                });

                that.addHandler($(document), 'touchend.jqxDockingLayout' + id, function (event) {
                    var touchendEventInformation = event.originalEvent.changedTouches[0];
                    up(touchendEventInformation);
                });
            }

            that.addHandler($(document), 'selectstart.jqxLayout' + id, function () {
                if (that._clickedToResize === true) {
                    return false;
                }
            });
            if (that.dockingLayout) {
                try {
                    if (document.referrer !== '' || window.frameElement) {
                        if (window.top.document.addEventListener) {
                            window.top.document.addEventListener('mouseup', that._mouseupHandler, false);
                        } else if (window.top.document.attachEvent) {
                            window.top.document.attachEvent('onmouseup', that._mouseupHandler);
                        }
                    }
                }
                catch (error) {
                }
            }
        },

        // removes event handlers
        _removeHandlers: function () {
            var that = this,
                id = that.element.id;

            if (!that._touchDevice) {
                that.removeHandler(that.host, 'mousemove.jqxLayout' + id);
                that.removeHandler($(document), 'mousemove.jqxLayout' + id);
                that.removeHandler(that.host, 'mousedown.jqxLayout' + id);
                that.removeHandler($(document), 'mouseup.jqxLayout' + id);
            } else {
                that.removeHandler($(document), 'touchstart.jqxLayout' + id);
                that.removeHandler($(document), 'touchmove.jqxLayout' + id);
                that.removeHandler($(document), 'touchend.jqxLayout' + id);
            }
            that.removeHandler($(document), 'selectstart.jqxLayout' + id);
            if (that.dockingLayout) {
                try {
                    if (document.referrer !== '' || window.frameElement) {
                        if (window.top.document.removeEventListener) {
                            window.top.document.removeEventListener('mouseup', that._mouseupHandler, false);
                        } else if (window.top.document.detachEvent) {
                            window.top.document.detachEvent('onmouseup', that._mouseupHandler);
                        }
                    }
                }
                catch (error) {
                }
            }

            $('.' + id + 'FloatGroup').off('close');
        },

        // creates the layout
        _createLayout: function (items, parentElement, parentObject) {
            function createWindowHTML(current) {
                var windowElements = parentElement.children(),
                    windowHeader = windowElements.eq(0),
                    windowContent = windowElements.eq(1);

                windowHeader.text(current.title);

                if (!current.content) {
                    panelContent = that._originalElement.find('[data-container="' + current.contentContainer + '"]').html();
                } else {
                    panelContent = current.content;
                }
                if (panelContent === undefined) {
                    panelContent = '';
                }
                windowContent.html(panelContent);
            }

            var that = this,
                parentGroupType = parentObject.type;

            for (var i = 0; i < items.length; i++) {
                var current = items[i],
                    currentElement, panelContent, contentDiv, li;

                switch (current.type) {
                    case 'layoutGroup':
                        currentElement = $('<div></div>');
                        currentElement.addClass(that.toThemeProperty('jqx-layout-group-default'));
                        if (current.orientation === 'horizontal') {
                            currentElement.addClass(that.toThemeProperty('jqx-layout-group-default-horizontal'));
                        }
                        parentElement.append(currentElement);

                        if (parentGroupType === 'host') {
                            currentElement.addClass(that.toThemeProperty('jqx-layout-group-root'));
                        } else {
                            var width = parentObject.orientation === 'horizontal' ? current.width : '100%';
                            var height = parentObject.orientation === 'horizontal' ? '100%' : current.height;
                            currentElement.css({ 'width': width, 'height': height });
                        }
                        break;
                    case 'tabbedGroup':
                        if (parentGroupType !== 'floatGroup') {
                            currentElement = $('<div class="' + that.toThemeProperty('jqx-layout-group-tabbed') + '"><div class="jqx-layout-window-header"><div></div></div><div><div class="jqx-layout-ribbon"><ul class="jqx-layout-ribbon-header jqx-layout-ribbon-header-' + (that.rtl ? 'rtl' : 'ltr') + '"></ul><div class="jqx-layout-ribbon-content"></div></div></div></div>');
                            parentElement.append(currentElement);

                            that._addRightClickHandler(currentElement.find('.jqx-layout-window-header'), currentElement);
                        } else {
                            currentElement = $('<div class="jqx-layout-ribbon"><ul class="jqx-layout-ribbon-header jqx-layout-ribbon-header-' + (that.rtl ? 'rtl' : 'ltr') + '"></ul><div class="jqx-layout-ribbon-content"></div></div>');
                            parentElement.children().eq(1).append(currentElement);
                        }
                        break;
                    case 'documentGroup':
                    case 'autoHideGroup':
                        currentElement = $('<div><ul></ul><div></div></div>');
                        parentElement.append(currentElement);

                        if (current.type === 'documentGroup') {
                            currentElement.find('ul').addClass('jqx-layout-ribbon-header jqx-layout-ribbon-header-' + (that.rtl ? 'rtl' : 'ltr'));
                        }

                        if (that._ie7 && current.type === 'autoHideGroup') {
                            // IE7 fix
                            currentElement.css('z-index', 9999 - 500 * i);
                        }
                        break;
                    case 'floatGroup':
                        if (!that._rendered || current.programmaticallyAdded === true) {
                            if (!that.dockingLayout) {
                                throw new Error('Float groups are only available in the jqxDockingLayout widget. Initialize a jqxDockingLayout (requires jqxdockinglayout.js) instead of a jqxLayout.');
                            }

                            currentElement = $('<div class="' + that.toThemeProperty('jqx-docking-layout-group-floating') + '"><div></div><div></div></div>');
                            parentElement.append(currentElement);

                            if (current.programmaticallyAdded === true) {
                                delete current.programmaticallyAdded;
                            }
                        } else {
                            continue;
                        }
                        break;
                    case 'layoutPanel':
                        currentElement = {};
                        if (parentGroupType === 'tabbedGroup') {
                            var groupTitle = parentElement.find('.jqx-layout-window-header').text();
                            if (groupTitle === '') {
                                parentElement.find('.jqx-layout-window-header div:eq(0)').text(current.title);
                            }

                            li = $('<li>' + current.title + '</li>');
                            parentElement.find('.jqx-layout-ribbon-header').append(li);

                            if (!that._rendered && !current.docked) {
                                panelContent = that._originalElement.find('[data-container="' + current.contentContainer + '"]').html();
                                if (panelContent === undefined) {
                                    panelContent = '';
                                }
                            } else {
                                panelContent = current.detachedContent;
                            }

                            contentDiv = $('<div></div>');
                            contentDiv.append(panelContent);
                            parentElement.find('.jqx-layout-ribbon-content').append(contentDiv);

                            that._addRightClickHandler(li, currentElement);
                        } else if (parentGroupType === 'autoHideGroup') {
                            $(parentElement.children()[0]).append('<li>' + current.title + '</li>');

                            if (!that._rendered) {
                                panelContent = that._originalElement.find('[data-container="' + current.contentContainer + '"]').html();
                                if (panelContent === undefined) {
                                    panelContent = '';
                                }
                            } else {
                                panelContent = current.detachedContent;
                            }

                            contentDiv = $('<div></div>');
                            contentDiv.append(panelContent);

                            var contentClass;
                            if (parentObject.alignment === 'left' || parentObject.alignment === 'right') {
                                contentClass = 'jqx-layout-group-auto-hide-content-vertical';
                            } else {
                                contentClass = 'jqx-layout-group-auto-hide-content-horizontal';
                            }
                            contentDiv.addClass(that.toThemeProperty(contentClass));

                            var window = $('<div><div class="jqx-layout-window"><div><div>' + current.title + '</div></div></div></div>');
                            window.children().append(contentDiv);

                            $(parentElement.children()[1]).append(window);

                            that._addRightClickHandler(window.find('.jqx-layout-window'), currentElement);
                        } else if (parentGroupType === 'floatGroup') {
                            createWindowHTML(current);
                        }
                        break;
                    case 'documentPanel':
                        currentElement = {};

                        if (parentGroupType === 'floatGroup') {
                            createWindowHTML(current);
                        } else {
                            li = $('<li>' + current.title + '</li>');
                            $(parentElement.children()[0]).append(li);

                            if (!that._rendered) {
                                panelContent = that._originalElement.find('[data-container="' + current.contentContainer + '"]').html();
                                if (panelContent === undefined) {
                                    panelContent = '';
                                }
                            } else {
                                panelContent = current.detachedContent;
                            }

                            contentDiv = $('<div></div>');
                            contentDiv.append(panelContent);
                            $(parentElement.children()[1]).append(contentDiv);

                            that._addRightClickHandler(li, currentElement);
                        }
                        break;
                }

                if (current.items && current.items.length > 0) {
                    var container = currentElement;
                    that._createLayout(current.items, container, current);
                }

                that._createWidget(parentObject, parentElement, current, currentElement, i);

                if (that.dockingLayout && (current.type === 'documentGroup' || current.type === 'tabbedGroup' || (current.type === 'layoutGroup' && current.items.length === 0))) {
                    var overlayGroup = { element: currentElement, width: currentElement.width(), height: currentElement.height(), offset: currentElement.offset(), settings: current };
                    that._overlayGroups.push(overlayGroup);
                    if (current.parent.type === 'floatGroup') {
                        current.parent._overlayGroup = overlayGroup;
                    }
                }
            }
        },

        // initializes layout widgets
        _createWidget: function (parentObject, parentElement, current, currentElement, index) {
            var that = this,
                width = parentObject.orientation === 'horizontal' ? current.width : '100%',
                height = parentObject.orientation === 'horizontal' ? '100%' : current.height,
                removeByDrag = false;

            current.parent = parentObject;
            current.widget = currentElement;
            current.index = index;
            if (current.widget) {
                current.widget.current = current;
            }

            function getInitialSelection() {
                var selected = 0;
                for (var i = 0; i < current.items.length; i++) {
                    if (current.items[i].selected === true) {
                        selected = i;
                        break;
                    }
                }
                current.items[selected].selected = true;
                return selected;
            }

            switch (current.type) {
                case 'tabbedGroup':
                    var title, ribbon;

                    if (parentObject.type !== 'floatGroup') {
                        title = that._initWindowPanel(currentElement, width, height, current.type);
                        ribbon = currentElement.find('.jqx-layout-ribbon');
                        that._tabbedGroupsList.push(current);
                    } else {
                        ribbon = currentElement;
                    }

                    if (that.dockingLayout && (current.allowDrag !== false)) {
                        removeByDrag = true;
                    }

                    ribbon.jqxRibbon({
                        theme: that.theme,
                        width: '100%',
                        height: '100%',
                        position: 'bottom',
                        selectionMode: 'click',
                        animationType: 'none',
                        rtl: that.rtl,
                        _roundedCorners: false,
                        initContent: function (index) {
                            var currentItem = current.items[index];
                            if (!currentItem.initialized && currentItem.initContent) {
                                currentItem.initContent(ribbon.find('.jqx-ribbon-content-section').eq(index));
                                currentItem.initialized = true;
                            }
                        },
                        _removeByDrag: removeByDrag,
                        reorder: true
                    });

                    ribbon.on('select', function (event) {
                        event.stopPropagation();
                        if (event.target.id === ribbon[0].id) {
                            event.stopPropagation();
                            var selectedIndex = event.args.selectedIndex;
                            current.items[selectedIndex].selected = true;
                            var updatedTitle = $($(ribbon.children()[1]).children()[selectedIndex]).text();
                            if (parentObject.type !== 'floatGroup') {
                                title.html(updatedTitle);
                            } else {
                                parentObject.widget.find('.jqx-window-header').children().eq(0).html(updatedTitle);
                            }
                        }
                    });
                    ribbon.on('unselect', function (event) {
                        event.stopPropagation();
                        if (event.target.id === ribbon[0].id) {
                            current.items[event.args.unselectedIndex].selected = false;
                        }
                    });
                    ribbon.on('reorder', function (event) {
                        that._swapPanelsInLayout(current.items, event.args.newIndex, event.args.oldIndex);
                        var newIndex = event.args.newIndex;
                        setTimeout(function () {
                            if (current.items[newIndex]) {
                                that._addRightClickHandler($(ribbon.find('.jqx-ribbon-item')[newIndex]), current.items[newIndex].widget);
                            }
                        }, 200);
                    });
                    if (removeByDrag) {
                        ribbon.on('_removeByDrag', function (event) {
                            that.dockingLayout._removeByDragHandler(event, current, ribbon);
                            if (current.parent.type === 'floatGroup' && current.items.length === 1) {
                                ribbon.jqxRibbon({ _removeByDrag: false });
                            }
                        });

                        that.dockingLayout._addTabbedGroupHandlers(current, currentElement);
                    }

                    ribbon.jqxRibbon('selectAt', getInitialSelection());
                    break;
                case 'documentGroup':
                    if (that.dockingLayout && (current.allowDrag !== false)) {
                        removeByDrag = true;
                    }

                    currentElement.jqxRibbon({
                        theme: that.theme,
                        width: width,
                        height: height,
                        _roundedCorners: false,
                        position: 'top',
                        selectedIndex: getInitialSelection(),
                        selectionMode: 'click',
                        animationType: 'none',
                        rtl: that.rtl,
                        initContent: function (index) {
                            var currentItem = current.items[index];
                            if (!currentItem.initialized && currentItem.initContent) {
                                currentItem.initContent(currentElement.find('.jqx-ribbon-content-section').eq(index));
                                currentItem.initialized = true;
                            }
                        },
                        _removeByDrag: removeByDrag,
                        reorder: true
                    });
                    currentElement.on('select', function (event) {
                        event.stopPropagation();
                        if (event.target.id === currentElement[0].id) {
                            current.items[event.args.selectedIndex].selected = true;
                        }
                    });
                    currentElement.on('unselect', function (event) {
                        event.stopPropagation();
                        if (event.target.id === currentElement[0].id) {
                            current.items[event.args.unselectedIndex].selected = false;
                        }
                    });
                    currentElement.on('reorder', function (event) {
                        that._swapPanelsInLayout(current.items, event.args.newIndex, event.args.oldIndex);
                        var newIndex = event.args.newIndex;
                        setTimeout(function () {
                            that._addRightClickHandler($(currentElement.find('.jqx-ribbon-item')[newIndex]), current.items[newIndex].widget);
                        }, 200);
                    });
                    if (removeByDrag) {
                        currentElement.on('_removeByDrag', function (event) {
                            that.dockingLayout._removeByDragHandler(event, current, currentElement);
                        });
                    }
                    currentElement.addClass(that.toThemeProperty('jqx-layout-group-document'));
                    break;
                case 'autoHideGroup':
                    currentElement.jqxRibbon({
                        theme: that.theme,
                        width: width,
                        height: height,
                        mode: 'popup',
                        popupCloseMode: 'click',
                        position: current.alignment,
                        selectionMode: 'click',
                        animationType: 'none',
                        _roundedCorners: false,
                        rtl: that.rtl,
                        initContent: function (index) {
                            var contentIndex = current.alignment === 'top' || current.alignment === 'left' ? 1 : 0,
                                currentContentSection = $($(currentElement.children()[contentIndex]).children()[index]),
                                panel = currentContentSection.find('.jqx-layout-window');
                            panel.current = currentElement.current.items[index];
                            panel.css('border', 'none');
                            that._initWindowPanel(panel, '100%', '100%', current.type);
                            if (!current.items[index].initialized && current.items[index].initContent) {
                                current.items[index].initContent(currentElement.find('.jqx-ribbon-content-section').eq(index).children().children().eq(1));
                                current.items[index].initialized = true;
                            }
                        }
                    });
                    currentElement.addClass(that.toThemeProperty('jqx-layout-group-auto-hide'));
                    break;
                case 'floatGroup':
                    currentElement.addClass(that.element.id + 'FloatGroup');

                    currentElement.jqxWindow({
                        theme: that.theme,
                        width: current.width,
                        maxWidth: null,
                        height: current.height,
                        maxHeight: null,
                        position: { x: current.position.x, y: current.position.y },
                        showCloseButton: current.allowClose !== false,
                        closeButtonAction: 'close',
                        rtl: that.rtl,
                        initContent: function () {
                            var header = currentElement.find('.jqx-window-header'),
                                eventName = that._touchDevice ? 'touchstart' : 'mousedown';

                            header.on(eventName, function () {
                                that.dockingLayout._windowDragged = true;
                                if (current._overlayGroup) {
                                    current._overlayGroup.self = true;
                                }

                                that.dockingLayout._interval();

                                if (that.resizable) {
                                    that._overlay[0].style.display = 'block';
                                }
                                var fromGroup, fromPanel, title;

                                if (current.items[0].type === 'documentPanel') {
                                    fromGroup = { type: 'documentGroup' };
                                    fromPanel = current.items[0];
                                    title = fromPanel.title;
                                } else if (current.items[0].type === 'layoutPanel') {
                                    fromGroup = { type: 'tabbedGroup' };
                                    fromPanel = current.items[0];
                                    title = fromPanel.title;
                                } else if (current.items[0].type === 'tabbedGroup') {
                                    fromGroup = current.items[0];
                                }

                                that.dockingLayout._draggedWindow = { fromGroup: fromGroup, fromPanel: fromPanel, title: title, element: currentElement };
                                that.dockingLayout._showEdgeOverlays();
                            });

                            header.on('mouseup', function () {
                                that.dockingLayout._hideOverlays();
                            });

                            if (current.items[0].type === 'tabbedGroup') {
                                var windowTitle = current.items[0].items[currentElement.find('.jqx-ribbon').jqxRibbon('selectedIndex')].title;
                                currentElement.jqxWindow('setTitle', windowTitle);
                            } else {
                                if (current.items[0].initContent) {
                                    current.items[0].initContent(currentElement.find('.jqx-widget-content'));
                                }
                            }
                        }
                    });

                    currentElement.on('moved', function (event) {
                        current.position.x = event.args.x;
                        current.position.y = event.args.y;
                        if (current._overlayGroup) {
                            that.dockingLayout._updateOverlayGroup(current._overlayGroup);
                        }
                        that.dockingLayout._windowCreate = false;
                        that.dockingLayout._hideOverlays();
                        that.dockingLayout._clearTextSelection();
                    });
                    currentElement.on('resized', function (event) {
                        current.width = event.args.width;
                        current.height = event.args.height;
                        var offset = $(this).offset();
                        current.position.x = offset.left;
                        current.position.y = offset.top;
                        if (current._overlayGroup) {
                            that.dockingLayout._updateOverlayGroup(current._overlayGroup);
                        }
                    });
                    currentElement.on('close', function (event) {
                        event.stopPropagation();
                        if (event.target.id === currentElement[0].id) {
                            if (currentElement.current._overlayGroup) {
                                currentElement.current._overlayGroup.removed = true;
                                that.dockingLayout._updateOverlayGroups();
                            }
                            that.dockingLayout._removeFloatGroupObject(currentElement.current);
                        }
                    });
                    break;
            }
        },

        // creates pseudo-jqxWindow panels
        _initWindowPanel: function (currentElement, width, height, type) {
            var that = this;

            currentElement.addClass(that.toThemeProperty('jqx-widget jqx-widget-content jqx-window jqx-layout-pseudo-window jqx-rc-all'));
            if (!that._ie7) {
                currentElement.css({ 'width': width, 'height': height });
            } else {
                // IE7 fix
                var parent = currentElement.parent();
                if (type === 'tabbedGroup') {
                    var borderL = parseInt(currentElement.css('border-left-width'), 10),
                        borderR = parseInt(currentElement.css('border-right-width'), 10),
                        borderT = parseInt(currentElement.css('border-top-width'), 10),
                        borderB = parseInt(currentElement.css('border-bottom-width'), 10),
                        ie7Width, ie7Height;

                    // width
                    if (width === '100%') {
                        ie7Width = parent.width();
                    } else {
                        ie7Width = parseFloat(width) / 100 * parent.width();
                    }

                    ie7Width -= borderL + borderR;

                    // height
                    if (height === '100%') {
                        ie7Height = parent.height();
                    } else {
                        ie7Height = parseFloat(height) / 100 * parent.height();
                    }
                    ie7Height -= borderT + borderB;

                    currentElement.css({ 'width': ie7Width, 'height': ie7Height });
                } else if (type === 'autoHideGroup') {
                    currentElement.css({ 'width': width, 'height': height });
                }
            }

            var rtl = that.rtl ? 'rtl' : 'ltr';

            var header = $(currentElement.children()[0]);

            var title = header.children();
            title.addClass(that.toThemeProperty('jqx-layout-pseudo-window-title jqx-layout-pseudo-window-title-' + rtl));

            header.addClass(that.toThemeProperty('jqx-widget-header jqx-window-header jqx-disableselect jqx-layout-pseudo-window-header'));
            if (that._ie7) {
                // IE7 fix
                header.css('width', header.width() - parseInt(header.css('padding-left'), 10) - parseInt(header.css('padding-right'), 10));
                header.css('height', header.height() - parseInt(header.css('padding-top'), 10) - parseInt(header.css('padding-bottom'), 10));
            }

            var iconsWidth = 0,
                iconClose, iconPin;

            if ((that.dockingLayout && currentElement.current.allowClose !== false) || (!that.dockingLayout && currentElement.current.allowClose === true)) {
                iconClose = $('<div class="' + that.toThemeProperty('jqx-window-close-button-background jqx-layout-pseudo-window-close-background jqx-layout-pseudo-window-close-background-' + rtl) +
                    '" title="Close"><div class="' + that.toThemeProperty('jqx-window-close-button jqx-icon-close jqx-layout-pseudo-window-close-icon') + '"></div></div>');
                header.append(iconClose);
                iconsWidth += 16;
            }

            if ((type === 'tabbedGroup' && currentElement.current.allowPin !== false) || (type === 'autoHideGroup' && currentElement.current.parent.allowUnpin !== false)) {
                var pinClass;
                switch (type) {
                    case 'tabbedGroup':
                        pinClass = 'jqx-layout-pseudo-window-pin-icon';
                        currentElement.pinned = false;
                        break;
                    case 'autoHideGroup':
                        pinClass = 'jqx-layout-pseudo-window-pinned-icon';
                        currentElement.pinned = true;
                        break;
                }

                iconPin = $('<div class="' + that.toThemeProperty('jqx-window-close-button-background jqx-layout-pseudo-window-pin-background') +
                    '" title="Auto Hide"><div class="' + that.toThemeProperty(pinClass) + '"></div></div>');
                if (iconClose) {
                    iconPin.addClass(that.toThemeProperty('jqx-layout-pseudo-window-pin-background-' + rtl));
                } else if (that.rtl === false) {
                    iconPin.css('right', 0);
                }
                header.append(iconPin);
                iconsWidth += 16;

                if (that.dockingLayout && type === 'autoHideGroup') {
                    that.dockingLayout._addAutoHideGroupHandlers(currentElement.current, header, currentElement.current.title, $(currentElement.children()[1]).contents());
                }
            }

            title.css('max-width', header.width() - iconsWidth);

            var content = $(currentElement.children()[1]);
            content.css('height', 1 + currentElement.height() - header.outerHeight());
            content.css('margin-left', '-1px');
            content.css('margin-right', '-1px');

            that._addWindowPanelHandlers(iconClose, iconPin, currentElement);

            return title;
        },

        // adds handlers for the close, pin and unpin icons
        _addWindowPanelHandlers: function (close, pin, panel) {
            var that = this,
                id = that.element.id,
                settings = panel.current,
                type = settings.type;

            if (close) {
                that.addHandler(close, 'click.jqxLayout' + id, function () {
                    if (type === 'tabbedGroup' && settings.items.length > 1) {
                        var selectedIndex = panel.find('.jqx-ribbon-item-selected')[0]._index;
                        that._close(settings.items[selectedIndex]);
                    } else {
                        panel.fadeOut(function () {
                            that._close(settings);
                            panel.remove();
                        });
                    }
                });
            }

            if (pin) {
                that.addHandler(pin, 'click.jqxLayout' + id, function () {
                    if (type === 'tabbedGroup' && settings.pinValid === true) {
                        that._pin(settings);
                    } else if (type === 'layoutPanel') {
                        that._unPin(settings.parent);
                    }
                });
            }
        },

        // gets layoutGroup, tabbedGroup and documentGroup coordinates for use in resizing
        _getGroupCoordinates: function () {
            var that = this;
            that._coordinates = [];

            function checkType(type) {
                return type === 'layoutGroup' || type === 'tabbedGroup' || type === 'documentGroup';
            }

            function getItemsCoordinates(items) {
                for (var i = 0; i < items.length; i++) {
                    var currentGroup = items[i];

                    if (checkType(currentGroup.type)) {
                        var prev = items[i - 1],
                            next = items[i + 1],
                            offset = currentGroup.widget.offset(),
                            xFrom, xTo, yFrom, yTo, side;

                        if (prev && checkType(prev.type)) {
                            if (currentGroup.parent.orientation === 'horizontal') {
                                xFrom = offset.left - 5;
                                xTo = xFrom + 10;
                                yFrom = offset.top - 5;
                                yTo = yFrom + currentGroup.widget.height() + 10;
                                side = 'left';
                            } else {
                                xFrom = offset.left - 5;
                                xTo = xFrom + currentGroup.widget.width() + 10;
                                yFrom = offset.top - 5;
                                yTo = yFrom + 10;
                                side = 'top';
                            }
                            that._coordinates.push({ x: { from: xFrom, to: xTo }, y: { from: yFrom, to: yTo }, widget: currentGroup.widget, side: side, orientation: currentGroup.parent.orientation });
                        }
                        if (next && checkType(next.type)) {
                            if (currentGroup.parent.orientation === 'horizontal') {
                                xFrom = offset.left + currentGroup.widget.width() - 5;
                                xTo = xFrom + 10;
                                yFrom = offset.top - 5;
                                yTo = yFrom + currentGroup.widget.height() + 10;
                                side = 'right';
                            } else {
                                xFrom = offset.left - 5;
                                xTo = xFrom + currentGroup.widget.width() + 10;
                                yFrom = offset.top + currentGroup.widget.height() - 5;
                                yTo = yFrom + 10;
                                side = 'bottom';
                            }
                            that._coordinates.push({ x: { from: xFrom, to: xTo }, y: { from: yFrom, to: yTo }, widget: currentGroup.widget, side: side, orientation: currentGroup.parent.orientation });
                        }

                        if (currentGroup.items) {
                            getItemsCoordinates(currentGroup.items);
                        }
                    }
                }
            }

            getItemsCoordinates(that.layout[0].items);
        },

        // handles group/panel closing
        _close: function (settings) {
            var that = this,
                ribbon;

            settings.removed = true;

            if (settings.type === 'tabbedGroup' || settings.type === 'autoHideGroup' || settings.type === 'documentGroup') {
                ribbon = settings.type === 'tabbedGroup' ? settings.widget.find('.jqx-ribbon') : settings.widget;
                ribbon.jqxRibbon('destroy');

                if (settings.parent.items) {
                    var prev = settings.parent.items[settings.index - 1],
                        next = settings.parent.items[settings.index + 1],
                        dim = settings.parent.orientation === 'vertical' ? 'height' : 'width';

                    var resize = function (item) {
                        var newDim = (parseFloat(item[dim]) + parseFloat(settings[dim])) + '%';
                        if (item.type === 'documentGroup') {
                            if (dim === 'height') {
                                item.widget.jqxRibbon({ height: newDim });
                            } else {
                                item.widget.jqxRibbon({ width: newDim });
                            }
                        } else if (item.type === 'layoutGroup' || item.type === 'tabbedGroup') {
                            item.widget.css(dim, newDim);
                        }
                        item[dim] = newDim;
                        that._raiseEvent('1', { item: item }); // 'resize' event
                    };

                    if (prev && prev.type !== 'autoHideGroup' && prev.type !== 'floatGroup') {
                        resize(prev);
                    } else if (next && next.type !== 'autoHideGroup' && next.type !== 'floatGroup') {
                        resize(next);
                    }
                }
            } else if (settings.type === 'layoutPanel') {
                if (settings.parent.type === 'tabbedGroup') {
                    ribbon = settings.parent.widget.find('.jqx-ribbon');
                    ribbon.jqxRibbon('removeAt', settings.index);
                    that._updateLayout(that.layout);
                    if (settings.index === 0) {
                        ribbon.jqxRibbon('selectAt', 0);
                    } else {
                        ribbon.jqxRibbon('selectAt', settings.index - 1);
                    }
                    return;
                } else if (settings.parent.type === 'autoHideGroup') {
                    ribbon = settings.parent.widget;
                    ribbon.jqxRibbon('removeAt', settings.index);
                    var ribbonItems = ribbon.children('ul').children();
                    if (ribbonItems.length === 0) {
                        that._close(ribbon.current);
                    }
                }
            }

            that._updateLayout(that.layout);
            that.render();
        },

        // updates the layout object
        _updateLayout: function (items) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].removed === true) {
                    items.splice(i, 1);
                    for (var j = 0; j < items.length; j++) {
                        items[j].index = j;
                    }
                } else if (items[i].items) {
                    this._updateLayout(items[i].items);
                }
            }
        },

        // pins a tabbedGroup
        _pin: function (settings) {
            var that = this,
                rootGroup = settings.parent,
                alignment, dim, pinnedDim;

            if (settings.alignment) {
                alignment = settings.alignment;
            } else {
                var bottomRightDiff = Math.abs(settings.parent.items.length - 1 - settings.index),
                    topLeftDiff = Math.abs(0 - settings.index);
                if (topLeftDiff < bottomRightDiff) {
                    alignment = settings.parent.orientation === 'horizontal' ? 'left' : 'top';
                } else {
                    alignment = settings.parent.orientation === 'horizontal' ? 'right' : 'bottom';
                }
            }

            var neighbourIndex = alignment === 'top' || alignment === 'left' ? settings.index + 1 : settings.index - 1;

            if (alignment === 'left' || alignment === 'right') {
                dim = 'width';
                pinnedDim = settings.pinnedWidth;
            } else {
                dim = 'height';
                pinnedDim = settings.pinnedHeight;
            }
            if (!pinnedDim) {
                if (dim === 'width') {
                    pinnedDim = (8000 / settings.parent.widget.width()) + '%';
                } else if (dim === 'height') {
                    pinnedDim = (3000 / settings.parent.widget.height()) + '%';
                }
            }

            that._detachContent(settings.items, true);

            var newItemObject = { type: 'autoHideGroup', alignment: alignment, items: settings.items };
            newItemObject[dim] = pinnedDim;
            newItemObject['min' + dim.charAt(0).toUpperCase() + dim.slice(1)] = settings['min' + dim.charAt(0).toUpperCase() + dim.slice(1)];
            newItemObject['unpinned' + dim.charAt(0).toUpperCase() + dim.slice(1)] = settings[dim];
            newItemObject.allowDrag = settings.allowDrag;
            newItemObject.allowDrop = settings.allowDrop;
            var neighbourGroup = rootGroup.items[neighbourIndex];
            neighbourGroup[dim] = parseFloat(neighbourGroup[dim]) + parseFloat(settings[dim]) - parseFloat(pinnedDim) + '%';
            rootGroup.items.splice(settings.index, 0, newItemObject);
            settings.removed = true;
            settings.widget.find('.jqx-ribbon').jqxRibbon('destroy');
            settings.widget.remove();
            that._updateLayout(that.layout);
            that.render();
            that._raiseEvent('1', { item: neighbourGroup }); // 'resize' event
            that._raiseEvent('2', { item: newItemObject }); // 'pin' event
        },

        // unpins an autoHideGroup
        _unPin: function (settings) {
            var that = this,
                rootGroup = settings.parent,
                alignment = settings.alignment,
                neighbourIndex = alignment === 'top' || alignment === 'left' ? settings.index + 1 : settings.index - 1,
                neighbour = rootGroup.items[neighbourIndex],
                dim, unpinnedDim, resizedItem;

            if (alignment === 'left' || alignment === 'right') {
                dim = 'width';
                unpinnedDim = settings.unpinnedWidth;
            } else {
                dim = 'height';
                unpinnedDim = settings.unpinnedHeight;
            }
            if (!unpinnedDim) {
                unpinnedDim = '10%';
            }

            that._detachContent(settings.items, true);

            var newItemObject = { type: 'tabbedGroup', alignment: alignment, items: settings.items };
            newItemObject['pinned' + dim.charAt(0).toUpperCase() + dim.slice(1)] = settings[dim];
            newItemObject.allowDrag = settings.allowDrag;
            newItemObject.allowDrop = settings.allowDrop;

            if (neighbour) {
                // check if neighbour will become smaller than minumum after unpin
                var newNeighbourDim = parseFloat(neighbour[dim]) + parseFloat(settings[dim]) - parseFloat(unpinnedDim) + '%',
                minNeighbourDim = neighbour['min' + dim.charAt(0).toUpperCase() + dim.slice(1)];
                if (!minNeighbourDim) {
                    minNeighbourDim = that['minGroup' + dim.charAt(0).toUpperCase() + dim.slice(1)];
                }
                if (parseFloat(newNeighbourDim) < that._getPercentage(minNeighbourDim, rootGroup, dim)) {
                    unpinnedDim = settings[dim];
                    newNeighbourDim = that._getPercentage(minNeighbourDim, rootGroup, dim) + '%';
                    newItemObject['min' + dim.charAt(0).toUpperCase() + dim.slice(1)] = settings.widget.width();
                } else {
                    newItemObject['min' + dim.charAt(0).toUpperCase() + dim.slice(1)] = settings['min' + dim.charAt(0).toUpperCase() + dim.slice(1)];
                }

                newItemObject[dim] = unpinnedDim;
                neighbour[dim] = newNeighbourDim;
                resizedItem = neighbour;
            } else {
                newItemObject['min' + dim.charAt(0).toUpperCase() + dim.slice(1)] = settings['min' + dim.charAt(0).toUpperCase() + dim.slice(1)];
                newItemObject[dim] = '100%';
                resizedItem = newItemObject;
            }
            rootGroup.items.splice(settings.index, 0, newItemObject);
            settings.removed = true;
            settings.widget.jqxRibbon('destroy');
            that._updateLayout(that.layout);
            that.render();
            that._raiseEvent('1', { item: resizedItem }); // 'resize' event
            that._raiseEvent('3', { item: newItemObject }); // 'unpin' event
        },

        // makes a deep copy of a layout item
        _copyItem: function (object, target) {
            var current = {};
            for (var property in object) {
                if (object.hasOwnProperty(property) && property !== 'parent' && property !== 'widget' && property !== 'initialized') {
                    if (property === 'position') {
                        current.position = { x: object.position.x, y: object.position.y };
                    } else if (property === 'items') {
                        var currentItems = [];
                        for (var i = 0; i < object.items.length; i++) {
                            this._copyItem(object.items[i], currentItems);
                        }
                        current.items = currentItems;
                    } else {
                        current[property] = object[property];
                    }
                }
            }
            target.push(current);
        },

        // appends horizontal and vertical resize feedbacks
        _addResizeFeedbacks: function () {
            var that = this;
            that._horizontalFeedback = $('<div class="' + that.toThemeProperty('jqx-fill-state-normal jqx-layout-resize-feedback jqx-layout-resize-feedback-horizontal') + '"></div>');
            that._verticalFeedback = $('<div class="' + that.toThemeProperty('jqx-fill-state-normal jqx-layout-resize-feedback jqx-layout-resize-feedback-vertical') + '"></div>');
            that._overlay = $('<div class="' + that.toThemeProperty('jqx-layout-overlay') + '"></div>');

            if (that.dockingLayout && that.dockingLayout._windowDragged) {
                that._overlay[0].style.display = 'block';
            }

            that.host.append(that._horizontalFeedback, that._verticalFeedback, that._overlay);
        },

        // detaches panels' content for a later reattachment
        _detachContent: function (items, preventFurtherDetach) {
            function detachRibbonContent(currentItem) {
                if (currentItem.prevent === true) {
                    currentItem.prevent = false;
                } else {
                    var contentSection = currentItem.parent.widget.find('.jqx-ribbon-content-section').eq(currentItem.index);
                    detachedContent = contentSection.contents().detach();
                    contentSection.remove();
                    currentItem.detachedContent = detachedContent;
                    if (preventFurtherDetach === true) {
                        currentItem.prevent = true;
                    }
                }
            }

            for (var i = items.length - 1; i >= 0; i--) {
                var currentItem = items[i],
                    type = currentItem.type,
                    detachedContent;

                if (type === 'layoutGroup' || type === 'tabbedGroup' || type === 'documentGroup' || type === 'autoHideGroup' || type === 'floatGroup') {
                    if (currentItem.items && currentItem.items.length > 0) {
                        this._detachContent(currentItem.items);
                    }
                } else if (type === 'layoutPanel') {
                    if (currentItem.parent.type === 'tabbedGroup') {
                        detachRibbonContent(currentItem);
                    } else if (currentItem.parent.type === 'autoHideGroup') {
                        if (currentItem.prevent === true) {
                            currentItem.prevent = false;
                        } else {
                            if (currentItem.parent.alignment === 'left' || currentItem.parent.alignment === 'right') {
                                var verticalContent = currentItem.parent.widget.find('.jqx-layout-group-auto-hide-content-vertical').eq(i);
                                detachedContent = verticalContent.contents().detach();
                                verticalContent.remove();
                            } else {
                                var horizontalContent = currentItem.parent.widget.find('.jqx-layout-group-auto-hide-content-horizontal').eq(i);
                                detachedContent = horizontalContent.contents().detach();
                                horizontalContent.remove();
                            }
                            currentItem.detachedContent = detachedContent;
                            if (preventFurtherDetach === true) {
                                currentItem.prevent = true;
                            }
                        }
                    }
                } else if (type === 'documentPanel') {
                    detachRibbonContent(currentItem);
                }
            }
        },

        // converts pixel values of dimensions to percentages
        _pxToPercent: function (group, root) {
            function returnPercentage(pixels, dimension) {
                var result, parentDimension;

                pixels = parseInt(pixels, 10);

                if (root) {
                    parentDimension = that.host[dimension]();
                } else {

                    parentDimension = group['initialPx' + dimension.charAt(0).toUpperCase() + dimension.slice(1)];
                }

                result = (100 * pixels / parentDimension).toString() + '%';
                return result;
            }

            var that = this;

            for (var i = 0; i < group.items.length; i++) {
                var currentItem = group.items[i];

                if (currentItem.width !== undefined) {
                    currentItem.initialPxWidth = currentItem.width;
                    currentItem.width = returnPercentage(currentItem.width, 'width');
                } else {
                    currentItem.initialPxWidth = group.initialPxWidth;
                }
                if (currentItem.height !== undefined) {
                    currentItem.initialPxHeight = currentItem.height;
                    currentItem.height = returnPercentage(currentItem.height, 'height');
                } else {
                    currentItem.initialPxHeight = group.initialPxHeight;
                }

                if (currentItem.unpinnedWidth !== undefined) {
                    currentItem.unpinnedWidth = returnPercentage(currentItem.unpinnedWidth, 'width');
                }
                if (currentItem.pinnedWidth !== undefined) {
                    currentItem.pinnedWidth = returnPercentage(currentItem.pinnedWidth, 'width');
                }
                if (currentItem.unpinnedHeight !== undefined) {
                    currentItem.unpinnedHeight = returnPercentage(currentItem.unpinnedHeight, 'height');
                }
                if (currentItem.pinnedHeight !== undefined) {
                    currentItem.pinnedHeight = returnPercentage(currentItem.pinnedHeight, 'height');
                }

                if (currentItem.type === 'layoutGroup' && currentItem.items && currentItem.items.length > 0) {
                    that._pxToPercent(currentItem, false);
                }
            }
        },

        // converts percentage values of minGroupWidth/minGroupHeight/minWidth/minHeight to pixels
        _percentToPx: function (dimension, value, parent) {
            if (value === undefined) {
                return undefined;
            } else if (typeof value !== 'string' || (typeof value === 'string' && value.charAt(value.length - 1) !== '%')) {
                return parseFloat(value);
            } else {
                return parseFloat(value.slice(0, value.length - 1)) / 100 * parent.widget[dimension]();
            }
        },

        // swaps panels in the layout array when they are reordered with the mouse
        _swapPanelsInLayout: function (parentItems, a, b) {
            var temp = parentItems[a];
            parentItems[a] = parentItems[b];
            parentItems[a].index = a;
            parentItems[b] = temp;
            parentItems[b].index = b;
        },

        // initializes the widget's context menu
        _initMenu: function () {
            var that = this;
            if (!that._menuInitialized) {
                var id = that.element.id,
                    floatOption = '',
                    disableItems = function (dock, autoHide, close) {
                        that._menu.jqxMenu('disable', 'dockOption' + id, dock);
                        that._menu.jqxMenu('disable', 'autoHideOption' + id, autoHide);
                        that._menu.jqxMenu('disable', 'closeOption' + id, close);
                    };

                if (!that.host.jqxMenu) {
                    throw new Error('jqxLayout: Missing reference to jqxmenu.js.');
                }

                if (that.dockingLayout) {
                    floatOption = '<li id="floatOption' + id + '">Float</li>';
                }

                that._menu = $(
                '<div class="' + that.toThemeProperty('jqx-layout-context-menu jqx-layout-context-menu-' + id) + '">' +
                    '<ul>' + floatOption +
                        '<li id="dockOption' + id + '">Dock</li>' +
                        '<li id="autoHideOption' + id + '" style="white-space: nowrap;">Auto Hide</li>' +
                        '<li id="closeOption' + id + '">Close</li>' +
                    '</ul>' +
                '</div>'
                );

                $('body').append(that._menu);

                that._menu.jqxMenu({ theme: that.theme, width: 100, height: 'auto', autoOpenPopup: false, mode: 'popup', popupZIndex: 99999, rtl: that.rtl });
                that._menuInitialized = true;

                that._menu.on('itemclick', function (event) {
                    that._handleMenuItemClick($(event.target).text());
                });

                var disableClose = function (item) {
                    if (that.dockingLayout) {
                        return item.allowClose === false;
                    } else {
                        return item.allowClose !== true;
                    }
                };

                that._menu.on('shown', function () {
                    switch (that._contextMenuTarget.type) {
                        case 'tabbedGroup':
                            disableItems(true, that._contextMenuTarget.allowPin === false || that._contextMenuTarget.pinValid === false, disableClose(that._contextMenuTarget));
                            break;
                        case 'layoutPanel':
                            var parent = that._contextMenuTarget.parent;
                            if (parent.type === 'tabbedGroup') {
                                disableItems(true, parent.allowPin === false || that._isMiddleTabbedGroup(parent), disableClose(parent));
                            } else if (parent.type === 'autoHideGroup') {
                                disableItems(parent.allowUnpin === false, true, disableClose(that._contextMenuTarget));
                            }
                            break;
                        case 'documentPanel':
                            disableItems(true, true, disableClose(that._contextMenuTarget));
                            break;
                    }
                });
            }
        },

        // adds a right click handler to an item
        _addRightClickHandler: function (target, currentElement) {
            var that = this;
            if (that.contextMenu === true) {
                that.addHandler(target, 'mousedown.jqxLayout' + that.element.id, function (event) {
                    if (that.contextMenu === true && ((event.which && event.which === 3) || (event.button && event.button === 2))) {
                        var scrollTop = $(window).scrollTop(),
                            scrollLeft = $(window).scrollLeft();
                        that._contextMenuTarget = currentElement.current;
                        that._menu.jqxMenu('open', parseInt(event.clientX, 10) + 5 + scrollLeft, parseInt(event.clientY, 10) + 5 + scrollTop);
                    }
                });

                that.addHandler(target, 'contextmenu.jqxLayout' + that.element.id, function () {
                    if (that.contextMenu === true) {
                        return false;
                    }
                });
            }
        },

        // handles context menu item clicks
        _handleMenuItemClick: function (item) {
            var that = this,
                type = that._contextMenuTarget.type,
                parent = that._contextMenuTarget.parent;

            switch (item) {
                case 'Float':
                    switch (type) {
                        case 'tabbedGroup':
                            that.dockingLayout._floatTabbedGroup(that._contextMenuTarget, that._contextMenuTarget.widget);
                            break;
                        case 'layoutPanel':
                            if (parent.type === 'tabbedGroup') {
                                that.dockingLayout._removeByDragHandler(undefined, parent, parent.widget, that._contextMenuTarget.index, false);
                            } else if (parent.type === 'autoHideGroup') {
                                var content = that._contextMenuTarget.parent.widget.find('.jqx-ribbon-content').children().eq(that._contextMenuTarget.index).find('.jqx-layout-window').children().eq(1).contents();
                                that.dockingLayout._floatAutoHideGroup(that._contextMenuTarget, that._contextMenuTarget.title, content);
                            }
                            break;
                        case 'documentPanel':
                            that.dockingLayout._removeByDragHandler(undefined, parent, parent.widget, that._contextMenuTarget.index, false);
                            break;
                    }
                    break;
                case 'Dock':
                    that._unPin(that._contextMenuTarget.parent);
                    break;
                case 'Auto Hide':
                    switch (type) {
                        case 'tabbedGroup':
                            that._pin(that._contextMenuTarget);
                            break;
                        case 'layoutPanel':
                            that._pin(that._contextMenuTarget.parent);
                            break;
                    }
                    break;
                case 'Close':
                    switch (type) {
                        case 'tabbedGroup':
                            that._close(that._contextMenuTarget);
                            break;
                        case 'layoutPanel':
                            if (that._contextMenuTarget.parent.items.length > 1) {
                                that._close(that._contextMenuTarget);
                            } else {
                                that._close(that._contextMenuTarget.parent);
                            }
                            break;
                        case 'documentPanel':
                            that._closeDocumentPanel(that._contextMenuTarget.index, that._contextMenuTarget.parent.items, that._contextMenuTarget.parent, that._contextMenuTarget.parent.widget, false);
                            break;
                    }
            }
        },

        // closes a document panel
        _closeDocumentPanel: function (index, documents, documentGroup, ribbon, drag) {
            var that = this;

            if (drag === false) {
                ribbon.jqxRibbon('removeAt', index);
            }

            if (documents.length > 1) {
                var hasSelectedItem = false;

                documents[index].removed = true;
                that._updateLayout(documents);

                for (var i = 0; i < documents.length; i++) {
                    if (documents[i].selected === true) {
                        hasSelectedItem = true;
                        break;
                    }
                }
                setTimeout(function () {
                    if (hasSelectedItem === false) {
                        if (documents[index]) {
                            ribbon.jqxRibbon('selectAt', index);
                        } else {
                            ribbon.jqxRibbon('selectAt', index - 1);
                        }
                    } else {
                        ribbon.jqxRibbon('render');
                    }
                }, 0);
            } else { // last document is closed
                that._close(documentGroup);
            }
        },

        // checks if a tabbed group is between the first and last child of its parent group
        _isMiddleTabbedGroup: function (tabbedGroup) {
            return !(tabbedGroup.index === 0 || tabbedGroup.index === tabbedGroup.parent.items.length - 1);
        },

        // checks if a tabbed group can be pinned
        _validateTabbedGroup: function (tabbedGroup) {
            var that = this,
                pinValid = true;

            pinValid = pinValid && tabbedGroup.parent.items.length > 1;
            if (pinValid) {
                if (tabbedGroup.parent.items.length === 2) {
                    var neighbourIndex = tabbedGroup.index === 0 ? 1 : 0;
                    if (tabbedGroup.parent.items[neighbourIndex].type === 'autoHideGroup') {
                        pinValid = false;
                    }
                }
            }
            if (pinValid) {
                pinValid = pinValid && !that._isMiddleTabbedGroup(tabbedGroup);
            }

            tabbedGroup.pinValid = pinValid;
            if (pinValid === false) {
                tabbedGroup.widget.find('.jqx-layout-pseudo-window-pin-background').addClass('jqx-fill-state-disabled');
            }
        },

        _mouseupHandler: function (event) {
            var that = this;
            try {
                if (that.dockingLayout) {
                    that._docUP(event);
                    that.dockingLayout._windowCreate = false;
                    that.dockingLayout._hideOverlays();
                }
            }
            catch (error) {
            }
        }
    });
})(jqxBaseFramework); //ignore jslint
