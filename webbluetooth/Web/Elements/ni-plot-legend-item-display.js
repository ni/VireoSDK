//****************************************
// Plot Legend Prototype
// DOM Registration: Not an element
// National Instruments Copyright 2015
//****************************************

(function () {
    'use strict';

    // Constructor Function
    NationalInstruments.HtmlVI.Elements.PlotLegendItemDisplay = function (helpers) {
        this.pointTypes = [
            { name: 'ellipse', creator: this.createEllipseShape },
            { name: 'rectangle', creator: this.createRectangleShape },
            { name: 'diamond', creator: this.createDiamondShape },
            { name: 'cross', creator: this.createCrossShape },
            { name: 'plus', creator: this.createPlusShape }
        ];

        this.shapes = [];
        this.helpers = helpers;
    };

    // Static Public Variables
    // None

    var child = NationalInstruments.HtmlVI.Elements.PlotLegendItemDisplay;
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.createHeaderDisplay = function (div, index) {
        var svgns, svg, shape;
        svgns = 'http://www.w3.org/2000/svg';
        svg = document.createElementNS(svgns, 'svg');
        svg.setAttribute('style', 'border: 1px solid black');
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
        svg.setAttribute('viewBox', '0,0,16,16');
        svg.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink');
        div.appendChild(svg);
        this.shapes[index] = {};
        shape = this.createLine(svgns);
        shape.setAttribute('fill', 'none');
        shape.setAttribute('stroke-width', this.helpers.getLineWidth(index));
        shape.setAttribute('stroke', this.getComputedColor(index, 'line'));
        svg.appendChild(shape);
        this.shapes[index].line = shape;

        this.shapes[index].points = [];
        this.createPoints(index, svg, svgns, this.pointTypes);

        shape = this.createFillArea(svgns);
        shape.setAttribute('fill', this.getComputedColor(index, 'fill'));
        shape.setAttribute('stroke-width', 1);
        shape.setAttribute('stroke', this.getComputedColor(index, 'fill'));
        svg.appendChild(shape);
        this.shapes[index].fill = shape;

        shape = this.createBars(svgns);
        shape.setAttribute('fill', this.getComputedColor(index, 'bar'));
        shape.setAttribute('stroke-width', 1);
        shape.setAttribute('stroke', this.getComputedColor(index, 'bar'));
        svg.appendChild(shape);
        this.shapes[index].bar = shape;
    };

    proto.createLine = function (svgns) {
        var shape = document.createElementNS(svgns, 'polyline');
        shape.setAttribute('points', '0,15 5,5 10,10 15,0');
        return shape;
    };

    proto.createFillArea = function (svgns) {
        var shape = document.createElementNS(svgns, 'polyline');
        shape.setAttribute('points', '0,15 5,5 10,10 15,0, 15,15, 0,15');
        return shape;
    };

    proto.createBars = function (svgns) {
        var shape = document.createElementNS(svgns, 'polyline');
        shape.setAttribute('points', '1,15 1,12, 4,12 4,15 6,15 6,3, 9,3 9,15 11,15 11,7 14,7 14,15 1,15');
        return shape;
    };

    proto.createPoints = function (index, svg, svgns, pointShapes) {
        var size = 4;
        var i, j;
        var group;
        var points = [
            {x: 0, y: 15},
            {x: 10, y: 10},
            {x: 5, y: 5},
            {x: 15, y: 0}
        ];
        var shape;

        for (j = 0; j < pointShapes.length; j++) {
            group = document.createElementNS(svgns, 'g');
            for (i = 0; i < 4; i++) {
                shape = pointShapes[j].creator(svgns, points[i], size);
                group.appendChild(shape);
            }

            group.setAttribute('fill', this.getComputedColor(index, 'point'));
            group.setAttribute('stroke-width', 1);
            group.setAttribute('stroke', this.getComputedColor(index, 'point'));
            svg.appendChild(group);
            this.shapes[index].points[pointShapes[j].name] = group;
        }
    };

    proto.createEllipseShape = function (svgns, center, size) {
        var shape = document.createElementNS(svgns, 'circle');
        shape.setAttribute('cx', center.x);
        shape.setAttribute('cy', center.y);
        shape.setAttribute('r', size / 2);
        return shape;
    };

    proto.createRectangleShape = function (svgns, center, size) {
        var shape = document.createElementNS(svgns, 'rect');
        shape.setAttribute('x', center.x - size / 2);
        shape.setAttribute('y', center.y - size / 2);
        shape.setAttribute('width', size);
        shape.setAttribute('height', size);
        return shape;
    };

    proto.createDiamondShape = function (svgns, center, size) {
        var shape = document.createElementNS(svgns, 'path');
        var path = 'M' + (center.x - size / 2) + ',' + center.y;
        path += ' L' + center.x + ',' + (center.y - size / 2);
        path += ' L' + (center.x + size / 2) + ',' + center.y;
        path += ' L' + center.x + ',' + (center.y + size / 2);
        path += ' Z';
        shape.setAttribute('d', path);
        return shape;
    };

    proto.createCrossShape = function (svgns, center, size) {
        var shape = document.createElementNS(svgns, 'path');
        var path = 'M' + (center.x - size / 2) + ',' + (center.y - size / 2);
        path += ' L' + (center.x + size / 2) + ',' + (center.y + size / 2);
        path += 'M' + (center.x + size / 2) + ',' + (center.y - size / 2);
        path += ' L' + (center.x - size / 2) + ',' + (center.y + size / 2);
        shape.setAttribute('d', path);
        return shape;
    };

    proto.createPlusShape = function (svgns, center, size) {
        var shape = document.createElementNS(svgns, 'path');
        var path = 'M' + center.x + ',' + (center.y - size / 2);
        path += ' L' + center.x + ',' + (center.y + size / 2);
        path += 'M' + (center.x - size / 2) + ',' + center.y;
        path += ' L' + (center.x + size / 2) + ',' + center.y;
        shape.setAttribute('d', path);
        return shape;
    };

    proto.colorWithAlpha = function (color, alpha) {
        var r = parseInt(color.substring(1, 3), 16);
        var g = parseInt(color.substring(3, 5), 16);
        var b = parseInt(color.substring(5), 16);
        return 'rgba(' + r + ',' + g + ',' +  b + ',' + alpha + ')';
    };

    proto.getComputedColor = function (index, lineShape) {
        var currentLineShape = this.helpers.getLineShape(index);
        var currentColor = this.helpers.getPlotColor(index);
        if (currentLineShape === lineShape) {
            return this.colorWithAlpha(currentColor, '255');
        } else if (currentLineShape === 'line & point' && (lineShape === 'line' || lineShape === 'point')) {
            return this.colorWithAlpha(currentColor, '255');
        } else {
            return this.colorWithAlpha(currentColor, '0');
        }
    };

    proto.setPointColor = function (shape, shapeType, currentPointShape, color) {
        if (shapeType === currentPointShape) {
            shape.setAttribute('stroke', color);
            shape.setAttribute('fill', color);
        } else {
            shape.setAttribute('stroke', 'rgba(0, 0, 0, 0)');
            shape.setAttribute('fill', 'rgba(0, 0, 0, 0)');
        }
    };

    proto.updatePointColor = function (index, shape) {
        var i;
        var color = this.getComputedColor(index, 'point');
        var pointShape = this.helpers.getPointShape(index);
        for (i = 0; i < this.pointTypes.length; i++) {
            this.setPointColor(shape.points[this.pointTypes[i].name], this.pointTypes[i].name, pointShape, color);
        }
    };

    proto.updateShape = function (index) {
        var shape = this.shapes[index];
        if (shape === undefined) {
            return;
        }

        var lineShape = this.helpers.getLineShape(index);
        var width = this.helpers.getLineWidth(index);
        if (lineShape === 'line') {
            shape.line.setAttribute('stroke-width', width);
        }

        shape.line.setAttribute('stroke', this.getComputedColor(index, 'line'));
        this.updatePointColor(index, shape);
        shape.fill.setAttribute('stroke', this.getComputedColor(index, 'fill'));
        shape.fill.setAttribute('fill', this.getComputedColor(index, 'fill'));
        shape.bar.setAttribute('stroke', this.getComputedColor(index, 'bar'));
        shape.bar.setAttribute('fill', this.getComputedColor(index, 'bar'));
    };
}());
