/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxToolBar', '', {});

    $.extend($.jqx._jqxToolBar.prototype, {
        defineInstance: function () {
            var settings = {
                // properties
                width: '100%',
                minWidth: null,
                maxWidth: null,
                height: 35,
                tools: '', // possible values: a string representing a list of space-separated element types: button, toggleButton, dropdownlist, combobox, input, custom, | (separator)
                initTools: null, // callback function
                minimizeWidth: 200,
                disabled: false,
                rtl: false,

                // events
                events: ['open', 'close']
            };
            $.extend(true, this, settings);
        },

        createInstance: function () {
            var that = this;

            that._toolToWidgetMapping = { button: 'jqxButton', toggleButton: 'jqxToggleButton', dropdownlist: 'jqxDropDownList', combobox: 'jqxComboBox', input: 'jqxInput' };
            that._toolChanges = new Array();
            that.render();
        },

        // renders the widget
        render: function () {
            var that = this, initialization = true;

            that.host.html('');
            that.host.removeClass(that.toThemeProperty('jqx-widget jqx-fill-state-normal jqx-rc-all jqx-toolbar jqx-fill-state-disabled'));

            // sets the width and height of the widget
            that._setSize();

            // destroys all tools (only if render is called after initialization)
            that._destroyTools(false);

            // removes the minimize button and pop-up (only if render is called after initialization)
            if (that._toolWidgets) {
                initialization = false;

                that._minimizeButton.add(that._minimizePopup).remove();
            }

            // appends the minimize button and pop-up
            that._appendMinimizeButton();

            // adds the necessary classes for the widget
            that._addClasses();

            // initializes the tools in the toolbar
            that._createTools();

            if (that.disabled === true) {
                that.host.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
                that._disableTools(true);
            }

            // minimizes some of the tools if necessary
            that._minimize();

            // removes event handlers
            that._removeHandlers();

            // adds event handlers
            that._addHandlers();

            // restores changes (only if render is called after initialization)
            if (initialization === false && that._toolChanges.length > 0) {
                that._restoreChanges();
            }
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                this.render();
            }
        },

        // returns an array of all tools
        getTools: function () {
            return this._toolWidgets;
        },

        // destroys the widget
        destroy: function () {
            var that = this;

            that._removeHandlers();
            that._destroyTools();
            that.host.remove();
        },

        // destroys all tools
        _destroyTools: function (logChanges) {
            var that = this;

            if (logChanges !== false) {
                logChanges = true;
            }

            if (that._toolWidgets) {
                for (var i = that._toolWidgets.length - 1; i >= 0; i--) {
                    that._destroyTool(i, logChanges);
                }
            }
        },

        // destroys a tool - private method
        _destroyTool: function (index, logChanges) {
            var that = this;
            index = parseInt(index, 10);
            var toolToDestroy = that._toolWidgets[index];
            if (toolToDestroy) {
                var type = toolToDestroy.type;
                var bothTools = that._getBothTools(toolToDestroy);

                if (type !== 'custom') {
                    bothTools[that._toolToWidgetMapping[type]]('destroy');
                } else {
                    bothTools.remove();
                }

                if (toolToDestroy.menuSeparator) {
                    toolToDestroy.menuSeparator.remove();
                }

                that._toolWidgets.splice(index, 1);

                if (that._checkType(type)) {
                    that._refreshButtonGroups();
                }

                that._minimize();

                if (logChanges !== false) {
                    that._toolChanges.push({ action: 'destroyTool', index: index });
                }
            }
        },

        // destroys a tool - public method
        destroyTool: function (index) {
            this._destroyTool(index, true);
        },

        // adds a new tool after the existing ones
        addTool: function (type, position, separator, initCallback) {
            var that = this, index, prevTool, prev, next;

            if (position === 'first') {
                index = 0;
            } else { // position is 'last'
                index = that._toolWidgets.length;
            }

            if (that._toolWidgets[index - 1]) {
                prevTool = that._toolWidgets[index - 1].tool;
                if (that._toolWidgets[index - 1].separatorAfterWidget) {
                    prev = '|';
                } else {
                    prev = that._toolWidgets[index - 1].type;
                }
            }

            if (separator === true) {
                next = '|';
            } else if (that._toolWidgets[index + 1]) {
                next = that._toolWidgets[index + 1].type;
            }

            var newToolObject = that._initializeTool(index, type, prevTool, prev, next, initCallback, false);

            if (position === 'first') {
                that._toolWidgets.splice(0, 0, newToolObject);
            } else {
                that._toolWidgets.push(newToolObject);
            }

            that._removeHandlers();
            that._addHandlers();

            if (that._checkType(type)) {
                that._refreshButtonGroups();
            }

            if (position !== 'first' && that._minimizedTools > 0) {
                that._minimizeTool(true);
            } else {
                that._minimize();
            }

            that._toolChanges.push({ action: 'addTool', type: type, position: position, separator: separator, initCallback: initCallback });
        },

        // disables or enables all tools
        _disableTools: function (disable) {
            var that = this;

            for (var i = 0; i < that._toolWidgets.length; i++) {
                that.disableTool(i, disable);
            }
        },

        // disables or enables a tool
        disableTool: function (index, disable) {
            var that = this;

            index = parseInt(index, 10);

            var currentTool = that._toolWidgets[index];
            if (currentTool) {
                var type = currentTool.type;
                var bothTools = that._getBothTools(currentTool);
                if (type !== 'custom') {
                    bothTools[that._toolToWidgetMapping[type]]({ disabled: disable });
                }
                that._toolChanges.push({ action: 'disableTool', index: index, disable: disable });
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key !== 'initTools') {
                if (value !== oldvalue) {
                    switch (key) {
                        case 'theme':
                            if (oldvalue !== '') {
                                object.host.removeClass('jqx-widget-' + oldvalue + ' jqx-fill-state-normal-' + oldvalue + ' jqx-rc-all-' + oldvalue + ' jqx-toolbar-' + oldvalue);
                                object._minimizePopup.removeClass('jqx-popup-' + oldvalue + ' jqx-fill-state-normal-' + oldvalue +
                                    ' jqx-rc-b-' + oldvalue + ' jqx-toolbar-minimized-popup-' + oldvalue);
                            }

                            object._addClasses();
                            object._minimizePopup.addClass(object.toThemeProperty('jqx-popup jqx-fill-state-normal jqx-rc-b jqx-toolbar-minimized-popup'));

                            for (var i = 0; i < object._toolWidgets.length; i++) {
                                var currentToolTheme = object._toolWidgets[i];
                                if (currentToolTheme.type !== 'custom') {
                                    var bothToolsToTheme = object._getBothTools(currentToolTheme);
                                    if (currentToolTheme.menuTool) {
                                        if (currentToolTheme.menuSeparator) {
                                            currentToolTheme.menuSeparator.removeClass('jqx-fill-state-pressed-' + oldvalue + ' jqx-toolbar-minimized-popup-separator-' + oldvalue);
                                            currentToolTheme.menuSeparator.addClass(object.toThemeProperty('jqx-fill-state-pressed jqx-toolbar-minimized-popup-separator'));
                                        }
                                    }
                                    bothToolsToTheme[object._toolToWidgetMapping[object._toolWidgets[i].type]]({ theme: value });
                                }
                            }
                            $.jqx.utilities.setTheme(oldvalue, value, object.host);
                            break;
                        case 'width':
                            object.host.width(value);
                            object._minimize();
                            break;
                        case 'minWidth':
                            object.host.css('min-width', value);
                            object._minimize();
                            break;
                        case 'maxWidth':
                            object.host.css('max-width', value);
                            object._minimize();
                            break;
                        case 'height':
                            object.host.height(value);
                            for (var j = 0; j < object._toolWidgets.length; j++) {
                                var currentToolHeight = object._toolWidgets[j];
                                var type = currentToolHeight.type;
                                var bothToolsToHeight = object._getBothTools(currentToolHeight);
                                if (type === 'button' || type === 'toggleButton' || type === 'repeatButton' || type === 'linkButton') {
                                    bothToolsToHeight.css('height', value);
                                } else if (type === 'dropdownlist' || type === 'combobox' || type === 'input') {
                                    bothToolsToHeight[object._toolToWidgetMapping[type]]({ height: value - 2 });
                                }
                            }
                            break;
                        case 'tools': // 'initTools' has to be changed before changing 'tools'
                            object._removeHandlers();
                            object._destroyTools();
                            object._createTools();
                            object._addHandlers();
                            object._minimize();
                            break;
                        case 'minimizeWidth':
                            if (object._isOpen === true) {
                                var newLeft = parseInt(object._minimizePopup.css('left'), 10) - (value - oldvalue);
                                object._minimizePopup.css({ 'width': value + 'px', 'left': newLeft + 'px' });
                            } else {
                                object._minimizePopup.width(value);
                            }
                            break;
                        case 'rtl':
                            object.render();
                            break;
                        case 'disabled':
                            if (value === true) {
                                object.host.addClass(object.toThemeProperty('jqx-fill-state-disabled'));
                                object._disableTools(true);
                            } else {
                                object.host.removeClass(object.toThemeProperty('jqx-fill-state-disabled'));
                                object._disableTools(false);
                            }
                            break;
                    }
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

        // adds the necessary classes for the widget
        _addClasses: function () {
            var that = this;

            that.host.addClass(that.toThemeProperty('jqx-widget jqx-fill-state-normal jqx-rc-all jqx-toolbar'));

            if (that.rtl === true) {
                that.host.addClass(that.toThemeProperty('jqx-toolbar-rtl'));
            }
        },

        _checkType: function(type)
        {
            if (type === "button" || type === "toggleButton" || type === "repeatButton" || type === "linkButton")
                return true;
            return false;
        },

        // refreshes the CSS of button groups
        _refreshButtonGroups: function () {
            var that = this;

            function styleButton(button, inner, all, l, r, borderLeftWidth) {
                button[inner + 'Class'](that.toThemeProperty('jqx-toolbar-tool-inner-button'));
                button[all + 'Class'](that.toThemeProperty('jqx-rc-all'));
                button[l + 'Class'](that.toThemeProperty('jqx-rc-l'));
                button[r + 'Class'](that.toThemeProperty('jqx-rc-r'));
                button.css('border-left-width', borderLeftWidth + 'px');
            }

            $.each(that._toolWidgets, function (index, toolObject) {
                if (that._checkType(toolObject.type)) {
                    var prev, next;

                    var bothTools = that._getBothTools(toolObject);

                    if (index > 0) {
                        if (that._toolWidgets[index - 1].separatorAfterWidget) {
                            prev = '|';
                        } else {
                            prev = that._toolWidgets[index - 1];
                        }
                    }

                    if (toolObject.separatorAfterWidget) {
                        next = '|';
                    } else if (index < that._toolWidgets.length - 1) {
                        next = that._toolWidgets[index + 1];
                    }

                    var prevButton = prev && that._checkType(prev.type);
                    var nextButton = toolObject.separatorAfterWidget === false && next && that._checkType(next.type);

                    if (!prevButton && !nextButton) { // single button
                        styleButton(bothTools, 'remove', 'add', 'remove', 'remove', 1);
                    } else if (!prevButton && nextButton) { // left button
                        styleButton(bothTools, 'remove', 'remove', 'add', 'remove', 1);
                    } else if (prevButton && nextButton) { // middle button
                        styleButton(bothTools, 'add', 'remove', 'remove', 'remove', 0);
                    } else if (prevButton && !nextButton) { // right button
                        styleButton(bothTools, 'remove', 'remove', 'remove', 'add', 0);
                    }

                    var rtl = that.rtl ? 'rtl' : 'ltr';

                    if (!nextButton) {
                        if (toolObject.separatorAfterWidget) {
                            bothTools.removeClass(that.toThemeProperty('jqx-toolbar-tool-no-separator-' + rtl));
                            bothTools.addClass(that.toThemeProperty('jqx-toolbar-tool-separator-' + rtl));
                        } else {
                            bothTools.removeClass(that.toThemeProperty('jqx-toolbar-tool-separator-' + rtl));
                            bothTools.addClass(that.toThemeProperty('jqx-toolbar-tool-no-separator-' + rtl));
                        }
                    } else {
                        bothTools.removeClass(that.toThemeProperty('jqx-toolbar-tool-separator-' + rtl));
                        bothTools.removeClass(that.toThemeProperty('jqx-toolbar-tool-no-separator-' + rtl));
                    }
                }
            });
        },

        // adds event handlers
        _addHandlers: function () {
            var that = this;
            var id = that.element.id;

            $.jqx.utilities.resize(that.host, function () {
                // Internet Explorer 7 fix
                if ($.jqx.browser.msie && $.jqx.browser.version < 8 && typeof that.width === 'string' && that.width.charAt(that.width.length - 1) === '%') {
                    var parentWidth = that.host.parent().width();
                    var targetToolBarWidth = parentWidth * parseFloat(that.width.replace('%', '')) / 100;
                    var bordersAndPadding = parseInt(that.host.css('border-left-width'), 10) + parseInt(that.host.css('border-right-width'), 10) +
                        parseInt(that.host.css('padding-left'), 10) + parseInt(that.host.css('padding-right'), 10);
                    that.host.css('width', targetToolBarWidth - bordersAndPadding - 1);
                }

                if (that._isOpen === true) {
                    that._minimizePopup.hide();
                    that._isOpen = false;
                    that._raiseEvent('1'); // close event
                }
                that._minimize();
            });

            that.addHandler($(document), 'click.jqxToolbar' + id, function () {
                if (that._isOpen === true) {
                    that._openMinimizePopup();
                }
            });
            that.addHandler(that._minimizeButton, 'click.jqxToolbar' + id, function (event) {
                event.stopPropagation();
                that._openMinimizePopup();
            });
            that.addHandler($('.jqx-popup'), 'click.jqxToolbar' + id, function (event) {
                if (!$(event.target).hasClass('jqx-window-content')) {
                    event.stopPropagation();
                }
            });
        },

        // removes event handlers
        _removeHandlers: function () {
            var that = this;
            var id = that.element.id;

            that.removeHandler($(document), 'click.jqxToolbar' + id);
            that.removeHandler(that._minimizeButton, 'click.jqxToolbar' + id);
            that.removeHandler($('.jqx-popup'), 'click.jqxToolbar' + id);
        },

        // sets the width and height of the widget
        _setSize: function () {
            var that = this;

            that.host.width(that.width);
            that.host.height(that.height);

            if (that.minWidth) {
                that.host.css('min-width', that.minWidth);
            }

            if (that.maxWidth) {
                that.host.css('max-width', that.maxWidth);
            }
        },

        // initializes the tools in the toolbar
        _createTools: function () {
            var that = this;

            var toolsWithSeparators = that.tools.split(' ');

            var tools = $.trim(that.tools.replace(/\|/g, ''));
            tools = tools.replace(/\s+/g, ' ');
            tools = tools.split(' ');

            // a global array of all tool widget instances
            that._toolWidgets = new Array();

            var indexCorrection = 0;

            $.each(tools, function (index, type) {
                if (tools[index] !== toolsWithSeparators[index + indexCorrection]) {
                    indexCorrection++;
                }

                var currentIndex = index + indexCorrection;

                var prevTool;
                if (that._toolWidgets[index - 1]) {
                    prevTool = that._toolWidgets[index - 1].tool;
                }

                var currentType = toolsWithSeparators[currentIndex];
                var prev = toolsWithSeparators[currentIndex - 1];
                var next = toolsWithSeparators[currentIndex + 1];

                var initCallback = that.initTools;
                if (currentType === "")
                    return true;

                var toolObject = that._initializeTool(index, currentType, prevTool, prev, next, initCallback, true);

                that._toolWidgets.push(toolObject);
            });
            that._minimizePopup.css({ 'display': 'none', 'visibility': 'visible' });
        },

        // initializes a tool
        _initializeTool: function (index, type, prevTool, prev, next, initCallback, initialization) {
            var that = this, tool, menuTool;

            var initializationResults = that._initializeWidget(type, tool, menuTool, prevTool);
            tool = initializationResults.tool;
            menuTool = initializationResults.menuTool;

            var minimizable = true;

            tool.addClass(that.toThemeProperty('jqx-toolbar-tool'));
            if (that.rtl === true) {
                tool.addClass(that.toThemeProperty('jqx-toolbar-tool-rtl'));
            }

            if (that.initTools) {
                var settings;
                if (initialization === true) {
                    settings = that.initTools(type, index, tool, false);
                } else {
                    settings = initCallback(type, tool, false);
                }
                if (!settings || (settings.minimizable !== false && settings.menuTool !== false)) {
                    if (initialization === true) {
                        that.initTools(type, index, menuTool, true);
                    } else {
                        initCallback(type, menuTool, true);
                    }
                    menuTool.addClass(that.toThemeProperty('jqx-toolbar-tool-minimized'));
                } else {
                    if (type !== 'custom') {
                        menuTool[that._toolToWidgetMapping[type]]('destroy');
                    } else {
                        menuTool.remove();
                    }
                    if (settings.minimizable === false) {
                        minimizable = false;
                    }
                    menuTool = false;
                }
            }

            var separatorAfter = false;

            var bothTools = tool;
            if (menuTool) {
                bothTools = bothTools.add(menuTool);
                menuTool.css('display', 'none');
            }

            var minimizedSeparator;

            var rtl = that.rtl ? 'rtl' : 'ltr';
            var buttons = ['button', 'toggleButton', 'repeatButton', 'linkButton'];
            var buttonType = {
                'button': 'jqxButton',
                'toggleButton': 'jqxToggleButton',
                'repeatButton': 'jqxRepeatButton',
                'linkButton': 'jqxRepeatButton'
            }

            // separators
            if (next === '|') {
                separatorAfter = true;
                bothTools.addClass(that.toThemeProperty('jqx-toolbar-tool-separator-' + rtl));
                if (menuTool) {
                    minimizedSeparator = $('<div class="' + that.toThemeProperty('jqx-fill-state-pressed jqx-toolbar-minimized-popup-separator') + '"></div>');
                    that._minimizePopup.append(minimizedSeparator);
                }
            } else if (buttons.indexOf(type) === -1 || (buttons.indexOf(type) !== -1 && buttons.indexOf(next) === -1)) {
                bothTools.addClass(that.toThemeProperty('jqx-toolbar-tool-no-separator-' + rtl));
            }


            // buttons
            if (buttons.indexOf(prev) === -1 && buttons.indexOf(type) !== -1 && buttons.indexOf(next) !== -1) {
                
                if (that.rtl === false) {
                    bothTools[buttonType[type]]({ roundedCorners: 'left' });
                } else {
                    bothTools[buttonType[type]]({ roundedCorners: 'right' });
                    bothTools.css('border-left-width', 0);
                }
            } else if (buttons.indexOf(prev) !== -1 && buttons.indexOf(type) !== -1 && buttons.indexOf(next) !== -1) {
                bothTools.addClass(that.toThemeProperty('jqx-toolbar-tool-inner-button'));
                bothTools.css('border-left-width', 0);
            } else if (buttons.indexOf(prev) !== -1 && buttons.indexOf(type) !== -1 && buttons.indexOf(next) === -1) {
                if (that.rtl === false) {
                    bothTools[buttonType[type]]({ roundedCorners: 'right' });
                    bothTools.css('border-left-width', 0);
                } else {
                    bothTools[buttonType[type]]({ roundedCorners: 'left' });
                }
            }

            // Internet Explorer 7 fix
            if ($.jqx.browser.msie && $.jqx.browser.version < 8 && type === 'combobox') {
                bothTools.find('.jqx-combobox-arrow-normal').width(18);
            }

            var toolObject = {
                type: type,
                tool: tool,
                separatorAfterWidget: separatorAfter,
                minimizable: minimizable,
                minimized: false,
                menuTool: menuTool,
                menuSeparator: minimizedSeparator
            };

            return toolObject;
        },

        // initializes a widget tool
        _initializeWidget: function (type, tool, menuTool, prevTool) {
            var that = this;

            function appendTool() {
                menuTool = tool.clone();
                if (prevTool) {
                    prevTool.after(tool);
                    that._minimizePopup.append(menuTool);
                } else {
                    that.host.prepend(tool);
                    that._minimizePopup.prepend(menuTool);
                }
            }

            if (type !== 'custom' && that.host[that._toolToWidgetMapping[type]] === undefined) {
                var missingWidget = that._toolToWidgetMapping[type].toLowerCase();
                throw new Error('jqxToolBar: Missing reference to ' + missingWidget + '.js');
            }

            switch (type) {
                case 'button':
                case 'toggleButton':
                    tool = $('<button></button>');
                    appendTool();
                    tool.add(menuTool)[that._toolToWidgetMapping[type]]({ theme: that.theme, height: that.host.height(), disabled: that.disabled, rtl: that.rtl });
                    break;
                case 'dropdownlist':
                case 'combobox':
                    tool = $('<div></div>');
                    appendTool();
                    tool.add(menuTool)[that._toolToWidgetMapping[type]]({ theme: that.theme, autoDropDownHeight: true, height: that.host.height() - 2, disabled: that.disabled, rtl: that.rtl });
                    break;
                case 'input':
                    tool = $('<input type="text" />');
                    appendTool();
                    tool.add(menuTool).jqxInput({ theme: that.theme, height: that.host.height() - 2, disabled: that.disabled, rtl: that.rtl });
                    break;
                case 'custom':
                    tool = $('<div></div>');
                    appendTool();
                    break;
            }

            return { tool: tool, menuTool: menuTool };
        },

        // appends the minimize button
        _appendMinimizeButton: function () {
            var that = this;
            that._minimizedTools = 0;
            that._minimizeButton = $('<div class="' + that.toThemeProperty('jqx-menu-minimized-button jqx-toolbar-minimized-button') + '"></div>');
            that._minimizePopup = $('<div id="' + that.element.id + 'Popup" class="' + that.toThemeProperty('jqx-popup jqx-fill-state-normal jqx-rc-b jqx-toolbar-minimized-popup') + '"></div>');

            if (that.rtl === true) {
                that._minimizeButton.addClass(that.toThemeProperty('jqx-toolbar-minimized-button-rtl'));
                that._minimizePopup.addClass(that.toThemeProperty('jqx-toolbar-minimized-popup-rtl'));
            }

            that.host.append(that._minimizeButton);
            $('body').append(that._minimizePopup);
            that._isOpen = false;
            that._minimizePopup.width(that.minimizeWidth);
        },

        // opens the minimize pop-up
        _openMinimizePopup: function () {
            var that = this;

            if (that._isOpen === false) {
                var hostOffset = that.host.offset();
                var left = hostOffset.left;
                if (that.rtl === false) {
                    left += that.host.outerWidth() - that._minimizePopup.outerWidth();
                }
                var top = hostOffset.top + that.host.outerHeight()-1;
                that._minimizePopup.css({ 'left': left, 'top': top });
                that._minimizePopup.slideDown('fast', function ()
                {
                    that._isOpen = true;
                    that._raiseEvent('0'); // open event
                }
                );
               } else {
                that._minimizePopup.slideUp('fast');
                that._isOpen = false;
                that._raiseEvent('1'); // close event
            }
        },

        // minimizes some of the tools if necessary
        _minimize: function () {
            var that = this, minimizeButtonWidth = 0;

            if (that._minimizedTools > 0) {
                minimizeButtonWidth = that._minimizeButton.outerWidth() + parseInt(that._minimizeButton.css('margin-left'), 10);
            }

            var toolbarWidth = that.host.width() - parseInt(that.host.css('padding-left'), 10) - parseInt(that.host.css('padding-right'), 10) - minimizeButtonWidth;
            if (toolbarWidth < 0) {
                return;
            }
            var toolsTotalWidth = 0;
            var lastMinimizedWidth;

            for (var i = 0; i < that._toolWidgets.length; i++) {
                if (that._toolWidgets[i].minimized === false) {
                    var currentToolWidth = that._toolWidgets[i].tool.outerWidth(true);
                    toolsTotalWidth += currentToolWidth;
                } else if (lastMinimizedWidth === undefined) {
                    lastMinimizedWidth = that._toolWidgets[i].tool.outerWidth(true);
                }
            }

            if (toolsTotalWidth > toolbarWidth) {
                that._minimizeTool(true);
                that._minimize();
            }
            else if (lastMinimizedWidth !== undefined && (toolsTotalWidth + lastMinimizedWidth) < toolbarWidth) {
                that._minimizeTool(false);
                that._minimize();
            }
        },

        // minimizes or restores a tool
        _minimizeTool: function (minimize) {
            var that = this, currentTool, value;

            if (minimize === true) { // minimize
                for (var i = that._toolWidgets.length - 1; i >= 0; i--) {
                    currentTool = that._toolWidgets[i];

                    if (currentTool.minimizable === false) {
                        continue;
                    }

                    if (currentTool.minimized === false) {
                        value = that._getToolValue(currentTool.tool, currentTool.type);
                        currentTool.tool[0].style.display = 'none';
                        if (currentTool.menuTool) {
                            currentTool.menuTool.show();
                            that._setToolValue(value, currentTool.menuTool, currentTool.type);
                        }
                        if (currentTool.menuSeparator) {
                            currentTool.menuSeparator.show();
                        }
                        that._toolWidgets[i].minimized = true;
                        that._minimizedTools++;
                        if (that._minimizedTools === 1) {
                            that._minimizeButton.show();
                        }
                        break;
                    }
                }
            } else { // restore
                for (var j = 0; j < that._toolWidgets.length; j++) {
                    currentTool = that._toolWidgets[j];
                    if (currentTool.minimized === true) {
                        if (currentTool.menuTool) {
                            value = that._getToolValue(currentTool.menuTool, currentTool.type);
                            currentTool.menuTool.hide();
                        }
                        if (currentTool.menuSeparator) {
                            currentTool.menuSeparator.hide();
                        }
                        currentTool.tool.show();
                        if (currentTool.menuTool) {
                            that._setToolValue(value, currentTool.tool, currentTool.type);
                        }
                        that._toolWidgets[j].minimized = false;
                        that._minimizedTools--;
                        if (that._minimizedTools === 0) {
                            that._minimizeButton.hide();
                        }
                        break;
                    }
                }
            }
        },

        // gets the value of a tool
        _getToolValue: function (tool, type) {
            var value;

            switch (type) {
                case 'button':
                case 'custom':
                    value = undefined;
                    break;
                case 'toggleButton':
                    var toggled = tool.hasClass('jqx-fill-state-pressed');
                    value = { text: tool.text(), toggled: toggled };
                    break;
                case 'dropdownlist':
                case 'combobox':
                    value = tool[this._toolToWidgetMapping[type]]('getSelectedIndex');
                    break;
                case 'input':
                    value = tool.val();
                    break;
            }

            return value;
        },

        // sets the value of a tool
        _setToolValue: function (value, tool, type) {
            if (value !== undefined) {
                switch (type) {
                    case 'button':
                    case 'custom':
                        break;
                    case 'toggleButton':
                        tool.text(value.text);
                        var toggled = tool.hasClass('jqx-fill-state-pressed');
                        if (toggled !== value.toggled) {
                            tool.jqxToggleButton('toggle');
                        }
                        break;
                    case 'dropdownlist':
                    case 'combobox':
                        value = tool[this._toolToWidgetMapping[type]]('selectIndex', value);
                        break;
                    case 'input':
                        tool.val(value);
                        break;
                }
            }
        },

        // restores changes made to the tools
        _restoreChanges: function () {
            var that = this;

            $.each(that._toolChanges, function (index, change) {
                if (change.action === 'addTool') {
                    that.addTool(change.type, change.position, change.separator, change.initCallback);
                } else if (change.action === 'destroyTool') {
                    that._destroyTool(change.index);
                } else if (change.action === 'disableTool') {
                    that.disableTool(change.index, change.disable);
                }
            });
        },

        // returns a jQuery selection of both the toolbar and minimized instances of a tool
        _getBothTools: function (toolObject) {
            var bothTools = toolObject.tool;
            if (toolObject.menuTool) {
                bothTools = bothTools.add(toolObject.menuTool);
            }
            return bothTools;
        }
    });
})(jqxBaseFramework);