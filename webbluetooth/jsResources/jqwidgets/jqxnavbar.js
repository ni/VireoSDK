/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget("jqxNavBar", "", {});

    $.extend($.jqx._jqxNavBar.prototype, {

        defineInstance: function () {
            var settings = {
                height: 'auto',
                minimizedHeight: 30,
                popupAnimationDelay: 250,
                minimizeButtonPosition: 'left',
                width: '100%',
                selectedItem: 0,
                selection: true,
                disabled: false,
                rtl: false,
                minimized: false,
                columns: null,
                minimizedTitle: "",
                orientation: 'horizontal',
                // events
                events: ["change"]
            };
            $.extend(true, this, settings);
        },

        createInstance: function (args) {
            this.render();
        },

        // methods

        // public methods 
        // renders the widget
        render: function () {
            var that = this;
            if (that.ul && that.ul.parent()[0] !== that.element) {
                that.ul.detach();
                that.host.children().remove();
                that.host.append(that.ul);
                if (that.popup) that.popup.remove();
                that.host.height(null);
                that.host.removeClass(that.toThemeProperty('jqx-widget-header'));
                that.host.removeClass(that.toThemeProperty('jqx-navbar-minimized'));
            }

            that.ul = that.host.children();
            that._items = that.ul.children();
            $.each(that._items, function () {
                $(this).removeClass();
            });
            if (this.width !== null && (this.width.toString().indexOf('%') >= 0 || this.width.toString().indexOf('px') >= 0)) {
                this.element.style.width = this.width;
            }
            else {
                this.element.style.width = this.width + "px";
            }
          
            that._layoutItems();
            that._addClasses();
            that._addHandlers();
            that._handleMinimize();

            $.jqx.utilities.resize(this.host, function () {
                that._resizePopup();
            });
        },

        _layoutItems: function()
        {
            var that = this;
            var rows = 1;
            var itemsPerColumn = 0;
            var autoHeight = this.height === null || this.height === 'auto';
            if (that.orientation === 'horizontal') {
                if (that._items.length > 5) {
                    var pWidth = 50 + "%";
                    that._items.css('width', pWidth);
                    var height = that.height;
                    rows = Math.ceil(that._items.length / 2);
                    if (!autoHeight) {
                        var _itemsHeight;
                        var percentageHeight = false;
                        if (height.toString().indexOf('%') >= 0) {
                            _itemsHeight = parseInt(height) / rows;
                            _itemsHeight += '%';
                            percentageHeight = true;
                        }
                        else {
                            _itemsHeight = parseInt(height) / rows;
                        }
                        itemsPerColumn = 2;
                        if (percentageHeight) {
                            that._items.css('height', _itemsHeight);
                            that._items.css("line-height", that._items.height() + 'px');
                        }
                        else {
                            that._items.height(_itemsHeight);
                            that._items.css("line-height", _itemsHeight + 'px');
                        }
                    }
                }
                else {
                    var pWidth = that.host.width / 2;
                    var num = that._items.length;
                    var pWidth = 100 / num + "%";
                    that._items.css('width', pWidth);
                    if (!autoHeight) {
                        if (that.height.toString().indexOf('%') >= 0) {
                            that._items.css('height', _itemsHeight);
                            that._items.css("line-height", that.height);
                        }
                        else {
                            that._items.height(that.height);
                            that._items.css("line-height", parseInt(that.height) + 'px');
                        }
                    }
                    itemsPerColumn = num;
                }
                if (that.columns) {
                    var height = that.height;
                    var currentColumn = 0;
                    for (var i = 0; i < that._items.length; i++) {
                        var item = that._items[i];
                        $(item).css('width', that.columns[currentColumn]);
                        currentColumn++;
                        if (currentColumn >= that.columns.length) {
                            currentColumn = 0;
                            if (that.columns.length !== that._items.length) {
                                rows++;
                            }
                        }
                    }
                    var percentageHeight = false;
                    var _itemsHeight;
                    if (height.toString().indexOf('%') >= 0) {
                        _itemsHeight = parseInt(height) / rows;
                        _itemsHeight += '%';
                        percentageHeight = true;
                    }
                    else {
                        _itemsHeight = parseInt(height) / rows;
                    }
                    if (!autoHeight) {
                        if (percentageHeight) {
                            that._items.css('height', _itemsHeight);
                            that._items.css("line-height", that._items.height() + 'px');
                        }
                        else {
                            that._items.height(_itemsHeight);
                            that._items.css("line-height", _itemsHeight + 'px');
                        }
                    }
                    itemsPerColumn = that.columns.length;
                }
            }
            else {
                var height = that.height;
                var currentColumn = 0;
                for (var i = 0; i < that._items.length; i++) {
                    var item = that._items[i];
                    $(item).css('width', '100%');
                }
                rows = that._items.length;
                if (!autoHeight) {
                    var percentageHeight = false;
                    var _itemsHeight;
                    if (height.toString().indexOf('%') >= 0) {
                        _itemsHeight = parseInt(height) / rows;
                        _itemsHeight += '%';
                        percentageHeight = true;
                    }
                    else {
                        _itemsHeight = parseInt(height) / rows;
                    }
                    if (percentageHeight) {
                        that._items.css('height', _itemsHeight);
                        that._items.css("line-height", that._items.height() + 'px');
                    }
                    else {
                        that._items.height(_itemsHeight);
                        that._items.css("line-height", _itemsHeight + 'px');
                    }
                }
                itemsPerColumn = 1;
            }
            if (that.selection) {
                var itemIndex = 0;
                var rowsCount = that._items.length / itemsPerColumn;
                var addBottomBorder = false;
                if (rowsCount < rows) {
                    addBottomBorder = true;
                }
                for (var i = 0; i < rows; i++) {
                    for (var j = 0; j < itemsPerColumn; j++) {
                        if (j < itemsPerColumn - 1) {
                            var rtl = that.rtl ? "left" : "right";
                            $(that._items[itemIndex]).css('border-' + rtl + '-width', '1px');
                            $(that._items[itemIndex]).css('border-' + rtl + '-style', 'solid');
                        }
                        if (rows > 1 && i > 0) {
                            $(that._items[itemIndex]).css('border-top-width', '1px');
                            $(that._items[itemIndex]).css('border-top-style', 'solid');
                        }
                        if (addBottomBorder && i === rows - 2 && j === itemsPerColumn - 1) {
                            $(that._items[itemIndex]).css('border-bottom-width', '1px');
                            $(that._items[itemIndex]).css('border-bottom-style', 'solid');
                        }
                        itemIndex++;
                    }
                }
            }
            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                that._items.css('padding-left', '0px');
                that._items.css('padding-right', '0px');
                $.each(that._items, function () {
                    $(this).css('border-left-width', '0px');
                    $(this).css('border-right-width', '0px');
                    $(this).css('position', 'relative');
                    $(this).css('margin-left', '-1px');
                });
                that.host.css('border', 'none');
            }
        },

        _handlePopupHeight: function()
        {
            var that = this;
            if (!that.minimized)
                return;

            var popupHeight;
            var percentageHeight = false;
            if (that.height.toString().indexOf('%') >= 0) {
                that.host.css('height', that.height);
                popupHeight = that.host.height() - that.minimizedHeight - 1;
                percentageHeight = true;
            }
            if (percentageHeight) {
                that.popup.height(popupHeight);
                that.ul.height(popupHeight);
                that.host.height(that.minimizedHeight);
                that._layoutItems();
            }
        },

        _handleMinimize: function()
        {
            var that = this;
            if (that.minimized) {
                var menu = that.host;
                menu.height(that.minimizedHeight);
                menu.css('box-sizing', 'border-box');
                menu.addClass(that.toThemeProperty('jqx-widget-header'));
                menu.addClass(that.toThemeProperty('jqx-navbar-minimized'));
                var button = $('<div style="cursor: pointer; height: 100%; margin:0px; margin-left: 5px; margin-right:5px;"></div>')
                menu.append(button);
                button.css('float', that.minimizeButtonPosition);
                var title = $('<div style="height: 100%; margin:0px; margin-left: 5px; margin-right:5px;"></div>')
                title.append(that.minimizedTitle);
                title.css('float', that.minimizeButtonPosition === "left" ? "right" : "left");
                if (that.minimizedHeight !== "auto") {
                    if (that.minimizedHeight.toString().indexOf('%') >= 0) {
                        title.css('line-height', that.minimizedHeight);
                    }
                    else {
                        title.css('line-height', parseInt(that.minimizedHeight) + "px");
                    }
                }
                menu.append(title);
                button.addClass(that.toThemeProperty('jqx-menu-minimized-button'));
                menu.removeClass(that.toThemeProperty('jqx-widget-content'));
                that.ul.detach();
                var popup = $("<div style='box-sizing: border-box; z-index: 999999; display: none; position: absolute;'></div>");
                popup.addClass(that.toThemeProperty('jqx-widget jqx-widget-content jqx-popup jqx-navbar jqx-navbar-popup'));
                popup.append(that.ul);
                that.popup = popup;
                $(document.body).append(popup);
                that.opened = false;
                button.click(function () {
                    if (!that.opened) {
                        that.open();
                    }
                    else {
                        that.close();
                    }
                });
                that.button = button;
            }
        },

        close: function()
        {
            var that = this;
            that.popup.fadeOut(that.popupAnimationDelay);
            that.opened = false;
        },

        open: function()
        {
            var that = this;
            that.popup.fadeIn(that.popupAnimationDelay);
            that.popup.css('top', parseInt(that.host.coord().top) + that.host.outerHeight() - 1);
            that.popup.width(that.host.width());
            var left = that.host.coord().left;
            that.popup.css('left', left);
            if (left.toString().indexOf('.5') >= 0) {
                that.popup.width(that.host.width() - 0.5);
            }
            that._handlePopupHeight();
            that.opened = true;
        },

        _resizePopup: function () {
            var that = this;
            if (that.minimized && that.popup) {
                that.popup.width(that.host.width());
                var left = that.host.coord().left;
                that.popup.css('left', left);
                if (left.toString().indexOf('.5') >= 0) {
                    that.popup.width(that.host.width() - 0.5);
                }

                that.popup.css('top', parseInt(that.host.coord().top) + that.host.outerHeight() - 1);
                that._handlePopupHeight();
            }
        },

        // selects an item
        selectAt: function (index) {
            var that = this;
            if (!that.selection)
                return;

            $(that._items[that.selectedItem]).removeClass(that.toThemeProperty('jqx-fill-state-pressed'));
            $(that._items[index]).addClass(that.toThemeProperty('jqx-fill-state-pressed'));
            var oldValue = that.selectedItem;
            that.selectedItem = index;
            that._raiseEvent("0", { 'selectedItem': index, 'oldSelectedItem': oldValue });
        },

        //gets the index of the selected item
        getSelectedIndex: function () {
            return this.selectedItem;
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
            object.render();
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

        // removes event handlers
        _removeHandlers: function () {
            var that = this;
            that.removeHandler(that._items, "click.navbar" + that.element.id);
            that.removeHandler(that._items, "mouseenter.navbar" + that.element.id);
            that.removeHandler(that._items, "mouseleave.navbar" + that.element.id);
        },

        _addClasses: function () {
            var that = this;
            that.host.addClass(that.toThemeProperty('jqx-navbar'));
            if (that.disabled) {
                that.host.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }
            that._items.addClass(that.toThemeProperty('jqx-navbar-block'));
            if (that.selection) {
                that.host.addClass(that.toThemeProperty('jqx-widget'));
                that.host.addClass(that.toThemeProperty('jqx-widget-content'));
                that.host.addClass(that.toThemeProperty('jqx-fill-state-normal'));
                that._items.addClass(that.toThemeProperty('jqx-fill-state-normal'));
                that._items.addClass(that.toThemeProperty('jqx-button'));
                if (that.selectedItem !== -1) {
                    $(that._items[that.selectedItem]).addClass(that.toThemeProperty('jqx-fill-state-pressed'));
                }
            }
            else this.host.css('border', 'none');
            if (that.rtl) {
                that._items.addClass(that.toThemeProperty('jqx-navbar-block-rtl'));
            }
        },

        _addHandlers: function () {
            var that = this;
            that.addHandler(that._items, "click.navbar" + that.element.id, function (event) {
                if (!that.disabled && that.selection) {
                    var index = $(that._items).index(this);
                    that.selectAt(index);
                }
            });
            that.addHandler(that._items, "mouseenter.navbar" + that.element.id, function (event) {
                if (!that.disabled && that.selection) {
                    $(event.target).addClass(that.toThemeProperty('jqx-fill-state-hover'));
                }
            });
            that.addHandler(that._items, "mouseleave.navbar" + that.element.id, function (event) {
                if (!that.disabled && that.selection) {
                    $(event.target).removeClass(that.toThemeProperty('jqx-fill-state-hover'));
                }
            });
        }
    });
})(jqxBaseFramework); 