
(function () {
    'use strict';

    var dns = require('dns');
    var os = require('os');
    var path = require('path');
    var express = require('express');
    var app = express();
    var fs = require('fs');
    var cheerio = require('cheerio');
    var serveIndex = require('serve-index');
    var dsp = require('digitalsignals');

    require('express-ws')(app);

    // Read the command line arguments.
    var g = {};
    g.port = 3000;
    g.interval = 1000;
    g.viDirectory = '';
    g.packetCount = 0;
    g.times = [Date.now()];
    g.cwd = process.cwd();

    var args = process.argv.slice(2);
    if (args.length < 1) {
        console.log('Usage:');
        console.log('  rpp-server directory-path [-interval nnn]');
        console.log('  directory-path   - path to vi (Must have Function.html inside)');
        console.log('  interval         - in milliseconds');
        return;
    }

    if (args.length >= 1) {
        if (path.isAbsolute(args[0])) {
            g.viDirectory = args[0];
        } else {
            g.viDirectory = path.join(g.cwd, args[0]);
        }
    }

    if (args[1] === '-interval') {
        g.interval = args[2];
    }

    //----------------------------------------------------------------------
    var scrapePanel = function (viPath) {
        var controls = [];
        var viHtmlString = fs.readFileSync(viPath).toString();
        var dom = cheerio.load(viHtmlString);

        // Tags that have binding-info are good condidates.
        dom('[binding-info]').map(function (i, tag) {
            var viName;
            var viRef = dom(tag).attr('vi-ref');
            viRef = typeof viRef === 'string' ? viRef : '';

            if (dom('[vi-ref]').length === 0) {
                viName = dom('[vi-name]').attr('vi-name');
            } else {
                dom('[vi-ref]').each(function (i, tag) {
                    if (typeof dom(tag).attr('vi-name') === 'string') {
                        viName = dom(tag).attr('vi-name');
                        return false;
                    }
                });
            }

            var labelId = dom(tag).attr('label-id');
            var labelText = 'no-label';
            if (labelId) {
                labelText = dom('#' + labelId);
            }

            var bindingInfo = JSON.parse(dom(tag).attr('binding-info'));
            if (bindingInfo.hasOwnProperty('dco')) {

                // Build the basic update packet fothe control
                // The value will be updated as needed.
                var packet = {
                    data: {
                        'value': null
                    },
                    viName: viName,
                    dcoIndex: bindingInfo.dco,
                    messageType: 'PROPERTY_UPDATE'
                };

                var controlInfo = {
                    id: labelId,
                    vi: viName,
                    elementName: tag.name,
                    label: labelText.attr('text'),
                    dco: bindingInfo.dco,
                    packet: packet
                };

                if (bindingInfo.prop === 'text') {
                    controlInfo.dataType = 'string';
                } else {
                    var valueStr = dom(tag).attr('value');
                    if (valueStr) {
                        var value = JSON.parse(dom(tag).attr('value'));
                        if (value.hasOwnProperty('numberValue')) {
                            value = value.numberValue;
                            controlInfo.min = 0;
                            controlInfo.max = 100;
                        }

                        controlInfo.dataType = typeof value;
                    }
                }

                controls.push(controlInfo);
            } else {
                // graph legends have partial binding infos
                console.log('ingnoring binding-info without dco with label' + labelText);
            }
        });
        return controls;
    };

    //----------------------------------------------------------------------
    // Build a new value for each conrol. make the final form of each packet
    // so they don't need to be made for each connection.
    var updateValues = function (controls) {
        controls.forEach(function (c) {
            var value = null;
            if (c.dataType === 'number') {
                value = (Math.random() * 10);
            } else if (c.dataType === 'boolean') {
                value = (Math.random() > 0.5);
            } else if (c.dataType === 'string') {
                value = g.randSring.substring((Math.random() * 40), (Math.random() * 40));
            } else if (c.elementName === 'ni-cartesian-graph') {
                g.osc.generate();
                value =  Array.prototype.slice.call(g.osc.signal);
            }

            c.packet.data.value = value;
            if (value !== null) {
                c.stringifiedPacket = JSON.stringify(c.packet);
            } else {
                c.stringifiedPacket = null;
            }

        });
    };

    //----------------------------------------------------------------------
    // Send the current value packet to each web scoket connection.
    var pumpOutValues = function (ws) {
        g.controls.forEach(function (c) {
            if (c.stringifiedPacket) {
                ws.send(c.stringifiedPacket);
            }
        });
    };

    //----------------------------------------------------------------------
    // State used for making values for the panel.
    g.functionPath = path.join(g.viDirectory, 'function.html');
    console.log('scraping ' + g.functionPath);

    g.controls = scrapePanel(g.functionPath);
    console.log('found ' + g.controls.length + ' bound ni elements.');

    g.randSring = 'The fast brown beagle(🐶) sleeps😎under the fox';
    g.osc = new dsp.Oscillator(dsp.SINEWAVE, 440, 1, 256, 8000);
    g.wsConnections = [];
    g.connectionId = 100;

    //----------------------------------------------------------------------
    // Set up the express server
    var branchRoot = path.join(__dirname, '../../../../../../../'); // Assume script path in repository
    app.use('/static', express.static(g.viDirectory));
    app.use('/static', serveIndex(g.viDirectory, {'icons': true}));
    app.use('/static/jsResources', express.static(path.join(branchRoot, 'Imports/jsResources/')));
    app.use('/static/bower_components', express.static(path.join(branchRoot, 'Imports/bower_components/')));
    app.use('/static/Web', express.static(path.join(branchRoot, 'LabVIEW/Html.Controls.Design/Web/')));
    app.ws('/ws', function (ws, req) {
        // jshint unused: vars
        g.wsConnections.push(ws);
        ws.on('message', function (msg) {
            if (msg) {
                if (JSON.parse(msg).messageType === 'VERSION_MESSAGE') {
                    ws.send(msg);
                }
            }
        });
        ws.on('close', function () {
            g.wsConnections.splice(g.wsConnections.indexOf(ws), 1);
        });
        ws.on('error', function () {
            console.log('WS: Error');
        });
    });

    //----------------------------------------------------------------------
    // Start up the updater. If there are no connections
    // its a no-op.
    (function updateService () {
        updateValues(g.controls);
        g.wsConnections.forEach(function (ws) {
            pumpOutValues(ws);
        });
        g.packetCount++;
        g.times.push(Date.now());
        setTimeout(updateService, g.interval);
    }());

    //----------------------------------------------------------------------
    // Separate message pump for writing stats to console.
    (function updateStats () {
        // Take timing average from last 10 updates.
        var count = g.times.length;
        var dTime = g.times[count - 1] - g.times[0];
        g.times = g.times.slice(-5);

        var interval = (dTime / (count - 1)).toPrecision(4);
        console.log(
            ' { connections: ' + g.wsConnections.length +
            ' averageInterval: ' + interval +
            ' packetCount: ' + g.packetCount + ' }\r');
        setTimeout(updateStats, 1000);
    }());

    dns.lookup(os.hostname(), function (err, address, family) {
        // jshint unused: vars

        console.log('Listening for remote front panel connections');
        console.log('Hostname:', os.hostname());
        console.log('IPAddress:', address, 'Port:' + g.port);
    });

    // Start the server
    app.listen(g.port);
}());

