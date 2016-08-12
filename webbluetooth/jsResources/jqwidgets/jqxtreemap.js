/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget('jqxTreeMap', '', {});

    var treemap = {};

    treemap['default'] = (function () {

        /**
         * Treemap area
         */
        function Area(xoffset, yoffset, width, height) {
            this.height = height;
            this.width = width;
            this.xoffset = xoffset; 
            this.yoffset = yoffset; 

            this.shortestEdge = function () {
                return Math.min(this.height, this.width);
            };

            /**
             * Gets the coordinates of the area
             */
            this.getCoordinates = function (row) {
                var coordinates = [],
                    subxoffset = this.xoffset, subyoffset = this.yoffset,
                    areawidth = sumArray(row) / this.height,
                    areaheight = sumArray(row) / this.width;

                if (this.width >= this.height) {
                    for (var i = 0; i < row.length; i += 1) {
                        coordinates.push([subxoffset, subyoffset, subxoffset + areawidth, subyoffset + row[i] / areawidth]);
                        subyoffset = subyoffset + row[i] / areawidth;
                    }
                } else {
                    for (var i = 0; i < row.length; i += 1) {
                        coordinates.push([subxoffset, subyoffset, subxoffset + row[i] / areaheight, subyoffset + areaheight]);
                        subxoffset = subxoffset + row[i] / areaheight;
                    }
                }
                return coordinates;
            };

            this.cutArea = function (area) {
                var newcontainer;

                if (this.width >= this.height) {
                    var areawidth = area / this.height,
                        newwidth = this.width - areawidth;
                    newcontainer = new Area(this.xoffset + areawidth, this.yoffset, newwidth, this.height);
                } else {
                    var areaheight = area / this.width,
                        newheight = this.height - areaheight;
                    newcontainer = new Area(this.xoffset, this.yoffset + areaheight, this.width, newheight);
                }
                return newcontainer;
            };
        }

        /**
         * Normalize the given coordinates so the different areas to fit in the parent rectangle
         */
        function normalizeData(data, area) {
            var normalizeDataddata = [],
                sum = sumArray(data),
                multiplier = area / sum;

            for (var i = 0; i < data.length; i += 1) {
                normalizeDataddata[i] = data[i] * multiplier;
            }

            return normalizeDataddata;
        }

        function handleMultidimentional(data, width, height, xoffset, yoffset) {
            xoffset = (typeof xoffset === "undefined") ? 0 : xoffset;
            yoffset = (typeof yoffset === "undefined") ? 0 : yoffset;
            
            var mergeddata = [],
                mergedtreemap,
                results = [];

            if (isArray(data[0])) {

                for (var i = 0; i < data.length; i += 1) {
                    mergeddata[i] = sumMultidimensionalArray(data[i]);
                }

                mergedtreemap = handleSingledimentional(mergeddata, width, height, xoffset, yoffset);
                
                for (var i = 0; i < data.length; i += 1) {
                    results.push(handleMultidimentional(data[i], 
                        mergedtreemap[i][2] - mergedtreemap[i][0], 
                        mergedtreemap[i][3] - mergedtreemap[i][1], 
                        mergedtreemap[i][0], 
                        mergedtreemap[i][1]));
                }

            } else {
                results = handleSingledimentional(data,width,height, xoffset, yoffset);
            }
            return results;
        }

        /**
         * Returns array of array. Each inner array is a set of coordinates - left, top, right, bottom.
         * For finding the width simply: right - left
         * For finding the height simply: bottom - top
         */
        function handleSingledimentional(data, width, height, xoffset, yoffset) {
            xoffset = (typeof xoffset === "undefined") ? 0 : xoffset;
            yoffset = (typeof yoffset === "undefined") ? 0 : yoffset;

            var rawtreemap = squarify(normalizeData(data, width * height),
                                      [],
                                      new Area(xoffset, yoffset, width, height),
                                      []);
            return flattenTreemap(rawtreemap);
        }

        function flattenTreemap(rawtreemap) {
            var flattreemap = [];
            for (var i = 0; i < rawtreemap.length; i += 1) {
                for (var j = 0; j < rawtreemap[i].length; j += 1) {
                    flattreemap.push(rawtreemap[i][j]);
                }
            }
            return flattreemap;
        }

        /**
         * Creates a treemap using the algorithm: http://www.win.tue.nl/~vanwijk/stm.pdf
         */
        function squarify(data, currentrow, container, stack) {
            var length,
                nextdatapoint,
                newcontainer;

            if (data.length === 0) {
                stack.push(container.getCoordinates(currentrow));
                return;
            }

            length = container.shortestEdge();
            nextdatapoint = data[0];
            
            if (improvesRatio(currentrow, nextdatapoint, length)) {
                currentrow.push(nextdatapoint);
                squarify(data.slice(1), currentrow, container, stack);
            } else {
                newcontainer = container.cutArea(sumArray(currentrow), stack);
                stack.push(container.getCoordinates(currentrow));
                squarify(data, [], newcontainer, stack);
            }
            return stack;
        }

        /**
         * Checks whether the ratio is improved
         */
        function improvesRatio(currentrow, nextnode, length) {
            var newrow; 

            if (currentrow.length === 0)
                return true;
            
            newrow = currentrow.slice();
            newrow.push(nextnode);
            
            var currentratio = calculateRatio(currentrow, length),
                newratio = calculateRatio(newrow, length);
            
            return currentratio >= newratio; 
        }

        /**
         * Calculates the ratio
         */
        function calculateRatio(row, length) {
            var min = Math.min.apply(Math, row),
                max = Math.max.apply(Math, row),
                sum = sumArray(row);
            return Math.max(Math.pow(length, 2) * max / Math.pow(sum, 2), Math.pow(sum, 2) / (Math.pow(length, 2) * min));
        }

        /**
         * Returns if the given parameter is an array
         *
         * @param {object}
         */
        function isArray(arr) {
            return arr && arr.constructor === Array; 
        }

        /**
         * Returns the sum of an array
         *
         * @param {array} The array which sum of elements we should find
         */
        function sumArray(arr) {
            var sum = 0;
            for (var i = 0; i < arr.length; i += 1) 
                sum += arr[i];

            return sum;
        }

        /**
         * Finds the sum of multidimensional array
         *
         * @param {array} Multidimensional array which sum should be found
         */
        function sumMultidimensionalArray(arr) {
            var total = 0;

            if (isArray(arr[0])) {
                for (var i = 0; i < arr.length; i += 1) {
                    total += sumMultidimensionalArray(arr[i]);
                }
            } else {
                total = sumArray(arr);
            }
            return total;
        }

        return handleMultidimentional; 
    }());

    /**
     * Represents a node from the TreeMap
     *
     * @param {string} label - Label of the node
     * @param {number} value - Value in percents
     * @param {Node} parent - Parent of the current node
     * @param {array} children - List of all children of the current node
     * @param {object} [ground] - DOM element which corresponds to the current node
     * @param {object} [ground] - additional data related to the node.
     */
    function Node(label, value, parent, children, area, color, data, record) {
        this.label = label;
        this.value = value;
        this.parent = parent;
        this.children = children;
        this.area = area || null;
        this.color = color;
        this.data = data;
        this.record = record;
    }

    /**
     * Enum used for the axis (horizontal, vertical or both)
     */
    var Axis = {
        HORIZONTAL: 0,
        VERTICAL: 1,
        BOTH: 2
    };

    $.extend($.jqx._jqxTreeMap.prototype, {

        defineInstance: function () {
            var settings = {
                /**
                 * Width of the treemap
                 */
                width:600,

                /**
                 * Height of the treemap
                 */
                height:600,

                /**
                 * Callbacks which are called when a sector is rendered.
                 * In renderCallbacks can be defined callback for each data element
                 * by setting property with name the data element's label and value the callback
                 * function. If you want to define callback which should be called
                 * for each data element you must set the property '*' of the renderCallbacks i.e.:
                 *
                 * renderCallbacks['*']:function (node, data) {
                 * },
                 */
                renderCallbacks:{},

                /**
                 * Formats the legend scale's values.
                 */
                legendScaleCallback:function (a) {
                    return a;
                    },

                /**
                 * Enable/disable the hover effect
                 */
                hoverEnabled:false,

                /**
                 * Enable/disable the sector selection
                 */
                selectionEnabled:true,

                /**
                 * If this property is true, just a single sector can be selected at given time
                 */
                singleSelection:true,

                /**
                 * Indicates whether to show or not the legend.
                 * The legend is available only in autoColors and rangeColors modes
                 */
                showLegend:true,

                /**
                 * The legend label.
                 */
                legendLabel:'Legend',

                /**
                 * The height of the parent sectors' header.
                 */
                headerHeight:25,

                /**
                 * The range in which the base colors can vary.
                 */
                colorRange:100,

                /**
                 * Default or simple layout. Currently this property is disabled.
                 */
                layout:'default', //default

                /**
                 * The data which should be drawn.
                 */
                source:[],
                displayMember:null,
                valueMember:null,
                /**
                 *  Color mode. There are three different types of color mode:
                 *  - parent - the children inherits from it's parent. Depending on the child value and
                 *  the colorRange property the color varies.
                 *  - autoColors - automatic color generation based on the baseColor/colorRange and
                 *  the value.
                 *  - rangeColors - the user can sets array of color ranges. Each color range has the
                 *  properties min, max and color.
                 */
                colorMode:'parent', //'parent', 'autoColors', 'rangeColors'

                /**
                 * Base color which is used in autoColors mode.
                 */
                baseColor:'#C2EEFF', //for autoColors

                /**
                 * The position of the legend.
                 */
                legendPosition:{ x: 0, y: 0 },

                /**
                 * Color ranges for the rangeColors mode.
                 */
                colorRanges:[
                    { color: '#aa9988', min: 0,  max: 10  },
                    { color: '#ccbbcc', min: 11, max: 50  },
                    { color: '#000',    min: 50, max: 100 }
                ],

                _root:[]
            }
            $.extend(true, this, settings);
            return settings;
        },

        /**
         * Creates a new instance
         *
         * @private
         */
        createInstance: function () {
            this.render();
        },

        render: function () {
            this.host.addClass(this.toThemeProperty('jqx-widget'));
            this._destroy();
            this._root = new Node(undefined, 0, null, [], this.host);
            var build = function (data, that) {
                var parentVals = {}, c;

                var hasItems = null;
                for (var i = 0; i < data.length; i += 1) {
                    if (data[i].items) {
                        hasItems = true;
                        break;
                    }
                }

                var toFlatList = new Array();
                if (hasItems) {
                    var parseItems = function (data, parent) {
                        for (var i = 0; i < data.length; i += 1) {
                            data[i].parent = parent;
                            if (!data[i].data) {
                                data[i].data = data[i].value;
                            }
                            if (data[i].value == null) data[i].value = 0;
                            if (isNaN(parseFloat(data[i].value))) {
                                var val = data[i].value.toString();
                                var number = "";
                                for (var t = 0; t < val.length; t++) {
                                    var ch = val.substring(t, t + 1);
                                    if (ch.match(/^[0-9]+$/) != null || ch == ".") {
                                        number += ch;
                                    }
                                }
                                data[i].value = new Number(number);
                            }
                            else {
                                data[i].value = parseFloat(data[i].value);
                            }
                            toFlatList.push(data[i]);
                            if (data[i].items) {
                                parseItems(data[i].items, data[i].label);
                            }
                        }
                    }
                    parseItems(data, null);
                    data = toFlatList;
                }

                for (var i = 0; i < data.length; i += 1) {
                    c = data[i];
                    if (c.value) {
                        if (c.parent != null) {
                            if (!parentVals[c.parent]) {
                                parentVals[c.parent] = 0;
                            }
                            parentVals[c.parent] += c.value;
                        }
                    }
                }
                for (var i = 0; i < data.length; i += 1) {
                    c = data[i];
                    if (parentVals[c.label] !== undefined) {
                        c.value = parentVals[c.label];
                    }
                }

                that._buildTree(data, that._root);
                that._dataList = that._buildList();
                that._setStyles();
                var layoutAlgorithm = treemap['default'];
                if (that.layout === 'simple') {
                    layoutAlgorithm = treemap.simple;
                }
                that._render(that._root, layoutAlgorithm);
                that._renderLegend();
            }

            if ($.jqx.dataAdapter && this.source != null && this.source._source) {
                this.dataBind(this.source, build);
                return;
            }

            build(this.source, this);
            this._trigger('bindingComplete');
        },

        dataBind: function (source, callback) {
            this.records = new Array();
            var isdataadapter = source._source ? true : false;
            var dataadapter = new $.jqx.dataAdapter(source,
                {
                    autoBind: false
                }
            );

            if (isdataadapter) {
                dataadapter = source;
                source = source._source;
            }

            var initadapter = function (me) {
                if (source.type != undefined) {
                    dataadapter._options.type = source.type;
                }
                if (source.formatdata != undefined) {
                    dataadapter._options.formatData = source.formatdata;
                }
                if (source.contenttype != undefined) {
                    dataadapter._options.contentType = source.contenttype;
                }
                if (source.async != undefined) {
                    dataadapter._options.async = source.async;
                }
            }

            var updatefromadapter = function (me, type) {
                me.records = dataadapter.records;
                var data = new Array();
                for (var i = 0; i < me.records.length; i++)
                {
                    var current = me.records[i];

                    if (me.displayMember) {
                        current.label = current[me.displayMember];
                    }
                    if (me.valueMember) {
                        current.value = current[me.valueMember];
                    }
                    current.record = current;
                    data.push(current);
                }

                me._trigger('bindingComplete');

                callback(data, me);
            }

            initadapter(this);

            var me = this;
            switch (source.datatype) {
                case "local":
                case "array":
                default:
                    if (source.localdata != null) {
                        dataadapter.unbindBindingUpdate(this.element.id);
                        dataadapter.dataBind();
                        updatefromadapter(this);
                        dataadapter.bindBindingUpdate(this.element.id, function (updatetype) {
                            updatefromadapter(me, updatetype);
                        });
                    }
                    break;
                case "json":
                case "jsonp":
                case "xml":
                case "xhtml":
                case "script":
                case "text":
                case "csv":
                case "tab":
                    {
                        if (source.localdata != null) {
                            dataadapter.unbindBindingUpdate(this.element.id);
                            dataadapter.dataBind();
                            updatefromadapter(this);
                            dataadapter.bindBindingUpdate(this.element.id, function () {
                                updatefromadapter(me);
                            });
                            return;
                        }

                        var postdata = {};
                        if (dataadapter._options.data) {
                            $.extend(dataadapter._options.data, postdata);
                        }
                        else {
                            if (source.data) {
                                $.extend(postdata, source.data);
                            }
                            dataadapter._options.data = postdata;
                        }
                        var updateFunc = function () {
                            updatefromadapter(me);
                        }

                        dataadapter.unbindDownloadComplete(me.element.id);
                        dataadapter.bindDownloadComplete(me.element.id, updateFunc);

                        dataadapter.dataBind();
                    }
            }
        },

        _destroy: function () {
            this.host.children().remove();
        },

        destroy: function()
        {
            this.host.remove();
        },

        refresh: function (initialRefresh)
        {
            if (!initialRefresh) {
                this._refresh();
            }
        },

        _refresh: function () {
            this.render();
        },

        /**
         * Sets the CSS styles of the host
         *
         * @private
         */
        _setStyles: function () {
            this.host.css({
                position: 'relative',
                width: this.width,
                height: this.height
            });
            var percentageSize = false;
            if (this.width != null && this.width.toString().indexOf("%") != -1) {
                percentageSize = true;
            }

            if (this.height != null && this.height.toString().indexOf("%") != -1) {
                percentageSize = true;
            }
            var that = this;
            $.jqx.utilities.resize(this.host, function () {
                if (that.resizeTimer) {
                    clearTimeout(that.resizeTimer);
                }
                that.resizeTimer = setTimeout(function () {
                    that.performLayout();
                }, 50);
            });
        },
        
        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.performLayout();
        },

        performLayout: function()
        {
            var layoutAlgorithm = treemap['default'];
            this.clearSelection();
            this._layout(this._root, layoutAlgorithm);
        },

        /**
         * Gets an array with all values from the dataset.
         *
         * @private
         * @param {array} children All the children of the current node which should be rendered
         * @return {array} values Array with all values
         */
        _getValues: function (children) {
            var values = [];
            for (var i = 0; i < children.length; i += 1) {
                values.push(children[i].value);
            }
            return values;
        },

        /**
         * Checks whether the given string is a color (rgb, rgba or hex)
         *
         * @private
         * @param {string} color The string which should be validated
         * @return {boolean} Whether the string is color
         */
        _isColor: function (color) {
            if (!color) return false;
            var ev = this._colorEvaluator;
            if (ev._isRgb(color) || ev._isHex(color)) {
                return true;
            }
            return false;
        },


        _colorEvaluator: {
            _toRgb: function (color) {
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            },

            _toHex: function (color) {
                var r = color.r.toString(16),
                    g = color.g.toString(16),
                    b = color.b.toString(16);
                r = r.length === 1 ? '0' + r : r;
                g = g.length === 1 ? '0' + g : g;
                b = b.length === 1 ? '0' + b : b;
                return '#' + r + g + b;
            },

            _isRgb: function (color) {
                return (/(rgb|rgba)\s*\(\s*\d+\s*(,\s*\d+\s*){2}(,\d+\.\d+)?\)(;?)/i).test(color);
            },

            _isHex: function (color) {
                return (/^(#([0-9A-F]{3})([0-9A-F]{3})?)$/i).test(color);
            },

            getColorByValue: function (value, collection, baseColor) {
                var self = this._colorEvaluator,
                    max, ratio, nCount, dispersion, color, collection;

                if (self._isRgb(baseColor))
                    baseColor = self._toHex(baseColor);
                baseColor = self._toRgb(baseColor);

                nCount = collection.length;
                max = -Infinity;
                for (var i = 0; i < nCount; i += 1) {
                    if (max < collection[i].value) {
                        max = collection[i].value;
                    }
                }
               
                ratio = value / max;
                dispersion = Math.round(ratio * this.colorRange);
                color = self._toHex({
                    r: Math.max(baseColor.r - dispersion, 0),
                    g: Math.max(baseColor.g - dispersion, 0),
                    b: Math.max(baseColor.b - dispersion, 0)
                });
                return color;
            },

            //Returns the color in hex because it's cross-browser
            parent: function (node) {
                var color = node.parent.color,
                    self = this._colorEvaluator;
                if (!node.parent)
                    return '#fff';
                if (!color) {
                    color = this.baseColor;
                }

                color = self.getColorByValue.call(this, node.value, node.parent.children, color);
                node.color = color;
                return color;
            },

            autoColors: function (node) {
                var color = this.baseColor,
                    self = this._colorEvaluator;
                color = self.getColorByValue.call(this, node.value, this._dataList, color);
                node.color = color;
                return color;
            },

            rangeColors: function (node) {
                var val = node.value,
                    current;
                for (var i = 0; i < this.colorRanges.length; i += 1) {
                    current = this.colorRanges[i];
                    if (current.min < val && current.max >= val) {
                        return current.color;
                    }
                }
                return '#fff';
            }
        },

        /**
         * Gets the color of the given node
         *
         * @private
         * @param {Node} node The node which color should be get
         * @return {string} A color which should be used for background of the rectangle
         */
        _getColor: function (node) {
            var color = node.color,
                mode = this.colorMode;
            if (this._isColor(color)) {
                return color;
            }
            if (typeof this._colorEvaluator[mode] === 'function') {
                return this._colorEvaluator[mode].call(this, node);
            } else {
                throw 'Invalid colorMode';
            }
        },

        /**
         * Render a single rectangle
         *
         * @private
         * @param {array} position The coordinates of the rectangle
         * @param {Node} node The node which should be rendered
         * @return {object} rect The rectangle (DOM element)
         */
        _renderRect: function (position, node) {
            var rect = $('<div/>'),
                width = position[2] - position[0],
                height = position[3] - position[1];
            var color = this._getColor(node);
            rect.css({
                position: 'absolute',
                left: position[0]-1,
                top: position[1]-1,
                width: width,
                height: height,
                backgroundColor: color
            });
            rect.addClass(this.toThemeProperty('jqx-treemap-rectangle'));
            var ev = this._colorEvaluator;
            var data = {
                data: node.data,
                label: node.label,
                value: node.value,
                parent: node.parent,
                record: node.record,
                color: color,
                rgb: ev._toRgb(color)
            };
            if (node.parent == this._root) {
                data.parent = null;
            }

            if (typeof this.renderCallbacks['*'] === 'function') {
                var result = this.renderCallbacks['*'](rect, data);
                if (result !== undefined) {
                    return rect;
                }
            }
            if (typeof this.renderCallbacks[node.label] === 'function') {
                this.renderCallbacks[node.label](rect, data);
            } else {
                var width = rect.width() - 2;
                rect.html('<span style="max-width:' + width + 'px;" class="jqx-treemap-label">' + node.label + '</span>');
            }
            return rect;
        },

        /**
         * Centers the label of the rectangle
         *
         * @private
         */
        _centerLabel: function (rect, axis) {
            var label = rect[0].firstChild;
            label.style.position = 'absolute';
            if (axis === Axis.HORIZONTAL || axis === Axis.BOTH) {
                label.style.left = (rect[0].offsetWidth - label.offsetWidth) / 2 + 'px';
            }
            if (axis === Axis.VERTICAL || axis === Axis.BOTH) {
                label.style.top = (rect[0].offsetHeight - label.offsetHeight) / 2 + 'px';
            }
        },

        /**
         * Triggers an event
         *
         * @param {string} e Event name
         * @param {object} data Event data
         */
        _trigger: function (e, data) {
            var evnt = $.Event(e);
            evnt.args = data;
            return this.host.trigger(evnt);
        },

        /**
         * Adds event handlers to a specific area
         *
         * @param {object} container DIV which triggers the event
         * @param {object} data Data associated with the area
         */
        _addHandlers: function (container, data) {
            var self = this;
            container.bind('mouseenter', function (e) {
                if (self.hoverEnabled) {
                    self.host.find('.jqx-treemap-rectangle').removeClass('jqx-treemap-rectangle-hover');
                    container.addClass(self.toThemeProperty('jqx-treemap-rectangle-hover'));
                }
                self._trigger('mouseenterSector', data);
            });
            container.bind('mouseleave', function (e) {
                if (self.hoverEnabled) {
                    container.removeClass('jqx-treemap-rectangle-hover');
                }
                self._trigger('mouseleaveSector', data);
            });
            container.bind('click', function (e) {
                if (self.selectionEnabled) {
                    var selected = $.data(this, 'jqx-treemap-selected') || false;
                    if (self.singleSelection) {
                        self.host.find('.jqx-treemap-rectangle-hover').each(function (i, e) {
                            $.data(e, 'jqx-treemap-selected', false);
                            $(e).removeClass('jqx-treemap-rectangle-hover');
                        });
                    }
                    if (selected) {
                        container.removeClass('jqx-treemap-rectangle-hover');
                        selected = false;
                    } else {
                        container.addClass(self.toThemeProperty('jqx-treemap-rectangle-hover'));
                        selected = true;
                    }
                    $.data(this, 'jqx-treemap-selected', selected);
                    e.stopImmediatePropagation();
                }
            });
        },

        clearSelection: function()
        {
            this.host.find('.jqx-treemap-rectangle-hover').removeClass(this.toThemeProperty('jqx-treemap-rectangle-hover'));
            $.data(this, 'jqx-treemap-selected', false);
        },
        /**
         * Layouts of given area.
         *
         * @private
         */
        _layoutArea: function (node, rect) {
            if (node.children.length && node.children.length > 0) {
                this._centerLabel(rect, Axis.HORIZONTAL);
                rect.addClass(this.toThemeProperty('jqx-treemap-rectangle-parent'));
            } else {
                this._centerLabel(rect, Axis.BOTH);
            }
        },

        /**
         * Renders the treemap. This method recursivly calls itself when
         * rendering a subtree. 
         *
         * @private
         * @param {Node} node The node which children should be rendered
         */
        _render: function (node, algorithm) {
            if (!node.children.length) {
                return;
            }
            var offsetTop = 0;
            if (node.value)
                offsetTop = this.headerHeight;
            var values = this._getValues(node.children),
                offset = node.area.offset(),
                rectangles = algorithm(values, node.area.width(), node.area.height() - offsetTop, 0, offsetTop),
                current,
                rect; 
            for (var i = 0; i < node.children.length; i += 1) {
                current = node.children[i];
                rect = this._renderRect(rectangles[i], current);
                current.area = rect;
                node.area.append(rect);
                this._addHandlers(rect, {
                    label: current.label,
                    value: current.value,
                    color: current.color,
                    sector: current.area,
                    data: current.data
                });
                this._layoutArea(current, rect);
                this._render(current, algorithm);
            }
        },

        _layout: function (node, algorithm)
        {
            if (!node.children.length) {
                return;
            }
            var offsetTop = 0;
            if (node.value)
                offsetTop = this.headerHeight;
            var values = this._getValues(node.children),
                offset = node.area.offset(),
                rectangles = algorithm(values, node.area.width(), node.area.height() - offsetTop, 0, offsetTop),
                rect;
            for (var i = 0; i < node.children.length; i += 1) {
                var current = node.children[i];
                this._layoutRect(rectangles[i], current);
                this._layoutArea(current, current.area);
                this._layout(current, algorithm);
            }
            if (this.showLegend) {
                $(".jqx-treemap-legend").remove();
                this._renderLegend();
            }
        },

        _layoutRect: function (position, node) {
            var rect = node.area,
                width = position[2] - position[0],
                height = position[3] - position[1];
            rect.css({
                left: position[0] - 1,
                top: position[1] - 1,
                width: width,
                height: height
            });
            var ev = this._colorEvaluator;
            var color = this._getColor(node);
            var data = {
                data: node.data,
                label: node.label,
                value: node.value,
                parent: node.parent,
                record: node.record,
                color: color,
                rgb: ev._toRgb(color)
            };
            if (node.parent == this._root) {
                data.parent = null;
            }

            if (typeof this.renderCallbacks['*'] === 'function') {
                var result = this.renderCallbacks['*'](rect, data);
                if (result !== undefined) {
                    return rect;
                }
            }
            if (typeof this.renderCallbacks[node.label] === 'function') {
                this.renderCallbacks[node.label](rect, data);
            } else {
                var width = rect.width() - 2;
                rect.find('.jqx-treemap-label:first').css('max-width', width);
            }
        },
        /**
         * Finds the min and max values for all nodes
         *
         * @return {array} Array which contains the min and max nodes
         */
        _getBoundValues: function () {
            var root = this._root,
                stack = [], current,
                min = {}, max = {};
            min.value = root.value ||  Infinity;
            max.value = root.value || -Infinity;
            stack.push(root);
            while (stack.length) {
                current = stack.pop();
                if (min.value > current.value) {
                    min = current;
                }
                if (max.value < current.value) {
                    max = current;
                }
                for (var i = 0; i < current.children.length; i += 1) {
                    stack.push(current.children[i]);
                }
            }
            return [min, max];
        },

        /**
         * Gets the different ranges in autocolor mode
         *
         * @private
         */
        _getAutocolorRanges: function () {
            var vals = this._getBoundValues(),
                rangesCount = 5,
                max = vals[1].value,
                min = vals[0].value,
                sectorSize = (max - min) / rangesCount,
                current,
                r = [];
            for (var i = min; i < max; i += sectorSize) {
                current = Math.round(i);
                r.push({
                    min: current,
                    max: i + sectorSize,
                    color: this._colorEvaluator.getColorByValue.call(this, current, this._dataList, this.baseColor)
                });
            }
            return r;
        },

        /**
         * Renders the chart's legend
         *
         * @private
         */
        _renderLegend: function () {
            if (!(/autoColors|rangeColors/).test(this.colorMode) ||
                !this.showLegend) {
                return;
            }
            var ranges = this.colorRanges;
            if (this.colorMode === 'autoColors') {
                ranges = this._getAutocolorRanges();
            }
            var legend = this._renderColorLegend(ranges);
            this._renderLegendLabel(legend);
        },

        /**
         * Renders the legend label
         *
         * @private
         * @param {object} legend The legend's table (DOM object)
         */
        _renderLegendLabel: function (legend) {
            var row = $('<tr><td colspan="' + legend.find('td').length / 2 + '"/></tr>'),
                label = $('<div class="' + this.toThemeProperty('jqx-treemap-legend-label') + '" />');
            label.text(this.legendLabel);
            row.children().append(label);
            legend.prepend(row);
        },

        /**
         * Renders the legend's colors
         *
         * @private
         * @param {array} ranges Array which contains all ranges
         * @return {object} The DOM object which is the actual legend
         */
        _renderColorLegend: function (ranges) {
            var legend = $('<div class="' + this.toThemeProperty('jqx-treemap-legend') + '"/>'),
                row1, row2, cell, formatter = function (a) { return a; };

            if (typeof this.legendScaleCallback === 'function') {
                formatter = this.legendScaleCallback;
            }

            var table = $('<table class="' + this.toThemeProperty('jqx-treemap-legend-table') + '"/>')
            legend.append(table);
            table.append('<tr/>');
            legend.append('<div/>');
            this.host.append(legend);
            row1 = $(legend.find('tr')[0]);
            row2 = $(legend.find('div')[0]);
            row2.addClass(this.toThemeProperty('jqx-treemap-legend-values'));
            var compare = function (range1, range2) {

                try {
                    if (range1.min < range2.min) { return -1; }
                    if (range1.min > range2.min) { return 1; }
                }
                catch (error) {
                    var er = error;
                }

                return 0;
            };

            ranges.sort(compare);

            var width = Math.round(legend.width() / ranges.length);
            var x = -2;
            var initialPadding = 0;

            for (var i = 0; i < ranges.length; i += 1) {
                var color = $('<td class="' + this.toThemeProperty('jqx-treemap-legend-color') + '"/>');
                color.css('backgroundColor', ranges[i].color);
                row1.append(color);

                if (i === 0) {
                    var lbl = $('<span class="' + this.toThemeProperty('jqx-treemap-legend-max-value') + ' ' + this.toThemeProperty('jqx-treemap-legend-value') + '"/>');
                    lbl.text(formatter(ranges[i].min));
                    row2.append(lbl);
                    table.css('margin-left', lbl.width() / 2);
                    x += lbl.width() / 2;
                    initialPadding = x;
                }
                var lbl = $('<span class="' + this.toThemeProperty('jqx-treemap-legend-max-value') + ' ' + this.toThemeProperty('jqx-treemap-legend-value') + '"/>');
                x += width;
                lbl.text(formatter(ranges[i].max));
                row2.append(lbl);
                if (i == ranges.length - 1) {
                    initialPadding += lbl.width() / 2;
                    legend.css('padding-right', initialPadding + 5);
                    x -= 2;
                }
                x -= lbl.width() / 2;
                lbl.css('left', x);
                x += lbl.width() / 2;
            }
            legend.css({
                position: 'absolute',
                left: this.legendPosition.x,
                bottom: this.legendPosition.y,
                visibility: (this.showLegend) ? 'visible' : 'hidden'
            });
            return legend;
        },

        /**
         * Converts the input data to tree which will be
         * more suitable for the rendering operations required.
         * The tree is being build using the DFS algorithm.
         *
         * @private
         * @param {array} data Array which contains the tree nodes
         * @param {Node} root Root of the tree which should be build
         * @return {Node} root The root of the built tree
         */
        _buildTree: function (data, root) {
            var currentParent = null,
                currentChild,
                current,
                stack = []; 
            stack.push(root);
            while (stack.length) {
                currentParent = stack.pop();
                for (var i = 0; i < data.length; i += 1) {
                    current = data[i];
                    if (current.parent === currentParent.label || (!current.parent && !currentParent.label)) {
                        var parent = currentParent;

                        currentChild = new Node(
                            current.label,
                            parseFloat(current.value, 10),
                            parent,
                            [],
                            null,
                            current.color,
                            current.data,
                            current.record
                        );
                        currentParent.children.push(currentChild);
                        stack.push(currentChild);
                    }
                }
            }
            return root;
        },

        /**
         * Builds a linear structure of the nodes
         * 
         * @private
         * @return {array} Array of all nodes
         */
        _buildList: function () {
            var elemsList = [],
                stack = [], current;
            stack.push(this._root);
            while (stack.length) {
                current = stack.pop();
                if (current !== this._root)
                    elemsList.push(current);
                for (var i = 0; i < current.children.length; i += 1) {
                    stack.push(current.children[i]);
                }
            }
            return elemsList;
        },

        propertyChangedHandler: function (f, propName, val) {
            if (propName === 'renderCallbacks') {
                return;
            }
            if ((/hoverEnabled|selectionEnabled/).test(propName)) {
                if (!val) {
                    this.host.find('jqx-treemap-rectangle-hover');
                }
            } else if (propName === 'showLegend') {
                this.host.find('jqx-treemap-legend').toggle();
            } else {
                this._refresh();
            }
        }

    });

}(jqxBaseFramework));
