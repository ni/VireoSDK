describe('Vireo', function () {
    'use strict';

    var vireoHelpers = window.vireoHelpers;

    describe('can encode vireo identifiers', function () {
        describe('throws an exception when parameter', function () {
            it('is not a string', function () {
                var encode = function () {
                    var obj = {
                        variable: 'to_encode'
                    };
                    vireoHelpers.encodeIdentifier(obj);
                };

                expect(encode).toThrow();
            });

            it('is an empty string', function () {
                var encode = function () {
                    vireoHelpers.encodeIdentifier('');
                };

                expect(encode).toThrow();
            });
        });

        it('url encodes the first character if is not a letter [A-Za-z] and it is an ascii character', function () {
            var encoded = vireoHelpers.encodeIdentifier('64bitInteger');
            expect(encoded).toBe('%364bitInteger');
        });

        it('does not url-encode letters or numbers', function () {
            var encoded = vireoHelpers.encodeIdentifier('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
            expect(encoded).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
        });

        it('does not url-encode symbols * + _ $ -', function () {
            var encoded = vireoHelpers.encodeIdentifier('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
            expect(encoded).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
        });

        it('does not encode non-ascii characters', function () {
            var encoded = vireoHelpers.encodeIdentifier('Iñtërnâtiônàlizætiøn☃💩');
            expect(encoded).toBe('Iñtërnâtiônàlizætiøn☃💩');
        });

        it('url-encodes all other characters', function () {
            var encoded = vireoHelpers.encodeIdentifier(' !"#%&\'(),./:;<=>?@[\\]^`{|}~');
            expect(encoded).toBe('%20%21%22%23%25%26%27%28%29%2C%2E%2F%3A%3B%3C%3D%3E%3F%40%5B%5C%5D%5E%60%7B%7C%7D%7E');
        });
    });

    describe('can decode vireo identifiers', function () {
        describe('throws an exception when parameter', function () {
            it('is not a string', function () {
                var decode = function () {
                    var obj = {
                        variable: 'to_encode'
                    };
                    vireoHelpers.decodeIdentifier(obj);
                };

                expect(decode).toThrow();
            });

            it('is an empty string', function () {
                var decode = function () {
                    vireoHelpers.decodeIdentifier('');
                };

                expect(decode).toThrow();
            });
        });

        it('does not decode non-ascii characters', function () {
            var decoded = vireoHelpers.decodeIdentifier('Iñtërnâtiônàlizætiøn☃💩');
            expect(decoded).toBe('Iñtërnâtiônàlizætiøn☃💩');
        });

        it('does not decode symbols * + _ $ -', function () {
            var decoded = vireoHelpers.decodeIdentifier('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
            expect(decoded).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
        });

        it('decodes reserved characters', function () {
            var decoded = vireoHelpers.decodeIdentifier('%20%21%22%23%25%26%27%28%29%2C%2E%2F%3A%3B%3C%3D%3E%3F%40%5B%5C%5D%5E%60%7B%7C%7D%7E');
            expect(decoded).toBe(' !"#%&\'(),./:;<=>?@[\\]^`{|}~');
        });
    });
});
