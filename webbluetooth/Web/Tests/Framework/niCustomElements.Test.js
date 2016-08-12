//****************************************
// Tests for Custom Elements
// National Instruments Copyright 2014
//****************************************

describe('A Custom Element', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    if (document.body === null) {
        var body = document.createElement('body');
        document.body = body;
    }

    it('changes a boolean, numeric, and string value which updates the property and DOM', function () {
        var myElem = document.createElement('ni-test');

        expect(myElem.booleanProp).toBe(false);
        expect(myElem.getAttribute('boolean-prop')).toBe(null);

        myElem.booleanProp = true;
        expect(myElem.booleanProp).toBe(true);
        expect(myElem.getAttribute('boolean-prop')).toBe('');

        myElem.booleanProp = false;
        expect(myElem.booleanProp).toBe(false);
        expect(myElem.getAttribute('boolean-prop')).toBe(null);

        expect(myElem.numberProp).toBe(42);
        expect(myElem.getAttribute('number-prop')).toBe('42');
        myElem.numberProp = 55;
        expect(myElem.numberProp).toBe(55);
        expect(myElem.getAttribute('number-prop')).toBe('55');

        myElem.numberProp = NaN;
        expect(myElem.numberProp).not.toBe(myElem.numberProp); // NaN check, needed because isNaN(undefined) === true and because of type coersion isNaN('NaN') === true
        expect(myElem.getAttribute('number-prop')).toBe('NaN');

        myElem.numberProp = Number.POSITIVE_INFINITY;
        expect(myElem.numberProp).toBe(Number.POSITIVE_INFINITY);
        expect(myElem.getAttribute('number-prop')).toBe('Infinity');

        myElem.numberProp = Number.NEGATIVE_INFINITY;
        expect(myElem.numberProp).toBe(Number.NEGATIVE_INFINITY);
        expect(myElem.getAttribute('number-prop')).toBe('-Infinity');

        myElem.numberProp = +0;
        expect(1 / myElem.numberProp).toBe(Number.POSITIVE_INFINITY);
        expect(myElem.getAttribute('number-prop')).toBe('0');

        myElem.numberProp = -0;
        expect(1 / myElem.numberProp).toBe(Number.NEGATIVE_INFINITY);
        expect(myElem.getAttribute('number-prop')).toBe('-0');

        expect(myElem.stringProp).toBe('Hello World!');
        expect(myElem.getAttribute('string-prop')).toBe('Hello World!');

        myElem.stringProp = 'THIS IS THE BETTER LABVIEW';
        expect(myElem.stringProp).toBe('THIS IS THE BETTER LABVIEW');
        expect(myElem.getAttribute('string-prop')).toBe('THIS IS THE BETTER LABVIEW');
    });

    it('changes a configuration object property which updates the property and the DOM', function () {
        var myElem = document.createElement('ni-test'), timesCalled = 0;
        myElem.addEventListener('obj-prop-changed', function () {
            timesCalled = timesCalled + 1;
        });

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 42,
            bool: true,
            str: 'I like trains'
        });
        expect(timesCalled).toBe(0);

        myElem.objProp = {};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 42,
            bool: true,
            str: 'I like trains'
        });
        expect(timesCalled).toBe(0);

        myElem.objProp = {notUseful: 'bunny'};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 42,
            bool: true,
            str: 'I like trains'
        });
        expect(timesCalled).toBe(0);

        myElem.objProp = {num: 55};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 55,
            bool: true,
            str: 'I like trains'
        });
        expect(timesCalled).toBe(1);

        myElem.objProp = {bool: false};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 55,
            bool: false,
            str: 'I like trains'
        });
        expect(timesCalled).toBe(2);

        myElem.objProp = {str: 'turtles are cool too'};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 55,
            bool: false,
            str: 'turtles are cool too'
        });
        expect(timesCalled).toBe(3);

        myElem.objProp = {
            num: 75,
            bool: true,
            str: 'nigel is a pretty bird'
        };

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 75,
            bool: true,
            str: 'nigel is a pretty bird'
        });
        expect(myElem.objProp).toEqual({
            num: 75,
            bool: true,
            str: 'nigel is a pretty bird'
        });
        expect(timesCalled).toBe(4);
    });

    it('changes a configuration object property numeric value that gets encoded as a string in the JSON attribute', function () {
        var myElem = document.createElement('ni-test');

        myElem.objProp = {num: Number.POSITIVE_INFINITY};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 'Infinity',
            bool: true,
            str: 'I like trains'
        });

        myElem.objProp = {num: Number.NEGATIVE_INFINITY};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: '-Infinity',
            bool: true,
            str: 'I like trains'
        });

        myElem.objProp = {num: NaN};

        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: 'NaN',
            bool: true,
            str: 'I like trains'
        });

        myElem.objProp = {num: -0};

        expect(Object.is(myElem.objProp.num, -0)).toBe(true);
        expect(JSON.parse(myElem.getAttribute('obj-prop'))).toEqual({
            num: '-0',
            bool: true,
            str: 'I like trains'
        });
    });

    it('changes a numeric property which updates the property and does not update DOM', function () {
        var myElem = document.createElement('ni-test');

        expect(myElem.numNoSync).toBe(42);
        expect(myElem.getAttribute('num-no-sync')).toBe('42');
        myElem.numNoSync = 55;
        expect(myElem.numNoSync).toBe(55);
        expect(myElem.getAttribute('num-no-sync')).toBe('42');
    });

    it('changes a numeric value and fires an event', function () {
        var myElem = document.createElement('ni-test'), timesCalled = 0;

        myElem.addEventListener('num-fires-changed', function (evt) {
            expect(evt.detail.numFires).toBe(55);
            timesCalled = timesCalled + 1;
        });

        expect(myElem.numFires).toBe(42);
        expect(myElem.getAttribute('num-fires')).toBe('42');
        myElem.numFires = 55;
        expect(myElem.numFires).toBe(55);
        expect(myElem.getAttribute('num-fires')).toBe('55');

        expect(timesCalled).toBe(1);
    });

    it('changes a numeric non signaling value which does not fire an event', function () {
        var myElem = document.createElement('ni-test'), timesCalled = 0;

        myElem.addEventListener('num-fires-changed', function (evt) {
            expect(evt.detail.numFires).toBe(55);
            timesCalled = timesCalled + 1;
            evt.preventDefault();
        });

        expect(myElem.numFires).toBe(42);
        expect(myElem.getAttribute('num-fires')).toBe('42');
        myElem.numFiresNonSignaling = 55;
        expect(myElem.numFires).toBe(55);
        expect(myElem.getAttribute('num-fires')).toBe('55');

        expect(timesCalled).toBe(0);
    });

    it('changes an attribute that is not managed and no event fires', function () {
        var myElem = document.createElement('ni-test'), timesCalled = 0;

        myElem.addEventListener('so-rad-changed', function () {
            timesCalled = timesCalled + 1;
        });

        expect(myElem.soRad).toBe(undefined);
        expect(myElem.getAttribute('so-rad')).toBe(null);

        myElem.setAttribute('so-rad', 'totally man!');

        expect(myElem.soRad).toBe(undefined);
        expect(myElem.getAttribute('so-rad')).toBe('totally man!');
        expect(timesCalled).toBe(0);
    });

    it('removes a string attribute and the value is reverted', function (done) {
        var myElem = document.createElement('ni-test');

        expect(myElem.stringProp).toBe('Hello World!');
        expect(myElem.getAttribute('string-prop')).toBe('Hello World!');

        myElem.removeAttribute('string-prop');

        expect(myElem.stringProp).toBe('Hello World!');

        testHelpers.runAsync(done, function () {
            expect(myElem.getAttribute('string-prop')).toBe('Hello World!');
        });
    });

    describe('that has parent and child elements', function () {
        var container;

        beforeEach(function () {
            container = testHelpers.addSectionFixture();
        });

        it('verifies element parent is created first', function (done) {
            var flag = '';

            container.addEventListener('order-test', function (evt) {
                if (evt.detail.when === 'created') {
                    flag = flag + evt.detail.what;
                }
            });

            container.innerHTML = '<ni-test-parent><ni-test-child></ni-test-child></ni-test-parent>';

            testHelpers.runAsync(done, function () {
                expect(flag).toBe('[pc][cc]');
            });
        });
        it('verifies element parent is attached first', function (done) {
            var flag = '';

            container.addEventListener('order-test', function (evt) {
                if (evt.detail.when === 'attached') {
                    flag = flag + evt.detail.what;
                }
            });

            container.innerHTML = '<ni-test-parent><ni-test-child></ni-test-child></ni-test-parent>';

            testHelpers.runAsync(done, function () {
                expect(flag).toBe('[pa][ca]');
            });
        });
        it('verifies order of parent created+attached and child created+attached', function (done) {
            var flag = '';

            container.addEventListener('order-test', function (evt) {
                flag = flag + evt.detail.what;
            });

            container.innerHTML = '<ni-test-parent><ni-test-child></ni-test-child></ni-test-parent>';

            testHelpers.runAsync(done, function () {
                expect(flag).toBe('[pc][pa][cc][ca]');
            });
        });
    });

    describe('that is added to the DOM', function () {
        var myElem,
            uniqueId = 'veryuniqueid';

        beforeEach(function (done) {
            expect(document.getElementById(uniqueId)).toBe(null);
            $(document.body).append('<ni-test id="' + uniqueId + '" obj-prop="{bad json}"></ni-test>');

            testHelpers.runAsync(done, function () {
                myElem = document.getElementById(uniqueId);
                expect(myElem).toBeDefined();
                expect(myElem.numberProp).toBe(42);
                expect(myElem.stringProp).toBe('Hello World!');
                expect(myElem.booleanProp).toBe(false);
                expect(myElem.numFires).toBe(42);
                expect(myElem.numNoSync).toBe(42);
                expect(myElem.numNoSyncFires).toBe(42);
                expect(myElem.objProp).toEqual({
                    num: 42,
                    bool: true,
                    str: 'I like trains'
                });
            });
        });

        afterEach(function () {
            document.body.removeChild(myElem);
            expect(document.getElementById(uniqueId)).toBe(null);
        });

        it('attempts to set a JSON attribute to null', function (done) {
            myElem.setAttribute('obj-prop', JSON.stringify({
                str: null
            }));

            testHelpers.runAsync(done, function () {
                expect(myElem.objProp).toEqual({
                    num: 42,
                    bool: true,
                    str: 'I like trains'
                });
            });
        });

        it('attempts to set a JSON attribute to an invalid type', function (done) {
            myElem.setAttribute('obj-prop', JSON.stringify({
                bool: 'fabulous manzier bros'
            }));

            testHelpers.runAsync(done, function () {
                expect(myElem.objProp).toEqual({
                    num: 42,
                    bool: true,
                    str: 'I like trains'
                });
            });
        });

        it('attempts to set a numeric JSON attribute to the string Infinity', function (done) {
            myElem.setAttribute('obj-prop', JSON.stringify({
                num: 'Infinity'
            }));

            testHelpers.runAsync(done, function () {
                expect(myElem.objProp).toEqual({
                    num: Number.POSITIVE_INFINITY,
                    bool: true,
                    str: 'I like trains'
                });
            });
        });

        it('attempts to set a numeric JSON attribute to the string -Infinity', function (done) {
            myElem.setAttribute('obj-prop', JSON.stringify({
                num: '-Infinity'
            }));

            testHelpers.runAsync(done, function () {
                expect(myElem.objProp).toEqual({
                    num: Number.NEGATIVE_INFINITY,
                    bool: true,
                    str: 'I like trains'
                });
            });
        });

        it('attempts to set a numeric JSON attribute to the string NaN', function (done) {
            myElem.setAttribute('obj-prop', JSON.stringify({
                num: 'NaN'
            }));

            testHelpers.runAsync(done, function () {
                expect(myElem.objProp.num).not.toBe(myElem.objProp.num); // NaN check, needed because isNaN(undefined) === true and because of type coersion isNaN('NaN') === true
            });
        });

        it('attempts to set a numeric JSON attribute to null', function (done) {
            myElem.setAttribute('obj-prop', JSON.stringify({
                num: null
            }));

            testHelpers.runAsync(done, function () {
                expect(myElem.objProp.num).not.toBe(myElem.objProp.num); // NaN check, needed because isNaN(undefined) === true and because of type coersion isNaN('NaN') === true
            });
        });

        it('attempts to set a numeric attribute to the string NaN', function (done) {
            myElem.setAttribute('number-prop', 'NaN');

            testHelpers.runAsync(done, function () {
                expect(myElem.numberProp).not.toBe(myElem.numberProp); // NaN check, needed because isNaN(undefined) === true and because of type coersion isNaN('NaN') === true
            });
        });

        it('attempts to detach and reattach an element', function () {
            document.body.removeChild(myElem);
            expect(document.getElementById(uniqueId)).toBe(null);

            document.body.appendChild(myElem);
            expect(document.getElementById(uniqueId)).not.toBe(null);
        });

    });

    it('modified by the user using setAttributeType using an invalid type throws an exception', function () {
        var myElem = document.createElement('ni-test'),
            task;

        task = function () {
            myElem.setAttributeTyped('boolean-prop', [{
                propertyName: 'boolean-prop',
                type: 'boolean'
            }], function () {
            });
        };

        expect(task).toThrow();
    });

    it('with a property modified by the user with an invalid type throws an exception', function () {
        var myElem = document.createElement('ni-test'),
            task1,
            task2,
            task3;

        task1 = function () {
            myElem.booleanProp = 'hey you pikachu';
        };

        task2 = function () {
            myElem.objProp = function () {
            };
        };

        task3 = function () {
            myElem.objProp = {
                bool: 'hey you pikachu'
            };
        };

        expect(task1).toThrow();
        expect(task2).toThrow();
        expect(task3).toThrow();
    });

    it('adding a property without any configuration throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype);
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property with an empty configuration throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {});
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property with a bad name throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'PascalCaseBad'
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property with an invalid default value type throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: function () {}
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property with a non boolean fireEvent parameter throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: false,
                fireEvent: 'I am a string'
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property with a non boolean addNonSignalingProperty parameter throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: false,
                addNonSignalingProperty: 'I am a string'
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property with a non boolean preventAttributeSync parameter throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: false,
                preventAttributeSync: 'I am a string'
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a boolean default value of true throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: true
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding an object default value that is an array throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: []
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding an object default value with only one value throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: {myNum: 42}
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding an object default value with a non boolean, string, or number value throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'test',
                defaultValue: {myNum: {}}
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property to the prototype when a property of the same name already exists throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.testProp = 'I am already here';

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'testProp',
                defaultValue: 42
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property to the prototype when a private property of the same name already exists throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto._testProp = 'I am already here';

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'testProp',
                defaultValue: 42
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('adding a property to the prototype when a non signaling property of the same name already exists throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.testPropNonSignaling = 'I am already here';

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'testProp',
                defaultValue: 42
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).toThrow();
    });

    it('defining the element info twice throws an exception', function () {
        var parent = NationalInstruments.HtmlVI.Elements.NIElement,
            proto = Object.create(parent.prototype),
            performDefinition;

        proto.addAllProperties = function (targetPrototype) {
            parent.prototype.addAllProperties.call(this, targetPrototype);
            proto.addProperty(targetPrototype, {
                propertyName: 'testProp',
                defaultValue: 42
            });
        };

        performDefinition = function () {
            proto.defineElementInfo(proto, 'ni-test-one', 'HTMLNITestOne');
        };

        expect(performDefinition).not.toThrow();
        expect(performDefinition).toThrow();
    });

});
