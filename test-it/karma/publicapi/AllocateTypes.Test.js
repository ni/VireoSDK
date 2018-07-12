describe('Vireo public API allows', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiAllocateTypesViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/AllocateTypes.via');
    var viName = 'AllocateTypes';

    var expectValidValueRef = function (valueRef) {
        expect(valueRef).toBeNonEmptyObject();
        expect(valueRef.typeRef).toBeNumber();
        expect(valueRef.typeRef).not.toBe(0);
        expect(valueRef.dataRef).toBeNumber();
        expect(valueRef.dataRef).not.toBe(0);
    };

    var allocateData = function (viName, path) {
        return vireo.eggShell.allocateData(vireo.eggShell.findValueRef(viName, path));
    };

    var writeValue = function (valueRef, value) {
        vireo.eggShell.writeJSON(valueRef, JSON.stringify(value));
    };

    var readValue = function (valueRef) {
        return JSON.parse(vireo.eggShell.readJSON(valueRef));
    };

    var allocateTest = function (viName, path, value) {
        var dataValueRef = allocateData(viName, path);
        expectValidValueRef(dataValueRef);
        writeValue(dataValueRef, value);
        expect(readValue(dataValueRef)).toEqual(value);
        vireo.eggShell.deallocateData(dataValueRef);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiAllocateTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiAllocateTypesViaUrl);
    });

    var tryAllocate = function (valueRef) {
        return function () {
            vireo.eggShell.allocateData(valueRef);
        };
    };

    var tryDeallocate = function (valueRef) {
        return function () {
            vireo.eggShell.deallocateData(valueRef);
        };
    };

    describe('error handling', function () {
        describe('for allocateData throws', function () {
            it('when typeRef is invalid', function () {
                var invalidValueRef = {
                    typeRef: 0,
                    dataRef: 1234
                };

                expect(tryAllocate(invalidValueRef)).toThrowError(/InvalidTypeRef/);
            });
        });

        describe('for deallocateData throws', function () {
            it('when typeRef is invalid', function () {
                var invalidValueRef = {
                    typeRef: 1234,
                    dataRef: 1234
                };

                expect(tryDeallocate(invalidValueRef)).toThrowError(/InvalidTypeRef/);
            });

            it('when dataRef is null', function () {
                var validValueRef = vireo.eggShell.findValueRef(viName, 'times');
                var invalidValueRef = {
                    typeRef: validValueRef.typeRef,
                    dataRef: 0
                };

                expect(tryDeallocate(invalidValueRef)).toThrowError(/InvalidDataPointer/);
            });
        });
    });

    describe('allocation of new variables from', function () {
        it('global variables', function () {
            allocateTest('GlobalInt32', '', 1234);
            allocateTest('GlobalString', '', 'Hola Mundo!');
            allocateTest('GlobalErrorCluster', '', {
                status: true,
                code: 12345,
                source: 'This is an error'
            });
            allocateTest('GlobalClusterOfScalars', '', {
                bool: true,
                string: 'Testing... Attention please.',
                double: 2.7182,
                int32: 1234,
                int64: '9876543210',
                complex: {
                    real: 5.045,
                    imaginary: -5.67
                },
                time: {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }
            });
            allocateTest('GlobalArrayOfClusters', '', [
                {
                    bool: true,
                    string: 'Look again at that dot.',
                    double: 123.45,
                    int32: 456,
                    int64: '7890123456',
                    complex: {
                        real: -3.14,
                        imaginary: 6.28
                    },
                    time: {
                        seconds: '3564057542',
                        fraction: '16691056759750171331'
                    }
                },
                {
                    bool: false,
                    string: 'That\'s here. That\'s home. That\'s us.',
                    double: -123.45,
                    int32: -5678,
                    int64: '-1234567890',
                    complex: {
                        real: 3.14,
                        imaginary: -6.28
                    },
                    time: {
                        seconds: '3564059871',
                        fraction: '7811758927381448217'
                    }
                }
            ]);
            allocateTest('GlobalClusterOfArrays', '', {
                booleans: [true, false, true],
                strings: ['On', 'it', ' everyone', 'you,', 'love'],
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

        it('local variables in a VI', function () {
            allocateTest(viName, 'booleans', [true, false, true, false]);
            allocateTest(viName, 'strings', [
                'everyone you know',
                'everyone you ever heard of',
                'every human being who ever was',
                'lived out their lives'
            ]);
            allocateTest(viName, 'doubles', [1.2, 3.4, 5.6, 7.89, 1234.5678]);
            allocateTest(viName, 'int32s', [-1000, -10, 42, 9876543, 123]);
            allocateTest(viName, 'int64s', [
                '-8989',
                '9090',
                '36028797018963968',
                '-72057594037927936'
            ]);
            allocateTest(viName, 'uint64s', [
                '9223372041149743104',
                '0',
                '9223376434901286912'
            ]);
            allocateTest(viName, 'complexes', [
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
            allocateTest(viName, 'times', [
                {
                    seconds: '3564057536',
                    fraction: '7811758927381448193'
                }, {
                    seconds: '3564057542',
                    fraction: '16691056759750171331'
                }
            ]);

            allocateTest(viName, 'fixedBooleans', [
                [true, false],
                [false, true]
            ]);
            allocateTest(viName, 'wave_Double', {
                t0: {
                    seconds: '300',
                    fraction: '123'
                },
                dt: 8.8,
                Y: [5.5, 6.6, 7.7, 8.8] // eslint-disable-line id-length
            });
            allocateTest(viName, 'nipath', {
                type: 'ABSOLUTE',
                components: ['C', 'Windows', 'System32']
            });
            allocateTest(viName, 'enum16numbers', 1);
        });
    });
});
