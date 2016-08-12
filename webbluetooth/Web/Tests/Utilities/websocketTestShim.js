
(function () {
    'use strict';

    window.testHelpers = window.testHelpers || {};

    window.testHelpers.webSocketShimFunctionsEnum = Object.freeze({
        CONSTRUCTOR: 'CONSTRUCTOR',
        ADDEVENTLISTENER: 'ADDEVENTLISTENER',
        REMOVEEVENTLISTENER: 'REMOVEEVENTLISTENER',
        SEND: 'SEND',
        CLOSE: 'CLOSE'
    });

    testHelpers.createWebSocketShim = function () {
        var original,
            errorFunc,
            cbName = 'callback',
            cbContainer = {},
            WEBSOCKET_FUNC = testHelpers.webSocketShimFunctionsEnum;

        cbContainer[cbName] = undefined;

        original = window.WebSocket;
        window.WebSocket = testHelpers.shimBuilder.createShimConstructorFunction(WEBSOCKET_FUNC.CONSTRUCTOR, cbContainer, cbName);

        testHelpers.shimBuilder.addShimFunction(window.WebSocket.prototype, 'addEventListener', WEBSOCKET_FUNC.ADDEVENTLISTENER, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(window.WebSocket.prototype, 'removeEventListener', WEBSOCKET_FUNC.REMOVEEVENTLISTENER, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(window.WebSocket.prototype, 'send', WEBSOCKET_FUNC.SEND, cbContainer, cbName);
        testHelpers.shimBuilder.addShimFunction(window.WebSocket.prototype, 'close', WEBSOCKET_FUNC.CLOSE, cbContainer, cbName);

        errorFunc = function () {
            throw new Error('WebSocket shim has already been removed');
        };

        return {
            setCallback: function (newCb) {
                if (cbContainer[cbName] === errorFunc) {
                    errorFunc();
                } else {
                    cbContainer[cbName] = newCb;
                }
            }, removeShim: function () {
                cbContainer[cbName] = errorFunc;

                window.WebSocket = original;
            }
        };
    };
}());
