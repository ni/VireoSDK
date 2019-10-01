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
            const person = { firstName: 'Peter', lastName: 'Jones', age: 35 };
            return person;
        };

        window.NI_UseObjectFunction = function (value) {
            const success =
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

    it('successfully closes a JavaScript Opaque Reference', function (done) {
        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsCloseReferenceViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');

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
            expect(viPathParser('noErrorInAndValidReferenceError.status')).toBeTrue();
            expect(viPathParser('noErrorInAndValidReferenceError.code')).toBe(100);
            expect(viPathParser('noErrorInAndValidReferenceError.source')).toBe('error');
            expect(viPathParser('isNotAValidRefnum2')).toBeTrue();
            expect(viPathParser('noErrorInAndInvalidReferenceError.status')).toBeTrue();
            expect(viPathParser('noErrorInAndInvalidReferenceError.code')).toBe(1556);
            expect(viPathParser('noErrorInAndInvalidReferenceError.source')).toBeNotEmpty();
            expect(viPathParser('isNotAValidRefnum3')).toBeTrue();
            expect(viPathParser('noErrorInAndInvalidReferenceError.status')).toBeTrue();
            expect(viPathParser('noErrorInAndInvalidReferenceError.code')).toBe(100);
            expect(viPathParser('noErrorInAndInvalidReferenceError.source')).toBe('error');
            expect(viPathParser('isNotAValidRefnum4')).toBeTrue();
            done();
        });
    });
});
