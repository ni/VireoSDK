/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {

    'use strict';
    $.jqx.jqxWidget('jqxKnob', '', {});

    $.extend($.jqx._jqxKnob.prototype, {

        defineInstance: function () {
            var settings = {
                //// properties
                type: "circle",
                allowValueChangeOnClick: true,
                allowValueChangeOnDrag: true,
                allowValueChangeOnMouseWheel: true,
                changing: null,
                dragEndAngle: -1, // - degrees offset for the 0 location. [0-360]
                dragStartAngle: -1, // - degrees offset from 0 location for the maxValue location. [0-360]
                disabled: false, // - disables or enables the knob
                dial: {
                    style: 'transparent',
                    innerRadius: 0, // specifies the inner Radius of the dial
                    outerRadius: 0, // specifies the outer Radius of the dial
                    gradientType: null, // optional: specify gradient type ['linear', 'radial']
                    gradientStops: null,  // optional: specify gradient stops
                    startAngle: null, // optional, if specified dial will use this as the startAngle, otherwise will use widget's
                    endAngle: null  // optional, if specified dial will use this as the endAngle, otherwise will use widget's
                },
                endAngle: 360, // - degrees offset from 0 location for the maxValue location. [0-360]
                height: 400, // - sets the widget height
                labels:
                {
                    type: 'digits',
                    step: null,
                    rotate: false, // specifies if labels should be vertical or rotated with the appropriate angle
                    //intervals: '', // instead of dialLabels
                    offset: null, // specifies offset from
                    //position: '',
                    style: '', // svg text style attributes as string list, can also specify font styles "fill: red; stroke: blue; stroke-width: 3"
                    visible: false // sets whether dial labels should be displayed
                },
                marks: {
                    type: '', // ['circle', 'line']
                    thickness: 1, // specifies thickness in case of lines
                    size: '10%', // specifies radius in case of circular lines, or length in case of lines or arcs
                    colorProgress: 'transparent', // specifies mark colors depending on the value
                    colorRemaining: 'transparent', // specifies mark colors after the value
                    minorInterval: 1,
                    majorInterval: 5,
                    offset: '80%',
                    majorSize: '15%'
                },
                min: 0, // - sets the minValue for the knob. Default 0.
                max: 100, // - sets the maxValue for the knob. Default 100.
                progressBar: {
                    size: '10%', // specifies radius in case of circular lines, or length in case of lines or arcs
                    offset: '60%',
                    color: 'transparent', // specifies mark colors depending on the value
                    background: 'transparent' // specifies mark colors after the value
                },
                pointer:
                {
                    color: {  // optional object, could be just a string 'color' }
                        color: 'transparent',
                        border: null, // optional: specify stroke color
                        gradientType: null, // optional: specify gradient type ['linear', 'radial']
                        gradientStops: null // specify gradient stops
                    },
                    thickness: 1,
                    size: '',
                    type: '', // ['circle', 'line', 'arc', 'arrow']
                    visible: false
                },
                pointerGrabAction: 'normal', // ['normal', 'progressBar', 'pointer' ]
                renderEngine: '', // - sets the renderEngine
                rotation: 'clockwise', // - define knob spin direction. Default: 'clockwise', possible: 'counterclockwise'
                startAngle: 0, // - degrees offset for the 0 location. [0-360]
                spinner: {
                    color: 'transparent',
                    innerRadius: 0, // specifies the inner Radius of the dial
                    outerRadius: 0, // specifies the outer Radius of the dial
                    marks: {
                        step: 1,
                        rotate: false,
                        color: 'transparent',
                        size: 0,
                        steps: 10,
                        thickness: 1,
                        offset: 0
                    }
                },
                style:
                    {
                        fill: 'transparent',
                        stroke: 'transparent'
                    },
                _touchEvents: {
                    'mousedown': $.jqx.mobile.getTouchEventName('touchstart'),
                    'mouseup': $.jqx.mobile.getTouchEventName('touchend'),
                    'mousemove': $.jqx.mobile.getTouchEventName('touchmove'),
                    'mouseenter': 'mouseenter',
                    'mouseleave': 'mouseleave',
                    'click': $.jqx.mobile.getTouchEventName('touchstart')
                },
                step: 1, // - sets the knob increase/decrease step. Default: 1. ---- Includes the functionality of steps, too.
                snapToStep: true, // - Specifies whether setting the knob value will snap to the closest step true/false
                value: 0, // - sets the knob's initial value. Default equal to minValue.
                width: 400 // - sets the knob width
            };
            $.extend(true, this, settings);
            return settings;
        },

        createInstance: function () {
            var that = this;
            // renders the widget
            that._hostInit();
            that._ie8Plugin();
            that._validateProperties();
            that._initValues();
            that._refresh();
            $.jqx.utilities.resize(that.host, function () {
                that.widgetSize = Math.min(that.host.width(), that.host.height());
                that._refresh();
            });
        },

        _getEvent: function (event) {
            if (this._isTouchDevice) {
                return this._touchEvents[event] + ".jqxKnob" + this.element.id;;
            } else {
                return event + ".jqxKnob" + this.element.id;
            }
        },

        _ie8Plugin: function () {
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
        //// methods

        // public methods

        createColorGradient: function (color, gradientType, gradientStops) {
            return this._getGradient(color, gradientType, gradientStops);
        },

        // destroy the widget
        destroy: function () {
            var that = this;
            that.removeHandler($(document), 'mousemove.jqxKnob' + that.host[0].id);
            that.removeHandler($(document), 'blur.jqxKnob' + that.host[0].id);
            that.removeHandler($(document), 'mouseup.jqxKnob' + that.host[0].id);
            that.host.empty();
            that.host.remove();
        },

        propertiesChangedHandler: function (object, key, value)
        {
            if (value.width && value.height && Object.keys(value).length == 2)
            {
                object._refresh();
            }
        },

        propertyChangedHandler: function (object, key, oldvalue, value) {
            var that = this;
            if (object.batchUpdate && object.batchUpdate.width && object.batchUpdate.height && Object.keys(object.batchUpdate).length == 2)
            {
                return;
            }

            if (key === 'value')
            {
                object._setValue(value, 'propertyChange');
                return;
            }
            object._validateProperties();
            object._refresh();
        },

        val: function (value) {
            var that = this;
            if (arguments.length == 0) {
                return that.value;
            }
            that._setValue(value, null);
        },

        // private methods

        _isPointerGrabbed: false,
        _pointerGrabbedIndex: -1,

        _attatchPointerEventHandlers: function () {
            var that = this;
            //if (!that._pointer) {
            //    return;
            //}

            that.addHandler(that.host, this._getEvent('mousedown'), function (event) {
                if (that.pointerGrabAction === 'pointer') {
                   if (event.target.id !== that._pointerID) {
                       return;
                   }
                }
                if (that._isTouchDevice) {
                    var pos = $.jqx.position(event);
                    event.clientX = pos.left;
                    event.clientY = pos.top;
                }

                if (that.pointerGrabAction === 'progressBar') {
                    var mousePosition = { x: event.clientX, y: event.clientY };
                    var hostPosition = that.host[0].getBoundingClientRect();
                    var hostWidth = that.widgetSize;
                    var center = { x: hostPosition.left + hostWidth / 2, y: hostPosition.top + hostWidth / 2 };
                    var angle = that._calculateAngleFromCoordinates(mousePosition, center, that.rotation);
                    var distance = that._calculateDistance(mousePosition, center);
                    if (angle < that.startAngle) { angle += 360; }
                    if (angle > that.endAngle) {
                        if (angle - that.endAngle !== (360 + that.startAngle - angle)) {
                            return;
                        }
                    }
                    var minDistance = that._getScale(that.progressBar.offset, 'w', hostWidth/2);
                    var size = that._getScale(that.progressBar.size, 'w', hostWidth/2);
                    if (distance < minDistance|| distance > minDistance + size) {
                        return;
                    }
                }
                that._isPointerGrabbed = true;
                if (that.allowValueChangeOnClick === true) {
                    that._mouseMovePointer(event);
                }
                event.preventDefault();
                event.stopPropagation();
                return false;

            });
            var mouseMoveTimer = null;
            that.addHandler($(document), this._getEvent('mousemove'), function (event) {
                if (that.allowValueChangeOnDrag) {
                    if (mouseMoveTimer) {
                        clearTimeout(mouseMoveTimer);
                    }
                    mouseMoveTimer = setTimeout(function ()
                    {
                        that._mouseMovePointer(event);
                    });
                    if (that._isPointerGrabbed) {
                        return false;
                    }
                }
            });
            that.addHandler($(document), 'blur.jqxKnob' + that.host[0].id, function () {
                that._isPointerGrabbed = false;
                that._pointerGrabbedIndex = -1;
            });
            that.addHandler($(document), this._getEvent('mouseup'), function (event) {
                if (that._isPointerGrabbed) {
                    that._isPointerGrabbed = false;
                    that._pointerGrabbedIndex = -1;
                    that._raiseEvent(0, { originalEvent: event, value: that.value });
                }
            });
            that.addHandler(that.host, 'wheel', function(event) {
                if (that.allowValueChangeOnMouseWheel) {
                    var delta = 0;
                    if (!event) {/* For IE. */
                        event = window.event;
                    }

                    if (event.originalEvent && event.originalEvent.wheelDelta) {
                        event.wheelDelta = event.originalEvent.wheelDelta;
                    }

                    if (event.wheelDelta) { /* IE/Opera. */
                        delta = event.wheelDelta / 120;
                    } else if (event.detail) { /** Mozilla case. */
                        delta = -event.detail / 3;
                    } else if (event.originalEvent && event.originalEvent.deltaY) {
                        delta = event.originalEvent.deltaY; /* IE/Firefox */
                    }

                    if (delta > 0) {
                        that._increment();
                    } else {
                        that._decrement();
                    }
                    return false;
                }
            });

        },

        _mouseMovePointer: function(event) {
            var that = this;
            if (that.disabled)
                return;

            if (that._isPointerGrabbed) {
                if (that._isTouchDevice) {
                    var pos = $.jqx.position(event);
                    event.clientX = pos.left;
                    event.clientY = pos.top;
                }

                var mousePosition = { x: event.clientX, y: event.clientY };
                var hostPosition = that.host[0].getBoundingClientRect();
                var hostWidth = that.widgetSize;
                var center = { x: hostPosition.left + hostWidth / 2, y: hostPosition.top + hostWidth / 2 };
                var angle = that._calculateAngleFromCoordinates(mousePosition, center, that.rotation);
                var value = that._calculateValueFromAngle(angle, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                if (that.value.length) {
                    if (that._pointerGrabbedIndex === -1) {
                        for (var i = 0; i < that.value.length; i++) {
                            if (value <= that.value[i]) {
                                that._pointerGrabbedIndex = i;
                                break;
                            } else if (i === that.value.length - 1) {
                                that._pointerGrabbedIndex = i;
                            } else if (value <= that.value[i + 1]) {
                                var mid = that.value[i] + (that.value[i + 1] - that.value[i]) / 2;
                                that._pointerGrabbedIndex = value <= mid ? i : i + 1;
                                break;
                            }
                        }
                    }
                }
                if (that.pointer && that.pointer.length > 1) {
                    if (that._pointerGrabbedIndex == 1) {
                        var startAngle = that._calculateAngleFromValue(that.value[0], that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                        var endAngle = that._calculateAngleFromValue(that.max, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                        var angle = that._calculateAngleFromValue(value, that.dragStartAngle, that.dragEndAngle, that.min, that.max);

                        if (angle <= startAngle)
                            return;
                        if (angle >= endAngle)
                            return;
                    }
                    if (that._pointerGrabbedIndex == 0) {
                        var endAngle = that._calculateAngleFromValue(that.value[1], that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                        var startAngle = that._calculateAngleFromValue(that.min, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                        var angle = that._calculateAngleFromValue(value, that.dragStartAngle, that.dragEndAngle, that.min, that.max);

                        if (angle <= startAngle)
                            return;
                        if (angle >= endAngle)
                            return;

                    }
                }
                if (that.changing) {
                    var newValue = that.value.slice(0);
                    newValue[that._pointerGrabbedIndex] = value;
                    var result = that.changing(that.value, newValue);
                    if (result === false)
                        return;
                }
                that._setValue(value, 'mouse');
            }
        },

        _getScale: function (size, dim, parent) {
            if (size && size.toString().indexOf('%') >= 0) {
                size = parseInt(size, 10) / 100;
                if (typeof(parent) == 'object') {
                    return parent[dim]() * size;
                } else {
                    return parent * size;
                }
            }
            return parseInt(size, 10);
        },

        _hostInit: function () {
            var that = this;
            this._isTouchDevice = $.jqx.mobile.isTouchDevice();
            var host = that.host;
            host.width(that.width);
            host.height(that.height);
            host.css('position', 'relative');
            that.host.addClass(that.toThemeProperty('jqx-widget jqx-knob'));

            if (that.dragStartAngle == -1) {
                that.dragStartAngle = that.startAngle;
            }
            if (that.dragEndAngle == -1) {
                that.dragEndAngle = that.endAngle;
            }
            if (that.dragStartAngle < that.startAngle) {
                that.dragStartAngle = that.startAngle;
            }
            if (that.dragEndAngle > that.endAngle) {
                that.dragEndAngle = that.endAngle;
            }

            that.widgetSize = Math.min(that.host.width(), that.host.height());
        },

        _initRenderer: function (host) {
            if (!$.jqx.createRenderer)
                throw 'jqxKnob: Please include a reference to jqxdraw.js';
            return $.jqx.createRenderer(this, host);
        },

        _initValues: function (){
            var that = this;
            //if (that.background) {
            //    if (that.background.color){
            //        if (that.background.gradientType && !that.background.gradientStops){
            //            that.background.gradientStops = [[0, 1], [50, 0.5], [100, 1]];
            //        }
            //        if (!that.background.gradientType && that.background.gradientStops){
            //            that.background.gradientType = 'radial';
            //        }
            //    }
            //}
            //if (that.dial) {
            //    if (that.dial.color){
            //        if (that.dial.gradientType && !that.dial.gradientStops){
            //            that.dial.gradientStops = [[0, 1], [50, 0.5], [100, 1]];
            //        }
            //        if (!that.dial.gradientType && that.dial.gradientStops){
            //            that.dial.gradientType = 'radial';
            //        }
            //    }
            //}

            if (that.marks) {
                if (that.marks.style && that.marks.style !== ''){
                    if (that.marks.style === 'line' && !that.marks.thickness){
                        that.marks.thickness = 1;
                    }
                    if (!that.marks.size){
                        that.marks.size = '5%';
                    }
                    if (!that.marks.offset){
                        that.marks.offset = '85%';
                    }
                    //if (!that.marks.colorProgress && that.marks.colorRemaining){
                    //    that.marks.colorProgress = 'transparent';
                    //}
                    //if (that.marks.colorProgress && !that.marks.colorRemaining){
                    //    that.marks.colorRemaining = 'transparent';
                    //}
                }
                if (that.marks.majorInterval) {
                    if (that.marks.majorSize === undefined){
                        that.marks.majorSize = '10%';
                    }
                }
            }

            that._marksList = that._getMarksArray(that.marks);
            if (that.spinner) {
                that._spinnerMarksList = that._getMarksArray(that.spinner.marks);
            }
        },

        _calculateAngleFromValue: function (value, startAngle, endAngle, minValue, maxValue) {
            if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                if (this.type != "circle") {
                    return minValue != maxValue ? parseInt((value - minValue) / (maxValue - minValue)) : 0;
                }

                return minValue != maxValue ? parseInt((value - minValue) / (maxValue - minValue) * (endAngle - startAngle)) : 0;
            }
            if (this.type != "circle") {
                return minValue != maxValue ? (value - minValue) / (maxValue - minValue) : 0;
            }

            return minValue != maxValue ? (value - minValue) / (maxValue - minValue) * (endAngle - startAngle) : 0;
        },

        _calculateAngleFromCoordinates: function (position, center, rotation) {
            var x = position.x - center.x;
            var y = position.y - center.y;
            if (y > 0) {
                return rotation === 'clockwise' ? 90 - Math.atan(x / y) * 180 / Math.PI : 270 + Math.atan(x / y) * 180 / Math.PI;
            } else if (y < 0) {
                return rotation === 'clockwise' ? 270 - Math.atan(x / y) * 180 / Math.PI : 90 + Math.atan(x / y) * 180 / Math.PI;
            } else if (x >= 0) {
                return 0;
            } else {
                return 180;
            }
        },

        _calculateValueFromAngle: function (angle, startAngle, endAngle, min, max) {
            if (angle < startAngle) { angle += 360; }
            var value = min;
            if (angle > endAngle) {
                if (angle - endAngle < (360 + startAngle - angle)) {
                    value = max;
                }
            } else {
                value = min + (angle - startAngle) * (max - min) / (endAngle - startAngle);
            }
            return value;
        },

        _calculateDistance: function (position, center) {
            return Math.sqrt(Math.pow(position.x - center.x, 2) + Math.pow(position.y - center.y, 2));
        },

        _drawBackground: function () {
            var that = this;
            var renderer = that.renderer;
            var width, radius, color;
            width = that.widgetSize;
            radius = width / 2;
            var strokeWidth = that.style.strokeWidth ? that.style.strokeWidth : 0;
            radius -= strokeWidth/2;
            if (that.style) {
                var color = that._getColor(that.style.fill);
                var border = that._getColor(that.style.stroke);
                var strokeWidth = that.style.strokeWidth ? that.style.strokeWidth : 1;
                if (that.type != "circle") {
                    renderer.rect(0, 0, this.host.width(), this.host.height(), { fill: color, stroke: border, 'stroke-width': strokeWidth });
                }
                else {
                    renderer.circle(width / 2, width / 2, radius, { fill: color, stroke: border, 'stroke-width': strokeWidth });
                }
            }
        },

        _drawDial: function () {
            var that = this;
            if (that.dial) {
                var renderer = that.renderer;
                var width = that.widgetSize;
                var cx, cy, innerRadius, outerRadius, startAngle, endAngle, centerOffset = 0, color;
                cx = cy = width / 2;
                outerRadius = that._getScale(that.dial.outerRadius, 'w', width / 2);
                innerRadius = that._getScale(that.dial.innerRadius, 'w', width / 2);
                if (that.dial.startAngle != null && that.dial.endAngle != null) {
                    startAngle = that.rotation === 'clockwise' ? 360 - that.dial.endAngle : that.dial.startAngle; // draw direction reversed because renderer requires end to be higher than start.
                    endAngle = that.rotation === 'clockwise' ? 360 - that.dial.startAngle : that.dial.endAngle;
                } else {
                    startAngle = that.rotation === 'clockwise' ? 360 - that.endAngle : that.startAngle; // draw direction reversed because renderer requires end to be higher than start.
                    endAngle = that.rotation === 'clockwise' ? 360 - that.startAngle : that.endAngle;
                }
                color = that._getColor(that.dial.style.fill);
                var border = that._getColor(that.dial.style.stroke) || '';
                var borderWidth = that.dial.style.strokeWidth || 0;
                renderer.pieslice(cx, cy, innerRadius, outerRadius, startAngle, endAngle, centerOffset, { fill: color, stroke: border, "stroke-width": borderWidth });
            }
        },

        _getMarksArray: function (marksObj) {
            if (marksObj == undefined) return [];
            var that = this,
                i, value,
                marks = {},
                max = that.max,
                min = that.min,
                range = max - min,
                minorInterval = marksObj.minorInterval,
                majorInterval = marksObj.majorInterval;
            var formatFunction = function (value) { // used to remove formatting error on values less than 1, so as to prevent duplicates;
                return (parseFloat(value.toPrecision(12)));
            };

            if (minorInterval) { // not null, 0 or undefined
                for (i = 0; i < range; i += minorInterval){
                    value = formatFunction(min + i);
                    marks[value] = {type: 'minor'};
                }
                marks[max] = {type: 'minor'};
            }
            if (majorInterval) { // not null, 0 or undefined
                for (i = 0; i < range; i += majorInterval){
                    value = formatFunction(min + i);
                    marks[value] = {type: 'major'};
                }
                marks[max] = {type: 'major'};
            }
            if (!minorInterval && !majorInterval) { //neither is defined use step
                var step = that.step;
                if (step) { // not null, 0 or undefined
                    for (i = 0; i < range; i += step){
                        value = formatFunction(min + i);
                        marks[value] = {type: 'minor'};
                    }
                    marks[max] = {type: 'minor'};
                }
            }
            return marks;
        },

        _drawMarks: function () {
            var that = this;
            if (that.marks) {
                var renderer = that.renderer;
                var width = that.widgetSize;
                var color = that.marks && that.marks.colorRemaining != null ? that.marks.colorRemaining : 'transparent';
                color = that._getColor(color);
                that._dialMarks = [];
                var size, angle;
                var type = that.marks.type;
                if (!type) {
                    type = "line";
                }
                var offset = that._getScale(that.marks.offset, 'w', width / 2); // add error handling if value is invalid
                var marksList = that._marksList;
                $.each(marksList, function (key, value) {
                    if (that.dragEndAngle - that.dragStartAngle === 360) {
                        if ( key == that.max) {
                            return;
                        }
                    }
                    angle = that.dragStartAngle + that._calculateAngleFromValue(key, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                    if (type === 'circle') {
                        var radius = that._getScale(that.marks.size, 'w', width / 2);
                        var position = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        that._dialMarks.push(renderer.circle(position.x, position.y, radius, {fill: color}));
                    } else if (type === 'line') {
                        if (value.type === 'major' && that.marks.majorSize !==  null && that.marks.majorSize !== undefined) {
                            size = that._getScale(that.marks.majorSize, 'w', width / 2);
                        } else {
                            size = that._getScale(that.marks.size, 'w', width / 2);
                        }
                        var thickness = that._getScale(that.marks.thickness, 'w', width / 2);
                        var lineStartPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        var lineEndPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset + size, angle, that.rotation);
                        if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                            that._dialMarks.push(renderer.line(parseInt(lineStartPosition.x), parseInt(lineStartPosition.y), parseInt(lineEndPosition.x), parseInt(lineEndPosition.y), {
                                stroke: color,
                                'stroke-width': thickness
                            }));
                        }
                        else {
                            that._dialMarks.push(renderer.line(lineStartPosition.x, lineStartPosition.y, lineEndPosition.x, lineEndPosition.y, {
                                stroke: color,
                                'stroke-width': thickness
                            }));
                        }
                    }

                });


            }
        },

        _drawProgressBars: function() {
            var that = this;

            if (that.progressBar) {
                that._progressBar = that._progressBar || [];
                for (var i = 0; i < that._progressBar.length; i++) {
                    $(that._progressBar[i]).remove();
                }
                that._progressBar = [];
                if (that._isArray(that.progressBar.style)) {
                    var min = that.value[0];
                    var max = that.value[1];

                    var color1 = that.progressBar.style[0];
                    var color2 = that.progressBar.style[1];

                    that._progressBar.push(that._drawProgressBar(that.max, that.progressBar.background, 'background'));
                    if (that.progressBar.ranges) {
                        for (var i = 0; i < that.progressBar.ranges.length; i++) {
                            var fromValue = that.progressBar.ranges[i].startValue;
                            var toValue = that.progressBar.ranges[i].endValue;
                            that._progressBar.push(that._drawProgressBarFromToValue(fromValue, toValue, that.progressBar.ranges[i], 'background'));
                        }
                    }
                    that._progressBar.push(that._drawProgressBar(min, color1));
                    that._progressBar.push(that._drawProgressBarFromEndToStart(max, color2));

                } else {
                    that._progressBar.push(that._drawProgressBar(that.max, that.progressBar.background, 'background'));
                    if (that.progressBar.ranges) {
                        for (var i = 0; i < that.progressBar.ranges.length; i++) {
                            var fromValue = that.progressBar.ranges[i].startValue;
                            var toValue = that.progressBar.ranges[i].endValue;
                            that._progressBar.push(that._drawProgressBarFromToValue(fromValue, toValue, that.progressBar.ranges[i], 'background'));
                        }
                    }
                    that._progressBar.push(that._drawProgressBar(that.value, that.progressBar.style));
                }             
            }
        },

        _drawProgressBarFromEndToStart: function (value, color) {
            var that = this;
            var renderer = that.renderer;
            var width = that.widgetSize;
            var size, angle;
            var offset = that._getScale(that.progressBar.offset, 'w', width / 2);
            var cx, cy, innerRadius, outerRadius, startAngle, endAngle, centerOffset = 0;
            size = that._getScale(that.progressBar.size, 'w', width / 2);
            cx = cy = width / 2;
            innerRadius = offset;
            outerRadius = offset + size;
            var color1 = that._getColor(color.fill) || 'transparent';
            var border1 = that._getColor(color.stroke) || 'transparent';
            angle = that.dragStartAngle + that._calculateAngleFromValue(value, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
            startAngle = that.dragStartAngle; // draw direction reversed because renderer requires end to be higher than start.
            var strokeWidth = color.strokeWidth ? color.strokeWidth : 1;
            if (that.endAngle != angle) {
                if (that.rotation === 'clockwise') {
                    return (renderer.pieslice(cx, cy, innerRadius, outerRadius, 360 - that.endAngle, 360 - angle, centerOffset, { fill: color1, stroke: border1, 'stroke-width': strokeWidth}));
                } else {
                    return (renderer.pieslice(cx, cy, innerRadius, outerRadius, endAngle, angle, centerOffset, { fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
                }
            }
        },

        _drawProgressBarFromToValue: function (fromValue, toValue, color, type) {
            var that = this;
            var renderer = that.renderer;
            var width = that.widgetSize;
            var size, angle;
            var offset = that._getScale(that.progressBar.offset, 'w',  width / 2);
            var cx, cy, innerRadius, outerRadius, startAngle, endAngle, centerOffset = 0;
            size = that._getScale(that.progressBar.size, 'w', width / 2);
            cx = cy = width / 2;
            innerRadius = offset;
            outerRadius = offset + size;
            var color1 = that._getColor(color.fill) || 'transparent';
            var border1 = that._getColor(color.stroke) || 'transparent';
            angle = that.dragStartAngle + that._calculateAngleFromValue(toValue, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
            startAngle = that.dragStartAngle + that._calculateAngleFromValue(fromValue, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
            if (startAngle == angle)
                return;
            var sw = 1;
            if (type == "background") sw = 0;
            var strokeWidth = color.strokeWidth ? color.strokeWidth : sw;

            if (that.type != "circle") {
                if (that.type == "rect") {
                    var h = angle * (this.host.height() - 2 * offset);
                    var fullH = (this.host.height() - 2 * offset);
                    return (renderer.rect(cx - size / 2, offset + fullH - h, size, h, { fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
                }
                else {
                    return (renderer.rect(offset, cy - size / 2, this.host.width() - 2 * offset, size, { fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
                }
            }

            if (that.rotation === 'clockwise') {
                return (renderer.pieslice(cx, cy, innerRadius, outerRadius, 360 - angle, 360 - startAngle, centerOffset, { fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
            } else {
                return (renderer.pieslice(cx, cy, innerRadius, outerRadius, startAngle, angle, centerOffset, { fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
            }
        },

        _drawProgressBar: function (value, color, type) {
            var that = this;
            var renderer = that.renderer;
            var width = that.widgetSize;
            var size, angle;
            var offset = that._getScale(that.progressBar.offset, 'w',  width / 2);
            var cx, cy, innerRadius, outerRadius, startAngle, endAngle, centerOffset = 0;
            size = that._getScale(that.progressBar.size, 'w', width / 2);
            cx = cy = width / 2;
            innerRadius = offset;
            outerRadius = offset + size;
            var color1 = that._getColor(color.fill) || 'transparent';
            var border1 = that._getColor(color.stroke) || 'transparent';
            angle = that.dragStartAngle + that._calculateAngleFromValue(value, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
            startAngle = that.dragStartAngle; // draw direction reversed because renderer requires end to be higher than start.
            if (startAngle == angle)
                return;
            var sw = 1;
            if (type == "background") sw = 0;
            var strokeWidth = color.strokeWidth ? color.strokeWidth : sw;

            if (that.type != "circle") {
                if (that.type == "rect") {
                    var h = angle * (this.host.height() - 2 * offset);
                    var fullH = (this.host.height() - 2 * offset);
                    return (renderer.rect(cx - size / 2, offset + fullH - h, size, h, { fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
                }
                else {
                    return (renderer.rect(offset, cy - size / 2, this.host.width() - 2 * offset, size, { fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
                }
            }

            if (that.rotation === 'clockwise') {
                return (renderer.pieslice(cx, cy, innerRadius, outerRadius, 360 - angle, 360 - startAngle, centerOffset, {opacity: color.opacity || 1, fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
            } else {
                return (renderer.pieslice(cx, cy, innerRadius, outerRadius, startAngle, angle, centerOffset, { opacity: color.opacity || 1, fill: color1, stroke: border1, 'stroke-width': strokeWidth }));
            }
        },

        _drawLabels: function () {
            var that = this;
            that._labels = [];
            var renderer = that.renderer;
            var width = that.widgetSize;
            if (that.labels.visible === undefined) {
                that.labels.visible = true;
            }

            if (that.labels.visible === true) {
                var offset = that._getScale(that.labels.offset, 'w', width / 2); // add error handling if value is invalid
                var type = that.labels.type ? that.labels.type : "digits";
                var style = that.labels.style;
                var color = style && style.fill ? that._getColor(style.fill) : '#333';

                var i;
                if (type === 'digits') {
                    var labels = [];
                    if (that.labels.customLabels) {
                        for (i = 0; i < that.labels.customLabels.length; i++) {
                            labels.push(that.labels.customLabels[i].value);
                        }
                    } else {
                        var step = that.labels.step || that.step;
                        for (i = that.min; i < that.max; i += step) {
                            labels.push(i);
                        }
                        if (that.dragEndAngle - 360 < that.dragStartAngle) {
                            labels.push(that.max);
                        }
                    }
                    // draw labels
                    for (i = 0; i < labels.length; i++) {
                        
                        var labelText = that.labels.customLabels ? that.labels.customLabels[i].text : labels[i].toString();
                        if (that.labels.formatFunction) {
                            labelText = that.labels.formatFunction(labelText);
                        }
                        var labelsStartAngle = that.dragStartAngle;
                        var labelsEndAngle = that.dragEndAngle;

                        var angle = labelsStartAngle + that._calculateAngleFromValue(labels[i], labelsStartAngle, labelsEndAngle, that.min, that.max);
                        var labelTextPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                            var textSize = renderer.measureText(labelText, 0, { "class": this.toThemeProperty('jqx-knob-label') });
                            var rotationAngle = that.labels.rotate ? 90 - angle : 0;
                            renderer.text(labelText, labelTextPosition.x - textSize.width / 2, labelTextPosition.y - textSize.height / 2, textSize.width, textSize.height, rotationAngle, {  "class": this.toThemeProperty('jqx-knob-label') }, false);
                        }
                        else {
                            var textSize = renderer.measureText(labelText, 0, { 'style': { fill: color }, "class": this.toThemeProperty('jqx-knob-label') });
                            var rotationAngle = that.labels.rotate ? 90 - angle : 0;
                            renderer.text(labelText, labelTextPosition.x - textSize.width / 2, labelTextPosition.y - textSize.height / 2, textSize.width, textSize.height, rotationAngle, { 'style': { fill: color }, "class": this.toThemeProperty('jqx-knob-label') }, false);
                        }
                    }
                }
            }

        },

        _drawPointers: function (){
            var that = this;
            that._pointers = that._pointers || [];
            that._pointers.forEach(function (pointer, index, object) {
                $(pointer).remove();
                object.splice(index, 1);
            });
            if (that.pointer){
                if(that._isArray(that.pointer)) {
                    for (var i = 0; i < that.progressBar.style.length; i++) {
                        if (that.pointer[i].visible === false)
                            continue;

                        that._pointers.push(that._drawPointer(that.value[i], that.pointer[i]));
                    }
                } else {
                    if (that.pointer.visible === false)
                        return;

                    that._pointers.push(that._drawPointer(that.value, that.pointer));
                }
            }
        },

        _drawPointer: function (value, pointerObject) {
            var that = this;
            pointerObject.id = pointerObject.id || that._getID();
            var renderer = that.renderer;
            var width = that.widgetSize;
            var type = pointerObject.type;
            if (!type) type = "circle";
            if (!pointerObject.style) {
                pointerObject.style = { fill: "#feaf4e", stroke: "#feaf4e" };
            }
            var color = that._getColor(pointerObject.style.fill);
            var border = pointerObject.style.stroke || '';
            var size, thickness;
            var pointerElement;

            var offset = that._getScale(pointerObject.offset, 'w', width / 2); // add error handling if value is invalid
            var angle = that.dragStartAngle + that._calculateAngleFromValue(value, that.dragStartAngle, that.dragEndAngle, that.min, that.max);

            if (type === 'circle') {
                var radius = that._getScale(pointerObject.size, 'w', width / 2);
                var position = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset, angle, that.rotation);
                pointerElement = renderer.circle(position.x, position.y, radius, { id: pointerObject.id, fill: color, stroke: border });
            } else if (type === 'line') {
                size = that._getScale(pointerObject.size, 'w', width / 2);
                thickness = pointerObject.thickness;
                var lineStartPosition = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset, angle, that.rotation);
                var lineEndPosition = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset + size, angle, that.rotation);
                pointerElement = renderer.line(lineStartPosition.x, lineStartPosition.y, lineEndPosition.x, lineEndPosition.y, { id: pointerObject.id, stroke: color, 'stroke-width': thickness });
            } else if (type === 'arc') {
                size = that._getScale(pointerObject.size, 'w', width / 2);
                var cx, cy, innerRadius, outerRadius, startAngle, endAngle, centerOffset = 0;
                var arcWidth = (that.dragEndAngle - that.dragStartAngle) / that._steps.length;
                cx = cy = width / 2;
                innerRadius = offset;
                outerRadius = offset + size;
                startAngle = that.rotation === 'clockwise' ? 360 - (angle + arcWidth / 2) : angle - arcWidth / 2;
                endAngle = that.rotation === 'clockwise' ? 360 - (angle - arcWidth / 2) : angle + arcWidth / 2;
                pointerElement = renderer.pieslice(cx, cy, innerRadius, outerRadius, startAngle, endAngle, centerOffset, { id: pointerObject.id, fill: color, stroke: border});
            } else if ( type === 'arrow') {
                size = that._getScale(pointerObject.size, 'w', width / 2);
                thickness = pointerObject.thickness;
                var tip = that._getPointerPosition({ x: width / 2, y: width / 2 }, size, angle, that.rotation);
                var baseFoundation = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset, angle, that.rotation);
                var base1 = that._getPointerPosition({ x: baseFoundation.x, y: baseFoundation.y }, thickness/2, angle - 90, that.rotation);
                var base2 = that._getPointerPosition({ x: baseFoundation.x, y: baseFoundation.y }, thickness/2, angle + 90, that.rotation);
                var points = 'M ' + tip.x + ',' + tip.y + ' L ' + base1.x + ',' + base1.y + ' L ' + base2.x + ',' + base2.y + ' ' + tip.x + ',' + tip.y;
                pointerElement = this.renderer.path(points, {id: pointerObject.id, stroke: border, fill: color});
            }
            return pointerElement;
        },

        _rotateSpinnerMarks: function (newAngle) {
            var that = this;
            var marks = that.spinner.marks;
            if (marks) {
                if (marks.rotate === false) return;
                var renderer = that.renderer;
                var width = that.widgetSize;
                var color = marks && marks.colorRemaining != null ? marks.colorRemaining : 'transparent';
                color = that._getColor(color);
                var size, angle;
                var type = marks.type;
                if (!type) {
                    type = "line";
                }
                var offset = that._getScale(marks.offset, 'w', width / 2); // add error handling if value is invalid
                for (var i = 0; i < that._spinnerMarks.length; i++) {
                    $(that._spinnerMarks[i]).remove();
                }
                that._spinnerMarks = [];
                var marksList = that._spinnerMarksList;
                $.each(marksList, function (key, value) {
                    if (that.endAngle - that.startAngle === 360) {
                        if (key == that.max) {
                            return;
                        }
                    }
                    angle = newAngle + that._calculateAngleFromValue(key, that.startAngle, that.endAngle, that.min, that.max);
                    if (angle < that.startAngle)
                        return true;
                    
                    if (angle > that.endAngle && angle < that.startAngle + 360)
                        return true;

                    if (type === 'circle') {
                        var radius = that._getScale(marks.size, 'w', width / 2);
                        var position = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        that._spinnerMarks.push(renderer.circle(position.x, position.y, radius, { fill: color }));
                    } else if (type === 'line') {
                        if (value.type === 'major' && marks.majorSize !== null && marks.majorSize !== undefined) {
                            size = that._getScale(marks.majorSize, 'w', width / 2);
                        } else {
                            size = that._getScale(marks.size, 'w', width / 2);
                        }
                        var thickness = that._getScale(marks.thickness, 'w', width / 2);
                        var lineStartPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        var lineEndPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset + size, angle, that.rotation);
                        that._spinnerMarks.push(renderer.line(lineStartPosition.x, lineStartPosition.y, lineEndPosition.x, lineEndPosition.y, {
                            stroke: color,
                            'stroke-width': thickness
                        }));
                    }

                });
            }
        },

        _drawSpinnerMarks: function (marks) {
            var that = this;
            if (marks) {
                var renderer = that.renderer;
                var width = that.widgetSize;
                var color = marks && marks.colorRemaining != null ? marks.colorRemaining : 'transparent';
                color = that._getColor(color);
                that._spinnerMarks = [];
                var size, angle;
                var type = marks.type;
                if (!type) {
                    type = "line";
                }
                var offset = that._getScale(marks.offset, 'w', width / 2); // add error handling if value is invalid
                var marksList = that._spinnerMarksList;
                $.each(marksList, function (key, value) {
                    if (that.dragEndAngle - that.dragStartAngle === 360) {
                        if ( key == that.max) {
                            return;
                        }
                    }
                    angle = that.startAngle + that._calculateAngleFromValue(key, that.startAngle, that.endAngle, that.min, that.max);
                    if (type === 'circle') {
                        var radius = that._getScale(marks.size, 'w', width / 2);
                        var position = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        that._spinnerMarks.push(renderer.circle(position.x, position.y, radius, {fill: color}));
                    } else if (type === 'line') {
                        if (value.type === 'major' && marks.majorSize !==  null && marks.majorSize !== undefined) {
                            size = that._getScale(marks.majorSize, 'w', width / 2);
                        } else {
                            size = that._getScale(marks.size, 'w', width / 2);
                        }
                        var thickness = that._getScale(marks.thickness, 'w', width / 2);
                        var lineStartPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        var lineEndPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset + size, angle, that.rotation);

                        that._spinnerMarks.push(renderer.line(lineStartPosition.x, lineStartPosition.y, lineEndPosition.x, lineEndPosition.y, {
                            stroke: color,
                            'stroke-width': thickness
                        }));
                    }

                });
            }
        },

        _drawSpinner: function () {
            var that = this;
            if (that.spinner) {
                var renderer = that.renderer;
                var width = that.widgetSize;
                if (!that.spinner.style) {
                    that.spinner.style = { fill: "#dfe3e9", stroke: "#dfe3e9" };
                }
                var color = that._getColor(that.spinner.style.fill);
                var border = that.spinner.style.stroke || '';
                var cx, cy;
                cx = cy = width / 2;
                var outerRadius = that._getScale(that.spinner.outerRadius, 'w', width / 2);
                var innerRadius = that._getScale(that.spinner.innerRadius, 'w', width / 2);
                var strokeWidth = color.strokeWidth ? color.strokeWidth : 2;

                renderer.pieslice(cx, cy, innerRadius, outerRadius, 360 - that.endAngle, 360 - that.startAngle, 0, { "stroke-width": strokeWidth, fill: color, stroke: border });
                if (that.spinner.marks) {
                    that._drawSpinnerMarks(that.spinner.marks);
                    return;
                    that._spinnerMarks = [];
                    var size, thickness, marksColor;
                    size = that._getScale(that.spinner.marks.size, 'w', width / 2);
                    thickness = that._getScale(that.spinner.marks.thickness, 'w', width / 2);
                    var offset = that._getScale(that.spinner.marks.offset, 'w', width / 2);
                    var steps = 0;

                    $.each(that._spinnerMarksList, function (key, value) {
                        steps++;
                    });

                    marksColor = that._getColor(that.spinner.marks.colorRemaining);
                    var angle;
                    for (var i = 0; i < steps; i ++ ){
                        angle = that.startAngle + i / steps * that.dragEndAngle;
                        var lineStartPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset, angle, that.rotation);
                        var lineEndPosition = that._getPointerPosition({
                            x: width / 2,
                            y: width / 2
                        }, offset + size, angle, that.rotation);
                        that._spinnerMarks.push(renderer.line(lineStartPosition.x, lineStartPosition.y, lineEndPosition.x, lineEndPosition.y, {
                            stroke: marksColor,
                            'stroke-width': thickness
                        }));
                    }
                }
            }
        },

        _getColor: function (color) {
            if (color && typeof(color) === 'object') {
                return this._getGradient(color.color, color.gradientType, color.gradientStops);
            }
            return color;
        },

        _getGradient: function (color, type, stops) {
            if (type && stops != null && typeof (stops) === 'object') {
                if (type === 'linear') {
                    color = this.renderer._toLinearGradient(color, true, stops);
                }
                else if (type === 'linearHorizontal') {
                    color = this.renderer._toLinearGradient(color, false, stops);
                }
                else if (type === 'radial') {
                    color = this.renderer._toRadialGradient(color, stops);
                }
            }
            return color;
        },

        _isArray: function(o) {
            return Object.prototype.toString.call(o) === '[object Array]';
        },

        _events: ['slide', 'change'],

        _raiseEvent: function (eventId, args) {
            var eventType = this._events[eventId],
                event = $.Event(eventType);
            event.args = args;
            return this.host.trigger(event);
        },

        _movePointers: function () {
            var that = this;
            var angle;
            for (var i = 0; i< that._pointers.length; i++){
                if ( that._pointers.length !== 1) {
                    angle = that.dragStartAngle + that._calculateAngleFromValue(that.value[i], that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                    that._pointers[i] = that._movePointer(that._pointers[i], that.pointer[i], angle, that.value[i]);
                } else {
                    angle = that.dragStartAngle + that._calculateAngleFromValue(that.value, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
                    that._pointers[0] = that._movePointer(that._pointers[0], that.pointer, angle, that.value);
                }
            }
        },

        _movePointer: function (pointerElement, pointerObject, angle, value) {
            var that = this;
            // moving is faster than redrawing, so move when possible
            var renderer = that.renderer;
            var width = that.widgetSize;
            var size;
            var type = pointerObject.type;
            if (!type) {
                type = "circle";
            }
            var offset = that._getScale(pointerObject.offset, 'w', width / 2); // add error handling if value is invalid
            if (type === 'circle') {
                var position = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset, angle, that.rotation);
                renderer.attr(pointerElement, { cx: position.x, cy: position.y });
                if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                    $('#' + pointerObject.id).remove();
                    pointerElement = that._drawPointer(value, pointerObject);
                }
            } else if (type === 'line') {
                size = that._getScale(pointerObject.size, 'w', width / 2);
                var lineStartPosition = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset, angle, that.rotation);
                var lineEndPosition = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset + size, angle, that.rotation);
                renderer.attr(pointerElement, { x1: lineStartPosition.x, y1: lineStartPosition.y, x2: lineEndPosition.x, y2: lineEndPosition.y });
                if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                    $('#' + pointerObject.id).remove();
                    pointerElement = that._drawPointer(value, pointerObject);
                }
            } else if (type === 'arrow') {
                size = that._getScale(pointerObject.size, 'w', width / 2);
                var thickness = pointerObject.thickness;
                var tip = that._getPointerPosition({ x: width / 2, y: width / 2 }, size, angle, that.rotation);
                var baseFoundation = that._getPointerPosition({ x: width / 2, y: width / 2 }, offset, angle, that.rotation);
                var base1 = that._getPointerPosition({ x: baseFoundation.x, y: baseFoundation.y }, thickness/2, angle - 90, that.rotation);
                var base2 = that._getPointerPosition({ x: baseFoundation.x, y: baseFoundation.y }, thickness/2, angle + 90, that.rotation);
                var points = 'M ' + tip.x + ',' + tip.y + ' L ' + base1.x + ',' + base1.y + ' L ' + base2.x + ',' + base2.y + ' ' + tip.x + ',' + tip.y;
                renderer.attr(pointerElement, { d: points });
                if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                    $('#' + pointerObject.id).remove();
                    pointerElement = that._drawPointer(value, pointerObject);
                }
            } else if (type === 'arc') {
                $('#' + pointerObject.id).remove();
                pointerElement = that._drawPointer(pointerObject);
            }
            if (that.progressBar) {
                pointerElement.parentNode.appendChild(pointerElement.parentNode.removeChild(pointerElement));
            }
            return pointerElement;
        },

        _getPointerPosition: function (center, radius, angle, rotation) {
            if ($.jqx.browser.msie && $.jqx.browser.version < 9) {
                return {
                    x: parseInt(center.x + radius * Math.sin(Math.PI / 180 * (angle + 90))),
                    y: rotation === 'clockwise' ? parseInt(center.y + radius * Math.sin(Math.PI / 180 * (angle))) : parseInt(center.y - radius * Math.sin(Math.PI / 180 * (angle)))
                };
            }
            return {
                x: center.x + radius * Math.sin(Math.PI / 180 * (angle + 90)),
                y: rotation === 'clockwise' ? center.y + radius * Math.sin(Math.PI / 180 * (angle)) : center.y - radius * Math.sin(Math.PI / 180 * (angle))
            };
        },

        _getID: function () {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10) | 0);
            };
            return ('' + S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
        },

        _decrement: function () {
            this._setValue(this.value - this.step, "mouse");
        },

        _increment: function () {
            this._setValue(this.value + this.step, "mouse");
        },

        _refresh: function () {
            var that = this;
            if (that.disabled) {
                that.host.addClass(that.toThemeProperty('jqx-fill-state-disabled'));
            }

            if (!that.renderer) {
                that._isVML = false;
                that.host.empty();
                that._initRenderer(that.host);
            }
            that.removeHandler($(document), 'mousemove.jqxKnob' + that.host[0].id);
            that.removeHandler($(document), 'blur.jqxKnob' + that.host[0].id);
            that.removeHandler($(document), 'mouseup.jqxKnob' + that.host[0].id);
            that.removeHandler(that.host, 'wheel');
            that.removeHandler(that.host, 'mousedown');
            that.host.empty();
            that._initRenderer(that.host);
            var renderer = that.renderer;
            if (!renderer)
                return;


            that._steps = [];
            for (var i = 0 ; i <= (that.max - that.min) / that.step; i++) {
                that._steps.push(that.min + that.step * i);
            }
            that._initValues();
            that._render();
        },

        _render: function () {
            var that = this;
            that._drawBackground();
            that._drawDial();
            that._drawMarks();
            that._drawLabels();
            that._drawSpinner();
            that._drawProgressBars();
            that._updateMarksColor();
            that._updateSpinnerMarksColor();
            that._drawPointers();
            that._attatchPointerEventHandlers();
        },

        _setValue: function (value, source) {
            var that = this;
            var oldValue = that.value;
            if (isNaN(value)) {
                value = that.min;
            }
            if (value > that.max) {
                value = that.max;
            } else if (value < that.min) {
                value = that.min;
            }
            if (that.snapToStep) {
                var steps = that._steps;
                for (var i = 0; i < steps.length; i++) {
                    if (value < steps[i]) {
                        if (i === 0) {
                            value = steps[i];
                        } else {
                            if (steps[i] - value < value - steps[i - 1]) {
                                value = steps[i];
                            } else {
                                value = steps[i - 1];
                            }
                        }
                        break;
                    }
                }
            }

            if (value == oldValue){
                return;
            }
            if ($.isArray(that.value)) {
                if (that._pointerGrabbedIndex != -1) {
                    if (that._pointerGrabbedIndex == 1) {
                        var firstPointerValue = that.value[0];
                        that.value[that._pointerGrabbedIndex] = value;
                    }
    
                    if (that._pointerGrabbedIndex == 0) {
                        var secondPointerValue = that.value[1];
                        that.value[that._pointerGrabbedIndex] = value;
                    }
    
                    that.value[that._pointerGrabbedIndex] = value;               
                }
            } else {
                that.value = value;
            }
            that._updateProgressBarColor();
            that._updateMarksColor();
            that._updateSpinnerMarksColor();
            var angle = that.dragStartAngle + that._calculateAngleFromValue(value, that.dragStartAngle, that.dragEndAngle, that.min, that.max);
            that._rotateSpinnerMarks(angle);
            that._movePointers();
            that._raiseEvent(1, { value: that.value, type: source });
        },

        _updateMarksColor: function () {
            var that = this;

            if (that.marks && (that.marks.colorProgress || that.marks.colorRemaining)) {
                var renderer = that.renderer;
                var keys = [];
                $.each(that._marksList, function(key){
                    if (that.endAngle - that.startAngle === 360) {
                        if ( key == that.max) {
                            keys.push(key);
                            return;
                        }
                    }
                    keys.push(key);
                });
                var colorProgress = that._getColor(that.marks.colorProgress);
                var colorRemaining = that._getColor(that.marks.colorRemaining);
                var value = that.value.length ? that.value[0] : that.value;
                for (var i = 0; i < that._dialMarks.length; i++) {
                    if (keys[i] > value) {
                        if (that.marks.type === 'circle') {
                            renderer.attr(that._dialMarks[i], { fill: colorRemaining });
                        } else {
                            renderer.attr(that._dialMarks[i], { stroke: colorRemaining });
                        }
                    } else {
                        if (that.marks.type === 'circle') {
                            renderer.attr(that._dialMarks[i], { fill: colorProgress });
                        } else {
                            renderer.attr(that._dialMarks[i], { stroke: colorProgress });
                        }
                    }
                    if (that.progressBar && that.marks.drawAboveProgressBar) {
                        that._dialMarks[i].parentNode.appendChild(that._dialMarks[i].parentNode.removeChild(that._dialMarks[i]));
                    }
                }
            }
        },

        _updateSpinnerMarksColor: function () {
            var that = this;
            if (!that.spinner)
                return;
            if (!that.spinner.marks)
                return;

            if (that.spinner.marks && (that.spinner.marks.colorProgress || that.spinner.marks.colorRemaining)) {
                var renderer = that.renderer;
                var keys = [];
                $.each(that._spinnerMarksList, function (key) {
                    if (that.endAngle - that.startAngle === 360) {
                        if ( key == that.max) {
                            return;
                        }
                    }
                    keys.push(key);
                });
                var colorProgress = that._getColor(that.spinner.marks.colorProgress);
                var colorRemaining = that._getColor(that.spinner.marks.colorRemaining);
                var value = that.value.length ? that.value[0] : that.value;
                for (var i = 0; i < that._spinnerMarks.length; i++) {
                    if (keys[i] > value) {
                        if (that.spinner.marks.type === 'circle') {
                            renderer.attr(that._spinnerMarks[i], { fill: colorRemaining });
                        } else {
                            renderer.attr(that._spinnerMarks[i], { stroke: colorRemaining });
                        }
                    } else {
                        if (that.spinner.marks.type === 'circle') {
                            renderer.attr(that._spinnerMarks[i], { fill: colorProgress });
                        } else {
                            renderer.attr(that._spinnerMarks[i], { stroke: colorProgress });
                        }
                    }
                }
            }
        },

        _updateProgressBarColor: function () {
            var that = this;
            if (that.progressBar ) {
                that._drawProgressBars(); //arcs need to be redrawn
            }
        },

        _validateProperties: function () {
            var that = this;

            var validateStyleObj = function (styleObject, color) {
                if (styleObject && typeof (styleObject) === 'string') {
                    var c = styleObject;
                    styleObject = { fill: c, stroke: c };
                    return styleObject;
                    return;
                }

                if (!styleObject) {
                    styleObject = {};
                    styleObject.fill = color;
                    styleObject.stroke = color;
                }
                if (styleObject && styleObject.fill && !styleObject.stroke) {
                    styleObject.stroke = styleObject.fill;
                }
                if (styleObject && !styleObject.fill && styleObject.stroke) {
                    styleObject.fill = styleObject.stroke;
                }

                if (styleObject && !styleObject.fill) {
                    styleObject.fill = color;
                }

                if (styleObject && !styleObject.stroke) {
                    styleObject.stroke = color;
                }
                return styleObject;
            }
            if (that.dial) {
                that.dial.style = validateStyleObj(that.dial.style, "#dddddd");
            }
            if (that.style) {
                that.style = validateStyleObj(that.style, "#dddddd");
            }
            if (that.progressBar) {
                that.progressBar.style = validateStyleObj(that.progressBar.style, "transparent");
                that.progressBar.background = validateStyleObj(that.progressBar.background, "transparent");
            }
            if (that.spinner) {
                that.spinner.style = validateStyleObj(that.spinner.style, "transparent");
            }
            if (that.pointer) {
                that.pointer.style = validateStyleObj(that.pointer.style, "transparent");
            }

            if (that.startAngle >= that.endAngle) {
                throw new Error('jqxKnob: The end angle must be bigger than the start angle!');
            }
            if (that.startAngle < 0 || that.startAngle > 360) {
                throw new Error('jqxKnob: Start angle must be between 0 and 360');
            }
            if (that.endAngle > that.startAngle + 360) {
                throw new Error('jqxKnob: End angle must be between startAngle and startAngle + 360');
            }
            if (that.dial && that.dial.color && that.dial.color !== 'transparent') {
                if (!that.dial.outerRadius || !that.dial.innerRadius) {
                    throw new Error('jqxKnob: Dial options innerRadius and outerRadius need to be specified');
                }
            }

            if (that._isArray(that.pointer) || that._isArray(that.value)) {
                if (!that._isArray(that.pointer)) {
                    throw new Error('jqxKnob: If the value is an array, the pointer must also be an array.');
                }
                if (!that._isArray(that.value)) {
                    throw new Error('jqxKnob: If the pointer is an array, the value must also be an array.');
                }
                if(that.pointer.length !== that.value.length) {
                    throw new Error('jqxKnob: The pointer and value array sizes must match.');
                }
                if (that.progressBar) {
                    if (!that._isArray(that.progressBar.style) || that.progressBar.style.length !== that.pointer.length) {
                        throw new Error('jqxKnob: progressBar color must be an array with the same number of elements as the pointer and value.');
                    }
                }
            }
            return true;
        }

    });
})(jqxBaseFramework);