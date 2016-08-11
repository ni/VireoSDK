/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/



(function ($)
{

    $.jqx.jqxWidget("jqxPasswordInput", "", {});

    $.extend($.jqx._jqxPasswordInput.prototype, {

        defineInstance: function ()
        {
            var settings = {
                //// properties
                width: null,
                height: null,
                disabled: false, // possible values: true, false
                rtl: false, // possible values: true, false
                placeHolder: null,
                showStrength: false, // possible values: true, false
                showStrengthPosition: 'right', // possible values: top, bottom, left, right
                maxLength: null,
                minLength: null,
                showPasswordIcon: true, // possible values: true, false
                strengthTypeRenderer: null, // callback function
                passwordStrength: null, // callback function
                changeType: null,
                localization: { passwordStrengthString: "Password strength", tooShort: "Too short", weak: "Weak", fair: "Fair", good: "Good", strong: "Strong", showPasswordString: "Show Password" },
                strengthColors: { tooShort: "rgb(170, 0, 51)", weak: "rgb(170, 0, 51)", fair: "rgb(255, 204, 51)", good: "rgb(45, 152, 243)", strong: "rgb(118, 194, 97)" }
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args)
        {
            // renders the widget
            this.render();
        },

        //// methods

        // public methods

        // renders the widget
        render: function ()
        {
            var me = this;
            var browser = $.jqx.browser.browser;
            var version = $.jqx.browser.version;
            // checks if the user's browser is not Internet Explorer 7 or 8
            this._browserCheck = browser != "msie" || (version != "7.0" && version != "8.0");
            this.widgetID = me.element.id;
            var widget = me.host;

            var typeExceptionMessage = "Invalid input type. Please set the type attribute of the input element to password.";
            if (widget.attr("type") != "password")
                throw typeExceptionMessage;


            me._hidden = true;

            // sets the widget's theme and classes
            me._setTheme();

            // sets the widget's attributes according to the set properties
            me._setAttributes();

            // appends the Show password icon
            me._showPassword();

            // appends the Show strength tooltip
            me._showStrength();
        },

        // refreshes the widget
        refresh: function (initialRefresh)
        {
            var me = this;
            if (initialRefresh == true)
            {
                return;
            };

            me.removeHandler(me.host, 'change.passwordinput' + me.widgetID);
            me.removeHandler(me.host, 'focus.passwordinput' + me.widgetID);
            me.removeHandler(me.host, 'blur.passwordinput' + me.widgetID);
            me.removeHandler(me.host, 'click.passwordinput' + me.widgetID);
            me.removeHandler($(window), 'resize.passwordinput' + me.widgetID);
            me.removeHandler(me.host, 'keyup.passwordinput' + me.widgetID);
            me.removeHandler(me.icon, 'mousedown.passwordinput' + me.iconID);
            me.removeHandler(me.icon, 'mouseup.passwordinput' + me.iconID);
            me.removeHandler($(document), 'mousedown.passwordinput' + me.iconID);
            me._setAttributes();
            me._setTheme();
            me._showPassword();
            me._showStrength();
        },

        // gets or sets the password's value
        val: function (value)
        {
            var me = this,
                currentPassword = me.element.value,
                hasPlaceholder = 'placeholder' in me.element;

            if ($.isEmptyObject(value) && value != "")
            {
                if (!hasPlaceholder && currentPassword === me.placeHolder)
                {
                    currentPassword = '';
                }
                return currentPassword;
            } else
            {
                if (hasPlaceholder && value === currentPassword)
                {
                    return;
                }

                if (!hasPlaceholder)
                {
                    if (value === '')
                    {
                        if (currentPassword !== me.placeHolder)
                        {
                            me.element.value = me.placeHolder;
                            me.host.attr('type', 'text');
                        }
                        return;
                    } else
                    {
                        me.host.attr('type', 'password');
                    }
                }

                me.element.value = value;

                if (me.showStrength === true)
                {
                    me._evaluateStrength(); // re-evaluates the new password strength
                }
            };
        },

        // private methods

        // called when a property is changed
        propertyChangedHandler: function (object, key, oldvalue, value)
        {
            var widget = this.host;
            if (key === 'theme')
            {
                $.jqx.utilities.setTheme(oldvalue, value, object.host);
                return;
            }

            if (key == "disabled")
            {
                // checks if the widget is disabled
                if (object.disabled == true)
                {
                    object.host.attr("disabled", "disabled");
                    object.host.addClass(object.toThemeProperty('jqx-fill-state-disabled'));
                } else
                {
                    object.host.removeAttr("disabled");
                    object.host.removeClass(object.toThemeProperty('jqx-fill-state-disabled'));
                };
                return;
            }

            if (key == "placeHolder")
            {
                if (this._browserCheck)
                {
                    if ("placeholder" in this.element)
                    {
                        widget.attr("placeholder", this.placeHolder);
                    } else
                    {
                        if (widget.val() == "")
                        {
                            widget.attr("type", "text");
                            object.element.value = value;
                        } else if (widget.val() == oldvalue)
                        {
                            object.element.value = value;
                        };
                    };
                };
            } else
            {
                this.refresh();
            };
        },

        resize: function (width, height)
        {
            this.width = width;
            this.height = height;
            this.host.width(this.width);
            this.host.height(this.height);
        },

        // sets the widget's attributes according to the set properties
        _setAttributes: function ()
        {
            var me = this;
            var widget = me.host;

            // sets the widget's width and height
            widget.width(me.width);
            widget.height(me.height);

            // sets the maximum number of characters in the password
            if (me.maxLength)
            {
                widget.attr("maxlength", me.maxLength);
            };
            if (me.minLength)
            {
                widget.attr("minLength", me.minLength);
            };

            // sets the placeholder text
            if (me.placeHolder && me._browserCheck)
            {
                if ("placeholder" in me.element)
                {
                    widget.attr("placeholder", me.placeHolder);
                } else
                {
                    if (widget.val() == "")
                    {
                        widget.attr("type", "text");
                        me.element.value = me.placeHolder;
                    };
                };
            };

            // checks if the widget is disabled
            if (me.disabled == true)
            {
                widget.attr("disabled", "disabled");
                widget.addClass(this.toThemeProperty('jqx-fill-state-disabled'));
            } else
            {
                widget.removeAttr("disabled");
                widget.removeClass(me.toThemeProperty('jqx-fill-state-disabled'));
            };

            var stopFlag = false;
            me.addHandler(widget, 'change.passwordinput' + me.widgetID, function (event)
            {
                if (!stopFlag)
                {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    event.stopPropagation();
                    stopFlag = true;
                    me._raiseEvent();
                    stopFlag = false;
                }
            });

            // binds to the click event
            me.addHandler(widget, 'click.passwordinput' + me.widgetID, function ()
            {
                if (me.showPasswordIcon && me.icon)
                {
                    me.icon.show();
                    me._positionIcon();
                }
            });

            me.interval = null;
            me.addHandler(widget, 'keydown.passwordinput' + me.widgetID, function ()
            {
                me.changeType = "keyboard";
                if (me.showPasswordIcon && me.icon)
                {
                    if (me.interval) clearInterval(me.interval);
                    var t = 0;
                    me.interval = setInterval(function ()
                    {
                        if (me.icon[0].style.display != "none")
                        {
                            me._positionIcon();
                            t++;
                            if (t > 5)
                            {
                                clearInterval(me.interval);
                            }
                        }
                        else
                        {
                            clearInterval(me.interval);
                        }
                    }, 100);
                }
            });

            // binds to the focus event
            me.addHandler(widget, 'focus.passwordinput' + me.widgetID, function ()
            {
                me._focused = true;
                me.host.addClass(me.toThemeProperty("jqx-fill-state-focus"));
                if (me.placeHolder && me._browserCheck && !("placeholder" in me.element) && widget.val() == me.placeHolder)
                {
                    widget.val("");
                    if (me._hidden == true)
                    {
                        widget.attr("type", "password");
                    };
                };
                if (me.val().length > 0)
                {
                    if (me.showStrength == true)
                    {
                        var cntnt = widget.jqxTooltip("content");
                        if (cntnt)
                        {
                            widget.jqxTooltip('open');
                        };
                    };
                }
                if (me.showPasswordIcon && me.icon)
                {
                    me.icon.show();
                    me._positionIcon();
                }
            });

            // binds to the blur event
            me.addHandler(widget, 'blur.passwordinput' + me.widgetID, function ()
            {
                me._focused = false;
                me.host.removeClass(me.toThemeProperty("jqx-fill-state-focus"));
                if (me.placeHolder && me._browserCheck && !("placeholder" in me.element) && widget.val() == "")
                {
                    me.element.value = me.placeHolder;
                    widget.attr("type", "text");
                }

                if (me.showPasswordIcon == true && me._browserCheck)
                {
                    if (me.rtl == false)
                    {
                        me.host.removeClass(me.toThemeProperty("jqx-passwordinput-password-icon-ltr"));
                    } else
                    {
                        me.host.removeClass(me.toThemeProperty("jqx-passwordinput-password-icon-rtl"));
                    }
                }

                if (me.showStrength == true)
                {
                    widget.jqxTooltip('close');
                }

                if (me.showPasswordIcon && me.icon)
                {
                    me.icon.hide();
                }
            });
        },

        destroy: function ()
        {
            if (this.host.jqxTooltip)
            {
                this.host.jqxTooltip('destroy');
            }
            this.host.remove();
        },

        // sets the widget's theme and classes
        _setTheme: function ()
        {
            var widget = this.host;
            var that = this;
            widget.addClass(that.toThemeProperty("jqx-widget"));
            widget.addClass(that.toThemeProperty("jqx-widget-content"));
            widget.addClass(that.toThemeProperty("jqx-input"));
            widget.addClass(that.toThemeProperty("jqx-rc-all"));

            if (that.rtl == true)
            {
                widget.addClass(that.toThemeProperty("jqx-rtl"));
                widget.css("direction", "rtl");
            }
            else
            {
                widget.removeClass(that.toThemeProperty("jqx-rtl"));
                widget.css("direction", "ltr");
            }
        },

        // implements the Show password icon
        _showPassword: function ()
        {
            if (this.showPasswordIcon == true && this._browserCheck)
            {
                var me = this;
                this.iconID = this.widgetID + "-password-icon";
                $("<span tabindex='-1' hasfocus='false' style='position: absolute; display: none;' id='" + me.iconID + "'></span>").insertAfter(me.host);
                var icon = $("#" + me.iconID);
                me.icon = icon;
                icon.addClass(me.toThemeProperty("jqx-passwordinput-password-icon"));
                icon.attr("title", me.localization.showPasswordString);
                me._positionIcon();
                var hide = function ()
                {
                    me.host.attr("type", "password");
                    me._hidden = true;
                    icon.attr("title", me.localization.showPasswordString);
                }
                var toggle = function ()
                {
                    if (me._hidden == false)
                    {
                        hide();
                    } else if (me._hidden == true)
                    {
                        me.host.attr("type", "text");
                        me._hidden = false;
                    }
                }

                var isTouchDevice = $.jqx.mobile.isTouchDevice();
                if (isTouchDevice)
                {
                    me.addHandler(me.icon, 'mousedown.passwordinput' + me.iconID, function (event)
                    {
                        toggle();
                        return false;
                    });
                } else
                {
                    me.addHandler(me.icon, 'mousedown.passwordinput' + me.iconID, function (event)
                    {
                        toggle();
                        return false;
                    });
                    me.addHandler(me.icon, 'mouseup.passwordinput' + me.iconID, function (event)
                    {
                        hide();
                        return false;
                    });
                    me.addHandler($(document), 'mousedown.passwordinput' + me.iconID, function (event)
                    {
                        if (me._focused)
                        {
                            hide();
                        }
                    });
                }
            };
        },

        _positionIcon: function ()
        {
            var hostOffset = this.host.offset();
            var w = this.host.outerWidth();
            var h = this.host.outerHeight();
            if (this.rtl == true)
            {
                this.icon.offset({ top: parseInt(hostOffset.top + h / 2 - 10 / 2), left: hostOffset.left + 2 });
            } else
            {
                this.icon.offset({ top: parseInt(hostOffset.top + h / 2 - 10 / 2), left: hostOffset.left + w - 18 });
            };
        },

        // implements the Show strength functionality
        _showStrength: function ()
        {
            var me = this;
            if (me.showStrength == true)
            {
                if (me.host.jqxTooltip != undefined)
                {
                    var strengthID = me.widgetID + "Strength";
                    var strengthIDV = strengthID + "Value";
                    var strengthIDI = strengthID + "Indicator";
                    var content;

                    if (!me.strengthTypeRenderer)
                    {
                        // default content
                        content = "<div style='width: 220px;' id='" + strengthID + "'><div><span style='font-weight: bold;'>" + me.localization.passwordStrengthString + ": </span><span id='" + strengthIDV + "'></span></div><div id='" + strengthIDI + "'></div></div>";
                    } else
                    {
                        // custom content
                        var password = me.host.val();
                        if (!("placeholder" in me.element) && me._browserCheck && password == me.placeHolder)
                        {
                            password = "";
                        };
                        me._countCharacters();
                        var strengthValue = me.localization.tooShort;
                        var newValue = me.strengthTypeRenderer(password, { letters: me.letters, numbers: me.numbers, specialKeys: me.specials }, strengthValue);
                        content = newValue;
                    };

                    me.host.jqxTooltip({ theme: me.theme, position: me.showStrengthPosition, content: content, trigger: "none", autoHide: false, rtl: me.rtl });

                    if (!me.strengthTypeRenderer)
                    {
                        $("#" + strengthIDV).html(me.localization.tooShort);
                        $("#" + strengthIDI).addClass("jqx-passwordinput-password-strength-inicator").css("background-color", me.strengthColors.tooShort);
                        if (me.rtl == false)
                        {
                            $("#" + strengthIDI).css("float", "left");
                        } else
                        {
                            $("#" + strengthIDI).css("float", "right");
                        };
                    };

                    me._checkStrength();
                } else
                {
                    throw new Error('jqxPasswordInput: Missing reference to jqxtooltip.js');
                };
            };
        },

        // checks the password's strength
        _checkStrength: function ()
        {
            var me = this;

            me.addHandler($(window), 'resize.passwordinput' + me.widgetID, function ()
            {
                if (me.icon)
                {
                    me.icon.hide();
                }
            });

            me.addHandler(me.host, 'keyup.passwordinput' + me.widgetID, function ()
            {
                me._evaluateStrength();
            });
        },

        _raiseEvent: function (type)
        {
            var event = new $.Event("change");

            event.args = { type: this.changeType };
            this.changeType = null;
            event.owner = this;
            var result = this.host.trigger(event);
            return result;
        },

        // evaluates the password strength
        _evaluateStrength: function ()
        {
            var me = this;
            var password = me.host.val();
            var length = password.length;

            me._countCharacters();

            if (length > 0)
            {
                if (me.showStrength == true)
                {
                    var opened = !me.host.jqxTooltip("opened");
                    if (opened)
                    {
                        me.host.jqxTooltip('open');
                    };
                };
            }

            // default password strength rule
            var strengthCo = me.letters + me.numbers + 2 * me.specials + me.letters * me.numbers / 2 + length;
            var strengthValue;
            if (length < 8)
            {
                strengthValue = me.localization.tooShort;
            } else if (strengthCo < 20)
            {
                strengthValue = me.localization.weak;
            } else if (strengthCo < 30)
            {
                strengthValue = me.localization.fair;
            } else if (strengthCo < 40)
            {
                strengthValue = me.localization.good;
            } else
            {
                strengthValue = me.localization.strong;
            };

            if (me.strengthTypeRenderer)
            {
                var newValue = me.strengthTypeRenderer(password, { letters: me.letters, numbers: me.numbers, specialKeys: me.specials }, strengthValue);
                me.host.jqxTooltip({ content: newValue });
            } else
            {
                // checks if a custom password strength rule is defined
                if (me.passwordStrength)
                {
                    var newValue = me.passwordStrength(password, { letters: me.letters, numbers: me.numbers, specialKeys: me.specials }, strengthValue);
                    $.each(me.localization, function ()
                    {
                        var item = this;
                        if (newValue == item)
                        {
                            strengthValue = newValue;
                            return false;
                        };
                    });
                };

                $("#" + me.widgetID + "StrengthValue").html(strengthValue);

                var ident = $("#" + me.widgetID + "StrengthIndicator");

                switch (strengthValue)
                {
                    case me.localization.tooShort:
                        ident.css({ "width": "20%", "background-color": me.strengthColors.tooShort });
                        break;
                    case me.localization.weak:
                        ident.css({ "width": "40%", "background-color": me.strengthColors.weak });
                        break;
                    case me.localization.fair:
                        ident.css({ "width": "60%", "background-color": me.strengthColors.fair });
                        break;
                    case me.localization.good:
                        ident.css({ "width": "80%", "background-color": me.strengthColors.good });
                        break;
                    case me.localization.strong:
                        ident.css({ "width": "100%", "background-color": me.strengthColors.strong });
                        break;
                };
            };
        },

        // counts the letters, numbers and special characters in the password
        _countCharacters: function ()
        {
            var me = this;
            me.letters = 0;
            me.numbers = 0;
            me.specials = 0;
            var specialCharacters = "<>@!#$%^&*()_+[]{}?:;|'\"\\,./~`-=";

            var password = me.host.val();
            var length = password.length;
            for (var i = 0; i < length; i++)
            {
                var character = password.charAt(i);
                var code = password.charCodeAt(i);
                // checks if the character is a letter
                if ((code > 64 && code < 91) || (code > 96 && code < 123) || (code > 127 && code < 155) || (code > 159 && code < 166))
                {
                    me.letters += 1;
                    continue;
                };
                // checks if the character is a number
                if (isNaN(character) == false)
                {
                    me.numbers += 1;
                    continue;
                };
                // checks if the character is a special character
                if (specialCharacters.indexOf(character) != -1)
                {
                    me.specials += 1;
                    continue;
                };
            };
        }
    });
})(jqxBaseFramework);
