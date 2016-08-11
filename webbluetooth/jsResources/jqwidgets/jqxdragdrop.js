/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget('jqxDragDrop', '', {});

    $.extend($.jqx._jqxDragDrop.prototype, {
        defineInstance: function () {
            var settings = {
                restricter: 'document',
                handle: false,
                feedback: 'clone',
                opacity: 0.6,
                revert: false,
                revertDuration: 400,
                distance: 5,
                disabled: false,
                tolerance: 'intersect',
                data: null,
                dropAction: 'default',
                dragZIndex: 999999,
                appendTo: 'parent',
                cursor: 'move',
                onDragEnd: null,
                onDrag: null,
                onDragStart: null,
                onTargetDrop: null,
                onDropTargetEnter: null,
                onDropTargetLeave: null,
                initFeedback: null,
                dropTarget: null,
                isDestroyed: false,
                triggerEvents: true,
                _touchEvents: {
                    'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                    'click': $.jqx.mobile.getTouchEventName('touchstart'),
                    'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
                    'mousemove': $.jqx.mobile.getTouchEventName('touchmove'),
                    'mouseenter': 'mouseenter',
                    'mouseleave': 'mouseleave'
                },
                _restricter: null,
                _zIndexBackup: 0,
                _targetEnterFired: false,
                _oldOpacity: 1,
                _feedbackType: undefined,
                _isTouchDevice: false,
                _events: [
                    'dragStart', 'dragEnd', 'dragging', 'dropTargetEnter', 'dropTargetLeave'
                ]
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            this._createDragDrop();
        },

        _createDragDrop: function () {
            var count = $.data(document.body, 'jqx-draggables') || 1;
            this.appendTo = this._getParent();
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            if ((/(static|relative)/).test(this.host.css('position'))) {
                if (!this.feedback || this.feedback === 'original') {
                    var pos = this._getRelativeOffset(this.host);
                    var parentOffset = this.appendTo.offset();
                    if (this.appendTo.css('position') != 'static') {
                        parentOffset = { left: 0, top: 0 };
                    }

                    this.element.style.position = 'absolute';
                    this.element.style.left = parentOffset.left + pos.left + 'px';
                    this.element.style.top = parentOffset.top + pos.top + 'px';
                }
            }
            this._validateProperties();
            this._idHandler(count);
            if (this.disabled) {
                this.disable();
            }
            if (typeof this.dropTarget === 'string') {
                this.dropTarget = $(this.dropTarget);
            }
            this._refresh();
            count += 1;
            $.data(document.body, 'jqx-draggables', count);
            this.host.addClass('jqx-draggable');
            if (!this.disabled) {
                this.host.css('cursor', this.cursor);
            }
        },

        _getParent: function () {
            var parent = this.appendTo;
            if (typeof this.appendTo === 'string') {
                switch (this.appendTo) {
                    case 'parent':
                        parent = this.host.parent();
                        break;
                    case 'document':
                        parent = $(document);
                        break;
                    case 'body':
                        parent = $(document.body);
                        break;
                    default:
                        parent = $(this.appendTo);
                        break
                }
            }
            return parent;
        },

        _idHandler: function (count) {
            if (!this.element.id) {
                var id = 'jqx-draggable-' + count;
                this.element.id = id;
            }
        },

        _refresh: function () {
            this._removeEventHandlers();
            this._addEventHandlers();
        },

        _getEvent: function (event) {
            if (this._isTouchDevice) {
                return this._touchEvents[event];
            } else {
                return event;
            }
        },

        _validateProperties: function () {
            if (this.feedback === 'clone') {
                this._feedbackType = 'clone';
            } else {
                this._feedbackType = 'original';
            }
            if (this.dropAction !== 'default') {
                this.dropAction = 'nothing';
            }
        },

        _removeEventHandlers: function () {
            this.removeHandler(this.host, 'dragstart');
            this.removeHandler(this.host, this._getEvent('mousedown') + '.draggable.' + this.element.id, this._mouseDown);
            this.removeHandler($(document), this._getEvent('mousemove') + '.draggable.' + this.element.id, this._mouseMove);
            this.removeHandler($(document), this._getEvent('mouseup') + '.draggable.' + this.element.id, this._mouseUp);
        },

        _addEventHandlers: function () {
            var self = this;
            this.addHandler(this.host, 'dragstart', function (event) {
                if (self.disabled) {
                    return true;
                }
                var isTouchDevice = $.jqx.mobile.isTouchDevice();
                if (!isTouchDevice) {
                    event.preventDefault();
                    return false;
                }
            });
            this.addHandler(this.host, this._getEvent('mousedown') + '.draggable.' + this.element.id, this._mouseDown, { self: this });
            this.addHandler($(document), this._getEvent('mousemove') + '.draggable.' + this.element.id, this._mouseMove, { self: this });
            this.addHandler($(document), this._getEvent('mouseup') + '.draggable.' + this.element.id, this._mouseUp, { self: this });
            try {
                if (document.referrer != "" || window.frameElement) {
                    if (window.top != null && window.top != window.self) {
                        var parentLocation = '';
                        if (window.parent && document.referrer) {
                            parentLocation = document.referrer;
                        }

                        if (parentLocation.indexOf(document.location.host) != -1) {
                            var eventHandle = function (event) {
                                self._mouseUp(self);
                            };

                            if (window.top.document.addEventListener) {
                                window.top.document.addEventListener('mouseup', eventHandle, false);

                            } else if (window.top.document.attachEvent) {
                                window.top.document.attachEvent("on" + 'mouseup', eventHandle);
                            }
                        }
                    }
                }
            }
            catch (error) {
            }
        },

        _mouseDown: function (event) {
            var self = event.data.self,
                mouseCoordinates = self._getMouseCoordinates(event),
                mouseCapture = self._mouseCapture(event);
            self._originalPageX = mouseCoordinates.left;
            self._originalPageY = mouseCoordinates.top;
            if (self.disabled) {
                return true;
            }

            var captured = false;
            if (!self._mouseStarted) {
                self._mouseUp(event);
                captured = true;
            }
            if (mouseCapture) {
                self._mouseDownEvent = event;
            }
            if (self._isTouchDevice) {
                return true;
            }

            if (event.which !== 1 || !mouseCapture) {
                return true;
            }
            event.preventDefault();
            if (captured == true) {
                //   return false;
            }
            //     return false;
        },

        _mouseMove: function (event) {
            var self = event.data.self;
            if (self.disabled) {
                return true;
            }
            if (self._mouseStarted) {
                self._mouseDrag(event);
                if (event.preventDefault) {
                    event.preventDefault();
                }
                return false;
            }
            if (self._mouseDownEvent && self._isMovedDistance(event)) {
                if (self._mouseStart(self._mouseDownEvent, event)) {
                    self._mouseStarted = true;
                } else {
                    self._mouseStarted = false;
                }
                if (self._mouseStarted) {
                    self._mouseDrag(event);
                } else {
                    self._mouseUp(event);
                }
            }
            return !self._mouseStarted;
        },

        _mouseUp: function (event) {
            var self;
            if (event.data && event.data.self) {
                self = event.data.self;
            } else {
                self = this;
            }
            if (self.disabled) {
                return true;
            }
            self._mouseDownEvent = false;
            self._movedDistance = false;
            if (self._mouseStarted) {
                self._mouseStarted = false;
                self._mouseStop(event);
            }
            if (self.feedback && self.feedback[0] && self._feedbackType !== 'original' && typeof self.feedback.remove === 'function' && !self.revert) {
                self.feedback.remove();
            }
            if (!self._isTouchDevice) {
                return false;
            }
        },

        cancelDrag: function () {
            var revertDuration = this.revertDuration;
            this.revertDuration = 0;
            this._mouseDownEvent = false;
            this._movedDistance = false;
            this._mouseStarted = false;
            this._mouseStop();
            this.feedback.remove();
            this.revertDuration = revertDuration;
        },

        _isMovedDistance: function (event) {
            var mc = this._getMouseCoordinates(event);
            if (this._movedDistance) {
                return true;
            }
            if (mc.left >= this._originalPageX + this.distance ||
                mc.left <= this._originalPageX - this.distance ||
                mc.top >= this._originalPageY + this.distance ||
                mc.top <= this._originalPageY - this.distance) {
                this._movedDistance = true;
                return true;
            }
            return false;
        },

        _getMouseCoordinates: function (event) {
            if (this._isTouchDevice) {
                var pos = $.jqx.position(event);

                return {
                    left: pos.left,
                    top: pos.top
                };
            } else {
                return {
                    left: event.pageX,
                    top: event.pageY
                };
            }
        },

        destroy: function () {
            this._enableSelection(this.host);
            this.host
            .removeData('draggable')
            .off('.draggable')
            .removeClass('jqx-draggable'
                + ' jqx-draggable-dragging'
                + ' jqx-draggable-disabled');
            this._removeEventHandlers();
            this.isDestroyed = true;
            return this;
        },

        _disableSelection: function (element) {
            element.each(function () {
                $(this).attr('unselectable', 'on')
                    .css({
                        '-ms-user-select': 'none',
                        '-moz-user-select': 'none',
                        '-webkit-user-select': 'none',
                        'user-select': 'none'
                    })
                    .each(function () {
                        this.onselectstart = function () {
                            return false;
                        };
                    });
            });
        },

        _enableSelection: function (element) {
            element.each(function () {
                $(this).attr('unselectable', 'off')
                .css({
                    '-ms-user-select': 'text',
                    '-moz-user-select': 'text',
                    '-webkit-user-select': 'text',
                    'user-select': 'text'
                })
                .each(function () {
                    this.onselectstart = null;
                });
            });
        },

        _mouseCapture: function (event) {
            if (this.disabled) {
                return false;
            }
            if (!this._getHandle(event)) {
                return false;
            }
            this._disableSelection(this.host);
            return true;
        },

        _getScrollParent: function (element) {
            var scrollParent;
            if (($.jqx.browser.msie && (/(static|relative)/).test(element.css('position'))) ||
            (/absolute/).test(element.css('position'))) {
                scrollParent = element.parents().filter(function () {
                    return (/(relative|absolute|fixed)/).test($.css(this, 'position', 1)) &&
                    (/(auto|scroll)/).test($.css(this, 'overflow', 1) + $.css(this, 'overflow-y', 1) + $.css(this, 'overflow-x', 1));
                }).eq(0);
            } else {
                scrollParent = element.parents().filter(function () {
                    return (/(auto|scroll)/).test($.css(this, 'overflow', 1) + $.css(this, 'overflow-y', 1) + $.css(this, 'overflow-x', 1));
                }).eq(0);
            }

            return (/fixed/).test(element.css('position')) || !scrollParent.length ? $(document) : scrollParent;
        },

        _mouseStart: function (event) {
            var mouseCoordinates = this._getMouseCoordinates(event),
                parentOffset = this._getParentOffset(this.host);
            this.feedback = this._createFeedback(event);
            this._zIndexBackup = this.feedback.css('z-index');
            this.feedback[0].style.zIndex = this.dragZIndex;
            this._backupFeedbackProportions();
            this._backupeMargins();
            this._positionType = this.feedback.css('position');
            this._scrollParent = this._getScrollParent(this.feedback);
            this._offset = this.positionAbs = this.host.offset();
            this._offset = {
                top: this._offset.top - this.margins.top,
                left: this._offset.left - this.margins.left
            };
            $.extend(this._offset, {
                click: {
                    left: mouseCoordinates.left - this._offset.left,
                    top: mouseCoordinates.top - this._offset.top
                },
                parent: this._getParentOffset(),
                relative: this._getRelativeOffset(),
                hostRelative: this._getRelativeOffset(this.host)
            });
            this.position = this._generatePosition(event);
            this.originalPosition = this._fixPosition();
            if (this.restricter) {
                this._setRestricter();
            }
            this.feedback.addClass(this.toThemeProperty('jqx-draggable-dragging'));
            var result = this._raiseEvent(0, event);
            if (this.onDragStart && typeof this.onDragStart === 'function') {
                this.onDragStart(this.position);
            }
            this._mouseDrag(event, true);
            return true;
        },

        _fixPosition: function () {
            var parentOffset = this._getRelativeOffset(this.host),
                position = this.position;
            //if (this.feedback.parent()[0] !== this.host.parent()[0]) {
            position = {
                left: this.position.left + parentOffset.left,
                top: this.position.top + parentOffset.top
            }
            //}
            return position;
        },

        _mouseDrag: function (event, noPropagation) {
            this.position = this._generatePosition(event);
            this.positionAbs = this._convertPositionTo('absolute');
            this.feedback[0].style.left = this.position.left + 'px';
            this.feedback[0].style.top = this.position.top + 'px';
            this._raiseEvent(2, event);
            if (this.onDrag && typeof this.onDrag === 'function') {
                this.onDrag(this.data, this.position);
            }
            this._handleTarget();
            return false;
        },

        _over: function (position, dw, dh) {
            if (this.dropTarget) {
                var over = false, self = this;
                $.each(this.dropTarget, function (idx, droppable) {
                    over = self._overItem(droppable, position, dw, dh);
                    if (over.over) {
                        return false;
                    }
                });
            }
            return over;
        },

        _overItem: function (droppable, position, dw, dh) {
            droppable = $(droppable);
            var dropOffset = droppable.offset(),
                ch = droppable.outerHeight(),
                cw = droppable.outerWidth(),
                over;
            if (!droppable || droppable[0] === this.element) {
                return;
            }
            var over = false;
            switch (this.tolerance) {
                case 'intersect':
                    if (position.left + dw > dropOffset.left &&
                        position.left < dropOffset.left + cw &&
                        position.top + dh > dropOffset.top &&
                        position.top < dropOffset.top + ch) {
                        over = true;
                    }
                    break;
                case 'fit':
                    if (dw + position.left <= dropOffset.left + cw &&
                        position.left >= dropOffset.left &&
                        dh + position.top <= dropOffset.top + ch &&
                        position.top >= dropOffset.top) {
                        over = true;
                    }
                    break;
            }
            return { over: over, target: droppable };
        },

        _handleTarget: function () {
            if (this.dropTarget) {
                var position = this.feedback.offset(),
                    dw = this.feedback.outerWidth(),
                    dh = this.feedback.outerHeight(),
                    over = this._over(position, dw, dh);
                if (over.over) {
                    if (this._targetEnterFired && over.target.length > 0 && this._oldtarget && this._oldtarget.length > 0 && over.target[0] != this._oldtarget[0]) {
                        this._raiseEvent(4, { target: this._oldtarget });
                        if (this.onDropTargetLeave && typeof this.onDropTargetLeave === 'function') {
                            this.onDropTargetLeave(this._oldtarget);
                        }
                    }

                    if (!this._targetEnterFired || (over.target.length > 0 && this._oldtarget && this._oldtarget.length > 0 && over.target[0] != this._oldtarget[0])) {
                        this._targetEnterFired = true;
                        this._raiseEvent(3, { target: over.target });
                        if (this.onDropTargetEnter && typeof this.onDropTargetEnter === 'function') {
                            this.onDropTargetEnter(over.target);
                        }
                    }
                    this._oldtarget = over.target;
                } else {
                    if (this._targetEnterFired) {
                        this._targetEnterFired = false;
                        this._raiseEvent(4, { target: this._oldtarget || over.target });
                        if (this.onDropTargetLeave && typeof this.onDropTargetLeave === 'function') {
                            this.onDropTargetLeave(this._oldtarget || over.target);
                        }
                    }
                }
            }
        },

        _mouseStop: function (event) {
            var dropped = false,
                dropPosition = this._fixPosition(),
                size = {
                    width: this.host.outerWidth(),
                    height: this.host.outerHeight()
                };
            this.feedback[0].style.opacity = this._oldOpacity;
            if (!this.revert) {
                this.feedback[0].style.zIndex = this._zIndexBackup;
            }
            this._enableSelection(this.host);
            if (this.dropped) {
                dropped = this.dropped;
                this.dropped = false;
            }
            if ((!this.element || !this.element.parentNode) && this.feedback === 'original') {
                return false;
            }
            this._dropElement(dropPosition);
            //   return;
            this.feedback.removeClass(this.toThemeProperty('jqx-draggable-dragging'));
            this._raiseEvent(1, event);
            if (this.onDragEnd && typeof this.onDragEnd === 'function') {
                this.onDragEnd(this.data);
            }
            if (this.onTargetDrop && typeof this.onTargetDrop === 'function' && this._over(dropPosition, size.width, size.height).over) {
                this.onTargetDrop(this._over(dropPosition, size.width, size.height).target);
            }
            this._revertHandler();
            return false;
        },

        _dropElement: function (dropPosition) {
            if (this.dropAction === 'default' &&
                this.feedback && this.feedback[0] !== this.element &&
                this.feedback !== 'original') {
                if (!this.revert) {
                    if (!(/(fixed|absolute)/).test(this.host.css('position'))) {
                        this.host.css('position', 'relative')
                        var offset = this._getRelativeOffset(this.host);
                        dropPosition = this.position;
                        dropPosition.left -= offset.left;
                        dropPosition.top -= offset.top;

                        this.element.style.left = dropPosition.left + 'px';
                        this.element.style.top = dropPosition.top + 'px';
                    }
                }
            }
        },

        _revertHandler: function () {
            if (this.revert || ($.isFunction(this.revert) && this.revert())) {
                var self = this;
                if (this._feedbackType != 'original') {
                    //          $(this.host).css('left', self.originalPosition.left - self._offset.hostRelative.left);
                    //          $(this.host).css('top', self.originalPosition.top - self._offset.hostRelative.top);
                    if (this.feedback != null) {
                        if (this.dropAction != 'none') {
                            $(this.feedback).animate({
                                left: self.originalPosition.left - self._offset.hostRelative.left,
                                top: self.originalPosition.top - self._offset.hostRelative.top
                            }, parseInt(this.revertDuration, 10), function () {
                                if (self.feedback && self.feedback[0] && self._feedbackType !== 'original' && typeof self.feedback.remove === 'function') {
                                    self.feedback.remove();
                                }
                            });
                        }
                        else {
                            if (self.feedback && self.feedback[0] && self._feedbackType !== 'original' && typeof self.feedback.remove === 'function') {
                                self.feedback.remove();
                            }
                        }
                    }
                }
                else {
                    this.element.style.zIndex = this.dragZIndex;
                    $(this.host).animate({
                        left: self.originalPosition.left - self._offset.hostRelative.left,
                        top: self.originalPosition.top - self._offset.hostRelative.top
                    }, parseInt(this.revertDuration, 10), function () {
                        self.element.style.zIndex = self._zIndexBackup;
                    });
                }
            }
        },

        _getHandle: function (event) {
            var handle;
            if (!this.handle) {
                handle = true;
            } else {
                $(this.handle, this.host).find('*').andSelf().each(function () {
                    if (this == event.target) handle = true;
                });
            }
            return handle;
        },

        _createFeedback: function (event) {
            var feedback;
            if (typeof this._feedbackType === 'function') {
                feedback = this._feedbackType();
            } else if (this._feedbackType === 'clone') {
                feedback = this.host.clone().removeAttr('id');
            } else {
                feedback = this.host;
            }
            if (!(/(absolute|fixed)/).test(feedback.css('position'))) {
                feedback.css('position', 'absolute');
            }
            if (this.appendTo[0] !== this.host.parent()[0] ||
                feedback[0] !== this.element) {
                var pos = {};
                feedback.css({
                    left: this.host.offset().left - this._getParentOffset(this.host).left + this._getParentOffset(feedback).left,
                    top: this.host.offset().top - this._getParentOffset(this.host).top + this._getParentOffset(feedback).top
                });
                feedback.appendTo(this.appendTo);
            }
            if (typeof this.initFeedback === 'function') {
                this.initFeedback(feedback);
            }
            return feedback;
        },

        _getParentOffset: function (element) {
            var element = element || this.feedback;
            this._offsetParent = element.offsetParent();
            var parentOffset = this._offsetParent.offset();
            if (this._positionType == 'absolute' && this._scrollParent[0] !== document && $.contains(this._scrollParent[0], this._offsetParent[0])) {
                parentOffset.left += this._scrollParent.scrollLeft();
                parentOffset.top += this._scrollParent.scrollTop();
            }
            if ((this._offsetParent[0] == document.body) ||
                (this._offsetParent[0].tagName && this._offsetParent[0].tagName.toLowerCase() == 'html' && $.jqx.browser.msie)) {
                parentOffset = { top: 0, left: 0 };
            }
            return {
                top: parentOffset.top + (parseInt(this._offsetParent.css('border-top-width'), 10) || 0),
                left: parentOffset.left + (parseInt(this._offsetParent.css('border-left-width'), 10) || 0)
            };

        },

        _getRelativeOffset: function (element) {
            var parent = this._scrollParent || element.parent();
            element = element || this.feedback;
            if (element.css('position') === 'relative') {
                var position = this.host.position();
                return {
                    top: position.top - (parseInt(element.css('top'), 10) || 0),
                    left: position.left - (parseInt(element.css('left'), 10) || 0)
                };
            } else {
                return { top: 0, left: 0 };
            }
        },

        _backupeMargins: function () {
            this.margins = {
                left: (parseInt(this.host.css('margin-left'), 10) || 0),
                top: (parseInt(this.host.css('margin-top'), 10) || 0),
                right: (parseInt(this.host.css('margin-right'), 10) || 0),
                bottom: (parseInt(this.host.css('margin-bottom'), 10) || 0)
            };
        },

        _backupFeedbackProportions: function () {
            this.feedback[0].style.opacity = this.opacity;
            this._feedbackProportions = {
                width: this.feedback.outerWidth(),
                height: this.feedback.outerHeight()
            };
        },

        _setRestricter: function () {
            if (this.restricter == 'parent') {
                this.restricter = this.feedback[0].parentNode;
            }
            if (this.restricter == 'document' || this.restricter == 'window') {
                this._handleNativeRestricter();
            }
            if (typeof this.restricter.left !== 'undefined' && typeof this.restricter.top !== 'undefined' &&
                       typeof this.restricter.height !== 'undefined' && typeof this.restricter.width !== 'undefined') {
                this._restricter = [this.restricter.left, this.restricter.top, this.restricter.width, this.restricter.height];
            } else if (!(/^(document|window|parent)$/).test(this.restricter) && this.restricter.constructor != Array) {
                this._handleDOMParentRestricter();

            } else if (this.restricter.constructor == Array) {
                this._restricter = this.restricter;
            }

        },

        _handleNativeRestricter: function () {
            this._restricter = [
                    this.restricter === 'document' ? 0 : $(window).scrollLeft() - this._offset.relative.left - this._offset.parent.left,
                    this.restricter === 'document' ? 0 : $(window).scrollTop() - this._offset.relative.top - this._offset.parent.top,
                    (this.restricter === 'document' ? 0 : $(window).scrollLeft()) + $(this.restricter === 'document' ? document : window).width() - this._feedbackProportions.width - this.margins.left,
                    (this.restricter === 'document' ? 0 : $(window).scrollTop()) + ($(this.restricter === 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this._feedbackProportions.height - this.margins.top
            ];
        },

        _handleDOMParentRestricter: function () {
            var restricter = $(this.restricter),
                restricterElement = restricter[0];
            if (!restricterElement) {
                return;
            }
            var over = ($(restricterElement).css('overflow') !== 'hidden');
            this._restricter = [
                (parseInt($(restricterElement).css('borderLeftWidth'), 10) || 0) + (parseInt($(restricterElement).css('paddingLeft'), 10) || 0),
                (parseInt($(restricterElement).css('borderTopWidth'), 10) || 0) + (parseInt($(restricterElement).css('paddingTop'), 10) || 0),
                (over ? Math.max(restricterElement.scrollWidth, restricterElement.offsetWidth) : restricterElement.offsetWidth) - (parseInt($(restricterElement).css('borderLeftWidth'), 10) || 0) - (parseInt($(restricterElement).css('paddingRight'), 10) || 0) - this._feedbackProportions.width - this.margins.left - this.margins.right,
                (over ? Math.max(restricterElement.scrollHeight, restricterElement.offsetHeight) : restricterElement.offsetHeight) - (parseInt($(restricterElement).css('borderTopWidth'), 10) || 0) - (parseInt($(restricterElement).css('paddingBottom'), 10) || 0) - this._feedbackProportions.height - this.margins.top - this.margins.bottom
            ];
            this._restrictiveContainer = restricter;
        },

        _convertPositionTo: function (d, position) {
            if (!position) {
                position = this.position;
            }
            var mod, scroll, scrollIsRootNode;
            if (d === 'absolute') {
                mod = 1;
            } else {
                mod = -1;
            }
            if (this._positionType === 'absolute' && !(this._scrollParent[0] != document && $.contains(this._scrollParent[0], this._offsetParent[0]))) {
                scroll = this._offsetParent;
            } else {
                scroll = this._scrollParent;
            }
            scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);
            return this._getPosition(position, mod, scrollIsRootNode, scroll);

        },

        _getPosition: function (position, mod, scrollIsRootNode, scroll) {
            return {
                top: (
                    position.top
                    + this._offset.relative.top * mod
                    + this._offset.parent.top * mod
                    - ($.jqx.browser.safari && $.jqx.browser.version < 526 && this._positionType == 'fixed' ? 0 : (this._positionType == 'fixed' ? -this._scrollParent.scrollTop() : (scrollIsRootNode ? 0 : scroll.scrollTop())) * mod)
                ),
                left: (
                    position.left
                    + this._offset.relative.left * mod
                    + this._offset.parent.left * mod
                    - ($.jqx.browser.safari && $.jqx.browser.version < 526 && this._positionType == 'fixed' ? 0 : (this._positionType == 'fixed' ? -this._scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft()) * mod)
                )
            };
        },

        _generatePosition: function (event) {
            var scroll =
                this._positionType == 'absolute' &&
                !(this._scrollParent[0] != document &&
                $.contains(this._scrollParent[0], this._offsetParent[0])) ?
                this._offsetParent :
                this._scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

            var mouseCoordinates = this._getMouseCoordinates(event),
                pageX = mouseCoordinates.left,
                pageY = mouseCoordinates.top;
            if (this.originalPosition) {
                var restricter;
                if (this.restricter) {
                    if (this._restrictiveContainer) {
                        var co = this._restrictiveContainer.offset();
                        restricter = [this._restricter[0] + co.left,
                             this._restricter[1] + co.top,
                             this._restricter[2] + co.left,
                             this._restricter[3] + co.top];
                    } else {
                        restricter = this._restricter;
                    }
                    if (mouseCoordinates.left - this._offset.click.left < restricter[0]) {
                        pageX = restricter[0] + this._offset.click.left;
                    }
                    if (mouseCoordinates.top - this._offset.click.top < restricter[1]) {
                        pageY = restricter[1] + this._offset.click.top;
                    }
                    if (mouseCoordinates.left - this._offset.click.left > restricter[2]) {
                        pageX = restricter[2] + this._offset.click.left;
                    }
                    if (mouseCoordinates.top - this._offset.click.top > restricter[3]) {
                        pageY = restricter[3] + this._offset.click.top;
                    }
                }
            }
            return {
                top: (
                    pageY - this._offset.click.top - this._offset.relative.top - this._offset.parent.top + ($.jqx.browser.safari && $.jqx.browser.version < 526 && this._positionType == 'fixed' ? 0 : (this._positionType == 'fixed' ? -this._scrollParent.scrollTop() : (scrollIsRootNode ? 0 : scroll.scrollTop())))
                ),
                left: (
                    pageX - this._offset.click.left - this._offset.relative.left - this._offset.parent.left + ($.jqx.browser.safari && $.jqx.browser.version < 526 && this._positionType == 'fixed' ? 0 : (this._positionType == 'fixed' ? -this._scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft()))
                )
            };
        },

        _raiseEvent: function (eventId, data) {
            if (this.triggerEvents != undefined && this.triggerEvents == false)
                return;

            var eventName = this._events[eventId],
            event = $.Event(eventName),
            data = data || {};
            data.position = this.position;
            data.element = this.element;
            $.extend(data, this.data);
            data.feedback = this.feedback;
            // this.data = data;
            event.args = data;

            return this.host.trigger(event);
        },

        disable: function () {
            this.disabled = true;
            this.host.addClass(this.toThemeProperty('jqx-draggable-disabled'));
            this._enableSelection(this.host);
        },

        enable: function () {
            this.disabled = false;
            this.host.removeClass(this.toThemeProperty('jqx-draggable-disabled'));
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key === 'dropTarget') {
                if (typeof value === 'string') {
                    object.dropTarget = $(value);
                }
            }
            else if (key == "disabled") {
                if (value) {
                    object._enableSelection(object.host);
                }
            }
            else if (key == 'cursor') {
                object.host.css('cursor', object.cursor);
            }
        }

    });

})(jqxBaseFramework);
(function ($) {

    jqxListBoxDragDrop = function () {
        $.extend($.jqx._jqxListBox.prototype,
        {
            _hitTestBounds: function (listBox, hitLeft, hitTop) {
                var selfOffset = listBox.host.offset();
                var y = hitTop - parseInt(selfOffset.top);
                var x = hitLeft - parseInt(selfOffset.left);
                var item = listBox._hitTest(x, y);

                if (y < 0)
                    return null;

                if (item != null) {
                    var left = parseInt(selfOffset.left);
                    var right = left + listBox.host.width();
                    if (left <= hitLeft + item.width / 2 && hitLeft <= right)
                        return item;

                    return null;
                }


                if (listBox.items && listBox.items.length > 0) {
                    var lastItem = listBox.items[listBox.items.length - 1];
                    //        if (y - 20 <= lastItem.top)
                    //            item = lastItem;
                    if (listBox.groups.length < 2)
                    {
                        if (lastItem.top + lastItem.height + 15 >= y) {
                            return lastItem;
                        }
                    }
                }

                return null;
            },

            _handleDragStart: function (elements, me) {
                var isTouchDevice = $.jqx.mobile.isTouchDevice();
                if (isTouchDevice) {
                    if (me.allowDrag) {
                        elements.on($.jqx.mobile.getTouchEventName('touchstart'), function () {
                            $.jqx.mobile.setTouchScroll(false, me.element.id);
                        });
                    }
                }

                elements.off('dragStart');
                elements.on('dragStart', function (event) {
                    if (me.allowDrag && !me.disabled) {
                        me.feedbackElement = $("<div style='z-index: 99999; position: absolute;'></div>");
                        me.feedbackElement.addClass(me.toThemeProperty('jqx-listbox-feedback'));
                        me.feedbackElement.appendTo($(document.body));
                        me.feedbackElement.hide();
                        me.isDragging = true;
                        me._dragCancel = false;
                        var mousePosition = me._getMouseCoordinates(event);
                        var item = me._hitTestBounds(me, mousePosition.left, mousePosition.top);
                        var listBoxes = $.find('.jqx-listbox');
                        me._listBoxes = listBoxes;
                        $.each(me._listBoxes, function () {
                            var listBoxInstance = $.data(this, "jqxListBox").instance;
                            listBoxInstance._enableHover = listBoxInstance.enableHover;
                            listBoxInstance.enableHover = false;
                            $.jqx.mobile.setTouchScroll(false, me.element.id);
                        });

                        var stopDrag = function () {
                            me._dragCancel = true;
                            $(event.args.element).jqxDragDrop({ triggerEvents: false });
                            $(event.args.element).jqxDragDrop('cancelDrag');
                            clearInterval(me._autoScrollTimer);
                            $(event.args.element).jqxDragDrop({ triggerEvents: true });
                            $.each(me._listBoxes, function () {
                                var listBoxInstance = $.data(this, "jqxListBox").instance;
                                if (listBoxInstance._enableHover != undefined) {
                                    listBoxInstance.enableHover = listBoxInstance._enableHover;
                                    $.jqx.mobile.setTouchScroll(true, me.element.id);
                                }
                            });
                        }

                        if (item != null && !item.isGroup) {
                            me._dragItem = item;
                            if (me.dragStart) {
                                var result = me.dragStart(item);
                                if (result == false) {
                                    stopDrag();
                                    return false;
                                }
                            }
                            if (item.disabled) {
                                stopDrag();
                            }
                            me._raiseEvent(4, { label: item.label, value: item.value, originalEvent: event.args });
                        }
                        else if (item == null) {
                            stopDrag();
                        }
                    }
                    return false;
                });
            },

            _handleDragging: function (elements, me) {
                elements.off('dragging');
                elements.on('dragging', function (event) {
                    var args = event.args;
                    if (me._dragCancel)
                        return;

                    var mousePosition = me._getMouseCoordinates(event);
                    var position = mousePosition;
                    me._lastDraggingPosition = mousePosition;

                    me._dragOverItem = null;
                    me.feedbackElement.hide();

                    $.each(me._listBoxes, function () {
                        if ($.jqx.isHidden($(this)))
                            return true;

                        var offset = $(this).offset();
                        var top = offset.top + 20;
                        var bottom = $(this).height() + top - 40;
                        var left = offset.left;
                        var width = $(this).width();
                        var right = left + width;
                        var listBoxInstance = $.data(this, "jqxListBox").instance;

                        var item = listBoxInstance._hitTestBounds(listBoxInstance, mousePosition.left, mousePosition.top);
                        var vScrollInstance = listBoxInstance.vScrollInstance;
                        if (item != null) {
                            if (listBoxInstance.allowDrop && !listBoxInstance.disabled) {
                                me._dragOverItem = item;
                                if (item.element) {
                                    me.feedbackElement.show();
                                    var itemTop = $(item.element).offset().top + 1;
                                    if (position.top > itemTop + item.height / 2) {
                                        itemTop = itemTop + item.height;
                                    }

                                    me.feedbackElement.css('top', itemTop);
                                    me.feedbackElement.css('left', left);
                                    if (listBoxInstance.vScrollBar.css('visibility') != 'visible') {
                                        me.feedbackElement.width($(this).width());
                                    }
                                    else me.feedbackElement.width($(this).width() - 20);
                                }
                            }
                        }

                        if (mousePosition.left >= left && mousePosition.left < right) {
                            if (args.position.top < top && args.position.top >= top - 30) {
                                clearInterval(listBoxInstance._autoScrollTimer);
                                if (vScrollInstance.value != 0) {
                                    me.feedbackElement.hide();
                                }
                                listBoxInstance._autoScrollTimer = setInterval(function () {
                                    var scrolled = listBoxInstance.scrollUp();
                                    if (!scrolled) clearInterval(listBoxInstance._autoScrollTimer);
                                }, 100);
                            }
                            else if (args.position.top > bottom && args.position.top < bottom + 30) {
                                clearInterval(listBoxInstance._autoScrollTimer);
                                if ((listBoxInstance.vScrollBar.css('visibility') != 'hidden') && vScrollInstance.value != vScrollInstance.max) {
                                    me.feedbackElement.hide();
                                }

                                listBoxInstance._autoScrollTimer = setInterval(function () {
                                    var scrolled = listBoxInstance.scrollDown();
                                    if (!scrolled) clearInterval(listBoxInstance._autoScrollTimer);
                                }, 100);
                            }
                            else {
                                clearInterval(listBoxInstance._autoScrollTimer);
                            }
                        }
                        else {
                            if (me._dragOverItem == null) {
                                me.feedbackElement.hide();
                            }
                            clearInterval(listBoxInstance._autoScrollTimer);
                        }
                    });
                });
            },

            _handleDragEnd: function (elements, me) {
                var listBoxes = $.find('.jqx-listbox');
                elements.off('dragEnd');
                elements.on('dragEnd', function (event) {
                    clearInterval(me._autoScrollTimer);
                    var _isTouchDevice = $.jqx.mobile.isTouchDevice();
                    var position = _isTouchDevice ? me._lastDraggingPosition : me._getMouseCoordinates(event);

                    var listBoxes = $.find('.jqx-listbox');
                    var listBox = null;
                    me.feedbackElement.remove();
                    if (me._dragCancel) {
                        event.stopPropagation();
                        return;
                    }

                    $.each(listBoxes, function () {
                        if ($.jqx.isHidden($(this)))
                            return true;

                        var left = parseInt($(this).offset().left);
                        var right = left + $(this).width();
                        var listBoxInstance = $.data(this, "jqxListBox").instance;
                        clearInterval(listBoxInstance._autoScrollTimer);
                        if (listBoxInstance._enableHover != undefined) {
                            listBoxInstance.enableHover = listBoxInstance._enableHover;
                            $.jqx.mobile.setTouchScroll(true, me.element.id);
                        }

                        if (me._dragItem != null) {
                            if (position.left + me._dragItem.width / 2 >= left && position.left < right) {
                                var top = parseInt($(this).offset().top);
                                var bottom = top + $(this).height();
                                if (position.top >= top && position.top <= bottom) {
                                    listBox = $(this);
                                }
                            }
                        }
                    });
                    var oldItem = me._dragItem;
                    if (listBox != null && listBox.length > 0) {
                        var listBoxInstance = $.data(listBox[0], "jqxListBox").instance;
                        var allowDrop = listBoxInstance.allowDrop;

                        if (allowDrop && !listBoxInstance.disabled) {
                            var listBoxInstance = $.data(listBox[0], "jqxListBox").instance;
                            var item = listBoxInstance._hitTestBounds(listBoxInstance, position.left, position.top);
                            item = me._dragOverItem;
                            if (item != null && !item.isGroup) {
                                var result = true;
                                if (me.dragEnd) {
                                    result = me.dragEnd(oldItem, item, event.args);
                                    if (result == false) {
                                        $(event.args.element).jqxDragDrop({ triggerEvents: false });
                                        $(event.args.element).jqxDragDrop('cancelDrag');
                                        clearInterval(me._autoScrollTimer);
                                        $(event.args.element).jqxDragDrop({ triggerEvents: true });
                                        if (event.preventDefault) {
                                            event.preventDefault();
                                        }
                                        if (event.stopPropagation) {
                                            event.stopPropagation();
                                        }
                                        return false;
                                    }
                                    if (result == undefined) result = true;
                                }
                                if (result) {
                                    var itemIndex = item.visibleIndex;
                                    var getCorrectIndexAfterDrop = function () {
                                        var index = item.visibleIndex;
                                        for (var m = index - 2; m <= index + 2; m++) {
                                            if (listBoxInstance.items && listBoxInstance.items.length > m) {
                                                var currentItem = listBoxInstance.items[m];
                                                if (currentItem != null) {
                                                    if (currentItem.value == oldItem.value)
                                                        return currentItem.visibleIndex;
                                                }
                                            }
                                        }
                                        return index;
                                    }

                                    if (listBoxInstance.dropAction != 'none') {
                                        if (item.element) {
                                            var itemTop = $(item.element).offset().top + 1;
                                        }
                                        else {
                                            var itemTop = $(listBoxInstance.element).offset().top + 1;
                                        }
                                        if (listBoxInstance.content.find('.draggable').length > 0) {
                                            listBoxInstance.content.find('.draggable').jqxDragDrop('destroy');
                                        }
                                        if (position.top > itemTop + item.height / 2) {
                                            listBoxInstance.insertAt(me._dragItem, item.index + 1);
                                        }
                                        else {
                                            listBoxInstance.insertAt(me._dragItem, item.index);
                                        }

                                        if (me.dropAction == 'default') {
                                            if (oldItem.visibleIndex > 0) {
                                                me.clearSelection();
                                                me.selectIndex(oldItem.visibleIndex - 1);
                                            }
                                            me.removeItem(oldItem, true);
                                        }
                                        var index = getCorrectIndexAfterDrop();
                                        listBoxInstance.clearSelection();
                                        listBoxInstance.selectIndex(index);
                                    }
                                }
                            }
                            else {
                                if (listBoxInstance.dropAction != 'none') {
                                    if (listBoxInstance.content.find('.draggable').length > 0) {
                                        listBoxInstance.content.find('.draggable').jqxDragDrop('destroy');
                                    }
                                    if (me.dragEnd) {
                                        var result = me.dragEnd(me._dragItem, null, event.args);
                                        if (result == false) {
                                            $(event.args.element).jqxDragDrop({ triggerEvents: false });
                                            $(event.args.element).jqxDragDrop('cancelDrag');
                                            clearInterval(me._autoScrollTimer);
                                            $(event.args.element).jqxDragDrop({ triggerEvents: true });
                                            if (event.preventDefault) {
                                                event.preventDefault();
                                            }
                                            if (event.stopPropagation) {
                                                event.stopPropagation();
                                            }
                                            return false;
                                        }
                                        if (result == undefined) result = true;
                                    }
                                    listBoxInstance.addItem(me._dragItem);
                                    if (listBoxInstance.dropAction == 'default') {
                                        if (oldItem.visibleIndex > 0) {
                                            me.selectIndex(oldItem.visibleIndex - 1);
                                        }
                                        me.removeItem(oldItem, true);
                                    }

                                    listBoxInstance.clearSelection();
                                    listBoxInstance.selectIndex(listBoxInstance.items.length - 1);
                                }
                            }
                        }
                    }
                    else {
                        if (me.dragEnd) {
                            var dragEnd = me.dragEnd(oldItem, event.args);
                            if (false == dragEnd) {
                                if (event.preventDefault) {
                                    event.preventDefault();
                                }
                                if (event.stopPropagation) {
                                    event.stopPropagation();
                                }
                                return false;
                            }
                        }
                    }
                    if (oldItem != null) {
                        me._raiseEvent(5, { label: oldItem.label, value: oldItem.value, originalEvent: event.args });
                    }
                    return false;
                });
            },

            _enableDragDrop: function () {
                if (this.allowDrag && this.host.jqxDragDrop) {
                    var elements = this.content.find('.draggable');
                    if (elements.length > 0) {
                        var me = this;
                        elements.jqxDragDrop({
                            cursor: 'arrow', revertDuration: 0, appendTo: 'body', dragZIndex: 99999, revert: true,
                            initFeedback: function (feedback) {
                                var title = $('<span style="white-space: nowrap;" class="' + me.toThemeProperty('jqx-fill-state-normal') + '">' + feedback.text() + '</span>');
                                $(document.body).append(title);
                                var width = title.width();
                                title.remove();
                                feedback.width(width + 5);
                                feedback.addClass(me.toThemeProperty('jqx-fill-state-pressed'));
                            }
                        });
                        this._autoScrollTimer = null;
                        me._dragItem = null;
                        me._handleDragStart(elements, me);
                        me._handleDragging(elements, me);
                        me._handleDragEnd(elements, me);
                    }
                }
            },

            _getMouseCoordinates: function (event) {
                this._isTouchDevice = $.jqx.mobile.isTouchDevice();
                if (this._isTouchDevice) {
                    var pos = $.jqx.position(event.args);
                    return {
                        left: pos.left,
                        top: pos.top
                    };
                } else {
                    return {
                        left: event.args.pageX,
                        top: event.args.pageY
                    };
                }
            }
        });
    }

    jqxTreeDragDrop = function () {
        $.extend($.jqx._jqxTree.prototype,
        {
            _hitTestBounds: function (treeInstance, left, top) {
                var me = this;
                var treeItem = null;
                if (treeInstance._visibleItems) {
                    var hostLeft = parseInt(treeInstance.host.offset().left);
                    var hostWidth = treeInstance.host.outerWidth();

                    $.each(treeInstance._visibleItems, function (index) {
                        if (left >= hostLeft && left < hostLeft + hostWidth)
                            if (this.top + 5 < top && top < this.top + this.height) {
                                var parentElement = $(this.element).parents('li:first');
                                if (parentElement.length > 0) {
                                    treeItem = treeInstance.getItem(parentElement[0]);
                                    if (treeItem != null) {
                                        treeItem.height = this.height;
                                        treeItem.top = this.top;
                                        return false;
                                    }
                                }
                            }
                    });
                }
                return treeItem;
            },

            _handleDragStart: function (elements, me) {
                if (me._dragOverItem) {
                    me._dragOverItem.titleElement.removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                }

                var isTouchDevice = $.jqx.mobile.isTouchDevice();
                if (isTouchDevice) {
                    if (me.allowDrag) {
                        elements.on($.jqx.mobile.getTouchEventName('touchstart'), function () {
                            $.jqx.mobile.setTouchScroll(false, 'panel' + me.element.id);
                        });
                    }
                }

                elements.off('dragStart');
                elements.on('dragStart', function (event) {
                    me.feedbackElement = $("<div style='z-index: 99999; position: absolute;'></div>");
                    me.feedbackElement.addClass(me.toThemeProperty('jqx-listbox-feedback'));
                    me.feedbackElement.appendTo($(document.body));
                    me.feedbackElement.hide();
                    me._dragCancel = false;
                    var position = event.args.position;
                    var trees = $.find('.jqx-tree');
                    me._trees = trees;
                    $.each(trees, function () {
                        var treeInstance = $.data(this, "jqxTree").instance;
                        var elements = treeInstance.host.find('.draggable');
                        treeInstance._syncItems(elements);
                        if (treeInstance.allowDrag && !treeInstance.disabled) {
                            var parentElement = $(event.target).parents('li:first');
                            if (parentElement.length > 0) {
                                var item = treeInstance.getItem(parentElement[0]);
                                if (item) {
                                    me._dragItem = item;
                                    if (treeInstance.dragStart) {
                                        var result = treeInstance.dragStart(item);
                                        if (result == false) {
                                            me._dragCancel = true;
                                            $(event.args.element).jqxDragDrop({ triggerEvents: false });
                                            $(event.args.element).jqxDragDrop('cancelDrag');
                                            clearInterval(me._autoScrollTimer);
                                            $(event.args.element).jqxDragDrop({ triggerEvents: treeInstance });
                                            return false;
                                        }
                                    }
                                    treeInstance._raiseEvent(8, { label: item.label, value: item.value, originalEvent: event.args })
                                }
                            }
                        }
                    });

                    return false;
                });
            },

            _getMouseCoordinates: function (event) {
                this._isTouchDevice = $.jqx.mobile.isTouchDevice();
                if (this._isTouchDevice) {
                    var pos = $.jqx.position(event.args);
                    return {
                        left: pos.left,
                        top: pos.top
                    };
                } else {
                    return {
                        left: event.args.pageX,
                        top: event.args.pageY
                    };
                }
            },

            _handleDragging: function (elements, me) {
                var elements = this.host.find('.draggable');
                elements.off('dragging');
                elements.on('dragging', function (event) {
                    var args = event.args;
                    var position = args.position;
                    var trees = me._trees;
                    if (me._dragCancel)
                        return;

                    if (me._dragOverItem) {
                        me._dragOverItem.titleElement.removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                    }

                    var outsideTree = true;
                    var mouseCoordinates = me._getMouseCoordinates(event);
                    me._lastDraggingPosition = mouseCoordinates;
                    $.each(trees, function () {
                        if ($.jqx.isHidden($(this)))
                            return true;

                        var offset = $(this).offset();
                        var top = offset.top + 20;
                        var bottom = $(this).height() + top - 40;
                        var left = offset.left;
                        var width = $(this).width();
                        var right = left + width;
                        var treeInstance = $.data(this, "jqxTree").instance;

                        if (treeInstance.disabled || !treeInstance.allowDrop)
                            return;

                        var vScrollInstance = treeInstance.vScrollInstance;
                        var item = treeInstance._hitTestBounds(treeInstance, mouseCoordinates.left, mouseCoordinates.top);
                        if (item != null) {
                            if (me._dragOverItem) {
                                me._dragOverItem.titleElement.removeClass(treeInstance.toThemeProperty('jqx-fill-state-hover'));
                            }
                            me._dragOverItem = item;
                            if (item.element) {
                                me.feedbackElement.show();
                                var itemTop = item.top;
                                var topPos = mouseCoordinates.top;
                                me._dropPosition = 'before';
                                if (topPos > itemTop + item.height / 3) {
                                    itemTop = item.top + item.height / 2;
                                    me._dragOverItem.titleElement.addClass(me.toThemeProperty('jqx-fill-state-hover'));
                                    me.feedbackElement.hide();
                                    me._dropPosition = 'inside';
                                }
                                if (topPos > (item.top + item.height) - item.height / 3) {
                                    itemTop = item.top + item.height;
                                    me._dragOverItem.titleElement.removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                                    me.feedbackElement.show();
                                    me._dropPosition = 'after';
                                }

                                me.feedbackElement.css('top', itemTop);
                                var left = -2 + parseInt(item.titleElement.offset().left);
                                me.feedbackElement.css('left', left);
                                me.feedbackElement.width($(item.titleElement).width() + 12);
                            }
                        }

                        if (mouseCoordinates.left >= left && mouseCoordinates.left < right) {
                            if (mouseCoordinates.top + 20 >= top && mouseCoordinates.top <= top + treeInstance.host.height()) {
                                outsideTree = false;
                            }

                            if (mouseCoordinates.top < top && mouseCoordinates.top >= top - 30) {
                                clearInterval(treeInstance._autoScrollTimer);
                                if (vScrollInstance.value != 0) {
                                    me.feedbackElement.hide();
                                }
                                treeInstance._autoScrollTimer = setInterval(function () {
                                    var scrolled = treeInstance.panelInstance.scrollUp();
                                    var treeElements = treeInstance.host.find('.draggable');
                                    treeInstance._syncItems(treeElements);
                                    if (!scrolled) clearInterval(treeInstance._autoScrollTimer);
                                }, 100);
                            }
                            else if (mouseCoordinates.top > bottom && mouseCoordinates.top < bottom + 30) {
                                clearInterval(treeInstance._autoScrollTimer);
                                if (vScrollInstance.value != vScrollInstance.max) {
                                    me.feedbackElement.hide();
                                }

                                treeInstance._autoScrollTimer = setInterval(function () {
                                    var scrolled = treeInstance.panelInstance.scrollDown();
                                    var treeElements = treeInstance.host.find('.draggable');
                                    treeInstance._syncItems(treeElements);
                                    if (!scrolled) clearInterval(treeInstance._autoScrollTimer);
                                }, 100);
                            }
                            else {
                                clearInterval(treeInstance._autoScrollTimer);
                            }
                        }
                        else {
                            clearInterval(treeInstance._autoScrollTimer);
                        }
                    });
                    if (outsideTree) {
                        if (me.feedbackElement) {
                            me.feedbackElement.hide();
                        }
                    }
                });
            },

            _handleDragEnd: function (elements, me) {
                elements.off('dragEnd');
                elements.on('dragEnd', function (event) {
                    var elements = me.host.find('.draggable');
                    clearInterval(me._autoScrollTimer);
                    var position = event.args.position;
                    var trees = me._trees;
                    var tree = null;
                    var _isTouchDevice = $.jqx.mobile.isTouchDevice();
                    var mouseCoordinates = _isTouchDevice ? me._lastDraggingPosition : me._getMouseCoordinates(event);

                    me.feedbackElement.remove();
                    if (me._dragCancel)
                        return false;

                    if (me._dragOverItem) {
                        me._dragOverItem.titleElement.removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                    }

                    $.each(trees, function () {
                        if ($.jqx.isHidden($(this)))
                            return true;

                        var left = parseInt($(this).offset().left);
                        var right = left + $(this).width();
                        var treeInstance = $.data(this, "jqxTree").instance;
                        clearInterval(treeInstance._autoScrollTimer);
                        if (me._dragItem != null) {
                            if (mouseCoordinates.left >= left && mouseCoordinates.left < right) {
                                var top = parseInt($(this).offset().top);
                                var bottom = top + $(this).height();
                                if (mouseCoordinates.top >= top && mouseCoordinates.top <= bottom) {
                                    tree = $(this);
                                }
                            }
                        }
                    });
                    var oldItem = me._dragItem;
                    if (tree != null && tree.length > 0) {
                        var allowDrop = tree.jqxTree('allowDrop');
                        if (allowDrop) {
                            var treeInstance = $.data(tree[0], "jqxTree").instance;
                            var item = me._dragOverItem;
                            if (item != null && me._dragOverItem.treeInstance.element.id == treeInstance.element.id) {
                                var result = true;
                                if (me.dragEnd) {
                                    result = me.dragEnd(oldItem, item, event.args, me._dropPosition, tree);
                                    if (result == false) {
                                        $(event.args.element).jqxDragDrop({ triggerEvents: false });
                                        $(event.args.element).jqxDragDrop('cancelDrag');
                                        clearInterval(me._autoScrollTimer);
                                        $(event.args.element).jqxDragDrop({ triggerEvents: true });
                                    }
                                    if (undefined == result) result = true;
                                }
                                if (result) {
                                    var updateSourceTree = function () {
                                        var oldTreeInstance = me._dragItem.treeInstance;
                                        oldTreeInstance._refreshMapping();
                                        oldTreeInstance._updateItemsNavigation();
                                        oldTreeInstance._render(true, false);
                                        if (oldTreeInstance.checkboxes) {
                                            oldTreeInstance._updateCheckStates();
                                        }
                                        me._dragItem.treeInstance = treeInstance;
                                        me._syncItems(me._dragItem.treeInstance.host.find('.draggable'));
                                        //       oldTreeInstance._enableDragDrop();
                                    }

                                    if (treeInstance.dropAction != 'none') {
                                        if (me._dragItem.id != me._dragOverItem.id) {
                                            if (me._dropPosition == 'inside') {
                                                treeInstance._drop(me._dragItem.element, me._dragOverItem.element, -1, treeInstance);
                                                updateSourceTree();
                                            }
                                            else {
                                                var offset = 0;
                                                if (me._dropPosition == 'after') offset++;
                                                treeInstance._drop(me._dragItem.element, me._dragOverItem.parentElement, offset + $(me._dragOverItem.element).index(), treeInstance);
                                                updateSourceTree();
                                            }
                                        }
                                    }

                                    treeInstance._render(true, false);
                                    var treeElements = treeInstance.host.find('.draggable');
                                    me._syncItems(treeElements);
                                    me._dragOverItem = null;
                                    me._dragItem = null;
                                    treeInstance._refreshMapping();
                                    treeInstance._updateItemsNavigation();
                                    treeInstance.selectedItem = null;
                                    treeInstance.selectItem(oldItem.element);
                                    if (treeInstance.checkboxes) {
                                        treeInstance._updateCheckStates();
                                    }
                                    treeInstance._render(true, false);
                                    //      treeInstance._enableDragDrop();
                                }
                            }
                            else {
                                if (treeInstance.dropAction != 'none') {
                                    if (treeInstance.allowDrop) {
                                        var result = true;
                                        if (me.dragEnd) {
                                            result = me.dragEnd(oldItem, item, event.args, me._dropPosition, tree);
                                            if (result == false) {
                                                $(event.args.element).jqxDragDrop({ triggerEvents: false });
                                                $(event.args.element).jqxDragDrop('cancelDrag');
                                                clearInterval(me._autoScrollTimer);
                                                $(event.args.element).jqxDragDrop({ triggerEvents: true });
                                            }
                                            if (undefined == result) result = true;
                                        }
                                        if (result) {
                                            me._dragItem.parentElement = null;
                                            treeInstance._drop(me._dragItem.element, null, -1, treeInstance);
                                            var oldInstance = me._dragItem.treeInstance;
                                            oldInstance._refreshMapping();
                                            oldInstance._updateItemsNavigation();
                                            if (oldInstance.checkboxes) {
                                                oldInstance._updateCheckStates();
                                            }
                                            var treeElements = oldInstance.host.find('.draggable');
                                            me._syncItems(treeElements);
                                            me._dragItem.treeInstance = treeInstance;
                                            treeInstance.items[treeInstance.items.length] = me._dragItem;
                                            treeInstance._render(true, false);
                                            treeInstance._refreshMapping();
                                            treeInstance.selectItem(oldItem.element);
                                            treeInstance._updateItemsNavigation();
                                            var treeElements = treeInstance.host.find('.draggable');
                                            treeInstance._syncItems(treeElements);
                                            if (treeInstance.checkboxes) {
                                                treeInstance._updateCheckStates();
                                            }
                                            me._dragOverItem = null;
                                            me._dragItem = null;
                                            //          treeInstance._enableDragDrop();
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (me.dragEnd) {
                            var dropResult = me.dragEnd(oldItem, event.args);
                            if (false == dropResult) {
                                return false;
                            }
                        }
                    }
                    if (oldItem != null) {
                        me._raiseEvent(7, { label: oldItem.label, value: oldItem.value, originalEvent: event.args });
                    }
                    return false;
                });
            },

            _drop: function (element, parentElement, index, treeInstance) {
                if ($(parentElement).parents('#' + element.id).length > 0)
                    return;

                if (parentElement != null) {
                    if (parentElement.id == element.id)
                        return;
                }

                var me = this;
                if (treeInstance.element.innerHTML.indexOf('UL')) {
                    var innerElement = treeInstance.host.find('ul:first');
                }

                if (parentElement == undefined && parentElement == null) {
                    if (index == undefined || index == -1) {
                        innerElement.append(element);
                    }
                    else {
                        if (innerElement.children('li').eq(index).length == 0) {
                            innerElement.children('li').eq(index - 1).after(element);
                        }
                        else {
                            if (innerElement.children('li').eq(index)[0].id != element.id) {
                                innerElement.children('li').eq(index).before(element);
                            }
                        }
                    }
                }
                else if (index == undefined || index == -1) {
                    parentElement = $(parentElement);
                    var parentUL = parentElement.find('ul:first');
                    if (parentUL.length == 0) {
                        ulElement = $('<ul></ul>');
                        $(parentElement).append(ulElement);
                        parentUL = parentElement.find('ul:first');
                        var item = treeInstance.itemMapping["id" + parentElement[0].id].item;
                        item.subtreeElement = parentUL[0];
                        item.hasItems = true;
                        parentUL.addClass(treeInstance.toThemeProperty('jqx-tree-dropdown'));
                        parentUL.append(element);
                        element = parentUL.find('li:first');
                        item.parentElement = element;
                    }
                    else {
                        parentUL.append(element);
                    }
                }
                else {
                    parentElement = $(parentElement);
                    var parentUL = parentElement.find('ul:first');
                    if (parentUL.length == 0) {
                        ulElement = $('<ul></ul>');
                        $(parentElement).append(ulElement);
                        parentUL = parentElement.find('ul:first');
                        if (parentElement) {
                            var item = treeInstance.itemMapping["id" + parentElement[0].id].item;
                            item.subtreeElement = parentUL[0];
                            item.hasItems = true;
                        }

                        parentUL.addClass(treeInstance.toThemeProperty('jqx-tree-dropdown'));
                        parentUL.append(element);
                        element = parentUL.find('li:first');
                        item.parentElement = element;
                    }
                    else {
                        if (parentUL.children('li').eq(index).length == 0) {
                            parentUL.children('li').eq(index - 1).after(element);
                        }
                        else {
                            if (parentUL.children('li').eq(index)[0].id != element.id) {
                                parentUL.children('li').eq(index).before(element);
                            }
                        }
                    }
                }
            },

            _enableDragDrop: function () {
                if (this.allowDrag && this.host.jqxDragDrop) {
                    var elements = this.host.find('.draggable');
                    var me = this;

                    if (elements.length > 0) {
                        elements.jqxDragDrop({
                            cursor: 'arrow', revertDuration: 0, appendTo: 'body', dragZIndex: 99999, revert: true,
                            initFeedback: function (feedback) {
                                var title = $('<span style="white-space: nowrap;" class="' + me.toThemeProperty('jqx-fill-state-normal') + '">' + feedback.text() + '</span>');
                                $(document.body).append(title);
                                var width = title.width();
                                title.remove();
                                feedback.width(width + 5);
                                feedback.addClass(me.toThemeProperty('jqx-fill-state-pressed'));
                            }
                        });
                        var destroyed = elements.jqxDragDrop('isDestroyed');
                        if (destroyed === true) {
                            elements.jqxDragDrop('_createDragDrop');
                        }

                        this._autoScrollTimer = null;
                        me._dragItem = null;
                        me._handleDragStart(elements, me);
                        me._handleDragging(elements, me);
                        me._handleDragEnd(elements, me);
                    }
                }
            }
        });
    }
})(jqxBaseFramework);
