// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var testListDataUrl = '/base/test-it/testList.json';

    var enqueueTestNamesForEnvironment = function (resultList, environmentConfigs, environmentName) {
        var environmentConfig = environmentConfigs[environmentName];
        if (environmentConfig === undefined) {
            throw new Error('Cannot find environment ' + environmentName + ' in testList.json');
        }

        if (Array.isArray(environmentConfig.tests)) {
            Array.prototype.push.apply(resultList, environmentConfig.tests);
        }

        if (Array.isArray(environmentConfig.include)) {
            environmentConfig.include.forEach(function (environmentName) {
                enqueueTestNamesForEnvironment(resultList, environmentConfigs, environmentName);
            });
        }
    };

    var makeSyncRequest = function (url, loadPassed) {
        var loadFailed = function () {
            throw new Error('Failed to load file at url: ' + url);
        };

        var request = new XMLHttpRequest();
        request.addEventListener('load', function () {
            if (request.status === 200) {
                loadPassed(request.responseText);
            } else {
                loadFailed();
            }
        });
        request.addEventListener('error', loadFailed);
        request.addEventListener('timeout', loadFailed);
        request.addEventListener('abort', loadFailed);
        request.open('GET', url, false);
        request.send();
    };

    // TODO mraj want to make an async request but need to figure out the metaprogramming
    // for running the test suite
    var getTestNamesForEnvironment = function (environmentName) {
        var testListDataJSON;
        makeSyncRequest(testListDataUrl, function (responseText) {
            testListDataJSON = responseText;
        });

        var testListData = JSON.parse(testListDataJSON);
        var environmentConfigs = testListData.tests;
        var resultList = [];
        enqueueTestNamesForEnvironment(resultList, environmentConfigs, environmentName);
        var testNames = resultList.map(function (nameWithExtension) {
            return nameWithExtension.match(/(.*)\.via/)[1];
        });
        return testNames;
    };

    window.testHelpers.testListLoader = {
        getTestNamesForEnvironment: getTestNamesForEnvironment
    };
}());
