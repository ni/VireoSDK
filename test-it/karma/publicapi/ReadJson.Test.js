describe('The Vireo EggShell readJSON api can read', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');
    var viName = 'MyVI';

    var readTest = function (path, expectedVal) {
        var valJSON = vireo.eggShell.readJSON(viName, path);
        var val = JSON.parse(valJSON);
        expect(val).toMatchIEEE754Number(expectedVal);
    };

    var readTestWithJSON = function (path, expectedValJSON, expectedVal) {
        var valJSON = vireo.eggShell.readJSON(viName, path);
        expect(valJSON).toMatchIEEE754Number(expectedValJSON);

        var val = JSON.parse(valJSON);
        expect(val).toMatchIEEE754Number(expectedVal);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
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
            readTestWithJSON('dataItem_utf8sequence_lastinsequence4byte_lastpossibleutf8',
                '"\uFFFD"',
                '\uFFFD'
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Numeric64');
            var actual = JSON.parse(actualJSON);

            // TODO mraj 64-bit numeric representation should be returned as JSON strings to prevent loss of precision
            expect(actual).toBe(-1152921504606847000); // -1152921504606846976

            // TODO mraj when 64-bit values are returned with the correct type the following should be enabled
            expect(actual).not.toBe('-1152921504606846976');

            // TODO mraj can currently workaround by not parsing as json
            expect(vireo.eggShell.readJSON(viName, 'dataItem_Numeric64')).toBe('-1152921504606846976');
        });

        it('UInt64', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericU64');
            var actual = JSON.parse(actualJSON);

            // TODO mraj 64-bit numeric representation should be returned as JSON strings to prevent loss of precision
            expect(actual).toBe(18446744073709552000); // 18446744073709551615

            // TODO mraj when 64-bit values are returned with the correct type the following should be enabled
            expect(actual).not.toBe('18446744073709551615');

            // TODO mraj can currently workaround by not parsing as json
            expect(vireo.eggShell.readJSON(viName, 'dataItem_NumericU64')).toBe('18446744073709551615');
        });

        it('ComplexDouble', function () {
            readTest('dataItem_Complex', {
                real: 1337.73,
                imaginary: -9283.12
            });
        });

        it('Timestamp', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Timestamp');
            var actual = JSON.parse(actualJSON);

            // TODO mraj The timestamp components that are 64-bit numeric representation should be returned as JSON strings
            expect(actual).toEqual({
                seconds: 3564057536,
                fraction: 7811758927381449000 // 7811758927381448193
            });

            // TODO mraj when 64-bit values are returned with the correct type the following should be enabled
            expect(actual).not.toEqual({
                seconds: '3564057536',
                fraction: '7811758927381448193'
            });

            // TODO mraj can currently workaround by going to each component and not parsing as json
            expect(vireo.eggShell.readJSON(viName, 'dataItem_Timestamp.seconds')).toBe('3564057536');
            expect(vireo.eggShell.readJSON(viName, 'dataItem_Timestamp.fraction')).toBe('7811758927381448193');
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfInt64');
            var actual = JSON.parse(actualJSON);

            // TODO mraj the following test has loss of precision. When the scalar tests are fixed it can be deleted.
            expect(actual).toEqual([
                -8989,
                9090,
                36028797018963970, // 36028797018963968
                -72057594037927940 // -72057594037927936
            ]);

            // TODO mraj when the scalar test are fixed the following should be enabled
            expect(actual).not.toEqual([
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfTimestamp');
            var actual = JSON.parse(actualJSON);

            // TODO mraj the following test has loss of precision. When the scalar tests are fixed it can be deleted.
            expect(actual).toEqual([
                {
                    seconds: 3564057536,
                    fraction: 7811758927381449000 // 7811758927381448193
                }, {
                    seconds: 3564057542,
                    fraction: 16691056759750170000 // 16691056759750171331
                }
            ]);

            // TODO mraj when the scalar test are fixed the following should be enabled
            expect(actual).not.toEqual([
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfClusters');
            var actual = JSON.parse(actualJSON);

            // TODO mraj the following test has loss of precision. When the scalar tests are fixed it can be deleted.
            expect(actual).toEqual([
                {
                    bool: true,
                    string: 'first',
                    double: 3.14159,
                    int32: 42,
                    int64: 72057594037927940, // 72057594037927936
                    complex: {
                        real: 3.4,
                        imaginary: -5.9
                    },
                    time: {
                        seconds: 3564057536,
                        fraction: 7811758927381449000 // 7811758927381448193
                    }
                },
                {
                    bool: false,
                    string: 'second',
                    double: 6.2831,
                    int32: 84,
                    int64: 72057594037927940, // 72057594037927939
                    complex: {
                        real: 4.567,
                        imaginary: 0.5
                    },
                    time: {
                        seconds: 3564059871,
                        fraction: 7811758927381449000 // 7811758927381448217
                    }
                },
                {
                    bool: true,
                    string: 'third',
                    double: 2.71828,
                    int32: 144,
                    int64: -72057594037927940, // -72057594037927942
                    complex: {
                        real: 1.4142,
                        imaginary: 0.7071
                    },
                    time: {
                        seconds: 3566659871,
                        fraction: 7811758927381447000 // 7811758927381446667
                    }
                }
            ]);

            // TODO mraj when the scalar test are fixed the following should be enabled
            expect(actual).not.toEqual([
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_2DArrayOfInt64');
            var actual = JSON.parse(actualJSON);

            // TODO mraj the following test has loss of precision. When the scalar tests are fixed it can be deleted.
            expect(actual).toEqual([
                [9090],
                [36028797018963970], // 36028797018963968
                [-72057594037927940] // -72057594037927936
            ]);

            // TODO mraj when the scalar test are fixed the following should be enabled
            expect(actual).not.toEqual([
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_2DArrayOfTimestamp');
            var actual = JSON.parse(actualJSON);

            // TODO mraj the following test has loss of precision. When the scalar tests are fixed it can be deleted.
            expect(actual).toEqual([
                [
                    {
                        seconds: 3564057536,
                        fraction: 7811758927381449000 // 7811758927381448193
                    }, {
                        seconds: 3564057542,
                        fraction: 16691056759750170000 // 16691056759750171331
                    }
                ],
                [
                    {
                        seconds: 3564059871,
                        fraction: 7811758927381449000 // 7811758927381448217
                    }, {
                        seconds: 3564057536,
                        fraction: 7811758927381449000 // 7811758927381448193
                    }
                ],
                [
                    {
                        seconds: 3566659871,
                        fraction: 7811758927381447000 // 7811758927381446667
                    }, {
                        seconds: 3566659871,
                        fraction: 7811758927381447000 // 7811758927381446667
                    }
                ]
            ]);

            // TODO mraj when the scalar test are fixed the following should be enabled
            expect(actual).not.toEqual([
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ClusterOfScalars');
            var actual = JSON.parse(actualJSON);

            // TODO mraj the following test has loss of precision. When the scalar tests are fixed it can be deleted.
            expect(actual).toEqual({
                bool: true,
                string: 'first',
                double: 3.14159,
                int32: 42,
                int64: -72057594037927940, // -72057594037927936
                uint64: 9223372041149743000, // 9223372041149743104
                complex: {
                    real: 3.4,
                    imaginary: -5.9
                },
                time: {
                    seconds: 3564057536,
                    fraction: 7811758927381449000 // 7811758927381448193
                }
            });

            // TODO mraj when the scalar test are fixed the following should be enabled
            expect(actual).not.toEqual({
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ClusterOfArrays');
            var actual = JSON.parse(actualJSON);

            // TODO mraj the following test has loss of precision. When the scalar tests are fixed it can be deleted.
            expect(actual).toEqual({
                booleans: [true, false, true],
                strings: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
                doubles: [1.2, 3.4, 5.6, 7.89, 1234.5678],
                int32s: [-1000, -10, 42, 9876543, 123],
                int64s: [
                    -8989,
                    9090,
                    36028797018963970, // 36028797018963968
                    -72057594037927940 // -72057594037927936
                ],
                uint64s: [
                    9223372041149743000, // 9223372041149743104
                    0,
                    9223376434901287000 // 9223376434901286912
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
                        seconds: 3564057536,
                        fraction: 7811758927381449000 // 7811758927381448193
                    }, {
                        seconds: 3564057542,
                        fraction: 16691056759750170000 // 16691056759750171331
                    }
                ]
            });

            // TODO mraj when the scalar test are fixed the following should be enabled
            expect(actual).not.toEqual({
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
                    seconds: 300,
                    fraction: 123
                },
                dt: 8.8,
                Y: [5.5, 6.6, 7.7, 8.8] // eslint-disable-line id-length
            });
        });
    });
});
