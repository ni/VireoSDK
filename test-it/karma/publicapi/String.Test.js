describe('The Vireo EggShell String api can', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var readString = function (path) {
        return vireo.eggShell.readString(vireo.eggShell.findValueRef(viName, path));
    };

    var tryReadString = function (path) {
        return function () {
            readString(path);
        };
    };

    var readTest = function (path, result) {
        expect(readString(path)).toBe(result);
    };

    var writeString = function (path, str) {
        vireo.eggShell.writeString(vireo.eggShell.findValueRef(viName, path), str);
    };

    var tryWriteString = function (path, value) {
        return function () {
            writeString(path, value);
        };
    };

    var writeTest = function (path, initialValue, newValue) {
        expect(readString(path)).toBe(initialValue);
        writeString(path, newValue);
        expect(readString(path)).toBe(newValue);
        writeString(path, initialValue);
        expect(readString(path)).toBe(initialValue);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    describe('use readString', function () {
        it('to throw on unsupported types', function () {
            expect(tryReadString('dataItem_NumericDouble')).toThrowError(/UnexpectedObjectType/);
        });

        it('String', function () {
            readTest('dataItem_String', 'Hello');
        });

        it('String Control Characters', function () {
            readTest('dataItem_StringControlCharacters',
                '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A\u000B\u000C\u000D\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F'
            );
        });

        it('String Other JSON Escaped Characters', function () {
            readTest('dataItem_StringOtherJSONEscapedCharacters',
                '\\"'
            );
        });

        it('String UTF-8 sequence ranges', function () {
            readTest('dataItem_utf8sequence_firstinsequence1byte',
                '\x00'
            );
            readTest('dataItem_utf8sequence_firstinsequence2byte',
                '\u0080'
            );
            readTest('dataItem_utf8sequence_firstinsequence3byte',
                '\u0800'
            );
            readTest('dataItem_utf8sequence_firstinsequence4byte',
                '\uD800\uDC00'
            );
            readTest('dataItem_utf8sequence_firstinsequence5byte',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_lastinsequence1byte',
                '\u007F'
            );
            readTest('dataItem_utf8sequence_lastinsequence2byte',
                '\u07FF'
            );
            readTest('dataItem_utf8sequence_lastinsequence3byte',
                '\uFFFF'
            );
            readTest('dataItem_utf8sequence_lastinsequence4byte_lastvalidunicode',
                '\uDBFF\uDFFF'
            );
            readTest('dataItem_utf8sequence_lastinsequence4byte_firsthighinvalidutf8',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_lastinsequence4byte_lasthighinvalidutf8',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
        });

        it('String UTF-8 around surrogate border', function () {
            readTest('dataItem_utf8sequence_lastbeforesurrogate',
                '\uD7FF'
            );
            readTest('dataItem_utf8sequence_firstinsurrogate',
                '\uD800'
            );
            readTest('dataItem_utf8sequence_lastinsurrogate',
                '\uDFFF'
            );
            readTest('dataItem_utf8sequence_firstaftersurrogate',
                '\uE000'
            );
        });

        it('Invalid continuation bytes', function () {
            readTest('dataItem_utf8sequence_firstcontinuationbyte',
                '\uFFFD'
            );
            readTest('dataItem_utf8sequence_lastcontinuationbyte',
                '\uFFFD'
            );
            readTest('dataItem_utf8sequence_2continuationbytes',
                '\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_3continuationbytes',
                '\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_4continuationbytes',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_5continuationbytes',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_6continuationbytes',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_7continuationbytes',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_allcontinuationbytes',
                Array(65).join('\uFFFD')
            );
        });

        it('Invalid start bytes', function () {
            readTest('dataItem_utf8sequence_allstartbytesfor2bytes',
                Array(33).join('\uFFFD ').trim()
            );
            readTest('dataItem_utf8sequence_allstartbytesfor3bytes',
                Array(17).join('\uFFFD ').trim()
            );
            readTest('dataItem_utf8sequence_allstartbytesfor4bytes',
                Array(9).join('\uFFFD ').trim()
            );
            readTest('dataItem_utf8sequence_allstartbytesfor5bytes',
                Array(5).join('\uFFFD ').trim()
            );
            readTest('dataItem_utf8sequence_allstartbytesfor6bytes',
                Array(3).join('\uFFFD ').trim()
            );
        });

        it('Missing last byte in sequence', function () {
            readTest('dataItem_utf8sequence_2bytesequencewithlastbytemissing',
                '\uFFFD'
            );
            readTest('dataItem_utf8sequence_3bytesequencewithlastbytemissing',
                '\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_4bytesequencewithlastbytemissing',
                '\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_concatenatedtruncatedsequences',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
        });

        it('Impossible UTF-8 sequences', function () {
            readTest('dataItem_utf8sequence_impossible1',
                '\uFFFD'
            );
            readTest('dataItem_utf8sequence_impossible2',
                '\uFFFD'
            );
            readTest('dataItem_utf8sequence_impossible3',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
        });

        it('Overlong UTF-8 sequences', function () {
            readTest('dataItem_utf8sequence_overlongnull2byte',
                '\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_overlongnull3byte',
                '\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_overlongnull4byte',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_overlonglargest2byte',
                '\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_overlonglargest3byte',
                '\uFFFD\uFFFD\uFFFD'
            );
            readTest('dataItem_utf8sequence_overlonglargest4byte',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
        });
    });

    describe('use writeString', function () {
        it('to throw on unsupported types', function () {
            expect(tryWriteString('dataItem_NumericDouble', 'Test')).toThrowError(/UnexpectedObjectType/);
            expect(tryWriteString('dataItem_String', 42)).toThrowError(/type string/);
        });

        it('to write different string values from memory', function () {
            writeTest('dataItem_String', 'Hello', 'Hello World! :D');
            writeTest('dataItem_String', 'Hello', 'Iñtërnâtiônàlizætiøn☃💩');
        });

        it('String Control Characters', function () {
            writeTest('dataItem_String', 'Hello',
                '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A\u000B\u000C\u000D\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F'
            );
        });
    });
});
