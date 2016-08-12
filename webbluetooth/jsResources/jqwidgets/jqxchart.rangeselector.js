/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.extend($.jqx._jqxChart.prototype,
    {
        _moduleRangeSelector: true,

        /**
        * Renders the xAxis range selector
        * @private 
        * @param {number} group index
        * @param {object} bounding rectangle of the xAxis in relative coords
        */
        _renderXAxisRangeSelector: function (groupIndex, rect) {
            var self = this;
            self._isTouchDevice = $.jqx.mobile.isTouchDevice();

            var g = self.seriesGroups[groupIndex];
            var axis = self._getXAxis(groupIndex);
            var rangeSelector = axis ? axis.rangeSelector : undefined;

            if (!self._isSelectorRefresh) {
                var elHost = (rangeSelector && rangeSelector.renderTo) ? rangeSelector.renderTo : self.host;
                elHost.find(".rangeSelector").remove();
            }

            if (!axis || axis.visible == false || g.type == 'spider')
                return false;

            if (!self._isGroupVisible(groupIndex))
                return false;

            if (!rangeSelector)
                return false;

            var swapXY = g.orientation == 'horizontal';
            if (rangeSelector.renderTo)
                swapXY = false;

            if (self.rtl)
                axis.flip = true;

            var axisSize = swapXY ? this.host.height() : this.host.width();
            axisSize -= 4;

            var axisStats = this._getXAxisStats(groupIndex, axis, axisSize);

            var axisPosition = axis.position;
            if (rangeSelector.renderTo && rangeSelector.position)
                axisPosition = rangeSelector.position;

            if (!this._isSelectorRefresh) {
                var renderTo = rangeSelector.renderTo;

                var div = "<div class='rangeSelector jqx-disableselect' style='position: absolute; background-color: transparent;' onselectstart='return false;'></div>";

                var element = $(div).appendTo(renderTo ? renderTo : this.renderer.getContainer());

                if (!renderTo) {
                    var coord = this.host.coord();
                    coord.top = 0;
                    coord.left = 0;
                    selectorSize = this._selectorGetSize(axis);
                    if (!swapXY) {
                        element.css('left', coord.left + 1);
                        element.css('top', coord.top + rect.y + (axisPosition != 'top' ? rect.height : -selectorSize));
                        element.css('height', selectorSize);
                        element.css('width', axisSize);

                        // rect.width = selectorSize;
                    }
                    else {
                        element.css('left', coord.left + 1 + rect.x + (axisPosition != 'right' ? -selectorSize : rect.width));
                        element.css('top', coord.top);
                        element.css('height', axisSize);
                        element.css('width', selectorSize);

                        rect.height = selectorSize;
                    }
                }
                else {
                    element.css({ width: renderTo.width(), height: renderTo.height() });
                    rect.width = renderTo.width();
                    rect.height = renderTo.height();
                }

                this._refreshSelector(groupIndex, axis, axisStats, element, rect, swapXY);
            }

            this._isSelectorRefresh = false;

            return true;
        },


        _refreshSelector: function (groupIndex, axis, axisStats, renderTo, rect, swapXY) {
            var xAxisSettings = {};
            var selector = axis.rangeSelector;
            var group = this.seriesGroups[groupIndex];

            for (var i in selector)
                xAxisSettings[i] = selector[i];

            delete xAxisSettings.padding;

            var min = xAxisSettings.minValue;
            var max = xAxisSettings.maxValue;

            if (undefined == min)
                min = Math.min(axisStats.min.valueOf(), axisStats.dsRange.min.valueOf());
            if (undefined == max)
                max = Math.max(axisStats.max.valueOf(), axisStats.dsRange.max.valueOf());

            if (this._isDate(axisStats.min))
                min = new Date(min);
            if (this._isDate(axisStats.max))
                max = new Date(max);

            var axisPosition = axis.position;
            if (selector.renderTo && selector.position)
                axisPosition = selector.position;

            xAxisSettings.dataField = axis.dataField;
            delete xAxisSettings.rangeSelector;
            xAxisSettings.type = axis.type;
            xAxisSettings.baseUnit = selector.baseUnit || axis.baseUnit;
            xAxisSettings.minValue = min;
            xAxisSettings.maxValue = max;
            xAxisSettings.flip = axis.flip;
            xAxisSettings.position = axisPosition;

            var defaultPadding = 5;

            var leftPadding = 2,
                rightPadding = 2,
                topPadding = 2,
                bottomPadding = 2;

            if (!selector.renderTo) {
                leftPadding = swapXY ? 0 : rect.x;
                rightPadding = swapXY ? 0 : this._rect.width - rect.x - rect.width;
                topPadding = swapXY ? rect.y : defaultPadding;
                bottomPadding = swapXY ? this._paddedRect.height - this._plotRect.height : defaultPadding;
            }

            var padding = selector.padding;
            if (padding == undefined && !selector.renderTo)
                padding = { left: leftPadding, top: topPadding, right: rightPadding, bottom: bottomPadding };
            else {
                padding = {
                    left: ((padding && padding.left) ? padding.left : leftPadding),
                    top: ((padding && padding.top) ? padding.top : topPadding),
                    right: ((padding && padding.right) ? padding.right : rightPadding),
                    bottom: ((padding && padding.bottom) ? padding.bottom : bottomPadding)
                };
            }

            var dataField = axis.rangeSelector.dataField;
            for (var i = 0; undefined == dataField && i < this.seriesGroups.length; i++) {
                for (var j = 0; undefined == dataField && j < this.seriesGroups[i].series.length; j++)
                    dataField = this.seriesGroups[i].series[j].dataField;
            }

            var rangeSelectorSettings =
            {
                padding: padding,
                _isRangeSelectorInstance: true,
                title: selector.title || '',
                description: selector.description || '',
                titlePadding: selector.titlePadding,
                colorScheme: selector.colorScheme || this.colorScheme,
                backgroundColor: selector.backgroundColor || this.backgroundColor || 'transparent',
                backgroundImage: selector.backgroundImage || '',
                showBorderLine: selector.showBorderLine || (selector.renderTo ? true : false),
                borderLineWidth: selector.borderLineWidth || this.borderLineWidth,
                borderLineColor: selector.borderLineColor || this.borderLineColor,
                rtl: selector.rtl || this.rtl,
                greyScale: selector.greyScale || this.greyScale,
                renderEngine: this.renderEngine,
                showLegend: false,
                enableAnimations: false,
                enableEvents: false,
                showToolTips: false,
                source: this.source,
                xAxis: xAxisSettings,
                seriesGroups:
                [
                    {
                        orientation: swapXY ? 'horizontal' : 'vertical',
                        valueAxis:
                        {
                            visible: false
                            //unitInterval: 10
                        },
                        type: axis.rangeSelector.serieType || 'area',
                        skipOverlappingPoints: $.jqx.getByPriority([axis.rangeSelector.skipOverlappingPoints, true]),
                        columnSeriesOverlap: $.jqx.getByPriority([axis.rangeSelector.columnSeriesOverlap, false]),
                        columnsGapPercent: $.jqx.getByPriority([axis.rangeSelector.columnsGapPercent, 25]),
                        seriesGapPercent: $.jqx.getByPriority([axis.rangeSelector.seriesGapPercent, 25]),
                        series:
                            [
                                { dataField: dataField, opacity: 0.8, lineWidth: 1 }
                            ]
                    }
                ]
            }

            if (!rangeSelectorSettings.showBorderLine) {
                rangeSelectorSettings.borderLineWidth = 1;
                rangeSelectorSettings.borderLineColor = $.jqx.getByPriority([this.backgroundColor, this.background, '#FFFFFF']);
                rangeSelectorSettings.showBorderLine = true;
            }



            var self = this;

            self._supressBindingRefresh = true;

            renderTo.empty();
            renderTo.jqxChart(rangeSelectorSettings);

            self._rangeSelectorInstances[groupIndex] = renderTo;

            self._supressBindingRefresh = false;

            // disable for main chart when movign over the selector
            renderTo.on(self._getEvent('mousemove'), function () { self._unselect(); self._hideToolTip(); });

            var instance = renderTo.jqxChart('getInstance');
            if (!instance._plotRect)
                return;

            var sliderRect = instance._paddedRect;
            sliderRect.height = instance._plotRect.height;
            if (!swapXY && axisPosition == 'top')
                sliderRect.y += instance._renderData[0].xAxis.rect.height;
            else if (swapXY) {
                var sliderXAxisWidth = instance._renderData[0].xAxis.rect.width;
                sliderRect.width -= sliderXAxisWidth;
                if (axisPosition != 'right')
                    sliderRect.x += sliderXAxisWidth;
            }

            self._createSliderElements(groupIndex, renderTo, sliderRect, selector);

            self.removeHandler($(document), self._getEvent('mousemove') + '.' + this.element.id, self._onSliderMouseMove)
            self.removeHandler($(document), self._getEvent('mousedown'), self._onSliderMouseDown)
            self.removeHandler($(document), self._getEvent('mouseup') + '.' + this.element.id, self._onSliderMouseUp)

            self.addHandler($(document), self._getEvent('mousemove') + '.' + this.element.id, self._onSliderMouseMove, { self: this, groupIndex: groupIndex, renderTo: renderTo, swapXY: swapXY });
            self.addHandler($(renderTo), self._getEvent('mousedown'), this._onSliderMouseDown, { self: this, groupIndex: groupIndex, renderTo: renderTo, swapXY: swapXY });
            self.addHandler($(document), self._getEvent('mouseup') + '.' + this.element.id, self._onSliderMouseUp, { element: this.element.id, self: this, groupIndex: groupIndex, renderTo: renderTo, swapXY: swapXY });
        },

        _createSliderElements: function (groupIndex, renderTo, rect, selectorSettings) {
            renderTo.find('.slider').remove();

            var colorSelectedRange = selectorSettings.selectedRangeColor || 'blue';
            var selectedRangeOpacity = $.jqx.getByPriority([selectorSettings.selectedRangeOpacity, 0.1]);
            var unselectedRangeOpacity = $.jqx.getByPriority([selectorSettings.unselectedRangeOpacity, 0.5]);
            var colorUnselectedRange = selectorSettings.unselectedRangeColor || 'white';
            var colorRangeLineColor = selectorSettings.rangeLineColor || 'grey';

            var div = $("<div class='slider' style='position: absolute;'></div>");
            div.css({ background: colorSelectedRange, opacity: selectedRangeOpacity, left: rect.x, top: rect.y, width: rect.width, height: rect.height });
            div.appendTo(renderTo);

            while (this._sliders.length < groupIndex + 1)
                this._sliders.push({});


            var divAreaDef = "<div class='slider' style='position: absolute;  background: " + colorUnselectedRange + "; opacity: " + unselectedRangeOpacity + ";'></div>";
            var divBorderDef = "<div class='slider' style='position: absolute; background:" + colorRangeLineColor + "; opacity: " + unselectedRangeOpacity + ";'></div>";
            var divBarDef = "<div class='slider jqx-rc-all' style='position: absolute; background: white; border-style: solid; border-width: 1px; border-color: " + colorRangeLineColor + ";'></div>";

            this._sliders[groupIndex] = {
                element: div,
                host: renderTo,
                _sliderInitialAbsoluteRect: { x: div.coord().left, y: div.coord().top, width: rect.width, height: rect.height },
                _hostInitialAbsolutePos: { x: renderTo.coord().left, y: renderTo.coord().top },
                getRect: function () {
                    return {
                        x: this.host.coord().left - this._hostInitialAbsolutePos.x + this._sliderInitialAbsoluteRect.x,
                        y: this.host.coord().top - this._hostInitialAbsolutePos.y + this._sliderInitialAbsoluteRect.y,
                        width: this._sliderInitialAbsoluteRect.width,
                        height: this._sliderInitialAbsoluteRect.height
                    };
                },
                rect: rect,
                left: $(divAreaDef),
                right: $(divAreaDef),
                leftTop: $(divBorderDef),
                rightTop: $(divBorderDef),
                leftBorder: $(divBorderDef),
                leftBar: $(divBarDef),
                rightBorder: $(divBorderDef),
                rightBar: $(divBarDef)
            };

            this._sliders[groupIndex].left.appendTo(renderTo);
            this._sliders[groupIndex].right.appendTo(renderTo);
            this._sliders[groupIndex].leftTop.appendTo(renderTo);
            this._sliders[groupIndex].rightTop.appendTo(renderTo);
            this._sliders[groupIndex].leftBorder.appendTo(renderTo);
            this._sliders[groupIndex].rightBorder.appendTo(renderTo);
            this._sliders[groupIndex].leftBar.appendTo(renderTo);
            this._sliders[groupIndex].rightBar.appendTo(renderTo);

            var renderData = this._renderData[groupIndex].xAxis;
            var stats = renderData.data.axisStats;

            var minValue = stats.min.valueOf();
            var maxValue = stats.max.valueOf();

            var startOffset = this._valueToOffset(groupIndex, minValue);
            var endOffset = this._valueToOffset(groupIndex, maxValue);

            if (startOffset > endOffset) {
                var tmp = endOffset;
                endOffset = startOffset;
                startOffset = tmp;
            }

            if (this.seriesGroups[groupIndex].orientation != 'horizontal')
                div.css({ left: Math.round(rect.x + startOffset), top: rect.y, width: Math.round(endOffset - startOffset), height: rect.height });
            else
                div.css({ top: Math.round(rect.y + startOffset), left: rect.x, height: Math.round(endOffset - startOffset), width: rect.width });

            this._setSliderPositions(groupIndex, startOffset, endOffset);
        },

        _setSliderPositions: function (groupIndex, startOffset, endOffset) {
            var g = this.seriesGroups[groupIndex];
            var axis = this._getXAxis(groupIndex);
            var selector = axis.rangeSelector;

            var swapXY = g.orientation == 'horizontal';
            if (axis.rangeSelector.renderTo)
                swapXY = false;

            var axisPosition = axis.position;
            if (selector.renderTo && selector.position)
                axisPosition = selector.position;

            var invertedAxisPos = (swapXY && axisPosition == 'right') || (!swapXY && axisPosition == 'top');

            var slider = this._sliders[groupIndex];

            var posProp = swapXY ? 'top' : 'left';
            var oPosProp = swapXY ? 'left' : 'top';
            var sizeProp = swapXY ? 'height' : 'width';
            var oSizeProp = swapXY ? 'width' : 'height';
            var rectPosProp = swapXY ? 'y' : 'x';
            var rectOPosProp = swapXY ? 'x' : 'y';

            var rect = slider.rect;

            slider.startOffset = startOffset;
            slider.endOffset = endOffset;

            slider.left.css(posProp, rect[rectPosProp]);
            slider.left.css(oPosProp, rect[rectOPosProp]);
            slider.left.css(sizeProp, startOffset);
            slider.left.css(oSizeProp, rect[oSizeProp]);

            slider.right.css(posProp, rect[rectPosProp] + endOffset);
            slider.right.css(oPosProp, rect[rectOPosProp]);
            slider.right.css(sizeProp, rect[sizeProp] - endOffset + 1);
            slider.right.css(oSizeProp, rect[oSizeProp]);

            slider.leftTop.css(posProp, rect[rectPosProp]);
            slider.leftTop.css(oPosProp, rect[rectOPosProp] + (((swapXY && axisPosition == 'right') || (!swapXY && axisPosition != 'top')) ? 0 : rect[oSizeProp]));
            slider.leftTop.css(sizeProp, startOffset);
            slider.leftTop.css(oSizeProp, 1);

            slider.rightTop.css(posProp, rect[rectPosProp] + endOffset);
            slider.rightTop.css(oPosProp, rect[rectOPosProp] + (((swapXY && axisPosition == 'right') || (!swapXY && axisPosition != 'top')) ? 0 : rect[oSizeProp]));
            slider.rightTop.css(sizeProp, rect[sizeProp] - endOffset + 1);
            slider.rightTop.css(oSizeProp, 1);

            slider.leftBorder.css(posProp, rect[rectPosProp] + startOffset);
            slider.leftBorder.css(oPosProp, rect[rectOPosProp]);
            slider.leftBorder.css(sizeProp, 1);
            slider.leftBorder.css(oSizeProp, rect[oSizeProp]);

            var handleBarSize = rect[oSizeProp] / 4;
            if (handleBarSize > 20)
                handleBarSize = 20;
            if (handleBarSize < 3)
                handleBarSize = 3;

            slider.leftBar.css(posProp, rect[rectPosProp] + startOffset - 3);
            slider.leftBar.css(oPosProp, rect[rectOPosProp] + rect[oSizeProp] / 2 - handleBarSize / 2);
            slider.leftBar.css(sizeProp, 5);
            slider.leftBar.css(oSizeProp, handleBarSize);

            slider.rightBorder.css(posProp, rect[rectPosProp] + endOffset);
            slider.rightBorder.css(oPosProp, rect[rectOPosProp]);
            slider.rightBorder.css(sizeProp, 1);
            slider.rightBorder.css(oSizeProp, rect[oSizeProp]);

            slider.rightBar.css(posProp, rect[rectPosProp] + endOffset - 3);
            slider.rightBar.css(oPosProp, rect[rectOPosProp] + rect[oSizeProp] / 2 - handleBarSize / 2);
            slider.rightBar.css(sizeProp, 5);
            slider.rightBar.css(oSizeProp, handleBarSize);

        },

        _resizeState: {},

        _onSliderMouseDown: function (event) {
            event.stopImmediatePropagation();
            event.stopPropagation();

            var self = event.data.self;
            var slider = self._sliders[event.data.groupIndex];
            if (!slider)
                return;

            if (self._resizeState.state == undefined)
                self._testAndSetReadyResize(event);

            if (self._resizeState.state != 'ready')
                return;

            $.jqx._rangeSelectorTarget = self;
            self._resizeState.state = 'resizing';
        },

        _valueToOffset: function (groupIndex, value) {
            var group = this.seriesGroups[groupIndex];
            var slider = this._sliders[groupIndex];

            var selectorChart = slider.host.jqxChart('getInstance');
            var renderData = selectorChart._renderData[0].xAxis;
            var stats = renderData.data.axisStats;

            var axisMin = stats.min.valueOf();
            var axisMax = stats.max.valueOf();

            var denom = axisMax - axisMin;
            if (denom == 0)
                denom = 1;

            var axis = this._getXAxis(groupIndex);
            var sizeProp = group.orientation == 'horizontal' ? 'height' : 'width';

            var percent = (value.valueOf() - axisMin) / denom;

            return slider.getRect()[sizeProp] * (axis.flip ? (1 - percent) : percent);
        },

        _offsetToValue: function (groupIndex, offset) {
            var slider = this._sliders[groupIndex];

            var group = this.seriesGroups[groupIndex];
            var axis = this._getXAxis(groupIndex);

            var sizeProp = group.orientation == 'horizontal' ? 'height' : 'width';

            var denom = slider.getRect()[sizeProp];
            if (denom == 0)
                denom = 1;
            var percent = offset / denom;

            var selectorChart = slider.host.jqxChart('getInstance');
            var renderData = selectorChart._renderData[0].xAxis;
            var stats = renderData.data.axisStats;

            var axisMin = stats.min.valueOf();
            var axisMax = stats.max.valueOf();

            var value = offset / denom * (axisMax - axisMin) + axisMin;

            if (axis.flip == true) {
                value = axisMax - offset / denom * (axisMax - axisMin);
            }

            if (this._isDate(stats.min) || this._isDate(stats.max)) {
                value = new Date(value);
            }
            else {
                if (axis.dataField == undefined || stats.useIndeces)
                    value = Math.round(value);

                if (value < stats.min)
                    value = stats.min;
                if (value > stats.max)
                    value = stats.max;
            }

            return value;
        },

        _onSliderMouseUp: function (event) {
            var self = $.jqx._rangeSelectorTarget;
            if (!self)
                return;

            var groupIndex = event.data.groupIndex;
            var swapXY = event.data.swapXY;

            var slider = self._sliders[groupIndex];
            if (!slider)
                return;

            if (self._resizeState.state != 'resizing')
                return;

            event.stopImmediatePropagation();
            event.stopPropagation();

            self._resizeState = {};

            // update
            self.host.css('cursor', 'default');

            var leftProp = !swapXY ? 'left' : 'top';
            var widthProp = !swapXY ? 'width' : 'height';
            var posProp = !swapXY ? 'x' : 'y';

            var from = slider.element.coord()[leftProp];
            var to = from + (!swapXY ? slider.element.width() : slider.element.height());

            var fullRect = slider.getRect();

            var minValue = self._offsetToValue(groupIndex, from - fullRect[posProp]);
            var maxValue = self._offsetToValue(groupIndex, to - fullRect[posProp]);

            var selectorChart = slider.host.jqxChart('getInstance');
            var renderData = selectorChart._renderData[0].xAxis;
            var stats = renderData.data.axisStats;

            if (!stats.isTimeUnit && (maxValue.valueOf() - minValue.valueOf()) > 86400000) {
                minValue.setHours(0, 0, 0, 0);
                maxValue.setDate(maxValue.getDate() + 1);
                maxValue.setHours(0, 0, 0, 0);
            }

            var axis = self._getXAxis(groupIndex);
            if (axis.flip) {
                var tmp = minValue;
                minValue = maxValue;
                maxValue = tmp;
            }

            // apply to all groups that share this range selector
            for (var i = 0; i < self.seriesGroups.length; i++) {
                var groupXAxis = self._getXAxis(i);
                if (groupXAxis == axis)
                    self._selectorRange[i] = { min: minValue, max: maxValue };
            }

            self._isSelectorRefresh = true;
            var animSave = self.enableAnimations;

            self._raiseEvent('rangeSelectionChanging', { instance: self, minValue: minValue, maxValue: maxValue });

            self.enableAnimations = false;
            self.update();
            self.enableAnimations = animSave;

            self._raiseEvent('rangeSelectionChanged', { instance: self, minValue: minValue, maxValue: maxValue });
        },

        _onSliderMouseMove: function (event) {
            var self = event.data.self;
            var renderTo = event.data.renderTo;
            var groupIndex = event.data.groupIndex;
            var slider = self._sliders[groupIndex];
            var swapXY = event.data.swapXY;

            if (!slider)
                return;

            var rect = slider.getRect();
            var element = slider.element;

            var position = $.jqx.position(event);
            var coord = element.coord();

            var topProp = swapXY ? 'left' : 'top';
            var leftProp = !swapXY ? 'left' : 'top';
            var heightProp = swapXY ? 'width' : 'height';
            var widthProp = !swapXY ? 'width' : 'height';

            var posProp = !swapXY ? 'x' : 'y';

            if (self._resizeState.state == 'resizing') {
                event.stopImmediatePropagation();
                event.stopPropagation();

                if (self._resizeState.side == 'left') {
                    var diff = Math.round(position[leftProp] - coord[leftProp]);
                    var pos = rect[posProp];
                    if (coord[leftProp] + diff >= pos && coord[leftProp] + diff <= pos + rect[widthProp]) {
                        var left = parseInt(element.css(leftProp));
                        var newSize = Math.max(2, (swapXY ? element.height() : element.width()) - diff);
                        element.css(widthProp, newSize);
                        element.css(leftProp, left + diff);
                    }
                }
                else if (self._resizeState.side == 'right') {
                    var elementSize = swapXY ? element.height() : element.width();
                    var diff = Math.round(position[leftProp] - coord[leftProp] - elementSize);
                    var pos = rect[posProp];
                    if (coord[leftProp] + elementSize + diff >= pos && coord[leftProp] + diff + elementSize <= pos + rect[widthProp]) {
                        var newSize = Math.max(2, elementSize + diff);
                        element.css(widthProp, newSize);
                    }
                }
                else if (self._resizeState.side == 'move') {
                    var elementSize = swapXY ? element.height() : element.width();
                    var left = parseInt(element.css(leftProp));
                    var diff = Math.round(position[leftProp] - self._resizeState.startPos);

                    if (coord[leftProp] + diff >= rect[posProp] &&
                        coord[leftProp] + diff + elementSize <= rect[posProp] + rect[widthProp]
                    ) {
                        self._resizeState.startPos = position[leftProp];
                        element.css(leftProp, left + diff);
                    }
                }

                var startOffset = parseInt(element.css(leftProp)) - slider.rect[posProp];
                var endOffset = startOffset + (swapXY ? element.height() : element.width());
                self._setSliderPositions(groupIndex, startOffset, endOffset);
            }
            else {
                self._testAndSetReadyResize(event);
            }
        },

        _testAndSetReadyResize: function (event) {
            var self = event.data.self;
            var renderTo = event.data.renderTo;
            var groupIndex = event.data.groupIndex;
            var slider = self._sliders[groupIndex];
            var swapXY = event.data.swapXY;

            var rect = slider.getRect();
            var element = slider.element;

            var position = $.jqx.position(event);
            var coord = element.coord();

            var topProp = swapXY ? 'left' : 'top';
            var leftProp = !swapXY ? 'left' : 'top';
            var heightProp = swapXY ? 'width' : 'height';
            var widthProp = !swapXY ? 'width' : 'height';

            var posProp = !swapXY ? 'x' : 'y';

            var diff = self._isTouchDevice ? 30 : 5;

            if (position[topProp] >= coord[topProp] && position[topProp] <= coord[topProp] + rect[heightProp]) {
                if (Math.abs(position[leftProp] - coord[leftProp]) <= diff) {
                    renderTo.css('cursor', swapXY ? 'row-resize' : 'col-resize');
                    self._resizeState = { state: 'ready', side: 'left' };
                }
                else if (Math.abs(position[leftProp] - coord[leftProp] - (!swapXY ? element.width() : element.height())) <= diff) {
                    renderTo.css('cursor', swapXY ? 'row-resize' : 'col-resize');
                    self._resizeState = { state: 'ready', side: 'right' };
                }
                else if (position[leftProp] + diff > coord[leftProp] && position[leftProp] - diff < coord[leftProp] + (!swapXY ? element.width() : element.height())) {
                    renderTo.css('cursor', 'pointer');
                    self._resizeState = { state: 'ready', side: 'move', startPos: position[leftProp] };
                }
                else {
                    renderTo.css('cursor', 'default');
                    self._resizeState = {};
                }
            }
            else {
                renderTo.css('cursor', 'default');
                self._resizeState = {};
            }
        },

        _selectorGetSize: function (axis) {
            if (axis.rangeSelector.renderTo)
                return 0;
            return axis.rangeSelector.size || this._paddedRect.height / 3;
        }

    });

})(jqxBaseFramework);


