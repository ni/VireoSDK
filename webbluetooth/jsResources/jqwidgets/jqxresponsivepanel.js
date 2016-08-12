/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxResponsivePanel', '', {});

    $.extend($.jqx._jqxResponsivePanel.prototype, {
        defineInstance: function () {
            var settings = {
                // properties
                width: null,
                height: null,
                collapseBreakpoint: 1000,
                collapseWidth: null,
                toggleButton: null,
                toggleButtonSize: 30,
                animationType: 'fade', // possible values: 'fade', 'slide', 'none'
                animationDirection: 'left', // only when 'animationType' is set to 'slide'; possible values: 'left', 'right', 'top', 'bottom'
                animationShowDelay: 'fast',
                animationHideDelay: 'fast',
                autoClose: true,
                initContent: null,

                // internal flag variables
                _collapsed: false,
                _opened: false,
                _init: false,
                _ie7: ($.jqx.browser.msie && $.jqx.browser.version < 8),

                // events
                events: ['collapse', 'expand', 'open', 'close']
            };
            $.extend(true, this, settings);
        },

        createInstance: function () {
            var that = this;
            if (that.initContent && that._init === false) {
                that.initContent();
                that._init = true;
            }
            that._render(true);
        },

        // renders the widget
        _render: function (initial) {
            var that = this;

            if (initial === true && that.toggleButton) {
                that._toggleButton = $(that.toggleButton);
                if (that._toggleButton.length === 0) {
                    throw new Error('jqxResponsivePanel: Invalid toggleButton selector: "' + that.toggleButton + '".');
                }
                var innerButton = $('<div class="' + that.toThemeProperty('jqx-menu-minimized-button') + ' ' + that.toThemeProperty('jqx-responsive-panel-button-inner') + '"></div>');
                that._toggleButton.append(innerButton);
            }

            that._setSize();
            that._addClasses();

            if (initial === false) {
                that._removeHandlers();
            }
            that._addHandlers();

            that._checkWindowSize();
        },

        // renders the widget
        render: function () {
            this._render(false);
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                this._checkWindowSize();
            }
        },

        // destroys the widget
        destroy: function (leaveButton) {
            var that = this;

            that._removeHandlers();
            that.host.remove();
            if (leaveButton !== true && that.toggleButton) {
                that._toggleButton.remove();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (value !== oldvalue && key !== 'toggleButton' && key !== 'initContent') {
                switch (key) {
                    case 'width':
                    case 'height':
                        object.host.css(key, value);
                        break;
                    case 'collapseBreakpoint':
                        object._checkWindowSize();
                        break;
                    case 'toggleButtonSize':
                        if (object.toggleButton) {
                            object._toggleButton.css({ width: value, height: value });
                        }
                        break;
                    default:
                        object.render();
                }
            }
        },

        // opens the panel (only when collapsed)
        open: function () {
            var that = this;

            if (that._collapsed === true && that._opened === false) {
                function animationNoneOpen() {
                    that.host.show();
                    that._opened = true;
                    that._raiseEvent('2'); // 'open' event
                    if (that.initContent && that._init === false) {
                        that.initContent();
                        that._init = true;
                    }
                }

                if (that._ie7 === true) {
                    animationNoneOpen();
                    return;
                }

                switch (that.animationType) {
                    case 'fade':
                        that.host.fadeIn(that.animationShowDelay, function () {
                            that._raiseEvent('2'); // 'open' event
                            that._opened = true;
                            if (that.initContent && that._init === false) {
                                that.initContent();
                                that._init = true;
                            }
                        });
                        break;
                    case 'slide':
                        var direction = that.animationDirection;
                        if (direction === 'top') {
                            direction = 'up';
                        } else if (direction === 'bottom') {
                            direction = 'down';
                        }
                        that._slide(that.host, { mode: 'show', direction: direction, duration: that.animationShowDelay });
                        break;
                    case 'none':
                        animationNoneOpen();
                        break;
                }
            }
        },

        // closes the panel (only when collapsed)
        close: function () {
            var that = this;

            if (that._collapsed === true && that._opened === true) {
                if (that._ie7 === true) {
                    that.host.hide();
                    that._opened = false;
                    that._raiseEvent('3'); // 'close' event
                    return;
                }

                switch (that.animationType) {
                    case 'fade':
                        that.host.fadeOut(that.animationHideDelay, function () {
                            that._opened = false;
                            that._raiseEvent('3'); // 'close' event
                        });
                        break;
                    case 'slide':
                        var direction = that.animationDirection;
                        if (direction === 'top') {
                            direction = 'up';
                        } else if (direction === 'bottom') {
                            direction = 'down';
                        }
                        that._slide(that.host, { mode: 'hide', direction: direction, duration: that.animationHideDelay });
                        break;
                    case 'none':
                        that.host.hide();
                        that._opened = false;
                        that._raiseEvent('3'); // 'close' event
                        break;
                }
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

            that.host.css('width', that.width);
            that.host.css('height', that.height);

            if (that.toggleButton) {
                that._toggleButton.css({ width: that.toggleButtonSize, height: that.toggleButtonSize });
            }
        },

        // adds the necessary classes to the widget
        _addClasses: function () {
            var that = this;

            that.host.addClass(that.toThemeProperty('jqx-responsive-panel'));
            that.host.addClass(that.toThemeProperty('jqx-widget'));
            that.host.addClass(that.toThemeProperty('jqx-widget-content'));
            that.host.addClass(that.toThemeProperty('jqx-rc-all'));

            // toggle button classes
            if (that.toggleButton) {
                that._toggleButton.addClass(that.toThemeProperty('jqx-responsive-panel-button'));
                that._toggleButton.addClass(that.toThemeProperty('jqx-fill-state-normal'));
                that._toggleButton.addClass(that.toThemeProperty('jqx-rc-all'));
            }
        },

        isCollapsed: function()
        {
            return this._collapsed;
        },

        isOpened: function () {
            return this._opened;
        },

        // adds event handlers
        _addHandlers: function () {
            var that = this,
                id = that.element.id;

            that.addHandler(that.host, 'click.jqxResponsivePanel' + id, function (event) {
                event.stopPropagation();
            });
            that.addHandler($(document), 'click.jqxResponsivePanel' + id, function () {
                if (that._collapsed === true && that.autoClose === true) {
                    that.close();
                }
            });
            that.addHandler($(window), 'resize.jqxResponsivePanel' + id, function () {
                setTimeout(function () {
                    that._checkWindowSize();
                }, 0);
            });

            // toggle button
            if (that.toggleButton) {
                that.addHandler(that._toggleButton, 'mouseenter.jqxResponsivePanel' + id, function () {
                    that._toggleButton.addClass(that.toThemeProperty('jqx-fill-state-hover'));
                });
                that.addHandler(that._toggleButton, 'mouseleave.jqxResponsivePanel' + id, function () {
                    that._toggleButton.removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                });
                that.addHandler(that._toggleButton, 'mousedown.jqxResponsivePanel' + id, function () {
                    that._toggleButton.addClass(that.toThemeProperty('jqx-fill-state-pressed'));
                });
                that.addHandler($(document), 'mouseup.jqxResponsivePanel' + id, function () {
                    that._toggleButton.removeClass(that.toThemeProperty('jqx-fill-state-pressed'));
                });
                that.addHandler(that._toggleButton, 'click.jqxResponsivePanel' + id, function (event) {
                    event.stopPropagation();
                    if (that._opened === true) {
                        that.close();
                    } else {
                        that.open();
                    }
                });
            }
        },

        // removes event handlers
        _removeHandlers: function () {
            var that = this,
                id = that.element.id;

            that.removeHandler(that.host, 'click.jqxResponsivePanel' + id);
            that.removeHandler($(document), 'click.jqxResponsivePanel' + id);
            that.removeHandler($(window), 'resize.jqxResponsivePanel' + id);

            if (that.toggleButton) {
                that.removeHandler(that._toggleButton, 'mouseenter.jqxResponsivePanel' + id);
                that.removeHandler(that._toggleButton, 'mouseleave.jqxResponsivePanel' + id);
                that.removeHandler(that._toggleButton, 'mousedown.jqxResponsivePanel' + id);
                that.removeHandler($(document), 'mouseup.jqxResponsivePanel' + id);
                that.removeHandler(that._toggleButton, 'click.jqxResponsivePanel' + id);
            }
        },

        // collapses or expands the widget depending on the browser window's width
        _checkWindowSize: function () {
            var that = this;

            var windowWidth = this.host.parent().width();

            if (that._collapsed === false && windowWidth <= that.collapseBreakpoint) {
                if (that.toggleButton) {
                    that._toggleButton.show();
                }
                if (that._opened === false) {
                    that.host.hide();
                }
                that.host.removeClass(that.toThemeProperty('jqx-responsive-panel-expanded'));
                that.host.addClass(that.toThemeProperty('jqx-responsive-panel-collapsed'));
                that._collapsed = true;
                that._raiseEvent('0'); // 'collapse' event
                if (that.collapseWidth)
                {
                    that.host.width(that.collapseWidth);
                }
                that.host.trigger('resize');
            } else if (that._collapsed === true && windowWidth > that.collapseBreakpoint) {
                if (that.collapseWidth)
                {
                    that.host.width(that.width);
                }
                if (that.toggleButton) {
                    that._toggleButton.hide();
                }
                if (that._opened === false) {
                    that.host.show();
                }
                that.host.removeClass(that.toThemeProperty('jqx-responsive-panel-collapsed'));
                that.host.addClass(that.toThemeProperty('jqx-responsive-panel-expanded'));
                that._collapsed = false;
                that._raiseEvent('1'); // 'expand' event
                if (that.initContent && that._init === false) {
                    that.initContent();
                    that._init = true;
                }
                that.host.trigger('resize');
            }
        },

        // slides the widget
        _slide: function (el, o) {
            var that = this;
            if (!that.activeAnimations) {
                that.activeAnimations = [];
            }
            if (that.activeAnimations.length > 0) {
                for (var i = 0; i < that.activeAnimations.length; i++) {
                    that.activeAnimations[i].clearQueue();
                    that.activeAnimations[i].finish();
                }
            }
            else {
                el.clearQueue();
                el.finish();
            }

            var dataSpace = 'ui-effects-';

            // effects functions
            var effects = {
                save: function (element, set) {
                    for (var i = 0; i < set.length; i++) {
                        if (set[i] !== null && element.length > 0) {
                            element.data(dataSpace + set[i], element[0].style[set[i]]);
                        }
                    }
                },

                restore: function (element, set) {
                    var val, i;
                    for (i = 0; i < set.length; i++) {
                        if (set[i] !== null) {
                            val = element.data(dataSpace + set[i]);
                            if (val === undefined) {
                                val = '';
                            }
                            element.css(set[i], val);
                        }
                    }
                },

                createWrapper: function (element) {

                    if (element.parent().is('.ui-effects-wrapper')) {
                        return element.parent();
                    }

                    var props = {
                        width: element.outerWidth(true),
                        height: element.outerHeight(true),
                        'float': element.css('float')
                    },
                        wrapper = $('<div></div>')
                        .addClass('ui-effects-wrapper')
                        .css({
                            fontSize: '100%',
                            background: 'transparent',
                            border: 'none',
                            margin: 0,
                            padding: 0
                        }),
                        size = {
                            width: element.width(),
                            height: element.height()
                        },
                        active = document.activeElement;

                    try {
                        active.id;
                    } catch (e) {
                        active = document.body;
                    }

                    element.wrap(wrapper);

                    if (element[0] === active || $.contains(element[0], active)) {
                        $(active).focus();
                    }

                    wrapper = element.parent();

                    if (element.css('position') === 'static') {
                        wrapper.css({
                            position: 'relative'
                        });
                        element.css({
                            position: 'relative'
                        });
                    } else {
                        $.extend(props, {
                            position: element.css('position'),
                            zIndex: element.css('z-index')
                        });
                        $.each(['top', 'left', 'bottom', 'right'], function (i, pos) {
                            props[pos] = element.css(pos);
                            if (isNaN(parseInt(props[pos], 10))) {
                                props[pos] = 'auto';
                            }
                        });
                        element.css({
                            position: 'relative',
                            top: 0,
                            left: 0,
                            right: 'auto',
                            bottom: 'auto'
                        });
                    }
                    element.css(size);

                    return wrapper.css(props).show();
                },

                removeWrapper: function (element) {
                    var active = document.activeElement;

                    if (element.parent().is('.ui-effects-wrapper')) {
                        element.parent().replaceWith(element);

                        if (element[0] === active || $.contains(element[0], active)) {
                            $(active).focus();
                        }
                    }

                    return element;
                }
            };

            var props = ['position', 'top', 'bottom', 'left', 'right', 'width', 'height'],
                mode = o.mode,
                show = mode === 'show',
                direction = o.direction || 'left',
                ref = (direction === 'up' || direction === 'down') ? 'top' : 'left',
                positiveMotion = (direction === 'up' || direction === 'left'),
                distance,
                animation = {};

            effects.save(el, props);
            el.show();
            distance = o.distance || el[ref === 'top' ? 'outerHeight' : 'outerWidth'](true);

            effects.createWrapper(el).css({
                overflow: 'hidden'
            });

            if (show) {
                el.css(ref, positiveMotion ? (isNaN(distance) ? '-' + distance : -distance) : distance);
            }

            animation[ref] = (show ?
                    (positiveMotion ? '+=' : '-=') :
                    (positiveMotion ? '-=' : '+=')) +
                distance;


            var restore = function () {
                el.clearQueue();
                el.stop(true, true);
            };

            that.activeAnimations.push(el);
            el.animate(animation, {
                duration: o.duration,
                easing: o.easing,
                complete: function () {
                    that.activeAnimations.pop(el);
                    if (mode === 'show') {
                        that._opened = true;
                        that._raiseEvent('2'); // 'open' event
                        if (that.initContent && that._init === false) {
                            that.initContent();
                            that._init = true;
                        }
                    } else if (mode === 'hide') {
                        el.hide();
                        that._opened = false;
                        that._raiseEvent('3'); // 'close' event
                    }
                    effects.restore(el, props);
                    effects.removeWrapper(el);
                }
            });
            return restore;
        }
    });
})(jqxBaseFramework);
