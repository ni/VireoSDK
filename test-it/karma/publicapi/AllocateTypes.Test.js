// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Vireo public API allows', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo;
    var internalEggShell;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
        internalEggShell = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired.eggShell;
    });

    afterAll(function () {
        vireo = undefined;
        internalEggShell = undefined;
    });

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
        var valueRef = vireo.eggShell.findValueRef(viName, path);
        return internalEggShell.allocateData(valueRef.typeRef);
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
        internalEggShell.deallocateData(dataValueRef);
    };

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiAllocateTypesViaUrl
        ], done);
    });

    beforeAll(function () {
        vireoRunner.rebootAndLoadVia(vireo, publicApiAllocateTypesViaUrl);
    });

    var tryAllocate = function (typeRef) {
        return function () {
            internalEggShell.allocateData(typeRef);
        };
    };

    var tryDeallocate = function (valueRef) {
        return function () {
            internalEggShell.deallocateData(valueRef);
        };
    };

    describe('error handling', function () {
        // Use null pointer for an invalid address. Random values can have unexpected results.
        var invalidAddress = 0;
        describe('for allocateData', function () {
            it('throws an InvalidTypeRef error given an invalid typeRef', function () {
                var invalidTypeRef = invalidAddress;

                expect(tryAllocate(invalidTypeRef)).toThrowError(/InvalidTypeRef/);
            });
        });

        describe('for deallocateData', function () {
            it('throws an InvalidTypeRef error given an invalid typeRef', function () {
                var invalidValueRef = {
                    typeRef: invalidAddress,
                    dataRef: invalidAddress
                };

                expect(tryDeallocate(invalidValueRef)).toThrowError(/InvalidTypeRef/);
            });

            it('throws an InvalidDataPointer error given an invalid dataRef', function () {
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

        describe('local variables in a VI of type', function () {
            it('Boolean', function () {
                allocateTest(viName, 'booleans', [true, false, true, false]);
            });

            it('String', function () {
                allocateTest(viName, 'strings', [
                    'everyone you know',
                    'everyone you ever heard of',
                    'every human being who ever was',
                    'lived out their lives'
                ]);
            });

            it('Numeric', function () {
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
            });

            it('Timestamp', function () {
                allocateTest(viName, 'times', [
                    {
                        seconds: '3564057536',
                        fraction: '7811758927381448193'
                    }, {
                        seconds: '3564057542',
                        fraction: '16691056759750171331'
                    }
                ]);
            });

            it('FixedBoolean', function () {
                allocateTest(viName, 'fixedBooleans', [
                    [true, false],
                    [false, true]
                ]);
            });

            it('AnalogWaveform', function () {
                allocateTest(viName, 'wave_Double', {
                    t0: {
                        seconds: '50000',
                        fraction: '456'
                    },
                    dt: 10.5,
                    Y: [5, 25, 'NaN', '-Infinity', 'Infinity'],
                    attributes: {_data: null, _attributes: null}
                });
            });

            it('Path', function () {
                allocateTest(viName, 'nipath', {
                    type: 'ABSOLUTE',
                    components: ['C', 'Windows', 'System32']
                });
            });

            it('Enum', function () {
                allocateTest(viName, 'enum16numbers', 1);
            });
        });

        it('local constants in a VI', function () {
            allocateTest(viName, 'constint8', -5);
            allocateTest(viName, 'constuint16', 234);
            allocateTest(viName, 'constsingle3darray', [
                [[1, 2], [3, 4]], [[5, 6], [7, 8]]
            ]);
        });
    });
});
