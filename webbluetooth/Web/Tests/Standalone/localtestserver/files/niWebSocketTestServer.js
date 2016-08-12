(function () {
    'use strict';
    var WebSocketServer = require('websocket').server;
    var http = require('http');
    var server = http.createServer(function (request, response) {
        console.log((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });
    server.listen(8181, function () {
        console.log((new Date()) + ' Server is listening on port 8181');
    });

    var wsServer = new WebSocketServer({
        httpServer: server,
        // You should not use autoAcceptConnections for production
        // applications, as it defeats all standard cross-origin protection
        // facilities built into the protocol and the browser.  You should
        // *always* verify the connection's origin and decide whether or not
        // to accept it.
        autoAcceptConnections: false
    });

    wsServer.on('request', function (request) {
        var connection = request.accept(null, request.origin);
        console.log((new Date()) + ' Connection accepted.');

        connection.on('message', function (message) {
            var parsedMessage;

            if (message.type === 'utf8') {
                console.log('Received Message: ' + message.utf8Data);

                parsedMessage = JSON.parse(message.utf8Data);

                if (parsedMessage.messageType === 'PROPERTY_UPDATE') {
                    parsedMessage.dcoIndex++;
                    connection.sendUTF(JSON.stringify(parsedMessage));
                    console.log('Returned updated property message: ' + JSON.stringify(parsedMessage));

                } else {
                    connection.sendUTF(message.utf8Data);
                    console.log('Returned message');
                }

            } else if (message.type === 'binary') {
                console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');

                connection.sendBytes(message.binaryData);
                console.log('Returned binary message');
            }
        });
        connection.on('close', function () {
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    });
}());
