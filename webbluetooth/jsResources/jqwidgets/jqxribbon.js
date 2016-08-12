/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxRibbon', '', {});

    $.extend($.jqx._jqxRibbon.prototype, {

        defineInstance: function () {
            var settings = {
                //// properties
                width: null,
                height: 'auto',
                mode: 'default', // possible values: 'default', 'popup'
                position: 'top', // possible values: 'top', 'bottom', 'left', 'right'
                selectedIndex: -1,
                selectionMode: 'click', // possible values: 'click', 'hover', 'none'
                popupCloseMode: 'click', // possible values: 'click', 'mouseLeave', 'none'
                animationType: 'fade', // possible values: 'fade', 'slide', 'none'
                animationDelay: 400,
                scrollPosition: 'both', // possible values: 'near', 'far', 'both'
                disabled: false,
                rtl: false,
                scrollStep: 10,
                scrollDelay: 30,
                reorder: false,
                initContent: null, // callback function
                _roundedCorners: true,
                _removeByDrag: false,

                //// events
                events: ['select', 'unselect', 'change', '_removeByDrag', 'reorder']
            };

            $.extend(true, this, settings);
        },

        createInstance: function () {
            var me = this;

            // browser-specific settings
            me._browser = $.jqx.browser;

            if (me.mode !== 'popup' && me.selectedIndex === -1) {
                me.selectedIndex = 0;
            }

            me._originalHTML = me.host.html();

            // renders the widget
            me._render(true);
        },

        //// methods

        // public methods

        // renders the widget
        render: function () {
            this._render();
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh !== true) {
                this._render();
            }
        },

        // destroys the widget
        destroy: function () {
            var me = this;

            me._removeHandlers();
            me.host.remove();
        },

        // selects an item
        selectAt: function (index) {
            this._selectAt(index);
        },

        // unselects the selected item and collapses its content
        clearSelection: function () {
            this._clearSelection();
        },

        // disables an item
        disableAt: function (index) {
            var me = this;

            me._items[index]._disabled = true;
            $(me._items[index]).addClass(me.toThemeProperty('jqx-fill-state-disabled'));

            if (index === me.selectedIndex) {
                me._clearSelection();
            }
        },

        // enables an item
        enableAt: function (index) {
            var me = this;

            me._items[index]._disabled = false;
            $(me._items[index]).removeClass(me.toThemeProperty('jqx-fill-state-disabled'));
        },

        // hides an item
        hideAt: function (index) {
            var me = this;

            $(me._items[index]).css('display', 'none');
            me._checkScrollButtons();

            if (index === me.selectedIndex) {
                me._clearSelection();
            } else {
                me._updatePositions();
            }
        },

        // shows an item
        showAt: function (index) {
            var me = this;

            if (me._orientation === 'horizontal') {
                $(me._items[index]).css('display', 'inline-block');
            } else {
                $(me._items[index]).css('display', 'inherit');
            }
            me._checkScrollButtons();
            me._updatePositions();
        },

        // sets or gets the selected index
        val: function (index) {
            var me = this;

            if (index) {
                me._selectAt(index);
            } else {
                return me.selectedIndex;
            }
        },

        // adds a new item
        addAt: function (index, data) {
            var me = this;

            me._removeHandlers();

            var newItemTitle = $('<li class="' + me.toThemeProperty('jqx-ribbon-item') + ' ' +
                me.toThemeProperty('jqx-ribbon-item-' + me.position) + '">' + data.title + '</li>');
            var newItemContent = $('<div class="' + me.toThemeProperty('jqx-widget-content') + ' ' + me.toThemeProperty('jqx-ribbon-content-section') + ' ' +
                me.toThemeProperty('jqx-ribbon-content-section-' + me.position) + '"></div>');
            newItemContent.append(data.content);
            switch (me.position) {
                case 'top':
                    newItemTitle.addClass(me.toThemeProperty('jqx-rc-t'));
                    newItemContent.addClass(me.toThemeProperty('jqx-rc-b'));
                    break;
                case 'bottom':
                    newItemTitle.addClass(me.toThemeProperty('jqx-rc-b'));
                    newItemContent.addClass(me.toThemeProperty('jqx-rc-t'));
                    break;
                case 'left':
                    newItemTitle.addClass(me.toThemeProperty('jqx-rc-l'));
                    newItemContent.addClass(me.toThemeProperty('jqx-rc-r'));
                    break;
                case 'right':
                    newItemTitle.addClass(me.toThemeProperty('jqx-rc-r'));
                    newItemContent.addClass(me.toThemeProperty('jqx-rc-l'));
                    break;
            }
            if (me.mode === 'popup') {
                newItemContent.addClass(me.toThemeProperty('jqx-ribbon-content-section-popup'));
                if (me._orientation === 'horizontal') {
                    newItemContent.addClass(me.toThemeProperty('jqx-ribbon-content-section-horizontal-popup'));
                } else {
                    newItemContent.addClass(me.toThemeProperty('jqx-ribbon-content-section-vertical-popup'));
                }
            }
            if (me.rtl === true) {
                newItemTitle.addClass(me.toThemeProperty('jqx-ribbon-item-rtl'));
            }

            if (me._items.length - 1 >= index) {
                $(me._items[index]).before(newItemTitle);
                $(me._contentSections[index]).before(newItemContent);
            } else {
                me._header.append(newItemTitle);
                me._content.append(newItemContent);
            }

            me._updateItems();
            me._addHandlers();
            me._checkScrollButtons();

            if (index <= me.selectedIndex) {
                me.selectedIndex++;
            }
            me._updatePositions();
            me._suppressSelectionEvents = true;
            me._selectAt(me.selectedIndex, me.selectedIndex, true);
        },

        // removes an item
        removeAt: function (index) {
            var me = this;
            if (index === me.selectedIndex) {
                me._clearSelection();
            }

            $(me._items[index]).add(me._contentSections[index]).remove();
            me._updateItems(true);
            me._updatePositions();
            me._checkScrollButtons();
        },

        // updates an item
        updateAt: function (index, newData) {
            var me = this;

            $(me._items[index]).html(newData.newTitle);
            $(me._contentSections[index]).html(newData.newContent);
            me._items[index]._isInitialized = false;
            if (me.initContent && index === me.selectedIndex) {
                me.initContent(index);
                me._items[index]._isInitialized = true;
            }
            me._updatePositions();
        },

        // sets the layout of an item's content if mode is set to "popup"
        setPopupLayout: function (index, layout, width, height) {
            var me = this;

            if (me.mode === 'popup') {
                if (!$(me._contentSections[index]).attr('data-width')) {
                    if ($(me._contentSections[index])[0].style.width) {
                        $(me._contentSections[index]).attr('data-width', $(me._contentSections[index])[0].style.width);
                    }
                    if ($(me._contentSections[index])[0].style.height) {
                        $(me._contentSections[index]).attr('data-height', $(me._contentSections[index])[0].style.height);
                    }
                }

                if (width) {
                    $(me._contentSections[index]).css('width', width);
                }
                if (height) {
                    $(me._contentSections[index]).css('height', height);
                }
                me._contentSections[index]._layout = layout;
                me._positionContent(index);
            }
        },

        propertiesChangedHandler: function (object, oldValues, newValues)
        {
            if (newValues && newValues.width && newValues.height && Object.keys(newValues).length == 2)
            {
                object.host.css(key, value);
                object._updateSize();
            }
        },

        // private methods

        // called when a property is changed
        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (object.batchUpdate && object.batchUpdate.width && object.batchUpdate.height && Object.keys(object.batchUpdate).length == 2)
            {
                return;
            }

            if (value !== oldvalue)
            {
                switch (key) {
                    case 'width':
                    case 'height':
                        object.host.css(key, value);
                        object._updateSize();
                        break;
                    case 'position':
                        object._render();
                        break;
                    case 'mode':
                        object._content.width('auto');
                        object._removeHandlers(null, oldvalue);
                        object._render();
                        break;
                    case 'selectedIndex':
                        object._selectAt(value, oldvalue);
                        break;
                    case 'selectionMode':
                        object._removeHandlers(oldvalue);
                        object._addHandlers();
                        break;
                    case 'scrollPosition':
                        object._scrollButtons.removeClass(object.toThemeProperty('jqx-ribbon-scrollbutton-' + oldvalue));
                        object._scrollButtons.addClass(object.toThemeProperty('jqx-ribbon-scrollbutton-' + value));
                        var scrollButtonNear = $(object._scrollButtons[0]);
                        var scrollButtonFar = $(object._scrollButtons[1]);
                        object._scrollButtons.removeClass(object.toThemeProperty('jqx-rc-tr'));
                        object._scrollButtons.removeClass(object.toThemeProperty('jqx-rc-bl'));
                        scrollButtonNear.removeClass(object.toThemeProperty('jqx-rc-tl'));
                        scrollButtonFar.removeClass(object.toThemeProperty('jqx-rc-br'));
                        object._scrollButtonRc(scrollButtonNear, scrollButtonFar);
                        object._checkScrollButtons();
                        object._updatePositions();
                        break;
                    case 'disabled':
                        if (value === true) {
                            object._removeHandlers();
                            object.host.addClass(object.toThemeProperty('jqx-fill-state-disabled'));
                        } else {
                            object.host.removeClass(object.toThemeProperty('jqx-fill-state-disabled'));
                            object._addHandlers();
                        }
                        break;
                    case 'theme':
                        $.jqx.utilities.setTheme(oldvalue, value, object.host);
                        break;
                    case 'rtl':
                        if (value === true) {
                            object._header.addClass(object.toThemeProperty('jqx-ribbon-header-rtl'));
                            object._items.addClass(object.toThemeProperty('jqx-ribbon-item-rtl'));
                        } else {
                            object._header.removeClass(object.toThemeProperty('jqx-ribbon-header-rtl'));
                            object._items.removeClass(object.toThemeProperty('jqx-ribbon-item-rtl'));
                        }
                        object._positionSelectionToken(object.selectedIndex);
                        break;
                }
            }
        },

        // raises an event
        _raiseEvent: function (id, args) {
            var evt = this.events[id];
            var event = new $.Event(evt);
            event.owner = this;
            event.args = args;

            var result;

            try {
                result = this.host.trigger(event);
            }
            catch (error) {
            }

            return result;
        },

        // renders the widget
        _render: function (initialization) {
            var me = this;

            if (initialization !== true) {
                me._removeHandlers();
                //        me.host.html(me._originalHTML);
            }

            me._selectionTokenOffsetY = 0;
            switch (me._browser.browser) {
                case 'mozilla':
                    me._browserWidthRtlFlag = 0;
                    me._browserScrollRtlFlag = 1;
                    me._selectionTokenOffsetX = 1;
                    break;
                case 'msie':
                    me._browserWidthRtlFlag = 0;
                    me._browserScrollRtlFlag = -1;
                    if (me._browser.version === '8.0') {
                        me._selectionTokenOffsetX = 1;
                    } else if (me._browser.version === '7.0') {
                        me._selectionTokenOffsetX = 0;
                        if (me.mode === 'popup' && (me.position === 'bottom' || me.position === 'right')) {
                            me._selectionTokenOffsetY = 2;
                        }
                    } else {
                        me._selectionTokenOffsetX = 0;
                    }
                    break;
                default:
                    me._browserWidthRtlFlag = 1;
                    me._browserScrollRtlFlag = 1;
                    me._selectionTokenOffsetX = 0;
            }

            if (initialization === true) {
                var children = me.host.children();
                me._header = $(children[0]);
                me._content = $(children[1]);
                // checks if the widget's HTML structure is correct
                me._checkStructure(children);
            }

            me._header.css('float', 'none');
            me._content.css('padding', '0px');
            me.host.width(me.width);
            me.host.height(me.height);

            if (me.position === 'bottom' || me.position === 'right') {
                me._content.after(me._header); // changes the places of the header and content in the DOM
            }

            if (me.position === 'top' || me.position === 'bottom') {
                me._orientation = 'horizontal';
            } else {
                me._orientation = 'vertical';
            }
            if (me.position === 'right') {
                me._header.css('float', 'right');
            }
            else if (me.position === 'left') {
                me._header.css('float', 'left');
            }

            me._contentSections = me._content.children();

            $.each(me._contentSections, function () {
                if ($(this).attr('data-width') !== undefined) {
                    $(this).css('width', $(this).attr('data-width'));
                    $(this).css('height', $(this).attr('data-height'));
                    $(this).removeAttr('data-width');
                    $(this).removeAttr('data-height');
                }
            });

            if (initialization === true) {
                me._selectionToken = $('<div class="' + me.toThemeProperty('jqx-ribbon-selection-token') + ' ' + me.toThemeProperty('jqx-ribbon-selection-token-' + me.position) + ' ' + me.toThemeProperty('jqx-widget-content') + '"></div>');
                me.host.append(me._selectionToken);
            }
            // makes a jQuery selection of all items and their content and sets their indexes
            me._updateItems();

            // adds the required CSS classes to the widget's elements
            me._addClasses();

            if (initialization === true) {
                // appends scroll buttons
                me._appendScrollButtons();
                me._checkScrollButtons();
            }
            me._allowSelection = true;

            // display initial item
            if (me.selectedIndex !== -1) {
                $(me._items[me.selectedIndex]).addClass(me.toThemeProperty('jqx-widget-content')).addClass(me.toThemeProperty('jqx-ribbon-item-selected'));
                me._positionSelectionToken(me.selectedIndex);
                $(me._contentSections[me.selectedIndex]).css('display', 'block');
                if (me.initContent) {
                    me.initContent(me.selectedIndex);
                    me._items[me.selectedIndex]._isInitialized = true;
                }
            }

            if (!me.disabled) {
                // adds event handlers
                me._addHandlers();
            } else {
                me.host.addClass(me.toThemeProperty('jqx-fill-state-disabled'));
            }

            $.jqx.utilities.resize(me.host, function () {
                me._updateSize();
            });
        },

        _updateSize: function () {
            var me = this;
            if (me._browser.version === '7.0' && me._browser.browser === 'msie') {
                if (me._orientation === 'horizontal') {
                    me._header.css('width', (me.host.width() - parseInt(me._header.css('padding-left'), 10) - parseInt(me._header.css('padding-right'), 10) - parseInt(me._header.css('border-left-width'), 10) - parseInt(me._header.css('border-right-width'), 10)));
                    me._contentSections.width(me._content.width() - parseInt(me._contentSections.css('border-left-width'), 10) - parseInt(me._contentSections.css('border-right-width'), 10) - parseInt(me._contentSections.css('padding-left'), 10) - parseInt(me._contentSections.css('padding-right'), 10));
                    if (me.mode === 'default' && typeof me.height === 'string' && me.height.indexOf('%') !== -1) {
                        me._contentSections.height(me._content.height() - me._header.height() - parseInt(me._contentSections.css('border-bottom-width'), 10) - parseInt(me._contentSections.css('border-top-width'), 10) - 1);
                    }
                } else {
                    me._header.css('height', (me.host.height() - parseInt(me._header.css('padding-top'), 10) - parseInt(me._header.css('padding-bottom'), 10) - parseInt(me._header.css('border-top-width'), 10) - parseInt(me._header.css('border-bottom-width'), 10)));
                    me._contentSections.height(me._content.height() - parseInt(me._contentSections.css('border-top-width'), 10) - parseInt(me._contentSections.css('border-bottom-width'), 10) - parseInt(me._contentSections.css('padding-top'), 10) - parseInt(me._contentSections.css('padding-bottom'), 10));
                    if (me.mode === 'default' && typeof me.width === 'string' && me.height.indexOf('%') !== -1) {
                        var borders = me.position === 'left' ? parseInt(me._contentSections.css('border-left-width'), 10) + parseInt(me._contentSections.css('border-right-width'), 10) + 1 : 0;
                        me._contentSections.width(me._content.width() - me._header.width() - borders);
                    }
                }
            }
            me._checkScrollButtons(true);
            me._updatePositions();
            if (me.mode === 'popup') {
                me._positionPopup();
            }
        },

        _stopAnimation: function () {
            var me = this;

            if (!me._allowSelection) {
                me.selectedIndex = me._animatingIndex;
                $(me._contentSections[me._animatingIndex]).finish();
                me._clearSelection(true, me._animatingIndex);
                me._allowSelection = true;
            }
        },

        // selects an item
        _selectAt: function (index, oldIndex, suppressCheck) {
            var me = this;

            if (oldIndex === undefined) {
                oldIndex = me.selectedIndex;
            }

            if (index !== oldIndex || suppressCheck === true) {
                me._stopAnimation();

                if (me._allowSelection) {
                    me._animatingIndex = index;
                    me._clearSelection(true, oldIndex);
                    me._allowSelection = false;
                    me._selecting = index;

                    if (me.selectionMode === 'click') {
                        $(me._items[index]).removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                        $(me._items[index]).removeClass(me.toThemeProperty('jqx-ribbon-item-hover'));
                    }

                    if (me.mode === 'popup' && me._roundedCorners) {
                        me._header.removeClass(me.toThemeProperty('jqx-rc-all'));
                        switch (me.position) {
                            case 'top':
                                me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-t'));
                                me._contentSections.addClass(me.toThemeProperty('jqx-rc-b'));
                                break;
                            case 'bottom':
                                me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-b'));
                                me._contentSections.addClass(me.toThemeProperty('jqx-rc-t'));
                                break;
                            case 'left':
                                me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-l'));
                                me._contentSections.addClass(me.toThemeProperty('jqx-rc-r'));
                                break;
                            case 'right':
                                me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-r'));
                                me._contentSections.addClass(me.toThemeProperty('jqx-rc-l'));
                                break;
                        }
                    }

                    $(me._items[index]).addClass(me.toThemeProperty('jqx-widget-content')).addClass(me.toThemeProperty('jqx-ribbon-item-selected'));
                    me._selectionToken.css('display', 'block');
                    me._updatePositions(index);

                    switch (me.animationType) {
                        case 'fade':
                            $(me._contentSections[index]).fadeToggle(me.animationDelay, function () {
                                me._animationComplete(index, oldIndex);
                            });
                            break;
                        case 'slide':
                            var direction = me.position;
                            if (direction === 'top') {
                                direction = 'up';
                            } else if (direction === 'bottom') {
                                direction = 'down';
                            }
                            me.slideAnimation = me._slide($(me._contentSections[index]), { mode: 'show', direction: direction, duration: me.animationDelay }, index, oldIndex);
                            break;
                        case 'none':
                            $(me._contentSections[index]).css('display', 'block');
                            me._animationComplete(index, oldIndex);
                            break;
                    }
                } else {
                    // TO DO - when a new item is selected before the animation of the previous one is completed
                    //                    $(me._contentSections[oldIndex]).stop().css('display', 'none');
                    //                    me._animationComplete(index, oldIndex);
                    //                    me._selectAt(index);
                }
            }
        },

        // unselects the selected item and collapses its content
        _clearSelection: function (fromSelection, oldIndex) {
            var me = this;
            if (me.mode === 'popup') {
                if (me._roundedCorners) {
                    me._header.addClass(me.toThemeProperty('jqx-rc-all'));
                }
            }
            me._selecting = -1;

            if (oldIndex === undefined) {
                oldIndex = me.selectedIndex;
            }

            $(me._items[oldIndex]).removeClass(me.toThemeProperty('jqx-widget-content')).removeClass(me.toThemeProperty('jqx-ribbon-item-selected'));
            me._selectionToken.css('display', 'none');

            if (fromSelection !== true && me.animationType !== 'none') {
                if (me.animationType === 'fade') {
                    $(me._contentSections[oldIndex]).fadeOut(me.animationDelay, function () {
                        me._clearSelectionComplete(oldIndex);
                    });
                } else if (me.animationType === 'slide') {
                    var direction = me.position;
                    if (direction === 'top') {
                        direction = 'up';
                    } else if (direction === 'bottom') {
                        direction = 'down';
                    }
                    me._stopAnimation();
                    oldIndex = me.selectedIndex;
                    me.slideAnimation = me._slide($(me._contentSections[oldIndex]), { mode: 'hide', direction: direction, duration: me.animationDelay }, oldIndex);
                    me.selectedIndex = -1;
                }
            } else {
                $(me._contentSections[oldIndex]).css('display', 'none');
                me._clearSelectionComplete(oldIndex, fromSelection);
            }
        },

        // adds event handlers
        _addHandlers: function () {
            var me = this,
                id = me.element.id;

            var closeOnClick = function (event) {
                if (me.popupCloseMode === 'click' && me.mode === 'popup') {
                    if (event.target.tagName === 'svg') { // fix for when jqxChart inside jqxRibbon is clicked
                        return;
                    }

                    var closestRibbon = $(event.target).closest('.jqx-ribbon');
                    if (closestRibbon.length > 0 && closestRibbon.attr('id') !== id) { // clicked in another jqxRibbon
                        me._clearSelection();
                        return;
                    }

                    if (event.target.className.indexOf('jqx-ribbon-content-popup') !== -1) {
                        me._clearSelection();
                        return;
                    }

                    if ($(event.target).ischildof(me.host)) {
                        return;
                    }
                    var isPopup = false;
                    $.each($(event.target).parents(), function () {
                        if (this.className !== undefined) {
                            if (this.className.indexOf) {
                                if (this.className.indexOf('jqx-ribbon') !== -1) {
                                    isPopup = true;
                                    return false;
                                }
                                if (this.className.indexOf('jqx-ribbon') !== -1) {
                                    if (id === this.id) {
                                        isPopup = true;
                                    }
                                    return false;
                                }
                            }
                        }
                    });
                    if (!isPopup) {
                        me._clearSelection();
                    }
                }
            };

            if (me.selectionMode === 'click') {
                me.addHandler(me._items, 'click.ribbon' + id, function (event) {
                    var target = $(event.target).closest('li')[0],
                        index = target._index;

                    if (!me._items[index]._disabled) {
                        if (index !== me.selectedIndex) {
                            me._selectAt(index);
                        } else if (me.mode === 'popup') {
                            if (me.popupCloseMode !== 'none') {
                                $(target).addClass(me.toThemeProperty('jqx-fill-state-hover'));
                                $(target).addClass(me.toThemeProperty('jqx-ribbon-item-hover'));
                                me._clearSelection();
                            }
                        }
                    }
                });

                var condition = function (index) {
                    return ((me._selecting !== index && me._allowSelection === false) || ((me._selecting === -1 || me.selectedIndex !== index) && me._allowSelection === true)) && !me._items[index]._disabled;
                };

                me.addHandler(me._items, 'mouseenter.ribbon' + id, function (event) {
                    var target = $(event.target).closest('li')[0];
                    if (condition(target._index)) {
                        $(target).addClass(me.toThemeProperty('jqx-fill-state-hover'));
                        $(target).addClass(me.toThemeProperty('jqx-ribbon-item-hover'));
                    }
                });

                me.addHandler(me._items, 'mouseleave.ribbon' + id, function (event) {
                    var target = $(event.target).closest('li')[0];
                    if (condition(target._index)) {
                        $(target).removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                        $(target).removeClass(me.toThemeProperty('jqx-ribbon-item-hover'));
                    }
                });
                if (me.mode === 'popup') {
                    me.addHandler(me.host, 'mouseleave.ribbon' + id, function () {
                        if (me.popupCloseMode === 'mouseLeave' && me.mode === 'popup') {
                            me._clearSelection();
                        }
                    });
                    me.addHandler(me._contentSections, 'mouseleave.ribbon' + id, function () {
                        if (me.popupCloseMode === 'mouseLeave' && me.mode === 'popup') {
                            me._clearSelection();
                        }
                    });
                    me.addHandler($(document), 'mousedown.ribbon' + id, function (event) {
                        closeOnClick(event);
                    });
                }

                // reorder- and _removeByDrag-related

                var clickedToDrag = false,
                    draggedIndex;

                if (me._removeByDrag === true) {
                    me._items.addClass(me.toThemeProperty('jqx-ribbon-item-docking-layout'));
                }

                me.addHandler(me._items, 'mousedown.ribbon' + id, function (event) {
                    var target = $(event.target).closest('li')[0];
                    if ((me.reorder === true || me._removeByDrag === true) && target._index === me.selectedIndex) {
                        clickedToDrag = true;
                        draggedIndex = target._index;
                        target.style.cursor = 'move';
                    }
                });

                me.addHandler(me.host, 'mouseup.ribbon' + id, function () {
                    clickedToDrag = false;
                    me._items.css('cursor', '');
                });

                me.addHandler(me._items, 'mouseenter.ribbon' + id, function (event) {
                    if (me.reorder === true && clickedToDrag === true) {
                        var draggedToIndex = $(event.target).closest('li')[0]._index,
                            draggedTitle = $(me._items[draggedIndex]).html(),
                            draggedContent = $(me._contentSections[draggedIndex]).contents().detach();

                        me._suppressSelectionEvents = true;
                        me._oldReorderIndex = draggedIndex;
                        me.removeAt(draggedIndex);
                        me.clearSelection();
                        me.addAt(draggedToIndex, { title: draggedTitle, content: draggedContent });
                        me.selectAt(draggedToIndex);

                        setTimeout(function () {
                            $(me._items[draggedToIndex]).mousedown();
                        }, 0);
                    }
                });

                me.addHandler(me._header, 'mouseleave.ribbon' + id, function (event) {
                    if (me._removeByDrag === true && clickedToDrag === true) {
                        me._raiseEvent('3', { draggedIndex: draggedIndex, x: event.pageX, y: event.pageY }); // _removeByDrag event (not public; for use in jqxDockingLayout)
                        if (me._items.length > 1) {
                            me.removeAt(draggedIndex);
                        }
                        clickedToDrag = false;
                        event.target.style.cursor = '';
                    }
                });
            } else if (me.selectionMode === 'hover') {
                me.addHandler(me._items, 'mouseenter.ribbon' + id, function (event) {
                    var index = $(event.target).closest('li')[0]._index;
                    if (!me._items[index]._disabled && index !== me.selectedIndex) {
                        me._selectAt(index);
                    }
                });
                if (me.mode === 'popup') {
                    me.addHandler(me.host, 'mouseleave.ribbon' + id, function () {
                        if (me.popupCloseMode === 'mouseLeave' && me.mode === 'popup') {
                            me._clearSelection();
                        }
                    });
                    me.addHandler(me._contentSections, 'mouseleave.ribbon' + id, function () {
                        if (me.popupCloseMode === 'mouseLeave' && me.mode === 'popup') {
                            me._clearSelection();
                        }
                    });
                    me.addHandler($(document), 'mousedown.ribbon' + id, function (event) {
                        closeOnClick(event);
                    });
                    me.addHandler(me._items, 'click.ribbon' + id, function (event) {
                        var index = $(event.target).closest('li')[0]._index;
                        if (!me._items[index]._disabled) {
                            if (me.mode === 'popup') {
                                if (me.popupCloseMode !== 'none') {
                                    me._clearSelection();
                                }
                            }
                        }
                    });
                }
            }

            var rtl = (me.rtl && me._browser.browser === 'msie') ? -1 : 1; // a fix for direction: rtl in Internet Explorer
            var scrollButtonNear = $(me._scrollButtons[0]);
            me.addHandler(scrollButtonNear, 'mousedown.ribbon' + id, function () {
                if (me._orientation === 'horizontal') {
                    me._timeoutNear = setInterval(function () {
                        var scrollLeft = me._header.scrollLeft();
                        me._header.scrollLeft(scrollLeft - me.scrollStep * rtl);
                        me._updatePositions();
                    }, me.scrollDelay);
                } else {
                    me._timeoutNear = setInterval(function () {
                        var scrollTop = me._header.scrollTop();
                        me._header.scrollTop(scrollTop - me.scrollStep);
                        me._updatePositions();
                    }, me.scrollDelay);
                }
                return false;
            });
            me.addHandler(scrollButtonNear, 'mouseup.ribbon' + id, function () {
                clearInterval(me._timeoutNear);
            });

            var scrollButtonFar = $(me._scrollButtons[1]);
            me.addHandler(scrollButtonFar, 'mousedown.ribbon' + id, function () {
                if (me._orientation === 'horizontal') {
                    me._timeoutFar = setInterval(function () {
                        var scrollLeft = me._header.scrollLeft();
                        me._header.scrollLeft(scrollLeft + me.scrollStep * rtl);
                        me._updatePositions();
                    }, me.scrollDelay);
                } else {
                    me._timeoutFar = setInterval(function () {
                        var scrollTop = me._header.scrollTop();
                        me._header.scrollTop(scrollTop + me.scrollStep);
                        me._updatePositions();
                    }, me.scrollDelay);
                }
                return false;
            });
            me.addHandler(scrollButtonFar, 'mouseup.ribbon' + id, function () {
                clearInterval(me._timeoutFar);
            });
        },

        // removes event handlers
        _removeHandlers: function (selectionMode, mode) {
            var me = this,
                id = me.element.id;

            if (!selectionMode) {
                selectionMode = me.selectionMode;
            }

            if (!mode) {
                mode = me.mode;
            }

            me.removeHandler(me._items, 'mouseenter.ribbon' + id);
            if (selectionMode === 'click') {
                me.removeHandler(me._items, 'click.ribbon' + id);
                me.removeHandler(me._items, 'mouseleave.ribbon' + id);
                me.removeHandler(me._items, 'mousedown.ribbon' + id);
                me.removeHandler(me.host, 'mouseup.ribbon' + id);
                me.removeHandler(me._header, 'mouseleave.ribbon' + id);
            } else if (selectionMode === 'hover') {
                if (mode === 'popup') {
                    me.removeHandler(me.host, 'mouseleave.ribbon' + id);
                }
            }

            var scrollButtonNear = $(me._scrollButtons[0]);
            me.removeHandler(scrollButtonNear, 'mousedown.ribbon' + id);
            me.removeHandler(scrollButtonNear, 'mouseup.ribbon' + id);
            var scrollButtonFar = $(me._scrollButtons[1]);
            me.removeHandler(scrollButtonFar, 'mousedown.ribbon' + id);
            me.removeHandler(scrollButtonFar, 'mouseup.ribbon' + id);
        },

        // checks if the widget's HTML structure is correct
        _checkStructure: function (children) {
            var me = this;

            var childrenNumber = children.length;
            if (childrenNumber !== 2) {
                throw new Error('jqxRibbon: Invalid HTML structure. You need to add a ul and a div to the widget container.');
            }

            var itemsNumber = me._header.children().length;
            var contentSectionsNumber = me._content.children().length;
            if (itemsNumber !== contentSectionsNumber) {
                throw new Error('jqxRibbon: Invalid HTML structure. For each list item you must have a corresponding div element.');
            }
        },

        // adds the required CSS classes to the widget's elements
        _addClasses: function () {
            var me = this;
            me._contentSections.removeClass();
            me._content.removeClass();
            me._header.removeClass(me.toThemeProperty('jqx-rc-all jqx-widget-header jqx-disableselect jqx-rc-t jqx-rc-b jqx-rc-l jqx-rc-r jqx-rc-all jqx-ribbon-header-' + me._orientation + '-popup jqx-ribbon-header-bottom jqx-ribbon-header-auto jqx-ribbon-header-right jqx-ribbon-header-rtl'));
            me._items.removeClass(me.toThemeProperty('jqx-fill-state-disabled jqx-ribbon-item-rtl jqx-widget-content jqx-ribbon-item-selected jqx-rc-t jqx-rc-b jqx-rc-l jqx-rc-r jqx-ribbon-item-docking-layout jqx-ribbon-item jqx-ribbon-item-' + me.position));
            me.host.removeClass();

            me.host.addClass(me.toThemeProperty('jqx-widget') + ' ' + me.toThemeProperty('jqx-ribbon'));
            me._header.addClass(me.toThemeProperty('jqx-widget-header') + ' ' + me.toThemeProperty('jqx-disableselect') + ' ' +
                me.toThemeProperty('jqx-ribbon-header') + ' ' + me.toThemeProperty('jqx-ribbon-header-' + me._orientation));
            me._items.addClass(me.toThemeProperty('jqx-ribbon-item') + ' ' + me.toThemeProperty('jqx-ribbon-item-' + me.position));
            me._content.addClass(me.toThemeProperty('jqx-widget-content') + ' ' + me.toThemeProperty('jqx-ribbon-content') + ' ' +
                me.toThemeProperty('jqx-ribbon-content-' + me._orientation));
            me._contentSections.addClass(me.toThemeProperty('jqx-widget-content') + ' ' + me.toThemeProperty('jqx-ribbon-content-section') + ' ' +
                me.toThemeProperty('jqx-ribbon-content-section-' + me.position));

            if (me._roundedCorners) {
                switch (me.position) {
                    case 'top':
                        me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-t'));
                        me._contentSections.addClass(me.toThemeProperty('jqx-rc-b'));
                        break;
                    case 'bottom':
                        me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-b'));
                        me._contentSections.addClass(me.toThemeProperty('jqx-rc-t'));
                        break;
                    case 'left':
                        me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-l'));
                        me._contentSections.addClass(me.toThemeProperty('jqx-rc-r'));
                        break;
                    case 'right':
                        me._header.add(me._items).addClass(me.toThemeProperty('jqx-rc-r'));
                        me._contentSections.addClass(me.toThemeProperty('jqx-rc-l'));
                        break;
                }
            }
            else {
                switch (me.position) {
                    case 'top':
                        me._items.addClass(me.toThemeProperty('jqx-rc-t'));
                        break;
                    case 'bottom':
                        me._items.addClass(me.toThemeProperty('jqx-rc-b'));
                        break;
                    case 'left':
                        me._items.addClass(me.toThemeProperty('jqx-rc-l'));
                        break;
                    case 'right':
                        me._items.addClass(me.toThemeProperty('jqx-rc-r'));
                        break;
                }
            }

            var headerWidth, headerHeight;

            if (me.mode === 'popup') {
                if (me.selectedIndex === -1) {
                    if (me._roundedCorners) {
                        me.host.addClass(me.toThemeProperty('jqx-rc-all'));
                        me._header.addClass(me.toThemeProperty('jqx-rc-all'));
                    }
                }
                me.host.addClass(me.toThemeProperty('jqx-ribbon-popup'));
                me._header.addClass(me.toThemeProperty('jqx-ribbon-header-' + me._orientation + '-popup'));
                me._content.addClass(me.toThemeProperty('jqx-ribbon-content-popup'));
                me._contentSections.addClass(me.toThemeProperty('jqx-ribbon-content-section-popup'));
                me._contentSections.addClass(me.toThemeProperty('jqx-ribbon-content-popup-' + me.position));
                if (me._orientation === 'horizontal') {
                    me._contentSections.addClass(me.toThemeProperty('jqx-ribbon-content-section-horizontal-popup'));
                } else {
                    me._contentSections.addClass(me.toThemeProperty('jqx-ribbon-content-section-vertical-popup'));
                }
                me._positionPopup();
            } else {
                if (me._orientation === 'horizontal') {
                    if (me.height !== 'auto') {
                        headerHeight = me._header.outerHeight();
                        if (me.position === 'top') {
                            me._content.css('padding-top', headerHeight);
                        } else {
                            me._header.addClass(me.toThemeProperty('jqx-ribbon-header-bottom'));
                            me._content.css('padding-bottom', headerHeight);
                        }
                    } else {
                        me._header.addClass(me.toThemeProperty('jqx-ribbon-header-auto'));
                    }
                } else if (me._orientation === 'vertical') {
                    if (me.width !== 'auto') {
                        headerWidth = me._header.outerWidth();
                        if (me.position === 'left') {
                            me._content.css('padding-left', headerWidth);
                        } else {
                            me._header.addClass(me.toThemeProperty('jqx-ribbon-header-right'));
                            me._content.css('padding-right', headerWidth);
                        }
                    } else {
                        me.host.addClass(me.toThemeProperty('jqx-ribbon-auto'));
                        me._header.addClass(me.toThemeProperty('jqx-ribbon-header-auto'));
                        me._content.addClass(me.toThemeProperty('jqx-ribbon-content-auto-width'));
                    }
                }
            }

            // Internet Explorer 7 fix
            if (me._browser.version === '7.0' && me._browser.browser === 'msie') {
                if (me._orientation === 'horizontal') {
                    me._header.css('width', (me.host.width() - parseInt(me._header.css('padding-left'), 10) - parseInt(me._header.css('padding-right'), 10) - parseInt(me._header.css('border-left-width'), 10) - parseInt(me._header.css('border-right-width'), 10)));
                    me._items.height(me._items.height() - parseInt(me._items.css('padding-top'), 10) - parseInt(me._items.css('padding-bottom'), 10) - parseInt(me._items.css('border-top-width'), 10) - parseInt(me._items.css('border-bottom-width'), 10));
                    me._contentSections.width(me._contentSections.width() - parseInt(me._contentSections.css('border-left-width'), 10) - parseInt(me._contentSections.css('border-right-width'), 10) - parseInt(me._contentSections.css('padding-left'), 10) - parseInt(me._contentSections.css('padding-right'), 10));
                    if (me.mode === 'default') {
                        if (me.height !== 'auto') {
                            if (me.position === 'top') {
                                me._contentSections.css('padding-top', headerHeight);
                            } else {
                                me._contentSections.css('padding-bottom', headerHeight);
                            }
                            me._content.css('height', me.host.height() + 2);
                            me._contentSections.css('height', me._content.height() - parseInt(me._contentSections.css('border-bottom-width'), 10) - parseInt(me._contentSections.css('border-top-width'), 10) - 1);
                        }
                    } else {

                    }
                } else {
                    var borders;
                    if (me.position === 'left') {
                        me._content.addClass(me.toThemeProperty('jqx-ribbon-content-left'));
                        borders = parseInt(me._contentSections.css('border-left-width'), 10) + parseInt(me._contentSections.css('border-right-width'), 10) + 1;
                    } else {
                        me._content.addClass(me.toThemeProperty('jqx-ribbon-content-right'));
                        borders = 0;
                    }
                    me._header.css('height', (me.host.height() - parseInt(me._header.css('padding-top'), 10) - parseInt(me._header.css('padding-bottom'), 10) - parseInt(me._header.css('border-top-width'), 10) - parseInt(me._header.css('border-bottom-width'), 10)));
                    me._items.width(me._items.width() - parseInt(me._items.css('padding-left'), 10) - parseInt(me._items.css('padding-right'), 10) - parseInt(me._items.css('border-left-width'), 10) - parseInt(me._items.css('border-right-width'), 10));
                    me._contentSections.height(me._contentSections.height() - parseInt(me._contentSections.css('border-top-width'), 10) - parseInt(me._contentSections.css('border-bottom-width'), 10) - parseInt(me._contentSections.css('padding-top'), 10) - parseInt(me._contentSections.css('padding-bottom'), 10));
                    if (me.mode === 'default') {
                        if (me.width !== 'auto') {
                            if (me.position === 'left') {
                                me._contentSections.css('padding-left', headerWidth);
                            } else {
                                me._contentSections.css('padding-right', headerWidth);
                            }
                            me._contentSections.width(me._content.width() - me._header.width() - borders);
                        }
                    } else {

                    }
                }
            }

            if (me.rtl === true) {
                me._header.addClass(me.toThemeProperty('jqx-ribbon-header-rtl'));
                me._items.addClass(me.toThemeProperty('jqx-ribbon-item-rtl'));
            }
        },

        // positions the content when mode is set to "popup"
        _positionPopup: function () {
            var me = this;

            var ie7 = (me._browser.version === '7.0' && me._browser.browser === 'msie');

            switch (me.position) {
                case 'top':
                    me._content.css('top', me._header.outerHeight());
                    break;
                case 'bottom':
                    if (!ie7) {
                        me._content.css('bottom', me._header.outerHeight());
                    } else {
                        me._content.css('bottom', me._header.height());
                    }
                    break;
                case 'left':
                    me._content.css('left', me._header.outerWidth());
                    break;
                case 'right':
                    me._content.css('right', me._header.outerWidth());
                    if (ie7) {
                        var contentSections = me._content.children();
                        for (var i = 0; i < contentSections.length; i++) {
                            var current = $(contentSections[i]);
                            current.css('right', current.outerWidth());
                        }
                    }
                    break;
            }
        },

        // appends scroll buttons
        _appendScrollButtons: function () {
            var me = this;

            var htmlString = '<div class="' + me.toThemeProperty('jqx-ribbon-scrollbutton') + ' ' + me.toThemeProperty('jqx-ribbon-scrollbutton-' + me.position) +
                ' ' + me.toThemeProperty('jqx-ribbon-scrollbutton-' + me.scrollPosition) + ' ' + me.toThemeProperty('jqx-widget-header') +
                '"><div class="' + me.toThemeProperty('jqx-ribbon-scrollbutton-inner') + '"></div></div>';

            var scrollButtonNear = $(htmlString);
            var scrollButtonFar = $(htmlString);
            var arrowDirection = (me._orientation === 'horizontal') ? ['left', 'right'] : ['up', 'down'];
            scrollButtonNear.find('.jqx-ribbon-scrollbutton-inner').addClass(me.toThemeProperty('jqx-icon-arrow-' + arrowDirection[0]));
            scrollButtonFar.find('.jqx-ribbon-scrollbutton-inner').addClass(me.toThemeProperty('jqx-icon-arrow-' + arrowDirection[1]));

            scrollButtonNear.addClass(me.toThemeProperty('jqx-ribbon-scrollbutton-lt'));
            scrollButtonFar.addClass(me.toThemeProperty('jqx-ribbon-scrollbutton-rb'));
            me._scrollButtons = scrollButtonNear.add(scrollButtonFar);
            me.host.append(me._scrollButtons);

            if (me._orientation === 'horizontal') {
                me._scrollButtons.height(me._header.height());
            } else {
                me._scrollButtons.width(me._header.width());
            }

            me._scrollButtonRc(scrollButtonNear, scrollButtonFar);

            if (!me.roundedCorners) {
                return;
            }

            switch (me.position) {
                case 'top':
                case 'bottom':
                    scrollButtonNear.css('margin-left', '-1px');
                    scrollButtonFar.css('margin-right', '-1px');
                    break;
                case 'right':
                case 'left':
                    scrollButtonNear.css('margin-top', '-1px');
                    scrollButtonFar.css('margin-bottom', '-1px');
                    break;
            }
        },

        // applies rounded corners to scroll buttons
        _scrollButtonRc: function (scrollButtonNear, scrollButtonFar) {
            var me = this;
            if (!me.roundedCorners) {
                return;
            }

            switch (me.position) {
                case 'top':
                    if (me.scrollPosition !== 'far') {
                        scrollButtonNear.addClass(me.toThemeProperty('jqx-rc-tl'));
                    }
                    if (me.scrollPosition !== 'near') {
                        scrollButtonFar.addClass(me.toThemeProperty('jqx-rc-tr'));
                    }
                    break;
                case 'bottom':
                    if (me.scrollPosition !== 'far') {
                        scrollButtonNear.addClass(me.toThemeProperty('jqx-rc-bl'));
                    }
                    if (me.scrollPosition !== 'near') {
                        scrollButtonFar.addClass(me.toThemeProperty('jqx-rc-br'));
                    }
                    break;
                case 'left':
                    if (me.scrollPosition !== 'far') {
                        scrollButtonNear.addClass(me.toThemeProperty('jqx-rc-tl'));
                    }
                    if (me.scrollPosition !== 'near') {
                        scrollButtonFar.addClass(me.toThemeProperty('jqx-rc-bl'));
                    }
                    break;
                case 'right':
                    if (me.scrollPosition !== 'far') {
                        scrollButtonNear.addClass(me.toThemeProperty('jqx-rc-tr'));
                    }
                    if (me.scrollPosition !== 'near') {
                        scrollButtonFar.addClass(me.toThemeProperty('jqx-rc-br'));
                    }
                    break;
            }
        },

        // makes or updates a jQuery selection of all items and their content and sets their indexes
        _updateItems: function (removeAt) {
            function checkSelectedIndex() {
                if (me._items[i]._index === me.selectedIndex) {
                    me.selectedIndex = i;
                }
            }
            var me = this;

            me._items = me._header.children();
            me._items.attr('unselectable', 'on');

            me._contentSections = me._content.children();

            for (var i = 0; i < me._items.length; i++) {
                if (me._items[i]._index === undefined) {
                    me._items[i]._disabled = false;
                    me._items[i]._isInitialized = false;
                    me._contentSections[i]._layout = 'default';
                }
                if (removeAt === true) {
                    checkSelectedIndex();
                }
                me._items[i]._index = i;
                if (removeAt !== true) {
                    checkSelectedIndex();
                }

                if (me._contentSections[i]) {
                    me._contentSections[i]._index = i;
                }
            }
        },

        // positions an item's content depending on its layout
        _positionContent: function (index) {
            var me = this;

            var widgetSize, widgetOffset, itemSize, itemOffset, contentSize, topLeft;

            if (me._orientation === 'horizontal') {
                widgetSize = me.host.outerWidth();
                widgetOffset = me.host.offset().left;
                itemSize = $(me._items[index]).outerWidth();
                itemOffset = $(me._items[index]).offset().left;
                contentSize = $(me._contentSections[index]).outerWidth();
                topLeft = 'left';
            } else {
                widgetSize = me.host.outerHeight();
                widgetOffset = me.host.offset().top;
                itemSize = $(me._items[index]).outerHeight();
                itemOffset = $(me._items[index]).offset().top;
                contentSize = $(me._contentSections[index]).outerHeight();
                topLeft = 'top';
            }

            var contentSection = $(me._contentSections[index]);

            var position = function (value) {
                if (value < 0) {
                    value = 0;
                } else if (value + contentSize > widgetSize) {
                    value = widgetSize - contentSize;
                }
                contentSection.css(topLeft, value);
            };

            var value;
            switch (contentSection[0]._layout) {
                case 'near':
                    value = itemOffset - widgetOffset;
                    position(value);
                    break;
                case 'far':
                    value = itemOffset - widgetOffset - (contentSize - itemSize);
                    position(value);
                    break;
                case 'center':
                    value = itemOffset - widgetOffset - (contentSize - itemSize) / 2;
                    position(value);
                    break;
                default:
                    contentSection.css(topLeft, '');
            }
        },

        // checks whether the scroll buttons have to be shown
        _checkScrollButtons: function (fluidSize) {
            var me = this;

            var itemsSize = 0;
            $.each(me._items, function () {
                var currentItem = $(this);
                if (currentItem.css('display') !== 'none') {
                    itemsSize += (me._orientation === 'horizontal') ? currentItem.outerWidth(true) : currentItem.outerHeight(true);
                }
            });

            var margins = me._orientation === 'horizontal' ? ['margin-left', 'margin-right'] : ['margin-top', 'margin-bottom'];
            var headerSize = (me._orientation === 'horizontal') ? me._header.width() : me._header.height();
            if (!me._itemMargins) {
                me._itemMargins = [];
                me._itemMargins.push($(me._items[0]).css(margins[0]));
                me._itemMargins.push($(me._items[me._items.length - 1]).css(margins[1]));
            }

            if (itemsSize > headerSize) {
                me._scrollButtons.css('display', 'block');
                var near = me.rtl ? me._itemMargins[0] : 17;
                var far = me.rtl ? me._itemMargins[0] : 17;
                switch (me.scrollPosition) {
                    case 'near':
                        far = 0;
                        near = 34;
                        break;
                    case 'far':
                        far = 34;
                        near = 17;
                        break;
                }

                $(me._items[0]).css(margins[0], near);
                $(me._items[me._items.length - 1]).css(margins[1], far);
            } else {
                $(me._items[0]).css(margins[0], me._itemMargins[0]);
                $(me._items[me._items.length - 1]).css(margins[1], me._itemMargins[1]);
                me._scrollButtons.css('display', 'none');
            }

            if (fluidSize === true) {
                if (me._orientation === 'horizontal') {
                    me._scrollButtons.height(me._header.height());
                } else {
                    me._scrollButtons.width(me._header.width());
                }
            }
        },

        // updates the selection token's position
        _positionSelectionToken: function (index) {
            var me = this;

            if (index !== -1) {
                var selectedItem = $(me._items[index]);
                if (selectedItem.length === 0) {
                    return;
                }

                var top, bottom, left, right, offset;

                if (me._orientation === 'horizontal') {
                    var rtlWidth, rtlScroll;
                    if (me.rtl === true) {
                        if (me._browserWidthRtlFlag === 1) {
                            rtlWidth = me._header[0].scrollWidth - me._header[0].clientWidth;
                        } else {
                            rtlWidth = 0;
                        }
                        rtlScroll = me._browserScrollRtlFlag;
                    } else {
                        rtlWidth = 0;
                        rtlScroll = 1;
                    }

                    left = selectedItem[0].offsetLeft + rtlWidth - me._header[0].scrollLeft * rtlScroll - me._selectionTokenOffsetX + 2;
                    offset = me._header.outerHeight() - 1;
                    var width = selectedItem.width() + parseInt(selectedItem.css('padding-left'), 10) + parseInt(selectedItem.css('padding-right'), 10);

                    if (me.position === 'top') {
                        top = offset - me._selectionTokenOffsetY;
                        bottom = '';
                    } else {
                        top = '';
                        bottom = offset - me._selectionTokenOffsetY;
                    }

                    me._selectionToken.css({ 'top': top, 'bottom': bottom, 'left': left, 'width': width });
                } else {
                    top = selectedItem[0].offsetTop - me._header[0].scrollTop - me._selectionTokenOffsetX + 2;
                    offset = me._header.outerWidth() - 1;
                    var height = selectedItem.height() + parseInt(selectedItem.css('padding-top'), 10) + parseInt(selectedItem.css('padding-bottom'), 10);
                    if (me.position === 'left') {
                        left = offset - me._selectionTokenOffsetY;
                        right = '';
                    } else {
                        left = '';
                        right = offset - me._selectionTokenOffsetY;
                    }
                    me._selectionToken.css({ 'top': top, 'left': left, 'right': right, 'height': height });
                }
            }
        },

        // updates the positions of the selection token and popup content
        _updatePositions: function (index) {
            var me = this;

            if (isNaN(index)) {
                index = me.selectedIndex;
            }

            if (index !== -1) {
                me._positionSelectionToken(index);
                if (me.mode === 'popup' && me._contentSections[index]._layout !== 'default') {
                    me._positionContent(index);
                }
                if (me.mode === 'popup' && (me.position === 'left' || me.position === 'right')) {
                    me._content.width('auto');
                    var isPercentage = me._contentSections[index].style.width && me._contentSections[index].style.width.toString().indexOf('%') >= 0;
                    if (isPercentage) {
                        me._content[0].style.width = me._contentSections[index].style.width;
                        me._content.width($(me._contentSections[index]).width() - me._header.width());
                    }
                    else {
                        me._content.width($(me._contentSections[index]).width());
                    }
                }
            }
        },

        // a callback function called after the selection animation has completed
        _animationComplete: function (index, oldIndex) {
            var me = this,
                unselectedIndex = oldIndex !== -1 ? oldIndex : null;

            me._content.css('pointer-events', 'auto');

            if (me._suppressSelectionEvents !== true) {
                me._raiseEvent('0', { selectedIndex: index }); // select event
                me._raiseEvent('2', { unselectedIndex: unselectedIndex, selectedIndex: index }); // change event
            } else {
                if (index !== me._oldReorderIndex) {
                    me._raiseEvent('4', { newIndex: index, oldIndex: me._oldReorderIndex }); // reorder event
                }
                me._suppressSelectionEvents = false;
            }
            me.selectedIndex = index;
            if (me.initContent && me._items[index]._isInitialized === false) {
                me.initContent(index);
                me._items[index]._isInitialized = true;
            }
            me._allowSelection = true;
            me._selecting = null;
        },

        // a callback function called after the selection has been cleared
        _clearSelectionComplete: function (oldIndex, fromSelection) {
            var me = this;

            me._selecting = null;

            if (oldIndex === undefined) {
                oldIndex = me.selectedIndex;
            }

            if (oldIndex !== -1) {
                me._content.css('pointer-events', 'none');
                if (me._suppressSelectionEvents !== true) {
                    me._raiseEvent('1', { unselectedIndex: oldIndex }); // unselect event
                }
            }

            if (fromSelection !== true) {
                me.selectedIndex = -1;
            }
        },

        // slides an item's content section
        _slide: function (el, o, index, oldIndex) {
            var me = this;
            if (!me.activeAnimations) {
                me.activeAnimations = [];
            }
            if (me.activeAnimations.length > 0) {
                for (var i = 0; i < me.activeAnimations.length; i++) {
                    me.activeAnimations[i].clearQueue();
                    me.activeAnimations[i].finish();
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
                        active.id; //ignore jslint
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
                            //  queue: false,
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

            me.activeAnimations.push(el);
            el.animate(animation, {
                //     queue: false,
                duration: o.duration,
                easing: o.easing,
                complete: function () {
                    me.activeAnimations.pop(el);
                    if (mode === 'show') {
                        me._animationComplete(index, oldIndex);
                    } else if (mode === 'hide') {
                        el.hide();
                        me._clearSelectionComplete(index);
                    }
                    effects.restore(el, props);
                    effects.removeWrapper(el);
                }
            });
            return restore;
        }
    });
})(jqxBaseFramework); //ignore jslint
