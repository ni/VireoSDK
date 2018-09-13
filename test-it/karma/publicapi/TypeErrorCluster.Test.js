describe('Cluster test suite', function () {
    'use strict';
    // Reference aliases
    var vireoHelpers = window.vireoHelpers;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    // Sharing Vireo instances across tests make them run soooo much faster
    var vireo;
    beforeAll(async function () {
        vireo = await vireoHelpers.createInstance();
    });

    var publicApiErrorClusterViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/ErrorCluster.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiErrorClusterViaUrl
        ], done);
    });

    it('verifies default values in a cluster', function (done) {
        var viName = 'MyVI';

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiErrorClusterViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);

        runSlicesAsync(function (rawPrint, rawPrintError) {
            expect(rawPrint).toBeEmptyString();
            expect(rawPrintError).toBeEmptyString();
            expect(viPathParser('errorCluster')).toEqual({
                status: false,
                code: 0,
                source: ''
            });

            var newValue = {
                status: true,
                code: -45,
                source: 'ha ha ha'
            };
            viPathWriter('errorCluster', newValue);
            expect(viPathParser('errorCluster')).toEqual(newValue);

            var newValue2 = {
                status: false,
                code: -98,
                source: 'oh oh oh'
            };
            viPathWriter('errorCluster.status', newValue2.status);
            viPathWriter('errorCluster.code', newValue2.code);
            viPathWriter('errorCluster.source', newValue2.source);
            expect(viPathParser('errorCluster')).toEqual(newValue2);

            expect(viPathParser('errorClusterDefault')).toEqual({
                status: true,
                code: -43,
                source: 'shut up about moon men'
            });

            done();
        });
    });
});
