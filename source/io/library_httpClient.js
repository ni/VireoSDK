/* global Module, mergeInto, LibraryManager */
(function () {
    'use strict';
    var httpClientCAPI = {
        jsHttpClientOpen: function () {
            Module.httpClient.jsHttpClientOpen.apply(undefined, arguments);
        },

        jsHttpClientClose: function () {
            Module.httpClient.jsHttpClientClose.apply(undefined, arguments);
        },

        jsHttpClientAddHeader: function () {
            Module.httpClient.jsHttpClientAddHeader.apply(undefined, arguments);
        },

        jsHttpClientRemoveHeader: function () {
            Module.httpClient.jsHttpClientRemoveHeader.apply(undefined, arguments);
        },

        jsHttpClientGetHeader: function () {
            Module.httpClient.jsHttpClientGetHeader.apply(undefined, arguments);
        },

        jsHttpClientHeaderExists: function () {
            Module.httpClient.jsHttpClientHeaderExists.apply(undefined, arguments);
        },

        jsHttpClientListHeaders: function () {
            Module.httpClient.jsHttpClientListHeaders.apply(undefined, arguments);
        },

        jsHttpClientMethod: function () {
            Module.httpClient.jsHttpClientMethod.apply(undefined, arguments);
        },

        jsHttpClientSetCredentials: function () {
            Module.httpClient.jsHttpClientSetCredentials.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, httpClientCAPI);
}());
