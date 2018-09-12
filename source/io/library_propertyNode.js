(function () {
    'use strict';
    var propertyNodeCAPI = {
        jsPropertyNodeWrite: function () {
            Module.propertyNode.jsPropertyNodeWrite.apply(undefined, arguments);
        },
        jsPropertyNodeRead: function () {
            Module.propertyNode.jsPropertyNodeRead.apply(undefined, arguments);
        }
    };

    mergeInto(LibraryManager.library, propertyNodeCAPI);
}());
