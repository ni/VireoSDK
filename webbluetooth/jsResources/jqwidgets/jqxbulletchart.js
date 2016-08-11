/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    $.jqx.jqxWidget("jqxBulletChart", "", {});

    $.extend($.jqx._jqxBulletChart.prototype, {

        defineInstance: function () {
            var settings = {
                //// properties
                width: 500,
                height: 100,
                barSize: "50%",
                ranges: [{ startValue: 0, endValue: 50, color: "#000000", opacity: 0.7 }, { startValue: 50, endValue: 80, color: "#000000", opacity: 0.5 }, { startValue: 80, endValue: 100, color: "#000000", opacity: 0.3}],
                pointer: { value: 65, label: "Value", size: "25%", color: "" },
                target: { value: 85, label: "Target", size: 4, color: "" },
                ticks: { position: "far", interval: 20, size: 10 }, // possible values for ticks.position: "far", "near", "both", "none"
                title: "Title",
                description: "Description",
                orientation: "horizontal", // possible values: "horizontal", "vertical"
                labelsFormat: null, // possible values: null, "d", "f", "n", "c", "p"
                labelsFormatFunction: null, // callback function
                animationDuration: 400, // possible values: "slow", "fast" or a number in milliseconds
                showTooltip: true, // possible values: true, false, requires jqxtooltip.js
                tooltipFormatFunction: null, // callback function
                disabled: false, // possible values: true, false
                rtl: false, // possible values: true, false

                //// events
                events: ["change"]
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function (args) {
            if (!$.jqx.dataAdapter) {
                throw new Error("jqxBulletChart: Missing reference to the following module: 'jqxdata.js'.");
            };

            // sets default values to object properties if they are not set by the user
            this._setDefaultValues();

            // renders the widget
            this.render();

            var that = this;
            $.jqx.utilities.resize(this.host, function () {
                if (that._timer) clearTimeout(that._timer);
                that._timer = setTimeout(function () {
                    var duration = that.animationDuration;
                    that.animationDuration = 0;
                    that.render();
                    setTimeout(function () {
                        that.animationDuration = duration;
                    }, 0);
                }, 10);

            }, false, true);
        },

        //// methods

        // public methods
        // renders the widget
        render: function () {
            // checks if this is the initialization of the widget or if the method is called manually
            if (this.host.children().length > 0) {
                this._removeHandlers();
                if (this.showTooltip == true) {
                    this.host.jqxTooltip("destroy");
                };
                this.host.empty();
            };

            // host settings
            this.host.addClass(this.toThemeProperty("jqx-widget"));
            this.host.addClass(this.toThemeProperty("jqx-bulletchart"));
            this.host.width(this.width);
            this.host.height(this.height);

            var hostWidth = this.host.width();
            var hostHeight = this.host.height();

            // determines the size of the title container
            var placeHolder;
            var rtl = this.rtl ? "rtl" : "ltr";
            if (this.orientation == "horizontal") {
                placeHolder = $("<div style='position: absolute; visibility: hidden; padding: 5px;'><div class='" + this.toThemeProperty('jqx-bulletchart-title') + "' style='direction: " + rtl + ";'>" + this.title + "</div><div class='" + this.toThemeProperty('jqx-bulletchart-description') + "' style='direction: " + rtl + ";'>" + this.description + "</div></div>");
            } else if (this.orientation == "vertical") {
                placeHolder = $("<div style='position: absolute; visibility: hidden; padding-bottom: 15px;'><div class='" + this.toThemeProperty('jqx-bulletchart-title') + "' style='width: " + hostWidth + "px; direction: " + rtl + ";'>" + this.title + "</div><div class='" + this.toThemeProperty('jqx-bulletchart-description') + "' style='direction: " + rtl + ";'>" + this.description + "</div></div>");
            }
            this.host.append(placeHolder);
            var titleWidth = placeHolder.outerWidth();
            var titleHeight = placeHolder.outerHeight();
            placeHolder.remove();

            var titleContainerClass, chartContainerClass, top, titleContainerWidth, titleContainerHeight, chartContainerLeft, chartContainerWidth, chartContainerHeight;

            // append child divs
            if (this.orientation == "horizontal") {
                titleContainerClass = "jqx-bulletchart-title-container-horizontal";
                chartContainerClass = "jqx-bulletchart-chart-container-horizontal";

                top = this._checkPercentage(this.barSize, this.host);
                titleContainerWidth = titleWidth;
                titleContainerHeight = this.barSize;
                chartContainerLeft = 0;
                chartContainerWidth = hostWidth - titleContainerWidth;
                chartContainerHeight = titleContainerHeight;
                if (this.width && this.width.toString().indexOf("%") >= 0) {
                    var chartContainerWidth = parseFloat(parseFloat(chartContainerWidth * 100) / hostWidth).toString() + '%';
                    var titleContainerWidth = parseFloat(parseFloat(titleContainerWidth * 100) / hostWidth).toString() + '%';
                    this._percentageWidth = true;
                }
            } else if (this.orientation == "vertical") {
                titleContainerClass = "jqx-bulletchart-title-container-vertical";
                chartContainerClass = "jqx-bulletchart-chart-container-vertical";

                top = 0;
                titleContainerWidth = "100%";
                titleContainerHeight = titleHeight;
                chartContainerLeft = this._checkPercentage(this.barSize, this.host);
                chartContainerWidth = this.barSize;
                chartContainerHeight = hostHeight - titleContainerHeight;
            };

            if (this.rtl == false || (this.rtl == true && this.orientation == "vertical")) {
                this.host.append("<div id='" + this.element.id + "titleContainer' class='" + titleContainerClass + "' style='top: " + top + ";'></div>");
            };
            this.host.append("<div id='" + this.element.id + "ChartContainer' class='" + chartContainerClass + "' style='top: " + top + "; left: " + chartContainerLeft + ";'></div>");
            if (this.rtl == true && this.orientation == "horizontal") {
                // rtl
                this.host.append("<div id='" + this.element.id + "titleContainer' class='" + titleContainerClass + "' style='top: " + top + ";'></div>");
            };
            this._titleContainer = $("#" + this.element.id + "titleContainer");
            this._chartContainer = $("#" + this.element.id + "ChartContainer");

            // sets the width and height of the child divs
            this._titleContainer.css({ "width": titleContainerWidth, "height": titleContainerHeight });
            this._chartContainer.css({ "width": chartContainerWidth, "height": chartContainerHeight });

            // sets the value-to-pixels coefficients
            this._min = this.ranges[0].startValue;
            this._max = this.ranges[this.ranges.length - 1].endValue;
            this._interval = this._max - this._min;
            this._valueToPixelsHorizontal = this._chartContainer.width() / this._interval;
            this._valueToPixelsVertical = this._chartContainer.height() / this._interval;

            // handles incorrect pointer or target values
            this._checkValues();

            // appends the ranges
            this._appendRanges();
            // appends the pointer and the target
            this._appendPointerAndTarget();
            // appends the title and description
            this._appendTitleAndDescription();
            if (this.ticks.position != "none") {
                // appends ticks and their labels
                this._appendTicksAndLabels();
            };

            if (this.disabled == true) {
                this.host.addClass(this.toThemeProperty("jqx-fill-state-disabled"));
            }

            if (this.showTooltip == true) {
                if (this.host.jqxTooltip != undefined) {
                    // initializes the tooltip and binds to the mouse events
                    this._initializeTooltip();
                    this.host.data().jqxWidget = this;
                } else {
                    throw new Error("jqxBulletChart: Missing reference to the following module: 'jqxtooltip.js'.");
                };
            };

            // sets or updates the pointer
            this._updateValue(this.pointer.value, 0, true);
        },

        // refreshes the widget
        refresh: function (initialRefresh) {
            if (!initialRefresh) {
                this.render();
            };
        },

        // gets or sets the value of the widget
        val: function (value) {
            if (arguments.length == 0 || (value != null && typeof (value) == "object")) {
                return this.pointer.value;
            }
            else {
                // checks for incorrect input
                if (value > this._max) {
                    value = this._max;
                } else if (value < this._min) {
                    value = this._min;
                };
                if (value != this.pointer.value) {
                    this._updateValue(value, this.pointer.value);
                    this.pointer.value = value;
                    if (this.showTooltip == true) {
                        this._updateTooltip();
                    };
                };
            };
        },

        // destroys the widget
        destroy: function () {
            $.jqx.utilities.resize(this.host, null, true);
            this._removeHandlers();
            if (this.showTooltip == true) {
                this.host.jqxTooltip("destroy");
            };
            this.host.remove();
        },

        // private methods

        // called when a property is changed
        propertyChangedHandler: function (object, key, oldvalue, value) {
            if (oldvalue != value || value instanceof Object) {
                var renderFlag = true;

                var resetProperties = function () {
                    $.each(oldvalue, function (property, propertyValue) {
                        if (value[property] == undefined) {
                            object[key][property] = propertyValue;
                        };
                    });
                };

                switch (key) {
                    case "barSize":

                        break;
                    case "ranges":
                        $.each(oldvalue, function (range, rangeProperties) {
                            $.each(rangeProperties, function (property, propertyValue) {
                                if (value[range] === undefined) {
                                    return;
                                }
                                if (value[range][property] == undefined) {
                                    object[key][range][property] = propertyValue;
                                };
                            });
                        });
                        this._setDefaultValues();
                        break;
                    case "pointer":
                        resetProperties();
                        this._updatePointer(value, oldvalue);
                        return;
                    case "target":
                        resetProperties();
                        this._updateTarget(value, oldvalue);
                        return;
                    case "ticks":
                        renderFlag = false;
                        resetProperties();
                        $.each(oldvalue, function (property, propertyValue) {
                            if (oldvalue[property] != object[key][property]) {
                                renderFlag = !(renderFlag && false);
                            };
                        });
                        break;
                    case "showTooltip":
                        if (value == true) {
                            if (this.host.jqxTooltip != undefined) {
                                // initializes the tooltip and binds to the mouse events
                                this._initializeTooltip();
                            } else {
                                throw new Error("jqxBulletChart: Missing reference to the following module: 'jqxtooltip.js'.");
                            }
                        } else {
                            this._removeHandlers();
                            this.host.jqxTooltip("destroy");
                        }
                        break;
                    case "animationDuration":
                        return;
                    case "tooltipFormatFunction":
                        this._updateTooltip();
                        return;
                    case "disabled":
                        if (value == true) {
                            this.host.addClass(this.toThemeProperty("jqx-fill-state-disabled"));
                        } else {
                            this.host.removeClass(this.toThemeProperty("jqx-fill-state-disabled"));
                        }
                        return;
                };

                if (renderFlag == true) {
                    this.render();
                };
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

        // removes event handlers
        _removeHandlers: function () {
            var pointerAndTarget = $("#" + this.element.id + "Pointer, #" + this.element.id + "Target");
            this.removeHandler(pointerAndTarget, "mouseenter.bulletchart" + this.element.id);
            this.removeHandler(pointerAndTarget, "mouseleave.bulletchart" + this.element.id);
        },

        // sets default values to object properties if they are not set by the user
        _setDefaultValues: function () {
            // ranges property
            var ranges = this.ranges;
            var rangesCount = this.ranges.length;
            for (var i = 0; i < rangesCount; i++) {
                if (ranges[i].startValue == undefined || ranges[i].endValue == undefined) {
                    throw new Error("jqxBulletChart: Each range must have its startValue and endValue set.");
                };
                if (ranges[i].color == undefined) {
                    this.ranges[i].color = "#000000";
                };
                if (ranges[i].opacity == undefined) {
                    this.ranges[i].opacity = 1 - (1 / rangesCount) * i;
                };
            };

            // pointer property
            var pointer = this.pointer;
            if (pointer.value == undefined) {
                this.pointer.value = 65;
            };
            if (pointer.label == undefined) {
                this.pointer.label = "Value";
            };
            if (pointer.size == undefined) {
                this.pointer.size = "25%";
            };
            if (pointer.color == undefined) {
                this.pointer.color = "";
            };

            // target property
            var target = this.target;
            if (target.value == undefined) {
                this.target.value = 85;
            };
            if (target.label == undefined) {
                this.target.label = "Target";
            };
            if (target.size == undefined) {
                this.target.size = 5;
            };
            if (target.color == undefined) {
                this.target.color = "";
            };

            // ticks property
            var ticks = this.ticks;
            if (ticks.position == undefined) {
                this.ticks.position = "near";
            };
            if (ticks.interval == undefined) {
                this.ticks.interval = 20;
            };
            if (ticks.size == undefined) {
                this.ticks.size = 10;
            };
        },

        // handles incorrect pointer or target values
        _checkValues: function () {
            if (this.pointer.value > this._max) {
                this.pointer.value = this._max;
            } else if (this.pointer.value < this._min) {
                this.pointer.value = this._min;
            };

            if (this.target.value > this._max) {
                this.target.value = this._max;
            } else if (this.target.value < this._min) {
                this.target.value = this._min;
            };
        },

        // appends the ranges
        _appendRanges: function () {
            var appendString = "";
            var rangesCount = this.ranges.length;

            for (var i = 0; i < rangesCount; i++) {
                var currentRange = this.ranges[i];

                var currentRangeString;

                if (this.orientation == "horizontal") {
                    var rtl = this.rtl ? "right" : "left";
                    var rangeOffset = (currentRange.startValue - this._min) * this._valueToPixelsHorizontal;
                    var rangeWidth = (currentRange.endValue - currentRange.startValue) * this._valueToPixelsHorizontal;
                    currentRangeString = "<div class='" + this.toThemeProperty('jqx-bulletchart-range') + " " + this.toThemeProperty('jqx-bulletchart-range-horizontal') + "' style='" + rtl + ": " + rangeOffset + "px; width: " + rangeWidth + "px; background-color: " + currentRange.color + "; opacity: " + currentRange.opacity + "'></div>";
                } else if (this.orientation == "vertical") {
                    var rangeBottom = (currentRange.startValue - this._min) * this._valueToPixelsVertical;
                    var rangeHeight = (currentRange.endValue - currentRange.startValue) * this._valueToPixelsVertical;
                    currentRangeString = "<div class='" + this.toThemeProperty('jqx-bulletchart-range') + " " + this.toThemeProperty('jqx-bulletchart-range-vertical') + "' style='bottom: " + rangeBottom + "px; height: " + rangeHeight + "px; background-color: " + currentRange.color + "; opacity: " + currentRange.opacity + "'></div>";
                };

                appendString += currentRangeString;
            };

            this._chartContainer.append(appendString);
        },

        // appends the pointer and the target
        _appendPointerAndTarget: function () {
            var appendString = "";
            var pointerId = this.element.id + "Pointer";
            var targetId = this.element.id + "Target";
            var pointerSize = this.pointer.size;
            var targetValue = this.target.value;
            var targetSize = this.target.size;
            var offset = targetValue > 0 ? 0 : parseInt(targetSize);

            var pointerThemeClass = this.pointer.color.length > 0 ? "" : this.toThemeProperty('jqx-fill-state-pressed');
            var targetThemeClass = this.target.color.length > 0 ? "" : this.toThemeProperty('jqx-fill-state-pressed');

            if (this.orientation == "horizontal") {
                var pointerHeight = this._normaliseValue(pointerSize);
                var pointerTop = this._checkPercentage(pointerSize, this._chartContainer);

                var targetRtl = this.rtl ? "right" : "left";
                var targetOffset = (targetValue - this._min) * this._valueToPixelsHorizontal - offset;

                var pixelsOutsideBoundaries = targetOffset + parseInt(targetSize) - this._chartContainer.width();
                // checks if the target would be positioned outside the chart container
                if (targetOffset < 0) {
                    targetOffset = 0;
                } else if (pixelsOutsideBoundaries > 0) {
                    targetOffset -= pixelsOutsideBoundaries;
                };

                var targetWidth = this._normaliseValue(targetSize);
                appendString += "<div class='" + targetThemeClass + " " + this.toThemeProperty('jqx-bulletchart-target') + " " + this.toThemeProperty('jqx-bulletchart-target-horizontal') + "' id='" + targetId + "' style='" + targetRtl + ": " + targetOffset + "px; width: " + targetWidth + "; background-color: " + this.target.color + "'></div>";
                appendString += "<div class='" + pointerThemeClass + " " + this.toThemeProperty('jqx-bulletchart-pointer') + "' id='" + pointerId + "' style='top: " + pointerTop + "; height: " + pointerHeight + "; background-color: " + this.pointer.color + "'></div>";
            } else if (this.orientation == "vertical") {
                var chartContainerWidth = this._chartContainer.width();

                var pointerWidth = this._normaliseValue(pointerSize);
                var pointerLeft = this._checkPercentage(pointerSize, this._chartContainer);
                var targetBottom = (targetValue - this._min) * this._valueToPixelsVertical - offset;

                var pixelsOutsideBoundaries = targetBottom + parseInt(targetSize) - this._chartContainer.height();
                // checks if the target would be positioned outside the chart container
                if (targetBottom < 0) {
                    targetBottom = 0;
                } else if (pixelsOutsideBoundaries > 0) {
                    targetBottom -= pixelsOutsideBoundaries;
                };

                var targetHeight = this._normaliseValue(targetSize);

                appendString += "<div class='" + targetThemeClass + " " + this.toThemeProperty('jqx-bulletchart-target') + " " + this.toThemeProperty('jqx-bulletchart-target-vertical') + "' id='" + targetId + "' style='bottom: " + targetBottom + "px; height: " + targetHeight + "; background-color: " + this.target.color + "'></div>";
                appendString += "<div class='" + pointerThemeClass + " " + this.toThemeProperty('jqx-bulletchart-pointer') + "' id='" + pointerId + "' style='left: " + pointerLeft + "; width: " + pointerWidth + "; background-color: " + this.pointer.color + "'></div>";
            };

            this._chartContainer.append(appendString);
        },

        // updates the pointer
        _updatePointer: function (newSettings, oldSettings) {
            var pointer = $("#" + this.element.id + "Pointer");
            if (newSettings.value > this._max) {
                this.pointer.value = this._max;
            } else if (newSettings.value < this._min) {
                this.pointer.value = this._min;
            };

            if (newSettings.value != oldSettings.value) {
                this._updateValue(newSettings.value, oldSettings.value);
                if (this.showTooltip == true) {
                    this._updateTooltip();
                };
            };

            if (newSettings.label != oldSettings.label) {
                if (this.showTooltip == true) {
                    this._updateTooltip();
                };
            };

            if (newSettings.size != oldSettings.size) {
                var size = newSettings.size;
                if (this.orientation == "horizontal") {
                    var top = this._checkPercentage(size, this._chartContainer);
                    var height = this._normaliseValue(size);
                    pointer.css({ "top": top, "height": height });
                } else if (this.orientation == "vertical") {
                    var left = this._checkPercentage(size, this._chartContainer)
                    var width = this._normaliseValue(size);
                    pointer.css({ "left": left, "width": width });
                };
            };

            if (newSettings.color != oldSettings.color) {
                if (newSettings.color == "") {
                    pointer.css("background-color", "");
                    pointer.addClass(this.toThemeProperty('jqx-fill-state-pressed'));
                } else {
                    pointer.removeClass(this.toThemeProperty('jqx-fill-state-pressed'));
                    pointer.css("background-color", newSettings.color);
                };
            };
        },

        // updates the target
        _updateTarget: function (newSettings, oldSettings) {
            var target = $("#" + this.element.id + "Target");
            if (newSettings.value > this._max) {
                this.target.value = this._max;
            } else if (newSettings.value < this._min) {
                this.target.value = this._min;
            };

            // value and/or size
            if (newSettings.value != oldSettings.value || newSettings.size != oldSettings.size) {
                var value = newSettings.value;
                var size = parseInt(newSettings.size);
                var offset = value > 0 ? 0 : size;
                if (this.orientation == "horizontal") {
                    var targetRtl = this.rtl ? "right" : "left";
                    var targetOffset = (value - this._min) * this._valueToPixelsHorizontal - offset;

                    var pixelsOutsideBoundaries = targetOffset + size - this._chartContainer.width();
                    // checks if the target would be positioned outside the chart container
                    if (targetOffset < 0) {
                        targetOffset = 0;
                    } else if (pixelsOutsideBoundaries > 0) {
                        targetOffset -= pixelsOutsideBoundaries;
                    };

                    if (this.rtl == false) {
                        target.css("left", targetOffset);
                    } else {
                        target.css("right", targetOffset);
                    };
                    target.width(size);
                } else if (this.orientation == "vertical") {
                    var targetBottom = (value - this._min) * this._valueToPixelsVertical - offset;

                    var pixelsOutsideBoundaries = targetBottom + size - this._chartContainer.height();
                    // checks if the target would be positioned outside the chart container
                    if (targetBottom < 0) {
                        targetBottom = 0;
                    } else if (pixelsOutsideBoundaries > 0) {
                        targetBottom -= pixelsOutsideBoundaries;
                    };

                    target.css({ "bottom": targetBottom, "height": size });
                };
                if (this.showTooltip == true) {
                    this._updateTooltip();
                };
            };

            // label
            if (newSettings.label != oldSettings.label) {
                if (this.showTooltip == true) {
                    this._updateTooltip();
                };
            };

            // color
            if (newSettings.color != oldSettings.color) {
                if (newSettings.color == "") {
                    target.css("background-color", "");
                    target.addClass(this.toThemeProperty('jqx-fill-state-pressed'));
                } else {
                    target.removeClass(this.toThemeProperty('jqx-fill-state-pressed'));
                    target.css("background-color", newSettings.color);
                };
            };
        },

        // appends the title and description
        _appendTitleAndDescription: function () {
            var alignmentClass;
            if (this.orientation == "horizontal") {
                if (this.rtl == true) {
                    alignmentClass = this.toThemeProperty('jqx-bulletchart-title-description-rtl');
                } else {
                    alignmentClass = this.toThemeProperty('jqx-bulletchart-title-description-ltr');
                };
            } else {
                alignmentClass = this.toThemeProperty('jqx-bulletchart-title-description-vertical');
            };

            var rtl = this.rtl ? "rtl" : "ltr";
            var appendString = "<div id='" + this.element.id + "Title' class='" + this.toThemeProperty('jqx-bulletchart-title') + " " + alignmentClass + "' style='direction: " + rtl + ";'>" + this.title + "</div><div id='" + this.element.id + "Description' class='" + this.toThemeProperty('jqx-bulletchart-description') + " " + alignmentClass + "' style='direction: " + rtl + ";'>" + this.description + "</div>";

            var placeHolder = $("<div style='position: absolute; visibility: hidden;'>" + appendString + "</div>");
            this._titleContainer.append(placeHolder);
            var labels = placeHolder.children();
            var totalHeight = $(labels[0]).height() + $(labels[1]).height();
            placeHolder.remove();

            var orientationClass;
            if (this.orientation == "horizontal") {
                if (this.rtl == false) {
                    orientationClass = this.toThemeProperty('jqx-bulletchart-title-inner-container') + " " + this.toThemeProperty('jqx-bulletchart-title-inner-container-ltr');
                } else {
                    orientationClass = this.toThemeProperty('jqx-bulletchart-title-inner-container') + " " + this.toThemeProperty('jqx-bulletchart-title-inner-container-rtl');
                }
            } else {
                orientationClass = "";
            };

            this._titleContainer.append("<div class='" + orientationClass + "' style='height: " + totalHeight + "px;'>" + appendString + "</div>");
        },

        // appends ticks and their labels
        _appendTicksAndLabels: function () {
            // appends a placeholder div
            var placeHolder = $("<div style='position: absolute; visibility: hidden;'></div>");
            this._chartContainer.append(placeHolder);

            var appendString = "";
            var zeroFlag = this._min < 0 ? true : false;
            var ticksSize = this.ticks.size;

            if (this.orientation == "horizontal") {
                var horizontalOffset = this._titleContainer.width();
                var verticalOffset = this._chartContainer.offset().top - this.host.offset().top;

                if (this.ticks.position == "both" || this.ticks.position == "far") {
                    var bottomTicksTop = this._chartContainer.height() + verticalOffset;
                };

                for (var i = 0; i <= this._interval; i += this.ticks.interval) {
                    var currentLeft = i * this._valueToPixelsHorizontal + horizontalOffset;
                    if (i + this.ticks.interval > this._interval) {
                        currentLeft -= 1;
                    };

                    if (zeroFlag) {
                        var isZero = (i + this._min) == 0 ? true : false;
                        if (isZero) {
                            appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-ticks') + " " + this.toThemeProperty('jqx-bulletchart-ticks-horizontal') + " " + this.toThemeProperty('jqx-bulletchart-zero-tick') + "' style='top: " + verticalOffset + "px; " + rtl + ": " + currentLeft + "px; height: " + this._chartContainer.height() + "px;'></div>";
                            zeroFlag = false;
                        }
                    }

                    var value = this._labelValue(i);
                    placeHolder.html(value);
                    var labelOffset = currentLeft - placeHolder.width() / 2;

                    var rtl = this.rtl ? "right" : "left";

                    if (this.ticks.position == "both" || this.ticks.position == "far") {
                        // ticks
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-ticks') + " " + this.toThemeProperty('jqx-bulletchart-ticks-horizontal') + "' style='top: " + bottomTicksTop + "px; " + rtl + ": " + currentLeft + "px; height: " + ticksSize + "px;'></div>";
                        // labels
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-labels') + "' style='top: " + (bottomTicksTop + ticksSize + 2) + "px; " + rtl + ": " + labelOffset + "px;'>" + value + "</div>";
                    };

                    if (this.ticks.position == "both" || this.ticks.position == "near") {
                        // ticks
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-ticks') + " " + this.toThemeProperty('jqx-bulletchart-ticks-horizontal') + "' style='top: " + (verticalOffset - ticksSize) + "px; " + rtl + ": " + currentLeft + "px; height: " + ticksSize + "px;'></div>";
                        // labels
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-labels') + "' style='top: " + (verticalOffset - (ticksSize + placeHolder.height() + 2)) + "px; " + rtl + ": " + labelOffset + "px;'>" + value + "</div>";
                    };
                };
            } else if (this.orientation == "vertical") {
                var offset = this._chartContainer.offset().left - this.host.offset().left;

                if (this.ticks.position == "both" || this.ticks.position == "far") {
                    var rightTicksLeft = this._chartContainer.width();
                };

                for (var i = 0; i <= this._interval; i += this.ticks.interval) {
                    var currentBottom = i * this._valueToPixelsVertical;
                    if (i + this.ticks.interval > this._interval) {
                        currentBottom -= 1;
                    };

                    if (zeroFlag) {
                        var isZero = (i + this._min) == 0 ? true : false;
                        if (isZero) {
                            appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-ticks') + " " + this.toThemeProperty('jqx-bulletchart-ticks-vertical') + " " + this.toThemeProperty('jqx-bulletchart-zero-tick') + "' style='left: " + offset + "px; bottom: " + currentBottom + "px; width: " + rightTicksLeft + "px;'></div>";
                            zeroFlag = false;
                        }
                    }

                    if (this.ticks.position == "both" || this.ticks.position == "near") {
                        // ticks
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-ticks') + " " + this.toThemeProperty('jqx-bulletchart-ticks-vertical') + "' style='left: " + (offset - ticksSize) + "px; bottom: " + currentBottom + "px; width: " + ticksSize + "px;'></div>";
                        // labels
                        var value = this._labelValue(i, "near");
                        placeHolder.html(value);
                        var labelOffset = placeHolder.height() / 2 - 1;
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-labels') + "' style='left: " + (offset - (ticksSize + placeHolder.width() + 2)) + "px; bottom: " + (currentBottom - labelOffset) + "px;'>" + value + "</div>";
                    };

                    if (this.ticks.position == "both" || this.ticks.position == "far") {
                        // ticks
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-ticks') + " " + this.toThemeProperty('jqx-bulletchart-ticks-vertical') + "' style='left: " + (rightTicksLeft + offset) + "px; bottom: " + currentBottom + "px; width: " + ticksSize + "px;'></div>";
                        // labels
                        var value = this._labelValue(i, "far");
                        placeHolder.html(value);
                        var labelOffset = placeHolder.height() / 2 - 1;
                        appendString += "<div class='" + this.toThemeProperty('jqx-bulletchart-labels') + "' style='left: " + (rightTicksLeft + offset + ticksSize + 2) + "px; bottom: " + (currentBottom - labelOffset) + "px;'>" + value + "</div>";
                    };
                };
            };

            this.host.append(appendString);

            // removes the placeholder
            placeHolder.remove();
        },

        // returns the formatted label value
        _labelValue: function (i, position) {
            var value = i + this._min;
            var labelValue;
            if (this.labelsFormatFunction) {
                labelValue = this.labelsFormatFunction(value, position);
            } else {
                labelValue = $.jqx.dataFormat.formatnumber(value, this.labelsFormat);
            };
            return labelValue;
        },

        // initializes the tooltip and binds to the mouse events
        _initializeTooltip: function () {
            var me = this;
            var tooltipContent = this._tooltipContent();
            this.host.jqxTooltip({ theme: this.theme, position: "mouse", content: tooltipContent, trigger: "none", autoHide: false, rtl: this.rtl });
            this.host.jqxTooltip('getInstance').val = $.proxy(this.val, this);
            var pointerAndTarget = $("#" + this.element.id + "Pointer, #" + this.element.id + "Target");

            this.addHandler(pointerAndTarget, "mouseenter.bulletchart" + this.element.id, function (event) {
                if (me.disabled == false) {
                    me.host.jqxTooltip("open", event.pageX, event.pageY);
                    if (event.target.id == me.element.id + "Pointer" && me.pointer.color == "" || event.target.id == me.element.id + "Target" && me.target.color == "") {
                        $(event.target).removeClass(me.toThemeProperty('jqx-fill-state-pressed'));
                        $(event.target).addClass(me.toThemeProperty('jqx-fill-state-hover'));
                    };
                }
            });
            this.addHandler(pointerAndTarget, "mouseleave.bulletchart" + this.element.id, function (event) {
                if (me.disabled == false) {
                    me.host.jqxTooltip("close");
                    if (event.target.id == me.element.id + "Pointer" && me.pointer.color == "" || event.target.id == me.element.id + "Target" && me.target.color == "") {
                        $(event.target).removeClass(me.toThemeProperty('jqx-fill-state-hover'));
                        $(event.target).addClass(me.toThemeProperty('jqx-fill-state-pressed'));
                    };
                }
            });
        },

        // updates the tooltip's content
        _updateTooltip: function () {
            this.host.jqxTooltip({ content: this._tooltipContent() });
        },

        // returns the formatted tooltip content
        _tooltipContent: function () {
            var tooltipContent;
            if (this.tooltipFormatFunction) {
                tooltipContent = this.tooltipFormatFunction(this.pointer.value, this.target.value);
            } else {
                var value = $.jqx.dataFormat.formatnumber(this.pointer.value, this.labelsFormat);
                var target = $.jqx.dataFormat.formatnumber(this.target.value, this.labelsFormat);
                tooltipContent = "<div>" + this.pointer.label + ": " + value + "</div><div>" + this.target.label + ": " + target + "</div>";
            };
            return tooltipContent;
        },

        // sets or updates the pointer
        _updateValue: function (value, oldValue, initialization) {
            var me = this;
            var pointer = $("#" + this.element.id + "Pointer");
            var newSize, side, otherSide, pointerOffset;

            var getNewSize = function (orientation, valueToPixels, containerSize) {
                if (me._min >= 0) {
                    if (orientation == "vertical") {
                        pointer.css("bottom", 0);
                    } else if (me.rtl == true && orientation == "horizontal") {
                        pointer.css("right", 0);
                    };
                    newSize = (value - me._min) * valueToPixels;
                } else {
                    // negative value support
                    if (value >= 0) {
                        if (orientation == "horizontal") {
                            if (me.rtl == true) {
                                side = "right";
                                otherSide = "left";
                            } else {
                                side = "left";
                            };
                        } else if (orientation == "vertical") {
                            side = "bottom";
                            otherSide = "top";
                        };
                        var pointerOffset = -me._min * valueToPixels;
                    } else {
                        if (orientation == "horizontal") {
                            if (me.rtl == true) {
                                side = "left";
                            } else {
                                side = "right";
                                otherSide = "left";
                            };
                        } else if (orientation == "vertical") {
                            side = "top";
                        };
                        var pointerOffset = containerSize + me._min * valueToPixels;
                    };

                    pointer.css(side, pointerOffset);
                    if (otherSide) {
                        pointer.css(otherSide, "");
                    };
                    if (value * oldValue < 0) {
                        if (orientation == "horizontal") {
                            pointer.width(0);
                        } else if (orientation == "vertical") {
                            pointer.height(0);
                        };
                    };
                    newSize = Math.abs(value * valueToPixels);
                };

                return newSize;
            };

            var successFunction = function () {
                if (!initialization) {
                    me._raiseEvent("0");
                };
            };

            if (this.orientation == "horizontal") {
                var newWidth = getNewSize("horizontal", this._valueToPixelsHorizontal, this._chartContainer.width());
                setTimeout(function () {
                    pointer.animate({
                        width: newWidth
                    }, me.animationDuration, successFunction);
                }, 0);
            } else if (this.orientation == "vertical") {
                var newHeight = getNewSize("vertical", this._valueToPixelsVertical, this._chartContainer.height());
                setTimeout(function () {
                    pointer.animate({
                        height: newHeight
                    }, me.animationDuration, successFunction);
                }, 0);
            };
        },

        // adds percentage support to properties
        _checkPercentage: function (size, container) {
            var percentIndex = -1;

            if (size.indexOf) {
                percentIndex = size.indexOf("%");
            };

            var removePx = function (value) {
                if (!size.indexOf || size.indexOf("px") == -1) {
                    return value;
                } else {
                    return parseFloat(value.slice(0, size.indexOf("px")));
                };
            };

            var removePercent = function (value) {
                return parseFloat(value.slice(0, percentIndex));
            };

            if (percentIndex == -1) {
                var hostSize;
                if (this.orientation == "horizontal") {
                    hostSize = container.height();
                } else if (this.orientation == "vertical") {
                    hostSize = container.width();
                };
                return ((hostSize - removePx(size)) / 2) + "px";
            } else {
                return ((100 - removePercent(size)) / 2) + "%";
            };
        },

        // appends "px" to numeric values
        _normaliseValue: function (value) {
            if (!value.indexOf || (value.indexOf("px") == -1 && value.indexOf("%") == -1)) {
                return value + "px";
            } else {
                return value;
            };
        }
    });
})(jqxBaseFramework);
