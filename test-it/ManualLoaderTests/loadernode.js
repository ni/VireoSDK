// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(async function () {
    'use strict';
    var vireoHelper = require('../../');
    var fs = require('fs');

    var viaCode = fs.readFileSync('./loadernode.via', 'utf8');

    var vireo = await vireoHelper.createInstance();
    vireo.eggShell.loadVia(viaCode);
    await vireo.eggShell.executeSlicesUntilClumpsFinished();
    console.log('done :D');
}());
