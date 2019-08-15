const isCharacterAlphabetOrNonAscii = function (codePoint) {
    return ((codePoint >= 0x41 && codePoint <= 0x5A) || (codePoint >= 0x61 && codePoint <= 0x7A) || (codePoint > 0x7F));
};

const encodeIdentifier = function (str) {
    if (typeof str !== 'string' || str === '') {
        throw new Error('Identifier must be a non-empty string. Found: ' + str);
    }

    let encoded = '',
        codePoint = str.charCodeAt(0),
        ch = str.charAt(0);

    if (!isCharacterAlphabetOrNonAscii(codePoint)) {
        encoded += '%' + codePoint.toString(16).toUpperCase();
    } else {
        encoded += ch;
    }

    for (let i = 1; i < str.length; i += 1) {
        codePoint = str.charCodeAt(i);
        ch = str.charAt(i);

        // Do not encode if it is a number [0-9] or uppercase letter [A-Z] or lowercase [a-z] or any of these [*+_-$] or a non-ascii character.
        if ((codePoint >= 0x30 && codePoint <= 0x39) || (codePoint >= 0x41 && codePoint <= 0x5A) || (codePoint >= 0x61 && codePoint <= 0x7A) ||
            codePoint === 0x24 || codePoint === 0x2A || codePoint === 0x2B || codePoint === 0x2D || codePoint === 0x5F || codePoint > 0x7F) {
            encoded += ch;
        } else {
            encoded += '%' + codePoint.toString(16).toUpperCase();
        }
    }

    return encoded;
};

const decodeIdentifier = function (str) {
    if (typeof str !== 'string' || str === '') {
        throw new Error('Identifier must be a non-empty string. Found: ' + str);
    }

    return decodeURIComponent(str);
};

export default {
    encodeIdentifier,
    decodeIdentifier
};
