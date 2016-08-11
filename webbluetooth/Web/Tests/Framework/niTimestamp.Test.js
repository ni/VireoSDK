//******************************************
// Tests for NITimestamp data type
// National Instruments Copyright 2016
//******************************************

describe('A NITimestamp', function () {
    'use strict';

    var MAXINT64 = '9223372036854775808';
    var MAXUINT64MINUSONE = '18446744073709550000';
    var TS = NationalInstruments.HtmlVI.NITimestamp;

    it ('can be constructed from a string', function () {
        var ts = new TS('1:' + MAXUINT64MINUSONE); // the part after point is MAXINT64-1
        var ts1 = new TS('1:' + MAXINT64); // the part after point is MAXINT64-1

        expect(ts.seconds).toBe(1);
        expect(ts.fractions).toBe(0.9999999999999999); // largest double smaller than 1
        expect(ts1.seconds).toBe(1);
        expect(ts1.fractions).toBe(0.5);

    });

    it ('can be constructed from a Date', function () {
        var epoch = new Date(Date.UTC(1904, 0, 1, 0, 0, 0));

        var ts = new TS(epoch); // the Labview Epoch

        expect(ts.seconds).toBe(0);
        expect(ts.fractions).toBe(0.0); // largest double smaller than 1
    });

    it ('can be constructed from a Number', function () {
        var ts = new TS(10.5);
        expect(ts.seconds).toBe(10);
        expect(ts.fractions).toBe(0.5); // largest double smaller than 1
    });

    it ('can be constructed from a Timestamp', function () {
        var ts = new TS(10.5);
        var newTs = new TS(ts);

        expect(newTs.seconds).toBe(10);
        expect(newTs.fractions).toBe(0.5); // largest double smaller than 1
    });

    it('constructed with no params has a value of 0 seconds and a 0.0 fractional value', function () {
        var ts = new TS(); // the Labview Epoch

        expect(ts.seconds).toBe(0);
        expect(ts.fractions).toBe(0.0); // largest double smaller than 1
    });

    it ('can be converted to a Date', function () {
        var ts = new TS(); // the Labview Epoch

        var d = ts.toDate();

        expect(d.valueOf()).toBe(-ts.epochDiffInSeconds * 1000);
    });

    it('valueOf returns the number of seconds in the timestamp', function () {
        var ts = new TS(1.5);

        expect(0 + ts).toEqual(1.5);
        expect(ts.valueOf()).toEqual(1.5);
    });

    describe ('compare method', function () {
        it ('works for all cases', function () {
            var testVector = [
                [new TS('1:1'), new TS('1:1'), 0],
                [new TS('1:0'), new TS('0:0'), 1],
                [new TS('0:0'), new TS('1:0'), -1],
                [new TS('1:4000'), new TS('1:2000'), 1],
                [new TS('1:2000'), new TS('1:4000'), -1]
            ];

            testVector.forEach(function (t) {
                expect (t[0].compare(t[1])).toBe(t[2]);
            });
        });
    });

    describe('add method', function () {
        it ('works for all cases', function () {
            var testVector = [
                [1.1, 0, [1, 0.1]],
                [1.1, -0.1, [1, 0]],
                [0, -0.1, [-1, 0.9]],
                [1.1, -0.2, [0, 0.9]]
            ];

            testVector.forEach(function (t) {
                var ts = new TS(t[0]);

                ts.add(t[1]);

                expect (ts.seconds).toBe(t[2][0]);
                expect (ts.fractions).toBeCloseTo(t[2][1], 7);
            });
        });
    });

    describe('round trip', function () {
        it('works for all cases', function () {
            var testVector = [0, 0.5, 1.5, -1.5, -0.5];

            testVector.forEach(function (t) {
                var ts1 = new TS(t);

                var firstSerialization = ts1.toString();
                var ts2 = new TS(firstSerialization);
                var secondSerialization = ts2.toString();

                expect(firstSerialization).toBe(secondSerialization);
            });
        });
    });
});
