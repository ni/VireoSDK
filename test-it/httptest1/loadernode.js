(function () {
    'use strict';
    var fs = require('fs');

    var Vireo = require('../../source/core/vireo.loader.js');
    var viaCode = fs.readFileSync('./loadernode.via', 'utf8');

    var vireo = new Vireo();
    vireo.eggShell.setPrintFunction(console.log);
    vireo.eggShell.setPrintErrorFunction(console.error);
    vireo.eggShell.loadVia(viaCode);
    vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
        console.log('done :D');
    });
}());
