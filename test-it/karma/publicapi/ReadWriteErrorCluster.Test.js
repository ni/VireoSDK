describe('The Vireo EggShell public api can', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiReadWriteJSONViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ReadWriteErrorCluster.via');
    var viName = 'MyVI';

    var readValue = function (valueRef) {
        var json = vireo.eggShell.readJSON(valueRef);
        return JSON.parse(json);
    };

    var readSubValue = function (valueRef, path) {
        var subValueRef = vireo.eggShell.findSubValueRef(valueRef, path);
        return readValue(subValueRef);
    };

    var writeValue = function (valueRef, value) {
        var json = JSON.stringify(value);
        vireo.eggShell.writeJSON(valueRef, json);
    };

    var writeSubValue = function (valueRef, subPath, value) {
        var subValueRef = vireo.eggShell.findSubValueRef(valueRef, subPath);
        writeValue(subValueRef, value);
    };

    var errorValue = {
        status: true,
        code: 12345,
        source: 'Is this just fantasy?'
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiReadWriteJSONViaUrl
        ], done);
    });

    beforeEach(function () {
        vireo = new Vireo();
        vireoRunner.rebootAndLoadVia(vireo, publicApiReadWriteJSONViaUrl);
    });

    var testCases = [
        {
            testName: 'error cluster with no default values',
            path: 'uninitializedError'
        },
        {
            testName: 'error cluster with default values',
            path: 'initializedError'
        },
        {
            testName: 'expanded error cluster with default values',
            path: 'initializedExpandedError'
        },
        {
            testName: 'expanded error cluster with no default values',
            path: 'expandedError'
        }
    ];

    describe('write JSON and read each field with findSubValueRef of', function () {
        testCases.forEach(function (testConfig) {
            it(testConfig.testName, function () {
                var valueRef = vireo.eggShell.findValueRef(viName, testConfig.path);
                writeValue(valueRef, errorValue);

                expect(readSubValue(valueRef, 'status')).toEqual(errorValue.status);
                expect(readSubValue(valueRef, 'code')).toEqual(errorValue.code);
                expect(readSubValue(valueRef, 'source')).toEqual(errorValue.source);

                expect(readValue(valueRef)).toEqual(errorValue);
            });
        });
    });

    describe('write JSON and read each field with valueRefObject of', function () {
        testCases.forEach(function (testConfig) {
            it(testConfig.testName, function () {
                var valueRef = vireo.eggShell.findValueRef(viName, testConfig.path);
                writeValue(valueRef, errorValue);
                var valueRefObject = vireo.eggShell.readValueRefObject(valueRef);

                expect(readValue(valueRefObject.status)).toEqual(errorValue.status);
                expect(readValue(valueRefObject.code)).toEqual(errorValue.code);
                expect(readValue(valueRefObject.source)).toEqual(errorValue.source);

                expect(readValue(valueRef)).toEqual(errorValue);
            });
        });
    });

    describe('write and read each field with valueRefObject of', function () {
        testCases.forEach(function (testConfig) {
            it(testConfig.testName, function () {
                var valueRef = vireo.eggShell.findValueRef(viName, testConfig.path);
                var valueRefObject = vireo.eggShell.readValueRefObject(valueRef);

                writeValue(valueRefObject.status, errorValue.status);
                writeValue(valueRefObject.code, errorValue.code);
                writeValue(valueRefObject.source, errorValue.source);

                expect(readValue(valueRefObject.status)).toEqual(errorValue.status);
                expect(readValue(valueRefObject.code)).toEqual(errorValue.code);
                expect(readValue(valueRefObject.source)).toEqual(errorValue.source);

                expect(readValue(valueRef)).toEqual(errorValue);
            });
        });
    });

    describe('write and read each field with findSubValueRef of', function () {
        testCases.forEach(function (testConfig) {
            it(testConfig.testName, function () {
                var valueRef = vireo.eggShell.findValueRef(viName, testConfig.path);

                writeSubValue(valueRef, 'status', errorValue.status);
                writeSubValue(valueRef, 'code', errorValue.code);
                writeSubValue(valueRef, 'source', errorValue.source);

                expect(readSubValue(valueRef, 'status')).toEqual(errorValue.status);
                expect(readSubValue(valueRef, 'code')).toEqual(errorValue.code);
                expect(readSubValue(valueRef, 'source')).toEqual(errorValue.source);

                expect(readValue(valueRef)).toEqual(errorValue);
            });
        });
    });
});
