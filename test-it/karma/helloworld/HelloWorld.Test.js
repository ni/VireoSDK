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

    it('can run HelloWorld', function () {
        var Vireo = window.NationalInstruments.Vireo.Vireo;
        var vireo = new Vireo();
        var viaCode = 'start( VI<( clump( Println("Hello, sky. I can fly.") ) ) > )';

        var result = '';
        vireo.eggShell.setPrintFunction(function (text) {
            result += text + '\n';
        });

        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilWait(1);
        expect(result).toBe('Hello, sky. I can fly.\n');
    });

    it('can run HelloWorld Async', function (done) {
        var Vireo = window.NationalInstruments.Vireo.Vireo;
        var vireo = new Vireo();
        var viaCode = 'start( VI<( clump( Println("Hello, sky. I can fly.") ) ) > )';

        var result = '';
        vireo.eggShell.setPrintFunction(function (text) {
            result += text + '\n';
        });

        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
            expect(result).toBe('Hello, sky. I can fly.\n');
            done();
        });
    });
});
