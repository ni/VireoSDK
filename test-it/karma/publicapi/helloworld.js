describe('Vireo loaded as a global in the browser', function () {
    'use strict';

    it('is in the global scope', function () {
        expect(window.NationalInstruments).toBeDefined();
        expect(window.NationalInstruments.Vireo).toBeDefined();
        expect(typeof window.NationalInstruments.Vireo.Vireo).toBe('function');
    });

    it('can create a new Vireo instance', function () {
        var Vireo = window.NationalInstruments.Vireo.Vireo;
        var vireo = new Vireo();
        expect(vireo).toBeDefined();
    });

    xit('can run HelloWorld', function () {
        var Vireo = window.NationalInstruments.Vireo.Vireo;
        var vireo = new Vireo();

        var text = window.testHelpers.fixtures.loadTestItVia('HelloWorld.via');
        var textResult = window.testHelpers.fixtures.loadTestItVia('results/HelloWorld.vtr');
        var result = '';
        vireo.eggShell.loadVia(text);
        vireo.eggShell.setPrintFunction(function (text) {
            result += text + '\n';
        });
        vireo.eggShell.executeSlices(1);
        expect(result).toBe(textResult);
    });
});
