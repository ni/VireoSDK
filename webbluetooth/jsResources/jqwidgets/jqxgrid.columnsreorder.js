/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/


(function ($) {
    $.extend($.jqx._jqxGrid.prototype, {

        getcolumnindex: function(datafield)
        {
            var column = this.getcolumn(datafield);
            var columnindex = this.columns.records.indexOf(column);
            return columnindex;
        },

        setcolumnindex: function (datafield, index, refresh) {
            var column = this.getcolumn(datafield);
            if (column.pinned) return;
            if (column.hidden) return;
            if (column.checkboxcolumn) return;
            if (column.grouped) return;

            var columnindex = this.columns.records.indexOf(column);
            this.columns.records.splice(columnindex, 1);
            this.columns.records.splice(index, 0, column);

            var left = 0;
            var zindex = this.headerZIndex;
            this.columnsrow.children().detach();

            var cellclass = this.toThemeProperty('jqx-grid-cell');
            cellclass += ' ' + this.toThemeProperty('jqx-grid-cell-pinned');
            if (this.filterrow) {
                $(this.filterrow.children()[0]).children().detach();
                this.filterrow[0].cells = [];
            }

            var self = this;
            var tablerow = null;
            if (self.filterrow != undefined) {
                var tablerow = $(self.filterrow.children()[0]);
            }

            this.columnsrow[0].cells = [];
            var hasHiddenColumns = false;
            $.each(this.columns.records, function (i, value) {
                var column = this.uielement;
                self.columnsrow.append(column);
                if (!self.rtl) {
                    column.css('z-index', zindex--);
                }
                else {
                    column.css('z-index', zindex++);
                }

                var desiredwidth = this.width;
                column.css('left', left);
                self.columnsrow[0].cells[self.columnsrow[0].cells.length] = column[0];

                if (self.filterrow) {
                    var tablecolumn = $('<div style="overflow: hidden; position: absolute; height: 100%;" class="' + cellclass + '"></div>');
                    tablerow.append(tablecolumn);
                    tablecolumn.css('left', left);
                    tablecolumn.css('z-index', zindex + 1);
                    tablecolumn.width(this.width);
                    tablecolumn[0].left = left;
                    tablecolumn.append(this._filterwidget);
                    self.filterrow[0].cells[self.filterrow[0].cells.length] = tablecolumn[0];
                }
                if (this.hidden) {
                    hasHiddenColumns = true;
                }
                if (!(this.hidden && this.hideable)) {
                    left += desiredwidth;
                }
            });

            if (this.groupable) {
                var groupslength = this.groups.length;
                if (groupslength > 0) {
                    if (columnindex - groupslength >= 0) {
                        columnindex -= groupslength;
                        index -= groupslength;
                    }
                }
            }
            if (this.rowdetails) {
                if (columnindex - 1 >= 0) {
                    columnindex --;
                    index --;
                }
            }
            if (this.selectionmode == 'checkbox') {
                if (columnindex - 1 >= 0) {
                    columnindex--;
                    index--;
                }
            }

            var column = this._columns[columnindex];
   
            this._columns.splice(columnindex, 1);
            this._columns.splice(index, 0, column);

            this._raiseEvent(24, { columntext: column.text, datafield: column.datafield, oldindex: columnindex, newindex: index });
            if (refresh == false) return;

            if (hasHiddenColumns || column.columntype == "checkbox") {
                this.prerenderrequired = true;
                this.rendergridcontent(true, false);
                this._updatecolumnwidths();
                this._updatecellwidths();
            }
            else {
                this._updatecolumnwidths();
                this._updatecellwidths();
            }
            if (this._updatefilterrowui && this.filterable && this.showfilterrow) {
                this._updatefilterrowui();
            }
            if (this.showeverpresentrow) {
                this._updateaddnewrowui();
            }
            this._rendercolumngroups();
            this._renderrows(this.virtualsizeinfo);

        },

        _pinnedColumnsLength: function () {
            var pinned = 0;
            $.each(this.columns.records, function () {
                if (this.pinned) pinned++;
                if (this.grouped) pinned++;
            });
            if (this.selectionmode == 'checkbox') pinned++;
            return pinned;
        },

        _handlecolumnsreorder: function () {
            var self = this;
            var dropindex = -1;
            var candrop = false;

            if (!self.columnsreorder)
                return;

            var mousemove = 'mousemove.reorder' + this.element.id;
            var mousedown = 'mousedown.reorder' + this.element.id;
            var mouseup = 'mouseup.reorder' + this.element.id;

            var touchdevice = false;
            if (this.isTouchDevice() && this.touchmode !== true) {
                touchdevice = true;
                mousemove = $.jqx.mobile.getTouchEventName('touchmove') + '.reorder' + this.element.id;
                mousedown = $.jqx.mobile.getTouchEventName('touchstart') + '.reorder' + this.element.id;
                mouseup = $.jqx.mobile.getTouchEventName('touchend') + '.reorder' + this.element.id;
            }

            this.removeHandler($(document), mousemove);
            this.addHandler($(document), mousemove, function (event) {
                if (self.resizing) {
                    return true;
                }

                if (self.reordercolumn != null) {
                    var left = parseInt(event.pageX);
                    var top = parseInt(event.pageY);
                    if (touchdevice) {
                        var touches = self.getTouches(event);
                        var touch = touches[0];
                        if (touch != undefined) {
                            left = parseInt(touch.pageX);
                            top = parseInt(touch.pageY);
                        }
                    }
                    var hostoffset = self.host.coord();
                    var hostleft = parseInt(hostoffset.left);
                    var hosttop = parseInt(hostoffset.top);
                    if (self.dragmousedownoffset == undefined || self.dragmousedownoffset == null) {
                        self.dragmousedownoffset = { left: 0, top: 0 };
                    }

                    var leftposition = parseInt(left) - parseInt(self.dragmousedownoffset.left);
                    var topposition = parseInt(top) - parseInt(self.dragmousedownoffset.top);

                    self.reordercolumn.css({ left: leftposition + 'px', top: topposition + 'px' });
                    candrop = false;
                    if (left >= hostleft && left <= hostleft + self.host.width()) {
                        if (top >= hosttop && top <= hosttop + self.host.height()) {
                            candrop = true;
                        }
                    }

                    dropindex = -1;
                    if (candrop) {
                        self.reordercolumnicon.removeClass(self.toThemeProperty('jqx-grid-dragcancel-icon'));
                        self.reordercolumnicon.addClass(self.toThemeProperty('jqx-grid-drag-icon'));
                        var groupsheaderoffset = self.columnsheader.coord();
                        var groupsheaderbottom = groupsheaderoffset.top + self.columnsheader.height();

                        if (self.columnsdropline != null) {
                            if (top >= groupsheaderoffset.top && top <= groupsheaderbottom) {
                                dropindex = self._handlereordercolumnsdroplines(left);
                            }
                            else {
                                self.columnsdropline.fadeOut('slow');
                            }
                        }
                    }
                    else {
                        if (self.columnsdropline != null) {
                            self.columnsdropline.fadeOut('slow');
                        }

                        self.reordercolumnicon.removeClass(self.toThemeProperty('jqx-grid-drag-icon'));
                        self.reordercolumnicon.addClass(self.toThemeProperty('jqx-grid-dragcancel-icon'));
                    }
                    if (touchdevice) {
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                }
            });

            this.columnsbounds = new Array();

            this.removeHandler($(document), mousedown);
            this.addHandler($(document), mousedown, function (event) {
                if (self.resizing) {
                    return true;
                }

                self.columnsbounds = new Array();
                var left = self.host.coord().left;
                var top = self.host.coord().top;
                if (self.showtoolbar) top += self.toolbarheight;
                if (self.groupable && self.showgroupsheader) top += self.groupsheaderheight;
                var columnIndex = 0;
                $.each(self.columns.records, function (index) {
                    var column = this;

                    if (column.hidden) {
                        self.columnsbounds[self.columnsbounds.length] = { top: top, column: column, left: left, width: 0, height: 2 + self.rowsheight };
                        return true;
                    }

                    if (columnIndex == 0) {
                        if (!self.rtl) {
                            left = parseInt(self.host.coord().left) - self.hScrollInstance.value;
                        }
                        else {
                            if (self.hScrollBar.css('visibility') != "hidden") {
                                left = parseInt(self.host.coord().left) - self.hScrollInstance.max + self.hScrollInstance.value;
                            }
                            else {
                                left = parseInt(self.host.coord().left) + self.hScrollInstance.value;
                            }
                        }
                    }
                    columnIndex++;
                    var height = 2 + self.columnsheight;
                    if (self.columnshierarchy) {
                        top = $(column.uielement).coord().top;
                        height = $(column.uielement).height();
                    }
                    self.columnsbounds[self.columnsbounds.length] = { top: top, column: column, left: left, width: column.width, height: height };
                    left += column.width;
                });
            });
            this.removeHandler($(document), mouseup);
            this.addHandler($(document), mouseup, function (event) {
                if (self.resizing) {
                    return true;
                }

                self.__drag = false;

                $(document.body).removeClass('jqx-disableselect');
                var left = parseInt(event.pageX);
                var top = parseInt(event.pageY);
                if (touchdevice) {
                    var touches = self.getTouches(event);
                    var touch = touches[0];
                    left = parseInt(touch.pageX);
                    top = parseInt(touch.pageY);
                }
                var hostoffset = self.host.coord();
                var hostleft = parseInt(hostoffset.left);
                var hosttop = parseInt(hostoffset.top);
                var groupsheaderheight = self.groupsheader.height();
                if (self.showtoolbar) {
                    hosttop += self.toolbarheight;
                }

                self.columndragstarted = false;
                self.dragmousedown = null;
                if (self.reordercolumn != null) {
                    var datafield = $.data(self.reordercolumn[0], 'reorderrecord');
                    var oldindex = self.columns.records.indexOf(self.getcolumn(datafield));
                    self.reordercolumn.remove();
                    self.reordercolumn = null;
                    var minIndex = 0;
                 //   minIndex += self.rowdetails ? 1 : 0;
                    minIndex += self._pinnedColumnsLength();

                    if (datafield != null) {
                        if (candrop) {
                            if (dropindex != -1) {
                                var index = dropindex.index;
                                if (index >= minIndex) {
                                    var targetcolumn = self.columns.records[index];
                                    if (targetcolumn != undefined) {
                                        var columnindex = self.columns.records.indexOf(self.getcolumn(targetcolumn.datafield));
                                        if (targetcolumn.datafield == null) {
                                            var columnindex = self.columns.records.indexOf(self.getcolumnbytext(targetcolumn.text));
                                        }
                                        if (self.columngroups) {
                                            var target = targetcolumn;
                                            if (oldindex < columnindex) {
                                                if (dropindex.position == 'before') {
                                                     target = self.columns.records[columnindex - 1];
                                                }
                                            }

                                            if (target.columngroup != self.getcolumn(datafield).columngroup) {
                                                if (self.columnsdropline != null) {
                                                    self.columnsdropline.remove();
                                                    self.columnsdropline = null;
                                                }
                                                return;
                                            }
                                        }

                                        if (oldindex < columnindex) {
                                            if (dropindex.position == 'before') {
                                                self.setcolumnindex(datafield, columnindex - 1);
                                            }
                                            else {
                                                self.setcolumnindex(datafield, columnindex);
                                            }
                                        }
                                        else if (oldindex > columnindex) {
                                            self.setcolumnindex(datafield, columnindex);
                                        }
                                        if (self.autosavestate) {
                                            if (self.savestate) self.savestate();
                                        }
                                    }
                                }
                            }
                        }

                        if (self.columnsdropline != null) {
                            self.columnsdropline.remove();
                            self.columnsdropline = null;
                        }
                    }
                }
            });
        },

        getcolumnbytext: function (text) {
            var column = null;
            if (this.columns.records) {
                $.each(this.columns.records, function () {
                    if (this.text == text) {
                        column = this;
                        return false;
                    }
                });
            }
            return column;
        },

        _handlereordercolumnsdroplines: function (left) {
            var self = this;
            var dropindex = -1;
            var minIndex = self._pinnedColumnsLength();
            var hostleft = parseInt(self.host.coord().left);
            var hostright = hostleft + self.host.width();
            var leftOffset = self.vScrollBar.css('visibility') != 'hidden' ? 19 : 0;
            if (!self.rtl) leftOffset = 0;

            $.each(self.columnsbounds, function (index) {
                if (index >= minIndex) {
                    if (this.width == 0) return true;

                    if (left <= this.left + this.width / 2) {
                        if (left > hostright) {
                            self.columnsdropline.fadeOut();
                            return false;
                        }
                        self.columnsdropline.css('left', leftOffset + parseInt(this.left) + 'px');
                        self.columnsdropline.css('top', parseInt(this.top) + 'px');
                        self.columnsdropline.height(this.height);
                        self.columnsdropline.fadeIn('slow');
                        dropindex = { index: index, position: 'before' }
                        return false;
                    }
                    else if (left >= this.left + this.width / 2) {
                        if (this.left + this.width > hostright) {
                            self.columnsdropline.fadeOut();
                            return false;
                        }

                        self.columnsdropline.css('left', leftOffset + 1 + this.left + this.width);
                        self.columnsdropline.css('top', this.top);
                        self.columnsdropline.height(this.height);
                        self.columnsdropline.fadeIn('slow');
                        dropindex = { index: index, position: 'after' }
                    }
                }
            });

            return dropindex;
        },

        _createreordercolumn: function (column, position, hascolumnsdropline) {
            var me = this;
            var mousemove = position;

            if (me.reordercolumn) me.reordercolumn.remove();
            if (me.columnsdropline) me.columnsdropline.remove();
            me.reordercolumn = $('<div></div>');
            var columnclone = column.clone();
            me.reordercolumn.css('z-index', 999999);
            columnclone.css('border-width', '1px');
            columnclone.css('opacity', '0.4');
            var menubutton = $(columnclone.find('.' + me.toThemeProperty('jqx-grid-column-menubutton')));
            if (menubutton.length > 0) {
                menubutton.css('display', 'none');
            }
            var closebutton = $(columnclone.find('.jqx-icon-close'));
            if (closebutton.length > 0) {
                closebutton.css('display', 'none');
            }

            me.reordercolumnicon = $('<div style="z-index: 9999; position: absolute; left: 100%; top: 50%; margin-left: -18px; margin-top: -7px;"></div>');
            me.reordercolumnicon.addClass(me.toThemeProperty('jqx-grid-drag-icon'));
            me.reordercolumn.css('float', 'left');
            me.reordercolumn.css('position', 'absolute');
            var hostoffset = me.host.coord();
            columnclone.width(column.width() + 16);
            me.reordercolumn.append(columnclone);
            me.reordercolumn.height(column.height());
            me.reordercolumn.width(columnclone.width());
            me.reordercolumn.append(me.reordercolumnicon);
            $(document.body).append(me.reordercolumn);

            columnclone.css('margin-left', 0);
            columnclone.css('left', 0);
            columnclone.css('top', 0);
            me.reordercolumn.css('left', mousemove.left + me.dragmousedown.left);
            me.reordercolumn.css('top', mousemove.top + me.dragmousedown.top);

            if (hascolumnsdropline != undefined && hascolumnsdropline) {
                me.columnsdropline = $('<div style="z-index: 9999; display: none; position: absolute;"></div>');

                me.columnsdropline.width(2);
                me.columnsdropline.addClass(me.toThemeProperty('jqx-grid-group-drag-line'));
                $(document.body).append(me.columnsdropline);
            }
        },

        _handlecolumnsdragreorder: function (record, column) {
            if (this.reordercolumn) this.reordercolumn.remove();
            if (this.columnsdropline) this.columnsdropline.remove();

            this.dragmousedown = null;
            this.dragmousedownoffset = null;
            this.columndragstarted = false;
            this.reordercolumn = null;

            var me = this;
            var mousemove;
            var touchdevice = false;
            if (this.isTouchDevice() && this.touchmode !== true) {
                touchdevice = true;
            }

            var mousedown = 'mousedown.drag';
            var mousemove = 'mousemove.drag';
            if (touchdevice) {
                mousedown = $.jqx.mobile.getTouchEventName('touchstart') + '.drag';
                mousemove = $.jqx.mobile.getTouchEventName('touchmove') + '.drag';
            }
            else {
                this.addHandler(column, 'dragstart', function (event) {
                    return false;
                });
            }
            this.addHandler(column, mousedown, function (event) {
                if (false == record.draggable) {
                    return true;
                }
                if (me.resizing) {
                    return true;
                }

                me.__drag = true;

                var pagex = event.pageX;
                var pagey = event.pageY;
                if (touchdevice) {
                    var touches = me.getTouches(event);
                    var touch = touches[0];
                    pagex = touch.pageX;
                    pagey = touch.pageY;
                }

                me.dragmousedown = { left: pagex, top: pagey };

                var offsetposition = $(event.target).coord();
                me.dragmousedownoffset = { left: parseInt(pagex) - parseInt(offsetposition.left), top: parseInt(pagey - offsetposition.top) };
                return true;
            });

            this.addHandler(column, mousemove, function (event) {
                if (!record.draggable) return true;
                if (undefined == record.datafield) return true;
                if (record.pinned) return true;
                if (me.resizing) {
                    return true;
                }

                if (me.dragmousedown) {
                    var pagex = event.pageX;
                    var pagey = event.pageY;
                    if (touchdevice) {
                        var touches = me.getTouches(event);
                        var touch = touches[0];
                        if (touch != undefined) {
                            pagex = touch.pageX;
                            pagey = touch.pageY;
                        }
                    }
                    mousemove = { left: pagex, top: pagey };
                    if (!me.columndragstarted && me.reordercolumn == null) {
                        var xoffset = Math.abs(mousemove.left - me.dragmousedown.left);
                        var yoffset = Math.abs(mousemove.top - me.dragmousedown.top);
                        if (xoffset > 3 || yoffset > 3) {
                            me._createreordercolumn(column, mousemove, true);
                            $(document.body).addClass('jqx-disableselect');
                            $.data(me.reordercolumn[0], 'reorderrecord', record.datafield);
                        }
                    }
                }
            });
        }
    });
})(jqxBaseFramework);
