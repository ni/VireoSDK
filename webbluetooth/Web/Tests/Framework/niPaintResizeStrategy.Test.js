//******************************************
// Tests for NIPaintResizeStrategy
// National Instruments Copyright 2016
//******************************************

describe('A Paint Resize Strategy', function () {
    'use strict';

    var strategy,
        validBounds, invalidBounds,
        renderBuffer, invalidRenderBuffer,
        parentProto = NationalInstruments.HtmlVI.ResizeStrategy.prototype;

    beforeEach(function () {
        strategy = new NationalInstruments.HtmlVI.PaintResizeStrategy();
        validBounds = {top: 10, left: 10, width: 100, height: 100};
        invalidBounds = {};
        renderBuffer = new NationalInstruments.HtmlVI.RenderBuffer();
        invalidRenderBuffer = {};
    });

    it('constructs correctly', function () {
        expect(strategy).toBeDefined();
        expect(strategy.onBoundsChangeStarted).toBeDefined();
        expect(strategy.onBoundsChanging).toBeDefined();
        expect(strategy.onBoundsChangeEnd).toBeDefined();
    });

    it('extends from Resize Strategy', function () {
        expect(strategy instanceof NationalInstruments.HtmlVI.ResizeStrategy).toBe(true);
    });

    it('calling onBoundsChangeStarted with no parameters does not throw', function () {
        var callOnBoundsChangeStarted = function () {
            strategy.onBoundsChangeStarted();
        };

        expect(callOnBoundsChangeStarted).not.toThrow();
    });

    describe('calling onBoundsChanging', function () {

        it('calls parent onBoundsChanging', function () {
            spyOn(parentProto, 'onBoundsChanging');
            strategy.onBoundsChanging(validBounds, renderBuffer);
            expect(parentProto.onBoundsChanging).toHaveBeenCalled();
        });

        it('with valid bounds and renderBuffer, sets bounds to cssStyles properties directly', function () {
            var bounds = {left: 0, top: 0, width: 0, height: 0};
            var renderBuffer = new NationalInstruments.HtmlVI.RenderBuffer();
            var expectedStyle = {left: '0px', top: '0px', width: '0px', height: '0px'};

            strategy.onBoundsChanging(bounds, renderBuffer);

            expect(renderBuffer.cssStyles).toEqual(expectedStyle);
        });

    });

    it('calling onBoundsChangeEnd does not throw', function () {
        var callOnBoundsChangeEnd = function () {
            strategy.onBoundsChangeEnd();
        };

        expect(callOnBoundsChangeEnd).not.toThrow();
    });
});
