#!/usr/bin/env node
// Simple command line Vireo shell
(function () {
    'use strict';
    var Vireo = require('../');
    var fs = require('fs');
    var xhr2 = require('xhr2');

    var argv = process.argv.slice();
    argv.shift();
    var command = argv.shift();
    var arg = argv[0];

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
    vireo.httpClient.setXMLHttpRequestImplementation(xhr2);
    vireo.eggShell.loadVia(text);
    vireo.eggShell.executeSlicesUntilClumpsFinished();
}());
