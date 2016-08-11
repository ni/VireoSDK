/* Flot plugin for adding cursors to the plot.

Copyright (c) cipix2000@gmail.com.
Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.
*/

/*global jQuery*/

(function ($) {
    'use strict';

    var options = {
        cursors: [
        ]
    };

    var constants = {
        iRectSize: 8,
        symbolSize: 8,
        mouseGrabMargin: 8,
        textHeight: 10, // to do: compute it somehow. Canvas doesn't give us a way to know it
        labelPadding: 10
    };

    // The possible locations for a cursor label
    var cursorLabelLocationEnum = Object.freeze({
        // This is the only label for a cursor
        ONLY: 'only',
        // There are two cursor labels and this is the top one
        TOP: 'top',
        // There are two cursor labels and this is the bottom one
        BOTTOM: 'bottom'
    });

    function init(plot) {
        var cursors = [];
        var update = [];

        function createCursor(options) {
            return mixin(options, {
                name: options.name || ('unnamed ' + cursors.length),
                position: options.position || {
                    relativeX: 0.5,
                    relativeY: 0.5
                },
                x: 0,
                y: 0,
                selected: false,
                highlighted: false,
                mode: 'xy',
                showIntersections: false,
                showLabel: false,
                showValuesRelativeToSeries: undefined,
                color: 'gray',
                font: '10px sans-serif',
                lineWidth: 1
            });
        }

        plot.hooks.processOptions.push(function (plot) {
            plot.getOptions().cursors.forEach(function (options) {
                plot.addCursor(options);
            });
        });

        plot.getCursors = function () {
            return cursors;
        };

        plot.addCursor = function addCursor(options) {
            var currentCursor = createCursor(options);

            setPosition(plot, currentCursor, options.position);
            cursors.push(currentCursor);

            plot.triggerRedrawOverlay();
        };

        plot.removeCursor = function removeCursor(cursor) {
            var index = cursors.indexOf(cursor);

            if (index !== -1) {
                cursors.splice(index, 1);
            }

            plot.triggerRedrawOverlay();
        };

        plot.setCursor = function setCursor(cursor, options) {
            var index = cursors.indexOf(cursor);

            if (index !== -1) {
                mixin(options, cursors[index]);
                setPosition(plot, cursors[index], cursors[index].position);
                plot.triggerRedrawOverlay();
            }
        };

        plot.getIntersections = function getIntersections(cursor) {
            var index = cursors.indexOf(cursor);

            if (index !== -1) {
                return cursors[index].intersections;
            }

            return [];
        };

        function onMouseOut(e) {
            /*
                maybe stop drag when the mouse leaves the chart ?
            */
        }

        var selectedCursor = function (cursors) {
            var result;

            cursors.forEach(function (cursor) {
                if (cursor.selected) {
                    if (!result)
                        result = cursor;
                }
            });

            return result;
        };

        var selectCursor = function (cursors, cursor) {
            cursors.forEach(function (c) {
                if (c === cursor) {
                    c.selected = true;
                } else {
                    c.selected = false;
                }
            });
        };

        function onMouseDown(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));

            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                // unselect the cursor and move it to the current position
                currentlySelectedCursor.selected = false;
                plot.getPlaceholder().css('cursor', 'default');
                currentlySelectedCursor.x = mouseX;
                currentlySelectedCursor.y = mouseY;
                currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();

                plot.triggerRedrawOverlay();
            } else {
                // find nearby cursor and unlock it
                var targetCursor;
                var dragmode;

                cursors.forEach(function (cursor) {
                    if (mouseOverCursorHorizontalLine(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'y';
                    }

                    if (mouseOverCursorVerticalLine(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'x';
                    }

                    if (mouseOverCursorManipulator(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'xy';
                    }
                });

                if (targetCursor) {
                    targetCursor.selected = true;
                    targetCursor.dragmode = dragmode;
                    plot.getPlaceholder().css('cursor', 'move');
                    plot.triggerRedrawOverlay();
                    e.stopPropagation();
                }
            }
        }

        function onMouseUp(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));
            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                // lock the free cursor to current position
                currentlySelectedCursor.selected = false;
                if (currentlySelectedCursor.dragmode.indexOf('x') !== -1) {
                    currentlySelectedCursor.x = mouseX;
                    currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                }

                if (currentlySelectedCursor.dragmode.indexOf('y') !== -1) {
                    currentlySelectedCursor.y = mouseY;
                    currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();
                }

                plot.getPlaceholder().css('cursor', 'default');
                plot.triggerRedrawOverlay();
            }
        }

        function onMouseMove(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));

            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                if (currentlySelectedCursor.dragmode.indexOf('x') !== -1) {
                    currentlySelectedCursor.x = mouseX;
                    currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                }

                if (currentlySelectedCursor.dragmode.indexOf('y') !== -1) {
                    currentlySelectedCursor.y = mouseY;
                    currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();
                }

                plot.triggerRedrawOverlay();
                e.stopPropagation();
            } else {
                cursors.forEach(function (cursor) {
                    if (mouseOverCursorManipulator(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'pointer');
                    } else if (mouseOverCursorVerticalLine(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'col-resize');
                    } else if (mouseOverCursorHorizontalLine(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'row-resize');
                    } else {
                        if (cursor.highlighted) {
                            cursor.highlighted = false;
                            plot.getPlaceholder().css('cursor', 'default');
                            plot.triggerRedrawOverlay();
                        }
                    }
                });
            }
        }

        plot.hooks.bindEvents.push(function (plot, eventHolder) {
            eventHolder.mousedown(onMouseDown);
            eventHolder.mouseup(onMouseUp);
            eventHolder.mouseout(onMouseOut);
            eventHolder.mousemove(onMouseMove);
        });

        function findIntersections(plot, cursor) {
            var pos = plot.c2p({
                left: cursor.x,
                top: cursor.y
            });

            var intersections = {
                cursor: cursor.name,
                x: pos.x,
                y: pos.y,
                points: []
            };

            var axes = plot.getAxes();
            if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
                pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
                return;
            }

            var i, j, dataset = plot.getData();

            for (i = 0; i < dataset.length; ++i) {
                var series = dataset[i];

                // Find the nearest points, x-wise
                for (j = 0; j < series.data.length; ++j) {
                    if (series.data[j][0] > pos.x) {
                        break;
                    }
                }

                // Now Interpolate
                var y,
                    p1 = series.data[j - 1],
                    p2 = series.data[j];

                if ((p1 === undefined) && (p2 === undefined)) {
                    continue;
                }

                if (p1 === undefined) {
                    y = p2[1];
                } else if (p2 === undefined) {
                    y = p1[1];
                } else {
                    y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
                }

                pos.y = y;
                pos.y1 = y;

                intersections.points.push({
                    x: pos.x,
                    y: pos.y
                });
            }

            return intersections;
        }

        plot.hooks.drawOverlay.push(function (plot, ctx) {
            var i = 0;
            update = [];
            var intersections;

            cursors.forEach(function (cursor) {
                var plotOffset = plot.getPlotOffset();

                ctx.save();
                ctx.translate(plotOffset.left, plotOffset.top);

                setPosition(plot, cursor, cursor.position, intersections);
                intersections = findIntersections(plot, cursor);
                maybeSnapToPlot(plot, cursor, intersections);

                if (cursor.x !== -1) {
                    drawVerticalAndHorizontalLines(plot, ctx, cursor);

                    cursor.intersections = intersections;
                    intersections.target = cursor;
                    update.push(intersections);

                    drawLabelAndValue(plot, ctx, cursor);
                    drawIntersections(plot, ctx, cursor);
                    drawManipulator(plot, ctx, cursor);
                }

                ctx.restore();
                i++;
            });

            plot.getPlaceholder().trigger('cursorupdates', [update]);
        });

        plot.hooks.shutdown.push(function (plot, eventHolder) {
            eventHolder.unbind('mousedown', onMouseDown);
            eventHolder.unbind('mouseup', onMouseUp);
            eventHolder.unbind('mouseout', onMouseOut);
            eventHolder.unbind('mousemove', onMouseMove);
            eventHolder.unbind('cursorupdates');
            plot.getPlaceholder().css('cursor', 'default');
        });
    }

    function mixin(source, destination) {
        Object.keys(source).forEach(function (key) {
            destination[key] = source[key];
        });

        return destination;
    }

    function setPosition(plot, cursor, pos) {
        var o;
        if (!pos)
            return;

        o = plot.p2c(pos);
        var rx = pos.relativeX * plot.width();
        var ry = pos.relativeY * plot.height();

        if ((pos.relativeX !== undefined)) {
            cursor.x = Math.max(0, Math.min(rx, plot.width()));
            if (pos.relativeY === undefined) {
                cursor.y = Math.max(0, Math.min(o.top, plot.height()));
            } else {
                cursor.y = Math.max(0, Math.min(ry, plot.height()));
            }
        } else if (pos.relativeY !== undefined) {
            cursor.x = Math.max(0, Math.min(o.left, plot.width()));
            cursor.y = Math.max(0, Math.min(ry), plot.height());
        } else {
            cursor.x = Math.max(0, Math.min(o.left, plot.width()));
            cursor.y = Math.max(0, Math.min(o.top, plot.height()));
        }
    }

    function maybeSnapToPlot(plot, cursor, intersections) {
        if (cursor.snapToPlot !== undefined) {
            var point = intersections.points[cursor.snapToPlot];
            if (point) {
                setPosition(plot, cursor, {
                    x: point.x,
                    y: point.y
                });

                intersections.y = point.y; // update cursor position
            }
        }
    }

    function computeLabelHorizontalPosition(width, x) {
        var textAlign = 'left';

        if (x > (width / 2)) {
            // Cursor on the right, label on the left. Move the label left to add padding at the end.
            x -= constants.labelPadding;
            textAlign = 'right';
        } else {
            // Cursor on the left, label on the right. Move the label right to add padding at the start.
            x += constants.labelPadding;
        }

        return {
            x: x,
            textAlign: textAlign
        };
    }

    function computeLabelVerticalPosition(height, y, textHeight, cursorLocation) {
        if (y > (height / 2)) {
            // Cursor below, label above. Move the label up to add padding at the bottom
            y -= constants.labelPadding;
            if (cursorLocation === cursorLabelLocationEnum.TOP) {
                // Leave move up by one line to make room for bottom label
                y -= (textHeight + constants.labelPadding);
            }
        } else {
            // Cursor above, label below. Move the label down to add padding at the top and to account for its own height
            y += constants.labelPadding + textHeight;
            if (cursorLocation === cursorLabelLocationEnum.BOTTOM) {
                // Leave move up by one line to make room for bottom label
                y += textHeight + constants.labelPadding;
            }
        }

        return y;
    }

    function drawLabelAndValue(plot, ctx, cursor) {
        var textHeight = estimateTextHeight(cursor);
        var width = plot.width();
        var height = plot.height();
        var x = cursor.x;
        var y = cursor.y;
        var horizontalPosition = computeLabelHorizontalPosition(width, x);
        var showValue = typeof cursor.showValuesRelativeToSeries === 'number';
        var dataset, series, xaxis, yaxis, text, verticalPosition;

        if (cursor.showLabel) {
            ctx.beginPath();
            verticalPosition = computeLabelVerticalPosition(height, y, textHeight, showValue ? cursorLabelLocationEnum.TOP : cursorLabelLocationEnum.ONLY);
            ctx.fillStyle = cursor.color;
            ctx.textAlign = horizontalPosition.textAlign;
            ctx.font = cursor.font;
            ctx.fillText(cursor.name, horizontalPosition.x, verticalPosition);
            ctx.textAlign = 'left';
            ctx.stroke();
        }

        if (showValue) {
            dataset = plot.getData();

            series = dataset[cursor.showValuesRelativeToSeries];

            if (!series)
                return;

            xaxis = series.xaxis;
            yaxis = series.yaxis;

            text = '' + xaxis.c2p(cursor.x).toFixed(2) + ', ' + yaxis.c2p(cursor.y).toFixed(2);
            verticalPosition = computeLabelVerticalPosition(height, y, textHeight, cursor.showLabel ? cursorLabelLocationEnum.BOTTOM : cursorLabelLocationEnum.ONLY);

            ctx.beginPath();
            ctx.fillStyle = cursor.color;
            ctx.textAlign = horizontalPosition.textAlign;
            ctx.font = cursor.font;
            ctx.fillText(text, horizontalPosition.x, verticalPosition);

            ctx.textAlign = 'left';

            ctx.stroke();
        }
    }

    function estimateTextHeight(cursor) {
        // Estimate the text height by parsing the font size from the font string.
        // This is a hack which only works if the font is specified in px.
        var str = cursor.font;
        if (typeof str === 'string' && str !== '') {
            var pxIndex = str.indexOf('px');
            if (pxIndex >= 0) {
                var numberPart = str.substring(0, pxIndex);
                var spaceIndex = numberPart.lastIndexOf(' ');
                var numberString = numberPart.substring(spaceIndex);
                var number = parseInt(numberString);
                if (!isNaN(number)) {
                    return number;
                }
            }
        }
        return constants.textHeight;
    }

    function drawIntersections(plot, ctx, cursor) {
        if (cursor.showIntersections && hasVerticalLine(cursor)) {
            ctx.beginPath();
            cursor.intersections.points.forEach(function (point) {
                var coord = plot.p2c(point);
                ctx.fillStyle = 'darkgray';
                ctx.fillRect(Math.floor(coord.left) - constants.iRectSize / 2,
                    Math.floor(coord.top) - constants.iRectSize / 2,
                    constants.iRectSize, constants.iRectSize);
                ctx.fillText(point.y.toFixed(2), coord.left + constants.iRectSize,
                    coord.top + constants.iRectSize);
            });
            ctx.stroke();
        }
    }

    function drawVerticalAndHorizontalLines(plot, ctx, cursor) {
        // keep line sharp
        var adj = cursor.lineWidth % 2 ? 0.5 : 0;

        ctx.strokeStyle = cursor.color;
        ctx.lineWidth = cursor.lineWidth;
        ctx.lineJoin = "round";

        ctx.beginPath();

        if (cursor.mode.indexOf("x") !== -1) {
            var drawX = Math.floor(cursor.x) + adj;
            ctx.moveTo(drawX, 0);
            ctx.lineTo(drawX, plot.height());
        }

        if (cursor.mode.indexOf("y") !== -1) {
            var drawY = Math.floor(cursor.y) + adj;
            ctx.moveTo(0, drawY);
            ctx.lineTo(plot.width(), drawY);
        }

        ctx.stroke();
    }

    function drawManipulator(plot, ctx, cursor) {
        // keep line sharp
        var adj = cursor.lineWidth % 2 ? 0.5 : 0;
        ctx.beginPath();

        if (cursor.highlighted)
            ctx.strokeStyle = 'orange';
        else
            ctx.strokeStyle = cursor.color;
        if (cursor.symbol && plot.drawSymbol && plot.drawSymbol[cursor.symbol]) {
            //first draw a white background
            ctx.fillStyle = 'white';
            ctx.fillRect(Math.floor(cursor.x) + adj - (constants.symbolSize / 2 + 1),
                Math.floor(cursor.y) + adj - (constants.symbolSize / 2 + 1),
                constants.symbolSize + 2, constants.symbolSize + 2);
            plot.drawSymbol[cursor.symbol](ctx, Math.floor(cursor.x) + adj,
                Math.floor(cursor.y) + adj, constants.symbolSize / 2, 0);
        } else {
            ctx.fillRect(Math.floor(cursor.x) + adj - (constants.symbolSize / 2),
                Math.floor(cursor.y) + adj - (constants.symbolSize / 2),
                constants.symbolSize, constants.symbolSize);
        }

        ctx.stroke();
    }

    function hasVerticalLine(cursor) {
        return (cursor.mode.indexOf('x') !== -1);
    }

    function hasHorizontalLine(cursor) {
        return (cursor.mode.indexOf('y') !== -1);
    }

    function mouseOverCursorManipulator(e, plot, cursor) {
        var offset = plot.offset();
        var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
        var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));
        var grabRadius = constants.symbolSize + constants.mouseGrabMargin;

        return ((mouseX > cursor.x - grabRadius) && (mouseX < cursor.x + grabRadius) &&
            (mouseY > cursor.y - grabRadius) && (mouseY < cursor.y + grabRadius));
    }

    function mouseOverCursorVerticalLine(e, plot, cursor) {
        var offset = plot.offset();
        var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
        var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));

        return (hasVerticalLine(cursor) && (mouseX > cursor.x - constants.mouseGrabMargin) &&
            (mouseX < cursor.x + constants.mouseGrabMargin) && (mouseY > 0) && (mouseY < plot.height()));
    }

    function mouseOverCursorHorizontalLine(e, plot, cursor) {
        var offset = plot.offset();
        var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
        var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));

        return (hasHorizontalLine(cursor) && (mouseY > cursor.y - constants.mouseGrabMargin) &&
            (mouseY < cursor.y + constants.mouseGrabMargin) && (mouseX > 0) && (mouseY < plot.width()));
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'cursors',
        version: '0.1'
    });
})(jQuery);
