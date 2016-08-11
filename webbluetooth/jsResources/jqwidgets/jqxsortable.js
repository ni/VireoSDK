/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.extend($.expr[":"], {
        data: $.expr.createPseudo ?
            $.expr.createPseudo(function (dataName) {
                return function (elem) {
                    return !!$.data(elem, dataName);
                };
            }) :
            function (elem, i, match) {
                return !!$.data(elem, match[3]);
            }
    });

    $.jqx.jqxWidget('jqxSortable', '', {});

    $.extend($.jqx._jqxSortable.prototype, {

        defineInstance: function () {
            var settings = {
                appendTo: "parent",
                axis: false,
                connectWith: false,
                containment: false,
                cursor: "auto",
                cursorAt: false,
                dropOnEmpty: true,
                forcePlaceholderSize: false,
                forceHelperSize: false,
                maxItems: 9999,
                grid: false,
                handle: false,
                helper: "original",
                items: "> *",
                opacity: false,
                placeholderShow: false,
                revert: false,
                scroll: true,
                scrollSensitivity: 20,
                scrollSpeed: 20,
                scope: "default",
                tolerance: "intersect",
                zIndex: 999999,
                element: null,
                defaultElement: "<div>",
                mouseHandled: false,
                cancel: "input,textarea,button,select,option",
                distance: 1,
                delay: 0,
                widgetName: "widget",
                widgetEventPrefix: "",
                disabled: false,
                create: null,

                _touchEvents: {
                    'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                    'click': $.jqx.mobile.getTouchEventName('touchstart'),
                    'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
                    'mousemove': $.jqx.mobile.getTouchEventName('touchmove'),
                    'mouseenter': 'mouseenter',
                    'mouseleave': 'mouseleave'
                },

                _events: [
                    'activate', 'beforeStop', 'change', 'deactivate',
                'out', 'over', 'receive', 'remove', 'sort', 'start', 'stop', 'update', 'create'
                ]

            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            this._render();
        },

        _render: function () {
            var that = this;
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            this.containerCache = {};

            var element = $(element || that.defaultElement || this)[0];
            that.document = $(element.style ?
               element.ownerDocument :
               element.document || element);
            that.window = $(that.document[0].defaultView || that.document[0].parentWindow);

            that.host.addClass(that.toThemeProperty("jqx-widget jqx-sortable"));
            that.refresh();
            that.floating = that.itemsArray.length ? that.axis === "x" || that._isFloating(that.itemsArray[0].item) : false;
            that.offset = that.host.offset();
            that._handleMouse();
            that._cancelSelect();
            that.ready = true;
        },

        _isOverAxis: function (x, reference, size) {
            return (x >= reference) && (x < (reference + size));
        },

        _isFloating: function (item) {
            return (/left|right/).test(item.css("float")) || (/inline|table-cell/).test(item.css("display"));
        },

        _getEvent: function (event) {
            if (this._isTouchDevice) {
                return this._touchEvents[event] + ".jqxSortable" + this.element.id;;
            } else {
                return event + ".jqxSortable" + this.element.id;
            }
        },

        _handleMouse: function () {
            var that = this;

            that.addHandler(this.host, this._getEvent("mousedown"), function (event) {
                return that._mouseDown(event);
            });

            that.addHandler(that.host, this._getEvent("click"), function (event) {
                if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
                    $.removeData(event.target, that.widgetName + ".preventClickEvent");
                    event.stopImmediatePropagation();
                    return false;
                }
            });

            that.started = false;
        },

        widget: function () {
            return this.host;
        },

        _mouseDestroy: function () {
            var that = this;
            that.host.off("." + this.widgetName);
            if (that._mouseMoveDelegate) {
                that.removeHandler($(document),  this._getEvent("mousemove"));
                that.removeHandler($(document),  this._getEvent("mouseup"));
            }
        },

        _mouseDown: function (event) {
            var that = this;
            if (that.mouseHandled) {
                return;
            }

            that._mouseMoved = false;
            if (that._isTouchDevice) {
                var pos = $.jqx.position(event);
                event.pageX = pos.left;
                event.pageY = pos.top;
            }
            (that._mouseStarted && that._mouseUp(event));

            that._mouseDownEvent = event;
            if (this._isTouchDevice) {
                event.which = 1;
            }
             var btnIsLeft = (event.which === 1),
                elIsCancel = (typeof this.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.cancel).length : false);
             if (this._isTouchDevice) {
                 btnIsLeft = true;
             }
             if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
                return true;
            }

            that.mouseDelayMet = !that.delay;
            if (!that.mouseDelayMet) {
                that._mouseDelayTimer = setTimeout(function () {
                    that.mouseDelayMet = true;
                }, that.delay);
            }

            if (that._mouseDistanceMet(event) && that._mouseDelayMet(event)) {
                that._mouseStarted = (that._mouseStart(event) !== false);
                if (!that._mouseStarted) {
                    event.preventDefault();
                    return true;
                }
            }

            if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
                $.removeData(event.target, this.widgetName + ".preventClickEvent");
            }

            that._mouseMoveDelegate = function (event) {
                return that._mouseMove(event);
            };
            that._mouseUpDelegate = function (event) {
                return that._mouseUp(event);
            };

            that.addHandler($(document), this._getEvent("mousemove"), that._mouseMoveDelegate);
            that.addHandler($(document),  this._getEvent("mouseup"), that._mouseUpDelegate);

            try {
                if (document.referrer != "" || window.frameElement) {
                    if (window.top != null && window.top != window.self) {
                        var eventHandle = function (event) {
                            that._mouseUp(event);
                        };
                        var parentLocation = null;
                        if (window.parent && document.referrer) {
                            parentLocation = document.referrer;
                        }

                        if (parentLocation && parentLocation.indexOf(document.location.host) != -1) {
                            if (window.top.document) {
                                if (window.top.document.addEventListener) {
                                    window.top.document.addEventListener('mouseup', eventHandle, false);

                                } else if (window.top.document.attachEvent) {
                                    window.top.document.attachEvent("on" + 'mouseup', eventHandle);
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
            }

            event.preventDefault();

            mouseHandled = true;
            return true;
        },

        _mouseMove: function (event) {
            var that = this;
            if (this._isTouchDevice) {
                event.which = 1;
                var pos = $.jqx.position(event);
                event.pageX = pos.left;
                event.pageY = pos.top;
            }
            if (that._mouseMoved) {
                if ($.jqx.browser.msie && $.jqx.browser.version > 11) {
                    if (!event.which) {
                        return that._mouseUp(event);
                    }
                }
                else {
                    if ($.jqx.browser.msie && (!document.documentMode || document.documentMode < 9) && !event.button) {
                        return that._mouseUp(event);

                    } else if (!event.which) {
                        return that._mouseUp(event);
                    }
                }
            }

            if (event.which || event.button) {
                that._mouseMoved = true;
            }

            if (that._mouseStarted) {
                that._mouseDrag(event);
                return event.preventDefault();
            }

            if (that._mouseDistanceMet(event) && that._mouseDelayMet(event)) {
                that._mouseStarted =
                    (that._mouseStart(that._mouseDownEvent, event) !== false);
                (that._mouseStarted ? that._mouseDrag(event) : that._mouseUp(event));
            }

            return !that._mouseStarted;
        },

        _mouseUp: function (event) {
            var that = this;
            try
            {
                that.removeHandler($(document),  this._getEvent("mousemove"));
                that.removeHandler($(document),  this._getEvent("mouseup"));

                if (that._mouseStarted) {
                    that._mouseStarted = false;

                    if (event.target === that._mouseDownEvent.target) {
                        $.data(event.target, that.widgetName + ".preventClickEvent", true);
                    }

                    that._mouseStop(event);
                }

                mouseHandled = false;
            }
            catch (error)
            {
            }
            return false;
        },

        _mouseDistanceMet: function (event) {
            return (Math.max(
                    Math.abs(this._mouseDownEvent.pageX - event.pageX),
                    Math.abs(this._mouseDownEvent.pageY - event.pageY)
                ) >= this.distance
            );
        },

        _mouseDelayMet: function (/* event */) {
            return this.mouseDelayMet;
        },

        scrollParent: function (includeHidden) {
            var position = this.css("position"),
                excludeStaticParent = position === "absolute",
                overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
                scrollParent = this.parents().filter(function () {
                    var parent = $(this);
                    if (excludeStaticParent && parent.css("position") === "static") {
                        return false;
                    }
                    return overflowRegex.test(parent.css("overflow") + parent.css("overflow-y") + parent.css("overflow-x"));
                }).eq(0);

            return position === "fixed" || !scrollParent.length ? $(this[0].ownerDocument || document) : scrollParent;
        },

        destroy: function () {
            this.host
                .removeClass("jqx-sortable jqx-sortable-disabled")
                .find(".jqx-sortable-handle")
                    .removeClass("jqx-sortable-handle");
            this._mouseDestroy();

            for (var i = this.itemsArray.length - 1; i >= 0; i--) {
                this.itemsArray[i].item.removeData(this.widgetName + "-item");
            }

            return this;
        },

        _mouseCapture: function (event, overrideHandle) {
            var currentItem = null,
                validHandle = false,
                that = this;

            if (that.reverting) {
                return false;
            }

            if (that.disabled || that.type === "static") {
                return false;
            }

            that._refreshItems(event);

            $(event.target).parents().each(function () {
                if ($.data(this, that.widgetName + "-item") === that) {
                    currentItem = $(this);
                    return false;
                }
            });
            if ($.data(event.target, that.widgetName + "-item") === that) {
                currentItem = $(event.target);
            }

            if (!currentItem) {
                return false;
            }
            if (that.handle && !overrideHandle) {
                $(that.handle, currentItem).find("*").addBack().each(function () {
                    if (this === event.target) {
                        validHandle = true;
                    }
                });
                if (!validHandle) {
                    return false;
                }
            }

            that.currentItem = currentItem;
            that._removeCurrentsFromItems();
            return true;

        },

        _mouseStart: function (event, overrideHandle, noActivation) {

            var i, body,
                that = this;

            that.currentContainer = this;
            that._currentContainer = this;
            that.refreshPositions();

            that.helper = that._utility(event);

            that._cacheHelperProportions(); 
            that._storeMargins();
            that.scrollParent = that.helper.scrollParent();
            that.offset = that.currentItem.offset();
            that.offset = {
                top: that.offset.top - that.margins.top,
                left: that.offset.left - that.margins.left
            };

            $.extend(that.offset, {
                click: { //Where the click happened, relative to the element
                    left: event.pageX - that.offset.left,
                    top: event.pageY - that.offset.top
                },
                parent: that._getParentOffset(),
                relative: that._getRelativeOffset() //This is a relative to absolute position minus the actual position calculation - only used for relative positioned helper
            });

            that.helper.css("position", "absolute");
            that.cssPosition = that.helper.css("position");

            that.originalPosition = that._generatePosition(event);
            that.originalPageX = event.pageX;
            that.originalPageY = event.pageY;

            (that.cursorAt && that._adjustOffsetFromHelper(that.cursorAt));

            that.domPosition = { prev: that.currentItem.prev()[0], parent: that.currentItem.parent()[0] };

            if (that.helper[0] !== that.currentItem[0]) {
                that.currentItem.hide();
            }

            that._createPlaceholder();

            if (that.containment) {
                that._setContainment();
            }

            if (that.cursor && that.cursor !== "auto") { // cursor option
                body = that.document.find("body");

                // support: IE
                that.storedCursor = body.css("cursor");
                body.css("cursor", that.cursor);

                that.storedStylesheet = $("<style>*{ cursor: " + that.cursor + " !important; }</style>").appendTo(body);
            }

            if (that.opacity) { // opacity option
                if (that.helper.css("opacity")) {
                    that._storedOpacity = that.helper.css("opacity");
                }
                that.helper.css("opacity", that.opacity);
            }

            if (that.zIndex) { // zIndex option
                if (that.helper.css("zIndex")) {
                    that._storedZIndex = that.helper.css("zIndex");
                }
                that.helper.css("zIndex", that.zIndex);
            }

            if (that.scrollParent[0] !== that.document[0] && that.scrollParent[0].tagName !== "HTML") {
                that.overflowOffset = that.scrollParent.offset();
            }

            that._raiseEvent('9', that._uiHash());

            if (!that._preserveHelperProportions) {
                that._cacheHelperProportions();
            }

            if (!noActivation) {
                for (i = that.owners.length - 1; i >= 0; i--) {
                    that.owners[i]._raiseEvent('0', that._uiHash(this));
                }
            }

            if ($.jqx.ddmanager) {
                $.jqx.ddmanager.current = this;
            }

            if ($.jqx.ddmanager && !that.dropBehaviour) {
                $.jqx.ddmanager.prepareOffsets(this, event);
            }

            that.dragging = true;

            that.helper.addClass("jqx-sortable-helper");
            that._mouseDrag(event);
            return true;

        },

        _mouseDrag: function (event) {
            var i, item, itemElement, intersection,
                o = this,
                scrolled = false;
            var that = this;
            that.position = that._generatePosition(event);
            that.positionAbs = that._convertPositionTo("absolute");

            if (!that.lastPositionAbs) {
                that.lastPositionAbs = that.positionAbs;
            }

            if (that.scroll) {
                if (that.scrollParent[0] !== that.document[0] && that.scrollParent[0].tagName !== "HTML") {

                    if ((that.overflowOffset.top + that.scrollParent[0].offsetHeight) - event.pageY < o.scrollSensitivity) {
                        that.scrollParent[0].scrollTop = scrolled = that.scrollParent[0].scrollTop + o.scrollSpeed;
                    } else if (event.pageY - that.overflowOffset.top < o.scrollSensitivity) {
                        that.scrollParent[0].scrollTop = scrolled = that.scrollParent[0].scrollTop - o.scrollSpeed;
                    }

                    if ((that.overflowOffset.left + that.scrollParent[0].offsetWidth) - event.pageX < o.scrollSensitivity) {
                        that.scrollParent[0].scrollLeft = scrolled = that.scrollParent[0].scrollLeft + o.scrollSpeed;
                    } else if (event.pageX - that.overflowOffset.left < o.scrollSensitivity) {
                        that.scrollParent[0].scrollLeft = scrolled = that.scrollParent[0].scrollLeft - o.scrollSpeed;
                    }

                } else {

                    if (event.pageY - that.document.scrollTop() < o.scrollSensitivity) {
                        scrolled = that.document.scrollTop(that.document.scrollTop() - o.scrollSpeed);
                    } else if (that.window.height() - (event.pageY - that.document.scrollTop()) < o.scrollSensitivity) {
                        scrolled = that.document.scrollTop(that.document.scrollTop() + o.scrollSpeed);
                    }

                    if (event.pageX - that.document.scrollLeft() < o.scrollSensitivity) {
                        scrolled = that.document.scrollLeft(that.document.scrollLeft() - o.scrollSpeed);
                    } else if (that.window.width() - (event.pageX - that.document.scrollLeft()) < o.scrollSensitivity) {
                        scrolled = that.document.scrollLeft(that.document.scrollLeft() + o.scrollSpeed);
                    }

                }

                if (scrolled !== false && $.jqx.ddmanager && !o.dropBehaviour) {
                    $.jqx.ddmanager.prepareOffsets(this, event);
                }
            }

            that.positionAbs = that._convertPositionTo("absolute");

            if (!that.axis || that.axis !== "y") {
                that.helper[0].style.left = that.position.left + "px";
            }
            if (!that.axis || that.axis !== "x") {
                that.helper[0].style.top = that.position.top + "px";
            }

            for (i = that.itemsArray.length - 1; i >= 0; i--) {

                item = that.itemsArray[i];
                itemElement = item.item[0];
                intersection = that._intersectsWithPointer(item);
                if (!intersection) {
                    continue;
                }

                if (item.instance !== that.currentContainer) {
                    continue;
                }

                if (itemElement !== that.currentItem[0] &&
                    that.placeholder[intersection === 1 ? "next" : "prev"]()[0] !== itemElement &&
                    !$.contains(that.placeholder[0], itemElement) &&
                    (that.type === "semi-dynamic" ? !$.contains(that.host[0], itemElement) : true)
                ) {

                    that.direction = intersection === 1 ? "down" : "up";

                    if (that.tolerance === "pointer" || that._intersectsWithSides(item)) {
                        that._rearrange(event, item);
                    } else {
                        break;
                    }

                    that._raiseEvent('2', that._uiHash());
                    break;
                }
            }

            that._contactOwners(event);

            if ($.jqx.ddmanager) {
                $.jqx.ddmanager.drag(this, event);
            }

            that._raiseEvent('8', that._uiHash());

            that.lastPositionAbs = that.positionAbs;
            return false;
        },

        _mouseStop: function (event, noPropagation) {
            var that = this;
            if (!event) {
                return;
            }

            if ($.jqx.ddmanager && !this.dropBehaviour) {
                $.jqx.ddmanager.drop(this, event);
            }

            if (that.revert) {
                var that = this,
                    cur = that.placeholder.offset(),
                    axis = that.axis,
                    animation = {};

                if (!axis || axis === "x") {
                    animation.left = cur.left - that.offset.parent.left - that.margins.left + (that.offsetParent[0] === that.document[0].body ? 0 : that.offsetParent[0].scrollLeft);
                }
                if (!axis || axis === "y") {
                    animation.top = cur.top - that.offset.parent.top - that.margins.top + (that.offsetParent[0] === that.document[0].body ? 0 : that.offsetParent[0].scrollTop);
                }
                that.reverting = true;
                $(this.helper).animate(animation, parseInt(this.revert, 10) || 500, function () {
                    that._clear(event);
                });
            } else {
                that._clear(event, noPropagation);
            }

            return false;

        },

        cancel: function () {
            var that = this;
            if (that.dragging) {

                that._mouseUp({ target: null });

                if (that.helper === "original") {
                    that.currentItem.css(that._storedCSS).removeClass("jqx-sortable-helper");
                } else {
                    that.currentItem.show();
                }

                for (var i = that.owners.length - 1; i >= 0; i--) {
                    that.owners[i]._raiseEvent('3', that._uiHash(this));
                    if (that.owners[i].containerCache.over) {
                        that.owners[i]._raiseEvent('4', that._uiHash(this));
                        that.owners[i].containerCache.over = 0;
                    }
                }

            }

            if (that.placeholder) {
                if (that.placeholder[0].parentNode) {
                    that.placeholder[0].parentNode.removeChild(that.placeholder[0]);
                }
                if (that.helper !== "original" && that.helper && that.helper[0].parentNode) {
                    that.helper.remove();
                }

                $.extend(this, {
                    helper: null,
                    dragging: false,
                    reverting: false,
                    _noFinalSort: null
                });

                if (that.domPosition.prev) {
                    $(that.domPosition.prev).after(that.currentItem);
                } else {
                    $(that.domPosition.parent).prepend(that.currentItem);
                }
            }

            return this;

        },

        serialize: function (o) {

            var items = this._getItemsAsjQuery(o && o.connected),
                str = [];
            o = o || {};

            $(items).each(function () {
                var res = ($(o.item || this).attr(o.attribute || "id") || "").match(o.expression || (/(.+)[\-=_](.+)/));
                if (res) {
                    str.push((o.key || res[1] + "[]") + "=" + (o.key && o.expression ? res[1] : res[2]));
                }
            });

            if (!str.length && o.key) {
                str.push(o.key + "=");
            }

            return str.join("&");

        },

        toArray: function (o) {

            var items = this._getItemsAsjQuery(o && o.connected),
                ret = [];

            o = o || {};

            items.each(function () { ret.push($(o.item || this).attr(o.attribute || "id") || ""); });
            return ret;

        },

        _intersectsWith: function (item) {

            var x1 = this.positionAbs.left,
                x2 = x1 + this.helperProportions.width,
                y1 = this.positionAbs.top,
                y2 = y1 + this.helperProportions.height,
                l = item.left,
                r = l + item.width,
                t = item.top,
                b = t + item.height,
                dyClick = this.offset.click.top,
                dxClick = this.offset.click.left,
                isOverElementHeight = (this.axis === "x") || ((y1 + dyClick) > t && (y1 + dyClick) < b),
                isOverElementWidth = (this.axis === "y") || ((x1 + dxClick) > l && (x1 + dxClick) < r),
                isOverElement = isOverElementHeight && isOverElementWidth;

            if (this.tolerance === "pointer" ||
                this.forcePointerForowners ||
                (this.tolerance !== "pointer" && this.helperProportions[this.floating ? "width" : "height"] > item[this.floating ? "width" : "height"])
            ) {
                return isOverElement;
            } else {

                return (l < x1 + (this.helperProportions.width / 2) && // Right Half
                    x2 - (this.helperProportions.width / 2) < r && // Left Half
                    t < y1 + (this.helperProportions.height / 2) && // Bottom Half
                    y2 - (this.helperProportions.height / 2) < b); // Top Half

            }
        },

        _intersectsWithPointer: function (item) {

            var isOverElementHeight = (this.axis === "x") || this._isOverAxis(this.positionAbs.top + this.offset.click.top, item.top, item.height),
                isOverElementWidth = (this.axis === "y") || this._isOverAxis(this.positionAbs.left + this.offset.click.left, item.left, item.width),
                isOverElement = isOverElementHeight && isOverElementWidth,
                verticalDirection = this._getDragVerticalDirection(),
                horizontalDirection = this._getDragHorizontalDirection();

            if (!isOverElement) {
                return false;
            }

            return this.floating ?
                (((horizontalDirection && horizontalDirection === "right") || verticalDirection === "down") ? 2 : 1)
                : (verticalDirection && (verticalDirection === "down" ? 2 : 1));

        },

        _intersectsWithSides: function (item) {

            var isOverBottomHalf = this._isOverAxis(this.positionAbs.top + this.offset.click.top, item.top + (item.height / 2), item.height),
                isOverRightHalf = this._isOverAxis(this.positionAbs.left + this.offset.click.left, item.left + (item.width / 2), item.width),
                verticalDirection = this._getDragVerticalDirection(),
                horizontalDirection = this._getDragHorizontalDirection();

            if (this.floating && horizontalDirection) {
                return ((horizontalDirection === "right" && isOverRightHalf) || (horizontalDirection === "left" && !isOverRightHalf));
            } else {
                return verticalDirection && ((verticalDirection === "down" && isOverBottomHalf) || (verticalDirection === "up" && !isOverBottomHalf));
            }

        },

        _getDragVerticalDirection: function () {
            var delta = this.positionAbs.top - this.lastPositionAbs.top;
            return delta !== 0 && (delta > 0 ? "down" : "up");
        },

        _getDragHorizontalDirection: function () {
            var delta = this.positionAbs.left - this.lastPositionAbs.left;
            return delta !== 0 && (delta > 0 ? "right" : "left");
        },

        refresh: function (event) {
            this._refreshItems(event);
            this.refreshPositions();
            return this;
        },

        _connectWith: function () {
            var options = this;
            return options.connectWith.constructor === String ? [options.connectWith] : options.connectWith;
        },

        _getItemsAsjQuery: function (connected) {

            var i, j, cur, inst,
                items = [],
                queries = [],
                connectWith = this._connectWith();

            if (connectWith && connected) {
                for (i = connectWith.length - 1; i >= 0; i--) {
                    cur = $(connectWith[i], this.document[0]);
                    for (j = cur.length - 1; j >= 0; j--) {
                        inst = $.data(cur[j], this.widgetFullName).instance;
                        if (inst && inst !== this && !inst.disabled) {
                            queries.push([$.isFunction(inst.items) ? inst.items.call(inst.host) : $(inst.items, inst.host).not(".jqx-sortable-helper").not(".jqx-sortable-placeholder"), inst]);
                        }
                    }
                }
            }

            queries.push([$.isFunction(this.items) ? this.items.call(this.host, null, { options: this, item: this.currentItem }) : $(this.items, this.host).not(".jqx-sortable-helper").not(".jqx-sortable-placeholder"), this]);

            function addItems() {
                items.push(this);
            }
            for (i = queries.length - 1; i >= 0; i--) {
                queries[i][0].each(addItems);
            }

            return $(items);

        },

        _removeCurrentsFromItems: function () {

            var list = this.currentItem.find(":data(" + this.widgetName + "-item)");

            this.itemsArray = $.grep(this.itemsArray, function (item) {
                for (var j = 0; j < list.length; j++) {
                    if (list[j] === item.item[0]) {
                        return false;
                    }
                }
                return true;
            });

        },

        _refreshItems: function (event) {

            this.itemsArray = [];
            this.owners = [this];

            var i, j, cur, inst, targetData, _queries, item, queriesLength,
                items = this.itemsArray,
                queries = [[$.isFunction(this.items) ? this.items.call(this.host[0], event, { item: this.currentItem }) : $(this.items, this.host), this]],
                connectWith = this._connectWith();

            if (connectWith && this.ready) { //Shouldn't be run the first time through due to massive slow-down
                for (i = connectWith.length - 1; i >= 0; i--) {
                    cur = $(connectWith[i], this.document[0]);
                    for (j = cur.length - 1; j >= 0; j--) {
                        inst = $.data(cur[j], this.widgetName);
                        if (inst && inst !== this && !inst.instance.disabled) {
                            queries.push([$.isFunction(inst.instance.items) ? inst.items.call(inst.instance.host[0], event, { item: this.currentItem }) : $(inst.instance.items, inst.instance.host), inst.instance]);
                            this.owners.push(inst.instance);
                        }
                    }
                }
            }

            for (i = queries.length - 1; i >= 0; i--) {
                targetData = queries[i][1];
                _queries = queries[i][0];

                for (j = 0, queriesLength = _queries.length; j < queriesLength; j++) {
                    item = $(_queries[j]);

                    item.data(this.widgetName + "-item", targetData); // Data for target checking (mouse manager)

                    items.push({
                        item: item,
                        instance: targetData,
                        width: 0, height: 0,
                        left: 0, top: 0
                    });
                }
            }

        },

        refreshPositions: function (fast) {

            if (this.offsetParent && this.helper) {
                this.offset.parent = this._getParentOffset();
            }

            var i, item, t, p;

            for (i = this.itemsArray.length - 1; i >= 0; i--) {
                item = this.itemsArray[i];
                if (item.instance !== this.currentContainer && this.currentContainer && item.item[0] !== this.currentItem[0]) {
                    continue;
                }

                t = this.toleranceElement ? $(this.toleranceElement, item.item) : item.item;

                if (!fast) {
                    item.width = t.outerWidth();
                    item.height = t.outerHeight();
                }

                p = t.offset();
                item.left = p.left;
                item.top = p.top;
            }

            if (this.custom && this.custom.refreshowners) {
                this.custom.refreshowners.call(this);
            } else {
                for (i = this.owners.length - 1; i >= 0; i--) {
                    p = this.owners[i].host.offset();
                    this.owners[i].containerCache.left = p.left;
                    this.owners[i].containerCache.top = p.top;
                    this.owners[i].containerCache.width = this.owners[i].host.outerWidth();
                    this.owners[i].containerCache.height = this.owners[i].host.outerHeight();
                }
            }

            return this;
        },

        _cancelSelect: function () {
            that = this;
            that.host.addClass("jqx-disableselect");
        },

        _createPlaceholder: function (that) {
            that = that || this;
            var className,
                o = that;

            if (!o.placeholderShow || o.placeholderShow.constructor === String) {
                className = o.placeholderShow;
                o.placeholderShow = {
                    element: function () {

                        var nodeName = that.currentItem[0].nodeName.toLowerCase(),
                            element = $("<" + nodeName + ">", that.document[0])
                                .addClass(className || that.currentItem[0].className + " jqx-sortable-placeholder")
                                .removeClass("jqx-sortable-helper");

                        if (nodeName === "tr") {
                            that.currentItem.children().each(function () {
                                $("<td>&#160;</td>", that.document[0])
                                    .attr("colspan", $(this).attr("colspan") || 1)
                                    .appendTo(element);
                            });
                        } else if (nodeName === "img") {
                            element.attr("src", that.currentItem.attr("src"));
                        }

                        if (!className) {
                            element.css("visibility", "hidden");
                        }

                        return element;
                    },
                    update: function (container, p) {

                        if (className && !o.forcePlaceholderSize) {
                            return;
                        }

                        if (!p.height()) { p.height(that.currentItem.innerHeight() - parseInt(that.currentItem.css("paddingTop") || 0, 10) - parseInt(that.currentItem.css("paddingBottom") || 0, 10)); }
                        if (!p.width()) { p.width(that.currentItem.innerWidth() - parseInt(that.currentItem.css("paddingLeft") || 0, 10) - parseInt(that.currentItem.css("paddingRight") || 0, 10)); }
                    }
                };
            }

            that.placeholder = $(o.placeholderShow.element.call(that.host, that.currentItem));

            that.currentItem.after(that.placeholder);

            that.placeholderShow.update(that, that.placeholder);
        },

        _contactOwners: function (event) {
            var i, j, dist, itemWithLeastDistance, posProperty, sizeProperty, cur, nearBottom, floating, axis,
                innermostContainer = null,
                innermostIndex = null;

            for (i = this.owners.length - 1; i >= 0; i--) {

                if ($.contains(this.currentItem[0], this.owners[i].host[0])) {
                    continue;
                }

                if (this._intersectsWith(this.owners[i].containerCache)) {

                    if (innermostContainer && $.contains(this.owners[i].host[0], innermostContainer.host[0])) {
                        continue;
                    }

                    innermostContainer = this.owners[i];
                    innermostIndex = i;

                } else {
                    if (this.owners[i].containerCache.over) {
                        this.owners[i]._raiseEvent('4', this._uiHash(this));
                        this.owners[i].containerCache.over = 0;
                    }
                }

            }

            if (!innermostContainer) {
                return;
            }

            if (this.owners.length === 1) {
                if (!this.owners[innermostIndex].containerCache.over) {
                    this.owners[innermostIndex]._raiseEvent('5', this._uiHash(this));
                    this.owners[innermostIndex].containerCache.over = 1;
                }
            } else {

                dist = 10000;
                itemWithLeastDistance = null;
                floating = innermostContainer.floating || this._isFloating(this.currentItem);
                posProperty = floating ? "left" : "top";
                sizeProperty = floating ? "width" : "height";
                axis = floating ? "clientX" : "clientY";
                var items = this.itemsArray;
                for (j = items.length - 1; j >= 0; j--) {
                    if (!$.contains(this.owners[innermostIndex].host[0], items[j].item[0])) {
                        continue;
                    }
                    if (items[j].item[0] === this.currentItem[0]) {
                        continue;
                    }

                    cur = items[j].item.offset()[posProperty];
                    nearBottom = false;
                    if (event[axis] - cur > items[j][sizeProperty] / 2) {
                        nearBottom = true;
                    }

                    if (Math.abs(event[axis] - cur) < dist) {
                        dist = Math.abs(event[axis] - cur);
                        itemWithLeastDistance = items[j];
                        this.direction = nearBottom ? "up" : "down";
                    }
                }

                if (!itemWithLeastDistance && !this.dropOnEmpty) {
                    return;
                }

                if (this.currentContainer === this.owners[innermostIndex]) {
                    if (!this.currentContainer.containerCache.over) {
                        this.owners[innermostIndex]._raiseEvent('5', this._uiHash());
                        this.currentContainer.containerCache.over = 1;
                    }
                    return;
                }

                if (this.owners[innermostIndex].host.children().length + 1 > this.owners[innermostIndex].maxItems) {
                    this.currentContainer = this._currentContainer;
                    itemWithLeastDistance = this._rearrange(event, null, this.currentContainer.host, true);
                    this._currentContainer.containerCache.over = 1;
                    this.placeholderShow.update(this.currentContainer, this.placeholder);
                    return;
                }

                itemWithLeastDistance ? this._rearrange(event, itemWithLeastDistance, null, true) : this._rearrange(event, null, this.owners[innermostIndex].host, true);
                this._raiseEvent('2', this._uiHash());
                this.owners[innermostIndex]._raiseEvent('2', this._uiHash(this));
                this.currentContainer = this.owners[innermostIndex];

                //Update the placeholder
                this.placeholderShow.update(this.currentContainer, this.placeholder);

                this.owners[innermostIndex]._raiseEvent('5', this._uiHash(this));
                this.owners[innermostIndex].containerCache.over = 1;
            }
        },

        _utility: function (event) {

            var o = this,
                helper = $.isFunction(o.helper) ? $(o.helper.apply(this.host[0], [event, this.currentItem])) : (o.helper === "clone" ? this.currentItem.clone() : this.currentItem);

            if (!helper.parents("body").length) {
                $(o.appendTo !== "parent" ? o.appendTo : this.currentItem[0].parentNode)[0].appendChild(helper[0]);
            }

            if (helper[0] === this.currentItem[0]) {
                this._storedCSS = { width: this.currentItem[0].style.width, height: this.currentItem[0].style.height, position: this.currentItem.css("position"), top: this.currentItem.css("top"), left: this.currentItem.css("left") };
            }

            if (!helper[0].style.width || o.forceHelperSize) {
                helper.width(this.currentItem.width());
            }
            if (!helper[0].style.height || o.forceHelperSize) {
                helper.height(this.currentItem.height());
            }

            helper.scrollParent = function (includeHidden) {
                var position = this.css("position"),
                    excludeStaticParent = position === "absolute",
                    overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
                    scrollParent = this.parents().filter(function () {
                        var parent = $(this);
                        if (excludeStaticParent && parent.css("position") === "static") {
                            return false;
                        }
                        return overflowRegex.test(parent.css("overflow") + parent.css("overflow-y") + parent.css("overflow-x"));
                    }).eq(0);

                return position === "fixed" || !scrollParent.length ? $(this[0].ownerDocument || document) : scrollParent;
            };

            return helper;
        },

        _adjustOffsetFromHelper: function (obj) {
            if (typeof obj === "string") {
                obj = obj.split(" ");
            }
            if ($.isArray(obj)) {
                obj = { left: +obj[0], top: +obj[1] || 0 };
            }
            if ("left" in obj) {
                this.offset.click.left = obj.left + this.margins.left;
            }
            if ("right" in obj) {
                this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
            }
            if ("top" in obj) {
                this.offset.click.top = obj.top + this.margins.top;
            }
            if ("bottom" in obj) {
                this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
            }
        },

        _getParentOffset: function () {
            this.offsetParent = this.helper.offsetParent();
            var po = this.offsetParent.offset();

            if (this.cssPosition === "absolute" && this.scrollParent[0] !== this.document[0] && $.contains(this.scrollParent[0], this.offsetParent[0])) {
                po.left += this.scrollParent.scrollLeft();
                po.top += this.scrollParent.scrollTop();
            }

            if (this.offsetParent[0] === this.document[0].body || (this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() === "html" && $.jqx.browser.msie)) {
                po = { top: 0, left: 0 };
            }

            return {
                top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0),
                left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0)
            };
        },

        _getRelativeOffset: function () {

            if (this.cssPosition === "relative") {
                var p = this.currentItem.position();
                return {
                    top: p.top - (parseInt(this.helper.css("top"), 10) || 0) + this.scrollParent.scrollTop(),
                    left: p.left - (parseInt(this.helper.css("left"), 10) || 0) + this.scrollParent.scrollLeft()
                };
            } else {
                return { top: 0, left: 0 };
            }
        },

        _storeMargins: function () {
            this.margins = {
                left: (parseInt(this.currentItem.css("marginLeft"), 10) || 0),
                top: (parseInt(this.currentItem.css("marginTop"), 10) || 0)
            };
        },

        _cacheHelperProportions: function () {
            this.helperProportions = {
                width: this.helper.outerWidth(),
                height: this.helper.outerHeight()
            };
        },

        _setContainment: function () {

            var ce, co, over,
                o = this;
            if (o.containment === "parent") {
                o.containment = this.helper[0].parentNode;
            }
            if (o.containment === "document" || o.containment === "window") {
                this.containment = [
                    0 - this.offset.relative.left - this.offset.parent.left,
                    0 - this.offset.relative.top - this.offset.parent.top,
                    o.containment === "document" ? this.document.width() : this.window.width() - this.helperProportions.width - this.margins.left,
                    (o.containment === "document" ? this.document.width() : this.window.height() || this.document[0].body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top
                ];
            }
        },

        _convertPositionTo: function (d, pos) {

            if (!pos) {
                pos = this.position;
            }
            var mod = d === "absolute" ? 1 : -1,
                scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== this.document[0] && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent,
                scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

            return {
                top: (
                    pos.top +																// The absolute mouse position
                    this.offset.relative.top * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
                    this.offset.parent.top * mod -											// The offsetParent's offset without borders (offset + border)
                    ((this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : (scrollIsRootNode ? 0 : scroll.scrollTop())) * mod)
                ),
                left: (
                    pos.left +																// The absolute mouse position
                    this.offset.relative.left * mod +										// Only for relative positioned nodes: Relative offset from element to offset parent
                    this.offset.parent.left * mod -										// The offsetParent's offset without borders (offset + border)
                    ((this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft()) * mod)
                )
            };
        },

        _generatePosition: function (event) {

            var top, left,
                o = this,
                pageX = event.pageX,
                pageY = event.pageY,
                scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== this.document[0] && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

             if (this.cssPosition === "relative" && !(this.scrollParent[0] !== this.document[0] && this.scrollParent[0] !== this.offsetParent[0])) {
                this.offset.relative = this._getRelativeOffset();
            }

         

            if (this.originalPosition) { //If we are not dragging yet, we won't check for options

                if (this.containment) {
                    if (event.pageX - this.offset.click.left < this.containment[0]) {
                        pageX = this.containment[0] + this.offset.click.left;
                    }
                    if (event.pageY - this.offset.click.top < this.containment[1]) {
                        pageY = this.containment[1] + this.offset.click.top;
                    }
                    if (event.pageX - this.offset.click.left > this.containment[2]) {
                        pageX = this.containment[2] + this.offset.click.left;
                    }
                    if (event.pageY - this.offset.click.top > this.containment[3]) {
                        pageY = this.containment[3] + this.offset.click.top;
                    }
                }

                if (o.grid) {
                    top = this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1];
                    pageY = this.containment ? ((top - this.offset.click.top >= this.containment[1] && top - this.offset.click.top <= this.containment[3]) ? top : ((top - this.offset.click.top >= this.containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;

                    left = this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0];
                    pageX = this.containment ? ((left - this.offset.click.left >= this.containment[0] && left - this.offset.click.left <= this.containment[2]) ? left : ((left - this.offset.click.left >= this.containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
                }

            }

            return {
                top: (
                    pageY -																// The absolute mouse position
                    this.offset.click.top -													// Click offset (relative to the element)
                    this.offset.relative.top -											// Only for relative positioned nodes: Relative offset from element to offset parent
                    this.offset.parent.top +												// The offsetParent's offset without borders (offset + border)
                    ((this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : (scrollIsRootNode ? 0 : scroll.scrollTop())))
                ),
                left: (
                    pageX -																// The absolute mouse position
                    this.offset.click.left -												// Click offset (relative to the element)
                    this.offset.relative.left -											// Only for relative positioned nodes: Relative offset from element to offset parent
                    this.offset.parent.left +												// The offsetParent's offset without borders (offset + border)
                    ((this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft()))
                )
            };
        },

        _rearrange: function (event, i, a, hardRefresh) {

            a ? a[0].appendChild(this.placeholder[0]) : i.item[0].parentNode.insertBefore(this.placeholder[0], (this.direction === "down" ? i.item[0] : i.item[0].nextSibling));

          
            this.counter = this.counter ? ++this.counter : 1;
            var counter = this.counter;

            this._delay(function () {
                if (counter === this.counter) {
                    this.refreshPositions(!hardRefresh); //Precompute after each DOM insertion, NOT on mousemove
                }
            });
        },

        _delay: function (handler, delay) { // from $.Widget
            function handlerProxy() {
                return (typeof handler === "string" ? instance[handler] : handler)
                    .apply(instance, arguments);
            }
            var instance = this;
            return setTimeout(handlerProxy, delay || 0);
        },

        _clear: function (event, noPropagation) {

            this.reverting = false;
              var i,
                delayedTriggers = [];

               if (!this._noFinalSort && this.currentItem.parent().length) {
                this.placeholder.before(this.currentItem);
            }
            this._noFinalSort = null;

            if (this.helper[0] === this.currentItem[0]) {
                for (i in this._storedCSS) {
                    if (this._storedCSS[i] === "auto" || this._storedCSS[i] === "static") {
                        this._storedCSS[i] = "";
                    }
                }
                this.currentItem.css(this._storedCSS).removeClass("jqx-sortable-helper");
            } else {
                this.currentItem.show();
            }

            if (this.fromOutside && !noPropagation) {
                delayedTriggers.push(function (event) {
                    this._raiseEvent('6', this._uiHash(this.fromOutside));
                });
            }
            if ((this.fromOutside || this.domPosition.prev !== this.currentItem.prev().not(".jqx-sortable-helper")[0] || this.domPosition.parent !== this.currentItem.parent()[0]) && !noPropagation) {
                delayedTriggers.push(function (event) {
                    this._raiseEvent('11', this._uiHash());
                }); //Trigger update callback if the DOM position has changed
            }

            // Check if the items Container has Changed and trigger appropriate
            // events.
            if (this !== this.currentContainer) {
                if (!noPropagation) {
                    delayedTriggers.push(function (event) {
                        this._raiseEvent('7', this._uiHash());
                    });
                    delayedTriggers.push((function (c) {
                        return function (event) {
                            c._raiseEvent('6', this._uiHash(this));
                        };
                    }).call(this, this.currentContainer));
                    delayedTriggers.push((function (c) {
                        return function (event) {
                            c._raiseEvent('11', this._uiHash(this));
                        };
                    }).call(this, this.currentContainer));
                }
            }


            //Post events to owners
            function delayEvent(type, instance, container) {
                return function (event) {
                    var eventIndex = this._events.indexOf(type);
                    container._raiseEvent(eventIndex, instance._uiHash(instance));
                };
            }
            for (i = this.owners.length - 1; i >= 0; i--) {
                if (!noPropagation) {
                    delayedTriggers.push(delayEvent("deactivate", this, this.owners[i]));
                }
                if (this.owners[i].containerCache.over) {
                    delayedTriggers.push(delayEvent("out", this, this.owners[i]));
                    this.owners[i].containerCache.over = 0;
                }
            }

            //Do what was originally in plugins
            if (this.storedCursor) {
                this.document.find("body").css("cursor", this.storedCursor);
                this.storedStylesheet.remove();
            }
            if (this._storedOpacity) {
                this.helper.css("opacity", this._storedOpacity);
            }
            if (this._storedZIndex) {
                this.helper.css("zIndex", this._storedZIndex === "auto" ? "" : this._storedZIndex);
            }

            this.dragging = false;

            if (!noPropagation) {
                this._raiseEvent('1', this._uiHash());
            }

            //$(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately, it unbinds ALL events from the original node!
            this.placeholder[0].parentNode.removeChild(this.placeholder[0]);

            if (!this.cancelHelperRemoval) {
                if (this.helper[0] !== this.currentItem[0]) {
                    this.helper.remove();
                }
                this.helper = null;
            }

           if (!noPropagation) {
               /* for (i = 0; i < delayedTriggers.length; i++) {
                    delayedTriggers[i].call(this, event);
                } //Trigger all delayed events*/
                this._raiseEvent('10', this._uiHash());
            }

            this.fromOutside = false;
            return !this.cancelHelperRemoval;

        },

        disable: function () {
            that = this;
            that.disabled = true;
        },

        enable: function () {
            that = this;
            that.disabled = false;
        },

        instance: function () {
            that = this;
            return that;
        },

        _uiHash: function (_inst) {
            var inst = _inst || this;
            return {
                helper: inst.helper,
                placeholder: inst.placeholder || $([]),
                position: inst.position,
                originalPosition: inst.originalPosition,
                offset: inst.positionAbs,
                item: inst.currentItem,
                sender: _inst ? _inst.host : null
            };
        },

        _raiseEvent: function (eventId, data) {
            that = this;
            var event = $.Event(that._events[eventId]);
            event.args = data;
            return that.host.trigger(event);
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            that = this;

            if (value !== oldvalue) {
                switch (key) {
                    case 'disabled':
                        that.disabled = value;
                        break;
                }
            }
        }
    });
})(jqxBaseFramework);
