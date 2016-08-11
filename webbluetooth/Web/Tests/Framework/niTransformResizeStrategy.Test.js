//******************************************
// Tests for NITransformResizeStrategy
// National Instruments Copyright 2016
//******************************************
describe('A Transform Resize Strategy', function () {
    'use strict';

    var strategy,
        validBounds, invalidBounds,
        renderBuffer, invalidRenderBuffer,
        parentProto = NationalInstruments.HtmlVI.ResizeStrategy.prototype,
        TRANSFORM_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_CSS,
        TRANSFORM_ORIGIN_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_ORIGIN_CSS;

    beforeEach(function () {
        strategy = new NationalInstruments.HtmlVI.TransformResizeStrategy();
        validBounds = {left: 10, top: 10, width: 100, height: 100};
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

        describe('with valid parameters', function () {

            beforeEach(function () {
                var callOnBoundsChangeStarted = function () {
                    strategy.onBoundsChangeStarted(validBounds, renderBuffer);
                };

                expect(callOnBoundsChangeStarted).not.toThrow();
            });

            it('saves bounds correctly', function () {
                expect(strategy.oldBounds).toEqual(validBounds);
            });

            it('set renderBuffer transform correctly', function () {
                expect(renderBuffer.cssStyles[TRANSFORM_CSS]).toEqual('translateZ(0)');
            });

            it('sets boundsChangeStarted flag correctly', function () {
                expect(strategy.boundsChangeStarted).toBe(true);
            });

        });

    });

    describe('calling onBoundsChanging', function () {

        it('calls parent onBoundsChanging', function () {
            spyOn(parentProto, 'onBoundsChanging');
            strategy.onBoundsChanging(validBounds, renderBuffer);
            expect(parentProto.onBoundsChanging).toHaveBeenCalled();
        });

        it('sets bounds to renderBuffer if onBoundsChangeStarted was not called first', function () {

            var callOnBoundsChanging = function () {
                strategy.onBoundsChanging(validBounds, renderBuffer);
            };

            var oracleCssStyles = {top: '10px', left: '10px', width: '100px', height: '100px'};

            expect(callOnBoundsChanging).not.toThrow();
            expect(strategy.boundsChangeStarted).toBe(false);
            expect(renderBuffer.cssStyles).toEqual(oracleCssStyles);
        });

        describe('after onBoundsChangeStarted was called with valid parameters', function () {

            beforeEach(function () {
                strategy.onBoundsChangeStarted(validBounds, renderBuffer);
            });

            it('correctly calculates scale and position', function () {
                var newBounds = {top: 20, left: 20, width: 200, height: 200};
                var expectedCssStyles = {};
                expectedCssStyles[TRANSFORM_CSS] = 'translate3d(10px, 10px, 0) scale(2, 2)';
                expectedCssStyles[TRANSFORM_ORIGIN_CSS] = '0px 0px';

                strategy.onBoundsChanging(newBounds, renderBuffer);
                expect(renderBuffer.cssStyles).toEqual(expectedCssStyles);
            });
        });

    });

    describe('calling onBoundsChangeEnd', function () {

        it('calls parent onBoundsChangeEnd', function () {
            spyOn(parentProto, 'onBoundsChangeEnd');
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);
            expect(parentProto.onBoundsChangeEnd).toHaveBeenCalled();
        });

        it('sets bounds properties correctly to renderBuffer', function () {
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);

            var oracleCssStyles = {top: '10px', left: '10px', width: '100px', height: '100px'};
            oracleCssStyles[TRANSFORM_CSS] = 'none';

            expect(renderBuffer.cssStyles).toEqual(oracleCssStyles);
        });

        it('resets boundsChangeStarted flag', function () {
            strategy.onBoundsChangeStarted(validBounds, renderBuffer);
            expect(strategy.boundsChangeStarted).toBe(true);
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);
            expect(strategy.boundsChangeStarted).toBe(false);
        });

    });
});
