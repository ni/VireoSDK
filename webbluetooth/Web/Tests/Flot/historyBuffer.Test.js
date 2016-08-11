/* global describe, it, expect, jasmine, HistoryBuffer */
/* jshint browser: true*/

/* brackets-xunit: includes=../lib/cbuffer.js,../jquery.flot.historybuffer.js* */

describe('A History Buffer', function () {
    'use strict';

    var oneLevelTreeLength = HistoryBuffer.prototype.getDefaultBranchingFactor();
    var twoLevelsTreeLength = oneLevelTreeLength * HistoryBuffer.prototype.getDefaultBranchingFactor();
    var threeLevelsTreeLength = twoLevelsTreeLength * HistoryBuffer.prototype.getDefaultBranchingFactor();

    it('has a capacity property', function () {
        var hb = new HistoryBuffer(10);

        expect(hb.capacity).toBe(10);
    });

    it('has a setCapacity method', function () {
        var hb = new HistoryBuffer(10);

        hb.setCapacity(20);
        expect(hb.capacity).toBe(20);
    });

    it('setCapacity method clears the data', function () {
        var hb = new HistoryBuffer(10);
        hb.appendArray([1, 2, 3]);

        hb.setCapacity(20);
        expect(hb.count).toBe(0);
    });

    it('has a width property', function () {
        var hb = new HistoryBuffer(10, 3);

        expect(hb.width).toBe(3);
    });

    it('has a setWidth method', function () {
        var hb = new HistoryBuffer(10, 1);

        hb.setWidth(2);
        expect(hb.width).toBe(2);
    });

    it('setWidth method clears the data', function () {
        var hb = new HistoryBuffer(10, 1);
        hb.appendArray([1, 2, 3]);

        hb.setWidth(2);
        expect(hb.count).toBe(0);
    });

    it('has an appendArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        [1, 2, 3, undefined].forEach(function (exp, i) {
            expect(hb.get(i)).toBe(exp);
        });
    });

    it('appendArray method works with arrays bigger that the hb capacity', function () {
        var hb = new HistoryBuffer(3);

        hb.appendArray([1, 2, 3, 4]);

        [2, 3, 4].forEach(function (exp, i) {
            expect(hb.get(i + 1)).toBe(exp);
        });
    });

    it('appendArray method works for plots with two data series', function () {
        var hb = new HistoryBuffer(10, 2);

        hb.appendArray([[1, 1], [2, 2], [3, 3]]);

        [[1, 1], [2, 2], [3, 3], [undefined, undefined]].forEach(function (exp, i) {
            expect(hb.get(i)).toEqual(exp);
        });
    });

    it('has a toArray method', function () {
        var hb = new HistoryBuffer(10);

        hb.appendArray([1, 2, 3]);

        expect(hb.toArray()).toEqual([1, 2, 3]);
    });

    it('toArray method works for plots with two data series', function () {
        var hb = new HistoryBuffer(10, 2);

        hb.appendArray([[1, 2], [2, 3], [3, 4]]);

        expect(hb.toArray()).toEqual([[1, 2], [2, 3], [3, 4]]);
    });

    describe('onChange notification', function () {
        it('has an onChange method', function () {
            var hb = new HistoryBuffer(10, 1);

            expect(hb.onChange).toEqual(jasmine.any(Function));
        });

        it('onChange is called on push', function () {
            var hb = new HistoryBuffer(10);

            var spy = jasmine.createSpy('onChange');

            hb.onChange(spy);
            hb.push(1);
            expect(spy).toHaveBeenCalled();
        });

        it('onChange is called on appendArray', function () {
            var hb = new HistoryBuffer(10);
            var spy = jasmine.createSpy('onChange');

            hb.onChange(spy);
            hb.appendArray([1, 2]);

            expect(spy).toHaveBeenCalled();
        });

        it('onChange is called on setCapacity', function () {
            var hb = new HistoryBuffer(10);
            var spy = jasmine.createSpy('onChange');
            hb.appendArray([1, 2]);

            hb.onChange(spy);
            hb.setCapacity(20);

            expect(spy).toHaveBeenCalled();
        });

        it('onChange is called on setWidth', function () {
            var hb = new HistoryBuffer(10);
            var spy = jasmine.createSpy('onChange');
            hb.appendArray([1, 2]);

            hb.onChange(spy);
            hb.setWidth(2);

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('A segment tree', function () {
        it('is created on hb creation', function () {
            var hb = new HistoryBuffer(128);

            expect(hb.tree).toEqual(jasmine.any(Object));
        });

        it('has multiple segment trees for muliple data series', function () {
            var hb = new HistoryBuffer(128, 2);

            expect(hb.trees[0]).toEqual(jasmine.any(Object));
            expect(hb.trees[1]).toEqual(jasmine.any(Object));
        });

        describe('One level deep', function () {
            it('computes the max and min correctly for tree elements', function () {
                var hb = new HistoryBuffer(10);

                hb.appendArray([1, 2, 3]);

                hb.updateSegmentTrees();

                var firstTree = hb.trees[0].tree;

                expect(firstTree.depth).toEqual(1);
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(1);
                expect(firstTree.levels[0].nodes.size).toBe(2);
                expect(firstTree.levels[0].nodes.get(0).min).toBe(1);
                expect(firstTree.levels[0].nodes.get(0).max).toBe(3);
            });

            it('computes the max and min correctly for tree elements, two data series', function () {
                var hb = new HistoryBuffer(10, 2);

                hb.appendArray([[1, 10], [2, 20], [3, 30]]);

                hb.updateSegmentTrees();
                var firstTree = hb.trees[0].tree;
                var secondTree = hb.trees[1].tree;

                // compare against some precalculated values
                expect(firstTree.depth).toEqual(1);
                expect(secondTree.depth).toEqual(1);
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(secondTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(1);
                expect(secondTree.levels.length).toEqual(1);
                expect(firstTree.levels[0].nodes.size).toBe(2);
                expect(secondTree.levels[0].nodes.size).toBe(2);
                expect(firstTree.levels[0].nodes.get(0).min).toBe(1);
                expect(secondTree.levels[0].nodes.get(0).min).toBe(10);
                expect(firstTree.levels[0].nodes.get(0).max).toBe(3);
                expect(secondTree.levels[0].nodes.get(0).max).toBe(30);
            });

            it('computes the max and min correctly for 64 elements', function () {
                var hb = new HistoryBuffer(64 * 2); //half full history buffer

                for (var i = 0; i < 64; i++) {
                    hb.push(i);
                }

                hb.updateSegmentTrees();
                var firstTree = hb.trees[0].tree;

                // compare against some precalculated values
                expect(firstTree.depth).toEqual(1);
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(1);
                expect(firstTree.levels[0].nodes.size).toBe(5);
                expect(firstTree.levels[0].nodes.get(0).min).toBe(0);
                expect(firstTree.levels[0].nodes.get(0).max).toBe(31);
                expect(firstTree.levels[0].nodes.get(1).min).toBe(32);
                expect(firstTree.levels[0].nodes.get(1).max).toBe(63);
            });
        });

        describe('Two levels deep', function () {
            it('has a proper segment tree with two levels', function () {
                var hb = new HistoryBuffer(twoLevelsTreeLength * 2);

                expect(hb.tree.tree.depth).toEqual(2);
            });

            it('has a proper segment trees with two levels on multiple data series', function () {
                var hb = new HistoryBuffer(twoLevelsTreeLength * 2, 2);

                expect(hb.tree.tree.depth).toEqual(2);
                expect(hb.trees[1].tree.depth).toEqual(2);
            });

            it('computes the max and min correctly for two levels deep trees', function () {
                var hb = new HistoryBuffer(twoLevelsTreeLength * 2);

                for (var i = 0; i < twoLevelsTreeLength * 2; i++) {
                    hb.push(i);
                }

                hb.updateSegmentTrees();
                var firstTree = hb.trees[0].tree;

                // compare against some precalculated values
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(2);
                expect(firstTree.levels[1].nodes.size).toBe(3);
                expect(firstTree.levels[1].nodes.get(0).min).toBe(0);
                expect(firstTree.levels[1].nodes.get(0).max).toBe(1023);
                expect(firstTree.levels[1].nodes.get(1).min).toBe(1024);
                expect(firstTree.levels[1].nodes.get(1).max).toBe(2047);
            });
        });

        describe('Three levels deep', function () {
            it('has a proper segment tree with three levels', function () {
                var hb = new HistoryBuffer(threeLevelsTreeLength * 2);

                expect(hb.tree.tree.depth).toEqual(3);
            });

            it('has a proper segment trees with three levels on multiple data series', function () {
                var hb = new HistoryBuffer(threeLevelsTreeLength * 2, 3);

                expect(hb.tree.tree.depth).toEqual(3);
                expect(hb.trees[1].tree.depth).toEqual(3);
            });

            it('computes the max and min correctly for 65536 elements', function () {
                var hb = new HistoryBuffer(threeLevelsTreeLength * 2);

                for (var i = 0; i < threeLevelsTreeLength * 2; i++) {
                    hb.push(i);
                }

                hb.updateSegmentTrees();
                var firstTree = hb.trees[0].tree;

                // compare against some precalculated values
                expect(firstTree.levels).toEqual(jasmine.any(Array));
                expect(firstTree.levels.length).toEqual(3);
                expect(firstTree.levels[2].nodes.length).toBe(3);
                expect(firstTree.levels[2].nodes.get(0).min).toBe(0);
                expect(firstTree.levels[2].nodes.get(0).max).toBe(32767);
                expect(firstTree.levels[2].nodes.get(1).min).toBe(32768);
                expect(firstTree.levels[2].nodes.get(1).max).toBe(65535);
            });
        });
    });
});
