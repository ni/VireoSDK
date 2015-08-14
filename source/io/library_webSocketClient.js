//initialize connection, onopen, onmessage, onclose, send, close
var WebSocketClient =
{
    jsWebSocketClientConnect: function (url, urlLength, protocol, protocolLength, connectionPointer, errorMessage, occurrenceRef) {
        //console.log('Connecting');
        //TODO: tnelligan should stop code if fails at this point
        NationalInstruments.Vireo.addWebSocketUser(connectionPointer, Pointer_stringify(url, urlLength), Pointer_stringify(protocol, protocolLength), errorMessage);
        
        var ws = NationalInstruments.Vireo.getWebSocketUser(getValue(connectionPointer, 'i32'));
        //TODO: tnelligan change to add event listeners instead
        ws.onopen = function(evt){
            //console.log('Connection Opened');
            NationalInstruments.Vireo.setOccurenceAndError(occurrenceRef, errorMessage, '', 0);
        }
        //TODO: tnelligan fix the way this error listener is handled
        ws.onerror = function(evt){
            NationalInstruments.Vireo.setOccurenceAndError(occurrenceRef, errorMessage, evt, -1);
        }
        
    },
    jsWebSocketClientSend: function (connection, message, messageLength, errorMessage) {
        //console.log('Sending');
        //TODO: tnelligan add error handling
        var ws = NationalInstruments.Vireo.getWebSocketUser(connection);
        ws.send(Pointer_stringify(message, messageLength));
        return 0;
    },
    jsWebSocketClientRead: function (connection, timeout, data, errorMessage, occurrenceRef) {
        var ws = NationalInstruments.Vireo.getWebSocketUser(connection);
        //TODO: tnelligan change way this is handled
        ws.onmessage = function(evt){
            NationalInstruments.Vireo.dataWriteString(data, evt.data, evt.data.length);
            clearTimeout(time);
            NationalInstruments.Vireo.setOccurenceAndError(occurrenceRef, errorMessage, '', 0);
        }
        
        var time = setTimeout(function(){
            NationalInstruments.Vireo.setOccurenceAndError(occurrenceRef, errorMessage, 'The read timed out', -1);
        }, timeout);
    },
    jsWebSocketClientClose: function (connection, errorMessage) {
        //console.log('Closing');
        var ws = NationalInstruments.Vireo.getWebSocketUser(connection);
        ws.onclose = function(evt){
            //TODO: tnelligan remove connectionID here
            return 0;
        }
        ws.close();
        
    },
    jsWebSocketClientState: function (connection, statePointer, errorMessage) {
        var ws = NationalInstruments.Vireo.getWebSocketUser(connection);
        NationalInstruments.Vireo.dataWriteInt32(statePointer, ws.readyState);
        return 0;
    }
};

mergeInto(LibraryManager.library, WebSocketClient);
