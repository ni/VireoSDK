//*****************************************************
// Rendering Engine
// National Instruments Copyright 2014
//*****************************************************

(function () {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;
    var NI_ELEMENT = NationalInstruments.HtmlVI.Elements.NIElement;

    // Static Private Variables
    var _updateQueue = []; // List of elements to update.
    var _updateMap = {}; // {niElementId: niRenderBuffer}
    var _updatePending = {}; // {niElementId: true}
    var _frameRequested = false;

    // Static Private Functions
    var applyDomUpdates = function (element, renderBuffer) {
        var i, newStyle, newAttr, newProp;

        for (i = 0; i < renderBuffer.cssClasses.toAdd.length; i++) {
            if (typeof renderBuffer.cssClasses.toAdd[i] !== 'string') {
                throw new Error(NI_SUPPORT.i18n('msg_RENDERBUFFER_EXPECTS_STRING', 'css classes to add', typeof renderBuffer.cssClasses.toAdd[i]));
            } else {
                element.classList.add(renderBuffer.cssClasses.toAdd[i]);
            }
        }

        for (i = 0; i < renderBuffer.cssClasses.toRemove.length; i++) {
            if (typeof renderBuffer.cssClasses.toRemove[i] !== 'string') {
                throw new Error(NI_SUPPORT.i18n('msg_RENDERBUFFER_EXPECTS_STRING', 'css classes to remove', typeof renderBuffer.cssClasses.toRemove[i]));
            } else {
                element.classList.remove(renderBuffer.cssClasses.toRemove[i]);
            }
        }

        for (newStyle in renderBuffer.cssStyles) {
            if (renderBuffer.cssStyles.hasOwnProperty(newStyle)) {
                if (element.style[newStyle] === undefined) {
                    // Let's just log that, we don't want to interrupt execution just because
                    // a CSS property is not declared.
                    NI_SUPPORT.error(NI_SUPPORT.i18n('msg_PROPERTY_DOES_NOT_EXIST', newStyle, 'element style'));
                } else {
                    element.style[newStyle] = renderBuffer.cssStyles[newStyle];
                }
            }
        }

        for (newAttr in renderBuffer.attributes) {
            if (renderBuffer.attributes.hasOwnProperty(newAttr)) {
                if (typeof renderBuffer.attributes[newAttr] !== 'string') {
                    throw new Error(NI_SUPPORT.i18n('msg_RENDERBUFFER_EXPECTS_STRING', 'element attributes', typeof renderBuffer.attributes[newAttr]));
                } else {
                    element.setAttribute(newAttr, renderBuffer.attributes[newAttr]);
                }
            }
        }

        for (newProp in renderBuffer.properties) {
            if (renderBuffer.properties.hasOwnProperty(newProp)) {
                if (renderBuffer.properties[newProp] === undefined) {
                    throw new Error('Property cannot be undefined ' + newProp);
                } else {
                    element[newProp] = renderBuffer.properties[newProp];
                }
            }
        }

        if (Object.keys(renderBuffer.cssStyles).length > 0) {
            var actSize = { width: renderBuffer.cssStyles.width, height: renderBuffer.cssStyles.height };
            if (actSize.width !== undefined || actSize.height !== undefined) {
                element.dispatchEvent(new CustomEvent('resizeEventHack', { detail: actSize }));
            }
        }
    };

    var runFrameUpdate = function () {
        var element, renderBuffer, niElementId;
        // We try to do all the work at once.
        while (_updateQueue.length > 0) {
            element = _updateQueue.shift();
            niElementId = element.niElementInstanceId;
            renderBuffer = _updateMap[niElementId];
            _updatePending[niElementId] = false;

            applyDomUpdates(element, renderBuffer);
            renderBuffer.reset();
        }

        _frameRequested = false;
    };

    // Constructor Function
    NationalInstruments.HtmlVI.RenderEngine = function () {
        // Public Instance Properties
        // None

        // Private Instance Properties
        // None
    };

    // Static Public Functions
    NationalInstruments.HtmlVI.RenderEngine.getOrAddRenderBuffer = function (element) {
        if (element instanceof NI_ELEMENT === false) {
            throw new Error('Element should be an instance of ni-element.');
        }

        var niElementId = element.niElementInstanceId,
            renderBuffer = _updateMap[niElementId];
        if (renderBuffer === undefined) {
            renderBuffer = new NationalInstruments.HtmlVI.RenderBuffer();
            _updateMap[niElementId] = renderBuffer;
        }

        return renderBuffer;
    };

    NationalInstruments.HtmlVI.RenderEngine.removeRenderBuffer = function (element) {
        if (element instanceof NI_ELEMENT === false) {
            throw new Error('Element should be an instance of ni-element.');
        }

        var niElementId = element.niElementInstanceId,
            renderBuffer = _updateMap[niElementId];
        if (renderBuffer !== undefined) {
            _updateMap[niElementId] = undefined;
            _updatePending[niElementId] = undefined;
            _updateQueue = _updateQueue.filter(function (e) {
                return e.niElementInstanceId !== niElementId;
            });
        }

        return renderBuffer;
    };

    NationalInstruments.HtmlVI.RenderEngine.enqueueDomUpdate = function (element) {
        if (element instanceof NI_ELEMENT === false) {
            throw new Error('Element should be an instance of ni-element.');
        }

        var niElementId = element.niElementInstanceId;
        var renderBuffer = _updateMap[niElementId];

        if (renderBuffer === undefined) {
            throw Error('Did you forget to getOrAddRenderBuffer?');
        }

        if (renderBuffer.isEmpty() === false &&
        (_updatePending[niElementId] === false || _updatePending[niElementId] === undefined)) {
            _updatePending[niElementId] = true;
            _updateQueue.push(element);
        }

        if (_frameRequested === false && _updateQueue.length > 0) {
            _frameRequested = true;
            window.requestAnimationFrame(runFrameUpdate);
        }
    };

    NationalInstruments.HtmlVI.RenderEngine.isFrameRequested = function () {
        return _frameRequested;
    };

} ());
