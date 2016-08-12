//****************************************
// Intercepts custom element registration to log accessed properties
// National Instruments Copyright 2015
//****************************************

window.testHelpers = window.testHelpers || {};

window.testHelpers.customElementMonitor = (function () {
    'use strict';
    var proto = NationalInstruments.HtmlVI.Elements.NIElement.prototype,
        propertyTable = {},
        generateAddPropertyTestInterceptor,
        generatePropertyUpdatedTestInterceptor,
        uncalledPropertiesExceptFor,
        EVERYTHING_CALLED = 'All expected properties covered';

    generateAddPropertyTestInterceptor = function (orig) {

        return function addPropertyTestInterceptor(targetPrototype, config) {
            var retVal = orig.apply(this, arguments);

            if (propertyTable[targetPrototype.elementInfo.tagName] === undefined) {
                propertyTable[targetPrototype.elementInfo.tagName] = {};
            }

            propertyTable[targetPrototype.elementInfo.tagName][config.propertyName] = 0;

            return retVal;
        };
    };

    generatePropertyUpdatedTestInterceptor = function (orig) {

        return function propertyUpdatedTestInterceptor(propertyName) {
            var retVal = orig.apply(this, arguments);

            propertyTable[this.elementInfo.tagName][propertyName]++;

            return retVal;
        };
    };

    proto.addProperty = generateAddPropertyTestInterceptor(proto.addProperty);
    proto.propertyUpdated = generatePropertyUpdatedTestInterceptor(proto.propertyUpdated);

    uncalledPropertiesExceptFor = function (modelKind, toIgnoreArray) {
        var uncalledProps = [],
            toIgnoreObj = {},
            currProp, i, tagName;

        tagName = NationalInstruments.HtmlVI.NIModelProvider.modelKindToTagName(modelKind);

        for (i = 0; i < toIgnoreArray.length; i = i + 1) {
            toIgnoreObj[toIgnoreArray[i]] = true;
        }

        for (currProp in propertyTable[tagName]) {
            if (propertyTable[tagName].hasOwnProperty(currProp)) {

                if (propertyTable[tagName][currProp] === 0 && toIgnoreObj[currProp] !== true) {
                    uncalledProps.push(currProp);
                }
            }
        }

        if (uncalledProps.length === 0) {
            return EVERYTHING_CALLED;
        } else {
            return 'Element ' + tagName + ' did not call updatedProperty for the following properties: ' + uncalledProps.join(', ');
        }
    };

    return {
        uncalledPropertiesExceptFor: uncalledPropertiesExceptFor,
        EVERYTHING_CALLED: EVERYTHING_CALLED
    };

}());
