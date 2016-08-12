// this is a workaround for the fact that coherent does not set the navigator.language property
// it is a place to hang the language

(function () {
    'use strict';
    window.NIEmbeddedBrowser = {};
    window.NIEmbeddedBrowser.language = 'en-US';
    window.NIEmbeddedBrowser.formatLanguage = 'en-US';
}());
