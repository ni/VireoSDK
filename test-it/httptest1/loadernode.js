var fs = require('fs');

var Vireo = require('../../source/core/vireo.loader.js');
var viaCode = fs.readFileSync('./loadernode.via', 'utf8');

var eggShell = new Vireo().eggShell;

eggShell.loadVia(viaCode);

var execResult = eggShell.executeSlices(1000);
while (execResult !== 0) {
    execResult = eggShell.executeSlices(1000);
}

console.log('done :D');
