(async function () {
    'use strict';
    var vireoHelper = require('../../');
    var fs = require('fs');

    var viaCode = fs.readFileSync('./loadernode.via', 'utf8');

    var vireo = await vireoHelper.requestInstance();
    vireo.eggShell.loadVia(viaCode);
    await vireo.eggShell.executeSlicesUntilClumpsFinished();
    console.log('done :D');
}());
