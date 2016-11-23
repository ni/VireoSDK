var fs = require('fs');

var buildVireoInstance = require('../../source/core/vireo.loader.js');
var viaCode = fs.readFileSync('./loadernode.via', 'utf8');

var publicAPI = buildVireoInstance();
var eggShell = publicAPI.vireoAPI;

eggShell.loadVia(viaCode);

var remainingSlices = eggShell.executeSlices(1000);
while (remainingSlices > 0) {
    remainingSlices = eggShell.executeSlices(1000);
}

console.log('done :D');