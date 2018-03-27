describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var publicApiPropertyNodeWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeWrite.via');
    var publicApiPropertyNodeRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeRead.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiPropertyNodeRead,
            publicApiPropertyNodeWrite
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    it('setPropertyReadFunction throws when trying to set not a function', function () {
        var notFunctions = [{}, [], '', 234, undefined, null];
        notFunctions.forEach(function (element) {
            var setPropertyReadFunction = function () {
                vireo.propertyNode.setPropertyReadFunction(element);
            };

            expect(setPropertyReadFunction).toThrowError(/callable function/);
        });
    });

    it('calls propertyRead', function (done) {
        var spy = jasmine.createSpy();
        vireo.propertyNode.setPropertyReadFunction(spy);

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(spy.calls.argsFor(0)).toEqual(['MyVI', '123', 'value', 'Boolean', 'MyVI.Locals.booleanLocal']);
            expect(spy.calls.argsFor(1)).toEqual(['MyVI', '123', 'value', 'String', 'MyVI.Locals.stringLocal']);
            expect(spy.calls.argsFor(2)).toEqual(['MyVI', '123', 'value', 'Double', 'MyVI.Locals.doubleLocal']);
            expect(spy.calls.argsFor(3)).toEqual(['MyVI', '123', 'value', 'Int32', 'MyVI.Locals.int32Local']);
            expect(spy.calls.argsFor(4)).toEqual(['MyVI', '123', 'value', 'UInt32', 'MyVI.Locals.uint32Local']);
            expect(spy.calls.argsFor(5)).toEqual(['MyVI', '123', 'value', 'ComplexDouble', 'MyVI.Locals.complexDoubleLocal']);
            expect(spy.calls.argsFor(6)).toEqual(['MyVI', '123', 'value', 'Timestamp', 'MyVI.Locals.timestampLocal']);
            done();
        });
    });

    it('propertyRead writes an error when external function throws', function (done) {
        var readFunction = function () {
            throw new Error('This is not good');
        };

        vireo.propertyNode.setPropertyReadFunction(readFunction);

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(1055);
            expect(viPathParser('error.source')).toMatch(/PropertyNodeRead in MyVI/);
            done();
        });
    });

    it('setPropertyWriteFunction throws when trying to set not a function', function () {
        var notFunctions = [{}, [], '', 234, undefined, null];
        notFunctions.forEach(function (element) {
            var setPropertyReadFunction = function () {
                vireo.propertyNode.setPropertyWriteFunction(element);
            };

            expect(setPropertyReadFunction).toThrowError(/callable function/);
        });
    });

    it('calls propertyWrite', function (done) {
        var spy = jasmine.createSpy();

        vireo.propertyNode.setPropertyWriteFunction(spy);

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(spy.calls.argsFor(0)).toEqual(['MyVI', '123', 'value', 'Boolean', 'MyVI.Locals.myBoolValue']);
            expect(spy.calls.argsFor(1)).toEqual(['MyVI', '123', 'value', 'String', 'MyVI.Locals.stringLocal']);
            expect(spy.calls.argsFor(2)).toEqual(['MyVI', '123', 'value', 'Double', 'MyVI.Locals.doubleLocal']);
            expect(spy.calls.argsFor(3)).toEqual(['MyVI', '123', 'value', 'Int32', 'MyVI.Locals.int32Local']);
            expect(spy.calls.argsFor(4)).toEqual(['MyVI', '123', 'value', 'UInt32', 'MyVI.Locals.uint32Local']);
            expect(spy.calls.argsFor(5)).toEqual(['MyVI', '123', 'value', 'ComplexDouble', 'MyVI.Locals.complexDoubleLocal']);
            expect(spy.calls.argsFor(6)).toEqual(['MyVI', '123', 'value', 'Timestamp', 'MyVI.Locals.timestampLocal']);
            done();
        });
    });

    it('propertyWrite writes an error when external function throws', function (done) {
        var writeFunction = function () {
            throw new Error('This is not good');
        };

        vireo.propertyNode.setPropertyWriteFunction(writeFunction);

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('error.status')).toBeTrue();
            expect(viPathParser('error.code')).toBe(1055);
            expect(viPathParser('error.source')).toMatch(/PropertyNodeWrite in MyVI/);
            done();
        });
    });
});
