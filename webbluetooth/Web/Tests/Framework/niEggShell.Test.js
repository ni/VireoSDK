//****************************************
// Tests for niEggShell file
// National Instruments Copyright 2014
//****************************************

describe('An Eggshell', function () {
    'use strict';

    var VIREO_FUNC = testHelpers.vireoShimFunctionsEnum;

    var vireoShim;

    beforeEach(function () {
        vireoShim = testHelpers.createVireoShim();
    });

    afterEach(function () {
        vireoShim.removeShim();
    });

    it('created without a Vireo throws', function () {
        var vireoOrig = NationalInstruments.Vireo;

        var createEggShell = function () {
            return new NationalInstruments.HtmlVI.EggShell();
        };

        NationalInstruments.Vireo = undefined;

        expect(createEggShell).toThrow();

        NationalInstruments.Vireo = vireoOrig;
    });

    it('created with a Vireo does not throw', function () {
        var createEggShell = function () {
            return new NationalInstruments.HtmlVI.EggShell();
        };

        expect(createEggShell).not.toThrow();
    });

    describe('created with a Vireo', function () {
        var eggShell;

        beforeEach(function () {
            vireoShim.setCallback(undefined);
            eggShell = new NationalInstruments.HtmlVI.EggShell();
        });

        it('can register a print callback', function () {
            var cb = function () {

            };

            vireoShim.setCallback(function (name, args) {
                expect(name).toBe(VIREO_FUNC.CORE_SET_PRINT);
                expect(args[0]).toBe(cb);
            });

            eggShell.setPrintCallback(cb);
        });

        it('throws for an invalid print callback', function () {
            var cb = 'not a function';
            var shouldNotBeCalled = jasmine.createSpy('shouldNotBeCalled');

            vireoShim.setCallback(function () {
                shouldNotBeCalled();
            });

            var testFunc = function () {
                eggShell.setPrintCallback(cb);
            };

            expect(testFunc).toThrow();
            expect(shouldNotBeCalled).not.toHaveBeenCalled();
        });

        it('can register a fpSync callback', function () {
            var cb = function () {
            };

            vireoShim.setCallback(function (name, args) {
                expect(name).toBe(VIREO_FUNC.CORE_SET_FPSYNC);
                expect(args[0]).toBe(cb);
            });

            eggShell.setFrontPanelSynchronousUpdateCallback(cb);
        });

        it('throws for an invalid fpSync callback', function () {
            var cb = 'not a function';
            var shouldNotBeCalled = jasmine.createSpy('shouldNotBeCalled');

            vireoShim.setCallback(function () {
                shouldNotBeCalled();
            });

            var testFunc = function () {
                eggShell.setFrontPanelSynchronousUpdateCallback(cb);
            };

            expect(testFunc).toThrow();
            expect(shouldNotBeCalled).not.toHaveBeenCalled();
        });

        it('executes run slices with slices remaining', function () {
            vireoShim.setCallback(function (name) {
                expect(name).toBe(VIREO_FUNC.EXECUTESLICES);
                return 5; // slices remaining
            });

            expect(eggShell.runSlices()).toBe(false);
        });

        it('executes run slices with no slices remaining', function () {
            vireoShim.setCallback(function (name) {
                expect(name).toBe(VIREO_FUNC.EXECUTESLICES);
                return 0; // slices remaining
            });

            expect(eggShell.runSlices()).toBe(true);
        });

        it('executes loaddVia with an existing user shell', function () {
            var viaText = 'I wish I could type via by hand';

            vireoShim.setCallback(function (name, args) {
                expect([VIREO_FUNC.REBOOT,
                        VIREO_FUNC.CORE_GET_VUSERSHELL,
                        VIREO_FUNC.LOADVIA]).toContain(name);
                if (name === VIREO_FUNC.CORE_GET_VUSERSHELL) {
                    return 5;
                }

                if (name === VIREO_FUNC.LOADVIA) {
                    expect(args[0]).toBe(viaText);
                }
            });

            eggShell.loadVia(viaText);
        });

        it('executes loadVia without an existing user shell', function () {
            var viaText = 'I wish I could type via by hand';

            vireoShim.setCallback(function (name, args) {
                expect([VIREO_FUNC.CORE_GET_VUSERSHELL,
                        VIREO_FUNC.LOADVIA]).toContain(name);
                if (name === VIREO_FUNC.CORE_GET_VUSERSHELL) {
                    return 0;
                }

                if (name === VIREO_FUNC.LOADVIA) {
                    expect(args[0]).toBe(viaText);
                }
            });

            eggShell.loadVia(viaText);
        });

        it('throws during loadVia when not given a string to load', function () {
            var viaText = 5;
            var shouldNotBeCalled = jasmine.createSpy('shouldNotBeCalled');

            vireoShim.setCallback(function () {
                shouldNotBeCalled();
            });

            var func = function () {
                eggShell.loadVia(viaText);
            };

            expect(func).toThrow();
            expect(shouldNotBeCalled).not.toHaveBeenCalled();
        });

        describe('runs peek', function () {
            var viName = 'awesomesauce.vi';
            var path = 'the/usefullness/is/gettings/dubious';

            beforeEach(function () {
                vireoShim.setCallback(undefined);
            });

            it('with a String', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return '"this is a JSON string"';
                });

                expect(eggShell.peek(viName, path, 'String')).toBe('this is a JSON string');
            });

            it('with a Number', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READDOUBLE);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return 5;
                });

                expect(eggShell.peek(viName, path, 'Number')).toBe(5);
            });

            it('with a Boolean false', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return 'false';
                });

                expect(eggShell.peek(viName, path, 'Boolean')).toBe(false);
            });

            it('with a Boolean true', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return 'true';
                });

                expect(eggShell.peek(viName, path, 'Boolean')).toBe(true);
            });

            it('with an Array', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return '[1,2,3]';
                });

                expect(eggShell.peek(viName, path, 'Array')).toEqual([1, 2, 3]);
            });

            it('with a Timestamp', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READDOUBLE);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return 5;
                });

                expect(eggShell.peek(viName, path, 'Timestamp')).toBe(5);
            });

            it('with an Object', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return '{"number":1,"string":"my string","boolean":true}';
                });

                expect(eggShell.peek(viName, path, 'Object')).toEqual({
                    number: 1,
                    string: 'my string',
                    boolean: true
                });
            });

            it('with an explictly mentioned Unknown type', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.READJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);

                    return '{"number":1,"string":"my string","boolean":true}';
                });

                expect(eggShell.peek(viName, path, 'Unknown')).toEqual({
                    number: 1,
                    string: 'my string',
                    boolean: true
                });
            });

            it('and throws with a type string that is unknown to the system', function () {
                var shouldNotBeCalled = jasmine.createSpy('shouldNotBeCalled');

                vireoShim.setCallback(function () {
                    shouldNotBeCalled();
                });

                var func = function () {
                    eggShell.peek(viName, path, 'BANNANA RAILGUNS');
                };

                expect(func).toThrow();
                expect(shouldNotBeCalled).not.toHaveBeenCalled();
            });
        });

        describe('runs poke', function () {
            var viName = 'awesomesauce.vi';
            var path = 'the/usefullness/is/gettings/dubious';

            beforeEach(function () {
                vireoShim.setCallback(undefined);
            });

            it('with a String', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(JSON.parse(args[2])).toEqual('Banana Railgun');
                });

                eggShell.poke(viName, path, 'String', 'Banana Railgun');
            });

            it('with a Number', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEDOUBLE);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(args[2]).toBe(5);
                });

                eggShell.poke(viName, path, 'Number', 5);
            });

            it('with a Boolean false', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(JSON.parse(args[2])).toEqual(false);
                });

                eggShell.poke(viName, path, 'Boolean', false);
            });

            it('with a Boolean true', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(JSON.parse(args[2])).toEqual(true);
                });

                eggShell.poke(viName, path, 'Boolean', true);
            });

            it('with an Array', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(JSON.parse(args[2])).toEqual([1, 2, 3]);
                });

                eggShell.poke(viName, path, 'Array', [1, 2, 3]);
            });

            it('with a Timestamp', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEDOUBLE);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(args[2]).toBe(5);
                });

                eggShell.poke(viName, path, 'Timestamp', 5);
            });

            it('with an Object', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(JSON.parse(args[2])).toEqual({
                        number: 1,
                        string: 'my string',
                        boolean: true
                    });
                });

                eggShell.poke(viName, path, 'Object', {
                    number: 1,
                    string: 'my string',
                    boolean: true
                });
            });

            it('with an explictly mentioned Unknown type', function () {
                vireoShim.setCallback(function (name, args) {
                    expect(name).toBe(VIREO_FUNC.WRITEJSON);
                    expect(args[0]).toBe(viName);
                    expect(args[1]).toBe(path);
                    expect(JSON.parse(args[2])).toEqual({
                        number: 1,
                        string: 'my string',
                        boolean: true
                    });
                });

                eggShell.poke(viName, path, 'Unknown', {
                    number: 1,
                    string: 'my string',
                    boolean: true
                });
            });

            it('and throws with a type string that is unknown to the system', function () {
                var shouldNotBeCalled = jasmine.createSpy('shouldNotBeCalled');

                vireoShim.setCallback(function () {
                    shouldNotBeCalled();
                });

                var func = function () {
                    eggShell.poke(viName, path, 'BANNANA RAILGUNS');
                };

                expect(func).toThrow();
                expect(shouldNotBeCalled).not.toHaveBeenCalled();
            });
        });
    });

});
