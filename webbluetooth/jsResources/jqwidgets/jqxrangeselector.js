/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

/*
* Depends:
*   jqxcore.js
*/

(function ($) {

    $.jqx.jqxWidget("jqxRangeSelector", "", {});

    $.extend($.jqx._jqxRangeSelector.prototype, {
        defineInstance: function () {
            var settings = {
                //// properties
                width: 400,
                height: 100,
                min: 0, // possible values: number, date object, date string
                max: 100, // possible values: number, date object, date string
                range: { from: 0, to: Infinity, min: 0, max: Infinity }, // possible values for from and to: number, date object, date string,
                // possible values for min and max: number, object with one of the properties: { milliseconds, seconds, minutes, hours, days, weeks }, "millisecond", "second", "minute", "hour", "day", "week"
                majorTicksInterval: 10, // possible values: number, object with one of the properties: { milliseconds, seconds, minutes, hours, days, weeks, months, years }, "millisecond", "second", "minute", "hour", "day", "week", "month", "year"
                minorTicksInterval: 1, // possible values: number, object with one of the properties: { milliseconds, seconds, minutes, hours, days, weeks, months, years }, "millisecond", "second", "minute", "hour", "day", "week", "month", "year"
                showMajorTicks: true, // possible values: true, false
                showMinorTicks: false, // possible values: true, false
                snapToTicks: true, // possible values: true, false
                labelsFormat: null, // possible values: for numbers: "d", "f", "n", "c", "p", for dates: "d", "dd", "ddd", "dddd", "h", "hh", "H", "HH", "m", "mm", "M", "MM", "MMM", "MMMM", "s", "ss", "t", "tt", "y", "yy", "yyy", "yyyy"
                markersFormat: null, // possible values: for numbers: "d", "f", "n", "c", "p", for dates: "d", "dd", "ddd", "dddd", "h", "hh", "H", "HH", "m", "mm", "M", "MM", "MMM", "MMMM", "s", "ss", "t", "tt", "y", "yy", "yyy", "yyyy"
                showLabels: true,
                labelsOnTicks: true,
                markersPosition: "top",
                labelsFormatFunction: null, // callback function
                groupLabelsFormatFunction: null, // callback function
                markersFormatFunction: null, // callback function
                showGroupLabels: false, // possible values: true, false
                showMarkers: true, // possible values: true, false
                resizable: true, // possible values: true, false
                moveOnClick: true, // possible values: true, false
                disabled: false, // possible values: true, false
                rtl: false, // possible values: true, false
                padding: "auto",
                //// events
                events: ["change"]
            }
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            var that = this;
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();

            // checks if the file jqxdata.js has been referenced
            if (!$.jqx.dataAdapter) {
                throw new Error("jqxRangeSelector: Missing reference to the following module: 'jqxdata.js'.");
            };
            var hidden = $.jqx.isHidden(this.host);
            this.render();

            var width = this.host.width();
            var height = this.host.height();
            $.jqx.utilities.resize(this.host, function () {
                var hostWidth = that.host.width();
                var hostHeight = that.host.height();

                that.range = that.getRange();
                if (hidden) {
                    that.refresh();
                    hidden = false;
                }
                else {
                    if (width != hostWidth || height != hostHeight) {
                        that.refresh();
                    }
                }

                width = that.host.width();
                height = that.host.height();
            });
        },

        // renders the widget
        render: function () {
            // checks if this is the initialization of the widget or if the method is called manually
            if (this.host.children().length > 1 || this.rangeSelector) {
                this._removeHandlers();
                if (this.rangeSelector) {
                    this.rangeSelector.remove();
                }
            };

            this.host.addClass(this.toThemeProperty("jqx-widget"));
            this.host.addClass(this.toThemeProperty("jqx-rangeselector"));
            this.host.children(":eq(0)").addClass(this.toThemeProperty("jqx-rangeselector-content"));
            this._id = this.element.id;

            // checks the type of data
            if (typeof this.min == "string" || this.min instanceof Date) {
                this._dataType = "date";
            } else {
                this._dataType = "number";
            };

            // gives numeric values to private properties
            this._privateProperties();

            // corrects possible contradictions in initial properties
            this._checkProperties();

            // sets the size of the widget
            this._setSize();

            // creates the scale of the widget
            this._scale();

            // appends the slider and adds its functionality
            this._initSlider();
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (initialRefresh == true) {
                return;
            };

            this.host.children('.jqx-rangeselector-ticks-container').remove();
            this._removeHandlers();

            this._privateProperties();
            this._checkProperties();
            this._setSize();
            this._scale();
            this._initSlider();
        },

        // destroys the widget
        destroy: function () {
            this._removeHandlers();
            this.host.remove();
        },

        // sets the slider range
        setRange: function (from, to) {
            if (from > to) {
                throw new Error("jqxRangeSelector: range object initialization error. 'min' should be less than 'max'");
                return;
            }

            var currentRange = this._getValue();
            if (currentRange.from != from || currentRange.to != to) {
                // checks if the set values are not in the same format as the slider values
                var valueType = this._dataType == "number" ? "numeric" : "date";
                var wrongFormatExceptionMessage = "The set values are in the wrong format. Please set " + valueType + " values.";
                if (typeof from == "string" || from instanceof Date) {
                    if (this._dataType == "number") {
                        throw new Error(wrongFormatExceptionMessage);
                    };
                }
                else {
                    if (this._dataType == "date") {
                        throw new Error(wrongFormatExceptionMessage);
                    };
                };

                from = this._validateInput(from);
                to = this._validateInput(to);

                // checks whether the new values are outside the boundaries
                if (from > this._max) {
                    from = this._max;
                };
                if (from < this._min) {
                    from = this._min;
                };
                if (to > this._max) {
                    to = this._max;
                };
                if (to < this._min) {
                    to = this._min;
                };

                var newSpan = to - from;
                if (newSpan > this._range._max) {
                    to = from + this._range._max;
                }
                else if (newSpan < this._range._min) {
                    to = from + this._range._min;
                };

                var fromIndex = this._valuesArray.indexOf(from);
                var toIndex = this._valuesArray.indexOf(to);
                var fromTick = this._ticksArray[fromIndex];
                var toTick = this._ticksArray[toIndex];
                var width = Math.abs(toTick - fromTick);
                this.slider[0].style.width = width + 'px';
                var left = !this.rtl ? fromTick : toTick;
                this.slider[0].style.left = left;

                this._moveSlider(left);

                if (this._dataType == "date") {
                    var from = new Date(from);
                    var to = new Date(to);
                };

                this._raiseEvent("0", { type: null, from: from, to: to });
            };
        },

        val: function (value) {
            if (arguments.length == 0) {
                return this.getRange();
            }

            if (value.from != undefined) {
                this.setRange(value.from, value.to);
            }
        },

        // gets the slider range
        getRange: function () {
            var range = this._getValue();
            return range;
        },

        //// private methods

        // executed when a property is changed
        propertyChangedHandler: function (object, key, oldvalue, value) {
            switch (key) {
                case "showMinorTicks":
                    if (value == true) {
                        $("#" + this._id + " .jqx-rangeselector-ticks-minor").css("visibility", "visible");
                    } else {
                        $("#" + this._id + " .jqx-rangeselector-ticks-minor").css("visibility", "hidden");
                    };
                    break;
                case "showMarkers":
                    var markers = $("#" + this._id + "LeftMarker, #" + this._id + "RightMarker, #" + this._id + "LeftMarkerArrow, #" + this._id + "RightMarkerArrow");
                    if (value == true) {
                        markers.css("visibility", "visible");
                    } else {
                        markers.css("visibility", "hidden");
                    };
                    break;
                default:
                    this.refresh();
            };
        },

        // raises an event
        _raiseEvent: function (id, args) {
            var evt = this.events[id];
            var event = new $.Event(evt);
            event.owner = this;
            event.args = args;

            try {
                var result = this.host.trigger(event);
            }
            catch (error) {
            }

            return result;
        },

        // sets the size of the widget
        _setSize: function () {
            this.host.width(this.width);
            this.host.height(this.height);
        },

        resize: function (width, height) {
            this.width = width;
            this.height = height;
            this.refresh();
        },

        // creates the scale of the widget
        _scale: function () {
            var width = this.host.width();
            var interval = this._max - this._min;

            this._unitPerPixel = parseFloat((interval / width).toFixed(4));
            this._pixelPerUnit = width / interval; 4

            // minimum and maximum width
            this._minWidth = this._roundNumber(this._range._min / this._unitPerPixel);
            this._maxWidth = this._roundNumber(this._range._max / this._unitPerPixel);
            this._minWidth = parseInt(this._minWidth);
            this._maxWidth = parseInt(this._maxWidth);

            if (this._dataType == "number") {
                // major ticks
                this._majorTicksCount = interval / this.majorTicksInterval;

                this._majorTicksCount = Math.floor(this._majorTicksCount) + 1;
                this._majorTicksDistance = parseInt(this._roundNumber(width / (interval / this.majorTicksInterval)));

                // minor ticks
                this._unitsCount = interval / this.minorTicksInterval;
                this._unitsCount = Math.floor(this._unitsCount) + 1;
                this._unitsDistance = parseInt(this._roundNumber(width / (interval / this.minorTicksInterval)));
            };

            // appends ticks and labels
            this._addTicks();
        },

        // appends ticks and labels
        _addTicks: function () {
            var that = this;
            this.host.append("<div id='" + this._id + "TicksContainer' class='jqx-rangeselector-ticks-container'></div>");
            this.rangeSelector = $("#" + this._id + "TicksContainer");
            // an array containing the major tick/label positions of the ticks in pixels, relative to the host left offset. 
            this._majorTicksArray = new Array();
            // an array containing the positions of the ticks in pixels, relative to the host left offset
            this._ticksArray = new Array();
            // an array containing the values at the positions of each tick
            this._valuesArray = new Array();

            // string to append to ticks container
            var appendString = new String();

            $("#" + this._id + "TicksContainer").append("<div id='labelPlaceholder' style='visibility: hidden; position: absolute;'></div>");

            var labelTop = this.rangeSelector.height();

            if (this._dataType == "number") {
                appendString = this._addNumericTicks(labelTop);
            } else {
                appendString = this._addDateTicks(labelTop);
            };

            var bottomPadding = 0;

            if (this.showLabels) {
                bottomPadding += $("#labelPlaceholder").outerHeight() + 6;
            }

            if (this._dataType != "number") {
                if (this.showGroupLabels) {
                    bottomPadding += $("#labelPlaceholder").outerHeight() + 6;
                }
            }

            if (this.padding == "auto") {
                this.host.css('padding-bottom', bottomPadding);
            }
            $("#labelPlaceholder").remove();

            // appends the ticks and labels
            $("#" + this._id + "TicksContainer").append(appendString);

            // ticks array
            this._ticksArray.sort(function (a, b) { return a - b });
            for (var i = 1; i < this._ticksArray.length; i++) {
                this._ticksArray[i] = this._roundNumber(this._ticksArray[i]);
            };
            // values array
            this._valuesArray.sort(function (a, b) { return a - b });
            if (this._dataType == "number") {
                for (var i = 1; i < this._valuesArray.length; i++) {
                    this._valuesArray[i] = this._roundNumber(this._valuesArray[i], "marker", true);
                };
            };

            for (var i = 1; i < this._ticksArray.length; i++) {
                if (this._ticksArray[i - 1] == this._ticksArray[i]) {
                    this._ticksArray.splice(i, 1);
                    this._valuesArray.splice(i, 1);
                };
            };
            if (this.rtl) {
                this._valuesArray = this._valuesArray.reverse();
            }
        },

        // appends ticks when the data type is numeric
        _addNumericTicks: function (labelTop) {
            var that = this;
            var appendString = new String();

            // major ticks and labels
            var left = 0;
            var val = this._min;
            var rtlval = this._max;
            for (var i = 0; i < this._majorTicksCount; i++) {
                var tickId = this._id + "LabelTick" + (i + 1);
                if (i == this._majorTicksCount - 1) {
                    left = this.host.width();
                }

                var showTicks = that.showMajorTicks ? "visible" : "hidden";
                appendString += "<div id='" + tickId + "' class='" + this.toThemeProperty('jqx-rangeselector-ticks') + " " + this.toThemeProperty('jqx-slider-tick-horizontal') + "' style='visibility: " + showTicks + "; left: " + left + "px;'></div>";
                this._ticksArray.push(left);
                this._majorTicksArray.push(left);
                var labelId = this._id + "Label" + (i + 1);
                var labelValue = val;
                this._valuesArray.push(parseFloat(labelValue.toFixed(4)));
                if (that.rtl) {
                    labelValue = rtlval;
                }
                labelValue = this._formatOutput(labelValue, this.labelsFormat, this.minorTicksInterval >= 1 ? 0 : 2, "label");
                $("#labelPlaceholder").html(labelValue);
                var labelWidth = $("#labelPlaceholder").width();
                var showLabels = that.showLabels ? "visible" : "hidden";
                if (that.labelsOnTicks) {
                    appendString += "<div id='" + labelId + "' class='" + this.toThemeProperty('jqx-rangeselector-labels') + "' style='visibility: " + showLabels + "; left: " + (left - labelWidth / 2) + "px; top: " + labelTop + "px;'>" + labelValue + "</div>";
                }
                var currentLeft = left;
                val = val + this.majorTicksInterval;
                rtlval = rtlval - this.majorTicksInterval;
                var left = (val - that._min) / that._unitPerPixel;
                left = parseInt(left);

                if (!this.labelsOnTicks && i < this._majorTicksCount - 1) {
                    var labelLeft = Math.abs(currentLeft - left);
                    appendString += "<div id='" + labelId + "' class='" + this.toThemeProperty('jqx-rangeselector-labels') + "' style='visibility: " + showLabels + "; left: " + (currentLeft + labelLeft / 2 - labelWidth / 2) + "px; top: " + labelTop + "px;'>" + labelValue + "</div>";
                }
            };

            // minor ticks
            var left = 0;
            var visibility = this.showMinorTicks ? "visible" : "hidden";
            var val = this._min;
            for (var i = 0; i < this._unitsCount; i++) {
                var tickId = this._id + "MinorTick" + (i + 1);
                if (i == this._unitsCount - 1) {
                    left = this.host.width();
                }

                appendString += "<div id='" + tickId + "' class='" + this.toThemeProperty('jqx-rangeselector-ticks') + " " + this.toThemeProperty('jqx-rangeselector-ticks-minor') + " " + this.toThemeProperty('jqx-slider-tick-horizontal') + "' style='visibility: " + visibility + "; left: " + left + "px;'></div>";
                var unitValue = val;

                if (this._valuesArray.indexOf(parseFloat(unitValue.toFixed(4))) === -1) {
                    this._valuesArray.push(parseFloat(unitValue.toFixed(4)));
                    this._ticksArray.push(left);
                }

                val = val + this.minorTicksInterval;
                var left = (val - that._min) / that._unitPerPixel;
                left = parseInt(left);
            };

            return appendString;
        },

        _getMillisecondsByInterval: function (dateInterval) {
            var result = {};
            if (dateInterval == "year" || dateInterval.years) {
                result.divisor = dateInterval.years ? dateInterval.years : 1;
                return result.divisor * (365 * 24 * 3600 * 1000);
            } else if (dateInterval == "month" || dateInterval.months) {
                result.divisor = dateInterval.months ? dateInterval.months : 1;
                return result.divisor * (30 * 24 * 3600 * 1000);
            } else if (dateInterval == "week" || dateInterval.weeks) {
                result.divisor = dateInterval.weeks ? dateInterval.weeks : 1;
                return result.divisor * (7 * 24 * 3600 * 1000);
            } else if (dateInterval == "day" || dateInterval.days) {
                result.divisor = dateInterval.days ? dateInterval.days : 1;
                return result.divisor * (24 * 3600 * 1000);
            } else if (dateInterval == "hour" || dateInterval.hours) {
                result.divisor = dateInterval.hours ? dateInterval.hours : 1;
                return result.divisor * (3600 * 1000);
            } else if (dateInterval == "minute" || dateInterval.minutes) {
                result.divisor = dateInterval.minutes ? dateInterval.minutes : 1;
                return result.divisor * 60 * 1000;
            } else if (dateInterval == "second" || dateInterval.seconds) {
                result.divisor = dateInterval.seconds ? dateInterval.seconds : 1;
                return result.divisor * 1000;
            } else if (dateInterval == "millisecond" || dateInterval.milliseconds) {
                result.divisor = dateInterval.milliseconds ? dateInterval.milliseconds : 1;
                return result.divisor * 1;
            };
            return result;
        },

        // apends ticks when the data type is date
        _addDateTicks: function (labelTop) {
            var that = this;
            var appendString = new String();

            var checkPeriod = function (ticksType) {
                var ticksInterval = ticksType == "majorTicksInterval" ? that.majorTicksInterval : that.minorTicksInterval;
                var result = new Object();
                if (ticksInterval == "year" || ticksInterval.years) {
                    result.period = "year";
                    result.interval = 86400000; // 1 day
                    result.divisor = ticksInterval.years ? ticksInterval.years : 1;
                    result.value = result.divisor * (365 * 24 * 3600 * 1000);
                } else if (ticksInterval == "month" || ticksInterval.months) {
                    result.period = "month";
                    result.interval = 86400000; // 1 day
                    result.divisor = ticksInterval.months ? ticksInterval.months : 1;
                    result.value = result.divisor * (30 * 24 * 3600 * 1000);
                } else if (ticksInterval == "week" || ticksInterval.weeks) {
                    result.period = "week";
                    result.interval = 86400000; // 1 day
                    result.divisor = ticksInterval.weeks ? ticksInterval.weeks : 1;
                    result.value = result.divisor * (7 * 24 * 3600 * 1000);
                } else if (ticksInterval == "day" || ticksInterval.days) {
                    result.period = "day";
                    result.interval = 3600000; // 1 hour
                    result.divisor = ticksInterval.days ? ticksInterval.days : 1;
                    result.value = result.divisor * (24 * 3600 * 1000);
                } else if (ticksInterval == "hour" || ticksInterval.hours) {
                    result.period = "hour";
                    result.interval = 60000; // 1 minute
                    result.divisor = ticksInterval.hours ? ticksInterval.hours : 1;
                    result.value = result.divisor * (3600 * 1000);
                } else if (ticksInterval == "minute" || ticksInterval.minutes) {
                    result.period = "minute";
                    result.interval = 60 * 1000; // 1 minute
                    result.divisor = ticksInterval.minutes ? ticksInterval.minutes : 1;
                    result.value = result.divisor * 60 * 1000;
                } else if (ticksInterval == "second" || ticksInterval.seconds) {
                    result.period = "second";
                    result.interval = 1000; // 1 second
                    result.divisor = ticksInterval.seconds ? ticksInterval.seconds : 1;
                    result.value = result.divisor * 1000;
                } else if (ticksInterval == "millisecond" || ticksInterval.milliseconds) {
                    result.period = "millisecond";
                    result.interval = 1; // 1 millisecond
                    result.divisor = ticksInterval.milliseconds ? ticksInterval.milliseconds : 1;
                    result.value = result.divisor * 1;
                };
                return result;
            };

            var getResult = function (milliseconds, period) {
                var date = new Date(milliseconds);
                var day = date.getDate();

                var yearTrue = period == "year" && date.getMonth() == 0 && day == 1;
                var monthTrue = period == "month" && day == 1;
                var weekTrue = period == "week" && date.getDay() == 0;
                var dayTrue = period == "day" && date.getHours() == 0;
                var hourTrue = period == "hour" && date.getMinutes() == 0;
                var minuteTrue = period == "minute" && date.getSeconds() == 0;
                var secondTrue = period == "minute" && date.getMilliseconds() == 0;
                var millisecondTrue = period == "millisecond";

                if (yearTrue || monthTrue || weekTrue || dayTrue || hourTrue || minuteTrue || secondTrue || millisecondTrue) {
                    return true;
                } else {
                    return false;
                };
            };

            var addSingleTick = function (i, ticksType, number) {
                var left = (i - that._min) / that._unitPerPixel;
                if (that.rtl) {
                    if (ticksType == "majorTicksInterval") {
                        i = that._dateMajorTicks[that._dateMajorTicks.length - number];
                    }
                    else {
                        i = that._dateMinorTicks[that._dateMinorTicks.length - number];
                    }
                }
                left = parseInt(left);

                var value = i;
                if (that._valuesArray.indexOf(value) === -1) {
                    that._ticksArray.push(left);
                    that._valuesArray.push(value);
                    if (ticksType == "majorTicksInterval") {
                        that._majorTicksArray.push(left);
                    }
                }

                if (ticksType == "majorTicksInterval") {
                    // major ticks
                    var majorTickId = that._id + "LabelTick" + number;
                    var visibility = that.showMajorTicks ? "visible" : "hidden";
                    appendString += "<div id='" + majorTickId + "' class='" + that.toThemeProperty('jqx-rangeselector-ticks') + " " + that.toThemeProperty('jqx-slider-tick-horizontal') + "' style='visibility: " + visibility + "; left: " + left + "px;'></div>";

                    // labels
                    var labelValue = value;
                    labelValue = that._formatOutput(labelValue, that.labelsFormat, that.labelPrecision, "label");
                    $("#labelPlaceholder").html(labelValue);
                    var labelWidth = $("#labelPlaceholder").width();
                    var labelId = that._id + "Label" + number;
                    var showLabels = that.showLabels ? "visible" : "hidden";

                    if (!that.labelsOnTicks) {
                        var ticksInterval = that._getMillisecondsByInterval(that.majorTicksInterval) / that._unitPerPixel;
                        var labelLeft = ticksInterval / 2;
                        appendString += "<div id='" + labelId + "' class='" + that.toThemeProperty('jqx-rangeselector-labels') + "' style='visibility: " + showLabels + "; left: " + (labelLeft + left - labelWidth / 2) + "px; top: " + labelTop + "px;'>" + labelValue + "</div>";
                    }
                    else if (that.labelsOnTicks) {
                        appendString += "<div id='" + labelId + "' class='" + that.toThemeProperty('jqx-rangeselector-labels') + "' style='visibility: " + showLabels + "; left: " + (left - labelWidth / 2) + "px; top: " + labelTop + "px;'>" + labelValue + "</div>";
                    }
                } else {
                    // minor ticks
                    var visibility = that.showMinorTicks ? "visible" : "hidden";
                    var minorTickId = that._id + "MinorTick" + number;
                    appendString += "<div id='" + minorTickId + "' class='" + that.toThemeProperty('jqx-rangeselector-ticks') + " " + that.toThemeProperty('jqx-rangeselector-ticks-minor') + " " + that.toThemeProperty('jqx-slider-tick-horizontal') + "' style='visibility: " + visibility + "; left: " + left + "px;'></div>";
                };
            };

            // appends major ticks, labels and minor ticks
            var appendMultiple = function (ticksType, data, measure) {
                var iterator = 0;
                var number = 1;
                var oldHour = new Date(that._min).getHours();
                var dayCheck = data.interval == 86400000 ? true : false;
                var left = 0;
                var ticks = new Array();
                for (var i = that._min; i <= that._max; i += data.interval) {
                    // daylight saving time correction
                    if (dayCheck == true) {
                        var newHour = new Date(i).getHours();
                        if (oldHour != newHour) {
                            var correction;
                            if (newHour == 1) {
                                correction = 1;
                            } else if (newHour == 23) {
                                correction = -1;
                            };
                            i = i - correction * 3600000;
                            oldHour = new Date(i).getHours();
                        };
                    };

                    var result = getResult(i, data.period);
                    if (result == true) {
                        if (iterator % data.divisor == 0) {
                            if (measure) {
                                ticks.push(i);
                            }
                            else {
                                addSingleTick(i, ticksType, number, data.interval);
                            }
                            number++;
                        };
                        iterator++;
                    };
                };
                return ticks;
            };

            that._dateMajorTicks = appendMultiple("majorTicksInterval", checkPeriod("majorTicksInterval"), true);
            that._dateMinorTicks = appendMultiple("minorTicksInterval", checkPeriod("minorTicksInterval"), true);

            appendMultiple("majorTicksInterval", checkPeriod("majorTicksInterval"));
            appendMultiple("minorTicksInterval", checkPeriod("minorTicksInterval"));

            // group labels
            if (this.showGroupLabels == true && this.showLabels) {
                this._addGroupLabels($("#labelPlaceholder").height() + labelTop);
            };

            return appendString;
        },

        // appends group labels
        _addGroupLabels: function (groupLabelTop) {
            var that = this;
            var min = new Date(this._min);
            var max = new Date(this._max);

            if (max.getFullYear() - min.getFullYear() > 0) {
                var period = "year";
                var interval = 86400000; // 1 day;
            } else if (max.getMonth() - min.getMonth() > 0) {
                var period = "month";
                var interval = 86400000; // 1 day
            }
            else if (max.getDate() - min.getDate() > 0) {
                var period = "day";
                var interval = 3600000; // 1 hour
            } else {
                return;
            };

            var getResult = function (milliseconds) {
                var date = new Date(milliseconds);
                var year = date.getFullYear();
                var month = date.getMonth();
                var monthDay = date.getDate();
                var currentValue;
                var check = true;

                if (period == "year" && month == 0 && monthDay == 1) {
                    currentValue = year;
                } else if (period == "month" && monthDay == 1) {
                    currentValue = $.jqx.dataFormat.formatdate(date, "MMMM");
                    if (month == 0) {
                        currentValue = year + " " + currentValue;
                    };
                } else if (period == "day" && date.getHours() == 0) {
                    currentValue = $.jqx.dataFormat.formatdate(date, "dddd");
                } else {
                    check = false;
                };

                var value;
                if ((check == true) && that.groupLabelsFormatFunction) {
                    value = that.groupLabelsFormatFunction(currentValue, date);
                } else {
                    value = currentValue;
                };

                var result = { check: check, value: value };
                return result;
            };

            var appendString = new String();
            var groupLabelsTicksClasses = this.toThemeProperty('jqx-rangeselector-group-labels-ticks') + " " + this.toThemeProperty('jqx-slider-tick-horizontal');
            var number = 1;

            for (var i = this._min; i < this._max; i += interval) {
                var result = getResult(i);
                if (result.check == true) {
                    var left = (i - this._min) / this._unitPerPixel;
                    appendString += "<div class='" + this.toThemeProperty('jqx-rangeselector-labels') + "' style='left: " + left + "px; top: " + groupLabelTop + "px;'><div class='" + groupLabelsTicksClasses + "'></div><div id='" + this._id + "GroupLabel" + number + "' class='" + this.toThemeProperty('jqx-rangeselector-group-labels') + "' style='margin-left: 5px;'>" + result.value + "</div></div>";
                    number++;
                };
            };
            $("#" + this._id + "TicksContainer").append(appendString);
        },

        _updateCursor: function (x, y) {
            // cursor
            var cursor = this.element.style.cursor;
            var sliderLeft = this.slider.offset().left;
            var sliderWidth = parseInt(this.slider[0].style.width);
            var sliderRight = sliderLeft + sliderWidth;
            if ((((x > sliderLeft - 5) && (x < sliderLeft + 5)) || ((x > sliderRight - 5) && (x < sliderRight + 5)))) {
                if (cursor == "" || cursor == "auto") {
                    this.element.style.cursor = "e-resize";
                };
            } else {
                if (cursor == "e-resize") {
                    this.element.style.cursor = "auto";
                };
            };
        },

        _handleMouseMove: function (event) {
            var that = this;
            var slider = that.slider;
            var x = event.pageX;
            var y = event.pageY;
            if (that._isTouchDevice) {
                var pos = $.jqx.position(event);
                x = pos.left;
                y = pos.top;
            }

            var hostLeft = that._hostOffset.left;
            var hostWidth = that._hostWidth;

            // update cursor.
            if (that.resizable && !that.dragging && that.resizeDirection == "none") {
                if (x >= hostLeft && x <= hostLeft + hostWidth) {
                    if (y >= that._hostOffset.top && y <= that._hostOffset.top + that._hostHeight) {
                        this._updateCursor(x, y);
                    }
                }
            }

            if (!that.isMouseDown) {
                return true;
            }

            if (that._isTouchDevice) {
                if (y < that._hostOffset.top || y > that._hostOffset.top + that._hostHeight) {
                    return true;
                }
            }

            var nearestTick = that._findNearestTick(that._sliderLeftOffset + x - that._mouseDownX);
            var sliderLeft = parseInt(nearestTick);
            if (sliderLeft < 0) {
                return true;
            }
            if (sliderLeft < 0) {
                sliderLeft = 0;
            }

            var sliderWidth = parseInt(slider[0].style.width);
            var sliderRight = sliderLeft + sliderWidth;

            var validateResize = function (newWidth) {
                var maxWidth = parseInt(that._maxWidth);
                var minWidth = parseInt(that._minWidth);
                if (newWidth < minWidth || newWidth > maxWidth) {
                    return false;
                }
                var rm = parseInt(that.rightMarker[0].style.left);
                var lm = parseInt(that.leftMarker[0].style.left);
                if (lm > rm) {
                    return false;
                }

                return true;
            }

            if (that.resizable == true && !that.dragging) {
                // slider resize
                var markerValue = sliderLeft * that._unitPerPixel + that._min;
                // resize from the left
                if (that.resizeDirection == "left" || that.isLeftMarkerCaptured) {
                    var xOffset = that.isLeftMarkerCaptured ? that.leftMarker.outerWidth() : 0;

                    if (x < hostLeft - xOffset) {
                        x = hostLeft - xOffset;
                    }
                    if (x > hostLeft + hostWidth + xOffset) {
                        x = hostLeft + hostWidth + xOffset + 1;
                    }

                    var oldSliderLeft = slider[0].style.left;
                    var offset = sliderLeft - parseInt(oldSliderLeft);
                    var newWidth = parseInt(sliderWidth - offset);
                    if (!validateResize(newWidth)) {
                        if (x > that._mouseDownX) {
                            x = that.sliderRight - that._minWidth - hostLeft;
                            newWidth = that._minWidth;
                            if (sliderWidth == newWidth) {
                                return true;
                            }

                            var nearestTick = that._findNearestTick(x);
                            sliderLeft = nearestTick;
                            if (sliderLeft < 0) {
                                return true;
                            }
                            var oldMarkerValue = parseInt(oldSliderLeft) * that._unitPerPixel + that._min;
                            var markerValue = sliderLeft * that._unitPerPixel + that._min;
                        }
                        else if (that._maxWidth != 0 && x < that._mouseDownX && newWidth > that._maxWidth) {
                            x = that.sliderRight - that._maxWidth - hostLeft;
                            newWidth = that._maxWidth;
                            if (sliderWidth == newWidth) {
                                return true;
                            }

                            var nearestTick = that._findNearestTick(x);
                            sliderLeft = nearestTick;
                            if (sliderLeft < 0) {
                                return true;
                            }

                            var oldMarkerValue = parseInt(oldSliderLeft) * that._unitPerPixel + that._min;
                            var markerValue = sliderLeft * that._unitPerPixel + that._min;
                        }
                        else return true;
                    }

                    that.slider[0].style.left = sliderLeft + 'px';
                    if (oldSliderLeft != slider[0].style.left) {
                        that.slider[0].style.width = newWidth + 'px';
                    }

                    // updates the value in the left marker
                    var fromTick = that._findNearestTick(sliderLeft);
                    var from = that._valuesArray[that._ticksArray.indexOf(fromTick)];
                    if (from != undefined) {
                        that.leftMarkerValue[0].innerHTML = that._formatOutput(from, that.markersFormat, 0, "left");
                        if (sliderLeft != fromTick) {
                            that.slider[0].style.left = fromTick + 'px';
                        }
                    }
                    else {
                        that.leftMarkerValue[0].innerHTML = that._formatOutput(markerValue, that.markersFormat, 0, "left");
                    }
                    that.oldX = x;
                    that.moved = true;
                    // resize from the right
                }
                else if (that.resizeDirection == "right" || that.isRightMarkerCaptured) {
                    var xOffset = that.isRightMarkerCaptured ? that.rightMarker.outerWidth() : 0;
                    var setMaxValue = false;
                    var setMinValue = false;

                    if (x < hostLeft - xOffset) {
                        x = hostLeft - xOffset;
                        setMinValue = true;
                    }
                    if (x > hostLeft + hostWidth + xOffset) {
                        x = hostLeft + hostWidth + xOffset;
                        setMaxValue = true;
                    }
                    var initialWidth = that._sliderInitialWidth;

                    var initialRight = that._findNearestTick(initialWidth + that._sliderLeftOffset);
                    var right = that._findNearestTick(initialWidth + x - that._mouseDownX + that._sliderLeftOffset);
                    if (right < 0) {
                        return true;
                    }

                    var offset = initialRight - right;
                    var newWidth = initialWidth - offset;
                    if (newWidth <= 0) {
                        offset = initialWidth;
                        newWidth = 0;
                    }

                    var elementWidth = parseInt(that.element.style.width);
                    if (that.element.style.width.indexOf('%') >= 0) {
                        elementWidth = that.host.width();
                    }

                    if (setMaxValue || (that._sliderLeftOffset + newWidth >= elementWidth)) {
                        newWidth = elementWidth - that._sliderLeftOffset;
                        boundDetected = true;
                    }

                    if (newWidth > parseInt(this._maxWidth)) {
                        newWidth = parseInt(this._maxWidth);
                    }

                    if (newWidth < parseInt(this._minWidth)) {
                        newWidth = parseInt(this._minWidth);
                    }

                    that.slider[0].style.width = newWidth + 'px';

                    // updates the value in the right marker
                    var markerValue = (that._sliderLeftOffset + newWidth) * that._unitPerPixel + that._min;
                    var toTick = that._findNearestTick(that._sliderLeftOffset + newWidth);
                    var to = that._valuesArray[that._ticksArray.indexOf(toTick)];
                    if (to != undefined) {
                        if (that._sliderLeftOffset + newWidth != toTick) {
                            that.slider[0].style.width = toTick - that._sliderLeftOffset + 'px';
                        }
                        that.rightMarkerValue[0].innerHTML = that._formatOutput(to, that.markersFormat, 0, "right");
                    }
                    else {
                        that.rightMarkerValue[0].innerHTML = (that._formatOutput(markerValue, that.markersFormat, 0, "right"));
                    }

                    that.oldX = x;
                };
                that._layoutShutter();
                that._layoutMarkers();
                that.moved = true;
            }

            // move
            if (that.dragging == 1) {
                that._moveSlider(sliderLeft, true);
                that.oldX = x;
            };
        },

        _moveSlider: function (sliderLeft, snapToTicks) {
            var that = this;
            that.moved = true;
            var sliderWidth = parseInt(this.slider[0].style.width);
            var sliderRight = parseInt((sliderLeft + sliderWidth));
            var hostWidth = this._hostWidth;

            var newSliderOffset = sliderLeft;
            if (newSliderOffset < 0) {
                newSliderOffset = 0;
                sliderLeft = newSliderOffset;
            }
            if (newSliderOffset + sliderWidth > hostWidth) {
                newSliderOffset = hostWidth - sliderWidth;
                sliderLeft = newSliderOffset;
            }

            if ((newSliderOffset >= 0) && ((newSliderOffset + sliderWidth) <= (hostWidth))) {
                this.slider[0].style.left = newSliderOffset + 'px';
                var fromTick = this._findNearestTick(newSliderOffset);
                var isLeftMajorTick = this._majorTicksArray.indexOf(fromTick) != -1;
                var from = this._valuesArray[this._ticksArray.indexOf(fromTick)];
                if (from != undefined) {
                    this.leftMarkerValue[0].innerHTML = this._formatOutput(from, this.markersFormat, 0, "left");
                    if (sliderLeft != fromTick && isLeftMajorTick) {
                        if (snapToTicks) {
                            this.slider[0].style.left = fromTick + 'px';
                            var sliderRight = parseInt((fromTick + sliderWidth));
                        }
                    }
                }
                else {
                    this.leftMarkerValue[0].innerHTML = this._formatOutput(((newSliderOffset) * this._unitPerPixel + this._min), this.markersFormat, 0, "left");
                }
                var toTick = this._findNearestTick(sliderRight);
                var to = this._valuesArray[this._ticksArray.indexOf(toTick)];
                if (to != undefined) {
                    var isRightMajorTick = this._majorTicksArray.indexOf(toTick) != -1;
                    this.rightMarkerValue[0].innerHTML = this._formatOutput(to, this.markersFormat, 0, "right");
                    if (sliderRight != toTick && isRightMajorTick && isLeftMajorTick) {
                        if (snapToTicks) {
                            var newWidth = (toTick - fromTick);
                            this.slider[0].style.width = newWidth + 'px';
                        }
                    }
                }
                else {
                    this.rightMarkerValue[0].innerHTML = this._formatOutput(((newSliderOffset + sliderWidth) * this._unitPerPixel + this._min), this.markersFormat, 0, "right");
                }
            }
            this._layoutShutter();
            this._layoutMarkers();
        },

        // appends the slider and adds its functionality
        _initSlider: function () {
            var that = this;
            // appends slider and shutter divs
            var shutterClasses = this.toThemeProperty('jqx-rangeselector-shutter') + " " + this.toThemeProperty('jqx-scrollbar-state-normal');
            $("#" + this._id + "TicksContainer").append("<div id='" + this._id + "ShutterLeft' class='" + shutterClasses + "'></div><div id='" + this._id + "Slider" + "' class='" + this.toThemeProperty('jqx-rangeselector-slider') + " " + this.toThemeProperty('jqx-scrollbar-thumb-state-normal') + "'><div class='" + this.toThemeProperty('jqx-rangeselector-inner-slider') + "'></div></div><div id='" + this._id + "ShutterRight' class='" + shutterClasses + "'></div>");
            this.slider = $("#" + this._id + "Slider");
            this.shutterLeft = $("#" + this._id + "ShutterLeft");
            this.shutterRight = $("#" + this._id + "ShutterRight");
            // sets the initial range of the slider
            this._hostOffset = this.rangeSelector.offset();
            this._hostWidth = this.rangeSelector.width();
            this._hostHeight = this.rangeSelector.height();
            var hostOffset = this._hostOffset;
            var initialValues = this._initRange();
            var initialLeftValue = initialValues.left;
            var initialWidthValue = initialValues.right - initialLeftValue;
            var sliderWidth = initialWidthValue / this._unitPerPixel;

            this.slider[0].style.width = Math.round(sliderWidth) + 'px';
            var l = hostOffset.left + parseInt((initialLeftValue - this._min) / this._unitPerPixel);
            this.slider.offset({ left: l });

            //sets the shutter position
            this._layoutShutter();

            // appends slider markers
            this._initMarkers();

            // adds the slider functionality
            if (this.disabled == false) {
                this.host.removeClass(this.toThemeProperty("jqx-fill-state-disabled"));

                this.addHandler(this.host, "dragstart.rangeselector" + this._id, function () {
                    return false;
                });

                this.addHandler($(window), "jqxReady.rangeselector", function () {
                    that._layoutMarkers();
                    return false;
                });

                // flags
                this.isSliderCaptured = false; // whether the slider is dragged
                this.resizeDirection = "none"; // direction from which the slider is dragged
                this.isLeftMarkerCaptured = false; // whether the left marker is dragged
                this.isRightMarkerCaptured = false; // whether the right marker is dragged
                this.dragging = false; // whether the slider is moved
                this._mouseDownX;

                var initialOffset;
                var initialWidth;

                var mouseDownEvent = "mousedown.rangeselector" + this.element.id;
                if (this._isTouchDevice) {
                    mouseDownEvent = $.jqx.mobile.getTouchEventName('touchstart') + ".rangeselector" + this.element.id;
                }

                // mousedown event handlers
                this.addHandler(this.host, mouseDownEvent, function (event) {
                    that.isMouseDown = true;
                    that._hostOffset = that.rangeSelector.offset();
                    that._hostWidth = that.rangeSelector.width();
                    that._hostHeight = that.rangeSelector.height();
                    that._sliderLeftOffset = parseInt(that.slider[0].style.left);
                    var x = event.pageX;
                    var y = event.pageY;
                    if (that._isTouchDevice) {
                        var pos = $.jqx.position(event);
                        x = pos.left;
                        y = pos.top;
                    }

                    that._initialSliderOffset = x - that.slider.offset().left;
                    var w = that.slider.width();
                    that._sliderInitialWidth = w;

                    initialOffset = that.slider.offset().left;
                    initialWidth = that._sliderInitialWidth;
                    that.initialOffset = initialOffset;

                    var sliderRight = parseInt((initialOffset + initialWidth));

                    that.oldX = x;
                    that._mouseDownX = x;
                    that.resizeDirection = "none";
                    that.sliderRight = sliderRight;

                    if ((x > initialOffset - 5) && (x < initialOffset + 5) && that._heightCheck(y)) {
                        that.isSliderCaptured = false;
                        that.dragging = false;
                        that.resizeDirection = "left";
                    } else if ((x > sliderRight - 5) && (x < sliderRight + 5) && that._heightCheck(y)) {
                        that.isSliderCaptured = false;
                        that.dragging = false;
                        that.resizeDirection = "right";
                    } else if ((x >= initialOffset + 5) && (x <= sliderRight + 5) && that._heightCheck(y)) {
                        that.isSliderCaptured = true;
                        that.dragging = true;
                    } else {
                        that.isSliderCaptured = false;
                        that.dragging = false;
                        if (that.moveOnClick) {
                            if (that.isLeftMarkerCaptured || that.isRightMarkerCaptured) {
                                return false;
                            }

                            var sliderLeft = that._sliderLeftOffset + that._initialSliderOffset;
                            var nearestTick = that._findNearestTick(sliderLeft);
                            sliderLeft = nearestTick;
                            if (sliderLeft < 0) {
                                sliderLeft = 0;
                            }

                            var sliderWidth = parseInt(that.slider[0].style.width);

                            if (y >= that.slider.offset().top) {
                                if (x > sliderRight) {
                                    that._moveSlider(sliderLeft - sliderWidth, true);
                                }
                                else {
                                    that._moveSlider(sliderLeft, true);
                                }
                            }
                        }
                    };
                });

                this.addHandler(that.leftMarker, mouseDownEvent, function (event) {
                    that.leftMarkerAndArrow.addClass(that.toThemeProperty("jqx-fill-state-pressed"));
                    that.oldLeftX = event.pageX;
                    if (that._isTouchDevice) {
                        var pos = $.jqx.position(event);
                        oldLeftX = pos.left;
                    }
                    that._mouseDownX = that.oldLeftX;
                    that.isLeftMarkerCaptured = true;
                });

                this.addHandler(that.rightMarker, mouseDownEvent, function (event) {
                    that.rightMarkerAndArrow.addClass(that.toThemeProperty("jqx-fill-state-pressed"));
                    that.oldRightX = event.pageX;
                    if (that._isTouchDevice) {
                        var pos = $.jqx.position(event);
                        oldRightX = pos.left;
                    }
                    that._mouseDownX = that.oldRightX;
                    that.isRightMarkerCaptured = true;
                });

                this.addHandler($(document), "selectstart.rangeselector" + this._id, function (event) {
                    if (that.isSliderCaptured == true || that.isLeftMarkerCaptured == true || that.isRightMarkerCaptured == true || that.dragging == true) {
                        event.preventDefault();
                        return false;
                    };
                });

                // mousemove event handler
                var mouseMoveEvent = "mousemove.rangeselector" + this.element.id;
                if (this._isTouchDevice) {
                    mouseMoveEvent = $.jqx.mobile.getTouchEventName('touchmove') + ".rangeselector" + this.element.id;
                }
                this.addHandler($(document), mouseMoveEvent, function (event) {
                    that._handleMouseMove(event);
                });

                // mouseup function
                var mouseUp = function (event) {
                    try {
                        var hasChange = that.moved;
                        that.moved = false;
                        that.isMouseDown = false;
                        that.dragging = false;
                        that.resizeDirection = "none";

                        if (that.isLeftMarkerCaptured == true) {
                            that.leftMarkerAndArrow.removeClass(that.toThemeProperty("jqx-fill-state-pressed"));
                            that.isLeftMarkerCaptured = false;
                        };
                        if (that.isRightMarkerCaptured == true) {
                            that.rightMarkerAndArrow.removeClass(that.toThemeProperty("jqx-fill-state-pressed"));
                            that.isRightMarkerCaptured = false;
                        };

                        if (hasChange) {
                            var value = that._getValue();
                            that._raiseEvent("0", { type: "mouse", from: value.from, to: value.to });
                        }
                    }
                    catch (error) {
                    }
                };

                // mouseup event handlers
                this.addHandler($(document), "mouseup.rangeselector" + this._id, function (event) {
                    mouseUp(event);
                });

                try {
                    if (document.referrer != "" || window.frameElement) {
                        if (window.top != null && window.top != window.self) {
                            var eventHandle = function (event) {
                                mouseUp(event);
                            };
                            var parentLocation = null;
                            if (window.parent && document.referrer) {
                                parentLocation = document.referrer;
                            };

                            if (parentLocation && parentLocation.indexOf(document.location.host) != -1) {
                                if (window.top.document) {
                                    if (window.top.document.addEventListener) {
                                        window.top.document.addEventListener('mouseup', eventHandle, false);
                                    } else if (window.top.document.attachEvent) {
                                        window.top.document.attachEvent("on" + 'mouseup', eventHandle);
                                    };
                                };
                            };
                        };
                    };
                }
                catch (error) {
                };
            } else {
                this.host.addClass(this.toThemeProperty("jqx-fill-state-disabled"));
            };
            this._moveSlider(parseInt(that.slider[0].style.left));
            this.moved = false;
        },

        // appends the slider markers
        _initMarkers: function () {
            var ticksContainer = $("#" + this._id + "TicksContainer");
            var markerClasses = this.toThemeProperty('jqx-rangeselector-markers') + " " + this.toThemeProperty('jqx-disableselect') + " " + this.toThemeProperty('jqx-fill-state-normal');

            ticksContainer.append("<div id='" + this._id + "LeftMarker' class='" + markerClasses + "'></div><div id='" + this._id + "RightMarker' class='" + markerClasses + "'></div>");

            var arrowClasses = this.toThemeProperty('jqx-rangeselector-marker-arrow') + " " + this.toThemeProperty("jqx-fill-state-normal");
            if (this.markersPosition == "bottom") {
                arrowClasses += " " + this.toThemeProperty('jqx-rangeselector-marker-arrow-bottom');
            }
            else {
                arrowClasses += " " + this.toThemeProperty('jqx-rangeselector-marker-arrow-top');
            }

            ticksContainer.append("<div id='" + this._id + "LeftMarkerArrow' class='" + arrowClasses + " " + this.toThemeProperty("jqx-rangeselector-marker-left-arrow") + "'></div>");
            ticksContainer.append("<div id='" + this._id + "RightMarkerArrow' class='" + arrowClasses + " " + this.toThemeProperty("jqx-rangeselector-marker-right-arrow") + "'></div>");

            // appends marker text boxes, showing the value
            $("#" + this._id + "LeftMarker").append("<div id='" + this._id + "LeftMarkerValue' class='" + this.toThemeProperty('jqx-disableselect') + " " + this.toThemeProperty('jqx-rangeselector-markers-value') + "'></div>");
            $("#" + this._id + "RightMarker").append("<div id='" + this._id + "RightMarkerValue' class='" + this.toThemeProperty('jqx-disableselect') + " " + this.toThemeProperty('jqx-rangeselector-markers-value') + "'></div>");

            var markers = $("#" + this._id + "LeftMarker, #" + this._id + "RightMarker, #" + this._id + "LeftMarkerArrow, #" + this._id + "RightMarkerArrow");
            var leftMarkerAndArrow = $("#" + this._id + "LeftMarker, #" + this._id + "LeftMarkerArrow");
            var rightMarkerAndArrow = $("#" + this._id + "RightMarker, #" + this._id + "RightMarkerArrow");

            if (this.showMarkers == true) {
                markers.css("visibility", "visible");
            } else {
                markers.css("visibility", "hidden");
            };

            if (this.disabled == false && this.resizable == true) {
                var that = this;

                // event handlers
                this.addHandler(leftMarkerAndArrow, "mouseenter.rangeselector" + this._id, function (event) {
                    that.element.style.cursor = "pointer";
                    leftMarkerAndArrow.addClass(that.toThemeProperty("jqx-fill-state-hover"));
                });

                this.addHandler(leftMarkerAndArrow, "mouseleave.rangeselector" + this._id, function (event) {
                    that.element.style.cursor = "auto";
                    leftMarkerAndArrow.removeClass(that.toThemeProperty("jqx-fill-state-hover"));
                });

                this.addHandler(rightMarkerAndArrow, "mouseenter.rangeselector" + this._id, function (event) {
                    that.element.style.cursor = "pointer";
                    rightMarkerAndArrow.addClass(that.toThemeProperty("jqx-fill-state-hover"));
                });

                this.addHandler(rightMarkerAndArrow, "mouseleave.rangeselector" + this._id, function (event) {
                    that.element.style.cursor = "auto";
                    rightMarkerAndArrow.removeClass(that.toThemeProperty("jqx-fill-state-hover"));
                });
            };

            this.leftMarkerAndArrow = leftMarkerAndArrow;
            this.rightMarkerAndArrow = rightMarkerAndArrow;
            this.leftMarkerArrow = $("#" + this._id + "LeftMarkerArrow");
            this.rightMarkerArrow = $("#" + this._id + "RightMarkerArrow");
            this.leftMarker = $("#" + this._id + "LeftMarker");
            this.rightMarker = $("#" + this._id + "RightMarker");
            this.leftMarkerValue = $("#" + this._id + "LeftMarkerValue");
            this.rightMarkerValue = $("#" + this._id + "RightMarkerValue");
            // sets the position of the markers
            var initialValues = this._initRange();
            this._updateMarkersValues(initialValues.left, initialValues.right);
            this._layoutMarkers();
            if (this.padding == "auto") {
                this.host.css('padding-left', this.leftMarker[0].offsetWidth);
                this.host.css('padding-right', this.rightMarker[0].offsetWidth);
                this.host.css('padding-top', this._leftMarkerHeight + 7);
            }
            else {
                this.host.css('padding', this.padding);
            }
        },

        // sets the position of the markers
        _layoutMarkers: function () {
            if (this.showMarkers != true) {
                return;
            }
            if (!this._hostOffset) {
                this._hostOffset = this.rangeSelector.offset();
            }
            if (!this._leftMarkerHeight) {
                this._leftMarkerHeight = this.leftMarker.outerHeight();
                this._rightMarkerHeight = this.rightMarker.outerHeight();
            }
            var hostTop = this._hostOffset.top;
            var sliderLeft = parseInt(this.slider[0].style.left) + this._hostOffset.left;

            var arrowTop = -5;
            if (this.markersPosition == "bottom") {
                arrowTop = parseInt(this.element.style.height) + 4 + this._rightMarkerHeight;
            }

            var leftTop = arrowTop - this._leftMarkerHeight;
            var rightTop = arrowTop - this._rightMarkerHeight;

            if (this.markersPosition == "bottom") {
                arrowTop = parseInt(this.element.style.height) - 6;
            }

            var leftMarkerWidth = this.leftMarker[0].offsetWidth;

            // left marker.
            var leftmarkersPosition = 1 + sliderLeft - leftMarkerWidth - this._hostOffset.left;
            this.leftMarker[0].style.left = leftmarkersPosition + 'px';
            this.leftMarker[0].style.top = leftTop + 'px';
            this.leftMarkerArrow[0].style.left = 2 + leftmarkersPosition + leftMarkerWidth + 'px';
            this.leftMarkerArrow[0].style.top = 6 + arrowTop + 'px';

            // right marker.
            var rightmarkersPosition = sliderLeft + parseInt(this.slider[0].style.width) - this._hostOffset.left;
            this.rightMarker[0].style.left = rightmarkersPosition + 'px';
            this.rightMarker[0].style.top = rightTop + 'px';
            this.rightMarkerArrow[0].style.left = 7 + rightmarkersPosition + 'px';
            this.rightMarkerArrow[0].style.top = 6 + arrowTop + 'px';
        },

        // sets the position of the markers
        _updateMarkersValues: function (from, to) {
            // values of the left and right markers
            var left = from;
            var right = to;
            // sets initial values of the slider markers
            this.leftMarkerValue[0].innerHTML = this._formatOutput(left, this.markersFormat, 0, "left", true);
            this.rightMarkerValue[0].innerHTML = this._formatOutput(right, this.markersFormat, 0, "right", true);
        },

        // removes event handlers
        _removeHandlers: function () {
            var id = this.element.id;
            var leftMarkerAndArrow = $("#" + id + "LeftMarker, #" + id + "LeftMarkerArrow");
            var rightMarkerAndArrow = $("#" + id + "RightMarker, #" + id + "RightMarkerArrow");

            var mouseMoveEvent = "mousemove.rangeselector" + id;
            var mouseDownEvent = "mousedown.rangeselector" + id;
            if (this._isTouchDevice) {
                mouseMoveEvent = $.jqx.mobile.getTouchEventName('touchmove') + ".rangeselector" + id;
                mouseDownEvent = $.jqx.mobile.getTouchEventName('touchstart') + ".rangeselector" + id;
            }

            this.removeHandler($(document), mouseMoveEvent);
            this.removeHandler($(document), "mouseup.rangeselector" + id);
            this.removeHandler(this.host, mouseDownEvent);
            this.removeHandler(this.host, "click.rangeselector" + id);
            this.removeHandler(this.host, "dragstart.rangeselector" + id);
            this.removeHandler(leftMarkerAndArrow, "mouseenter.rangeselector" + id);
            this.removeHandler(leftMarkerAndArrow, "mouseleave.rangeselector" + id);
            this.removeHandler(rightMarkerAndArrow, "mouseenter.rangeselector" + id);
            this.removeHandler(rightMarkerAndArrow, "mouseleave.rangeselector" + id);
            this.removeHandler($("#" + id + "LeftMarker"), mouseDownEvent);
            this.removeHandler($("#" + id + "RightMarker"), mouseDownEvent);
            this.removeHandler($("#" + id + "LeftMarkerValue, #" + id + "RightMarkerValue"), "selectstart.rangeselector" + id);
        },

        // checks if an event is within the height of the slider
        _heightCheck: function (pageY) {
            var slider = this.slider;
            var sliderTop = slider.offset().top;

            if (pageY >= sliderTop && pageY <= sliderTop + slider.height()) {
                return true;
            } else {
                return false;
            };
        },

        // corrects possible contradictions in initial properties
        _checkProperties: function () {
            if (this._range._from < this._min) {
                this._range._from = this._min;
            } else if (this._range._from > this._min && this._range._from > this._max) {
                this._range._from = this._min;
            };
            if (this._range._to > this._max) {
                this._range._to = this._max;
            } else if (this._range._to < this._min && this._range._to < this._max) {
                this._range._to = this._max;
            };
            var span = this._max - this._min;
            if (this._range._min > span) {
                this._range._min = span;
            };
            if (this._range._max > span) {
                this._range._max = span;
            };
            var range = this._range._to - this._range._from;
            if (range < this._range._min) {
                this._range._to = this._range._from + this._range._min;
            } else if (range > this._range._max) {
                this._range._to = this._range._from + this._range._max;
            };
        },

        // finds the nearest tick (used in snap to ticks functionality)
        _findNearestTick: function (value) {
            var nearestTickIndex = 0;
            var distance = Math.abs(value - this._ticksArray[0]);
            for (var i = 1; i < this._ticksArray.length; i++) {
                var newDistance = Math.abs(value - this._ticksArray[i]);
                if (distance > newDistance) {
                    distance = newDistance;
                    nearestTickIndex = i;
                };
            };
            return this._ticksArray[nearestTickIndex];
        },

        // gives numeric values to private properties
        _privateProperties: function () {
            this._min = this._validateInput(this.min);
            this._max = this._validateInput(this.max);
            this._range = new Object();
            this._range._from = this._validateInput(this.range.from != undefined ? this.range.from : 0);
            this._range._to = this._validateInput(this.range.to != undefined ? this.range.to : Infinity);
            this._range._min = this._minMaxDate(this.range.min != undefined ? this.range.min : 0);
            this._range._max = this._minMaxDate(this.range.max != undefined ? this.range.max : Infinity);
        },

        // returns a number or a timestamp based on the input
        _validateInput: function (input) {
            var output;
            if (typeof input == "number") {
                output = input;
            } else if (typeof input == "string") {
                output = Date.parse(input);
            } else if (input instanceof Date) {
                output = input.getTime();
            };
            return output;
        },

        // returns a number or the number of milliseconds based on input
        _minMaxDate: function (input) {
            if (typeof input != "number") {
                var output;
                switch (input) {
                    case "millisecond":
                        output = 1;
                        break;
                    case "second":
                        output = 1000;
                        break;
                    case "minute":
                        output = 60000;
                        break;
                    case "hour":
                        output = 3600000;
                        break;
                    case "day":
                        output = 86400000;
                        break;
                    case "week":
                        output = 604800000;
                        break;
                    default:
                        output = input.milliseconds ? input.milliseconds : 0 + input.seconds ? 1000 * input.seconds : 0 + input.minutes ? 60000 * input.minutes : 0 + input.hours ? 3600000 * input.hours : 0 + input.days ? 86400000 * input.days : 0 + input.weeks ? 604800000 * input.weeks : 0;
                };
                return output;
            } else {
                return input;
            };
        },

        // returns a formatted value based on input
        _formatOutput: function (value, format, precision, type, init) {
            var formattedValue;
            if (!this.values) this.values = new Array();
            this.values[type] = value;

            if ((type == "label") && this.labelsFormatFunction) {
                if (this._dataType == "date") {
                    formattedValue = this._roundDate(value);
                } else {
                    formattedValue = this._roundNumber(value, "label");
                };
                formattedValue = this.labelsFormatFunction(formattedValue);
            } else if (type != "label" && this.markersFormatFunction) {
                if (this._dataType == "date") {
                    formattedValue = this._roundDate(value);
                };
                formattedValue = this.markersFormatFunction(value, type);
            } else {
                if (!format) {
                    if (this._dataType == "date") {
                        var missingFormat;
                        if (this.labelsFormat == null && this.markersFormat == null) {
                            missingFormat = "both labelsFormat and markersFormat";
                        } else if (this.labelsFormat == null) {
                            missingFormat = "labelsFormat";
                        } else if (this.markersFormat == null) {
                            missingFormat = "markersFormat";
                        };
                        var requiredFormatExceptionMessage = "When the data format is date, " + missingFormat + " should be set.";
                        throw new Error(requiredFormatExceptionMessage);
                    };

                    formattedValue = value.toFixed(precision);
                } else {
                    if (this._dataType == "number") {
                        formattedValue = $.jqx.dataFormat.formatnumber(value, format);
                    } else {
                        formattedValue = this._roundDate(value);
                        formattedValue = $.jqx.dataFormat.formatdate(formattedValue, format);
                    };
                };
            };
            return formattedValue;
        },

        // gets the current range of the slider
        _getValue: function (changing) {
            var that = this,
                minorTicksInterval = that.minorTicksInterval;

            function roundValue(value) {
                if (that._dataType === 'number') {
                    return Math.round(value / minorTicksInterval) * minorTicksInterval;
                } else {
                    return that._roundNumber(value, 'marker');
                }
            }

            var slider = this.slider;
            var sliderWidth = slider.width();
            var range = new Object();
            var relativeOffset = slider.offset().left - this.rangeSelector.offset().left;

            var from = (relativeOffset * this._unitPerPixel + this._min);
            range.from = roundValue(from);
            range.to = roundValue(from + sliderWidth * this._unitPerPixel);
            if (!changing && this.snapToTicks == true) {
                var nearestTickFrom = this._findNearestTick((range.from - this._min) / this._unitPerPixel);
                range.from = this._valuesArray[this._ticksArray.indexOf(nearestTickFrom)];
                var nearestTickTo = this._findNearestTick((range.to - this._min) / this._unitPerPixel);
                range.to = this._valuesArray[this._ticksArray.indexOf(nearestTickTo)];
            };

            if (this._dataType == "date") {
                range.from = new Date(range.from);
                range.to = new Date(range.to);
            }

            return range;
        },

        // rounds a number, keeping only a specified number of decimals
        _roundNumber: function (input, precision, tickValue) {
            var output;
            if (precision == "marker") {
                if (tickValue == true) {
                    input = parseFloat(input);
                };
                output = parseFloat(input);
            } else if (precision == "label") {
                output = parseFloat(input);
            } else {
                output = parseFloat(input);
            };
            return output;
        },

        // rounds a date to the nearest day or hour
        _roundDate: function (date) {
            if (typeof date == "number") {
                date = new Date(date);
            };
            var span = this._max - this._min;
            if (span > 1209600000 /* 14 days */) {
                var monthDay = date.getDate();
                var hours = date.getHours();
                if (hours > 12) {
                    date.setDate(monthDay + 1);
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                };
            } else if (span > 172800000 /* 2 days */) {
                date.setHours(date.getHours() + Math.round(date.getMinutes() / 60));
                date.setMinutes(0);
                date.setSeconds(0);
            };

            return date;
        },

        // moves the shutter divs according to the movement of the slider
        _layoutShutter: function () {
            var sliderLeft = parseInt(this.slider[0].style.left);
            this.shutterLeft[0].style.width = sliderLeft + "px";
            this.shutterLeft[0].style.left = '0px';
            if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                this.shutterLeft[0].style.filter = "progid:DXImageTransform.Microsoft.Alpha(Opacity=75)";
                this.shutterRight[0].style.filter = "progid:DXImageTransform.Microsoft.Alpha(Opacity=75)";
            }

            var shutterRightPos = 1 + sliderLeft + parseInt(this.slider[0].style.width);
            this.shutterRight[0].style.left = shutterRightPos + 'px';
            var hostWidth = parseInt(this.element.style.width);
            if (this.element.style.width.indexOf('%') >= 0) {
                var hostWidth = parseInt(this.host.width());
            }
            var w = hostWidth - 1 - sliderLeft - parseInt(this.slider[0].style.width);
            if (w < 0) w = 0;
            this.shutterRight[0].style.width = 1 + w + 'px';
            if (shutterRightPos + 1 + w < 2 + hostWidth) {
                this.shutterRight[0].style.width = 2 + w + 'px';
            }
            if (w == 0) {
                this.shutterRight[0].style.width = '0px';
            }
        },

        // gets the initial selected range
        _initRange: function () {
            if (this._range._from > this._range._to) {
                throw new Error("jqxRangeSelector: range object initialization error. 'min' should be less than 'max'");
                return;
            }

            var that = this;
            var initialLeftValue = this._range._from;
            var initialRightValue = this._range._to;
            var initialValues = { left: initialLeftValue, right: initialRightValue };
            return initialValues;
        }
    });
})(jqxBaseFramework);
