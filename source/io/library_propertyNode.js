/* global Module, mergeInto, LibraryManager */
(function () {
    'use strict';
    var propertyNodeCAPI = {
        jsPropertyNodeWrite: function () {
            Module.property.jsPropertyNodeWrite.apply(undefined, arguments);
        },
        jsPropertyNodeRead: function () {
            Module.property.jsPropertyNodeRead.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, propertyNodeCAPI);
}());
