(function () {
    'use strict';
    window.testHelpers = window.testHelpers || {};

    var testListDataUrl = '/base/test-it/testList.json';

    var getTestNamesForEnvironmentFromTestList = function (testListData, environmentName) {
        var environment = testListData.tests[environmentName];
        if (environment === undefined) {
            throw new Error('Cannot find environment ' + environmentName + ' in testList.json');
        }

        var environmentSpecificTestNames = environment.tests;
        var environmentIncludes = environment.include || [];
        var listOfIncludedEnvironmentNameLists = environmentIncludes.map(function (environmentName) {
            return testListData.tests[environmentName].tests;
        });

        var testNames = Array.prototype.concat.apply(environmentSpecificTestNames, listOfIncludedEnvironmentNameLists);
        return testNames;
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
        request.open('GET', testListDataUrl, false);
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
        var testNamesWithExtensions = getTestNamesForEnvironmentFromTestList(testListData, environmentName);
        var testNames = testNamesWithExtensions.map(function (nameAndExtension) {
            return nameAndExtension.match(/(.*)\.via/)[1];
        });
        return testNames;
    };

    window.testHelpers.testListLoader = {
        getTestNamesForEnvironment: getTestNamesForEnvironment
    };
}());
