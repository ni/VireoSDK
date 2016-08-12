/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    'use strict';

    $.jqx.jqxWidget('jqxKanban', '', {});

    $.extend($.jqx._jqxKanban.prototype, {
        defineInstance: function () {
            var settings = {
                animationDelay: 100,
                columnRenderer: null,
                columns: null, // array with columns
                connectWith: null,
                headerWidth: 30, 
                headerHeight: 30,
                height: 400,
                handle: null,
                itemRenderer: null,
                ready: null,
                resources: null,
                rtl: false,
                source: null, // array with items
               /* template: "<div class='jqx-kanban-item' id=''>"
                                + "<div class='jqx-kanban-item-color-status'></div>"
                                + "<div class='jqx-kanban-item-avatar'></div>"
                                + "<div class='jqx-kanban-item-text'></div>"
                                + "<div class='jqx-kanban-item-content'></div>"
                                + "<div class='jqx-kanban-item-footer'></div>"
                        + "</div>",*/
                template: "<div class='jqx-kanban-item' id=''>"
                                + "<div class='jqx-kanban-item-color-status'></div>"
                                + "<div class='jqx-kanban-item-avatar'></div>"
                                + "<div class='jqx-kanban-item-text'></div>"
                                + "<div class='jqx-kanban-item-footer'></div>"
                        + "</div>",
                templateContent: { id: 0, status: "work", text: "New text", content: "New content", tags: "New, tags", color: "green", resourceId: 0, className: ""},
                width: 600,
                verticalTextOrientation: "topToBottom", // topToBottom, bottomToTop

                // internal flag variables
                _kanbanId: null,
                _dropKanbanId: null,
                _connectWith: null,
                _kanbanColumns: null,
                _selectedItemId: null,
                _selectedItemValues: null,
                _draggedItemId: null,
                _draggedItemValues:null,
                _selectedColumn: null,
                _source: null,
                _resourcesLength: null,
                _items: [],
                _ie8: ($.jqx.browser.msie && $.jqx.browser.version == 8),
                _ie7: ($.jqx.browser.msie && $.jqx.browser.version < 8),
                _parentsTag: null,
                _columns: [], // array with columns an their settings
                _collapsedColumns: 0,
                _expandedColumns: null,
                _columnBorders: [1, 1, 1, 1], // to be actualized after adding of css classes
                _css_color_names: ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"],
                _clearing: "<div class='jqx-kanban-clearing'></div>",
                _commonItem:{
                    id:null,
                    name:"no name",
                    image: "data:image/png;base64,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"
                },

                // events
                _events: ['initialized', 'itemSelected', 'itemCreated', 'itemMoved', 'itemReceived', 'columnSelected', 'columnUnselected', 'columnCollapsed', 'columnExpanded', 'itemAttrClicked', 'columnAttrClicked']
            };
            $.extend(true, this, settings);
        },

        createInstance: function () {
            var that = this;

            $("#" + that.element.id).empty();
            that._createKanban();
        },

        _createKanban: function () {
            var that = this;

            that._ie8Plugin();
            that._kanbanId = that.element.id;
           
            var bindingCompleted = function () {
                that._getParent();
                that._createKanbanField();
                that._createKanbanLayout();
                that._addCSS();
                var resourcesCompleted = function () {
                    that._setKanbanConnections();
                    that._transformToSortable();
                    that._addEventHandlers();
                    that._rtlCheck();
                    that._refreshEventHandlers();
                    that._recalculateContainersHeight();
                    that._handlerExpandCollapse();
                    that._raiseEvent('0');
                    that._ready();
                }
                that._populateKanban(resourcesCompleted);
            }
            that._serializeSource(bindingCompleted);
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            object._createKanban();
        },

        _getParent: function () {
            var that = this;
            that._parentsTag = that.host.parent().get(0).tagName.toLowerCase();
        },

        _createKanbanField: function () {
            var that = this;
            var columns = that.columns.length;

            if (that.width == null && that.height == null) {
                if (that._parentsTag == "body") {
                    that.width = $(window).innerWidth();
                    that.height = $(window).innerHeight();
                    if (that._ie7 || that._ie8) {
                        that.host.height(that.height);
                    }
                    that.host.addClass(this.toThemeProperty("jqx-kanban-full-frame"));
                } else {
                    that.width = that.host.parent().width();
                    that.height = that.host.parent().height();
                    that.host.addClass(this.toThemeProperty("jqx-kanban-in-frame"));
                }
            } else if (that.width != null && that.height == null) {
                if (that.width <= that.headerWidth * columns) {
                    throw new Error('jqxKanban: Insert valid Kanban dimensions. Width must be greather than sum of the collapsed header\'s width');
                }
                that.host.width(that.width);
            } else if (that.heigth != null && that.width == null) {
                if (that.height <= that.headerHeight) {
                    throw new Error('jqxKanban: Insert valid Kanban dimensions. Height must be greather than headerHeight');
                }
                that.host.heigth(that.heigth);
            } else {
                if (that.width <= that.headerWidth * columns) {
                    throw new Error('jqxKanban: Insert valid Kanban dimensions. Width must be greather than sum of the collapsed header\'s width');
                }
                if (that.height <= that.headerHeight) {
                    throw new Error('jqxKanban: Insert valid Kanban dimensions. Height must be greather than headerHeight');
                }
                that.host.width(that.width);
                that.host.height(that.height);
            }

            that.host.addClass(this.toThemeProperty("jqx-widget"));
        },

        // Start -> Create Kanban layout block
        _createKanbanLayout: function () {
            var that = this;
            var numberOfColumns = that.columns.length;
            that._expandedColumns = numberOfColumns;
            var columnDimensions = that._calculateColumnDimensions(numberOfColumns);
            var containerDimensions = that._calculateContainerDimensions(numberOfColumns);

            for (var i = 0; i < numberOfColumns; i++) {
                var newColumn = $("<div id='" + that._kanbanId + "-column-" + i + "' class='jqx-kanban-column' data-column-data-field='" + that.columns[i].dataField + "' style='width:" + columnDimensions[0] + "; height:" + columnDimensions[1] + ";'></div>");
                if (that.columns[i].maxItems === undefined) {
                    that.columns[i].maxItems = 9999;
                }
                that._columns.push(newColumn);
                that.host.append(newColumn);
                var css = 'jqx-kanban-column-vertical-container';
                var collapseDirection = that.columns[i].collapseDirection;
                if (!collapseDirection) {
                    collapseDirection = "left";
                }

                if (collapseDirection == "right") {
                    css = 'jqx-kanban-column-vertical-container-inverse';
                }

                var iconClassName = that.columns[i].iconClassName ? that.toThemeProperty(that.columns[i].iconClassName) : "";
                var iconDiv1 = iconClassName ? "<div class='" + that.toThemeProperty("jqx-window-collapse-button-background jqx-kanban-column-header-custom-button") + "'><div style='width: 100%; height: 100%;' class='" + iconClassName + "'></div></div>" : "";
                var iconDiv2 = iconClassName ? "<div class='" + that.toThemeProperty("jqx-window-collapse-button-background jqx-kanban-column-header-custom-button") + "'><div style='width: 100%; height: 100%;' class='" + iconClassName + "'></div></div>" : "";

                    
                var newColumnHeaderCollapsed = $("<div id='" + that._kanbanId + "-column-header-collapsed-" + i + "' data-kanban-column-header-collapsed='" + i + "' class='" + that.toThemeProperty("jqx-kanban-column-header-collapsed") + "'>"
                                + "<div class='" + css + "'>"
                                + "<span class='" + that.toThemeProperty("jqx-kanban-column-header-title") + "'>" + that.columns[i].text + "</span>"
                                + "<span class='" + that.toThemeProperty("jqx-kanban-column-header-status") + "'></span>"
                                + "</div>"
                                + iconDiv1
                                + "<div class='" + that.toThemeProperty("jqx-window-collapse-button-background jqx-kanban-column-header-button") + "'><div style='width: 100%; height: 100%;' class='" + that.toThemeProperty('jqx-window-collapse-button ' + (collapseDirection == "right" ? "jqx-icon-arrow-left" : "jqx-icon-arrow-right")) + "'></div></div>"
                        + "</div>");
                newColumn.append(newColumnHeaderCollapsed);

                var newColumnHeader = $("<div id='" + that._kanbanId + "-column-header-" + i + "' data-kanban-column-header='" + i + "' class='" + that.toThemeProperty("jqx-kanban-column-header") + "'>"
                                + "<span class='" + that.toThemeProperty("jqx-kanban-column-header-title") + "'>" + that.columns[i].text + "</span>"
                                + "<span class='" + that.toThemeProperty("jqx-kanban-column-header-status") + "'></span>"
                                + iconDiv2
                                + "<div class='" + that.toThemeProperty("jqx-window-collapse-button-background jqx-kanban-column-header-button") + "'><div style='width: 100%; height: 100%;' class='" + that.toThemeProperty('jqx-window-collapse-button ' + (collapseDirection == "right" ? "jqx-icon-arrow-right" : "jqx-icon-arrow-left")) + "'></div></div>"
                        + "</div>");
                if (that.rtl) {
                    newColumnHeader.find(".jqx-kanban-column-header-button").addClass("jqx-kanban-column-header-button-rtl");
                    newColumnHeader.find(".jqx-kanban-column-header-custom-button").addClass("jqx-kanban-column-header-custom-button-rtl");
                }
                newColumnHeader.outerHeight(that.headerHeight);
                newColumnHeader.css('line-height', that.headerHeight + "px");
                newColumn.append(newColumnHeader);

                var newColumnContainer = $("<div id='" + that._kanbanId + "-column-container-" + i + "' data-kanban-column-container='" + that.columns[i].dataField + "' class='jqx-kanban-column-container' style='height:" + containerDimensions[1] + "; overflow-y: auto;'></div>");
                newColumn.append(newColumnContainer);
                newColumn.data("kanban-column-collapsed", false);
                that.columns[i].headerElement = newColumnHeader;
                that.columns[i].collapsedHeaderElement = newColumnHeaderCollapsed;
                if (that.columnRenderer) {
                    that.columnRenderer(newColumnHeader, newColumnHeaderCollapsed, that.columns[i]);
                }
                if (collapseDirection == "left") {
                    var w = newColumnHeader.find('.jqx-kanban-column-header-title').width();
                    w += newColumnHeader.find('.jqx-kanban-column-header-status').width();
                    w -= 10;
                    newColumn.find('.jqx-kanban-column-header-title').css('left', -w + "px");
                    newColumn.find('.jqx-kanban-column-header-status').css('left', -w + "px");
                }

                if (that.columns[i].collapsible === false) {
                    newColumn.find(".jqx-kanban-column-header-button").hide();
                }
            }
            if (numberOfColumns == 1) {
                that.host.find(".jqx-kanban-column-header-button").hide();
            }
        },

        _calculateColumnDimensions: function (numberOfColumns) {
            var that = this;
            var dimensions = [];
            var width = 100 / numberOfColumns;
            var height = 100;
            var contentHeight = 100;
            if (this.host.height() == 0) {
                this.host.height(400);
            }
            if (this.host.width() == 0) {
                this.host.width(600);
            }

            if (that._ie7) {
                width = this.host.width() / numberOfColumns - (this._columnBorders[1] + this._columnBorders[3]);
                height = this.host.height() - (this._columnBorders[0] + this._columnBorders[2]);
                contentHeight = height - this.headerHeight;
                width = width + "px";
                height = height + "px";
                contentHeight = contentHeight + "px";
            } else {
                contentHeight = this.host.height() - $("#" + that._kanbanId + " div.jqx-kanban-column-header").outerHeight();
                width = width + "%";
                height = height + "%";
                contentHeight = contentHeight + "px";
            }

            dimensions.push(width);
            dimensions.push(height);
            dimensions.push(contentHeight);

            return dimensions;
        },

        _calculateContainerDimensions: function (numberOfColumns) {
            var that = this;
            var dimensions = [];
            var width = 100;
            var height = 100;

            if (that._ie7) {
                width = this.host.width() / numberOfColumns - 20; 
                height = this.host.height() - this.headerHeight; 
                width = width + "px";
                height = height + "px";
            } else {
                height = this.host.height() - this.headerHeight; 
                width = width + "%";
                height = height + "px";
            }

            dimensions.push(width);
            dimensions.push(height);
            return dimensions;
        },

        _recalculateContainersHeight: function () {
            var that = this;

            var headerElement = document.getElementById(that._kanbanId + "-column-header-0");
            var headersMarginTop = parseInt(getComputedStyle(headerElement).getPropertyValue("margin-top"));
            var headersMarginBottom = parseInt(getComputedStyle(headerElement).getPropertyValue("margin-Bottom"));

            var contentElement = document.getElementById(that._kanbanId + "-column-container-0");
            var contentMarginTop = parseInt(getComputedStyle(contentElement).getPropertyValue("margin-top"));
            var contentMarginBottom = parseInt(getComputedStyle(contentElement).getPropertyValue("margin-Bottom"));

            var headersHeight = document.getElementById(that._kanbanId + '-column-header-0').offsetHeight + headersMarginTop + headersMarginBottom;
            var containersMargin = contentMarginTop + contentMarginBottom;
            var containersHeight = this.host.height() - headersHeight - containersMargin;

            $("#" + that._kanbanId + " div.jqx-kanban-column-container").outerHeight(containersHeight);
        },

        _addCSS: function () {
            var that = this;
            $(that.host).addClass(that.toThemeProperty('jqx-kanban'));
            $("#" + that._kanbanId + " div.jqx-kanban-column").addClass(that.toThemeProperty('jqx-widget-content'));
            $("#" + that._kanbanId + " div.jqx-kanban-column-header").addClass(that.toThemeProperty('jqx-widget-header'));
            $("#" + that._kanbanId + " div.jqx-kanban-column-header-collapsed").addClass(that.toThemeProperty('jqx-widget-header'));
            $("#" + that._kanbanId + " div.jqx-kanban-column-container").addClass(that.toThemeProperty('jqx-widget-content'));

            if (that._ie8 || that._ie7){
                $("#" + that._kanbanId + "-column-0").addClass(that.toThemeProperty('jqx-kanban-column-first'));
            } else {
                that._columnBorders[0] = $("#" + that._kanbanId + " div.jqx-kanban-column:first-of-type").css("border-top-width").slice(0, -2);
                that._columnBorders[1] = $("#" + that._kanbanId + " div.jqx-kanban-column:first-of-type").css("border-right-width").slice(0, -2);
                that._columnBorders[2] = $("#" + that._kanbanId + " div.jqx-kanban-column:first-of-type").css("border-bottom-width").slice(0, -2);
                that._columnBorders[3] = $("#" + that._kanbanId + " div.jqx-kanban-column:first-of-type").css("border-top-width").slice(0, -2);
            }

            if (that.verticalTextOrientation == "bottomToTop") {
                var iverteDcolumns = $("#" + that._kanbanId).find(".jqx-kanban-column-vertical-container");
                iverteDcolumns.removeClass('jqx-kanban-column-vertical-container');
                iverteDcolumns.addClass('jqx-kanban-column-vertical-container-inverse');
            }
        },

        _rtlCheck: function () {
            var that = this;

            if (that.rtl == true) {
                $(that.host).addClass(that.toThemeProperty('jqx-kanban-rtl'));
                $("#" + that._kanbanId + " div.jqx-kanban-column-container").addClass(that.toThemeProperty('jqx-kanban-rtl'));
                $("#" + that._kanbanId + " div.jqx-kanban-item-keyword").addClass(that.toThemeProperty('jqx-kanban-item-keyword-rtl'));
            }
        },
        // End -> Create Kanban layout block

        // Start -> Populate Kanban block
        _serializeSource: function (completed) {
            var that = this;
            that._source = [];
            that._sourceKeys = [];
            var loadData = function (array)
            {
                if (!array)
                    return;

                for (var i = 0; i < array.length; i++) {
                    var item = {};
                    item.id = array[i].id != undefined ? array[i].id : that.element.id + "_" + i;
                    item.status = array[i].status || that.templateContent.status;
                    item.text = array[i].text || that.templateContent.text;
                    item.content = array[i].content || that.templateContent.content;
                    item.tags = array[i].tags || that.templateContent.tags;
                    item.color = array[i].color || that.templateContent.color;
                    item.resourceId = array[i].resourceId || that.templateContent.resourceId;
                    item.className = array[i].className || that.templateContent.className;
                    that._source.push(item);
                    that._sourceKeys[item.id] = item;
                }
                completed();
            }

            var isAdapter = that.source && that.source.dataBind;
            if (isAdapter) {
                var elementId = that.element.id;
                that.source.dataBind();
                if (that.source.records.length == 0) {
                    var updateFunc = function () {
                        loadData(that.source.records);
                    };

                    that.source.unbindDownloadComplete(elementId);
                    that.source.bindDownloadComplete(elementId, updateFunc);
                }
                else {
                    loadData(that.source.records);
                }

                that.source.unbindBindingUpdate(elementId);
                that.source.bindBindingUpdate(elementId, function () {
                    loadData(that.source.records);
                });
                return;
            }

            loadData(that.source);
        },

        _populateKanban: function (completed) { 
            var that = this;
            var sourceLength = 0;
            if (that._source!==null) {
                sourceLength = that._source.length || 0;
            }
            that._resources = new Array();

            var loadItems = function (resources) {
                that._resources = resources;
                if (resources !== null && resources !== undefined) {
                    that._resourcesLength = resources.length;
                    for (var i = 0; i < that._resourcesLength; i++) {
                        if (resources[i].common == true) {
                            that._commonItem = resources[i];
                        }
                    }
                }

                for (var i = 0; i < sourceLength; i++) {
                    var newItem = $(that.template);
                    newItem.data("kanban-item-id", that._source[i].id);

                    var person = that._commonItem;
                    for (var j = 0; j < that._resourcesLength; j++) {
                        if (resources[j].id == that._source[i].resourceId) {
                            person = resources[j];
                        }
                    }
                    var personImage = "<img class='jqx-kanban-item-avatar-image' alt='" + person.name + "' title='" + person.name + "' src='" + person.image + "' />";
                    newItem.addClass(that.toThemeProperty('jqx-rc-all'));
                    newItem.find(".jqx-kanban-item-avatar").append(personImage);
                    if (that.theme != "") {
                        newItem.addClass(that.toThemeProperty('jqx-kanban-item'));
                    }
                    var populatedColumn = that.host.find("[data-kanban-column-container='" + that._source[i].status + "']");
                    newItem.find(".jqx-kanban-item-color-status").css({ "background-color": that._source[i].color });
                    if (that.rtl) {
                        newItem.find(".jqx-kanban-item-color-status").addClass("jqx-kanban-item-color-status-rtl");
                        newItem.find(".jqx-kanban-item-avatar").addClass("jqx-kanban-item-avatar-rtl");
                    }
                    newItem.find(".jqx-kanban-item-text").append(that._source[i].text);
                    newItem.find(".jqx-kanban-item-content").append(that._source[i].content);

                    var footerKeywordsElem = '';
                    var footerKeywords = [];
                    if ((that._source[i].tags !== null) && (that._source[i].tags !== undefined)) {
                        footerKeywords = that._source[i].tags.replace(/\,\s/g, ',').split(",");
                    }
                    footerKeywords.forEach(function (keyword) {
                        footerKeywordsElem = footerKeywordsElem + "<div class='" + that.toThemeProperty("jqx-kanban-item-keyword jqx-fill-state-normal jqx-rc-all") + "'>" + keyword + "</div>";
                    });

                    footerKeywordsElem = footerKeywordsElem + that._clearing//
                    newItem.find(".jqx-kanban-item-footer").append(footerKeywordsElem);
                    newItem.append(that._clearing); //
                    newItem.attr("id", that._kanbanId + "_" + that._source[i].id); // was i

                    if ((that._source[i].className !== null) && (that._source[i].className !== undefined)) {
                        newItem.addClass(that.toThemeProperty(that._source[i].className));
                    }
                    if (that.itemRenderer) {
                        that.itemRenderer(newItem, that._source[i], person);
                    }
                    populatedColumn.append(newItem);
                    that._items[that._source[i].id] = newItem;
                }
                completed();
            }


            var isAdapter = that.resources && that.resources.dataBind;
            if (isAdapter) {
                var elementId = that.element.id;
                that.resources.dataBind();
                if (that.resources.records.length == 0) {
                    var updateFunc = function () {
                        loadItems(that.resources.records);
                    };

                    that.resources.unbindDownloadComplete(elementId);
                    that.resources.bindDownloadComplete(elementId, updateFunc);
                }
                else {
                    loadItems(that.resources.records);
                }

                that.resources.unbindBindingUpdate(elementId);
                that.resources.bindBindingUpdate(elementId, function () {
                    loadItems(that.resources.records);
                });
                return;
            }
            else {
                that._resources = that.resources;
                loadItems(that.resources);
            }

            $("#" + that._kanbanId + " div.jqx-kanban-item").addClass(this.toThemeProperty('jqx-widget-content'));
        },

        _ready: function () {
            var that = this;

            if ((that.ready != null) && (typeof that.ready === "function")) {
                that.ready();
            }
        },

        collapseColumn: function(dataField)
        {
            for (var i = 0; i < this.columns.length; i++) {
                if (this.columns[i].dataField == dataField) {
                    this._collapseColumn(i);
                    return true;
                }
            }
            return false;
        },

        expandColumn: function(dataField)
        {
            for (var i = 0; i < this.columns.length; i++) {
                if (this.columns[i].dataField == dataField) {
                    this._expand(i);
                    return true;
                }
            }
            return false;
        },

        //Start expand-collapse sortable block
        _collapseColumn: function (columnNumber) { //add columnName as parameter
            var that = this;
            var column = columnNumber || 0;

            $("#" + that._kanbanId + "-column-header-collapsed-" + column).addClass(that.toThemeProperty("jqx-kanban-column-header-collapsed-show"));
            $("#" + that._kanbanId + "-column-header-" + column).addClass(that.toThemeProperty("jqx-kanban-column-hide"));
            $("#" + that._kanbanId + "-column-container-" + column).addClass(that.toThemeProperty("jqx-kanban-column-hide"));

            if (that._ie8 || that._ie7) {
                $("#" + that._kanbanId + " .jqx-kanban-column-vertical-container").addClass(that.toThemeProperty("jqx-kanban-column-vertical-container-ie8-fix"));
                $("#" + that._kanbanId + " .jqx-kanban-column-vertical-container-inverse").addClass(that.toThemeProperty("jqx-kanban-column-vertical-container-inverse-ie8-fix"));
            }

            that._columns[column].data("kanban-column-collapsed", true);
            that.columns[column].collapsed = true;
            that._calculateExpandedColumnsWidth();
            that._raiseEvent('7', { column: that.columns[column] });
        },

        _expandColumn: function (columnNumber) { //add columnName as parameter
            var that = this;
            var column = columnNumber || 0;

            $("#" + that._kanbanId + "-column-header-collapsed-" + column).removeClass(that.toThemeProperty('jqx-kanban-column-header-collapsed-show'));
            $("#" + that._kanbanId + "-column-header-" + column).removeClass(that.toThemeProperty("jqx-kanban-column-hide"));
            $("#" + that._kanbanId + "-column-container-" + column).removeClass(that.toThemeProperty("jqx-kanban-column-hide"));
            that.columns[column].collapsed = false;
            that._columns[column].data("kanban-column-collapsed", false);
            that._calculateExpandedColumnsWidth();
            that._raiseEvent('8', { column: that.columns[column] });
        },

        _calculateExpandedColumnsWidth: function () {
            var that = this;
            var totalColumns = that._columns.length;
            that._collapsedColumns = 0;
            that._expandedColumns = 0;
            var expandedColumnsWidth = 0;
            var headerWidth = that.headerWidth;

            for (var i = 0; i < totalColumns; i++) {
                if (that._columns[i].data("kanban-column-collapsed")==true) {
                    that._collapsedColumns++;
                } else {
                    that._expandedColumns++;
                }
            }

            expandedColumnsWidth = (that.host.width() - that.headerWidth * that._collapsedColumns) / that._expandedColumns;
            var expandedColumnsWidthIE7 = expandedColumnsWidth - (this._columnBorders[1] + this._columnBorders[3]);

            if (that._ie7) {
                expandedColumnsWidth = expandedColumnsWidthIE7;
                headerWidth = that.headerWidth - 2;
            }

            if (that.width && that.width.toString().indexOf("%") >= 0) {
                var onePercent = (that.host.width()+2) / 100;
                var onePixelToPercentage = 1 / onePercent; // one pixel is equal to this amount of percentages.
                var collapsedWidth = headerWidth * onePixelToPercentage;
                for (var i = 0; i < totalColumns; i++) {
                    if (that._columns[i].data("kanban-column-collapsed") == true) {
                        that._columns[i][0].style.width = collapsedWidth + "%";
                    } else {
                        that._columns[i][0].style.width = (expandedColumnsWidth * onePixelToPercentage + "%");
                    }
                }

                return;
            }

            for (var i = 0; i < totalColumns; i++) {
                if (that._columns[i].data("kanban-column-collapsed") == true) {
                    that._columns[i].outerWidth(headerWidth);
                } else {
                    that._columns[i].outerWidth(expandedColumnsWidth);
                }
            }
        },

        _handlerExpandCollapse: function () { //add columnName as parameter
            var that = this;
            var columnNumber = 0;

            that.addHandler($("#" + that._kanbanId + " .jqx-kanban-column-header"), 'click', function (event) {
                var columnNumber = $(this).parent().index();
                var column = that.columns[columnNumber];

                var selectedAttr = {
                    attribute: "title",
                    column: column,
                    cancelToggle: false
                }
                if ($(event.target).parent()[0].className.indexOf("jqx-kanban-column-header-custom-button") >= 0) {
                    var selectedAttr = {
                        attribute: "button",
                        column: column,
                        cancelToggle: false
                    }
                }
                that._raiseEvent('10', selectedAttr); // 'columnAttrClicked' event
                if (!selectedAttr.cancelToggle) {
                    if (that._expandedColumns > 1) {
                        if (column.collapsible === false) {
                            return;
                        }
                        that._collapseColumn(columnNumber);
                    }
                }
            });

            that.addHandler($("#" + that._kanbanId + " .jqx-kanban-column-header-collapsed"), 'click', function (event) {
                var columnNumber = $(this).parent().index();
                var columnNumber = $(this).parent().index();
                var column = that.columns[columnNumber];
                var selectedAttr = {
                    attribute: "title",
                    cancelToggle: false,                
                    column: column
                }
                if ($(event.target).parent()[0].className.indexOf("jqx-kanban-column-header-custom-button") >= 0) {
                    var selectedAttr = {
                        attribute: "button",
                        cancelToggle: false,
                        column: column
                    }
                }
                that._raiseEvent('10', selectedAttr); // 'columnAttrClicked' event
                if (!selectedAttr.cancelToggle) {
                    that._expandColumn(columnNumber);
                }
            });
        },
        //End expand-collapse sortable block

        //Start kanban sortable block
        _setKanbanConnections: function () {
            var that = this;

            that._kanbanColumns = "#" + that._kanbanId + " div.jqx-kanban-column-container";
            that._connectWith = that._kanbanColumns;

            if (that.connectWith != null) {
                var connectedArray = that.connectWith.replace(/\,\s/g, ',').split(",");

                connectedArray.forEach(function (connectId) {
                    that._connectWith = that._connectWith + ", " + connectId + " div.jqx-kanban-column-container";
                });
            }
        },

        _transformToSortable: function () {
            var that = this;

            for (var i = 0; i < $(that._kanbanColumns).length; i++) {
                $($(that._kanbanColumns)[i]).jqxSortable({
                    connectWith: that._connectWith,
                    maxItems: that.columns[i].maxItems || 9999,
                    cancel: ".jqx-kanban-column-container-cancel",
                    placeholderShow: "jqx-kanban-item-placeholder",
                    revert: that.animationDelay,
                    cursor: "move",
                    tolerance: "pointer",
                    containment: "window"
                });
            }

            $.jqx.utilities.resize(that.host, null, true);
            $.jqx.utilities.resize(that.host, function () {
                for (var i = 0; i < $(that._kanbanColumns).length; i++) {
                    $($(that._kanbanColumns)[i]).jqxSortable({
                        containment: "window"
                    });
                }
            });
 
            if(that.handle!==null){
                $(that._kanbanColumns).jqxSortable({
                    handle: "." + that.handle
                });

                $("#" + that._kanbanId + " ." + that.handle).addClass("jqx-kanban-handle");
            }
        },
        // End -> Kanban sortable block

        // Start Columns restriction block
        _calculateItemsPerColumn: function (columnNumber) {
            var that = this;
        },

        _calculateRestrictions: function () {
            var that = this;
        },

        _redrawColumnHeader: function (columnNumber,number) {
            var that = this;
        },
        // End Columns restriction block

        // Start Item Manipulation block
        addItem: function (newItem) {
            var that = this;
            var id = newItem.id;
            var newItemIndex = (that._source != null) ? that._source.length : 0;
            if (id == undefined) {
                id = newItemIndex;
            }

            var newItemId = that._kanbanId + "_" + id;
            that._source = (that._source != null) ? that._source : [];
            var color = null;

            if (that._css_color_names.indexOf(newItem.color)>-1) {
                color = newItem.color;
            } else if (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(newItem.color)) {
                color = newItem.color;
            } else if (/(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(newItem.color)) {
                color = "#" + newItem.color;
            }

            var newItemValues = {
                id: id,
                status: newItem.status || that.templateContent.status,
                text: newItem.text || that.templateContent.text,
                content: newItem.content || that.templateContent.content,
                tags: newItem.tags || that.templateContent.tags,
                color: color || that.templateContent.color,
                resourceId: newItem.resourceId || that.templateContent.resourceId,
                className: newItem.className || that.templateContent.className
            };
            var col = this.getColumn(newItemValues.status);
            if (!col.maxItems) {
                col.maxItems = 9999;
            }
            if (col.maxItems < this.getColumnItems(col.dataField).length + 1) {
                return;
            }

            var person = that._commonItem;
            for (var j = 0; j < that._resources.length; j++) {
                if (that._resources[j].id == newItemValues.resourceId) {
                    person = that._resources[j];
                }
            }

            var populatedColumn = that.host.find("[data-kanban-column-container='" + newItemValues.status + "']");
            var newItem = $(that.template);
            if (that.theme != "") {
                newItem.addClass(that.toThemeProperty('jqx-kanban-item'));
            }
            newItem.find(".jqx-kanban-item-color-status").css({ "background-color": newItemValues.color });
            var personImage = "<img class='jqx-kanban-item-avatar-image' alt='" + person.name + "' title='" + person.name + "' src='" + person.image + "' />";
            newItem.find(".jqx-kanban-item-avatar").append(personImage);
            newItem.find(".jqx-kanban-item-text").append(newItemValues.text);
            newItem.find(".jqx-kanban-item-content").append(newItemValues.content);
            var footerKeywords = newItemValues.tags.replace(/\,\s/g, ',').split(",");
            var footerKeywordsElem = '';
            footerKeywords.forEach(function (keyword) {
                footerKeywordsElem = footerKeywordsElem + "<div class='" + that.toThemeProperty("jqx-kanban-item-keyword jqx-fill-state-normal jqx-rc-all") + "'>" + keyword + "</div>";
            });
            footerKeywordsElem = footerKeywordsElem + "<div style='clear:both'></div>";
            newItem.find(".jqx-kanban-item-footer").append(footerKeywordsElem);
            populatedColumn.append(newItem);

            $("#" + that._kanbanId + " .jqx-kanban-item").removeClass(this.toThemeProperty('jqx-widget-content jqx-rc-all'));
            $("#" + that._kanbanId + " .jqx-kanban-item").addClass(this.toThemeProperty('jqx-widget-content jqx-rc-all'));

            newItem.attr("id", newItemId);
            that._source[newItemIndex] = newItemValues;
            that._sourceKeys[id] = newItemValues;
            newItem.data("kanban-item-id", newItemIndex);

            if ((newItemValues.className !== null) && (newItemValues.className !== undefined)) {
                newItem.addClass(this.toThemeProperty(newItemValues.className));
            }
            if (that.itemRenderer) {
                that.itemRenderer(newItem, newItemValues, person);
            }

            var col = this.getColumn(newItemValues.status);
            if (col) {
                if (that.columnRenderer) {
                    that.columnRenderer(col.headerElement, col.collapsedHeaderElement, col);
                    that._updateColumnTitle(col);
                }
            }
            that._raiseEvent('2', { itemId: newItemId }); // 'itemCreated' event
            that._refreshEventHandlers();
        },

        _updateColumnTitle: function(column)
        {
            if (column.collapseDirection == "left") {
                var w = column.headerElement.find('.jqx-kanban-column-header-title').width();
                w += column.headerElement.find('.jqx-kanban-column-header-status').width();
                w -= 10;
                column.headerElement.find('.jqx-kanban-column-header-title').css('left', -w + "px");
                column.headerElement.find('.jqx-kanban-column-header-status').css('left', -w + "px");
            }
        },

        _selectItem: function (event) {
            var that = this;
            var self = event.data.self;

            self._selectedItemId = $(that).attr("id");
            $("#" + self._kanbanId + " .jqx-kanban-item").removeClass(self.toThemeProperty('jqx-kanban-item-selected'));
            $(that).addClass(self.toThemeProperty('jqx-kanban-item-selected'));
            var id = $(this).data().kanbanItemId;
            self._selectedId = id;
            self._raiseEvent('1', { item: self._sourceKeys[id] }); // 'itemSelected' event

            self._refreshEventHandlers();
        },

        selectItem: function (itemId)
        {
            var that = this;
            var selectedItem = $("#" + that._kanbanId + "_" + itemId);
            if (selectedItem.length == 0) {
                return;
            }
            $("#" + self._kanbanId + " .jqx-kanban-item").removeClass(self.toThemeProperty('jqx-kanban-item-selected'));
            $(selectedItem).addClass(that.toThemeProperty('jqx-kanban-item-selected'));
            that._selectedId = itemId;
        },

        _selectColumn: function (event) {
            var that = this;
            var self = event.data.self;
            var parentColumn = $(that).attr("data-column-data-field");
            var selectedColumnNumber, 
                parentColumnNumber;
            var columnsLength = self.columns.length;

            for (var i = 0; i < columnsLength; i++){
                if (self.columns[i].dataField == parentColumn) {
                    parentColumnNumber = i;
                }
                if (self.columns[i].dataField == self._selectedColumn) {
                    selectedColumnNumber = i;
                }
            }

            $("#" + self._kanbanId + " .jqx-kanban-column").removeClass(self.toThemeProperty('jqx-kanban-column-selected'));
            $(that).addClass(self.toThemeProperty('jqx-kanban-column-selected'));

            if ((self._selectedColumn != null)&&(self._selectedColumn != parentColumn)) {
                self._raiseEvent('6', { column: self._selectedColumn, dataField: selectedColumnNumber }); // 'columnUnselected' event
            };

            self._selectedColumn = parentColumn;
            self._raiseEvent('5', { column: self._selectedColumn, dataField: parentColumnNumber }); // 'columnSelected' event
        },

        getSelectedColumn: function () {
            var that = this;

            return that._selectedColumn;
        },

        _removeSourceIndexById: function (itemId)
        {
            var that = this;
            var indexToRemove = -1;
            $.each(that._source, function (index, value) {
                if (this && this.id == itemId) {
                    indexToRemove = index;
                    return false;
                }
            });

            if (indexToRemove != -1) {
                that._source.splice(indexToRemove, 1);
            }
            that._sourceKeys[itemId] = null;
            delete that._sourceKeys[itemId];
        },

        removeItem: function (itemId) {
            var that = this;
            var selectedItem = "#" + that._kanbanId + "_" + itemId;
            var selectedItemNumber = itemId.toString().replace(that._kanbanId + "_", "");
            $(selectedItem).remove();

            var col = this.getColumn(that._sourceKeys[itemId].status);
            that._items[selectedItemNumber] = null;
            that._removeSourceIndexById(itemId);
            that._sourceKeys[itemId] = null;

            if (col) {
                if (that.columnRenderer) {
                    that.columnRenderer(col.headerElement, col.collapsedHeaderElement, col);
                    that._updateColumnTitle(col);
                }
            }

            that._selectedItemId = null;
        },

        updateItem: function (itemId, newContent) {
            var that = this;
            var selectedItem = $("#" + that._kanbanId + "_" + itemId);
            if (selectedItem.length == 0) {
                return;
            }

            var itemSourceId = selectedItem.data('kanban-item-id');
            var selectedItemSource = that._sourceKeys[itemSourceId];
            var oldCss = selectedItemSource.className || '';
            var color = null; 

            if (that._css_color_names.indexOf(newContent.color) > -1) {
                color = newContent.color;
            } else if (/(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(newContent.color)) {
                color = newContent.color;
            } else if (/(^[0-9A-F]{6}$)|(^[0-9A-F]{3}$)/i.test(newContent.color)) {
                color = "#" + newContent.color;
            }

            var newItemValues = {
                id: selectedItemSource.id,
                status: selectedItemSource.status,
                text: newContent.text || selectedItemSource.text,
                content: newContent.content || selectedItemSource.content,
                tags: newContent.tags || selectedItemSource.tags,
                color: color || selectedItemSource.color,
                resourceId: newContent.resourceId || selectedItemSource.resourceId,
                className: newContent.className || selectedItemSource.className
            };

            that._source[itemSourceId] = newItemValues;
            that._sourceKeys[itemSourceId] = newItemValues;
            var person = that._commonItem;
            for (var j = 0; j < that._resources.length; j++) {
                if (that._resources[j].id == newItemValues.resourceId) {
                    person = that._resources[j];
                }
            }
            var personImage = "<img class='jqx-kanban-item-avatar-image' alt='" + person.name + "' title='" + person.name + "' src='" + person.image + "' />";

            selectedItem.find(".jqx-kanban-item-avatar").html(personImage);
            selectedItem.find(".jqx-kanban-item-color-status").css({ "background-color": newItemValues.color });
            selectedItem.find(".jqx-kanban-item-text").html(newItemValues.text);
            selectedItem.find(".jqx-kanban-item-content").html(newItemValues.content);
            var footerKeywords = newItemValues.tags.replace(/\,\s/g, ',').split(","); 
            var footerKeywordsElem = '';
            footerKeywords.forEach(function (keyword) {
                footerKeywordsElem = footerKeywordsElem + "<div class='" + that.toThemeProperty("jqx-kanban-item-keyword jqx-fill-state-normal jqx-rc-all") + "'>" + keyword + "</div>";
            });
            footerKeywordsElem = footerKeywordsElem + "<div style='clear:both'></div>";
            selectedItem.find(".jqx-kanban-item-footer").html(footerKeywordsElem);

            if ((newItemValues.className !== null) && (newItemValues.className !== undefined)) {
                selectedItem.removeClass(this.toThemeProperty(oldCss));
                selectedItem.addClass(this.toThemeProperty(newItemValues.className));
            }
            if (that.itemRenderer) {
                that.itemRenderer(newItem, newItemValues, person);
            }
            var col = this.getColumn(newItemValues.status);
            if (col) {
                if (that.columnRenderer) {
                    that.columnRenderer(col.headerElement, col.collapsedHeaderElement, col);
                    that._updateColumnTitle(col);
                }
            }
        },

        getSelectedItem: function () {
            var that = this;
            var selectedItem = that._sourceKeys[that._selectedId];
            return selectedItem;
        },

        getColumn: function(dataField)
        {
            for (var i = 0; i < this.columns.length; i++) {
                if (this.columns[i].dataField == dataField)
                    return this.columns[i];
            }
            return null;
        },

        getColumnItems: function (dataField) {
            var that = this;
            var columnSource = [];
            var sourceLength = that._source.length;

            for (var i = 0; i < sourceLength; i++){
                if (that._source[i] != null && that._source[i].status == dataField) {
                    columnSource.push(that._source[i]);
                }
            }
            return columnSource;
        },
        
        getItems: function () { // probably may be renamed to "exportdata"
            var that = this;

            if (that._source!==null){
                return that._source.filter(
                    function (value) {
                        return (  value != null);
                    }
                );
            } else {
                return null;
            }
        },
        // End -> Item Manipulation block

        _ie8Plugin: function(){
            if (typeof Array.prototype.forEach != 'function') { // add forEach function to IE7, IE8
                Array.prototype.forEach = function (callback) {
                    for (var i = 0; i < this.length; i++) {
                        callback.apply(this, [this[i], i, this]);
                    }
                };
            };

            if (!window.getComputedStyle) { // add getComputedStyle function to IE7, IE8
                window.getComputedStyle = function (el, pseudo) {
                    this.el = el;
                    this.getPropertyValue = function (prop) {
                        var re = /(\-([a-z]){1})/g;
                        if (prop == 'float') prop = 'styleFloat';
                        if (re.test(prop)) {
                            prop = prop.replace(re, function () {
                                return arguments[2].toUpperCase();
                            });
                        }
                        return el.currentStyle[prop] ? el.currentStyle[prop] : null;
                    }
                    return this;
                }
            };
        },

        // Start Event handlers block
        _addEventHandlers: function () {
            var that = this;

            that.addHandler($(window), 'resize.kanban' + that.element.id, function (event) {
                that._recalculateContainersHeight();
                that._calculateExpandedColumnsWidth();
            });

            that.addHandler($(that._kanbanColumns), 'start', function (event) {
                that._selectedItemId = event.args.item.context.id;
                that._draggedItemId = that._selectedItemId;
                that._draggedItemDataId = $("#" + that._draggedItemId).data().kanbanItemId;
                that._draggedItemValues = that._sourceKeys[that._draggedItemDataId];
                that._selectedItemValues = that._draggedItemValues;

                var draggedItemHeight = $("#" + that._draggedItemId).height();
                $(".jqx-kanban-item-placeholder").height(draggedItemHeight);
            });
            that.addHandler($(that._kanbanColumns), 'stop', function (event) {
                var dropColumn = $("#" + that._draggedItemId).parent().attr("data-kanban-column-container");
                var newStatus = dropColumn;
                var column = null;
                for (var i = 0; i < that.columns.length; i++) {
                    if (that.columns[i].dataField == newStatus) {
                        column = that.columns[i];
                        break;
                    }
                }

            
                if (that._sourceKeys[that._draggedItemDataId]) {
                    var oldColumn = null;
                    var oldKanbanColumns = $("#" + that._kanbanId).jqxKanban('columns');
                    var oldStatus = that._sourceKeys[that._draggedItemDataId].status;
                    for (var i = 0; i < oldKanbanColumns.length; i++) {
                        if (oldKanbanColumns[i].dataField == oldStatus) {
                            oldColumn = oldKanbanColumns[i];
                            break;
                        }
                    }
                    if (that._kanbanId !== that._dropKanbanId) {
                        that._raiseEvent('3', { oldParentId: that._kanbanId, newParentId: that._dropKanbanId, itemId: that._selectedId, newColumn: column, oldColumn: oldColumn, itemData: that._draggedItemValues }); // 'itemMoved' event
                        var newIndex = that._source.length
                        that._draggedItemValues.status = dropColumn;
                        $("#" + that._dropKanbanId).trigger("_itemReceived", [that._selectedItemId, that._kanbanId, that._dropKanbanId, that._draggedItemValues, that._selectedId, column, oldColumn]);

                        that._sourceKeys[that._draggedItemDataId] = null;
                    } else {
                        that._raiseEvent('3', { newColumn: column, oldColumn: oldColumn, oldParentId: that._kanbanId, newParentId: that._dropKanbanId, itemId: that._selectedId, itemData: that._draggedItemValues }); // 'itemMoved' event
                        that._raiseEvent('4', { newColumn: column, oldColumn: oldColumn, oldParentId: that._kanbanId, newParentId: that._dropKanbanId, itemId: that._selectedId, itemData: that._draggedItemValues }); // 'itemReceived' event
                        that._sourceKeys[that._draggedItemDataId].status = dropColumn;
                    }
                    if (that.columnRenderer) {
                        for (var i = 0; i < that.columns.length; i++) {
                            if (that.columns[i].dataField == newStatus) {
                                that.columnRenderer(that.columns[i].headerElement, that.columns[i].collapsedHeaderElement, that.columns[i]);
                                that._updateColumnTitle(that.columns[i]);
                            }
                            if (that.columns[i].dataField == oldStatus) {
                                that.columnRenderer(that.columns[i].headerElement, that.columns[i].collapsedHeaderElement, that.columns[i]);
                                that._updateColumnTitle(that.columns[i]);
                            }
                        }
                    }
                }
                that._draggedItemDataId = null;
                that._draggedItemId = null;
                that._draggedItemValues = null;
            });
            that.addHandler($(that._kanbanColumns), 'sort', function (event) {
                that._dropKanbanId = $(".jqx-kanban-item-placeholder").parent().parent().parent().attr("id");
            });
            that.addHandler($(that.host), '_itemReceived', function (event, selectedItemId, oldParentId, newParentId, itemData) {

                that._raiseEvent('4', { itemId: selectedItemId, oldParentId: oldParentId, newParentId: newParentId, itemData: itemData }); // 'itemReceived' event

                var oldItem = $("#" + selectedItemId);
                var newItem = $(that.template);
                if (that.theme != "") {
                    newItem.addClass(that.toThemeProperty('jqx-kanban-item'));
                }
                newItem.data("kanban-item-id", itemData.id);

                var person = that._commonItem;
                for (var j = 0; j < that._resources.length; j++) {
                    if (that._resources[j].id == itemData.resourceId) {
                        person = that._resources[j];
                    }
                }

                var personImage = "<img class='jqx-kanban-item-avatar-image' alt='" + person.name + "' title='" + person.name + "' src='" + person.image + "' />";
                newItem.find(".jqx-kanban-item-avatar").append(personImage);
                newItem.find(".jqx-kanban-item-text").append(itemData.text);
                newItem.find(".jqx-kanban-item-color-status").css({ "background-color": itemData.color });
                newItem.find(".jqx-kanban-item-content").append(itemData.content);

                var footerKeywords = itemData.tags.replace(/\,\s/g, ',').split(",");
                var footerKeywordsElem = '';
                footerKeywords.forEach(function (keyword) {
                    footerKeywordsElem = footerKeywordsElem + "<div class='" + that.toThemeProperty("jqx-kanban-item-keyword jqx-fill-state-normal jqx-rc-all") + "'>" + keyword + "</div>";
                });
                footerKeywordsElem = footerKeywordsElem + "<div style='clear:both'></div>";
                newItem.find(".jqx-kanban-item-footer").append(footerKeywordsElem);
                newItem.attr("id", that._kanbanId + "_" + itemData.id);
                oldItem.replaceWith(newItem);

                $("#" + newParentId + " div.jqx-kanban-item").addClass(that.toThemeProperty('jqx-widget-content'));

                if ((itemData.className !== null) && (itemData.className !== undefined)) {
                    newItem.addClass(that.toThemeProperty(itemData.className));
                }

                $("#" + newParentId + " div.jqx-kanban-item").removeClass(that.toThemeProperty('jqx-kanban-item-selected'));
                $("#" + selectedItemId).addClass(that.toThemeProperty('jqx-kanban-item-selected'));
                $("#" + newParentId).jqxKanban("_refreshEventHandlers");

                that._source.push(itemData);
                var kanban1 = $("#" + newParentId).jqxKanban('getInstance');
                var kanban2 = $("#" + oldParentId).jqxKanban('getInstance');

                kanban1._sourceKeys[itemData.id] = itemData;
                kanban2._removeSourceIndexById(itemData.id);

                if (kanban1.columnRenderer) {
                    for (var i = 0; i < kanban1.columns.length; i++) {
                        kanban1.columnRenderer(kanban1.columns[i].headerElement, kanban1.columns[i].collapsedHeaderElement, kanban1.columns[i]);
                    }
                }
                if (kanban2.columnRenderer) {
                    for (var i = 0; i < kanban2.columns.length; i++) {
                        kanban2.columnRenderer(kanban2.columns[i].headerElement, kanban2.columns[i].collapsedHeaderElement, kanban2.columns[i]);
                    }
                }
            });

            that.addHandler($("#" + that._kanbanId + " .jqx-kanban-item"), 'click', that._selectItem, { self: this });
            that.addHandler($("#" + that._kanbanId + " .jqx-kanban-column"), 'click', that._selectColumn, { self: this });

            that.addHandler($('.jqx-kanban-item-color-status, .jqx-kanban-item-avatar, .jqx-kanban-item-text, .jqx-kanban-item-content, .jqx-kanban-item-keyword, .jqx-kanban-item-template-content'), 'click', function () {
                var availableItemClasses = 'jqx-kanban-item-color-status jqx-kanban-item-avatar jqx-kanban-item-text jqx-kanban-item-content jqx-kanban-item-keyword jqx-kanban-item-template-content'.split(" ");
                var clickedItemsClasses = $(this).attr('class').split(" ");
                var clickedItemsClassesLength = clickedItemsClasses.length;
                var clickedClass = null;
                var id = $(this).parents('.jqx-kanban-item').data().kanbanItemId;
                var selectedAttr = {
                    attribute: null,
                    item: that._sourceKeys[id],
                    itemId: id
                }

                for (var i = 0; i < clickedItemsClassesLength; i++) {
                    if (availableItemClasses.indexOf(clickedItemsClasses[i]) > -1) {
                        clickedClass = clickedItemsClasses[i];
                    }
                }

                switch (clickedClass) {
                    case "jqx-kanban-item-color-status":
                        selectedAttr.attribute = "colorStatus";
                        break;
                    case "jqx-kanban-item-avatar":
                        selectedAttr.attribute = "avatar";
                        break;
                    case "jqx-kanban-item-text":
                        selectedAttr.attribute = "text";
                        break;
                    case "jqx-kanban-item-content":
                        selectedAttr.attribute = "content";
                        break;
                    case "jqx-kanban-item-keyword":
                        selectedAttr.attribute = "keyword";
                        break;
                    case "jqx-kanban-item-template-content":
                        selectedAttr.attribute = "template";
                        break;
                    default:
                        break;
                }

                that._raiseEvent('9', selectedAttr); // 'itemAttrClicked' event
            });
        },

        destroy: function()
        {
            var that = this;
            $.jqx.utilities.resize(that.host, null, true);
            that._removeEventHandlers();
            that.host.remove();
        },

        _removeEventHandlers: function () {
            var that = this;

            that.removeHandler($(window), 'resize.kanban' + that.element.id);
            that.removeHandler($(that._kanbanColumns), 'start');
            that.removeHandler($(that._kanbanColumns), 'stop');
            that.removeHandler($(that._kanbanColumns), 'sort');
            //that.removeHandler($(that.host), 'itemReceived');
            that.removeHandler($(that.host), '_itemReceived');
            that.removeHandler($("#" + that._kanbanId + " .jqx-kanban-item"), 'click');
            that.removeHandler($("#" + that._kanbanId + " .jqx-kanban-column"), 'click');
            that.removeHandler($('.jqx-kanban-item-color-status, .jqx-kanban-item-avatar, .jqx-kanban-item-text, .jqx-kanban-item-content, .jqx-kanban-item-keyword, .jqx-kanban-item-template-content'), 'click');
        },

        _refreshEventHandlers: function () {
            var that = this;

            that._removeEventHandlers();
            that._addEventHandlers();
        },

        _raiseEvent: function (eventId, data) {
            that = this;
            var event = $.Event(that._events[eventId]);
            event.args = data;
            return that.host.trigger(event);
        },

        _getEvent: function (event) {
            that = this;
            if (that._isTouchDevice) {
                return that._touchEvents[event];
            } else {
                return event;
            }
        }
        // End -> Event handlers block
    });
})(jqxBaseFramework);
