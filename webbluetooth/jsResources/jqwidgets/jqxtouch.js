/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    var instanceCounter = 0;

    $.jqx.jqxWidget('jqxTouch', '', {});

    $.extend($.jqx._jqxTouch.prototype, {

        defineInstance: function () {
            //Defines the minimum swipe distance required by the plugin.
            this.swipeMin = 50;
            //Defines the maximum swipe distance. After it is passed the propagation of the event will be restored, therefore the scrolling will be available.
            this.swipeMax = 500;
            //The swipe delay. After it is passed swipe event won't be fired.
            this.swipeDelay = 1000;
            //The taphold delay. If this delay is passed then taphold event will be fired.
            this.tapHoldDelay = 750;
            //If this vertical distance is passed the swipe event (swapleft/swapright) won't be fired.
            this.swipeMaxVerticalDisance = 100;
            //If the horizontal distance is passed the swipe event (swipetop/swipebottom) won't be fired.
            this.swipeMaxHorizontalDisance = 100;
            //Indicates whether the orientationchange event is enabled.
            this.orientationChangeEnabled = true;

            //private data members
            this._eventsMap = {
                'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
                'mousemove': $.jqx.mobile.getTouchEventName('touchmove')
            };
            this._swipeLocked = false;
            this._rotationInterval = 200;
            this._events = ['tap', 'taphold', 'swipe', 'swipeleft', 'swiperight', 'swipetop', 'swipebottom', 'orientationchange'];
            this._instanceId = -1;
        },

        createInstance: function () {
            instanceCounter += 1;
            this._instanceId = instanceCounter;
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            this._defineRotateHandler();
        },

        refresh: function () {
            this._removeEventListeners();
            this._addEventListeners();
        },

        _defineRotateHandler: function () {
            var self = this;
            if (!this._rotateHandler) {
                this._rotateHandler = function () {
                    self._checkOrientation();
                }
            }
        },

        _getEvent: function (event) {
            if (this._isTouchDevice) {
                event = this._eventsMap[event];
            }
            return event + this._getEventNamespace();
        },

        _getEventNamespace: function () {
            return '.swipe' + this._instanceId;
        },

        _removeEventListeners: function () {
            clearInterval(this._rotateInterval);
            this.removeHandler($(document), this._getEvent('mouseup'));
            this.removeHandler(this.host, this._getEvent('mousedown'));
            this.removeHandler(this.host, this._getEvent('mousemove'));
            if (window.removeEventListener) {
                window.removeEventListener('resize', this._rotateHandler);
                window.removeEventListener('orientationchange', this._rotateHandler);
            }
        },

        _addEventListeners: function () {
            var self = this;
            this.addHandler(this.host, this._getEvent('mouseup'), function (e) {
                self._resetSwipe();
                self._resetTap();
            });
            this.addHandler(this.host, this._getEvent('mousedown'), function (e) {
                self._initSwipe(e);
                self._initTap(e);
            });
            this.addHandler(this.host, this._getEvent('mousemove'), function (e) {
                self._maxSwipeVerticalDistance = Math.max(self._maxSwipeVerticalDistance, Math.abs(self._startY - self._getCoordinates(e).y));
                self._maxSwipeHorizontalDistance = Math.max(self._maxSwipeHorizontalDistance, Math.abs(self._startX - self._getCoordinates(e).x));
                self._mouseMoved = true;
                return self._handleSwipeEvents(e);
            });
            this._rotationListeners();
        },

        _handleSwipeEvents: function (e) {
            var eventResult = true;
            if (this._mouseDown && !this._tapHoldFired) {
                eventResult = this._handleVerticalSwipeEvents(e);
                eventResult = this._handleHorizontalSwipeEvents(e);
            }
            this._lastPosition = this._getCoordinates(e);
            return eventResult;
        },

        _handleVerticalSwipeEvents: function (e) {
            var current, diff;
            current = this._getCoordinates(e).y;
            diff = current - this._startY;
            if (this._maxSwipeHorizontalDistance < this.swipeMaxHorizontalDisance) {
                return this._swiped(e, diff, 2);
            }
            return true;
        },

        _handleHorizontalSwipeEvents: function (e) {
            var current, diff;
            current = this._getCoordinates(e).x;
            diff = current - this._startX;
            if (this._maxSwipeVerticalDistance < this.swipeMaxVerticalDisance) {
                return this._swiped(e, diff);
            }
            return true;
        },

        _swiped: function (e, diff, direction) {
            direction = direction || 0;
            if (Math.abs(diff) >= this.swipeMin && !this._swipeEvent && !this._swipeLocked) {
                this._swipeEvent = this._getSwipeEvent(diff, direction)
            }
            if (Math.abs(diff) <= this.swipeMax) {
                e.stopImmediatePropagation();
                return false;
            }
            return true;
        },

        _getSwipeEvent: function (diff, direction) {
            var event;
            if (diff < 0) {
                event = { eventId: 3 + direction, data: { target: this.host }};
            } else {
                event = { eventId: 4 + direction, data: { target: this.host }};
            }
            return event;
        },

        _resetSwipe: function () {
            if (this._swipeEvent && !this._swipeLocked) {
                this._raiseEvent(2, this._swipeEvent.data);
                this._raiseEvent(this._swipeEvent.eventId, this._swipeEvent.data);
            }
            clearTimeout(this._swipeTimeout);
            this._mouseDown = false;
        },

        _resetTap: function () {
            clearTimeout(this._tapHoldTimeout);
            if (!this._tapHoldFired && !this._mouseMoved) {
                this._raiseEvent(0, { target: this.host });
            }
        },

        _initTap: function (e) {
            var self = this;
            this._mouseMoved = false;
            this._tapHoldFired = false;
            this._tapHoldTimeout = setTimeout(function () {
                if (!self._mouseMoved) {
                    self._raiseEvent(1, { target: this.host });
                    self._tapHoldFired = true;
                }
            }, this.tapHoldDelay);
        },

        _initSwipe: function (e) {
            var self = this;
            this._mouseDown = true;
            this._maxSwipeVerticalDistance = 0;
            this._maxSwipeHorizontalDistance = 0;
            this._startX = this._getCoordinates(e).x;
            this._startY = this._getCoordinates(e).y;
            this._swipeLocked = false;
            this._swipeEvent = null;
            this._swipeTimeout = setTimeout(function () {
                self._swipeLocked = true;
            }, this.swipeDelay);
        },

        _rotationListeners: function () {
            var self = this;
            this._previousOrientation = window.orientation;
            this._previousWidth = screen.width;
            if (this.orientationChangeEnabled) {
                if (window.addEventListener) {
                    window.addEventListener('resize', this._rotateHandler, false);
                    window.addEventListener('orientationchange', this._rotateHandler, false);
                }
                this._rotateInterval = setInterval(function () {
                    self._checkOrientation();
                }, this._rotationInterval);
            }
        },

        _checkOrientation: function () {
            var orientation = 'vertical';
            if (window.orientation !== this._previousOrientation || this._previousWidth !== screen.width) {
                if (window.orientation === 90 || screen.width > screen.height) {
                    orientation = 'horizontal';
                }
                this._raiseEvent(7, { orientation: orientation });
            }
            this._previousOrientation = window.orientation;
            this._previousWidth = screen.width;
        },

        _raiseEvent: function (eId, args) {
            var event = $.Event(this._events[eId]);
            event.args = args;
            return this.host.trigger(event);
        },

        _getCoordinates: function (e) {
            var c =  $.jqx.position(e);
            c.x = c.left;
            c.y = c.top;
                       
            return c;
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key === 'orientationChangeEnabled') {
                this.refresh();
            } else {
                return;
            }
        },

        //Public mathods
        isTouchDevice: function () {
            return this._isTouchDevice;
        }

    });

}(jqxBaseFramework));