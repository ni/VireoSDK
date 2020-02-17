// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

describe('Vireo loaded as a global in the browser', function () {
    'use strict';

    it('is in the global scope', function () {
        expect(window.vireoHelpers).toBeDefined();
        expect(window.vireoHelpers.createInstance).toBeDefined();
        expect(typeof window.vireoHelpers.createInstance).toBe('function');
    });

    it('can create a new Vireo instance', async function () {
        var vireo = await window.vireoHelpers.createInstance();
        expect(vireo).toBeDefined();
        expect(vireo.eggShell).toBeDefined();
        expect(vireo.eggShell.loadVia).toBeDefined();
    });

    it('can run HelloWorld', async function () {
        var vireo = await window.vireoHelpers.createInstance();
        var viaCode = 'start( VI<( clump( Println("Hello, sky. I can fly.") ) ) > )';

        var result = '';
        vireo.eggShell.setPrintFunction(function (text) {
            result += text + '\n';
        });

        vireo.eggShell.loadVia(viaCode);
        vireo.eggShell.executeSlicesUntilWait();
        expect(result).toBe('Hello, sky. I can fly.\n');
    });

    it('throws when running HelloWorld async using a callback', async function () {
        var vireoRef = {
            vireo: await window.vireoHelpers.createInstance()
        };
        var viaCode = 'start( VI<( clump( Println("Hello, sky. I can fly.") ) ) > )';

        vireoRef.vireo.eggShell.setPrintFunction(function () {
            // intentionally left blank
        });

        vireoRef.vireo.eggShell.loadVia(viaCode);

        var tryToUseCallback = function () {
            vireoRef.vireo.eggShell.executeSlicesUntilClumpsFinished(function () {
                // intentionally left blank
            });
        };
        expect(tryToUseCallback).toThrowError(/no longer takes a callback/);
        vireoRef.vireo = undefined;
    });

    it('can run HelloWorld async using a promise', async function () {
        var vireo = await window.vireoHelpers.createInstance();
        var viaCode = 'start( VI<( clump( Println("Hello, sky. I can fly.") ) ) > )';

        var result = '';
        vireo.eggShell.setPrintFunction(function (text) {
            result += text + '\n';
        });

        vireo.eggShell.loadVia(viaCode);
        await vireo.eggShell.executeSlicesUntilClumpsFinished();
        expect(result).toBe('Hello, sky. I can fly.\n');
    });
});
