//****************************************
// Create a section fixture and return it
// National Instruments Copyright 2015
//****************************************
/*global setFixtures*/

window.testHelpers = window.testHelpers || {};

testHelpers.addSectionFixture = function () {
    'use strict';

    var fixture = setFixtures('<section>');
    var fixtureCanvas = fixture.find('section').get(0);
    return fixtureCanvas;
};
