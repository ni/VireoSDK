/*globals require */
(function () {
    'use strict';

    var fs = require('fs');
    var cheerio = require('cheerio');
    var chutzpahData = require('../../../../../../../chutzpah.json');
    var templateHtml = fs.readFileSync('files/index.template.html').toString();

    // Helper function for building file tags
    var createTag = function (file) {
        if (/\.css$/.test(file)) {
            return '<link rel="stylesheet" href="' + file + '">\r\n';
        } else if (/\.js$/.test(file)) {
            return '<script src="' + file + '"></script>\r\n';
        } else {
            throw new Error('Unknown File Extension for file: ' + file);
        }
    };

    // Filterdown the files in chutzpah.json
    var chutzpahReferencesFiltered = chutzpahData.References.filter(function notChutzpahSpecific(currChutzpahRef) {
        return currChutzpahRef.LVJSChutzpahSpecific === undefined && currChutzpahRef.LVJSTestOnly === undefined;
    });

    var files = chutzpahReferencesFiltered.map(function (currChutzpahRef) {
        var file = currChutzpahRef.Path.substr('../../../../../'.length);
        file = file.replace(/^LabVIEW\/Html\.Controls\.Design\//, '');
        file = file.replace(/^Imports\//, '');
        return file;
    });

    var fileResources = files.filter(function (file) {
        return /^jsResources/.test(file) ||
               /^bower_components/.test(file) ||
               /^Web\/Styles/.test(file);
    });

    var fileElements = files.filter(function (file) {
        return /^Web\/Elements/.test(file) &&
               file !== 'Web/Elements/ni-element-registration.js';
    });

    // Rebuild paths
    var prependPath = function (file) {
        var pre = '../../../../../../../';
        if (/^jsResources/.test(file) || /^bower_components/.test(file)) {
            return pre + 'Imports/' + file;
        } else if (/^Web/.test(file)) {
            return pre + 'LabVIEW/Html.Controls.Design/' + file;
        } else {
            throw new Error('Unknown file prefix, can\'t build final path: ' + file);
        }
    };

    var fileResourcesRebuilt = fileResources.map(prependPath);
    var fileElementsRebuilt = fileElements.map(prependPath);

    // Take the template and insert tags
    var $ = cheerio.load(templateHtml);

    fileResourcesRebuilt.forEach(function (file) {
        $('#resources').before(createTag(file));
    });
    $('#resources').remove();

    fileElementsRebuilt.forEach(function (file) {
        $('#elementsnoreg').before(createTag(file));
    });
    $('#elementsnoreg').remove();

    // Save the file as index.html
    fs.writeFileSync('build/index.html', $.html());
}());
