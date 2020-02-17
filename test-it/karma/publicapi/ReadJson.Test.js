// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('The Vireo EggShell readJSON api can read', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    afterAll(function () {
        vireo = undefined;
    });

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var readActualJSON = function (viName, path) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        var valJSON = vireo.eggShell.readJSON(valueRef);
        return valJSON;
    };

    var readTest = function (path, expectedVal) {
        var valJSON = readActualJSON(viName, path);
        var val = JSON.parse(valJSON);
        expect(val).toMatchIEEE754Number(expectedVal);
    };

    var readTestWithJSON = function (path, expectedValJSON, expectedVal) {
        var valJSON = readActualJSON(viName, path);
        expect(valJSON).toMatchIEEE754Number(expectedValJSON);

        var val = JSON.parse(valJSON);
        expect(val).toMatchIEEE754Number(expectedVal);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
        const {rawPrint, rawPrintError} = await runSlicesAsync();
        expect(rawPrint).toBe('');
        expect(rawPrintError).toBe('');
    });

    describe('scalars of type', function () {
        it('Boolean', function () {
            readTest('dataItem_Boolean', true);
        });

        it('String', function () {
            readTest('dataItem_String', 'Hello');
        });

        it('String Control Characters', function () {
            readTestWithJSON('dataItem_StringControlCharacters',
                '"\\u0000\\u0001\\u0002\\u0003\\u0004\\u0005\\u0006\\u0007\\b\\t\\n\\u000B\\f\\r\\u000E\\u000F\\u0010\\u0011\\u0012\\u0013\\u0014\\u0015\\u0016\\u0017\\u0018\\u0019\\u001A\\u001B\\u001C\\u001D\\u001E\\u001F"',
                '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\u000A\u000B\u000C\u000D\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A\u001B\u001C\u001D\u001E\u001F'
            );
        });

        it('String Other JSON Escaped Characters', function () {
            readTestWithJSON('dataItem_StringOtherJSONEscapedCharacters',
                '"\\\\\\""', // the JSON string is "\\\"" and to inline in JS we have to escape \
                '\\"'
            );
        });

        it('String UTF-8 sequence ranges', function () {
            readTestWithJSON('dataItem_utf8sequence_firstinsequence1byte',
                '"\\u0000"', // codepoint escaped in json
                '\x00'
            );
            readTestWithJSON('dataItem_utf8sequence_firstinsequence2byte',
                '"\u0080"',
                '\u0080'
            );
            readTestWithJSON('dataItem_utf8sequence_firstinsequence3byte',
                '"\u0800"',
                '\u0800'
            );
            readTestWithJSON('dataItem_utf8sequence_firstinsequence4byte',
                '"\uD800\uDC00"',
                '\uD800\uDC00'
            );
            readTestWithJSON('dataItem_utf8sequence_firstinsequence5byte',
                '"\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_lastinsequence1byte',
                '"\u007F"',
                '\u007F'
            );
            readTestWithJSON('dataItem_utf8sequence_lastinsequence2byte',
                '"\u07FF"',
                '\u07FF'
            );
            readTestWithJSON('dataItem_utf8sequence_lastinsequence3byte',
                '"\uFFFF"',
                '\uFFFF'
            );
            readTestWithJSON('dataItem_utf8sequence_lastinsequence4byte_lastvalidunicode',
                '"\uDBFF\uDFFF"',
                '\uDBFF\uDFFF'
            );
            readTestWithJSON('dataItem_utf8sequence_lastinsequence4byte_firsthighinvalidutf8',
                '"\uFFFD\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_lastinsequence4byte_lasthighinvalidutf8',
                '"\uFFFD\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
        });

        it('String UTF-8 around surrogate border', function () {
            readTestWithJSON('dataItem_utf8sequence_lastbeforesurrogate',
                '"\uD7FF"',
                '\uD7FF'
            );
            readTestWithJSON('dataItem_utf8sequence_firstinsurrogate',
                '"\uD800"',
                '\uD800'
            );
            readTestWithJSON('dataItem_utf8sequence_lastinsurrogate',
                '"\uDFFF"',
                '\uDFFF'
            );
            readTestWithJSON('dataItem_utf8sequence_firstaftersurrogate',
                '"\uE000"',
                '\uE000'
            );
        });

        it('Invalid continuation bytes', function () {
            readTestWithJSON('dataItem_utf8sequence_firstcontinuationbyte',
                '"\uFFFD"',
                '\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_lastcontinuationbyte',
                '"\uFFFD"',
                '\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_2continuationbytes',
                '"\uFFFD\uFFFD"',
                '\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_3continuationbytes',
                '"\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_4continuationbytes',
                '"\uFFFD\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_5continuationbytes',
                '"\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_6continuationbytes',
                '"\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_7continuationbytes',
                '"\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD"',
                '\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD'
            );
            readTestWithJSON('dataItem_utf8sequence_allcontinuationbytes',
                '"' + Array(65).join('\uFFFD') + '"',
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

        it('Double', function () {
            readTest('dataItem_NumericDouble', 123.456);
        });

        it('Double NaN', function () {
            readTestWithJSON('dataItem_NumericDoubleNaN',
                '"NaN"',
                'NaN'
            );
        });

        it('Double Positive Infinity', function () {
            readTestWithJSON('dataItem_NumericDoublePositiveInfinity',
                '"Infinity"',
                'Infinity'
            );
        });

        it('Double Negative Infinity', function () {
            readTestWithJSON('dataItem_NumericDoubleNegativeInfinity',
                '"-Infinity"',
                '-Infinity'
            );
        });

        it('Double Positive Zero', function () {
            readTest('dataItem_NumericDoublePositiveZero', 0);
        });

        it('Double Negative Zero', function () {
            readTest('dataItem_NumericDoubleNegativeZero', -0);
        });

        it('Int32', function () {
            readTest('dataItem_Numeric32', -1073741824);
        });

        it('Int64', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_Numeric64');
            var actual = JSON.parse(actualJSON);

            expect(actual).toBe('-1152921504606846976');
        });

        it('UInt64', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_NumericU64');
            var actual = JSON.parse(actualJSON);

            expect(actual).toBe('18446744073709551615');
        });

        it('ComplexDouble', function () {
            readTest('dataItem_Complex', {
                real: 1337.73,
                imaginary: -9283.12
            });
        });

        it('Timestamp', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_Timestamp');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual({
                seconds: '3564057536',
                fraction: '7811758927381448193'
            });
        });
    });

    describe('1D arrays of type', function () {
        it('Boolean', function () {
            readTest('dataItem_ArrayOfBoolean', [true, true, false, true, false]);
        });

        it('String', function () {
            readTest('dataItem_ArrayOfString', ['Lorem', 'ipsum', 'dolor', 'sit', 'amet']);
        });

        it('Double', function () {
            readTest('dataItem_ArrayOfDouble', [1.2, 3.4, 5.6, 7.89, 1234.5678]);
        });

        it('Int32', function () {
            readTest('dataItem_ArrayOfInt32', [-1000, -10, 42, 9876543, 123]);
        });

        it('Int64', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_ArrayOfInt64');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual([
                '-8989',
                '9090',
                '36028797018963968',
                '-72057594037927936'
            ]);
        });

        it('ComplexDouble', function () {
            readTest('dataItem_ArrayOfComplexDouble', [
                {
                    real: 0,
                    imaginary: 0
                }, {
                    real: 10,
                    imaginary: -10
                }, {
                    real: 5.045,
                    imaginary: -5.67
                }
            ]);
        });

        it('Timestamp', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_ArrayOfTimestamp');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual([
                {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }, {
                    seconds: '3564057542',
                    fraction: '16691056759750171331'
                }
            ]);
        });

        it('Cluster', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_ArrayOfClusters');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual([
                {
                    bool: true,
                    string: 'first',
                    double: 3.14159,
                    int32: 42,
                    int64: '72057594037927936',
                    complex: {
                        real: 3.4,
                        imaginary: -5.9
                    },
                    time: {
                        seconds: '3564057536',
                        fraction: '7811758927381448193'
                    }
                },
                {
                    bool: false,
                    string: 'second',
                    double: 6.2831,
                    int32: 84,
                    int64: '72057594037927939',
                    complex: {
                        real: 4.567,
                        imaginary: 0.5
                    },
                    time: {
                        seconds: '3564059871',
                        fraction: '7811758927381448217'
                    }
                },
                {
                    bool: true,
                    string: 'third',
                    double: 2.71828,
                    int32: 144,
                    int64: '-72057594037927942',
                    complex: {
                        real: 1.4142,
                        imaginary: 0.7071
                    },
                    time: {
                        seconds: '3566659871',
                        fraction: '7811758927381446667'
                    }
                }
            ]);
        });
    });

    describe('2D arrays of type', function () {
        it('Boolean', function () {
            readTest('dataItem_2DArrayOfBoolean', [
                [true, false],
                [false, false],
                [true, true]
            ]);
        });

        it('String', function () {
            readTest('dataItem_2DArrayOfString', [
                ['hello', 'world'],
                ['abcde', 'fg'],
                ['xyzzy', '']
            ]);
        });

        it('Double', function () {
            readTest('dataItem_2DArrayOfDouble', [
                [1.234, 2.345, 3.456],
                [-4.567, -5.678, -6.789]
            ]);
        });

        it('Int64', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_2DArrayOfInt64');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual([
                ['9090'],
                ['36028797018963968'],
                ['-72057594037927936']
            ]);
        });

        it('ComplexDouble', function () {
            readTest('dataItem_2DArrayOfComplex', [
                [
                    {
                        real: 1.4142,
                        imaginary: 0.7071
                    }, {
                        real: 10,
                        imaginary: -10
                    }
                ],
                [
                    {
                        real: 5.045,
                        imaginary: -5.67
                    }, {
                        real: 7.89,
                        imaginary: 1234.5678
                    }
                ]
            ]);
        });

        it('Timestamp', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_2DArrayOfTimestamp');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual([
                [
                    {
                        seconds: '3564057536',
                        fraction: '7811758927381448193'
                    }, {
                        seconds: '3564057542',
                        fraction: '16691056759750171331'
                    }
                ],
                [
                    {
                        seconds: '3564059871',
                        fraction: '7811758927381448217'
                    }, {
                        seconds: '3564057536',
                        fraction: '7811758927381448193'
                    }
                ],
                [
                    {
                        seconds: '3566659871',
                        fraction: '7811758927381446667'
                    }, {
                        seconds: '3566659871',
                        fraction: '7811758927381446667'
                    }
                ]
            ]);
        });
    });

    describe('3D arrays of', function () {
        it('Int32', function () {
            readTest('dataItem_3DArrayOfInt32', [
                [
                    [111, 112, 113],
                    [121, 122, 123]
                ],
                [
                    [211, 212, 213],
                    [221, 222, 223]
                ]
            ]);
        });
    });

    describe('composite types of', function () {
        it('clusters with scalars', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_ClusterOfScalars');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual({
                bool: true,
                string: 'first',
                double: 3.14159,
                int32: 42,
                int64: '-72057594037927936',
                uint64: '9223372041149743104',
                complex: {
                    real: 3.4,
                    imaginary: -5.9
                },
                time: {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }
            });
        });

        it('clusters with 1D arrays', function () {
            var actualJSON = readActualJSON(viName, 'dataItem_ClusterOfArrays');
            var actual = JSON.parse(actualJSON);

            expect(actual).toEqual({
                booleans: [true, false, true],
                strings: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
                doubles: [1.2, 3.4, 5.6, 7.89, 1234.5678],
                int32s: [-1000, -10, 42, 9876543, 123],
                int64s: [
                    '-8989',
                    '9090',
                    '36028797018963968',
                    '-72057594037927936'
                ],
                uint64s: [
                    '9223372041149743104',
                    '0',
                    '9223376434901286912'
                ],
                complexes: [
                    {
                        real: 0,
                        imaginary: 0
                    }, {
                        real: 10,
                        imaginary: -10
                    }, {
                        real: 5.045,
                        imaginary: -5.67
                    }
                ],
                times: [
                    {
                        seconds: '3564057536',
                        fraction: '7811758927381448193'
                    }, {
                        seconds: '3564057542',
                        fraction: '16691056759750171331'
                    }
                ]
            });
        });

        it('analog waveform of double', function () {
            readTest('wave_Double', {
                t0: {
                    seconds: '300',
                    fraction: '123'
                },
                dt: 8.8,
                Y: [5.5, 6.6, 7.7, 8.8],
                attributes: {_data: null, _attributes: {key1: {_data: 'hello', _attributes: null}, key2: {_data: 'hi', _attributes: null}}}
            });
        });

        it('empty arrays', function () {
            readTest('dataItem_Empty1DArray', []);
            readTest('dataItem_Empty2DArray', [[]]);
            readTest('dataItem_Empty3DArray', [[[]]]);
        });
    });

    describe('variants of type', function () {
        it('string', function () {
            readTest('variantOfString', {_data: 'hello world!', _attributes: null});
        });
    });
});
