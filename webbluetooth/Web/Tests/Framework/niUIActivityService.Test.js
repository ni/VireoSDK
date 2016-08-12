//****************************************
// Tests for niUIActivityService file
// National Instruments Copyright 2014
//****************************************

describe('The niUIActivityService', function () {
    'use strict';
    var $ = NationalInstruments.Globals.jQuery;

    var element1;
    // -------------------------------------------------
    // Testing functions
    // -------------------------------------------------

    var createElement = function (id) {
        var element = document.createElement('div');
        element.id = id;
        element.setAttribute('style', 'border: solid 1px black; height: 100px; width: 100px;');
        document.body.appendChild(element);
        return element;
    };

    var removeElement = function (id) {
        var element = document.getElementById(id);
        element.parentNode.removeChild(element);
    };

    beforeEach(function () {
        element1 = createElement('test1');
    });

    afterEach(function () {
        removeElement('test1');
        element1 = undefined;
    });

    it('prevents calling register without parameters', function () {
        var test = function () {
            NationalInstruments.HtmlVI.UIActivityService.register();
        };

        expect(test).toThrow();
    });

    it('prevents calling register without a dom element', function () {
        var test = function () {
            NationalInstruments.HtmlVI.UIActivityService.register({
                element: 'this is a string, not a DOM Element'
            });
        };

        expect(test).toThrow();
    });

    it('prevents calling register without a string id', function () {
        var test = function () {
            NationalInstruments.HtmlVI.UIActivityService.register({
                element: element1,
                id: undefined //this is a number, not a string
            });
        };

        expect(test).toThrow();
    });

    it('prevents calling register without a string id', function () {
        var test = function () {
            NationalInstruments.HtmlVI.UIActivityService.register({
                element: element1,
                id: element1.id //this is a number, not a string
            });
        };

        expect(test).toThrow();
    });

    it('prevents trying to unregister an activity id that has not yet been registered', function () {
        var test = function () {
            NationalInstruments.HtmlVI.UIActivityService.unregister('happyHappyHamsterDanceTime');
        };

        expect(test).toThrow();
    });

    it('fires the unregister callback when the activity is unregistered', function () {
        var calls = 0;
        NationalInstruments.HtmlVI.UIActivityService.register({
            element: element1,
            id: element1.id,
            unregistered: function () {
                calls = calls + 1;
            }
        });

        NationalInstruments.HtmlVI.UIActivityService.unregister(element1.id);
        expect(calls).toBe(1);
    });

    it('fires the move callback when a mouse down, move, and mouse up are performed in sequence', function () {
        var calls = 0;
        var jqel = $('#' + element1.id);

        NationalInstruments.HtmlVI.UIActivityService.register({
            element: element1,
            id: element1.id,
            move: function () {
                calls = calls + 1;
            }
        });

        jqel.simulate('drag', {
            moves: 1,
            dx: 10
        });

        expect(calls).not.toBe(0);
    });

    it('prevents starting the same non-atomic activity twice in a row', function () {
        var calls = 0;
        var jqel = $('#' + element1.id);

        NationalInstruments.HtmlVI.UIActivityService.register({
            element: element1,
            id: element1.id,
            down: function () {
                calls = calls + 1;
            },
            up: function () {} // up registered to make non-atomic
        });

        jqel.simulate('mousedown');
        jqel.simulate('mousedown');

        expect(calls).toBe(1);
    });

    it('cancels an existing non-atomic activity if a new activity is started', function () {
        var element1Calls = 0;
        var jqel1 = $('#' + element1.id);

        var element2 = createElement('test2');
        var element2Calls = 0;
        var jqel2 = $('#' + element2.id);

        NationalInstruments.HtmlVI.UIActivityService.register({
            element: element1,
            id: element1.id,
            cancelled: function () {
                element1Calls = element1Calls + 1;
            },
            up: function () {} // up registered to make non-atomic
        });

        NationalInstruments.HtmlVI.UIActivityService.register({
            element: element2,
            id: element2.id,
            cancelled: function () {
                element2Calls = element2Calls + 1;
            },
            up: function () {} // up registered to make non-atomic
        });

        jqel1.simulate('mousedown');
        jqel2.simulate('mousedown');
        NationalInstruments.HtmlVI.UIActivityService.unregister(element1.id);
        NationalInstruments.HtmlVI.UIActivityService.unregister(element2.id);

        expect(element1Calls).toBe(1);
        expect(element2Calls).toBe(1);

        removeElement('test2');
    });

});
