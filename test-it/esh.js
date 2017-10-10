#!/usr/bin/env node
// Simple command line Vireo shell
(function () {
    'use strict';

    var argv = process.argv.slice();
    argv.shift();
    var command = argv.shift();
    var arg = argv[0];
    var vireo = {};
    var actualVireo;

    var setupVJS = function () {
        var Vireo;
        try {
            Vireo = require('../');

            actualVireo = new Vireo();
            vireo = actualVireo.eggShell;
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                console.log('Error: vireo.js not found (Maybe build it first?)');
                process.exit(1);
            } else {
                throw err;
            }
        }
        vireo.setPrintFunction(function (text) {
            console.log(text);
        });
    };

    setupVJS();

    var fs = require('fs');
    try {
        var text = fs.readFileSync(arg).toString();
        vireo.loadVia(text);
    } catch (e) {
        console.log('Usage: ' + command + ' [file.via]...');
        if (arg.substring(0, 1) !== '-') {
            console.log('Cannot open ' + arg);
        }
        process.exit(1);
    }

    var execVireo = function () {
        var state;
        while ((state = vireo.executeSlicesUntilWait(100000)) !== 0) {
            var timeDelay = state > 0 ? state : 0;
            if (timeDelay > 0) {
                setTimeout(execVireo, timeDelay);
                break;
            }
        }
    };
    execVireo();
}());
