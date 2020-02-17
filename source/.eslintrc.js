// Copyright (c) 2020 National Instruments
// SPDX-License-Identifier: MIT

module.exports = {
    'parserOptions': {
        'sourceType': 'module'
    },
    'overrides': [{
        'files': ['library_*.js'],
        'parserOptions': {
            'sourceType': 'script'
        },
        'globals': {
            'Module': true,
            'mergeInto': true,
            'LibraryManager': true
        }
    }]
};
