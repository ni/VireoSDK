/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {

    $.jqx.jqxWidget('jqxTabs', '', {});

    $.extend($.jqx._jqxTabs.prototype, {

        defineInstance: function () {
            var settings = {
                // Type: Number
                // Default: 250
                // Gets or sets the duration of the scroll animation.
                scrollAnimationDuration: 200,
                // Type: Bool
                // Default: true
                // Gets or sets whether the hover effect is active.
                enabledHover: true,
                // Type: Bool
                // Default: false
                // Gets or sets whether the tab view is disabled.
                disabled: false,
                // Type: Bool
                // Default: false
                // Gets or sets whether the tab view is collapsible.
                collapsible: false,
                // Type: String
                // Default: none
                // Gets or sets the animation type of switching tabs. Possible values ['none', 'fade'].
                animationType: 'none',
                // Type: Bool
                // Default: true
                // Gets or sets whether the scroll animation is enabled.
                enableScrollAnimation: true,
                // Type: Number
                // Default: 450
                // Gets or sets animation duration of showing animation.
                contentTransitionDuration: 450,
                // Type: String
                // Default: click
                // Gets or sets user interaction used for switching the different tabs. Possible values ['click', 'dblclick', 'mouseenter', 'none'].
                toggleMode: 'click',
                // Type: Number
                // Default: 0
                // Gets or sets current selected item.
                selectedItem: 0,
                // Type: Number or String
                // Default: auto
                // Gets or sets widget's height.
                height: 'auto',
                // Type: Number or String
                // Default: auto
                // Gets or sets widget's width.
                width: 'auto',
                // Type: String
                // Default: top
                // Gets or sets widget's navigation location. Possible values ['top', 'bottom'].
                position: 'top',
                // Type: Bool
                // Default: false
                // Gets or sets whether the selection tracker is enabled.
                selectionTracker: false,
                // Type: Bool
                // Default: true
                // Gets or sets whether the scrolling is enabled.
                scrollable: true,
                // Type: String
                // Default: both
                // Gets or sets the position of the scroll arrows. Possible values ['left', 'right', 'both'].
                scrollPosition: 'right',
                // Type: Number
                // Default: 70
                // Gets or sets the scrolling step.
                scrollStep: 70,
                // Type: Bool
                // Default: true
                // Gets or sets whether the tab view's header is with the height equals to the height of it's biggest item.
                autoHeight: true,
                // sets a height of the header
                headerHeight: null,
                // Type: Bool
                // Default: false
                // Gets or sets whether tabs will have close buttons.
                showCloseButtons: false,
                // Type: Bool
                // Default: true
                // Gets or sets whether all tabs can be closed with the 'close' button or with the 'removeAt' function.
                canCloseAllTabs: true,
                // Type: Number
                // Default: 16
                // Gets or sets the close button size.
                closeButtonSize: 16,
                // Type: Number
                // Default: 16
                // Gets or sets the arrow buttons size.
                arrowButtonSize: 16,
                // Type: Bool
                // Default: true
                // Gets or sets whether the keyboard navigation is activated.
                keyboardNavigation: true,
                // Type: Bool
                // Default: false
                // Gets or sets whether the tab view's elements could be reordered.
                reorder: false,
                // Type: Number
                // Default: 300
                // Gets or sets whether the selection tracker animation duration.
                selectionTrackerAnimationDuration: 300,
                //Private variables
                _isTouchDevice: false,
                roundedCorners: true,
                //This variable is used in the expanding and collapsing. Onece when the tab have been collapsed bottom or top (depending ot
                //header's position) border is added to the titles and _headerWrapper's height is increasing with 1px. When the header increase
                //its size with one pixel _headerExpandingBalance is increasing with one, when it's decreased it's decreasing with one.
                _headerExpandingBalance: 0,
                _dragStarted: false,
                _tabCaptured: false,
                //Used in scrolling when the user is dragging any item
                _lastUnorderedListPosition: 0,
                _selectedItem: 0,
                _titleList: [],
                _contentList: [],
                _contentWrapper: null,
                _unorderedList: null,
                _scrollTimeout: null,
                isCollapsed: false,
                touchMode: false,
                initTabContent: null,
                enableDropAnimation: false,
                //This property is used to cancel selecting and unselecting events. It is keeping reference to these events.
                _currentEvent: null,
                //This property indicates is the unordered list wide enough to add scroll arrows
                _needScroll: true,
                //This variable is used for not allowing to the user to perform any action when there is an active animation.
                //Before the animation start we are adding property (with the name of the animated object) to the _isAnimated object and setting it's value to true.
                //When the animation ends we are setting this property to false.
                //In the method which is checking is there an active animation we are checking is there any property with value true.
                _isAnimated: {},
                _events: [
                    'created', 'selected', 'add', 'removed', 'enabled', 'disabled', 'selecting', 'unselecting',
                    'unselected', 'dragStart', 'dragEnd', 'locked', 'unlocked', 'collapsed', 'expanded', 'tabclick'
                ],
                _initTabContentList: [],
                _invalidArgumentExceptions: {
                    'invalidScrollAnimationDuration': 'The scroll animation duration is not valid!',
                    'invalidWidth': 'Width you\'ve entered is invalid!',
                    'invalidHeight': 'Height you\'ve entered is invalid!',
                    'invalidAnimationType': 'You\'ve entered invalid animation type!',
                    'invalidcontentTransitionDuration': 'You\'ve entered invalid value for contentTransitionDuration!',
                    'invalidToggleMode': 'You\'ve entered invalid value for toggleMode!',
                    'invalidPosition': 'You\'ve entered invalid position!',
                    'invalidScrollPosition': 'You\'ve entered invalid scroll position!',
                    'invalidScrollStep': 'You\'ve entered invalid scroll step!',
                    'invalidStructure': 'Invalid structure!',
                    'invalidArrowSize': 'Invalid scroll button size!',
                    'invalidCloseSize': 'Invalid close button size!'
                },
                aria:
                     {
                         "aria-disabled": { name: "disabled", type: "boolean" }
                     },

                rtl: false
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            $.jqx.aria(this);
            this.host.addClass(this.toThemeProperty('jqx-tabs'));
            this.host.addClass(this.toThemeProperty('jqx-widget'));
            this.host.addClass(this.toThemeProperty('jqx-widget-content'));
            this.host.attr('role', 'tablist');
            this._unorderedList = this.host.children('ul');

            this._titleList = this.host.children('ul').children('li');
            this._contentList = this.host.children('div');
            this._selectedItem = this.selectedItem;
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            this._needScroll = this.scrollable;
            if (this.selectionTracker) {
                this.selectionTracker = this._seletionTrackerBrowserCheck();
            }
            if (this._isTouchDevice) {
                this.reorder = false;
                this.keyboardNavigation = false;
            }
            //Saving all titles and contents into collections
            var count = this.length();
            while (count) {
                count--;
                this._titleList[count] = $(this._titleList[count]);
                this._titleList[count].attr('role', 'tab');
                this._contentList[count] = $(this._contentList[count]);
                this._contentList[count].attr('role', 'tabpanel');
            }
            this._validateProperties();
            this._refresh();
            this._moveSelectionTrack(this._selectedItem, 0);
            if (this.disabled) {
                this.disable();
            }
            this.element.tabIndex = 0;
            this._raiseEvent(0);
            this._enableWindowResize();
        },

        _hiddenParent: function () {
            var me = this;
            if (me.host.css('display') == 'none')
                return true;
            var hiddenParent = false;
            $.each(me.host.parents(), function () {
                if ($(this).css('display') == 'none') {
                    hiddenParent = true;
                    return false;
                }
            });
            return hiddenParent;
        },

        _enableWindowResize: function () {
            var me = this;
            var hidden = $.jqx.isHidden(me.host);
            $.jqx.utilities.resize(this.host, function () {
                if (hidden) {
                    me._uiRefresh(true);
                    hidden = false;
                }
                else {
                    me.refresh();
                }
            });
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            var hidden = $.jqx.isHidden(this.host);
            if (hidden) {
                this._uiRefresh(true);
                hidden = false;
            }
            else {
                this.refresh();
            }
        },

        refresh: function (initialRefresh) {
            if (true != initialRefresh || initialRefresh == undefined) {
                this._setSize();
            }
        },

        _seletionTrackerBrowserCheck: function () {
            var txt = "Browser CodeName: " + navigator.appCodeName + "";
            txt += "Browser Name: " + navigator.appName + "";
            txt += "Browser Version: " + navigator.appVersion + "";
            // txt += "Cookies Enabled: " + navigator.cookieEnabled + "";
            txt += "Platform: " + navigator.platform + "";
            txt += "User-agent header: " + navigator.userAgent + "";

            if (txt.indexOf('IEMobile') != -1) {
                return false;
            }
            if (txt.indexOf('Windows Phone OS') != -1) {
                return false;
            }
            if ($.jqx.browser.msie && $.jqx.browser.version <= 7) {
                return false;
            }
            return true;
        },

        render: function () {
            this._refresh();
        },

        _uiRefresh: function (render) {
            //Using this backup variable because after refresh the scroll position should be recovered
            this._unorderedListLeftBackup = this._unorderedList.css('left');

            if (render) {
                this._render();
            }
            this._addStyles();
            this._performLayout();
            this._prepareTabs();
            this._removeEventHandlers();
            this._addEventHandlers();
            if (this._unorderedListLeftBackup === 'auto') {
                this._unorderedListLeftBackup = this._getArrowsDisplacement();
            }
            this._unorderedList.css('left', this._unorderedListLeftBackup);
            if (this.rtl) {
                if (this.scrollable && this._rightArrow && this._rightArrow.css('visibility') != 'hidden') {
                    var buttonsSize = 2 * this.arrowButtonSize;
                    var left = this.host.width() - parseInt(this._unorderedList.width() + buttonsSize + +parseInt(this._unorderedList.css('margin-left')), 10);
                    this._unorderedList.css('left', left + 'px');
                }
            }
        },

        _refresh: function () {
            if ($.jqx.isHidden(this.host)) {
                return;
            }

            this._uiRefresh(true);
        },

        _addStyles: function () {
            this._unorderedList.addClass(this.toThemeProperty('jqx-tabs-title-container'));

            this._unorderedList.css({
                'outline': 'none', 'white-space': 'nowrap',
                'margin-top': '0px', 'margin-bottom': '0px', padding: '0px', background: 'transparent', border: 'none', 'border-style': 'none', 'text-indent': '0px'
            });

            var count = this.length();
            while (count) {
                count--;
                this._titleList[count].removeClass();
                this._titleList[count].css('padding', '');
                this._titleList[count].addClass('jqx-reset');
                this._titleList[count].addClass('jqx-disableselect');
                this._titleList[count].addClass(this.toThemeProperty('jqx-tabs-title'));
                this._titleList[count].addClass(this.toThemeProperty('jqx-item'));
                if (this.position == 'bottom') {
                    this._titleList[count].addClass(this.toThemeProperty('jqx-tabs-title-bottom'));
                }

                if (this._titleList[count].disabled) {
                    this._titleList[count].addClass(this.toThemeProperty('jqx-tabs-title-disable'));
                    this._titleList[count].addClass(this.toThemeProperty('jqx-fill-state-disabled'));
                }

                this._titleList[count].removeClass(this.toThemeProperty('jqx-rc-b'));
                this._titleList[count].removeClass(this.toThemeProperty('jqx-rc-t'));
                this._contentList[count].removeClass(this.toThemeProperty('jqx-rc-b'));
                this._contentList[count].removeClass(this.toThemeProperty('jqx-rc-t'));
                switch (this.position) {
                    case 'top':
                        this._titleList[count].addClass(this.toThemeProperty('jqx-rc-t'));
                        this._contentList[count].addClass(this.toThemeProperty('jqx-rc-b'));
                        break;
                    case 'bottom':
                        this._titleList[count].addClass(this.toThemeProperty('jqx-rc-b'));
                        this._contentList[count].addClass(this.toThemeProperty('jqx-rc-t'));
                        break;
                }
            }
            if (this.selectionTracker) {
                this._selectionTracker.removeClass(this.toThemeProperty('jqx-rc-b'));
                this._selectionTracker.removeClass(this.toThemeProperty('jqx-rc-t'));
                switch (this.position) {
                    case 'top':
                        this._selectionTracker.addClass(this.toThemeProperty('jqx-rc-t'));
                        break;
                    case 'bottom':
                        this._selectionTracker.addClass(this.toThemeProperty('jqx-rc-b'));
                        break;
                }
            }
        },

        _raiseEvent: function (eventId, data) {
            var event = new $.Event(this._events[eventId]);
            event.owner = this;
            event.args = data;
            if (eventId === 6 || eventId === 7) {
                event.cancel = false;
                this._currentEvent = event;
            }
            var result = '';
            try {
                result = this.host.trigger(event);
                if (eventId == 1) {
                    var me = this;
                    if (this.selectionTracker || this.animationType != 'none') {
                        setTimeout(function () {
                            if (!me._initTabContentList[me.selectedItem]) {
                                if (me.initTabContent) {
                                    me.initTabContent(me.selectedItem);
                                    me._initTabContentList[me.selectedItem] = true;
                                }
                            }
                            var event = new $.Event('loadContent');
                            event.owner = this;
                            if (me._contentList.length > 0 && me._contentList[me.selectedItem]) {
                                me._contentList[me.selectedItem].find('div').trigger(event);
                            }
                        }, 50 + me.selectionTrackerAnimationDuration);
                    }
                    else {
                        var event = new $.Event('loadContent');
                        if (!me._initTabContentList[me.selectedItem]) {
                            if (me.initTabContent) {
                                me.initTabContent(me.selectedItem);
                                me._initTabContentList[me.selectedItem] = true;
                            }
                        }
                        event.owner = this;

                        var event = new $.Event('resize');
                        this.host.trigger(event);
                    }
                }
            }
            catch (error) {
                if (error && console) {
                    console.log(error);
                }
            }

            return result;
        },

        _getArrowsDisplacement: function () {
            if (!this._needScroll) {
                return 0;
            }
            var trackerDisplacement;
            var leftArrowWidth = this.arrowButtonSize;
            var rightArrowWidth = this.arrowButtonSize;
            if (this.scrollPosition === 'left') {
                trackerDisplacement = leftArrowWidth + rightArrowWidth;
            } else if (this.scrollPosition === 'both') {
                trackerDisplacement = leftArrowWidth;
            } else {
                trackerDisplacement = 0;
            }
            return trackerDisplacement;
        },

        _scrollRight: function (duration, callback) {
            this._unorderedList.stop();
            this._unlockAnimation('unorderedList');
            var scrollWidth = parseInt(this._unorderedList.width() + parseInt(this._unorderedList.css('margin-left')), 10),
                hostWidth = parseInt(this.host.width(), 10),
                leftArrowWidth, rightArrowWidth,
                unorderedListLeft = parseInt(this._unorderedList.css('left'), 10),
                trackerDisplacement = this._getArrowsDisplacement(),
                left = 0,
                selectionTrackerLeft = undefined;
            if (this.scrollable) {
                leftArrowWidth = parseInt(this._leftArrow.outerWidth(), 10);
                rightArrowWidth = parseInt(this._rightArrow.outerWidth(), 10);
            } else {
                leftArrowWidth = 0;
                rightArrowWidth = 0;
            }
            duration = (this.enableScrollAnimation) ? duration : 0;
            if (parseInt(this._headerWrapper.width(), 10) > parseInt(this._unorderedList.css('margin-left')) + parseInt(this._unorderedList.width(), 10)) {
                left = trackerDisplacement;
            } else if (Math.abs(unorderedListLeft) + this.scrollStep <
                Math.abs(hostWidth - scrollWidth) + leftArrowWidth + rightArrowWidth + trackerDisplacement) {
                left = unorderedListLeft - this.scrollStep;
                selectionTrackerLeft = unorderedListLeft - this.scrollStep + parseInt(this._titleList[this._selectedItem].position().left);
            } else {
                left = hostWidth - scrollWidth - (2 * this.arrowButtonSize - trackerDisplacement);
                //Making this check because jQuery(selector).position().left is giving different results
                if (left < parseInt(this._unorderedList.css('left'), 10) - 4 &&
                    left > parseInt(this._unorderedList.css('left'), 10) + 4) {
                    selectionTrackerLeft = hostWidth - scrollWidth - leftArrowWidth - rightArrowWidth + parseInt(this._titleList[this._selectedItem].position().left);
                }
            }
            this._performScrollAnimation(left, selectionTrackerLeft, duration);
        },

        _scrollLeft: function (duration, callback) {
            this._unorderedList.stop();
            this._unlockAnimation('unorderedList')
            var unorderedListLeft = parseInt(this._unorderedList.css('left')),
                trackerDisplacement = this._getArrowsDisplacement(),
                left = 0,
                selectionTrackerLeft = undefined;
            //Calculating animation's parameters
            duration = (this.enableScrollAnimation) ? duration : 0;
            if (parseInt(this._headerWrapper.width()) >= parseInt(this._unorderedList.width())) {
                left = trackerDisplacement;
            } else if (unorderedListLeft + this.scrollStep < trackerDisplacement) {
                left = unorderedListLeft + this.scrollStep;
                selectionTrackerLeft = unorderedListLeft + this.scrollStep + parseInt(this._titleList[this._selectedItem].position().left);
            } else {
                left = trackerDisplacement;
                //Making this check because jQuery(selector).position().left is giving different results
                if (left < parseInt(this._unorderedList.css('left')) - 4 &&
                    left > parseInt(this._unorderedList.css('left')) + 4) {
                    selectionTrackerLeft = parseInt(this._titleList[this._selectedItem].position().left);
                }
            }
            this._performScrollAnimation(left, selectionTrackerLeft, duration);
        },

        _performScrollAnimation: function (left, selectionTrackerLeft, duration) {
            var self = this;
            if (selectionTrackerLeft !== undefined) {
                this._moveSelectionTrack(this._selectedItem, 0, selectionTrackerLeft);
            }
            this._lockAnimation('unorderedList');

            this._unorderedList.animate({ 'left': left }, duration, function () {
                self._moveSelectionTrack(self.selectedItem, 0);
                self._unlockAnimation('unorderedList');
            });
        },

        _addKeyboardHandlers: function () {
            var self = this;
            if (this.keyboardNavigation) {
                this.addHandler(this.host, 'keydown', function (event) {
                    if (!self._activeAnimation()) {
                        var selectedItem = self._selectedItem;
                        var tracker = self.selectionTracker;
                        //     self.selectionTracker = false;
                        var content = self.getContentAt(selectedItem);
                        if ($(event.target).ischildof(content)) {
                            return true;
                        }

                        switch (event.keyCode) {
                            case 37:    //left arrow
                                if (self.rtl) self.next();
                                else {
                                    self.previous();
                                }
                                return false;
                            case 39:    //right arrow
                                if (self.rtl) self.previous();
                                else {
                                    self.next();
                                }
                                return false;
                            case 36:    //home
                                self.first();
                                return false;
                            case 35:    //end
                                self.last();
                                return false;
                            case 27:
                                if (self._tabCaptured) {
                                    self._cancelClick = true;
                                    self._uncapture(null, self.selectedItem);
                                    self._tabCaptured = false;
                                }
                                break;
                        }
                        self.selectionTracker = tracker;
                    }
                    return true;
                });
            }
        },

        _addScrollHandlers: function () {
            var self = this;
            this.addHandler(this._leftArrow, 'mousedown', function () {
                self._startScrollRepeat(true, self.scrollAnimationDuration);
            });
            this.addHandler(this._rightArrow, 'mousedown', function () {
                self._startScrollRepeat(false, self.scrollAnimationDuration);
            });
            this.addHandler(this._rightArrow, 'mouseleave', function () {
                clearTimeout(self._scrollTimeout);
            });
            this.addHandler(this._leftArrow, 'mouseleave', function () {
                clearTimeout(self._scrollTimeout);
            });
            this.addHandler($(document), 'mouseup.tab' + this.element.id, this._mouseUpScrollDocumentHandler, this);
            this.addHandler($(document), 'mouseleave.tab' + this.element.id, this._mouseLeaveScrollDocumentHandler, this);
        },

        _mouseLeaveScrollDocumentHandler: function (event) {
            var self = event.data;
            if (!self._scrollTimeout) return;
            clearTimeout(self._scrollTimeout);
        },

        _mouseUpScrollDocumentHandler: function (event) {
            var self = event.data;
            clearTimeout(self._scrollTimeout);
        },

        _mouseUpDragDocumentHandler: function (event) {
            var self = event.data;
            if (self._tabCaptured && self._dragStarted) {
                self._uncapture(event);
            }
            self._tabCaptured = false;
        },

        _addReorderHandlers: function () {
            var self = this;
            this.addHandler($(document), 'mousemove.tab' + this.element.id, this._moveElement, this);
            this.addHandler($(document), 'mouseup.tab' + this.element.id, this._mouseUpDragDocumentHandler, this);
        },

        _addEventHandlers: function () {
            var count = this.length();
            while (count) {
                count--;
                this._addEventListenerAt(count);
            }

            if (this.keyboardNavigation) {
                this._addKeyboardHandlers();
            }
            if (this.scrollable) {
                this._addScrollHandlers();
            }
            if (this.reorder && !this._isTouchDevice) {
                this._addReorderHandlers();
            }
            var me = this;
            try {
                if (document.referrer != "" || window.frameElement) {
                    if (window.top != null && window.top != window.self) {
                        var eventHandle = function (event) {
                            if (me._tabCaptured) {
                                me._cancelClick = true;
                                me._uncapture(null, me.selectedItem);
                                me._tabCaptured = false;
                            }
                        };
                        var parentLocation = null;
                        if (window.parent && document.referrer) {
                            parentLocation = document.referrer;
                        }

                        if (parentLocation && parentLocation.indexOf(document.location.host) != -1) {
                            if (window.top.document) {
                                this.addHandler($(window.top.document), 'mouseup', eventHandle);
                            }
                        }
                    }
                }
            }
            catch (error) {
            }
        },

        focus: function () {
            try {
                this.host.focus();
                var that = this;
                setTimeout(function () {
                    that.host.focus();
                }, 25);
            }
            catch (error) {
            }
        },

        _getFocusedItem: function (mouseX, mouseY) {
            var count = this.length();
            while (count) {
                count--;
                var currentElement = this._titleList[count],
                    currentElementWidth = parseInt(currentElement.outerWidth(true)),
                    currentElementX = parseInt(currentElement.offset().left),
                    unorderedListX = parseInt(this._unorderedList.offset().left),
                    hostX = parseInt(this.host.offset().left),
                    currentElementAbsoluteX = currentElementX;
                if ((currentElementAbsoluteX <= mouseX &&
                    currentElementAbsoluteX + currentElementWidth >= mouseX) &&
                    (currentElement !== this._capturedElement) &&
                    (!this._titleList[count].locked) &&
                    (this._titleList[count].disabled !== true)) {
                    return count;
                }
            }

            return -1;
        },

        _uncapture: function (event) {
            var trackerBackup = this.selectionTracker;
            this._unorderedListLeftBackup = this._unorderedList.css('left');
            this._dragStarted = false;
            this._tabCaptured = false;
            var capturedIndex = this._indexOf(this._capturedElement);
            if (!this._capturedElement) return;
            switch (this.position) {
                case 'top':
                    this._capturedElement.css('bottom', 0);
                    break;
                case 'bottom':
                    this._capturedElement.css('top', 0);
                    break;
            }
            if (event) {
                var mouseOverElementIndex = this._getFocusedItem(event.clientX, event.clientY);
            }
            if (mouseOverElementIndex === -1 || !event) {
                this._capturedElement.css('left', 0);
            } else {
                this._raiseEvent(10, { item: capturedIndex, dropIndex: mouseOverElementIndex });
                this._reorderItems(mouseOverElementIndex, capturedIndex);
            }

            $.each(this._titleList, function () {
                this.css('position', 'static');
            });

            this._reorderHeaderElements();
            this._unorderedList.css({
                'position': 'relative',
                'top': '0px'
            });

            this._prepareTabs();

            if (mouseOverElementIndex === -1 || !event) {
                this._selectedItem = capturedIndex;
                this._moveSelectionTrack(capturedIndex, 0);
                this._addSelectStyle(this._selectedItem, true);
            }
            else {
                this._moveSelectionTrack(this._selectedItem, 0);
                this._addSelectStyle(this._selectedItem, true);
            }

            if (document.selection) {
                document.selection.clear();
            }
            this._unorderedList.css('left', this._unorderedListLeftBackup);
            this.selectionTracker = trackerBackup;
        },

        _reorderItems: function (mouseOverElementIndex, capturedIndex) {
            var selectedItem = this._titleList[this.selectedItem];
            var capturedContent = this._contentList[capturedIndex];
            if (typeof this._capturedElement === 'undefined') {
                this._capturedElement = this._titleList[capturedIndex];
            }
            //Visible reorder
            this._titleList[capturedIndex].remove();
            if (capturedIndex < mouseOverElementIndex) {
                this._titleList[capturedIndex].insertAfter(this._titleList[mouseOverElementIndex]);
            } else {
                this._titleList[capturedIndex].insertBefore(this._titleList[mouseOverElementIndex]);
            }
            this._reorderElementArrays(mouseOverElementIndex, capturedIndex);
            this._getSelectedItem(selectedItem);
            this._removeEventHandlers();
            this._addEventHandlers();
        },

        _reorderElementArrays: function (mouseOverElementIndex, capturedIndex) {
            //Reordering in the collections and correcting the event handlers
            var selectedItem = this._titleList[this.selectedItem];
            var capturedContent = this._contentList[capturedIndex];
            if (capturedIndex < mouseOverElementIndex) {
                for (var i = capturedIndex; i <= mouseOverElementIndex; i++) {
                    this._titleList[i] = this._titleList[i + 1];
                    this._contentList[i] = this._contentList[i + 1];
                }
                this._contentList[mouseOverElementIndex] = capturedContent;
                this._titleList[mouseOverElementIndex] = this._capturedElement;
            } else {
                for (var i = capturedIndex; i >= mouseOverElementIndex; i--) {
                    this._titleList[i] = this._titleList[i - 1];
                    this._contentList[i] = this._contentList[i - 1];
                }
                this._contentList[mouseOverElementIndex] = capturedContent;
                this._titleList[mouseOverElementIndex] = this._capturedElement;
            }
        },

        getSelectedItem: function () {
            return this.selectedItem;
        },

        _getSelectedItem: function (selectedItem) {
            //Getting selected item
            var count = this.length();
            while (count) {
                count--;
                if (this._titleList[count] === selectedItem) {
                    this._selectedItem = this.selectedItem = count;
                    break;
                }
            }
        },

        _moveElement: function (event, self) {
            var self = event.data;
            if (self._tabCaptured) {
                if (document.selection) {
                    document.selection.clear();
                }
                if (!self._dragStarted) {
                    unorderedListLeft = -parseInt(self._unorderedList.css('left'), 10);

                    if (event.clientX + unorderedListLeft > self._startX + 3 || event.clientX + unorderedListLeft < self._startX - 3) {
                        self._prepareTabForDragging();
                        self._dragStarted = true;
                    }
                } else {
                    self._performDrag(event);
                    clearTimeout(self._scrollTimeout);
                    //         self._dragScroll(event);
                }
            }
        },

        _performDrag: function (event) {
            var zoomFactor = this.getZoomFactor();
            unorderedListLeft = -parseInt(this._unorderedList.css('left'), 10);

            this._capturedElement.css('left', unorderedListLeft + event.clientX / zoomFactor - this._startX / zoomFactor);
            this._lastX = event.clientX / zoomFactor;
            this._moveSelectionTrack(this.selectedItem, 0);
        },

        getZoomFactor: function () {
            var factor = 1;
            if (document.body.getBoundingClientRect) {
                // rect is only in physical pixel size in IE before version 8 
                var rect = document.body.getBoundingClientRect();
                var physicalW = rect.right - rect.left;
                var logicalW = document.body.offsetWidth;

                // the zoom level is always an integer percent value
                factor = Math.round((physicalW / logicalW) * 100) / 100;
            }
            return factor;
        },

        _prepareTabForDragging: function () {
            this._capturedElement.css({
                position: 'relative',
                left: '0px',
                top: '0px',
                'z-index': '300'
            });
            this.selectedItem = this._indexOf(this._capturedElement);

            switch (this.position) {
                case 'top':
                    this._capturedElement.css('bottom', parseInt(this._capturedElement.css('top')));
                    break;
                case 'bottom':
                    this._capturedElement.css('top', parseInt(this._capturedElement.css('top')));
                    break;
            }
            this._raiseEvent(9, { item: this._indexOf(this._capturedElement) });
        },

        _dragScroll: function (event) {
            var lastUnorderedListPosition = parseInt(this._unorderedList.css('left'));
            var self = this;
            var capturedElementLeft = parseInt(this._capturedElement.css('left'));
            if (event.clientX <= this._headerWrapper.offset().left) {
                this._scrollLeft(this.scrollAnimationDuration);
                this._capturedElement.css('left',
                    parseInt(this._capturedElement.css('left')) +
                    this._lastUnorderedListPosition - lastUnorderedListPosition);
            } else if (event.clientX > this._headerWrapper.offset().left + parseInt(this._headerWrapper.width(), 10)) {
                this._scrollRight(this.scrollAnimationDuration);
                this._capturedElement.css('left',
                    parseInt(this._capturedElement.css('left')) +
                    this._lastUnorderedListPosition - lastUnorderedListPosition);
            } else {
                this._unorderedList.stop();
                this._unlockAnimation('unorderedList');
                clearTimeout(this._scrollTimeout);
            }
            var self = this;
            this._scrollTimeout = setTimeout(function () {
                self._dragScroll(event);
            }, this.scrollAnimationDuration);
            this._lastUnorderedListPosition = lastUnorderedListPosition;
        },

        _captureElement: function (event, index) {
            if (!this._tabCaptured &&
                !this._titleList[index].locked &&
                 this._titleList[index].disabled !== true &&
                 !this._activeAnimation()) {
                unorderedListLeft = -parseInt(this._unorderedList.css('left'), 10);

                this._startX = unorderedListLeft + event.clientX;
                this._startY = event.clientY;
                this._lastX = event.clientX;
                this._lastY = event.clientY;
                this._tabCaptured = true;
                this._capturedElement = this._titleList[index];
            }
        },

        _titleInteractionTrigger: function (index) {
            //Used for removing expand/collapse border fix
            if (this._headerExpandingBalance > 0) {
                this._removeOppositeBorder();
            }
            /////////////////////////////////////////////
            if (this._selectedItem !== index) {
                this.select(this._titleList[index], 'toggle');
                //If an item have been collapsed and we want to select it
                //before the selection we are uncollapsing the item
                this._titleList[index].collapsed = false;
                if (!this.collapsible) {
                    if (this.height !== 'auto') {
                        this._contentWrapper.css('visibility', 'visible');
                    } else {
                        this._contentWrapper.css('display', 'block');
                    }
                }
            } else if (this.collapsible) {
                if (this.isCollapsed) {
                    this.expand();
                } else {
                    this.collapse();
                }
            }
        },

        //Collapsing the current selected item.
        collapse: function () {
            var index = this._selectedItem,
                self = this;
            this.isCollapsed = true;
            // if (!this._titleList[index].collapsed) {
            //     this._titleList[index].collapsed = true;
            if (self.height !== 'auto') {
                self._contentWrapper.css('visibility', 'hidden');
            } else {
                self._contentWrapper.hide();
            }
            self._raiseEvent(13, { item: index });
            if (this.position == 'top') {
                self._headerWrapper.addClass(this.toThemeProperty('jqx-tabs-header-collapsed'));
                self.host.addClass(this.toThemeProperty('jqx-tabs-collapsed'));
            }
            else {
                self._headerWrapper.addClass(this.toThemeProperty('jqx-tabs-header-collapsed-bottom'));
                self.host.addClass(this.toThemeProperty('jqx-tabs-collapsed-bottom'));
            }
        },

        //Expanding the current selected item.
        expand: function () {
            var index = this._selectedItem,
                self = this;
            this.isCollapsed = false;
            //     if (this._titleList[index].collapsed) {
            //       this._titleList[index].collapsed = false;
            this._select(index, self.contentTransitionDuration, null, false, true);
            //Depend on the widget's height we are changing the display or visibility property
            if (self.height !== 'auto') {
                self._contentWrapper.css('visibility', 'visible');
            } else {
                self._contentWrapper.show();
            }
            self._raiseEvent(14, { item: index });
            if (this.position == 'top') {
                self._headerWrapper.removeClass(this.toThemeProperty('jqx-tabs-header-collapsed'));
                self.host.removeClass(this.toThemeProperty('jqx-tabs-collapsed'));
            }
            else {
                self._headerWrapper.removeClass(this.toThemeProperty('jqx-tabs-header-collapsed-bottom'));
                self.host.removeClass(this.toThemeProperty('jqx-tabs-collapsed-bottom'));
            }
        },

        _addSelectHandler: function (index) {
            var self = this;
            this.addHandler(this._titleList[index], 'selectstart', function (index) {
                return false;
            });

            this.addHandler(this._titleList[index], this.toggleMode, function (index) {
                return function () {
                    self._raiseEvent('15', { item: index });
                    if (!self._tabCaptured && !self._cancelClick) {
                        self._titleInteractionTrigger(index);
                    }
                    return true;
                }

            }(index));
        },

        _addDragDropHandlers: function (index) {
            var self = this;
            this.addHandler(this._titleList[index], 'mousedown', function (event) {
                self._captureElement(event, index);
                return false;
            });

            this.addHandler(this._titleList[index], 'mouseup', function (event) {
                if (self._tabCaptured && self._dragStarted) {
                    self._cancelClick = true;
                    self._uncapture(event, index);
                } else {
                    self._cancelClick = false;
                }
                self._tabCaptured = false;
                return false;
            });
        },

        _removeHoverStates: function () {
            var self = this;
            $.each(this._titleList, function () {
                this.removeClass(self.toThemeProperty('jqx-tabs-title-hover-top'));
                this.removeClass(self.toThemeProperty('jqx-tabs-title-hover-bottom'));
            });
        },

        _addHoverHandlers: function (index) {
            var self = this;
            var item = this._titleList[index];

            this.addHandler(item, 'mouseenter', function (event) {
                if (index != self._selectedItem) {
                    if (self.position == 'top') {
                        item.addClass(self.toThemeProperty('jqx-tabs-title-hover-top'));
                    }
                    else {
                        item.addClass(self.toThemeProperty('jqx-tabs-title-hover-bottom'));
                    }
                    item.addClass(self.toThemeProperty('jqx-fill-state-hover'));

                    if (self.showCloseButtons) {
                        var closeButton = item.children(0).children(self.toThemeProperty('.jqx-tabs-close-button', true));
                        closeButton.addClass(self.toThemeProperty('jqx-tabs-close-button-hover', true));
                    }
                }
            });

            this.addHandler(item, 'mouseleave', function (event) {
                if (index != self._selectedItem) {
                    if (self.position == 'top') {
                        item.removeClass(self.toThemeProperty('jqx-tabs-title-hover-top'));
                    }
                    else {
                        item.removeClass(self.toThemeProperty('jqx-tabs-title-hover-bottom'));
                    }
                    item.removeClass(self.toThemeProperty('jqx-fill-state-hover'));
                    if (self.showCloseButtons) {
                        var closeButton = item.children(0).children(self.toThemeProperty('.jqx-tabs-close-button', true));
                        closeButton.removeClass(self.toThemeProperty('jqx-tabs-close-button-hover', true));
                    }
                }
            });
        },

        _addEventListenerAt: function (index) {
            var self = this;
            if (this._titleList[index].disabled) return;
            if (this.reorder && !this._isTouchDevice) {
                this._addDragDropHandlers(index);
            }
            this._addSelectHandler(index);
            if (this.enabledHover) {
                this._addHoverHandlers(index);
            }
            var closeButton = this._titleList[index].find(this.toThemeProperty('.jqx-tabs-close-button', true));
            this.removeHandler(closeButton, 'click');
            this.addHandler(closeButton, 'click', function (event) {
                self.removeAt(index);
                return false;
            });
        },

        _removeEventHandlers: function () {
            var self = this;
            var count = this.length();
            while (count) {
                count--;
                this._removeEventListenerAt(count);
            }
            if (this.scrollable) {
                this.removeHandler(this._leftArrow, 'mousedown');
                this.removeHandler(this._rightArrow, 'mousedown');
            }
            this.removeHandler($(document), 'mousemove.tab' + this.element.id, this._moveElement);
            this.removeHandler($(document), 'mouseup.tab' + this.element.id, this._mouseUpScrollDocumentHandler);
            this.removeHandler($(document), 'mouseup.tab' + this.element.id, this._mouseUpDragDocumentHandler);
            this.removeHandler(this.host, 'keydown');
        },

        _removeEventListenerAt: function (index) {
            var self = this;
            this.removeHandler(this._titleList[index], this.toggleMode);
            this.removeHandler(this._titleList[index], 'mouseenter');
            this.removeHandler(this._titleList[index], 'mouseleave');
            this.removeHandler(this._titleList[index], 'mousedown');
            this.removeHandler(this._titleList[index], 'mouseup');
            var closeButton = this._titleList[index].children(0).children(this.toThemeProperty('.jqx-tabs-close-button', true));
            this.removeHandler(closeButton, 'click');
        },

        _moveSelectionTrack: function (item, duration, left) {
            var self = this;
            if (item == -1)
                return;

            if (this._titleList.length == 0)
                return;

            if (item >= this._titleList.length)
                return;

            if (this.selectionTracker && this._selectionTracker) {
                this._selectionTracker.stop();
                this._unlockAnimation('selectionTracker');
                if (left === undefined) {
                    var leftDisplacement = parseInt(this._titleList[item].position().left);
                    if (!isNaN(parseInt(this._unorderedList.css('left')))) {
                        leftDisplacement += parseInt(this._unorderedList.css('left'));
                    }
                    if (!isNaN(parseInt(this._unorderedList.css('margin-left')))) {
                        leftDisplacement += parseInt(this._unorderedList.css('margin-left'));
                    }
                    if (!isNaN(parseInt(this._titleList[item].css('margin-left')))) {
                        leftDisplacement += parseInt(this._titleList[item].css('margin-left'));
                    }
                    if (!isNaN(parseInt(this._titleList[item].css('margin-right')))) {
                        //        leftDisplacement += parseInt(this._titleList[item].css('margin-right'));
                    }
                } else {
                    var leftDisplacement = left;
                }
                var topDisplacement = 0;
                var heightDifference = 0;
                if (this.position === 'top') {
                    topDisplacement = parseInt(this._headerWrapper.height()) - parseInt(this._titleList[item].outerHeight())
                    if (!this.autoHeight) {
                        heightDifference += parseInt(this._titleList[item].css('margin-top'));
                    }
                }
                this._lockAnimation('selectionTracker');

                // outerWidth includes the margin-right for some reason.
                // Use this instead: this._titleList[item].width() + this._titleList[item].css('padding-left') + this._titleList[item].css('padding-right');

                var horizontalPadding = parseInt(this._titleList[item].css('padding-left')) + parseInt(this._titleList[item].css('padding-right'));

                // the selected item's bottom border should be 0.
                var topOffset = this.position == 'top' ? 0 : 1;
                var headerPadding = parseInt(this._headerWrapper.css('padding-top')); // -parseInt(this._headerWrapper.css('padding-bottom'));
                var itemPadding = parseInt(this._titleList[item].css('padding-top')) + parseInt(this._titleList[item].css('padding-bottom'));
                this._selectionTracker.css('visibility', 'visible');
                this._moveSelectionTrackerContainer.css('visibility', 'visible');
                var topMargin = parseInt(this._titleList[item].css('margin-top'));
                if (isNaN(topMargin))
                    topMargin = 0;

                this._selectionTracker.animate({
                    'top': headerPadding + topMargin - topOffset, 'left': leftDisplacement + 'px',
                    'height': parseInt(this._titleList[item].height() + itemPadding), 'width': this._titleList[item].width() + horizontalPadding
                }, duration, function () {
                    self._unlockAnimation('selectionTracker');
                    self._selectionTracker.css('visibility', 'hidden');
                    self._addSelectStyle(item, true);
                    self._moveSelectionTrackerContainer.css('visibility', 'hidden');
                });
            }
        },

        destroy: function () {
            $.jqx.utilities.resize(this.host, null, true);
            this.host.remove();
        },

        _switchTabs: function (selectIndex, unselectIndex) {
            if (selectIndex !== unselectIndex && !this._activeAnimation() && !this._tabCaptured) {
                var self = this;
                //Triggering unselecting and selecting events first because they could be canceled by the user
                this._raiseEvent(7, { item: unselectIndex });
                this._raiseEvent(6, { item: selectIndex });
                //Check if the event is canceled
                if (this._currentEvent) {
                    if (this._currentEvent.cancel) {
                        this._currentEvent = null;
                        return;
                    }
                }

                this._unselect(unselectIndex, null, true);
                this._select(selectIndex, self.contentTransitionDuration, null, true);
                return true;
            }
            return false;
        },

        _activeAnimation: function () {

            for (child in this._isAnimated) {
                if (this._isAnimated.hasOwnProperty(child)) {
                    if (this._isAnimated[child]) {
                        return true;
                    }
                }
            }
            return false;
        },

        _indexOf: function (item) {
            var count = this.length();
            while (count) {
                count--;
                if (this._titleList[count][0] === item[0] ||
                    this._contentList[count][0] === item[0]) {
                    return count;
                }
            }
            return -1;
        },

        _validateProperties: function () {
            try {
                if (this.scrollAnimationDuration < 0 || isNaN(this.scrollAnimationDuration)) {
                    throw new Error(this._invalidArgumentExceptions['invalidScrollAnimationDuration']);
                }
                if (parseInt(this.width) < 0 && this.width !== 'auto') {
                    throw new Error(this._invalidArgumentExceptions['invalidWidth']);
                }
                if (parseInt(this.height) < 0 && this.height !== 'auto') {
                    throw new Error(this._invalidArgumentExceptions['invalidHeight']);
                }
                if (this.animationType !== 'none' && this.animationType !== 'fade') {
                    throw new Error(this._invalidArgumentExceptions['invalidAnimationType']);
                }
                if (this.contentTransitionDuration < 0 || isNaN(this.contentTransitionDuration)) {
                    throw new Error(this._invalidArgumentExceptions['invalidcontentTransitionDuration']);
                }
                if (this.toggleMode !== 'click' && this.toggleMode !== 'dblclick' &&
                this.toggleMode !== 'mouseenter' && this.toggleMode !== 'none') {
                    throw new Error(this._invalidArgumentExceptions['invalidToggleMode']);
                }
                if (this.position !== 'top' && this.position !== 'bottom') {
                    throw new Error(this._invalidArgumentExceptions['invalidPosition']);
                }
                if (this.scrollPosition !== 'left' && this.scrollPosition !== 'right' && this.scrollPosition !== 'both') {
                    throw new Error(this._invalidArgumentExceptions['invalidScrollPosition']);
                }
                if (this.scrollStep < 0 || isNaN(this.scrollStep)) {
                    throw new Error(this._invalidArgumentExceptions['invalidScrollStep']);
                }
                if (this._titleList.length !== this._contentList.length || this._titleList.length == 0) {
                    throw new Error(this._invalidArgumentExceptions['invalidStructure']);
                }
                if (this.arrowButtonSize < 0 || isNaN(this.arrowButtonSize)) {
                    throw new Error(this._invalidArgumentExceptions['invalidArrowSize']);
                }
                if (this.closeButtonSize < 0 || isNaN(this.closeButtonSize)) {
                    throw new Error(this._invalidArgumentExceptions['invalidCloseSize']);
                }
            } catch (exception) {
                alert(exception);
            }
        },

        _startScrollRepeat: function (isLeft, timeout) {
            var self = this;

            if (isLeft) {
                this._scrollLeft(timeout);
            }
            else {
                this._scrollRight(timeout);
            }

            if (this._scrollTimeout) clearTimeout(this._scrollTimeout);
            this._scrollTimeout = setTimeout(function () {
                self._startScrollRepeat(isLeft, self.scrollAnimationDuration)
            }, timeout);
        },

        _performLayout: function () {
            var count = this.length();
            while (count) {
                count--;
                if (this.position === 'top' ||
                    this.position === 'bottom') {
                    if (this.rtl) {
                        this._titleList[count].css('float', 'right');
                    }
                    else {
                        this._titleList[count].css('float', 'left');
                    }
                }
            }

            this._fitToSize();
            this._performHeaderLayout();
            this._fitToSize();
        },

        updatetabsheader: function () {
            this._performHeaderLayout();
        },

        _setSize: function () {
            var me = this;
            this._fitToSize();
            this._positionArrows(this._totalItemsWidth);
            if (this._totalItemsWidth > this.element.offsetWidth) {
                this._unorderedList.width(this._totalItemsWidth);
            }
            else {
                this._unorderedList[0].style.width = this.element.offsetWidth - 2 + "px";
            }
            this._fitToSize();
        },

        _addArrows: function () {
            if (this._leftArrow && this._rightArrow) {
                this._leftArrow.remove();
                this._rightArrow.remove();
            }
            this._leftArrow = $('<div><span style="display: block; width: 16px; height: 16px;" class="' + this.toThemeProperty('jqx-tabs-arrow-left') + '"></span></div>');
            this._rightArrow = $('<div><span style="display: block; width: 16px; height: 16px;" class="' + this.toThemeProperty('jqx-tabs-arrow-right') + '"></span></div>');
            this._leftArrow.addClass(this.toThemeProperty('jqx-tabs-arrow-background'));
            this._rightArrow.addClass(this.toThemeProperty('jqx-tabs-arrow-background'));
            this._leftArrow.addClass(this.toThemeProperty('jqx-widget-header'));
            this._rightArrow.addClass(this.toThemeProperty('jqx-widget-header'));

            this._headerWrapper.append(this._leftArrow);
            this._headerWrapper.append(this._rightArrow);
            this._leftArrow.width(this.arrowButtonSize);
            this._leftArrow.height('100%');
            this._rightArrow.width(this.arrowButtonSize);
            this._rightArrow.height('100%');

            //     this._leftArrow.append('<img style="border: 0; margin: 0; pading: 0; outline: 0; with: ' + this.arrowButtonSize + 'px; height: ' + this.arrowButtonSize + 'px;" src="' + this._getImageUrl(this._leftArrow) + '" />');
            //   this._rightArrow.append('<img style="border: 0; margin: 0; pading: 0; outline: 0; with: ' + this.arrowButtonSize + 'px; height: ' + this.arrowButtonSize + 'px;" src="' + this._getImageUrl(this._rightArrow) + '" />');
            this._leftArrow.css({
                //             'background-image': 'none',
                'z-index': '30'
            });
            this._rightArrow.css({
                //               'background-image': 'none',
                'z-index': '30'
            });

            this._leftArrow.css('display', 'none');
            this._rightArrow.css('display', 'none');
        },

        _tabsWithVisibleCloseButtons: function () {
            if (!this.showCloseButtons)
                return 0;

            var count = this.length();

            var me = this;
            $.each(this._titleList, function () {
                var hasCloseButton = this.attr('hasclosebutton');
                if (hasCloseButton != undefined && hasCloseButton != null) {
                    if (hasCloseButton == 'false' || hasCloseButton == false) {
                        count--;
                    }
                }
            });

            return count;
        },

        _calculateTitlesSize: function () {
            var maxItemHeight = 0;
            var totalItemsWidth = 0;
            var count = this.length();

            if (this.rtl && $.jqx.browser.msie && $.jqx.browser.version < 8) {
                this._measureItem = $("<span style='position: relative; visibility: hidden;'></span>");
                $(document.body).append(this._measureItem);
            }

            while (count) {
                count--;
                //To calculate unordered list's children width sum correctly (to prevent from differences in the MSIE and other browsers
                //because of the image size) firstly we are hiding the close button, calculating the width and after that showing it if necessary
                if (this._measureItem) {
                    this._measureItem.html(this._titleList[count].html());
                    this._titleList[count].width(this._measureItem.width());
                }

                this._titleList[count].css('position', 'static');

                this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)).css('display', 'none');
                totalItemsWidth += parseInt(this._titleList[count].outerWidth(true));

                if (maxItemHeight < this._titleList[count].outerHeight(true)) {
                    maxItemHeight = Math.round(parseInt(this._titleList[count].outerHeight(true)));
                }
                if (this._titleList[count].height() == 0) {
                    var clone = this._titleList[count].clone();
                    $(document.body).append(clone);
                    maxItemHeight = Math.round(parseInt(clone.outerHeight(true)));
                    clone.remove();
                }

                var hasCloseButton = this._titleList[count].attr('hasCloseButton');
                if (hasCloseButton != undefined && hasCloseButton != null) {
                    var processed = false;
                    if (this.hiddenCloseButtons) {
                        if (this.hiddenCloseButtons[count] == 1) {
                            this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)).css('display', 'none');
                            processed = true;
                        }
                    }
                    if (!processed) {
                        if (hasCloseButton == 'true' || hasCloseButton == true) {
                            totalItemsWidth += this.closeButtonSize;
                            this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)).css('display', 'block');
                        }
                        else if (hasCloseButton == 'false' || hasCloseButton == false) {
                            this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)).css('display', 'none');
                        }
                    }
                }
                else {
                    if (this.showCloseButtons && (this.canCloseAllTabs || this._tabsWithVisibleCloseButtons() > 1)) {
                        var processed = false;
                        if (this.hiddenCloseButtons) {
                            if (this.hiddenCloseButtons[count] == 1) {
                                this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)).css('display', 'none');
                                processed = true;
                            }
                        }
                        if (!processed) {
                            totalItemsWidth += this.closeButtonSize;
                            this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)).css('display', 'block');
                        }
                    }
                }

                this._titleList[count].height(this._titleList[count].height());
            }

            if (this._measureItem) {
                this._measureItem.remove();
            }

            return { height: maxItemHeight, width: 10 + totalItemsWidth };
        },

        _reorderHeaderElements: function () {
            if (this.selectionTracker) {
                this._moveSelectionTrackerContainer.css({
                    'position': 'absolute',
                    'height': '100%', //this._headerWrapper.outerHeight(true),
                    'top': '0px',
                    'left': '0px',
                    'width': '100%'
                });
            }
            this._headerWrapper.css({
                'position': 'relative',
                'left': '0px',
                'top': '0px'
            });

            if (this.scrollable) {
                this._rightArrow.css({
                    'width': this.arrowButtonSize,
                    'position': 'absolute',
                    'top': '0px'
                });
                this._leftArrow.css({
                    'width': this.arrowButtonSize,
                    'position': 'absolute',
                    'top': '0px'
                });
                var _margin = this.theme && this.theme.indexOf('ui-') != -1 ? 3 : 0;
                if (_margin > 0) {
                    this._rightArrow.addClass(this.toThemeProperty('jqx-rc-r'));
                    this._leftArrow.addClass(this.toThemeProperty('jqx-rc-l'));
                }
                var position = this.scrollPosition;
                if (this.rtl) {
                    if (position == 'left') position = 'right';
                    if (position == 'right') position = 'left';
                }

                switch (position) {
                    case 'both':
                        this._rightArrow.css('right', '0px');
                        this._leftArrow.css('left', '0px');
                        break;
                    case 'left':
                        this._rightArrow.css('left', this.arrowButtonSize + 'px');
                        this._leftArrow.css('left', '0px');
                        break;
                    case 'right':
                        this._rightArrow.css('right', -_margin + 'px');
                        this._leftArrow.css('right', (this.arrowButtonSize - _margin) + 'px');
                        break;
                }
            }
        },

        _positionArrows: function (totalItemsWidth) {
            if (totalItemsWidth >= parseInt(this._headerWrapper[0].offsetWidth) && this.scrollable) {
                this._needScroll = true;
                //When the arrows are invisible and after that they become visible
                if (this._unorderedList.position().left === 0) {
                    this._unorderedListLeftBackup = this._getArrowsDisplacement() + 'px';
                }
                this._leftArrow.css('display', 'block');
                this._rightArrow.css('display', 'block');
            } else {
                this._needScroll = false;
                this._leftArrow[0].style.display = "none";
                this._rightArrow[0].style.display = "none";
                this._unorderedList[0].style.left = "0px";
            }
        },

        _performHeaderLayout: function () {
            this._removeSelectStyle();
            var size = this._calculateTitlesSize();
            var maxItemHeight = size.height;
            var totalItemsWidth = size.width;
            this._headerWrapper.height(maxItemHeight);
            this._unorderedList.height(maxItemHeight);
            if (this.headerHeight != null && this.headerHeight != 'auto') {
                this._headerWrapper.height(this.headerHeight);
                this._unorderedList.height(this.headerHeight);
            }
            if (totalItemsWidth > this.host.width()) {
                this._unorderedList.width(totalItemsWidth);
            }
            else {
                this._unorderedList.width(this.host.width());
            }
            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                this._unorderedList.css('position', 'relative');
                this._headerWrapper.css('overflow', 'hidden');
            }

            this._reorderHeaderElements();
            totalItemsWidth = totalItemsWidth + parseInt(this._unorderedList.css('margin-left'));
            this._totalItemsWidth = totalItemsWidth;
            this._positionArrows(totalItemsWidth);
            this._unorderedList.css({
                'position': 'relative',
                'top': '0px'
            });
            this._verticalAlignElements();
            this._moveSelectionTrack(this._selectedItem, 0);
            this._addSelectStyle(this.selectedItem);
        },

        _verticalAlignElements: function () {
            var count = this.length();
            var maxHeightTab = this._maxHeightTab();
            while (count) {
                count--;
                var textWrapper = this._titleList[count].find('.jqx-tabs-titleContentWrapper'),
                                textWrapperHeight = textWrapper.height(),
                                closeButtonWrapper = this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)),
                                padding = parseInt(this._titleList[count].css('padding-top'));
                if (!padding) {
                    padding = 0;
                }
                if (this.autoHeight) {
                    var difference = this._titleList[count].outerHeight(true) - this._titleList[count].height();
                    //          this._titleList[count].height(parseInt(this._titleList[maxHeightTab].height()));
                    var topPadding = parseInt(this._titleList[count].css('padding-top'));
                    var bottomPadding = parseInt(this._titleList[count].css('padding-bottom'));
                    var topBorder = parseInt(this._titleList[count].css('border-top-width'));
                    var bottomBorder = parseInt(this._titleList[count].css('border-bottom-width'));
                    //      this._titleList[count].height('100%');
                    this._titleList[count].height(this._unorderedList.outerHeight() - topPadding - bottomPadding - topBorder - bottomBorder);
                    //           this._titleList[count].css('margin-top', 0);
                } else {
                    if (this.position === 'top') {
                        var margin = parseInt(this._unorderedList.height()) - parseInt(this._titleList[count].outerHeight(true));
                        if (parseInt(this._titleList[count].css('margin-top')) !== margin && margin !== 0) {
                            this._titleList[count].css('margin-top', margin);
                        }
                    } else {
                        this._titleList[count].height(this._titleList[count].height());
                    }
                }
                this._titleList[count].children(0).height('100%');

                //  this._titleList[count].children(0).height(this._titleList[count].height());
                var visibleHeight = parseInt(this._titleList[count].height());
                var closeButtonWrapperMiddle = parseInt(visibleHeight) / 2 - parseInt(closeButtonWrapper.height()) / 2;
                closeButtonWrapper.css('margin-top', 1 + closeButtonWrapperMiddle);
                var textWrapperMiddle = parseInt(visibleHeight) / 2 - parseInt(textWrapper.height()) / 2;
                textWrapper.css('margin-top', textWrapperMiddle);
            }
            //Align arrow
            if (this.scrollable) {
                var difference = parseInt(this._headerWrapper.outerHeight()) - this.arrowButtonSize;
                var halfDifference = difference / 2;
                this._rightArrow.children(0).css('margin-top', halfDifference);
                this._rightArrow.height('100%');
                this._leftArrow.height('100%');
                //      this._leftArrow.height(this._leftArrow.height() - 1);
                //        this._rightArrow.height(this._rightArrow.height() - 1);

                this._leftArrow.children(0).css('margin-top', halfDifference);
            }
        },

        _getImageUrl: function (arrowContainer) {
            var imageUrl = arrowContainer.css('background-image');
            imageUrl = imageUrl.replace('url("', '');
            imageUrl = imageUrl.replace('")', '');
            imageUrl = imageUrl.replace('url(', '');
            imageUrl = imageUrl.replace(')', '');
            return imageUrl;
        },

        _fitToSize: function () {
            var percentageWidth = false;
            var percentageHeight = false;
            var me = this;
            if (me.width != null && me.width.toString().indexOf("%") != -1) {
                percentageWidth = true;
            }

            if (me.height != null && me.height.toString().indexOf("%") != -1) {
                percentageHeight = true;
            }

            if (percentageWidth) {
                this.host[0].style.width = this.width;
                this._contentWrapper[0].style.width = '100%';
            }

            if (percentageHeight) {
                this.host[0].style.height = this.height;
                this._contentWrapper[0].style.width = '100%';
                this._contentWrapper[0].style.height = 'auto';
                var height = this.element.offsetHeight - this._headerWrapper[0].offsetHeight;
                this._contentWrapper[0].style.height = height + 'px';
            }

            if (!percentageWidth) {
                //Resizing the host and content container if height or width are set
                this.host.width(this.width);

                if (this.width != 'auto') {
                    this._contentWrapper.css('width', '100%');
                }
            }
            if (!percentageHeight) {
                if (this.height !== 'auto') {
                    this.host.height(this.height);
                    var height = this.host.height() - this._headerWrapper.outerHeight(); // -parseInt(this._titleList[this._maxHeightTab()].outerHeight(true));
                    this._contentWrapper.height(height); //borderOffset
                } else {
                    this._contentWrapper.css('height', 'auto');
                }
            }
        },

        _maxHeightTab: function () {
            var count = this.length();
            var maxSize = -1;
            var returnIndex = -1;
            while (count) {
                count--;
                if (maxSize < parseInt(this._titleList[count].outerHeight(true))) {
                    returnIndex = count;
                }
            }
            return returnIndex;
        },

        _addSelectionTracker: function () {
            if (this._moveSelectionTrackerContainer) {
                this._moveSelectionTrackerContainer.remove();
            }
            this._moveSelectionTrackerContainer = $('<div class="' + this.toThemeProperty('jqx-tabs-selection-tracker-container') + '">');
            var selectionTrackerClass = this.toThemeProperty('jqx-tabs-selection-tracker-' + this.position);
            this._selectionTracker = $('<div class="' + selectionTrackerClass + '">');
            this._selectionTracker.css('color', 'inherit');
            this._moveSelectionTrackerContainer.append(this._selectionTracker);
            this._headerWrapper.append(this._moveSelectionTrackerContainer);
            this._selectionTracker.css({
                'position': 'absolute',
                'z-index': '10',
                'left': '0px',
                'top': '0px',
                'display': 'inline-block'
            });
        },

        _addContentWrapper: function () {
            //Adding content wrapper
            var floating = 'none';
            //Content wrapper

            var addWrapper = this._contentWrapper == undefined;
            this._contentWrapper = this._contentWrapper || $('<div class="' + this.toThemeProperty('jqx-tabs-content') + '" style="float:' + floating + ';">');
            this._contentWrapper.addClass(this.toThemeProperty('jqx-widget-content'));
            var count = this.length();
            while (count) {
                count--;
                this._contentList[count].addClass(this.toThemeProperty('jqx-tabs-content-element'));
            }
            if (addWrapper) {
                this.host.find('.jqx-tabs-content-element').wrapAll(this._contentWrapper);
                this._contentWrapper = this.host.find('.jqx-tabs-content');
            }
            if (this.roundedCorners) {
                if (this.position == 'top') {
                    this._contentWrapper.addClass(this.toThemeProperty('jqx-rc-b'));
                }
                else {
                    this._contentWrapper.addClass(this.toThemeProperty('jqx-rc-t'));
                }

                this.host.addClass(this.toThemeProperty('jqx-rc-all'));
            }
        },

        _addHeaderWrappers: function () {
            var count = this.length();
            this._unorderedList.remove();
            this._headerWrapper = this._headerWrapper || $('<div class="jqx-tabs-headerWrapper" style="outline: none;">');
            this._headerWrapper.remove();
            if (this.position == 'top') {
                this._headerWrapper.prependTo(this.host);
            }
            else {
                this._headerWrapper.appendTo(this.host);
            }
            this._unorderedList.appendTo(this._headerWrapper);

            this._headerWrapper.addClass(this.toThemeProperty('jqx-tabs-header'));
            this._headerWrapper.addClass(this.toThemeProperty('jqx-widget-header'));
            if (this.position == 'bottom') {
                this._headerWrapper.addClass(this.toThemeProperty('jqx-tabs-header-bottom'));
            }
            else {
                this._headerWrapper.removeClass(this.toThemeProperty('jqx-tabs-header-bottom'));
            }

            if (this.roundedCorners) {
                if (this.position == 'top') {
                    this._headerWrapper.addClass(this.toThemeProperty('jqx-rc-t'));
                    this._headerWrapper.removeClass(this.toThemeProperty('jqx-rc-b'));
                }
                else {
                    this._headerWrapper.removeClass(this.toThemeProperty('jqx-rc-t'));
                    this._headerWrapper.addClass(this.toThemeProperty('jqx-rc-b'));
                }
            }

            while (count) {
                count--;
                if (this._titleList[count].children('.jqx-tabs-titleWrapper').length <= 0) {
                    var tabWrapper = $('<div class="jqx-tabs-titleWrapper" style="outline: none; position: relative;">');
                    tabWrapper.append(this._titleList[count].html());
                    this._titleList[count].empty();
                    tabWrapper.appendTo(this._titleList[count]);
                }
                this._titleList[count].children('.jqx-tabs-titleWrapper').css('z-index', '15');
            }
        },

        _render: function () {
            this._addCloseButtons();
            this._addHeaderWrappers();
            this._addContentWrapper();

            if (this.selectionTracker) {
                this._addSelectionTracker();
            }
            this._addArrows();
        },

        _addCloseButton: function (index) {
            var count = index;
            if (this._titleList[count].find(this.toThemeProperty('.jqx-tabs-close-button', true)).length <= 0 &&
                    this._titleList[count].find('.jqx-tabs-titleContentWrapper').length <= 0) {
                var titleWrapper = $('<div class="jqx-tabs-titleContentWrapper"></div>');
                var fl = 'left';
                if (this.rtl) fl = 'right';
                titleWrapper.css('float', fl);
                titleWrapper.addClass('jqx-disableselect');
                titleWrapper.append(this._titleList[count].html());
                this._titleList[count].html('');
                var closeButton = $('<div class="' + this.toThemeProperty('jqx-tabs-close-button') + '"></div>');
                closeButton.css({
                    'height': this.closeButtonSize,
                    'width': this.closeButtonSize,
                    'float': fl,
                    'font-size': '1px'
                });

                var me = this;
                this._titleList[count].append(titleWrapper);
                this._titleList[count].append(closeButton);
                //       closeButton.append('<img src="' + this._getImageUrl(closeButton) + '" style="width:' + this.closeButtonSize + 'px; height:' + this.closeButtonSize + 'px;" />');
                //       closeButton.css('background', 'transperent');
                if (!this.showCloseButtons) {
                    closeButton.css('display', 'none');
                }
                else if (this.hiddenCloseButtons) {
                    if (this.hiddenCloseButtons[index] == 1) {
                        closeButton.css('display', 'none');
                    }
                }
            }
        },

        _addCloseButtons: function () {
            var count = this.length();
            while (count) {
                count--;
                this._addCloseButton(count);
            }
        },

        //Unselecting all items which are not equal to selectedItem property
        _prepareTabs: function () {
            var count = this.length();
            var tracker = this.selectionTracker;
            this.selectionTracker = false;
            while (count) {
                count--;
                if (this._selectedItem !== count) {
                    this._unselect(count, null, false);
                }
            }
            this._select(this._selectedItem, 0, null, false);
            this.selectionTracker = tracker;
            if (this.initTabContent) {
                if (!this._initTabContentList[this.selectedItem]) {
                    if (!this._hiddenParent()) {
                        this.initTabContent(this.selectedItem);
                        this._initTabContentList[this.selectedItem] = true;
                    }
                }
            }
        },

        _isValidIndex: function (index) {
            return (index >= 0 && index < this.length());
        },

        _removeSelectStyle: function () {
            var count = this.length();
            while (count) {
                count--;
                var closeButton = null;
                if (this.showCloseButtons) {
                    var closeButton = this._titleList[count].children(0).children(this.toThemeProperty('.jqx-tabs-close-button', true));
                    closeButton.removeClass(this.toThemeProperty('jqx-tabs-close-button-selected'));
                }

                if (this.position == 'top') {
                    this._titleList[count].removeClass(this.toThemeProperty('jqx-tabs-title-selected-top'));
                }
                else {
                    this._titleList[count].removeClass(this.toThemeProperty('jqx-tabs-title-selected-bottom'));
                }
                this._titleList[count].removeClass(this.toThemeProperty('jqx-fill-state-pressed'));
            }
        },

        _addSelectStyle: function (index, force) {
            var count = this.length();
            this._removeSelectStyle();
            if (!this.selectionTracker || (force != undefined && force)) {
                if (index >= 0 && this._titleList[index] != undefined) {
                    var closeButton = null;
                    if (this.showCloseButtons) {
                        var closeButton = this._titleList[index].children(0).children(this.toThemeProperty('.jqx-tabs-close-button', true));
                        if (this.hiddenCloseButtons) {
                            if (this.hiddenCloseButtons[index] == 1) {
                                closeButton = null;
                            }
                        }
                    }

                    this._titleList[index].removeClass(this.toThemeProperty('jqx-fill-state-hover'));
                    if (this.position == 'top') {
                        this._titleList[index].removeClass(this.toThemeProperty('jqx-tabs-title-hover-top'));
                        this._titleList[index].addClass(this.toThemeProperty('jqx-tabs-title-selected-top'));
                    }
                    else {
                        this._titleList[index].removeClass(this.toThemeProperty('jqx-tabs-title-hover-bottom'));
                        this._titleList[index].addClass(this.toThemeProperty('jqx-tabs-title-selected-bottom'));
                    }
                    this._titleList[index].addClass(this.toThemeProperty('jqx-fill-state-pressed'));
                    if (closeButton != null) {
                        closeButton.addClass(this.toThemeProperty('jqx-tabs-close-button-selected'));
                    }
                }
            }
        },

        _addItemTo: function (collection, index, item) {
            if (index < collection.length) {
                var temp = undefined,
                    swap = undefined;
                for (var i = index; i + 1 < collection.length; i++) {
                    if (temp === undefined) {
                        temp = collection[i + 1];
                        collection[i + 1] = collection[i];
                    }
                    else {
                        swap = collection[i + 1];
                        collection[i + 1] = temp;
                        temp = swap;
                    }
                }
                if (temp === undefined) {
                    temp = collection[index];
                }
                collection[index] = item;
                collection.push(temp);
            } else {
                collection.push(item);
            }
        },

        _select: function (index, duration, callback, toTrigger, force) {
            if (!this._tabCaptured) {
                this.host.attr("hideFocus", "true");
                var self = this;
                if (force == undefined) {
                    this._addSelectStyle(index);
                }
                else {
                    this._addSelectStyle(index, force);
                }

                if (this.isCollapsed && this.collapsible) {
                    this._contentList[index].css('display', 'none');
                    this._selectCallback(index, callback, toTrigger);
                    return;
                }

                switch (this.animationType) {
                    case 'none':
                        if (!self.selectionTracker) {
                            for (var i = 0; i < this._contentList.length; i++) {
                                if (index != i && this._contentList[i].css('display') == 'block') {
                                    this._contentList[i].css('display', 'none');
                                    $.jqx.aria(this._titleList[i], "aria-selected", false);
                                    $.jqx.aria(this._contentList[i], "aria-hidden", true);
                                }
                            }
                            this._contentList[index].css('display', 'block');
                            $.jqx.aria(this._titleList[index], "aria-selected", true);
                            $.jqx.aria(this._contentList[index], "aria-hidden", false);
                            $.jqx.aria(this, 'aria-activedescendant', this._titleList[index][0].id);
                        }
                        else {
                            setTimeout(function () {
                                self._contentList[index].css('display', 'block');
                                $.jqx.aria(self._titleList[index], "aria-selected", true);
                                $.jqx.aria(self._contentList[index], "aria-hidden", false);
                                $.jqx.aria(self, 'aria-activedescendant', self._titleList[index][0].id);
                            }, this.selectionTrackerAnimationDuration);
                        }

                        this._selectCallback(index, callback, toTrigger);
                        break;
                    case 'fade':
                        this._lockAnimation('contentListSelect');
                        self._selectCallback(index, callback, toTrigger);
                        this._contentList[index].fadeIn(duration,
                            function () {
                                self._unlockAnimation('contentListSelect');
                                $.jqx.aria(self._titleList[index], "aria-selected", true);
                                $.jqx.aria(self._contentList[index], "aria-hidden", false);
                                $.jqx.aria(self, 'aria-activedescendant', self._titleList[index][0].id);
                            });
                        break;
                }
            }
        },

        _selectCallback: function (index, callback, toTrigger) {
            this._selectedItem = index;
            this.selectedItem = this._selectedItem;
            if (callback) {
                callback();
            }
            if (toTrigger) {
                this._raiseEvent(1, { item: index });
            }
        },

        _unselect: function (index, callback, toTrigger) {
            if (index >= 0) {
                if (!this._tabCaptured) {
                    var self = this;
                    this._contentList[index].stop();

                    if (this.animationType == 'fade') {
                        this._contentList[index].css('display', 'none');
                        $.jqx.aria(self._titleList[index], "aria-selected", false);
                        $.jqx.aria(self._contentList[index], "aria-hidden", true);
                    }
                    else {
                        if (this.selectionTracker) {
                            setTimeout(function () {
                                self._contentList[index].css('display', 'none');
                                $.jqx.aria(self._titleList[index], "aria-selected", false);
                                $.jqx.aria(self._contentList[index], "aria-hidden", true);
                            }, this.selectionTrackerAnimationDuration);
                        }
                        else {
                            this._contentList[index].css('display', 'none');
                            $.jqx.aria(self._titleList[index], "aria-selected", false);
                            $.jqx.aria(self._contentList[index], "aria-hidden", true);
                        }
                    }

                    this._unselectCallback(index, callback, toTrigger);

                    if (!this.selectionTracker) {
                        this._titleList[index].removeClass(this.toThemeProperty('jqx-tabs-title-selected'));
                        this._titleList[index].removeClass(this.toThemeProperty('jqx-fill-state-pressed'));
                    }
                }
            }
        },


        _unselectCallback: function (index, callback, toTrigger) {
            if (toTrigger) {
                this._raiseEvent(8, { item: index });
            }

            if (callback) {
                callback();
            }
        },

        //Disabling the widget
        disable: function () {
            var count = this.length();
            while (count) {
                count--;
                this.disableAt(count);
            }
        },

        //Enabling the widget
        enable: function () {
            var count = this.length();
            while (count) {
                count--;
                this.enableAt(count);
            }
        },

        // gets the count of the enabled items.
        getEnabledTabsCount: function () {
            var length = 0;
            $.each(this._titleList, function () {
                if (!this.disabled) {
                    length++;
                }
            });

            return length;
        },

        // gets the count of the disabled items.
        getDisabledTabsCount: function () {
            var length = 0;
            $.each(this._titleList, function () {
                if (this.disabled) {
                    length++;
                }
            });

            return length;
        },

        //Removing tab with indicated index
        removeAt: function (index) {
            if (this._isValidIndex(index) && (this.canCloseAllTabs || this.length() > 1)) {
                this._removeHoverStates();
                var self = this,
                    selectedObject = this._titleList[this._selectedItem],
                    closeItemWidth = parseInt(this._titleList[index].outerWidth(true)),
                    title = this.getTitleAt(index);
                this._unorderedList.width(parseInt(this._unorderedList.width()) - closeItemWidth);
                this._titleList[index].remove();
                this._contentList[index].remove();

                var ensureVisibleIndex = 0;
                this._titleList.splice(index, 1);
                this._contentList.splice(index, 1);

                this._addStyles();
                this._performHeaderLayout();
                this._removeEventHandlers();
                this._addEventHandlers();
                this._raiseEvent(3, { item: index, title: title });
                this._isAnimated = {};

                if (this.selectedItem > 0) {
                    this._selectedItem = -1;
                    var current = this._getPreviousIndex(this.selectedItem);
                    this.select(current);
                }
                else {
                    this._selectedItem = -1;
                    var current = this._getNextIndex(this.selectedItem);
                    this.select(current);
                }

                //Fixing some issues with the scrolling
                if (parseInt(this._unorderedList.css('left')) > this._getArrowsDisplacement()) {
                    this._unorderedList.css('left', this._getArrowsDisplacement());
                }
                if (parseInt(this._unorderedList.width()) <= parseInt(this._headerWrapper.width())) {
                    var duration = (this.enableScrollAnimation) ? this.scrollAnimationDuration : 0;
                    this._lockAnimation('unorderedList');
                    this._unorderedList.animate({ 'left': 0 }, duration, function () {
                        self._unlockAnimation('unorderedList');
                    });
                }
            }
        },

        //Removing the first tab
        removeFirst: function () {
            this.removeAt(0);
        },

        //Removing the last tab
        removeLast: function () {
            this.removeAt(this.length() - 1);
        },

        //Disabling tab with indicated index
        disableAt: function (index) {
            if (!this._titleList[index].disabled ||
            this._titleList[index].disabled === undefined) {
                if (this.selectedItem == index) {
                    var selectedNext = this.next();
                    if (!selectedNext) {
                        selectedNext = this.previous();
                    }
                }

                this._titleList[index].disabled = true;
                this.removeHandler(this._titleList[index], this.toggleMode);
                if (this.enabledHover) {
                    this._titleList[index].off('mouseenter').off('mouseleave');
                }
                this._removeEventListenerAt(index);
                this._titleList[index].addClass(this.toThemeProperty('jqx-tabs-title-disable'));
                this._titleList[index].addClass(this.toThemeProperty('jqx-fill-state-disabled'));
                this._raiseEvent(5, { item: index });
            }
        },

        //Enabling tab in indicated position
        enableAt: function (index) {
            if (this._titleList[index].disabled) {
                this._titleList[index].disabled = false;
                this._addEventListenerAt(index);
                this._titleList[index].removeClass(this.toThemeProperty('jqx-tabs-title-disable'));
                this._titleList[index].removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
                this._raiseEvent(4, { item: index });
            }
        },

        //Adding tab in indicated position
        addAt: function (index, title, content) {
            if (index >= 0 || index <= this.length()) {
                this._removeHoverStates();
                var titleContainer = $('<li>' + title + '</li>');
                var navigatorInnerContainer = $('<div>' + content + '</div>');
                titleContainer.addClass(this.toThemeProperty('jqx-tabs-title'));
                titleContainer.addClass(this.toThemeProperty('jqx-item'));
                navigatorInnerContainer.addClass(this.toThemeProperty('jqx-tabs-content-element'));

                if (this.position == 'bottom') {
                    titleContainer.addClass(this.toThemeProperty('jqx-tabs-title-bottom'));
                }
                var fullRefresh = false;

                if (this._titleList.length == 0) {
                    this._unorderedList.append(titleContainer);
                }
                else {
                    if (index < this.length() && index >= 0) {
                        this._titleList[index].before(titleContainer);
                    } else {
                        this._titleList[this.length() - 1].after(titleContainer);
                    }
                }

                navigatorInnerContainer.appendTo(this._contentWrapper);
                this._addItemTo(this._titleList, index, titleContainer);
                this._addItemTo(this._contentList, index, navigatorInnerContainer);
                if (this._selectedItem > index) {
                    this._selectedItem++;
                }
                this._switchTabs(index, this._selectedItem);
                this._selectedItem = index;
                if (this.showCloseButtons && this._titleList.length > 0) {
                    this._addCloseButton(index);
                }

                this._uiRefresh(fullRefresh);
                this._raiseEvent(2, { item: index });
                this._moveSelectionTrack(this._selectedItem, 0);
            }
        },

        //Adding tab in the beginning
        addFirst: function (title, content) {
            this.addAt(0, title, content);
        },

        //Adding tab in the end
        addLast: function (title, content) {
            this.addAt(this.length(), title, content);
        },

        val: function (value) {
            if (arguments.length == 0 || typeof (value) == "object") {
                return this._selectedItem;
            }

            this.select(value);
            return this._selectedItem;
        },

        //Selecting tab with indicated index
        select: function (index, toggle) {
            if (typeof (index) === 'object') {
                index = this._indexOf(index);
            }

            var canSelect = index >= 0 && index < this._titleList.length ? this._titleList[index].attr('canselect') : true;
            if (canSelect == undefined || canSelect == 'true' || canSelect == true) {
                if (index !== this._selectedItem && this._isValidIndex(index)) {
                    if (!this._activeAnimation() && !this._titleList[index].disabled) {
                        var res = this._switchTabs(index, this._selectedItem);
                        if (res) {
                            this.ensureVisible(index);
                        }
                    }
                }
            }
        },

        //Selecting the previous item
        previous: function (item) {
            var index = this._selectedItem;
            if (item != undefined && !isNaN(item)) index = item;

            while (index > 0 && index < this._titleList.length) {
                index--;
                if (!this._titleList[index].disabled) {
                    this.select(index);
                    return true;
                }
            }
            return false;
        },


        _getPreviousIndex: function (index) {
            if (index != undefined && !isNaN(index)) {
                var savedIndex = index;
                while (index > 0 && index <= this._titleList.length) {
                    index--;
                    if (!this._titleList[index].disabled) {
                        return index;
                        break;
                    }
                }

                return savedIndex;
            }
            else return 0;
        },


        _getNextIndex: function (index) {
            if (index != undefined && !isNaN(index)) {
                var savedIndex = index;

                while (index >= 0 && index < this._titleList.length) {
                    if (!this._titleList[index].disabled) {
                        return index;
                        break;
                    }
                    index++;
                }

                return savedIndex;
            }
            else return 0;
        },

        //Selecting the next item
        next: function (item) {
            var index = this._selectedItem;
            if (item != undefined && !isNaN(item)) index = item;

            while (index >= 0 && index < this._titleList.length - 1) {
                index++;
                if (!this._titleList[index].disabled) {
                    this.select(index);
                    return true;
                }
            }

            return false;
        },

        //Selecting the first item
        first: function () {
            var index = 0;
            if (this._titleList[index].disabled) {
                this.next(index);
            }
            else {
                this.select(index);
            }
        },

        //Selecting the first item
        last: function () {
            var index = this._titleList.length - 1;
            if (this._titleList[index].disabled) {
                this.previous(index);
            }
            else {
                this.select(index);
            }
        },

        //Returning the tabs count
        length: function () {
            return this._titleList.length;
        },

        //Locking tab with specific index
        lockAt: function (index) {
            if (this._isValidIndex(index) &&
                (!this._titleList[index].locked ||
                 this._titleList[index].locked === undefined)) {
                this._titleList[index].locked = true;
                this._raiseEvent(11, { item: index });
            }
        },

        //Unlocing a tab with specific index
        unlockAt: function (index) {
            if (this._isValidIndex(index) &&
                this._titleList[index].locked) {
                this._titleList[index].locked = false;
                this._raiseEvent(12, { item: index });
            }
        },

        //Locing all tabs
        lockAll: function () {
            var count = this.length();
            while (count) {
                count--;
                this.lockAt(count);
            }
        },

        //Unlocking all tabs
        unlockAll: function () {
            var count = this.length();
            while (count) {
                count--;
                this.unlockAt(count);
            }
        },

        //Showing close button in a specific position
        showCloseButtonAt: function (index) {
            if (this._isValidIndex(index)) {
                if (!this.showCloseButtons) {
                    this.showCloseButtons = true;
                    this.updatetabsheader();
                }

                var closeButton = this._titleList[index].find(this.toThemeProperty('.jqx-tabs-close-button', true));
                closeButton.css('display', 'block');
                if (!this.hiddenCloseButtons) this.hiddenCloseButtons = new Array();
                this.hiddenCloseButtons[index] = 0;
            }
        },

        //Hiding a close button in a specific position
        hideCloseButtonAt: function (index) {
            if (this._isValidIndex(index)) {
                var closeButton = this._titleList[index].find(this.toThemeProperty('.jqx-tabs-close-button', true));
                closeButton.css('display', 'none');
                if (!this.hiddenCloseButtons) this.hiddenCloseButtons = new Array();
                this.hiddenCloseButtons[index] = 1;
            }
        },

        //Hiding all close buttons
        hideAllCloseButtons: function () {
            var count = this.length();
            while (count) {
                count--;
                this.hideCloseButtonAt(count);
            }
        },

        //Showing all close buttons.
        showAllCloseButtons: function () {
            var count = this.length();
            while (count) {
                count--;
                this.showCloseButtonAt(count);
            }
        },

        //Getting the title of specified tab.
        getTitleAt: function (index) {
            if (this._titleList[index]) {
                return this._titleList[index].text();
            }
            return null;
        },

        //Getting the content of specified tab.
        getContentAt: function (index) {
            if (this._contentList[index]) {
                return this._contentList[index];
            }
            return null;
        },

        setTitleAt: function (index, text) {
            if (this._titleList[index]) {
                this._titleList[index].text(text);
                if (this.showCloseButtons) {
                    this._addCloseButton(index);
                    this._removeEventHandlers();
                    this._addEventHandlers();

                }
                this.render();
                this.refresh();
            }
        },

        setContentAt: function (index, html) {
            if (this._contentList[index]) {
                this._contentList[index].html(html);
            }
        },

        //This method is ensuring the visibility of item with indicated index.
        //If the item is currently not visible the method is scrolling to it.
        ensureVisible: function (index) {
            var self = this;
            if (index == undefined || index == -1 || index == null)
                index = this.selectedItem;
            if (!this._isValidIndex(index)) {
                return false;
            }
            var itemRelativePosition = parseInt(this._titleList[index].position().left) + parseInt(this._unorderedList.css('margin-left'));
            var unorderedListPosition = parseInt(this._unorderedList.css('left'));
            var headerWrapperWidth = parseInt(this._headerWrapper.outerWidth(true));
            var itemWidth = parseInt(this._titleList[index].outerWidth(true));
            var visibleAreaLeftEnd = unorderedListPosition - this._getArrowsDisplacement();
            var visibleAreaRightEnd = headerWrapperWidth - this._getArrowsDisplacement() - visibleAreaLeftEnd;
            var scrollPosition, trackerPosition;
            if (itemRelativePosition < -visibleAreaLeftEnd) {
                scrollPosition = -itemRelativePosition + this._getArrowsDisplacement();
                trackerPosition = this._getArrowsDisplacement();
            } else if (itemRelativePosition + itemWidth > visibleAreaRightEnd - this._getArrowsDisplacement()) {
                scrollPosition = -itemRelativePosition + headerWrapperWidth - itemWidth -
                ((this.scrollable) ? (2 * this.arrowButtonSize - this._getArrowsDisplacement()) : 0);
                trackerPosition = headerWrapperWidth - itemWidth - this._getArrowsDisplacement();
            } else {
                this._moveSelectionTrack(index, this.selectionTrackerAnimationDuration);
                return true;
            }
            this._lockAnimation('unorderedList');
            this._unorderedList.animate({ 'left': scrollPosition }, this.scrollAnimationDuration, function () {
                self._unlockAnimation('unorderedList');
                self._moveSelectionTrack(self._selectedItem, 0);
                return true;
            });
            this._moveSelectionTrack(index, this.selectionTrackerAnimationDuration, trackerPosition);
            return true;
        },

        // gets whether an item is visible.
        isVisibleAt: function (index) {
            var self = this;
            if (index == undefined || index == -1 || index == null)
                index = this.selectedItem;
            if (!this._isValidIndex(index)) {
                return false;
            }
            var itemRelativePosition = parseInt(this._titleList[index].position().left) + parseInt(this._unorderedList.css('margin-left'));
            var unorderedListPosition = parseInt(this._unorderedList.css('left'));
            var headerWrapperWidth = parseInt(this._headerWrapper.outerWidth(true));
            var itemWidth = parseInt(this._titleList[index].outerWidth(true));
            var visibleAreaLeftEnd = unorderedListPosition - this._getArrowsDisplacement();
            var visibleAreaRightEnd = headerWrapperWidth - this._getArrowsDisplacement() - visibleAreaLeftEnd;
            var scrollPosition, trackerPosition;
            if (itemRelativePosition < -visibleAreaLeftEnd) {
                return false;
            } else if (itemRelativePosition + itemWidth > visibleAreaRightEnd) {
                return false;
            } else {
                return true;
            }
            return true;
        },

        //Return true if the tab is disabled and false if it is not
        isDisabled: function (index) {
            return this._titleList[index].disabled;
        },

        _lockAnimation: function (type) {
            if (this._isAnimated) {
                this._isAnimated[type] = true;
            }
        },

        _unlockAnimation: function (type) {
            if (this._isAnimated) {
                this._isAnimated[type] = false;
            }
        },

        propertiesChangedHandler: function (object, oldValues, newValues)
        {
            if (newValues && newValues.width && newValues.height && Object.keys(newValues).length == 2)
            {
                object._setSize();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (object.batchUpdate && object.batchUpdate.width && object.batchUpdate.height && Object.keys(object.batchUpdate).length == 2)
            {
                return;
            }
            this._validateProperties();
            switch (key) {
                case "touchMode":
                    if (value) {
                        object.enabledHover = false;
                        object.keyboardNavigation = false;
                    }
                    break;
                case "width":
                case "height":
                    object._setSize();
                    return;
                case 'disabled':
                    if (value) {
                        this.disable();
                    } else {
                        this.enable();
                    }
                    return;
                case 'showCloseButtons':
                    if (value) {
                        this.showAllCloseButtons();
                    } else {
                        this.hideAllCloseButtons();
                    }
                    this._moveSelectionTrack(this._selectedItem, this.selectionTrackerAnimationDuration);
                    return;
                case 'selectedItem':
                    if (this._isValidIndex(value)) {
                        this.select(value);
                    }
                    return;
                case 'scrollStep':
                case 'contentTransitionDuration':
                case 'scrollAnimationDuration':
                case 'enableScrollAnimation':
                    return;
                case 'selectionTracker':
                    if (value) {
                        this._refresh();
                        this.select(this._selectedItem);
                    } else {
                        if (this._selectionTracker != null) {
                            this._selectionTracker.remove();
                        }
                    }
                    return;
                case 'scrollable':
                    if (value) {
                        this._refresh();
                        this.select(this._selectedItem);
                    } else {
                        this._leftArrow.remove();
                        this._rightArrow.remove();
                        this._performHeaderLayout();
                    }
                    return;
                case 'autoHeight':
                    this._performHeaderLayout();
                    return;
                case 'theme':
                    $.jqx.utilities.setTheme(oldvalue, value, this.host);
                    return;
            }
            this._unorderedList.css('left', '0px');
            this._refresh();
            this.select(this._selectedItem);
            this._addSelectStyle(this._selectedItem, true);
        }
    });
}(jqxBaseFramework));