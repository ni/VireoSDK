/*
jQWidgets v4.1.0 (2016-Mar)
Copyright (c) 2011-2016 jQWidgets.
License: http://jqwidgets.com/license/
*/

(function ($) {
    $.extend($.jqx._jqxChart.prototype,
    {
        _moduleWaterfall: true,

        _isSummary: function (groupIndex, itemIndex) {
            var group = this.seriesGroups[groupIndex];
            for (var sidx = 0; sidx < group.series.length; sidx++) {
                if (undefined === group.series[sidx].summary)
                    continue;

                summaryValue = this._getDataValue(itemIndex, group.series[sidx].summary, groupIndex)
                if (undefined !== summaryValue)
                    return true;
            }

            return false;
        },

        _applyWaterfall: function (out, len, groupIndex, yzero, gbase, logBase, scale, inverse, isStacked) {
            var group = this.seriesGroups[groupIndex];

            if (out.length == 0)
                return out;

            var lastTo = yzero;

            // waterfall sums by serie / stack
            var wfSum = {};

            var seriesPrevVisibleIndex = [];

            var isDirectionDown = undefined;

            var seriesVisibility = [];
            for (var j = 0; j < group.series.length; j++)
                seriesVisibility.push(this._isSerieVisible(groupIndex, j));

            // The direction of the first column is relative to the baseline. For all columns after
            // that the direction is based on whether the value is positive or negative
            // For stacked series the key is -1. For non-stacked the serie index
            var firstItemRendered = {};

            for (var i = 0; i < len; i++) {
                var summaryLastTo = yzero;
                var summarySum = 0;
                var isSummaryItem = this._isSummary(groupIndex, i);

                for (var j = 0; j < out.length; j++) {
                    if (!seriesVisibility[j])
                        continue;

                    var refBase = 0;

                    // handle summary items
                    if (isSummaryItem) {
                        refBase = summaryLastTo == yzero ? gbase : 0;

                        out[j][i].value = wfSum[j];
                        out[j][i].summary = true;

                        isDirectionDown = out[j][i].value < refBase;
                        if (inverse)
                            isDirectionDown = !isDirectionDown;

                        var size = 0;
                        if (!isNaN(logBase))
                            size = this._getDataPointOffsetDiff(out[j][i].value + summarySum, summarySum == 0 ? gbase : summarySum, refBase || gbase, logBase, scale, yzero, inverse);
                        else
                            size = this._getDataPointOffsetDiff(out[j][i].value, refBase, refBase, NaN, scale, yzero, inverse);

                        out[j][i].to = summaryLastTo + (isDirectionDown ? size : -size);
                        out[j][i].from = summaryLastTo;

                        if (isStacked) {
                            summarySum += out[j][i].value;
                            summaryLastTo = out[j][i].to;
                        }

                        continue;
                    }
                    // end of summary items

                    var k = isStacked ? -1 : j;

                    if (isNaN(out[j][i].value))
                        continue;

                    if (undefined === firstItemRendered[k]) {
                        refBase = gbase;
                        firstItemRendered[k] = true;
                    }

                    isDirectionDown = out[j][i].value < refBase;
                    if (inverse)
                        isDirectionDown = !isDirectionDown;

                    var y = NaN, size = NaN;

                    if (!isStacked) {
                        y = i == 0 ? yzero : out[j][seriesPrevVisibleIndex[j]].to;
                    }
                    else {
                        y = lastTo;
                    }

                    var size = 0;
                    if (!isNaN(logBase))
                        size = this._getDataPointOffsetDiff(out[j][i].value + (isNaN(wfSum[k]) ? 0 : wfSum[k]), isNaN(wfSum[k]) ? gbase : wfSum[k], refBase || gbase, logBase, scale, y, inverse);
                    else
                        size = this._getDataPointOffsetDiff(out[j][i].value, refBase, refBase, NaN, scale, yzero, inverse);

                    out[j][i].to = lastTo = y + (isDirectionDown ? size : -size);
                    out[j][i].from = y;

                    if (isNaN(wfSum[k]))
                        wfSum[k] = out[j][i].value;
                    else
                        wfSum[k] += out[j][i].value;

                    if (k == -1) {
                        if (isNaN(wfSum[j]))
                            wfSum[j] = out[j][i].value;
                        else
                            wfSum[j] += out[j][i].value;
                    }

                    if (!isStacked)
                        seriesPrevVisibleIndex[j] = i;
                }
            }

            return out;
        }

    });
})(jqxBaseFramework);


