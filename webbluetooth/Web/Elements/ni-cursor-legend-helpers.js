//****************************************
// Plot Legend Helpers Prototype
// DOM Registration: Not an element
// National Instruments Copyright 2015
//****************************************

(function () {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var $ = NationalInstruments.Globals.jQuery;

    // Constructor Function
    NationalInstruments.HtmlVI.Elements.CursorLegendHelpers = function () {
        this.graphName = '';
        this.isInEditMode = false;
        this.cursors = [];
        this.defaultCursorName = NI_SUPPORT.i18n('msg_defaultcursorname');
    };

    // Static Public Variables
    // None

    var child = NationalInstruments.HtmlVI.Elements.CursorLegendHelpers;
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.getMenuItem = function (name) {
        if (name === 'shape') {
            return {
                name: 'Target Shape', tag: 'msg_targetshape', children: [
                    { name: 'Ellipse', tag: 'msg_ellipse', cssClass: 'ni-ellipse-point-style-icon' },
                    { name: 'Rectangle', tag: 'msg_rectangle', cssClass: 'ni-rect-point-style-icon' },
                    { name: 'Diamond', tag: 'msg_diamond', cssClass: 'ni-diamond-point-style-icon' },
                    { name: 'Cross', tag: 'msg_cross', cssClass: 'ni-cross-point-style-icon' },
                    { name: 'Plus', tag: 'msg_plus', cssClass: 'ni-plus-point-style-icon' }
                ]
            };
        } else if (name === 'crosshair') {
            return {
                name: 'Crosshair Style', tag: 'msg_crosshairstyle', children: [
                    { name: 'No style', tag: 'msg_nostyle', cssClass: 'ni-no-crosshair-icon' },
                    { name: 'Vertical', tag: 'msg_vertical', cssClass: 'ni-vertical-crosshair-icon' },
                    { name: 'Horizontal', tag: 'msg_horizontal', cssClass: 'ni-horizontal-crosshair-icon' },
                    { name: 'Both', tag: 'msg_both', cssClass: 'ni-both-crosshair-icon' }
                ]
            };
        }
    };

    proto.cursorAdded = function (cursor) {
        var i;
        for (i = 0; i < this.cursors.length; i++) {
            if (this.cursors[i].niControlId === cursor.niControlId) {
                return; // its already in the list
            }
        }

        this.cursors.push(cursor);
    };

    // if cursor is not already removed from the list then remove it
    proto.cursorRemoved = function (cursor) {
        var i;
        for (i = 0; i < this.cursors.length; i++) {
            if (this.cursors[i].niControlId === cursor.niControlId) {
                this.cursors.splice(i, 1);
                return;
            }
        }
    };

    proto.addCursor = function () {
        var graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
        var cursor = document.createElement('ni-cursor');
        cursor.niControlId = NI_SUPPORT.uniqueId();
        this.cursors.push(cursor);
        cursor.label = this.nextCursorName();
        graph.appendChild(cursor);
    };

    proto.centerCursor = function (index) {
        var cursor = this.getCursor(index);
        if (cursor !== null && cursor !== undefined) {
            cursor.x = 0.5;
            cursor.y = 0.5;
        }
    };

    proto.cursorPositionChanged = function (index, changed) {
        var cursor = this.getCursor(index);

        // TODO mraj is undefined an expected value?
        if (cursor === undefined) {
            throw new Error('cursor is undefined');
        }

        $(cursor).on('cursorUpdated', function (e, data) {
            changed(data.x, data.y);
        });
    };

    proto.nextCursorName = function () {
        var graph, maxIndex = 1, i, cursor;
        graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
        if (graph !== null) {
            for (child in graph.childNodes) {
                if (graph.childNodes[child].localName === 'ni-cursor') {
                    cursor = graph.childNodes[child];
                    i = parseInt(cursor.label.substring(this.defaultCursorName.length));
                    if (i > maxIndex) {
                        maxIndex = i;
                    }
                }
            }
        }

        return this.defaultCursorName + (maxIndex + 1);
    };

    proto.getCursor = function (index) {
        var i = 0;
        var graph;
        var cursor = null;
        var child;
        if (this.cursors[index] === null || this.cursors[index] === undefined) {
            graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
            if (graph !== null) {
                for (child in graph.childNodes) {
                    if (graph.childNodes[child].localName === 'ni-cursor') {
                        if (i === index) {
                            cursor = graph.childNodes[child];
                            break;
                        }

                        i++;
                    }
                }
            }

            if (cursor !== null) {
                this.cursors[index] = cursor;
            }
        }

        return this.cursors[index];
    };

    proto.deleteCursor = function (index) {
        var graph = document.querySelector('[ni-control-id=\'' + this.graphName + '\']');
        var cursor = this.getCursor(index);
        if (cursor !== null && cursor !== undefined) {
            graph.removeChild(cursor);
        }
    };

    proto.cursorToIndex = function (cursor) {
        var i = 0, index = -1;
        for (i = 0; i < this.cursors.length; i++) {
            if (this.cursors[i] !== null && cursor.niControlId === this.cursors[i].niControlId) {
                index = i;
            }
        }

        return index;
    };

    proto.handleClick = function (itemName, arg, index) {
        var cursor = this.getCursor(index);
        if (cursor === null && cursor === undefined) {
            return;
        }

        switch (itemName) {
            case 'name':
                break;
            case 'x':
                break;
            case 'y':
                break;
            case 'visible':
                cursor.show = !cursor.show;
                break;
            case 'snap':
                cursor.snapToData = !cursor.snapToData;
                break;
            case 'center':
                cursor.x = 0.5;
                cursor.y = 0.5;
                break;
            case 'delete':
                this.deleteCursor(index);
                break;
            case 'Ellipse':
                cursor.targetShape = 'ellipse';
                break;
            case 'Rectangle':
                cursor.targetShape = 'rectangle';
                break;
            case 'Diamond':
                cursor.targetShape = 'diamond';
                break;
            case 'Cross':
                cursor.targetShape = 'cross';
                break;
            case 'Plus':
                cursor.targetShape = 'plus';
                break;
            case 'No style':
                cursor.crosshairStyle = 'none';
                break;
            case 'Vertical':
                cursor.crosshairStyle = 'vertical';
                break;
            case 'Horizontal':
                cursor.crosshairStyle = 'horizontal';
                break;
            case 'Both':
                cursor.crosshairStyle = 'both';
                break;
            case 'Color':
                cursor.cursorColor = '#' + arg.hex;
                break;
        }
    };

    proto.getState = function (itemName, index) {
        var cursor = this.getCursor(index);
        if (cursor === null || cursor === undefined) {
            return undefined;
        }

        var state;
        switch (itemName) {
            case 'name':
                state = cursor.label;
                break;
            case 'x':
                state = cursor.x;
                break;
            case 'y':
                state = cursor.y;
                break;
            case 'visible':
                state = cursor.show;
                break;
            case 'snap':
                state = cursor.snapToData;
                break;
            case 'center':
                break;
            case 'delete':
                break;
            case 'Ellipse':
                state = cursor.targetShape === 'ellipse';
                break;
            case 'Rectangle':
                state = cursor.targetShape === 'rectangle';
                break;
            case 'Diamond':
                state = cursor.targetShape === 'diamond';
                break;
            case 'Cross':
                state = cursor.targetShape === 'cross';
                break;
            case 'Plus':
                state = cursor.targetShape === 'plus';
                break;
            case 'No style':
                state = cursor.crosshairStyle === 'none';
                break;
            case 'Vertical':
                state = cursor.crosshairStyle === 'vertical';
                break;
            case 'Horizontal':
                state = cursor.crosshairStyle === 'horizontal';
                break;
            case 'Both':
                state = cursor.crosshairStyle === 'both';
                break;
            case 'Color':
                state = cursor.cursorColor;
                break;
        }

        return state;
    };

    proto.getTargetShape = function (index) {
        var cursor = this.getCursor(index);
        if (cursor !== null && cursor !== undefined) {
            return cursor.targetShape;
        }

        return 'ellipse';
    };

    proto.getCrosshair = function (index) {
        var cursor = this.getCursor(index);
        if (cursor !== null && cursor !== undefined) {
            return cursor.crosshairStyle;
        }
    };
}());
