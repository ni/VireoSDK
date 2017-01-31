(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var normalizeLineEndings = function (multiLineString) {
        return multiLineString.replace(/\r\n/gm, '\n');
    };

    window.testHelpers.textFormat = {
        normalizeLineEndings: normalizeLineEndings
    };
}());
