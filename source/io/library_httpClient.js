/*global Module, mergeInto, LibraryManager */
(function () {
    'use strict';
    var httpClientCAPI = {
        jsHttpClientOpen: function () {
            return Module.httpClient.jsHttpClientOpen.apply(undefined, arguments);
        },

        jsHttpClientClose: function () {
            return Module.httpClient.jsHttpClientClose.apply(undefined, arguments);
        },

        jsHttpClientAddHeader: function () {
            return Module.httpClient.jsHttpClientAddHeader.apply(undefined, arguments);
        },

        jsHttpClientRemoveHeader: function () {
            return Module.httpClient.jsHttpClientRemoveHeader.apply(undefined, arguments);
        },

        jsHttpClientGetHeader: function () {
            return Module.httpClient.jsHttpClientGetHeader.apply(undefined, arguments);
        },

        jsHttpClientHeaderExist: function () {
            return Module.httpClient.jsHttpClientHeaderExist.apply(undefined, arguments);
        },

        jsHttpClientListHeaders: function () {
            return Module.httpClient.jsHttpClientListHeaders.apply(undefined, arguments);
        },

        jsHttpClientMethod: function () {
            Module.httpClient.jsHttpClientMethod.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, httpClientCAPI);
}());
