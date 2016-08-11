//***********************************************
// Tests for NIRepaintResizeStrategy
// National Instruments Copyright 2016
//***********************************************
describe('A Repaint Resize Strategy', function () {
    'use strict';

    var strategy,
        validBounds, invalidBounds,
        renderBuffer, invalidRenderBuffer,
        parentProto = NationalInstruments.HtmlVI.ResizeStrategy.prototype,
        TRANSFORM_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_CSS,
        TRANSFORM_ORIGIN_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_ORIGIN_CSS;

    beforeEach(function () {
        strategy = new NationalInstruments.HtmlVI.RepaintResizeStrategy();
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

    describe('calling onBoundsChangeStarted', function () {

        it('calls parent onBoundsChangeStarted', function () {
            spyOn(parentProto, 'onBoundsChangeStarted');
            strategy.onBoundsChangeStarted(validBounds, renderBuffer);
            expect(parentProto.onBoundsChangeStarted).toHaveBeenCalled();
        });

        it('with valid parameters, saves bounds and set transform into renderBuffer', function () {
            var callOnBoundsChangeStarted = function () {
                strategy.onBoundsChangeStarted(validBounds, renderBuffer);
            };

            var expectedStyle = {};
            expectedStyle[TRANSFORM_CSS] = 'translateZ(0)';

            expect(callOnBoundsChangeStarted).not.toThrow();
            expect(strategy.scalingBounds).toEqual(validBounds);
            expect(renderBuffer.cssStyles).toEqual(expectedStyle);
        });

    });

    describe('calling onBoundsChanging', function () {

        it('calls parent onBoundsChanging', function () {
            spyOn(parentProto, 'onBoundsChanging');
            strategy.onBoundsChanging(validBounds, renderBuffer);
            expect(parentProto.onBoundsChanging).toHaveBeenCalled();
        });

        describe('with valid parameters', function () {

            it('when onBoundsChangeStarted was not called, sets bounds to cssStyles properties directly', function () {
                strategy.onBoundsChanging(validBounds, renderBuffer);
                var expectedStyle = {left: '10px', top: '10px', width: '100px', height: '100px'};

                expect(renderBuffer.cssStyles).toEqual(expectedStyle);
            });

            describe('when onBoundsChangeStarted was called and', function () {

                var newRenderBuffer;

                beforeEach(function () {
                    strategy.onBoundsChangeStarted(validBounds, renderBuffer);
                    newRenderBuffer = new NationalInstruments.HtmlVI.RenderBuffer();
                });

                it('new size is bigger and does NOT cross threshold, transforms are applied', function () {
                    // Default is 25%, in this example we are scaling up by 20%
                    var newBounds = {top: 10, left: 10, width: 120, height: 120};
                    strategy.onBoundsChanging(newBounds, renderBuffer);

                    var expectedStyle = {};
                    expectedStyle[TRANSFORM_CSS] = 'translate3d(0px, 0px, 0) scale(1.2, 1.2)';
                    expectedStyle[TRANSFORM_ORIGIN_CSS] = '0px 0px';

                    expect(renderBuffer.cssStyles).toEqual(expectedStyle);
                });

                it('new size is smaller and does NOT cross threshold, transforms are applied', function () {
                    // Default is 25%, in this example we are scaling down by 20%
                    var newBounds = {top: 10, left: 10, width: 80, height: 80};
                    strategy.onBoundsChanging(newBounds, renderBuffer);

                    var expectedStyle = {};
                    expectedStyle[TRANSFORM_CSS] = 'translate3d(0px, 0px, 0) scale(0.8, 0.8)';
                    expectedStyle[TRANSFORM_ORIGIN_CSS] = '0px 0px';

                    expect(renderBuffer.cssStyles).toEqual(expectedStyle);
                });

                it('new size Do cross threshold, transforms are cleared, bounds set directly to cssStyles and scalingBounds updated', function () {
                    // Default is 25%, in this example we are scaling up by 40%
                    var newBounds = {top: 10, left: 10, width: 140, height: 140};
                    strategy.onBoundsChanging(newBounds, renderBuffer);

                    var expectedStyle = {top: '10px', left: '10px', width: '140px', height: '140px'};
                    expectedStyle[TRANSFORM_CSS] = 'none';

                    expect(renderBuffer.cssStyles).toEqual(expectedStyle);
                    expect(strategy.scalingBounds).toEqual(newBounds);
                });

            });
        });

    });

    describe('calling onBoundsChangeEnd', function () {

        it('calls parent onBoundsChangeEnd', function () {
            spyOn(parentProto, 'onBoundsChangeEnd');
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);
            expect(parentProto.onBoundsChangeEnd).toHaveBeenCalled();
        });

        it('with valid parameters, clears transforms and sets bounds to renderBuffer directly', function () {
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);

            var expectedStyle = {left: '10px', top: '10px', width: '100px', height: '100px'};
            expectedStyle[TRANSFORM_CSS] = 'none';
            expect(renderBuffer.cssStyles).toEqual(expectedStyle);
            expect(strategy.scalingBounds).toBeUndefined();
        });
    });
});
