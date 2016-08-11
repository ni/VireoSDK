//****************************************
// Plot Legend Prototype
// DOM Registration: Not an element
// National Instruments Copyright 2015
//****************************************

(function () {
    'use strict';

    // Constructor Function
    NationalInstruments.HtmlVI.Elements.CursorLegendItemDisplay = function (helpers) {
        this.helpers = helpers;
        this.items = [];
    };

    // Static Public Variables
    // None

    var child = NationalInstruments.HtmlVI.Elements.CursorLegendItemDisplay;
    var proto = child.prototype;

    // Static Private Variables
    var svgns = 'http://www.w3.org/2000/svg';

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.clearShape = function (index) {
        this.items.splice(index, 1);
    };

    //Methods
    proto.createHeaderDisplay = function (index) {
        var svg;
        var cursor = this.helpers.getCursor(index);
        if (cursor === undefined) {
            return null;
        }

        svg = document.createElementNS(svgns, 'svg');
        svg.setAttribute('class', 'ni-cursor-display');
        //svg.setAttribute('style', 'border: 1px solid black; display: inline-block; margin: auto; margin-top: 4px; vertical-align: middle;');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0,0,16,16');
        svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
        this.addShapes(cursor, svg, svgns);
        this.items.push(svg);
        return svg;
    };

    proto.addShapes = function (cursor, svg, svgns) {
        this.makeShape(cursor, svg, svgns);
        this.makeLine(cursor, svg, svgns, '8', '1', '8', '4', 1);
        this.makeLine(cursor, svg, svgns, '12', '8', '15', '8', 2);
        this.makeLine(cursor, svg, svgns, '8', '12', '8', '15', 3);
        this.makeLine(cursor, svg, svgns, '1', '8', '4', '8', 4);
    };

    proto.makeShape = function (cursor, svg, svgns) {
        var rect, circle;
        var shape = cursor.targetShape;
        var color = this.getColorString(cursor, 0);
        switch (shape) {
            case 'ellipse':
                circle = document.createElementNS(svgns, 'circle');
                circle.setAttribute('cx', '8');
                circle.setAttribute('cy', '8');
                circle.setAttribute('r', '4');
                circle.setAttribute('stroke', color);
                circle.setAttribute('stroke-width', '1');
                circle.setAttribute('fill', 'rgba(0, 0, 0, 0)');
                svg.appendChild(circle);
                break;
            case 'rectangle':
                rect = document.createElementNS(svgns, 'rect');
                rect.setAttribute('x', '4');
                rect.setAttribute('y', '4');
                rect.setAttribute('width', '8');
                rect.setAttribute('height', '8');
                rect.setAttribute('stroke', color);
                rect.setAttribute('stroke-width', '1');
                rect.setAttribute('fill', 'rgba(0, 0, 0, 0)');
                svg.appendChild(rect);
                break;
            case 'diamond':
                this.makeLine(cursor, svg, svgns, '8', '4', '12', '8', 0);
                this.makeLine(cursor, svg, svgns, '12', '8', '8', '12', 0);
                this.makeLine(cursor, svg, svgns, '8', '12', '4', '8', 0);
                this.makeLine(cursor, svg, svgns, '4', '8', '8', '4', 0);
                break;
            case 'cross':
                this.makeLine(cursor, svg, svgns, '4', '4', '12', '12', 0);
                this.makeLine(cursor, svg, svgns, '4', '12', '12', '4', 0);
                break;
            case 'plus':
                this.makeLine(cursor, svg, svgns, '8', '4', '8', '12', 0);
                this.makeLine(cursor, svg, svgns, '4', '8', '12', '8', 0);
                break;
        }
    };

    proto.makeLine = function (cursor, svg, svgns, x1, y1, x2, y2, colorIndex) {
        var line = document.createElementNS(svgns, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', this.getColorString(cursor, colorIndex));
        line.setAttribute('stroke-width', 1);
        svg.appendChild(line);
    };

    proto.getColorString = function (cursor, partIndex) {
        var crosshair = cursor.crosshairStyle;
        var color = cursor.cursorColor;
        var html;
        switch (crosshair) {
            case 'none':
                html = this.colorWithAlpha(color, partIndex === 0 ? '255' : '0');
                break;
            case 'vertical':
                html = this.colorWithAlpha(color, partIndex === 0 || partIndex === 1 || partIndex === 3 ? '255' : '0');
                break;
            case 'horizontal':
                html = this.colorWithAlpha(color, partIndex === 0 || partIndex === 2 || partIndex === 4 ? '255' : '0');
                break;
            case 'both':
                html = this.colorWithAlpha(color, '255');
                break;
        }

        return html;
    };

    proto.colorWithAlpha = function (color, alpha) {
        var r = parseInt(color.substring(1, 3), 16);
        var g = parseInt(color.substring(3, 5), 16);
        var b = parseInt(color.substring(5), 16);
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    };

    proto.updateShape = function (index) {
        var svg = this.items[index];
        var cursor = this.helpers.getCursor(index);
        if (cursor === undefined) {
            return null;
        }

        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        this.addShapes(cursor, svg, svgns);
    };
}());
