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
        var oldValJSON = vireo.eggShell.readJSON(viName, path);
        var oldValActual = JSON.parse(oldValJSON);
        expect(oldValActual).toMatchIEEE754Number(oldVal);

        var newValToWriteJSON = JSON.stringify(newVal);
        vireo.eggShell.writeJSON(viName, path, newValToWriteJSON);

        var newValJSON = vireo.eggShell.readJSON(viName, path);
        var newValActual = JSON.parse(newValJSON);
        expect(newValActual).toMatchIEEE754Number(newVal);

        vireo.eggShell.writeJSON(viName, path, oldValJSON);
        var oldValRewriteJSON = vireo.eggShell.readJSON(viName, path);
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
            writeTest('dataItem_NumericDouble', 123.456, +0);
        });

        it('awesome but first some interesting JS tests', function () {
            // Apparantly JSON.stringify(-0) results in "0" but JSON.parse('-0') results in -0
            expect(JSON.parse(JSON.stringify(0))).toMatchIEEE754Number(0);
            expect(JSON.parse(JSON.stringify(+0))).toMatchIEEE754Number(0);
            expect(JSON.parse(JSON.stringify(-0))).toMatchIEEE754Number(0); // should be -0

            // Apparantly '+0' is not valid JSON
            expect(JSON.parse('0')).toMatchIEEE754Number(0);
            expect(JSON.parse('-0')).toMatchIEEE754Number(-0);

            // Several other approaches that don't preserve negative zero
            expect((-0).toString()).toBe('0');
            expect(String(-0)).toBe('0');
        });

        it('Double Negative Zero as JSON string', function () {
            // Summary of this test is that if you pass the JSON string '-0' or '"-0"' to vireo for a numeric
            // it will be handled correctly. The problem is that most of the JavaScript serializtion
            // approaches to not correctly serialize negative zero

            var oldVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(oldVal).toBe(123.456);

            // To properly handle this case the string serialization of -0 effectively has to be hard coded
            // since we cannot rely on toString or JSON.stringify
            var negativeZeroString = '-0';
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', JSON.stringify(negativeZeroString));

            var newVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(newVal).toMatchIEEE754Number(-0);

            // Reset double value
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', JSON.stringify(123.456));
        });

        it('Double Negative Zero as JSON number', function () {
            // Summary of this test is that if you pass the JSON string '-0' or '"-0"' to vireo for a numeric
            // it will be handled correctly. The problem is that most of the JavaScript serializtion
            // approaches to not correctly serialize negative zero

            var oldVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(oldVal).toBe(123.456);

            // To properly handle this case the string serialization of -0 effectively has to be hard coded
            // since we cannot rely on toString or JSON.stringify
            var negativeZeroString = '-0';
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', negativeZeroString);

            var newVal = JSON.parse(vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble'));
            expect(newVal).toMatchIEEE754Number(-0);

            // Reset double value
            vireo.eggShell.writeJSON(viName, 'dataItem_NumericDouble', JSON.stringify(123.456));
        });

        it('Int32', function () {
            writeTest('dataItem_Numeric32', -1073741824, -36963968);
        });

        it('Int64', function () {
            // TODO mraj when writing 64-bit values as strings is fixed the following can be corrected
            writeTest('dataItem_Numeric64',
                -1152921504606847000, // '-1152921504606846976'
                -36028797018963970 // '-36028797018963968'
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
            // TODO mraj when writing 64-bit values as strings is fixed the following can be corrected
            writeTest('dataItem_Timestamp',
                {
                    seconds: 3564057536, // '3564057536'
                    fraction: 7811758927381449000 // '7811758927381448193'
                },
                {
                    seconds: 3564057542, // '3564057542'
                    fraction: 16691056759750170000 // '16691056759750171331'
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
            var sameSize = [1.1, 3.3, 5.5, 7.77, 1234.1234];
            var moreVals = [0.4111973450, 0.7498847177, 0.8094650401, 0.5809188834, 0.4504242667, 0.4247307408, 0.2302642939, 0.3274508043, 0.2481683847, 0.4577604581];
            var lessVals = ['NaN', '-Infinity', 'Infinity', 0];
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
            // TODO mraj when writing 64-bit values as strings is fixed the following can be corrected
            var original = [
                -8989,
                9090,
                36028797018963970, // 36028797018963968
                -72057594037927940 // -72057594037927936
            ];
            var sameSize = [1, 2, 3, 4];
            var moreVals = [
                18014398509481984,
                36028797018963970, // '36028797018963968',
                72057594037927940, // '72057594037927936',
                144115188075855870, // '144115188075855872',
                288230376151711740, // '288230376151711744',
                -18014398509481984,
                -36028797018963970, // '-36028797018963968',
                -72057594037927940, // '-72057594037927936',
                -144115188075855870, // '-144115188075855872',
                -288230376151711740 // '-288230376151711744'
            ];
            var lessVals = [-1, 0, 1];
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
            // TODO mraj when writing 64-bit values as strings is fixed the following can be corrected
            var original = [
                {
                    seconds: 3564057536,
                    fraction: 7811758927381449000 // 7811758927381448193
                }, {
                    seconds: 3564057542,
                    fraction: 16691056759750170000 // 16691056759750171331
                }
            ];
            var sameSize = [
                {
                    seconds: 123,
                    fraction: 456
                }, {
                    seconds: 789,
                    fraction: 135
                }
            ];
            var moreVals = [
                {
                    seconds: 3564057536,
                    fraction: 7811758927381449000 // '7811758927381448193',
                }, {
                    seconds: 3564057542,
                    fraction: 16691056759750170000 // '16691056759750171331'
                }, {
                    seconds: 3564059871,
                    fraction: 7811758927381449000 // '7811758927381448217'
                }, {
                    seconds: 3566659871,
                    fraction: 7811758927381447000 // '7811758927381446667'];
                }
            ];
            var lessVals = [
                {
                    seconds: 5,
                    fraction: 5
                }
            ];

            // TODO mraj using the following value causes a browser hang
            // var lessVals = [-1, 0, 1];

            writeTest('dataItem_ArrayOfTimestamp', original, sameSize);
            writeTest('dataItem_ArrayOfTimestamp', original, moreVals);
            writeTest('dataItem_ArrayOfTimestamp', original, lessVals);
        });

        it('Cluster', function () {
            // TODO mraj when writing 64-bit values as strings is fixed the following can be corrected
            var original = [
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
            ];
            var sameSize = [
                {
                    bool: false,
                    string: 'Hello',
                    double: 3.14159,
                    int32: 42,
                    int64: 987,
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: 1,
                        fraction: 1
                    }
                }, {
                    bool: true,
                    string: 'World',
                    double: 6.02e23,
                    int32: 43,
                    int64: 654,
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: 0,
                        fraction: 0
                    }
                }, {
                    bool: false,
                    string: 'Iñtërnâtiônàlizætiøn☃💩',
                    double: 8675309,
                    int32: 44,
                    int64: 321,
                    complex: {
                        real: 3.41,
                        imaginary: -5.91
                    },
                    time: {
                        seconds: 3,
                        fraction: 3
                    }
                }
            ];
            // var moreVals = [
            // ];
            // var lessVals = [
            // ];

            writeTest('dataItem_ArrayOfClusters', original, sameSize);
            // writeTest('dataItem_ArrayOfClusters', original, moreVals);
            // writeTest('dataItem_ArrayOfClusters', original, lessVals);
        });
    });
});
