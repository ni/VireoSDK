describe('The Vireo EggShell readJSON api can read', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiMultipleTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/MultipleTypes.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiMultipleTypesViaUrl
        ], done);
    });

    var viName = 'MyVI';
    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiMultipleTypesViaUrl);
    });

    describe('scalars of type', function () {
        it('Boolean', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Boolean');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe(true);
        });

        it('String', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_String');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe('Hello');
        });

        it('Double', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericDouble');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe(123.456);
        });

        it('Double NaN', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericDoubleNaN');
            expect(actualJSON).toBe('"NaN"');

            var actualString = JSON.parse(actualJSON);
            var actual = parseFloat(actualString);
            expect(actual).toMatchIEEE754Number(NaN);
        });

        it('Double Positive Infinity', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericDoublePositiveInfinity');
            expect(actualJSON).toBe('"Infinity"');

            var actualString = JSON.parse(actualJSON);
            var actual = parseFloat(actualString);
            expect(actual).toMatchIEEE754Number(Infinity);
        });

        it('Double Negative Infinity', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericDoubleNegativeInfinity');
            expect(actualJSON).toBe('"-Infinity"');

            var actualString = JSON.parse(actualJSON);
            var actual = parseFloat(actualString);
            expect(actual).toMatchIEEE754Number(-Infinity);
        });

        it('Double Positive Zero', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericDoublePositiveZero');
            var actual = JSON.parse(actualJSON);
            expect(actual).toMatchIEEE754Number(0);
        });

        it('Double Negative Zero', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_NumericDoubleNegativeZero');
            var actual = JSON.parse(actualJSON);
            expect(actual).toMatchIEEE754Number(-0);
        });

        it('Int32', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Numeric32');
            var actual = JSON.parse(actualJSON);
            expect(actual).toBe(-1073741824);
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_Complex');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual({
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfBoolean');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual([true, true, false, true, false]);
        });

        it('String', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfString');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual(['Lorem', 'ipsum', 'dolor', 'sit', 'amet']);
        });

        it('Double', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfDouble');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual([1.2, 3.4, 5.6, 7.89, 1234.5678]);
        });

        it('Int32', function () {
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfInt32');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual([-1000, -10, 42, 9876543, 123]);
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
            var actualJSON = vireo.eggShell.readJSON(viName, 'dataItem_ArrayOfComplexDouble');
            var actual = JSON.parse(actualJSON);
            expect(actual).toEqual([
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

        // Same as above, when running through a JSON parser this results in loss of precision
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

    // describe('2D arrays of type', function () {

    // });
});
