// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('A JavaScript function invoke', function () {
    'use strict';
    // Reference aliases
    const vireoHelpers = window.vireoHelpers;
    const vireoRunner = window.testHelpers.vireoRunner;
    const fixtures = window.testHelpers.fixtures;

    let vireo;
    const viName = 'defaultValuesVI';
    const dataItems = [{
        path: 'dataItem_Numeric',
        defaultValue: 1232130
    },
    {
        path: 'dataItem_Numeric_2',
        defaultValue: 8600.0125
    },
    {
        path: 'dataItem_Timestamp',
        defaultValue: {
            seconds: '3536352000',
            fraction: '0'
        }
    },
    {
        path: 'dataItem_Button',
        defaultValue: true
    },
    {
        path: 'dataItem_String',
        defaultValue: 'Iñtërnâtiônàlizætiøn☃💩<!-- test comment -->'
    },
    {
        path: 'dataItem_MultiLineString',
        defaultValue: `multi
line
comment`
    },
    {
        path: 'dataItem_Cluster',
        defaultValue: {
            Numeric: 120,
            String: 'default value'
        }
    },
    {
        path: 'dataItem_ClusterOfNumericArray',
        defaultValue: {
            Array_2: [340, 567.67, 12.34, 43.56],
            Button: true
        }
    },
    {
        path: 'dataItem_ArrayOfClusters',
        defaultValue: [{
            Numeric: 340,
            String: 'a lovely'
        },
        {
            Numeric: -5600,
            String: 'bunch of coconuts'
        },
        {
            Numeric: 1230,
            String: 'woo'
        }
        ]
    },
    {
        path: 'dataItem_NumericArray',
        defaultValue: [120, 120, 120, 120]
    },
    {
        path: 'dataItem_ArrayOfString',
        defaultValue: ['defaultI\'ve got', 'oops', '', 'lol']
    },
    {
        path: 'dataItem_ArrayOfBoolean',
        defaultValue: [true, false, true]
    }
    ];

    const testPrecondition_CurrentValueDoesNotMatchDefaultValue = function (viPathParser) {
        dataItems.forEach(function (dataItem) {
            expect(viPathParser(dataItem.path)).not.toEqual(dataItem.defaultValue);
        });
    };

    const dataItemsReinitiazedToDefault_ValueUpdatedToDefaultValue = function (viPathParser) {
        dataItems.forEach(function (dataItem) {
            const valueRef = vireo.eggShell.findValueRef(viName, dataItem.path);
            vireo.eggShell.reinitializeToDefault(valueRef);
            const value = viPathParser(dataItem.path);
            expect(value).toEqual(dataItem.defaultValue);
        });
    };

    const jsReinitializeToDefaultViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ReinitializeToDefault.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            jsReinitializeToDefaultViaUrl
        ], done);
    });

    beforeEach(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    it('with no parameters succesfully works', async function () {
        const runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, jsReinitializeToDefaultViaUrl);
        const viPathParser = vireoRunner.createVIPathParser(vireo, viName);

        const {
            rawPrint,
            rawPrintError
        } = await runSlicesAsync();

        expect(rawPrint).toBeEmptyString();
        expect(rawPrintError).toBeEmptyString();
        testPrecondition_CurrentValueDoesNotMatchDefaultValue(viPathParser);
        dataItemsReinitiazedToDefault_ValueUpdatedToDefaultValue(viPathParser);
    });
});
