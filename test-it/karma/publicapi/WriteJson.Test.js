describe('The Vireo EggShell writeJSON api can write', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();
    var viName = 'MyVI';

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');

    var writeTest = function (path, oldVal, newVal) {
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        var oldValJSON = vireo.eggShell.readJSON(valueRef);
        var oldValActual = JSON.parse(oldValJSON);
        expect(oldValActual).toMatchIEEE754Number(oldVal);

        // Have to manually replace negative zero, see test
        // 'but first interesting negative zero behaviors are verified'
        var newValToWriteJSON = JSON.stringify(newVal, function (key, value) {
            if (Object.is(value, -0)) {
                return '-0';
            }
            return value;
        });

        vireo.eggShell.writeJSON(viName, path, newValToWriteJSON);

        var newValueRef = vireo.eggShell.findValueRef(viName, path);
        var newValJSON = vireo.eggShell.readJSON(newValueRef);
        var newValActual = JSON.parse(newValJSON);
        if (typeof newValActual === 'string' && typeof newVal === 'number') {
            // we're writing as a JS number, but reading always returns a string.
            expect(newValActual).toMatchIEEE754Number(JSON.stringify(newVal));
        } else {
            expect(newValActual).toMatchIEEE754Number(newVal);
        }

        vireo.eggShell.writeJSON(viName, path, oldValJSON);
        var newNewValueRef = vireo.eggShell.findValueRef(viName, path);
        var oldValRewriteJSON = vireo.eggShell.readJSON(newNewValueRef);
        var oldValRewrite = JSON.parse(oldValRewriteJSON);
        expect(oldValRewrite).toMatchIEEE754Number(oldVal);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    it('but first interesting negative zero behaviors are verified', function () {
        // Apparantly JSON.stringify(-0) results in "0" but JSON.parse('-0') results in -0
        expect(JSON.parse(JSON.stringify(0))).toMatchIEEE754Number(0);
        expect(JSON.parse(JSON.stringify(-0))).toMatchIEEE754Number(0); // should be -0
        expect(JSON.parse('0')).toMatchIEEE754Number(0);
        expect(JSON.parse('-0')).toMatchIEEE754Number(-0);
        expect(JSON.parse('[-0]')[0]).toMatchIEEE754Number(-0);

        // Several other approaches that don't preserve negative zero
        expect((-0).toString()).toBe('0');
        expect(String(-0)).toBe('0');
    });

    describe('scalars of type', function () {
        it('Boolean', function () {
            writeTest('dataItem_Boolean', true, false);
        });

        it('String', function () {
            writeTest('dataItem_String', 'Hello', 'Hello World! :D');
            writeTest('dataItem_String', 'Hello', 'Iñtërnâtiônàlizætiøn☃💩');
        });

        it('Double', function () {
            writeTest('dataItem_NumericDouble', 123.456, 1234.56789);
            writeTest('dataItem_NumericDouble', 123.456, (NaN).toString());
            writeTest('dataItem_NumericDouble', 123.456, (Infinity).toString());
            writeTest('dataItem_NumericDouble', 123.456, (-Infinity).toString());
            writeTest('dataItem_NumericDouble', 123.456, 0);
            writeTest('dataItem_NumericDouble', 123.456, -0);
        });

        it('Int32', function () {
            writeTest('dataItem_Numeric32', -1073741824, -36963968);
        });

        it('Int64', function () {
            writeTest('dataItem_Numeric64',
                '-1152921504606846976',
                '-36028797018963968'
            );
        });

        it('Int64NonString', function () {
            writeTest('dataItem_Numeric64',
                '-1152921504606846976',
                36028797018963968
            );
        });

        it('ComplexDouble', function () {
            writeTest('dataItem_Complex',
                {
                    real: 1337.73,
                    imaginary: -9283.12
                },
                {
                    real: 15.789,
                    imaginary: -3.1416
                });
        });

        it('Timestamp', function () {
            writeTest('dataItem_Timestamp',
                {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                },
                {
                    seconds: '3564057542',
                    fraction: '16691056759750171331'
                });
        });
    });

    describe('1D arrays of type', function () {
        it('Boolean', function () {
            writeTest('dataItem_ArrayOfBoolean',
                [true, true, false, true, false],
                [false, false, true, false, true]
            );

            writeTest('dataItem_ArrayOfBoolean',
                [true, true, false, true, false],
                [false, false, true, false, true, false, false, false, true]
            );

            writeTest('dataItem_ArrayOfBoolean',
                [true, true, false, true, false],
                [false, false]
            );
        });

        it('String', function () {
            writeTest('dataItem_ArrayOfString',
                ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
                ['My', 'name', 'is', 'slim', 'shady']
            );
            writeTest('dataItem_ArrayOfString',
                ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
                'I believe I can fly, I believe I can touch the sky'.split(' ')
            );
            writeTest('dataItem_ArrayOfString',
                ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'],
                ['Iñtërnâtiônàlizætiøn☃💩', 'is', 'fun']
            );
        });

        it('Double', function () {
            var original = [1.2, 3.4, 5.6, 7.89, 1234.5678];
            var sameSize = ['NaN', '-Infinity', 'Infinity', 0, -0];
            var moreVals = [0.4111973450, 0.7498847177, 0.8094650401, 0.5809188834, 0.4504242667, 0.4247307408, 0.2302642939, 0.3274508043, 0.2481683847, 0.4577604581];
            var lessVals = ['NaN', '-Infinity', 'Infinity'];
            writeTest('dataItem_ArrayOfDouble', original, sameSize);
            writeTest('dataItem_ArrayOfDouble', original, moreVals);
            writeTest('dataItem_ArrayOfDouble', original, lessVals);
        });

        it('Int32', function () {
            var original = [-1000, -10, 42, 9876543, 123];
            var sameSize = [11111, 222, 33, 4444444, 555];
            var moreVals = [552139, -396256, -292658, -795576, 248411, 873904, 994612, 724317, 79111, -849221];
            var lessVals = [-1, 0, 1];
            writeTest('dataItem_ArrayOfInt32', original, sameSize);
            writeTest('dataItem_ArrayOfInt32', original, moreVals);
            writeTest('dataItem_ArrayOfInt32', original, lessVals);
        });

        it('Int64', function () {
            var original = [
                '-8989',
                '9090',
                '36028797018963968',
                '-72057594037927936'
            ];
            var sameSize = ['1', '2', '3', '4'];
            var moreVals = [
                '18014398509481984',
                '36028797018963968',
                '72057594037927936',
                '144115188075855872',
                '288230376151711744',
                '-18014398509481984',
                '-36028797018963968',
                '-72057594037927936',
                '-144115188075855872',
                '-288230376151711744'
            ];
            var lessVals = ['-1', '0', '1'];
            writeTest('dataItem_ArrayOfInt64', original, sameSize);
            writeTest('dataItem_ArrayOfInt64', original, moreVals);
            writeTest('dataItem_ArrayOfInt64', original, lessVals);
        });

        it('ComplexDouble', function () {
            var original = [
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
            ];
            var sameSize = [
                {
                    real: 'NaN',
                    imaginary: 'NaN'
                }, {
                    real: 'Infinity',
                    imaginary: 'Infinity'
                }, {
                    real: '-Infinity',
                    imaginary: '-Infinity'
                }
            ];
            var moreVals = [
                {
                    real: 0.917787,
                    imaginary: 0.461898
                }, {
                    real: 0.832868,
                    imaginary: -0.20176365
                }, {
                    real: 0.764301,
                    imaginary: 0.2267764
                }, {
                    real: 0.174925,
                    imaginary: -0.0420786
                }, {
                    real: 0.83287,
                    imaginary: 0.1614564
                }
            ];
            var lessVals = [
                {
                    real: -1,
                    imaginary: -1
                }, {
                    real: 0,
                    imaginary: 0
                }, {
                    real: 1,
                    imaginary: 1
                }
            ];

            // TODO mraj using the following value causes a browser hang
            // var lessVals = [-1, 0, 1];

            writeTest('dataItem_ArrayOfComplexDouble', original, sameSize);
            writeTest('dataItem_ArrayOfComplexDouble', original, moreVals);
            writeTest('dataItem_ArrayOfComplexDouble', original, lessVals);
        });

        it('Timestamp', function () {
            var original = [
                {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }, {
                    seconds: '3564057542',
                    fraction: '16691056759750171331'
                }
            ];
            var sameSize = [
                {
                    seconds: '123',
                    fraction: '456'
                }, {
                    seconds: '789',
                    fraction: '135'
                }
            ];
            var moreVals = [
                {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }, {
                    seconds: '3564057542',
                    fraction: '16691056759750171331'
                }, {
                    seconds: '3564059871',
                    fraction: '7811758927381448217'
                }, {
                    seconds: '3566659871',
                    fraction: '7811758927381446667'
                }
            ];
            var lessVals = [
                {
                    seconds: '5',
                    fraction: '5'
                }
            ];

            // TODO mraj using the following value causes a browser hang
            // var lessVals = [-1, 0, 1];

            writeTest('dataItem_ArrayOfTimestamp', original, sameSize);
            writeTest('dataItem_ArrayOfTimestamp', original, moreVals);
            writeTest('dataItem_ArrayOfTimestamp', original, lessVals);
        });

        it('Cluster', function () {
            var original = [
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
            ];
            var sameSize = [
                {
                    bool: false,
                    string: 'Hello',
                    double: 3.14159,
                    int32: 42,
                    int64: '987',
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: '1',
                        fraction: '1'
                    }
                }, {
                    bool: true,
                    string: 'World',
                    double: 6.02e23,
                    int32: 43,
                    int64: '654',
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: '0',
                        fraction: '0'
                    }
                }, {
                    bool: false,
                    string: 'Iñtërnâtiônàlizætiøn☃💩',
                    double: 8675309,
                    int32: 44,
                    int64: '321',
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: '3',
                        fraction: '3'
                    }
                }
            ];

            var moreVals = [
                {
                    bool: false,
                    string: 'Hello',
                    double: 3.14159,
                    int32: 42,
                    int64: '987',
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: '1',
                        fraction: '1'
                    }
                }, {
                    bool: true,
                    string: 'World',
                    double: 6.02e23,
                    int32: 43,
                    int64: '654',
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: '0',
                        fraction: '0'
                    }
                }, {
                    bool: false,
                    string: 'Iñtërnâtiônàlizætiøn☃💩',
                    double: 8675309,
                    int32: 44,
                    int64: '321',
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: '3',
                        fraction: '3'
                    }
                }, {
                    bool: false,
                    string: 'NaNNaNNaNNaNNaNNaNNaNNan Batman!',
                    double: 404.404,
                    int32: 404,
                    int64: '4040404',
                    complex: {
                        real: 40,
                        imaginary: 4
                    },
                    time: {
                        seconds: '4040404',
                        fraction: '4040404'
                    }
                }
            ];
            var lessVals = [
                {
                    bool: false,
                    string: 'Iñtërnâtiônàlizætiøn☃💩',
                    double: 8675309,
                    int32: 44,
                    int64: '321',
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: '3',
                        fraction: '3'
                    }
                }, {
                    bool: false,
                    string: 'NaNNaNNaNNaNNaNNaNNaNNan Batman!',
                    double: 404.404,
                    int32: 404,
                    int64: '4040404',
                    complex: {
                        real: 40,
                        imaginary: 4
                    },
                    time: {
                        seconds: '4040404',
                        fraction: '4040404'
                    }
                }
            ];

            writeTest('dataItem_ArrayOfClusters', original, sameSize);
            writeTest('dataItem_ArrayOfClusters', original, moreVals);
            writeTest('dataItem_ArrayOfClusters', original, lessVals);
        });
    });

    describe('2D arrays of type', function () {
        it('Boolean', function () {
            var original = [
                [true, false],
                [false, false],
                [true, true]
            ];
            var sameSize = [
                [false, true],
                [true, true],
                [false, false]
            ];
            var moreVals = [
                [true, false, false, false],
                [false, false, false, false],
                [true, true, false, false],
                [true, true, true, true]
            ];
            var lessVals = [
                [false]
            ];

            writeTest('dataItem_2DArrayOfBoolean', original, sameSize);
            writeTest('dataItem_2DArrayOfBoolean', original, moreVals);
            writeTest('dataItem_2DArrayOfBoolean', original, lessVals);
        });

        it('String', function () {
            var original = [
                ['hello', 'world'],
                ['abcde', 'fg'],
                ['xyzzy', '']
            ];
            var sameSize = [
                ['HELLO', 'WORLD'],
                ['ABCDE', 'FG'],
                ['', '']
            ];
            var moreVals = [
                ['I', 'want', 'to', 'be'],
                ['the', 'very', 'best', 'that'],
                ['no', 'one', 'ever', 'was'],
                ['to', 'catch', 'them', 'is'],
                ['my', 'real', 'test', 'to'],
                ['train', 'them', 'is', 'my'],
                ['cause', 'vireomon!', '🐣', '🐣🐣']
            ];
            var lessVals = [
                ['🐣']
            ];

            writeTest('dataItem_2DArrayOfString', original, sameSize);
            writeTest('dataItem_2DArrayOfString', original, moreVals);
            writeTest('dataItem_2DArrayOfString', original, lessVals);
        });

        it('Double', function () {
            var original = [
                [1.234, 2.345, 3.456],
                [-4.567, -5.678, -6.789]
            ];
            var sameSize = [
                ['NaN', 'Infinity', '-Infinity'],
                [0, -0, -6.789]
            ];
            var moreVals = [
                [1.234, 2.345, 3.456],
                [-4.567, -5.678, -6.789],
                [-0.411197, 0.749885, 0]
            ];
            var lessVals = [
                [7]
            ];

            writeTest('dataItem_2DArrayOfDouble', original, sameSize);
            writeTest('dataItem_2DArrayOfDouble', original, moreVals);
            writeTest('dataItem_2DArrayOfDouble', original, lessVals);
        });

        it('Int64', function () {
            var original = [
                ['9090'],
                ['36028797018963968'],
                ['-72057594037927936']
            ];
            var sameSize = [
                ['9090'],
                ['8080'],
                ['7070']
            ];
            var moreVals = [
                ['1', '2', '3'],
                ['-4', '-5', '-6'],
                ['7', '8', '9']
            ];
            var lessVals = [
                ['7']
            ];

            writeTest('dataItem_2DArrayOfInt64', original, sameSize);
            writeTest('dataItem_2DArrayOfInt64', original, moreVals);
            writeTest('dataItem_2DArrayOfInt64', original, lessVals);
        });

        it('ComplexDouble', function () {
            var original = [
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
            ];
            var sameSize = [
                [
                    {
                        real: 'NaN',
                        imaginary: '-Infinity'
                    }, {
                        real: 'NaN',
                        imaginary: 'Infinity'
                    }
                ],
                [
                    {
                        real: 0,
                        imaginary: -0
                    }, {
                        real: -0,
                        imaginary: 0
                    }
                ]
            ];
            var moreVals = [
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
                ],
                [
                    {
                        real: 7,
                        imaginary: 8
                    }, {
                        real: 9,
                        imaginary: 10
                    }
                ]
            ];
            var lessVals = [
                [
                    {
                        real: 1.4142,
                        imaginary: 0.7071
                    }
                ]
            ];

            writeTest('dataItem_2DArrayOfComplex', original, sameSize);
            expect(moreVals).toBeDefined();
            expect(lessVals).toBeDefined();

            // TODO mraj resize tests for 2d arrays seem to fail
            // writeTest('dataItem_2DArrayOfComplex', original, moreVals);
            // writeTest('dataItem_2DArrayOfComplex', original, lessVals);
        });

        it('Timestamp', function () {
            var original = [
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
            ];
            var sameSize = [
                [
                    {
                        seconds: '1',
                        fraction: '2'
                    }, {
                        seconds: '3',
                        fraction: '4'
                    }
                ],
                [
                    {
                        seconds: '5',
                        fraction: '6'
                    }, {
                        seconds: '7',
                        fraction: '8'
                    }
                ],
                [
                    {
                        seconds: '9',
                        fraction: '10'
                    }, {
                        seconds: '11',
                        fraction: '12'
                    }
                ]
            ];
            var moreVals = [
                [
                    {
                        seconds: '1',
                        fraction: '2'
                    }, {
                        seconds: '3',
                        fraction: '4'
                    }
                ],
                [
                    {
                        seconds: '5',
                        fraction: '6'
                    }, {
                        seconds: '7',
                        fraction: '8'
                    }
                ],
                [
                    {
                        seconds: '9',
                        fraction: '10'
                    }, {
                        seconds: '11',
                        fraction: '12'
                    }
                ],
                [
                    {
                        seconds: '13',
                        fraction: '14'
                    }, {
                        seconds: '15',
                        fraction: '16'
                    }
                ]
            ];
            var lessVals = [
                [
                    {
                        seconds: '1',
                        fraction: '2'
                    }
                ]
            ];

            writeTest('dataItem_2DArrayOfTimestamp', original, sameSize);
            writeTest('dataItem_2DArrayOfTimestamp', original, moreVals);
            writeTest('dataItem_2DArrayOfTimestamp', original, lessVals);
        });
    });

    describe('3D arrays of type', function () {
        it('Int32', function () {
            var original = [
                [
                    [111, 112, 113],
                    [121, 122, 123]
                ],
                [
                    [211, 212, 213],
                    [221, 222, 223]
                ]
            ];
            var sameSize = [
                [
                    [8111, 8112, 8113],
                    [8121, 8122, 8123]
                ],
                [
                    [8211, 8212, 8213],
                    [8221, 8222, 8223]
                ]
            ];
            var moreVals = [
                [
                    [111, 112, 113, 5],
                    [121, 122, 123, 5],
                    [555, 555, 555, 5]
                ],
                [
                    [211, 212, 213, 5],
                    [221, 222, 223, 5],
                    [555, 555, 555, 5]
                ]
            ];
            var lessVals = [
                [
                    [7]
                ]
            ];

            writeTest('dataItem_3DArrayOfInt32', original, sameSize);
            writeTest('dataItem_3DArrayOfInt32', original, moreVals);
            writeTest('dataItem_3DArrayOfInt32', original, lessVals);
        });
    });

    describe('composite types of', function () {
        it('clusters with scalars', function () {
            var original = {
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
            };
            var newValue = {
                bool: false,
                string: 'last',
                double: 9.8696,
                int32: 2147418112,
                int64: '-1152921504606846976',
                uint64: '10376293541461622784',
                complex: {
                    real: 123.456,
                    imaginary: -789.012
                },
                time: {
                    seconds: '3566659871',
                    fraction: '7811758927381446667'
                }
            };
            writeTest('dataItem_ClusterOfScalars', original, newValue);
        });

        it('clusters with 1D arrays', function () {
            var original = {
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
            };

            var sameSize = {
                booleans: [false, true, false],
                strings: 'And this bird you cannot change'.split(' '),
                doubles: [21.2, 23.4, 25.6, 27.89, 21234.5678],
                int32s: [552139, -396256, -292658, -795576, 248411, 873904, 994612, 724317, 79111, -849221],
                int64s: ['-8989', '9090', '36028', '-7205'],
                uint64s: ['922337', '0', '9223'],
                complexes: [
                    {
                        real: 'Infinity',
                        imaginary: 'NaN'
                    }, {
                        real: 0,
                        imaginary: -0
                    }, {
                        real: 'NaN',
                        imaginary: '-Infinity'
                    }
                ],
                times: [
                    {
                        seconds: '3564057536',
                        fraction: '7811'
                    }, {
                        seconds: '3564057542',
                        fraction: '1669'
                    }
                ]
            };
            var moreVals = {
                booleans: [true, false, true, true],
                strings: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'amet2'],
                doubles: [1.2, 3.4, 5.6, 7.89, 1234.5678, -0],
                int32s: [-1000, -10, 42, 9876543, 123, 42],
                int64s: [
                    '-8989',
                    '9090',
                    '36028797018963968',
                    '-72057594037927936',
                    '404'
                ],
                uint64s: [
                    '9223372041149743104',
                    '0',
                    '9223376434901286912',
                    '404'
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
                    }, {
                        real: 'Infinity',
                        imaginary: '-Infinity'
                    }
                ],
                times: [
                    {
                        seconds: '3564057536',
                        fraction: '7811758927381448193'
                    }, {
                        seconds: '3564057542',
                        fraction: '16691056759750171331'
                    }, {
                        seconds: '4',
                        fraction: '5'
                    }
                ]
            };

            var lessVals = {
                booleans: [true],
                strings: ['Lorem'],
                doubles: [1.2],
                int32s: [-1000],
                int64s: ['-8989'],
                uint64s: ['92233720411'],
                complexes: [
                    {
                        real: 0,
                        imaginary: 0
                    }
                ],
                times: [
                    {
                        seconds: '8',
                        fraction: '67'
                    }
                ]
            };

            writeTest('dataItem_ClusterOfArrays', original, sameSize);
            writeTest('dataItem_ClusterOfArrays', original, moreVals);
            writeTest('dataItem_ClusterOfArrays', original, lessVals);
        });

        it('analog waveform of double', function () {
            var original = {
                t0: {
                    seconds: '300',
                    fraction: '123'
                },
                dt: 8.8,
                Y: [5.5, 6.6, 7.7, 8.8] // eslint-disable-line id-length
            };
            var sameSize = {
                t0: {
                    seconds: '3456789',
                    fraction: '0'
                },
                dt: 1234.5678,
                Y: ['NaN', 'Infinity', '-Infinity', -0] // eslint-disable-line id-length
            };
            var moreVals = {
                t0: {
                    seconds: '3001',
                    fraction: '1231'
                },
                dt: 8.89,
                Y: [5.5, 6.6, 7.7, 8.8, 9.9, 10.1, 11] // eslint-disable-line id-length
            };
            var lessVals = {
                t0: {
                    seconds: '1',
                    fraction: '2'
                },
                dt: 3,
                Y: [4] // eslint-disable-line id-length
            };

            writeTest('wave_Double', original, sameSize);
            writeTest('wave_Double', original, moreVals);
            writeTest('wave_Double', original, lessVals);
        });
    });
});
