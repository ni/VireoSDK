/* history buffer data structure for charting.

Copyright (c) 2007-2015 National Instruments
Licensed under the MIT license.
*/
/*globals CBuffer, SegmentTree, module*/

(function (global) {
    'use strict';

    /* The branching factor determines how many samples are decimated in a tree node.
     * It affects the performance and the overhead of the tree.
     */
    var defaultBranchFactor = 32; // 32 for now. TODO tune the branching factor.

    /* Chart History buffer */
    var HistoryBuffer = function (capacity, width) {
        this.capacity = capacity || 1024;
        this.width = width || 1;
        this.lastUpdatedIndex = 0;
        this.firstUpdatedIndex = 0;
        this.branchFactor = defaultBranchFactor;

        this.buffers = []; // circular buffers for data
        this.trees = []; // segment trees

        for (var i = 0; i < this.width; i++) {
            this.buffers.push(new CBuffer(capacity));
            this.trees.push(new SegmentTree(this, this.buffers[i]));
        }

        this.buffer = this.buffers[0];
        this.tree = this.trees[0];

        this.count = 0;
        this.callOnChange = undefined;
        this.changed = false;
    };

    HistoryBuffer.prototype.setBranchingFactor = function (b) {
        this.branchFactor = b;

        this.rebuildSegmentTrees();
    };

    HistoryBuffer.prototype.getDefaultBranchingFactor = function () {
        return defaultBranchFactor;
    };

    HistoryBuffer.prototype.rebuildSegmentTrees = function () {
        this.trees = []; // new segment trees

        for (var i = 0; i < this.width; i++) {
            this.trees.push(new SegmentTree(this, this.buffers[i]));
        }

        this.tree = this.trees[0];

        this.firstUpdatedIndex = this.startIndex();
        this.lastUpdatedIndex = this.firstUpdatedIndex;

        this.updateSegmentTrees();
    };

    /* clear the history buffer */
    HistoryBuffer.prototype.clear = function () {
        for (var i = 0; i < this.width; i++) {
            this.buffers[i].empty();
        }

        this.count = 0; // todo fire changes and upate lastindex, startindex
        this.rebuildSegmentTrees();
        this.changed = true;
        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    /* change the capacity of the History Buffer and clean all the data inside it */
    HistoryBuffer.prototype.setCapacity = function (newCapacity) {
        if (newCapacity !== this.capacity) {
            this.capacity = newCapacity;
            this.buffers = []; // circular buffers for data

            for (var i = 0; i < this.width; i++) {
                this.buffers.push(new CBuffer(newCapacity));
            }

            this.buffer = this.buffers[0];
            this.count = 0; // todo fire changes and upate lastindex, startindex
            this.rebuildSegmentTrees();
            this.changed = true;
            if (this.callOnChange) {
                this.callOnChange();
            }
        }
    };

    /* change the width of the History Buffer and clean all the data inside it */
    HistoryBuffer.prototype.setWidth = function (newWidth) {
        if (newWidth !== this.width) {
            this.width = newWidth;
            this.buffers = []; // clear the circular buffers for data. TODO reuse the buffers

            for (var i = 0; i < this.width; i++) {
                this.buffers.push(new CBuffer(this.capacity));
            }

            this.buffer = this.buffers[0];
            this.count = 0; // todo fire changes and upate lastindex, startindex
            this.rebuildSegmentTrees();
            this.changed = true;
            if (this.callOnChange) {
                this.callOnChange();
            }
        }
    };

    /* store an element in the history buffer, don't update stats */
    HistoryBuffer.prototype.pushNoStatsUpdate = function (item) {
        if (this.width === 1) {
            this.buffer.push(item);
        } else {
            if (Array.isArray(item) && item.length === this.width) {
                for (var i = 0; i < this.width; i++) {
                    this.buffers[i].push(item[i]);
                }
            }
        }
    };

    /* store an element in the history buffer */
    HistoryBuffer.prototype.push = function (item) {
        this.pushNoStatsUpdate(item);
        this.count++;

        this.changed = true;
        if (this.callOnChange) {
            this.callOnChange();
        }

    };

    /* the index of the oldest element in the buffer*/
    HistoryBuffer.prototype.startIndex = function () {
        return Math.max(0, this.count - this.capacity);
    };

    /* the index of the newest element in the buffer*/
    HistoryBuffer.prototype.lastIndex = function () {
        return this.startIndex() + this.buffer.size;
    };

    /*get the nth element in the buffer*/
    HistoryBuffer.prototype.get = function (index) {
        index -= this.startIndex();
        if (this.width === 1) {
            return this.buffer.get(index);
        } else {
            var res = [];

            for (var i = 0; i < this.width; i++) {
                res.push(this.buffers[i].get(index));
            }

            return res;
        }
    };

    /* append an array of elements to the buffer*/
    HistoryBuffer.prototype.appendArray = function (arr) {
        for (var i = 0; i < arr.length; i++) {
            this.pushNoStatsUpdate(arr[i]);
        }

        this.count += arr.length;

        this.changed = true;
        if (this.callOnChange) {
            this.callOnChange();
        }
    };

    /* get the tree nodes at the specified level that keeps the information for the specified interval*/
    HistoryBuffer.prototype.getTreeNodes = function (level, start, end) {
        var nodes = [];
        var treeLevel = this.tree.levels[level];
        var levelStep = treeLevel.step;

        var levelIndex = Math.floor((start - treeLevel.startIndex) / levelStep);

        if ((levelIndex < 0) || (levelIndex >= treeLevel.capacity) || levelIndex > end) {
            return nodes;
        }

        while (levelIndex < end) {
            if (levelIndex >= start) {
                nodes.push(treeLevel.nodes.get(levelIndex));
            }

            levelIndex += treeLevel.step;
        }

        return nodes;
    };

    /* returns an array with all the elements in the buffer*/
    HistoryBuffer.prototype.toArray = function () {
        if (this.width === 1) {
            return this.buffer.toArray();
        } else {
            var start = this.startIndex(),
                last = this.lastIndex(),
                res = [];
            for (var i = start; i < last; i++) {
                res.push(this.get(i));
            }

            return res;
        }
    };

    /* update the segment tree with the newly added values*/
    HistoryBuffer.prototype.updateSegmentTrees = function () {
        var buffer = this.buffer;

        this.trees.forEach(function (tree) {
            tree.updateSegmentTree();
        });

        this.firstUpdatedIndex = this.startIndex();
        this.lastUpdatedIndex = this.firstUpdatedIndex + buffer.size;
    };

    HistoryBuffer.prototype.toDataSeries = function (index) {
        var buffer = this.buffer;

        var data = [];

        var start = this.startIndex();

        for (var i = 0; i < buffer.size; i++) {
            data.push([i + start, this.buffers[index || 0].get(i)]);
        }

        return data;
    };

    HistoryBuffer.prototype.onChange = function (f) {
        this.callOnChange = f;
    };

    /* get a decimated series, starting at the start sample, ending at the end sample with a provided step */
    HistoryBuffer.prototype.query = function (start, end, step, index) {
        if (index === undefined) {
            index = 0;
        }

        if (this.changed) {
            this.updateSegmentTrees();
            this.changed = false;
        }

        return this.trees[index].query(start, end, step);
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = HistoryBuffer;
    } else {
        global.HistoryBuffer = HistoryBuffer;
    }
})(this);
