//**************************************
// Tests for Render Engine
// National Instrumets Copyright 2014
//**************************************

describe('A Render Engine', function () {
    'use strict';

    var renderEngine = NationalInstruments.HtmlVI.RenderEngine;
    var testElement;

    beforeEach(function () {
        testElement = document.createElement('ni-test');
    });

    afterEach(function () {
        renderEngine.removeRenderBuffer(testElement);
    });

    describe('handles new RenderBuffers by', function () {
        var renderBuffer, renderBuffer2;

        it('creating a defined RenderBuffer', function () {
            renderBuffer = renderEngine.getOrAddRenderBuffer(testElement);
            expect(renderBuffer).toBeDefined();
        });

        it('returning the same RenderBuffer if already added', function () {
            renderBuffer = renderEngine.getOrAddRenderBuffer(testElement);
            renderBuffer2 = renderEngine.getOrAddRenderBuffer(testElement);

            expect(renderBuffer2).toBeDefined();
            expect(renderBuffer).toBe(renderBuffer2);
        });

        it('throwing error if is not a ni-element', function () {
            var getOrAddInvalidOperation = function () {
                var divElement = document.createElement('div');
                renderEngine.getOrAddRenderBuffer(divElement);
            };

            expect(getOrAddInvalidOperation).toThrow();
        });
    });

    describe('handles RenderBuffers removals by', function () {

        it('returning an added RenderBuffer', function () {
            var renderBuffer = renderEngine.getOrAddRenderBuffer(testElement);
            var renderBuffer2 = renderEngine.removeRenderBuffer(testElement);

            expect(renderBuffer).toBeDefined();
            expect(renderBuffer2).toBeDefined();
            expect(renderBuffer).toBe(renderBuffer2);
        });

        it('returning undefined buffer if element is not associated to a renderBuffer', function () {
            var emptyBuffer = renderEngine.removeRenderBuffer(testElement);
            expect(emptyBuffer).toBeUndefined();
        });

        it('throwing an error if is not a ni-element', function () {
            var removeInvalidOp = function () {
                var divElement = document.createElement('div');
                renderEngine.removeRenderBuffer(divElement);
            };

            expect(removeInvalidOp).toThrow();
        });

    });

    describe('enqueues an element', function () {
        var dummyElement = document.createElement('ni-test');

        var enqueueOperation = function () {
            renderEngine.enqueueDomUpdate(dummyElement);
        };

        it('and throws if render buffer was not added first', function () {
            expect(enqueueOperation).toThrow();
        });

        it('and throws if element is not a ni-element', function () {
            var enqueueInvalidOp = function () {
                var divElement = document.createElement('div');
                renderEngine.enqueueDomUpdate(divElement);
            };

            expect(enqueueInvalidOp).toThrow();
        });

        it('and does not request a frame if render buffer is empty', function () {
            expect(renderEngine.isFrameRequested()).toBe(false);

            var renderBuffer = renderEngine.getOrAddRenderBuffer(dummyElement);

            expect(renderBuffer.isEmpty()).toBe(true);
            expect(enqueueOperation).not.toThrow();
            expect(renderEngine.isFrameRequested()).toBe(false);
        });

        it('and requests a frame if render buffer was added first', function () {
            expect(renderEngine.isFrameRequested()).toBe(false);

            var renderBuffer = renderEngine.getOrAddRenderBuffer(dummyElement);
            renderBuffer.properties.booleanProp = true;
            expect(enqueueOperation).not.toThrow();
            expect(renderEngine.isFrameRequested()).toBe(true);
        });

        it('and values are propagated async to element', function (done) {
            expect(dummyElement.booleanProp).toBe(false); // Default Value;

            var renderBuffer = renderEngine.getOrAddRenderBuffer(dummyElement);
            renderBuffer.properties.booleanProp = true;
            expect(enqueueOperation).not.toThrow();
            testHelpers.runAsync(done, function () {
                expect(renderBuffer.isEmpty()).toBe(true);
                expect(renderEngine.isFrameRequested()).toBe(false);
                expect(dummyElement.booleanProp).toBe(true);
            });
        });

        it('and values are propagated async to lots of elements on next frame', function (done) {
            var elements = [], element;
            var renderBuffer;
            var numberOfElements = 42; // Sounds like a fun number.
            var i = 0;

            for (i = 0; i < numberOfElements; i++) {
                element = document.createElement('ni-test');
                renderBuffer = renderEngine.getOrAddRenderBuffer(element);
                renderBuffer.properties.booleanProp = true;
                elements.push(element);
                renderEngine.enqueueDomUpdate(element);
            }

            testHelpers.runAsync(done, function () {
                var unmodifiedElements = elements.filter(function (e) {
                    return e.booleanProp === false; // Return elements not affected.
                });

                expect(unmodifiedElements.length).toBe(0);
                expect(renderEngine.isFrameRequested()).toBe(false);
            });

        });
    });
});
