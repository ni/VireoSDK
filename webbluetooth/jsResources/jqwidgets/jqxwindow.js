/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget('jqxWindow', '', {});

    $.extend($.jqx._jqxWindow.prototype, {

        defineInstance: function () {
            var settings = {
                // Type: String, Number
                // Default: auto
                // Sets or gets window's height.
                height: 'auto',
                // Type: Number
                // Default: 200
                // Sets or gets window's width.
                width: 200,
                // Type: Number
                // Default: 50
                // Gets or sets window's minimum height.
                minHeight: 50,
                // Type: Number
                // Default: 600
                // Gets or sets window's maximum height.
                maxHeight: 600,
                // Type: Number
                // Default: 50
                // Gets or sets window's minimum height.
                minWidth: 50,
                // Type: Number
                // Default: 600
                // Gets or sets window's maximum width.
                maxWidth: 800,
                // Type: Bool
                // Default: true
                // Gets or sets whether the close button will be shown.
                showCloseButton: true,
                // Type: Bool
                // Default: false
                // Gets or sets whether the window is disabled.
                disabled: false,
                // Type: Bool
                // Default: true
                // Sets or gets whether the window will be shown after it's creation.
                autoOpen: true,
                // Type: Bool
                // Default: true
                // Sets or gets whether the window could be closed with Escape or another keyboard key.
                keyboardCloseKey: 'esc',
                // Type: String
                // Default: ''
                // Sets or gets window's title.
                title: '',
                // Type: String
                // Default: ''
                // Sets or gets window's content.
                content: '',
                // Type: Bool
                // Default: true
                // Sets or gets whether the window is draggale.
                draggable: true,
                // Type: Bool
                // Default: true
                // Sets or gets whether the window is resizable.
                resizable: true,
                // Type: Bool
                // Default: 'fade'
                // Sets or gets window's animation type. Possible values ['none', 'fade', 'slide', 'combined']
                animationType: 'fade',
                // Type: Number
                // Default: 250
                // Sets or gets window's hide animation duration.
                closeAnimationDuration: 250,
                // Type: Number
                // Default: 250
                // Sets or gets window's show animation duration.
                showAnimationDuration: 250,
                // Type: Bool
                // Default: false
                // Sets or gets whether the window is modal.
                isModal: false,
                // Type: String, Array, Object
                // Default: 'center'
                // Sets or gets window's position. Possible values - 'center', 'bottom, left', [232, 45], { x: 42, y: 34 }.
                position: 'center',
                // Type: Number
                // Default: 16
                // Sets or gets close button's size.
                closeButtonSize: 16,
                // Type: String
                // Default: hide
                // Sets or gets close button action. Possible values ['hide', 'close']. When closeButtonAction is close we are removing the widget.
                closeButtonAction: 'hide',
                // Type: Number
                // Default: 0.5
                // Sets or gets modal background's opacity
                modalOpacity: 0.3,
                // Type: Object
                // Default: null
                // Sets or gets the dragging area. Example { left: 300, top: 300, width: 600, height: 600 }
                dragArea: null,
                // Type: Object
                // Default: null
                // Sets or gets submit button
                okButton: null,
                // Type: Object
                // Default: null
                // Sets or gets the cancel button
                cancelButton: null,
                // Type: Object
                // Default: { OK: false, Cancel: false, None: true }
                // Sets or gets the dialog result
                dialogResult: { OK: false, Cancel: false, None: true },
                // Type: Bool
                // Default: false
                // Sets or gets whether the window is collapsed
                collapsed: false,
                // Type: Bool
                // Default: true
                // Sets or gets whether the collapse button is going to be shown
                showCollapseButton: false,
                // Type: Number
                // Default: 150
                // Sets or gets the collapse animation duration
                collapseAnimationDuration: 150,
                // Type: Number
                // Default: 16
                // Sets or gets the collapse button size
                collapseButtonSize: 16,
                rtl: false,
                keyboardNavigation: true,
                headerHeight: null,
                //To move show into 4th place into the array and to remove open
                _events: ['created', 'closed', 'moving', 'moved', 'open', 'collapse', 'expand', 'open', 'close', 'resize'],
                initContent: null,
                enableResize: true,
                restricter: null,
                autoFocus: true,
                closing: null,
                _invalidArgumentExceptions: {
                    'invalidHeight': 'Invalid height!',
                    'invalidWidth': 'Invalid width!',
                    'invalidMinHeight': 'Invalid minHeight!',
                    'invalidMaxHeight': 'Invalid maxHeight!',
                    'invalidMinWidth': 'Invalid minWidth!',
                    'invalidMaxWidth': 'Invalid maxWidth',
                    'invalidKeyCode': 'Invalid keyCode!',
                    'invalidAnimationType': 'Invalid animationType!',
                    'invalidCloseAnimationDuration': 'Invalid closeAnimationDuration!',
                    'invalidShowAnimationDuration': 'Invalid showAnimationDuration!',
                    'invalidPosition': 'Invalid position!',
                    'invalidCloseButtonSize': 'Invalid closeButtonSize!',
                    'invalidCollapseButtonSize': 'Invalid collapseButtonSize!',
                    'invalidCloseButtonAction': 'Invalid cluseButtonAction!',
                    'invalidModalOpacity': 'Invalid modalOpacity!',
                    'invalidDragArea': 'Invalid dragArea!',
                    'invalidDialogResult': 'Invalid dialogResult!',
                    'invalidIsModal': 'You can have just one modal window!'
                },

                _enableResizeCollapseBackup: null,
                _enableResizeBackup: undefined,
                _heightBeforeCollapse: null,
                _minHeightBeforeCollapse: null,
                _mouseDown: false,
                _isDragging: false,
                _rightContentWrapper: null,
                _leftContentWrapper: null,
                _headerContentWrapper: null,
                _closeButton: null,
                _collapseButton: null,
                _title: null,
                _content: null,
                _mousePosition: {},
                _windowPosition: {},
                _modalBackground: null,
                _SCROLL_WIDTH: 21,
                _visible: true,
                modalBackgroundZIndex: 12990,
                modalZIndex: 18000,
                zIndex: 9001,
                _touchEvents: {
                    'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                    'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
                    'mousemove': $.jqx.mobile.getTouchEventName('touchmove'),
                    'mouseenter': 'mouseenter',
                    'mouseleave': 'mouseleave',
                    'click': $.jqx.mobile.getTouchEventName('touchstart')
                }
            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            this.host.attr('role', 'dialog');
            this.host.removeAttr('data-bind');
            this.host.detach();
            $(document.body).append(this.host);
            var that = this;

            var initRestricter = function () {
                var paddingTop = parseInt($(that.restricter).css('padding-top'));
                var paddingLeft = parseInt($(that.restricter).css('padding-left'));
                var paddingBottom = parseInt($(that.restricter).css('padding-bottom'));
                var paddingRight = parseInt($(that.restricter).css('padding-right'));

                var coord = $(that.restricter).coord();
                that.dragArea = { left: paddingLeft + coord.left, top: paddingTop + coord.top, width: 1 + paddingRight + $(that.restricter).width(), height: 1 + paddingBottom + $(that.restricter).height() };
            }

            if (this.restricter) {
                initRestricter();
            }

            if (this.restricter) {
                this.addHandler($(window), 'resize.' + this.element.id, function () {
                    initRestricter();
                });
                this.addHandler($(window), 'orientationchanged.' + this.element.id, function () {
                    initRestricter();
                });
                this.addHandler($(window), 'orientationchange.' + this.element.id, function () {
                    initRestricter();
                });
            }

            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            this._validateProperties();
            this._createStructure();
            this._refresh();
            if (!this.autoOpen) {
                this.host.css('display', 'none');
            }
            if ($.jqx.browser.msie) {
                this.host.addClass(this.toThemeProperty('jqx-noshadow'));
            }
            if (!this.isModal) {
                this._fixWindowZIndex();
            }

            this._setStartupSettings();
            this._positionWindow();
            this._raiseEvent(0);

            if (this.autoOpen) {
                this._performLayout();
                var self = this;
                if (this.isModal) {
                    this._fixWindowZIndex('modal-show');
                }
                if (self.initContent) {
                    self.initContent();
                    self._contentInitialized = true;
                }
                this._raiseEvent(7);
                this._raiseEvent(9);
            }
        },

        refresh: function () {
            this._performLayout();
        },

        _setStartupSettings: function () {
            if (this.disabled) {
                this.disable();
            }
            if (this.collapsed) {
                this.collapsed = false;
                this.collapse(0);
            }
            if (!this.autoOpen) {
                this.hide(null, 0.001, true);
                this._visible = false;
            }
            if (this.title !== null && this.title !== '') {
                this.setTitle(this.title);
            }
            if (this.content !== null && this.content !== '') {
                this.setContent(this.content);
            }
            this.title = this._headerContentWrapper.html();
            this.content = this._content.html();
        },

        //Fixing window's z-index and adding it to the collection of all windows
        //saved in $.data. In the end of the method we are sorting the window list in ascending z-index order.
        _fixWindowZIndex: function (type) {
            var windowsList = $.data(document.body, 'jqxwindows-list') || [], zIndex = this.zIndex, tempZIndex;
            if (!this.isModal) {
                if (this._indexOf(this.host, windowsList) < 0) {
                    windowsList.push(this.host);
                }
                $.data(document.body, 'jqxwindows-list', windowsList);
                if (windowsList.length > 1) {
                    var upperWindow = windowsList[windowsList.length - 2];
                    if (upperWindow.css('z-index') == "auto")
                    {
                        zIndex = this.zIndex + windowsList.length + 1;
                    }
                    else
                    {
                        var zIndexByProperty = this.zIndex;
                        zIndex = parseInt(upperWindow.css('z-index'), 10) + 1;
                        if (zIndex < zIndexByProperty)
                        {
                            zIndex = zIndexByProperty;
                        }
                    }
                }
            } else {
                if (windowsList) {
                    windowsList = this._removeFromArray(this.host, windowsList);
                    $.data(document.body, 'jqxwindows-list', windowsList);
                }

                var modalWindows = $.data(document.body, 'jqxwindows-modallist');
                if (!modalWindows) {
                    if (type == 'modal-show') {
                        var list = new Array();
                        list.push(this.host);
                        $.data(document.body, 'jqxwindows-modallist', list);
                        modalWindows = list;
                    }
                    else {
                        $.data(document.body, 'jqxwindows-modallist', new Array());
                        modalWindows = new Array();
                    }
                }
                else {
                    if (type == 'modal-show') {
                        modalWindows.push(this.host);
                    }
                    else {
                        var index = modalWindows.indexOf(this.host);
                        if (index != -1) {
                            modalWindows.splice(index, 1);
                        }
                    }
                }


                zIndex = this.modalZIndex; ;

                var me = this;
                $.each(modalWindows, function (p) {
                    if (this.data()) {
                        if (this.data().jqxWindow) {
                            var instance = this.data().jqxWindow.instance;
                            instance._modalBackground.css('z-index', zIndex);
                            instance.host.css('z-index', zIndex + 1);
                            zIndex += 2;
                        }
                    }
                });

                $.data(document.body, 'jqxwindow-modal', this.host);

                return;
            }
            this.host.css('z-index', zIndex);
            this._sortByStyle('z-index', windowsList);
        },

        _validateProperties: function () {
            try {
                this._validateSize();
                this._validateAnimationProperties();
                this._validateInteractionProperties();
                this._validateModalProperties();
                if (!this.position) {
                    throw new Error(this._invalidArgumentExceptions['invalidPosition']);
                }
                if (isNaN(this.closeButtonSize) || parseInt(this.closeButtonSize) < 0) {
                    throw new Error(this._invalidArgumentExceptions['invalidCloseButtonSize']);
                }
                if (isNaN(this.collapseButtonSize) || parseInt(this.collapseButtonSize) < 0) {
                    throw new Error(this._invalidArgumentExceptions['invalidCollapseButtonSize']);
                }
            } catch (exception) {
                alert(exception);
            }
        },

        _validateModalProperties: function () {
            if (this.modalOpacity < 0 || this.modalOpacity > 1) {
                throw new Error(this._invalidArgumentExceptions['invalidModalOpacity']);
            }
            if (this.isModal && !this._singleModalCheck()) {
                throw new Error(this._invalidArgumentExceptions['invalidIsModal']);
            }
        },

        //If window's height is less than minHeight we are stting height to minHeight the same when the width is less than minWidth.
        //If window's height is greater than maxHeight we are setting height to maxHeight the same with the width.
        _validateSize: function () {
            this._validateSizeLimits();
            if (this.height !== 'auto' && isNaN(parseInt(this.height))) {
                throw new Error(this._invalidArgumentExceptions['invalidHeight']);
            }
            if (this.width !== 'auto' && isNaN(parseInt(this.width))) {
                throw new Error(this._invalidArgumentExceptions['invalidWidth']);
            }
            if (this.height !== 'auto' && this.height < this.minHeight) {
                this.height = this.minHeight;
            }
            if (this.width < this.minWidth) {
                this.width = this.minWidth;
            }
            if (this.height !== 'auto' && this.height > this.maxHeight) {
                this.height = this.maxHeight;
            }
            if (this.width > this.maxWidth) {
                this.width = this.maxWidth;
            }
            if (this.dragArea === null) return;
            if (this.dragArea && ((this.dragArea.height !== null && this.host.height() > this.dragArea.height) ||
                (parseInt(this.height, 10) > this.dragArea.height)) ||
                (this.dragArea.width !== null && this.width > this.dragArea.width) ||
                (this.maxHeight > this.dragArea.height || this.maxWidth > this.dragArea.width)) {
                //throw new Error(this._invalidArgumentExceptions['invalidDragArea']);
            }
        },

        _validateSizeLimits: function () {
            if (this.maxHeight == null) this.maxHeight = 9999;
            if (this.minWidth == null) this.minWidth = 0;
            if (this.maxWidth == null) this.maxWidth = 9999;
            if (this.minHeight == null) this.minHeight = 0;

            if (isNaN(parseInt(this.minHeight))) {
                throw new Error(this._invalidArgumentExceptions['invalidMinHeight']);
            }
            if (isNaN(parseInt(this.maxHeight))) {
                throw new Error(this._invalidArgumentExceptions['invalidMaxHeight']);
            }
            if (isNaN(parseInt(this.minWidth))) {
                throw new Error(this._invalidArgumentExceptions['invalidMinWidth']);
            }
            if (isNaN(parseInt(this.maxWidth))) {
                throw new Error(this._invalidArgumentExceptions['invalidMaxWidth']);
            }
            if (this.minHeight > this.maxHeight) {
                throw new Error(this._invalidArgumentExceptions['invalidMinHeight']);
            }
            if (this.minWidth > this.maxWidth) {
                throw new Error(this._invalidArgumentExceptions['invalidMinWidth']);
            }
        },

        _validateAnimationProperties: function () {
            if (this.animationType !== 'fade' && this.animationType !== 'slide' && this.animationType !== 'combined' && this.animationType !== 'none') {
                throw new Error(this._invalidArgumentExceptions['invalidAnimationType']);
            }
            if (isNaN(parseInt(this.closeAnimationDuration), 10) || this.closeAnimationDuration < 0) {
                throw new Error(this._invalidArgumentExceptions['invalidCloseAnimationDuration']);
            }
            if (isNaN(parseInt(this.showAnimationDuration), 10) || this.showAnimationDuration < 0) {
                throw new Error(this._invalidArgumentExceptions['invalidShowAnimationDuration']);
            }
        },

        _validateInteractionProperties: function () {
            if (parseInt(this.keyCode, 10) < 0 || parseInt(this.keyCode, 10) > 130 && this.keyCode !== 'esc') {
                throw new Error(this._invalidArgumentExceptions['invalidKeyCode']);
            }
            if (this.dragArea !== null && (typeof this.dragArea.width === 'undefined' ||
                typeof this.dragArea.height === 'undefined' || typeof this.dragArea.left === 'undefined' || typeof this.dragArea.top === 'undefined')) {
                throw new Error(this._invalidArgumentExceptions['invalidDragArea']);
            }
            if (!this.dialogResult || (!this.dialogResult.OK && !this.dialogResult.Cancel && !this.dialogResult.None)) {
                throw new Error(this._invalidArgumentExceptions['invalidDialogResult']);
            }
            if (this.closeButtonAction !== 'hide' && this.closeButtonAction !== 'close') {
                throw new Error(this._invalidArgumentExceptions['invalidCloseButtonAction']);
            }
        },

        _singleModalCheck: function () {
            var windowsList = $.data(document.body, 'jqxwindows-list') || [],
                count = windowsList.length;
            while (count) {
                count -= 1;
                if ($(windowsList[count].attr('id')).length > 0) {
                    if ($(windowsList[count].attr('id')).jqxWindow('isModal')) {
                        return false;
                    }
                }
            }
            return true;
        },

        //This method is constructing the window from two type's of structures.
        //The first one is containing two divs. The first one is window's host and contain 'caption' attribute. The second
        //div is window's content.
        //The second one is containing three divs. The first one is representing the window. Second one (first inner)
        //window's header and the third one window's content.
        _createStructure: function () {
            var children = this.host.children('DIV');
            if (children.length === 1) {
                this._header = $('<div>' + this.host.attr('caption') + '</div>');
                this.host.prepend(this._header);
                this.host.attr('caption', '');
                this._content = $(children[0]);
            } else if (children.length === 2) {
                this._header = $(children[0]);
                this._content = $(children[1]);
            } else {
                throw new Error('Invalid structure!');
            }
        },

        _refresh: function () {
            this._render();
            this._addStyles();
            this._performLayout();
            this._removeEventHandlers();
            this._addEventHandlers();
            this._initializeResize();
        },

        _render: function () {
            this._addHeaderWrapper();
            this._addCloseButton();
            this._addCollapseButton();
            this._removeModal();
            this._makeModal();
        },

        _addHeaderWrapper: function () {
            if (!this._headerContentWrapper) {
                this._header.wrapInner('<div style="float:left;"></div>');
                this._headerContentWrapper = this._header.children(0);
                if (this.headerHeight !== null) {
                    this._header.height(this.headerHeight);
                }
            }
        },

        _addCloseButton: function () {
            if (!this._closeButton) {
                // the wrapper's purpose is to be a background of the close button's image.  
                this._closeButtonWrapper = $('<div class="' + this.toThemeProperty('jqx-window-close-button-background') + '"></div>');
                this._closeButton = $('<div style="width: 100%; height: 100%;" class="' + this.toThemeProperty('jqx-window-close-button') + ' ' + this.toThemeProperty('jqx-icon-close') + '"></div>');
                this._closeButtonWrapper.append(this._closeButton);
                this._header.append(this._closeButtonWrapper);
            }
        },

        _addCollapseButton: function () {
            if (!this._collapseButton) {
                // the wrapper's purpose is to be a background of the close button's image.  
                this._collapseButtonWrapper = $('<div class="' + this.toThemeProperty('jqx-window-collapse-button-background') + '"></div>');
                this._collapseButton = $('<div style="width: 100%; height: 100%;" class="' + this.toThemeProperty('jqx-window-collapse-button') + ' ' + this.toThemeProperty('jqx-icon-arrow-up') + '"></div>');
                this._collapseButtonWrapper.append(this._collapseButton);
                this._header.append(this._collapseButtonWrapper);
            }
        },

        _removeModal: function () {
            if (!this.isModal && typeof this._modalBackground === 'object' &&
                this._modalBackground !== null && this._modalBackground.length >= 1) {
                $('.' + this.toThemeProperty('jqx-window-modal')).remove();
                this._modalBackground = null;
            }
        },

        focus: function () {
            try {
                this.host.focus();
                var me = this;
                setTimeout(function () {
                    me.host.focus();
                }, 10);
            }
            catch (error) {
            }
        },

        _makeModal: function () {
            if (this.isModal && (!this._modalBackground || this._modalBackground.length < 1)) {
                var windows = $.data(document.body, 'jqxwindows-list');
                if (windows) {
                    this._removeFromArray(this.host, windows);
                    $.data(document.body, 'jqxwindows-list', windows);
                }
                this._modalBackground = $('<div></div>');
                this._modalBackground.addClass(this.toThemeProperty('jqx-window-modal'));
                this._setModalBackgroundStyles();
                $(document.body).append(this._modalBackground);
                this.addHandler(this._modalBackground, this._getEvent('click'), function () {
                    return false;
                });
                var me = this;
                var ischildof = function (element, filter_string) {
                    var parents = $(element).parents().get();

                    for (j = 0; j < parents.length; j++) {
                        if ($(parents[j]).is(filter_string)) {
                            return true;
                        }
                    }

                    return false;
                }

                this.addHandler(this._modalBackground, 'mouseup', function (event) {
                    me._stopResizing(me);
                    event.preventDefault();
                    //     return false;
                });
                this.addHandler(this._modalBackground, 'mousedown', function (event) {
                    var tabbables = me._getTabbables();
                    if (tabbables.length > 0) {
                        tabbables[0].focus(1);
                        setTimeout(function () {
                            tabbables[0].focus(1);
                        }, 100);
                    }

                    event.preventDefault();
                    return false;
                });

                this.addHandler($(document), 'keydown.window' + this.element.id, function (event) {
                    if (event.keyCode !== 9) {
                        return;
                    }

                    var modalWindows = $.data(document.body, 'jqxwindows-modallist');
                    if (modalWindows.length > 1) {
                        if (modalWindows[modalWindows.length - 1][0] != me.element) {
                            return;
                        }
                    }

                    var tabbables = me._getTabbables();
                    var first = null;
                    var last = null;

                    if (tabbables.length > 0) {
                        first = tabbables[0];
                        last = tabbables[tabbables.length - 1];
                    }

                    if (event.target == me.element)
                        return;

                    if (first == null)
                        return;

                    if (!ischildof(event.target, me.host)) {
                        first.focus(1);
                        return false;
                    }

                    if (event.target === last && !event.shiftKey) {
                        first.focus(1);
                        return false;
                    } else if (event.target === first && event.shiftKey) {
                        last.focus(1);
                        return false;
                    }
                });
            }
        },

        _addStyles: function () {
            this.host.addClass(this.toThemeProperty('jqx-rc-all'));
            this.host.addClass(this.toThemeProperty('jqx-window'));
            this.host.addClass(this.toThemeProperty('jqx-popup'));
            if ($.jqx.browser.msie) {
                this.host.addClass(this.toThemeProperty('jqx-noshadow'));
            }
            this.host.addClass(this.toThemeProperty('jqx-widget'));
            this.host.addClass(this.toThemeProperty('jqx-widget-content'));
            this._header.addClass(this.toThemeProperty('jqx-window-header'));
            this._content.addClass(this.toThemeProperty('jqx-window-content'));
            this._header.addClass(this.toThemeProperty('jqx-widget-header'));
            this._content.addClass(this.toThemeProperty('jqx-widget-content'));
            this._header.addClass(this.toThemeProperty('jqx-disableselect'));
            this._header.addClass(this.toThemeProperty('jqx-rc-t'));
            this._content.addClass(this.toThemeProperty('jqx-rc-b'));
            if (!this.host.attr('tabindex')) {
                this.element.tabIndex = 0;
                this.host.children().css('tab-index', 0);
            }
            this.host.attr("hideFocus", "true").css("outline", "none");
        },

        _performHeaderLayout: function () {
            this._handleHeaderButtons();
            this._header.css('position', 'relative');
            if (this.rtl) {
                this._headerContentWrapper.css('direction', 'rtl');
                this._headerContentWrapper.css('float', 'right');
            }
            else {
                this._headerContentWrapper.css('direction', 'ltr');
                this._headerContentWrapper.css('float', 'left');
            }

            this._performHeaderCloseButtonLayout();
            this._performHeaderCollapseButtonLayout();

            this._centerElement(this._headerContentWrapper, this._header, 'y', 'margin');
            if (this.headerHeight) {
                this._centerElement(this._closeButtonWrapper, this._header, 'y', 'margin');
                this._centerElement(this._collapseButtonWrapper, this._header, 'y', 'margin');
            }
        },

        _handleHeaderButtons: function () {
            if (!this._closeButtonWrapper) return;

            if (!this.showCloseButton) {
                this._closeButtonWrapper.css('visibility', 'hidden');
            } else {
                this._closeButtonWrapper.css('visibility', 'visible');
                this._closeButtonWrapper.width(this.closeButtonSize);
                this._closeButtonWrapper.height(this.closeButtonSize);
            }
            if (!this.showCollapseButton) {
                this._collapseButtonWrapper.css('visibility', 'hidden');
            } else {
                this._collapseButtonWrapper.css('visibility', 'visible');
                this._collapseButtonWrapper.width(this.collapseButtonSize);
                this._collapseButtonWrapper.height(this.collapseButtonSize);
            }
        },

        _performHeaderCloseButtonLayout: function () {
            if (!this._closeButtonWrapper) return;

            var paddingRight = parseInt(this._header.css('padding-right'), 10);
            if (!isNaN(paddingRight)) {
                this._closeButtonWrapper.width(this._closeButton.width());
                if (!this.rtl) {
                    this._closeButtonWrapper.css('margin-right', paddingRight);
                    this._closeButtonWrapper.css('margin-left', '0px');
                }
                else {
                    this._closeButtonWrapper.css('margin-left', paddingRight);
                    this._closeButtonWrapper.css('margin-right', '0px');
                }
            }
            if (!this.rtl) {
                this._closeButtonWrapper.css({
                    'position': 'absolute',
                    'right': '0px',
                    'left': ''
                });
            }
            else {
                this._closeButtonWrapper.css({
                    'position': 'absolute',
                    'left': '0px',
                    'right': ''
                });
            }
        },

        _performHeaderCollapseButtonLayout: function () {
            if (!this._closeButtonWrapper) return;
            var paddingRight = parseInt(this._header.css('padding-right'), 10);
            if (!isNaN(paddingRight)) {
                this._collapseButtonWrapper.width(this.collapseButtonSize);
                this._collapseButtonWrapper.height(this.collapseButtonSize);
                if (!this.rtl) {
                    this._collapseButtonWrapper.css('margin-right', paddingRight);
                    this._collapseButtonWrapper.css('margin-left', '0px');
                }
                else {
                    this._collapseButtonWrapper.css('margin-left', paddingRight);
                    this._collapseButtonWrapper.css('margin-right', '0px');
                }
            }
            if (!this.rtl) {
                this._collapseButtonWrapper.css({
                    'position': 'absolute',
                    'right': (this.showCloseButton) ? this._closeButton.outerWidth(true) : 0,
                    'left': ''
                });
            }
            else {
                this._collapseButtonWrapper.css({
                    'position': 'absolute',
                    'left': (this.showCloseButton) ? this._closeButton.outerWidth(true) : 0,
                    'right': ''
                });
            }

            this._centerElement(this._collapseButton, this._collapseButton.parent(), 'y');
        },

        _performWidgetLayout: function () {
            var isValid;
            if (this.width !== 'auto') {
                this.host.css('width', this.width);
            }
            if (!this.collapsed) {
                if (this.height !== 'auto') {
                    this.host.height(this.height);
                } else {
                    this.host.height(this.host.height());
                }
                this.host.css('min-height', this.minHeight);
            }
            this._setChildrenLayout();
            isValid = this._validateMinSize();
            this.host.css({
                'max-height': this.maxHeight,
                'min-width': this.minWidth,
                'max-width': this.maxWidth
            });
            if (!isValid) {
                this._setChildrenLayout();
            }
        },

        _setChildrenLayout: function () {
            this._header.width(this.host.width() - (this._header.outerWidth(true) - this._header.width()));
            this._content.width(this.host.width() - (this._content.outerWidth(true) - this._content.width()));
            this._content.height(this.host.height() - this._header.outerHeight(true) - (this._content.outerHeight(true) - this._content.height()));
        },

        _validateMinSize: function () {
            var returnValue = true;
            if (this.minHeight < this._header.height()) {
                this.minHeight = this._header.height();
                returnValue = false;
            }
            var headerContentWidth = this._header.children(0).outerWidth(true),
                closeButtonWidth = this._header.children(1).outerWidth(true),
                headerInnerWidth = headerContentWidth + closeButtonWidth;
            if (this.minWidth < 100) {
                this.minWidth = Math.min(headerInnerWidth, 100);
                returnValue = false;
            }
            return returnValue;
        },

        _centerElement: function (child, parent, axis, attribute) {
            if (typeof parent.left === 'number' && typeof parent.top === 'number' &&
                typeof parent.height === 'number' && typeof parent.width === 'number') {
                this._centerElementInArea(child, parent, axis);
            } else {
                this._centerElementInParent(child, parent, axis, attribute);
            }
        },

        _centerElementInParent: function (child, parent, axis, attribute) {
            axis = axis.toLowerCase();
            if (attribute) {
                attribute += '-';
            } else {
                attribute = '';
            }
            if (axis.indexOf('y') >= 0) {
                var childHeight = child.outerHeight(true),
                    parentHeight = parent.height(),
                    verticalDisplacement = (Math.max(0, parentHeight - childHeight)) / 2;
                child.css(attribute + 'top', verticalDisplacement + 'px');
            }
            if (axis.indexOf('x') >= 0) {
                var childWidth = child.outerWidth(true);
                var parentWidth = parent.width();
                var horizontalDisplacement = (Math.max(0, parentWidth - childWidth)) / 2;
                child.css(attribute + 'left', horizontalDisplacement + 'px');
            }
        },

        _centerElementInArea: function (child, area, axis) {
            axis = axis.toLowerCase();
            if (axis.indexOf('y') >= 0) {
                var childHeight = child.outerHeight(true);
                var parentHeight = area.height;
                var verticalDisplacement = (parentHeight - childHeight) / 2;
                child.css('top', verticalDisplacement + area.top + 'px');
            }
            if (axis.indexOf('x') >= 0) {
                var childWidth = child.outerWidth(true);
                var parentWidth = area.width;
                var horizontalDisplacement = (parentWidth - childWidth) / 2;
                child.css('left', horizontalDisplacement + area.left + 'px');
            }
        },

        _removeEventHandlers: function () {
            this.removeHandler(this._header, this._getEvent('mousedown'));
            this.removeHandler(this._header, this._getEvent('mousemove'));
            this.removeHandler(this._header, 'focus');
            this.removeHandler($(document), this._getEvent('mousemove') + '.' + this.host.attr('id'));
            this.removeHandler($(document), this._getEvent('mouseup') + '.' + this.host.attr('id'));
            this.removeHandler(this.host, 'keydown');
            this.removeHandler(this._closeButton, this._getEvent('click'));
            this.removeHandler(this._closeButton, this._getEvent('mouseenter'));
            this.removeHandler(this._closeButton, this._getEvent('mouseleave'));
            this.removeHandler(this._collapseButton, this._getEvent('click'));
            this.removeHandler(this._collapseButton, this._getEvent('mouseenter'));
            this.removeHandler(this._collapseButton, this._getEvent('mouseleave'));
            this.removeHandler(this.host, this._getEvent('mousedown'));
            this.removeHandler($(this.okButton), this._getEvent('click'), this._setDialogResultHandler);
            this.removeHandler($(this.cancelButton), this._getEvent('click'), this._setDialogResultHandler);
            this.removeHandler(this._header, this._getEvent('mouseenter'));
            this.removeHandler(this._header, this._getEvent('mouseleave'));
            this.removeHandler(this.host, 'resizing', this._windowResizeHandler);
        },

        _removeFromArray: function (element, array) {
            var indexOfElement = this._indexOf(element, array);
            if (indexOfElement >= 0) {
                return array.splice(this._indexOf(element, array), 1);
            } else {
                return array;
            }
        },

        _sortByStyle: function (attr, collection) {
            for (var i = 0; i < collection.length; i++) {
                for (var j = collection.length - 1; j > i; j--) {
                    var itemOne = collection[j], itemTwo = collection[j - 1], tmp;
                    if (parseInt(itemOne.css(attr), 10) < parseInt(itemTwo.css(attr), 10)) {
                        tmp = itemOne;
                        collection[j] = itemTwo;
                        collection[j - 1] = tmp;
                    }
                }
            }
        },

        _initializeResize: function () {
            if (this.resizable) {
                var self = this;
                this.initResize({
                    target: this.host,
                    alsoResize: self._content,
                    maxWidth: self.maxWidth,
                    minWidth: self.minWidth,
                    maxHeight: self.maxHeight,
                    minHeight: self.minHeight,
                    indicatorSize: 10,
                    resizeParent: self.dragArea
                });
            }
        },

        _removeResize: function () {
            this.removeResize();
        },

        _getEvent: function (event) {
            if (this._isTouchDevice) {
                return this._touchEvents[event];
            } else {
                return event;
            }
        },

        _addEventHandlers: function () {
            this._addDragDropHandlers();
            this._addCloseHandlers();
            this._addCollapseHandlers();
            this._addFocusHandlers();
            this._documentResizeHandlers();
            this._closeButtonHover();
            this._collapseButtonHover();
            this._addDialogButtonsHandlers();
            this._addHeaderHoverEffect();
            this._addResizeHandlers();
            var me = this;
            this.addHandler(this._header, this._getEvent('mousemove'), function (event) {
                me._addHeaderCursorHandlers(me);
            }
            );
        },

        _addResizeHandlers: function () {
            var self = this;
            this.addHandler(this.host, 'resizing', this._windowResizeHandler, { self: this });
        },

        _windowResizeHandler: function (event) {
            var self = event.data.self;
            self._header.width(self.host.width() - (self._header.outerWidth(true) - self._header.width()));
            self.width = event.args.width;
            self.height = event.args.height;
        },

        _addHeaderHoverEffect: function () {
            var self = this;
            this.addHandler(this._header, this._getEvent('mouseenter'), function () {
                $(this).addClass(self.toThemeProperty('jqx-window-header-hover'));
            });
            this.addHandler(this._header, this._getEvent('mouseleave'), function () {
                $(this).removeClass(self.toThemeProperty('jqx-window-header-hover'));
            });
        },

        _addDialogButtonsHandlers: function () {
            if (this.okButton) {
                this.addHandler($(this.okButton), this._getEvent('click'), this._setDialogResultHandler, { self: this, result: 'ok' });
            }
            if (this.cancelButton) {
                this.addHandler($(this.cancelButton), this._getEvent('click'), this._setDialogResultHandler, { self: this, result: 'cancel' });
            }
        },

        _documentResizeHandlers: function () {
            var self = this;
            if (this.isModal) {
                this.addHandler($(window), 'resize.window' + this.element.id, function () {
                    if (typeof self._modalBackground === 'object' && self._modalBackground !== null) {
                        if (self.isOpen()) {
                            self._modalBackground.hide();
                        }
                        if (!self.restricter) {
                            self._modalBackground.width(self._getDocumentSize().width);
                            self._modalBackground.height(self._getDocumentSize().height);
                        }
                        else {
                            self._modalBackground.css('left', self.dragArea.left);
                            self._modalBackground.css('top', self.dragArea.top);
                            self._modalBackground.width(self.dragArea.width);
                            self._modalBackground.height(self.dragArea.height);
                        }

                        if (self.isOpen()) {
                            self._modalBackground.show();
                        }
                    }
                });
            }
        },

        _setDialogResultHandler: function (event) {
            var self = event.data.self;
            self._setDialogResult(event.data.result);
            self.closeWindow();
        },

        _setDialogResult: function (result) {
            this.dialogResult.OK = false;
            this.dialogResult.None = false;
            this.dialogResult.Cancel = false;
            result = result.toLowerCase();
            switch (result) {
                case 'ok':
                    this.dialogResult.OK = true;
                    break;
                case 'cancel':
                    this.dialogResult.Cancel = true;
                    break;
                default:
                    this.dialogResult.None = true;
            }
        },

        _getDocumentSize: function () {
            var isIEBefore9 = $.jqx.browser.msie && $.jqx.browser.version < 9;
            var scrollTop = isIEBefore9 ? 4 : 0;
            var scrollLeft = scrollTop;
            if (document.body.scrollHeight > document.body.clientHeight && isIEBefore9) {
                scrollTop = this._SCROLL_WIDTH;
            }
            if (document.body.scrollWidth > document.body.clientWidth && isIEBefore9) {
                scrollLeft = this._SCROLL_WIDTH;
            }
            return { width: $(document).width() - scrollTop, height: $(document).height() - scrollLeft };
        },

        _closeButtonHover: function () {
            var self = this;
            this.addHandler(this._closeButton, this._getEvent('mouseenter'), function () {
                self._closeButton.addClass(self.toThemeProperty('jqx-window-close-button-hover'));
            });
            this.addHandler(this._closeButton, this._getEvent('mouseleave'), function () {
                self._closeButton.removeClass(self.toThemeProperty('jqx-window-close-button-hover'));
            });
        },

        _collapseButtonHover: function () {
            var self = this;
            this.addHandler(this._collapseButton, this._getEvent('mouseenter'), function () {
                self._collapseButton.addClass(self.toThemeProperty('jqx-window-collapse-button-hover'));
            });
            this.addHandler(this._collapseButton, this._getEvent('mouseleave'), function () {
                self._collapseButton.removeClass(self.toThemeProperty('jqx-window-collapse-button-hover'));
            });
        },

        _setModalBackgroundStyles: function () {
            if (this.isModal) {
                this._modalBackground.fadeTo(0, this.modalOpacity);
                this._modalBackground.css({
                    'position': 'absolute',
                    'top': '0px',
                    'left': '0px',
                    'width': this._getDocumentSize().width,
                    'height': this._getDocumentSize().height,
                    'z-index': this.modalBackgroundZIndex
                });
                if (!this.autoOpen) {
                    this._modalBackground.css('display', 'none');
                }
            }
        },

        _addFocusHandlers: function () {
            var self = this;
            this.addHandler(this.host, this._getEvent('mousedown'), function () {
                if (!self.isModal) {
                    self.bringToFront();
                }
            });
        },

        _indexOf: function (host, collection) {
            for (var i = 0; i < collection.length; i++) {
                if (collection[i][0] === host[0]) {
                    return i;
                }
            }
            return -1;
        },

        _addCloseHandlers: function () {
            var self = this;
            this.addHandler(this._closeButton, this._getEvent('click'), function (event) {
                return self._closeWindow(event);
            }
            );
            if (this.keyboardCloseKey !== 'none') {
                if (typeof this.keyboardCloseKey !== 'number' && this.keyboardCloseKey.toLowerCase() === 'esc') {
                    this.keyboardCloseKey = 27;
                }
            }
            this.addHandler(this.host, 'keydown', function (event) {
                if (event.keyCode === self.keyboardCloseKey && self.keyboardCloseKey != null && self.keyboardCloseKey != 'none') {
                    self._closeWindow(event);
                }
                else self._handleKeys(event);
            }, { self: this });

            this.addHandler(this.host, 'keyup', function (event) {
                if (!self.keyboardNavigation) return;

                if (self._moved) {
                    var offset = self.host.coord();
                    var left = offset.left;
                    var top = offset.top;
                    self._raiseEvent(3, left, top, left, top);
                    self._moved = false;
                }
            });
        },

        _handleKeys: function (event) {
            if (!this.keyboardNavigation) return;
            if (!this._headerFocused) return;
            if ($(document.activeElement).ischildof(this._content)) return;

            var ctrl = event.ctrlKey;
            var key = event.keyCode;
            var offset = this.host.coord();
            var left = offset.left;
            var top = offset.top;
            var area = this._getDraggingArea();
            var width = this.host.width();
            var height = this.host.height();
            var result = true;
            var step = 10;

            switch (key) {
                case 37:
                    if (!ctrl) {
                        if (this.draggable) {
                            if (left - step >= 0) {
                                this.move(left - step, top);
                            }
                        }
                    }
                    else {
                        if (this.resizable) {
                            this.resize(width - step, height);
                        }
                    }
                    result = false;
                    break;
                case 38:
                    if (!ctrl) {
                        if (this.draggable) {
                            if (top - step >= 0) {
                                this.move(left, top - step);
                            }
                        }
                    }
                    else {
                        if (this.resizable) {
                            this.resize(width, height - step);
                        }
                    }
                    result = false;
                    break;
                case 39:
                    if (!ctrl) {
                        if (this.draggable) {
                            if (left + width + step <= area.width) {
                                this.move(left + step, top);
                            }
                        }
                    }
                    else {
                        if (this.resizable) {
                            this.resize(width + step, height);
                        }
                    }
                    result = false;
                    break;
                case 40:
                    if (!ctrl) {
                        if (this.draggable) {
                            if (top + height + step <= area.height) {
                                this.move(left, top + step);
                            }
                        }
                    }
                    else {
                        if (this.resizable) {
                            this.resize(width, height + step);
                        }
                    }
                    result = false;
                    break;
            }
            if (!result) {
                if (event.preventDefault) event.preventDefault();
                if (event.stopPropagation) event.stopPropagation();
            }

            return result;
        },

        _addCollapseHandlers: function () {
            var self = this;
            this.addHandler(this._collapseButton, this._getEvent('click'), function () {
                if (!self.collapsed) {
                    self.collapse();
                } else {
                    self.expand();
                }
            });
        },

        _closeWindow: function (event) {
            this.closeWindow();
            return false;
        },

        _addHeaderCursorHandlers: function (self) {
            if (self.resizeArea && self.resizable && !self.collapsed) {
                self._header.css('cursor', self._resizeWrapper.css('cursor'));
                return;
            } else if (self.draggable) {
                self._header.css('cursor', 'move');
                return;
            }
            self._header.css('cursor', 'default');
            if (self._resizeWrapper && self._resizeWrapper.length > 0) {
                self._resizeWrapper.css('cursor', 'default')
            }
        },

        _addDragDropHandlers: function () {
            if (this.draggable) {
                var self = this;
                this.addHandler(this.host, 'focus', function () {
                    self._headerFocused = true;
                });

                this.addHandler(this.host, 'blur', function () {
                    self._headerFocused = false;
                });

                this.addHandler(this._header, 'focus', function () {
                    self._headerFocused = true;
                    return false;
                });

                this.addHandler(this._header, this._getEvent('mousedown'), function (event, x, y) {
                    if (x) {
                        event.pageX = x;
                    }
                    if (y) {
                        event.pageY = y;
                    }
                    self._headerMouseDownHandler(self, event);
                    return true;
                });

                this.addHandler(this._header, 'dragstart', function (event) {
                    if (event.preventDefault) {
                        event.preventDefault();
                    }
                    return false;
                });

                this.addHandler(this._header, this._getEvent('mousemove'), function (event) {
                    return self._headerMouseMoveHandler(self, event);
                });

                this.addHandler($(document), this._getEvent('mousemove') + '.' + this.host.attr('id'), function (event) {
                    return self._dragHandler(self, event);
                });
                this.addHandler($(document), this._getEvent('mouseup') + '.' + this.host.attr('id'), function (event) {
                    return self._dropHandler(self, event);
                });

                try {
                    if (document.referrer != "" || window.frameElement) {
                        var parentLocation = null;
                        if (window.top != null && window.top != window.self) {
                            if (window.parent && document.referrer) {
                                parentLocation = document.referrer;
                            }
                        }

                        if (parentLocation && parentLocation.indexOf(document.location.host) != -1) {
                            var eventHandle = function (event) {
                                self._dropHandler(self, event);
                            };

                            if (window.top.document.addEventListener) {
                                window.top.document.addEventListener('mouseup', eventHandle, false);

                            } else if (window.top.document.attachEvent) {
                                window.top.document.attachEvent("on" + 'mouseup', eventHandle);
                            }
                        }
                    }
                }
                catch (error) {
                }
            }
        },

        _headerMouseDownHandler: function (self, event) {
            if (!self.isModal) {
                self.bringToFront();
            }
            if (self._resizeDirection == null) {
                var touches = $.jqx.mobile.getTouches(event);
                var touch = touches[0];
                var position = $.jqx.position(event);
                self._mousePosition.x = position.left;
                self._mousePosition.y = position.top;
                self._mouseDown = true;
                self._isDragging = false;
            }
        },

        _headerMouseMoveHandler: function (self, event) {
            if (self._mouseDown && !self._isDragging) {
                var touches = $.jqx.mobile.getTouches(event);
                var touch = touches[0];

                var pageX = touch.pageX,
                    pageY = touch.pageY;
                var position = $.jqx.position(event);
                pageX = position.left;
                pageY = position.top;

                if ((pageX + 3 < self._mousePosition.x || pageX - 3 > self._mousePosition.x) ||
                    (pageY + 3 < self._mousePosition.y || pageY - 3 > self._mousePosition.y)) {
                    self._isDragging = true;
                    self._mousePosition = { x: pageX, y: pageY };
                    //self._windowPosition = { x: parseInt(self.host.css('left'), 10), y: parseInt(self.host.css('top'), 10) };
                    self._windowPosition = { x: self.host.coord().left, y: self.host.coord().top };
                    $(document.body).addClass(self.toThemeProperty('jqx-disableselect'));
                }
                if (self._isTouchDevice) {
                    event.preventDefault();
                    return true;
                }
                return false;
            }
            if (self._isDragging) {
                if (self._isTouchDevice) {
                    event.preventDefault();
                    return true;
                }
                return false;
            }
            return true;
        },

        _dropHandler: function (self, event) {
            var result = true;
            if (self._isDragging && !self.isResizing && !self._resizeDirection) {
                var x = parseInt(self.host.css('left'), 10),
                    y = parseInt(self.host.css('top'), 10),
                    pageX = (self._isTouchDevice) ? 0 : event.pageX,
                    pageY = (self._isTouchDevice) ? 0 : event.pageY;
                self.enableResize = self._enableResizeBackup;
                self._enableResizeBackup = 'undefined';
                self._raiseEvent(3, x, y, pageX, pageY);
                result = false;

                if (event.preventDefault != 'undefined') {
                    event.preventDefault();
                }

                if (event.originalEvent != null) {
                    event.originalEvent.mouseHandled = true;
                }

                if (event.stopPropagation != 'undefined') {
                    event.stopPropagation();
                }
            }
            self._isDragging = false;
            self._mouseDown = false;
            $(document.body).removeClass(self.toThemeProperty('jqx-disableselect'));
            return result;
        },

        _dragHandler: function (self, event) {
            if (self._isDragging && !self.isResizing && !self._resizeDirection) {
                var eventWhich = (self._isTouchDevice) ? event.originalEvent.which : event.which;
                if (typeof self._enableResizeBackup === 'undefined') {
                    self._enableResizeBackup = self.enableResize;
                }
                self.enableResize = false;
                if (eventWhich === 0 && $.jqx.browser.msie && $.jqx.browser.version < 8) {
                    return self._dropHandler(self, event);
                }
                var touches = $.jqx.mobile.getTouches(event);
                var touch = touches[0];
                var position = $.jqx.position(event);

                var pageX = position.left,
                    pageY = position.top,
                    displacementX = pageX - self._mousePosition.x,
                    displacementY = pageY - self._mousePosition.y,
                    newX = self._windowPosition.x + displacementX,
                    newY = self._windowPosition.y + displacementY;
                self.move(newX, newY, event);
                event.preventDefault();
                return false;
            }
            return true;
        },

        _validateCoordinates: function (x, y, scrollTop, scrollLeft) {
            var dragArea = this._getDraggingArea();
            x = (x < dragArea.left) ? dragArea.left : x;
            y = (y < dragArea.top) ? dragArea.top : y;
            var hostwidth = this.host.outerWidth(true);
            var hostheight = this.host.outerHeight(true);
            if (x + hostwidth >= dragArea.width + dragArea.left - 2 * scrollLeft) {
                x = dragArea.width + dragArea.left - hostwidth - scrollLeft;
            }
            if (y + hostheight >= dragArea.height + dragArea.top - scrollTop) {
                y = dragArea.height + dragArea.top - hostheight - scrollTop;
            }
            return { x: x, y: y };
        },

        _performLayout: function () {
            this._performHeaderLayout();
            this._performWidgetLayout();
        },

        _parseDragAreaAttributes: function () {
            if (this.dragArea !== null) {
                this.dragArea.height = parseInt(this.dragArea.height, 10);
                this.dragArea.width = parseInt(this.dragArea.width, 10);
                this.dragArea.top = parseInt(this.dragArea.top, 10);
                this.dragArea.left = parseInt(this.dragArea.left, 10);
            }
        },

        _positionWindow: function () {
            this._parseDragAreaAttributes();
            if (this.position instanceof Array && this.position.length === 2 &&
                typeof this.position[0] === 'number' &&
                typeof this.position[1] === 'number') {
                this.host.css({
                    'left': this.position[0],
                    'top': this.position[1]
                });
            } else if (this.position instanceof Object) {
                if (this.position.left) {
                    this.host.offset(this.position);
                }
                else if (this.position.x !== undefined && this.position.y != undefined) {
                    this.host.css({
                        'left': this.position.x,
                        'top': this.position.y
                    });
                }
                else if (this.position.center) {
                    this._centerElement(this.host, this.position.center, 'xy');
                    var coord = this.position.center.coord();
                    var left = parseInt(this.host.css('left'));
                    var top = parseInt(this.host.css('top'));
                    this.host.css({ left: left + coord.left, top: top + coord.top });
                }
            } else {
                this._positionFromLiteral();
            }
        },

        _getDraggingArea: function () {
            var draggingArea = {};
            draggingArea.left = ((this.dragArea && this.dragArea.left) ? this.dragArea.left : 0);
            draggingArea.top = ((this.dragArea && this.dragArea.top) ? this.dragArea.top : 0);
            draggingArea.width = ((this.dragArea && this.dragArea.width) ? this.dragArea.width : this._getDocumentSize().width);
            draggingArea.height = ((this.dragArea && this.dragArea.height) ? this.dragArea.height : this._getDocumentSize().height);
            return draggingArea;
        },

        _positionFromLiteral: function () {
            if (!(this.position instanceof Array)) {
                this.position = this.position.split(',');
            }
            var count = this.position.length, dragArea = this._getDraggingArea();
            while (count) {
                count -= 1;
                this.position[count] = this.position[count].replace(/ /g, '');
                switch (this.position[count]) {
                    case 'top':
                        this.host.css('top', dragArea.top);
                        break;
                    case 'left':
                        this.host.css('left', dragArea.left);
                        break;
                    case 'bottom':
                        this.host.css('top', dragArea.height - this.host.height() + dragArea.top);
                        break;
                    case 'right':
                        this.host.css('left', dragArea.left + dragArea.width - this.host.width());
                        break;
                    default:
                        if (!this.dragArea) dragArea = $(window);
                        this._centerElement(this.host, dragArea, 'xy');
                        break;
                }
            }
        },

        _raiseEvent: function (eventId) {
            var eventType = this._events[eventId], event = $.Event(eventType), args = {};
            if (eventId === 2 || eventId === 3) {
                args.x = arguments[1];
                args.y = arguments[2];
                args.pageX = arguments[3];
                args.pageY = arguments[4];
            }
            if (eventType === 'closed' || eventType === 'close') {
                args.dialogResult = this.dialogResult;
            }
            event.args = args;
            return this.host.trigger(event);
        },

        destroy: function () {
            this.removeHandler($(window), 'resize.window' + this.element.id);
            this._removeEventHandlers();
            this._destroy();
        },

        _destroy: function () {
            if (this.restricter) {
                this.removeHandler($(window), 'resize.' + this.element.id);
                this.removeHandler($(window), 'orientationchanged.' + this.element.id);
                this.removeHandler($(window), 'orientationchange.' + this.element.id);
            }
            this.host.remove();
            if (this._modalBackground !== null) {
                this._modalBackground.remove();
            }
        },

        _toClose: function (closeCurrent, target) {
            return ((closeCurrent && target[0] === this.element) ||
                (target[0] !== this.element && typeof target[0] === 'object'));
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            this._validateProperties();
            switch (key) {
                case 'rtl':
                    this._performLayout();
                    break;
                case 'dragArea':
                    this._positionWindow();
                    break;
                case 'collapseButtonSize':
                    this._performLayout();
                    break;
                case 'closeButtonSize':
                    this._performLayout();
                    break;
                case 'isModal':
                    this._refresh();
                    this._fixWindowZIndex();
                    break;
                case 'keyboardCloseKey':
                    this._removeEventHandlers();
                    this._addEventHandlers();
                    break;
                case 'disabled':
                    if (value) {
                        this.disable();
                    } else {
                        this.disabled = true;
                        this.enable();
                    }
                    break;
                case 'showCloseButton':
                case 'showCollapseButton':
                    this._performLayout();
                    break;
                case 'height':
                    this._performLayout();
                    break;
                case 'width':
                    this._performLayout();
                    break;
                case 'title':
                    this.setTitle(value);
                    this.title = value;
                    break;
                case 'content':
                    this.setContent(value);
                    break;
                case 'draggable':
                    this._removeEventHandlers();
                    this._addEventHandlers();
                    this._removeResize();
                    this._initializeResize();
                    break;
                case 'resizable':
                    this.enableResize = value;

                    if (value) {
                        this._initializeResize();
                    } else {
                        this._removeResize();
                    }
                    break;
                case 'position':
                    this._positionWindow();
                    break;
                case 'modalOpacity':
                    this._setModalBackgroundStyles();
                    break;
                case 'okButton':
                    if (value) {
                        this._addDialogButtonsHandlers();
                    } else {
                        this.removeHandler(this.okButton);
                    }
                    break;
                case 'cancelButton':
                    if (value) {
                        this._addDialogButtonsHandlers();
                    } else {
                        this.removeHandler(this.cancelButton);
                    }
                    break;
                case 'collapsed':
                    if (value) {
                        if (!oldvalue) {
                            this.collapsed = false;
                            this.collapse(0);
                        }
                    } else {
                        if (oldvalue) {
                            this.collapsed = true;
                            this.expand(0);
                        }
                    }
                case 'theme':
                    $.jqx.utilities.setTheme(oldvalue, value, this.host);
                    break;
                case 'enableResize':
                    return;
                case 'maxWidth':
                case 'maxHeight':
                case 'minWidth':
                case 'minHeight':
                    object._performLayout();
                    object._removeResize();
                    object._initializeResize();
                    return;
                default:
                    return;
            }
        },

        collapse: function (duration) {
            if (!this.collapsed && !this.host.is(':animated')) {
                if (this.host.css('display') == "none")
                    return;

                var self = this,
                    collapseHeight = this._header.outerHeight(true),
                    bottomBorder = parseInt(this._header.css('border-bottom-width'), 10),
                    bottomMargin = parseInt(this._header.css('margin-bottom'), 10),
                    duration = !isNaN(parseInt(duration)) ? duration : this.collapseAnimationDuration;
                if (!isNaN(bottomBorder)) {
                    collapseHeight -= 2 * bottomBorder;
                }
                if (!isNaN(bottomMargin)) {
                    collapseHeight += bottomMargin;
                }
                this._heightBeforeCollapse = this.host.height();
                this._minHeightBeforeCollapse = this.host.css('min-height');
                this.host.css('min-height', collapseHeight);
                this.host.animate({ height: collapseHeight }, duration, function () {
                    self.collapsed = true;
                    self._collapseButton.addClass(self.toThemeProperty('jqx-window-collapse-button-collapsed'));
                    self._collapseButton.addClass(self.toThemeProperty('jqx-icon-arrow-down'));
                    self._content.css('display', 'none');
                    self._raiseEvent(5);
                    self._raiseEvent(9);
                    $.jqx.aria(self, "aria-expanded", false);
                });
            }
        },

        expand: function (duration) {
            if (this.collapsed && !this.host.is(':animated')) {

                var self = this,
                    duration = !isNaN(parseInt(duration)) ? duration : this.collapseAnimationDuration;
                this.host.animate({ 'height': this._heightBeforeCollapse }, duration, function () {
                    self.collapsed = false;
                    self.host.css('min-height', self._minHeightBeforeCollapse);
                    self._collapseButton.removeClass(self.toThemeProperty('jqx-window-collapse-button-collapsed'));
                    self._collapseButton.removeClass(self.toThemeProperty('jqx-icon-arrow-down'));

                    self._content.css('display', 'block');
                    self._raiseEvent(6);
                    self._performWidgetLayout();
                    self._raiseEvent(9);
                    $.jqx.aria(self, "aria-expanded", true);
                });
            }
        },

        //Closing all open windows which are not modal
        closeAll: function (closeCurrent) {
            var closeCurrent = true;
            var windows = $.data(document.body, 'jqxwindows-list'),
                count = windows.length, modal = $.data(document.body, 'jqxwindow-modal') || [];
            while (count) {
                count -= 1;
                if (this._toClose(closeCurrent, windows[count])) {
                    windows[count].jqxWindow('closeWindow', 'close');
                    windows.splice(count, 1);
                }
            }
            if (this._toClose(closeCurrent, modal)) {
                modal.jqxWindow('closeWindow', 'close');
                $.data(document.body, 'jqxwindow-modal', [])
            }
            $.data(document.body, 'jqxwindows-list', windows);
        },

        //Setting window's title
        setTitle: function (title) {
            $.jqx.utilities.html(this._headerContentWrapper, title);
            this.title = title;
            this._performLayout();
        },

        //Setting window's content
        setContent: function (content) {
            this._contentInitialized = false;

            var parent = this._content,
                finished = false;
            while (!finished) {
                parent.css('height', 'auto');
                parent.css('width', 'auto');
                if (parent.is('.jqx-window')) {
                    finished = true;
                } else {
                    parent = parent.parent();
                }
            }
            $.jqx.utilities.html(this._content, content);
            this._performLayout();
        },

        //Disabling the window
        disable: function () {
            this.disabled = true;
            this._removeEventHandlers();
            this._header.addClass(this.toThemeProperty('jqx-window-header-disabled'));
            this._closeButton.addClass(this.toThemeProperty('jqx-window-close-button-disabled'));
            this._collapseButton.addClass(this.toThemeProperty('jqx-window-collapse-button-disabled'));
            this._content.addClass(this.toThemeProperty('jqx-window-content-disabled'));
            this.host.addClass(this.toThemeProperty('jqx-window-disabled'));
            this.host.addClass(this.toThemeProperty('jqx-fill-state-disabled'));
            this._removeResize();
        },

        //Enabling the window
        enable: function () {
            if (this.disabled) {
                this._addEventHandlers();
                this._header.removeClass(this.toThemeProperty('jqx-window-header-disabled'));
                this._content.removeClass(this.toThemeProperty('jqx-window-content-disabled'));
                this._closeButton.removeClass(this.toThemeProperty('jqx-window-close-button-disabled'));
                this._collapseButton.removeClass(this.toThemeProperty('jqx-window-collapse-button-disabled'));
                this.host.removeClass(this.toThemeProperty('jqx-window-disabled'));
                this.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
                this.disabled = false;
                this._initializeResize();
            }
        },

        //Returning true if the window is open (not hidden) and false if it is closed (hidden)
        isOpen: function () {
            return this._visible;
        },

        //Closing the window
        closeWindow: function (action) {
            var self = this;
            action = (typeof action === 'undefined') ? this.closeButtonAction : action;
            this.hide(function () {
                if (action === 'close') {
                    self._destroy();
                }
            });
        },

        //Bringing the window to the front
        bringToFront: function () {
            var windows = $.data(document.body, 'jqxwindows-list');
            if (this.isModal) {
                windows = $.data(document.body, 'jqxwindows-modallist');
                this._fixWindowZIndex('modal-hide');
                this._fixWindowZIndex('modal-show');
                return;
            }

            var upperWindow = windows[windows.length - 1],
            zIndex = parseInt(upperWindow.css('z-index'), 10),
            currentElementIndex = this._indexOf(this.host, windows);
            for (var i = windows.length - 1; i > currentElementIndex; i -= 1) {
                var currentZIndex = parseInt(windows[i].css('z-index'), 10) - 1;
                windows[i].css('z-index', currentZIndex);
            }
            this.host.css('z-index', zIndex);
            this._sortByStyle('z-index', windows);
        },

        //Hiding/closing the current window
        hide: function (callback, duration, notRaiseEvent) {
            if (this.closing) {
                var res = this.closing();
                if (res == false) return;
            }

            duration = duration || this.closeAnimationDuration;
            switch (this.animationType) {
                case 'none':
                    this.host.css('display', 'none');
                    break;
                case 'fade':
                    this.host.fadeOut(duration, function () {
                        if (callback instanceof Function) {
                            callback();
                        }
                    });
                case 'slide':
                    this.host.slideUp(duration, function () {
                        if (callback instanceof Function) {
                            callback();
                        }
                    });
                case 'combined':
                    this.host.hide(duration, function () {
                        if (callback instanceof Function) {
                            callback();
                        }
                    });
            }
            this._visible = false;
            if (this.isModal) {
                this._modalBackground.hide();
                this._fixWindowZIndex('modal-hide');
            }
            if (notRaiseEvent !== true) {
                this._raiseEvent(1);
                this._raiseEvent(8);
            }
        },

        open: function (callback, duration) {
            this.show(callback, duration);
        },

        close: function (callback, duration, notRaiseEvent) {
            this.hide(callback, duration, notRaiseEvent);
        },

        //Opening/showing the current window
        show: function (callback, duration) {
            this._setDialogResult('none');
            duration = duration || this.showAnimationDuration;
            switch (this.animationType) {
                case 'none':
                    this.host.css('display', 'block');
                    break;
                case 'fade':
                    this.host.fadeIn(duration, function () {
                        if (callback instanceof Function) {
                            callback();
                        }
                    });
                    break;
                case 'slide':
                    this.host.slideDown(duration, function () {
                        if (callback instanceof Function) {
                            callback();
                        }
                    });
                    break;
                case 'combined':
                    this.host.show(duration, function () {
                        if (callback instanceof Function) {
                            callback();
                        }
                    });
                    break;
            }
            if (this.isModal) {
                this._modalBackground.show();
                this._fixWindowZIndex('modal-show');
            }
            var me = this;
            if (!this._visible) {
                //To remove this._raiseEvent(4); in the next version
                //  this._raiseEvent(4);
                if (duration > 150 && this.animationType != 'none') {
                    setTimeout(function () {
                        if (!me._contentInitialized) {
                            if (me.initContent) {
                                me.initContent();
                                me._contentInitialized = true;
                            }
                        }
                        me._raiseEvent(7);
                        me._raiseEvent(9);
                    }, duration - 150);
                }
                else {
                    if (!me._contentInitialized) {
                        if (me.initContent) {
                            me.initContent();
                            me._contentInitialized = true;
                        }
                    }
                    this._raiseEvent(7);
                    me._raiseEvent(9);
                }
            }
            this._visible = true;
            this._performLayout();
            if (this.autoFocus) {
                // focus the displayed window.
                var focusContent = function () {
                    if (!me._isTouchDevice) {
                        me._content.focus();
                    }
                }
                focusContent();
                setTimeout(function () {
                    focusContent();
                }, 100);
            }
        },

        _getTabbables: function () {
            var elements = this._content.find('*');
            var tabbables = new Array();
            $.each(elements, function () {
                if (tabbable(this)) {
                    tabbables[tabbables.length] = this;
                }
            });
            return tabbables;
        },

        //Moving the current window
        move: function (x, y, event, raiseEvent) {
            var scrollLeft = 0, scrollTop = 0, position, pageX, pageY, x = parseInt(x, 10), y = parseInt(y, 10);
            if ($.jqx.browser.msie) {
                if ($(window).width() > $(document).width() && !this.dragArea) {
                    scrollTop = this._SCROLL_WIDTH;
                }
                if ($(window).height() < $(document).height() &&
                 document.documentElement.clientWidth > document.documentElement.scrollWidth && !this.dragArea) {
                    scrollLeft = this._SCROLL_WIDTH;
                }
            }
            position = this._validateCoordinates(x, y, scrollTop, scrollLeft);
            if (parseInt(this.host.css('left'), 10) !== position.x || parseInt(this.host.css('top'), 10) !== position.y) {
                if (event) {
                    var touches = $.jqx.mobile.getTouches(event);
                    var touch = touches[0];
                    var pos = $.jqx.position(event);

                    pageX = pos.left;
                    pageY = pos.top;
                }

                if (pageX == undefined) pageX = x;
                if (pageY == undefined) pageY = y;
                if (raiseEvent !== false) {
                    this._raiseEvent(2, position.x, position.y, pageX, pageY);
                }
            }
            this.element.style.left = position.x + 'px';
            this.element.style.top = position.y + 'px';
            this._moved = true;
        }
    });

    function focusable(element, isTabIndexNotNaN) {
        var nodeName = element.nodeName.toLowerCase();
        if ("area" === nodeName) {
            var map = element.parentNode,
            mapName = map.name,
            img;
            if (!element.href || !mapName || map.nodeName.toLowerCase() !== "map") {
                return false;
            }
            img = $("img[usemap=#" + mapName + "]")[0];
            return !!img && visible(img);
        }
        return (/input|select|textarea|button|object/.test(nodeName)
        ? !element.disabled
        : "a" == nodeName
            ? element.href || isTabIndexNotNaN
            : isTabIndexNotNaN)
        // the element and all of its ancestors must be visible
        && visible(element);
    }

    function visible(element) {
        return !$(element).parents().andSelf().filter(function () {
            return $.css(this, "visibility") === "hidden" ||
            $.expr.filters.hidden(this);
        }).length;
    }

    function tabbable(element) {
        var tabIndex = $.attr(element, "tabindex"),
            isTabIndexNaN = isNaN(tabIndex);
        return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
    }

} (jqxBaseFramework));

(function ($) {
    var resizeModule = (function ($) {
        return {

            resizeConfig: function () {
                // Resize target
                this.resizeTarget = null;
                // Indicator's size
                this.resizeIndicatorSize = 5;
                // All children are saved here
                this.resizeTargetChildren = null;
                // Indicates if it's resizing
                this.isResizing = false;
                // Indicates if the cursor is in the resize area. It is usefull when you are using different cursors in your resize target
                this.resizeArea = false;
                // Setting target's minimal width
                this.minWidth = 1;
                // Setting target's max width
                this.maxWidth = 100;
                // Setting target's min height
                this.minHeight = 1;
                // Setting target's max height
                this.maxHeight = 100;
                // Setting target's parent
                this.resizeParent = null;
                // Setting whether the resize is disabled
                this.enableResize = true;

                this._cursorBackup;
                this._resizeEvents = ['resizing', 'resized', 'resize'];

                //Private variables
                this._resizeMouseDown = false;
                this._resizeCurrentMode = null;
                this._mouseResizePosition = {};
                this._resizeMethods = null;
                this._SCROLL_WIDTH = 21;
            },

            _resizeExceptions: {
                'invalidTarget': 'Invalid target!',
                'invalidMinHeight': 'Invalid minimal height!',
                'invalidMaxHeight': 'Invalid maximum height!',
                'invalidMinWidth': 'Invalid minimum width!',
                'invalidMaxWidth': 'Invalid maximum width!',
                'invalidIndicatorSize': 'Invalid indicator size!',
                'invalidSize': 'Invalid size!'
            },

            removeResize: function () {
                if (this.resizeTarget) {
                    var resizer = $(this.resizeTarget.children('.jqx-resize'));
                    resizer.detach();
                    var content = resizer.children();
                    this._removeResizeEventListeners();
                    for (var i = 0; i < content.length; i += 1) {
                        $(content[i]).detach();
                        this.resizeTarget.append(content[i]);
                    }
                    resizer.remove();
                }
                //resizer.remove();
            },

            //Initializing all variables
            initResize: function (config) {
                this.resizeConfig();
                this.resizeTarget = $(config.target);
                this.resizeIndicatorSize = config.indicatorSize || 10;
                this.maxWidth = config.maxWidth || 100;
                this.minWidth = config.minWidth || 1;
                this.maxHeight = config.maxHeight || 100;
                this.minHeight = config.minHeight || 1;
                this.resizeParent = config.resizeParent;
                this._parseResizeParentProperties();
                this._validateResizeProperties();
                this._validateResizeTargetDimensions();
                this._getChildren(this.resizeTarget.maxWidth, this.resizeTarget.minWidth,
                                  this.resizeTarget.maxHeight, this.resizeTarget.minHeight, config.alsoResize);
                this._refreshResize();
                this._cursorBackup = this.resizeTarget.css('cursor');
                if (this._cursorBackup === 'auto') {
                    this._cursorBackup = 'default';
                }
            },

            _validateResizeTargetDimensions: function () {
                this.resizeTarget.maxWidth = this.maxWidth;
                this.resizeTarget.minWidth = ((3 * this.resizeIndicatorSize > this.minWidth) ? 3 * this.resizeIndicatorSize : this.minWidth);
                this.resizeTarget.maxHeight = this.maxHeight;
                this.resizeTarget.minHeight = ((3 * this.resizeIndicatorSize > this.minHeight) ? 3 * this.resizeIndicatorSize : this.minHeight);
            },

            _parseResizeParentProperties: function () {
                if (this.resizeParent) {
                    this.resizeParent.left = parseInt(this.resizeParent.left, 10);
                    this.resizeParent.top = parseInt(this.resizeParent.top, 10);
                    this.resizeParent.width = parseInt(this.resizeParent.width, 10);
                    this.resizeParent.height = parseInt(this.resizeParent.height, 10);
                }
            },

            //Getting all children and setting their max and min height/width. First we are calculating their ratio
            //to the main container which we are going to modify to be resizable.
            _getChildren: function (maxWidth, minWidth, maxHeight, minHeight, selector) {
                this.resizeTargetChildren = $(selector);
                this.resizeTargetChildren.toArray();
                var count = this.resizeTargetChildren.length;
                while (count) {
                    count -= 1;
                    this.resizeTargetChildren[count] = $(this.resizeTargetChildren[count]);
                }
            },

            _refreshResize: function () {
                this._renderResize();
                this._performResizeLayout();
                this._removeResizeEventListeners();
                this._addResizeEventHandlers();
            },

            //Creating inner wrapper which is going to be our resize helper
            _renderResize: function () {
                this.resizeTarget.wrapInner($('<div></div>'));
                this._resizeWrapper = this.resizeTarget.children(0);
                this._resizeWrapper.addClass('jqx-resize');
                this._resizeWrapper.addClass('jqx-rc-all');
                this._resizeWrapper.css('z-index', 8000);
            },

            _performResizeLayout: function () {
                this._resizeWrapper.height(this.resizeTarget.height());
                this._resizeWrapper.width(this.resizeTarget.width());
            },

            _removeResizeEventListeners: function () {
                var resizetargetid = this.resizeTarget.attr('id');

                this.removeHandler(this._resizeWrapper, 'mousemove.resize' + resizetargetid);
                this.removeHandler(this._resizeWrapper, 'mousedown.resize' + resizetargetid);
                this.removeHandler($(document), 'mousemove.resize' + resizetargetid);
                this.removeHandler($(document), 'mouseup.resize' + resizetargetid);
            },

            _addResizeEventHandlers: function () {
                var resizetargetid = this.resizeTarget.attr('id');
                var self = this;
                this.addHandler(this._resizeWrapper, 'mousemove.resize.' + resizetargetid, function (event) {
                    self._resizeCursorChangeHandler(self, event);
                });
                this.addHandler(this._resizeWrapper, 'mousedown.resize.' + resizetargetid, function (event) {
                    self._resizeMouseDownHandler(self, event);
                });
                this.addHandler($(document), 'mousemove.resize.' + resizetargetid, function (event) {
                    return self._resizeHandler(self, event);
                });
                this.addHandler($(document), 'mouseup.resize.' + resizetargetid, function (event) {
                    self._stopResizing(self, event);
                });

                try {
                    if (document.referrer != "" || window.frameElement) {
                        var eventHandle = function (event) {
                            self._stopResizing(self, event);
                        };

                        if (window.top.document.addEventListener) {
                            window.top.document.addEventListener('mouseup', eventHandle, false);

                        } else if (window.top.document.attachEvent) {
                            window.top.document.attachEvent("on" + 'mouseup', eventHandle);
                        }
                    }
                }
                catch (error) {
                }
            },

            _stopResizing: function (self, event) {
                if (self.enableResize) {
                    if (self.isResizing) {
                        self._raiseResizeEvent(1);
                    }
                    self._resizeMouseDown = false;
                    self.isResizing = false;
                    self._resizeDirection = null;
                    if (self.resizeTarget) {
                        self.resizeTarget.removeClass('jqx-disableselect');
                    }
                }

                if (self._cursorBackup == 'undefined') {
                    self._cursorBackup = 'default';
                }

                if (self._resizeWrapper) {
                    self._resizeWrapper.css('cursor', self._cursorBackup);
                }
            },

            _resizeHandler: function (self, event) {
                if (self.enableResize && !self.collapsed) {
                    if (self.isResizing && self._resizeDirection) {
                        if (event.which === 0 && $.jqx.browser.msie && $.jqx.browser.version < 9) {
                            self._stopResizing(event);
                        }
                        self._performResize(event.pageX, event.pageY);
                        return false;
                    } else {
                        return self._resizeCaptureCursor(event.pageX, event.pageY);
                    }
                }
            },

            _resizeCaptureCursor: function (mouseX, mouseY) {
                if (this._resizeMouseDown && !this.isResizing && this._resizeDirection) {
                    if ((mouseX + 3 < this._mouseResizePosition.x || mouseX - 3 > this._mouseResizePosition.x) ||
                        (mouseY + 3 < this._mouseResizePosition.y || mouseY - 3 > this._mouseResizePosition.y)) {
                        this._changeCursor(mouseX - parseInt(this.resizeTarget.css('left')), mouseY - parseInt(this.resizeTarget.css('top')));
                        this._mouseResizePosition = { x: mouseX, y: mouseY };
                        this._prepareResizeMethods(this._resizeDirection);
                        this._resizeBackupData();
                        this.isResizing = true;
                        this.resizeTarget.addClass('jqx-disableselect');
                        return false;
                    }
                }
            },

            _resizeBackupData: function () {
                this.resizeTarget.lastWidth = this.resizeTarget.width();
                this.resizeTarget.lastHeight = this.resizeTarget.height();
                this.resizeTarget.x = parseInt(this.resizeTarget.css('left'), 10);
                this.resizeTarget.y = parseInt(this.resizeTarget.css('top'), 10);
                this._resizeBackupChildrenSize();
            },

            _resizeBackupChildrenSize: function () {
                var count = this.resizeTargetChildren.length, child;
                while (count) {
                    count -= 1;
                    child = this.resizeTargetChildren[count];
                    this.resizeTargetChildren[count].lastWidth = child.width();
                    this.resizeTargetChildren[count].lastHeight = child.height();
                }
            },

            _performResize: function (mouseX, mouseY) {
                var differenceX = mouseX - this._mouseResizePosition.x,
                    differenceY = mouseY - this._mouseResizePosition.y;
                if (this._resizeDirection) {
                    this._resize(this.resizeTarget, differenceX, differenceY);
                }
            },

            _resizeCursorChangeHandler: function (self, event) {
                if (self.enableResize && !self.collapsed) {
                    if (!self.isResizing) {
                        self._changeCursor(event.pageX - parseInt(self.resizeTarget.css('left')),
                                       event.pageY - parseInt(self.resizeTarget.css('top')));
                    }
                }
            },

            _resizeMouseDownHandler: function (self, event) {
                if (self.enableResize) {
                    if (self._resizeDirection !== null) {
                        self._resizeMouseDown = true;
                        self._mouseResizePosition.x = event.pageX;
                        self._mouseResizePosition.y = event.pageY;
                        event.preventDefault();
                    }
                }
            },

            _validateResizeProperties: function () {
                try {
                    if (!this.resizeTarget || this.resizeTarget.length !== 1) {
                        throw new Error(this._resizeExceptions['invalidTarget']);
                    }
                    if (this.minHeight < 0 || isNaN(parseInt(this.minHeight))) {
                        throw new Error(this._resizeExceptions['invalidMinHeight']);
                    }
                    if (this.maxHeight <= 0 || isNaN(parseInt(this.maxHeight))) {
                        throw new Error(this._resizeExceptions['invalidMaxHeight']);
                    }
                    if (this.minWidth < 0 || isNaN(parseInt(this.minWidth))) {
                        throw new Error(this._resizeExceptions['invalidMinWidth']);
                    }
                    if (this.maxWidth < 0 || isNaN(parseInt(this.maxWidth))) {
                        throw new Error(this._resizeExceptions['invalidMaxWidth']);
                    }
                    if (this.resizeIndicatorSize < 0 || isNaN(parseInt(this.resizeIndicatorSize))) {
                        throw new Error(this._resizeExceptions['invalidIndicatorSize']);
                    }
                    if (this.minHeight > this.maxHeight ||
                        this.minWidth > this.maxWidth) {
                        throw new Error(this._resizeExceptions['invalidSize']);
                    }
                    //if (this.resizeParent && this.resizeParent.width && this.resizeParent.height && this.resizeParent.left &&
                    //    this.resizeParent.top && ((this.resizeParent.width < this.resizeTarget.width() || this.resizeParent.width < this.maxWidth) ||
                    //    (this.resizeParent.height < this.resizeTarget.height() || this.resizeParent.height < this.maxHeight))) {
                    //    throw new Error(this._resizeExceptions['invalidSize']);
                    //}
                } catch (exception) {
                    alert(exception);
                }
            },

            //This method is checking cursor's position and setting specific pointer depending on mouse coordinates.
            //It's also detecting resize direction and creating string with it. For example for top-left resize the string is going to be 'topleft'.
            _changeCursor: function (x, y) {
                if (this.isResizing || this._resizeMouseDown) {
                    return;
                }
                this.resizeArea = true;
                if (x <= this.resizeIndicatorSize && x >= 0 && y <= this.resizeIndicatorSize && y > 0) {    //top left
                    this._resizeWrapper.css('cursor', 'nw-resize');
                    this._resizeDirection = 'topleft';
                } else if (y <= this.resizeIndicatorSize && y > 0 && x >= this.resizeTarget.width() - this.resizeIndicatorSize) { //top right
                    this._resizeWrapper.css('cursor', 'ne-resize');
                    this._resizeDirection = 'topright';
                } else if (y >= this.resizeTarget.height() - this.resizeIndicatorSize && //bottom left
                           y < this.resizeTarget.height() &&
                           x <= this.resizeIndicatorSize && x >= 0) {
                    this._resizeWrapper.css('cursor', 'sw-resize');
                    this._resizeDirection = 'bottomleft';
                } else if (y >= this.resizeTarget.height() - this.resizeIndicatorSize && //bottom right
                           y < this.resizeTarget.height() &&
                           x >= this.resizeTarget.width() - this.resizeIndicatorSize &&
                           x < this.resizeTarget.width()) {
                    this._resizeWrapper.css('cursor', 'se-resize');
                    this._resizeDirection = 'bottomright';
                } else if (x <= this.resizeIndicatorSize && x >= 0) { //left
                    this._resizeWrapper.css('cursor', 'e-resize');
                    this._resizeDirection = 'left';
                } else if (y <= this.resizeIndicatorSize && y > 0) { //top
                    this._resizeWrapper.css('cursor', 'n-resize');
                    this._resizeDirection = 'top';
                } else if (y >= this.resizeTarget.height() - this.resizeIndicatorSize && //bottom
                           y < this.resizeTarget.height()) {
                    this._resizeWrapper.css('cursor', 'n-resize');
                    this._resizeDirection = 'bottom';
                } else if (x >= this.resizeTarget.width() - this.resizeIndicatorSize &&  //right
                           x < this.resizeTarget.width()) {
                    this._resizeWrapper.css('cursor', 'e-resize');
                    this._resizeDirection = 'right';
                } else {
                    this._resizeWrapper.css('cursor', this._cursorBackup);
                    this._resizeDirection = null;
                    this.resizeArea = false;
                }
            },

            //Putting all methods which are going to be used along the resize action (for example _resizeRight, _resizeTop) into an array.
            //We are performing this because if we are checking and calling the right methods along the resizing (on mousemove)
            //we should make more checks.
            _prepareResizeMethods: function (direction) {
                this._resizeMethods = [];
                if (direction.indexOf('left') >= 0) { this._resizeMethods.push(this._resizeLeft); }
                if (direction.indexOf('top') >= 0) { this._resizeMethods.push(this._resizeTop); }
                if (direction.indexOf('right') >= 0) { this._resizeMethods.push(this._resizeRight); }
                if (direction.indexOf('bottom') >= 0) { this._resizeMethods.push(this._resizeBottom); }
            },

            _validateResize: function (newWidth, newHeight, direction, element, side) {
                if (direction === 'horizontal' || direction === 'both') {
                    return this._validateWidth(newWidth, element, side);
                } else if (direction === 'vertical' || direction === 'both') {
                    return this._validateHeight(newHeight, element, side);
                }
                return { result: false, fix: 0 };
            },

            _getParent: function () {
                if (this.resizeParent !== null && this.resizeParent !== 'undefined' && this.resizeParent.height && this.resizeParent.width &&
                    this.resizeParent.top && this.resizeParent.left) {
                    return this.resizeParent;
                }
                return {
                    left: 0, top: 0,
                    width: $(document).width(), height: $(document).height()
                };
            },

            _validateHeight: function (newHeight, element, side) {
                var scrollTop = 0,
                heightDisplacement = 2,
                result = false,
                size = newHeight,
                resizeParent = this._getParent();

                if ($(window).width() > $(document).width() && $.jqx.browser.msie && resizeParent.height === $(document).height()) {
                    scrollTop = this._SCROLL_WIDTH;
                }
                if (side === 'bottom' && (newHeight + element.position().top + scrollTop + heightDisplacement > resizeParent.height + resizeParent.top)) {   //fixing if user is trying to resize it more than the window
                    return { fix: resizeParent.height - element.position().top - scrollTop - heightDisplacement + resizeParent.top, result: false };
                }
                if (side === 'top' && element.lastHeight - newHeight + element.y < resizeParent.top) { //check if the user is trying to drag it in the window's top
                    return { fix: newHeight + (element.lastHeight - newHeight + element.y) - resizeParent.top, result: false };
                }
                if (newHeight < element.minHeight) {
                    return { fix: element.minHeight, result: false };
                }
                if (newHeight > element.maxHeight) {
                    return { fix: element.maxHeight, result: false };
                }
                return { result: true, fix: newHeight };
            },

            _validateWidth: function (newWidth, element, side) {
                var scrollLeft = 0, widthDisplacement = 2, result = false, size = newWidth, resizeParent = this._getParent();
                if ($(window).height() < $(document).height() && $.jqx.browser.msie &&
                    document.documentElement.clientWidth >= document.documentElement.scrollWidth &&
                    resizeParent.width === $(document).width()) {    //check if there is a right but there is not a bottom one 
                    scrollLeft = this._SCROLL_WIDTH;
                }
                if (side === 'right' && (newWidth + element.position().left + scrollLeft + widthDisplacement > resizeParent.width + resizeParent.left)) {
                    return { fix: resizeParent.width - element.position().left - scrollLeft - widthDisplacement + resizeParent.left, result: false };
                }
                if (side === 'left' && (element.lastWidth - newWidth + element.x < resizeParent.left)) { //check if the user is trying to drag it in the window's left
                    return { fix: newWidth + (element.lastWidth - newWidth + element.x) - resizeParent.left, result: false };
                }
                if (newWidth < element.minWidth) {
                    return { fix: element.minWidth, result: false };
                }
                if (newWidth > element.maxWidth) {
                    return { fix: element.maxWidth, result: false };
                }
                return { result: true, fix: newWidth };
            },

            _resize: function (element, differenceX, differenceY) {
                var direction = this._resizeDirection;
                var length = this._resizeMethods.length;
                for (var i = 0; i < length; i++) {
                    if (this._resizeMethods[i] instanceof Function) {
                        var properties = { element: element, x: differenceX, y: differenceY, self: this };
                        this._resizeMethods[i](properties);
                    }
                }
                this._performResizeLayout();
            },

            resize: function (width, height) {
                if (this.resizable) {
                    var differenceX = width - this.host.width();
                    var differenceY = height - this.host.height();
                    var direction = 'right';
                    if (differenceY != 0) {
                        direction = 'bottom';
                    }
                    this._resizeDirection = direction;
                    this._prepareResizeMethods(this._resizeDirection);
                    this._resizeBackupData();
                    this.isResizing = true;
                    this._resize(this.resizeTarget, differenceX, differenceY);
                    this.isResizing = false;
                }
            },

            _setResizeChildrenSize: function (size, dimention) {
                var count = this.resizeTargetChildren.length;
                while (count) {
                    count--;
                    if (dimention === 'width') {
                        var newWidth = this.resizeTargetChildren[count].lastWidth - (this.resizeTarget.lastWidth - size);
                        if (newWidth < this.resizeTarget.maxWidth && newWidth > 0) {
                            this.resizeTargetChildren[count].width(newWidth);
                        }
                    } else {
                        var newHeight = this.resizeTargetChildren[count].lastHeight - (this.resizeTarget.lastHeight - size);
                        if (newHeight < this.resizeTarget.maxHeight && newHeight > 0) {
                            this.resizeTargetChildren[count].height(newHeight);
                        }
                    }
                }
            },

            _resizeRight: function (properties) {
                var width = properties.element.lastWidth + properties.x,
                    result = properties.self._validateResize(width, 0, 'horizontal', properties.element, 'right');
                if (!result.result) {
                    width = result.fix;
                }
                if (properties.element.width() !== width) {
                    properties.self._setResizeChildrenSize(width, 'width');
                    properties.element.width(width);
                    properties.self._raiseResizeEvent(0);
                }
                return width;
            },

            _resizeLeft: function (properties) {
                var width = properties.element.lastWidth - properties.x,
                    result = properties.self._validateResize(width, 0, 'horizontal', properties.element, 'left'),
                    x = properties.element.x + properties.x;
                if (!result.result) {
                    x = properties.element.x + (properties.element.lastWidth - result.fix);
                    width = result.fix;
                    return;
                }
                if (properties.element.width() !== width) {
                    properties.self._setResizeChildrenSize(width, 'width');
                    properties.element.width(width);
                    properties.element.css('left', x);
                    properties.self._raiseResizeEvent(0);
                }
                return width;
            },

            _resizeBottom: function (properties) {
                var height = properties.element.lastHeight + properties.y,
                    result = properties.self._validateResize(0, height, 'vertical', properties.element, 'bottom');
                if (!result.result) {
                    height = result.fix;
                }
                if (properties.element.height() !== height) {
                    properties.self._setResizeChildrenSize(height, 'height');
                    properties.element.height(height);
                    properties.self._raiseResizeEvent(0);
                }
                return height;
            },

            _resizeTop: function (properties) {
                var height = properties.element.lastHeight - properties.y,
                    result = properties.self._validateResize(0, height, 'vertical', properties.element, 'top'),
                    y = properties.element.y + properties.y;
                if (!result.result) {
                    y = properties.element.y + (properties.element.lastHeight - result.fix);
                    height = result.fix;
                    return;
                }
                if (properties.element.height() !== height) {
                    properties.self._setResizeChildrenSize(height, 'height');
                    properties.element.height(height);
                    properties.element.css('top', y);
                    properties.self._raiseResizeEvent(0);
                }
                return height;
            },

            _raiseResizeEvent: function (eventId) {
                var eventType = this._resizeEvents[eventId],
                    event = $.Event(eventType),
                    args = {};
                args.width = parseInt(this.resizeTarget[0].style.width);
                args.height = parseInt(this.resizeTarget[0].style.height);
                event.args = args;
                if (eventId == 0) {
                    var eventType = this._resizeEvents[2],
                    resizeEvent = $.Event(eventType);
                    resizeEvent.args = args;
                    this.resizeTarget.trigger(resizeEvent);
                }

                return this.resizeTarget.trigger(event);
            }
        };
    } (jqxBaseFramework));
    $.extend($.jqx._jqxWindow.prototype, resizeModule);
} (jqxBaseFramework));
