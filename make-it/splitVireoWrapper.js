// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';

    var fs = require('fs');
    var wrapperFile = process.argv[2];
    var prejsFile = process.argv[3];
    var postjsFile = process.argv[4];
    console.log('Splitting wrapper file ', wrapperFile, 'into prejs file', prejsFile, 'and postjs file', postjsFile);

    var wrapper = fs.readFileSync(wrapperFile, {
        encoding: 'utf8'
    });

    var parts = wrapper.split(/^[\s/]*{{insert_vireojs_here}}$/m);

    fs.writeFileSync(prejsFile, parts[0], {
        encoding: 'utf8'
    });

    fs.writeFileSync(postjsFile, parts[1], {
        encoding: 'utf8'
    });
}());
