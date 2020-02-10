// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var normalizeLineEndings = function (multiLineString) {
        return multiLineString.replace(/\r+\n/gm, '\n');
    };

    var removeInlineComments = function (multiLineString) {
        return multiLineString.replace(/^\/\/.*\n/gm, '');
    };

    var convertNulltoNewline = function (multiLineString) {
        return multiLineString.replace(/\0/gm, '\n');
    };

    window.testHelpers.textFormat = {
        normalizeLineEndings: normalizeLineEndings,
        removeInlineComments: removeInlineComments,
        convertNulltoNewline: convertNulltoNewline
    };
}());
