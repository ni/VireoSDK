/*jslint browser:true, nomen:true*/
/*globals NationalInstruments, CustomEvent*/

(function () {
    'use strict';
    var toReg, proto, generateAttachedCallback, generateCreatedCallback, uniqueId = 0;

    generateCreatedCallback = function (orig) {
        return function createdCallback_uniqueIds() {
            if (this.getAttribute('ni-control-id') === null) {
                this.setAttribute('ni-control-id', uniqueId);
                uniqueId = uniqueId + 1;
            }

            orig.apply(this, arguments);
        };
    };

    generateAttachedCallback = function (orig) {
        return function attachedCallback_resizeHack() {
            var firstCall,
                style;

            // Element is in the DOM
            // Element internal DOM not created yet
            // if (this._attachedCallbackFirstCall === true) {}

            // Attach and populate internal DOM (as needed)
            firstCall = orig.apply(this, arguments);

            // Element is in the DOM
            // Element internal DOM created
            if (firstCall === true) {
                style = window.getComputedStyle(this);
                this.dispatchEvent(new CustomEvent('resizeEventHack', {
                    detail: {
                        width: style.width,
                        height: style.height
                    },
                    bubbles: false
                }));
            }

            return firstCall;
        };
    };

    // Extensions to multiple prototypes
    for (toReg in NationalInstruments.HtmlVI.Elements) {
        if (NationalInstruments.HtmlVI.Elements.hasOwnProperty(toReg)) {
            proto = NationalInstruments.HtmlVI.Elements[toReg].prototype;

            if (proto.elementInfo !== undefined) {
                proto.createdCallback = generateCreatedCallback(proto.createdCallback);
                proto.attachedCallback = generateAttachedCallback(proto.attachedCallback);
            }
        }
    }
}());
