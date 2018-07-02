describe('The Vireo PropertyNode', function () {
    'use strict';

    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo, spy, runSlicesAsync;

    var publicApiPropertyNodeWrite = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeWriteUnwiredError.via');
    var publicApiPropertyNodeRead = fixtures.convertToAbsoluteFromFixturesDir('propertynode/PropertyNodeReadUnwiredError.via');
    var propertyReadVIName = '%3AWeb%20Server%3AInteractive%3AWebApp%3AMain%2Egviweb';
    var propertyWriteVIName = 'MyVI';
    var propertyName = 'Value';

    var expectValidValueRef = function (valueRef) {
        expect(valueRef).toBeObject();
        expect(valueRef.typeRef).toBeDefined();
        expect(valueRef.dataRef).toBeDefined();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.dataRef).toBeNumber();
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiPropertyNodeRead,
            publicApiPropertyNodeWrite
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
    });

    describe('property read', function () {
        beforeEach(function () {
            spy = jasmine.createSpy();
            vireo.propertyNode.setPropertyReadFunction(spy);
        });

        it('callback is invoked with no wired error terminal', function (done) {
            var expectedControlRefs = [
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                '10',
                '11',
                '12',
                '13',
                '14',
                '15'
            ];

            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeRead);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();

                var callCount = spy.calls.count();
                for (var i = 0; i < callCount; i += 1) {
                    var args = spy.calls.argsFor(i);
                    expect(args[0]).toEqual(propertyReadVIName);
                    expect(args[1]).toEqual(expectedControlRefs[i]);
                    expect(args[2]).toEqual(propertyName);
                    expectValidValueRef(args[3]);
                }

                done();
            });
        });
    });

    describe('property write', function () {
        beforeEach(function () {
            spy = jasmine.createSpy();
            vireo.propertyNode.setPropertyReadFunction(spy);
        });

        it('callback is invoked with no wired error terminal', function (done) {
            var expectedControlRefs = [
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                '10',
                '11',
                '12',
                '13',
                '14',
                '15'
            ];

            runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiPropertyNodeWrite);
            runSlicesAsync(function (rawPrint, rawPrintError) {
                expect(rawPrint).toBeEmptyString();
                expect(rawPrintError).toBeEmptyString();

                var callCount = spy.calls.count();
                for (var i = 0; i < callCount; i += 1) {
                    var args = spy.calls.argsFor(i);
                    expect(args[0]).toEqual(propertyWriteVIName);
                    expect(args[1]).toEqual(expectedControlRefs[i]);
                    expect(args[2]).toEqual(propertyName);
                    expectValidValueRef(args[3]);
                }

                done();
            });
        });
    });
});
