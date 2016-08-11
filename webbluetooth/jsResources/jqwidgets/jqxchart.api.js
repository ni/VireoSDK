/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.extend($.jqx._jqxChart.prototype,
    {
        _moduleApi: true,

        getItemsCount: function(groupIndex, serieIndex)
        {
            var g = this.seriesGroups[groupIndex];

            if (!this._isSerieVisible(groupIndex, serieIndex))
                return 0;

            var renderData = this._renderData;
            if (!g || !renderData || renderData.length <= groupIndex)
                return 0;
                
            var serie = g.series[serieIndex];
            if (!serie)
                return 0;

            return renderData[groupIndex].offsets[serieIndex].length;

        },

        getXAxisRect: function(groupIndex)
        {
            var renderData = this._renderData;
            if (!renderData || renderData.length <= groupIndex)
                return undefined;

            if (!renderData[groupIndex].xAxis)
                return undefined;

            return renderData[groupIndex].xAxis.rect;
        },

        getXAxisLabels: function(groupIndex)
        {
            var output = [];

            var renderData = this._renderData;
            if (!renderData || renderData.length <= groupIndex)
                return output;

            renderData = renderData[groupIndex].xAxis;
            if (!renderData)
                return output;

            var group = this.seriesGroups[groupIndex];

            if (group.polar || group.spider)
            {
                for (var i = 0; i < renderData.polarLabels.length; i++)
                {
                    var label = renderData.polarLabels[i];
                    output.push({offset: {x: label.x, y: label.y}, value: label.value});
                }

                return output;
            }

            var xAxis = this._getXAxis(groupIndex);
            var rect = this.getXAxisRect(groupIndex);            
            var swapPosition = xAxis.position == 'top' || xAxis.position == 'right';
            var swapXY = group.orientation == 'horizontal';

            for (var i = 0; i < renderData.data.length; i++)
            {
                if (swapXY)
                    output.push({offset: {x: rect.x + (swapPosition ? 0 : rect.width), y: rect.y + renderData.data.data[i]}, value: renderData.data.xvalues[i]});
                else
                    output.push({offset: {x: rect.x + renderData.data.data[i], y: rect.y + (swapPosition ? rect.height : 0)}, value: renderData.data.xvalues[i]});
            }

            return output;
        },

        getValueAxisRect: function(groupIndex)
        {
            var renderData = this._renderData;
            if (!renderData || renderData.length <= groupIndex)
                return undefined;

            if (!renderData[groupIndex].valueAxis)
                return undefined;

            return renderData[groupIndex].valueAxis.rect;
        },

        getValueAxisLabels: function(groupIndex)
        {
            var output = [];

            var renderData = this._renderData;
            if (!renderData || renderData.length <= groupIndex)
                return output;

            renderData = renderData[groupIndex].valueAxis;
            if (!renderData)
                return output;

            var valueAxis = this._getValueAxis(groupIndex);
            var swapPosition = valueAxis.position == 'top' || valueAxis.position == 'right';

            var group = this.seriesGroups[groupIndex];
            var swapXY = group.orientation == 'horizontal';

            if (group.polar || group.spider)
            {
                for (var i = 0; i < renderData.polarLabels.length; i++)
                {
                    var label = renderData.polarLabels[i];
                    output.push({offset: {x: label.x, y: label.y}, value: label.value});
                }

                return output;
            }

            for (var i = 0; i < renderData.items.length; i++)
            {
                if (swapXY)
                {
                    output.push(
                        {
                            offset: 
                            {
                                x: renderData.itemOffsets[renderData.items[i]].x + renderData.itemWidth/2,
                                y: renderData.rect.y + (swapPosition ? renderData.rect.height : 0)
                            }, 
                            value: renderData.items[i]
                        }
                    );
                }
                else
                {
                    output.push(
                        {
                            offset: 
                            {
                                x: renderData.rect.x + renderData.rect.width, 
                                y: renderData.itemOffsets[renderData.items[i]].y + renderData.itemWidth/2
                            }, 
                            value: renderData.items[i]
                        }
                    );

                }
            }

            return output;
        },


        getPlotAreaRect: function()
        {
            return this._plotRect;
        },

        getRect: function()
        {
            return this._rect;
        },

        showToolTip: function(groupIndex, serieIndex, itemIndex, showDelay, hideDelay)
        {
            var coord = this.getItemCoord(groupIndex, serieIndex, itemIndex);
            if (isNaN(coord.x) || isNaN(coord.y))
                return;

            this._startTooltipTimer(groupIndex, serieIndex, itemIndex, coord.x, coord.y, showDelay, hideDelay);
        },

        hideToolTip: function(hideDelay)
        {
            if (isNaN(hideDelay))
                hideDelay = 0;

            var self = this;
            self._cancelTooltipTimer();

            setTimeout(function() {
                    self._hideToolTip(0);
                }, 
                hideDelay
            );
        },

    });
})(jqxBaseFramework);


