//****************************************
// Support functions
// National Instruments Copyright 2014
//****************************************

(function ($) {
    'use strict';
    // National Instruments global namespace
    var NationalInstruments = {};
    window.NationalInstruments = NationalInstruments;

    // Namespace for HtmlVI feature
    NationalInstruments.HtmlVI = {};

    // Namespace for HtmlVI Models
    NationalInstruments.HtmlVI.Models = {};

    // Namespace for HtmlVI View Models
    NationalInstruments.HtmlVI.ViewModels = {};

    // Namespace for Support Functions
    NationalInstruments.HtmlVI.NISupport = {};
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.defineConstReference = function (objTarget, propName, value) {
        Object.defineProperty(objTarget, propName, {
            configurable: false,    // Property may not be deleted
            enumerable: false,      // Property does not show up in for..in loops
            writable: false,        // Assignment operator has no effect
            value: value
        });
    };

    // Wrappers for console functions
    NI_SUPPORT.log = function () {
        console.log.apply(console, arguments);
    };

    NI_SUPPORT.error = function () {
        console.error.apply(console, arguments);
    };

    NI_SUPPORT.debug = function () {
        console.debug.apply(console, arguments);
    };

    NI_SUPPORT.info = function () {
        console.info.apply(console, arguments);
    };

    NI_SUPPORT.group = function () {
        console.group.apply(console, arguments);
    };

    NI_SUPPORT.groupEnd = function () {
        console.groupEnd.apply(console, arguments);
    };

    NI_SUPPORT.uniqueId = function () {
        // Math.random should be unique because of its seeding algorithm.
        // Convert it to base 36 (numbers + letters), and grab the first 9 characters
        // after the decimal.
        return '_' + Math.random().toString(36).substr(2, 9);
    };

    NI_SUPPORT.i18n = function () {
        return $.i18n.prop.apply($.i18n, arguments);
    };

    // TODO mraj this needs to be changed to a coherent event and moved into an update service
    NationalInstruments.HtmlVI.CheckControlExists = function (id) {
        var selector = '[ni-control-id=\'' + id + '\']';
        var node = document.querySelectorAll(selector);
        var exists;
        if (node.length !== 0) {
            exists = 'true';
        } else {
            exists = 'false';
        }

        window.engine.trigger('PassMessage', '(Exists)' + id + ':' + exists);
    };

    NationalInstruments.HtmlVI.GetDocumentIndex = function (id) {
        var selector = '[ni-control-id=\'' + id + '\']';
        var node = document.querySelectorAll(selector);
        var index = -1, i;
        if (node.length !== 0) {
            for (i = 0; i < node[0].parentElement.childNodes.length; i++) {
                if (node[0].parentElement.childNodes[i] === node[0]) {
                    index = i;
                    break;
                }
            }
        }

        window.engine.trigger('PassMessage', '(DocumentIndex)' + id + ':' + index);
    };

    // Initialize the i18n module
    $.i18n.properties({
        name: 'Messages',
        path: 'Web/bundle/',
        mode: 'map',
        language: window.engine !== undefined && window.engine.IsAttached && window.NIEmbeddedBrowser !== undefined ? window.NIEmbeddedBrowser.language : undefined
    });

    // Defines Events enum for Event Structure support
    // We need to keep this values in synchrony with the ones defined in CommonEventIndex.cs
    NationalInstruments.HtmlVI.EventsEnum = Object.freeze({
        NONE: 0,
        CLICK: 1,
        VALUE_CHANGE: 2,
        RIGHT_CLICK: 3,
        BUTTON_CLICK: 4
    });
}(window.jQuery));

// inheritFromParent must be created outside the 'use strict' block
NationalInstruments.HtmlVI.NISupport.inheritFromParent = function (childType, parentType) {
    /* jshint strict:false */
    // TODO mraj Safari 8 will throw an Exception trying to modify the constructor property in strict mode
    // Possibly related to (https://bugs.webkit.org/show_bug.cgi?id=74193) Custom elements extend from HTMLElement and in Safari HTMLElement is not a constructor function

    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    if (Object.keys(childType.prototype).length > 0) {
        throw new Error('Properties added to the constructor function prototype object are lost during function invocation. Add after function invocation');
    }

    try {
        // The default constructor function prototype object inherts from window.Object. Create a new constructor function prototype object that inherits from parent.
        // Note: This will discard the existing childType.prototype so make sure to invoke inheritFromParent before adding to the childType.prototype
        childType.prototype = Object.create(parentType.prototype);

        // The default constructor reference points to the window.Object function constructor. Change the constructor reference to now point to the child.
        childType.prototype.constructor = childType;

    } catch (e) {
        NI_SUPPORT.log(e.message);
    }

    return childType.prototype;
};
