/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget('jqxListMenu', '', {});

    var listItemsCounter = 0,
        listsCounter = 0;

    $.extend($.jqx._jqxListMenu.prototype, {

        defineInstance: function () {
            var settings = {
                filterCallback: function (text, searchValue) {
                    var result = $.jqx.string.containsIgnoreCase($.trim(text), searchValue);
                    return result;
                },
                placeHolder: 'Filter list items...',
                showFilter: false,
                showHeader: true,
                showBackButton: true,
                showNavigationArrows: true,
                alwaysShowNavigationArrows: false,
                backLabel: 'Back',
                width: '100%',
                height: 'auto',
                animationType: 'slide',
                animationDuration: 0,
                headerAnimationDuration: 0,
                autoSeparators: false,
                readOnly: false,
                roundedCorners: true,
                disabled: false,
                enableScrolling: true,
                touchMode: false,
                //private data members
                _childrenMap: {},
                _parentMap: {},
                _lock: false,
                _backButton: null,
                _currentPage: null,
                _header: null,
                _oldHost: undefined,
                rtl: false,
                aria:
                {
                    "aria-disabled": { name: "disabled", type: "boolean" }
                }
            };
            $.extend(true, this, settings);
            return settings;
        },

        destroy: function () {
            this.host.remove();
        },

        createInstance: function () {
            $.jqx.aria(this);
            this.host.attr('data-role', 'listmenu');
            this.host.attr('role', 'tree');
        },

        refresh: function (init) {
            this._render();
            this._removeClasses();
            this._addClasses();
            this._currentPage = this._currentPage || this.host.children('.jqx-listmenu').first();
            this._changeHeader(this._currentPage);
            this._removeEventHandlers();
            this._addEventHandlers();
        },

        _render: function () {
            this._renderHost();
            this._renderAutoSeparators();
            this._renderSublists();
            this._renderFilterBar();
            this._renderHeader();
            this.host.css({
                width: this.width,
                height: this.height
            });
            if (this.disabled)
                this.disable();
            if (this.enableScrolling && this.host.jqxPanel && this.panel) {
                this.panel.jqxPanel('_arrange');
            }
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.host.css({ width: this.width, height: this.height });
            if (this.panel) {
                this.panel.jqxPanel('_arrange');
            }
        },

        _renderHost: function () {
            if (!this.host.is('div')) {
                this._oldHost = this.host;
                this.host.wrap('<div/>');
                this.host = this.host.parent();
                this.element = this.host[0];
                if (this.host.jqxPanel && this.enableScrolling) {
                    this.host.wrap('<div/>');
                    this.panel = this.host.parent();
                    this.panel[0].id = 'panel' + this.element.id;
                    this.panel.jqxPanel({ theme: this.theme, autoUpdate: true, width: this.width, height: this.height, touchMode: this.touchMode });
                    this.host.css({ width: '100%' });
                    this.host.css({ height: 'auto' });
                    this.host.css('border', 'none');
                }
            }
            else {
                this.element.style.overflow = 'hidden';
            }
            if (!this.enableScrolling) {
                this.element.style.overflow = 'hidden';
            }

            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                this.element.style.position = 'relative';
            }
            if (this.enableScrolling && this.panel) {
                this.panel.jqxPanel('_arrange');
            }
        },

        _renderAutoSeparators: function (list) {
            var autoSeparators = this.host.find('.jqx-listmenu-auto-separator'),
                lists = this.host.find('[data-role="listmenu"]'),
                list, i;
            autoSeparators.remove();
            for (i = 0; i < lists.length; i += 1) {
                list = $(lists[i]);
                if (list.data('auto-separators') || this.autoSeparators) {
                    this._renderListAutoSeparators(list);
                }
            }
        },

        _renderSublists: function () {
            var stack = [(this.host.find('.jqx-listmenu').first()[0] || this.host.find('ul,ol').first()[0])],
                lis, li, list, lisCount, childList;
            this._refreshList(stack[0]);
            while (stack.length) {
                list = stack.pop();
                lis = this._getChildrenByTagName(list, 'li', 'LI');
                lisCount = lis.length;
                for (var i = 0; i < lisCount; i += 1) {
                    li = lis[i];
                    $(li).attr('role', 'treeitem');
                    childList = this._getChildList(li);
                    this._refreshLi(li, i, lisCount);
                    if (childList) {
                        stack.push(childList);
                        this._refreshList(childList, li, true);
                    }
                }
            }
        },

        _refreshList: function (list, parent, sublist) {
            list = $(list);
            if (list.data('role') === 'listmenu') {
                if (!list.is('.jqx-listmenu')) {
                    this._renderList(list);
                    this._handleListId(list);
                    this._addListClasses(list);
                }
                if (parent) {
                    this._expandHierarchy(list[0], parent);
                }
                if (sublist) {
                    this._handleSublist(list[0]);
                }
            }
        },

        _renderList: function (list) {
            list = $(list);
            if (!list.is('.jqx-listmenu')) {
                list.detach();
                list.appendTo(this.host);
            }
        },

        _handleListId: function (list) {
            if (!list[0].id) {
                list[0].id = 'jqx-listmenu-' + listsCounter;
                listsCounter += 1;
            }
        },

        _renderListAutoSeparators: function (list) {
            var lis = list.children('li'),
                firstLetter, li;
            var separator = {};
            for (var i = 0; i < lis.length; i += 1) {
                li = $(lis[i]);
                if (!li.data('role')) {
                    if ($.trim(li.text())[0] !== firstLetter) {
                        firstLetter = $.trim(li.text())[0];
                        var element = $('<li data-role="separator" class="' +
                            this.toThemeProperty('jqx-listmenu-auto-separator') +
                            '">' + firstLetter + '</li>');
                        element.insertBefore(li);

                        element[0].items = new Array();
                        separator = element[0];
                    }
                    if (separator.items) {
                        separator.items[separator.items.length] = li[0];
                    }
                }
            }
        },

        _addListClasses: function (list) {
            list.addClass('jqx-listmenu');
        },

        _expandHierarchy: function (child, parent) {
            if (parent && child) {
                var pId = parent.id,
                    cId = child.id;
                this._childrenMap[pId] = cId;
                this._parentMap[cId] = pId;
            }
        },

        _handleSublist: function (list) {
            if (!this._currentPage || list !== this._currentPage[0]) {
                list.style.display = 'none';
            } else {
                list.style.display = 'block';
            }
        },

        _getChildrenByTagName: function (el, lcName, ucName) {
            var results = [],
                dict = {};
            dict[lcName] = dict[ucName] = true;
            el = el.firstChild;
            while (el) {
                if (dict[el.nodeName]) {
                    results.push(el);
                }
                el = el.nextSibling;
            }
            return results;
        },

        _renderFilterBar: function () {
            if (!this._filterBar) {
                this._filterBar = $('<div/>');
                this._filterInput = $('<input type="text" />');
                this._filterBar.append(this._filterInput);
                this.host.prepend(this._filterBar);
            }
            var IE7 = false;
            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                IE7 = true;
            }

            if (!IE7) {
                this._filterInput.attr('placeholder', this.placeHolder);
            }

            if (!this.showFilter) {
                this._filterBar.css('display', 'none');
            } else {
                this._filterBar.css('display', 'block');
            }
        },

        _renderHeader: function () {
            if (!this._header) {
                this._header = $('<div/>');
                this.host.prepend(this._header);
                this._renderHeaderLabel();
            }
            this._renderBackButton();
            if (!this.showHeader) {
                this._header.css('display', 'none');
            } else {
                this._header.css('display', 'block');
            }
        },

        _renderHeaderLabel: function () {
            this._headerLabel = $('<span/>');
            this._headerLabel.addClass(this.toThemeProperty('jqx-listmenu-header-label'));
            this._header.append(this._headerLabel);
        },

        _renderBackButton: function () {
            if (!this._backButton) {
                this._backButton = $('<div><div style="float: left;"></div><span style="float: left;">' + this.backLabel + '</span><div style="clear:both;"></div></div>');
                this._header.prepend(this._backButton);
                this._backButton.jqxButton({ theme: this.theme });
                this._backButton.find('div:first').addClass(this.toThemeProperty('jqx-listmenu-backbutton-arrow'));
                if (!this.showBackButton) {
                    this._backButton.css('display', 'none');
                } else {
                    this._backButton.css('display', 'inline-block');
                }
                if (this.rtl) {
                    var ie7 = $.jqx.browser.msie && $.jqx.browser.version < 8;
                    if (!ie7) {
                        this._backButton.css('position', 'relative');
                        this._backButton.css('margin-left', '100%');
                        this._backButton.css('left', -this._backButton.outerWidth() - 15);
                    }
                    else {
                        this._backButton.css('position', 'relative');
                        this._backButton.css('left', '100%');
                        this._backButton.css('margin-left', -this._backButton.outerWidth() - 45 + 'px');
                    }
                }
            }

            if (!this.showBackButton) {
                this._backButton.css('display', 'none');
            } else {
                this._backButton.css('display', 'inline-block');
            }
        },

        _removeEventHandlers: function () {
            var isTouchDevice = this.isTouchDevice() && !this.touchMode;
            var touchstart = $.jqx.mobile.getTouchEventName('touchstart');

            this.removeHandler(this._backButton, !isTouchDevice ? 'click' : touchstart);
            this.removeHandler(this._filterInput, 'keyup');
            this.removeHandler(this._filterInput, 'change');
        },

        _addEventHandlers: function () {
            var self = this;
            var isTouchDevice = this.isTouchDevice() && !this.touchMode;
            var touchstart = $.jqx.mobile.getTouchEventName('touchstart');

            this.addHandler(this._backButton, !isTouchDevice ? 'click' : touchstart, function () {
                self.back();
            });
            this.addHandler(this._filterInput, 'keyup change', function () {
                self._filter($(this).val());
            });
        },

        _getChildList: function (li) {
            if (!li) return;
            var id = this._childrenMap[li.id],
                list;
            if (li.className.indexOf('jqx-listmenu-item') >= 0 && id) {
                return document.getElementById(id);
            }
            var childUl = this._getChildrenByTagName(li, 'ul', 'UL')[0],
            childOl = this._getChildrenByTagName(li, 'ol', 'OL')[0];
            list = childUl || childOl;
            return list;
        },

        _refreshLi: function (li, current, count) {
            if (li.parentNode && li.parentNode.getAttribute('data-role') === 'listmenu') {
                if (li.id == '') {
                    var i = 2;
                }
                this._handleLiId(li);
                this._renderLi(li);
                this._removeLiEventHandlers(li);
                this._addLiEventHandlers(li);
                this._addLiClasses(li, current, count);
            }
        },

        _handleLiId: function (li) {
            if (!li.id) {
                li.id = 'jqx-listmenu-item-' + listItemsCounter;
                listItemsCounter += 1;
            }
        },

        _renderLi: function (li) {
            if ((/(separator|header)/).test($(li).data('role')) ||
                $(li).children('.jqx-listmenu-arrow-right').length > 0) {
                return;
            }

            $(li).wrapInner('<span class="' + this.toThemeProperty('jqx-listmenu-item-label') + '"></span>');

            if (this.showNavigationArrows || this.alwaysShowNavigationArrows) {
                var arrow = $('<span/>');
                var nestedUL = $(li).find('ul');
                var nestedOL = $(li).find('ol');
                if (this.alwaysShowNavigationArrows || (((nestedUL.length > 0) && (/(listmenu)/).test(nestedUL.data('role'))) || ((nestedOL.length > 0) && (/(listmenu)/).test(nestedOL.data('role'))))) {
                    arrow.addClass(this.toThemeProperty('jqx-listmenu-arrow-right'));
                    if (!this.rtl) {
                        arrow.addClass(this.toThemeProperty('jqx-icon-arrow-right'));
                        arrow.appendTo(li);
                    }
                    else {
                        arrow.addClass(this.toThemeProperty('jqx-icon-arrow-left'));
                        arrow.addClass(this.toThemeProperty('jqx-listmenu-arrow-rtl'));
                        arrow.prependTo(li);
                    }
                }
            }
        },

        _removeLiEventHandlers: function (li) {
            var isTouchDevice = this.isTouchDevice();
            var touchstart = $.jqx.mobile.getTouchEventName('touchstart');
            var touchend = $.jqx.mobile.getTouchEventName('touchend');
            var touchmove = $.jqx.mobile.getTouchEventName('touchmove');

            var mouseDownEvent = (!isTouchDevice ? 'mousedown' : touchstart) + '.listmenu';
            var mouseUpEvent = (!isTouchDevice ? 'mouseup' : touchend) + '.listmenu';

            this.removeHandler($(li), mouseDownEvent);
            this.removeHandler($(document), mouseUpEvent + '.' + li.id);
        },

        isTouchDevice: function () {
            var isTouchDevice = $.jqx.mobile.isTouchDevice();
            if (this.touchMode == true) {
                isTouchDevice = true;
            }

            return isTouchDevice;
        },

        _addLiEventHandlers: function (li) {
            li = $(li);
            var self = this,
                pressed = this.toThemeProperty('jqx-listmenu-arrow-right-pressed'),
                arrow = li.children('.jqx-listmenu-arrow-right');
            var isTouchDevice = $.jqx.mobile.isTouchDevice();
            var touchstart = $.jqx.mobile.getTouchEventName('touchstart');
            var touchend = $.jqx.mobile.getTouchEventName('touchend');
            var touchmove = $.jqx.mobile.getTouchEventName('touchmove');

            var mouseDownEvent = (!isTouchDevice ? 'mousedown' : touchstart) + '.listmenu';
            var mouseUpEvent = (!isTouchDevice ? 'mouseup' : touchend) + '.listmenu';
            var downLi = null;
            var position = "";
            if (!(/(separator|readonly)/).test(li.data('role')) && !this.readOnly) {
                this.addHandler(li, 'dragstart', function () {
                    return false;
                });

                this.addHandler(li, mouseDownEvent, function (event) {
                    if (!self.disabled) {
                        downLi = event.target;
                        position = $.jqx.position(event);
                        if (li.find('div[data-role="content"]').length == 0) {
                            if (!isTouchDevice) {
                                li.addClass(self.toThemeProperty('jqx-fill-state-pressed'));
                                arrow.addClass(pressed);
                            }
                        }
                    }
                });
                this.addHandler(li, mouseUpEvent, function (event) {
                    if (!self.disabled) {
                        if (downLi == event.target || !isTouchDevice) {
                            if (isTouchDevice) {
                                if ($.jqx.position(event).top === position.top) {
                                    self.next(li);
                                }
                            }
                            else {
                                if ($.jqx.position(event).top === position.top) {
                                    self.next(li);
                                }
                            }
                        }
                    }
                });
                this.addHandler($(document), mouseUpEvent + '.' + li[0].id, function () {
                    if (!self.disabled) {
                        li.removeClass(self.toThemeProperty('jqx-fill-state-pressed'));
                        arrow.removeClass(pressed);
                    }
                });
            }
        },

        _addLiClasses: function (li, current, count) {
            li = $(li);
            if (li.data('role') === 'separator') {
                this._handleSeparatorStyle(li);
            } else if (li.data('role') === 'header') {
                this._handleHeaderStyle(li);
            } else {
                if (this.readOnly || li.data('role') === 'readonly') {
                    li.addClass(this.toThemeProperty('jqx-listmenu-item-readonly'));
                } else {
                    li.removeClass(this.toThemeProperty('jqx-listmenu-item-readonly'));
                }
                this._handleItemStyle(li);
            }
            if (current === 0 && !this.showHeader && !this.showFilter) {
                li.addClass(this.toThemeProperty('jqx-rc-t'));
            }
            if (current === count - 1) {
                li.addClass(this.toThemeProperty('jqx-rc-b'));
            }
        },

        _handleSeparatorStyle: function (li) {
            li.addClass(this.toThemeProperty('jqx-listmenu-separator'));
            li.addClass(this.toThemeProperty('jqx-fill-state-pressed'));
            li[0].style.listStyle = 'none';
        },

        _handleHeaderStyle: function (li) {
            li.css('display', 'none');
        },

        _handleItemStyle: function (li) {
            li.addClass(this.toThemeProperty('jqx-listmenu-item'));
            if (this.rtl) {
                li.addClass(this.toThemeProperty('jqx-rtl'));
            }
            li.addClass(this.toThemeProperty('jqx-fill-state-normal'));
            li.addClass(this.toThemeProperty('jqx-item'));
        },

        back: function () {
            var c = this._currentPage,
                parent;
            if (c) {
                parent = this._parentMap[c[0].id];
            }
            this._back = true;
            if ($("#" + parent).length > 0) {
                $.jqx.aria($("#" + parent), 'aria-expanded', false);
            }

            this._changePage(c, $('#' + parent).parent(), this.animationDuration, true);
            this._back = false;
        },

        next: function (li) {
            var id = li.attr('id'),
                childId = this._childrenMap[id],
                child = $('#' + childId),
                parent = $('#' + id).parent();
            $.jqx.aria(li, 'aria-expanded', true);

            this._changePage(parent, child, this.animationDuration);
        },

        changePage: function (newPage) {
            if (typeof newPage === 'string') {
                newPage = $(newPage);
            }
            if (!newPage[0] || (newPage.attr('data-role') !== 'listmenu') || newPage.parents().index(this.host) < 0) {
                throw new Error('Invalid newPage. The chosen newPage is not listmenu or it\'s not part of the selected jqxListMenu hierarchy.');
            }
            if (this._currentPage[0] == newPage[0]) return;
            this._changePage(this._currentPage, newPage, this.animationDuration);
        },

        _changePage: function (oldPage, newPage, duration, back) {
            if (!this._lock) {
                var changeMethod = '_' + this.animationType + 'Change' + (back ? 'Back' : '');
                if (newPage[0]) {
                    if (this.showFilter) {
                        if (newPage.find('div[data-role="content"]').length > 0) {
                            $.each(newPage.find('li'), function () {
                                if ($(this).data('role') === 'separator') {
                                    $(this).hide();
                                }
                            });
                            this._filterBar.css('display', 'none');
                        }
                        else {
                            this._filterBar.css('display', 'block');
                        }
                    }

                    this._lock = true;
                    this[changeMethod](oldPage, newPage, this.animationDuration, function () {
                        this._lock = false;
                        this._changeHeader(newPage);
                        this._currentPage = newPage;
                    });
                }
            }
        },

        _changeHeader: function (page) {
            var header = $(page).find('li[data-role="header"]').first();
            if (header[0]) {
                var self = this;
                this._headerLabel.fadeOut(this.headerAnimationDuration / 2, function () {
                    self._headerLabel.html(header.html());
                    self._headerLabel.fadeIn(self.headerAnimationDuration / 2);
                });
            }
        },

        _slideChange: function (oldPage, newPage, duration, callback) {
            var self = this;
            if (this.enableScrolling && this.panel != null) {
                this.panel.jqxPanel('scrollTo', 0, 0);
            }
            var rtl = this.rtl;

            this._initSlide(oldPage, newPage);
            if (!rtl) {
                oldPage.animate({ 'margin-left': -oldPage.width() - parseInt(oldPage.css('margin-right'), 10) || 0 }, duration, 'easeInOutSine');
                newPage.animate({ 'margin-left': 0 }, duration, 'easeInOutSine', function () {
                    self._slideEnd(oldPage, newPage);
                    callback.call(self, $(this));
                });
            }
            else {
                oldPage.animate({ 'margin-left': oldPage.width() + parseInt(oldPage.css('margin-right'), 10) || 0 }, duration, 'easeInOutSine');
                newPage.animate({ 'margin-left': 0 }, duration, 'easeInOutSine', function () {
                    self._slideEnd(oldPage, newPage);
                    callback.call(self, $(this));
                });
            }
        },

        _initSlide: function (oldPage, newPage) {
            //     this.host.height(Math.max(oldPage.outerHeight(true), newPage.outerHeight(true)) + this._filterBar.outerHeight(true) + this._header.outerHeight(true));
            var rtl = this.rtl;

            oldPage.width(oldPage.width());
            newPage.css({
                marginTop: -(oldPage.outerHeight(true)),
                marginLeft: !rtl ? oldPage.width() + (parseInt(oldPage.css('margin-right'), 10) || 0) : -oldPage.width() - (parseInt(oldPage.css('margin-right'), 10) || 0),
                display: 'block',
                height: 'auto',
                width: oldPage.width()
            });
        },

        _slideEnd: function (oldPage, newPage) {
            this.host.css('height', 'auto');
            oldPage.css({
                display: 'none',
                width: 'auto',
                height: 'auto',
                marginTop: 0,
                marginLeft: 0
            });
            newPage.css({
                marginTop: 0,
                marginLeft: 0,
                height: 'auto',
                width: 'auto',
                display: 'block'
            });
        },

        _slideChangeBack: function (oldPage, newPage, duration, callback) {
            var self = this;
            this._initSlideBack(oldPage, newPage);
            oldPage.animate({ 'margin-left': !this.rtl ? oldPage.width() + parseInt(oldPage.css('margin-right'), 10) || 0 : -oldPage.width() - parseInt(oldPage.css('margin-right'), 10) || 0 }, duration);
            newPage.animate({ 'margin-left': 0 }, duration, function () {
                self._slideEnd(oldPage, newPage);
                callback.call(self, $(this));
            });
        },

        _initSlideBack: function (oldPage, newPage) {
            //     this.host.height(Math.max(oldPage.outerHeight(true), newPage.outerHeight(true)) + this._filterBar.outerHeight(true) + this._header.outerHeight(true));
            oldPage.css({
                marginTop: -(newPage.outerHeight(true)),
                width: oldPage.width()
            });
            newPage.css({
                width: oldPage.width(),
                marginLeft: !this.rtl ? -oldPage.width() - parseInt(oldPage.css('margin-right'), 10) || 0 : oldPage.width() + parseInt(oldPage.css('margin-right'), 10) || 0,
                display: 'block',
                height: 'auto'
            });
        },

        _fadeChangeBack: function (oldPage, newPage, duration, callback) {
            this._fadeChange(oldPage, newPage, duration, callback);
        },

        _fadeChange: function (oldPage, newPage, duration, callback) {
            var self = this;
            oldPage.fadeOut(duration / 2, function () {
                newPage.fadeIn(duration / 2, function () {
                    callback.call(self, $(this));
                });
            });
        },

        _removeClasses: function () {
            this._filterBar.removeClass(this.toThemeProperty('jqx-listmenu-filter'));
            this._filterBar.removeClass(this.toThemeProperty('jqx-widget-header'));
            this._filterInput.removeClass(this.toThemeProperty('jqx-listmenu-filter-input'));
            this._filterInput.removeClass(this.toThemeProperty('jqx-input'));
            this._header.removeClass(this.toThemeProperty('jqx-listmenu-header'));
            this._header.removeClass(this.toThemeProperty('jqx-widget-header'));
            this._header.removeClass(this.toThemeProperty('jqx-rc-t'));
            if (this.roundedCorners) {
                this.host.removeClass(this.toThemeProperty('jqx-rc-all'));
            }
            this.host.removeClass(this.toThemeProperty('jqx-widget'));
            this.host.removeClass(this.toThemeProperty('jqx-listmenu-widget'));
            this.host.removeClass(this.toThemeProperty('jqx-fill-state-normal'));
            this.host.removeClass(this.toThemeProperty('jqx-reset'));
            if (this.host.find('div[data-role="content"]').length > 0) {
                this.host.find('div[data-role="content"]').removeClass(this.toThemeProperty('jqx-widget-content'));
            }
        },

        _addClasses: function () {
            if (this.roundedCorners) {
                this.host.addClass(this.toThemeProperty('jqx-rc-all'));
            }
            else {
                this.host.removeClass(this.toThemeProperty('jqx-rc-all'));
            }
            this.host.addClass('jqx-widget');
            this.host.addClass('jqx-listmenu-widget');
            this.host.addClass('jqx-fill-state-normal');
            this.host.addClass('jqx-reset');
            this._filterBar.addClass(this.toThemeProperty('jqx-listmenu-filter'));
            this._filterBar.addClass(this.toThemeProperty('jqx-widget-header'));
            this._filterInput.addClass(this.toThemeProperty('jqx-listmenu-filter-input'));
            this._filterInput.addClass(this.toThemeProperty('jqx-input'));
            this._header.addClass(this.toThemeProperty('jqx-listmenu-header'));
            this._header.addClass(this.toThemeProperty('jqx-widget-header'));
            this._header.addClass(this.toThemeProperty('jqx-rc-t'));
            if (this.host.find('div[data-role="content"]').length > 0) {
                this.host.find('div[data-role="content"]').addClass(this.toThemeProperty('jqx-widget-content'));
            }
        },

        _raiseEvent: function () {

        },

        _filter: function (searchValue) {
            var els = this.host.find('.jqx-listmenu-item');
            for (var i = 0; i < els.length; i += 1) {
                var value = $.trim($(els[i]).text());
                if (!this.filterCallback(value, searchValue)) {
                    els[i].style.display = 'none';
                } else {
                    els[i].style.display = 'block';
                }
            }
            var els = this.host.find('.jqx-listmenu-separator');
            for (var i = 0; i < els.length; i += 1) {
                var hasVisibleItems = false;
                $.each(els[i].items, function () {
                    if ($(this).css('display') != 'none') {
                        hasVisibleItems = true;
                        return false;
                    }
                });
                if (!hasVisibleItems) {
                    els[i].style.display = 'none';
                }
                else {
                    els[i].style.display = 'block';
                }
            }
        },

        disable: function () {
            this.host.addClass(this.toThemeProperty('jqx-fill-state-disabled'));
            this.disabled = true;
        },

        enable: function () {
            this.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
            this.disabled = false;
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (key == 'disabled') {
                if (value)
                    object.disable();
                else object.enable();
            }

            if (key === 'backLabel') {
                object._backButton.html(value);
                return;
            } else if (key === 'placeHolder') {
                object._filterInput.attr('placeholder', value);
            } else if ((/(showFilter|showHeader|showBackButton|width|height|autoSeparators|readOnly)/).test(key)) {
                object._render();
                return;
            }
        }
    });

}(jqxBaseFramework));