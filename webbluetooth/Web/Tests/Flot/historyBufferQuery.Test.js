/* global describe, it, expect, HistoryBuffer */
/* jshint browser: true*/

/* brackets-xunit: includes=../lib/cbuffer.js,../lib/jsverify.standalone.js,../lib/jasmineHelpers2.js,../jquery.flot.historybuffer.js */

describe('A History Buffer', function () {
    'use strict';

    it('has a query method', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.query).toEqual(jasmine.any(Function));
    });

    it('has basic query capabilities', function () {
        var hb = new HistoryBuffer(10);

        hb.push(5);

        expect(hb.query(0, 1, 1)).toEqual([[0, 5]]);
    });

    it('has basic query capabilities for buffers with multiple data series', function () {
        var hb = new HistoryBuffer(10, 2);

        hb.push([5, 6]);

        expect(hb.query(0, 1, 1, 0)).toEqual([[0, 5]]);
        expect(hb.query(0, 1, 1, 1)).toEqual([[0, 6]]);
    });

    it('returns empty data series when querying outside of the bounds', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

        expect(hb.query(12, 13, 1)).toEqual([]);
        expect(hb.query(0, 1, 1)).toEqual([]);
    });

    it('returns proper data series after the buffer has slid', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

        expect(hb.query(10, 11, 1)).toEqual([[10, 10]]);
        expect(hb.query(0, 3, 1)).toEqual([[2, 2]]);
    });

    it('returns a decimated data series for big buffers', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 64);
        expect(res.length).toBeGreaterThan(511);
        expect(res.length).not.toBeGreaterThan(1024);
        expect(res[0]).toEqual([0, 0]);
        expect(res[1]).toEqual([63, 63]);
        expect(indexesAreInAscendingOrder(res)).toBe(true);
    });

    it('returns a correctly decimated data series for steps not multiple of 32', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 99);
        expect(res[0]).toEqual([0, 0]);
        expect(res[1]).toEqual([98, 98]);
        expect(indexesAreInAscendingOrder(res)).toBe(true);
    });

    it('checks that the acceleration structure is up to date', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 64);
        expect(hb.query(0, 32768, 64).length).toBeGreaterThan(511);
        expect(indexesAreInAscendingOrder(res)).toBe(true);

        expect(hb.tree.tree.levels[1].nodes.get(0).min).toBe(0);
        expect(hb.tree.tree.levels[1].nodes.get(0).max).toBe(1023);
    });

    it('checks that the acceleration structure is up to date after slide', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size * 2; i++) {
            hb.push(i);
        }

        var res = hb.query(0, 32768, 64);
        expect(hb.query(32768, 65536, 64).length).toBeGreaterThan(511);
        expect(indexesAreInAscendingOrder(res)).toBe(true);

        expect(hb.tree.tree.levels[1].nodes.get(0).min).toBe(32768);
        expect(hb.tree.tree.levels[1].nodes.get(0).max).toBe(33791);
    });

    it('uses the acceleration structure to answer the queries', function () {
        var size = 32768;
        var hb = new HistoryBuffer(size);

        for (var i = 0; i < size; i++) {
            hb.push(i);
        }

        hb.query(0, 1, 1); // make sure the acceleration tree is up to date
        var firstTree = hb.trees[0].tree;
        expect(firstTree.levels[0].nodes.get(0).min).toBe(0);
        expect(firstTree.levels[0].nodes.get(0).max).toBe(31);

        // tamper with the acceleration tree
        firstTree.levels[0].nodes.get(0).min = -7;
        firstTree.levels[0].nodes.get(0).minIndex = 77;
        firstTree.levels[0].nodes.get(0).max = 99;
        firstTree.levels[0].nodes.get(0).maxIndex = 99;

        // make sure the rigged data is present in the query results
        var res = hb.query(0, 32768, 32);

        expect(res[0]).toEqual([77, -7]);
        expect(res[1]).toEqual([99, 99]);
    });

    it('gives the same answer when using the queries vs toDataSeries with step 10', function () {
        var hbSize = 200;
        var hb;
        var step = 10;
        var arr = [-221.85291510634124, -246.04653050377965, -151.78832260798663, 144.27369455527514, 144.56944866478443, 90.68919277377427, 53.512750804424286, -135.86282426398247, -141.51867881510407, -97.66538087837398, -253.53739414270967, -187.60230323765427, 247.81563513725996, 137.88111602514982, 163.35517396777868, -241.80482274480164, 117.128308176063, 248.53530455566943, 235.3106337301433, -186.18678852450103, 63.65153900440782, -223.634405516088, -52.78648662753403, 123.22961756587029, -180.77537014055997, -179.4641258250922, -116.3951157303527, -71.3419539174065, -74.3008337393403, 104.36698244791478];

        hb = new HistoryBuffer(hbSize);
        hb.setBranchingFactor(4);

        hb.appendArray(arr);

        var decimatedRes = decimateRawData(hb, step);
        var query = hb.query(0, hb.count, step);

        expect(JSON.stringify(decimatedRes)).toEqual(JSON.stringify(query));
    });

    describe('Segment tree update', function () {
        it('recomputes the minmax for a one level tree on push', function () {
            var hb = new HistoryBuffer(128);
            hb.push(1);

            hb.updateSegmentTrees();
            var firstTree = hb.trees[0].tree;

            expect(firstTree.levels[0].nodes.get(0).min).toBe(1);
            expect(firstTree.levels[0].nodes.get(0).minIndex).toBe(0);
            expect(firstTree.levels[0].nodes.get(0).max).toBe(1);
            expect(firstTree.levels[0].nodes.get(0).maxIndex).toBe(0);
        });

        it('recomputes the minmax for a one level tree on fill', function () {
            var hb = new HistoryBuffer(64);
            for (var i = 0; i < 64; i++) {
                hb.push(i);
            }

            hb.updateSegmentTrees();
            var firstTree = hb.trees[0].tree;

            expect(firstTree.levels[0].nodes.get(0).min).toBe(0);
            expect(firstTree.levels[0].nodes.get(0).minIndex).toBe(0);
            expect(firstTree.levels[0].nodes.get(0).max).toBe(31);
            expect(firstTree.levels[0].nodes.get(0).maxIndex).toBe(31);
            expect(firstTree.levels[0].nodes.get(1).min).toBe(32);
            expect(firstTree.levels[0].nodes.get(1).minIndex).toBe(32);
            expect(firstTree.levels[0].nodes.get(1).max).toBe(63);
            expect(firstTree.levels[0].nodes.get(1).maxIndex).toBe(63);
        });

        it('computes the minmax for a one level tree on one element overwrite', function () {
            var hb = new HistoryBuffer(64);
            for (var i = 0; i < 65; i++) {
                hb.push(i);
            }

            hb.updateSegmentTrees();
            var firstTree = hb.trees[0].tree;

            expect(firstTree.levels[0].nodes.get(0).min).toBe(1);
            expect(firstTree.levels[0].nodes.get(0).minIndex).toBe(1);
            expect(firstTree.levels[0].nodes.get(0).max).toBe(31);
            expect(firstTree.levels[0].nodes.get(0).maxIndex).toBe(31);
            expect(firstTree.levels[0].nodes.get(1).min).toBe(32);
            expect(firstTree.levels[0].nodes.get(1).minIndex).toBe(32);
            expect(firstTree.levels[0].nodes.get(1).max).toBe(63);
            expect(firstTree.levels[0].nodes.get(1).maxIndex).toBe(63);
            expect(firstTree.levels[0].nodes.get(2).min).toBe(64);
            expect(firstTree.levels[0].nodes.get(2).minIndex).toBe(64);
            expect(firstTree.levels[0].nodes.get(2).max).toBe(64);
            expect(firstTree.levels[0].nodes.get(2).maxIndex).toBe(64);
        });

        it('computes the minmax for a one level tree on multiple elements overwrite', function () {
            var hb = new HistoryBuffer(64);
            for (var i = 0; i < 64 + 32; i++) {
                hb.push(i);
            }

            hb.updateSegmentTrees();
            var firstTree = hb.trees[0].tree;

            expect(firstTree.levels[0].nodes.get(0).min).toBe(32);
            expect(firstTree.levels[0].nodes.get(0).minIndex).toBe(32);
            expect(firstTree.levels[0].nodes.get(0).max).toBe(63);
            expect(firstTree.levels[0].nodes.get(0).maxIndex).toBe(63);
            expect(firstTree.levels[0].nodes.get(1).min).toBe(64);
            expect(firstTree.levels[0].nodes.get(1).minIndex).toBe(64);
            expect(firstTree.levels[0].nodes.get(1).max).toBe(95);
            expect(firstTree.levels[0].nodes.get(1).maxIndex).toBe(95);
        });

        it('recomputes the minmax for a two level tree', function () {
            var hb = new HistoryBuffer(32 * 32 * 2);

            for (var i = 0; i < 2 * 32 * 32; i++) {
                hb.push(i);
            }

            hb.updateSegmentTrees();
            var firstTree = hb.trees[0].tree;

            expect(firstTree.levels.length).toEqual(2);
            expect(firstTree.levels[1].nodes.size).toBe(3);
            expect(firstTree.levels[1].nodes.get(0).min).toBe(0);
            expect(firstTree.levels[1].nodes.get(0).max).toBe(1023);
            expect(firstTree.levels[1].nodes.get(1).min).toBe(1024);
            expect(firstTree.levels[1].nodes.get(1).max).toBe(2047);
        });

        it('recomputes the minmax for a one level tree on the left side of the tree on slide', function () {
            var hb = new HistoryBuffer(64);

            for (var i = 0; i < 64; i++) {
                hb.push(i);
            }

            hb.updateSegmentTrees();

            for (var j = 0; j < 2; j++) {
                hb.push(64 + j);
            }

            hb.updateSegmentTrees();
            var firstTree = hb.trees[0].tree;

            expect(firstTree.levels[0].nodes.get(0).min).toBe(2);
            expect(firstTree.levels[0].nodes.get(0).max).toBe(31);
            expect(firstTree.levels[0].nodes.get(1).min).toBe(32);
            expect(firstTree.levels[0].nodes.get(1).max).toBe(63);
            expect(firstTree.levels[0].nodes.get(2).min).toBe(64);
            expect(firstTree.levels[0].nodes.get(2).max).toBe(65);
        });

        it('recomputes the minmax for a two level tree on the left side of the tree on slide', function () {
            var hb = new HistoryBuffer(32 * 32 * 2);

            for (var i = 0; i < 2 * 32 * 32; i++) {
                hb.push(i);
            }

            hb.updateSegmentTrees();

            for (var j = 0; j < 2; j++) {
                hb.push(2 * 32 * 32 + j);
            }

            hb.updateSegmentTrees();
            var firstTree = hb.trees[0].tree;

            expect(firstTree.levels[1].nodes.get(0).min).toBe(2);
            expect(firstTree.levels[1].nodes.get(0).max).toBe(1023);
            expect(firstTree.levels[1].nodes.get(1).min).toBe(1024);
            expect(firstTree.levels[1].nodes.get(1).max).toBe(2047);
            expect(firstTree.levels[1].nodes.get(2).min).toBe(2048);
            expect(firstTree.levels[1].nodes.get(2).max).toBe(2049);
        });
    });

    /* simple function that decimates data, we check the query results against this function*/
    function decimateRawData(hb, step) {
        var toDataSeries = hb.toDataSeries();
        var decimatedRes = [];

        for (var i = 0; i < toDataSeries.length; i += step) {
            var section = toDataSeries.slice(i, i + step);

            section.sort(function (a, b) {
                return a[1] - b[1];
            }); // sort by data

            section.splice(1, section.length - 2); // remove everything except min and max

            section.sort(function (a, b) {
                return a[0] - b[0];
            }); // sort by index

            decimatedRes = decimatedRes.concat(section);
        }

        return decimatedRes;
    }

    /*makes sure that we get the query results in order*/
    function indexesAreInAscendingOrder(dataSeries) {
        var res = true;
        for (var i = 1; i < dataSeries.length; i++) {
            if (dataSeries[i - 1][0] >= dataSeries[i][0]) {
                res = false;
            }
        }

        return res;
    }
});
