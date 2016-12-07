

WebSocketUser = function () {
    "use strict";


};


//TODO: tnelligan change name to reflect it is a collection of connections
WebSocketUsers = function () {
    "use strict";
    //Properties
    this.webSocketClients = {};

    if (typeof this.WebSocketUsersMethods !== 'function') {
        var proto = WebSocketUsers.prototype;
        proto.WebSocketUsersMethods = function () {
        };

        proto.add = function (url, protocol) {
            var webSocketUser = new WebSocket(url); //put protocol in later
            var handle = Object.keys(this.webSocketClients).length + 1;
            var strHandle = handle.toString();
            this.webSocketClients[strHandle] = webSocketUser;
            console.log('Created handle(' + handle + ')');
            return handle;
        };

        proto.remove = function (handle) {
            var strHandle = handle.toString();
            if (this.webSocketClients.hasOwnProperty(strHandle))
            {
                var user = this.webSocketClients[strHandle];
                //console.log ('Deleted handle(' + strHandle + ') for user: "' + user.getUserName() + '".');
                delete this.webSocketClients[strHandle];
            }
            else
            {
                throw new Error('Unknown handle(' + handle + ').');
            }
        };

        proto.get = function (handle) {
            var strHandle = handle.toString();
            if (this.webSocketClients.hasOwnProperty(strHandle))
            {
                var user = this.webSocketClients[strHandle];

                return user;
            }
            else
            {
                return null;
            }
        };
    }
}


var webSocketUsers = new WebSocketUsers();


    addWebSocketUser:
        function (handlePointer, url, protocol, errorMessage) {
            var handle = 0;
            var returnValue = 0;
            var errorString = '';
            try
            {
                handle = webSocketUsers.add(url, protocol);
            }
            catch (error)
            {
                handle = 0;
                returnValue = -1;
                errorString = "Unable to open WebSocket handle: " + error.message;
            }
            NationalInstruments.Vireo.dataWriteUInt32(handlePointer, handle);
            NationalInstruments.Vireo.dataWriteString(errorMessage, errorString, errorString.length);
            return returnValue;
        },
    removeWebSocketUser:
        function (handle, errorMessage) {
            var returnValue = 0;
            var errorString = '';
            try
            {
                webSocketUsers.remove(handle);
            }
            catch (error)
            {
                returnValue = -1;
                errorString = "Unable to close WebSocket handle: " + error.message;
            }
            NationalInstruments.Vireo.dataWriteString(errorMessage, errorString, errorString.length);
            return returnValue;
        },
    //TODO: tnelligan add try catch and errorMessage and return value
    getWebSocketUser:
        function (handle) {
            return webSocketUsers.get(handle);
        },
    //TODO: tnelligan refactor so that http and websockets both use this
    setOccurrenceAndError:
        function (occurrenceRef, errorMessage, errorString, errorNum) {
            NationalInstruments.Vireo.dataWriteString(errorMessage, errorString, errorString.length);
            NationalInstruments.Vireo.setOccurrence(occurrenceRef);
            return errorNum;
        }
        