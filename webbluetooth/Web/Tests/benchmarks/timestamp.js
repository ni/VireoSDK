/*global suite: false, benchmark: false */

suite('Timestamp creation no  params', function () {
    'use strict';

    benchmark('NITimestamp',
    function () {
        return new NationalInstruments.HtmlVI.NITimestamp();
    });
});

suite('Timestamp creation from string', function () {
    'use strict';

    benchmark('NITimestamp', function () {
        return new NationalInstruments.HtmlVI.NITimestamp(this.str);
    });
}, {
    setup: function () {
        'use strict';
        this.str = '12345678.123456789';
    }
});

suite('Timestamp creation from number', function () {
    'use strict';

    benchmark('NITimestamp',
    function () {
        return new NationalInstruments.HtmlVI.NITimestamp(12345678.12345678);
    });
});

suite('Timestamp creation from Date', function () {
    'use strict';

    benchmark('NITimestamp',
    function () {
        return new NationalInstruments.HtmlVI.NITimestamp(this.date);
    });
}, {
    setup: function () {
        'use strict';
        this.date =  Date.now();
    }
});

suite('Timestamp to Date', function () {
    'use strict';

    benchmark('NITimestamp',
    function () {
        return this.ts.toDate();
    });
}, {
    setup: function () {
        'use strict';

        var date = Date.now();
        this.ts = new NationalInstruments.HtmlVI.NITimestamp(date);
    }
});

suite('Timestamp to String', function () {
    'use strict';

    benchmark('NITimestamp',
    function () {
        return this.ts.toString();
    });

}, {
    setup: function () {
        'use strict';

        var date = Date.now();
        this.ts = new NationalInstruments.HtmlVI.NITimestamp(date);
    }
});
