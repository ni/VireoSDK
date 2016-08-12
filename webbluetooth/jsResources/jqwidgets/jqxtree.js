/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {

    $.jqx.jqxWidget("jqxTree", "", {});

    $.extend($.jqx._jqxTree.prototype, {
        defineInstance: function () {
            var settings = {
                //Type: Array
                //Gets the tree's items.
                items: new Array(),
                //Type: Number.
                //Default: null.
                //Sets the width.
                width: null,
                //Type: Number.
                //Default: null.
                //Sets the height.
                height: null,
                //Type: String.
                //Default: easeInOutSine.
                //Gets or sets the animation's easing to one of the JQuery's supported easings.         
                easing: 'easeInOutCirc',
                //Type: Number.
                //Default: 'fast'.
                //Gets or sets the duration of the show animation.         
                animationShowDuration: 'fast',
                //Type: Number.
                //Default: 'fast'.
                //Gets or sets the duration of the hide animation.
                animationHideDuration: 'fast',
                //Type: Array.
                treeElements: new Array(),
                //Type: Boolean.
                //Default: true.
                //Enables or disables the tree.
                disabled: false,
                // Type: Boolean
                // Default: true
                // enables or disables the hover state.
                enableHover: true,
                // Type: Boolean
                // Default: true
                // enables or disables the key navigation.
                keyboardNavigation: true,
                enableKeyboardNavigation: true,
                // Type: String
                // Default: click
                // Gets or sets user interaction used for expanding or collapsing any item. Possible values ['click', 'dblclick'].
                toggleMode: 'dblclick',
                // Type: Object
                // Default: null
                // data source.
                source: null,
                // Type: Boolean
                // Default: false
                // Gets or sets whether the tree should display a checkbox next to each item.
                checkboxes: false,
                checkSize: 13,
                toggleIndicatorSize: 16,
                // Type: Boolean
                // Default: false
                // Gets or sets whether the tree checkboxes have three states - checked, unchecked and indeterminate.           
                hasThreeStates: false,
                // Type: Object
                // Default: null
                // Private
                // gets the selected item. To select an item, use the selectItem function.
                selectedItem: null,
                touchMode: 'auto',
                // tree events.
                // expand is triggered when the user expands a tree item.
                // collapse is triggered when the user collapses a tree item.
                // select is triggered when the user selects a tree item.
                // add is triggered when the user adds a new tree item.
                // remove is triggered when the user removes a tree item.
                // checkchange is triggered when the user checks, unchecks or the checkbox is in indeterminate state.
                allowDrag: true,
                allowDrop: true,
                searchMode: 'startswithignorecase',
                incrementalSearch: true,
                incrementalSearchDelay: 700,
                animationHideDelay: 0,
                submitCheckedItems: false,
                dragStart: null,
                dragEnd: null,
                rtl: false,
                // Possible values: 'none, 'default', 'copy'
                dropAction: 'default',
                events:
                [
                    'expand', 'collapse', 'select', 'initialized', 'added', 'removed', 'checkChange', 'dragEnd', 'dragStart', 'itemClick'
                ],
                aria:
                {
                    "aria-activedescendant": { name: "getActiveDescendant", type: "string" },
                    "aria-disabled": { name: "disabled", type: "boolean" }
                }
            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            var self = this;
            this.host.attr('role', 'tree');
            this.host.attr('data-role', 'treeview');
            this.enableKeyboardNavigation = this.keyboardNavigation;
            this.propertyChangeMap['disabled'] = function (instance, key, oldVal, value) {
                if (self.disabled) {
                    self.host.addClass(self.toThemeProperty('jqx-tree-disabled'));
                }
                else {
                    self.host.removeClass(self.toThemeProperty('jqx-tree-disabled'));
                }
                $.jqx.aria(self, "aria-disabled", value);
            }

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

            if (this.width != null && this.width.toString().indexOf("%") != -1) {
                this.host.width(this.width);
            }
            if (this.height != null && this.height.toString().indexOf("%") != -1) {
                this.host.height(this.height);
            }
            if (!this.host.attr('tabindex')) {
                this.host.attr('tabIndex', 1);
            }
            if (this.disabled) {
                this.host.addClass(this.toThemeProperty('jqx-tree-disabled'));
                $.jqx.aria(this, "aria-disabled", true);
            }

            if (this.host.jqxDragDrop) {
                jqxTreeDragDrop();
            }

            this.originalInnerHTML = this.element.innerHTML;
            this.createdTree = false;
            if (this.element.innerHTML.indexOf('UL')) {
                var innerElement = this.host.find('ul:first');
                if (innerElement.length > 0) {
                    this.createTree(innerElement[0]);
                    this.createdTree = true;
                }
            }

            if (this.source != null) {
                var html = this.loadItems(this.source);
                this.element.innerHTML = html;
                var innerElement = this.host.find('ul:first');
                if (innerElement.length > 0) {
                    this.createTree(innerElement[0]);
                    this.createdTree = true;
                }
            }

            this._itemslength = this.items.length;

            if (!this.createdTree) {
                if (this.host.find('ul').length == 0) {
                    this.host.append($('<ul></ul>'));
                    var innerElement = this.host.find('ul:first');
                    if (innerElement.length > 0) {
                        this.createTree(innerElement[0]);
                        this.createdTree = true;
                    }

                    this.createdTree = true;
                }
            }

            if (this.createdTree == true) {
                this._render();
                this._handleKeys();
            }

            this._updateCheckLayout();
        },

        checkItems: function (item, baseItem) {
            var me = this;
            if (item != null) {
                var count = 0;
                var hasIndeterminate = false;
                var itemsCount = 0;

                var childItems = $(item.element).find('li');
                itemsCount = childItems.length;

                $.each(childItems, function (index) {
                    var child = me.itemMapping["id" + this.id].item;
                    if (child.checked != false) {
                        if (child.checked == null) {
                            hasIndeterminate = true;
                        }
                        count++;
                    }
                });

                if (item != baseItem) {
                    if (count == itemsCount) {
                        this.checkItem(item.element, true, 'tree');
                    }
                    else {
                        if (count > 0) {
                            this.checkItem(item.element, null, 'tree');
                        }
                        else this.checkItem(item.element, false, 'tree');

                    }
                }
                else {
                    var checked = baseItem.checked;
                    var childItems = $(baseItem.element).find('li');
                    $.each(childItems, function () {
                        var child = me.itemMapping["id" + this.id].item;
                        me.checkItem(this, checked, 'tree');
                    });
                }

                this.checkItems(this._parentItem(item), baseItem);
            }
            else {
                var checked = baseItem.checked;
                var childItems = $(baseItem.element).find('li');
                $.each(childItems, function () {
                    var child = me.itemMapping["id" + this.id].item;
                    me.checkItem(this, checked, 'tree');
                });
            }
        },

        _getMatches: function (value, startIndex) {
            if (value == undefined || value.length == 0)
                return -1;

            var items = this.items;
            var visibleItems = new Array();
            for (var i = 0; i < items.length; i++) {
                if (this._isVisible(items[i]) && !items[i].disabled)
                    visibleItems.push(items[i]);
            }
            items = visibleItems;
            if (startIndex != undefined) {
                items = items.slice(startIndex);
            }

            var keyMatches = new Array();
            $.each(items, function (i) {
                var itemValue = this.label;
                if (!itemValue) itemValue = "";
                var match = $.jqx.string.startsWithIgnoreCase(itemValue.toString(), value);

                if (match) {
                    keyMatches.push({ id: this.id, element: this.element });
                }
            });
            return keyMatches;
        },

        _handleKeys: function () {
            var self = this;
            this.addHandler(this.host, 'keydown', function (event) {
                var key = event.keyCode;
                if (self.keyboardNavigation || self.enableKeyboardNavigation) {
                    if (self.selectedItem != null) {
                        var element = self.selectedItem.element;
                        if (self.incrementalSearch && (!(key >= 33 && key <= 40))) {
                            var matchindex = -1;
                            if (!self._searchString) {
                                self._searchString = "";
                            }

                            if ((key == 8 || key == 46) && self._searchString.length >= 1) {
                                self._searchString = self._searchString.substr(0, self._searchString.length - 1);
                            }

                            var letter = String.fromCharCode(key);

                            var isDigit = (!isNaN(parseInt(letter)));
                            var toReturn = false;
                            if ((key >= 65 && key <= 97) || isDigit || key == 8 || key == 32 || key == 46) {
                                if (!event.shiftKey) {
                                    letter = letter.toLocaleLowerCase();
                                }

                                if (key != 8 && key != 32 && key != 46) {
                                    if (!(self._searchString.length > 0 && self._searchString.substr(0, 1) == letter))
                                        self._searchString += letter;
                                }

                                if (key == 32) {
                                    self._searchString += " ";
                                }
                                self._searchTime = new Date();
                                var selection = self.selectedItem;
                                if (selection) {
                                    var rowKey = selection.id;
                                    var index = -1;
                                    for (var i = 0; i < self.items.length; i++) {
                                        if (self.items[i].id == rowKey) {
                                            index = i + 1;
                                            break;
                                        }
                                    }

                                    var foundRows = self._getMatches(self._searchString, index);
                                    if (foundRows.length == 0 || (foundRows.length > 0 && foundRows[0].id == rowKey)) {
                                        var foundRows = self._getMatches(self._searchString);
                                    }
                                }
                                else {
                                    var foundRows = self._getMatches(self._searchString);
                                }

                                if (foundRows.length > 0) {
                                    var selection = self.selectedItem;
                                    if (self.selectedItem && self.selectedItem.id != foundRows[0].id) {
                                        self.clearSelection();
                                        self.selectItem(foundRows[0].element, "keyboard");
                                    }
                                    self._lastSearchString = self._searchString;
                                }
                            }

                            if (self._searchTimer != undefined) {
                                clearTimeout(self._searchTimer);
                            }

                            if (key == 27 || key == 13) {
                                self._searchString = "";
                                self._lastSearchString = "";
                            }

                            self._searchTimer = setTimeout(function () {
                                self._searchString = "";
                                self._lastSearchString = "";
                            }, 500);

                            if (matchindex >= 0) {
                                return;
                            }
                            if (toReturn)
                                return false;
                        }


                        switch (key) {
                            case 32:
                                if (self.checkboxes) {
                                    self.fromKey = true;
                                    var checked = $(self.selectedItem.checkBoxElement).jqxCheckBox('checked');
                                    self.checkItem(self.selectedItem.element, !checked, 'tree');
                                    if (self.hasThreeStates) {
                                        self.checkItems(self.selectedItem, self.selectedItem);
                                    }
                                    return false;
                                }
                                return true;
                            case 33:
                                var itemsOnPage = self._getItemsOnPage();
                                var prevItem = self.selectedItem;
                                for (var i = 0; i < itemsOnPage; i++) {
                                    prevItem = self._prevVisibleItem(prevItem);
                                }
                                if (prevItem != null) {
                                    self.selectItem(prevItem.element, "keyboard");
                                    self.ensureVisible(prevItem.element);
                                }
                                else {
                                    self.selectItem(self._firstItem().element, "keyboard");
                                    self.ensureVisible(self._firstItem().element);
                                }
                                return false;
                            case 34:
                                var itemsOnPage = self._getItemsOnPage();
                                var nextItem = self.selectedItem;
                                for (var i = 0; i < itemsOnPage; i++) {
                                    nextItem = self._nextVisibleItem(nextItem);
                                }
                                if (nextItem != null) {
                                    self.selectItem(nextItem.element, "keyboard");
                                    self.ensureVisible(nextItem.element);
                                }
                                else {
                                    self.selectItem(self._lastItem().element, "keyboard");
                                    self.ensureVisible(self._lastItem().element);
                                }
                                return false;
                            case 37:
                            case 39:
                                if ((key == 37 && !self.rtl) || (key == 39 && self.rtl)) {
                                    if (self.selectedItem.hasItems && self.selectedItem.isExpanded) {
                                        self.collapseItem(element);
                                    }
                                    else {
                                        var parentItem = self._parentItem(self.selectedItem);
                                        if (parentItem != null) {
                                            self.selectItem(parentItem.element, "keyboard");
                                            self.ensureVisible(parentItem.element);
                                        }
                                    }
                                }
                                if ((key == 39 && !self.rtl) || (key == 37 && self.rtl)) {
                                    if (self.selectedItem.hasItems) {
                                        if (!self.selectedItem.isExpanded) {
                                            self.expandItem(element);
                                        }
                                        else {
                                            var nextItem = self._nextVisibleItem(self.selectedItem);
                                            if (nextItem != null) {
                                                self.selectItem(nextItem.element, "keyboard");
                                                self.ensureVisible(nextItem.element);
                                            }
                                        }
                                    }
                                }
                                return false;
                            case 13:
                                if (self.selectedItem.hasItems) {
                                    if (self.selectedItem.isExpanded) {
                                        self.collapseItem(element);
                                    }
                                    else {
                                        self.expandItem(element);
                                    }
                                }
                                return false;
                            case 36:
                                self.selectItem(self._firstItem().element, "keyboard");
                                self.ensureVisible(self._firstItem().element);
                                return false;
                            case 35:
                                self.selectItem(self._lastItem().element, "keyboard");
                                self.ensureVisible(self._lastItem().element);
                                return false;
                            case 38:
                                var prevItem = self._prevVisibleItem(self.selectedItem);
                                if (prevItem != null) {
                                    self.selectItem(prevItem.element, "keyboard");
                                    self.ensureVisible(prevItem.element);
                                }
                                return false;
                            case 40:
                                var nextItem = self._nextVisibleItem(self.selectedItem);
                                if (nextItem != null) {
                                    self.selectItem(nextItem.element, "keyboard");
                                    self.ensureVisible(nextItem.element);
                                }
                                return false;
                        }
                    }
                }
            });
        },

        _firstItem: function () {
            var item = null;
            var me = this;
            var innerElement = this.host.find('ul:first');
            var liTags = $(innerElement).find('li');

            for (i = 0; i <= liTags.length - 1; i++) {
                var listTag = liTags[i];
                item = this.itemMapping["id" + listTag.id].item;
                if (me._isVisible(item)) {
                    return item;
                }
            }

            return null;
        },

        _lastItem: function () {
            var item = null;
            var me = this;
            var innerElement = this.host.find('ul:first');
            var liTags = $(innerElement).find('li');

            for (i = liTags.length - 1; i >= 0; i--) {
                var listTag = liTags[i];
                item = this.itemMapping["id" + listTag.id].item;
                if (me._isVisible(item)) {
                    return item;
                }
            }

            return null;
        },

        _parentItem: function (item) {
            if (item == null || item == undefined)
                return null;

            var parent = item.parentElement;
            if (!parent) return null;
            var parentItem = null;

            $.each(this.items, function () {
                if (this.element == parent) {
                    parentItem = this;
                    return false;
                }
            });

            return parentItem;
        },

        _nextVisibleItem: function (item) {
            if (item == null || item == undefined)
                return null;

            var currentItem = item;
            while (currentItem != null) {
                currentItem = currentItem.nextItem;
                if (this._isVisible(currentItem) && !currentItem.disabled)
                    return currentItem;
            }

            return null;
        },

        _prevVisibleItem: function (item) {
            if (item == null || item == undefined)
                return null;

            var currentItem = item;
            while (currentItem != null) {
                currentItem = currentItem.prevItem;
                if (this._isVisible(currentItem) && !currentItem.disabled)
                    return currentItem;
            }

            return null;
        },

        _isVisible: function (item) {
            if (item == null || item == undefined)
                return false;

            if (!this._isElementVisible(item.element))
                return false;

            var currentItem = this._parentItem(item);

            if (currentItem == null)
                return true;

            if (currentItem != null) {
                if (!this._isElementVisible(currentItem.element)) {
                    return false;
                }

                if (currentItem.isExpanded) {
                    while (currentItem != null) {
                        currentItem = this._parentItem(currentItem);
                        if (currentItem != null && !this._isElementVisible(currentItem.element)) {
                            return false;
                        }

                        if (currentItem != null && !currentItem.isExpanded)
                            return false;
                    }
                }
                else {
                    return false;
                }
            }

            return true;
        },

        _getItemsOnPage: function () {
            var itemsCount = 0;
            var position = this.panel.jqxPanel('getVScrollPosition');
            var height = parseInt(this.host.height());
            var itemsHeight = 0;
            var firstItem = this._firstItem();

            if (parseInt($(firstItem.element).height()) > 0) {
                while (itemsHeight <= height) {
                    itemsHeight += parseInt($(firstItem.element).outerHeight());
                    itemsCount++;
                }
            }

            return itemsCount;
        },

        _isElementVisible: function (element) {
            if (element == null)
                return false;

            if ($(element).css('display') != 'none' && $(element).css('visibility') != 'hidden') {
                return true;
            }

            return false;
        },

        refresh: function (initialRefresh) {
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

            if (this.panel) {
                if (this.width != null && this.width.toString().indexOf("%") != -1) {
                    var me = this;
                    this.panel.jqxPanel('width', '100%');
                    me.removeHandler($(window), 'resize.jqxtree' + me.element.id);
                    me.addHandler($(window), 'resize.jqxtree' + me.element.id,
                    function () {
                        me._calculateWidth();
                    });
                }
                else {
                    this.panel.jqxPanel('width', this.host.width());
                }
                this.panel.jqxPanel('_arrange');
            }
            this._calculateWidth();
            if ($.jqx.isHidden(this.host)) {
                var me = this;
                if (this._hiddenTimer) {
                    clearInterval(this._hiddenTimer);
                }
                this._hiddenTimer = setInterval(function () {
                    if (!$.jqx.isHidden(me.host)) {
                        clearInterval(me._hiddenTimer);
                        me._calculateWidth();
                    }
                }, 100);
            }
            if (initialRefresh != true) {
                if (this.checkboxes) {
                    this._updateCheckLayout(null);
                }
            }
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.refresh();
        },

        loadItems: function (items) {
            if (items == null) {
                return;
            }

            var self = this;
            this.items = new Array();
            var html = '<ul>';
            $.map(items, function (item) {
                if (item == undefined)
                    return null;

                html += self._parseItem(item);
            });

            html += '</ul>';
            return html;
        },

        _parseItem: function (item) {
            var html = "";

            if (item == undefined)
                return null;

            var label = item.label;
            if (!item.label && item.html) {
                label = item.html;
            }
            if (!label) {
                label = "Item";
            }

            if (typeof item === 'string') {
                label = item;
            }

            var expanded = false;
            if (item.expanded != undefined && item.expanded) {
                expanded = true;
            }

            var locked = false;
            if (item.locked != undefined && item.locked) {
                locked = true;
            }

            var selected = false;
            if (item.selected != undefined && item.selected) {
                selected = true;
            }

            var disabled = false;
            if (item.disabled != undefined && item.disabled) {
                disabled = true;
            }

            var checked = false;
            if (item.checked != undefined && item.checked) {
                checked = true;
            }

            var icon = item.icon;
            var iconsize = item.iconsize;

            html += '<li';
            if (expanded) {
                html += ' item-expanded="true" ';
            }

            if (locked) {
                html += ' item-locked="true" ';
            }

            if (disabled) {
                html += ' item-disabled="true" ';
            }

            if (selected) {
                html += ' item-selected="true" ';
            }

            if (iconsize) {
                html += ' item-iconsize="' + item.iconsize + '" ';
            }

            if (icon != null && icon != undefined) {
                html += ' item-icon="' + icon + '" ';
            }

            if (item.label && !item.html) {
                html += ' item-label="' + label + '" ';
            }

            if (item.value != null) {
                html += ' item-value="' + item.value + '" ';
            }

            if (item.checked != undefined) {
                html += ' item-checked="' + checked + '" ';
            }

            var id = "";
            if (item.id != undefined) {
                id = item.id;
                html += ' id="' + id + '" ';
            }
            else {
                id = this.createID();
                html += ' id="' + id + '" ';
            }

            html += '>' + label;

            if (item.items) {
                html += this.loadItems(item.items);
            }
            if (!this._valueList) this._valueList = new Array();
            this._valueList[id] = item.value;

            html += '</li>';
            return html;
        },

        // ensures the visibility of an element.
        // @ param element.
        ensureVisible: function (element) {
            if (element == null || element == undefined)
                return;

            var position = this.panel.jqxPanel('getVScrollPosition');
            var hposition = this.panel.jqxPanel('getHScrollPosition');
            var height = parseInt(this.host.height());
            var elementPosition = $(element).position().top;

            if (elementPosition <= position || elementPosition >= height + position) {
                this.panel.jqxPanel('scrollTo', hposition, elementPosition - height + $(element).outerHeight());
            }
        },

        _syncItems: function (elements) {
            this._visibleItems = new Array();
            var me = this;
            $.each(elements, function () {
                var $element = $(this);
                if ($element.css('display') != 'none') {
                    var height = $element.outerHeight();
                    if ($element.height() > 0) {
                        var top = parseInt($element.offset().top);
                        me._visibleItems[me._visibleItems.length] = { element: this, top: top, height: height, bottom: top + height };
                    }
                }
            });
        },

        hitTest: function (left, top) {
            var me = this;
            var treeInstance = this;
            var treeItem = null;
            var elements = this.host.find('.jqx-item');
            this._syncItems(elements);

            if (treeInstance._visibleItems) {
                var hostLeft = parseInt(treeInstance.host.offset().left);
                var hostWidth = treeInstance.host.outerWidth();

                $.each(treeInstance._visibleItems, function (index) {
                    if (left >= hostLeft && left < hostLeft + hostWidth)
                        if (this.top + 5 < top && top < this.top + this.height) {
                            var parentElement = $(this.element).parents('li:first');
                            if (parentElement.length > 0) {
                                treeItem = treeInstance.getItem(parentElement[0]);
                                if (treeItem != null) {
                                    treeItem.height = this.height;
                                    treeItem.top = this.top;
                                    return false;
                                }
                            }
                        }
                });
            }
            return treeItem;
        },

        addBefore: function (items, sibling, refresh) {
            return this.addBeforeAfter(items, sibling, true, refresh);
        },

        addAfter: function (items, sibling, refresh) {
            return this.addBeforeAfter(items, sibling, false, refresh);
        },

        addBeforeAfter: function (items, sibling, before, refresh) {
            var treeInstance = this;

            var array = new Array();

            if (sibling && sibling.treeInstance != undefined) {
                sibling = sibling.element;
            }

            if (!$.isArray(items)) {
                array[0] = items;
            }
            else array = items;

            var html = "";
            var me = this;
            $.each(array, function () {
                html += me._parseItem(this);
            });
            var el = $(html);
            if (treeInstance.element.innerHTML.indexOf('UL')) {
                var innerElement = treeInstance.host.find('ul:first');
            }

            if (sibling == undefined && sibling == null) {
                innerElement.append(el);
            }
            else {
                if (before) {
                    $(sibling).before(el);
                }
                else {
                    $(sibling).after(el);
                }
            }

            var liTags = el;
            for (var index = 0; index < liTags.length; index++) {
                this._createItem(liTags[index]);
                var subTags = $(liTags[index]).find('li');
                if (subTags.length > 0) {
                    for (var j = 0; j < subTags.length; j++) {
                        this._createItem(subTags[j]);
                    }
                }
            }

            var update = function (drag) {
                me._refreshMapping(false);
                me._updateItemsNavigation();
                if (drag && me.allowDrag && me._enableDragDrop) {
                    me._enableDragDrop();
                }
                if (me.selectedItem != null) {
                    $(me.selectedItem.titleElement).addClass(me.toThemeProperty('jqx-fill-state-pressed'));
                    $(me.selectedItem.titleElement).addClass(me.toThemeProperty('jqx-tree-item-selected'));
                }
            }

            if (refresh == false) {
                update(true);
                this._raiseEvent('4', { items: this.getItems() });
                return;
            }

            update(false);
            me._render();
            this._raiseEvent('4', { items: this.getItems() });
            if (me.checkboxes) {
                me._updateCheckLayout(null);
            }
        },

        addTo: function (items, parentElement, refresh) {
            var treeInstance = this;

            var array = new Array();

            if (parentElement && parentElement.treeInstance != undefined) {
                parentElement = parentElement.element;
            }

            if (!$.isArray(items)) {
                array[0] = items;
            }
            else array = items;

            var html = "";
            var me = this;
            $.each(array, function () {
                html += me._parseItem(this);
            });
            var el = $(html);
            if (treeInstance.element.innerHTML.indexOf('UL')) {
                var innerElement = treeInstance.host.find('ul:first');
            }

            if (parentElement == undefined && parentElement == null) {
                innerElement.append(el);
            }
            else {
                parentElement = $(parentElement);
                var parentUL = parentElement.find('ul:first');
                if (parentUL.length == 0) {
                    ulElement = $('<ul></ul>');
                    $(parentElement).append(ulElement);
                    parentUL = parentElement.find('ul:first');
                    var item = treeInstance.itemMapping["id" + parentElement[0].id].item;
                    item.subtreeElement = parentUL[0];
                    item.hasItems = true;
                    parentUL.addClass(treeInstance.toThemeProperty('jqx-tree-dropdown'));
                    if (me.rtl) {
                        parentUL.addClass(treeInstance.toThemeProperty('jqx-tree-dropdown-rtl'));
                    }
                    parentUL.append(el);
                    var element = parentUL.find('li:first');
                    item.parentElement = element;
                }
                else {
                    parentUL.append(el);
                }
            }

            var liTags = el;
            for (var index = 0; index < liTags.length; index++) {
                this._createItem(liTags[index]);
                var subTags = $(liTags[index]).find('li');
                if (subTags.length > 0) {
                    for (var j = 0; j < subTags.length; j++) {
                        this._createItem(subTags[j]);
                    }
                }
            }

            var update = function (drag) {
                me._refreshMapping(false);
                me._updateItemsNavigation();
                if (drag && me.allowDrag && me._enableDragDrop) {
                    me._enableDragDrop();
                }
                if (me.selectedItem != null) {
                    $(me.selectedItem.titleElement).addClass(me.toThemeProperty('jqx-fill-state-pressed'));
                    $(me.selectedItem.titleElement).addClass(me.toThemeProperty('jqx-tree-item-selected'));
                }
            }

            if (refresh == false) {
                update(true);
                this._raiseEvent('4', { items: this.getItems() });
                return;
            }

            update(false);
            me._render();
            if (me.checkboxes) {
                me._updateCheckLayout(null);
            }
            this._raiseEvent('4', { items: this.getItems() });
        },

        updateItem: function (element, content) {
            var item = element.treeInstance != undefined ? element : this.getItem(element);
            if (!item) {
                var tmp = element;
                element = content;
                content = tmp;
                var item = element.treeInstance != undefined ? element : this.getItem(element);
            }

            if (item) {
                if (typeof (content) === "string") {
                    content = { label: content };
                }

                if (content.value) {
                    item.value = content.value;
                }
                if (content.label) {
                    item.label = content.label;
                    $.jqx.utilities.html($(item.titleElement), content.label);
                    var ie7 = $.jqx.browser.msie && $.jqx.browser.version < 8;
                    if (ie7) {
                        $(document.body).append(this._measureItem);
                        this._measureItem.html($(item.titleElement).text());
                        var width = this._measureItem.width();
                        if (item.icon) {
                            width += 20;
                        }
                        if ($($(item.titleElement).find('img')).length > 0) {
                            width += 20;
                        }

                        $(item.titleElement).css('max-width', width + 'px');
                        this._measureItem.remove();
                    }
                }

                if (content.icon) {
                    if ($(item.element).children('.itemicon').length > 0) {
                        $(item.element).find('.itemicon')[0].src = content.icon;
                    }
                    else {
                        var iconsize = content.iconsize;
                        if (!iconsize) iconsize = 16;

                        var icon = $('<img width="' + iconsize + '" height="' + iconsize + '" style="float: left;" class="itemicon" src="' + content.icon + '"/>');
                        $(item.titleElement).prepend(icon);
                        icon.css('margin-right', '4px');
                        if (this.rtl) {
                            icon.css('margin-right', '0px');
                            icon.css('margin-left', '4px');
                            icon.css('float', 'right');
                        }
                    }
                }

                if (content.expanded) {
                    this.expandItem(item);
                }
                if (content.disabled) {
                    this.disableItem(item);
                }
                if (content.selected) {
                    this.selectItem(item);
                }
                return true;
            }

            return false;
        },
        // removes an element.
        // @param element
        removeItem: function (element, refresh) {
            if (element == undefined || element == null) {
                return;
            }

            if (element.treeInstance != undefined) element = element.element;

            var me = this;
            var id = element.id;

            var itemIndex = -1;
            var itemToRemove = this.getItem(element);
            if (itemToRemove) {
                itemIndex = this.items.indexOf(itemToRemove);
                if (itemIndex != -1) {
                    (function removeItemFunc(item) {
                        var itemIndex = -1;
                        itemIndex = this.items.indexOf(item);
                        if (itemIndex != -1) {
                            this.items.splice(itemIndex, 1);
                        }
                        var itemElements = $(item.element).find('li');
                        var itemsCount = itemElements.length;
                        var me = this;
                        var items = new Array();
                        if (itemsCount > 0) {
                            $.each(itemElements, function (index) {
                                var child = me.itemMapping["id" + this.id].item;
                                items.push(child);
                            });

                            for (var i = 0; i < items.length; i++) {
                                removeItemFunc.apply(this, [items[i]]);
                            }
                        }
                    }).apply(this, [itemToRemove]);
                }
            }
            if (this.host.find('#' + element.id).length > 0) {
                $(element).remove();
            }

            if (refresh == false) {
                this._raiseEvent('5');
                return;
            }

            me._updateItemsNavigation();

            if (me.allowDrag && me._enableDragDrop) {
                me._render(true, false);
            }
            else {
                me._render();
            }
            if (me.selectedItem != null) {
                if (me.selectedItem.element == element) {
                    $(me.selectedItem.titleElement).removeClass(me.toThemeProperty('jqx-fill-state-pressed'));
                    $(me.selectedItem.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-selected'));
                    me.selectedItem = null;
                }
            }
            this._raiseEvent('5');
            if (me.checkboxes) {
                me._updateCheckLayout(null);
            }
        },

        clear: function () {
            this.items = new Array();
            this.itemMapping = new Array();
            var element = this.host.find('ul:first');
            if (element.length > 0) {
                element[0].innerHTML = "";
            }
            this.selectedItem = null;
        },

        // disables a tree item.
        // @param element
        disableItem: function (element) {
            if (element == null)
                return false;
            if (element.treeInstance != undefined) element = element.element;

            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (item.element == element) {
                    // me.collapseItem(item.element);
                    item.disabled = true;
                    //      $(item.titleElement).removeClass(me.toThemeProperty('jqx-fill-state-pressed'));
                    //      $(item.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-selected'));
                    $(item.titleElement).addClass(me.toThemeProperty('jqx-fill-state-disabled'));
                    $(item.titleElement).addClass(me.toThemeProperty('jqx-tree-item-disabled'));
                    if (me.checkboxes && item.checkBoxElement) {
                        $(item.checkBoxElement).jqxCheckBox({ disabled: true });
                    }
                    return false;
                }
            });
        },

        _updateInputSelection: function () {
            if (this.input) {
                if (this.selectedItem == null) {
                    this.input.val("");
                }
                else {
                    var label = this.selectItem.value;
                    if (label == null) label = this.selectedItem.label;
                    this.input.val(label);
                }
                if (this.checkboxes) {
                    var items = this.getCheckedItems();
                    if (this.submitCheckedItems) {
                        var str = "";
                        for (var i = 0; i < items.length; i++) {
                            var value = items[i].value;
                            if (value == null) value = items[i].label;
                            if (i == items.length - 1) {
                                str += value;
                            }
                            else {
                                str += value + ",";
                            }
                        }
                        this.input.val(str);
                    }
                }
            }
        },

        getCheckedItems: function () {
            var checkedItems = new Array();
            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (item.checked) checkedItems.push(item);
            });
            return checkedItems;
        },

        getUncheckedItems: function () {
            var checkedItems = new Array();
            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (!item.checked) checkedItems.push(item);
            });
            return checkedItems;
        },

        checkAll: function () {
            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (!item.disabled) {
                    item.checked = true;
                    $(item.checkBoxElement).jqxCheckBox('_setState', true);
                }
            });
            this._raiseEvent('6', { element: this, checked: true });
        },

        uncheckAll: function () {
            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (!item.disabled) {
                    item.checked = false;
                    $(item.checkBoxElement).jqxCheckBox('_setState', false);
                }
            });
            this._raiseEvent('6', { element: this, checked: false });
        },

        // checks a tree item.
        // @param element
        // @param checked state - true, false or null
        checkItem: function (element, checked, owner) {
            if (element == null)
                return false;

            if (checked === undefined) {
                checked = true;
            }

            if (element.treeInstance != undefined) element = element.element;

            var me = this;
            var stateChanged = false;
            var treeItem = null;
            $.each(me.items, function () {
                var item = this;
                if (item.element == element && !item.disabled) {
                    stateChanged = true;
                    item.checked = checked;
                    treeItem = item;
                    $(item.checkBoxElement).jqxCheckBox({ checked: checked });
                    return false;
                }
            });

            if (stateChanged) {
                this._raiseEvent('6', { element: element, checked: checked });
                this._updateInputSelection();
            }
            if (owner == undefined) {
                if (treeItem) {
                    if (this.hasThreeStates) {
                        this.checkItems(treeItem, treeItem);
                    }
                }
            }
        },

        uncheckItem: function (element) {
            this.checkItem(element, false);
        },

        // enables a tree item.
        // @param element
        enableItem: function (element) {
            if (element == null)
                return false;

            if (element.treeInstance != undefined) element = element.element;

            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (item.element == element) {
                    item.disabled = false;
                    $(item.titleElement).removeClass(me.toThemeProperty('jqx-fill-state-disabled'));
                    $(item.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-disabled'));
                    if (me.checkboxes && item.checkBoxElement) {
                        $(item.checkBoxElement).jqxCheckBox({ disabled: false });
                    }
                    return false;
                }
            });
        },

        // enables all items.
        enableAll: function () {
            var me = this;
            $.each(me.items, function () {
                var item = this;
                item.disabled = false;
                $(item.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-disabled'));
                $(item.titleElement).removeClass(me.toThemeProperty('jqx-fill-state-disabled'));
                if (me.checkboxes && item.checkBoxElement) {
                    $(item.checkBoxElement).jqxCheckBox({ disabled: false });
                }
            });
        },

        // locks a tree item.
        // @param element
        lockItem: function (element) {
            if (element == null)
                return false;

            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (item.element == element) {
                    item.locked = true;
                    return false;
                }
            });
        },

        // unlocks a tree item.
        // @param element
        unlockItem: function (element) {
            if (element == null)
                return false;

            var me = this;
            $.each(me.items, function () {
                var item = this;
                if (item.element == element) {
                    item.locked = false;
                    return false;
                }
            });
        },

        // gets all tree items.
        getItems: function () {
            return this.items;
        },

        // gets item's instance.
        getItem: function (element) {
            if (element == null || element == undefined)
                return null;

            if (this.itemMapping["id" + element.id]) {
                var item = this.itemMapping["id" + element.id].item;
                return item;
            }

            return null;
        },

        // gets whether the element is expanded.
        isExpanded: function (element) {
            if (element == null || element == undefined)
                return false;

            var item = this.itemMapping["id" + element.id].item;
            if (item != null) {
                return item.isExpanded;
            }

            return false;
        },

        // gets whether the element is selected.
        isSelected: function (element) {
            if (element == null || element == undefined)
                return false;

            var item = this.itemMapping["id" + element.id].item;
            if (item != null) {
                return item == this.selectedItem;
            }

            return false;
        },

        getPrevItem: function (element) {
            var item = this.getItem(element);
            if (element.treeInstance != undefined) item = element;
            var prevItem = this._prevVisibleItem(item);
            return prevItem;
        },

        getNextItem: function (element) {
            var item = this.getItem(element);
            if (element.treeInstance != undefined) item = element;

            var nextItem = this._nextVisibleItem(item);
            return nextItem;
        },

        getSelectedItem: function (element) {
            return this.selectedItem;
        },

        val: function (value) {
            if (arguments.length == 0 || typeof (value) == "object") {
                return this.selectedItem;
            }
            if (typeof value == "string") {
                var element = this.host.find("#" + value);
                if (element.length > 0) {
                    var item = this.getItem(element[0]);
                    this.selectItem(item);
                }
            }
            else {
                var item = this.getItem(value);
                this.selectItem(item);
            }
        },

        getActiveDescendant: function () {
            if (this.selectedItem) {
                return this.selectedItem.element.id;
            }
            return "";
        },

        clearSelection: function () {
            this.selectItem(null);
        },

        // selects an item.
        // @param element
        selectItem: function (element, type) {
            if (this.disabled)
                return;

            var me = this;

            if (element && element.treeInstance != undefined) element = element.element;

            if (element == null || element == undefined) {
                if (me.selectedItem != null) {
                    $(me.selectedItem.titleElement).removeClass(me.toThemeProperty('jqx-fill-state-pressed'));
                    $(me.selectedItem.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-selected'));
                    me.selectedItem = null;
                }
                return;
            }

            if (this.selectedItem != null && this.selectedItem.element == element)
                return;

            var oldSelectedElement = this.selectedItem != null ? this.selectedItem.element : null;
            if (oldSelectedElement) {
                $(oldSelectedElement).removeAttr('aria-selected');
            }

            $.each(me.items, function () {
                var item = this;
                this.selected = false;
                if (!item.disabled) {
                    if (item.element == element) {
                        if (me.selectedItem == null || (me.selectedItem != null && me.selectedItem.titleElement != item.titleElement)) {
                            if (me.selectedItem != null) {
                                $(me.selectedItem.titleElement).removeClass(me.toThemeProperty('jqx-fill-state-pressed'));
                                $(me.selectedItem.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-selected'));
                            }

                            $(item.titleElement).addClass(me.toThemeProperty('jqx-fill-state-pressed'));
                            $(item.titleElement).addClass(me.toThemeProperty('jqx-tree-item-selected'));
                            me.selectedItem = item;
                            this.selected = true;
                            $(item.element).attr('aria-selected', 'true');
                            $.jqx.aria(me, "aria-activedescendant", item.element.id);
                        }
                    }
                }
            });
            this._updateInputSelection();
            if (!type) type = null;
            this._raiseEvent('2', { element: element, prevElement: oldSelectedElement, type: type });
        },

        // collapses all items.
        collapseAll: function () {
            this.isUpdating = true;
            var me = this;
            var items = me.items;
            var tmp = this.animationHideDuration;
            this.animationHideDuration = 0;
            $.each(items, function () {
                var item = this;
                if (item.isExpanded == true) {
                    me._collapseItem(me, item);
                }
            });
            setTimeout(function () {
                me.isUpdating = false;
                me._calculateWidth();
            }, this.animationHideDuration);
            this.animationHideDuration = tmp;
        },

        // expands all items.
        expandAll: function () {
            var me = this;
            this.isUpdating = true;
            var tmp = this.animationShowDuration;
            this.animationShowDuration = 0;
            $.each(this.items, function () {
                var item = this;
                if (item.hasItems) {
                    me._expandItem(me, item);
                }
            });

            setTimeout(function () {
                me.isUpdating = false;
                me._calculateWidth();
            }, this.animationShowDuration);
            this.animationShowDuration = tmp;
        },

        //  @param element
        //  expands a tree item by its html element.
        collapseItem: function (element) {
            if (element == null)
                return false;

            if (element.treeInstance != undefined) element = element.element;

            var me = this;
            $.each(this.items, function () {
                var item = this;
                if (item.isExpanded == true && item.element == element) {
                    me._collapseItem(me, item);
                    return false;
                }
            });

            return true;
        },

        // @param element
        // expands a tree item by its html element.
        expandItem: function (element) {
            if (element == null)
                return false;

            if (element.treeInstance != undefined) element = element.element;

            var me = this;
            $.each(me.items, function () {
                var item = this;

                if (item.isExpanded == false && item.element == element && !item.disabled && !item.locked) {
                    me._expandItem(me, item);
                    if (item.parentElement) {
                        me.expandItem(item.parentElement);
                    }
                }
            });

            return true;
        },

        _getClosedSubtreeOffset: function (item) {
            var $subtree = $(item.subtreeElement);
            var top = -$subtree.outerHeight();
            var left = -$subtree.outerWidth();
            left = 0;
            return { left: left, top: top };
        },

        _collapseItem: function (me, item, subs, force) {
            if (me == null || item == null)
                return false;

            if (item.disabled)
                return false;

            if (me.disabled)
                return false;

            if (me.locked)
                return false;

            var $subtree = $(item.subtreeElement);

            var subtreeOffset = this._getClosedSubtreeOffset(item);
            var top = subtreeOffset.top;
            var left = subtreeOffset.left;

            $treeElement = $(item.element);
            var delay = me.animationHideDelay;
            delay = 0;

            if ($subtree.data('timer').show != null) {
                clearTimeout($subtree.data('timer').show);
                $subtree.data('timer').show = null;
            }

            var hideFunc = function () {
                item.isExpanded = false;

                if (me.checkboxes) {
                    var checkboxes = $subtree.find('.chkbox');
                    checkboxes.stop();
                    checkboxes.css('opacity', 1);
                    $subtree.find('.chkbox').animate({ opacity: 0 }, 50);
                }
                var $arrowSpan = $(item.arrow);
                me._arrowStyle($arrowSpan, "", item.isExpanded);

                $subtree.slideUp(me.animationHideDuration, function () {
                    item.isCollapsing = false;
                    me._calculateWidth();
                    var $arrowSpan = $(item.arrow);
                    me._arrowStyle($arrowSpan, "", item.isExpanded);
                    $subtree.hide();
                    me._raiseEvent('1', { element: item.element });
                })
            }

            if (delay > 0) {
                $subtree.data('timer').hide = setTimeout(function () {
                    hideFunc();
                }, delay);
            }
            else {
                hideFunc();
            }
        },

        _expandItem: function (me, item) {
            if (me == null || item == null)
                return false;

            if (item.isExpanded)
                return false;

            if (item.locked)
                return false;

            if (item.disabled)
                return false;

            if (me.disabled)
                return false;

            var $subtree = $(item.subtreeElement);
            // stop hiding process.
            if (($subtree.data('timer')) != null && $subtree.data('timer').hide != null) {
                clearTimeout($subtree.data('timer').hide);
            }

            var $treeElement = $(item.element);

            var top = 0;
            var left = 0;

            if (parseInt($subtree.css('top')) == top) {
                item.isExpanded = true;
                return;
            }

            var $arrowSpan = $(item.arrow);
            me._arrowStyle($arrowSpan, "", item.isExpanded);


            if (me.checkboxes) {
                var checkboxes = $subtree.find('.chkbox');
                checkboxes.stop();
                checkboxes.css('opacity', 0);
                checkboxes.animate({ opacity: 1 }, me.animationShowDuration);
            }

            $subtree.slideDown(me.animationShowDuration, me.easing,
                        function () {
                            var $arrowSpan = $(item.arrow);
                            item.isExpanded = true;
                            me._arrowStyle($arrowSpan, "", item.isExpanded);
                            item.isExpanding = false;
                            me._raiseEvent('0', { element: item.element });
                            me._calculateWidth();
                        }) //animate subtree into view         
            //     }, 0);

            if (me.checkboxes) {
                me._updateCheckItemLayout(item);
                if (item.subtreeElement) {
                    var listTags = $(item.subtreeElement).find('li');
                    $.each(listTags, function () {
                        var subItem = me.getItem(this);
                        if (subItem != null) {
                            me._updateCheckItemLayout(subItem);
                        }
                    });
                }
            }
        },

        _calculateWidth: function () {
            var me = this;
            var checkboxOffset = this.checkboxes ? 20 : 0;
            var maxWidth = 0;

            if (this.isUpdating)
                return;

            $.each(this.items, function () {
                var height = $(this.element).height();
                if (height != 0) {
                    var titleWidth = $(this.titleElement).outerWidth() + 10 + checkboxOffset + (1 + this.level) * 20;
                    maxWidth = Math.max(maxWidth, titleWidth);
                    if (this.hasItems) {
                        var paddingOffset = parseInt($(this.titleElement).css('padding-top'));
                        if (isNaN(paddingOffset)) {
                            paddingOffset = 0;
                        }

                        paddingOffset = paddingOffset * 2;
                        paddingOffset += 2;

                        var offset = (paddingOffset + $(this.titleElement).height()) / 2 - 17 / 2;
                        if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                            $(this.arrow).css('margin-top', '3px');
                        }
                        else {
                            if (parseInt(offset) >= 0) {
                                $(this.arrow).css('margin-top', parseInt(offset) + 'px');
                            }
                        }
                    }
                }
            });

            if (this.toggleIndicatorSize > 16) {
                maxWidth = maxWidth + this.toggleIndicatorSize - 16;
            }

            if (me.panel) {
                if (maxWidth > this.host.width()) {
                    var scrollWidth = maxWidth - this.host.width();
                    var vScrollOffset = me.panel.jqxPanel('vScrollBar').css('visibility') !== "hidden" ? 10 : 0;
                    scrollWidth += vScrollOffset;
                    me.panel.jqxPanel({ horizontalScrollBarMax: scrollWidth });
                }
                else {
                    me.panel.jqxPanel({ horizontalScrollBarMax: 0 });
                }
            }

            this.host.find('ul:first').width(maxWidth);
            var minWidth = this.host.width() - 30;
            if (minWidth > 0) {
                this.host.find('ul:first').css('min-width', minWidth);
            }
            if (me.panel) {
                me.panel.jqxPanel('_arrange');
            }
        },

        _arrowStyle: function ($arrowSpan, uiState, expanded) {
            var me = this;
            if ($arrowSpan.length > 0) {
                $arrowSpan.removeClass();
                var state = "";
                if (uiState == 'hover') state = "-" + uiState;
                var expandState = expanded ? "-expand" : "-collapse";
                var className = 'jqx-tree-item-arrow' + expandState + state;
                $arrowSpan.addClass(me.toThemeProperty(className));
                if (!this.rtl) {
                    var expandState = !expanded ? "-right" : "-down";

                    $arrowSpan.addClass(me.toThemeProperty('jqx-icon-arrow' + expandState + ''));
                }

                if (this.rtl) {
                    $arrowSpan.addClass(me.toThemeProperty(className + '-rtl'));
                    var expandState = !expanded ? "-left" : "-down";

                    $arrowSpan.addClass(me.toThemeProperty('jqx-icon-arrow' + expandState + ''));
                }
            }
        },

        _initialize: function (mode, oldmode) {
            var me = this;
            var maxHeight = 0;
            this.host.addClass(me.toThemeProperty('jqx-widget'));
            this.host.addClass(me.toThemeProperty('jqx-widget-content'));
            this.host.addClass(me.toThemeProperty('jqx-tree'));
            this._updateDisabledState();

            var ie7 = $.jqx.browser.msie && $.jqx.browser.version < 8;
            $.each(this.items, function () {
                var item = this;
                $element = $(item.element);
                var $arrowSpan = null;

                if (me.checkboxes && !item.hasItems && item.checkBoxElement) {
                    $(item.checkBoxElement).css('margin-left', '0px');
                }

                if (!ie7) {
                    if (!item.hasItems) {
                        if (!me.rtl) {
                            item.element.style.marginLeft = parseInt(me.toggleIndicatorSize) + 'px';
                        }
                        else {
                            item.element.style.marginRight = parseInt(me.toggleIndicatorSize) + 'px';
                        }
                        var oldArrow = $(item.arrow);
                        if (oldArrow.length > 0) {
                            oldArrow.remove();
                            item.arrow = null;
                        }
                        return true;
                    }
                    else {
                        if (!me.rtl) {
                            item.element.style.marginLeft = '0px';
                        }
                        else {
                            item.element.style.marginRight = '0px';
                        }
                    }
                }
                else {
                    if (!item.hasItems && $(item.element).find('ul').length > 0) {
                        $(item.element).find('ul').remove();
                    }
                }

                var oldArrow = $(item.arrow);
                if (oldArrow.length > 0) {
                    oldArrow.remove();
                }

                $arrowSpan = $('<span style="height: 17px; border: none; background-color: transparent;" id="arrow' + $element[0].id + '"></span>');
                $arrowSpan.prependTo($element);
                if (!me.rtl) {
                    $arrowSpan.css('float', 'left');
                }
                else {
                    $arrowSpan.css('float', 'right');
                }
                $arrowSpan.css('clear', 'both');

                $arrowSpan.width(me.toggleIndicatorSize);
                me._arrowStyle($arrowSpan, "", item.isExpanded);

                var paddingOffset = parseInt($(this.titleElement).css('padding-top'));
                if (isNaN(paddingOffset)) {
                    paddingOffset = 0;
                }

                paddingOffset = paddingOffset * 2;
                paddingOffset += 2;

                var offset = (paddingOffset + $(this.titleElement).height()) / 2 - 17 / 2;
                if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                    $arrowSpan.css('margin-top', '3px');
                }
                else {
                    if (parseInt(offset) >= 0) {
                        $arrowSpan.css('margin-top', parseInt(offset) + 'px');
                    }
                }
                $element.addClass(me.toThemeProperty('jqx-disableselect'));
                $arrowSpan.addClass(me.toThemeProperty('jqx-disableselect'));

                var eventName = 'click';
                var isTouchDevice = me.isTouchDevice();
                if (isTouchDevice) {
                    eventName = $.jqx.mobile.getTouchEventName('touchend');
                }
                me.addHandler($arrowSpan, eventName, function () {
                    if (!item.isExpanded) {
                        me._expandItem(me, item);
                    }
                    else {
                        me._collapseItem(me, item);
                    }

                    return false;
                });

                me.addHandler($arrowSpan, 'selectstart', function () {
                    return false;
                });

                me.addHandler($arrowSpan, 'mouseup', function () {
                    if (!isTouchDevice) {
                        return false;
                    }
                });

                item.hasItems = $(item.element).find('li').length > 0;

                item.arrow = $arrowSpan[0];
                if (!item.hasItems) {
                    $arrowSpan.css('visibility', 'hidden');
                }

                $element.css('float', 'none');
            });
        },

        _getOffset: function (object) {
            var scrollTop = $(window).scrollTop();
            var scrollLeft = $(window).scrollLeft();
            var isSafari = $.jqx.mobile.isSafariMobileBrowser();
            var offset = $(object).offset();
            var top = offset.top;
            var left = offset.left;
            if (isSafari != null && isSafari) {
                return { left: left - scrollLeft, top: top - scrollTop };
            }
            else return $(object).offset();
        },

        _renderHover: function ($treeElement, item, isTouchDevice) {
            var me = this;
            if (!isTouchDevice) {
                var $titleElement = $(item.titleElement);
                me.addHandler($titleElement, 'mouseenter', function () {
                    if (!item.disabled && me.enableHover && !me.disabled) {
                        $titleElement.addClass(me.toThemeProperty('jqx-fill-state-hover'));
                        $titleElement.addClass(me.toThemeProperty('jqx-tree-item-hover'));
                    }
                });
                me.addHandler($titleElement, 'mouseleave', function () {
                    if (!item.disabled && me.enableHover && !me.disabled) {
                        $titleElement.removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                        $titleElement.removeClass(me.toThemeProperty('jqx-tree-item-hover'));
                    }
                });
            }
        },

        _updateDisabledState: function () {
            if (this.disabled) {
                this.host.addClass(this.toThemeProperty('jqx-fill-state-disabled'));
            }
            else {
                this.host.removeClass(this.toThemeProperty('jqx-fill-state-disabled'));
            }
        },

        _addInput: function () {
            if (this.input == null) {
                var name = this.host.attr('name');
                if (name) {
                    this.host.attr('name', "");
                }
                this.input = $("<input type='hidden'/>");
                this.host.append(this.input);
                this.input.attr('name', name);
                this._updateInputSelection();
            }
        },

        render: function () {
            this._updateItemsNavigation();
            this._render();
        },

        _render: function (updateEvents, updateDrag) {
            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                var me = this;
                $.each(this.items, function () {
                    var $element = $(this.element);
                    var $parent = $element.parent();
                    var totalWidth = parseInt(this.titleElement.css('margin-left')) + this.titleElement[0].scrollWidth + 13;

                    $element.css('min-width', totalWidth);

                    var parentWidth = parseInt($parent.css('min-width'));
                    if (isNaN(parentWidth)) parentWidth = 0;
                    var elementMinWidth = $element.css('min-width');

                    if (parentWidth < parseInt($element.css('min-width'))) {
                        $parent.css('min-width', elementMinWidth);
                    }
                    this.titleElement[0].style.width = null;
                });
            }

            var zIndex = 1000;
            var popupElementoffset = [5, 5];
            var me = this;
            $.data(me.element, 'animationHideDelay', me.animationHideDelay);
            $.data(document.body, 'treeel', this);
            this._initialize();

            var isTouchDevice = this.isTouchDevice();
            if (isTouchDevice && this.toggleMode == 'dblclick') {
                this.toggleMode = 'click';
            }

            if (updateEvents == undefined || updateEvents == true) {
                $.each(this.items, function () {
                    me._updateItemEvents(me, this);
                });
            }
            if (this.allowDrag && this._enableDragDrop && (updateDrag == undefined || updateDrag == true)) {
                this._enableDragDrop();
            }
            this._addInput();
            // add panel.
            if (this.host.jqxPanel) {
                if (this.host.find('#panel' + this.element.id).length > 0) {
                    this.panel.jqxPanel({ touchMode: this.touchMode });
                    this.panel.jqxPanel('refresh');
                    return;
                }

                this.host.find('ul:first').wrap('<div style="background-color: transparent; overflow: hidden; width: 100%; height: 100%;" id="panel' + this.element.id + '"></div>');
                var panel = this.host.find('div:first');
                var sizeMode = 'fixed';

                if (this.height == null || this.height == 'auto') {
                    sizeMode = 'verticalwrap';
                }
                if (this.width == null || this.width == 'auto') {
                    if (sizeMode == 'fixed') {
                        sizeMode = 'horizontalwrap';
                    }
                    else sizeMode = 'wrap';
                }

                panel.jqxPanel({ rtl: this.rtl, theme: this.theme, width: '100%', height: '100%', touchMode: this.touchMode, sizeMode: sizeMode });
                if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                    panel.jqxPanel('content').css('left', '0px');
                }
                panel.data({ nestedWidget: true });
                if (this.height == null || (this.height != null && this.height.toString().indexOf('%') != -1)) {
                    if (this.isTouchDevice()) {
                        this.removeHandler(panel, $.jqx.mobile.getTouchEventName('touchend') + '.touchScroll touchcancel.touchScroll');
                        this.removeHandler(panel, $.jqx.mobile.getTouchEventName('touchmove') + '.touchScroll');
                        this.removeHandler(panel, $.jqx.mobile.getTouchEventName('touchstart') + '.touchScroll');
                    }
                }

                var panelInstance = $.data(panel[0], 'jqxPanel').instance;
                if (panelInstance != null) {
                    this.vScrollInstance = panelInstance.vScrollInstance;
                    this.hScrollInstance = panelInstance.hScrollInstance;
                }
                this.panelInstance = panelInstance;
                if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                    this.host.attr('hideFocus', true);
                    this.host.find('div').attr('hideFocus', true);
                    this.host.find('ul').attr('hideFocus', true);
                }

                panel[0].className = '';
                this.panel = panel;
            }
            this._raiseEvent('3', this);
        },

        focus: function () {
            try {
                this.host.focus();

            }
            catch (error) {
            }
        },

        _updateItemEvents: function (me, item) {
            var isTouchDevice = this.isTouchDevice();
            if (isTouchDevice) {
                this.toggleMode = $.jqx.mobile.getTouchEventName('touchend');
            }

            var $treeElement = $(item.element);

            if (me.enableRoundedCorners) {
                $treeElement.addClass(me.toThemeProperty('jqx-rc-all'));
            }

            var checkEventName = !isTouchDevice ? 'mousedown' : $.jqx.mobile.getTouchEventName('touchend');
            if (me.touchMode === true) {
                me.removeHandler($(item.checkBoxElement), 'mousedown');
            }
            me.removeHandler($(item.checkBoxElement), checkEventName);
            me.addHandler($(item.checkBoxElement), checkEventName, function (event) {
                if (!me.disabled) {
                    if (!this.treeItem.disabled) {
                        this.treeItem.checked = !this.treeItem.checked;
                        me.checkItem(this.treeItem.element, this.treeItem.checked, 'tree');
                        if (me.hasThreeStates) {
                            me.checkItems(this.treeItem, this.treeItem);
                        }
                    }
                }
                return false;
            });

            var $titleElement = $(item.titleElement);

            me.removeHandler($treeElement);

            var drag = this.allowDrag && this._enableDragDrop;
            if (!drag) {
                me.removeHandler($titleElement);
            }
            else {
                me.removeHandler($titleElement, 'mousedown.item');
                me.removeHandler($titleElement, 'click');
                me.removeHandler($titleElement, 'dblclick');
                me.removeHandler($titleElement, 'mouseenter');
                me.removeHandler($titleElement, 'mouseleave');
            }

            me._renderHover($treeElement, item, isTouchDevice);
            var $subtree = $(item.subtreeElement);
            if ($subtree.length > 0) {
                var display = item.isExpanded ? 'block' : 'none';
                $subtree.css({ overflow: 'hidden', display: display })
                $subtree.data('timer', {});
            }

            me.addHandler($titleElement, 'selectstart', function (event) {
                return false;
            });

            if ($.jqx.browser.opera) {
                me.addHandler($titleElement, 'mousedown.item', function (event) {
                    return false;
                });
            }

            if (me.toggleMode != 'click') {
                me.addHandler($titleElement, 'click', function (event) {
                    me.selectItem(item.element, "mouse");

                    if (me.panel != null) {
                        me.panel.jqxPanel({ focused: true });
                    }
                    $titleElement.focus();
                    me._raiseEvent('9', { element: item.element });
                });
            }

            me.addHandler($titleElement, me.toggleMode, function (event) {
                if ($subtree.length > 0) {
                    clearTimeout($subtree.data('timer').hide)
                }

                if (me.panel != null) {
                    me.panel.jqxPanel({ focused: true });
                }

                me.selectItem(item.element, "mouse");
                if (item.isExpanding == undefined)
                    item.isExpanding = false;
                if (item.isCollapsing == undefined)
                    item.isCollapsing = false;

                if ($subtree.length > 0) {
                    if (!item.isExpanded) {
                        if (false == item.isExpanding) {
                            item.isExpanding = true;
                            me._expandItem(me, item);
                        }
                    }
                    else {
                        if (false == item.isCollapsing) {
                            item.isCollapsing = true;
                            me._collapseItem(me, item, true);
                        }
                    }
                    return false;
                }
            });
        },

        isTouchDevice: function () {
            if (this._isTouchDevice != undefined) return this._isTouchDevice;
            var isTouchDevice = $.jqx.mobile.isTouchDevice();
            if (this.touchMode == true) {
                isTouchDevice = true;
            }
            else if (this.touchMode == false) {
                isTouchDevice = false;
            }
            this._isTouchDevice = isTouchDevice;
            return isTouchDevice;
        },

        createID: function () {
            return $.jqx.utilities.createId();
        },

        // creates the tree.
        createTree: function (uiObject) {
            if (uiObject == null)
                return;

            var self = this;
            var liTags = $(uiObject).find('li');
            var k = 0;

            this.items = new Array();

            this.itemMapping = new Array();
            $(uiObject).addClass(self.toThemeProperty('jqx-tree-dropdown-root'));
            if (this.rtl) {
                $(uiObject).addClass(self.toThemeProperty('jqx-tree-dropdown-root-rtl'));
            }

            if (this.rtl || $.jqx.browser.msie && $.jqx.browser.version < 8) {
                this._measureItem = $("<span style='position: relative; visibility: hidden;'></span>");
                this._measureItem.addClass(this.toThemeProperty('jqx-widget'));
                this._measureItem.addClass(this.toThemeProperty('jqx-fill-state-normal'));
                this._measureItem.addClass(this.toThemeProperty('jqx-tree-item'));
                this._measureItem.addClass(this.toThemeProperty('jqx-item'));
                $(document.body).append(this._measureItem);
            }
            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                //             $(uiObject).css('position', 'relative');
                //            $(uiObject).css('left', '-40px');
            }

            for (var index = 0; index < liTags.length; index++) {
                this._createItem(liTags[index]);
            }

            if (this.rtl || $.jqx.browser.msie && $.jqx.browser.version < 8) {
                this._measureItem.remove();
            }

            this._updateItemsNavigation();
            this._updateCheckStates();
        },

        _updateCheckLayout: function (level) {
            var me = this;
            if (!this.checkboxes) return;

            $.each(this.items, function () {
                if (this.level == level || level == undefined) {
                    me._updateCheckItemLayout(this);
                }
            });
        },

        _updateCheckItemLayout: function (item) {
            if (this.checkboxes) {
                if ($(item.titleElement).css('display') != 'none') {
                    var checkbox = $(item.checkBoxElement);
                    var offset = $(item.titleElement).outerHeight() / 2 - 1 - parseInt(this.checkSize) / 2;
                    checkbox.css('margin-top', offset);
                    if (!this.rtl) {
                        if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                            item.titleElement.css('margin-left', parseInt(this.checkSize) + 25);
                        }
                        else {
                            if (item.hasItems) {
                                checkbox.css('margin-left', this.toggleIndicatorSize);
                            }
                        }
                    }
                }
            }
        },

        _updateCheckStates: function () {
            var me = this;
            if (me.hasThreeStates) {
                $.each(this.items, function () {
                    me._updateCheckState(this);
                });
            }
            else {
                $.each(this.items, function () {
                    if (this.checked == null) {
                        me.checkItem(this.element, false, 'tree');
                    }
                });
            }
        },

        _updateCheckState: function (item) {
            if (item == null || item == undefined)
                return;
            var me = this;
            var count = 0;
            var hasIndeterminate = false;
            var itemsCount = 0;

            var childItems = $(item.element).find('li');
            itemsCount = childItems.length;

            if (item.checked && itemsCount > 0) {
                $.each(childItems, function (index) {
                    var child = me.itemMapping["id" + this.id].item;
                    var checked = child.element.getAttribute('item-checked');
                    if (checked == undefined || checked == null || checked == 'true' || checked == true) {
                        me.checkItem(child.element, true, 'tree');
                    }
                });
            }

            $.each(childItems, function (index) {
                var child = me.itemMapping["id" + this.id].item;
                if (child.checked != false) {
                    if (child.checked == null) {
                        hasIndeterminate = true;
                    }
                    count++;
                }
            });

            if (itemsCount > 0) {
                if (count == itemsCount) {
                    this.checkItem(item.element, true, 'tree');
                }
                else {
                    if (count > 0) {
                        this.checkItem(item.element, null, 'tree');
                    }
                    else this.checkItem(item.element, false, 'tree');
                }
            }
        },

        _updateItemsNavigation: function () {
            var innerElement = this.host.find('ul:first');
            var liTags = $(innerElement).find('li');
            var k = 0;
            for (var i = 0; i < liTags.length; i++) {
                var listTag = liTags[i];
                if (this.itemMapping["id" + listTag.id]) {
                    var treeItem = this.itemMapping["id" + listTag.id].item;
                    if (!treeItem)
                        continue;

                    treeItem.prevItem = null;
                    treeItem.nextItem = null;
                    if (i > 0) {
                        if (this.itemMapping["id" + liTags[i - 1].id]) {
                            treeItem.prevItem = this.itemMapping["id" + liTags[i - 1].id].item;
                        }
                    }

                    if (i < liTags.length - 1) {
                        if (this.itemMapping["id" + liTags[i + 1].id]) {
                            treeItem.nextItem = this.itemMapping["id" + liTags[i + 1].id].item;
                        }
                    }
                }
            }
        },

        _applyTheme: function (oldTheme, newTheme) {
            var me = this;
            this.host.removeClass('jqx-tree-' + oldTheme);
            this.host.removeClass('jqx-widget-' + oldTheme);
            this.host.removeClass('jqx-widget-content-' + oldTheme);
            this.host.addClass(me.toThemeProperty('jqx-tree'));
            this.host.addClass(me.toThemeProperty('jqx-widget'));
            var uiObject = this.host.find('ul:first');
            $(uiObject).removeClass(me.toThemeProperty('jqx-tree-dropdown-root-' + oldTheme));
            $(uiObject).addClass(me.toThemeProperty('jqx-tree-dropdown-root'));
            if (this.rtl) {
                $(uiObject).removeClass(me.toThemeProperty('jqx-tree-dropdown-root-rtl-' + oldTheme));
                $(uiObject).addClass(me.toThemeProperty('jqx-tree-dropdown-root-rtl'));
            }
            var liTags = $(uiObject).find('li');
            for (var index = 0; index < liTags.length; index++) {
                var listTag = liTags[index];
                $(listTag).children().each(function () {
                    if (this.tagName == 'ul' || this.tagName == 'UL') {
                        $(this).removeClass(me.toThemeProperty('jqx-tree-dropdown-' + oldTheme));
                        $(this).addClass(me.toThemeProperty('jqx-tree-dropdown'));
                        if (me.rtl) {
                            $(this).removeClass(me.toThemeProperty('jqx-tree-dropdown-rtl-' + oldTheme));
                            $(this).addClass(me.toThemeProperty('jqx-tree-dropdown-rtl'));
                        }
                        return false;
                    }
                });
            }

            $.each(this.items, function () {
                var item = this;
                var $treeElement = $(item.element);

                $treeElement.removeClass(me.toThemeProperty('jqx-tree-item-li-' + oldTheme));
                $treeElement.addClass(me.toThemeProperty('jqx-tree-item-li'));
                if (this.rtl) {
                    $treeElement.removeClass(me.toThemeProperty('jqx-tree-item-li-' + oldTheme));
                    $treeElement.addClass(me.toThemeProperty('jqx-tree-item-li'));
                }
                $(item.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-' + oldTheme));
                $(item.titleElement).addClass(me.toThemeProperty('jqx-tree-item'));

                $(item.titleElement).removeClass('jqx-item-' + oldTheme);
                $(item.titleElement).addClass(me.toThemeProperty('jqx-item'));

                var $arrowSpan = $(item.arrow);
                if ($arrowSpan.length > 0) {
                    me._arrowStyle($arrowSpan, "", item.isExpanded);
                }

                if (item.checkBoxElement) {
                    $(item.checkBoxElement).jqxCheckBox({ theme: newTheme });
                }
                if (me.enableRoundedCorners) {
                    $treeElement.removeClass('jqx-rc-all-' + oldTheme);
                    $treeElement.addClass(me.toThemeProperty('jqx-rc-all'));
                }
            });

            if (this.host.jqxPanel) {
                this.panel.jqxPanel({ theme: newTheme });
            }
        },

        _refreshMapping: function (updateEvents, tags) {
            var liTags = this.host.find('li');
            var itemMapping = new Array();

            var newItems = new Array();
            var storage = $.data(document.body, 'treeItemsStorage');
            var me = this;
            for (var index = 0; index < liTags.length; index++) {
                var listTag = liTags[index];
                var $listTag = $(listTag);
                var item = storage[listTag.id];
                if (item == null) {
                    continue;
                }
                newItems[newItems.length] = item;
                if (updateEvents == undefined || updateEvents == true) {
                    this._updateItemEvents(this, item);
                }
                item.level = $listTag.parents('li').length;
                item.treeInstance = this;
                var parentElement = null;
                var parentId = null;
                if (item.titleElement[0].className.indexOf('jqx-fill-state-pressed') != -1) {
                    $(item.titleElement).removeClass(me.toThemeProperty('jqx-fill-state-pressed'));
                    $(item.titleElement).removeClass(me.toThemeProperty('jqx-tree-item-selected'));
                }

                var children = $listTag.children();
                children.each(function () {
                    if (this.tagName == 'ul' || this.tagName == 'UL') {
                        item.subtreeElement = this;
                        $(this).addClass(me.toThemeProperty('jqx-tree-dropdown'));
                        if (me.rtl) {
                            $(this).addClass(me.toThemeProperty('jqx-tree-dropdown-rtl'));
                        }
                        return false;
                    }
                });

                var parents = $listTag.parents();
                parents.each(function () {
                    if ((this.tagName == 'li' || this.tagName == 'LI')) {
                        parentId = this.id;
                        parentElement = this;
                        return false;
                    }
                });

                item.parentElement = parentElement;
                item.parentId = parentId;
                item.hasItems = $(item.element).find('li').length > 0;

                if (item != null) {
                    itemMapping[index] = { element: listTag, item: item };
                    itemMapping["id" + listTag.id] = itemMapping[index];
                }
            }

            this.itemMapping = itemMapping;
            this.items = newItems;
        },

        _createItem: function (element) {
            if (element == null || element == undefined)
                return;

            var id = element.id;
            if (!id) {
                id = this.createID();
            }

            var listTag = element;
            var $listTag = $(element);

            listTag.id = id;

            var treeItemsStorage = $.data(document.body, 'treeItemsStorage');
            if (treeItemsStorage == undefined) {
                treeItemsStorage = new Array();
            }

            var k = this.items.length;
            this.items[k] = new $.jqx._jqxTree.jqxTreeItem();
            this.treeElements[id] = this.items[k];
            treeItemsStorage[listTag.id] = this.items[k];
            $.data(document.body, 'treeItemsStorage', treeItemsStorage)
            k = this.items.length;
            var parentId = 0;
            var me = this;
            var parentElement = null;

            $listTag.attr('role', 'treeitem');
            $listTag.children().each(function () {
                if (this.tagName == 'ul' || this.tagName == 'UL') {
                    me.items[k - 1].subtreeElement = this;
                    $(this).addClass(me.toThemeProperty('jqx-tree-dropdown'));
                    if (me.rtl) {
                        $(this).addClass(me.toThemeProperty('jqx-tree-dropdown-rtl'));
                        $(this).css('clear', 'both');
                    }
                    return false;
                }
            });

            $listTag.parents().each(function () {
                if ((this.tagName == 'li' || this.tagName == 'LI')) {
                    parentId = this.id;
                    parentElement = this;
                    return false;
                }
            });

            var expanded = element.getAttribute('item-expanded');
            if (expanded == null || expanded == undefined || (expanded != 'true' && expanded != true)) {
                expanded = false;
            }
            else expanded = true;
            listTag.removeAttribute('item-expanded');
            var locked = element.getAttribute('item-locked');
            if (locked == null || locked == undefined || (locked != 'true' && locked != true)) {
                locked = false;
            }
            else locked = true;
            listTag.removeAttribute('item-locked');

            var selected = element.getAttribute('item-selected');
            if (selected == null || selected == undefined || (selected != 'true' && selected != true)) {
                selected = false;
            }
            else selected = true;
            listTag.removeAttribute('item-selected');

            var disabled = element.getAttribute('item-disabled');
            if (disabled == null || disabled == undefined || (disabled != 'true' && disabled != true)) {
                disabled = false;
            }
            else disabled = true;
            listTag.removeAttribute('item-disabled');

            var checked = element.getAttribute('item-checked');
            if (checked == null || checked == undefined || (checked != 'true' && checked != true)) {
                checked = false;
            }
            else checked = true;

            var title = element.getAttribute('item-title');
            if (title == null || title == undefined || (title != 'true' && title != true)) {
                title = false;
            }
            listTag.removeAttribute('item-title');

            var icon = element.getAttribute('item-icon');
            var iconsize = element.getAttribute('item-iconsize');
            var label = element.getAttribute('item-label');
            var value = element.getAttribute('item-value');

            listTag.removeAttribute('item-icon');
            listTag.removeAttribute('item-iconsize');
            listTag.removeAttribute('item-label');
            listTag.removeAttribute('item-value');

            var treeItem = this.items[k - 1];
            treeItem.id = id;
            if (treeItem.value == undefined) {
                if (this._valueList && this._valueList[id]) {
                    treeItem.value = this._valueList[id];
                }
                else {
                    treeItem.value = value;
                }
            }
            treeItem.icon = icon;
            treeItem.iconsize = iconsize;
            treeItem.parentId = parentId;
            treeItem.disabled = disabled;
            treeItem.parentElement = parentElement;
            treeItem.element = element;
            treeItem.locked = locked;
            treeItem.selected = selected;
            treeItem.checked = checked;
            treeItem.isExpanded = expanded;
            treeItem.treeInstance = this;

            this.itemMapping[k - 1] = { element: listTag, item: treeItem };
            this.itemMapping["id" + listTag.id] = this.itemMapping[k - 1];
            var hasTitleAttribute = false;
            var isSameLI = false;
            hasTitleAttribute = false;
            if (this.rtl) {
                $(treeItem.element).css('float', 'right');
                $(treeItem.element).css('clear', 'both');
            }

            if (!hasTitleAttribute || !isSameLI) {
                if ($(listTag.firstChild).length > 0) {
                    if (treeItem.icon) {
                        var iconsize = treeItem.iconsize;
                        if (!iconsize) iconsize = 16;

                        var icon = $('<img width="' + iconsize + '" height="' + iconsize + '" style="float: left;" class="itemicon" src="' + treeItem.icon + '"/>');
                        $(listTag).prepend(icon);
                        icon.css('margin-right', '4px');
                        if (this.rtl) {
                            icon.css('margin-right', '0px');
                            icon.css('margin-left', '4px');
                            icon.css('float', 'right');
                        }
                    }

                    var ulindex = listTag.innerHTML.indexOf('<ul');
                    if (ulindex == -1) {
                        ulindex = listTag.innerHTML.indexOf('<UL');
                    }

                    if (ulindex == -1) {
                        treeItem.originalTitle = listTag.innerHTML;
                        listTag.innerHTML = '<div style="display: inline-block;">' + listTag.innerHTML + '</div>';
                        treeItem.titleElement = $($(listTag)[0].firstChild);
                    }
                    else {
                        var listhtml = listTag.innerHTML.substring(0, ulindex);
                        listhtml = $.trim(listhtml);
                        treeItem.originalTitle = listhtml;
                        listhtml = $('<div style="display: inline-block;">' + listhtml + '</div>');

                        var ul = $(listTag).find('ul:first');
                        ul.remove();
                        listTag.innerHTML = "";
                        $(listTag).prepend(listhtml);
                        $(listTag).append(ul);

                        treeItem.titleElement = listhtml;
                        if (this.rtl) {
                            listhtml.css('float', 'right');
                            ul.css('padding-right', '10px');
                        }
                    }

                    if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                        $($(listTag)[0].firstChild).css('display', 'inline-block');
                        var removeMeasureItem = false;
                        if (this._measureItem.parents().length == 0) {
                            $(document.body).append(this._measureItem);
                            removeMeasureItem = true;
                        }
                        this._measureItem.css('min-width', '20px');
                        this._measureItem[0].innerHTML = ($(treeItem.titleElement).text());
                        var width = this._measureItem.width();
                        if (treeItem.icon) {
                            width += 20;
                        }
                        if ($($(item.titleElement).find('img')).length > 0) {
                            width += 20;
                        }
                        $($(listTag)[0].firstChild).css('max-width', width + 'px');
                        if (removeMeasureItem) {
                            this._measureItem.remove();
                        }
                    }
                }
                else {
                    treeItem.originalTitle = "Item";
                    $(listTag).append($('<span>Item</span>'));
                    $(listTag.firstChild).wrap('<span/>');
                    treeItem.titleElement = $(listTag)[0].firstChild;
                    if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                        $(listTag.firstChild).css('display', 'inline-block');
                    }
                }
            }

            var $itemTitle = $(treeItem.titleElement);
            var itemTitleClassName = this.toThemeProperty('jqx-rc-all');

            if (this.allowDrag) {
                $itemTitle.addClass('draggable');
            }
            if (label == null || label == undefined) {
                label = treeItem.titleElement;
                treeItem.label = $.trim($itemTitle.text());
            }
            else treeItem.label = label;

            $(listTag).addClass(this.toThemeProperty('jqx-tree-item-li'));
            if (this.rtl) {
                $(listTag).addClass(this.toThemeProperty('jqx-tree-item-li-rtl'));
            }
            itemTitleClassName += " " + this.toThemeProperty('jqx-tree-item') + " " + this.toThemeProperty('jqx-item');
            if (this.rtl) {
                itemTitleClassName += " " + this.toThemeProperty('jqx-tree-item-rtl')
            }

            $itemTitle[0].className = $itemTitle[0].className + " " + itemTitleClassName;

            treeItem.level = $(element).parents('li').length;

            treeItem.hasItems = $(element).find('li').length > 0;
            if (this.rtl && treeItem.parentElement) {
                if (!this.checkboxes) {
                //    $itemTitle.css('margin-right', '5px');
                }
            }

            if (this.checkboxes) {
                if (this.host.jqxCheckBox) {
                    var checkbox = $('<div style="overflow: visible; position: absolute; width: 18px; height: 18px;" tabIndex=0 class="chkbox"/>');
                    checkbox.width(parseInt(this.checkSize));
                    checkbox.height(parseInt(this.checkSize));
                    $(listTag).prepend(checkbox);

                    if (this.rtl) {
                        checkbox.css('float', 'right');
                        checkbox.css('position', 'static');
                    }

                    checkbox.jqxCheckBox({ hasInput: false, checked: treeItem.checked, boxSize: this.checkSize, animationShowDelay: 0, animationHideDelay: 0, disabled: disabled, theme: this.theme });
                    if (!this.rtl) {
                        $itemTitle.css('margin-left', parseInt(this.checkSize) + 6);
                    }
                    else {
                        var minMargin = 5;
                        // if (treeItem.hasItems)
                        //   minMargin = this.toggleIndicatorSize;
                        if (treeItem.parentElement) {
                            checkbox.css('margin-right', minMargin + 5 + 'px');
                        }
                        else {
                            checkbox.css('margin-right', minMargin + 'px');
                        }
                    }

                    treeItem.checkBoxElement = checkbox[0];
                    checkbox[0].treeItem = treeItem;
                    var offset = $itemTitle.outerHeight() / 2 - 1 - parseInt(this.checkSize) / 2;
                    checkbox.css('margin-top', offset);
                    if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                        $itemTitle.css('width', '1%');
                        $itemTitle.css('margin-left', parseInt(this.checkSize) + 25);
                    }
                    else {
                        if (treeItem.hasItems) {
                            if (!this.rtl) {
                                checkbox.css('margin-left', this.toggleIndicatorSize);
                            }
                        }
                    }
                }
                else {
                    throw new Error('jqxTree: Missing reference to jqxcheckbox.js.');
                    return;
                }
            }
            else {
                if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                    $itemTitle.css('width', '1%');
                }
            }

            if (disabled) {
                this.disableItem(treeItem.element);
            }

            if (selected) {
                this.selectItem(treeItem.element);
            }

            if ($.jqx.browser.msie && $.jqx.browser.version < 8) {
                $(listTag).css('margin', '0px');
                $(listTag).css('padding', '0px');
            }
        },

        destroy: function () {
            this.removeHandler($(window), 'resize.jqxtree' + this.element.id);
            this.host.removeClass();
            if (this.isTouchDevice()) {
                this.removeHandler(this.panel, $.jqx.mobile.getTouchEventName('touchend') + '.touchScroll touchcancel.touchScroll');
                this.removeHandler(this.panel, $.jqx.mobile.getTouchEventName('touchmove') + '.touchScroll');
                this.removeHandler(this.panel, $.jqx.mobile.getTouchEventName('touchstart') + '.touchScroll');
            }
            var me = this;
            var isTouchDevice = this.isTouchDevice();
            $.each(this.items, function () {
                var item = this;
                var $treeElement = $(this.element);
                var checkEventName = !isTouchDevice ? 'click' : $.jqx.mobile.getTouchEventName('touchend');
                me.removeHandler($(item.checkBoxElement), checkEventName);
                var $titleElement = $(item.titleElement);
                me.removeHandler($treeElement);
                var drag = me.allowDrag && me._enableDragDrop;
                if (!drag) {
                    me.removeHandler($titleElement);
                }
                else {
                    me.removeHandler($titleElement, 'mousedown.item');
                    me.removeHandler($titleElement, 'click');
                    me.removeHandler($titleElement, 'dblclick');
                    me.removeHandler($titleElement, 'mouseenter');
                    me.removeHandler($titleElement, 'mouseleave');
                }
                $arrowSpan = $(item.arrow);
                if ($arrowSpan.length > 0) {
                    me.removeHandler($arrowSpan, checkEventName);
                    me.removeHandler($arrowSpan, 'selectstart');
                    me.removeHandler($arrowSpan, 'mouseup');

                    if (!isTouchDevice) {
                        me.removeHandler($arrowSpan, 'mouseenter');
                        me.removeHandler($arrowSpan, 'mouseleave');
                    }

                    me.removeHandler($titleElement, 'selectstart');
                }
                if ($.jqx.browser.opera) {
                    me.removeHandler($titleElement, 'mousedown.item');
                }

                if (me.toggleMode != 'click') {
                    me.removeHandler($titleElement, 'click');
                }

                me.removeHandler($titleElement, me.toggleMode);
            });
            if (this.panel) {
                this.panel.jqxPanel('destroy');
                this.panel = null;
            }
            this.host.remove();
        },

        _raiseEvent: function (id, arg) {
            if (arg == undefined)
                arg = { owner: null };

            var evt = this.events[id];
            args = arg;
            args.owner = this;

            var event = new $.Event(evt);
            event.owner = this;
            event.args = args;

            var result = this.host.trigger(event);
            return result;
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (this.isInitialized == undefined || this.isInitialized == false)
                return;

            if (key == 'submitCheckedItems') {
                object._updateInputSelection();
            }

            if (key == 'disabled') {
                object._updateDisabledState();
            }

            if (key == 'theme') {
                object._applyTheme(oldvalue, value);
            }

            if (key == "keyboardNavigation") {
                object.enableKeyboardNavigation = value;
            }

            if (key == 'width' || key == 'height') {
                object.refresh();
                object._initialize();
                object._calculateWidth();

                if (object.host.jqxPanel) {
                    var sizeMode = 'fixed';
                    if (this.height == null || this.height == 'auto') {
                        sizeMode = 'verticalwrap';
                    }
                    if (this.width == null || this.width == 'auto') {
                        if (sizeMode == 'fixed') {
                            sizeMode = 'horizontalwrap';
                        }
                        else sizeMode = 'wrap';
                    }

                    object.panel.jqxPanel({ sizeMode: sizeMode });
                }
            }

            if (key == 'touchMode') {
                object._isTouchDevice = null;
                if (value) {
                    object.enableHover = false;
                }
                object._render();
            }

            if (key == 'source' || key == 'checkboxes') {
                if (this.source != null) {
                    var expandedItems = [];
                    $.each(object.items, function () {
                        if (this.isExpanded) {
                            expandedItems[expandedItems.length] = { label: this.label, level: this.level };
                        }
                    });

                    var html = object.loadItems(object.source);
                    if (!object.host.jqxPanel) {
                        object.element.innerHTML = html;
                    }
                    else {
                        object.panel.jqxPanel('setcontent', html);
                    }

                    var disabled = object.disabled;
                    var innerElement = object.host.find('ul:first');
                    if (innerElement.length > 0) {
                        object.createTree(innerElement[0]);
                        object._render();
                    }

                    var me = object;
                    var duration = me.animationShowDuration;
                    me.animationShowDuration = 0;
                    object.disabled = false;
                    if (expandedItems.length > 0) {
                        $.each(object.items, function () {
                            for (var m = 0; m < expandedItems.length; m++) {
                                if (expandedItems[m].label == this.label && expandedItems[m].level == this.level) {
                                    var item = me.getItem(this.element);
                                    me._expandItem(me, item);
                                }
                            }
                        });
                    }
                    object.disabled = disabled;
                    me.animationShowDuration = duration;
                }
            }

            if (key == 'hasThreeStates') {
                object._render();
                object._updateCheckStates();
            }

            if (key == 'toggleIndicatorSize') {
                object._updateCheckLayout();
                object._render();
            }
        }
    });
})(jqxBaseFramework);

(function ($) {
    $.jqx._jqxTree.jqxTreeItem = function (id, parentId, type) {
        var treeItem =
        {
            // gets the item's label.
            label: null,
            // gets the id.
            id: id,
            // gets the parent id.
            parentId: parentId,
            // gets the parent element.
            parentElement: null,
            // gets the parent item instance.
            parentItem: null,
            // gets whether the item is disabled.
            disabled: false,
            // gets whether the item is selected.
            selected: false,
            // gets whether the item is locked.
            locked: false,
            // gets the checked state.
            checked: false,
            // gets the item's level.
            level: 0,
            // gets a value whether the item is opened.
            isExpanded: false,
            // has sub elements.
            hasItems: false,
            // li element
            element: null,
            // subtree element.
            subtreeElement: null,
            // checkbox element.
            checkBoxElement: null,
            // titleElement element.
            titleElement: null,
            // arrow element.
            arrow: null,
            // prev item.
            prevItem: null,
            // next item.
            nextItem: null
        }
        return treeItem;
    }; // 
})(jqxBaseFramework);
