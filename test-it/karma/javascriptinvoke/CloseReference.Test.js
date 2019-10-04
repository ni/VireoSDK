describe('A CloseReference instruction', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;

    var jsCloseReferenceViaUrl = fixtures.convertToAbsoluteFromFixturesDir('javascriptinvoke/CloseReference.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsCloseReferenceViaUrl
        ], done);
    });

    beforeEach(async function () {
        // TODO mraj create shared vireo instances to improve test perf https://github.com/ni/VireoSDK/issues/163
        vireo = await vireoHelpers.createInstance();

        window.NI_GetObjectFunction = function () {
            var person = {firstName: 'Peter', lastName: 'Jones', age: 35};
            return person;
        };

        window.NI_UseObjectFunction = function (value) {
            var success =
                typeof value === 'object' &&
                value.firstName === 'Peter' &&
                value.lastName === 'Jones' &&
                value.age === 35;
            return success;
        };
    });

    afterEach(function () {
        vireo = undefined;
        // Cleanup functions
        window.NI_GetObjectFunction = undefined;
        window.NI_UseObjectFunction = undefined;
    });

    it('successfully closes a JavaScript Dynamic Reference', function (done) {
        var viName = 'DynamicReferencesVI';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsCloseReferenceViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('getObjectReferenceError1.status')).toBeFalse();
            expect(viPathParser('getObjectReferenceError1.code')).toBe(0);
            expect(viPathParser('getObjectReferenceError1.source')).toBeEmptyString();
            expect(viPathParser('getObjectReferenceError2.status')).toBeFalse();
            expect(viPathParser('getObjectReferenceError2.code')).toBe(0);
            expect(viPathParser('getObjectReferenceError2.source')).toBeEmptyString();
            expect(viPathParser('noErrorInAndValidReferenceError.status')).toBeFalse();
            expect(viPathParser('noErrorInAndValidReferenceError.code')).toBe(0);
            expect(viPathParser('noErrorInAndValidReferenceError.source')).toBeEmptyString();
            expect(viPathParser('isNotAValidRefnum1')).toBeTrue();
            expect(viPathParser('errorInAndValidReferenceError.status')).toBeTrue();
            expect(viPathParser('errorInAndValidReferenceError.code')).toBe(100);
            expect(viPathParser('errorInAndValidReferenceError.source')).toBe('error');
            expect(viPathParser('isNotAValidRefnum2')).toBeTrue();
            expect(viPathParser('noErrorInAndInvalidReferenceError.status')).toBeTrue();
            expect(viPathParser('noErrorInAndInvalidReferenceError.code')).toBe(1556);
            expect(viPathParser('noErrorInAndInvalidReferenceError.source')).not.toBeEmptyString();
            expect(viPathParser('isNotAValidRefnum3')).toBeTrue();
            expect(viPathParser('errorInAndInvalidReferenceError.status')).toBeTrue();
            expect(viPathParser('errorInAndInvalidReferenceError.code')).toBe(100);
            expect(viPathParser('errorInAndInvalidReferenceError.source')).toBe('error');
            expect(viPathParser('isNotAValidRefnum4')).toBeTrue();
            done();
        });
    });

    it('does not close a JavaScript Static Reference', function (done) {
        var viName = 'StaticReferencesVI';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsCloseReferenceViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('getObjectReferenceError.status')).toBeFalse();
            expect(viPathParser('getObjectReferenceError.code')).toBe(0);
            expect(viPathParser('getObjectReferenceError.source')).toBeEmptyString();
            expect(viPathParser('noErrorInAndValidReferenceError.status')).toBeFalse();
            expect(viPathParser('noErrorInAndValidReferenceError.code')).toBe(0);
            expect(viPathParser('noErrorInAndValidReferenceError.source')).toBeEmptyString();
            expect(viPathParser('isNotAValidRefnum1')).toBeFalse();
            expect(viPathParser('errorInAndValidReferenceError.status')).toBeTrue();
            expect(viPathParser('errorInAndValidReferenceError.code')).toBe(100);
            expect(viPathParser('errorInAndValidReferenceError.source')).toBe('error');
            expect(viPathParser('isNotAValidRefnum2')).toBeFalse();
            done();
        });
    });

    it('makes a JavaScript Dynamic Reference invalid for further use', function (done) {
        var viName = 'InvalidReferenceParameterVI';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsCloseReferenceViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('getObjectReferenceError.status')).toBeFalse();
            expect(viPathParser('getObjectReferenceError.code')).toBe(0);
            expect(viPathParser('getObjectReferenceError.source')).toBeEmptyString();
            expect(viPathParser('closeReferenceError.status')).toBeFalse();
            expect(viPathParser('closeReferenceError.code')).toBe(0);
            expect(viPathParser('closeReferenceError.source')).toBeEmptyString();
            expect(viPathParser('isNotAValidRefnum1')).toBeTrue();
            expect(viPathParser('invalidReferenceError.status')).toBeTrue();
            expect(viPathParser('invalidReferenceError.code')).toBe(1556);
            expect(viPathParser('invalidReferenceError.source')).not.toBeEmptyString();
            done();
        });
    });

    it('can close an array of references of one dimension', function (done) {
        var viName = 'ArrayOfReferencesVI';
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsCloseReferenceViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        vireoRunner.enqueueVI(vireo, viName);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('getObjectReferenceError.status')).toBeFalse();
            expect(viPathParser('getObjectReferenceError.code')).toBe(0);
            expect(viPathParser('getObjectReferenceError.source')).toBeEmptyString();
            expect(viPathParser('closeReferenceError.status')).toBeFalse();
            expect(viPathParser('closeReferenceError.code')).toBe(0);
            expect(viPathParser('closeReferenceError.source')).toBeEmptyString();
            expect(viPathParser('isNotAValidRefnum1')).toBeTrue();
            expect(viPathParser('isNotAValidRefnum2')).toBeTrue();
            done();
        });
    });
});
