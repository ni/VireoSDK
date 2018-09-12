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
