/* * The MIT License
Copyright (c) 2010, 2011, 2012, 2013 by Juergen Marsch
Copyright (c) 2015 by Andrew Dove & Ciprian Ceteras
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the 'Software'), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

(function ($) {
    //'use strict';
    var pluginName = 'intensitymap',
      pluginVersion = '0.1';
    var defaultOptions = {
        series: {
            intensitymap: {
                data: [],
                show: false,
                lowColor: '#000000',
                highColor: '#ffffff',
                min: 0,
                max: 1
            }
        }
    };

    var defaultGradient = [
        { value: 0, color: 'rgb(0,0,0)' },
        { value: 0.50, color: 'rgb(0,0,255)' },
        { value: 1.0, color: 'rgb(255,255,255)' }
    ];

    function extendEmpty(org, ext) {
        for (var i in ext) {
            if (!org[i]) {
                org[i] = ext[i];
            } else {
                if (typeof ext[i] === 'object') {
                    extendEmpty(org[i], ext[i]);
                }
            }
        }
    };

    function createArray(length) {
        var arr = new Array(length || 0),
            i = length;

        if (arguments.length > 1) {
            var args = Array.prototype.slice.call(arguments, 1);
            while (i--) arr[length - 1 - i] = createArray.apply(this, args);
        }

        return arr;
    };

    function processRawData(plot, s, sData, sDatapoints) {
        var opts = plot.getOptions();
        if (opts.series.intensitymap.show === true) {
            sDatapoints.pointsize = 2;

            // push two data points, one with xmin, ymin, the other one with xmax, ymax
            // so the autoscale algorithms can determine the draw size.
            sDatapoints.points.push(0, 0);
            sDatapoints.points.push(sData.length || 0, sData[0] ? sData[0].length : 0);
        }

        // TODO reserve enough space so the map is not drawn outside of the chart.
    }

    function init(plot) {
        var opt = null,
            offset = '7',
            acanvas = null,
            series = null;
        plot.hooks.processOptions.push(processOptions);

        function processOptions(plot, options) {
            if (options.series.intensitymap.show) {
                extendEmpty(options, defaultOptions);
                if (!options.series.intensitymap.gradient) {
                    options.series.intensitymap.gradient = defaultGradient;
                }

                opt = options;
                plot.hooks.drawSeries.push(drawSeries);
                plot.hooks.processRawData.push(processRawData);
                initColorPalette();
            }
        };

        function initColorPalette() {
            var i, x;
            var canvas = document.createElement('canvas');
            canvas.width = '1';
            canvas.height = '256';
            var ctx = canvas.getContext('2d'),
              grad = ctx.createLinearGradient(0, 0, 0, 256),
              gradient = opt.series.intensitymap.gradient,
                  first = gradient[0].value, last = gradient[gradient.length - 1].value, offset;

            if (last === first) {
                grad.addColorStop(0, gradient[0].color);
                grad.addColorStop(1, gradient[0].color);
            } else {
                for (i = 0; i < gradient.length; i++) {
                    x = gradient[i].value;
                    offset = (x - first) / (last - first);
                    if (offset >= 0 && offset <= 1) {
                        grad.addColorStop(offset, gradient[i].color);
                    }
                }
            }

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1, 256);
            opt.series.intensitymap.palette = ctx.getImageData(0, 0, 1, 256).data;
        };

        function drawSeries(plot, ctx, serie) {
            var id = ctx.createImageData(1, 1);
            var d = id.data;
            var rx2, ry2, left, top;
            var i, j, value, x, y;
            var range = serie.intensitymap.max - serie.intensitymap.min;
            var lowR = parseInt(serie.intensitymap.lowColor.substring(1, 3), 16);
            var lowG = parseInt(serie.intensitymap.lowColor.substring(3, 5), 16);
            var lowB = parseInt(serie.intensitymap.lowColor.substring(5, 7), 16);
            var highR = parseInt(serie.intensitymap.highColor.substring(1, 3), 16);
            var highG = parseInt(serie.intensitymap.highColor.substring(3, 5), 16);
            var highB = parseInt(serie.intensitymap.highColor.substring(5, 7), 16);
            var palette = opt.series.intensitymap.palette;
            var scaleX = Math.abs(plot.width() / (serie.xaxis.max - serie.xaxis.min));
            var scaleY = Math.abs(plot.height() / (serie.yaxis.max - serie.yaxis.min));
            var offset = plot.getPlotOffset();
            if (scaleX > 1 || scaleY > 1) {
                scaleX = Math.round(scaleX + 1);
                scaleY = Math.round(scaleY + 1);
                rx2 = scaleX / 2;
                ry2 = scaleY / 2;
                left = offset.left + rx2;
                top = offset.top - ry2;
                for (i = serie.xaxis.min; i < serie.data.length && i < serie.xaxis.max; i++) {
                    for (j = serie.yaxis.min; j < serie.data[0].length && j < serie.yaxis.max; j++) {
                        value = serie.data[i][j];
                        drawRectangle(ctx, serie.xaxis.p2c(i) + left, serie.yaxis.p2c(j) + top, value);
                    }
                }
            } else {
                var cache = createArray(plot.width() + 1, plot.height() + 1);
                for (i = serie.xaxis.min; i < serie.data.length && i < serie.xaxis.max; i++) {
                    for (j = serie.yaxis.min; j < serie.data[0].length && j < serie.yaxis.max; j++) {
                        value = serie.data[i][j];
                        x = Math.round(serie.xaxis.p2c(i));
                        y = Math.round(serie.yaxis.p2c(j));
                        var current = cache[x][y];
                        if (current === undefined || value > current) {
                            cache[x][y] = value;
                            drawPixel(ctx, x + offset.left, y + offset.top, value);
                        }
                    }
                }
            }

            if (opt.series.intensitymap.legend === true) {
                drawLegend(ctx, offset.left + plot.width() + 20, offset.top, 40, plot.height());
            }

            function getColor(value) {
                if (range === 0) {
                    index = 508; // 0.5 * 255 * 4
                    return {
                        r: palette[index],
                        g: palette[index + 1],
                        b: palette[index + 2],
                        a: 255
                    }
                } else if (value < serie.intensitymap.min) {
                    return {
                        r: lowR,
                        g: lowG,
                        b: lowB,
                        a: 255
                    }
                } else if (value > serie.intensitymap.max) {
                    return {
                        r: highR,
                        g: highG,
                        b: highB,
                        a: 255
                    }
                } else {
                    index = Math.round((value - serie.intensitymap.min) * 255 / range) * 4;
                    return {
                        r: palette[index],
                        g: palette[index + 1],
                        b: palette[index + 2],
                        a: 255
                    }
                }
            };

            function drawPixel(ctx, x, y, value) {
                var index;
                var color = getColor(value);
                d[0] = color.r;
                d[1] = color.g;
                d[2] = color.b;
                d[3] = color.a;
                ctx.putImageData(id, x, y);
            };

            function drawRectangle(ctx, x, y, value) {
                // storing the variables because they will be often used
                var xb = Math.round(x - rx2),
                  yb = Math.round(y - ry2);
                var color = getColor(value);
                ctx.fillStyle = 'rgb(' + color.r + ',' + color.g + ',' + color.b + ')';
                ctx.fillRect(xb, yb, scaleX, scaleY);
            };

            function drawLegend(ctx, x, y, w, h) {
                var grad = ctx.createLinearGradient(0, h, 0, 0),
                  gradient = opt.series.intensitymap.gradient,
                  lowColor = opt.series.intensitymap.lowColor,
                  highColor = opt.series.intensitymap.highColor,
                    first = gradient[0].value, last = gradient[gradient.length - 1].value, offset, i;
                for (i = 0; i < gradient.length; i++) {
                    offset = (gradient[i].value - first) / (last - first);
                    if (offset >= 0 && offset <= 1.0) {
                        grad.addColorStop(offset, gradient[i].color);
                    }
                }

                ctx.fillStyle = grad;
                ctx.fillRect(x, y, w, h);
                ctx.fillStyle = grad;
                ctx.fillRect(x, y, w, h);
                ctx.fillStyle = lowColor;
                ctx.fillRect(x, y + h, w, 10);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y + h, w, 10);
                ctx.fillStyle = highColor;
                ctx.fillRect(x, y - 10, w, 10);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y - 10, w, 10);
            };
        };
    };

    $.plot.plugins.push({
        init: init,
        options: defaultOptions,
        name: pluginName,
        version: pluginVersion
    });
})(jQuery);
