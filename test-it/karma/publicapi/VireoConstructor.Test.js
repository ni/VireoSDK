describe('The Vireo constructor', function () {
    'use strict';

    it('can execute without parameters and creates a default 16 MB Heap', async function () {
        var vireoHelpers = window.vireoHelpers;
        var vireo = await vireoHelpers.createInstance();
        var heapLength = vireo.eggShell.internal_module_do_not_use_or_you_will_be_fired.HEAP8.length;
        expect(heapLength).toBe(16 * 1024 * 1024);
    });

    it('can execute with a custom module to create a 32 MB Heap', async function () {
        var vireoHelpers = window.vireoHelpers;
        var errorMessage = '';
        try {
            await vireoHelpers.createInstance({
                customModule: {
                    TOTAL_MEMORY: 32 * 1024 * 1024
                }
            });
        } catch (ex) {
            errorMessage = ex.message;
        }

        expect(errorMessage).toMatch(/no longer supports configuration of TOTAL_MEMORY/);
    });
});
