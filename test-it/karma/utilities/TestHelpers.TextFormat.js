(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var normalizeLineEndings = function (multiLineString) {
        return multiLineString.replace(/\r+\n/gm, '\n');
    };

    var removeInlineComments = function (multiLineString) {
        return multiLineString.replace(/^\/\/.*\n/gm, '');
    };

    window.testHelpers.textFormat = {
        normalizeLineEndings: normalizeLineEndings,
        removeInlineComments: removeInlineComments
    };
}());
