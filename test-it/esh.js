#!/usr/bin/env node
// Simple command line Vireo shell
(function () {
    'use strict';

    var argv = process.argv.slice();
    argv.shift();
    var command = argv.shift();
    var arg = argv[0];

    var Vireo;
    try {
        Vireo = require('../');
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            console.error('Error: vireo.js not found (Maybe build it first?)');
            process.exit(1);
        } else {
            throw err;
        }
    }

    var fs = require('fs');
    var text;
    try {
        text = fs.readFileSync(arg).toString();
    } catch (e) {
        console.log('Usage: ' + command + ' [file.via]...');
        if (arg.substring(0, 1) !== '-') {
            console.error('Cannot open ' + arg);
        }
        process.exit(1);
    }

    var vireo = new Vireo();
    vireo.eggShell.setPrintFunction(function (text) {
        console.log(text);
    });
    vireo.eggShell.loadVia(text);
    vireo.eggShell.executeSlicesUntilClumpsFinished();
}());
