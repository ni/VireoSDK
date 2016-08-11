/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget('jqxTagCloud', '', {});

    //noinspection JSUnusedGlobalSymbols
    $.extend($.jqx._jqxTagCloud.prototype, {

        defineInstance: function () {
            var settings = {
                //// properties
                width: null,
                height: null,
                // Type: Object
                // Default: null
                // data source.
                source: null,
                disabled: false, // possible values: true, false
                rtl: false, // possible values: true, false
                valueMember: 'value', // (string) sets the field name used for value/weight
                displayMember: 'label', // (string) sets the field name used for the tag label
                urlMember: 'url', // (string) sets the field name used by the anchor element
                urlBase: '', // (string) if set is used for common base URL path for all tags
                autoBind: true,  // (bool) auto binds to data adapter on widget creation
                takeTopWeightedItems: false, // (bool) indicates if displayLimit will prioritize highest value members
                displayLimit: null, // (int) filters highest values tags up to the number specified by the displayLimit
                minValueToDisplay: 0, // (int) filters tags with value lower than minValueToDisplay
                maxValueToDisplay: 0, // (int) filters tags with value higher than maxValueToDisplay
                minFontSize: 10, // (int) font size to be used for lowest value members
                maxFontSize: 24, // (int) font size to be used for highest value members
                fontSizeUnit: 'px', // possible values 'px', 'em', '%', ''
                displayValue: false, // possible values: true, false - whether to add the tag value field after the text
                sortBy: 'none', // possible values: 'none', 'label', 'value'
                alterTextCase: 'none', // possible values: 'none', 'allLower', 'allUpper', 'firstUpper', 'titleCase'
                sortOrder: 'ascending', // possible values: 'ascending', 'descending'
                textColor: null, // (#FFFFFF) possible values all colors with #
                minColor: null,  // (#FFFFFF) min and max colors if set would display the values in kind of gradient fashion between min and max
                maxColor: null,   // (#FFFFFF) min and max must both be set for this to work.
                tagRenderer: null  // callback function for custom tag rendering. Must return html string
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            var that = this;
            // renders the widget
            that.render();
            that.dataBind(that.source, true);
        },

        //// methods

        // public methods

        // Used to set the dataBinding to the adapter
        dataBind: function (source, initialRefresh) {
            var that = this;
            that.records = [];
            var isdataadapter = source._source ? true : false;
            var dataAdapter;

            if (isdataadapter) {
                dataAdapter = source;
                source = source._source;
            } else {
                source.datafields = [
                    { name: that.displayMember },
                    { name: that.valueMember },
                    { name: that.urlMember }
                ];
                dataAdapter = new $.jqx.dataAdapter(source,
                    {
                        autoBind: true
                    }
                );
            }

            var initAdapter = function () {
                if (source.type !== undefined) {
                    dataAdapter._options.type = source.type;
                }
                if (source.formatdata !== undefined) {
                    dataAdapter._options.formatData = source.formatdata;
                }
                if (source.contenttype !== undefined) {
                    dataAdapter._options.contentType = source.contenttype;
                }
                if (source.async !== undefined) {
                    dataAdapter._options.async = source.async;
                }
            };

            var updateFromAdapter = function (me) {
                me._setSourceData(dataAdapter);
                me._raiseEvent(1, { records: me.records});
                me._renderTags();
            };

            initAdapter(this);

            switch (source.datatype) {
                case 'local':
                case 'array':
                default:
                    if (source.localdata != null || $.isArray(source)) {
                        dataAdapter.unbindBindingUpdate(that.element.id);
                        if (that.autoBind || (!that.autoBind && !initialRefresh)) {
                            dataAdapter.dataBind();
                        }
                        updateFromAdapter(that);
                        dataAdapter.bindBindingUpdate(that.element.id, function (updateType) {
                            updateFromAdapter(that, updateType);
                        });
                    }
                    break;
                case 'json':
                case 'jsonp':
                case 'xml':
                case 'xhtml':
                case 'script':
                case 'text':
                case 'csv':
                case 'tab':
                {
                    if (source.localdata != null) {
                        dataAdapter.unbindBindingUpdate(that.element.id);
                        if (that.autoBind || (!that.autoBind && !initialRefresh)) {
                            dataAdapter.dataBind();
                        }
                        updateFromAdapter(that);
                        dataAdapter.bindBindingUpdate(that.element.id, function () {
                            updateFromAdapter(that);
                        });
                        return;
                    }

                    var postData = {};
                    if (dataAdapter._options.data) {
                        $.extend(dataAdapter._options.data, postData);
                    }
                    else {
                        if (source.data) {
                            $.extend(postData, source.data);
                        }
                        dataAdapter._options.data = postData;
                    }
                    var updateFunc = function () {
                        updateFromAdapter(that);
                    };

                    dataAdapter.unbindDownloadComplete(that.element.id);
                    dataAdapter.bindDownloadComplete(that.element.id, updateFunc);


                    if (that.autoBind || (!that.autoBind && !initialRefresh)) {
                        dataAdapter.dataBind();
                    }
                }
            }
            that._raiseEvent(2, { records: that.records});

        },

        // destroy the widget
        destroy: function () {
            var that = this;
            that.removeHandler(that._el, 'keydown');
            that.removeHandler(that._el, 'click');
            that.host.empty();
            that.host.remove();
        },

        // used to find a tag index by label
        findTagIndex: function (displayMember) {
            var that = this;
            for (var i = 0; i< that.records.length; i++ ) {
                if (that.records[i][that.displayMember] === displayMember){
                    return that.records[i].index;
                }
            }
            return -1;
        },

        // returns an array with indices of hidden elements
        getHiddenTagsList: function (){
            return this.hiddenList.slice();
        },

        // returns a copy of array with all tags that have been rendered
        getRenderedTags: function (){
            return this.renderedData.slice();
        },

        // returns a copy of array with all tags, even those that get filtered
        getTagsList: function (){
            return this.records.slice();
        },

        // used to insert an element before an element with specified index
        insertAt: function (index, tagItem) {
            var that = this;
            tagItem.index = index;
            if (tagItem[this.displayMember] === undefined){
                throw new Error ('jqxTagCloud: Insert tag requires a valid displayMember field to be supplied in the parameter');
            }
            var val = tagItem[that.valueMember] !== undefined ? parseFloat(tagItem[that.valueMember]) : 0;
            tagItem[that.valueMember] = isNaN(val) ? 0 : val;

            if (that.source.insertTag && typeof(that.source.insertTag) === 'function'){
                that.source.insertTag(index, tagItem, function(commit){
                    if (commit){
                        that.records.splice(index, 0, tagItem);

                        for (var i = index + 1; i < that.records.length ; i++){
                            that.records[i].index += 1;
                        }
                        for (i = 0; i < that.hiddenList.length; i++){
                            if (that.hiddenList[i] >= index){
                                that.hiddenList[i]++;
                            }
                        }
                        that._renderTags();
                    }
                });
            } else {
                that.records.splice(index, 0, tagItem);

                for (var i = index + 1; i < that.records.length ; i++){
                    that.records[i].index += 1;
                }
                for (i = 0; i < that.hiddenList.length; i++){
                    if (that.hiddenList[i] >= index){
                        that.hiddenList[i]++;
                    }
                }
                that._renderTags();
            }
        },

        // used to update a specific element with specified index
        updateAt: function (index, tagItem) {
            var that = this;

            if (tagItem[this.displayMember] === undefined){
                throw new Error ('jqxTagCloud: Update tag requires a valid displayMember field to be supplied in the parameter');
            }

            tagItem.index = index;
            tagItem.uid = that.records[index].uid;
            if (that.source.updateTag && typeof(that.source.updateTag) === 'function'){
                that.source.updateTag(index, tagItem, function(commit){
                    if (commit){
                        $.each(tagItem, function (item, value){
                            that.records[index][item] = value;
                        });
                        that._renderTags();
                    }
                });
            } else {
                $.each(tagItem, function (item, value){
                    that.records[index][item] = value;
                });
                that._renderTags();
            }

        },

        // used to remove an element with specified index
        removeAt: function (index) {
            var that = this;
            if (that.source.deleteTag && typeof(that.source.deleteTag) === 'function'){
                that.source.deleteTag(index, function(commit){
                    if (commit){
                        that.records.splice(index, 1);
                        for (var i = index; i < that.records.length ; i++){
                            that.records[i].index -= 1;
                        }
                        for (i = 0; i < that.hiddenList.length; i++){
                            if (that.hiddenList[i] > index){
                                that.hiddenList[i]--;
                            } else if (that.hiddenList[i] === index){
                                that.hiddentList.splice(index,1);
                            }
                        }
                    }
                });
            } else {
                that.records.splice(index, 1);
                for (var i = index; i < that.records.length ; i++){
                    that.records[i].index -= 1;
                }
                for (i = 0; i < that.hiddenList.length; i++){
                    if (that.hiddenList[i] > index){
                        that.hiddenList[i]--;
                    } else if (that.hiddenList[i] === index){
                        that.hiddentList.splice(index,1);
                    }
                }
            }
            that._renderTags();
        },

        // used to hide the element with specified index
        hideItem: function (index) {
            var that = this;
            if (!(typeof(index) !== 'number' || that.hiddenList.indexOf(index) !== -1)) {
                that.hiddenList.push(index);
                var pos = -1;
                for (var i=0 ; i < that.renderedData.length; i++){
                    if (that.renderedData[i].index === index){
                        pos = i;
                    }
                }
                if ( pos !== -1) {
                    $(that._el).find('li')[pos].style.display = 'none';
                }
            }
        },

        // used to reveal the element with specified index
        showItem: function (index) {
            var that = this;
            if (that.hiddenList.indexOf(index) !== -1) {
                var pos = -1;
                for (var i=0 ; i < that.renderedData.length; i++){
                    if (that.renderedData[i].index === index){
                        pos = i;
                    }
                }
                if ( pos !== -1) {
                    $(that._el).find('li')[pos].style.display ='';
                }
                that.hiddenList.splice(that.hiddenList.indexOf(index), 1);
            }
        },

        // renders the widget
        render: function () {
            var that = this;
            that._updateSize();
            that.renderedData = [];
            that._el = $('<ul>');
            that.host.addClass(that.toThemeProperty('jqx-widget jqx-tag-cloud'));
            that._setRtl();
            that.host.append(that._el);
            that.focusedItem = null;
            that.minColor = that._parseColor(that.minColor);
            that.maxColor = that._parseColor(that.maxColor);
            that.displayLimit = parseInt(that.displayLimit);
            if (that.disabled) {
                that.host.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }

            that.addHandler(that._el, 'click', function (event) {
                if ($(document.activeElement).parents('#' + that._el[0].parentElement.id).length) {
                    // do nothing
                } else {
                    if (that.focusedItem != null) {
                        $(that.focusedItem).focus();
                    } else {
                        $(that._el).find('a')[0].focus();
                        that.focusedItem = document.activeElement;
                    }
                }
                if (that.disabled){
                    event.preventDefault();
                }

                if(event.target.tagName.toLowerCase() === 'a'){
                    event.target.focus();
                    that.focusedItem = document.activeElement;
                }
                if(event.target.tagName.toLowerCase() === 'li'){
                    $(event.target).find('a').focus();
                    that.focusedItem = document.activeElement;
                }
                var index = $(event.target).closest('li').index();
                if (index !== -1){
                    that._raiseEvent(0, {
                        label: that.renderedData[index][that.displayMember],
                        url: that.renderedData[index][that.urlMember],
                        value: that.renderedData[index][that.valueMember],
                        visibleIndex: index,
                        index: that.renderedData[index].index,
                        target: $(event.target).closest('li')[0],
                        originalEvent: event
                    });
                }
            });



            that._addKeyboardSupport();
        },

        // resize the widget
        resize: function (width, height) {
            var that = this;
            that.width = width;
            that.height = height;
            that._updateSize();
        },

        // private methods

        // handles properties updates
        propertyChangedHandler: function (object, key, oldvalue, value) {
            var that = this;
            if (key === 'source') {
                that.dataBind(object.source);
            }

            if (key === 'displayLimit') {
                that[key] = parseInt(value);
            }
            if (key === 'minColor' || key === 'maxColor') {
                that[key] = that._parseColor(value);
            }
            if (key === 'rtl') {
                that._setRtl();
                return;
            }
            if (key === 'width' || key === 'height') {
                that._updateSize();
                return;
            }
            if (key === 'textColor'){
                if(!(that.minColor && that.maxColor)) {
                    that._updateColor();
                    return;
                }
            }
            that._renderTags();
        },

        // changes the letterCase of the displayMember field
        _alterCase: function (data) {
            var that = this;

            function toTitleCase(str) {
                return str.replace(/\w\S*/g, function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            }

            if (that.alterTextCase !== 'none') {
                switch (that.alterTextCase) {
                    case 'allLower':
                        for (var i = 0; i < data.length; i++) {
                            data[i][that.displayMember] = data[i][that.displayMember].toString().toLowerCase();
                        }
                        break;
                    case 'allUpper':
                        for (i = 0; i < data.length; i++) {
                            data[i][that.displayMember] = data[i][that.displayMember].toString().toUpperCase();
                        }
                        break;
                    case 'firstUpper':
                        for (i = 0; i < data.length; i++) {
                            data[i][that.displayMember] = data[i][that.displayMember].toString().toLowerCase();
                            data[i][that.displayMember] = data[i][that.displayMember].substr(0, 1).toUpperCase() + data[i][that.displayMember].substr(1);
                        }
                        break;
                    case 'titleCase':
                        for (i = 0; i < data.length; i++) {
                            data[i][that.displayMember] = toTitleCase(data[i][that.displayMember].toString());
                        }
                        break;
                    default:
                        throw new Error("jqxTagCloud: Invalid alterTextCase value. Possible values: 'none', 'allLower', 'allUpper', 'firstUpper', 'titleCase'");
                }
            }

            return data;
        },

        _addKeyboardSupport: function () {
            var that = this;
            that.addHandler(that._el, 'keydown', function (event) {
                // Right Arrow Key
                if (event.keyCode == 39) {
                    $('a:focus').closest('li').next().find('a').focus();
                    that.focusedItem = document.activeElement;
                }

                // Left Arrow Key
                if (event.keyCode == 37) {
                    $('a:focus').closest('li').prev().find('a').focus();
                    that.focusedItem = document.activeElement;
                }
            });
        },

        _renderTags: function () {
            var that = this;
            var data = that.records.slice();
            $.each(that.records, function(index, value){
                if (value[that.displayMember] === undefined){
                    throw new Error("jqxTagCloud: 'label' property must be specified for every element.");
                }
            });

            data = that._filter(data);
            data = that._sort(data);
            data = that._alterCase(data);
            that._el.empty(); // clear content
            if (data.length === 0){
                return;
            }
            var maxValue = that._getMaxValue(data);
            var minValue = that._getMinValue(data);
            var valueRange = maxValue - minValue;
            for (var i = 0; i < data.length; i++) {

                var tagItem = that._prepareTag(data[i], minValue, valueRange);

                // append element to widget
                that._el.append(tagItem);
                if (that.hiddenList.indexOf(data[i].index) != -1) {
                    tagItem[0].style.display = 'none';
                }
            }
            that.renderedData = data;
            that.focusedItem = null;
        },

        _prepareTag: function (itemData, minValue, valueRange) {
            var that = this;

            if (!valueRange) {
                valueRange = 1;
            }

            var tagItem = $('<li>'); // create li element
            //add label to li element
            var html = '';
            if (null !== that.tagRenderer && typeof(that.tagRenderer) === 'function') {
                html = that.tagRenderer.apply(that, arguments);
            } else {
                html = itemData[that.displayMember] + (that.displayValue ? '(' + itemData[that.valueMember] + ')' : '' );
            }
            html = $('<a rel="tag">').append(html);
            var url = 'javascript:void(0)';
            if (undefined !== itemData[that.urlMember]) {
                url = (that.urlBase != null ? that.urlBase : '' ) + itemData[that.urlMember];
            }
            html.attr('href', url);

            tagItem.append(html);

            // add classes to li element
            tagItem.addClass(that.toThemeProperty('jqx-tag-cloud-item'));

            // set font size
            var fontSize = +that.minFontSize + ((that.maxFontSize - that.minFontSize) *
                ((itemData[that.valueMember] - minValue) / valueRange));
            tagItem[0].style.fontSize = fontSize + that.fontSizeUnit;

            // set font color gradient
            if (that.minColor && that.maxColor) {
                var c = that.minColor.split('(')[1].split(')')[0];
                c = c.split(',');
                var red = parseInt(c[0]);
                var green = parseInt(c[1]);
                var blue = parseInt(c[2]);
                var alpha = parseFloat(c[3]);
                c = that.maxColor.split('(')[1].split(')')[0];
                c = c.split(',');
                var maxRed = parseInt(c[0]);
                var maxGreen = parseInt(c[1]);
                var maxBlue = parseInt(c[2]);
                var maxAlpha = parseFloat(c[3]);

                red += Math.floor(((itemData[that.valueMember] - minValue) / valueRange) * (maxRed - red));
                green += Math.floor(((itemData[that.valueMember] - minValue) / valueRange) * (maxGreen - green));
                blue += Math.floor(((itemData[that.valueMember] - minValue) / valueRange) * (maxBlue - blue));
                alpha += ((itemData[that.valueMember] - minValue) / valueRange) * (maxAlpha - alpha);
                tagItem[0].style.color = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';


                tagItem.find('a')[0].style.color = 'inherit';
            } else if (that.textColor !== null){
                tagItem[0].style.color = that.textColor;
                tagItem.find('a')[0].style.color = 'inherit';
            }
            return tagItem;

        },

        _parseColor: function(color){
            function colourNameToHex(colour)
            {
                var colours = {'aliceblue':'#f0f8ff','antiquewhite':'#faebd7','aqua':'#00ffff','aquamarine':'#7fffd4','azure':'#f0ffff',
                    'beige':'#f5f5dc','bisque':'#ffe4c4','black':'#000000','blanchedalmond':'#ffebcd','blue':'#0000ff','blueviolet':'#8a2be2','brown':'#a52a2a','burlywood':'#deb887',
                    'cadetblue':'#5f9ea0','chartreuse':'#7fff00','chocolate':'#d2691e','coral':'#ff7f50','cornflowerblue':'#6495ed','cornsilk':'#fff8dc','crimson':'#dc143c','cyan':'#00ffff',
                    'darkblue':'#00008b','darkcyan':'#008b8b','darkgoldenrod':'#b8860b','darkgray':'#a9a9a9','darkgreen':'#006400','darkkhaki':'#bdb76b','darkmagenta':'#8b008b','darkolivegreen':'#556b2f',
                    'darkorange':'#ff8c00','darkorchid':'#9932cc','darkred':'#8b0000','darksalmon':'#e9967a','darkseagreen':'#8fbc8f','darkslateblue':'#483d8b','darkslategray':'#2f4f4f','darkturquoise':'#00ced1',
                    'darkviolet':'#9400d3','deeppink':'#ff1493','deepskyblue':'#00bfff','dimgray':'#696969','dodgerblue':'#1e90ff',
                    'firebrick':'#b22222','floralwhite':'#fffaf0','forestgreen':'#228b22','fuchsia':'#ff00ff',
                    'gainsboro':'#dcdcdc','ghostwhite':'#f8f8ff','gold':'#ffd700','goldenrod':'#daa520','gray':'#808080','green':'#008000','greenyellow':'#adff2f',
                    'honeydew':'#f0fff0','hotpink':'#ff69b4',
                    'indianred ':'#cd5c5c','indigo':'#4b0082','ivory':'#fffff0','khaki':'#f0e68c',
                    'lavender':'#e6e6fa','lavenderblush':'#fff0f5','lawngreen':'#7cfc00','lemonchiffon':'#fffacd','lightblue':'#add8e6','lightcoral':'#f08080','lightcyan':'#e0ffff','lightgoldenrodyellow':'#fafad2',
                    'lightgrey':'#d3d3d3','lightgreen':'#90ee90','lightpink':'#ffb6c1','lightsalmon':'#ffa07a','lightseagreen':'#20b2aa','lightskyblue':'#87cefa','lightslategray':'#778899','lightsteelblue':'#b0c4de',
                    'lightyellow':'#ffffe0','lime':'#00ff00','limegreen':'#32cd32','linen':'#faf0e6',
                    'magenta':'#ff00ff','maroon':'#800000','mediumaquamarine':'#66cdaa','mediumblue':'#0000cd','mediumorchid':'#ba55d3','mediumpurple':'#9370d8','mediumseagreen':'#3cb371','mediumslateblue':'#7b68ee',
                    'mediumspringgreen':'#00fa9a','mediumturquoise':'#48d1cc','mediumvioletred':'#c71585','midnightblue':'#191970','mintcream':'#f5fffa','mistyrose':'#ffe4e1','moccasin':'#ffe4b5',
                    'navajowhite':'#ffdead','navy':'#000080',
                    'oldlace':'#fdf5e6','olive':'#808000','olivedrab':'#6b8e23','orange':'#ffa500','orangered':'#ff4500','orchid':'#da70d6',
                    'palegoldenrod':'#eee8aa','palegreen':'#98fb98','paleturquoise':'#afeeee','palevioletred':'#d87093','papayawhip':'#ffefd5','peachpuff':'#ffdab9','peru':'#cd853f','pink':'#ffc0cb','plum':'#dda0dd','powderblue':'#b0e0e6','purple':'#800080',
                    'red':'#ff0000','rosybrown':'#bc8f8f','royalblue':'#4169e1',
                    'saddlebrown':'#8b4513','salmon':'#fa8072','sandybrown':'#f4a460','seagreen':'#2e8b57','seashell':'#fff5ee','sienna':'#a0522d','silver':'#c0c0c0','skyblue':'#87ceeb','slateblue':'#6a5acd','slategray':'#708090','snow':'#fffafa','springgreen':'#00ff7f','steelblue':'#4682b4',
                    'tan':'#d2b48c','teal':'#008080','thistle':'#d8bfd8','tomato':'#ff6347','turquoise':'#40e0d0',
                    'violet':'#ee82ee',
                    'wheat':'#f5deb3','white':'#ffffff','whitesmoke':'#f5f5f5',
                    'yellow':'#ffff00','yellowgreen':'#9acd32'};

                if (typeof colours[colour.toLowerCase()] != 'undefined')
                    return colours[colour.toLowerCase()];

                return false;
            }

            var el = $('<span>').css('color', color);
            color = el.css('color');
            var r, g, b;
            if (color.substr(0,4) === 'rgba') {
                return color;
            } else if (color.substr(0,3) === 'rgb'){
                var c = color.split('(')[1].split(')')[0];
                c = c.split(',');
                r = parseInt(c[0]);
                g = parseInt(c[1]);
                b = parseInt(c[2]);
                return ('rgba(' + r + ',' + g + ',' + b +',1)');
            } else if (color.substr(0,1) === '#' && color.length === 7){
                r = parseInt(color.substr(1, 2), 16);
                g = parseInt(color.substr(3, 2), 16);
                b = parseInt(color.substr(5, 2), 16);
                return ('rgba(' + r + ',' + g + ',' + b +',1)');
            } else if (color.substr(0,1) === '#' && color.length === 4){
                r = parseInt(color.substr(1, 1) + color.substr(1, 1), 16);
                g = parseInt(color.substr(2, 1) + color.substr(2, 1), 16);
                b = parseInt(color.substr(3, 1) + color.substr(3, 1), 16);
                return ('rgba(' + r + ',' + g + ',' + b +',1)');
            } else if (color = colourNameToHex(color)){
                r = parseInt(color.substr(1, 2), 16);
                g = parseInt(color.substr(3, 2), 16);
                b = parseInt(color.substr(5, 2), 16);
                return ('rgba(' + r + ',' + g + ',' + b +',1)');
            }
            return color;
        },

        _events: ['itemClick', 'bindingUpdateComplete', 'bindingComplete'],

        _raiseEvent: function (eventId, args) {
            var eventType = this._events[eventId],
                event = $.Event(eventType);
            event.args = args;
            return this.host.trigger(event);
        },

        _filter: function (data) {
            var that = this;

            if (that.minValueToDisplay != 0) {
                for (var i = 0; i < data.length;) {
                    if (data[i][that.valueMember] < that.minValueToDisplay) {
                        data.splice(i, 1);
                    } else {
                        i++;
                    }
                }
            }

            if (that.maxValueToDisplay != 0) {
                for (var i = 0; i < data.length;) {
                    if (data[i][that.valueMember] > that.maxValueToDisplay) {
                        data.splice(i, 1);
                    } else {
                        i++;
                    }
                }
            }

            if (that.displayLimit != null && !isNaN(that.displayLimit)) {
                if (that.takeTopWeightedItems === true) {
                    data.sort(function (a, b) {
                        if (a[that.valueMember] < b[that.valueMember]) {
                            return 1;
                        }
                        if (a[that.valueMember] > b[that.valueMember]) {
                            return -1;
                        }
                        return 0;
                    });
                    data = data.slice(0, that.displayLimit);
                    data.sort(function (a, b) {
                        if (a.index < b.index) {
                            return -1;
                        }
                        if (a.index > b.index) {
                            return 1;
                        }
                        return 0;
                    });
                }
                else {
                    data = data.slice(0, that.displayLimit);
                }
            }
            return data;
        },

        _sort: function (data) {
            var that = this;
            if (that.sortBy !== 'none') {
                if (that.sortBy === 'label') {
                    data.sort(function (a, b) {
                        if (a[that.displayMember] < b[that.displayMember]) { return -1; }
                        if (a[that.displayMember] > b[that.displayMember]) { return 1; }
                        return 0;
                    });
                }
                else if (that.sortBy === 'value') {
                    data.sort(function (a, b) {
                        if (a[that.valueMember] < b[that.valueMember]) { return -1; }
                        if (a[that.valueMember] > b[that.valueMember]) { return 1; }
                        return 0;
                    });
                } else {
                    throw new Error("jqxTagCloud: sortBy option needs to be either 'none' or 'label' or 'value'");
                }

                if (that.sortOrder === 'ascending') {
                    return data;
                } else if (that.sortOrder === 'descending') {
                    return data.reverse();
                } else {
                    throw new Error("jqxTagCloud: sortOrder option needs to be either 'ascending' or 'descending'");
                }
            }
            return data;
        },

        _getMaxValue: function (data) {
            var that = this;
            var max = data[0][that.valueMember];
            for (var i = 0; i < data.length; i++) {
                if (max < data[i][that.valueMember]) {
                    max = data[i][that.valueMember];
                }
            }
            return max;
        },

        _getMinValue: function (data) {
            var that = this;
            var min = data[0][that.valueMember];
            for (var i = 0; i < data.length; i++) {
                if (min > data[i][that.valueMember]) {
                    min = data[i][that.valueMember];
                }
            }
            return min;
        },

        _setSourceData: function (source) {
            var that = this;
            that.records = source.records;
            for (var i = 0; i < that.records.length; i++) {
                var val = that.records[i][that.valueMember] !== undefined ? parseFloat(that.records[i][that.valueMember]) : 0;
                that.records[i][that.valueMember] = isNaN(val) ? 0 : val;
                that.records[i].index = i;
            }
            that.hiddenList = [];
        },

        _updateColor: function (){
            var that = this;
            if(that.textColor){
                $(that._el).find('li').css('color', that.textColor);
            }
        },

        _updateSize: function () {
            var that = this;
            if (that.width) {
                that.host.width(that.width);
            }
            if (that.height) {
                that.host.height(that.height);
            }
        },

        _setRtl: function () {
            var that = this;
            if (that.rtl) {
                that.host.addClass(that.toThemeProperty('jqx-rtl'));
            } else {
                that.host.removeClass(that.toThemeProperty('jqx-rtl'));
            }
        }

    });
})(jqxBaseFramework);