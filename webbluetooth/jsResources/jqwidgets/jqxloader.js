/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.jqx.jqxWidget('jqxLoader', '', {});
    $.extend($.jqx._jqxLoader.prototype, {
        defineInstance: function () {
            var settings = {
                //properties
                width: 200,
                height: 150,
                text: 'Loading...',
                html: null,
                textPosition: 'bottom', // possible values:  'left', 'top', 'bottom' , 'right'   
                imagePosition: 'center',
                isModal: false,
                autoOpen: false,
                rtl: false,
                //events
                events: ['create']
            };
            $.extend(true, this, settings);
        },

        createInstance: function (args) {
            var that = this;
            that._render(true);
            that._raiseEvent('0');
        },

        // methods
        // public methods 
        // renders the widget
        render: function () {
            this._render();
        },

        open: function (left, top) {
            var that = this;
            if (this.width !== null && this.width.toString().indexOf('%') !== -1) {
                that.host.css('width', this.width);
            }

            if (this.height !== null && this.height.toString().indexOf('%') !== -1) {
                that.host.css('height', this.height);
            }

            that.host.show();
            that.host.css('left', -that.host.width() / 2);
            that.host.css('top', -that.host.height() / 2);
            if (left && top) {
                that.host.css('left', left);
                that.host.css('top', top);
            }
            if (that.isModal) {
                that._modal.show();
            }
        },

        close: function () {
            var that = this;

            that.host.hide();
            if (that.isModal) {
                that._modal.hide();
            }
        },

        _checkBrowser: function () {
            var that = this;
            if ($.jqx.browser.browser === 'msie') {
                if ($.jqx.browser.version === '7.0') {
                    if (that.isModal === false) {
                        that.host.addClass(that.toThemeProperty('jqx-loader-ie-transparency'));
                    }
                    that.host.css('top', Math.max(0, (($(window).height() - $(that.host).outerHeight()) / 2) + $(window).scrollTop()) + 'px');
                    that.host.css('left', Math.max(0, (($(window).width() - $(that.host).outerWidth()) / 2) + $(window).scrollLeft()) + 'px');
                    $(window).resize(function () {
                        that.host.css('top', Math.max(0, (($(window).height() - $(that.host).outerHeight()) / 2) + $(window).scrollTop()) + 'px');
                        that.host.css('left', Math.max(0, (($(window).width() - $(that.host).outerWidth()) / 2) + $(window).scrollLeft()) + 'px');
                    });

                    this.host.css({ 'margin-top': '0', 'margin-left': '0' });
                }
                else if ($.jqx.browser.version === '8.0') {
                    if (that.isModal === false) {
                        that.host.addClass(that.toThemeProperty('jqx-loader-ie-transparency'));
                    }
                }
            }
        },

        _textPos: function () {
            var that = this;
            this._text = that.host.children('div:eq(1)');
            if (this._image) {
                this._image.css('background-position-y', that.imagePosition);
            }

            if (that.textPosition === 'top') {
                this._text.addClass(that.toThemeProperty('jqx-loader-text-top'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-bottom'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-left'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-right'));
            }

            else if (that.textPosition === 'bottom') {
                this._text.addClass(that.toThemeProperty('jqx-loader-text-bottom'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-top'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-left'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-right'));
            }

            else if (that.textPosition === 'left') {
                this._text.addClass(that.toThemeProperty('jqx-loader-text-left'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-right'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-top'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-bottom'));
            }

            else if (that.textPosition === 'right') {
                this._text.addClass(that.toThemeProperty('jqx-loader-text-right'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-left'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-top'));
                this._text.removeClass(that.toThemeProperty('jqx-loader-text-bottom'));
            }
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                this._render(false);
            };
        },

        // destroys the widget
        destroy: function () {
            var that = this;
            that._removeHandlers();
            that.host.remove();
        },

        // private methods
        // called when a property is changed
        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (value !== oldvalue) {
                switch (key) {
                    case 'width':
                        object.host.width(value);
                        break;
                    case 'height':
                        object.host.height(value);
                        break;
                    case 'text':
                        object._text.text(value);
                        break;
                    case 'html':
                        object.host.html(value);
                        break;
                    case 'textPosition':
                        object._textPos(value);
                        break;
                    case 'rtl':
                        if (value === true) {
                            object._text.addClass(object.toThemeProperty('jqx-loader-rtl'));
                        } else {
                            object._text.removeClass(object.toThemeProperty('jqx-loader-rtl'));
                        }
                        break;
                }
            }
        },

        // raises an event
        _raiseEvent: function (id, args) {
            var that = this;
            var evt = that.events[id];
            var event = new $.Event(evt);
            event.owner = that;
            event.args = args;
            try {
                var result = that.host.trigger(event);
            }
            catch (error) {
            }
            return result;
        },

        _render: function (initialization) {
            var that = this;
            that.host.width(that.width);
            that.host.height(that.height);

            if (that.autoOpen === false) {
                that.host.hide();
            }

            if (initialization) {
                if (that.html === null) {
                    that.host.append('<div class="' + that.toThemeProperty('jqx-loader-icon') + '"></div>' + '<div class="' + that.toThemeProperty('jqx-loader-text') + '">' + that.text + '</div>');
                    that._image = that.host.children('div:eq(0)');
                    that._text = that.host.children('div:eq(1)');
                } else {
                    that.host.html(this.html);
                }

                if (that.isModal === true) {
                    var display = that.host.css('display');
                    that._modal = $('<div id="' + that.element.id + 'Modal" class="' + that.toThemeProperty('jqx-loader-modal') + '" style="display: ' + display + ';"></div>');
                    $('body').append(that._modal);
                }
            }

            that._checkBrowser();
            that._textPos();
            that._addClass();
            that._removeHandlers();
            that._addHandlers();
        },

        // adds event handlers 
        _addHandlers: function () {
            var that = this;
            if (that.isModal === true) {
                that.addHandler($(document), 'keyup.loader' + that.element.id, function (event) {
                    if (event.keyCode === 27) {
                        that.close();
                    }
                });
            }
        },

        // removes event handlers 
        _removeHandlers: function () {
            var that = this;
            that.removeHandler($(document), 'keyup.loader' + that.element.id);
        },

        _addClass: function () {
            var that = this;
            that.host.addClass(that.toThemeProperty('jqx-widget'));
            that.host.addClass(that.toThemeProperty('jqx-loader'));
            that.host.addClass(that.toThemeProperty('jqx-rc-all'));
            that.host.addClass(that.toThemeProperty('jqx-fill-state-normal'));
            if (that.rtl) {
                that._text.addClass(that.toThemeProperty('jqx-loader-rtl'));
            }
            if ($.jqx.browser.msie) {
                that.host.addClass(this.toThemeProperty('jqx-noshadow'));
            }
            that.host.addClass(this.toThemeProperty('jqx-rc-t'));
            that.host.addClass(this.toThemeProperty('jqx-rc-b'));
            that.host.addClass(this.toThemeProperty('jqx-popup'));
        }
    });
})(jqxBaseFramework);