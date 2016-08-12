/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {
    $.extend($.jqx._jqxGrid.prototype, {
        savestate: function (options) {
            var state = this.getstate();

            if (options !== undefined && !$.isEmptyObject(options)) {
                if (options.indexOf('sort') == -1) {
                    delete state.sortcolumn;
                    delete state.sortdirection;
                }
                if (options.indexOf('pager') == -1) {
                    delete state.pagenum;
                    delete state.pagesizeoptions;
                    delete state.pagesize;
                }
                if (options.indexOf('selection') == -1) {
                    delete state.selectedcells;
                    delete state.selectedrowindexes;
                    delete state.selectedrowindex;
                }
                if (options.indexOf('grouping') == -1) {
                    delete state.groups;
                }
                if (options.indexOf('filter') == -1) {
                    delete state.filters;
                }
                $.each(this.columns.records, function (index) {
                    var column_state = state.columns[this.datafield];
                    if (options.indexOf('hidden_columns') == -1) {
                        delete column_state.hidden;
                    }
                    if (options.indexOf('reorder') == -1) {
                        delete column_state.index;
                    }
                    if (options.indexOf('columns_width') == -1) {
                        delete column_state.width;
                    }
                    if (options.indexOf('columns_text') == -1) {
                        delete column_state.text;
                    }
                    if (options.indexOf('alignment') == -1) {
                        delete column_state.align;
                        delete column_state.cellsalign;
                    }
                });
            }

            if (window.localStorage) {
                window.localStorage["jqxGrid" + this.element.id] = this._stringify(state);
            }
            this._savedstate = state;
            return state;
        },

        loadstate: function (gridstate, binding) {
            var state = "";
            if (gridstate != undefined && gridstate.width != undefined) {
                state = gridstate;
            }
            else if (window.localStorage) {
                var hasState = window.localStorage["jqxGrid" + this.element.id];
                if (hasState) {
                    var state = $.parseJSON(window.localStorage["jqxGrid" + this.element.id]);
                }
            }
            else if (this._savedstate) {
                var state = this._savedstate;
            }
            if (state != null && state !== "") {
                if (this.virtualmode || (this.source._source.url && this.source._source.url != "")) {
                    this.source.beginUpdate();
                }
                var data = state;
                if (data.width !== undefined) {
                    this.width = data.width;
                }
                if (data.height !== undefined) {
                    this.height = data.height;
                }
                if (this.pageable) {
                    if (data.pagesize != undefined) {
                        this.pagesize = data.pagesize;
                        this.dataview.pagesize = data.pagesize;
                    }
                    if (data.pagenum != undefined) {
                        this.dataview.pagenum = data.pagenum;
                    }
                    if (data.pagesizeoptions != undefined) {
                        this.pagesizeoptions = data.pagesizeoptions;
                    }
                    if (this.pagesizeoptions) {
                        var selectedindex = 0;

                        for (var i = 0; i < this.pagesizeoptions.length; i++) {
                            if (this.pagesize >= this.pagesizeoptions[i]) {
                                selectedindex = i;
                            }
                        }
                        if (this.pagershowrowscombo) {
                            this.pagershowrowscombo.jqxDropDownList({ selectedIndex: selectedindex });
                        }
                    }
                }
                if (this.sortable) {
                    if (this._loading) this._loading = false;
                    if (data.sortdirection) {
                        if (data.sortdirection.ascending || data.sortdirection.descending) {
                            this.dataview.sortfield = data.sortcolumn;
                            var direction = data.sortdirection.ascending ? 'asc' : 'desc';
                            this.dataview.sortfielddirection = direction;
                            this.source.sortcolumn = data.sortcolumn;
                            this.source.sortdirection = direction;
                            this.sortby(data.sortcolumn, direction);
                        }
                    }
                    else if (this.dataview.sortfield != null && (this.dataview.sortfielddirection == 'asc' || this.dataview.sortfielddirection == 'desc')) {
                        this.sortby(this.dataview.sortfield, null);
                    }
                }
                if (this.groupable && data.groups) {
                    this.dataview.groups = data.groups;
                    this.groups = data.groups;
                }
                this.loadingstate = true;
                if (this.virtualsizeinfo) {
                    this._loadselectionandcolumnwidths(data);
                }
                this.loadingstate = false;
                if (this.virtualmode || (this.source._source.url && this.source._source.url != "")) {
                    if (binding == true) {
                        this.source.endUpdate(false);
                    }
                    else {
                        this.source.endUpdate(false);
                        if (this.virtualmode || this.source._source.filter || this.source._source.sort) {
                            this.updatebounddata("state");
                        }
                    }
                }
            }
        },

        _loadselectionandcolumnwidths: function (gridstate) {
            this.loadingstate = true;
            var state = "";

            if (gridstate != undefined && gridstate.width != undefined) {
                state = gridstate;
            }
            else if (window.localStorage) {
                if (window.localStorage["jqxGrid" + this.element.id]) {
                    var state = $.parseJSON(window.localStorage["jqxGrid" + this.element.id]);
                }
            }
            else if (this._savedstate) {
                var state = this._savedstate;
            }
            if (state != null && state != "") {
                var _tmploading = this._loading;
                this._loading = false;

                var data = state;
                var me = this;
                var requiresRender = false;
                var columnstomove = [];
                columnstomove.length = 0;
                var columnstomoveindexes = [];
                $.each(this.columns.records, function (index) {
                    var savedColumn = data.columns[this.datafield];
                    if (savedColumn != undefined) {
                        if (this.text != savedColumn.text) {
                            requiresRender = true;
                        }
                        if (this.hidden != savedColumn.hidden) {
                            requiresRender = true;
                        }

                        if (savedColumn.width !== undefined) {
                            this.width = savedColumn.width;
                            if (this._width) {
                                this._width = null;
                            }
                            if (this._percentagewidth) {
                                this._percentagewidth = null;
                            }
                        }
                        if (savedColumn.hidden !== undefined) {
                            this.hidden = savedColumn.hidden;
                        }
                        if (savedColumn.pinned !== undefined) {
                            this.pinned = savedColumn.pinned;
                        }
                        if (savedColumn.groupable !== undefined) {
                            this.groupable = savedColumn.groupable;
                        }
                        if (savedColumn.resizable !== undefined) {
                            this.resizable = savedColumn.resizable;
                        }
                        this.draggable = savedColumn.draggable;
                        if (savedColumn.text !== undefined) {
                            this.text = savedColumn.text;
                        }
                        if (savedColumn.align !== undefined) {
                            this.align = savedColumn.align;
                        }
                        if (savedColumn.cellsalign !== undefined) {
                            this.cellsalign = savedColumn.cellsalign;
                        }
                        if (me._columns) {
                            for (var j = 0; j < me._columns.length; j++) {
                                if (me._columns[j].datafield == this.datafield) {
                                    if (savedColumn.hidden !== undefined) {
                                        me._columns[j]["hidden"] = savedColumn.hidden;
                                    }
                                    if (savedColumn.width !== undefined) {
                                        me._columns[j]["width"] = savedColumn.width;
                                    }
                                }
                            }
                        }

                        if (savedColumn.index !== undefined) {
                            columnstomove[this.datafield] = savedColumn.index;
                            columnstomove.length++;
                        }
                    }
                });

                if (columnstomove.length > 0) {
                    if (this.setcolumnindex) {
                        var groupingcolumnscount = this.rowdetails ? 1 : 0;
                        groupingcolumnscount += this.groupable ? this.groups.length : 0;

                        var columnsRecords = new Array();
                        for (var i = 0; i < this.columns.records.length; i++) {
                            columnsRecords.push(this.columns.records[i]);
                        }

                        var groupedcolumns = 0;
                        var moveOrder = new Array();
                        for (var i = 0; i < columnsRecords.length; i++) {
                            var column = columnsRecords[i];
                            var index = columnstomove[column.datafield];

                            if (this.groupable && column.grouped) {
                                groupedcolumns++;
                                continue;
                            }
                            if (i == 0 && this.rowdetails) {
                                groupedcolumns++;
                                continue;
                            }

                            if (i !== index || this.groupable || this.rowdetails) {
                                var colindex = groupedcolumns + index;
                                moveOrder.push({column:column, key: colindex});
                            }
                        }

                        moveOrder.sort(function (value1, value2) {                            
                            if (value1.key < value2.key) { return -1; }
                            if (value1.key > value2.key) { return 1; }
                            return 0;
                        });
                        moveOrder.reverse();

                        $.each(moveOrder, function (index, value) {
                            var columnIndex = this.key
                            me.setcolumnindex(this.column.datafield, columnIndex, false);
                        });
                    }
                    this.prerenderrequired = true;
                    if (this.groupable) {
                        this._refreshdataview();
                    }
                    this.rendergridcontent(true);
   
                    if (this._updatefilterrowui && this.filterable && this.showfilterrow) {
                        this._updatefilterrowui();
                    }
                    this._renderrows(this.virtualsizeinfo);
                }

                if (this.filterable && data.filters !== undefined) {
                    if (this.clearfilters) {
                        this._loading = false;
                        this.clearfilters(false);
                    }
                    var oldcolumn = "";
                    var filtergroup = new $.jqx.filter();
                    for (var i = 0; i < data.filters.filterscount; i++) {
                        var condition = data.filters['filtercondition' + i];
                        var datafield = data.filters['filterdatafield' + i];
                        var column = this.getcolumn(datafield);
                        if (datafield != oldcolumn) {
                            filtergroup = new $.jqx.filter();
                        }

                        oldcolumn = datafield;
                        if (column && column.filterable) {
                            var value = data.filters['filtervalue' + i];
                            var operator = data.filters['filteroperator' + i];
                            var filtertype = data.filters['filtertype' + i];
                            if (filtertype == "datefilter") {
                                var filter = filtergroup.createfilter(filtertype, value, condition, null, column.cellsformat, this.gridlocalization);
                            }
                            else {
                                var filter = filtergroup.createfilter(filtertype, value, condition);
                            }
                            filtergroup.addfilter(operator, filter);

                            if (this.showfilterrow) {
                                var widget = column._filterwidget;
                                var tablecolumn = column._filterwidget.parent();
                                if (widget != null) {
                                    switch (column.filtertype) {
                                        case 'number':
                                            tablecolumn.find('input').val(value);
                                            if (this.host.jqxDropDownList) {
                                                var conditions = filtergroup.getoperatorsbyfiltertype('numericfilter');
                                                widget.find('.filter').jqxDropDownList('selectIndex', conditions.indexOf(condition));
                                            }
                                            break;
                                        case 'date':
                                            if (this.host.jqxDateTimeInput) {
                                                $(tablecolumn.children()[0]).jqxDateTimeInput('setDate', value);
                                            }
                                            else widget.val(value);
                                            break;
                                        case 'range':
                                            if (this.host.jqxDateTimeInput) {
                                                var value2 = data.filters['filtervalue' + (i + 1)];
                                                var filtertype = data.filters['filtertype' + i];
                                                var filter = filtergroup.createfilter(filtertype, value2, "LESS_THAN_OR_EQUAL");
                                                filtergroup.addfilter(operator, filter);

                                                var from = new Date(value);
                                                var to = new Date(value2);
                                                if (isNaN(from)) {
                                                    from = $.jqx.dataFormat.tryparsedate(value);
                                                }
                                                if (isNaN(to)) {
                                                    to = $.jqx.dataFormat.tryparsedate(value);
                                                }

                                                $(tablecolumn.children()[0]).jqxDateTimeInput('setRange', from, to);
                                                i++;
                                            }
                                            else widget.val(value);
                                            break;
                                        case 'textbox':
                                        case 'default':
                                            widget.val(value);
                                            me["_oldWriteText" + widget[0].id] = value;
                                            break;
                                        case 'list':
                                            if (this.host.jqxDropDownList) {
                                                var items = $(tablecolumn.children()[0]).jqxDropDownList('getItems');
                                                var index = -1;
                                                $.each(items, function (i) {
                                                    if (this.value == value) {
                                                        index = i;
                                                        return false;
                                                    }
                                                });

                                                $(tablecolumn.children()[0]).jqxDropDownList('selectIndex', index);
                                            }
                                            else widget.val(value);
                                            break;
                                        case 'checkedlist':
                                            if (!this.host.jqxDropDownList) {
                                                widget.val(value);
                                            }
                                            break;
                                        case 'bool':
                                        case 'boolean':
                                            if (!this.host.jqxCheckBox) {
                                                widget.val(value);
                                            }
                                            else $(tablecolumn.children()[0]).jqxCheckBox({ checked: value });
                                            break;
                                    }
                                }
                            }
                            this.addfilter(datafield, filtergroup);
                        }
                    }
                    if (data.filters && data.filters.filterscount > 0) {
                        this.applyfilters();
                        if (this.showfilterrow) {
                            $.each(this.columns.records, function () {
                                if (this.filtertype == 'checkedlist' && this.filterable) {
                                    if (me.host.jqxDropDownList) {
                                        var column = this;
                                        var dropdownlist = column._filterwidget;
                                        var dropdownitems = dropdownlist.jqxDropDownList('getItems');
                                        var listbox = dropdownlist.jqxDropDownList('listBox');
                                        listbox.checkAll(false);
                                        if (column.filter) {
                                            listbox.uncheckAll(false);
                                            var filters = column.filter.getfilters();

                                            for (var i = 0; i < listbox.items.length; i++) {
                                                var label = listbox.items[i].label;
                                                $.each(filters, function () {
                                                    if (this.condition == "NOT_EQUAL") return true;
                                                    if (label == this.value) {
                                                        listbox.checkIndex(i, false, false);
                                                    }
                                                });
                                            }
                                            listbox._updateCheckedItems();
                                            var checkedItemsLength = listbox.getCheckedItems().length;
                                            if (listbox.items.length != checkedItemsLength && checkedItemsLength > 0) {
                                                listbox.host.jqxListBox('indeterminateIndex', 0, true, false);
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    }

                    if (this.pageable && data.pagenum !== undefined) {
                        if (this.gotopage && !this.virtualmode) {
                            this.dataview.pagenum = -1;
                            this.gotopage(data.pagenum);
                        }
                        else if (this.gotopage && this.virtualmode) {
                            this.gotopage(data.pagenum);
                        }
                    }
                }

                if (data.selectedrowindexes && data.selectedrowindexes && data.selectedrowindexes.length > 0) {
                    this.selectedrowindexes = data.selectedrowindexes;
                    this.selectedrowindex = data.selectedrowindex;
                    if (this.selectionmode === "checkbox") {
                        this._updatecheckboxselection();
                    }
                }
                if (data.selectedcells) {
                    if (this._applycellselection) {
                        $.each(data.selectedcells, function () {
                            me._applycellselection(this.rowindex, this.datafield, true, false);
                        });
                    }
                }

                if (this.groupable && data.groups !== undefined) {
                    this._refreshdataview();
                    this.render();
                    this._loading = _tmploading;
                    this.loadingstate = false;

                    return;
                }

                if (requiresRender) {
                    this.prerenderrequired = true;
                    this.rendergridcontent(true);
                    this._loading = _tmploading;
                    this.loadingstate = false;
                    if (this.updating()) {
                        return false;
                    }
                }
                else {
                    this._loading = _tmploading;
                    this._updatecolumnwidths();
                    this._updatecellwidths();
                    this.loadingstate = false;
                }

                this.loadingstate = false;
                this._loading = _tmploading;
                this._renderrows(this.virtualsizeinfo);
            }
            this.loadingstate = false;
        },

        getstate: function () {
            var datainfo = this.getdatainformation();
            var data = {};
            data.width = this.width;
            data.height = this.height;
            data.pagenum = datainfo.paginginformation.pagenum;
            data.pagesize = datainfo.paginginformation.pagesize;
            data.pagesizeoptions = this.pagesizeoptions;
            data.sortcolumn = datainfo.sortinformation.sortcolumn;
            data.sortdirection = datainfo.sortinformation.sortdirection;
            if (this.selectionmode != null) {
                if (this.getselectedcells) {
                    if (this.selectionmode.toString().indexOf('cell') != -1) {
                        var selectedcells = this.getselectedcells();
                        var cells = new Array();
                        $.each(selectedcells, function () {
                            cells.push({ datafield: this.datafield, rowindex: this.rowindex });
                        });
                        data.selectedcells = cells;
                    }
                    else {
                        var selectedrowindexes = this.getselectedrowindexes();
                        data.selectedrowindexes = selectedrowindexes;
                        data.selectedrowindex = this.selectedrowindex;
                    }
                }
            }
            var postdata = {};
            var filterslength = 0;
            if (this.dataview.filters) {
                for (var x = 0; x < this.dataview.filters.length; x++) {
                    var filterdatafield = this.dataview.filters[x].datafield;
                    var filter = this.dataview.filters[x].filter;
                    var filters = filter.getfilters();
                    postdata[filterdatafield + "operator"] = filter.operator;
                    for (var m = 0; m < filters.length; m++) {
                        filters[m].datafield = filterdatafield;
                        if (filters[m].type == "datefilter") {
                            if (filters[m].value && filters[m].value.toLocaleString) {
                                var column = this.getcolumn(filters[m].datafield);
                                if (column.cellsformat) {
                                    var value = this.source.formatDate(filters[m].value, column.cellsformat, this.gridlocalization);
                                    if (value) {
                                        postdata["filtervalue" + filterslength] = value;
                                    }
                                    else {
                                        postdata["filtervalue" + filterslength] = filters[m].value.toLocaleString();
                                    }
                                }
                                else {
                                    postdata["filtervalue" + filterslength] = filters[m].value.toLocaleString();
                                }
                            }
                            else {
                                postdata["filtervalue" + filterslength] = filters[m].value;
                            }
                        }
                        else {
                            postdata["filtervalue" + filterslength] = filters[m].value;
                        }
                        postdata["filtercondition" + filterslength] = filters[m].condition;
                        postdata["filteroperator" + filterslength] = filters[m].operator;
                        postdata["filterdatafield" + filterslength] = filterdatafield;
                        postdata["filtertype" + filterslength] = filters[m].type;

                        filterslength++;
                    }
                }
            }
            postdata.filterscount = filterslength;
            data.filters = postdata;
            data.groups = this.groups;
            //if (this.groupable && this.groups.length > 0) {
            //    var me = this;
            //    var groupstates = [];
            //    $.each(this.dataview.loadedgroups, function () {
            //        var groupstate = me._findgroupstate(this.uniqueid);
            //        groupstates[this.group] = groupstate;
            //    });
            //    data.groupstates = groupstates;
            //}

            data.columns = {};
            var columnindex = 0;
            if (this.columns.records) {
                $.each(this.columns.records, function (index, value) {
                    if (!this.datafield) {
                        return true;
                    }

                    var columndata = {};
                    columndata.width = this.width;
                    columndata.hidden = this.hidden;
                    columndata.pinned = this.pinned;
                    columndata.groupable = this.groupable;
                    columndata.resizable = this.resizable;
                    columndata.draggable = this.draggable;
                    columndata.text = this.text;
                    columndata.align = this.align;
                    columndata.cellsalign = this.cellsalign;
                    columndata.index = columnindex++;
                    data.columns[this.datafield] = columndata;
                });
            }
            return data;
        },

        _stringify: function (value) {
            if (window.JSON && typeof window.JSON.stringify === 'function') {
                var me = this;
                var json = "";
                try {
                    json = window.JSON.stringify(value);
                }
                catch (error) {
                    return me._str("", { "": value })
                }
                return json;
            }

            var json = this._str("", { "": value })
            return json;
        },

        _quote: function (string) {
            var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
            meta = {
                '\b': '\\b',
                '\t': '\\t',
                '\n': '\\n',
                '\f': '\\f',
                '\r': '\\r',
                '"': '\\"',
                '\\': '\\\\'
            };

            return '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"';
        },


        _stringifyArray: function (value) {
            var len = value.length,
                partial = [],
                i;
            for (var i = 0; i < len; i++) {
                partial.push(this._str(i, value) || 'null');
            }

            return '[' + partial.join(',') + ']';
        },

        _stringifyObject: function (value) {
            var partial = [],
                i, v;
            var me = this;
            for (i in value) {
                if (Object.prototype.hasOwnProperty.call(value, i)) {
                    v = me._str(i, value);
                    if (v) {
                        partial.push(me._quote(i) + ':' + v);
                    }
                }
            }
            return '{' + partial.join(',') + '}';
        },

        _stringifyReference: function (value) {
            switch (Object.prototype.toString.call(value)) {
                case '[object Array]':
                    return this._stringifyArray(value);
            }
            return this._stringifyObject(value);
        },

        _stringifyPrimitive: function (value, type) {
            switch (type) {
                case 'string':
                    return this._quote(value);
                case 'number':
                    return isFinite(value) ? value : 'null';
                case 'boolean':
                    return value;
            }
            return 'null';
        },

        _str: function (key, holder) {
            var value = holder[key], type = typeof value;

            if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
                value = value.toJSON(key);
                type = typeof value;
            }
            if (/(number|string|boolean)/.test(type) || (!value && type === 'object')) {
                return this._stringifyPrimitive(value, type);
            } else {
                return this._stringifyReference(value);
            }
        }
    });
})(jqxBaseFramework);
