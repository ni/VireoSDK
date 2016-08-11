//******************************************
// Tests for NIResizeStrategy data type
// National Instruments Copyright 2016
//******************************************

describe('A Resize Strategy', function () {
    'use strict';

    var strategy,
        validBounds, validRenderBuffer,
        invalidBounds, invalidRenderBuffer;

    beforeEach(function () {
        strategy = new NationalInstruments.HtmlVI.ResizeStrategy();
        invalidBounds = {};
        invalidRenderBuffer = {};
        validBounds = {top: 10, left: 10, width: 100, height: 100};
        validRenderBuffer = new NationalInstruments.HtmlVI.RenderBuffer();
    });

    it('constructs correctly', function () {
        expect(strategy).toBeDefined();
        expect(strategy.onBoundsChangeStarted).toBeDefined();
        expect(strategy.onBoundsChanging).toBeDefined();
        expect(strategy.onBoundsChangeEnd).toBeDefined();
    });

    describe('calling onBoundsChangeStarted', function () {
        it('with no arguments throws', function () {
            var callOnBoundsChangeStarted = function () {
                strategy.onBoundsChangeStarted();
            };

            expect(callOnBoundsChangeStarted).toThrow();
        });

        it('with invalid bounds throws', function () {
            var callOnBoundsChangeStarted = function () {
                strategy.onBoundsChangeStarted(invalidBounds, validRenderBuffer);
            };

            expect(callOnBoundsChangeStarted).toThrow();
        });

        it('with invalid renderBuffer throws', function () {
            var callOnBoundsChangeStarted = function () {
                strategy.onBoundsChangeStarted(validBounds, invalidRenderBuffer);
            };

            expect(callOnBoundsChangeStarted).toThrow();
        });

        it('with valid parameters, sets boundsChangeStarted flag', function () {
            var callOnBoundsChangeStarted = function () {
                strategy.onBoundsChangeStarted(validBounds, validRenderBuffer);
            };

            expect(callOnBoundsChangeStarted).not.toThrow();
            expect(strategy.boundsChangeStarted).toBe(true);
        });
    });

    describe('calling onBoundsChanging throws Error', function () {
        it('with no arguments throws', function () {
            var callOnBoundsChanging = function () {
                strategy.onBoundsChanging();
            };

            expect(callOnBoundsChanging).toThrow();
        });

        it('with invalid bounds throws', function () {
            var callOnBoundsChanging = function () {
                strategy.onBoundsChanging(invalidBounds, validRenderBuffer);
            };

            expect(callOnBoundsChanging).toThrow();
        });

        it('with invalid renderBuffer throws', function () {
            var callOnBoundsChanging = function () {
                strategy.onBoundsChanging(validBounds, invalidRenderBuffer);
            };

            expect(callOnBoundsChanging).toThrow();
        });
    });

    describe('calling onBoundsChangeEnd throws Error', function () {
        it('with no arguments throws', function () {
            var callOnBoundsChangeEnd = function () {
                strategy.onBoundsChangeEnd();
            };

            expect(callOnBoundsChangeEnd).toThrow();
        });

        it('with invalid bounds throws', function () {
            var callOnBoundsChangeEnd = function () {
                strategy.onBoundsChangeEnd(invalidBounds, validRenderBuffer);
            };

            expect(callOnBoundsChangeEnd).toThrow();
        });

        it('with invalid renderBuffer throws', function () {
            var callOnBoundsChangeEnd = function () {
                strategy.onBoundsChangeEnd(validBounds, invalidRenderBuffer);
            };

            expect(callOnBoundsChangeEnd).toThrow();
        });

        it('with valid parameters, set boundsChangeStarted flag to false', function () {
            var callOnBoundsChangeEnd = function () {
                strategy.onBoundsChangeEnd(validBounds, validRenderBuffer);
            };

            expect(callOnBoundsChangeEnd).not.toThrow();
            expect(strategy.boundsChangeStarted).toBe(false);
        });
    });

    it('setting bounds to render buffer', function () {
        strategy.setBoundsToRenderBuffer(validBounds, validRenderBuffer);

        var expectedCssStyles = {top: '10px', left: '10px', width: '100px', height: '100px'};

        expect(validRenderBuffer.cssStyles).toEqual(expectedCssStyles);
    });
});
