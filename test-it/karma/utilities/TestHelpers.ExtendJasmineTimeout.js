// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';

    // Looks like the timeout tests have some kind of long running interactions with the httpbin server
    // I think after a timeout test runs the browser is holding a socket to the server. When a new request is made to the server, the same socket is trying to be reused, and the request takes longer
    // By extending the timeout across all tests in the timeout test suite we may avoid timing out during these interactions (if that is even what is happening)
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
}());
