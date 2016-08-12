(function () {
    'use strict';

    var dns = require('dns');
    var os = require('os');
    var path = require('path');
    var express = require('express');
    var serveIndex = require('serve-index');
    var minimist = require('minimist');
    var opener = require('opener');

    var app = express();
    var config = {};
    config.port = 8070;
    config.viDirectory = '';
    config.rootPath = path.join(__dirname, '../../../../../../../'); // Assume script path in repository
    config.cwd = process.cwd(); // User can run script from anywhere

    var args = minimist(process.argv.slice(2), {
        boolean: ['o']
    });

    if (args._.length !== 1 || args.help === true) {
        console.log('Usage:');
        console.log('  npm run serve -- [--help] [--port n] [--root dir] [-o] directory-path');
        console.log('  directory-path   - path to directory containing webvi (required)');
        console.log('  port             - port to start file server (default: ' + config.port + ')');
        console.log('  root             - relative or absolute location of branch root (default: ' + config.rootPath + ')');
        console.log('  o                - open the page in the default web browser');
        console.log('');
        console.log('Example: ');
        console.log('  npm run serve -- yourvi');
        console.log('  npm run serve -- --port 8001 yourvi');
        return;
    }

    if (path.isAbsolute(args._[0])) {
        config.viDirectory = args._[0];
    } else {
        config.viDirectory = path.join(config.cwd, args._[0]);
    }

    if (typeof args.port === 'number') {
        config.port = args.port;
    }

    if (typeof args.root === 'string') {
        if (path.isAbsolute(args.root)) {
            config.rootPath = args.root;
        } else {
            config.rootPath = path.join(config.cwd, args.root);
        }
    }

    console.log('Port: ' + config.port);
    console.log('VI Directory: ' + config.viDirectory);
    console.log('Root: ' + config.rootPath);
    dns.lookup(os.hostname(), function (err, address) {
        console.log('Hostname:', os.hostname());
        console.log('IP Address:', address);
    });

    //----------------------------------------------------------------------
    // Set up the express server
    app.use('/', express.static(config.viDirectory));
    app.use('/jsResources', express.static(path.join(config.rootPath, 'Imports/jsResources/')));
    app.use('/bower_components', express.static(path.join(config.rootPath, 'Imports/bower_components/')));
    app.use('/Web', express.static(path.join(config.rootPath, 'LabVIEW/Html.Controls.Design/Web/')));
    app.use('/', serveIndex(config.viDirectory, {'icons': true}));

    // Start the server
    app.listen(config.port);

    if (args.o === true) {
        opener('http://localhost:' + config.port);
    }
}());
