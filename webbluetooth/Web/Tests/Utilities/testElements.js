//****************************************
// Helpers to run tests that must be performed asynchronously
// National Instruments Copyright 2015
//****************************************

window.testHelpers = window.testHelpers || {};

(function () {
    'use strict';

    var parent = NationalInstruments.HtmlVI.Elements.NIElement,
        proto = Object.create(parent.prototype);

    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);
        proto.addProperty(targetPrototype, {
            propertyName: 'numberProp',
            defaultValue: 42
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'stringProp',
            defaultValue: 'Hello World!'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'booleanProp',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'numFires',
            defaultValue: 42,
            fireEvent: true,
            addNonSignalingProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'numNoSync',
            defaultValue: 42,
            preventAttributeSync: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'numNoSyncFires',
            defaultValue: 42,
            fireEvent: true,
            preventAttributeSync: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'objProp',
            defaultValue: {
                num: 42,
                bool: true,
                str: 'I like trains'
            },
            fireEvent: true
        });
    };

    proto.defineElementInfo(proto, 'ni-test', 'HTMLNITest');
    document.registerElement(proto.elementInfo.tagName, {prototype: proto});
}());

(function () {
    'use strict';

    var parent = NationalInstruments.HtmlVI.Elements.NIElement,
        proto = Object.create(parent.prototype);

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);
        this.dispatchEvent(new CustomEvent('order-test', {
            bubbles: true,
            detail: {
                what: '[pc]',
                when: 'created',
                who: 'parent'
            }
        }));
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);
        this.dispatchEvent(new CustomEvent('order-test', {
            bubbles: true,
            detail: {
                what: '[pa]',
                when: 'attached',
                who: 'parent'
            }
        }));
        return firstCall;
    };

    proto.defineElementInfo(proto, 'ni-test-parent', 'HTMLNITestParent');
    document.registerElement(proto.elementInfo.tagName, {prototype: proto});
}());

(function () {
    'use strict';

    var parent = NationalInstruments.HtmlVI.Elements.NIElement,
        proto = Object.create(parent.prototype);

    proto.createdCallback = function () {
        parent.prototype.createdCallback.call(this);
        this.dispatchEvent(new CustomEvent('order-test', {
            bubbles: true,
            detail: {
                what: '[cc]',
                when: 'created',
                who: 'child'
            }
        }));
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);
        this.dispatchEvent(new CustomEvent('order-test', {
            bubbles: true,
            detail: {
                what: '[ca]',
                when: 'attached',
                who: 'child'
            }
        }));
        return firstCall;
    };

    proto.defineElementInfo(proto, 'ni-test-child', 'HTMLNITestChild');
    document.registerElement(proto.elementInfo.tagName, {prototype: proto});
}());
