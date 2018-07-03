describe('Peek/Poke different datatypes', function () {
    'use strict';
    // Reference aliases
    var Vireo = window.NationalInstruments.Vireo.Vireo;
    var vireoRunner = window.testHelpers.vireoRunner;
    var fixtures = window.testHelpers.fixtures;

    var vireo = new Vireo();

    var publicApiWaveformSimpleViaUrl = fixtures.convertToAbsoluteFromFixturesDir('publicapi/WaveformSimple.via');

    beforeAll(function (done) {
        fixtures.preloadAbsoluteUrls([
            publicApiWaveformSimpleViaUrl
        ], done);
    });

    it('peeks and pokes on analog waveform type', function (done) {
        var viName = 'MyVI';

        var runSlicesAsync = vireoRunner.rebootAndLoadVia(vireo, publicApiWaveformSimpleViaUrl);
        var viPathParser = vireoRunner.createVIPathParser(vireo, viName);
        var viPathWriter = vireoRunner.createVIPathWriter(vireo, viName);

        expect(viPathParser('wave_dbl_1')).toEqual({
            t0: {
                seconds: '3566073600',
                fraction: '123'
            },
            dt: 5.8,
            Y: [1.2, 1.3, 1, -0.5] // eslint-disable-line id-length
        });

        expect(viPathParser('wave_i32_1')).toEqual({
            t0: {
                seconds: '0',
                fraction: '0'
            },
            dt: 0,
            Y: [] // eslint-disable-line id-length
        });

        var newValue = {
            t0: {
                seconds: '50000',
                fraction: '456'
            },
            dt: 10.5,
            Y: [5, 25] // eslint-disable-line id-length
        };
        viPathWriter('wave_i32_1', newValue);
        expect(viPathParser('wave_i32_1')).toEqual(newValue);

        var newValue2 = {
            t0: {
                seconds: '60000',
                fraction: '656'
            },
            dt: 20.5,
            Y: [45, 55] // eslint-disable-line id-length
        };
        viPathWriter('wave_i32_1.t0', newValue2.t0);
        viPathWriter('wave_i32_1.dt', newValue2.dt);
        viPathWriter('wave_i32_1.Y', newValue2.Y);
        expect(viPathParser('wave_i32_1')).toEqual(newValue2);

        runSlicesAsync(function () {
            expect(viPathParser('wave_i32_1')).toEqual({
                t0: {
                    seconds: '456',
                    fraction: '123'
                },
                dt: 6.8,
                Y: [10, 20, 30] // eslint-disable-line id-length
            });
            done();
        });
    });
});
