//******************************************
// Tests for Virutal Instrument Reference service class
// National Instruments Copyright 2014
//******************************************

describe('A viReferenceService', function () {
    'use strict';
    var viReferenceService;

    var webAppElement1;
    var viRick;
    var viMorty;

    var webAppElement2;
    var viMrMeeseeks;

    beforeEach(function (done) {
        var remainingWebApps = 2;

        viReferenceService = NationalInstruments.HtmlVI.viReferenceService;

        webAppElement1 = document.createElement('ni-web-application');
        webAppElement1.testMode = true;
        webAppElement1.disableAutoStart = true;

        viRick = document.createElement('ni-virtual-instrument');
        viRick.viName = 'Wubba lubba dub dub.gvi';
        viRick.viRef = 'Rick';

        viMorty = document.createElement('ni-virtual-instrument');
        viMorty.viName = 'One True Morty.gvi';
        viMorty.viRef = 'Morty';

        webAppElement1.appendChild(viRick);
        webAppElement1.appendChild(viMorty);

        webAppElement1.addEventListener('service-state-changed', function runningListener(evt) {
            if (evt.detail.serviceState === NationalInstruments.HtmlVI.TestUpdateService.StateEnum.READY) {
                webAppElement1.removeEventListener('service-state-changed', runningListener);
                remainingWebApps--;
                if (remainingWebApps === 0) {
                    done();
                }
            }
        });

        webAppElement2 = document.createElement('ni-web-application');
        webAppElement2.testMode = true;
        webAppElement2.disableAutoStart = true;

        viMrMeeseeks = document.createElement('ni-virtual-instrument');
        viMrMeeseeks.viName = 'Look at me.gvi';
        viMrMeeseeks.viRef = 'Meeseeks';

        webAppElement2.appendChild(viMrMeeseeks);

        webAppElement2.addEventListener('service-state-changed', function runningListener2(evt) {
            if (evt.detail.serviceState === NationalInstruments.HtmlVI.TestUpdateService.StateEnum.READY) {
                webAppElement2.removeEventListener('service-state-changed', runningListener2);
                remainingWebApps--;
                if (remainingWebApps === 0) {
                    done();
                }
            }
        });

        document.body.appendChild(webAppElement1);
        document.body.appendChild(webAppElement2);
    });

    afterEach(function () {
        document.body.removeChild(webAppElement1);
        document.body.removeChild(webAppElement2);
        webAppElement1 = undefined;
        viRick = undefined;
        viMorty = undefined;
        // TODO mraj should wait until web app unregisters?
    });

    // -------------------------------------------------
    // Testing setters and getters for properties
    // -------------------------------------------------
    it('is defined', function () {
        expect(viReferenceService).toBeDefined();
    });

    // -------------------------------------------------
    // Testing behavior (methods)
    // -------------------------------------------------

    it('can get VIs by the VI reference', function () {
        var rickNameByRef = viReferenceService.getVIModelByVIRef('Rick').viName;
        expect(rickNameByRef).toBe('Wubba lubba dub dub.gvi');

        var mortyNameByRef = viReferenceService.getVIModelByVIRef('Morty').viName;
        expect(mortyNameByRef).toBe('One True Morty.gvi');

        var meeseeksNameByRef = viReferenceService.getVIModelByVIRef('Meeseeks').viName;
        expect(meeseeksNameByRef).toBe('Look at me.gvi');
    });

    it('can get all the VI models for a specific web app model', function () {
        var webAppModel1 = NationalInstruments.HtmlVI.webApplicationModelsService.getModel(webAppElement1);
        var viModels1 = viReferenceService.getAllVIModelsForWebAppModel(webAppModel1);

        expect(Object.keys(viModels1).length).toBe(2);
        expect(viModels1['Wubba lubba dub dub.gvi']).toBeDefined();
        expect(viModels1['One True Morty.gvi']).toBeDefined();

        var webAppModel2 = NationalInstruments.HtmlVI.webApplicationModelsService.getModel(webAppElement2);
        var viModels2 = viReferenceService.getAllVIModelsForWebAppModel(webAppModel2);
        expect(Object.keys(viModels2).length).toBe(1);
        expect(viModels2['Look at me.gvi']).toBeDefined();
    });

    it('can get the web app model for a VI reference', function () {
        var webAppModelForRick = viReferenceService.getWebAppModelByVIRef('Rick');
        var webAppModelForMorty = viReferenceService.getWebAppModelByVIRef('Morty');
        var webAppModelForMeeseeks = viReferenceService.getWebAppModelByVIRef('Meeseeks');

        expect(webAppModelForRick).toBeDefined();
        expect(webAppModelForMorty).toBeDefined();
        expect(webAppModelForMeeseeks).toBeDefined();

        expect(webAppModelForRick instanceof NationalInstruments.HtmlVI.Models.WebApplicationModel).toBe(true);
        expect(webAppModelForMorty instanceof NationalInstruments.HtmlVI.Models.WebApplicationModel).toBe(true);
        expect(webAppModelForMeeseeks instanceof NationalInstruments.HtmlVI.Models.WebApplicationModel).toBe(true);

    });
});

