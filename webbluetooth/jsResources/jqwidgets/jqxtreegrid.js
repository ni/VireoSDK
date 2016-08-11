/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.jqx.jqxWidget("jqxTreeGrid", "jqxDataTable", {});

    $.extend($.jqx._jqxTreeGrid.prototype, {
        defineInstance: function () {
            this.base.treeGrid = this;
            this.base.exportSettings = {
                recordsInView: false,
                columnsHeader: true,
                hiddenColumns: false,
                serverURL: null,
                characterSet: null,
                collapsedRecords: false,
                fileName: "jqxTreeGrid"
            }
            var settings = {
                pageSizeMode: "default",
                checkboxes: false,
                hierarchicalCheckboxes: false,
                icons: false,
                showSubAggregates: false,
                rowDetailsRenderer: null,
                virtualModeCreateRecords: null,
                virtualModeRecordCreating: null,
                loadingFailed: false
            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            this.theme = this.base.theme;
            var that = this;
        },

        deleteRow: function (key) {
            var that = this.base;
            that.deleterowbykey(key);
        },

        updateRow: function (key, rowdata) {
            var that = this.base;
            that.updaterowbykey(key, rowdata);
        },

        setCellValue: function(key, datafield, value)
        {
            var that = this.base;
            that.setCellValueByKey(key, datafield, value);
        },

        getCellValue: function(key, datafield)
        {
            var that = this.base;
            return that.getCellValueByKey(key, datafield);
        },

        lockRow: function(key)
        {
            var that = this.base;
            that.lockrowbykey(key);
        },

        unlockRow: function (key) {
            var that = this.base;
            that.unlockrowbykey(key);
        },

        selectRow: function(key)
        {
            var that = this.base;
            that.selectrowbykey(key);
        },

        unselectRow: function(key)
        {
            var that = this.base;
            that.unselectrowbykey(key);
        },

        ensureRowVisible: function (key) {
            var that = this.base;
            that.ensurerowvisiblebykey(key);
        },

        beginCellEdit: function(key, datafield)
        {
            var that = this.base;
            var column = that.getColumn(datafield);
            that.beginroweditbykey(key, column);
        },

        beginRowEdit: function (key) {
            var that = this.base;
            that.beginroweditbykey(key);
        },

        endCellEdit: function(key, datafield, cancel)
        {
            var that = this.base;
            that.endroweditbykey(key, cancel);
        },

        endRowEdit: function (key, cancel) {
            var that = this.base;
            that.endroweditbykey(key, cancel);
        },

        _showLoadElement: function()
        {
            var that = this.base;
            if (that.host.css('display') == 'block') {
                if (that.autoShowLoadElement) {
                    $(that.dataloadelement).css('visibility', 'visible');
                    $(that.dataloadelement).css('display', 'block');
                    that.dataloadelement.width(that.host.width());
                    that.dataloadelement.height(that.host.height());
                }
            }
        },

        _hideLoadElement: function()
        {
            var that = this.base;
            if (that.host.css('display') == 'block') {
                if (that.autoShowLoadElement) {
                    $(that.dataloadelement).css('visibility', 'hidden');
                    $(that.dataloadelement).css('display', 'none');
                    that.dataloadelement.width(that.host.width());
                    that.dataloadelement.height(that.host.height());
                }
            }
        },

        getKey: function (row) {
            if (row) {
                return row.uid;
            }
        },

        getRows: function () {
            var that = this.base;
            if (that.source.hierarchy) {
                if (that.source.hierarchy.length != 0) {
                    return that.source.hierarchy;
                }
            }

            return that.source.records;
        },

        getCheckedRows: function () {
            var that = this.base;
            var names = that._names();
             var exportRecords = new Array();
            var getRecords = function (ownerCollection, records) {
                if (!records)
                    return;

                for (var i = 0; i < records.length; i++) {
                    if (!records[i])
                        continue;
                    
                    var newRecord = $.extend({}, records[i]);
                    var rowInfo = that.rowinfo[records[i].uid];
                    if (rowInfo && rowInfo[names.checked]) {
                        ownerCollection.push(newRecord);
                    }
                    else if (newRecord[names.checked]) {
                        ownerCollection.push(newRecord);
                    }

                    getRecords(exportRecords, records[i].records);
                }
            }
            getRecords(exportRecords, that.dataViewRecords);
            return exportRecords;
        },

        getRow: function(key)
        {
            var that = this.base;
            var records = that.source.records;
            if (that.source.hierarchy) {
                var getRow = function (records) {
                    for (var i = 0; i < records.length; i++) {
                        if (!records[i]) {
                            continue;
                        }

                        if (records[i].uid == key) {
                            return records[i];
                        }
                        if (records[i].records) {
                             var foundRow = getRow(records[i].records);
                             if (foundRow) {
                                 return foundRow;
                             }
                        }
                    }
                }
                var row = getRow(that.source.hierarchy);
                return row;
            }
            else {
                for (var i = 0; i < records.length; i++) {
                    if (!records[i]) {
                        continue;
                    }

                    if (records[i].uid == key) {
                        return records[i];
                    }
                }
            }
        },

        _renderrows: function () {
            var that = this.base;
            var me = this;

            if (that._loading)
                return;

            if (that._updating) {
                return;
            }

            var names = that._names();

            if (that.source.hierarchy.length === 0 && !that.loadingFailed) {
                if (this.virtualModeCreateRecords) {
                    var done = function (records) {
                        if (records === false || (records && records.length == 0)) {
                            that._loading = false;
                            that.loadingFailed = true;
                            that.source.hierarchy = new Array();
                            me._hideLoadElement();
                            that._renderrows();
                            that._updateScrollbars();
                            that._arrange();
                            return;
                        }

                        for (var i = 0; i < records.length; i++) {
                            records[i].level = 0;
                            me.virtualModeRecordCreating(records[i]);
                            that.rowsByKey[records[i].uid] = records[i];
                        }

                        that.source.hierarchy = records;
                        if (!that.source._source.hierarchy) {
                            that.source._source.hierarchy = {};
                        }
                        that._loading = false;
                        me._hideLoadElement();
                        that._renderrows();
                        that._updateScrollbars();
                        that._arrange();
                    }
                    that._loading = true;
                    this.virtualModeCreateRecords(null, done);
                    this._showLoadElement();
                }
            }

            if (that.rendering) {
                that.rendering();
            }
            var tablewidth = 0;
            that.table[0].rows = new Array();
            var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-widget-content') + " " + that.toTP('jqx-item');
            if (that.rtl) {
                cellclass += " " + that.toTP('jqx-cell-rtl')
            }

            var columnslength = that.columns.records.length;

            var isIE7 = $.jqx.browser.msie && $.jqx.browser.version < 8;
            if (isIE7) {
                that.host.attr("hideFocus", "true");
            }

            var records = new Array();
            var getRecords = function (records, filtered) {
                for (var i = 0; i < records.length; i++) {
                    var record = records[i];
                    if (!record) {
                        continue;
                    }
                    var expanded = !that.rowinfo[record.uid] ? record.expanded : that.rowinfo[record.uid].expanded;
                    if (that.dataview.filters.length == 0) {
                        record._visible = true;
                    }
                    if (record._visible !== false) {
                        if (expanded || record[names.leaf]) {
                            filtered.push(record);
                            if (record.records && record.records.length > 0) {
                                var data = getRecords(record.records, new Array());
                                for (var t = 0; t < data.length; t++) {
                                    filtered.push(data[t]);
                                }
                            }
                        }
                        else {
                            filtered.push(record);
                        }
                    }
                }
                return filtered;
            };

            var filterRecords = that.source.hierarchy.length === 0 ? that.source.records : that.source.hierarchy;  
            filterRecords = that.dataview.evaluate(filterRecords);

            that.dataViewRecords = filterRecords;
            if (this.showSubAggregates) {
                var addSubAggregate = function (level, records) {
                    if (level != 0) {
                        if (records.length > 0) {
                            if (records[records.length - 1]) {
                                if (!records[records.length - 1].aggregate) {
                                    records.push({ _visible: true, level: level, siblings: records, aggregate: true, leaf: true });
                                }
                            }
                            else if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                                if (records[records.length - 2]) {
                                    if (!records[records.length - 2].aggregate) {
                                        records.push({ _visible: true, level: level, siblings: records, aggregate: true, leaf: true });
                                    }
                                }
                            }
                        }
                    }
                    for (var i = 0; i < records.length; i++) {
                        if (records[i] && records[i].records) {
                            addSubAggregate(level + 1, records[i].records);
                        }
                    }
                }
                addSubAggregate(0, filterRecords);
            }

            var getRootPageRecords = function (filterRecords) {
                var start = 0;
                var rowsOnPage = new Array();
                for (var t = 0; t < filterRecords.length; t++) {
                    var r = filterRecords[t];
                    if (r[names.level] == 0) {
                        start++;
                    }
                    if (start > that.dataview.pagesize * that.dataview.pagenum && start <= that.dataview.pagesize * that.dataview.pagenum + that.dataview.pagesize) {
                        rowsOnPage.push(r);
                    }
                    if (start > that.dataview.pagesize * that.dataview.pagenum + that.dataview.pagesize)
                        break;
                }
                return rowsOnPage;
            }

            if (that.source.hierarchy.length === 0) {
                if (that.dataview.pagesize == "all" || !that.pageable || that.serverProcessing) {
                    var rowsOnPage = filterRecords;
                    if (that.pageable && that.serverProcessing && filterRecords.length > that.dataview.pagesize) {
                        var rowsOnPage = filterRecords.slice(that.dataview.pagesize * that.dataview.pagenum, that.dataview.pagesize * that.dataview.pagenum + that.dataview.pagesize);
                    }
                }
                else {
                    var rowsOnPage = filterRecords.slice(that.dataview.pagesize * that.dataview.pagenum, that.dataview.pagesize * that.dataview.pagenum + that.dataview.pagesize);
                }
                var records = rowsOnPage;
            }
            else {
                var filterRecords = getRecords.call(that, filterRecords, new Array());

                if (that.dataview.pagesize == "all" || !that.pageable) {
                    var rowsOnPage = filterRecords;
                }
                else {
                    var rowsOnPage = filterRecords.slice(that.dataview.pagesize * that.dataview.pagenum, that.dataview.pagesize * that.dataview.pagenum + that.dataview.pagesize);
                    if (this.pageSizeMode == "root") {
                        rowsOnPage = getRootPageRecords(filterRecords);
                    }
                }
                var records = rowsOnPage;
                var pagenum = that.dataview.pagenum;
                that.updatepagerdetails();
                if (that.dataview.pagenum != pagenum) {
                    if (that.dataview.pagesize == "all" || !that.pageable) {
                        var rowsOnPage = filterRecords;
                    }
                    else {
                        var rowsOnPage = filterRecords.slice(that.dataview.pagesize * that.dataview.pagenum, that.dataview.pagesize * that.dataview.pagenum + that.dataview.pagesize);
                        if (this.pageSizeMode == "root") {
                            rowsOnPage = getRootPageRecords(filterRecords);
                        }
                    }
                    var records = rowsOnPage;
                }
            }
            that.renderedRecords = records;
            var pagesize = records.length;
            var zindex = that.tableZIndex;

            var widthOffset = 0;
            var emptyWidth = 0;
            if (isIE7) {
                for (var j = 0; j < columnslength; j++) {
                    var columnrecord = that.columns.records[j];
                    var width = columnrecord.width;
                    if (width < columnrecord.minwidth) width = columnrecord.minwidth;
                    if (width > columnrecord.maxwidth) width = columnrecord.maxwidth;
                    var tablecolumn = $('<table><tr><td role="gridcell" style="max-width: ' + width + 'px; width:' + width + 'px;" class="' + cellclass + '"></td></tr></table>');
                    $(document.body).append(tablecolumn);
                    var td = tablecolumn.find('td');
                    widthOffset = 1 + parseInt(td.css('padding-left')) + parseInt(td.css('padding-right'));
                    tablecolumn.remove();
                    break;
                }
            }

            var rtlTableClassName = that.rtl ? " " + that.toTP('jqx-grid-table-rtl') : "";
            var tableHTML = "<table cellspacing='0' class='" + that.toTP('jqx-grid-table') + rtlTableClassName + "' id='table" + that.element.id + "'><colgroup>";
            var pinnedTableHTML = "<table cellspacing='0' class='" + that.toTP('jqx-grid-table') + rtlTableClassName + "' id='pinnedtable" + that.element.id + "'><colgroup>";
            var lastVisibleColumn = null;
            for (var j = 0; j < columnslength; j++) {
                var columnrecord = that.columns.records[j];
                if (columnrecord.hidden) continue;
                lastVisibleColumn = columnrecord;
                var width = columnrecord.width;
                if (width < columnrecord.minwidth) width = columnrecord.minwidth;
                if (width > columnrecord.maxwidth) width = columnrecord.maxwidth;
                width -= widthOffset;
                if (width < 0) {
                    width = 0;
                }

                if (isIE7) {
                    var w = width;
                    if (j == 0) w++;
                    pinnedTableHTML += "<col style='max-width: " + width + "px; width: " + w + "px;'>";
                    tableHTML += "<col style='max-width: " + width + "px; width: " + w + "px;'>";
                }
                else {
                    pinnedTableHTML += "<col style='max-width: " + width + "px; width: " + width + "px;'>";
                    tableHTML += "<col style='max-width: " + width + "px; width: " + width + "px;'>";
                }
                emptyWidth += width;
            }
            tableHTML += "</colgroup>";
            pinnedTableHTML += "</colgroup>";

            that._hiddencolumns = false;
            var pinnedColumns = false;

            if (pagesize === 0) {
                var tablerow = '<tr role="row">';
                var height = that.host.height();
                if (that.pageable) {
                    height -= that.pagerHeight;
                    if (that.pagerPosition === "both") {
                        height -= that.pagerHeight;
                    }
                }
                height -= that.columnsHeight;
                if (that.filterable) {
                    var filterconditions = that.filter.find('.filterrow');
                    var filterconditionshidden = that.filter.find('.filterrow-hidden');
                    var filterrow = 1;
                    if (filterconditionshidden.length > 0) {
                        filterrow = 0;
                    }
                    height -= that.filterHeight + that.filterHeight * filterconditions.length * filterrow;
                }
                if (that.showstatusbar) {
                    height -= that.statusBarHeight;
                }
                if (that.showAggregates) {
                    height -= that.aggregatesHeight;
                }

                if (height < 25) {
                    height = 25;
                }
                if (that.hScrollBar[0].style.visibility != "hidden") {
                    height -= that.hScrollBar.outerHeight();
                }

                if (that.height === "auto" || that.height === null || that.autoheight) {
                    height = 100;
                }

                var width = that.host.width()+2;
                var tablecolumn = '<td colspan="' + that.columns.records.length + '" role="gridcell" style="border-right-color: transparent; min-height: ' + height + 'px; height: ' + height + 'px;  min-width:' + emptyWidth + 'px; max-width:' + emptyWidth + 'px; width:' + emptyWidth + 'px;';
                var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                cellclass += ' ' + that.toTP('jqx-center-align');
                tablecolumn += '" class="' + cellclass + '">';
                if (!that._loading) {
                    tablecolumn += that.gridlocalization.emptydatastring;
                }
                tablecolumn += '</td>';
                tablerow += tablecolumn;
                tableHTML += tablerow;
                pinnedTableHTML += tablerow;
                that.table[0].style.width = emptyWidth + 2 + 'px';
                tablewidth = emptyWidth;
            }
    
            var grouping = that.source._source.hierarchy && that.source._source.hierarchy.groupingDataFields ? that.source._source.hierarchy.groupingDataFields.length : 0;
      
            for (var i = 0; i < records.length; i++) {
                var row = records[i];
                var key = row.uid;

                if (grouping > 0) {
                    if (row[names.level] < grouping) {
                        key = row.uid;
                    }
                }
                if (row.uid === undefined) {
                    row.uid = that.dataview.generatekey();
                }

                var tablerow = '<tr data-key="' + key + '" role="row" id="row' + i + that.element.id + '">';
                var pinnedtablerow = '<tr data-key="' + key + '" role="row" id="row' + i + that.element.id + '">';
                if (row.aggregate) {
                    var tablerow = '<tr data-role="' + "summaryrow" + '" role="row" id="row' + i + that.element.id + '">';
                    var pinnedtablerow = '<tr data-role="' + "summaryrow" + '" role="row" id="row' + i + that.element.id + '">';
                }
                var left = 0;

                if (!that.rowinfo[key]) {
                    var checkState = row[names.checked];
                    if (checkState === undefined)
                        checkState = false;

                    that.rowinfo[key] = { selected: row[names.selected], checked: checkState, icon: row[names.icon], aggregate: row.aggregate, row: row, leaf: row[names.leaf], expanded: row[names.expanded] };
                }
                else {
                    if (that.rowinfo[key].checked === undefined) {
                        that.rowinfo[key].checked = row[names.checked];
                    }
                    if (that.rowinfo[key].icon === undefined) {
                        that.rowinfo[key].icon = row[names.icon];
                    }
                    if (that.rowinfo[key].aggregate === undefined) {
                        that.rowinfo[key].aggregate = row[names.aggregate];
                    }
                    if (that.rowinfo[key].row === undefined) {
                        that.rowinfo[key].row = row;
                    }
                    if (that.rowinfo[key].leaf === undefined) {
                        that.rowinfo[key].leaf = row[names.leaf];
                    }
                    if (that.rowinfo[key].expanded === undefined) {
                        that.rowinfo[key].expanded = row[names.expanded];
                    }
                }

                var info = that.rowinfo[key];
                info.row = row;
                if (row.originalRecord) {
                    info.originalRecord = row.originalRecord;
                }
                var start = 0;
                for (var j = 0; j < columnslength; j++) {
                    var column = that.columns.records[j];

                    if (column.pinned || (that.rtl && that.columns.records[columnslength - 1].pinned)) {
                        pinnedColumns = true;
                    }

                    var width = column.width;
                    if (width < column.minwidth) width = column.minwidth;
                    if (width > column.maxwidth) width = column.maxwidth;
                    width -= widthOffset;

                    if (width < 0) {
                        width = 0;
                    }

                    var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                    if (column.pinned) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-pinned');
                    }
                    if (that.sortcolumn === column.displayfield) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-sort');
                    }
                    if (that.altRows && i % 2 != 0) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-alt');
                    }
                    if (that.rtl) {
                        cellclass += ' ' + that.toTP('jqx-cell-rtl');
                    }

                    var colspan = "";
                    if (grouping > 0 && !isIE7 && !row.aggregate) {
                        if (row[names.level] < grouping) {
                            colspan += ' colspan="' + columnslength + '"';
                            var w = 0;
                            for (var t = 0; t < columnslength; t++) {
                                var c = that.columns.records[t];
                                if (c.hidden) continue;
                                var columnWidth = c.width;
                                if (columnWidth < c.minwidth) width = c.minwidth;
                                if (columnWidth > c.maxwidth) width = c.maxwidth;
                                columnWidth -= widthOffset;

                                if (columnWidth < 0) {
                                    columnWidth = 0;
                                }
                                w += columnWidth;
                            }
                            width = w;
                        }
                    }

                    var tablecolumn = '<td role="gridcell"' + colspan + ' style="max-width:' + width + 'px; width:' + width + 'px;';
                    var pinnedcolumn = '<td role="gridcell"' + colspan + ' style="pointer-events: none; visibility: hidden; border-color: transparent; max-width:' + width + 'px; width:' + width + 'px;';
                    if (j == columnslength - 1 && columnslength == 1) {
                        tablecolumn += 'border-right-color: transparent;'
                        pinnedcolumn += 'border-right-color: transparent;'
                    }

                    if (grouping > 0 && row[names.level] < grouping && !row.aggregate) {
                        if (that.rtl) {
                            cellclass += ' ' + that.toTP('jqx-right-align');
                        }
                    }
                    else {
                        if (column.cellsalign != "left") {
                            if (column.cellsalign === "right") {
                                cellclass += ' ' + that.toTP('jqx-right-align');
                            }
                            else {
                                cellclass += ' ' + that.toTP('jqx-center-align');
                            }
                        }
                    }

                    if (info) {
                        if (info.selected) {
                            if (that.editKey !== key) {
                                if (that.selectionMode !== "none") {
                                    cellclass += ' ' + that.toTP('jqx-grid-cell-selected');
                                    cellclass += ' ' + that.toTP('jqx-fill-state-pressed');
                                }
                            }
                        }
                        if (info.locked) {
                            cellclass += ' ' + that.toTP('jqx-grid-cell-locked');
                        }
                        if (info.aggregate) {
                            cellclass += ' ' + that.toTP('jqx-grid-cell-pinned');
                        }
                    }

                    if (!(column.hidden)) {
                        if (start == 0 && !that.rtl) {
                            tablecolumn += 'border-left-width: 0px;'
                            pinnedcolumn += 'border-left-width: 0px;'
                        }
                        else {
                            tablecolumn += 'border-right-width: 0px;'
                            pinnedcolumn += 'border-right-width: 0px;'
                        }
                        start++;
                        left += widthOffset + width;
                    }
                    else {
                        tablecolumn += 'display: none;'
                        pinnedcolumn += 'display: none;'
                        that._hiddencolumns = true;
                    }

                    if (column.pinned) {
                        tablecolumn += 'pointer-events: auto;'
                        pinnedcolumn += 'pointer-events: auto;'
                    }

                    var toggleButtonClass = "";

                    if ((that.source.hierarchy.length == 0 || (!row.records ||(row.records && row.records.length === 0))) && !this.virtualModeCreateRecords) {
                        info.leaf = true;
                    }
                    if (row.records && row.records.length > 0) {
                        info.leaf = false;
                    }

                    if (that.dataview.filters.length > 0) {
                        if (row.records && row.records.length > 0) {
                            var hasVisibleChildren = false;
                            for (var s = 0; s < row.records.length; s++) {
                                if (row.records[s]._visible !== false && row.records[s].aggregate == undefined) {
                                    hasVisibleChildren = true;
                                    break;
                                }
                            }
                            if (!hasVisibleChildren) {
                                info.leaf = true;
                            }
                            else {
                                info.leaf = false;
                            }
                        }
                    }

                    if (info && !info.leaf) {
                        if (info.expanded) {
                            toggleButtonClass += that.toTP("jqx-tree-grid-expand-button") + " ";
                            if (!that.rtl) {
                                toggleButtonClass += that.toTP('jqx-grid-group-expand');
                            }
                            else {
                                toggleButtonClass += that.toTP('jqx-grid-group-expand-rtl');
                            }
                            toggleButtonClass += " " + that.toTP('jqx-icon-arrow-down');
                        }
                        else {
                            toggleButtonClass += that.toTP("jqx-tree-grid-collapse-button") + " ";
                            if (!that.rtl) {
                                toggleButtonClass += that.toTP('jqx-grid-group-collapse');
                                toggleButtonClass += " " + that.toTP('jqx-icon-arrow-right');
                            }
                            else {
                                toggleButtonClass += that.toTP('jqx-grid-group-collapse-rtl');
                                toggleButtonClass += " " + that.toTP('jqx-icon-arrow-left');
                            }
                        }
                    }
                
                    if (!that.autoRowHeight || start === 1 || (that.autoRowHeight && !column.autoCellHeight)) {
                        cellclass += ' ' + that.toTP('jqx-grid-cell-nowrap');
                    }

                    var cellvalue = that._getcellvalue(column, info.row);
                    if (grouping > 0 && !row.aggregate) {
                        if (row[names.level] < grouping) {
                            cellvalue = row.label;
                        }
                    }

                    if (column.cellsFormat != '') {
                        if ($.jqx.dataFormat) {
                            if ($.jqx.dataFormat.isDate(cellvalue)) {
                                cellvalue = $.jqx.dataFormat.formatdate(cellvalue, column.cellsFormat, that.gridlocalization);
                            }
                            else if ($.jqx.dataFormat.isNumber(cellvalue) || (!isNaN(parseFloat(cellvalue)) && isFinite(cellvalue))) {
                                cellvalue = $.jqx.dataFormat.formatnumber(cellvalue, column.cellsFormat, that.gridlocalization);
                            }
                        }
                    }

                    if (column.cellclassname != '' && column.cellclassname) {
                        if (typeof column.cellclassname == "string") {
                            cellclass += ' ' + column.cellclassname;
                        }
                        else {
                            var customclassname = column.cellclassname(i, column.datafield, that._getcellvalue(column, info.row), info.row, cellvalue);
                            if (customclassname) {
                                cellclass += ' ' + customclassname;
                            }
                        }
                    }

                    if (column.cellsRenderer != '' && column.cellsRenderer) {
                        var newValue = column.cellsRenderer(key, column.datafield, that._getcellvalue(column, info.row), info.row, cellvalue);
                        if (newValue !== undefined) {
                            cellvalue = newValue;
                        }
                    }

                    if (info.aggregate) {
                        if (column.aggregates) {
                            var siblings = row.siblings.slice(0, row.siblings.length - 1);
                            var aggregates = that._calculateaggregate(column, null, true, siblings);
                            row[column.displayfield] = "";
                            if (aggregates) {
                                if (column.aggregatesRenderer) {
                                    if (aggregates) {
                                        var renderstring = column.aggregatesRenderer(aggregates[column.datafield], column, null, that.getcolumnaggregateddata(column.datafield, column.aggregates, false, siblings), "subAggregates");
                                        cellvalue = renderstring;
                                        row[column.displayfield] += name + ':' + aggregates[column.datafield] + "\n";
                                    }
                                }
                                else {
                                    cellvalue = "";
                                    row[column.displayfield] = "";
                                    $.each(aggregates, function () {
                                        var aggregate = this;
                                        for (obj in aggregate) {
                                            var name = obj;
                                            name = that._getaggregatename(name);
                                            var field = '<div style="position: relative; margin: 0px; overflow: hidden;">' + name + ':' + aggregate[obj] + '</div>';
                                            cellvalue += field;
                                            row[column.displayfield] += name + ':' + aggregate[obj] + "\n";
                                        }
                                    });
                                }
                            }
                            else cellvalue = "";
                        }
                    }

                    if ((start === 1 && !that.rtl) || (column == lastVisibleColumn && that.rtl) || (grouping > 0 && row[names.level] < grouping)) {
                        var indent = "";
                        var indentClass = that.toThemeProperty('jqx-tree-grid-indent');
                        var indentOffset = info.leaf ? 1 : 0;
                        for (var x = 0; x < row[names.level] + indentOffset; x++) {
                            indent += "<span class='" + indentClass + "'></span>";
                        }

                        var toggleButton = "<span class='" + toggleButtonClass + "'></span>";
                        var checkbox = "";
                        var icon = "";

                        if (this.checkboxes && !row.aggregate) {
                            var checkClassName = that.toThemeProperty('jqx-tree-grid-checkbox') + " " + indentClass + " " + that.toThemeProperty('jqx-checkbox-default') + " " + that.toThemeProperty('jqx-fill-state-normal') + " " + that.toThemeProperty('jqx-rc-all');
                            var hasCheckbox = true;
                            if ($.isFunction(this.checkboxes)) {
                                hasCheckbox = this.checkboxes(key, row);
                                if (hasCheckbox == undefined) {
                                    hasCheckbox = false;
                                }
                            }

                            if (hasCheckbox) {
                                if (info) {
                                    var checked = info.checked;
                                    if (this.hierarchicalCheckboxes == false && checked === null) {
                                        checked = false;
                                    }

                                    if (checked) {
                                        checkbox += "<span class='" + checkClassName + "'><div class='" + that.toThemeProperty('jqx-tree-grid-checkbox-tick') + " " + that.toThemeProperty('jqx-checkbox-check-checked') + "'></div></span>";
                                    }
                                    else if (checked === false) {
                                        checkbox += "<span class='" + checkClassName + "'></span>";
                                    }
                                    else {
                                        checkbox += "<span class='" + checkClassName + "'><div class='" + that.toThemeProperty('jqx-tree-grid-checkbox-tick') + " " + that.toThemeProperty('jqx-checkbox-check-indeterminate') + "'></div></span>";
                                    }
                                }
                                else {
                                    checkbox += "<span class='" + checkClassName + "'></span>";
                                }
                            }
                        }

                        if (this.icons && !row.aggregate) {
                            var iconClassName = that.toThemeProperty('jqx-tree-grid-icon') + " " + indentClass;
                            if (that.rtl) {
                                var iconClassName = that.toThemeProperty('jqx-tree-grid-icon') + " " + that.toThemeProperty('jqx-tree-grid-icon-rtl') + " " + indentClass;
                            }
                            var iconSizeClassName = that.toThemeProperty('jqx-tree-grid-icon-size') + " " + indentClass;
                            var hasIcon = info.icon;
                            if ($.isFunction(this.icons)) {
                                info.icon = this.icons(key, row);
                                if (info.icon) {
                                    hasIcon = true;
                                }
                            }
                            if (hasIcon) {
                                if (info.icon) {
                                    icon += "<span class='" + iconClassName + "'><img class='" + iconSizeClassName + "' src='" + info.icon + "'/></span>";
                                }
                                else {
                                    icon += "<span class='" + iconClassName + "'></span>";
                                }
                            }
                        }

                        var titleCSSClass = that.autoRowHeight && start === 1  && column.autoCellHeight ? ' ' + that.toTP('jqx-grid-cell-wrap') : '';
                        var newCellValue = indent + toggleButton + checkbox + icon + "<span class='" + that.toThemeProperty('jqx-tree-grid-title') + titleCSSClass + "'>" + cellvalue + "</span>";
                        if (!that.rtl) {
                            cellvalue = newCellValue;
                        }
                        else {
                            cellvalue = "<span class='" + that.toThemeProperty('jqx-tree-grid-title') + titleCSSClass + "'>" + cellvalue + "</span>" + icon + checkbox + toggleButton + indent;
                        }
                    }

                    if (grouping > 0 && isIE7 && j >= grouping) {
                        if (row[names.level] < grouping) {
                            tablecolumn += 'padding-left: 5px; border-left-width: 0px;'
                            pinnedcolumn += 'padding-left: 5px; border-left-width: 0px;'
                            cellvalue = "<span style='visibility: hidden;'>-</span>";
                        }
                    }

                    tablecolumn += '" class="' + cellclass + '">';
                    tablecolumn += cellvalue;
                    tablecolumn += '</td>';

                    pinnedcolumn += '" class="' + cellclass + '">';
                    pinnedcolumn += cellvalue;
                    pinnedcolumn += '</td>';

                    if (!column.pinned) {
                        tablerow += tablecolumn;
                        if (pinnedColumns) {
                            pinnedtablerow += pinnedcolumn;
                        }
                    }
                    else {
                        pinnedtablerow += tablecolumn;
                        tablerow += tablecolumn;
                    }

                    if (grouping > 0 && !isIE7) {
                        if (row[names.level] < grouping && !row.aggregate) {
                            break;
                        }
                    }
                }

                if (tablewidth == 0) {
                    that.table[0].style.width = left + 2 + 'px';
                    tablewidth = left;
                }

                tablerow += '</tr>';
                pinnedtablerow += '</tr>';
                tableHTML += tablerow;
                pinnedTableHTML += pinnedtablerow;
                if (that.rowDetails && !row.aggregate && this.rowDetailsRenderer) {
                    var details = '<tr data-role="row-details"><td valign="top" align="left" style="pointer-events: auto; max-width:' + width + 'px; width:' + width + 'px; overflow: hidden; border-left: none; border-right: none;" colspan="' + that.columns.records.length + '" role="gridcell"';
                    var cellclass = that.toTP('jqx-cell') + " " + that.toTP('jqx-grid-cell') + " " + that.toTP('jqx-item');
                    cellclass += ' ' + that.toTP('jqx-details');
                    cellclass += ' ' + that.toTP('jqx-reset');
                    var rowDetails = this.rowDetailsRenderer(key, row);
                    if (rowDetails) {
                        details += '" class="' + cellclass + '"><div style="pointer-events: auto; overflow: hidden;"><div data-role="details">' + rowDetails + '</div></div></td></tr>';
                        tableHTML += details;
                        pinnedTableHTML += details;
                    }
                }
            }
            tableHTML += '</table>';
            pinnedTableHTML += '</table>';

            if (pinnedColumns) {
                if (that.WinJS) {
                    MSApp.execUnsafeLocalFunction(function () {
                        that.table.html(pinnedTableHTML + tableHTML);
                    });
                }
                else {
                    that.table[0].innerHTML = pinnedTableHTML + tableHTML;
                }

                var t2 = that.table.find("#table" + that.element.id);
                var t1 = that.table.find("#pinnedtable" + that.element.id);

                t1.css('float', 'left');
                t1.css('pointer-events', 'none');
                t2.css('float', 'left');
                t1[0].style.position = "absolute";
                t2[0].style.position = "relative";
                t2[0].style.zIndex = zindex - 10;
                t1[0].style.zIndex = zindex + 10;
                that._table = t2;
                that._table[0].style.left = "0px";
                that._pinnedTable = t1;
                if (isIE7) {
                    t1[0].style.left = "0px";
                }
                that._table[0].style.width = tablewidth + 'px';
                that._pinnedTable[0].style.width = tablewidth + 'px';
                if (that.rtl && that._haspinned) {
                    that._pinnedTable[0].style.left = 3 - tablewidth + parseInt(that.element.style.width) + 'px';
                }
            }
            else {
                if (that.WinJS) {
                    MSApp.execUnsafeLocalFunction(function () {
                        that.table.html(tableHTML);
                    });
                }
                else {
                    that.table[0].innerHTML = tableHTML;
                }
                var t = that.table.find("#table" + that.element.id);
                that._table = t;
                if ($.jqx.browser.msie && $.jqx.browser.version < 10) {
                    that._table[0].style.width = tablewidth + 'px';
                }
                if (pagesize === 0) {
                    that._table[0].style.width = (2 + tablewidth) + 'px';
                }
            }
            if (pagesize === 0) {
                that._table[0].style.tableLayout = "auto";
                if (that._pinnedTable) {
                    that._pinnedTable[0].style.tableLayout = "auto";
                }
            }

            if (that.showAggregates) {
                that._updatecolumnsaggregates();
            }

            if (that._loading && pagesize == 0) {
                that._arrange();
                this._showLoadElement();
            }

            if (that.rendered) {
                that.rendered();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (object.isInitialized == undefined || object.isInitialized == false)
                return;
            if (key == "pageSizeMode" || key == "hierarchicalCheckboxes") {
                object._renderrows();
            }
        },

        checkRow: function (key, refresh, owner) {
            var that = this.base;
            var names = that._names();
            if (that._loading) {
                return;
            }

            var rowInfo = that.rowinfo[key];
            if (rowInfo) {
                rowInfo.checked = true;
                rowInfo.row[names.checked] = true;
                if (rowInfo.originalRecord) {
                    rowInfo.originalRecord[names.checked] = true;
                }
                if (owner == undefined && this.hierarchicalCheckboxes) {
                    this.checkRows(rowInfo.row, rowInfo.row);
                }
                if (refresh !== false) {
                    that._renderrows();
                }
                that._raiseEvent('rowCheck', { key: key, row: rowInfo.row });
            }
            else {
                var row = this.getRow(key);
                if (row) {
                    that.rowinfo[key] = { row: row, checked: true }
                    that.rowinfo[key].row[names.checked] = true;
                    if (row.originalRecord) {
                        that.rowinfo[key].originalRecord = row.originalRecord;
                    }
                    that._raiseEvent('rowCheck', { key: key, row: row });
                    if (owner == undefined && this.hierarchicalCheckboxes) {
                        this.checkRows(row, row);
                    }
                    if (refresh !== false) {
                        that._renderrows();
                    }
                }
            }
        },

        checkRows: function (record, baseRecord) {
            var that = this.base;
            var me = this;
            var names = that._names();

            var getChildRecords = function (record) {
                var records = new Array();

                var nextLevel = function (children) {
                    for (var i = 0; i < children.length; i++) {
                        records.push(children[i]);
                        if (children[i].records) {
                            nextLevel(children[i].records);
                        }
                    }
                }
                if (record.records) {
                    nextLevel(record.records);
                }
                return records;
            }

            if (record != null) {
                var count = 0;
                var hasIndeterminate = false;
                var recordsCount = 0;
              
                var traverseChildren = function (records) {
                    for (var i = 0; i < records.length; i++) {
                        var checked = records[i][names.checked];
                        if (checked === undefined) checked = false;
                        if (checked != false) {
                            if (records[i][names.checked] == null) {
                                hasIndeterminate = true;
                            }
                            if (records[i].records) {
                                traverseChildren(records[i].records);
                            }
                            count++;
                        }
                        recordsCount++;
                    }
                }
                if (record.records) {
                    traverseChildren(record.records);
                }
                if (record != baseRecord) {
                    if (count == recordsCount) {
                        this.checkRow(record.uid, false, 'tree');
                    }
                    else {
                        if (count > 0) {
                            this.indeterminateRow(record.uid, false, 'tree');
                        }
                        else this.uncheckRow(record.uid, false, 'tree');

                    }
                }
                else {
                    var checked = baseRecord[names.checked];
                    var childrecords = getChildRecords(baseRecord);
                    $.each(childrecords, function () {
                        if (checked === true) {
                            me.checkRow(this.uid, false, 'tree');
                        }
                        else if (checked === false) {
                            me.uncheckRow(this.uid, false, 'tree');
                        }
                        else {
                            me.indeterminateRow(this.uid, false, 'tree');
                        }

                    });
                }

                var row = record[names.parent] ? record[names.parent]: null;
                this.checkRows(row, baseRecord);
            }
            else {
                var checked = baseRecord[names.checked];
                var childrecords = getChildRecords(baseRecord);
                $.each(childrecords, function () {
                    if (checked === true) {
                        me.checkRow(this.uid, false, 'tree');
                    }
                    else if (checked === false) {
                        me.uncheckRow(this.uid, false, 'tree');
                    }
                    else me.indeterminateRow(this.uid, false, 'tree');
                });
            }
        },

        indeterminateRow: function(key, refresh, owner)
        {
            var that = this.base;
            var names = that._names();
            if (that._loading) {
                return;
            }

            var me = this;
            var rowInfo = that.rowinfo[key];
            if (rowInfo) {
                rowInfo.checked = null;
                rowInfo.row[names.checked] = null;
                if (rowInfo.originalRecord) {
                    rowInfo.originalRecord[names.checked] = null;
                }
                if (owner == undefined && this.hierarchicalCheckboxes) {
                    this.checkRows(rowInfo.row, rowInfo.row);
                }
                if (refresh !== false) {
                    that._renderrows();
                }
            }
            else {
                var row = this.getRow(key);
                if (row) {
                    that.rowinfo[key] = { row: row, checked: null }
                    that.rowinfo[key].row[names.checked] = null;
                    if (row.originalRecord) {
                        that.rowinfo[key].originalRecord = row.originalRecord;
                    }
                    if (owner == undefined && this.hierarchicalCheckboxes) {
                        this.checkRows(row, row);
                    }
                    if (refresh !== false) {
                        that._renderrows();
                    }
                }
            }
        },

        uncheckRow: function (key, refresh, owner) {
            var that = this.base;
            var names = that._names();
            if (that._loading) {
                return;
            }

            var me = this;
            var rowInfo = that.rowinfo[key];
            if (rowInfo) {
                rowInfo.checked = false;
                rowInfo.row[names.checked] = false;
                if (rowInfo.originalRecord) {
                    rowInfo.originalRecord[names.checked] = false;
                }
                if (owner == undefined && this.hierarchicalCheckboxes) {
                    this.checkRows(rowInfo.row, rowInfo.row);
                }
                if (refresh !== false) {
                    that._renderrows();
                }
                that._raiseEvent('rowUncheck', { key: key, row: rowInfo.row });
            }
            else {
                var row = this.getRow(key);
                if (row) {
                    that.rowinfo[key] = { row: row, checked: false }
                    that.rowinfo[key].row[names.checked] = false;
                    if (row.originalRecord) {
                        that.rowinfo[key].originalRecord = row.originalRecord;
                    }
                    that._raiseEvent('rowUncheck', { key: key, row: row });
                    if (owner == undefined && this.hierarchicalCheckboxes) {
                        this.checkRows(row, row);
                    }
                    if (refresh !== false) {
                        that._renderrows();
                    }
                }
            }
        },

        expandRows: function (records) {
            var that = this;

            if (!records)
                return;

            if (that.virtualModeCreateRecords) {
                $.each(records, function () {
                    var record = this;
                    var callback = function () {
                        that.base._loading = false;
                        that.expandRows(record.records);
                    }

                    that.base._loading = false;
                    that.expandRow(record.uid, callback);
                });
            }
            else {
                for (var i = 0; i < records.length; i++) {
                    var record = records[i];
                    that.expandRow(record.uid);
                    that.expandRows(record.records);
                }
            }
        },

        collapseRows: function (records) {
            if (!records)
                return;

            for (var i = 0; i < records.length; i++) {
                this.collapseRow(records[i].uid);
                this.collapseRows(records[i].records);
            }
        },

        expandAll: function()
        {
            var that = this.base;
            that.beginUpdate();
            this.expandRows(this.getRows());
            that.endUpdate();
        },

        collapseAll: function () {
            var that = this.base;
            that.beginUpdate();
            this.collapseRows(this.getRows());
            that.endUpdate();
        },

        expandRow: function (key, callback) {
            var that = this.base;
            if (that._loading) {
                return;
            }

            var names = that._names();
            var me = this;
            var rowInfo = that.rowinfo[key];
            if (!rowInfo) {
                var row = this.getRow(key);
                if (row) {
                    that.rowinfo[key] = { row: row };
                    if (row.originalRecord) {
                        that.rowinfo[key].originalRecord = row.originalRecord;
                    }
                    rowInfo = that.rowinfo[key];
                }
            }

            if (rowInfo) {
                if (rowInfo.expanded) {
                    rowInfo.row[names.expanded] = true;
                    return;
                }
                rowInfo.expanded = true;
                rowInfo.row[names.expanded] = true;
                if (rowInfo.originalRecord) {
                    rowInfo.originalRecord[names.expanded] = true;
                }

                if (this.virtualModeCreateRecords && !rowInfo.row._loadedOnDemand) {
                    var done = function (records) {
                        rowInfo.row._loadedOnDemand = true;
                        if (records === false) {
                            that._loading = false;
                            me._hideLoadElement();
                            rowInfo.leaf = true;
                            rowInfo.row[names.leaf] = true;
                            that._renderrows();
                            if (callback)
                                callback();
                            return;
                        }

                        for (var i = 0; i < records.length; i++) {
                            records[i][names.level] = rowInfo.row[names.level] + 1;
                            records[i][names.parent] = rowInfo.row;
                            if (that.rowsByKey[records[i].uid]) {
                                that._loading = false;
                                me._hideLoadElement();
                                rowInfo.leaf = true;
                                rowInfo.row[names.leaf] = true;
                                that._renderrows();
                                if (callback)
                                    callback();
                                throw new Error("Please, check whether you Add Records with unique ID/Key. ");
                            }

                            that.rowsByKey[records[i].uid] = records[i];
                            me.virtualModeRecordCreating(records[i]);
                        }
                        if (!rowInfo.row.records) {
                            rowInfo.row.records = records;
                        }
                        else {
                            rowInfo.row.records = rowInfo.row.records.concat(records);
                        }

                        if ((!records) || (records && records.length == 0)) {
                            rowInfo.leaf = true;
                            rowInfo.row[names.leaf] = true;
                        }
                        if (rowInfo.originalRecord) {
                            rowInfo.originalRecord.records = records;
                            rowInfo.originalRecord[names.expanded] = true;
                            if (records.length == 0) {
                                rowInfo.originalRecord[names.leaf] = true;
                            }
                        }

                        that._loading = false;
                        me._hideLoadElement();
                        var vScroll = that.vScrollBar.css('visibility');
                        that._renderrows();
                        that._updateScrollbars();
                        var requiresRefresh = vScroll != that.vScrollBar.css('visibility');
                        if (that.height === "auto" || that.height === null || that.autoheight || requiresRefresh) {
                            that._arrange();
                        }
                        that._renderhorizontalscroll();
                        if (callback)
                            callback();
                    }
                    if (!rowInfo.row[names.leaf]) {
                        that._loading = true;
                        this._showLoadElement();
                        this.virtualModeCreateRecords(rowInfo.row, done);
                        return;
                    }
                }

                if (!that.updating()) {
                    var vScroll = that.vScrollBar.css('visibility');
                    that._renderrows();
                    that._updateScrollbars();
                    var requiresRefresh = vScroll != that.vScrollBar.css('visibility');
                    if (that.height === "auto" || that.height === null || that.autoheight || requiresRefresh) {
                        that._arrange();
                    }
                    that._renderhorizontalscroll();
                    that._raiseEvent('rowExpand', { row: rowInfo.row, key: key });
                }
            }
        },

        collapseRow: function (key) {
            var that = this.base;
            var names = that._names();
            if (that._loading) {
                return;
            }
            var rowInfo = that.rowinfo[key];
            if (!rowInfo) {
                var row = this.getRow(key);
                if (row) {
                    that.rowinfo[key] = { row: row };
                    if (row.originalRecord) {
                        that.rowinfo[key].originalRecord = row.originalRecord;
                    }
                    rowInfo = that.rowinfo[key];
                }
            }
            if (rowInfo) {
                if (!rowInfo.expanded) {
                    rowInfo.row[names.expanded] = false;
                    return;
                }
                rowInfo.expanded = false;
                rowInfo.row[names.expanded] = false;
                if (rowInfo.originalRecord) {
                    rowInfo.originalRecord[names.expanded] = false;
                }
                if (!that.updating()) {
                    var vScroll = that.vScrollBar.css('visibility');
                    that._renderrows();
                    that._updateScrollbars();
                    var requiresRefresh = vScroll != that.vScrollBar.css('visibility');
                    if (that.height === "auto" || that.height === null || that.autoheight || requiresRefresh) {
                        that._arrange();
                    }
                    that._renderhorizontalscroll();
                    that._raiseEvent('rowCollapse', { row: rowInfo.row, key: key });
                }
            }
        }


    });
})(jqxBaseFramework);
