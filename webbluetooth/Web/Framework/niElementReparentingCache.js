//****************************************
// NI Control Reparenting Cache
// National Instruments Copyright 2014
//****************************************
(function () {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.ElementReparentingCache = function () {

        // Public Instance Properties
        // keys are parentIds and values are arrays of elements, ie buffer = {'Function3': [childElem1, childElem2]}
        this.buffer = {};

        // Private Instance Properties
        // None
    };

    // Static Public Variables
    // None

    // Static Public Functions
    // None

    // Prototype creation
    var child = NationalInstruments.HtmlVI.ElementReparentingCache;
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    var flushRecur = function (parentId, parentElement, buffer) {
        var i;
        if (buffer[parentId] !== undefined) {
            for (i = 0; i < buffer[parentId].length; i++) {
                parentElement.appendChild(buffer[parentId][i]);
            }

            for (var j = 0; j < buffer[parentId].length; j++) {
                flushRecur(buffer[parentId][j].niControlId, buffer[parentId][j], buffer);
            }

            buffer[parentId] = undefined;
        }

    };

    // Public Prototype Methods
    proto.addToElementCache = function (parentId, element) {
        if (this.buffer[parentId] === undefined) {
            this.buffer[parentId] = [];
        }

        var parentBuffer = this.buffer[parentId];
        var parentBufferElementIndex = -1;

        for (var i = 0; i < parentBuffer.length; i++) {
            if (parentBuffer[i].niControlId === element.niControlId) {

                parentBufferElementIndex = i;
                break;
            }
        }

        if (parentBufferElementIndex === -1) {
            parentBuffer.push(element);
        } else {
            parentBuffer[i] = element;
            NI_SUPPORT.error('Element replaced for parent id', parentId, 'because buffer already has element for id', element.niControlId);
        }

        // TODO mraj REPARENTING console logging very helpful for debugging
        // NI_SUPPORT.group('Element Reparenting Cache (After Add)');
        // this.printBuffer();
        // NI_SUPPORT.groupEnd();
    };

    proto.flushElementCache = function (parentId, parentElement) {
        // TODO mraj REPARENTING console logging very helpful for debugging
        //if (Object.keys(this.buffer).length > 0) {
        //    NI_SUPPORT.group('Element Reparenting Cache (Before Flush)');
        //    this.printBuffer();
        //    NI_SUPPORT.groupEnd();
        //}

        if (typeof parentId === 'string' && parentElement instanceof NationalInstruments.HtmlVI.Elements.NIElement) {
            flushRecur(parentId, parentElement, this.buffer);
        }

        this.buffer = {};
    };

    proto.printBuffer = function () {
        var that = this;
        Object.keys(that.buffer).forEach(function (val) {
            NI_SUPPORT.log('parentId:', val, 'childrenId(s):', that.buffer[val].map(function (el) {
                return el.niControlId;
            }).join(','));
        });
    };

}());
