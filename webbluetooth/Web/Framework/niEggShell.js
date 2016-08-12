//***************************************
// Vireo EggShell Singleton
// National Instruments Copyright 2014
//***************************************
(function () {
    'use strict';
    // Static Private Reference Aliases
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    // Constructor Function
    NationalInstruments.HtmlVI.EggShell = function () {
        // TODO mraj should be able to make new instances of Vireo instead of all EggShells using the same instance
        if (NationalInstruments.Vireo === undefined) {
            throw new Error('vireo.js not available when creating the EggShell');
        }

        // Public Instance Properties
        // None

        // Private Instance Properties
        this._vireo = NationalInstruments.Vireo;
    };

    // Static Public Variables
    // None

    // Static Public Functions
    NationalInstruments.HtmlVI.EggShell.encodeVireoIdentifier = function (str) {
        var nonId = [' ', '!', '"', '#', '%', '&', '\'', '(', ')', ',', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '`', '{', '|', '}', '~'];
        var encoded = '';

        if (typeof str !== 'string') {
            return undefined;
        }

        for (var i = 0; i < str.length; i++) {
            var codePoint = str.charCodeAt(i);
            var ch = str.charAt(i);
            if (codePoint <= 0x7F) {
                if (i === 0 || codePoint <= 0x1F || nonId.indexOf(ch) > -1) {
                    encoded += '%' + codePoint.toString(16).toUpperCase();
                } else {
                    encoded += ch;
                }
            }
        }

        return encoded;
    };

    // Prototype creation
    var child = NationalInstruments.HtmlVI.EggShell;
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    // None

    // Public Prototype Methods
    proto.runSlices = function () {
        var finished = false,
            retVal;

        retVal = this._vireo.executeSlices(1000, -1);
        finished = (retVal > 0 ? false : true);

        return finished;
    };

    proto.loadVia = function (viaText) {
        if (typeof viaText !== 'string') {
            throw new Error('The following is not a string that can be loaded as via text:', viaText);
        }

        // TODO mraj If we want internal state to be available when re-starting then need to remove
        // Maybe cache viaText and restart only if viaText changes?
        if (this._vireo.core.v_userShell !== 0) {
            this._vireo.reboot();
        }

        this._vireo.loadVia(viaText);
    };

    // setPrintCallback ( print : function(text : string) : void )
    proto.setPrintCallback = function (callback) {
        if (typeof callback !== 'function') {
            throw new Error('Must provide a function for the print callback');
        }

        this._vireo.core.print = callback;
    };

    // setFrontPanelSynchronousCallback ( callback : function (fpID : string) : void)
    proto.setFrontPanelSynchronousUpdateCallback = function (callback) {
        if (typeof callback !== 'function') {
            throw new Error('Must provide a function for the front panel synchronous update callback');
        }

        this._vireo.core.fpSync = callback;
    };

    proto.peek = function (viName, path, type) {
        var value = null;
        switch (type) {
            case 'String':
                value = JSON.parse(this._vireo.readJSON(viName, path));
                break;
            case 'Number':
                value = this._vireo.readDouble(viName, path);
                break;
            case 'Boolean':
                value = this._vireo.readJSON(viName, path);
                if (value === 'f' || value === 'false') {
                    value = false;
                } else {
                    value = true;
                }

                break;
            case 'Path':
                value = this._vireo.readJSON(viName, path);
                value = JSON.parse(value);
                break;
            case 'Array':
                value = JSON.parse(this._vireo.readJSON(viName, path));
                break;
            case 'Timestamp':
                // TODO mraj reading a timestamp as a double may result in loss of precision, see https://nitalk.jiveon.com/thread/74202
                value = this._vireo.readDouble(viName, path);
                break;
            case 'Object':
                value = JSON.parse(this._vireo.readJSON(viName, path));
                break;
            case 'Unknown':
                //TODO mraj when types are emmitted for sub elements of a cluster this can be removed
                value = JSON.parse(this._vireo.readJSON(viName, path));
                break;
            default:
                throw new Error(NI_SUPPORT.i18n('msg_UNKNOWN_TYPE', type));
        }
        return value;
    };

    proto.poke = function (viName, path, type, data) {
        switch (type) {
            case 'String':
                this._vireo.writeJSON(viName, path, JSON.stringify(data));
                break;
            case 'Number':
                this._vireo.writeDouble(viName, path, data);
                break;
            case 'Boolean':
                this._vireo.writeJSON(viName, path, JSON.stringify(data));
                break;
            case 'Path':
                data = JSON.stringify(data);
                this._vireo.writeJSON(viName, path, data);
                break;
            case 'Array':
                this._vireo.writeJSON(viName, path, JSON.stringify(data));
                break;
            case 'Timestamp':
                // TODO mraj writing a timestamp as a double may result in loss of precision, see https://nitalk.jiveon.com/thread/74202
                this._vireo.writeDouble(viName, path, data);
                break;
            case 'Object':
                this._vireo.writeJSON(viName, path, JSON.stringify(data));
                break;
            case 'Unknown':
                //TODO mraj when types are emmitted for sub elements of a cluster this can be removed
                this._vireo.writeJSON(viName, path, JSON.stringify(data));
                break;
            default:
                throw new Error(NI_SUPPORT.i18n('msg_UNKNOWN_TYPE', type));
        }
    };
}());
