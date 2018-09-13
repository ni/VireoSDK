describe('Vireo', function () {
    'use strict';

    var staticHelpers = window.vireoHelpers.staticHelpers;

    describe('can encode vireo identifiers', function () {
        describe('throws an exception when parameter', function () {
            it('is not a string', function () {
                var encode = function () {
                    var obj = {
                        variable: 'to_encode'
                    };
                    staticHelpers.encodeIdentifier(obj);
                };

                expect(encode).toThrow();
            });

            it('is an empty string', function () {
                var encode = function () {
                    staticHelpers.encodeIdentifier('');
                };

                expect(encode).toThrow();
            });
        });

        it('url encodes the first character if is not a letter [A-Za-z] and it is an ascii character', function () {
            var encoded = staticHelpers.encodeIdentifier('64bitInteger');
            expect(encoded).toBe('%364bitInteger');
        });

        it('does not url-encode letters or numbers', function () {
            var encoded = staticHelpers.encodeIdentifier('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
            expect(encoded).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
        });

        it('does not url-encode symbols * + _ $ -', function () {
            var encoded = staticHelpers.encodeIdentifier('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
            expect(encoded).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
        });

        it('does not encode non-ascii characters', function () {
            var encoded = staticHelpers.encodeIdentifier('Iñtërnâtiônàlizætiøn☃💩');
            expect(encoded).toBe('Iñtërnâtiônàlizætiøn☃💩');
        });

        it('url-encodes all other characters', function () {
            var encoded = staticHelpers.encodeIdentifier(' !"#%&\'(),./:;<=>?@[\\]^`{|}~');
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
                    staticHelpers.decodeIdentifier(obj);
                };

                expect(decode).toThrow();
            });

            it('is an empty string', function () {
                var decode = function () {
                    staticHelpers.decodeIdentifier('');
                };

                expect(decode).toThrow();
            });
        });

        it('does not decode non-ascii characters', function () {
            var decoded = staticHelpers.decodeIdentifier('Iñtërnâtiônàlizætiøn☃💩');
            expect(decoded).toBe('Iñtërnâtiônàlizætiøn☃💩');
        });

        it('does not decode symbols * + _ $ -', function () {
            var decoded = staticHelpers.decodeIdentifier('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
            expect(decoded).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789*+_$-');
        });

        it('decodes reserved characters', function () {
            var decoded = staticHelpers.decodeIdentifier('%20%21%22%23%25%26%27%28%29%2C%2E%2F%3A%3B%3C%3D%3E%3F%40%5B%5C%5D%5E%60%7B%7C%7D%7E');
            expect(decoded).toBe(' !"#%&\'(),./:;<=>?@[\\]^`{|}~');
        });
    });
});
