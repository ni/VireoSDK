describe('runningVia', function() {
    'use strict';
    var vireo = require('../dist/vireo.js'),
        fs = require('fs'),
        path = require('path');

    vireo.core.print = function(text) { vireo.stdout = vireo.stdout + text + '\n'; };
    
    beforeEach(function() {
        vireo.reboot(); // restart Vireo
        vireo.stdout = ''; // clean stdout
    });

    var testFiles = [];
    testFiles = fs.readdirSync('test-it');

    testFiles.forEach(function(file) {
        if (path.extname(file) === '.via') {
            var viafile = 'test-it/' + file;
            var vtrfile = 'test-it/results/' + path.basename(file, '.via') + '.vtr';

            it('should be equal (' + viafile + ')', function() {
                var viaCode = '';
                var vtrCode = '';
                try {
                    viaCode = fs.readFileSync(viafile);
                    vtrCode = fs.readFileSync(vtrfile);
                } catch (e) {
                    console.log('Files not found');
                }

                if (viaCode === '' || vtrCode === '') {
                    fail('Files empty');
                }

                if (vireo.loadVia(viaCode.toString()) === 0) {
                    while (vireo.executeSlices(100000000)) { }
                }

                expect(vireo.stdout.toString()).toEqual(vtrCode.toString());
            });
        }
    });
});
