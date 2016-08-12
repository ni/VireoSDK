/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget("jqxNotification", "", {});

    $.extend($.jqx._jqxNotification.prototype, {

        defineInstance: function () {
            var settings = {
                //// properties
                width: "auto",
                height: "auto",
                appendContainer: null, // possible values: null or the id of a div element
                position: "top-right", // possible values: "top-left", "top-right", "bottom-left", "bottom-right"; disregarded if appendContainer is set
                zIndex: 99999,
                browserBoundsOffset: 5,
                notificationOffset: 5,
                opacity: 0.9,
                hoverOpacity: 1,
                autoOpen: false, // possible values: true, false
                animationOpenDelay: 400,
                animationCloseDelay: 800,
                closeOnClick: true, // possible values: true, false
                autoClose: true, // possible values: true, false
                autoCloseDelay: 3000,
                showCloseButton: true, // possible values: true, false
                template: "info", // possible values: "info", "warning", "success", "error", "mail", "time", null
                icon: null, // an object with the following fields: width, height, url, padding; disregarded if template is set
                blink: false, // possible values: true, false
                disabled: false, // possible values: true, false
                rtl: false, // possible values: true, false

                //// events
                events: ["open", "close", "click"]
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            var me = this;

            // renders the widget
            me.render();

            if (me.autoOpen == true) {
                me.open();
            }
        },

        //// methods

        // public methods

        // renders the widget
        render: function () {
            var me = this;

            if (me.host.hasClass("jqx-notification") == false) {
                me.host.addClass(me.toThemeProperty("jqx-rc-all"));
                me.host.addClass(me.toThemeProperty("jqx-notification"));
                me.host.css({ "zIndex": me.zIndex, "display": "none", "opacity": me.opacity });

                // appends the notification container if it has not been appended
                me._container = me._notificationContainer();

                // appends the template's icon and close button and positions its content
                me._appendContent();

                // sets the functions on mouseenter and mouseleave depending on the browser
                me._setHoverFunctions();

                // an array which stores all current instances of the notification
                me._instances = new Array();
                me._instanceKey = 0;

                // updates the count of jqxNotification instances
                var notifications = $.data(document.body, "jqxNotifications");
                if (notifications == undefined) {
                    notifications = 0;
                }
                $.data(document.body, "jqxNotifications", (notifications + 1));
            } else {
                me.refresh();
            }
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (!initialRefresh) {
                this._appendContent(true);
            };
        },

        // opens a notification instance
        open: function () {
            var me = this;

            if (me.disabled == false) {
                var newInstance = me.host.clone();
                newInstance.removeAttr("id");
              //  newInstance.find('*').removeAttr('id');

                newInstance.width(me.width);
                newInstance.height(me.height);
                if (this.width != null && this.width.toString().indexOf("%") != -1) {
                    newInstance.css('width', this.width);
                }

                if (this.height != null && this.height.toString().indexOf("%") != -1) {
                    newInstance.css('height', this.height);
                }

                if (!me.appendContainer && (me.position == "bottom-left" || me.position == "bottom-right")) {
                    newInstance.css("margin-top", me.notificationOffset);
                    me._container.prepend(newInstance);
                } else {
                    newInstance.css("margin-bottom", me.notificationOffset);
                    me._container.append(newInstance);
                }

                // adds event handlers
                me._addHandlers(newInstance);

                newInstance.fadeIn(me.animationOpenDelay, function () {
                    me._raiseEvent("0", { element: newInstance }); // open event
                });

                // blink effect
                if (me.blink == true) {
                    newInstance._blinkInterval = setInterval(function () {
                        newInstance.fadeTo(400, me.opacity / 1.5, function () {
                            newInstance.fadeTo(400, me.opacity);
                        });
                    }, 850);
                }

                // auto close
                if (me.autoClose == true) {
                    newInstance._autoCloseTimeout = setTimeout(function () {
                        me._close(newInstance);
                    }, me.autoCloseDelay);
                }

                newInstance._key = me._instanceKey;
                me._instances[me._instanceKey] = newInstance;
                me._instanceKey++;
            }
        },

        // closes (removes) all notification instances
        closeAll: function () {
            var me = this;

            for (var i = 0; i < me._instances.length; i++) {
                if (me._instances[i]) {
                    me._close(me._instances[i]);
                }
            }
        },

        // closes (removes) the last notification instance
        closeLast: function () {
            var me = this;

            for (var i = me._instances.length; i >= 0; i--) {
                if (me._instances[i]) {
                    me._close(me._instances[i]);
                    break;
                }
            }
        },

        // destroys the widget
        destroy: function () {
            var me = this;

            me.closeAll();
            me.host.remove();
            var notifications = $.data(document.body, "jqxNotifications");
            $.data(document.body, "jqxNotifications", (notifications - 1));
            me._destroyContainers(notifications - 1);
        },

        // private methods

        // called when a property is changed; changes do not affect old notification instances
        propertyChangedHandler: function (object, key, oldvalue, value) {
            var me = this;

            if (value != oldvalue) {
                switch (key) {
                    case "width":
                    case "height":
                        var oldValuePercentage = oldvalue.indexOf && oldvalue.indexOf("%") != -1;
                        oldValuePercentage == undefined ? oldValuePercentage = false : oldValuePercentage = oldValuePercentage;
                        var newValuePercentage = value.indexOf && value.indexOf("%") != -1;
                        newValuePercentage == undefined ? newValuePercentage = false : newValuePercentage = newValuePercentage;

                        if (newValuePercentage != oldValuePercentage) {
                            me[key] = oldvalue;
                        }
                        break;
                    case "appendContainer":
                    case "position":
                        me._container = me._notificationContainer();
                        break;
                    case "browserBoundsOffset":
                        if (!me.appendContainer) {
                            me._position(me._container);
                        }
                        break;
                    case "opacity":
                        me.host.css("opacity", value);
                        break;
                    case "showCloseButton":
                    case "template":
                    case "icon":
                    case "rtl":
                        me._appendContent(true);
                        break;
                }
            }
        },

        // raises an event
        _raiseEvent: function (id, args) {
            var me = this;

            var evt = me.events[id];
            var event = new $.Event(evt);
            event.owner = me;
            event.args = args;

            try {
                var result = me.host.trigger(event);
            }
            catch (error) {
            }

            return result;
        },

        // closes (removes) a notification instance
        _close: function (instance) {
            var me = this;

            if (me._instances[instance._key]) {
                me._instances[instance._key] = false; // removes the instance from the instances array
                clearInterval(instance._blinkInterval);
                clearTimeout(instance._autoCloseTimeout);
                instance.fadeOut(me.animationCloseDelay, function () {
                    me._removeHandlers(instance);
                    instance.remove();
                    me._raiseEvent("1"); // close event
                });
            }
        },

        // adds event handlers to a notification instance
        _addHandlers: function (instance) {
            var me = this;

            me.addHandler(instance, "click.notification" + me.element.id, function (event) {
                me._raiseEvent("2"); // click event
                if (me.closeOnClick == true) {
                    me._close(instance);
                }
            });

            me.addHandler(instance, "mouseenter.notification" + me.element.id, function (event) {
                if (!instance._blinkInterval) {
                    me.mouseenterFunction(instance);
                }
            });

            me.addHandler(instance, "mouseleave.notification" + me.element.id, function (event) {
                if (!instance._blinkInterval && instance.css("display") != "none") {
                    me.mouseleaveFunction(instance);
                }
            });

            if (me.showCloseButton == true) {
                var closeButton = instance.find(".jqx-notification-close-button");
                me.addHandler(closeButton, "click.notification" + me.element.id, function (event) {
                    event.stopPropagation();
                    me._close(instance);
                });
            }
        },

        // removes the event handlers of a notification instance
        _removeHandlers: function (instance) {
            var me = this;

            me.removeHandler(instance, "click.notification" + me.element.id);
            me.removeHandler(instance, "click.mouseenter" + me.element.id);
            me.removeHandler(instance, "click.mouseleave" + me.element.id);

            var closebutton = instance.find(".jqx-notification-close-button");
            if (closebutton.length > 0) {
                me.removeHandler(closebutton, "click.notification" + me.element.id);
            }
        },

        // appends the template's icon and close button and positions its content
        _appendContent: function (update) {
            var me = this;

            var children;
            var hostHTML = me.host.html();
            if (!update) {
                children = me.host.children().detach();
            }

            if (update) {
                me.host.removeAttr("class");
                me.host.addClass(me.toThemeProperty("jqx-rc-all"));
                me.host.addClass(me.toThemeProperty("jqx-notification"));
            }

            var table = $("<table class='" + me.toThemeProperty("jqx-notification-table") + "'></table>");
            var tableRow = $("<tr></tr>");
            table.append(tableRow);

            // rtl support
            var rtlClass = me.rtl ? "jqx-notification-content-rtl" : "";
            if (!update) {
                var content = $("<td class='" + me.toThemeProperty("jqx-notification-content") + " " + rtlClass + "'>" + "</td>");
            } else {
                var content = me.host.find(".jqx-notification-content");
                hostHTML = content.html();
                children = content.detach();
                if (me.rtl) {
                    content.addClass("jqx-notification-content-rtl");
                } else {
                    content.removeClass("jqx-notification-content-rtl");
                }
            }

            tableRow.html(content);

            // appends the icon
            var appendIcon = function () {
                if (me.rtl == false) {
                    icon.addClass("jqx-notification-icon-ltr");
                    content.before(icon);
                } else {
                    // rtl support
                    icon.addClass("jqx-notification-icon-rtl");
                    content.after(icon);
                }
            }

            var icon;
            if (me.template) {
                me.host.addClass("jqx-widget");
                me.host.addClass("jqx-popup");
                me.host.addClass("jqx-notification-" + me.template);
                icon = $("<td class='" + me.toThemeProperty("jqx-notification-icon") + " jqx-notification-icon-" + me.template + "'></td>");
                appendIcon();
            } else {
                me.host.addClass(me.toThemeProperty("jqx-widget"));
                me.host.addClass(me.toThemeProperty("jqx-popup"));
                me.host.addClass(me.toThemeProperty("jqx-fill-state-normal"));
                if (me.icon) {
                    icon = $("<td class='" + me.toThemeProperty("jqx-notification-icon") + "'></td>");
                    me.icon.padding = me.icon.padding ? parseInt(me.icon.padding) : 5;
                    icon.css({ "width": (parseInt(me.icon.width) + me.icon.padding), "height": me.icon.height, "background-image": "url('" + me.icon.url + "')" });
                    appendIcon();
                }
            }

            if (me.showCloseButton == true) {
                var themeClass;
                if (me.template) {
                    themeClass = "jqx-notification-close-button jqx-notification-close-button-" + me.template;
                } else {
                    themeClass = me.toThemeProperty("jqx-icon-close") + " " + me.toThemeProperty("jqx-notification-close-button");
                }
                var closeButton = $("<td class='" + me.toThemeProperty("jqx-notification-close-button-container") + "'><div class='" + themeClass + " " + me.element.id + "CloseButton' title='Close'></div></td>");
                if (me.rtl == false) {
                    closeButton.find("div").addClass("jqx-notification-close-button-ltr");
                    content.after(closeButton);
                } else {
                    // rtl support
                    closeButton.find("div").addClass("jqx-notification-close-button-rtl");
                    content.before(closeButton);
                }
            }

            me.host[0].innerHTML = "";
            me.host.append(table);
            if (children.length > 0) {
                me.host.find('.jqx-notification-content').append(children);
            }
            else {
                me.host.find('.jqx-notification-content').html(hostHTML);
            }
        },

        // positions the notification container
        _position: function (container) {
            var me = this;

            var left;
            var right;
            var top;
            var bottom;
            switch (me.position) {
                case "top-right":
                    left = "";
                    right = me.browserBoundsOffset;
                    top = me.browserBoundsOffset;
                    bottom = "";
                    break;
                case "top-left":
                    left = me.browserBoundsOffset;
                    right = "";
                    top = me.browserBoundsOffset;
                    bottom = "";
                    break;
                case "bottom-left":
                    left = me.browserBoundsOffset;
                    right = "";
                    top = "";
                    bottom = me.browserBoundsOffset;
                    break;
                case "bottom-right":
                    left = "";
                    right = me.browserBoundsOffset;
                    top = "";
                    bottom = me.browserBoundsOffset;
                    break;
            }
            container.css({ "left": left, "right": right, "top": top, "bottom": bottom });
        },

        // appends the notification container if it has not been appended
        _notificationContainer: function () {
            var me = this;

            var container;
            if (!me.appendContainer) {
                container = $("#jqxNotificationDefaultContainer-" + me.position);
                if (container.length == 0) {
                    $("body").append("<div id='jqxNotificationDefaultContainer-" + me.position + "' class='jqx-notification-container'></div>");
                    container = $("#jqxNotificationDefaultContainer-" + me.position);
                    if (me.width.indexOf && me.width.indexOf("%") != -1) {
                        container.addClass(me.toThemeProperty("jqx-notification-container-full-width"));
                    }
                    if (me.height.indexOf && me.height.indexOf("%") != -1) {
                        container.addClass(me.toThemeProperty("jqx-notification-container-full-height"));
                    }
                    me._position(container);
                }
            } else {
                container = $(me.appendContainer);
                if (container.length == 0) {
                    throw new Error("jqxNotification: Invalid appendContainer jQuery Selector - " + me.appendContainer + "! Please, check whether the used ID or CSS Class name is correct.");
                }
            }
            return container;
        },

        // removes empty notification containers
        _destroyContainers: function (notifications) {
            if (notifications == 0) {
                $(".jqx-notification-container").remove();
            }
        },

        // sets the functions on mouseenter and mouseleave depending on the browser
        _setHoverFunctions: function () {
            var me = this;

            var ie9 = false;
            if ($.jqx.browser.browser == "msie" && $.jqx.browser.version == "9.0") {
                ie9 = true;
            }

            if (ie9 == false) {
                me.mouseenterFunction = function (instance) {
                    instance.fadeTo("fast", me.hoverOpacity);
                }
                me.mouseleaveFunction = function (instance) {
                    instance.fadeTo("fast", me.opacity);
                }
            } else {
                me.mouseenterFunction = function (instance) {
                    instance.css("filter", "alpha(opacity = " + (me.hoverOpacity * 100) + ")");
                }
                me.mouseleaveFunction = function (instance) {
                    instance.css("filter", "alpha(opacity = " + (me.opacity * 100) + ")");
                }
            }
        }
    });
})(jqxBaseFramework);
