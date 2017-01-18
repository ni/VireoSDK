describe('Cluster test suite', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo = new Vireo();

    it('verifies default values in a cluster', function (done) {
        var viaPath = fixtures.convertToAbsoluteFromFixturesDir('publicapi/errorcluster.via');

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, viaPath);
        var viPathParser = vireoRunner.createVIPathParser(vireo, 'MyVI');
        // var viPathWriter = vireoRunner.createVIPathWriter(vireo, 'MyVI');

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBe('');
            expect(rawPrintError).toBe('');
            expect(viPathParser('errorCluster')).toEqual({
                status: false,
                code: 0,
                source: ''
            });

            expect(viPathParser('errorClusterDefault')).toEqual({
                status: true,
                code: -43,
                source: 'shut up about moon men'
            });

            done();
        });
    });
});
