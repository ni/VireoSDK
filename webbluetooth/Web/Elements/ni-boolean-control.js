//****************************************
// Boolean Control Prototype
// DOM Registration: No
// National Instruments Copyright 2014
//****************************************

// Constructor Function: Empty (Not Invoked)
NationalInstruments.HtmlVI.Elements.BooleanControl = function () {
    'use strict';
};

// Static Public Variables
// None

(function (child, parent) {
    'use strict';
    // Static Private Reference Aliases
    var $ = NationalInstruments.Globals.jQuery;
    var NI_SUPPORT = NationalInstruments.HtmlVI.NISupport;

    NI_SUPPORT.inheritFromParent(child, parent);
    var proto = child.prototype;

    // Static Private Variables
    // None

    // Static Private Functions
    var unbindMechanicalAction = function (target) {
        var id = target.niControlId;
        NationalInstruments.HtmlVI.UIActivityService.unregister(id);
    };

    var bindMechanicalAction = function (target) {
        var onPress = target.clickMode === 'press',
            isMomentary = target.momentary,
            id = target.niControlId,
            element = target,
            that = target;

        if (isMomentary === true && onPress === true) {
            NI_SUPPORT.error('Invalid configuration, cannot have momentary true and click mode "press", instead using when released configuration');
            isMomentary = false;
            onPress = false;
        }

        if (isMomentary === false && onPress === false) { //When Released
            NationalInstruments.HtmlVI.UIActivityService.register({
                element: element,
                id: id,
                up: function (evt) {
                    if (element.contains(evt.target)) {
                        that.value = !that.value;
                        that.valueChanged();
                    }
                }
            });
        } else if (isMomentary === false && onPress === true) { //When Pressed
            NationalInstruments.HtmlVI.UIActivityService.register({
                element: element,
                id: id,
                down: function () {
                    that.value = !that.value;
                    that.valueChanged();
                }
            });
        } else if (isMomentary === true && onPress === false) { //Until Released
            NationalInstruments.HtmlVI.UIActivityService.register({
                element: element,
                id: id,
                up: function () {
                    that.value = !that.value;
                    that.valueChanged();
                },
                down: function () {
                    that.value = !that.value;
                    that.valueChanged();
                },
                cancelled: function () {
                    that.value = !that.value;
                    that.valueChanged();
                }
            });
        }
    };

    // Public Prototype Methods
    proto.updateOnCSSClass = function () { // Add or removes the ni-on CSS class to the control. Called on childs.
        var childElement = this.firstElementChild,
            jqref = $(childElement);
        jqref.toggleClass('ni-on', this.value);
    };

    proto.valueChanged = function () { // Overriden on childs
        this.updateOnCSSClass();
    };

    proto.addAllProperties = function (targetPrototype) {
        parent.prototype.addAllProperties.call(this, targetPrototype);

        proto.addProperty(targetPrototype, {
            propertyName: 'value',
            defaultValue: false,
            fireEvent: true,
            addNonSignalingProperty: true,
            isElementValueProperty: true
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'contentVisible',
            defaultValue: false
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'content',
            defaultValue: 'Button'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'clickMode',
            defaultValue: 'release'
        });

        proto.addProperty(targetPrototype, {
            propertyName: 'momentary',
            defaultValue: false
        });
    };

    proto.attachedCallback = function () {
        var firstCall = parent.prototype.attachedCallback.call(this);

        bindMechanicalAction(this);

        return firstCall;
    };

    proto.propertyUpdated = function (propertyName) {
        parent.prototype.propertyUpdated.call(this, propertyName);

        switch (propertyName) {
        case 'clickMode':
            bindMechanicalAction(this);
            break;
        case 'momentary':
            bindMechanicalAction(this);
            break;
        default:
            break;
        }
    };

    proto.detachedCallback = function () {
        parent.prototype.detachedCallback.call(this);

        unbindMechanicalAction(this);
    };

}(NationalInstruments.HtmlVI.Elements.BooleanControl, NationalInstruments.HtmlVI.Elements.Visual));
