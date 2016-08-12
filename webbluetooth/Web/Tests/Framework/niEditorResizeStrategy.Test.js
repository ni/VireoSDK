//******************************************
// Tests for NIEditorResizeStrategy data type
// National Instruments Copyright 2016
//******************************************
describe('An Editor Resize Strategy', function () {
    'use strict';

    var strategy,
        validBounds, invalidBounds,
        renderBuffer, invalidRenderBuffer,
        parentProto = NationalInstruments.HtmlVI.ResizeStrategy.prototype,
        TRANSFORM_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_CSS,
        TRANSFORM_ORIGIN_CSS = NationalInstruments.HtmlVI.ResizeStrategy.ResizeCSS.TRANSFORM_ORIGIN_CSS;

    beforeEach(function () {
        strategy = new NationalInstruments.HtmlVI.EditorResizeStrategy();
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

        it('with valid parameters, saves bounds and sets transform correctly', function () {
            strategy.onBoundsChangeStarted(validBounds, renderBuffer);

            expect(strategy._oldBounds).toEqual(validBounds);
            // TODO: gleon this test 'will-change' (get it?) once we have Coherent40.
            expect(renderBuffer.cssStyles[TRANSFORM_CSS]).toEqual('translate3d(0, 0, 0)');
        });

    });

    describe('calling onBoundsChanging', function () {

        it('calls parent onBoundsChanging', function () {
            spyOn(parentProto, 'onBoundsChanging');
            strategy.onBoundsChanging(validBounds, renderBuffer);
            expect(parentProto.onBoundsChanging).toHaveBeenCalled();
        });

        describe('with valid parameters', function () {

            it('and onBoundsChangeStarted was NOT called before, sets bounds to cssStyles properties directly', function () {
                strategy.onBoundsChanging(validBounds, renderBuffer);
                var expectedStyle = {top: '10px', left: '10px', width: '100px', height: '100px'};

                expect(renderBuffer.cssStyles).toEqual(expectedStyle);
            });

            it('and onBoundsChangeStarted was called, calculates transforms correctly', function () {
                var newBounds = {top: 100, left: 100, width: 200, height: 200};
                var newRenderBuffer = new NationalInstruments.HtmlVI.RenderBuffer();
                strategy.onBoundsChangeStarted(validBounds, renderBuffer);
                strategy.onBoundsChanging(newBounds, newRenderBuffer);

                var expectedStyle = {width: '200px', height: '200px'};
                expectedStyle[TRANSFORM_CSS] = 'translate3d(90px, 90px, 0)';
                expectedStyle[TRANSFORM_ORIGIN_CSS] = '0px 0px';

                expect(newRenderBuffer.cssStyles).toEqual(expectedStyle);
            });

        });

    });

    describe('calling onBoundsChangeEnd', function () {

        it('calls parent onBoundsChangeEnd', function () {
            spyOn(parentProto, 'onBoundsChangeEnd');
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);
            expect(parentProto.onBoundsChangeEnd).toHaveBeenCalled();
        });

        it('with valid parameters, sets transform correctly into renderBuffer', function () {
            strategy.onBoundsChangeEnd(validBounds, renderBuffer);
            var oracleCssStyles = {top: '10px', left: '10px', width: '100px', height: '100px'};
            oracleCssStyles[TRANSFORM_CSS] = 'none';

            expect(renderBuffer.cssStyles).toEqual(oracleCssStyles);
            expect(strategy._oldBounds).toBeUndefined();
        });
    });
});
