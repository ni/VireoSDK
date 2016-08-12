//************************************************
// Tests for NILargeResizeStrategy
// National Instruments Copyright 2016
//************************************************
describe('A Large Resize Strategy', function () {
    'use strict';

    var strategy,
        validBounds, invalidBounds,
        renderBuffer, invalidRenderBuffer,
        parentProto = NationalInstruments.HtmlVI.ResizeStrategy.prototype,
        TRANSFORM_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_CSS,
        TRANSFORM_ORIGIN_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_ORIGIN_CSS;

    beforeEach(function () {
        strategy = new NationalInstruments.HtmlVI.LargeResizeStrategy();
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

        it('with valid parameters, sets renderBuffer properties correctly', function () {
            strategy.onBoundsChangeStarted(validBounds, renderBuffer);

            var expectedBoundsPainted = {top: 10, left: 10, width: 200, height: 200};
            var expectedStyle = {top: '10px', left: '10px', width: '200px', height: '200px'};
            expectedStyle[TRANSFORM_CSS] = 'translateZ(0) scale(0.5, 0.5)';
            expectedStyle[TRANSFORM_ORIGIN_CSS] = '0px 0px';

            expect(strategy.boundsPainted).toEqual(expectedBoundsPainted);
            expect(renderBuffer.cssStyles).toEqual(expectedStyle);
        });

    });

    describe('calling onBoundsChanging', function () {

        it('calls parent onBoundsChanging', function () {
            spyOn(parentProto, 'onBoundsChanging');
            strategy.onBoundsChanging(validBounds, renderBuffer);
            expect(parentProto.onBoundsChanging).toHaveBeenCalled();
        });

        it('with valid parameters sets bounds to cssStyles properties directly', function () {
            var expectedStyle = {left: '10px', top: '10px', width: '100px', height: '100px'};
            strategy.onBoundsChanging(validBounds, renderBuffer);
            expect(renderBuffer.cssStyles).toEqual(expectedStyle);
        });

        it('with valid parameters after calling onBoundsChangeStarted, sets a transform correctly', function () {
            var newBounds = {top: 20, left: 20, width: 150, height: 150};
            var newRenderBuffer = new NationalInstruments.HtmlVI.RenderBuffer();

            strategy.onBoundsChangeStarted(validBounds, renderBuffer);
            strategy.onBoundsChanging(newBounds, newRenderBuffer);

            var expectedStyle = {};
            expectedStyle[TRANSFORM_CSS] = 'translate3d(10px,10px,0) scale(0.75, 0.75)';
            expectedStyle[TRANSFORM_ORIGIN_CSS] = '0px 0px';

            expect(newRenderBuffer.cssStyles).toEqual(expectedStyle);
        });

    });

    describe('calling onBoundsChangeEnd does not throw', function () {

        it('calls parents implementation', function () {
            spyOn(parentProto, 'onBoundsChangeEnd');
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);
            expect(parentProto.onBoundsChangeEnd).toHaveBeenCalled();
        });

        it('with valid parameters, sets bounds directly and clears transforms', function () {
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);

            var expectedStyle = {top: '10px', left: '10px', width: '100px', height: '100px'};
            expectedStyle[TRANSFORM_CSS] = 'none';
            expect(renderBuffer.cssStyles).toEqual(expectedStyle);
        });
    });
});
