/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    var instanceCounter = 0;

    $.jqx.jqxWidget('jqxScrollView', '', {});

    $.extend($.jqx._jqxScrollView.prototype, {

        defineInstance: function () {
            var settings =
                {
                    width: 320,
                    height: 320,
                    buttonsOffset: [0, 0],
                    moveThreshold: 0.5,
                    currentPage: 0,
                    animationDuration: 300,
                    showButtons: true,
                    bounceEnabled: true,
                    slideShow: false,
                    slideDuration: 3000,
                    disabled: false,
                    _mouseDown: false,
                    _movePermited: false,
                    _startX: -1,
                    _startOffset: -1,
                    _lastOffset: -1,
                    _events: ['pageChanged'],
                    _eventsMap: {
                        'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                        'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
                        'mousemove': $.jqx.mobile.getTouchEventName('touchmove')
                    }
                }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            instanceCounter += 1;
            this._instanceId = instanceCounter;
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            var me = this;
            $.jqx.utilities.resize(this.host, function () {
                me.refresh();
            });
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.refresh();
        },

        //Widget handling (rendering, attaching events, layout)
        refresh: function () {
            this.host.width(this.width);
            this.host.height(this.height);

            this._render();
            this._performLayout();
            if (this.moveThreshold.toString().indexOf('%') >= 0) {
                this.moveThreshold = parseInt(this.moveThreshold, 10) / 100;
            }
            this._refreshPages();
            this._refreshButtons();
            this._removeEventListeners();
            this._addEventListeners();
            this._changePage(this.currentPage, false, 0);
            if (this.slideShow) {
                var me = this;
                this.slideShowTimer = setInterval(function () {
                    if (me.currentPage >= me._pages.length - 1) {
                        me._changePage(0, true, me.animationDuration);
                    }
                    else {
                        me._changePage(me.currentPage + 1, true, me.animationDuration);
                    }
                }, this.slideDuration);
            }
            else {
                if (this.slideShowTimer != undefined) {
                    clearInterval(this.slideShowTimer);
                }
            }
        },

        destroy: function () {
            this.host.remove();
        },

        _getEvent: function (event) {
            if (this._isTouchDevice) {
                return this._eventsMap[event];
            }
            return event;
        },

        _eventNamespace: function () {
            return '.scrollview' + this._instanceId;
        },

        _removeEventListeners: function () {
            this.removeHandler(this._innerWrapper);
            this.removeHandler(this.host, this._getEvent('mousemove') + this._eventNamespace());
            this.removeHandler($(document), this._getEvent('mouseup') + this._eventNamespace());
        },

        _getCoordinate: function (event, property) {
            if (this._isTouchDevice) {
                var pos = $.jqx.position(event);

                if (property == "pageX") {
                    return pos.left;
                }
                if (property == "pageY") {
                    return pos.top;
                }
                if (event.originalEvent.touches) {
                    return event.originalEvent.touches[0][property];
                }
            }
            return event[property];
        },

        _draggedRight: function () {
            if (this.currentPage > 0) {
                var page = this.currentPage - 1,
                    currentPage = $(this._pages[page]),
                    pageRight = currentPage.offset().left + currentPage.outerWidth(),
                    diff = pageRight - this.host.offset().left;
                if (diff >= (this.host.width() * this.moveThreshold)) {
                    this.changePage(page);
                    return true;
                }
            }
            return false;
        },

        _draggedLeft: function () {
            if (this.currentPage + 1 < this._pages.length) {
                var page = this.currentPage + 1,
                    currentPage = $(this._pages[page]),
                    diff = this.host.width() - (currentPage.offset().left - this.host.offset().left);
                if (diff >= (this.host.width() * this.moveThreshold)) {
                    this.changePage(page);
                    return true;
                }
            }
            return false;
        },

        _dropTarget: function () {
            var changed;
            if (this._movedLeft) {
                changed = this._draggedLeft();
            } else {
                changed = this._draggedRight();
            }
            if (!changed) {
                this.changePage(this.currentPage, false);
            }
        },

        _scrollEnabled: function (e) {
            if (!this._mouseDown) {
                return false;
            }
            if (!this._movePermited) {
                if (Math.abs(this._getCoordinate(e, 'pageX') - this._startX) >= 15) {
                    this._movePermited = true;
                }
            }
            return this._movePermited;
        },

        _setMoveDirection: function (offset) {
            if (this._lastOffset > offset) {
                this._movedLeft = true;
            } else {
                this._movedLeft = false;
            }
        },

        _getBounceOffset: function (offset) {
            var minOffset = -(this._innerWrapper.width() - this.host.width());
            if (offset > 0) {
                offset = 0;
            } else if (offset < minOffset) {
                offset = minOffset;
            }
            return offset;
        },

        _addEventListeners: function () {
            var self = this;
            this.addHandler(this._innerWrapper, this._getEvent('mousedown') + this._eventNamespace(), function (e) {
                self._mouseDown = true;
                self._startX = self._getCoordinate(e, 'pageX');
                self._startOffset = self._lastOffset = parseInt(self._innerWrapper.css('margin-left'), 10);
            });
            this.addHandler(this.host, 'dragstart', function () {
                return false;
            });
            this.addHandler(this.host, this._getEvent('mousemove') + this._eventNamespace(), function (e) {
                if (self._scrollEnabled(e)) {
                    var offset = self._startOffset + self._getCoordinate(e, 'pageX') - self._startX;
                    if (!self.bounceEnabled) {
                        offset = self._getBounceOffset(offset);
                    }
                    self._innerWrapper.css('margin-left', offset);
                    self._setMoveDirection(offset);
                    self._lastOffset = offset;
                    e.preventDefault();
                    return false;
                }
                return true;
            });
            this.addHandler($(document), this._getEvent('mouseup') + this._eventNamespace(), function (e) {
                if (self._movePermited) {
                    self._dropTarget();
                }
                self._movePermited = false;
                self._mouseDown = false;
            });

            try {
                if (document.referrer != "" || window.frameElement) {
                    if (window.top != null) {
                        if (window.parent && document.referrer) {
                            parentLocation = document.referrer;
                        }
                    }

                    if (parentLocation.indexOf(document.location.host) != -1) {
                        var eventHandle = function (event) {
                            if (self._movePermited) {
                                self._dropTarget();
                            }
                            self._movePermited = false;
                            self._mouseDown = false;
                        };

                        if (window.top.document.addEventListener) {
                            window.top.document.addEventListener('mouseup', eventHandle, false);

                        } else if (window.top.document.attachEvent) {
                            window.top.document.attachEvent("on" + 'mouseup', eventHandle);
                        }
                    }
                }
            }
            catch (error) {
            }
        },

        _render: function () {
            this.host.addClass(this.toThemeProperty('jqx-scrollview'));
            this.host.css({
                overflow: 'hidden',
                position: 'relative'
            });
        },

        _performLayout: function () {
            this.host.css({
                width: this.width,
                height: this.height
            });
        },
        //end of the general purpose widget handling

        //Pages handling
        _renderPages: function () {
            if (!this._innerWrapper) {
                this._innerWrapper = $('<div/>');
                this.host.wrapInner(this._innerWrapper);
                this._innerWrapper = this.host.children().first();
            }
            this._innerWrapper.addClass(this.toThemeProperty('jqx-scrollview-inner-wrapper'));
            this._innerWrapper.height(this.host.height());
        },

        _refreshPage: function (page) {
            page.addClass(this.toThemeProperty('jqx-scrollview-page'));
            this._performPageLayout(page);
        },

        _refreshPages: function () {
            var self = this,
                childrenSize = 0;
            this._renderPages();
            this._pages = this._innerWrapper.children();
            this._pages.each(function () {
                self._refreshPage($(this));
                childrenSize += $(this).outerWidth(true);
            });
            this._innerWrapper.width(childrenSize);
        },

        _performPageLayout: function (page) {
            page.css('float', 'left');
            page.width(this.host.width());
            page.height(this.host.height());
        },
        //end of the pages handling

        //Buttons handling
        _refreshButtons: function () {
            this._renderButtons();
            this._removeButtonsEventListeners();
            this._addButtonsEventListeners();
            this._performButtonsLayout();
        },

        //Taking care for memory leaks
        _removeButtonsEventListeners: function () {
            var self = this;
            this._buttonsContainer.children().each(function () {
                self.removeHandler($(this));
            });
        },

        _addButtonsEventListeners: function () {
            var self = this;
            this._buttonsContainer.children().each(function (idx) {
                self.addHandler($(this), 'click', function () {
                    self.changePage(idx);
                });
            });
        },

        _performButtonsLayout: function () {
            var middle = (this.host.width() - this._buttonsContainer.width()) / 2;
            var buttonsHeight = this._buttonsContainer.outerHeight() != 0 ? this._buttonsContainer.outerHeight() : 14;
            this._buttonsContainer.css({
                position: 'absolute',
                left: middle + parseInt(this.buttonsOffset[0], 10),
                top: this.host.height() - 2 * buttonsHeight +
                 parseInt(this.buttonsOffset[1], 10) - 1
            });
        },

        _renderButtons: function () {
            if (this._buttonsContainer) {
                this._buttonsContainer.remove();
            }
            var page, button;
            this._buttons = [];
            this._buttonsContainer = $('<span/>');
            for (var i = 0; i < this._pages.length; i += 1) {
                button = $('<span class="' + this.toThemeProperty('jqx-scrollview-button') + ' ' +
                            this.toThemeProperty('jqx-fill-state-normal') + '"></span>');
                this._buttonsContainer.append(button);
                this._buttons[i] = button;
            }
            this._buttonsContainer.appendTo(this.host);
            if (!this.showButtons) {
                this._buttonsContainer.hide();
            }
        },
        //end of the buttons handling

        _raiseEvent: function (idx, data) {
            var ev = new $.Event(this._events[idx]);
            ev.args = data;
            return this.host.trigger(ev);
        },

        _swapButtons: function (old, newButton) {
            this._buttons[old].removeClass(this.toThemeProperty('jqx-scrollview-button-selected'));
            this._buttons[old].removeClass(this.toThemeProperty('jqx-fill-state-pressed'));
            this._buttons[newButton].addClass(this.toThemeProperty('jqx-scrollview-button-selected'));
            this._buttons[newButton].addClass(this.toThemeProperty('jqx-fill-state-pressed'));
        },

        _changePage: function (index, raiseEvent, duration) {
            if (this.disabled) return;

            var page = $(this._pages[index]),
                margin = (this.host.width() - page.width()) / 2,
                relativeOffset = page.offset().left - this._innerWrapper.offset().left - margin,
                oldPage = this.currentPage,
                self = this;
            if (typeof duration === 'undefined') {
                duration = this.animationDuration;
            }
            this._innerWrapper.stop();
            this._swapButtons(this.currentPage, index);
            this.currentPage = index;
            this._innerWrapper.animate({ marginLeft: -relativeOffset }, duration, function () {
                if (raiseEvent) {
                    self._raiseEvent(0, { currentPage: index, oldPage: oldPage });
                }
            });
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key === 'currentPage') {
                object.currentPage = oldvalue;
                object.changePage(value);
            } else if ((/(buttonsOffset|width|height)/).test(key)) {
                object.refresh();
            } else if (key === 'showButtons') {
                if (!value) {
                    object._buttonsContainer.css('display', 'none');
                } else {
                    object._buttonsContainer.css('display', 'block');
                }
                return;
            }
            else if (key == 'slideShow') {
                object.refresh();
            }
        },

        //Public methods
        changePage: function (index) {
            if (index >= this._pages.length || index < 0) {
                throw new Error('Invalid index!');
            }
            this._changePage(index, true);
        },

        forward: function () {
            if (this.currentPage + 1 < this._pages.length) {
                this.changePage(this.currentPage + 1);
            }
        },

        back: function () {
            if (this.currentPage - 1 >= 0) {
                this.changePage(this.currentPage - 1);
            }
        }
        //end of the public methods
    });
}(jqxBaseFramework));