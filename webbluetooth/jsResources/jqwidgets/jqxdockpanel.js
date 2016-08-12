/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget("jqxDockPanel", "", {});

    $.extend($.jqx._jqxDockPanel.prototype, {

        defineInstance: function () {
            var settings = {
                //Type: String.
                //Default: null.
                //Sets the dockpanel width.
                width: null,
                //Type: String.
                //Default: null.
                //Sets the dockpanel height.
                height: null,
                //Type: Boolean.
                //Default: true.
                lastchildfill: true,
                // gets or sets whether the progress bar is disabled.
                disabled: false,
                //  events.
                events:
                [
                // occurs when the layout is performed.
                   'layout'
                ]
            };
            $.extend(true, this, settings);
            return settings;
        },

        // creates a new jqxDockPanel instance.
        createInstance: function (args) {
            var self = this;
            this.host
			.addClass(this.toThemeProperty("jqx-dockpanel"));
            this.host
            .addClass(this.toThemeProperty("jqx-rc-all"));

            this.childrenCount = $(this.host).children().length;
            this.host.wrapInner('<div style="overflow: hidden; width: 100%; height: 100%;" class="innerContainer"></div>');
            this.$wrapper = this.host.find('.innerContainer');
            this.$wrapper.css('position', 'relative');
            this.sizeCache = new Array();

            this.performLayout();
            $.jqx.utilities.resize(this.host, function () {
                self.refresh();
            });
        },

        // clears cache and performs layout.
        render: function () {
            if (this.width != null && this.width.toString().indexOf("px") != -1) {
                this.host.width(this.width);
            }
            else
                if (this.width != undefined && !isNaN(this.width)) {
                    this.host.width(this.width);
                };

            if (this.height != null && this.height.toString().indexOf("px") != -1) {
                this.host.height(this.height);
            }
            else if (this.height != undefined && !isNaN(this.height)) {
                this.host.height(this.height);
            };
            this.sizeCache = new Array();
            this.performLayout();
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.render();
        },

        performLayout: function () {
            if (this.disabled) return;
            var childrenCount = this.childrenCount;
            var num5 = 0;
            var num6 = 0;
            var x = 0;
            var y = 0;
            var me = this;
            var arrangeSize = { width: this.host.width(), height: this.host.height() };

            if (this.sizeCache.length < this.$wrapper.children().length) {
                $.each(this.$wrapper.children(), function (index) {
                    var element = $(this);
                    element.css('position', 'absolute');
                    var size = { width: element.css('width'), height: element.css('height') };
                    me.sizeCache[index] = size;
                });
            }

            $.each(this.$wrapper.children(), function (index) {
                var dock = this.getAttribute('dock');
                if (dock == undefined) dock = 'left';
                if (index == childrenCount - 1 && me.lastchildfill) dock = 'fill';
                var element = $(this);
                element.css('position', 'absolute');
                element.css('width', me.sizeCache[index].width);
                element.css('height', me.sizeCache[index].height);
                var desiredSize = { width: element.outerWidth(), height: element.outerHeight() };
                var finalRect = { x: x, y: y, width: Math.max(0, arrangeSize.width - (x + num5)), height: Math.max(0, arrangeSize.height - (y + num6)) };
                if (index < childrenCount) {
                    switch (dock) {
                        case 'left':
                            x += desiredSize.width;
                            finalRect.width = desiredSize.width;
                            break;
                        case 'top':
                            y += desiredSize.height;
                            finalRect.height = desiredSize.height;
                            break;
                        case 'right':
                            num5 += desiredSize.width;
                            finalRect.x = Math.max(0, (arrangeSize.width - num5));
                            finalRect.width = desiredSize.width;
                            break;
                        case 'bottom':
                            num6 += desiredSize.height;
                            finalRect.y = Math.max(0, (arrangeSize.height - num6));
                            finalRect.height = desiredSize.height;
                            break;
                    }
                }

                element.css('left', finalRect.x);
                element.css('top', finalRect.y);
                element.css('width', finalRect.width);
                element.css('height', finalRect.height);
            });

            this._raiseevent(0);
        },

        destroy: function () {
            $.jqx.utilities.resize(this.host, null, true); 
            this.host.remove();
        },

        _raiseevent: function (id, oldValue, newValue) {
            if (this.isInitialized != undefined && this.isInitialized == true) {
                var evt = this.events[id];
                var event = new $.Event(evt);
                event.previousValue = oldValue;
                event.currentValue = newValue;
                event.owner = this;
                var result = this.host.trigger(event);
                return result;
            }
        },

        propertyChangedHandler: function (object, key, oldValue, value) {
            if (!this.isInitialized)
                return;
            object.render();
        },

        refresh: function () {
            this.render();
        }
    });
})(jqxBaseFramework);
